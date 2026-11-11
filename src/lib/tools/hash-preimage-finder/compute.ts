// ============================================================================
// src/lib/tools/hash-preimage-finder/compute.ts
// ----------------------------------------------------------------------------
// A BOUNDED brute-force hash preimage finder, built as a teaching tool: it
// demonstrates why fast, unsalted hashes fail for low-entropy inputs, and why
// they hold for anything with real entropy. It does NOT use a dictionary, a
// wordlist, or a precomputed table (unlike, say, crackstation.net) - it simply
// enumerates candidates over a chosen alphabet and hashes each one locally,
// which is the only preimage approach consistent with our zero-stored-data,
// local-compute nature.
//
// WHY IT IS SAFE / EDUCATIONAL (and not a control-defeat capability, D-53): the
// search is exhaustive over a small, capped keyspace, so it only ever recovers
// inputs that are already known to be weak (short PINs, short lowercase, etc.).
// It ships no wordlist and cannot touch salted or slow-KDF-protected hashes, so
// it offers no real attack uplift over the plain fact that "weak hashes are
// weak." Its purpose is to show that fact, and to motivate the standard defenses
// (salting defeats precomputed tables; slow KDFs defeat brute force; algorithm
// choice matters). It is browser-only by design (not exposed over the HTTP API),
// because an unbounded search endpoint on a shared edge is compute-abusable.
//
// The three hashes are implemented synchronously in-house because SubtleCrypto
// is async (unusable in a tight search loop) and has no MD5 at all. All three
// are verified against published test vectors in golden-vectors.ts.
// ============================================================================

// ---- Types ------------------------------------------------------------------

/** The fast hash algorithms this tool can search against. */
export type HashAlgo = "md5" | "sha1" | "sha256";

/** The candidate alphabets on offer, smallest (fastest) first. */
export type CharsetId = "digits" | "lower" | "lower-digits" | "mixed-alpha" | "mixed-alnum";

export interface PreimageInput {
  /** The target hash, as a hex string (case-insensitive). */
  hash: string;
  /** Which alphabet to enumerate. */
  charset: CharsetId;
  /** Maximum candidate length (clamped to the alphabet's ceiling). */
  maxLength: number;
  /** Candidates to try in THIS call (clamped to a hard per-call limit). The UI
   *  calls run() repeatedly with startIndex to slice a longer search across
   *  frames; a single call never blocks the page for long. */
  maxCandidates?: number;
  /** Resume point: the global candidate index to start from (default 0). */
  startIndex?: number;
}

export interface PreimageResult {
  algorithm: HashAlgo;
  /** The normalized (lowercase) target hash. */
  target: string;
  charset: CharsetId;
  /** The literal characters of the chosen alphabet. */
  charsetChars: string;
  maxLength: number;
  /** Total number of candidates in this keyspace (all lengths 1..maxLength). */
  keyspaceSize: number;
  /** Candidates tried in this call. */
  attempts: number;
  /** Global index to resume from on the next call. */
  nextIndex: number;
  /** True if a preimage was found. */
  found: boolean;
  /** The recovered input, when found. */
  preimage?: string;
  /** True if the entire keyspace was searched with no match. */
  exhausted: boolean;
  /** True if the call stopped at the candidate budget with keyspace remaining. */
  budgetReached: boolean;
  /** A fast hash is unsuitable for password storage (all three here are fast). */
  fast: boolean;
  /** A cryptographically broken hash (md5, sha1). */
  broken: boolean;
}

// ---- Hash primitives (verified against known vectors) -----------------------

const rotl = (x: number, n: number): number => (x << n) | (x >>> (32 - n));
const toHexLE = (words: number[]): string => {
  let s = "";
  for (const w of words) for (let i = 0; i < 4; i++) s += ((w >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
  return s;
};
const toHexBE = (words: number[]): string => words.map((w) => (w >>> 0).toString(16).padStart(8, "0")).join("");

/** ASCII bytes of a candidate string (all our alphabets are ASCII). */
const asciiBytes = (str: string): Uint8Array => {
  const b = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) b[i] = str.charCodeAt(i) & 0xff;
  return b;
};
/** UTF-8 bytes, used only by the standalone hashString() helper. */
const utf8Bytes = (str: string): Uint8Array => new TextEncoder().encode(str);

// MD5 (RFC 1321).
const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];
const MD5_K = ((): number[] => {
  const k: number[] = [];
  for (let i = 0; i < 64; i++) k.push(Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296));
  return k;
})();
function md5(bytes: Uint8Array): string {
  const ol = bytes.length;
  const bitLen = ol * 8;
  const total = ((ol + 1 + 8 + 63) & ~63);
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[ol] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(total - 8, bitLen >>> 0, true);
  dv.setUint32(total - 4, Math.floor(bitLen / 4294967296), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < total; off += 64) {
    const M: number[] = [];
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + MD5_K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, MD5_S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  return toHexLE([a0, b0, c0, d0]);
}

// SHA-1 (RFC 3174).
function sha1(bytes: Uint8Array): string {
  const ol = bytes.length;
  const bitLen = ol * 8;
  const total = ((ol + 1 + 8 + 63) & ~63);
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[ol] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(total - 8, Math.floor(bitLen / 4294967296), false);
  dv.setUint32(total - 4, bitLen >>> 0, false);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Array<number>(80);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const t = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = t;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
  }
  return toHexBE([h0, h1, h2, h3, h4]);
}

// SHA-256 (FIPS 180-4).
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
function sha256(bytes: Uint8Array): string {
  const ol = bytes.length;
  const bitLen = ol * 8;
  const total = ((ol + 1 + 8 + 63) & ~63);
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[ol] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(total - 8, Math.floor(bitLen / 4294967296), false);
  dv.setUint32(total - 4, bitLen >>> 0, false);
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
    h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array<number>(64);
  const R = (x: number, n: number): number => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = R(w[i - 15], 7) ^ R(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = R(w[i - 2], 17) ^ R(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = R(e, 6) ^ R(e, 11) ^ R(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[i] + w[i]) | 0;
      const S0 = R(a, 2) ^ R(a, 13) ^ R(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return toHexBE([h0, h1, h2, h3, h4, h5, h6, h7]);
}

const HASHERS: Record<HashAlgo, (b: Uint8Array) => string> = { md5, sha1, sha256 };

/** Fast (password-unsuitable) + broken (collision-attacked) flags per algorithm. */
export const ALGO_META: Record<HashAlgo, { fast: boolean; broken: boolean; bits: number }> = {
  md5: { fast: true, broken: true, bits: 128 },
  sha1: { fast: true, broken: true, bits: 160 },
  sha256: { fast: true, broken: false, bits: 256 },
};

/** Hash an arbitrary UTF-8 string; exposed for the UI's "confirm" display. */
export function hashString(algo: HashAlgo, str: string): string {
  return HASHERS[algo](utf8Bytes(str));
}

/** Detect the algorithm from the hash length (32/40/64 hex chars). */
export function detectAlgorithm(hash: string): HashAlgo | null {
  const h = hash.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(h)) return null;
  if (h.length === 32) return "md5";
  if (h.length === 40) return "sha1";
  if (h.length === 64) return "sha256";
  return null;
}

// ---- Keyspace enumeration ---------------------------------------------------

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

/** Alphabet characters and the maximum length offered for each (a soft ceiling
 *  that keeps the keyspace within safe-integer range; the real limiter is the
 *  per-call candidate budget). */
export const CHARSETS: Record<CharsetId, { chars: string; maxLength: number; label: string }> = {
  "digits": { chars: DIGITS, maxLength: 12, label: "Digits (0-9)" },
  "lower": { chars: LOWER, maxLength: 7, label: "Lowercase (a-z)" },
  "lower-digits": { chars: LOWER + DIGITS, maxLength: 6, label: "Lowercase + digits" },
  "mixed-alpha": { chars: LOWER + UPPER, maxLength: 6, label: "Mixed-case letters" },
  "mixed-alnum": { chars: LOWER + UPPER + DIGITS, maxLength: 5, label: "Mixed-case + digits" },
};

/** Hard cap on candidates tried in a single run() call, so one call cannot block
 *  the page for long. The UI slices a longer search into many such calls. */
export const MAX_CANDIDATES_PER_CALL = 3_000_000;

/** Number of candidates of all lengths 1..maxLength over an alphabet of size b. */
export function keyspaceSize(base: number, maxLength: number): number {
  let total = 0;
  let p = 1;
  for (let len = 1; len <= maxLength; len++) {
    p *= base;
    total += p;
  }
  return total;
}

/** The candidate at a global index (0-based), enumerating by increasing length
 *  then lexicographically within a length. Returns null past the keyspace. */
export function candidateAt(index: number, chars: string, maxLength: number): string | null {
  const base = chars.length;
  let i = index;
  let len = 1;
  let countThisLen = base;
  while (i >= countThisLen) {
    i -= countThisLen;
    len++;
    if (len > maxLength) return null;
    countThisLen *= base;
  }
  let s = "";
  for (let k = 0; k < len; k++) {
    s = chars[i % base] + s;
    i = Math.floor(i / base);
  }
  return s;
}

// ---- The bounded search -----------------------------------------------------

/**
 * Search a slice of the keyspace for a preimage of the target hash. Enumerates
 * candidates [startIndex, startIndex + budget), hashing each, and stops on the
 * first match, at the end of the keyspace, or when the budget is spent.
 */
export function run(input: PreimageInput): PreimageResult {
  const target = input.hash.trim().toLowerCase();
  const algorithm = detectAlgorithm(target);
  if (!algorithm) {
    throw new Error(
      "Not a recognized hash. Expected a hex MD5 (32 chars), SHA-1 (40), or SHA-256 (64).",
    );
  }
  const preset = CHARSETS[input.charset];
  if (!preset) throw new Error(`Unknown charset '${input.charset}'.`);

  const maxLength = Math.max(1, Math.min(input.maxLength, preset.maxLength));
  const chars = preset.chars;
  const base = chars.length;
  const total = keyspaceSize(base, maxLength);
  const hasher = HASHERS[algorithm];

  const start = Math.max(0, Math.floor(input.startIndex ?? 0));
  const budget = Math.max(1, Math.min(input.maxCandidates ?? MAX_CANDIDATES_PER_CALL, MAX_CANDIDATES_PER_CALL));
  const end = Math.min(start + budget, total);

  const meta = ALGO_META[algorithm];
  const base_result = {
    algorithm,
    target,
    charset: input.charset,
    charsetChars: chars,
    maxLength,
    keyspaceSize: total,
    fast: meta.fast,
    broken: meta.broken,
  };

  for (let idx = start; idx < end; idx++) {
    const candidate = candidateAt(idx, chars, maxLength);
    if (candidate === null) break; // past keyspace (guard; end already clamps)
    if (hasher(asciiBytes(candidate)) === target) {
      return {
        ...base_result,
        attempts: idx - start + 1,
        nextIndex: idx + 1,
        found: true,
        preimage: candidate,
        exhausted: false,
        budgetReached: false,
      };
    }
  }

  const exhausted = end >= total;
  return {
    ...base_result,
    attempts: end - start,
    nextIndex: end,
    found: false,
    exhausted,
    budgetReached: !exhausted,
  };
}
