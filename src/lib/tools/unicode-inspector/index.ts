// ============================================================================
// src/lib/tools/unicode-inspector/index.ts
// ----------------------------------------------------------------------------
// THE UNICODE INSPECTOR: the self-describing {manifest, run, vectors} triple.
//
// Paste a text and see what is really in it: every code point with its name
// and flags, and the ones that hide or deceive (bidirectional controls left
// open, invisible characters, controls, unusual line breaks, non-ASCII spaces,
// quotes and dashes, UTS #39 confusables, words that mix scripts). Or look up
// one code point in any notation, or find code points by name.
//
// run() passes the full Unicode name table (src/lib/unicode/names.ts, about a
// megabyte). This module is imported by the API registry, the tool page's
// manifest read and the vector runner, never by the client component, which
// imports compute.ts and loads the name table with a dynamic import.
// ============================================================================

import { run as compute, type UnicodeInspectorInput, type UnicodeInspectorResult, type UnicodeData } from "./compute";
import { unicodeName, aliasesOf, codePointOfName, searchNames } from "@/lib/unicode/names";
import { UNICODE_SOURCES } from "@/lib/unicode/hidden";
import { CONFUSABLE_SOURCES } from "@/lib/unicode/confusables";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { UnicodeInspectorInput, UnicodeInspectorResult, UnicodeData, CodePointInfo, TextReport, TextRow, Flag, EscapeStyle, CleanOptions, OpenBidi, MixedWord, SearchHit } from "./compute";
// The pure functions the page uses.
export { info, inspectText, readCodePoint, escapeText, escapesOf, flagsOf, utf8Bytes, utf16Units, isNoncharacter, ESCAPE_STYLES, FINDING_FLAGS, DEFAULT_CLEAN } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The full Unicode data, from the 18.0.0 name table. */
export const FULL_DATA: UnicodeData = {
  // The Name property.
  nameOf: unicodeName,
  // The first formal alias.
  aliasOf: (cp: number) => aliasesOf(cp)[0]?.alias,
  // Loose name and alias matching.
  cpOf: codePointOfName,
  // Every alias.
  aliases: aliasesOf,
  // Name search.
  search: searchNames,
};

/** The sources, each read on its access date. */
export const SOURCES = [
  // The Unicode Character Database files the tables are generated from.
  ...UNICODE_SOURCES,
  { id: "ucd-derivedname", label: "Unicode Character Database 18.0.0: extracted/DerivedName.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt", access_date: "2026-10-03", scope: "every character name, checked code point by code point" },
  { id: "ucd-namealiases", label: "Unicode Character Database 18.0.0: NameAliases.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt", access_date: "2026-10-03", scope: "formal aliases: corrections, control names, alternates, figments, abbreviations" },
  { id: "ucd-blocks", label: "Unicode Character Database 18.0.0: Blocks.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/Blocks.txt", access_date: "2026-10-03", scope: "the Block property" },
  { id: "ucd-derivedage", label: "Unicode Character Database 18.0.0: DerivedAge.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/DerivedAge.txt", access_date: "2026-10-03", scope: "the version that assigned each code point" },
  { id: "ucd-scripts", label: "Unicode Character Database 18.0.0: Scripts.txt and ScriptExtensions.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/ScriptExtensions.txt", access_date: "2026-10-03", scope: "Script and Script_Extensions" },
  { id: "ucd-linebreak", label: "Unicode Character Database 18.0.0: LineBreak.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/LineBreak.txt", access_date: "2026-10-03", scope: "VT, FF, LS and PS are mandatory breaks (BK), NEL is NL" },
  // Security data and the documents that define how to use it.
  ...CONFUSABLE_SOURCES,
  { id: "uts55", label: "Unicode Technical Standard #55: Unicode Source Code Handling (version 2)", type: "standard", url: "https://www.unicode.org/reports/tr55/", access_date: "2026-10-03", scope: "line-break, lookalike and bidirectional spoofing in source code" },
  { id: "uax9", label: "Unicode Standard Annex #9: Unicode Bidirectional Algorithm (Unicode 18.0.0)", type: "standard", url: "https://www.unicode.org/reports/tr9/", access_date: "2026-10-03", scope: "embeddings, overrides and isolates, and what closes them" },
  { id: "uax44", label: "Unicode Standard Annex #44: Unicode Character Database (Unicode 18.0.0)", type: "standard", url: "https://www.unicode.org/reports/tr44/", access_date: "2026-10-03", scope: "General_Category values, loose name matching (UAX44-LM2)" },
  { id: "core-ch4", label: "The Unicode Standard 18.0.0, chapter 4: Character Properties", type: "standard", url: "https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/", access_date: "2026-10-03", scope: "the Name property and code point labels" },
  { id: "cve-2021-42574", label: "NVD: CVE-2021-42574 (Trojan Source, bidirectional reordering in source code)", type: "advisory", url: "https://nvd.nist.gov/vuln/detail/CVE-2021-42574", access_date: "2026-10-03", scope: "the vulnerability report and the Unicode Consortium's statement in it" },
  // The encodings and escape syntaxes.
  { id: "rfc3629", label: "RFC 3629: UTF-8, a transformation format of ISO 10646", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3629", access_date: "2026-10-03", scope: "UTF-8 byte sequences; surrogates are not encoded" },
  { id: "rfc2781", label: "RFC 2781: UTF-16, an encoding of ISO 10646", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc2781", access_date: "2026-10-03", scope: "surrogate pairs" },
  { id: "rfc8259", label: "RFC 8259: JSON (section 7, strings)", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc8259", access_date: "2026-10-03", scope: "\\uXXXX escapes and surrogate pairs" },
  { id: "ecma262", label: "ECMA-262: ECMAScript Language Specification (string literals)", type: "standard", url: "https://tc39.es/ecma262/", access_date: "2026-10-03", scope: "\\uXXXX and \\u{...} escapes" },
  { id: "python-lexical", label: "The Python Language Reference: Lexical analysis (escape sequences)", type: "reference", url: "https://docs.python.org/3/reference/lexical_analysis.html", access_date: "2026-10-03", scope: "\\x, \\u and \\U escapes" },
  { id: "n1570", label: "ISO/IEC 9899:2011 committee draft N1570 (C11): 6.4.3 universal character names", type: "standard", url: "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf", access_date: "2026-10-03", scope: "which code points a universal character name may designate" },
  { id: "tcl84-Tcl", label: "Tcl 8.4 manual: Tcl (backslash substitution)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm", access_date: "2026-10-03", scope: "\\uhhhh, one to four hexadecimal digits" },
  { id: "whatwg-entities", label: "WHATWG HTML Living Standard: named character references (entities.json)", type: "standard", url: "https://html.spec.whatwg.org/entities.json", access_date: "2026-10-03", scope: "named references for each code point" },
  { id: "rfc3986", label: "RFC 3986: URI Generic Syntax (percent-encoding)", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3986", access_date: "2026-10-03", scope: "unreserved characters and percent-encoded UTF-8" },
];

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Encoding",
  // The slug.
  toolSlug: "unicode-inspector",
  // Other names it answers to.
  canonicalAliases: ["hidden-character-inspector", "unicode-lookup", "code-point-inspector", "zero-width-finder", "homoglyph-finder", "trojan-source-checker"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "^U\\+[0-9A-Fa-f]{4,6}$|[\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF]", example: "{\"mode\":\"codepoint\",\"value\":\"U+202E\"}" },
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
  dangerousInputHandling: ["bounded-parse", "never-fetches", "text-only-output", "reveals-hidden-characters"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/unicode-code-points-and-properties", "learn/hidden-and-lookalike-characters"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["ascii-table", "f5-irules-style-checker", "url-inspector", "base64"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point, with the full name table. */
export function run(input: UnicodeInspectorInput): UnicodeInspectorResult {
  // The compute layer does the work.
  return compute(input, FULL_DATA);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
