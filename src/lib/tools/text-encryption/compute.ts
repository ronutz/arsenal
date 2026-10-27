// ============================================================================
// src/lib/tools/text-encryption/compute.ts
// ----------------------------------------------------------------------------
// LOCAL TEXT ENCRYPTION: the engine. The reader encrypts their own text with
// their own passphrase and decrypts it again, in the browser, through the Web
// Cryptography API; nothing is stored and nothing is sent. Scope, as recorded
// in the canon (DECISION-D49-decrypt-scope-20261026): this decrypts only what
// the reader encrypted with a passphrase the reader holds. It never guesses,
// cracks or bypasses anything.
//
// THE CONSTRUCTION (every step a primitive of the Web Cryptography API; no
// library, no cipher written here):
//   1. The passphrase is prepared with the two mapping rules of the
//      OpaqueString profile (RFC 8265, section 4.2.2, rules 2 and 4): every
//      non-ASCII space (Unicode category Zs other than U+0020) becomes U+0020,
//      then Unicode Normalization Form C is applied. The same passphrase typed
//      on two keyboards, or pasted from a file in decomposed form, then gives
//      the same bytes. It is encoded as UTF-8 (RFC 3629).
//   2. A 256-bit key is derived with PBKDF2 (RFC 8018, section 5.2) using
//      HMAC-SHA-256 as the pseudorandom function, a 128-bit random salt (NIST
//      SP 800-132, section 5.1: at least 128 bits) and an iteration count:
//      600,000 when encrypting, OWASP's Password Storage Cheat Sheet figure
//      for PBKDF2-HMAC-SHA256 (read 2026-10-26, read again 2026-10-27).
//   3. The text, as UTF-8, is encrypted with AES-GCM (NIST SP 800-38D) under
//      that key, with a 96-bit IV drawn at random (the length SP 800-38D,
//      section 5.2.1.1, recommends; the RBG-based construction of section
//      8.2.2, whose key may seal at most 2^32 messages, section 8.3; here
//      every message has its own key, from its own salt) and a 128-bit tag. The header of the output string is passed as
//      additional authenticated data, so changing any field fails the tag.
//   4. The result is one self-describing string, five fields joined by dots:
//          aesgcm1.<iterations>.<salt>.<iv>.<ciphertext and tag>
//      "aesgcm1" names this construction (format version 1); the iteration
//      count is a decimal integer; salt, IV and ciphertext are base64url
//      without padding (RFC 4648, sections 5 and 3.2). Decrypting needs only
//      that string and the passphrase.
//
// D-49 PURITY: the engine draws no random numbers and reads no clock. The salt
// and the IV are PARAMETERS; the component draws them with
// crypto.getRandomValues and passes them in, so every output here is a pure
// function of its inputs and the golden vectors can pin it byte for byte.
// The functions are asynchronous only because Web Crypto is.
//
// FAILURE: nothing here throws for any input. Every refusal is a result with a
// stable code. A tag that does not verify is reported as "auth-failed" (wrong
// passphrase or altered text) and carries NO text at all: AES-GCM returns
// either the whole plaintext or the single indication FAIL (SP 800-38D,
// section 7.2), and the Web Crypto API turns FAIL into an OperationError.
// ============================================================================

/** The format tag that opens every string this tool writes: AES-GCM, format version 1. */
export const FORMAT_VERSION = "aesgcm1"; // the first field of the string
/** The separator between the five fields (not in the base64url alphabet, so a field never contains it). */
export const FIELD_SEPARATOR = "."; // the same separator JWS compact serialisation uses
/** The iteration count used when encrypting: OWASP Password Storage Cheat Sheet, PBKDF2-HMAC-SHA256 (read 2026-10-26 and 2026-10-27). */
export const DEFAULT_ITERATIONS = 600_000; // "PBKDF2-HMAC-SHA256: 600,000 iterations (recommended)"
/** The lowest iteration count accepted: NIST SP 800-132, section 5.2, "A minimum iteration count of 1,000 is recommended". */
export const MIN_ITERATIONS = 1_000; // also quoted by RFC 8018, section 4.2
/** The highest iteration count accepted: SP 800-132, section 5.2, "an iteration count of 10,000,000 may be appropriate". */
export const MAX_ITERATIONS = 10_000_000; // a crafted string cannot make the page derive for minutes
/** Salt length in bytes: 128 bits, the minimum SP 800-132 (section 5.1) sets for the random part of the salt. */
export const SALT_BYTES = 16; // 22 base64url characters
/** IV length in bytes: 96 bits, the length SP 800-38D (section 5.2.1.1) recommends. */
export const IV_BYTES = 12; // 16 base64url characters
/** Tag length in bits: the largest SP 800-38D allows (section 5.2.1.2) and the Web Crypto default. */
export const TAG_BITS = 128; // passed explicitly anyway
/** Tag length in bytes, appended to the ciphertext by Web Crypto. */
export const TAG_BYTES = TAG_BITS / 8; // 16
/** Derived key length in bits: AES-256. */
export const KEY_BITS = 256; // 32 bytes from PBKDF2
/** The largest text accepted, in UTF-8 bytes (1 MiB); far below the GCM limit of 2^39 - 256 bits. */
export const MAX_TEXT_BYTES = 1_048_576; // a bound for the page, not a property of GCM
/** The longest passphrase accepted, in code points after preparation. */
export const MAX_PASSPHRASE_CHARS = 1_024; // SP 800-63B-4, appendix A: "it is reasonable to have some limit"
/** The longest encrypted string accepted before white space is removed, in UTF-16 code units. */
export const MAX_INPUT_CHARS = 2_000_000; // above the longest string a 1 MiB text produces (about 1.4 million)

/** A refusal: a stable code (the page and the docs translate it) and, for some codes, a parameter. */
export type TextEncryptionErrorCode =
  | "empty-text" // encrypt: nothing to encrypt
  | "text-too-large" // the text (or the sealed data) is over MAX_TEXT_BYTES
  | "lone-surrogate" // the text or the passphrase holds an unpaired surrogate, which UTF-8 cannot carry
  | "empty-passphrase" // no passphrase
  | "passphrase-too-long" // over MAX_PASSPHRASE_CHARS
  | "bad-salt-length" // a salt that is not 16 bytes
  | "bad-iv-length" // an IV that is not 12 bytes
  | "iterations-out-of-range" // an iteration count outside MIN_ITERATIONS..MAX_ITERATIONS
  | "empty-input" // decrypt: nothing but white space
  | "input-too-large" // decrypt: over MAX_INPUT_CHARS
  | "bad-format" // not five fields separated by dots
  | "unknown-version" // a first field other than "aesgcm1"
  | "bad-iterations" // an iteration field that is not a decimal integer without leading zeros
  | "bad-encoding" // a field that is not canonical base64url without padding
  | "too-short" // a ciphertext field shorter than the 16-byte tag
  | "auth-failed" // the tag did not verify: wrong passphrase or altered text
  | "not-utf8" // the tag verified but the plaintext is not UTF-8 (this tool never writes such a string)
  | "no-crypto" // the Web Cryptography API is not available (for example a page not served over HTTPS)
  | "crypto-error"; // Web Crypto refused for another reason

/** What a refusal carries. */
export interface TextEncryptionError {
  /** The stable code. */
  code: TextEncryptionErrorCode;
  /** Parameters for the message: the field name for bad-encoding and lone-surrogate. */
  params?: { field?: "salt" | "iv" | "ciphertext" | "text" | "passphrase" };
}

/** A note the page shows beside a result. */
export type TextEncryptionNote =
  | "passphrase-prepared" // the passphrase changed under preparation (a non-ASCII space, or a decomposed character)
  | "whitespace-removed"; // white space was removed from the pasted string before reading it

/** The parts of an encrypted string, as read. */
export interface Envelope {
  /** The format tag ("aesgcm1"). */
  version: string;
  /** The PBKDF2 iteration count. */
  iterations: number;
  /** The salt bytes (16). */
  salt: Uint8Array<ArrayBuffer>;
  /** The IV bytes (12). */
  iv: Uint8Array<ArrayBuffer>;
  /** The ciphertext followed by the 16-byte tag. */
  sealed: Uint8Array<ArrayBuffer>;
  /** The first four fields with their dots: the additional authenticated data. */
  header: string;
  /** The string as read, white space removed. */
  compact: string;
  /** Whether white space was removed. */
  whitespaceRemoved: boolean;
}

/** The result of parsing an encrypted string (no cryptography involved). */
export type ParseResult = { ok: true; envelope: Envelope } | { ok: false; error: TextEncryptionError };

/** The inputs to one encryption. */
export interface EncryptInput {
  /** The text to encrypt. */
  text: string;
  /** The passphrase, as typed. */
  passphrase: string;
  /** 16 random bytes, drawn by the caller. */
  salt: Uint8Array;
  /** 12 random bytes, drawn by the caller. */
  iv: Uint8Array;
  /** The PBKDF2 iteration count (DEFAULT_ITERATIONS when omitted). */
  iterations?: number;
}

/** What an encryption produced. */
export type EncryptResult =
  | {
      ok: true; // encrypted
      output: string; // the five-field string
      textBytes: number; // the text's length in UTF-8 bytes
      sealedBytes: number; // ciphertext plus tag, in bytes (textBytes + 16)
      iterations: number; // the count used
      notes: TextEncryptionNote[]; // what the page should mention
    }
  | { ok: false; error: TextEncryptionError }; // refused

/** The inputs to one decryption. */
export interface DecryptInput {
  /** The encrypted string, as pasted (white space anywhere is removed first). */
  input: string;
  /** The passphrase, as typed. */
  passphrase: string;
}

/** What a decryption produced. A failure never carries text. */
export type DecryptResult =
  | {
      ok: true; // decrypted and authenticated
      text: string; // the plaintext
      iterations: number; // the count the string named
      textBytes: number; // the plaintext's length in UTF-8 bytes
      notes: TextEncryptionNote[]; // what the page should mention
    }
  | { ok: false; error: TextEncryptionError }; // refused, with no partial text

/** Facts about a passphrase for the page's note: counts only, no score. */
export interface PassphraseFacts {
  /** Length in characters (Unicode code points) after preparation. */
  characters: number;
  /** Length in UTF-8 bytes after preparation (what PBKDF2 receives). */
  utf8Bytes: number;
  /** Whether a lowercase letter (Ll) occurs. */
  lowercase: boolean;
  /** Whether an uppercase letter (Lu or Lt) occurs. */
  uppercase: boolean;
  /** Whether a letter without case occurs (Lm or Lo, for example most Asian scripts). */
  otherLetters: boolean;
  /** Whether a decimal digit (Nd) occurs. */
  digits: boolean;
  /** Whether a space occurs (after preparation every Zs is U+0020). */
  spaces: boolean;
  /** Whether anything else occurs: punctuation, symbols, marks, other numbers. */
  symbols: boolean;
  /** Whether the passphrase starts or ends with white space (easy to lose when retyping). */
  edgeWhitespace: boolean;
  /** Whether preparation changed it (a non-ASCII space, or a decomposed character). */
  prepared: boolean;
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

/** The RFC 4648 section 5 alphabet: A-Z, a-z, 0-9, "-" (62) and "_" (63). */
const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; // index = 6-bit value

/** Reverse lookup: character code to 6-bit value, -1 when outside the alphabet. */
const B64URL_REV: Int16Array = (() => {
  const t = new Int16Array(128).fill(-1); // every ASCII code unknown at first
  for (let i = 0; i < B64URL.length; i++) t[B64URL.charCodeAt(i)] = i; // then the 64 alphabet characters
  return t; // the table
})(); // built once

/**
 * Encode bytes as base64url without padding (RFC 4648, sections 5 and 3.2); pad bits are zero (section 3.5).
 * @param bytes the bytes
 * @returns the encoding
 */
export function base64urlEncode(bytes: Uint8Array): string {
  let out = ""; // the encoding, built a group at a time
  let i = 0; // the read position
  for (; i + 3 <= bytes.length; i += 3) { // every whole group of three bytes
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]; // 24 bits
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63] + B64URL[n & 63]; // four characters
  } // whole groups
  const rest = bytes.length - i; // 0, 1 or 2 bytes left
  if (rest === 1) { // one byte: two characters, the last four bits zero
    const n = bytes[i] << 16; // 8 bits at the top
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63]; // two characters, no "="
  } else if (rest === 2) { // two bytes: three characters, the last two bits zero
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8); // 16 bits at the top
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63]; // three characters, no "="
  } // the tail
  return out; // done
} // base64urlEncode

/**
 * Decode strict, canonical base64url without padding: only the 64 alphabet characters, a length that is not 1 more
 * than a multiple of 4, and zero pad bits (RFC 4648, section 3.5 lets a decoder reject the alternative).
 * @param s the text
 * @returns the bytes, or null when the text is not such an encoding
 */
export function base64urlDecode(s: string): Uint8Array<ArrayBuffer> | null {
  if (s.length % 4 === 1) return null; // a single leftover character cannot encode a byte
  const full = Math.floor(s.length / 4); // whole four-character groups
  const rest = s.length % 4; // 0, 2 or 3 characters in the tail
  const out = new Uint8Array(full * 3 + (rest === 0 ? 0 : rest - 1)); // 3 bytes per group, 1 or 2 for the tail
  /** The 6-bit value of the character at index k, or -1. */
  const val = (k: number): number => { const c = s.charCodeAt(k); return c < 128 ? B64URL_REV[c] : -1; }; // lookup
  let o = 0; // the write position
  for (let g = 0; g < full; g++) { // each whole group
    const a = val(4 * g), b = val(4 * g + 1), c = val(4 * g + 2), d = val(4 * g + 3); // its four values
    if ((a | b | c | d) < 0) return null; // a character outside the alphabet ("=", "+", "/", white space ...)
    const n = (a << 18) | (b << 12) | (c << 6) | d; // 24 bits
    out[o++] = (n >> 16) & 255; out[o++] = (n >> 8) & 255; out[o++] = n & 255; // three bytes
  } // whole groups
  if (rest === 2) { // one byte in two characters
    const a = val(4 * full), b = val(4 * full + 1); // the two values
    if ((a | b) < 0 || (b & 15) !== 0) return null; // outside the alphabet, or non-zero pad bits
    out[o++] = ((a << 2) | (b >> 4)) & 255; // the byte
  } else if (rest === 3) { // two bytes in three characters
    const a = val(4 * full), b = val(4 * full + 1), c = val(4 * full + 2); // the three values
    if ((a | b | c) < 0 || (c & 3) !== 0) return null; // outside the alphabet, or non-zero pad bits
    const n = (a << 18) | (b << 12) | (c << 6); // 18 bits used
    out[o++] = (n >> 16) & 255; out[o++] = (n >> 8) & 255; // the two bytes
  } // the tail
  return out; // the bytes
} // base64urlDecode

/**
 * Whether a string holds an unpaired UTF-16 surrogate, which UTF-8 cannot represent (TextEncoder would silently
 * replace it with U+FFFD, so the decrypted text would differ from the original).
 * @param s the string
 * @returns true when a lone surrogate occurs
 */
export function hasLoneSurrogate(s: string): boolean {
  for (let i = 0; i < s.length; i++) { // each code unit
    const c = s.charCodeAt(i); // its value
    if (c >= 0xd800 && c <= 0xdbff) { // a high surrogate must be followed by a low one
      const n = i + 1 < s.length ? s.charCodeAt(i + 1) : 0; // the next unit, or none
      if (n >= 0xdc00 && n <= 0xdfff) { i++; continue; } // a valid pair: skip its second half
      return true; // a high surrogate alone
    } // high
    if (c >= 0xdc00 && c <= 0xdfff) return true; // a low surrogate with no high one before it
  } // units
  return false; // well formed
} // hasLoneSurrogate

/** Every space separator other than U+0020 (Unicode category Zs), for RFC 8265's additional mapping rule. */
const NON_ASCII_SPACE = /(?! )\p{Zs}/gu; // a global, Unicode-aware class; linear

/**
 * Prepare a passphrase: RFC 8265, section 4.2.2, rule 2 (non-ASCII spaces to U+0020) then rule 4 (NFC). Rules 1, 3
 * and 5 of that section map nothing; the code-point check of section 4.2.1 is not applied (every character is kept).
 * @param passphrase as typed
 * @returns the prepared passphrase
 */
export function preparePassphrase(passphrase: string): string {
  return passphrase.replace(NON_ASCII_SPACE, " ").normalize("NFC"); // map spaces, then compose
} // preparePassphrase

/**
 * Count the code points of a string (an astral character counts once).
 * @param s the string
 * @returns the count
 */
function codePoints(s: string): number {
  let n = 0; // the count
  for (const _ of s) n++; // the string iterator walks code points
  return n; // done
} // codePoints

/** The Web Crypto SubtleCrypto object, or null when the page has none (an insecure context, or an old engine). */
function subtle(): SubtleCrypto | null {
  const c = (globalThis as { crypto?: Crypto }).crypto; // browsers and Node 19+ both expose it here
  return c && c.subtle ? c.subtle : null; // null when absent
} // subtle

/**
 * Copy bytes into a fresh ArrayBuffer-backed array, the form Web Crypto's BufferSource accepts in every lib version.
 * @param b the bytes
 * @returns a copy
 */
function own(b: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(b); // a copy over a new ArrayBuffer
} // own

// ---------------------------------------------------------------------------
// The primitives, exposed for the known-answer tests
// ---------------------------------------------------------------------------

/**
 * PBKDF2 with HMAC-SHA-256 (RFC 8018, section 5.2) through Web Crypto: importKey "raw" as PBKDF2, then deriveBits.
 * @param password the password bytes
 * @param salt the salt bytes
 * @param iterations the iteration count (at least 1; Web Crypto refuses 0)
 * @param dkLen the derived key length in bytes
 * @returns the derived bytes, or null when Web Crypto is unavailable or refuses
 */
export async function pbkdf2Sha256(password: Uint8Array, salt: Uint8Array, iterations: number, dkLen: number): Promise<Uint8Array | null> {
  const s = subtle(); // the API
  if (!s) return null; // nothing to derive with
  try {
    const base = await s.importKey("raw", own(password), "PBKDF2", false, ["deriveBits"]); // the password as a key
    const bits = await s.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: own(salt), iterations }, base, dkLen * 8); // the derivation
    return new Uint8Array(bits); // the bytes
  } catch {
    return null; // refused (for example iterations 0)
  } // try
} // pbkdf2Sha256

/**
 * AES-GCM authenticated encryption (SP 800-38D, section 7.1) through Web Crypto, with a 128-bit tag.
 * @param key the raw AES key (16, 24 or 32 bytes)
 * @param iv the IV
 * @param plaintext the plaintext bytes
 * @param aad the additional authenticated data
 * @returns ciphertext followed by the tag, or null when Web Crypto is unavailable or refuses
 */
export async function aesGcmSeal(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): Promise<Uint8Array | null> {
  const s = subtle(); // the API
  if (!s) return null; // nothing to encrypt with
  try {
    const k = await s.importKey("raw", own(key), "AES-GCM", false, ["encrypt"]); // the key, not extractable
    const out = await s.encrypt({ name: "AES-GCM", iv: own(iv), additionalData: own(aad), tagLength: TAG_BITS }, k, own(plaintext)); // C || T
    return new Uint8Array(out); // the bytes
  } catch {
    return null; // refused
  } // try
} // aesGcmSeal

/** What an authenticated decryption gives: the plaintext, FAIL, or no answer at all. */
export type OpenOutcome = { kind: "plaintext"; bytes: Uint8Array } | { kind: "fail" } | { kind: "unavailable" } | { kind: "error" };

/**
 * AES-GCM authenticated decryption (SP 800-38D, section 7.2) through Web Crypto: the plaintext only when the tag
 * verifies; otherwise "fail" (Web Crypto's OperationError, the specification's FAIL), never a partial plaintext.
 * @param key the raw AES key
 * @param iv the IV
 * @param sealed ciphertext followed by the 16-byte tag
 * @param aad the additional authenticated data
 * @returns the outcome
 */
export async function aesGcmOpen(key: Uint8Array, iv: Uint8Array, sealed: Uint8Array, aad: Uint8Array): Promise<OpenOutcome> {
  const s = subtle(); // the API
  if (!s) return { kind: "unavailable" }; // nothing to decrypt with
  let k: CryptoKey; // the imported key
  try {
    k = await s.importKey("raw", own(key), "AES-GCM", false, ["decrypt"]); // the key, not extractable
  } catch {
    return { kind: "error" }; // a key Web Crypto will not take
  } // try
  try {
    const out = await s.decrypt({ name: "AES-GCM", iv: own(iv), additionalData: own(aad), tagLength: TAG_BITS }, k, own(sealed)); // P, or a throw
    return { kind: "plaintext", bytes: new Uint8Array(out) }; // authenticated
  } catch (e) {
    // The Web Cryptography API throws an OperationError when the algorithm returns FAIL (section "AES-GCM",
    // Decrypt); it also throws one for a ciphertext shorter than the tag, which the parser has already refused.
    const name = (e as { name?: string } | null)?.name; // DOMException name
    return name === "OperationError" ? { kind: "fail" } : { kind: "error" }; // FAIL, or something else
  } // try
} // aesGcmOpen

// ---------------------------------------------------------------------------
// The format
// ---------------------------------------------------------------------------

/** A decimal integer with no sign, no leading zero and at most eight digits (MAX_ITERATIONS has eight). */
const ITERATIONS_RE = /^[1-9][0-9]{0,7}$/; // anchored, bounded: linear

/** ASCII white space removed from a pasted string: space, tab, line feed, form feed, carriage return. */
const WHITESPACE_RE = /[ \t\n\f\r]+/g; // a single class run: linear

/**
 * Read an encrypted string without any cryptography: the five fields, each checked. Used before decrypting, and by
 * the page to show what the string says before the passphrase is entered.
 * @param input the string as pasted
 * @returns the envelope, or a refusal
 */
export function parseEnvelope(input: string): ParseResult {
  if (input.length > MAX_INPUT_CHARS) return { ok: false, error: { code: "input-too-large" } }; // bounded before any work
  const compact = input.replace(WHITESPACE_RE, ""); // e-mail clients wrap long strings; base64url has no white space
  if (compact === "") return { ok: false, error: { code: "empty-input" } }; // nothing to read
  const fields = compact.split(FIELD_SEPARATOR); // the five fields
  if (fields.length !== 5) return { ok: false, error: { code: "bad-format" } }; // not this format
  const [version, iterText, saltText, ivText, sealedText] = fields; // named
  if (version !== FORMAT_VERSION) return { ok: false, error: { code: "unknown-version" } }; // another format or a later version
  if (!ITERATIONS_RE.test(iterText)) return { ok: false, error: { code: "bad-iterations" } }; // not a canonical decimal
  const iterations = Number(iterText); // at most eight digits: exact
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) return { ok: false, error: { code: "iterations-out-of-range" } }; // outside SP 800-132's span
  const salt = base64urlDecode(saltText); // 16 bytes expected
  if (!salt) return { ok: false, error: { code: "bad-encoding", params: { field: "salt" } } }; // not base64url
  if (salt.length !== SALT_BYTES) return { ok: false, error: { code: "bad-salt-length" } }; // not 128 bits
  const iv = base64urlDecode(ivText); // 12 bytes expected
  if (!iv) return { ok: false, error: { code: "bad-encoding", params: { field: "iv" } } }; // not base64url
  if (iv.length !== IV_BYTES) return { ok: false, error: { code: "bad-iv-length" } }; // not 96 bits
  const sealed = base64urlDecode(sealedText); // ciphertext and tag
  if (!sealed) return { ok: false, error: { code: "bad-encoding", params: { field: "ciphertext" } } }; // not base64url
  if (sealed.length < TAG_BYTES) return { ok: false, error: { code: "too-short" } }; // not even a tag
  if (sealed.length - TAG_BYTES > MAX_TEXT_BYTES) return { ok: false, error: { code: "text-too-large" } }; // over the page's bound
  const header = [version, iterText, saltText, ivText].join(FIELD_SEPARATOR); // the authenticated header
  return { ok: true, envelope: { version, iterations, salt, iv, sealed, header, compact, whitespaceRemoved: compact !== input } }; // read
} // parseEnvelope

/**
 * Check a passphrase and prepare it.
 * @param passphrase as typed
 * @returns the prepared passphrase, whether it changed, or a refusal
 */
function checkPassphrase(passphrase: string): { ok: true; prepared: string; changed: boolean } | { ok: false; error: TextEncryptionError } {
  if (passphrase === "") return { ok: false, error: { code: "empty-passphrase" } }; // nothing to derive from
  if (hasLoneSurrogate(passphrase)) return { ok: false, error: { code: "lone-surrogate", params: { field: "passphrase" } } }; // not encodable
  const prepared = preparePassphrase(passphrase); // RFC 8265 mapping
  if (codePoints(prepared) > MAX_PASSPHRASE_CHARS) return { ok: false, error: { code: "passphrase-too-long" } }; // bounded
  return { ok: true, prepared, changed: prepared !== passphrase }; // ready
} // checkPassphrase

/**
 * Derive the AES-256 key from a prepared passphrase.
 * @param prepared the prepared passphrase
 * @param salt the salt
 * @param iterations the count
 * @returns the 32 key bytes, or null when Web Crypto is unavailable or refuses
 */
export async function deriveKey(prepared: string, salt: Uint8Array, iterations: number): Promise<Uint8Array | null> {
  return pbkdf2Sha256(new TextEncoder().encode(prepared), salt, iterations, KEY_BITS / 8); // UTF-8, then PBKDF2
} // deriveKey

/**
 * Encrypt a text: prepare the passphrase, derive the key, seal the UTF-8 text with the header as AAD, write the string.
 * Deterministic: the same text, passphrase, salt, IV and count always give the same string.
 * @param input text, passphrase, salt, IV and (optionally) the iteration count
 * @returns the string and its counts, or a refusal
 */
export async function encryptText(input: EncryptInput): Promise<EncryptResult> {
  const iterations = input.iterations ?? DEFAULT_ITERATIONS; // the default is OWASP's figure
  if (input.text === "") return { ok: false, error: { code: "empty-text" } }; // nothing to encrypt
  if (hasLoneSurrogate(input.text)) return { ok: false, error: { code: "lone-surrogate", params: { field: "text" } } }; // would not round-trip
  const textBytes = new TextEncoder().encode(input.text); // UTF-8 (RFC 3629)
  if (textBytes.length > MAX_TEXT_BYTES) return { ok: false, error: { code: "text-too-large" } }; // bounded
  const pass = checkPassphrase(input.passphrase); // prepared, or refused
  if (!pass.ok) return pass; // refused
  if (input.salt.length !== SALT_BYTES) return { ok: false, error: { code: "bad-salt-length" } }; // the caller drew the wrong size
  if (input.iv.length !== IV_BYTES) return { ok: false, error: { code: "bad-iv-length" } }; // the caller drew the wrong size
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) return { ok: false, error: { code: "iterations-out-of-range" } }; // outside the span
  if (!subtle()) return { ok: false, error: { code: "no-crypto" } }; // no Web Crypto on this page
  const header = [FORMAT_VERSION, String(iterations), base64urlEncode(input.salt), base64urlEncode(input.iv)].join(FIELD_SEPARATOR); // the four header fields
  const key = await deriveKey(pass.prepared, input.salt, iterations); // PBKDF2-HMAC-SHA-256
  if (!key) return { ok: false, error: { code: "crypto-error" } }; // Web Crypto refused
  const sealed = await aesGcmSeal(key, input.iv, textBytes, new TextEncoder().encode(header)); // AES-256-GCM, header as AAD
  if (!sealed) return { ok: false, error: { code: "crypto-error" } }; // Web Crypto refused
  const notes: TextEncryptionNote[] = pass.changed ? ["passphrase-prepared"] : []; // say when the passphrase was mapped
  return { ok: true, output: header + FIELD_SEPARATOR + base64urlEncode(sealed), textBytes: textBytes.length, sealedBytes: sealed.length, iterations, notes }; // the string
} // encryptText

/**
 * Decrypt a string written by encryptText: read the fields, prepare the passphrase, derive the key, open the sealed
 * data with the header as AAD, decode the UTF-8. A tag that does not verify gives "auth-failed" and no text.
 * @param input the string and the passphrase
 * @returns the text, or a refusal
 */
export async function decryptText(input: DecryptInput): Promise<DecryptResult> {
  const parsed = parseEnvelope(input.input); // the fields first: no passphrase needed to refuse a malformed string
  if (!parsed.ok) return parsed; // refused
  const env = parsed.envelope; // the fields
  const pass = checkPassphrase(input.passphrase); // prepared, or refused
  if (!pass.ok) return pass; // refused
  if (!subtle()) return { ok: false, error: { code: "no-crypto" } }; // no Web Crypto on this page
  const key = await deriveKey(pass.prepared, env.salt, env.iterations); // the same derivation as encryptText
  if (!key) return { ok: false, error: { code: "crypto-error" } }; // Web Crypto refused
  const opened = await aesGcmOpen(key, env.iv, env.sealed, new TextEncoder().encode(env.header)); // authenticate, then decrypt
  if (opened.kind === "fail") return { ok: false, error: { code: "auth-failed" } }; // wrong passphrase or altered text: no text
  if (opened.kind !== "plaintext") return { ok: false, error: { code: opened.kind === "unavailable" ? "no-crypto" : "crypto-error" } }; // no answer
  let text: string; // the decoded plaintext
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(opened.bytes); // strict UTF-8; a leading BOM is kept as text
  } catch {
    return { ok: false, error: { code: "not-utf8" } }; // authenticated bytes that are not text
  } // try
  const notes: TextEncryptionNote[] = []; // what to mention
  if (env.whitespaceRemoved) notes.push("whitespace-removed"); // the pasted string was wrapped or padded
  if (pass.changed) notes.push("passphrase-prepared"); // the passphrase was mapped
  return { ok: true, text, iterations: env.iterations, textBytes: opened.bytes.length, notes }; // authenticated text
} // decryptText

// ---------------------------------------------------------------------------
// Passphrase facts (for the page's note; counts, never a score)
// ---------------------------------------------------------------------------

/** Lowercase letters. */
const LL = /\p{Ll}/u; // Unicode category Ll
/** Uppercase and titlecase letters. */
const LU = /[\p{Lu}\p{Lt}]/u; // Lu and Lt
/** Letters without case (modifier and other letters). */
const LO = /[\p{Lm}\p{Lo}]/u; // Lm and Lo
/** Decimal digits. */
const ND = /\p{Nd}/u; // Nd
/** Anything that is not a letter, a decimal digit or a space separator. */
const OTHER = /[^\p{L}\p{Nd}\p{Zs}]/u; // punctuation, symbols, marks, other numbers, controls

/**
 * Facts about a passphrase: its length and which kinds of character it contains, after preparation. No strength
 * score is computed; the docs say why (a guesser tries likely passphrases first, and length is a primary factor:
 * NIST SP 800-63B-4, appendix A).
 * @param passphrase as typed
 * @returns the facts
 */
export function passphraseFacts(passphrase: string): PassphraseFacts {
  const p = preparePassphrase(passphrase); // what PBKDF2 will receive
  return {
    characters: codePoints(p), // code points
    utf8Bytes: new TextEncoder().encode(p).length, // bytes
    lowercase: LL.test(p), // a lowercase letter
    uppercase: LU.test(p), // an uppercase letter
    otherLetters: LO.test(p), // a letter without case
    digits: ND.test(p), // a digit
    spaces: p.includes(" "), // a space
    symbols: OTHER.test(p), // anything else
    edgeWhitespace: /^\s|\s$/u.test(p), // white space at either end
    prepared: p !== passphrase, // mapped
  }; // the facts
} // passphraseFacts

// ---------------------------------------------------------------------------
// Share results (2026-10-27): the only thing a link may carry
// ---------------------------------------------------------------------------

/**
 * The form of an encrypted string that a "Share results" link carries, and the only form an arriving link is
 * accepted in: the string as parseEnvelope reads it, white space removed. Its input is the encrypted string alone,
 * so neither the passphrase nor the plaintext can reach a link through it; anything that is not a well-formed
 * string of this tool's format gives null (nothing to share; an arrival is ignored and stripped).
 * @param input an encrypted string (Encrypt's output, or what was pasted in Decrypt mode)
 * @returns the compact string, or null
 */
export function shareableCiphertext(input: string): string | null {
  const parsed = parseEnvelope(input); // the fields only: no passphrase, no cryptography
  return parsed.ok ? parsed.envelope.compact : null; // the canonical string, or nothing
} // shareableCiphertext

/**
 * The API-shaped entry point required by the tool shape. This tool is excluded from the HTTP API (a passphrase or a
 * plaintext must never be sent to a server), so run() only reads an encrypted string's fields, with no passphrase
 * and no cryptography: the version, the iteration count and the sizes, or the refusal.
 * @param input an encrypted string
 * @returns the fields, or the refusal
 */
export function run(input: string): { ok: true; version: string; iterations: number; saltBytes: number; ivBytes: number; ciphertextBytes: number; tagBytes: number } | { ok: false; error: TextEncryptionError } {
  const r = parseEnvelope(input); // fields only
  if (!r.ok) return r; // refused
  const e = r.envelope; // the fields
  return { ok: true, version: e.version, iterations: e.iterations, saltBytes: e.salt.length, ivBytes: e.iv.length, ciphertextBytes: e.sealed.length - TAG_BYTES, tagBytes: TAG_BYTES }; // what the string says
} // run
