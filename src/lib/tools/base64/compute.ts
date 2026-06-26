// ============================================================================
// src/lib/tools/base64/compute.ts
// ----------------------------------------------------------------------------
// BASE64 / BASE64URL - the pure compute core for the Base64 tool.
//
// A base64 codec is inherently two-way, so the deterministic run() does BOTH at
// once: it encodes the input text to standard and URL-safe base64, AND attempts
// to decode the same input as base64. The component shows whichever direction
// the user selects; a single golden-vector set then covers the entire
// transform. run() never throws - encoding always succeeds, and a failed decode
// is reported as { ok: false, reason } rather than an exception.
//
// Decoding is tolerant: it strips ASCII whitespace, accepts URL-safe input
// (-/_), and re-pads to a multiple of four (RFC 4648 permits omitting "="). It
// also reports whether the decoded bytes are valid UTF-8, so a base64-encoded
// binary blob is flagged rather than shown as mojibake. Browser + Node safe
// (btoa/atob/TextEncoder/TextDecoder are global in both).
// ============================================================================

/** Why a decode attempt failed. */
export type Base64DecodeReason = "invalid-characters" | "invalid-length";

/** A successful decode: the bytes, their UTF-8 rendering, and a validity flag. */
export interface Base64Decoded {
  ok: true;
  /** Lenient UTF-8 rendering of the decoded bytes (may contain U+FFFD). */
  text: string;
  /** Number of decoded bytes. */
  byteLength: number;
  /** True only if the bytes are valid UTF-8 (a strict decode succeeded). */
  isUtf8: boolean;
}

/** A failed decode, with a stable reason code. */
export interface Base64DecodeFailure {
  ok: false;
  reason: Base64DecodeReason;
}

/** The deterministic result of analyzing an input both ways. */
export interface Base64Result {
  input: string;
  /** The input text encoded to base64, standard and URL-safe (no padding). */
  encoded: { standard: string; urlSafe: string };
  /** The input interpreted as base64 and decoded (tolerant of variant). */
  decoded: Base64Decoded | Base64DecodeFailure;
}

/** Base64-encode raw bytes (chunked so large inputs do not blow the stack). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Encode text (as UTF-8) to standard and URL-safe base64. */
function encodeText(text: string): { standard: string; urlSafe: string } {
  const bytes = new TextEncoder().encode(text);
  const standard = bytesToBase64(bytes);
  // URL-safe alphabet (RFC 4648 section 5), conventionally without padding.
  const urlSafe = standard.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { standard, urlSafe };
}

/** Decode an input as base64 (tolerant of whitespace, URL-safe chars, padding). */
function decodeBase64(input: string): Base64Decoded | Base64DecodeFailure {
  // Normalize: drop ASCII whitespace, fold URL-safe alphabet to standard.
  const cleaned = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (cleaned === "") return { ok: true, text: "", byteLength: 0, isUtf8: true };

  const remainder = cleaned.length % 4;
  // A length of 4n+1 cannot encode any byte sequence: it is simply malformed.
  if (remainder === 1) return { ok: false, reason: "invalid-length" };
  const padded = cleaned + (remainder === 0 ? "" : "=".repeat(4 - remainder));

  // Padding only at the end, 0-2 of it; anything else is a stray character.
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) {
    return { ok: false, reason: "invalid-characters" };
  }

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return { ok: false, reason: "invalid-length" };
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  let isUtf8 = true;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    isUtf8 = false;
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return { ok: true, text, byteLength: bytes.length, isUtf8 };
}

/**
 * analyzeBase64 - the deterministic entry point. Encodes the input and also
 * attempts to decode it; never throws.
 * @param input arbitrary text (to encode) or a base64 string (to decode)
 */
export function analyzeBase64(input: string): Base64Result {
  const value = input ?? "";
  return {
    input: value,
    encoded: encodeText(value),
    decoded: decodeBase64(value),
  };
}
