// ============================================================================
// csr-decoder / compute.ts
// ----------------------------------------------------------------------------
// Deterministic decoder for a PKCS#10 Certificate Signing Request (RFC 2986).
//
// A CSR is the object you hand to a Certificate Authority when you ask it to
// issue a certificate. It is NOT a certificate: it has no serial number, no
// issuer, and no validity window. It carries only what the requester is
// *asking for* - a subject name, a public key, and (optionally) a set of
// requested extensions such as Subject Alternative Names - all self-signed
// with the matching private key to prove the requester holds it.
//
// This module is pure and self-contained:
//   * no clock, no randomness, no network, no environment access (D-49);
//   * the same input always yields the same output (golden-vector tested);
//   * it DECODES structure only - it never verifies the signature
//     cryptographically (that is a separate concern and needs the key math).
//
// The ASN.1/DER machinery here mirrors the x509 tool's parser. CSRs and
// certificates share their Name, SubjectPublicKeyInfo, AlgorithmIdentifier and
// Extension encodings, so the primitives are deliberately the same shape.
// Tools are self-contained (no shared runtime dependency), so the logic is
// replicated rather than imported.
//
//   CertificationRequest ::= SEQUENCE {
//       certificationRequestInfo CertificationRequestInfo,
//       signatureAlgorithm       AlgorithmIdentifier,
//       signature                BIT STRING }
//
//   CertificationRequestInfo ::= SEQUENCE {
//       version       INTEGER { v1(0) },
//       subject       Name,
//       subjectPKInfo SubjectPublicKeyInfo,
//       attributes    [0] IMPLICIT SET OF Attribute }
// ============================================================================

// ----------------------------------------------------------------------------
// Public result shapes
// ----------------------------------------------------------------------------

/** One Distinguished Name attribute, e.g. { type: "CN", oid: "2.5.4.3", value: "example.com" }. */
export interface DnAttribute {
  /** Short label (CN, O, OU, C, ST, L, ...) or the raw OID if unknown. */
  type: string;
  /** The dotted-decimal OID. */
  oid: string;
  /** The decoded string value. */
  value: string;
}

/** A parsed Distinguished Name: the individual attributes plus an RFC 4514 string. */
export interface DistinguishedName {
  attributes: DnAttribute[];
  /** RFC 4514 rendering, most-specific component first (CN=..., O=..., C=...). */
  text: string;
}

/** Information about the public key being certified. */
export interface PublicKeyInfo {
  /** Human algorithm name (RSA, EC, Ed25519, ...) or the OID if unknown. */
  algorithm: string;
  /** The algorithm OID. */
  oid: string;
  /** RSA modulus size in bits, when the key is RSA. */
  keySizeBits?: number;
  /** RSA public exponent, when the key is RSA. */
  exponent?: number;
  /** Named curve (P-256, P-384, ...) when the key is EC. */
  curve?: string;
}

/** One Subject Alternative Name entry. */
export interface SanEntry {
  /** DNS, IP, email, URI, DirName, or other. */
  type: string;
  value: string;
}

/** Extensions the requester is asking the CA to include (from the extensionRequest attribute). */
export interface RequestedExtensions {
  /** Requested Subject Alternative Names - the operationally important part of most CSRs. */
  subjectAltName?: SanEntry[];
  /** Requested key-usage purposes. */
  keyUsage?: string[];
  /** Requested extended key-usage purposes. */
  extendedKeyUsage?: string[];
  /** Requested basic constraints (CA flag and optional path length). */
  basicConstraints?: { ca: boolean; pathLen?: number };
  /** Any other requested extension we recognize the OID of but only summarize. */
  other: { oid: string; name: string; critical: boolean }[];
}

/** A CSR attribute we surface but do not expand into a dedicated field. */
export interface CsrAttribute {
  oid: string;
  name: string;
  valueSummary: string;
}

/** The full decoded CSR. */
export interface DecodedCsr {
  /** Raw PKCS#10 version integer. 0 means v1 (the only defined version). */
  version: number;
  /** The subject name being requested. */
  subject: DistinguishedName;
  /** The public key that will be certified. */
  publicKey: PublicKeyInfo;
  /** Requested extensions, decoded from the extensionRequest attribute. */
  requested: RequestedExtensions;
  /** True when an extensionRequest attribute was present. */
  hasExtensionRequest: boolean;
  /** Legacy challenge password attribute, if present. */
  challengePassword?: string;
  /** Legacy unstructured name attribute, if present. */
  unstructuredName?: string;
  /** Other attributes recognized by OID but not expanded. */
  otherAttributes: CsrAttribute[];
  /** Signature algorithm name (e.g. sha256WithRSAEncryption). */
  signatureAlgorithm: string;
  /** Signature algorithm OID. */
  signatureAlgorithmOid: string;
  /** The self-signature bytes, colon-grouped upper-case hex. */
  signatureHex: string;
  /** Signature length in bits. */
  signatureBits: number;
  /** Total DER length in bytes. */
  derLength: number;
}

/** Stable error codes so the UI can map to a localized message. */
export type CsrDecodeErrorCode = "empty" | "format" | "der" | "structure";

/** Error thrown for any malformed input. Carries a stable `code`. */
export class CsrDecodeError extends Error {
  code: CsrDecodeErrorCode;
  constructor(code: CsrDecodeErrorCode) {
    super(code);
    this.name = "CsrDecodeError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// OID dictionaries (unknown OIDs fall back to the dotted form)
// ----------------------------------------------------------------------------

const OID_DN: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.4": "SN",
  "2.5.4.5": "serialNumber",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.9": "street",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.12": "title",
  "2.5.4.42": "GN",
  "2.5.4.15": "businessCategory",
  "2.5.4.17": "postalCode",
  "1.2.840.113549.1.9.1": "emailAddress",
  "0.9.2342.19200300.100.1.25": "DC",
  "0.9.2342.19200300.100.1.1": "UID",
  "1.3.6.1.4.1.311.60.2.1.3": "jurisdictionC",
};

const OID_SIG: Record<string, string> = {
  "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
  "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
  "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
  "1.2.840.113549.1.1.10": "RSASSA-PSS",
  "1.2.840.10045.4.1": "ecdsa-with-SHA1",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
  "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
  "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
};

const OID_KEY: Record<string, string> = {
  "1.2.840.113549.1.1.1": "RSA",
  "1.2.840.10045.2.1": "EC",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
};

const OID_CURVE: Record<string, string> = {
  "1.2.840.10045.3.1.7": "P-256",
  "1.3.132.0.34": "P-384",
  "1.3.132.0.35": "P-521",
  "1.3.132.0.10": "secp256k1",
};

const OID_EXT: Record<string, string> = {
  "2.5.29.14": "subjectKeyIdentifier",
  "2.5.29.15": "keyUsage",
  "2.5.29.17": "subjectAltName",
  "2.5.29.19": "basicConstraints",
  "2.5.29.37": "extKeyUsage",
};

const OID_EKU: Record<string, string> = {
  "1.3.6.1.5.5.7.3.1": "serverAuth",
  "1.3.6.1.5.5.7.3.2": "clientAuth",
  "1.3.6.1.5.5.7.3.3": "codeSigning",
  "1.3.6.1.5.5.7.3.4": "emailProtection",
  "1.3.6.1.5.5.7.3.8": "timeStamping",
  "1.3.6.1.5.5.7.3.9": "OCSPSigning",
  "2.5.29.37.0": "anyExtendedKeyUsage",
};

// CSR attribute OIDs (PKCS#9, RFC 2985).
const OID_EXTENSION_REQUEST = "1.2.840.113549.1.9.14";
const OID_CHALLENGE_PASSWORD = "1.2.840.113549.1.9.7";
const OID_UNSTRUCTURED_NAME = "1.2.840.113549.1.9.2";

const OID_ATTR_NAMES: Record<string, string> = {
  [OID_EXTENSION_REQUEST]: "extensionRequest",
  [OID_CHALLENGE_PASSWORD]: "challengePassword",
  [OID_UNSTRUCTURED_NAME]: "unstructuredName",
  "1.3.6.1.4.1.311.13.2.3": "OS Version (Microsoft)",
  "1.3.6.1.4.1.311.13.2.2": "Enrollment CSP (Microsoft)",
  "1.3.6.1.4.1.311.21.20": "Client Information (Microsoft)",
};

// RFC 5280 4.2.1.3 KeyUsage bit order (bit 0 is the most significant bit).
const KEY_USAGE_BITS = [
  "digitalSignature",
  "nonRepudiation",
  "keyEncipherment",
  "dataEncipherment",
  "keyAgreement",
  "keyCertSign",
  "cRLSign",
  "encipherOnly",
  "decipherOnly",
];

// ----------------------------------------------------------------------------
// Minimal DER (ASN.1) parser
// ----------------------------------------------------------------------------

/** A parsed ASN.1 TLV node. Constructed nodes carry their children. */
interface Asn1Node {
  tag: number;
  tagClass: number; // 0 universal, 1 application, 2 context-specific, 3 private
  constructed: boolean;
  tagNumber: number;
  length: number;
  contentStart: number;
  contentEnd: number;
  content: Uint8Array; // a view, not a copy
  children: Asn1Node[];
}

const MAX_DEPTH = 40;

/** Parse one TLV at `offset`. Throws CsrDecodeError("der") on any overrun. */
function parseTlv(buf: Uint8Array, offset: number, depth: number): Asn1Node {
  if (depth > MAX_DEPTH) throw new CsrDecodeError("der");
  if (offset + 2 > buf.length) throw new CsrDecodeError("der");

  const tag = buf[offset];
  const tagClass = (tag & 0xc0) >> 6;
  const constructed = (tag & 0x20) !== 0;
  let tagNumber = tag & 0x1f;

  let p = offset + 1;
  // High-tag-number form (rare) - read the multi-byte tag number.
  if (tagNumber === 0x1f) {
    tagNumber = 0;
    let b: number;
    do {
      if (p >= buf.length) throw new CsrDecodeError("der");
      b = buf[p++];
      tagNumber = (tagNumber << 7) | (b & 0x7f);
    } while (b & 0x80);
  }

  // Length: short form (< 0x80) or long form (0x80 | number-of-length-bytes).
  if (p >= buf.length) throw new CsrDecodeError("der");
  let length = buf[p++];
  if (length & 0x80) {
    const numBytes = length & 0x7f;
    if (numBytes === 0 || numBytes > 4) throw new CsrDecodeError("der"); // no indefinite length in DER
    if (p + numBytes > buf.length) throw new CsrDecodeError("der");
    length = 0;
    for (let i = 0; i < numBytes; i++) length = length * 256 + buf[p++];
  }

  const contentStart = p;
  const contentEnd = contentStart + length;
  if (contentEnd > buf.length) throw new CsrDecodeError("der");
  const content = buf.subarray(contentStart, contentEnd);

  const node: Asn1Node = {
    tag,
    tagClass,
    constructed,
    tagNumber,
    length,
    contentStart,
    contentEnd,
    content,
    children: [],
  };

  if (constructed) {
    let cp = contentStart;
    while (cp < contentEnd) {
      const child = parseTlv(buf, cp, depth + 1);
      node.children.push(child);
      cp = child.contentEnd;
    }
  }
  return node;
}

/** Parse the whole buffer as a single top-level TLV (the CertificationRequest SEQUENCE). */
function parseDer(buf: Uint8Array): Asn1Node {
  return parseTlv(buf, 0, 0);
}

// ----------------------------------------------------------------------------
// Byte / OID / string helpers
// ----------------------------------------------------------------------------

function bytesToHex(bytes: Uint8Array, separator = ""): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0").toUpperCase();
    if (separator && i < bytes.length - 1) out += separator;
  }
  return out;
}

/** Decode an OBJECT IDENTIFIER's content bytes to its dotted-decimal form. */
function decodeOid(content: Uint8Array): string {
  if (content.length === 0) return "";
  const parts: number[] = [];
  const first = content[0];
  parts.push(Math.floor(first / 40));
  parts.push(first % 40);
  let value = 0;
  for (let i = 1; i < content.length; i++) {
    const b = content[i];
    value = value * 128 + (b & 0x7f);
    if ((b & 0x80) === 0) {
      parts.push(value);
      value = 0;
    }
  }
  return parts.join(".");
}

/** Decode a directory-string value node to a JS string (common string types). */
function decodeString(node: Asn1Node): string {
  // BMPString (UCS-2 / UTF-16BE).
  if (node.tagNumber === 0x1e) {
    let s = "";
    for (let i = 0; i + 1 < node.content.length; i += 2) {
      s += String.fromCharCode((node.content[i] << 8) | node.content[i + 1]);
    }
    return s;
  }
  // UTF8String / PrintableString / IA5String / T61String etc. - UTF-8 covers
  // the ASCII subsets these use in practice.
  return new TextDecoder("utf-8").decode(node.content);
}

/** Parse an X.509 Name (SEQUENCE OF RDN) into a structured DN. */
function parseName(nameNode: Asn1Node): DistinguishedName {
  const attributes: DnAttribute[] = [];
  // Name ::= SEQUENCE OF RelativeDistinguishedName (a SET OF AttributeTypeAndValue)
  for (const rdn of nameNode.children) {
    for (const atv of rdn.children) {
      // AttributeTypeAndValue ::= SEQUENCE { type OID, value ANY }
      if (atv.children.length < 2) continue;
      const oid = decodeOid(atv.children[0].content);
      const value = decodeString(atv.children[1]);
      attributes.push({ type: OID_DN[oid] ?? oid, oid, value });
    }
  }
  // RFC 4514 renders most-specific first; ASN.1 lists least-specific first.
  const text = attributes
    .slice()
    .reverse()
    .map((a) => `${a.type}=${a.value}`)
    .join(", ");
  return { attributes, text };
}

/** Parse SubjectPublicKeyInfo ::= SEQUENCE { algorithm AlgId, key BIT STRING }. */
function parsePublicKey(spki: Asn1Node): PublicKeyInfo {
  const algId = spki.children[0];
  const algOid = decodeOid(algId.children[0].content);
  const name = OID_KEY[algOid] ?? algOid;
  const info: PublicKeyInfo = { algorithm: name, oid: algOid };

  if (name === "RSA") {
    // The BIT STRING wraps RSAPublicKey ::= SEQUENCE { modulus, exponent }.
    const bitString = spki.children[1];
    const inner = bitString.content.subarray(1); // first byte = unused-bit count (0)
    try {
      const rsaSeq = parseTlv(inner, 0, 0);
      const modulus = rsaSeq.children[0];
      const exponent = rsaSeq.children[1];
      let mod = modulus.content;
      if (mod.length > 1 && mod[0] === 0x00) mod = mod.subarray(1); // drop sign byte
      info.keySizeBits = mod.length * 8;
      let exp = 0;
      for (let i = 0; i < exponent.content.length; i++) exp = exp * 256 + exponent.content[i];
      info.exponent = exp;
    } catch {
      // leave size/exponent undefined on a malformed key payload
    }
  } else if (name === "EC") {
    // The named curve is the AlgorithmIdentifier parameter (an OID).
    if (algId.children.length > 1 && algId.children[1].tagNumber === 0x06) {
      const curveOid = decodeOid(algId.children[1].content);
      info.curve = OID_CURVE[curveOid] ?? curveOid;
    }
  }
  return info;
}

/** Decode a GeneralNames (subjectAltName) value into typed entries. */
function parseSan(seq: Asn1Node): SanEntry[] {
  const out: SanEntry[] = [];
  for (const gn of seq.children) {
    // GeneralName is a context-specific CHOICE; the tag number selects the type.
    switch (gn.tagNumber) {
      case 1: // rfc822Name (email)
        out.push({ type: "email", value: new TextDecoder().decode(gn.content) });
        break;
      case 2: // dNSName
        out.push({ type: "DNS", value: new TextDecoder().decode(gn.content) });
        break;
      case 6: // uniformResourceIdentifier
        out.push({ type: "URI", value: new TextDecoder().decode(gn.content) });
        break;
      case 7: {
        // iPAddress: 4 bytes => IPv4, 16 bytes => IPv6.
        const b = gn.content;
        if (b.length === 4) {
          out.push({ type: "IP", value: `${b[0]}.${b[1]}.${b[2]}.${b[3]}` });
        } else if (b.length === 16) {
          const groups: string[] = [];
          for (let i = 0; i < 16; i += 2) groups.push(((b[i] << 8) | b[i + 1]).toString(16));
          out.push({ type: "IP", value: groups.join(":") });
        }
        break;
      }
      case 4: // directoryName
        out.push({ type: "DirName", value: parseName(gn.children[0] ?? gn).text });
        break;
      default:
        out.push({ type: "other", value: `[${gn.tagNumber}]` });
    }
  }
  return out;
}

/**
 * Decode the value of an extensionRequest attribute, which is itself a
 * SEQUENCE OF Extension (the very same structure a certificate carries).
 * We surface the requests that matter for a CSR and collect the rest by OID.
 */
function parseRequestedExtensions(extSeq: Asn1Node): RequestedExtensions {
  const req: RequestedExtensions = { other: [] };
  for (const e of extSeq.children) {
    // Extension ::= SEQUENCE { extnID OID, critical BOOLEAN DEFAULT FALSE, extnValue OCTET STRING }
    if (!e.children.length) continue;
    const oid = decodeOid(e.children[0].content);
    let critical = false;
    let valueNode = e.children[1];
    if (valueNode && valueNode.tagNumber === 0x01) {
      critical = valueNode.content.length > 0 && valueNode.content[0] !== 0x00;
      valueNode = e.children[2];
    }
    if (!valueNode) continue;
    const name = OID_EXT[oid] ?? oid;

    let inner: Asn1Node | null = null;
    try {
      inner = parseTlv(valueNode.content, 0, 0); // OCTET STRING wraps the real value
    } catch {
      inner = null;
    }

    if (oid === "2.5.29.17" && inner) {
      // subjectAltName: GeneralNames.
      req.subjectAltName = parseSan(inner);
    } else if (oid === "2.5.29.15" && inner) {
      // keyUsage: a BIT STRING. content[0] = unused bits, then the usage bits.
      const usages: string[] = [];
      const bits = inner.content.subarray(1);
      let bitIndex = 0;
      for (let byte = 0; byte < bits.length; byte++) {
        for (let i = 7; i >= 0; i--) {
          if (bits[byte] & (1 << i)) {
            if (bitIndex < KEY_USAGE_BITS.length) usages.push(KEY_USAGE_BITS[bitIndex]);
          }
          bitIndex++;
        }
      }
      req.keyUsage = usages;
    } else if (oid === "2.5.29.37" && inner) {
      // extKeyUsage: SEQUENCE OF OID.
      req.extendedKeyUsage = inner.children.map(
        (c) => OID_EKU[decodeOid(c.content)] ?? decodeOid(c.content),
      );
    } else if (oid === "2.5.29.19") {
      // basicConstraints: SEQUENCE { cA BOOLEAN DEFAULT FALSE, pathLen INTEGER OPTIONAL }.
      let ca = false;
      let pathLen: number | undefined;
      if (inner) {
        for (const c of inner.children) {
          if (c.tagNumber === 0x01) ca = c.content.length > 0 && c.content[0] !== 0x00;
          else if (c.tagNumber === 0x02) {
            let v = 0;
            for (let i = 0; i < c.content.length; i++) v = v * 256 + c.content[i];
            pathLen = v;
          }
        }
      }
      req.basicConstraints = { ca, pathLen };
    } else {
      req.other.push({ oid, name, critical });
    }
  }
  return req;
}

// ----------------------------------------------------------------------------
// Input normalization (PEM / base64 / hex -> DER bytes)
// ----------------------------------------------------------------------------

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[\s:]/g, "");
  if (clean.length % 2 !== 0) throw new CsrDecodeError("format");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(clean.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) throw new CsrDecodeError("format");
    bytes[i] = byte;
  }
  return bytes;
}

/**
 * Accept a CSR as PEM (with the CERTIFICATE REQUEST or NEW CERTIFICATE REQUEST
 * armor), bare base64 (DER without armor), or hex.
 */
function toDerBytes(input: string): Uint8Array {
  const text = input.trim();
  if (!text) throw new CsrDecodeError("empty");

  // PEM: extract the base64 between the request armor lines. Both the classic
  // "NEW CERTIFICATE REQUEST" and the modern "CERTIFICATE REQUEST" are accepted.
  const pem =
    /-----BEGIN (?:NEW )?CERTIFICATE REQUEST-----([\s\S]*?)-----END (?:NEW )?CERTIFICATE REQUEST-----/.exec(
      text,
    );
  if (pem) {
    try {
      return base64ToBytes(pem[1].replace(/[^A-Za-z0-9+/=]/g, ""));
    } catch {
      throw new CsrDecodeError("format");
    }
  }

  // Hex (an even run of hex digits, possibly colon/space separated).
  if (/^[0-9a-fA-F\s:]+$/.test(text) && /[0-9a-fA-F]/.test(text)) {
    return hexToBytes(text);
  }

  // Bare base64 (DER base64-encoded without the PEM armor).
  if (/^[A-Za-z0-9+/=\s]+$/.test(text)) {
    try {
      return base64ToBytes(text.replace(/\s/g, ""));
    } catch {
      throw new CsrDecodeError("format");
    }
  }

  throw new CsrDecodeError("format");
}

// ----------------------------------------------------------------------------
// The orchestrator
// ----------------------------------------------------------------------------

/**
 * decodeCsr - the deterministic entry point.
 * @param input a CSR as PEM, bare base64, or hex
 * @returns the decoded structure
 * @throws {CsrDecodeError} with a stable code on any malformed input
 */
export function decodeCsr(input: string): DecodedCsr {
  const der = toDerBytes(input);

  let req: Asn1Node;
  try {
    req = parseDer(der);
  } catch {
    throw new CsrDecodeError("der");
  }

  try {
    // CertificationRequest ::= SEQUENCE { cri, signatureAlgorithm, signature }
    if (req.children.length < 3) throw new CsrDecodeError("structure");
    const cri = req.children[0];
    const sigAlg = req.children[1];
    const sigBitString = req.children[2];

    // CertificationRequestInfo ::= SEQUENCE { version, subject, SPKI, [0] attributes }
    if (cri.children.length < 3) throw new CsrDecodeError("structure");
    const versionNode = cri.children[0];
    const subjectNode = cri.children[1];
    const spkiNode = cri.children[2];
    const attrsNode = cri.children[3]; // [0] IMPLICIT SET OF Attribute (may be empty/absent)

    // Version is a small INTEGER; v1 is encoded as 0.
    let version = 0;
    for (let i = 0; i < versionNode.content.length; i++) {
      version = version * 256 + versionNode.content[i];
    }

    const subject = parseName(subjectNode);
    const publicKey = parsePublicKey(spkiNode);

    // Walk the attributes. Each is Attribute ::= SEQUENCE { type OID, values SET OF ANY }.
    const requested: RequestedExtensions = { other: [] };
    let hasExtensionRequest = false;
    let challengePassword: string | undefined;
    let unstructuredName: string | undefined;
    const otherAttributes: CsrAttribute[] = [];

    if (attrsNode && attrsNode.tagClass === 2 && attrsNode.tagNumber === 0) {
      for (const attr of attrsNode.children) {
        if (attr.children.length < 2) continue;
        const oid = decodeOid(attr.children[0].content);
        const valuesSet = attr.children[1]; // SET OF value
        const firstValue = valuesSet.children[0];

        if (oid === OID_EXTENSION_REQUEST && firstValue) {
          // The single SET value is Extensions ::= SEQUENCE OF Extension.
          hasExtensionRequest = true;
          const parsed = parseRequestedExtensions(firstValue);
          requested.subjectAltName = parsed.subjectAltName;
          requested.keyUsage = parsed.keyUsage;
          requested.extendedKeyUsage = parsed.extendedKeyUsage;
          requested.basicConstraints = parsed.basicConstraints;
          requested.other = parsed.other;
        } else if (oid === OID_CHALLENGE_PASSWORD && firstValue) {
          challengePassword = decodeString(firstValue);
        } else if (oid === OID_UNSTRUCTURED_NAME && firstValue) {
          unstructuredName = decodeString(firstValue);
        } else {
          const count = valuesSet.children.length;
          otherAttributes.push({
            oid,
            name: OID_ATTR_NAMES[oid] ?? oid,
            valueSummary: count === 1 ? "1 value" : `${count} values`,
          });
        }
      }
    }

    // Signature: BIT STRING. content[0] = unused-bit count, then the signature bytes.
    const sigBytes = sigBitString.content.subarray(1);
    const sigOid = decodeOid(sigAlg.children[0].content);

    return {
      version,
      subject,
      publicKey,
      requested,
      hasExtensionRequest,
      challengePassword,
      unstructuredName,
      otherAttributes,
      signatureAlgorithm: OID_SIG[sigOid] ?? sigOid,
      signatureAlgorithmOid: sigOid,
      signatureHex: bytesToHex(sigBytes, ":"),
      signatureBits: sigBytes.length * 8,
      derLength: der.length,
    };
  } catch (e) {
    if (e instanceof CsrDecodeError) throw e;
    throw new CsrDecodeError("structure");
  }
}

// ----------------------------------------------------------------------------
// Tool entry point
// ----------------------------------------------------------------------------

/** Input to {@link run}. */
export interface CsrInput {
  input: string;
}

/**
 * run - the uniform tool wrapper used by the component and the API.
 * @param args the raw CSR text
 * @returns the decoded CSR
 * @throws {CsrDecodeError} on malformed input
 */
export function run(args: CsrInput): DecodedCsr {
  return decodeCsr(args.input);
}
