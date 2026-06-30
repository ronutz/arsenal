// ============================================================================
// src/lib/tools/jwks-explainer/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS A JSON WEB KEY SET (JWKS) AND MATCHES A JWT TO ITS KEY.
//
// A JWKS is the JSON document an identity provider publishes (usually at
// /.well-known/jwks.json) so that anyone can verify the tokens it signs:
//
//     { "keys": [ {JWK}, {JWK}, ... ] }
//
// Each JWK describes one key: its type (kty), an optional key id (kid), its
// intended use and algorithm, and the type-specific parameters. This module
// parses a JWKS (or a single JWK), explains every key, flags any that carry
// PRIVATE material (a JWKS should be public), and, given a JWT, reads its
// header to find the key whose kid matches.
//
// It never fetches a jwks_uri and never performs cryptography. It only reads,
// measures, and explains what you paste. Sources: RFC 7517 (JWK), RFC 7518
// (JWA), RFC 8037 (OKP / EdDSA). Pure and offline.
// ============================================================================

export interface KtyInfo {
  label: string;
  description: string;
  publicParams: string[];
  privateParams: string[];
}

// Key types and their parameters (RFC 7518 section 6, RFC 8037 section 2).
export const KTY_INFO: Record<string, KtyInfo> = {
  RSA: {
    label: "RSA",
    description: "An RSA key. The public key is the modulus n and exponent e; the private key adds d and the prime factors.",
    publicParams: ["n", "e"],
    privateParams: ["d", "p", "q", "dp", "dq", "qi", "oth"],
  },
  EC: {
    label: "Elliptic Curve",
    description: "An elliptic-curve key on a named curve (crv). The public key is the point x and y; the private key adds d.",
    publicParams: ["crv", "x", "y"],
    privateParams: ["d"],
  },
  OKP: {
    label: "Octet Key Pair",
    description: "An Edwards-curve or Montgomery-curve key (RFC 8037), used by EdDSA (Ed25519, Ed448) and ECDH (X25519, X448). Public is x; private adds d.",
    publicParams: ["crv", "x"],
    privateParams: ["d"],
  },
  oct: {
    label: "Octet sequence (symmetric)",
    description: "A symmetric key: a single shared secret k. The same secret signs and verifies, so it is sensitive and must never appear in a published JWKS.",
    publicParams: [],
    privateParams: ["k"],
  },
};

// Curve sizes in bits (RFC 7518 section 6.2.1.1, RFC 8037).
export const CRV_BITS: Record<string, number> = {
  "P-256": 256,
  "P-384": 384,
  "P-521": 521,
  secp256k1: 256,
  Ed25519: 256,
  Ed448: 448,
  X25519: 256,
  X448: 448,
};

export interface AlgInfo {
  family: string;
  detail: string;
  category: "signature" | "encryption";
}

// JWS / JWE algorithms (RFC 7518, RFC 8037).
export const ALG_INFO: Record<string, AlgInfo> = {
  RS256: { family: "RSASSA-PKCS1-v1_5", detail: "RSA signature with SHA-256", category: "signature" },
  RS384: { family: "RSASSA-PKCS1-v1_5", detail: "RSA signature with SHA-384", category: "signature" },
  RS512: { family: "RSASSA-PKCS1-v1_5", detail: "RSA signature with SHA-512", category: "signature" },
  PS256: { family: "RSASSA-PSS", detail: "RSA-PSS signature with SHA-256", category: "signature" },
  PS384: { family: "RSASSA-PSS", detail: "RSA-PSS signature with SHA-384", category: "signature" },
  PS512: { family: "RSASSA-PSS", detail: "RSA-PSS signature with SHA-512", category: "signature" },
  ES256: { family: "ECDSA", detail: "ECDSA on P-256 with SHA-256", category: "signature" },
  ES384: { family: "ECDSA", detail: "ECDSA on P-384 with SHA-384", category: "signature" },
  ES512: { family: "ECDSA", detail: "ECDSA on P-521 with SHA-512", category: "signature" },
  ES256K: { family: "ECDSA", detail: "ECDSA on secp256k1 with SHA-256 (RFC 8812)", category: "signature" },
  EdDSA: { family: "EdDSA", detail: "Edwards-curve signature (Ed25519 or Ed448)", category: "signature" },
  HS256: { family: "HMAC", detail: "HMAC with SHA-256 (symmetric)", category: "signature" },
  HS384: { family: "HMAC", detail: "HMAC with SHA-384 (symmetric)", category: "signature" },
  HS512: { family: "HMAC", detail: "HMAC with SHA-512 (symmetric)", category: "signature" },
  RSA1_5: { family: "RSAES-PKCS1-v1_5", detail: "RSA key encryption (legacy)", category: "encryption" },
  "RSA-OAEP": { family: "RSAES-OAEP", detail: "RSA key encryption with OAEP", category: "encryption" },
  "RSA-OAEP-256": { family: "RSAES-OAEP", detail: "RSA key encryption with OAEP and SHA-256", category: "encryption" },
  "ECDH-ES": { family: "ECDH-ES", detail: "Elliptic-curve Diffie-Hellman key agreement", category: "encryption" },
};

const USE_LABEL: Record<string, string> = { sig: "Signature", enc: "Encryption" };

// ---- base64url (pure, deterministic, no atob or Buffer) --------------------
const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function b64urlToBytes(input: string): Uint8Array | null {
  const s = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null;
  const clean = s.replace(/=+$/, "");
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const val = B64_ALPHABET.indexOf(ch);
    if (val === -1) return null;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

/** Exact bit length of an RSA modulus given its base64url n parameter. */
export function rsaModulusBits(n: string): number | null {
  const bytes = b64urlToBytes(n);
  if (!bytes || bytes.length === 0) return null;
  let i = 0;
  while (i < bytes.length && bytes[i] === 0) i++;
  if (i === bytes.length) return 0;
  let topBits = 0;
  let t = bytes[i];
  while (t > 0) {
    topBits++;
    t >>= 1;
  }
  return (bytes.length - i - 1) * 8 + topBits;
}

// ---- key explanation -------------------------------------------------------

export interface KeyExplanation {
  index: number;
  kid?: string;
  kty: string;
  ktyKnown: boolean;
  ktyLabel: string;
  ktyDescription: string;
  use?: string;
  useLabel?: string;
  alg?: string;
  algInfo?: AlgInfo;
  crv?: string;
  bits?: number;
  publicParamsPresent: string[];
  privateParamsPresent: string[];
  isPrivate: boolean;
  warnings: string[];
}

export function explainKey(jwk: Record<string, unknown>, index: number): KeyExplanation {
  const warnings: string[] = [];
  const kty = typeof jwk.kty === "string" ? jwk.kty : "";
  const info = KTY_INFO[kty];
  const ktyKnown = !!info;

  const kid = typeof jwk.kid === "string" ? jwk.kid : undefined;
  const use = typeof jwk.use === "string" ? jwk.use : undefined;
  const alg = typeof jwk.alg === "string" ? jwk.alg : undefined;
  const crv = typeof jwk.crv === "string" ? jwk.crv : undefined;

  const publicParamsPresent = (info?.publicParams ?? []).filter((p) => p in jwk);
  const privateParamsPresent = (info?.privateParams ?? []).filter((p) => p in jwk);
  const isPrivate = privateParamsPresent.length > 0;

  // size
  let bits: number | undefined;
  if (kty === "RSA" && typeof jwk.n === "string") {
    const b = rsaModulusBits(jwk.n);
    if (b) bits = b;
  } else if ((kty === "EC" || kty === "OKP") && crv && crv in CRV_BITS) {
    bits = CRV_BITS[crv];
  }

  // warnings
  if (!ktyKnown) warnings.push(`Unknown key type "${kty || "(missing)"}"; this tool can only describe RSA, EC, OKP, and oct.`);
  if (kty === "oct") warnings.push("This is a symmetric secret. A symmetric key must never appear in a published JWKS; if you fetched this from a public endpoint, treat the secret as compromised.");
  else if (isPrivate) warnings.push(`This key includes PRIVATE material (${privateParamsPresent.join(", ")}). A JWKS is meant to be public; publish only the public parameters.`);
  if (kty === "RSA" && bits !== undefined && bits < 2048) warnings.push(`The RSA modulus is ${bits} bits, below the 2048-bit minimum considered safe today.`);
  if (!kid) warnings.push("This key has no kid, so a verifier cannot select it by key id during a key rotation.");
  if (alg && !ALG_INFO[alg]) warnings.push(`The alg "${alg}" is not one this tool recognizes; check it against the JWA registry.`);

  return {
    index,
    kid,
    kty,
    ktyKnown,
    ktyLabel: info?.label ?? (kty || "(missing)"),
    ktyDescription: info?.description ?? "",
    use,
    useLabel: use ? USE_LABEL[use] : undefined,
    alg,
    algInfo: alg ? ALG_INFO[alg] : undefined,
    crv,
    bits,
    publicParamsPresent,
    privateParamsPresent,
    isPrivate,
    warnings,
  };
}

// ---- JWKS parsing ----------------------------------------------------------

export interface JwksResult {
  ok: boolean;
  keys: KeyExplanation[];
  rawKeys: Record<string, unknown>[];
  wasSingleKey: boolean;
  anyPrivate: boolean;
  error?: { message: string };
}

export function parseJwks(input: string): JwksResult {
  const empty: JwksResult = { ok: false, keys: [], rawKeys: [], wasSingleKey: false, anyPrivate: false };
  const trimmed = input.trim();
  if (!trimmed) return { ...empty, error: { message: "Paste a JWKS (an object with a keys array) or a single JWK." } };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ...empty, error: { message: "That is not valid JSON. A JWKS is a JSON object." } };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ...empty, error: { message: "A JWKS must be a JSON object." } };
  }

  const obj = parsed as Record<string, unknown>;
  let rawKeys: Record<string, unknown>[];
  let wasSingleKey = false;

  if (Array.isArray(obj.keys)) {
    rawKeys = obj.keys.filter((k) => typeof k === "object" && k !== null) as Record<string, unknown>[];
  } else if (typeof obj.kty === "string") {
    rawKeys = [obj];
    wasSingleKey = true;
  } else {
    return { ...empty, error: { message: 'No keys found. Expected an object with a "keys" array, or a single JWK with a "kty".' } };
  }

  if (rawKeys.length === 0) {
    return { ...empty, error: { message: "The keys array is empty." } };
  }

  const keys = rawKeys.map((k, i) => explainKey(k, i));
  return {
    ok: true,
    keys,
    rawKeys,
    wasSingleKey,
    anyPrivate: keys.some((k) => k.isPrivate),
  };
}

// ---- JWT header parsing and key matching -----------------------------------

export interface JwtHeaderResult {
  ok: boolean;
  header?: Record<string, unknown>;
  kid?: string;
  alg?: string;
  error?: { message: string };
}

/** Read the header of a JWT (its first segment), or accept a raw JSON header. */
export function parseJwtHeader(input: string): JwtHeaderResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: { message: "Paste a JWT, or just its header." } };

  let headerJson: string | null = null;

  if (trimmed.startsWith("{")) {
    headerJson = trimmed; // a raw header object was pasted
  } else {
    const seg = trimmed.split(".")[0];
    const bytes = b64urlToBytes(seg);
    if (!bytes) return { ok: false, error: { message: "The first segment is not valid base64url; this does not look like a JWT." } };
    try {
      headerJson = new TextDecoder().decode(bytes);
    } catch {
      return { ok: false, error: { message: "The JWT header is not valid UTF-8." } };
    }
  }

  let header: unknown;
  try {
    header = JSON.parse(headerJson);
  } catch {
    return { ok: false, error: { message: "The JWT header is not valid JSON." } };
  }
  if (typeof header !== "object" || header === null) {
    return { ok: false, error: { message: "The JWT header is not a JSON object." } };
  }

  const h = header as Record<string, unknown>;
  return {
    ok: true,
    header: h,
    kid: typeof h.kid === "string" ? h.kid : undefined,
    alg: typeof h.alg === "string" ? h.alg : undefined,
  };
}

export interface MatchResult {
  ok: boolean;
  header?: Record<string, unknown>;
  headerKid?: string;
  headerAlg?: string;
  matches: KeyExplanation[];
  algMismatch: boolean;
  note: string;
  error?: { message: string };
}

/** Match a JWT against a parsed JWKS by kid, and check alg compatibility. */
export function matchJwtToJwks(jwtInput: string, jwks: JwksResult): MatchResult {
  const h = parseJwtHeader(jwtInput);
  if (!h.ok) return { ok: false, matches: [], algMismatch: false, note: "", error: h.error };

  if (!jwks.ok) {
    return { ok: false, matches: [], algMismatch: false, note: "", error: { message: "Parse a valid JWKS first." } };
  }

  let matches: KeyExplanation[] = [];
  let note: string;

  if (h.kid) {
    matches = jwks.keys.filter((k) => k.kid === h.kid);
    if (matches.length === 0) note = `No key in this JWKS has kid "${h.kid}". The verifier would have no key to use.`;
    else if (matches.length === 1) note = `Matched the key with kid "${h.kid}".`;
    else note = `Several keys share kid "${h.kid}"; a verifier would disambiguate by key type or algorithm.`;
  } else {
    // No kid in the header: fall back to alg, as some verifiers do.
    if (h.alg) {
      matches = jwks.keys.filter((k) => k.alg === h.alg);
      note = matches.length
        ? `The JWT header has no kid, so this falls back to alg "${h.alg}", which matches ${matches.length} key(s). Relying on alg alone is fragile.`
        : `The JWT header has no kid, and no key advertises alg "${h.alg}".`;
    } else {
      note = "The JWT header has neither a kid nor an alg, so no key can be selected.";
    }
  }

  const algMismatch = !!h.alg && matches.length > 0 && matches.every((k) => k.alg && k.alg !== h.alg);

  return {
    ok: true,
    header: h.header,
    headerKid: h.kid,
    headerAlg: h.alg,
    matches,
    algMismatch,
    note,
  };
}

/** run - the primary direction is to parse and explain a JWKS. Never throws. */
export function run(input: string): JwksResult {
  return parseJwks(input);
}
