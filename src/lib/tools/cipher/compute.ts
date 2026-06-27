// ============================================================================
// src/lib/tools/cipher/compute.ts
// ----------------------------------------------------------------------------
// TLS CIPHER SUITE DECODE - the pure compute core for the cipher-suite tool.
//
// netcore tool contract: a tool is a {manifest, run, vectors} triple and `run`
// must be DETERMINISTIC so its golden vectors are stable. This is that core.
//
// Two halves:
//   1. RESOLUTION - turn whatever the user typed (a hex code point in any common
//      spelling, an IANA name, an OpenSSL name, or a GnuTLS name) into a record
//      from the vendored IANA registry (registry-data.ts).
//   2. DECODING - parse the IANA name structurally into its components (key
//      exchange, authentication, bulk cipher + key size + mode, MAC/PRF hash),
//      and derive a rule-based security assessment with explicit reasons. The
//      IANA "Recommended" flag is surfaced separately, as an independent signal.
//
// The name grammar is regular enough to parse by hand (the whole point of the
// tool is to SHOW that structure), and parsing - rather than storing parsed
// fields - keeps the decode logic transparent and the dataset pure facts.
//
// No network, no external library: same hand-rolled, browser+Node posture as the
// rest of the toolbox ("tools that compute, never guess").
// ============================================================================

import { CIPHER_SUITES, REGISTRY_SNAPSHOT, type CipherSuiteRecord } from "./registry-data";

export { REGISTRY_SNAPSHOT };

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

export type CipherDecodeErrorCode = "empty" | "format" | "unknown";

export class CipherDecodeError extends Error {
  code: CipherDecodeErrorCode;
  constructor(code: CipherDecodeErrorCode, message?: string) {
    super(message ?? code);
    this.name = "CipherDecodeError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Result shape
// ----------------------------------------------------------------------------

export type SecurityRating = "insecure" | "weak" | "secure" | "recommended" | "unknown";

export interface CipherComponentInfo {
  /** Key-exchange / agreement (e.g. "ECDHE", "RSA", "DHE", "PSK"), or null for TLS 1.3. */
  keyExchange: string | null;
  /** Authentication (e.g. "RSA", "ECDSA", "PSK", "anonymous"), or null for TLS 1.3. */
  authentication: string | null;
  /** True when the key exchange is ephemeral (ECDHE / DHE) - i.e. forward secrecy. */
  forwardSecrecy: boolean;
  /** Bulk cipher algorithm (e.g. "AES", "ChaCha20", "3DES", "NULL"). */
  cipherAlgorithm: string;
  /** Symmetric key size in bits, when applicable (128, 256, 40, 56, ...). */
  cipherKeyBits?: number;
  /** Mode of operation (e.g. "GCM", "CBC", "CCM", "CCM_8", "Poly1305", "stream", "none"). */
  cipherMode: string;
  /** True for an AEAD cipher (GCM / CCM / ChaCha20-Poly1305). */
  aead: boolean;
  /** MAC algorithm (CBC/stream suites) or the PRF/KDF hash (AEAD suites). */
  macOrPrf: string;
}

/**
 * One reason behind a rating, as a STABLE CODE (localized in the UI via
 * tools.cipher.reasons.<code>), optionally carrying a value (e.g. an algorithm
 * name). Codes - not English prose - keep compute deterministic and the reasons
 * translatable across every locale, exactly like the decode error codes.
 */
export interface SecurityReason {
  code: string;
  value?: string;
}

export interface SecurityAssessment {
  rating: SecurityRating;
  /** Reasons behind the rating (stable codes; the teaching surface). */
  reasons: SecurityReason[];
}

export interface DecodedCipherSuite {
  /** Code point as 0xNNNN. */
  hex: string;
  /** Numeric code point. */
  code: number;
  /** Authoritative IANA name. */
  name: string;
  /** OpenSSL name, if known. */
  openssl?: string;
  /** GnuTLS name, if known. */
  gnutls?: string;
  /** Registry references (e.g. ["RFC 8446"]). */
  refs: string[];
  /** IANA "Recommended" column: Y / N / D. */
  ianaRecommended: "Y" | "N" | "D";
  /** IANA DTLS-OK flag. */
  dtlsOk: boolean;
  /** "TLS 1.3" or "TLS 1.2 and earlier". */
  protocol: string;
  /** True when this is a TLS 1.3 suite (symmetric cipher + hash only). */
  tls13: boolean;
  /** True for special signalling suites (SCSV) - not a usable cipher. */
  signalling: boolean;
  /** Parsed components. */
  components: CipherComponentInfo;
  /** Rule-based security assessment. */
  security: SecurityAssessment;
  /** Whether the suite was found in the vendored IANA registry snapshot. */
  inRegistry: boolean;
}

// ----------------------------------------------------------------------------
// Lookup indexes (built once)
// ----------------------------------------------------------------------------

const byCode = new Map<number, CipherSuiteRecord>();
const byName = new Map<string, CipherSuiteRecord>();
const byOpenssl = new Map<string, CipherSuiteRecord>();
const byGnutls = new Map<string, CipherSuiteRecord>();
for (const r of CIPHER_SUITES) {
  byCode.set(r.code, r);
  byName.set(r.name.toUpperCase(), r);
  if (r.openssl) byOpenssl.set(r.openssl.toUpperCase(), r);
  if (r.gnutls) byGnutls.set(r.gnutls.toUpperCase(), r);
}

// ----------------------------------------------------------------------------
// Resolution: input -> code point (number) or null
// ----------------------------------------------------------------------------

/** Parse a hex code point in any common spelling into a 0-65535 number, or null. */
export function parseHexCode(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/^cipher\s+suite[:=]?\s*/i, "");
  // Collect hex digit pairs: "0x13,0x01" / "13 01" / "1301" / "0x1301".
  const cleaned = s.replace(/0x/g, "").replace(/[\s,]+/g, "");
  if (!/^[0-9a-f]{4}$/.test(cleaned)) return null;
  return parseInt(cleaned, 16);
}

interface Resolution {
  record: CipherSuiteRecord | null;
  /** A name to parse even when no registry record exists (well-formed TLS_ name). */
  fallbackName: string | null;
}

function resolve(raw: string): Resolution {
  const trimmed = raw.trim();
  if (!trimmed) throw new CipherDecodeError("empty");

  // 1. Hex code point.
  const code = parseHexCode(trimmed);
  if (code !== null) {
    const rec = byCode.get(code) ?? null;
    if (rec) return { record: rec, fallbackName: null };
    // A valid-looking but unassigned code point.
    throw new CipherDecodeError(
      "unknown",
      `0x${code.toString(16).toUpperCase().padStart(4, "0")} is not an assigned cipher suite`
    );
  }

  const upper = trimmed.toUpperCase();

  // 2. IANA name (or GnuTLS name - both use the TLS_ prefix).
  if (byName.has(upper)) return { record: byName.get(upper)!, fallbackName: null };
  if (byGnutls.has(upper)) return { record: byGnutls.get(upper)!, fallbackName: null };

  // 3. OpenSSL name (hyphenated, no TLS_ prefix).
  if (byOpenssl.has(upper)) return { record: byOpenssl.get(upper)!, fallbackName: null };

  // 4. A well-formed but unregistered IANA-style name: decode structurally anyway.
  if (/^TLS_[A-Z0-9_]+$/.test(upper) && upper.length > 6) {
    return { record: null, fallbackName: upper };
  }

  throw new CipherDecodeError("format");
}

// ----------------------------------------------------------------------------
// Decoding: parse an IANA name into components
// ----------------------------------------------------------------------------

const KX_LABELS: Record<string, string> = {
  ECDHE: "ECDHE (ephemeral elliptic-curve Diffie-Hellman)",
  DHE: "DHE (ephemeral finite-field Diffie-Hellman)",
  ECDH: "ECDH (static elliptic-curve Diffie-Hellman)",
  DH: "DH (static finite-field Diffie-Hellman)",
  RSA: "RSA (static RSA key transport)",
  PSK: "PSK (pre-shared key)",
  SRP: "SRP (Secure Remote Password)",
  KRB5: "Kerberos 5",
};

const AUTH_LABELS: Record<string, string> = {
  RSA: "RSA",
  ECDSA: "ECDSA",
  DSS: "DSA (DSS)",
  PSK: "PSK (pre-shared key)",
  ANON: "anonymous (no authentication)",
};

/** Split a cipher-spec token list into algorithm / key bits / mode. */
function parseCipher(tokens: string[]): {
  algorithm: string;
  keyBits?: number;
  mode: string;
  aead: boolean;
} {
  const joined = tokens.join("_");
  // NULL cipher (no encryption).
  if (joined === "NULL" || tokens[0] === "NULL") {
    return { algorithm: "NULL", mode: "none", aead: false };
  }
  // ChaCha20-Poly1305 (AEAD).
  if (joined.startsWith("CHACHA20")) {
    return { algorithm: "ChaCha20", keyBits: 256, mode: "Poly1305", aead: true };
  }
  const has = (t: string) => tokens.includes(t);
  const numTok = tokens.find((t) => /^\d+$/.test(t));
  const keyBits = numTok ? parseInt(numTok, 10) : undefined;

  // Algorithm family.
  let algorithm = tokens[0];
  if (has("AES")) algorithm = "AES";
  else if (joined.startsWith("3DES")) algorithm = "3DES";
  else if (has("DES40")) algorithm = "DES";
  else if (joined.startsWith("DES")) algorithm = "DES";
  else if (has("RC4")) algorithm = "RC4";
  else if (has("RC2")) algorithm = "RC2";
  else if (has("CAMELLIA")) algorithm = "Camellia";
  else if (has("ARIA")) algorithm = "ARIA";
  else if (has("SEED")) algorithm = "SEED";
  else if (has("IDEA")) algorithm = "IDEA";
  else if (has("KUZNYECHIK")) algorithm = "Kuznyechik (GOST)";
  else if (has("MAGMA")) algorithm = "Magma (GOST)";

  // Mode.
  let mode = "CBC";
  let aead = false;
  if (has("GCM")) {
    mode = "GCM";
    aead = true;
  } else if (joined.includes("CCM_8")) {
    mode = "CCM_8";
    aead = true;
  } else if (has("CCM")) {
    mode = "CCM";
    aead = true;
  } else if (has("CTR")) {
    mode = "CTR";
  } else if (has("CBC")) {
    mode = "CBC";
  } else if (algorithm === "RC4") {
    mode = "stream";
  }

  // Export-grade size hints (DES40 = 40-bit, RC4_40, RC2_40).
  let bits = keyBits;
  if (has("DES40") || joined.includes("_40")) bits = 40;
  if (algorithm === "DES" && bits === undefined) bits = 56; // single DES
  if (algorithm === "3DES") bits = 168;

  return { algorithm, keyBits: bits, mode, aead };
}

/** Parse an IANA cipher-suite name into structured components. */
export function parseComponents(name: string): CipherComponentInfo & { signalling: boolean; tls13: boolean } {
  const upper = name.toUpperCase();

  // Signalling suites carry no cipher.
  if (upper.endsWith("_SCSV")) {
    return {
      keyExchange: null,
      authentication: null,
      forwardSecrecy: false,
      cipherAlgorithm: "none (signalling suite)",
      cipherMode: "none",
      aead: false,
      macOrPrf: "none",
      signalling: true,
      tls13: false,
    };
  }

  const body = upper.replace(/^TLS_/, "").replace(/^SSL_/, "");
  const hasWith = body.includes("_WITH_");

  // ---- TLS 1.3 form: TLS_<CIPHER>_<HASH>, no key exchange in the suite ----
  if (!hasWith) {
    const toks = body.split("_");
    const hash = toks[toks.length - 1];
    const cipherToks = toks.slice(0, -1);
    const c = parseCipher(cipherToks);
    return {
      keyExchange: null,
      authentication: null,
      forwardSecrecy: true, // TLS 1.3 always uses an ephemeral key share
      cipherAlgorithm: c.algorithm,
      cipherKeyBits: c.keyBits,
      cipherMode: c.mode,
      aead: c.aead,
      macOrPrf: normalizeHash(hash),
      signalling: false,
      tls13: true,
    };
  }

  // ---- TLS 1.2-and-earlier form: <KX/AUTH>_WITH_<CIPHER>_<MAC> ----
  const [kxAuthPart, cipherPart] = body.split("_WITH_");
  const { keyExchange, authentication, forwardSecrecy } = parseKxAuth(kxAuthPart);

  const ctoks = cipherPart.split("_");
  const hash = ctoks[ctoks.length - 1];
  const cipherToks = ctoks.slice(0, -1);
  const c = parseCipher(cipherToks);

  return {
    keyExchange,
    authentication,
    forwardSecrecy,
    cipherAlgorithm: c.algorithm,
    cipherKeyBits: c.keyBits,
    cipherMode: c.mode,
    aead: c.aead,
    macOrPrf: normalizeHash(hash),
    signalling: false,
    tls13: false,
  };
}

function normalizeHash(h: string): string {
  switch (h) {
    case "SHA":
      return "SHA-1";
    case "SHA256":
      return "SHA-256";
    case "SHA384":
      return "SHA-384";
    case "SHA512":
      return "SHA-512";
    case "MD5":
      return "MD5";
    case "NULL":
      return "none";
    case "OMAC":
      return "OMAC (GOST)";
    default:
      return h;
  }
}

/** Parse the part before _WITH_ into key exchange + authentication. */
function parseKxAuth(part: string): {
  keyExchange: string;
  authentication: string;
  forwardSecrecy: boolean;
} {
  const label = (map: Record<string, string>, k: string) => map[k] ?? k;

  // PSK families.
  if (part === "PSK") {
    return { keyExchange: label(KX_LABELS, "PSK"), authentication: label(AUTH_LABELS, "PSK"), forwardSecrecy: false };
  }
  if (part.endsWith("_PSK")) {
    const pre = part.slice(0, -4); // ECDHE / DHE / RSA / ECDH
    const fs = pre === "ECDHE" || pre === "DHE";
    const kx = `${label(KX_LABELS, pre)} + PSK`;
    const auth = pre === "RSA" ? "RSA + PSK" : label(AUTH_LABELS, "PSK");
    return { keyExchange: kx, authentication: auth, forwardSecrecy: fs };
  }

  const toks = part.split("_");

  // SRP: SRP_SHA[_RSA|_DSS]
  if (toks[0] === "SRP") {
    const auth = toks[2] ? label(AUTH_LABELS, toks[2]) : "SRP";
    return { keyExchange: label(KX_LABELS, "SRP"), authentication: auth, forwardSecrecy: false };
  }
  if (toks[0] === "KRB5") {
    return { keyExchange: label(KX_LABELS, "KRB5"), authentication: "Kerberos 5", forwardSecrecy: false };
  }
  if (toks[0].startsWith("GOSTR") || toks[0] === "GOST") {
    return { keyExchange: "GOST", authentication: "GOST", forwardSecrecy: part.includes("GOSTR341112") };
  }

  const ephemeralKx = new Set(["ECDHE", "DHE"]);
  const staticKx = new Set(["ECDH", "DH"]);

  // Static RSA: just "RSA".
  if (toks.length === 1 && toks[0] === "RSA") {
    return { keyExchange: label(KX_LABELS, "RSA"), authentication: "RSA", forwardSecrecy: false };
  }

  const kxTok = toks[0];
  const authTok = toks.slice(1).join("_"); // RSA / ECDSA / DSS / ANON ("anon")

  let authentication: string;
  if (authTok === "ANON" || authTok === "") authentication = AUTH_LABELS.ANON;
  else authentication = label(AUTH_LABELS, authTok);

  const forwardSecrecy = ephemeralKx.has(kxTok);
  let keyExchange = label(KX_LABELS, kxTok);
  if (!KX_LABELS[kxTok] && !ephemeralKx.has(kxTok) && !staticKx.has(kxTok)) {
    keyExchange = kxTok; // unknown KX, keep raw
  }

  return { keyExchange, authentication, forwardSecrecy };
}

// ----------------------------------------------------------------------------
// Security assessment (rule-based, with explicit reasons)
// ----------------------------------------------------------------------------

function assess(
  c: CipherComponentInfo & { signalling: boolean; tls13: boolean },
  rec: "Y" | "N" | "D"
): SecurityAssessment {
  const reasons: SecurityReason[] = [];
  const add = (code: string, value?: string) => reasons.push(value ? { code, value } : { code });

  if (c.signalling) {
    return { rating: "unknown", reasons: [{ code: "signalling" }] };
  }

  const alg = c.cipherAlgorithm;
  const anon = (c.authentication ?? "").startsWith("anon");
  const isExport = c.cipherKeyBits === 40;

  let insecure = false;
  let weak = false;

  // --- Insecure (do not use) ---
  if (alg === "NULL") {
    insecure = true;
    add("nullCipher");
  }
  if (anon) {
    insecure = true;
    add("anon");
  }
  if (isExport) {
    insecure = true;
    add("export40");
  }
  if (alg === "RC4") {
    insecure = true;
    add("rc4");
  }
  if (alg === "DES" && c.cipherKeyBits === 56) {
    insecure = true;
    add("singleDes");
  }
  if (alg === "RC2") {
    insecure = true;
    add("rc2");
  }

  // --- Weak (legacy; avoid) ---
  if (!insecure) {
    if (alg === "3DES") {
      weak = true;
      add("tripleDes");
    }
    if (c.macOrPrf === "MD5") {
      weak = true;
      add("md5Mac");
    }
    if (!c.aead && (c.macOrPrf === "SHA-1" || c.macOrPrf === "MD5") && c.cipherMode === "CBC") {
      weak = true;
      add("cbcMac");
    }
    if (c.cipherMode === "CCM_8") {
      weak = true;
      add("ccm8");
    }
    if (!c.tls13 && !c.forwardSecrecy && !anon) {
      weak = true;
      add("noFs");
    }
    if (alg === "IDEA" || alg === "SEED") {
      weak = true;
      add("legacyCipher", alg);
    }
  }

  // --- Positive signals ---
  if (!insecure && !weak) {
    if (c.aead) add("aead");
    if (c.forwardSecrecy) add("fs");
    if (c.tls13) add("tls13");
  }

  // IANA stance, surfaced as an independent reason.
  if (rec === "D") add("ianaD");
  else if (rec === "N") add("ianaN");

  let rating: SecurityRating;
  if (insecure) rating = "insecure";
  else if (weak) rating = "weak";
  else if (c.aead && (c.tls13 || c.forwardSecrecy) && rec === "Y") rating = "recommended";
  else if (c.aead && (c.tls13 || c.forwardSecrecy)) rating = "secure";
  else if (alg.includes("GOST")) rating = "unknown";
  else rating = "secure";

  return { rating, reasons };
}

// ----------------------------------------------------------------------------
// Public entry point
// ----------------------------------------------------------------------------

/** Decode one cipher suite from a hex code point or any of its names. */
export function decodeCipherSuite(input: string): DecodedCipherSuite {
  const { record, fallbackName } = resolve(input);

  const name = record ? record.name : fallbackName!;
  const parsed = parseComponents(name);
  const rec = record ? record.rec : "N";
  const security = assess(parsed, rec);

  const code = record ? record.code : -1;
  const hex = record ? record.hex : "—";

  const components: CipherComponentInfo = {
    keyExchange: parsed.keyExchange,
    authentication: parsed.authentication,
    forwardSecrecy: parsed.forwardSecrecy,
    cipherAlgorithm: parsed.cipherAlgorithm,
    cipherKeyBits: parsed.cipherKeyBits,
    cipherMode: parsed.cipherMode,
    aead: parsed.aead,
    macOrPrf: parsed.macOrPrf,
  };

  return {
    hex,
    code,
    name,
    openssl: record?.openssl || undefined,
    gnutls: record?.gnutls || undefined,
    refs: record ? record.refs : [],
    ianaRecommended: rec,
    dtlsOk: record ? record.dtls : false,
    protocol: parsed.tls13 ? "TLS 1.3" : "TLS 1.2 and earlier",
    tls13: parsed.tls13,
    signalling: parsed.signalling,
    components,
    security,
    inRegistry: record !== null,
  };
}
