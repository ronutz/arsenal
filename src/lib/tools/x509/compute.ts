// ============================================================================
// src/lib/tools/x509/compute.ts
// ----------------------------------------------------------------------------
// X.509 CERTIFICATE DECODE - the pure compute core for the X.509 tool.
//
// netcore tool contract: a tool is a {manifest, run, vectors} triple and `run`
// must be DETERMINISTIC so its golden vectors are stable. This file is that
// deterministic core: it accepts a PEM, base64, or hex certificate, parses the
// DER (ASN.1) by hand, and walks the RFC 5280 TBSCertificate structure into a
// flat, render-ready object (subject, issuer, validity, public key, the common
// v3 extensions, signature algorithm).
//
// It does NOT compute time-relative status ("expired right now?") - that is
// clock-dependent and would break golden vectors, so the component layers it on
// top. It also does NOT compute fingerprints: a fingerprint is a hash of the DER
// bytes, which needs Web Crypto (async); the component computes those live from
// the `der` bytes exposed here, exactly as the JWT tool verifies signatures in
// the component. No external library is used - same hand-rolled posture as the
// rest of the toolbox ("tools that compute, never guess").
//
// Runs identically in the browser and in Node: `atob`, `TextDecoder`, and
// typed arrays are global in both, so the same module powers the UI today and
// can be promoted into @ronutz/netcore unchanged.
// ============================================================================

// ----------------------------------------------------------------------------
// Result shape
// ----------------------------------------------------------------------------

/** One RDN attribute, e.g. { type: "CN", oid: "2.5.4.3", value: "example.com" }. */
export interface DnAttribute {
  /** Short label (CN, O, OU, C, ST, L, ...) or the raw OID if unknown. */
  type: string;
  /** The attribute's object identifier, dotted. */
  oid: string;
  /** The decoded string value. */
  value: string;
}

/** A Distinguished Name: its attributes plus an RFC 4514-ish one-line form. */
export interface DistinguishedName {
  attributes: DnAttribute[];
  /** Single-line rendering, most-specific first (e.g. "CN=ex, O=Org, C=US"). */
  text: string;
}

/** notBefore / notAfter as ISO-8601 UTC strings (deterministic, clock-free). */
export interface CertValidity {
  notBefore: string;
  notAfter: string;
}

/** The subject public key: algorithm plus size (RSA) or curve (EC). */
export interface PublicKeyInfo {
  /** Human algorithm name (RSA, ECDSA / EC, Ed25519, ...) or the OID. */
  algorithm: string;
  oid: string;
  /** RSA modulus size in bits, when the key is RSA. */
  keySizeBits?: number;
  /** RSA public exponent, when the key is RSA. */
  exponent?: number;
  /** Named curve (P-256, P-384, ...), when the key is EC. */
  curve?: string;
}

/** A subjectAltName entry. */
export interface SanEntry {
  type: "DNS" | "IP" | "email" | "URI" | "DirName" | "other";
  value: string;
}

/** basicConstraints, decoded. */
export interface BasicConstraints {
  ca: boolean;
  pathLen?: number;
}

/** The structured, known v3 extensions plus a list of any unrecognized ones. */
export interface CertExtensions {
  keyUsage?: { critical: boolean; usages: string[] };
  extendedKeyUsage?: { critical: boolean; purposes: string[] };
  basicConstraints?: { critical: boolean } & BasicConstraints;
  subjectAltName?: { critical: boolean; entries: SanEntry[] };
  subjectKeyId?: { critical: boolean; keyId: string };
  authorityKeyId?: { critical: boolean; keyId: string };
  /** Extensions we recognize the OID of but only summarize. */
  other: { oid: string; name: string; critical: boolean }[];
}

/** The deterministic result of decoding an X.509 certificate. */
export interface DecodedCertificate {
  /** X.509 version as a human number: 1, 2, or 3. */
  version: number;
  /** Serial number as upper-case hex, colon-grouped (e.g. "1A:2B:..."). */
  serialNumberHex: string;
  /** Issuer distinguished name. */
  issuer: DistinguishedName;
  /** Subject distinguished name. */
  subject: DistinguishedName;
  /** Validity window. */
  validity: CertValidity;
  /** Subject public key info. */
  publicKey: PublicKeyInfo;
  /** Signature algorithm (from the outer AlgorithmIdentifier), name. */
  signatureAlgorithm: string;
  signatureAlgorithmOid: string;
  /** Decoded v3 extensions. */
  extensions: CertExtensions;
  /** True when issuer == subject (self-issued; may be a self-signed root). */
  selfIssued: boolean;
  /** The certificate's DER bytes - the component hashes these for fingerprints. */
  der: Uint8Array;
}

/** Distinct decode failure reasons. The component localizes these codes. */
export type X509DecodeErrorCode = "empty" | "format" | "der" | "structure";

/** A decode error carrying a stable, machine-checkable code. */
export class X509DecodeError extends Error {
  code: X509DecodeErrorCode;
  constructor(code: X509DecodeErrorCode) {
    super(code);
    this.name = "X509DecodeError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// OID dictionaries (the names we surface; unknown OIDs fall back to the dotted form)
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
  "2.5.29.18": "issuerAltName",
  "2.5.29.19": "basicConstraints",
  "2.5.29.31": "cRLDistributionPoints",
  "2.5.29.32": "certificatePolicies",
  "2.5.29.35": "authorityKeyIdentifier",
  "2.5.29.37": "extKeyUsage",
  "1.3.6.1.5.5.7.1.1": "authorityInfoAccess",
  "1.3.6.1.4.1.11129.2.4.2": "signedCertificateTimestampList",
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
  /** Full first (identifier) byte. */
  tag: number;
  /** 0 universal, 1 application, 2 context-specific, 3 private. */
  tagClass: number;
  /** True for SEQUENCE / SET / [n] constructed. */
  constructed: boolean;
  /** Tag number (universal type id, or context tag number). */
  tagNumber: number;
  /** Content length in bytes. */
  length: number;
  /** Offset of the first content byte within the source buffer. */
  contentStart: number;
  /** Offset just past the content. */
  contentEnd: number;
  /** Content bytes (a view, not a copy). */
  content: Uint8Array;
  /** Children, for constructed nodes. */
  children: Asn1Node[];
}

const MAX_DEPTH = 40;

/** Parse one TLV at `offset`. Throws X509DecodeError("der") on any overrun. */
function parseTlv(buf: Uint8Array, offset: number, depth: number): Asn1Node {
  if (depth > MAX_DEPTH) throw new X509DecodeError("der");
  if (offset + 2 > buf.length) throw new X509DecodeError("der");

  const tag = buf[offset];
  const tagClass = (tag & 0xc0) >> 6;
  const constructed = (tag & 0x20) !== 0;
  let tagNumber = tag & 0x1f;

  let p = offset + 1;
  // High-tag-number form (rare in certs) - read the multi-byte tag number.
  if (tagNumber === 0x1f) {
    tagNumber = 0;
    let b: number;
    do {
      if (p >= buf.length) throw new X509DecodeError("der");
      b = buf[p++];
      tagNumber = (tagNumber << 7) | (b & 0x7f);
    } while (b & 0x80);
  }

  // Length: short form (< 0x80) or long form (0x80 | number-of-length-bytes).
  if (p >= buf.length) throw new X509DecodeError("der");
  let length = buf[p++];
  if (length & 0x80) {
    const numBytes = length & 0x7f;
    if (numBytes === 0 || numBytes > 4) throw new X509DecodeError("der"); // no indefinite length in DER
    if (p + numBytes > buf.length) throw new X509DecodeError("der");
    length = 0;
    for (let i = 0; i < numBytes; i++) length = length * 256 + buf[p++];
  }

  const contentStart = p;
  const contentEnd = contentStart + length;
  if (contentEnd > buf.length) throw new X509DecodeError("der");
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

/** Parse the whole buffer as a single top-level TLV (the Certificate SEQUENCE). */
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
  // UTF8String, PrintableString, IA5String, T61String, etc. - UTF-8 covers the
  // ASCII subsets these use in practice.
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

/** Parse a UTCTime / GeneralizedTime node to an ISO-8601 UTC string. */
function parseTime(node: Asn1Node): string {
  const s = new TextDecoder("utf-8").decode(node.content).trim();
  let year: string,
    rest: string;
  if (node.tagNumber === 0x17) {
    // UTCTime: YYMMDDHHMMSSZ - RFC 5280: YY < 50 => 20YY, else 19YY.
    const yy = parseInt(s.slice(0, 2), 10);
    year = (yy < 50 ? 2000 + yy : 1900 + yy).toString();
    rest = s.slice(2);
  } else {
    // GeneralizedTime: YYYYMMDDHHMMSSZ.
    year = s.slice(0, 4);
    rest = s.slice(4);
  }
  const mm = rest.slice(0, 2);
  const dd = rest.slice(2, 4);
  const hh = rest.slice(4, 6) || "00";
  const mi = rest.slice(6, 8) || "00";
  const ss = rest.slice(8, 10) || "00";
  return `${year}-${mm}-${dd}T${hh}:${mi}:${ss}Z`;
}

/** Serial INTEGER -> colon-grouped upper-case hex (drops a single sign byte). */
function serialToHex(node: Asn1Node): string {
  let bytes = node.content;
  // A leading 0x00 is the ASN.1 sign byte for a positive integer whose top bit
  // is set; strip it for display, but keep a bare "00".
  if (bytes.length > 1 && bytes[0] === 0x00) bytes = bytes.subarray(1);
  return bytesToHex(bytes, ":");
}

// ----------------------------------------------------------------------------
// Public-key, SAN, and extension decoding
// ----------------------------------------------------------------------------

/** Parse SubjectPublicKeyInfo ::= SEQUENCE { algorithm AlgId, key BIT STRING }. */
function parsePublicKey(spki: Asn1Node): PublicKeyInfo {
  const algId = spki.children[0];
  const algOid = decodeOid(algId.children[0].content);
  const name = OID_KEY[algOid] ?? algOid;
  const info: PublicKeyInfo = { algorithm: name, oid: algOid };

  if (name === "RSA") {
    // The BIT STRING wraps RSAPublicKey ::= SEQUENCE { modulus, exponent }.
    const bitString = spki.children[1];
    // BIT STRING content: first byte = unused bits (0), then the DER payload.
    const inner = bitString.content.subarray(1);
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
          for (let i = 0; i < 16; i += 2) {
            groups.push(((b[i] << 8) | b[i + 1]).toString(16));
          }
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

/** Decode the value bytes of each extension we recognize. */
function parseExtensions(extSeq: Asn1Node): CertExtensions {
  const ext: CertExtensions = { other: [] };
  for (const e of extSeq.children) {
    // Extension ::= SEQUENCE { extnID OID, critical BOOLEAN DEFAULT FALSE, extnValue OCTET STRING }
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

    if (oid === "2.5.29.15" && inner) {
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
      ext.keyUsage = { critical, usages };
    } else if (oid === "2.5.29.37" && inner) {
      // extKeyUsage: SEQUENCE OF OID.
      const purposes = inner.children.map((c) => OID_EKU[decodeOid(c.content)] ?? decodeOid(c.content));
      ext.extendedKeyUsage = { critical, purposes };
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
      ext.basicConstraints = { critical, ca, pathLen };
    } else if (oid === "2.5.29.17" && inner) {
      ext.subjectAltName = { critical, entries: parseSan(inner) };
    } else if (oid === "2.5.29.14" && inner) {
      // subjectKeyIdentifier: OCTET STRING containing the key id.
      ext.subjectKeyId = { critical, keyId: bytesToHex(inner.content, ":") };
    } else if (oid === "2.5.29.35" && inner) {
      // authorityKeyIdentifier: SEQUENCE { [0] keyIdentifier OCTET STRING OPTIONAL, ... }.
      const kid = inner.children.find((c) => c.tagNumber === 0 && c.tagClass === 2);
      ext.authorityKeyId = { critical, keyId: kid ? bytesToHex(kid.content, ":") : "" };
    } else {
      ext.other.push({ oid, name, critical });
    }
  }
  return ext;
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
  if (clean.length % 2 !== 0) throw new X509DecodeError("format");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(clean.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) throw new X509DecodeError("format");
    bytes[i] = byte;
  }
  return bytes;
}

/** Accept PEM (with or without the BEGIN/END armor), bare base64, or hex. */
function toDerBytes(input: string): Uint8Array {
  const text = input.trim();
  if (!text) throw new X509DecodeError("empty");

  // PEM: extract the base64 between the CERTIFICATE armor lines.
  const pem = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/.exec(text);
  if (pem) {
    try {
      return base64ToBytes(pem[1].replace(/[^A-Za-z0-9+/=]/g, ""));
    } catch {
      throw new X509DecodeError("format");
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
      throw new X509DecodeError("format");
    }
  }

  throw new X509DecodeError("format");
}

// ----------------------------------------------------------------------------
// The orchestrator
// ----------------------------------------------------------------------------

/**
 * decodeCertificate - the deterministic entry point.
 * @param input a certificate as PEM, bare base64, or hex
 * @returns the decoded structure
 * @throws {X509DecodeError} with a stable code on any malformed input
 */
export function decodeCertificate(input: string): DecodedCertificate {
  const der = toDerBytes(input);

  let cert: Asn1Node;
  try {
    cert = parseDer(der);
  } catch {
    throw new X509DecodeError("der");
  }

  try {
    // Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
    if (cert.children.length < 3) throw new X509DecodeError("structure");
    const tbs = cert.children[0];
    const outerSigAlg = cert.children[1];

    // Walk the TBSCertificate, accounting for the optional [0] EXPLICIT version.
    let idx = 0;
    let version = 1;
    if (tbs.children[idx] && tbs.children[idx].tagClass === 2 && tbs.children[idx].tagNumber === 0) {
      const versionInt = tbs.children[idx].children[0];
      version = (versionInt?.content[versionInt.content.length - 1] ?? 0) + 1;
      idx++;
    }

    const serialNode = tbs.children[idx++];
    idx++; // inner signature AlgorithmIdentifier (same as outer; skip)
    const issuerNode = tbs.children[idx++];
    const validityNode = tbs.children[idx++];
    const subjectNode = tbs.children[idx++];
    const spkiNode = tbs.children[idx++];

    // The remaining optional fields: [1] issuerUniqueID, [2] subjectUniqueID,
    // [3] EXPLICIT extensions. We only want [3].
    let extensions: CertExtensions = { other: [] };
    for (let i = idx; i < tbs.children.length; i++) {
      const c = tbs.children[i];
      if (c.tagClass === 2 && c.tagNumber === 3) {
        extensions = parseExtensions(c.children[0]); // [3] wraps the SEQUENCE OF Extension
      }
    }

    const issuer = parseName(issuerNode);
    const subject = parseName(subjectNode);
    const sigOid = decodeOid(outerSigAlg.children[0].content);

    return {
      version,
      serialNumberHex: serialToHex(serialNode),
      issuer,
      subject,
      validity: {
        notBefore: parseTime(validityNode.children[0]),
        notAfter: parseTime(validityNode.children[1]),
      },
      publicKey: parsePublicKey(spkiNode),
      signatureAlgorithm: OID_SIG[sigOid] ?? sigOid,
      signatureAlgorithmOid: sigOid,
      extensions,
      selfIssued: issuer.text === subject.text,
      der,
    };
  } catch (e) {
    if (e instanceof X509DecodeError) throw e;
    throw new X509DecodeError("structure");
  }
}
