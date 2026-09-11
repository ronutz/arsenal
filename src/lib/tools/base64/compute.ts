// ============================================================================
// src/lib/tools/base64/compute.ts
// ----------------------------------------------------------------------------
// UNIFIED TEXT-ENCODING CODEC - the pure compute core for the Base64 tool,
// generalized (merge M5) to five RFC codecs that all map between text/bytes and
// an ASCII-safe representation:
//
//   base64     RFC 4648 section 4   A-Za-z0-9 + /   (padded with =)
//   base64url  RFC 4648 section 5   A-Za-z0-9 - _   (padding stripped)
//   base32     RFC 4648 section 6   A-Z 2-7         (padded with =)
//   base16     RFC 4648 section 8   0-9 A-F         (hex, no padding)
//   percent    RFC 3986 section 2   unreserved kept, the rest %XX
//
// Every codec is two-way, so the deterministic analyzeCodec() does BOTH
// directions for ALL codecs at once: it encodes the input under each codec AND
// attempts to decode the same input under each codec. The component shows
// whichever codec + direction the user selects; one golden-vector set then
// covers the whole transform. It never throws - encoding always succeeds and a
// failed decode is reported as { ok: false, reason }. Decoding is tolerant: it
// strips ASCII whitespace and ignores trailing padding where the RFC permits.
// Each decode reports whether the bytes are valid UTF-8, so a binary blob is
// flagged rather than shown as mojibake. Browser + Node safe (btoa/atob/
// TextEncoder/TextDecoder are global in both).
// ============================================================================

/** The five supported codecs. */
export type Codec = "base64" | "base64url" | "base32" | "base16" | "percent";

/** Codec list in display order (also the iteration order when analyzing). */
export const CODECS: readonly Codec[] = ["base64", "base64url", "base32", "base16", "percent"] as const;

/** Why a decode attempt failed. */
export type CodecDecodeReason = "invalid-characters" | "invalid-length" | "invalid-escape";

/** A successful decode: the bytes, their UTF-8 rendering, and a validity flag. */
export interface CodecDecoded {
  ok: true;
  /** Lenient UTF-8 rendering of the decoded bytes (may contain U+FFFD). */
  text: string;
  /** Number of decoded bytes. */
  byteLength: number;
  /** True only if the bytes are valid UTF-8 (a strict decode succeeded). */
  isUtf8: boolean;
}

/** A failed decode, with a stable reason code. */
export interface CodecDecodeFailure {
  ok: false;
  reason: CodecDecodeReason;
}

export type CodecDecodeResult = CodecDecoded | CodecDecodeFailure;

/** The deterministic result of analyzing an input under every codec, both ways. */
export interface CodecResult {
  input: string;
  /** input encoded under each codec. */
  encoded: Record<Codec, string>;
  /** input interpreted and decoded under each codec. */
  decoded: Record<Codec, CodecDecodeResult>;
}

// --- shared byte <-> UTF-8 helpers ------------------------------------------

function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesToUtf8(bytes: Uint8Array): { text: string; isUtf8: boolean } {
  let isUtf8 = true;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    isUtf8 = false;
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return { text, isUtf8 };
}

function decodedBytes(bytes: Uint8Array): CodecDecoded {
  const { text, isUtf8 } = bytesToUtf8(bytes);
  return { ok: true, text, byteLength: bytes.length, isUtf8 };
}

const EMPTY: CodecDecoded = { ok: true, text: "", byteLength: 0, isUtf8: true };
const HEX = "0123456789ABCDEF";

// --- base64 / base64url (RFC 4648 sections 4 & 5) ---------------------------

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000; // chunk so large inputs do not blow the call stack
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64Encode(bytes: Uint8Array, urlSafe: boolean): string {
  const std = bytesToBase64(bytes);
  return urlSafe
    ? std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : std;
}

function base64Decode(input: string): CodecDecodeResult {
  // Tolerant: drop whitespace, fold the URL-safe alphabet to standard, re-pad.
  const cleaned = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (cleaned === "") return EMPTY;
  const remainder = cleaned.length % 4;
  if (remainder === 1) return { ok: false, reason: "invalid-length" };
  const padded = cleaned + (remainder === 0 ? "" : "=".repeat(4 - remainder));
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
  return decodedBytes(bytes);
}

// --- base32 (RFC 4648 section 6) --------------------------------------------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += "=";
  return out;
}

function base32Decode(input: string): CodecDecodeResult {
  const cleaned = input.replace(/\s+/g, "").replace(/=+$/, "").toUpperCase();
  if (cleaned === "") return EMPTY;
  if (!/^[A-Z2-7]*$/.test(cleaned)) return { ok: false, reason: "invalid-characters" };
  // Only residues 0/2/4/5/7 mod 8 come from whole bytes; 1/3/6 cannot.
  const mod = cleaned.length % 8;
  if (mod === 1 || mod === 3 || mod === 6) return { ok: false, reason: "invalid-length" };
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    value = (value << 5) | B32.indexOf(cleaned[i]);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return decodedBytes(new Uint8Array(out));
}

// --- base16 / hex (RFC 4648 section 8) --------------------------------------

function base16Encode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[bytes[i] >>> 4] + HEX[bytes[i] & 15];
  }
  return out;
}

function base16Decode(input: string): CodecDecodeResult {
  const cleaned = input.replace(/\s+/g, "");
  if (cleaned === "") return EMPTY;
  if (!/^[0-9A-Fa-f]*$/.test(cleaned)) return { ok: false, reason: "invalid-characters" };
  if (cleaned.length % 2 !== 0) return { ok: false, reason: "invalid-length" };
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return decodedBytes(bytes);
}

// --- percent-encoding (RFC 3986 section 2) ----------------------------------

function isUnreserved(b: number): boolean {
  // ALPHA / DIGIT / "-" / "." / "_" / "~"
  return (
    (b >= 0x41 && b <= 0x5a) ||
    (b >= 0x61 && b <= 0x7a) ||
    (b >= 0x30 && b <= 0x39) ||
    b === 0x2d || b === 0x2e || b === 0x5f || b === 0x7e
  );
}

function percentEncode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += isUnreserved(b) ? String.fromCharCode(b) : "%" + HEX[b >>> 4] + HEX[b & 15];
  }
  return out;
}

function percentDecode(input: string): CodecDecodeResult {
  if (input === "") return EMPTY;
  const out: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "%") {
      const hex = input.substr(i + 1, 2);
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) return { ok: false, reason: "invalid-escape" };
      out.push(parseInt(hex, 16));
      i += 2;
    } else {
      // a literal character contributes its own UTF-8 bytes
      const enc = toBytes(ch);
      for (let j = 0; j < enc.length; j++) out.push(enc[j]);
    }
  }
  return decodedBytes(new Uint8Array(out));
}

// --- dispatcher --------------------------------------------------------------

function encodeWith(codec: Codec, bytes: Uint8Array): string {
  switch (codec) {
    case "base64": return base64Encode(bytes, false);
    case "base64url": return base64Encode(bytes, true);
    case "base32": return base32Encode(bytes);
    case "base16": return base16Encode(bytes);
    case "percent": return percentEncode(bytes);
  }
}

function decodeWith(codec: Codec, input: string): CodecDecodeResult {
  switch (codec) {
    case "base64":
    case "base64url": return base64Decode(input);
    case "base32": return base32Decode(input);
    case "base16": return base16Decode(input);
    case "percent": return percentDecode(input);
  }
}

/**
 * analyzeCodec - the deterministic entry point. Encodes the input under every
 * codec and also attempts to decode it under every codec; never throws.
 * @param input arbitrary text (to encode) or an encoded string (to decode)
 */
export function analyzeCodec(input: string): CodecResult {
  const value = input ?? "";
  const bytes = toBytes(value);
  const encoded = {} as Record<Codec, string>;
  const decoded = {} as Record<Codec, CodecDecodeResult>;
  for (const codec of CODECS) {
    encoded[codec] = encodeWith(codec, bytes);
    decoded[codec] = decodeWith(codec, value);
  }
  return { input: value, encoded, decoded };
}
