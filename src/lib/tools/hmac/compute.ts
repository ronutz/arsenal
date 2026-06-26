// ============================================================================
// src/lib/tools/hmac/compute.ts
// ----------------------------------------------------------------------------
// HMAC (keyed hash) - the compute core for the HMAC tool.
//
// HMAC needs TWO inputs (a message and a key) plus an algorithm, so unlike the
// single-string tools this run takes a small object. It uses the same Web
// Crypto path the JWT verifier uses (importKey "raw" + sign "HMAC"), so this
// tool and the JWT HS256 check agree by construction. ASYNC (Web Crypto), and
// deterministic, so a single golden-vector set covers it.
//
// NOTE on types: enc.encode() returns Uint8Array<ArrayBuffer>, which satisfies
// BufferSource directly - the values are passed straight to importKey/sign
// without being widened through a plain `Uint8Array` parameter (the subtlety
// that bit the hash tool).
// ============================================================================

/** The HMAC variants this tool computes (also the UI toggle order). */
export type HmacAlgorithm = "SHA-256" | "SHA-384" | "SHA-512";

/** Order matters: index 0 is the default selection (SHA-256). */
export const HMAC_ALGORITHMS: readonly HmacAlgorithm[] = ["SHA-256", "SHA-384", "SHA-512"];

/** The inputs to one HMAC computation. */
export interface HmacInput {
  message: string;
  key: string;
  algorithm: HmacAlgorithm;
}

/** The deterministic result: the MAC rendered hex + base64. */
export interface HmacResult {
  algorithm: HmacAlgorithm;
  hex: string;
  base64: string;
}

/** Lowercase hex of a byte array. */
function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

/** Standard base64 of a byte array (a MAC is short, so a single pass is fine). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * computeHmac - the deterministic (async) entry point. Computes HMAC over the
 * message's UTF-8 bytes, keyed by the key's UTF-8 bytes.
 */
export async function computeHmac(input: HmacInput): Promise<HmacResult> {
  const enc = new TextEncoder();
  const keyData = enc.encode(input.key ?? "");
  const messageData = enc.encode(input.message ?? "");
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: input.algorithm },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const bytes = new Uint8Array(signature);
  return { algorithm: input.algorithm, hex: bytesToHex(bytes), base64: bytesToBase64(bytes) };
}
