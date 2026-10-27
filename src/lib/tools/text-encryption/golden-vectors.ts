// ============================================================================
// src/lib/tools/text-encryption/golden-vectors.ts
// ----------------------------------------------------------------------------
// The pinned truth for local text encryption, byte for byte.
//
// KNOWN-ANSWER TESTS FROM FIRST-PARTY SOURCES (read and saved 2026-10-26; read
// again 2026-10-27, byte-identical files, so no vector changed):
//   - PBKDF2-HMAC-SHA-256: the two vectors of RFC 7914, section 11
//     (P="passwd", S="salt", c=1 and P="Password", S="NaCl", c=80000; dkLen 64).
//   - AES-GCM encryption: seven vectors of NIST CAVP gcmEncryptExtIV256.rsp
//     (CAVS 14.0, AES-256, 96-bit IV, 128-bit tag; Count 0 of the groups with
//     plaintext 0, 104, 128 and 408 bits and AAD 0, 128, 160 and 720 bits),
//     each also decrypted back.
//   - AES-GCM decryption: two vectors of gcmDecrypt256.rsp (same parameters,
//     PTlen 128, AADlen 128): Count 0 decrypts, Count 2 is marked FAIL.
//   - base64url: the RFC 4648, section 10 strings ("" to "foobar"; base64url
//     and base64 agree on them once the padding is dropped), and one pair of
//     bytes whose encoding uses "-" and "_".
//
// ROUND TRIPS WITH A FIXED SALT AND IV: each expected string was computed
// before the engine existed, by an independent Python script (hashlib's
// pbkdf2_hmac and the cryptography package's AESGCM, building the format from
// its written rules), and is checked here in both directions: encryption gives
// the string, decryption of the string gives the text back. The page never
// uses a fixed salt or IV; it draws both with crypto.getRandomValues.
//
// SHARE VECTORS (2026-10-27): what a "Share results" link may carry is the
// encrypted string alone, compact (shareableCiphertext); a string that is not
// well formed gives nothing. The round trips through a link, and the proof
// that no passphrase or plaintext reaches one, are in the central harness
// (src/lib/share/cases/text-encryption.ts).
//
// REJECT VECTORS: one or more per refusal code of both directions (malformed
// strings, a wrong version, iteration counts out of range, bad encodings and
// lengths, a wrong passphrase, altered ciphertext, IV, salt and iteration
// fields, empty and over-long inputs), and the rule that a refusal carries no
// text at all.
// ============================================================================

import {
  aesGcmOpen,
  aesGcmSeal,
  base64urlDecode,
  base64urlEncode,
  decryptText,
  encryptText,
  MAX_INPUT_CHARS,
  MAX_PASSPHRASE_CHARS,
  MAX_TEXT_BYTES,
  parseEnvelope,
  passphraseFacts,
  pbkdf2Sha256,
  preparePassphrase,
  shareableCiphertext,
  type PassphraseFacts,
  type TextEncryptionErrorCode,
  type TextEncryptionNote,
} from "./compute"; // the engine

/** The set id: changes whenever any vector changes. */
export const GOLDEN_VECTOR_SET_ID = "text-encryption-golden-2026-10-27"; // 2026-10-27: the share vectors added (first written 2026-10-26)

/** Hex to bytes (the vectors are written in hex, as the sources print them). */
function hex(h: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(h.length / 2); // two digits per byte
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(2 * i, 2 * i + 2), 16); // each byte
  return out; // the bytes
} // hex

/** Bytes to lowercase hex, for the comparisons. */
function toHex(b: Uint8Array | null): string {
  if (!b) return "null"; // no bytes at all
  let s = ""; // the hex text
  for (const x of b) s += x.toString(16).padStart(2, "0"); // two digits each
  return s; // done
} // toHex

/** ASCII text to bytes. */
const ascii = (s: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(s); // ASCII is UTF-8

// ---------------------------------------------------------------------------
// RFC 7914, section 11: PBKDF2-HMAC-SHA-256
// ---------------------------------------------------------------------------

/** One PBKDF2 known answer. */
export interface Pbkdf2Vector { id: string; password: string; salt: string; c: number; dkLen: number; dk: string }

/** RFC 7914, section 11, verbatim (the octets joined). */
export const PBKDF2_VECTORS: readonly Pbkdf2Vector[] = [
  {
    id: "rfc7914-s11-passwd-salt-c1", // the first vector
    password: "passwd", salt: "salt", c: 1, dkLen: 64, // inputs as ASCII
    dk: "55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783", // RFC 7914 page 12
  },
  {
    id: "rfc7914-s11-Password-NaCl-c80000", // the second vector
    password: "Password", salt: "NaCl", c: 80000, dkLen: 64, // inputs as ASCII
    dk: "4ddcd8f60b98be21830cee5ef22701f9641a4418d04c0414aeff08876b34ab56a1d425a1225833549adb841b51c9b3176a272bdebba1d078478f62b397f33c8d", // RFC 7914 page 12
  },
];

// ---------------------------------------------------------------------------
// NIST CAVP: AES-GCM (gcmEncryptExtIV256.rsp and gcmDecrypt256.rsp)
// ---------------------------------------------------------------------------

/** One AES-GCM known answer, as the .rsp file prints it. */
export interface GcmVector { id: string; group: string; key: string; iv: string; pt: string; aad: string; ct: string; tag: string }

/** gcmEncryptExtIV256.rsp, CAVS 14.0 (generated 31 August 2012), Count 0 of seven groups, verbatim. */
export const GCM_ENCRYPT_VECTORS: readonly GcmVector[] = [
  { id: "cavp-enc256-pt0-aad0-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 0] [AADlen = 0] [Taglen = 128] Count = 0", key: "b52c505a37d78eda5dd34f20c22540ea1b58963cf8e5bf8ffa85f9f2492505b4", iv: "516c33929df5a3284ff463d7", pt: "", aad: "", ct: "", tag: "bdc1ac884d332457a1d2664f168c76f0" },
  { id: "cavp-enc256-pt0-aad128-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 0] [AADlen = 128] [Taglen = 128] Count = 0", key: "78dc4e0aaf52d935c3c01eea57428f00ca1fd475f5da86a49c8dd73d68c8e223", iv: "d79cf22d504cc793c3fb6c8a", pt: "", aad: "b96baa8c1c75a671bfb2d08d06be5f36", ct: "", tag: "3e5d486aa2e30b22e040b85723a06e76" },
  { id: "cavp-enc256-pt128-aad0-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 128] [AADlen = 0] [Taglen = 128] Count = 0", key: "31bdadd96698c204aa9ce1448ea94ae1fb4a9a0b3c9d773b51bb1822666b8f22", iv: "0d18e06c7c725ac9e362e1ce", pt: "2db5168e932556f8089a0622981d017d", aad: "", ct: "fa4362189661d163fcd6a56d8bf0405a", tag: "d636ac1bbedd5cc3ee727dc2ab4a9489" },
  { id: "cavp-enc256-pt128-aad128-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 128] [AADlen = 128] [Taglen = 128] Count = 0", key: "92e11dcdaa866f5ce790fd24501f92509aacf4cb8b1339d50c9c1240935dd08b", iv: "ac93a1a6145299bde902f21a", pt: "2d71bcfa914e4ac045b2aa60955fad24", aad: "1e0889016f67601c8ebea4943bc23ad6", ct: "8995ae2e6df3dbf96fac7b7137bae67f", tag: "eca5aa77d51d4a0a14d9c51e1da474ab" },
  { id: "cavp-enc256-pt104-aad720-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 104] [AADlen = 720] [Taglen = 128] Count = 0", key: "ff9506b4d46ba54128876fadfcc673a4c927c618ea7d95cfcaa508cbc8f7fc66", iv: "3742ad2208a0484345eee1be", pt: "7fd0d6cadc92cad27bb2d7d8c8", aad: "f1360a27fdc244be8739d85af6491c762a693aafe668c449515fdeeedb6a90aeee3891bbc8b69adc6a6426cb12fcdebc32c9f58c5259d128b91efa28620a3a9a0168b0ff5e76951cb41647ba4aa1f87fac0d97ac580e42cffc7e", ct: "bdb8346b28eb4d7226493611a6", tag: "7484d827b767647f44c7f94a39f8175c" },
  { id: "cavp-enc256-pt408-aad160-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 408] [AADlen = 160] [Taglen = 128] Count = 0", key: "24501ad384e473963d476edcfe08205237acfd49b5b8f33857f8114e863fec7f", iv: "9ff18563b978ec281b3f2794", pt: "27f348f9cdc0c5bd5e66b1ccb63ad920ff2219d14e8d631b3872265cf117ee86757accb158bd9abb3868fdc0d0b074b5f01b2c", aad: "adb5ec720ccf9898500028bf34afccbcaca126ef", ct: "eb7cb754c824e8d96f7c6d9b76c7d26fb874ffbf1d65c6f64a698d839b0b06145dae82057ad55994cf59ad7f67c0fa5e85fab8", tag: "bc95c532fecc594c36d1550286a7a3f0" },
  { id: "cavp-enc256-pt408-aad720-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 408] [AADlen = 720] [Taglen = 128] Count = 0", key: "148579a3cbca86d5520d66c0ec71ca5f7e41ba78e56dc6eebd566fed547fe691", iv: "b08a5ea1927499c6ecbfd4e0", pt: "9d0b15fdf1bd595f91f8b3abc0f7dec927dfd4799935a1795d9ce00c9b879434420fe42c275a7cd7b39d638fb81ca52b49dc41", aad: "e4f963f015ffbb99ee3349bbaf7e8e8e6c2a71c230a48f9d59860a29091d2747e01a5ca572347e247d25f56ba7ae8e05cde2be3c97931292c02370208ecd097ef692687fecf2f419d3200162a6480a57dad408a0dfeb492e2c5d", ct: "2097e372950a5e9383c675e89eea1c314f999159f5611344b298cda45e62843716f215f82ee663919c64002a5c198d7878fd3f", tag: "adbecdb0d5c2224d804d2886ff9a5760" },
];

/** One CAVP decryption known answer: pt is the expected plaintext, or null for a vector the file marks FAIL. */
export interface GcmDecryptVector { id: string; group: string; key: string; iv: string; ct: string; aad: string; tag: string; pt: string | null }

/** gcmDecrypt256.rsp, CAVS 14.0, group [Keylen 256, IVlen 96, PTlen 128, AADlen 128, Taglen 128], verbatim. */
export const GCM_DECRYPT_VECTORS: readonly GcmDecryptVector[] = [
  { id: "cavp-dec256-pt128-aad128-c0", group: "[Keylen = 256] [IVlen = 96] [PTlen = 128] [AADlen = 128] [Taglen = 128] Count = 0", key: "54e352ea1d84bfe64a1011096111fbe7668ad2203d902a01458c3bbd85bfce14", iv: "df7c3bca00396d0c018495d9", ct: "426e0efc693b7be1f3018db7ddbb7e4d", aad: "7e968d71b50c1f11fd001f3fef49d045", tag: "ee8257795be6a1164d7e1d2d6cac77a7", pt: "85fc3dfad9b5a8d3258e4fc44571bd3b" },
  { id: "cavp-dec256-pt128-aad128-c2-FAIL", group: "[Keylen = 256] [IVlen = 96] [PTlen = 128] [AADlen = 128] [Taglen = 128] Count = 2", key: "9a0343f850a6427120f764789ffec6d237447b898fbf51d2182f065d3861497d", iv: "3deef6f453dd70d92143adcd", ct: "e93165935ac18e3a2845d15fe31a9286", aad: "dbb8226a624520863db6897017b2a4f8", tag: "f5fc50d18766bc3d9e16dd136d45816b", pt: null },
];

// ---------------------------------------------------------------------------
// RFC 4648: base64url
// ---------------------------------------------------------------------------

/** The section 10 strings with their padding dropped, plus one pair whose encoding needs "-" and "_". */
export const BASE64URL_VECTORS: readonly { bytes: string; text: string }[] = [
  { bytes: "", text: "" }, // BASE64("") = ""
  { bytes: "66", text: "Zg" }, // BASE64("f") = "Zg=="
  { bytes: "666f", text: "Zm8" }, // BASE64("fo") = "Zm8="
  { bytes: "666f6f", text: "Zm9v" }, // BASE64("foo") = "Zm9v"
  { bytes: "666f6f62", text: "Zm9vYg" }, // BASE64("foob") = "Zm9vYg=="
  { bytes: "666f6f6261", text: "Zm9vYmE" }, // BASE64("fooba") = "Zm9vYmE="
  { bytes: "666f6f626172", text: "Zm9vYmFy" }, // BASE64("foobar") = "Zm9vYmFy"
  { bytes: "fbff", text: "-_8" }, // values 62 and 63: base64 would write "+/8=" (Table 1 against Table 2)
];

/** Texts that base64urlDecode must refuse. */
export const BASE64URL_REJECTS: readonly string[] = [
  "Zg==", // padding is not part of this format
  "Zm9v+", // "+" belongs to base64, not base64url (and the length is 1 more than a multiple of 4)
  "Zm/v", // "/" belongs to base64
  "Z", // a single leftover character encodes nothing
  "Zh", // "h" leaves non-zero pad bits: not canonical (RFC 4648, section 3.5)
  "Zm9", // "9" leaves non-zero pad bits
  "Zm 9v", // white space inside a field
];

// ---------------------------------------------------------------------------
// Round trips with a fixed salt and IV (expected strings from the independent Python reference)
// ---------------------------------------------------------------------------

/** One round trip: the inputs, the exact string, and what must come back. */
export interface RoundTripVector {
  /** Stable name. */
  id: string;
  /** The text. */
  text: string;
  /** The passphrase as typed. */
  passphrase: string;
  /** The salt, hex. */
  salt: string;
  /** The IV, hex. */
  iv: string;
  /** The iteration count. */
  iterations: number;
  /** The exact string encryption must produce. */
  output: string;
  /** The text's length in UTF-8 bytes. */
  textBytes: number;
  /** The notes encryption must report. */
  notes: TextEncryptionNote[];
}

/** The Example's text: verbatim the D-83 Example of the page. */
export const EXAMPLE_TEXT = "Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo)."; // 83 bytes in UTF-8
/** The Example's passphrase: the test password published in RFC 7914, section 11. Published, so it protects nothing. */
export const EXAMPLE_PASSPHRASE = "Password"; // never use it for real text
/** The Example's encrypted string: the "example" round trip, with a fixed salt and IV and 600,000 iterations. */
export const EXAMPLE_ENCRYPTED =
  "aesgcm1.600000.AAECAwQFBgcICQoLDA0ODw.EBESExQVFhcYGRob.3lWZqiea5CBmHGG_p5hZlHAsyDWrUvodTVylWbD21ET_l6EJU6iStykH4Cijam4qRalDuZSAQlo1ZDMrENrMOTtEhvk6BEHdiwTXimwB2PbwGcgOs3JWZ4RZdKJYqmh3xKNf"; // Python reference

/** The Portuguese multi-line text shared by three vectors whose passphrases differ only before preparation. */
const PT_TEXT = "Ação na linha 1\nlinha 2\tcom tabulação\r\nfim"; // CR LF kept as written
/** Its expected string (the same for all three passphrases). */
const PT_OUTPUT = "aesgcm1.1000.W-TDopGPfm1cSzopGAcGBQ.ICEiIyQlJicoKSor.w8fVgTYjtUD5YDnzDqm2xhimvjEjJCbQ1dj71YEaGNTMCKPVvOn9pbfiv8iAq_uRFeWMfTj56CFmZaD3p6w"; // Python reference

/** The round trips. */
export const ROUND_TRIP_VECTORS: readonly RoundTripVector[] = [
  {
    id: "example", // the page's Example, at the default count
    text: EXAMPLE_TEXT, passphrase: EXAMPLE_PASSPHRASE,
    salt: "000102030405060708090a0b0c0d0e0f", iv: "101112131415161718191a1b", iterations: 600000,
    output: EXAMPLE_ENCRYPTED, textBytes: 83, notes: [],
  },
  {
    id: "ascii-floor", // the smallest count accepted
    text: "hello", passphrase: "passwd",
    salt: "f0e1d2c3b4a5968778695a4b3c2d1e0f", iv: "0f1e2d3c4b5a69788796a5b4", iterations: 1000,
    output: "aesgcm1.1000.8OHSw7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.zpK3GeiAkYrShrcTKAlOB3mPmgDi", textBytes: 5, notes: [],
  },
  {
    id: "multiline-ptbr", // accents, LF, tab and CR LF, and a Portuguese passphrase in NFC
    text: PT_TEXT, passphrase: "coração de exemplo",
    salt: "5be4c3a2918f7e6d5c4b3a2918070605", iv: "202122232425262728292a2b", iterations: 1000,
    output: PT_OUTPUT, textBytes: 46, notes: [],
  },
  {
    id: "multiline-ptbr-nfd-passphrase", // the same passphrase in decomposed form (c + U+0327, a + U+0303): same string
    text: PT_TEXT, passphrase: "coração de exemplo",
    salt: "5be4c3a2918f7e6d5c4b3a2918070605", iv: "202122232425262728292a2b", iterations: 1000,
    output: PT_OUTPUT, textBytes: 46, notes: ["passphrase-prepared"],
  },
  {
    id: "multiline-ptbr-nbsp-passphrase", // a no-break space (U+00A0) and an ideographic space (U+3000): same string
    text: PT_TEXT, passphrase: "coração de　exemplo",
    salt: "5be4c3a2918f7e6d5c4b3a2918070605", iv: "202122232425262728292a2b", iterations: 1000,
    output: PT_OUTPUT, textBytes: 46, notes: ["passphrase-prepared"],
  },
  {
    id: "astral", // characters outside the Basic Multilingual Plane, and a zero-width joiner sequence
    text: "Lock \u{1F510}, clef \u{1D11E}, and a joined sequence: \u{1F469}‍\u{1F4BB}", passphrase: "Password",
    salt: "303132333435363738393a3b3c3d3e3f", iv: "404142434445464748494a4b", iterations: 1000,
    output: "aesgcm1.1000.MDEyMzQ1Njc4OTo7PD0-Pw.QEFCQ0RFRkdISUpL.UWCu4qmxBGmecriCRfWXcew2IiGqyNNDI3rHI9_LmAAofgtnip8UJdf86_MOtry4q3zYzO4AlgYlgDXPLXMw3yxMyzJemLtu", textBytes: 56, notes: [],
  },
  {
    id: "bom-kept", // a byte order mark at the start of the text is text, and comes back
    text: "﻿text after a byte order mark", passphrase: "passwd",
    salt: "505152535455565758595a5b5c5d5e5f", iv: "606162636465666768696a6b", iterations: 1000,
    output: "aesgcm1.1000.UFFSU1RVVldYWVpbXF1eXw.YGFiY2RlZmdoaWpr.n-WlnCQ3fhHXdlvf4zKefpaHkpBRdVcF-uIP73xwxim_7cmVQde-kupsxy05a2Y", textBytes: 31, notes: [],
  },
];

/** The ascii-floor string as an e-mail client might wrap it: spaces in front, a line break every 20 characters. */
export const WRAPPED_INPUT = "  " + (ROUND_TRIP_VECTORS[1].output.match(/.{1,20}/g) ?? []).join("\r\n") + "\n"; // decrypts with a note

// ---------------------------------------------------------------------------
// Reject vectors
// ---------------------------------------------------------------------------

/** A string and passphrase that decryption must refuse, with the code (and the field for bad-encoding). */
export interface DecryptRejectVector {
  /** Stable name. */
  id: string;
  /** The string, or a builder for the large ones (built only when run). */
  input: string | (() => string);
  /** The passphrase. */
  passphrase: string;
  /** The expected code. */
  code: TextEncryptionErrorCode;
  /** The expected field, for bad-encoding. */
  field?: "salt" | "iv" | "ciphertext";
}

/** The ascii-floor string's fields, for building near misses. */
const F = ROUND_TRIP_VECTORS[1].output.split("."); // [version, iterations, salt, iv, sealed]
/** Replace one field of the ascii-floor string. */
const withField = (i: number, v: string): string => F.map((x, k) => (k === i ? v : x)).join("."); // a near miss
/** Change one character of a field at a position, to the given character. */
const alter = (i: number, pos: number, ch: string): string => withField(i, F[i].slice(0, pos) + ch + F[i].slice(pos + 1)); // an altered field

/** Decryption refusals. */
export const DECRYPT_REJECT_VECTORS: readonly DecryptRejectVector[] = [
  { id: "empty", input: "", passphrase: "passwd", code: "empty-input" }, // nothing
  { id: "whitespace-only", input: " \r\n\t ", passphrase: "passwd", code: "empty-input" }, // nothing but white space
  { id: "too-large", input: () => "a".repeat(MAX_INPUT_CHARS + 1), passphrase: "passwd", code: "input-too-large" }, // over the bound
  { id: "three-fields", input: "aesgcm1.1000.8OHSw7Sllod4aVpLPC0eDw", passphrase: "passwd", code: "bad-format" }, // truncated
  { id: "six-fields", input: ROUND_TRIP_VECTORS[1].output + ".AAAA", passphrase: "passwd", code: "bad-format" }, // one too many
  { id: "jwt-shaped", input: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln", passphrase: "passwd", code: "bad-format" }, // another dotted format
  { id: "version-2", input: withField(0, "aesgcm2"), passphrase: "passwd", code: "unknown-version" }, // a later version
  { id: "version-uppercase", input: withField(0, "AESGCM1"), passphrase: "passwd", code: "unknown-version" }, // the tag is case-sensitive
  { id: "iterations-leading-zero", input: withField(1, "01000"), passphrase: "passwd", code: "bad-iterations" }, // not canonical
  { id: "iterations-exponent", input: withField(1, "1e3"), passphrase: "passwd", code: "bad-iterations" }, // not a plain integer
  { id: "iterations-empty", input: withField(1, ""), passphrase: "passwd", code: "bad-iterations" }, // missing
  { id: "iterations-nine-digits", input: withField(1, "100000000"), passphrase: "passwd", code: "bad-iterations" }, // more digits than any count allowed
  { id: "iterations-below-floor", input: withField(1, "999"), passphrase: "passwd", code: "iterations-out-of-range" }, // below SP 800-132's 1,000
  { id: "iterations-above-ceiling", input: withField(1, "10000001"), passphrase: "passwd", code: "iterations-out-of-range" }, // above 10,000,000
  { id: "salt-plus", input: alter(2, 3, "+"), passphrase: "passwd", code: "bad-encoding", field: "salt" }, // a base64 character
  { id: "salt-padded", input: withField(2, F[2] + "=="), passphrase: "passwd", code: "bad-encoding", field: "salt" }, // padding
  { id: "salt-noncanonical", input: alter(2, 21, "x"), passphrase: "passwd", code: "bad-encoding", field: "salt" }, // "x" leaves pad bits set
  { id: "salt-15-bytes", input: withField(2, base64urlEncode(new Uint8Array(15))), passphrase: "passwd", code: "bad-salt-length" }, // 120 bits
  { id: "iv-16-bytes", input: withField(3, base64urlEncode(new Uint8Array(16))), passphrase: "passwd", code: "bad-iv-length" }, // 128 bits
  { id: "iv-bad-length-mod4", input: withField(3, F[3] + "A"), passphrase: "passwd", code: "bad-encoding", field: "iv" }, // 17 characters
  { id: "ciphertext-slash", input: alter(4, 4, "/"), passphrase: "passwd", code: "bad-encoding", field: "ciphertext" }, // a base64 character
  { id: "ciphertext-15-bytes", input: withField(4, base64urlEncode(new Uint8Array(15))), passphrase: "passwd", code: "too-short" }, // shorter than the tag
  { id: "ciphertext-too-large", input: () => withField(4, "A".repeat(1_398_128)), passphrase: "passwd", code: "text-too-large" }, // 1,048,596 bytes: over 1 MiB + 16
  { id: "empty-passphrase", input: ROUND_TRIP_VECTORS[1].output, passphrase: "", code: "empty-passphrase" }, // no passphrase
  { id: "passphrase-too-long", input: ROUND_TRIP_VECTORS[1].output, passphrase: "x".repeat(MAX_PASSPHRASE_CHARS + 1), code: "passphrase-too-long" }, // over the bound
  { id: "passphrase-lone-surrogate", input: ROUND_TRIP_VECTORS[1].output, passphrase: "pass\ud800wd", code: "lone-surrogate" }, // not encodable
  { id: "wrong-passphrase", input: ROUND_TRIP_VECTORS[1].output, passphrase: "Passwd", code: "auth-failed" }, // one letter's case
  { id: "wrong-passphrase-example", input: EXAMPLE_ENCRYPTED, passphrase: "password", code: "auth-failed" }, // the Example, lowercase p
  { id: "altered-ciphertext", input: alter(4, 2, F[4][2] === "A" ? "B" : "A"), passphrase: "passwd", code: "auth-failed" }, // one ciphertext character
  { id: "altered-tag", input: alter(4, 20, F[4][20] === "A" ? "B" : "A"), passphrase: "passwd", code: "auth-failed" }, // a character inside the tag
  { id: "altered-iv", input: alter(3, 0, F[3][0] === "A" ? "B" : "A"), passphrase: "passwd", code: "auth-failed" }, // the IV
  { id: "altered-salt", input: alter(2, 0, F[2][0] === "A" ? "B" : "A"), passphrase: "passwd", code: "auth-failed" }, // the salt: another key
  { id: "altered-iterations", input: withField(1, "1001"), passphrase: "passwd", code: "auth-failed" }, // another key, and the header is authenticated
  { id: "swapped-ciphertext", input: withField(4, ROUND_TRIP_VECTORS[6].output.split(".")[4]), passphrase: "passwd", code: "auth-failed" }, // another string's ciphertext
  { id: "not-utf8", input: "aesgcm1.1000.cHFyc3R1dnd4eXp7fH1-fw.gIGCg4SFhoeIiYqL.bbt7f6PrdZB1dBe8Demdal3D4w", passphrase: "passwd", code: "not-utf8" }, // authentic bytes ff fe fd (Python reference)
];

/** An encryption that must be refused. */
export interface EncryptRejectVector {
  /** Stable name. */
  id: string;
  /** The text, or a builder. */
  text: string | (() => string);
  /** The passphrase. */
  passphrase: string;
  /** The salt, hex. */
  salt: string;
  /** The IV, hex. */
  iv: string;
  /** The count. */
  iterations: number;
  /** The expected code. */
  code: TextEncryptionErrorCode;
}

/** A valid salt and IV for the encryption refusals. */
const S16 = "000102030405060708090a0b0c0d0e0f", I12 = "101112131415161718191a1b"; // 16 and 12 bytes

/** Encryption refusals. */
export const ENCRYPT_REJECT_VECTORS: readonly EncryptRejectVector[] = [
  { id: "empty-text", text: "", passphrase: "passwd", salt: S16, iv: I12, iterations: 1000, code: "empty-text" }, // nothing
  { id: "text-too-large", text: () => "a".repeat(MAX_TEXT_BYTES + 1), passphrase: "passwd", salt: S16, iv: I12, iterations: 1000, code: "text-too-large" }, // 1 MiB + 1
  { id: "text-too-large-utf8", text: () => "é".repeat(MAX_TEXT_BYTES / 2 + 1), passphrase: "passwd", salt: S16, iv: I12, iterations: 1000, code: "text-too-large" }, // bytes, not characters
  { id: "text-lone-surrogate", text: "abc\udc00", passphrase: "passwd", salt: S16, iv: I12, iterations: 1000, code: "lone-surrogate" }, // a low surrogate alone
  { id: "empty-passphrase", text: "hello", passphrase: "", salt: S16, iv: I12, iterations: 1000, code: "empty-passphrase" }, // no passphrase
  { id: "passphrase-too-long", text: "hello", passphrase: "\u{1F510}".repeat(MAX_PASSPHRASE_CHARS + 1), salt: S16, iv: I12, iterations: 1000, code: "passphrase-too-long" }, // counted in code points
  { id: "salt-8-bytes", text: "hello", passphrase: "passwd", salt: "0001020304050607", iv: I12, iterations: 1000, code: "bad-salt-length" }, // 64 bits
  { id: "iv-16-bytes", text: "hello", passphrase: "passwd", salt: S16, iv: "101112131415161718191a1b1c1d1e1f", iterations: 1000, code: "bad-iv-length" }, // 128 bits
  { id: "iterations-999", text: "hello", passphrase: "passwd", salt: S16, iv: I12, iterations: 999, code: "iterations-out-of-range" }, // below the floor
  { id: "iterations-above", text: "hello", passphrase: "passwd", salt: S16, iv: I12, iterations: 10_000_001, code: "iterations-out-of-range" }, // above the ceiling
  { id: "iterations-fraction", text: "hello", passphrase: "passwd", salt: S16, iv: I12, iterations: 1000.5, code: "iterations-out-of-range" }, // not an integer
];

/** Passphrase facts that must come out exactly. */
export const FACT_VECTORS: readonly { id: string; passphrase: string; facts: PassphraseFacts }[] = [
  { id: "Password", passphrase: "Password", facts: { characters: 8, utf8Bytes: 8, lowercase: true, uppercase: true, otherLetters: false, digits: false, spaces: false, symbols: false, edgeWhitespace: false, prepared: false } },
  { id: "pt-nfd", passphrase: "coração de exemplo", facts: { characters: 18, utf8Bytes: 20, lowercase: true, uppercase: false, otherLetters: false, digits: false, spaces: true, symbols: false, edgeWhitespace: false, prepared: true } },
  { id: "digits-symbols-edge", passphrase: " 2026-10-26!", facts: { characters: 12, utf8Bytes: 12, lowercase: false, uppercase: false, otherLetters: false, digits: true, spaces: true, symbols: true, edgeWhitespace: true, prepared: false } },
  { id: "kana", passphrase: "パスワード　二〇二六", facts: { characters: 10, utf8Bytes: 28, lowercase: false, uppercase: false, otherLetters: true, digits: false, spaces: true, symbols: true, edgeWhitespace: false, prepared: true } },
];

// ---------------------------------------------------------------------------
// Share results (2026-10-27): shareableCiphertext
// ---------------------------------------------------------------------------

/** Strings a link may carry, and the compact form it carries. */
export const SHARE_ACCEPT_VECTORS: readonly { id: string; input: string; expect: string }[] = [
  { id: "share-example", input: EXAMPLE_ENCRYPTED, expect: EXAMPLE_ENCRYPTED }, // the Example's string, as it is
  { id: "share-ascii-floor", input: ROUND_TRIP_VECTORS[1].output, expect: ROUND_TRIP_VECTORS[1].output }, // the smallest count
  { id: "share-astral", input: ROUND_TRIP_VECTORS[5].output, expect: ROUND_TRIP_VECTORS[5].output }, // another string
  { id: "share-wrapped", input: WRAPPED_INPUT, expect: ROUND_TRIP_VECTORS[1].output }, // white space removed
  { id: "share-wrong-passphrase-still-shareable", input: "aesgcm1.1000.8OHSw7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.zpK3GeiAkYrShrcTKAlOB3mPmgDi", expect: "aesgcm1.1000.8OHSw7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.zpK3GeiAkYrShrcTKAlOB3mPmgDi" }, // well formed: what it decrypts to is not looked at
];

/** Texts no link may carry (and no arrival is accepted as). */
export const SHARE_REJECT_VECTORS: readonly { id: string; input: string }[] = [
  { id: "share-empty", input: "" }, // nothing
  { id: "share-plain-text", input: "Lab notes: the core switch maintenance window moves to Saturday 02:00 (São Paulo)." }, // a plaintext is never a share
  { id: "share-passphrase-alone", input: "Password" }, // nor a passphrase
  { id: "share-three-fields", input: "aesgcm1.1000.8OHSw7Sllod4aVpLPC0eDw" }, // truncated
  { id: "share-version-2", input: "aesgcm2.1000.8OHSw7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.zpK3GeiAkYrShrcTKAlOB3mPmgDi" }, // another format
  { id: "share-iterations-below-floor", input: "aesgcm1.999.8OHSw7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.zpK3GeiAkYrShrcTKAlOB3mPmgDi" }, // out of range
  { id: "share-salt-plus", input: "aesgcm1.1000.8OH+w7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.zpK3GeiAkYrShrcTKAlOB3mPmgDi" }, // not base64url
  { id: "share-too-short", input: "aesgcm1.1000.8OHSw7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.AAAAAAAAAAAAAAAAAAAA" }, // 15 bytes: shorter than a tag
  { id: "share-with-passphrase-appended", input: "aesgcm1.1000.8OHSw7Sllod4aVpLPC0eDw.Dx4tPEtaaXiHlqW0.zpK3GeiAkYrShrcTKAlOB3mPmgDi.passwd" }, // six fields
];

/** The input detector's example (the ascii-floor string; the paste box matches it). */
export const DETECTOR_EXAMPLE = ROUND_TRIP_VECTORS[1].output; // a complete, valid string

// ---------------------------------------------------------------------------
// The runner
// ---------------------------------------------------------------------------

/**
 * verifyVectors: run every known answer, round trip, reject vector and fact; collect every failure.
 * @returns the set id, how many checks ran, how many passed, and the failures
 */
export async function verifyVectors(): Promise<{ setId: string; total: number; passed: number; failures: string[] }> {
  const failures: string[] = []; // every failure, with its vector id
  let total = 0; // checks run
  /** Record one check. */
  const check = (ok: boolean, msg: string): void => { total++; if (!ok) failures.push(msg); }; // counted, and kept when failed

  // RFC 7914, section 11.
  for (const v of PBKDF2_VECTORS) { // each PBKDF2 vector
    const dk = await pbkdf2Sha256(ascii(v.password), ascii(v.salt), v.c, v.dkLen); // the engine's primitive
    check(toHex(dk) === v.dk, `[${v.id}] got ${toHex(dk)}`); // byte for byte
  } // PBKDF2

  // CAVP encryption, and each one decrypted back.
  for (const v of GCM_ENCRYPT_VECTORS) { // each encryption vector
    const sealed = await aesGcmSeal(hex(v.key), hex(v.iv), hex(v.pt), hex(v.aad)); // C || T
    check(toHex(sealed) === v.ct + v.tag, `[${v.id}] seal got ${toHex(sealed)}`); // the known answer
    const opened = await aesGcmOpen(hex(v.key), hex(v.iv), hex(v.ct + v.tag), hex(v.aad)); // and back
    check(opened.kind === "plaintext" && toHex(opened.bytes) === v.pt, `[${v.id}] open got ${opened.kind}`); // the plaintext
  } // CAVP encrypt

  // CAVP decryption, including the FAIL vector.
  for (const v of GCM_DECRYPT_VECTORS) { // each decryption vector
    const opened = await aesGcmOpen(hex(v.key), hex(v.iv), hex(v.ct + v.tag), hex(v.aad)); // authenticate and decrypt
    if (v.pt === null) check(opened.kind === "fail", `[${v.id}] expected FAIL, got ${opened.kind}`); // inauthentic
    else check(opened.kind === "plaintext" && toHex(opened.bytes) === v.pt, `[${v.id}] got ${opened.kind}`); // authentic
  } // CAVP decrypt

  // RFC 4648.
  for (const v of BASE64URL_VECTORS) { // each codec vector
    check(base64urlEncode(hex(v.bytes)) === v.text, `[b64url ${v.bytes}] encode got ${base64urlEncode(hex(v.bytes))}`); // encode
    check(toHex(base64urlDecode(v.text)) === v.bytes, `[b64url ${v.text}] decode got ${toHex(base64urlDecode(v.text))}`); // decode
  } // codec
  for (const s of BASE64URL_REJECTS) check(base64urlDecode(s) === null, `[b64url reject ${JSON.stringify(s)}] was accepted`); // strictness

  // Round trips with a fixed salt and IV.
  for (const v of ROUND_TRIP_VECTORS) { // each round trip
    const e = await encryptText({ text: v.text, passphrase: v.passphrase, salt: hex(v.salt), iv: hex(v.iv), iterations: v.iterations }); // encrypt
    check(e.ok && e.output === v.output, `[${v.id}] encrypt got ${e.ok ? e.output : e.error.code}`); // the exact string
    check(e.ok && e.textBytes === v.textBytes && e.sealedBytes === v.textBytes + 16 && e.iterations === v.iterations, `[${v.id}] counts`); // the counts
    check(e.ok && JSON.stringify(e.notes) === JSON.stringify(v.notes), `[${v.id}] notes got ${e.ok ? JSON.stringify(e.notes) : "-"}`); // the notes
    const d = await decryptText({ input: v.output, passphrase: v.passphrase }); // decrypt the expected string
    check(d.ok && d.text === v.text, `[${v.id}] decrypt got ${d.ok ? JSON.stringify(d.text) : d.error.code}`); // the text back, exactly
    check(d.ok && d.textBytes === v.textBytes && d.iterations === v.iterations, `[${v.id}] decrypt counts`); // the counts
    const p = parseEnvelope(v.output); // the fields alone
    check(p.ok && p.envelope.iterations === v.iterations && toHex(p.envelope.salt) === v.salt && toHex(p.envelope.iv) === v.iv && p.envelope.sealed.length === v.textBytes + 16, `[${v.id}] parse`); // as written
  } // round trips

  // The same text and passphrase under another salt give another string (the page draws a new salt every time).
  const other = await encryptText({ text: "hello", passphrase: "passwd", salt: hex("f0e1d2c3b4a5968778695a4b3c2d1e0e"), iv: hex("0f1e2d3c4b5a69788796a5b4"), iterations: 1000 }); // last salt byte changed
  check(other.ok && other.output !== ROUND_TRIP_VECTORS[1].output, "[fresh-salt] a different salt must give a different string"); // different
  check(other.ok && (await decryptText({ input: other.output, passphrase: "passwd" })).ok, "[fresh-salt] and it must decrypt"); // still valid

  // A wrapped, padded string decrypts, with a note.
  const w = await decryptText({ input: WRAPPED_INPUT, passphrase: "passwd" }); // white space everywhere
  check(w.ok && w.text === "hello" && JSON.stringify(w.notes) === JSON.stringify(["whitespace-removed"]), `[wrapped] got ${w.ok ? JSON.stringify(w.notes) : w.error.code}`); // read through

  // The ceiling itself is accepted by the parser (deriving 10,000,000 iterations here would only cost time).
  check(parseEnvelope(withField(1, "10000000")).ok, "[iterations-ceiling] 10,000,000 must parse"); // inclusive
  check(parseEnvelope(withField(1, "1000")).ok, "[iterations-floor] 1,000 must parse"); // inclusive

  // Preparation: RFC 8265's mapping, exactly.
  check(preparePassphrase("a b c　d e") === "a b c d e", "[prepare] non-ASCII spaces to U+0020"); // Zs mapped, U+0020 kept
  check(preparePassphrase("é") === "é", "[prepare] NFC composes"); // e + combining acute
  check(preparePassphrase("Ａ") === "Ａ", "[prepare] no width mapping"); // fullwidth A stays (rule 1)
  check(preparePassphrase("Aa") === "Aa", "[prepare] no case mapping"); // case kept (rule 3)

  // Decryption refusals, and no text in any of them.
  for (const v of DECRYPT_REJECT_VECTORS) { // each refusal
    const input = typeof v.input === "function" ? v.input() : v.input; // built only now
    const r = await decryptText({ input, passphrase: v.passphrase }); // the engine
    check(!r.ok && r.error.code === v.code, `[${v.id}] expected ${v.code}, got ${r.ok ? "ok" : r.error.code}`); // the right code
    if (v.field) check(!r.ok && r.error.params?.field === v.field, `[${v.id}] field: got ${!r.ok ? r.error.params?.field : "-"}`); // the right field
    check(!("text" in r), `[${v.id}] a refusal must carry no text`); // never a partial result
  } // decrypt refusals

  // Encryption refusals.
  for (const v of ENCRYPT_REJECT_VECTORS) { // each refusal
    const text = typeof v.text === "function" ? v.text() : v.text; // built only now
    const r = await encryptText({ text, passphrase: v.passphrase, salt: hex(v.salt), iv: hex(v.iv), iterations: v.iterations }); // the engine
    check(!r.ok && r.error.code === v.code, `[${v.id}] expected ${v.code}, got ${r.ok ? "ok" : r.error.code}`); // the right code
    check(!("output" in r), `[${v.id}] a refusal must carry no output`); // nothing half made
  } // encrypt refusals

  // Share results: the compact string, or nothing.
  for (const v of SHARE_ACCEPT_VECTORS) check(shareableCiphertext(v.input) === v.expect, `[${v.id}] got ${JSON.stringify(shareableCiphertext(v.input))}`); // accepted
  for (const v of SHARE_REJECT_VECTORS) check(shareableCiphertext(v.input) === null, `[${v.id}] was accepted`); // refused

  // Passphrase facts.
  for (const v of FACT_VECTORS) { // each fact vector
    const f = passphraseFacts(v.passphrase); // the engine
    check(JSON.stringify(f) === JSON.stringify(v.facts), `[facts ${v.id}] got ${JSON.stringify(f)}`); // exact
  } // facts

  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures }; // the report
} // verifyVectors
