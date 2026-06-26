// ============================================================================
// src/lib/tools/hash/compute.ts
// ----------------------------------------------------------------------------
// CRYPTOGRAPHIC HASHES - the compute core for the Hash tool.
//
// Uses the platform Web Crypto API (crypto.subtle.digest) rather than a shipped
// JS implementation: it is audited, constant-folded into native code, and
// available in both the browser and modern Node. Because digest() returns a
// Promise, run()/hashAll() are ASYNC here (the one place a tool diverges from
// the sync CIDR/JWT/base64 cores). The digests are still deterministic, so a
// single golden-vector set covers the transform; the runner just awaits.
//
// hashAll() computes SHA-1/256/384/512 in parallel and returns each as hex and
// base64; the UI shows whichever the user selects, so switching algorithms
// never recomputes. Input is hashed as its UTF-8 bytes.
// ============================================================================

/** The digest algorithms this tool computes (also the UI toggle order). */
export type HashAlgorithm = "SHA-256" | "SHA-384" | "SHA-512" | "SHA-1";

/** Order matters: index 0 is the default selection (SHA-256); SHA-1 is last. */
export const HASH_ALGORITHMS: readonly HashAlgorithm[] = [
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHA-1",
];

/** One digest rendered two ways. */
export interface HashDigest {
  hex: string;
  base64: string;
}

/** The deterministic result: every algorithm's digest of the input. */
export interface HashResult {
  input: string;
  digests: Record<HashAlgorithm, HashDigest>;
}

/** Lowercase hex of a byte array. */
function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

/** Standard base64 of a byte array (digests are short, so a single pass is ok). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Digest one algorithm over the given bytes, rendered hex + base64. */
async function digestOne(algorithm: HashAlgorithm, data: BufferSource): Promise<HashDigest> {
  const buffer = await crypto.subtle.digest(algorithm, data);
  const bytes = new Uint8Array(buffer);
  return { hex: bytesToHex(bytes), base64: bytesToBase64(bytes) };
}

/**
 * hashAll - the deterministic (async) entry point. Hashes the input's UTF-8
 * bytes with every supported algorithm, in parallel.
 * @param input arbitrary text to hash
 */
export async function hashAll(input: string): Promise<HashResult> {
  const value = input ?? "";
  const data = new TextEncoder().encode(value);
  const pairs = await Promise.all(
    HASH_ALGORITHMS.map(async (algorithm) => {
      const digest = await digestOne(algorithm, data);
      return [algorithm, digest] as const;
    })
  );
  const digests = Object.fromEntries(pairs) as Record<HashAlgorithm, HashDigest>;
  return { input: value, digests };
}
