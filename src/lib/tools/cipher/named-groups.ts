// ============================================================================
// cipher / named-groups.ts
// ----------------------------------------------------------------------------
// A curated, deterministic registry of TLS 1.3 "supported groups" (the
// key-exchange / key-agreement groups advertised in the supported_groups
// extension), with the post-quantum hybrids featured.
//
// This complements the cipher-suite decoder: a cipher suite names the bulk
// cipher and (for TLS 1.2) the key-exchange family, but the actual group used
// for key agreement - the elliptic curve, finite-field group, or PQ hybrid -
// is negotiated separately through supported_groups. As "harvest now, decrypt
// later" pushes deployments toward post-quantum key agreement, knowing which
// group is which (and whether it is hybrid-PQ, pure-classical, or obsolete) is
// the operationally important question.
//
// Pure data + pure functions: no clock, no network, no environment (D-49).
// Code points and properties are sourced from the IANA TLS Supported Groups
// registry and draft-ietf-tls-ecdhe-mlkem (WG-adopted March 2025); see the
// tool manifest for the full source list. Snapshot date below.
// ============================================================================

/** When the registry data below was last reconciled against IANA / the draft. */
export const NAMED_GROUPS_SNAPSHOT = "2026-06-30";

/** Structural family of a named group. */
export type NamedGroupKind =
  | "ecdhe" // elliptic-curve Diffie-Hellman (classical)
  | "ffdhe" // finite-field Diffie-Hellman (classical)
  | "pq-hybrid"; // classical ECDHE concatenated with an ML-KEM (post-quantum) KEM

/** Post-quantum posture of a group. */
export type PqStatus =
  | "classical" // no post-quantum protection
  | "hybrid-pq"; // combines a classical primitive with a PQ KEM

/** One supported-groups registry entry. */
export interface NamedGroupRecord {
  /** Canonical registry name, e.g. "X25519MLKEM768". */
  name: string;
  /** 16-bit code point as a number. */
  codepoint: number;
  /** Structural family. */
  kind: NamedGroupKind;
  /** Post-quantum posture. */
  pq: PqStatus;
  /** IANA "Recommended" flag (Y). X25519MLKEM768 is Recommended per the draft. */
  recommended: boolean;
  /** Legacy / weak classical group that should be avoided. */
  legacy?: boolean;
  /** Superseded pre-standard group (kept for recognition only). */
  obsolete?: boolean;
  /** For a hybrid: the classical and PQ components it concatenates. */
  combines?: { classical: string; pq: string };
  /** Short spec reference label. */
  reference: string;
  /** One-line operator-facing note. */
  note: string;
}

// ----------------------------------------------------------------------------
// The registry (curated: the groups operators actually meet, plus the PQ set)
// ----------------------------------------------------------------------------

export const NAMED_GROUPS: readonly NamedGroupRecord[] = Object.freeze([
  // --- Post-quantum hybrids (the point of this panel) -----------------------
  {
    name: "X25519MLKEM768",
    codepoint: 0x11ec, // 4588
    kind: "pq-hybrid",
    pq: "hybrid-pq",
    recommended: true,
    combines: { classical: "X25519", pq: "ML-KEM-768" },
    reference: "draft-ietf-tls-ecdhe-mlkem",
    note: "The de-facto post-quantum default on the web; shipped by most browsers. Client share is 1216 bytes.",
  },
  {
    name: "SecP256r1MLKEM768",
    codepoint: 0x11eb, // 4587
    kind: "pq-hybrid",
    pq: "hybrid-pq",
    recommended: false,
    combines: { classical: "secp256r1 (P-256)", pq: "ML-KEM-768" },
    reference: "draft-ietf-tls-ecdhe-mlkem",
    note: "Both primitives are FIPS-approved, for deployments that require it. Not shipped by Chrome by default.",
  },
  {
    name: "SecP384r1MLKEM1024",
    codepoint: 0x11ed, // 4589
    kind: "pq-hybrid",
    pq: "hybrid-pq",
    recommended: false,
    combines: { classical: "secp384r1 (P-384)", pq: "ML-KEM-1024" },
    reference: "draft-ietf-tls-ecdhe-mlkem",
    note: "Positioned as the long-term CNSA 2.0 / level-V target.",
  },
  {
    name: "curveSM2MLKEM768",
    codepoint: 0x11ee, // 4590
    kind: "pq-hybrid",
    pq: "hybrid-pq",
    recommended: false,
    combines: { classical: "SM2", pq: "ML-KEM-768" },
    reference: "draft-ietf-tls-ecdhe-mlkem",
    note: "Combines the Chinese national SM2 curve with ML-KEM-768.",
  },
  {
    name: "X25519Kyber768Draft00",
    codepoint: 0x6399, // 25497
    kind: "pq-hybrid",
    pq: "hybrid-pq",
    recommended: false,
    obsolete: true,
    combines: { classical: "X25519", pq: "Kyber768 (draft)" },
    reference: "draft-tls-westerbaan-xyber768d00",
    note: "Pre-standard Kyber768, the 2024 PQ pioneer. Obsoleted by X25519MLKEM768.",
  },
  {
    name: "SecP256r1Kyber768Draft00",
    codepoint: 0x639a, // 25498
    kind: "pq-hybrid",
    pq: "hybrid-pq",
    recommended: false,
    obsolete: true,
    combines: { classical: "secp256r1 (P-256)", pq: "Kyber768 (draft)" },
    reference: "draft-tls-westerbaan-xyber768d00",
    note: "Pre-standard. Obsoleted by SecP256r1MLKEM768.",
  },

  // --- Classical elliptic-curve groups --------------------------------------
  {
    name: "x25519",
    codepoint: 0x001d, // 29
    kind: "ecdhe",
    pq: "classical",
    recommended: true,
    reference: "RFC 8446 / RFC 7748",
    note: "Curve25519; fast, constant-time, the most common classical group.",
  },
  {
    name: "x448",
    codepoint: 0x001e, // 30
    kind: "ecdhe",
    pq: "classical",
    recommended: true,
    reference: "RFC 8446 / RFC 7748",
    note: "Curve448; higher security margin than X25519.",
  },
  {
    name: "secp256r1",
    codepoint: 0x0017, // 23
    kind: "ecdhe",
    pq: "classical",
    recommended: true,
    reference: "RFC 8446 / RFC 8422",
    note: "NIST P-256; ubiquitous and FIPS-approved.",
  },
  {
    name: "secp384r1",
    codepoint: 0x0018, // 24
    kind: "ecdhe",
    pq: "classical",
    recommended: true,
    reference: "RFC 8422",
    note: "NIST P-384.",
  },
  {
    name: "secp521r1",
    codepoint: 0x0019, // 25
    kind: "ecdhe",
    pq: "classical",
    recommended: false,
    reference: "RFC 8422",
    note: "NIST P-521; allowed but rarely needed.",
  },
  {
    name: "secp224r1",
    codepoint: 0x0015, // 21
    kind: "ecdhe",
    pq: "classical",
    recommended: false,
    legacy: true,
    reference: "RFC 8422",
    note: "P-224, ~112-bit; deprecated for TLS 1.3.",
  },
  {
    name: "secp192r1",
    codepoint: 0x0013, // 19
    kind: "ecdhe",
    pq: "classical",
    recommended: false,
    legacy: true,
    reference: "RFC 8422",
    note: "P-192, ~96-bit; insecure, do not use.",
  },

  // --- Finite-field DH groups (RFC 7919) ------------------------------------
  {
    name: "ffdhe2048",
    codepoint: 0x0100, // 256
    kind: "ffdhe",
    pq: "classical",
    recommended: false,
    reference: "RFC 7919",
    note: "Finite-field DH, 2048-bit; the practical minimum.",
  },
  {
    name: "ffdhe3072",
    codepoint: 0x0101, // 257
    kind: "ffdhe",
    pq: "classical",
    recommended: false,
    reference: "RFC 7919",
    note: "Finite-field DH, 3072-bit.",
  },
  {
    name: "ffdhe4096",
    codepoint: 0x0102, // 258
    kind: "ffdhe",
    pq: "classical",
    recommended: false,
    reference: "RFC 7919",
    note: "Finite-field DH, 4096-bit.",
  },
  {
    name: "ffdhe6144",
    codepoint: 0x0103, // 259
    kind: "ffdhe",
    pq: "classical",
    recommended: false,
    reference: "RFC 7919",
    note: "Finite-field DH, 6144-bit.",
  },
  {
    name: "ffdhe8192",
    codepoint: 0x0104, // 260
    kind: "ffdhe",
    pq: "classical",
    recommended: false,
    reference: "RFC 7919",
    note: "Finite-field DH, 8192-bit.",
  },
]);

// ----------------------------------------------------------------------------
// Lookup
// ----------------------------------------------------------------------------

/** Format a code point as 0xNNNN (upper-case, 4 hex digits). */
export function formatCodepoint(codepoint: number): string {
  return "0x" + codepoint.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * GREASE values (RFC 8701) for supported_groups are the 16 code points
 * 0x0A0A, 0x1A1A, ... 0xFAFA. They are not real groups; recognizing them keeps
 * the decoder from labelling a deliberately-random advertisement as "unknown".
 */
export function isGreaseGroup(codepoint: number): boolean {
  const hi = (codepoint >> 8) & 0xff;
  const lo = codepoint & 0xff;
  return hi === lo && (hi & 0x0f) === 0x0a;
}

// Name index, lower-cased for case-insensitive matching.
const BY_NAME = new Map(NAMED_GROUPS.map((g) => [g.name.toLowerCase(), g]));
const BY_CODE = new Map(NAMED_GROUPS.map((g) => [g.codepoint, g]));

/** Result of {@link decodeNamedGroup}. */
export type NamedGroupLookup =
  | { match: "name" | "codepoint"; group: NamedGroupRecord }
  | { match: "grease"; codepoint: number }
  | { match: "none" };

/**
 * decodeNamedGroup - resolve a name (e.g. "X25519MLKEM768") or a code point
 * (e.g. "0x11EC", "4588", "11ec") to a registry record.
 * @param input the raw user string
 * @returns a tagged lookup result; never throws
 */
export function decodeNamedGroup(input: string): NamedGroupLookup {
  const s = input.trim();
  if (!s) return { match: "none" };

  // Name match first (unambiguous; code points overlap other registries).
  const byName = BY_NAME.get(s.toLowerCase());
  if (byName) return { match: "name", group: byName };

  // Code-point match: accept 0x-prefixed hex, bare hex, or decimal.
  let code: number | null = null;
  if (/^0x[0-9a-f]{1,4}$/i.test(s)) code = parseInt(s.slice(2), 16);
  else if (/^[0-9]{1,5}$/.test(s)) {
    const dec = parseInt(s, 10);
    if (dec <= 0xffff) code = dec;
  } else if (/^[0-9a-f]{1,4}$/i.test(s)) code = parseInt(s, 16);

  if (code !== null) {
    const byCode = BY_CODE.get(code);
    if (byCode) return { match: "codepoint", group: byCode };
    if (isGreaseGroup(code)) return { match: "grease", codepoint: code };
  }
  return { match: "none" };
}

// ----------------------------------------------------------------------------
// Golden vectors (deterministic correctness gate)
// ----------------------------------------------------------------------------

/** One decode expectation. `name` is checked for name/codepoint matches. */
export interface NamedGroupVector {
  input: string;
  match: NamedGroupLookup["match"];
  /** Expected group name (for name/codepoint matches). */
  name?: string;
  /** Expected code point (for codepoint / grease matches). */
  codepoint?: number;
}

export const NAMED_GROUP_VECTORS: readonly NamedGroupVector[] = Object.freeze([
  // Canonical name -> record
  { input: "X25519MLKEM768", match: "name", name: "X25519MLKEM768" },
  { input: "x25519mlkem768", match: "name", name: "X25519MLKEM768" }, // case-insensitive
  { input: "SecP384r1MLKEM1024", match: "name", name: "SecP384r1MLKEM1024" },
  { input: "x25519", match: "name", name: "x25519" },
  { input: "ffdhe2048", match: "name", name: "ffdhe2048" },
  { input: "X25519Kyber768Draft00", match: "name", name: "X25519Kyber768Draft00" },
  // Code point (hex / 0x / decimal / bare hex) -> record
  { input: "0x11EC", match: "codepoint", name: "X25519MLKEM768", codepoint: 0x11ec },
  { input: "0x11eb", match: "codepoint", name: "SecP256r1MLKEM768", codepoint: 0x11eb },
  { input: "4588", match: "codepoint", name: "X25519MLKEM768", codepoint: 0x11ec },
  { input: "11ec", match: "codepoint", name: "X25519MLKEM768", codepoint: 0x11ec },
  { input: "0x001D", match: "codepoint", name: "x25519", codepoint: 0x001d },
  { input: "23", match: "codepoint", name: "secp256r1", codepoint: 0x0017 },
  { input: "0x0100", match: "codepoint", name: "ffdhe2048", codepoint: 0x0100 },
  { input: "0x6399", match: "codepoint", name: "X25519Kyber768Draft00", codepoint: 0x6399 },
  // GREASE (RFC 8701)
  { input: "0x0A0A", match: "grease", codepoint: 0x0a0a },
  { input: "0xFAFA", match: "grease", codepoint: 0xfafa },
  // No match
  { input: "TLS_AES_128_GCM_SHA256", match: "none" },
  { input: "0xFFFF", match: "none" },
  { input: "", match: "none" },
]);

/** Run all named-group vectors. Returns a pass/fail tally; never throws. */
export function verifyNamedGroupVectors(): {
  passed: number;
  failed: number;
  total: number;
  failures: string[];
} {
  const failures: string[] = [];
  for (const v of NAMED_GROUP_VECTORS) {
    const got = decodeNamedGroup(v.input);
    if (got.match !== v.match) {
      failures.push(`${JSON.stringify(v.input)}: match ${got.match} != ${v.match}`);
      continue;
    }
    if ((got.match === "name" || got.match === "codepoint") && got.group.name !== v.name) {
      failures.push(`${JSON.stringify(v.input)}: name ${got.group.name} != ${v.name}`);
      continue;
    }
    if (got.match === "codepoint" && v.codepoint !== undefined && got.group.codepoint !== v.codepoint) {
      failures.push(`${JSON.stringify(v.input)}: codepoint ${got.group.codepoint} != ${v.codepoint}`);
      continue;
    }
    if (got.match === "grease" && v.codepoint !== undefined && got.codepoint !== v.codepoint) {
      failures.push(`${JSON.stringify(v.input)}: grease codepoint ${got.codepoint} != ${v.codepoint}`);
    }
  }
  return {
    passed: NAMED_GROUP_VECTORS.length - failures.length,
    failed: failures.length,
    total: NAMED_GROUP_VECTORS.length,
    failures,
  };
}
