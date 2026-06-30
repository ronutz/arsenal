// ============================================================================
// src/lib/tools/totp-hotp/compute.ts
// ----------------------------------------------------------------------------
// HOTP (RFC 4226) and TOTP (RFC 6238) - the compute core for the OTP tool.
//
// Both algorithms reduce to ONE operation: HMAC the shared secret over an
// 8-byte moving factor, then apply RFC 4226 "dynamic truncation" to squeeze the
// MAC down to a short decimal code. The only difference is what the moving
// factor is:
//   - HOTP: an explicit event counter C.
//   - TOTP: a time step  T = floor((unixTime - T0) / step)  (T0=0, step=30s by
//     default). So TOTP is just HOTP whose counter is derived from the clock.
//
// DETERMINISM (D-49): the engine takes the time as an EXPLICIT input, never
// reads a clock itself. "Use the current time" is a convenience the UI layer
// supplies by passing Date.now()/1000; the engine stays a pure function of its
// inputs, which is what lets a single golden-vector set (the RFC test vectors)
// pin it. PRIVACY: the secret is a credential and never leaves the browser -
// everything here runs on Web Crypto (crypto.subtle), no network.
//
// The HMAC uses the same crypto.subtle import-key + sign path as the HMAC and
// JWT tools, so all three agree by construction. ASYNC because Web Crypto is.
// ============================================================================

/** Hash backing the HMAC. RFC 4226 is SHA-1 only; RFC 6238 adds SHA-256/512. */
export type OtpAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

/** The two algorithms this tool covers. Index 0 ("totp") is the UI default. */
export type OtpMode = "totp" | "hotp";

/** How the secret string is encoded. Base32 is what authenticator apps and
 *  otpauth:// URIs use, so it is the UI default; hex and ASCII cover the rest
 *  (the RFC test vectors are ASCII). */
export type SecretEncoding = "base32" | "hex" | "ascii";

export const OTP_ALGORITHMS: readonly OtpAlgorithm[] = ["SHA-1", "SHA-256", "SHA-512"];
export const OTP_MODES: readonly OtpMode[] = ["totp", "hotp"];
export const SECRET_ENCODINGS: readonly SecretEncoding[] = ["base32", "hex", "ascii"];

/** The inputs to one OTP computation. */
export interface OtpInput {
  mode: OtpMode;
  secret: string;
  secretEncoding: SecretEncoding;
  algorithm: OtpAlgorithm;
  /** Code length; RFC examples use 6 (HOTP) and 8 (TOTP test vectors). */
  digits: number;
  // -- HOTP --
  /** The event counter C (HOTP only). */
  counter?: number;
  // -- TOTP --
  /** Unix time in seconds (TOTP only). The engine never reads a clock. */
  timestamp?: number;
  /** Time-step length X in seconds (TOTP only). Default 30. */
  step?: number;
  /** Epoch start T0 in seconds (TOTP only). Default 0. */
  t0?: number;
}

/** The deterministic result, including the intermediate values the UI shows so
 *  a learner can see exactly how the code was derived. */
export interface OtpResult {
  /** The final zero-padded one-time code. */
  code: string;
  /** The moving factor that was actually HMAC'd (HOTP's C, or TOTP's T). */
  movingFactor: number;
  /** The full HMAC, lowercase hex (the bytes truncation runs on). */
  hmacHex: string;
  /** RFC 4226 dynamic-truncation offset (low nibble of the HMAC's last byte). */
  offset: number;
  /** The 31-bit big-endian value extracted at `offset`, before the modulo. */
  binaryCode: number;
  algorithm: OtpAlgorithm;
  digits: number;
  /** For TOTP: how many seconds remain in the current step (UI countdown).
   *  Undefined for HOTP. Derived purely from the supplied timestamp. */
  secondsRemaining?: number;
}

// ---------------------------------------------------------------------------
// Secret decoding
// ---------------------------------------------------------------------------

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // RFC 4648, no padding chars

/** Decode an RFC 4648 Base32 string to bytes. Case-insensitive; spaces and '='
 *  padding are ignored (authenticator secrets are often shown space-grouped).
 *  Throws on an out-of-alphabet character so the UI can flag a bad secret. */
function base32ToBytes(input: string): Uint8Array {
  const clean = input.replace(/[\s=]/g, "").toUpperCase();
  if (clean === "") return new Uint8Array(0);
  let bits = 0;        // accumulator of pending bits
  let value = 0;       // accumulated value
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`invalid Base32 character: ${ch}`);
    value = (value << 5) | idx;   // each Base32 symbol carries 5 bits
    bits += 5;
    if (bits >= 8) {              // whenever we have a whole byte, emit it
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

/** Decode a hex string to bytes. Whitespace and a leading 0x are tolerated. */
function hexToBytes(input: string): Uint8Array {
  const clean = input.replace(/^0x/i, "").replace(/\s/g, "");
  if (clean.length % 2 !== 0) throw new Error("hex secret has an odd number of digits");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) throw new Error("invalid hex in secret");
    out[i] = byte;
  }
  return out;
}

/** Resolve the secret string + its declared encoding to raw key bytes. */
export function decodeSecret(secret: string, encoding: SecretEncoding): Uint8Array {
  switch (encoding) {
    case "base32": return base32ToBytes(secret);
    case "hex": return hexToBytes(secret);
    case "ascii": return new TextEncoder().encode(secret);
  }
}

// ---------------------------------------------------------------------------
// HOTP / TOTP core
// ---------------------------------------------------------------------------

/** The moving factor as an 8-byte, big-endian buffer (RFC 4226 section 5.1).
 *  JS bitwise ops are 32-bit, so the 64-bit counter is split into a high and a
 *  low 32-bit word and written big-endian across the 8 bytes. */
function movingFactorToBytes(counter: number): Uint8Array {
  const buf = new Uint8Array(8);
  // Use BigInt to stay exact for counters above 2^32 (e.g. RFC 6238's large T).
  let c = BigInt(Math.trunc(counter));
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(c & 0xffn);
    c >>= 8n;
  }
  return buf;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

/**
 * computeOtp - the deterministic (async) entry point.
 *
 * 1. Decode the secret to key bytes.
 * 2. Derive the moving factor: HOTP uses `counter`; TOTP computes
 *    T = floor((timestamp - t0) / step).
 * 3. HMAC the 8-byte moving factor under the chosen hash.
 * 4. RFC 4226 dynamic truncation: take the low 4 bits of the HMAC's LAST byte
 *    as an offset, read the 4 bytes there big-endian, clear the top bit to keep
 *    it a positive 31-bit number, then take it modulo 10^digits and zero-pad.
 */
export async function computeOtp(input: OtpInput): Promise<OtpResult> {
  const digits = Math.max(1, Math.min(10, Math.trunc(input.digits)));
  const keyBytes = decodeSecret(input.secret ?? "", input.secretEncoding);

  // -- moving factor --
  let movingFactor: number;
  let secondsRemaining: number | undefined;
  if (input.mode === "hotp") {
    movingFactor = Math.max(0, Math.trunc(input.counter ?? 0));
  } else {
    const step = input.step && input.step > 0 ? Math.trunc(input.step) : 30;
    const t0 = Math.trunc(input.t0 ?? 0);
    const ts = Math.trunc(input.timestamp ?? 0);
    movingFactor = Math.floor((ts - t0) / step);
    // How long the current code stays valid - purely a function of `ts`.
    secondsRemaining = step - (((ts - t0) % step) + step) % step;
  }

  // -- HMAC the moving factor --
  const counterBytes = movingFactorToBytes(movingFactor);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "HMAC", hash: input.algorithm },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, counterBytes as unknown as BufferSource)
  );

  // -- RFC 4226 dynamic truncation --
  const offset = sig[sig.length - 1] & 0x0f;
  const binaryCode =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  const code = (binaryCode % 10 ** digits).toString().padStart(digits, "0");

  return {
    code,
    movingFactor,
    hmacHex: bytesToHex(sig),
    offset,
    binaryCode,
    algorithm: input.algorithm,
    digits,
    secondsRemaining,
  };
}
