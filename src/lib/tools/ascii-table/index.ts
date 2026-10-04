// ============================================================================
// src/lib/tools/ascii-table/index.ts
// ----------------------------------------------------------------------------
// THE ASCII TABLE, EXPLAINED: the self-describing {manifest, run, vectors} triple.
//
// Every one of the 128 ASCII codes with its numbers, its column/row in the
// original table, its names in three traditions (RFC 20 / USAS X3.4-1968,
// Unicode 1.0 and Unicode 18.0.0), how to write it in C, JSON, JavaScript,
// Python, Tcl (iRules), HTML and a URL, and which languages count it as white
// space; a look-up box that reads the code in any notation and says when a
// value is NOT ASCII (&tilde; is U+02DC, &minus; is U+2212).
//
// run() passes the full Unicode name table (src/lib/unicode/names.ts, about a
// megabyte) to the compute layer. This module is imported by the API registry
// and the vector runner, never by the page: the page imports compute.ts and
// loads the name table with a dynamic import.
// ============================================================================

import { run as compute, type AsciiTableInput, type AsciiTableResult, type NameData } from "./compute";
import { unicodeName, aliasesOf, codePointOfName } from "@/lib/unicode/names";
import { UNICODE_SOURCES } from "@/lib/unicode/hidden";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { AsciiTableInput, AsciiTableResult, AsciiDetail, AsciiKind, LookupResult, TextChar, EscapeForm, NameData, UrlClass, WhitespaceSet } from "./compute";
// The pure functions and tables the page uses.
export { detail, lookup, analyzeText, kindOf, urlClass, WHITESPACE, WHITESPACE_SETS } from "./compute";
// The 128 rows.
export { ASCII } from "./data";
export type { AsciiCode } from "./data";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The full name data, from the Unicode 18.0.0 name table. */
export const FULL_NAMES: NameData = {
  // The Name property.
  nameOf: unicodeName,
  // The first formal alias (controls are named only by aliases).
  aliasOf: (cp: number) => aliasesOf(cp)[0]?.alias,
  // Loose name and alias matching.
  cpOf: codePointOfName,
};

/** The sources, each read on its access date. */
export const SOURCES = [
  // RFC 20: the table, the legend, the control classes and the definitions.
  { id: "rfc20", label: "RFC 20: ASCII format for Network Interchange (V. Cerf, 1969), reproducing USAS X3.4-1968", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc20", access_date: "2026-10-03", scope: "the code table, column/row notation, names, CC/FE/IS classes, the definitions in section 5, notes 3 and 4" },
  // The Unicode name data.
  ...UNICODE_SOURCES,
  // NameAliases.txt: the control names.
  { id: "ucd-namealiases", label: "Unicode Character Database 18.0.0: NameAliases.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt", access_date: "2026-10-03", scope: "ISO 6429 control names and abbreviations, kept by Unicode as formal aliases" },
  // DerivedName.txt: every name.
  { id: "ucd-derivedname", label: "Unicode Character Database 18.0.0: extracted/DerivedName.txt", type: "standard", url: "https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt", access_date: "2026-10-03", scope: "the name of every code point outside ASCII that a look-up lands on" },
  // UAX #44: loose name matching.
  { id: "uax44", label: "Unicode Standard Annex #44: Unicode Character Database (revision 38, Unicode 18.0.0)", type: "standard", url: "https://www.unicode.org/reports/tr44/", access_date: "2026-10-03", scope: "rule UAX44-LM2, used when a name is typed into the look-up box" },
  // WHATWG HTML: named references and the numeric reference rules.
  { id: "whatwg-entities", label: "WHATWG HTML Living Standard: named character references (entities.json)", type: "standard", url: "https://html.spec.whatwg.org/entities.json", access_date: "2026-10-03", scope: "every named reference for an ASCII code; &tilde; and &minus; are not ASCII" },
  { id: "whatwg-parsing", label: "WHATWG HTML Living Standard: 13.2 Parsing HTML documents (numeric character reference end state)", type: "standard", url: "https://html.spec.whatwg.org/multipage/parsing.html", access_date: "2026-10-03", scope: "&#0; becomes U+FFFD; control references are parse errors" },
  { id: "whatwg-infra", label: "WHATWG Infra Standard: ASCII whitespace", type: "standard", url: "https://infra.spec.whatwg.org/", access_date: "2026-10-03", scope: "ASCII whitespace is TAB, LF, FF, CR and SPACE" },
  // C, JSON, JavaScript, Python, Tcl.
  { id: "n1570", label: "ISO/IEC 9899:2011 committee draft N1570 (C11): 6.4.4.4 escape sequences, 7.4.1.10 isspace", type: "standard", url: "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf", access_date: "2026-10-03", scope: "C escape sequences and the standard white-space characters" },
  { id: "rfc8259", label: "RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc8259", access_date: "2026-10-03", scope: "white space (section 2) and string escapes (section 7)" },
  { id: "ecma262", label: "ECMA-262: ECMAScript Language Specification (string literals, white space, line terminators)", type: "standard", url: "https://tc39.es/ecma262/", access_date: "2026-10-03", scope: "JavaScript escape sequences and white space" },
  { id: "python-lexical", label: "The Python Language Reference: 2. Lexical analysis (escape sequences)", type: "reference", url: "https://docs.python.org/3/reference/lexical_analysis.html", access_date: "2026-10-03", scope: "Python string-literal escapes" },
  { id: "tcl84-Tcl", label: "Tcl 8.4 manual: Tcl (the twelve rules of the language, backslash substitution)", type: "reference", url: "https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm", access_date: "2026-10-03", scope: "Tcl and iRules backslash substitutions; \\x reads every hex digit that follows" },
  // URLs and ABNF.
  { id: "rfc3986", label: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc3986", access_date: "2026-10-03", scope: "unreserved characters, gen-delims and sub-delims, percent-encoding" },
  { id: "rfc5234", label: "RFC 5234: Augmented BNF for Syntax Specifications: ABNF (Appendix B.1 core rules)", type: "standard", url: "https://www.rfc-editor.org/rfc/rfc5234", access_date: "2026-10-03", scope: "WSP is SP or HTAB" },
];

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Encoding",
  // The slug.
  toolSlug: "ascii-table",
  // Other names it answers to.
  canonicalAliases: ["ascii", "ascii-chart", "ascii-codes", "usascii", "character-codes"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "^(?:0x[0-9a-fA-F]{1,2}|&#x?[0-9a-fA-F]{1,3};|\\^[@A-Z\\[\\\\\\]^_?]|[0-7]/(?:1[0-5]|[0-9]))$", example: "{\"mode\":\"lookup\",\"value\":\"&tilde;\"}" },
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
  learnLinks: ["learn/ascii-the-128-codes", "learn/character-encoding"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["unicode-inspector", "base64", "f5-irules-style-checker", "url-inspector"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point, with the full name table. */
export function run(input: AsciiTableInput): AsciiTableResult {
  // The compute layer does the work.
  return compute(input, FULL_NAMES);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
