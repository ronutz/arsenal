// ============================================================================
// src/lib/tools/totp-hotp/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the TOTP / HOTP tool (posture "derived", raised
// from "input-caution" on 2026-10-27). The shared secret is the second factor
// itself: RFC 4226 section 7.5 asks that operations on shared secrets "be
// performed securely, in order to mitigate risks of any leakage of sensitive
// information", and RFC 6238 section 3 (R7) that keys "SHOULD be protected
// against unauthorized access and usage". Anyone holding it makes every code.
// So a link carries the settings that shape the codes (mode, algorithm,
// digits, the secret's encoding, and the time step or the counter; the Unix
// time only when the reader typed one instead of using the clock) and never
// the secret: the reader of the link types the secret they were given and
// gets the same codes. The settings are always all carried, so a link is
// never empty while the page shows a code.
//
// One exception: the published test keys go too, because they are printed
// for everyone to read. RFC 4226 Appendix D's secret (the ASCII string
// "12345678901234567890") and RFC 6238's SHA-256 and SHA-512 seeds (its
// Appendix A reference code: the same digits repeated to 32 and 64 bytes),
// printed in the standards, which the page's manual time exists to reproduce;
// and, since 2026-11-01 (PRIME's ruling on open point 4), the key the page
// opens with, JBSWY3DPEHPK3PXP, which the site itself prints (the page's
// opening value and its secret box's placeholder, the manifest's detector
// example in the API description, the provisioning-URI Learn article), so a
// reader who shares the page as it opens gets a link that reopens it as it
// was. They are recognised by their decoded bytes, so they go in whichever
// encoding the reader typed them.
//
// Arrival: the settings replace the form's (the clock is switched off only
// when a time arrives); the secret box takes the published key when one
// arrives and is emptied otherwise, so the page never shows a code for a key
// the sender did not use, and says why the box is empty. Nothing is sent: the
// codes are computed with Web Crypto in the browser, as for a paste. A value
// outside the form's choices, a number out of range, a field of the other
// mode, or a secret that is not a published test key makes the whole link
// malformed: ignored, and stripped from the address either way.
// ============================================================================

import { decodeSecret, OTP_ALGORITHMS, SECRET_ENCODINGS, type OtpAlgorithm, type OtpMode, type SecretEncoding } from "./compute"; // the engine's decoder and choices
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The published test keys, as their ASCII text (RFC 4226 Appendix D; RFC 6238 Appendix A's 32- and 64-byte seeds). */
export const OTP_PUBLISHED_KEYS: readonly string[] = Object.freeze([
  "12345678901234567890", // RFC 4226 Appendix D and RFC 6238 Appendix B, 20 bytes (HMAC-SHA-1)
  "12345678901234567890123456789012", // RFC 6238 Appendix A, seed32 (HMAC-SHA-256)
  "1234567890123456789012345678901234567890123456789012345678901234", // RFC 6238 Appendix A, seed64 (HMAC-SHA-512)
]);

/**
 * The key the page opens with, as Base32 (TotpHotpTool's first value). It is the page's own example, printed on the
 * page and in the API description (the manifest's detector example), so it is published by the site itself and
 * travels like the RFC keys (PRIME, 2026-11-01). It decodes to the 10 bytes "Hello!" DE AD BE EF.
 */
export const OTP_PAGE_EXAMPLE_KEY = "JBSWY3DPEHPK3PXP"; // the page's opening value, verbatim

/** Every published key as bytes: the RFC keys' ASCII text, and the page's own key decoded from Base32. */
const PUBLISHED_KEY_BYTES: readonly Uint8Array[] = Object.freeze([
  ...OTP_PUBLISHED_KEYS.map((k) => Uint8Array.from(Array.from(k), (c) => c.charCodeAt(0))), // ASCII, one byte per character
  decodeSecret(OTP_PAGE_EXAMPLE_KEY, "base32"), // RFC 4648 Base32, the engine's own reading
]);

/** The digit counts the page offers. */
const DIGITS = ["6", "7", "8"]; // as on the page's toggle

/** A whole number in decimal, without sign or leading zeros (or "0"), of at most 16 digits. */
const WHOLE = /^(?:0|[1-9][0-9]{0,15})$/; // anchored, bounded: linear

/** What the page encodes: its settings, the secret box, and whether it shows a code. */
export interface TotpHotpShareInput {
  /** TOTP or HOTP. */
  mode: OtpMode;
  /** The HMAC hash. */
  algorithm: OtpAlgorithm;
  /** The secret box as typed (carried only when it is a published test key). */
  secret: string;
  /** How the secret is written. */
  encoding: SecretEncoding;
  /** Digits per code. */
  digits: number;
  /** TOTP time step in seconds. */
  step: number;
  /** HOTP counter. */
  counter: number;
  /** True while TOTP follows the clock. */
  useNow: boolean;
  /** The typed Unix time (TOTP, clock off). */
  time: number;
  /** True when the page shows a code. */
  hasResult: boolean;
}

/** What an arrival restores. */
export interface TotpHotpShareState {
  /** TOTP or HOTP. */
  mode: OtpMode;
  /** The HMAC hash. */
  algorithm: OtpAlgorithm;
  /** Digits per code. */
  digits: number;
  /** How the secret is written. */
  encoding: SecretEncoding;
  /** TOTP: the time step; null in HOTP mode. */
  step: number | null;
  /** HOTP: the counter; null in TOTP mode. */
  counter: number | null;
  /** TOTP: the typed time, or null to follow the clock (always null in HOTP mode). */
  time: number | null;
  /** A published test key as typed, or null when the link carried none (the box is then emptied). */
  secret: string | null;
}

/**
 * Whether a secret, read with its encoding, is one of the published test keys.
 * @param secret the box as typed
 * @param encoding how it is written
 * @returns true for RFC 4226's and RFC 6238's test keys and the page's own opening key, in any encoding
 */
export function isPublishedKey(secret: string, encoding: SecretEncoding): boolean {
  let bytes: Uint8Array; // the key bytes
  try {
    bytes = decodeSecret(secret, encoding); // the engine's own reading
  } catch {
    return false; // not decodable: not a key at all
  } // try
  return PUBLISHED_KEY_BYTES.some((k) => k.length === bytes.length && k.every((b, i) => b === bytes[i])); // byte for byte
} // isPublishedKey

/**
 * A whole number as the page's engine reads it, in decimal, or null when it is not a safe whole number.
 * @param n the field's value
 * @returns its decimal text, or null
 */
function whole(n: number): string | null {
  const t = Math.trunc(n); // the engine truncates
  return Number.isSafeInteger(t) && t >= 0 ? String(t) : null; // only what decode accepts back
} // whole

/**
 * Read a whole number from a link.
 * @param v the value
 * @param min the smallest allowed
 * @returns the number, or null when it is not one
 */
function readWhole(v: string | null | undefined, min: number): number | null {
  if (v === null || v === undefined || !WHOLE.test(v)) return null; // not a plain whole number
  const n = Number(v); // its value
  return Number.isSafeInteger(n) && n >= min ? n : null; // in range
} // readWhole

/** The spec. */
export const TOTP_HOTP_SHARE: ShareSpec<TotpHotpShareInput, TotpHotpShareState> = Object.freeze({
  tool: "totp-hotp", // the slug
  posture: "derived", // the settings, never the shared secret (but a published test key)
  carriesKey: "share.carries", // tools.totp-hotp.share.carries
  names: ["input", "mode", "algorithm", "digits", "encoding", "step", "counter", "time"], // input: a published test key only
  /** Every setting, the typed time, and a published test key; never another secret. */
  encode(s: TotpHotpShareInput): ShareEncoding {
    if (!s.hasResult) return { ok: false, reason: "empty" } as const; // no code: nothing to share
    const p: Record<string, string> = { mode: s.mode, algorithm: s.algorithm, digits: String(s.digits), encoding: s.encoding }; // the common settings
    if (s.mode === "totp") { // time-based
      const step = whole(s.step); // the step as the engine reads it
      if (step === null || step === "0") return { ok: false, reason: "empty" } as const; // defensive: the page never holds such a step
      p.step = step; // carried
      if (!s.useNow) { const time = whole(s.time); if (time === null) return { ok: false, reason: "empty" } as const; p.time = time; } // the typed time only
    } else { // counter-based
      const counter = whole(s.counter); // the counter as the engine reads it
      if (counter === null) return { ok: false, reason: "empty" } as const; // defensive
      p.counter = counter; // carried
    } // mode
    if (isPublishedKey(s.secret, s.encoding)) p.input = s.secret; // a test key printed in the RFCs: as typed
    return { ok: true, params: p } as const; // the settings
  },
  /** Every setting from the form's own choices, numbers in range, and no secret but a published test key. */
  decode(v: Readonly<Record<string, string | null>>): TotpHotpShareState | null {
    const mode = v.mode; // TOTP or HOTP
    if (mode !== "totp" && mode !== "hotp") return null; // required, from the toggle
    const algorithm = OTP_ALGORITHMS.find((a) => a === v.algorithm); // from the toggle
    if (algorithm === undefined) return null; // required
    const encoding = SECRET_ENCODINGS.find((e) => e === v.encoding); // from the toggle
    if (encoding === undefined) return null; // required
    if (!v.digits || !DIGITS.includes(v.digits)) return null; // 6, 7 or 8
    const digits = Number(v.digits); // its value
    let step: number | null = null; // TOTP's step
    let counter: number | null = null; // HOTP's counter
    let time: number | null = null; // TOTP's typed time
    if (mode === "totp") { // time-based
      if (v.counter !== null && v.counter !== undefined) return null; // a field of the other mode
      step = readWhole(v.step, 1); // required, at least 1
      if (step === null) return null; // malformed
      if (v.time !== null && v.time !== undefined) { time = readWhole(v.time, 0); if (time === null) return null; } // optional
    } else { // counter-based
      if ((v.step !== null && v.step !== undefined) || (v.time !== null && v.time !== undefined)) return null; // fields of the other mode
      counter = readWhole(v.counter, 0); // required
      if (counter === null) return null; // malformed
    } // mode
    const secret = v.input ?? null; // a key, if any
    if (secret !== null && !isPublishedKey(secret, encoding)) return null; // a real secret never opens
    return { mode, algorithm, digits, encoding, step, counter, time, secret }; // the state to fill
  },
});
