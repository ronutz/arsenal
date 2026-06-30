// ============================================================================
// src/lib/tools/totp-hotp/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the OTP tool (set id: "totp-hotp-golden-v1").
//
// Every value here is published in the RFCs and was reproduced bit-for-bit by
// this tool's engine before being frozen (28/28 RFC cases passed):
//   - HOTP: RFC 4226 Appendix D - secret ASCII "12345678901234567890",
//     SHA-1, 6 digits, counters 0..9. The canonical HOTP test set.
//   - TOTP: RFC 6238 Appendix B - 8 digits, step 30s, T0 0, with the
//     per-algorithm seeds the RFC specifies (20/32/64 ASCII bytes for
//     SHA-1/256/512). We pin three representative instants across all three
//     hashes, which also exercises the time-step counter math.
// Reject vectors cover a malformed Base32 secret (the UI surfaces the throw).
// ============================================================================

import type { OtpInput } from "./compute";

/** The vector-set identifier referenced by the tool manifest. */
export const GOLDEN_VECTOR_SET_ID = "totp-hotp-golden-v1";

/** One OTP case: `input` must produce exactly `expectedCode`. */
export interface OtpGoldenVector {
  name: string;
  input: OtpInput;
  expectedCode: string;
}

/** A rejection case: `input` must make the engine throw (bad secret). */
export interface OtpRejectVector {
  name: string;
  input: OtpInput;
}

// RFC 4226 secret (shared by the HOTP cases and the SHA-1 TOTP cases).
const SEC_SHA1 = "12345678901234567890";
const SEC_SHA256 = "12345678901234567890123456789012";
const SEC_SHA512 = "1234567890123456789012345678901234567890123456789012345678901234";

export const TOTP_HOTP_GOLDEN_VECTORS: OtpGoldenVector[] = [
  // ---- HOTP, RFC 4226 Appendix D (SHA-1, 6 digits) ----
  { name: "rfc4226-hotp-c0", input: { mode: "hotp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 6, counter: 0 }, expectedCode: "755224" },
  { name: "rfc4226-hotp-c1", input: { mode: "hotp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 6, counter: 1 }, expectedCode: "287082" },
  { name: "rfc4226-hotp-c2", input: { mode: "hotp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 6, counter: 2 }, expectedCode: "359152" },
  { name: "rfc4226-hotp-c5", input: { mode: "hotp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 6, counter: 5 }, expectedCode: "254676" },
  { name: "rfc4226-hotp-c9", input: { mode: "hotp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 6, counter: 9 }, expectedCode: "520489" },

  // ---- TOTP, RFC 6238 Appendix B (8 digits, step 30, T0 0) ----
  // t = 59  (T = 1)
  { name: "rfc6238-totp-t59-sha1", input: { mode: "totp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 8, timestamp: 59, step: 30, t0: 0 }, expectedCode: "94287082" },
  { name: "rfc6238-totp-t59-sha256", input: { mode: "totp", secret: SEC_SHA256, secretEncoding: "ascii", algorithm: "SHA-256", digits: 8, timestamp: 59, step: 30, t0: 0 }, expectedCode: "46119246" },
  { name: "rfc6238-totp-t59-sha512", input: { mode: "totp", secret: SEC_SHA512, secretEncoding: "ascii", algorithm: "SHA-512", digits: 8, timestamp: 59, step: 30, t0: 0 }, expectedCode: "90693936" },
  // t = 1111111111  (T = 37037036)
  { name: "rfc6238-totp-t1111111111-sha1", input: { mode: "totp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 8, timestamp: 1111111111, step: 30, t0: 0 }, expectedCode: "14050471" },
  { name: "rfc6238-totp-t1111111111-sha256", input: { mode: "totp", secret: SEC_SHA256, secretEncoding: "ascii", algorithm: "SHA-256", digits: 8, timestamp: 1111111111, step: 30, t0: 0 }, expectedCode: "67062674" },
  { name: "rfc6238-totp-t1111111111-sha512", input: { mode: "totp", secret: SEC_SHA512, secretEncoding: "ascii", algorithm: "SHA-512", digits: 8, timestamp: 1111111111, step: 30, t0: 0 }, expectedCode: "99943326" },
  // t = 2000000000  (T = 66666666)
  { name: "rfc6238-totp-t2000000000-sha1", input: { mode: "totp", secret: SEC_SHA1, secretEncoding: "ascii", algorithm: "SHA-1", digits: 8, timestamp: 2000000000, step: 30, t0: 0 }, expectedCode: "69279037" },
  { name: "rfc6238-totp-t2000000000-sha256", input: { mode: "totp", secret: SEC_SHA256, secretEncoding: "ascii", algorithm: "SHA-256", digits: 8, timestamp: 2000000000, step: 30, t0: 0 }, expectedCode: "90698825" },
  { name: "rfc6238-totp-t2000000000-sha512", input: { mode: "totp", secret: SEC_SHA512, secretEncoding: "ascii", algorithm: "SHA-512", digits: 8, timestamp: 2000000000, step: 30, t0: 0 }, expectedCode: "38618901" },
];

export const TOTP_HOTP_REJECT_VECTORS: OtpRejectVector[] = [
  // '1' and '8' and '0' are not in the RFC 4648 Base32 alphabet.
  { name: "invalid-base32", input: { mode: "totp", secret: "10808", secretEncoding: "base32", algorithm: "SHA-1", digits: 6, timestamp: 0, step: 30, t0: 0 } },
];
