// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/crypto.ts
// ----------------------------------------------------------------------------
// THE SYNC CODE AND THE ENCRYPTION, IN THE BROWSER (the desk's optional sync,
// PRIME 12/11/2026 12:42; the sync contract of the build spec, followed to the
// letter by this file and by the Worker's worker/desk.ts).
//
// THE CODE. 20 random bytes from crypto.getRandomValues, written as 32
// Crockford base-32 characters in groups of four. The reader keeps it; the site
// never sees it. Typing is forgiving: case, spaces and hyphens do not matter,
// and the letters Crockford's alphabet leaves out are read as the digits they
// look like (I and L as 1, O as 0).
//
// FROM THE CODE, TWO THINGS ARE DERIVED HERE AND NOWHERE ELSE:
//   id  = the first 32 hex characters of SHA-256 over the UTF-8 of
//         "ronutz-desk-id:" + the normalized code: the name the server stores
//         the copy under. It cannot be turned back into the code.
//   key = HKDF-SHA-256 with the 20 code bytes as input key material, salt
//         "ronutz-desk", info "aes-gcm-256 v1": an AES-GCM 256-bit key that
//         never leaves the browser.
//
// THE BLOB. A fresh 12-byte IV, then the AES-GCM ciphertext of the UTF-8 JSON
// of the synced part of the desk; stored as base64url without padding of the IV
// followed by the ciphertext. The server holds that string and cannot read it.
// Everything uses the browser's own WebCrypto (crypto.subtle): no library.
// ============================================================================

/** Crockford's base-32 alphabet: digits and letters without I, L, O and U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** How many random bytes a code carries. */
const CODE_BYTES = 20;

/** The fixed prefix hashed with the code to name the server's copy. */
const ID_PREFIX = "ronutz-desk-id:";

/** HKDF's salt. */
const HKDF_SALT = "ronutz-desk";

/** HKDF's info: what the derived key is for, with a version. */
const HKDF_INFO = "aes-gcm-256 v1";

/** The length of AES-GCM's IV, in bytes. */
const IV_BYTES = 12;

/** UTF-8 in and out. */
const enc = new TextEncoder();

/** UTF-8 decoding. */
const dec = new TextDecoder();

/**
 * Whether this browser can sync at all (WebCrypto's subtle interface, which needs a secure page).
 *
 * @returns true when crypto.subtle is there
 */
export function canSync(): boolean {
  // The subtle interface exists only on secure pages (https, or localhost).
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof crypto.getRandomValues === "function";
}

/**
 * Bytes to Crockford base-32 (5 bits per character, most significant first).
 *
 * @param bytes the bytes (20 of them make 32 characters exactly)
 * @returns the characters
 */
function toBase32(bytes: Uint8Array): string {
  // The characters.
  let out = "";
  // Bits waiting to be written, and how many.
  let buffer = 0;
  // How many bits the buffer holds.
  let bits = 0;
  // Each byte adds eight bits.
  for (const b of bytes) {
    // Shifted in.
    buffer = (buffer << 8) | b;
    // Eight more.
    bits += 8;
    // Every full group of five becomes a character.
    while (bits >= 5) {
      // The top five bits.
      out += ALPHABET[(buffer >> (bits - 5)) & 31];
      // Five fewer.
      bits -= 5;
    }
    // Only the bits still waiting are kept (the buffer stays small).
    buffer &= (1 << bits) - 1;
  }
  // A last partial group, padded with zero bits (never needed for 20 bytes).
  if (bits > 0) out += ALPHABET[(buffer << (5 - bits)) & 31];
  // Done.
  return out;
}

/**
 * Crockford base-32 back to bytes.
 *
 * @param text normalized characters
 * @returns the bytes, or null when a character is not in the alphabet
 */
function fromBase32(text: string): Uint8Array<ArrayBuffer> | null {
  // The bytes.
  const out: number[] = [];
  // Bits waiting.
  let buffer = 0;
  // How many.
  let bits = 0;
  // Each character adds five bits.
  for (const ch of text) {
    // Its value.
    const v = ALPHABET.indexOf(ch);
    // Not in the alphabet.
    if (v < 0) return null;
    // Shifted in.
    buffer = (buffer << 5) | v;
    // Five more.
    bits += 5;
    // Every full byte comes out.
    if (bits >= 8) {
      // The top eight bits.
      out.push((buffer >> (bits - 8)) & 255);
      // Eight fewer.
      bits -= 8;
      // Only the waiting bits kept.
      buffer &= (1 << bits) - 1;
    }
  }
  // The bytes.
  return new Uint8Array(out);
}

/**
 * A code as typed, made canonical: upper case, no spaces or hyphens, I and L read as 1, O as 0.
 *
 * @param typed what the reader typed or pasted
 * @returns the normalized code (which may still be invalid)
 */
export function normalizeCode(typed: string): string {
  // Upper case, separators gone, look-alike letters read as their digits.
  return typed.toUpperCase().replace(/[\s-]+/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
}

/**
 * Whether a normalized code is a well-formed sync code.
 *
 * @param code a normalized code
 * @returns true for 32 characters of the alphabet
 */
export function isValidCode(code: string): boolean {
  // Exactly 32 characters, each from the alphabet.
  return /^[0-9A-HJKMNP-TV-Z]{32}$/.test(code);
}

/**
 * A new sync code: 20 random bytes from the browser's cryptographic generator.
 *
 * @returns the normalized code (32 characters)
 */
export function newSyncCode(): string {
  // The random bytes.
  const bytes = new Uint8Array(CODE_BYTES);
  // From the cryptographic generator, never Math.random.
  crypto.getRandomValues(bytes);
  // Written in the alphabet.
  return toBase32(bytes);
}

/**
 * A code as shown to the reader: groups of four, separated by hyphens.
 *
 * @param code a normalized code
 * @returns e.g. "7K2M-9QXA-..."
 */
export function formatCode(code: string): string {
  // Cut into fours and joined.
  return (code.match(/.{1,4}/g) ?? []).join("-");
}

/**
 * Bytes as lower-case hexadecimal.
 *
 * @param buf the bytes
 * @returns the hex string
 */
function hex(buf: ArrayBuffer): string {
  // Two digits per byte.
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Bytes as base64url without padding.
 *
 * @param bytes the bytes
 * @returns the text
 */
export function toBase64Url(bytes: Uint8Array): string {
  // Built in chunks, so a large blob does not overflow the argument list.
  let bin = "";
  // Each chunk of 32 KiB.
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  // Standard base64, then the URL alphabet, no padding.
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Base64url (padding optional) back to bytes.
 *
 * @param text the text
 * @returns the bytes, or null when it is not base64url
 */
export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  // Only the URL alphabet.
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(text)) return null;
  // Back to the standard alphabet, padded.
  const std = text.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
  // Padding to a multiple of four.
  const padded = std + "=".repeat((4 - (std.length % 4)) % 4);
  // Decoding can throw on a bad length.
  try {
    // The binary string.
    const bin = atob(padded);
    // As bytes.
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    // Not decodable.
    return null;
  }
}

/** What a code gives: the server's name for the copy, and the key that locks it. */
export interface SyncKeys {
  /** 32 lower-case hex characters. */
  id: string;
  /** The AES-GCM key (not extractable). */
  key: CryptoKey;
}

/**
 * Derive the id and the key from a code, exactly as the sync contract says.
 *
 * @param code a normalized, valid code
 * @returns the id and the key
 */
export async function deriveKeys(code: string): Promise<SyncKeys> {
  // The code's 20 bytes.
  const ikm = fromBase32(code);
  // A code that does not decode to 20 bytes is refused before anything is derived.
  if (!ikm || ikm.length !== CODE_BYTES) throw new Error("bad code");
  // The id: SHA-256 over "ronutz-desk-id:" + code, the first 32 hex characters.
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(ID_PREFIX + code));
  // Cut to 128 bits.
  const id = hex(digest).slice(0, 32);
  // The input key material, imported for HKDF.
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
  // HKDF-SHA-256 with the fixed salt and info, giving an AES-GCM 256-bit key for encrypting and decrypting only.
  const key = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode(HKDF_SALT), info: enc.encode(HKDF_INFO) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  // Both.
  return { id, key };
}

/**
 * Encrypt a value: a fresh IV, then AES-GCM over its UTF-8 JSON; base64url of IV and ciphertext together.
 *
 * @param key the derived key
 * @param value what to encrypt (the synced part of the desk)
 * @returns the blob as the server stores it, and its decoded size in bytes
 */
export async function sealBlob(key: CryptoKey, value: unknown): Promise<{ data: string; bytes: number }> {
  // A fresh IV for every write.
  const iv = new Uint8Array(IV_BYTES);
  // From the cryptographic generator.
  crypto.getRandomValues(iv);
  // The ciphertext (with its 16-byte tag at the end, as WebCrypto returns it).
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(value))));
  // IV followed by ciphertext.
  const all = new Uint8Array(iv.length + ct.length);
  // The IV first.
  all.set(iv, 0);
  // Then the ciphertext.
  all.set(ct, iv.length);
  // As stored, with its size (the server refuses more than 98,304 bytes).
  return { data: toBase64Url(all), bytes: all.length };
}

/**
 * Decrypt a blob back to its value.
 *
 * @param key the derived key
 * @param data the blob as stored
 * @returns the parsed value
 */
export async function openBlob(key: CryptoKey, data: string): Promise<unknown> {
  // The bytes.
  const all = fromBase64Url(data);
  // Too short to hold an IV and a tag.
  if (!all || all.length < IV_BYTES + 16) throw new Error("bad blob");
  // The plaintext (AES-GCM refuses anything altered or locked with another key).
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.subarray(0, IV_BYTES) }, key, all.subarray(IV_BYTES));
  // Parsed.
  return JSON.parse(dec.decode(plain));
}

// ---------------------------------------------------------------------------
// THE PORTABLE PROFILE'S BLOB, VERSION 2 (PRIME 12/11/2026 13:38, "Portable storage"). The plaintext is
// {"v":2,"keys":{...}}, every portable key of the reader's browser (src/lib/desk/portable.ts); it is gzip-compressed
// with the browser's own CompressionStream before AES-GCM, so the server's 98,304-byte limit holds years of use. A
// version 1 blob (the desk alone, plain JSON) is still read and is upgraded by the next write. The IV, the key and the
// base64url form are those above; the server stores an opaque string either way.
// ---------------------------------------------------------------------------

/** The two bytes that open a gzip stream. */
const GZIP_MAGIC = [0x1f, 0x8b];

/**
 * Bytes through one of the browser's compression streams.
 *
 * @param bytes the input
 * @param stream a CompressionStream or a DecompressionStream
 * @returns the output
 */
async function streamThrough(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  // Written in, read out, whole.
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

/**
 * Encrypt raw bytes: a fresh IV, then AES-GCM; base64url of IV and ciphertext together.
 *
 * @param key the derived key
 * @param plain the bytes
 * @returns the blob and its decoded size in bytes
 */
async function sealBytes(key: CryptoKey, plain: Uint8Array<ArrayBuffer>): Promise<{ data: string; bytes: number }> {
  // A fresh IV.
  const iv = new Uint8Array(IV_BYTES);
  // From the cryptographic generator.
  crypto.getRandomValues(iv);
  // The ciphertext with its tag.
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  // IV then ciphertext.
  const all = new Uint8Array(iv.length + ct.length);
  // The IV.
  all.set(iv, 0);
  // The ciphertext.
  all.set(ct, iv.length);
  // As stored.
  return { data: toBase64Url(all), bytes: all.length };
}

/**
 * Seal a portable profile (version 2): JSON, gzip, AES-GCM. The settings' change times, when this browser records
 * them, travel inside the same encrypted copy as {"v":2,"keys":{...},"times":{...}}, never beside it.
 *
 * @param key the derived key
 * @param keys the profile's keys
 * @param times the settings' change times (key to minute), or undefined to send none
 * @returns the blob and its decoded size
 */
export async function sealProfile(key: CryptoKey, keys: Record<string, unknown>, times?: Record<string, number>): Promise<{ data: string; bytes: number }> {
  // The JSON (the times only when there are some).
  const json = enc.encode(JSON.stringify(times && Object.keys(times).length > 0 ? { v: 2, keys, times } : { v: 2, keys }));
  // Compressed by the browser.
  const gz = await streamThrough(json, new CompressionStream("gzip"));
  // Encrypted.
  return sealBytes(key, gz);
}

/**
 * Open a stored blob of either version: version 2 (gzip, a profile) or version 1 (plain JSON, the desk alone), and
 * give the profile's keys either way.
 *
 * @param key the derived key
 * @param data the blob as stored
 * @returns the keys, the settings' change times as sent (raw: the caller cleans them; undefined in an older copy), and
 *   the version the blob was written in
 */
export async function openProfile(key: CryptoKey, data: string): Promise<{ keys: Record<string, unknown>; times?: unknown; version: 1 | 2 }> {
  // The bytes.
  const all = fromBase64Url(data);
  // Too short to hold an IV and a tag.
  if (!all || all.length < IV_BYTES + 16) throw new Error("bad blob");
  // Decrypted (AES-GCM refuses a wrong key or an altered copy).
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.subarray(0, IV_BYTES) }, key, all.subarray(IV_BYTES)));
  // Version 2 opens with gzip's magic bytes.
  if (plain[0] === GZIP_MAGIC[0] && plain[1] === GZIP_MAGIC[1]) {
    // Decompressed and parsed.
    const value = JSON.parse(dec.decode(await streamThrough(plain, new DecompressionStream("gzip")))) as { v?: unknown; keys?: unknown; times?: unknown };
    // A profile, with its settings' change times when it carries them.
    if (value && value.v === 2 && typeof value.keys === "object" && value.keys !== null) return { keys: value.keys as Record<string, unknown>, times: value.times, version: 2 };
    // Anything else is not a blob this code wrote.
    throw new Error("bad profile");
  }
  // Version 1: the desk's synced part as plain JSON, read as a profile holding the desk alone.
  return { keys: { "ronutz:desk:v1": JSON.parse(dec.decode(plain)) }, version: 1 };
}

/**
 * Compress text with gzip and write it as base64url (the profile transfer link).
 *
 * @param text the text
 * @returns the base64url of the gzip stream
 */
export async function gzipToBase64Url(text: string): Promise<string> {
  // Compressed, then encoded.
  return toBase64Url(await streamThrough(enc.encode(text), new CompressionStream("gzip")));
}

/**
 * The reverse of gzipToBase64Url.
 *
 * @param b64 the base64url text
 * @returns the text, or null when it cannot be read
 */
export async function base64UrlGunzip(b64: string): Promise<string | null> {
  // The bytes.
  const bytes = fromBase64Url(b64);
  // Not base64url.
  if (!bytes) return null;
  // Decompression fails on a damaged link.
  try {
    // Decompressed and decoded.
    return dec.decode(await streamThrough(bytes, new DecompressionStream("gzip")));
  } catch {
    // Not readable.
    return null;
  }
}
