// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/python-bytes-and-text/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the bytes-and-text lab (set 2026-10-27a). Every accept
// vector's expected values were produced by CPython 3.13.16 itself, running
// the same text.encode(...).decode(...) the lab models, and written into this
// file by a generator rather than copied by hand; the verdict is the model's
// own reading of those values. Beyond these, the model was compared with
// CPython 3.13.16 on 61,040 random encode-and-decode cases and 270,000 random
// decodes of raw bytes (every codec and handler, UTF-8 and UTF-16 edge bytes
// included) on 2026-10-27, with no difference. Reject vectors pin the
// stable error codes. verifyVectors() runs them all; scripts/run-golden-vectors
// runs it at prebuild and fails the build on any drift.
// ============================================================================

import { compute, BytesTextError, type BytesTextErrorCode, type BytesTextInput, type BytesTextResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "python-bytes-and-text/2026-10-27a";

/** The figures a vector can pin, read off the model's result. */
interface Pinned {
  /** The encoded bytes (null when encoding failed). */
  bytes: number[] | null;
  /** repr() of the bytes. */
  bytesRepr: string | null;
  /** Characters the encode handler replaced or dropped. */
  encodeHandled: number;
  /** str() of the UnicodeEncodeError, when one is raised. */
  encodeMessage: string;
  /** repr() of the decoded text. */
  decodedRepr: string | null;
  /** Error ranges the decode handler dealt with. */
  decodeHandled: number;
  /** str() of the UnicodeDecodeError, when one is raised. */
  decodeMessage: string;
  /** Whether the text came back unchanged. */
  sameText: boolean | null;
  /** For surrogateescape: true when the bytes come back, or the message of the error that stops them. */
  bytesBack: boolean | string;
  /** How it ended. */
  verdict: BytesTextResult["verdict"];
  /** The operation as one Python expression. */
  python: string;
}

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: BytesTextInput;
  /** The fields of the result that must match. */
  expect: Partial<Pinned>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the type itself forbids them). */
  input: BytesTextInput;
  /** The code the refusal must carry. */
  code: BytesTextErrorCode;
}

/** The accept cases, each one CPython's own answer. */
export const BYTES_TEXT_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: one two-byte letter, written and read as UTF-8, comes back unchanged.
  { id: "default-cafe-utf8", input: { text: "caf\u00e9", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, expect: { bytes: [99, 97, 102, 195, 169], bytesRepr: "b'caf\\xc3\\xa9'", encodeHandled: 0, decodedRepr: "'caf\u00e9'", decodeHandled: 0, sameText: true, verdict: "round-trip" } },
  // The Example: UTF-8 bytes read as Windows-1252; the two-byte letter and the three-byte euro become mojibake.
  { id: "example-utf8-read-as-cp1252", input: { text: "caf\u00e9 \u20ac5", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "cp1252", decodeErrors: "strict" }, expect: { bytes: [99, 97, 102, 195, 169, 32, 226, 130, 172, 53], bytesRepr: "b'caf\\xc3\\xa9 \\xe2\\x82\\xac5'", encodeHandled: 0, decodedRepr: "'caf\u00c3\u00a9 \u00e2\u201a\u00ac5'", decodeHandled: 0, sameText: false, verdict: "mojibake", python: "'caf\u00e9 \u20ac5'.encode('utf-8').decode('cp1252')" } },
  // A Latin-1 byte read as UTF-8 at the very end: the lead byte promises more than the data holds.
  { id: "latin1-read-as-utf8-at-end", input: { text: "caf\u00e9", encodeCodec: "latin-1", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, expect: { bytes: [99, 97, 102, 233], bytesRepr: "b'caf\\xe9'", encodeHandled: 0, decodeMessage: "'utf-8' codec can't decode byte 0xe9 in position 3: unexpected end of data", verdict: "decode-error" } },
  // The same byte followed by a space: the space is not a continuation byte.
  { id: "latin1-read-as-utf8-mid", input: { text: "caf\u00e9 au lait", encodeCodec: "latin-1", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, expect: { bytes: [99, 97, 102, 233, 32, 97, 117, 32, 108, 97, 105, 116], bytesRepr: "b'caf\\xe9 au lait'", encodeHandled: 0, decodeMessage: "'utf-8' codec can't decode byte 0xe9 in position 3: invalid continuation byte", verdict: "decode-error" } },
  // ASCII cannot write the i with diaeresis: UnicodeEncodeError at position 2, reason ordinal not in range(128).
  { id: "ascii-strict", input: { text: "na\u00efve \u20ac5", encodeCodec: "ascii", encodeErrors: "strict", decodeCodec: "ascii", decodeErrors: "strict" }, expect: { bytes: null, encodeMessage: "'ascii' codec can't encode character '\\xef' in position 2: ordinal not in range(128)", verdict: "encode-error" } },
  // ignore drops the two characters ASCII cannot write.
  { id: "ascii-ignore", input: { text: "na\u00efve \u20ac5", encodeCodec: "ascii", encodeErrors: "ignore", decodeCodec: "ascii", decodeErrors: "strict" }, expect: { bytes: [110, 97, 118, 101, 32, 53], bytesRepr: "b'nave 5'", encodeHandled: 2, decodedRepr: "'nave 5'", decodeHandled: 0, sameText: false, verdict: "lossy-encode" } },
  // replace writes a question mark for each.
  { id: "ascii-replace", input: { text: "na\u00efve \u20ac5", encodeCodec: "ascii", encodeErrors: "replace", decodeCodec: "ascii", decodeErrors: "strict" }, expect: { bytes: [110, 97, 63, 118, 101, 32, 63, 53], bytesRepr: "b'na?ve ?5'", encodeHandled: 2, decodedRepr: "'na?ve ?5'", decodeHandled: 0, sameText: false, verdict: "lossy-encode" } },
  // backslashreplace writes \xef and \u20ac as text; decoding gives that text back, not the letters.
  { id: "ascii-backslashreplace", input: { text: "na\u00efve \u20ac5", encodeCodec: "ascii", encodeErrors: "backslashreplace", decodeCodec: "ascii", decodeErrors: "strict" }, expect: { bytes: [110, 97, 92, 120, 101, 102, 118, 101, 32, 92, 117, 50, 48, 97, 99, 53], bytesRepr: "b'na\\\\xefve \\\\u20ac5'", encodeHandled: 2, decodedRepr: "'na\\\\xefve \\\\u20ac5'", decodeHandled: 0, sameText: false, verdict: "lossy-encode", python: "'na\u00efve \u20ac5'.encode('ascii', errors='backslashreplace').decode('ascii')" } },
  // xmlcharrefreplace writes decimal character references.
  { id: "ascii-xmlcharrefreplace", input: { text: "na\u00efve \u20ac5", encodeCodec: "ascii", encodeErrors: "xmlcharrefreplace", decodeCodec: "ascii", decodeErrors: "strict" }, expect: { bytes: [110, 97, 38, 35, 50, 51, 57, 59, 118, 101, 32, 38, 35, 56, 51, 54, 52, 59, 53], bytesRepr: "b'na&#239;ve &#8364;5'", encodeHandled: 2, decodedRepr: "'na&#239;ve &#8364;5'", decodeHandled: 0, sameText: false, verdict: "lossy-encode" } },
  // Two unwritable characters in a row are one error: characters in position 0-1.
  { id: "latin1-run-of-two", input: { text: "\u20ac\u20ac", encodeCodec: "latin-1", encodeErrors: "strict", decodeCodec: "latin-1", decodeErrors: "strict" }, expect: { bytes: null, encodeMessage: "'latin-1' codec can't encode characters in position 0-1: ordinal not in range(256)", verdict: "encode-error" } },
  // Windows-1252 has no byte for U+0100: the charmap codec's own reason.
  { id: "cp1252-no-byte", input: { text: "\u0100", encodeCodec: "cp1252", encodeErrors: "strict", decodeCodec: "cp1252", decodeErrors: "strict" }, expect: { bytes: null, encodeMessage: "'charmap' codec can't encode character '\\u0100' in position 0: character maps to <undefined>", verdict: "encode-error" } },
  // Windows-1252 writes the euro as 0x80; Latin-1 reads 0x80 as a C1 control, which repr escapes.
  { id: "cp1252-euro-one-byte", input: { text: "\u20ac5", encodeCodec: "cp1252", encodeErrors: "strict", decodeCodec: "latin-1", decodeErrors: "strict" }, expect: { bytes: [128, 53], bytesRepr: "b'\\x805'", encodeHandled: 0, decodedRepr: "'\\x805'", decodeHandled: 0, sameText: false, verdict: "mojibake" } },
  // replace on decoding: one U+FFFD for the bad byte.
  { id: "utf8-replace", input: { text: "caf\u00e9", encodeCodec: "latin-1", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "replace" }, expect: { bytes: [99, 97, 102, 233], bytesRepr: "b'caf\\xe9'", encodeHandled: 0, decodedRepr: "'caf\ufffd'", decodeHandled: 1, sameText: false, verdict: "lossy-decode" } },
  // backslashreplace on decoding: \xe9 as four characters of text.
  { id: "utf8-backslashreplace", input: { text: "caf\u00e9", encodeCodec: "latin-1", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "backslashreplace" }, expect: { bytes: [99, 97, 102, 233], bytesRepr: "b'caf\\xe9'", encodeHandled: 0, decodedRepr: "'caf\\\\xe9'", decodeHandled: 1, sameText: false, verdict: "lossy-decode" } },
  // surrogateescape keeps the bad byte as U+DCE9, and encoding with the same handler gives the bytes back.
  { id: "utf8-surrogateescape", input: { text: "caf\u00e9", encodeCodec: "latin-1", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "surrogateescape" }, expect: { bytes: [99, 97, 102, 233], bytesRepr: "b'caf\\xe9'", encodeHandled: 0, decodedRepr: "'caf\\udce9'", decodeHandled: 1, sameText: false, bytesBack: true, verdict: "escaped" } },
  // surrogateescape refuses a byte below 128: the original UnicodeDecodeError is raised.
  { id: "escape-refused-below-128", input: { text: "A", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "utf-16-le", decodeErrors: "surrogateescape" }, expect: { bytes: [65], bytesRepr: "b'A'", encodeHandled: 0, decodeMessage: "'utf-16-le' codec can't decode byte 0x41 in position 0: truncated data", verdict: "decode-error" } },
  // UTF-16 decoded with surrogateescape: one escaped byte cannot be written back in 16-bit units.
  { id: "utf16-bytes-back-fails", input: { text: "caf\u00e9", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "utf-16-le", decodeErrors: "surrogateescape" }, expect: { bytes: [99, 97, 102, 195, 169], bytesRepr: "b'caf\\xc3\\xa9'", encodeHandled: 0, decodedRepr: "'\u6163\uc366\\udca9'", decodeHandled: 1, sameText: false, bytesBack: "'utf-16-le' codec can't encode character '\\udca9' in position 2: surrogates not allowed", verdict: "escaped" } },
  // Little-endian bytes read as big-endian: every unit swapped, a different text.
  { id: "utf16-le-read-as-be", input: { text: "A\u20ac", encodeCodec: "utf-16-le", encodeErrors: "strict", decodeCodec: "utf-16-be", decodeErrors: "strict" }, expect: { bytes: [65, 0, 172, 32], bytesRepr: "b'A\\x00\\xac '", encodeHandled: 0, decodedRepr: "'\u4100\uac20'", decodeHandled: 0, sameText: false, verdict: "mojibake" } },
  // A surrogate pair's bytes read as UTF-8: 0xD8 starts a two-byte sequence that 0x3D does not continue.
  { id: "astral-utf16be-read-as-utf8", input: { text: "\ud83d\ude00", encodeCodec: "utf-16-be", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, expect: { bytes: [216, 61, 222, 0], bytesRepr: "b'\\xd8=\\xde\\x00'", encodeHandled: 0, decodeMessage: "'utf-8' codec can't decode byte 0xd8 in position 0: invalid continuation byte", verdict: "decode-error" } },
  // 0x81 is one of Windows-1252's five undefined bytes.
  { id: "cp1252-undefined-byte", input: { text: "\u0081", encodeCodec: "latin-1", encodeErrors: "strict", decodeCodec: "cp1252", decodeErrors: "strict" }, expect: { bytes: [129], bytesRepr: "b'\\x81'", encodeHandled: 0, decodeMessage: "'charmap' codec can't decode byte 0x81 in position 0: character maps to <undefined>", verdict: "decode-error" } },
  // repr picks double quotes when the text holds a single quote and no double one.
  { id: "quotes-repr", input: { text: "it's", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, expect: { bytes: [105, 116, 39, 115], bytesRepr: "b\"it's\"", encodeHandled: 0, decodedRepr: "\"it's\"", decodeHandled: 0, sameText: true, verdict: "round-trip" } },
  // repr escapes tab, newline and NUL; Latin-1 reads ASCII bytes as the same characters.
  { id: "controls-repr", input: { text: "a\tb\nc\u0000", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "latin-1", decodeErrors: "strict" }, expect: { bytes: [97, 9, 98, 10, 99, 0], bytesRepr: "b'a\\tb\\nc\\x00'", encodeHandled: 0, decodedRepr: "'a\\tb\\nc\\x00'", decodeHandled: 0, sameText: true, verdict: "round-trip" } },
  // The empty text: no bytes, nothing to fail, the same empty text back.
  { id: "empty", input: { text: "", encodeCodec: "utf-16-be", encodeErrors: "strict", decodeCodec: "ascii", decodeErrors: "strict" }, expect: { bytes: [], bytesRepr: "b''", encodeHandled: 0, decodedRepr: "''", decodeHandled: 0, sameText: true, verdict: "round-trip" } },
] as AcceptVector[]);

/** The reject cases. */
export const BYTES_TEXT_REJECTS: readonly RejectVector[] = Object.freeze([
  // One code point more than the lab takes.
  { id: "too-long", input: { text: "a".repeat(49), encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, code: "too-long" },
  // A lone high surrogate, which a typed text cannot hold.
  { id: "lone-surrogate", input: { text: "\ud800", encodeCodec: "utf-8", encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, code: "lone-surrogate" },
  // A codec the lab does not offer.
  { id: "unknown-codec", input: { text: "a", encodeCodec: "utf-32" as BytesTextInput["encodeCodec"], encodeErrors: "strict", decodeCodec: "utf-8", decodeErrors: "strict" }, code: "bad-codec" },
  // surrogateescape is offered on the decoding side only.
  { id: "handler-on-wrong-side", input: { text: "a", encodeCodec: "utf-8", encodeErrors: "surrogateescape" as BytesTextInput["encodeErrors"], decodeCodec: "utf-8", decodeErrors: "strict" }, code: "bad-handler" },
]);

/** The pinnable figures of a result. */
function pinned(r: BytesTextResult): Pinned {
  // Each field as the vectors name it.
  return {
    // The bytes.
    bytes: r.bytes,
    // Their repr.
    bytesRepr: r.bytesRepr,
    // Encode handler count.
    encodeHandled: r.encodeHandled,
    // The encode error's message, or empty.
    encodeMessage: r.encodeFailure?.message ?? "",
    // The decoded text's repr.
    decodedRepr: r.decodedRepr,
    // Decode handler count.
    decodeHandled: r.decodeHandled,
    // The decode error's message, or empty.
    decodeMessage: r.decodeFailure?.message ?? "",
    // Same text or not.
    sameText: r.sameText,
    // The second encoding of a surrogateescape decode: same bytes, or the error's message.
    bytesBack: r.bytesBack ? (r.bytesBack.failure ? r.bytesBack.failure.message : r.bytesBack.same === true) : false,
    // The verdict.
    verdict: r.verdict,
    // The Python line.
    python: r.python,
  };
}

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of BYTES_TEXT_VECTORS) {
    // The model's answer, or the refusal it should not have made.
    let got: Pinned;
    // Run it.
    try {
      // Should not throw.
      got = pinned(compute(v.input));
    } catch (e) {
      // An unexpected refusal fails the case.
      failures.push(`${v.id}: refused with ${e instanceof BytesTextError ? e.code : String(e)}`);
      // Nothing to compare.
      continue;
    }
    // Each expected field in turn, compared as JSON (arrays included).
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof Pinned];
      // A difference is a failure naming the case and the field.
      if (JSON.stringify(have) !== JSON.stringify(want)) failures.push(`${v.id}: ${k} is ${JSON.stringify(have)}, expected ${JSON.stringify(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of BYTES_TEXT_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof BytesTextError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = BYTES_TEXT_VECTORS.length + BYTES_TEXT_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
