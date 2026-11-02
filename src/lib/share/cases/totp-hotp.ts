// ============================================================================
// src/lib/share/cases/totp-hotp.ts
// ----------------------------------------------------------------------------
// Share cases of the TOTP / HOTP tool: the settings always go, the typed time
// goes only when the clock is off, and the shared secret never goes, except
// the published test keys of RFC 4226 Appendix D and RFC 6238 and, since
// 2026-11-01, the key the page opens with (in any of the page's encodings):
// the page shared as it opens reopens as it was.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { TOTP_HOTP_SHARE, type TotpHotpShareInput, type TotpHotpShareState } from "../../tools/totp-hotp/share"; // the spec

/** RFC 4226 Appendix D's secret, as ASCII. */
const RFC4226 = "12345678901234567890"; // 20 bytes
/** RFC 6238's 64-byte seed (HMAC-SHA-512), as hex. */
const SEED64_HEX = "3132333435363738393031323334353637383930".repeat(3) + "31323334"; // 64 bytes
/** RFC 4226's secret in Base32, grouped in fours as authenticator apps show it. */
const RFC4226_B32 = "GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ"; // RFC 4648 Base32 of "12345678901234567890"
/** The key the page opens with, published by the site itself (its opening value and placeholder): it travels. */
const DEMO = "JBSWY3DPEHPK3PXP"; // Base32 of "Hello!" DE AD BE EF
/** The same key written as hex: the same bytes, so it travels too. */
const DEMO_HEX = "48656c6c6f21deadbeef"; // 10 bytes
/** A seed of the reader's own, as Base32: 20 random bytes, so it never travels. */
const OWN_B32 = "6V2GXIJ5TCIOD53DJO7CMJDIH7GOT2HU"; // drawn at random for these cases (2026-11-01); nobody's key
/** A seed of the reader's own, as hex. */
const OWN_HEX = "a1b2c3d4e5f60718293a4b5c6d7e8f9001122334"; // made up for these cases

/** A TOTP state with the page's defaults, overridden by the fields given. */
const totp = (o: Partial<TotpHotpShareInput>): TotpHotpShareInput => ({ mode: "totp", algorithm: "SHA-1", secret: DEMO, encoding: "base32", digits: 6, step: 30, counter: 0, useNow: true, time: 0, hasResult: true, ...o }); // as the page opens
/** An HOTP state likewise. */
const hotp = (o: Partial<TotpHotpShareInput>): TotpHotpShareInput => totp({ mode: "hotp", ...o }); // counter-based

/** The cases. */
const CASES: ShareCases<TotpHotpShareInput, TotpHotpShareState> = {
  spec: TOTP_HOTP_SHARE, // the spec
  accept: [
    { // RFC 6238 Appendix B's first row: the published key, a typed time
      id: "rfc6238-sha1-t59", state: totp({ secret: RFC4226, encoding: "ascii", digits: 8, useNow: false, time: 59 }),
      params: { mode: "totp", algorithm: "SHA-1", digits: "8", encoding: "ascii", step: "30", time: "59", input: RFC4226 },
      restored: { mode: "totp", algorithm: "SHA-1", digits: 8, encoding: "ascii", step: 30, counter: null, time: 59, secret: RFC4226 },
    },
    { // the SHA-512 seed written as hex, at another time from the table
      id: "rfc6238-sha512-hex", state: totp({ algorithm: "SHA-512", secret: SEED64_HEX, encoding: "hex", digits: 8, useNow: false, time: 1111111109 }),
      params: { mode: "totp", algorithm: "SHA-512", digits: "8", encoding: "hex", step: "30", time: "1111111109", input: SEED64_HEX },
      restored: { mode: "totp", algorithm: "SHA-512", digits: 8, encoding: "hex", step: 30, counter: null, time: 1111111109, secret: SEED64_HEX },
    },
    { // the page as it opens: its own key travels, so the link reopens the page as it was (live clock)
      id: "page-opening-state", state: totp({}),
      params: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "30", input: DEMO },
      restored: { mode: "totp", algorithm: "SHA-1", digits: 6, encoding: "base32", step: 30, counter: null, time: null, secret: DEMO },
    },
    { // the page's key written as hex: the same bytes, so it travels as typed
      id: "page-key-as-hex", state: totp({ secret: DEMO_HEX, encoding: "hex", useNow: false, time: 1700000000 }),
      params: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "hex", step: "30", time: "1700000000", input: DEMO_HEX },
      restored: { mode: "totp", algorithm: "SHA-1", digits: 6, encoding: "hex", step: 30, counter: null, time: 1700000000, secret: DEMO_HEX },
    },
    { // a seed of the reader's own on the live clock: the settings only
      id: "own-key-live-clock", state: totp({ secret: OWN_B32 }),
      params: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "30" },
      restored: { mode: "totp", algorithm: "SHA-1", digits: 6, encoding: "base32", step: 30, counter: null, time: null, secret: null },
      mustNotContain: [OWN_B32],
    },
    { // RFC 4226's table: HOTP with the published key, counter 5
      id: "rfc4226-hotp-5", state: hotp({ secret: RFC4226, encoding: "ascii", counter: 5 }),
      params: { mode: "hotp", algorithm: "SHA-1", digits: "6", encoding: "ascii", counter: "5", input: RFC4226 },
      restored: { mode: "hotp", algorithm: "SHA-1", digits: 6, encoding: "ascii", step: null, counter: 5, time: null, secret: RFC4226 },
    },
    { // HOTP with a seed of the reader's own: never in the link
      id: "own-key-hotp", state: hotp({ algorithm: "SHA-256", secret: OWN_HEX, encoding: "hex", digits: 7, counter: 42 }),
      params: { mode: "hotp", algorithm: "SHA-256", digits: "7", encoding: "hex", counter: "42" },
      restored: { mode: "hotp", algorithm: "SHA-256", digits: 7, encoding: "hex", step: null, counter: 42, time: null, secret: null },
      mustNotContain: [OWN_HEX],
    },
    { // the published key in grouped Base32 goes as typed, spaces and all; a 60-second step
      id: "rfc4226-base32-grouped", state: totp({ secret: RFC4226_B32, step: 60 }),
      params: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "60", input: RFC4226_B32 },
      restored: { mode: "totp", algorithm: "SHA-1", digits: 6, encoding: "base32", step: 60, counter: null, time: null, secret: RFC4226_B32 },
    },
  ],
  empty: [
    { id: "no-code", state: totp({ secret: "not base32!", hasResult: false }) }, // the page shows no code
  ],
  reject: [
    { id: "unknown-mode", values: { mode: "sms", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "30" } }, // not offered
    { id: "unknown-algorithm", values: { mode: "totp", algorithm: "MD5", digits: "6", encoding: "base32", step: "30" } }, // not offered
    { id: "missing-algorithm", values: { mode: "totp", digits: "6", encoding: "base32", step: "30" } }, // every setting is required
    { id: "nine-digits", values: { mode: "totp", algorithm: "SHA-1", digits: "9", encoding: "base32", step: "30" } }, // 6, 7 or 8
    { id: "unknown-encoding", values: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base64", step: "30" } }, // not offered
    { id: "totp-with-counter", values: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "30", counter: "1" } }, // a field of the other mode
    { id: "hotp-with-step", values: { mode: "hotp", algorithm: "SHA-1", digits: "6", encoding: "base32", counter: "1", step: "30" } }, // a field of the other mode
    { id: "step-zero", values: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "0" } }, // at least 1
    { id: "step-fraction", values: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "1.5" } }, // whole numbers only
    { id: "time-leading-zero", values: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "30", time: "059" } }, // decimal as the page writes it
    { id: "counter-too-long", values: { mode: "hotp", algorithm: "SHA-1", digits: "6", encoding: "base32", counter: "99999999999999999" } }, // over 16 digits
    { id: "real-secret", values: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "base32", step: "30", input: OWN_B32 } }, // a seed that is not a published test key never fills a page
    { id: "published-key-wrong-encoding", values: { mode: "totp", algorithm: "SHA-1", digits: "6", encoding: "hex", step: "30", input: RFC4226 } }, // read as hex it is another key
  ],
};

/** The runner. */
export const TOTP_HOTP_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
