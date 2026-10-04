// ============================================================================
// src/lib/tools/charset-equivalency/index.ts
// ----------------------------------------------------------------------------
// CHARSET CONVERTER AND MOJIBAKE REPAIR: the self-describing {manifest, run,
// vectors} triple.
//
// Text to bytes and bytes to text in fourteen charsets (the five Unicode
// encoding schemes, US-ASCII, ISO-8859-1, windows-1252, ISO-8859-15, Mac OS
// Roman, IBM 437, IBM 850, EBCDIC 037 and 500), the same text or bytes in
// every one of them side by side, ill-formed input replaced exactly as a
// browser replaces it, and garbled text ("cafÃ©") traced back to the bytes and
// charset it came from.
// ============================================================================

import { run as compute, type CharsetInput, type CharsetResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { CharsetId, CharsetInput, CharsetResult, EncodeResult, DecodeResult, DecodedUnit, DecodeError, RepairResult, RepairCandidate, RepairStep, ParsedBytes, ByteFormat, ByteStyle, Unencodable, Reading, Writing, Guess, GuessReason, BomFound } from "./compute";
// The pure functions and tables the page uses.
export { CHARSETS, FACTS, BYTE_STYLES, encodeText, decodeBytes, readEverywhere, writeEverywhere, parseBytes, formatBytes, repairText, mojibakeScore } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The sources, each read on its access date. */
export const SOURCES = [
  // The WHATWG Encoding Standard: decoders, labels, indexes, error modes.
  { id: "whatwg-encoding", label: "WHATWG Encoding Standard (Living Standard, last updated 21 May 2026)", type: "standard", url: "https://encoding.spec.whatwg.org/", access_date: "2026-10-03", scope: "the UTF-8 and UTF-16 decoders followed step by step, BOM sniffing, the single-byte decoder and encoder, the labels (iso-8859-1, latin1 and ascii are windows-1252), the html error mode" },
  { id: "whatwg-index-windows-1252", label: "WHATWG Encoding Standard: index-windows-1252.txt", type: "standard", url: "https://encoding.spec.whatwg.org/index-windows-1252.txt", access_date: "2026-10-03", scope: "windows-1252, bytes 0x80 to 0xFF" },
  { id: "whatwg-index-iso-8859-15", label: "WHATWG Encoding Standard: index-iso-8859-15.txt", type: "standard", url: "https://encoding.spec.whatwg.org/index-iso-8859-15.txt", access_date: "2026-10-03", scope: "ISO-8859-15, bytes 0x80 to 0xFF" },
  { id: "whatwg-index-macintosh", label: "WHATWG Encoding Standard: index-macintosh.txt", type: "standard", url: "https://encoding.spec.whatwg.org/index-macintosh.txt", access_date: "2026-10-03", scope: "Mac OS Roman, bytes 0x80 to 0xFF" },
  // The Unicode Standard: encoding forms and schemes, U+FFFD substitution.
  { id: "unicode-ch3", label: "The Unicode Standard 18.0.0, chapter 3: Conformance (3.9 encoding forms, 3.9.6 U+FFFD substitution of maximal subparts, 3.10 encoding schemes)", type: "standard", url: "https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/", access_date: "2026-10-03", scope: "Table 3-7 well-formed UTF-8, Tables 3-8 to 3-11 replacement examples, D95 to D100 (UTF-16 and UTF-32 schemes, BOM, big-endian default)" },
  { id: "unicode-bom-faq", label: "Unicode FAQ: UTF-8, UTF-16, UTF-32 & BOM", type: "reference", url: "https://www.unicode.org/faq/utf_bom.html", access_date: "2026-10-03", scope: "the byte order marks of each form, UTF-32 included" },
  // The archived vendor mapping tables.
  { id: "unicode-cp437", label: "Unicode Consortium archived mapping: VENDORS/MICSFT/PC/CP437.TXT", type: "reference", url: "https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT", access_date: "2026-10-03", scope: "IBM 437" },
  { id: "unicode-cp850", label: "Unicode Consortium archived mapping: VENDORS/MICSFT/PC/CP850.TXT", type: "reference", url: "https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP850.TXT", access_date: "2026-10-03", scope: "IBM 850" },
  { id: "unicode-cp037", label: "Unicode Consortium archived mapping: VENDORS/MICSFT/EBCDIC/CP037.TXT", type: "reference", url: "https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP037.TXT", access_date: "2026-10-03", scope: "EBCDIC 037 (US/Canada)" },
  { id: "unicode-cp500", label: "Unicode Consortium archived mapping: VENDORS/MICSFT/EBCDIC/CP500.TXT", type: "reference", url: "https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP500.TXT", access_date: "2026-10-03", scope: "EBCDIC 500 (International)" },
  { id: "unicode-8859-1", label: "Unicode Consortium mapping: ISO8859/8859-1.TXT", type: "reference", url: "https://www.unicode.org/Public/MAPPINGS/ISO8859/8859-1.TXT", access_date: "2026-10-03", scope: "ISO-8859-1 as the identity on 256 bytes" },
  { id: "unicode-mappings-readme", label: "Unicode Consortium: Public/MAPPINGS/ReadMe.txt (updated 2025-10-23)", type: "reference", url: "https://www.unicode.org/Public/MAPPINGS/ReadMe.txt", access_date: "2026-10-03", scope: "the vendor tables are kept for historical and archival purposes" },
  // RFCs.
  { id: "rfc3629", label: "RFC 3629: UTF-8, a transformation format of ISO 10646", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3629", access_date: "2026-10-03", scope: "the UTF-8 bit layout and its byte ranges" },
  { id: "rfc2781", label: "RFC 2781: UTF-16, an encoding of ISO 10646", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc2781", access_date: "2026-10-03", scope: "surrogate pairs (section 2.1), the BOM and byte order" },
  { id: "rfc4648", label: "RFC 4648: The Base16, Base32, and Base64 Data Encodings", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc4648", access_date: "2026-10-03", scope: "Base64 (section 4) and the URL-safe alphabet (section 5)" },
  { id: "rfc3986", label: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3986", access_date: "2026-10-03", scope: "unreserved characters and percent-encoding" },
  { id: "whatwg-url", label: "WHATWG URL Standard: percent-decode", type: "standard", url: "https://url.spec.whatwg.org/", access_date: "2026-10-03", scope: "a % not followed by two hex digits is kept; other characters are their UTF-8 bytes" },
];

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Encoding",
  // The slug.
  toolSlug: "charset-equivalency",
  // Other names it answers to.
  canonicalAliases: ["charset-converter", "encoding-converter", "mojibake", "mojibake-fixer", "code-page", "ebcdic", "utf-16"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "Ã[\\u0080-\\u00BF]|â€", example: "{\"mode\":\"repair\",\"text\":\"RequisiÃ§Ã£o bloqueada â€“ cafÃ©\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled.
  dangerousInputHandling: ["bounded-parse", "never-fetches", "text-only-output"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/utf-8-and-utf-16-byte-by-byte", "learn/mojibake-and-code-pages"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["unicode-inspector", "ascii-table", "base64", "url-inspector"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: CharsetInput): CharsetResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
