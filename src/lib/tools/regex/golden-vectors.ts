// ============================================================================
// src/lib/tools/regex/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the regex toolkit: flag validation, compilation, matching (with
// positional and named groups, the zero-width guard, and the no-g single-match
// path), the explainer's token output, and the ReDoS heuristic.
// v2 (2026-10-26) adds the tokenizer's new forms (possessive quantifiers,
// atomic groups, the PCRE2 named-group spellings, inline options, property and
// character escapes) and the portability view: at least one vector for each of
// the constructs in PORTABILITY_CONSTRUCTS, checked for rows, verdicts, note
// keys, counts and parameters, plus a coverage check and a citation check.
// ============================================================================

import { parseFlags, compileRegex, findMatches, explainPattern, detectReDoS } from "./compute";
// 2026-10-26: the portability view and its catalogue, for the new vector groups.
import { portabilityOf, PORTABILITY_CONSTRUCTS, PORTABILITY_SOURCE_IDS, portabilitySourcesFor, MAX_PORTABILITY_LENGTH, type PortConstructId } from "./compute";

// v1 covered flags, compile, match, explain and ReDoS. v2 (2026-10-26) keeps
// every v1 vector unchanged and adds the tokenizer's new forms and one or more
// portability vectors for every construct in PORTABILITY_CONSTRUCTS.
export const GOLDEN_VECTOR_SET_ID = "regex-toolkit-golden-v2/2026-10-26";

export interface FlagVector { id: string; description: string; flags: string; expectOk: boolean; expectErrorIncludes?: string }
export interface CompileVector { id: string; description: string; pattern: string; flags: string; expectOk: boolean; expectErrorIncludes?: string }
export interface MatchVector {
  id: string; description: string; pattern: string; flags: string; input: string;
  expectOk: boolean; expectCount?: number; expectFirst?: string; expectGroup1?: string; expectNamed?: Record<string, string>; expectInputTooLong?: boolean;
}
export interface ExplainVector { id: string; description: string; pattern: string; expectTypes: string[] }
export interface ReDoSVector { id: string; description: string; pattern: string; expectRisky: boolean }

export const FLAG_VECTORS: FlagVector[] = [
  { id: "valid", description: "gimsuy combination is valid", flags: "gim", expectOk: true },
  { id: "all", description: "every valid flag accepted", flags: "dgimsuy", expectOk: true },
  { id: "unknown", description: "an unknown flag is rejected", flags: "gx", expectOk: false, expectErrorIncludes: "Unknown flag" },
  { id: "dup", description: "a duplicate flag is rejected", flags: "gg", expectOk: false, expectErrorIncludes: "Duplicate" },
];

export const COMPILE_VECTORS: CompileVector[] = [
  { id: "ok", description: "a valid pattern compiles", pattern: "\\d{3}-\\d{4}", flags: "", expectOk: true },
  { id: "unterminated-group", description: "an unterminated group is a clean error", pattern: "(abc", flags: "", expectOk: false, expectErrorIncludes: "roup" },
  { id: "bad-flag", description: "compile surfaces a flag error", pattern: "a", flags: "z", expectOk: false, expectErrorIncludes: "Unknown flag" },
];

export const MATCH_VECTORS: MatchVector[] = [
  { id: "global", description: "global match finds every run of digits", pattern: "\\d+", flags: "g", input: "a1b22c333", expectOk: true, expectCount: 3, expectFirst: "1" },
  { id: "groups", description: "positional and named groups are captured", pattern: "(?<y>\\d{4})-(\\d{2})", flags: "", input: "2026-06", expectOk: true, expectCount: 1, expectFirst: "2026-06", expectGroup1: "2026", expectNamed: { y: "2026" } },
  { id: "no-g-single", description: "without g, only the first match is returned", pattern: "\\d+", flags: "", input: "1 2 3", expectOk: true, expectCount: 1, expectFirst: "1" },
  { id: "zero-width", description: "a zero-width global match does not loop forever", pattern: "a*", flags: "g", input: "bbb", expectOk: true, expectCount: 4 },
  { id: "case-insensitive", description: "the i flag matches across case", pattern: "abc", flags: "gi", input: "ABCabc", expectOk: true, expectCount: 2 },
  { id: "no-match", description: "no match returns an empty list", pattern: "xyz", flags: "g", input: "abc", expectOk: true, expectCount: 0 },
  { id: "too-long", description: "an over-length input is refused, not run", pattern: "a", flags: "g", input: "a".repeat(50_001), expectOk: false, expectInputTooLong: true },
];

export const EXPLAIN_VECTORS: ExplainVector[] = [
  { id: "structure", description: "anchors, group, literal, shorthand, quantifiers", pattern: "^(?:ab)+\\d{2,4}$", expectTypes: ["anchor", "group-open", "literal", "group-close", "quantifier", "class-shorthand", "quantifier", "anchor"] },
  { id: "class", description: "a character class and a star quantifier", pattern: "[a-z]*", expectTypes: ["char-class", "quantifier"] },
  { id: "alternation", description: "alternation between two literals", pattern: "cat|dog", expectTypes: ["literal", "alternation", "literal"] },
  { id: "escape-and-backref", description: "an escaped dot and a backreference", pattern: "\\.(\\w)\\1", expectTypes: ["escape", "group-open", "class-shorthand", "group-close", "backref"] },
];

export const REDOS_VECTORS: ReDoSVector[] = [
  { id: "nested-plus", description: "(a+)+ is flagged", pattern: "(a+)+", expectRisky: true },
  { id: "nested-star", description: "(.*)* is flagged", pattern: "(.*)*", expectRisky: true },
  { id: "nested-noncap", description: "(?:\\d+)+ is flagged", pattern: "(?:\\d+)+", expectRisky: true },
  { id: "safe-group", description: "(ab)+ is not flagged", pattern: "(ab)+", expectRisky: false },
  { id: "safe-bounded", description: "\\d{2,4} is not flagged", pattern: "\\d{2,4}", expectRisky: false },
  { id: "safe-simple", description: "a plain pattern is not flagged", pattern: "^\\w+@\\w+\\.\\w+$", expectRisky: false },
];

// ---- v2 (2026-10-26): the tokenizer's new forms ----------------------------

/** A tokenizer vector: the exact token types and texts expected. */
export interface TokenVector { id: string; description: string; pattern: string; expect: Array<[string, string]> }

/** The forms explainPattern learned for the portability view. */
export const TOKEN_VECTORS: TokenVector[] = [
  // a++ is one literal and one possessive quantifier.
  { id: "possessive", description: "a possessive quantifier is one token", pattern: "a++", expect: [["literal", "a"], ["quantifier", "++"]] },
  // (?>a) opens an atomic group.
  { id: "atomic", description: "an atomic group opener", pattern: "(?>a)", expect: [["group-open", "(?>"], ["literal", "a"], ["group-close", ")"]] },
  // The Python spellings of a named group and its backreference.
  { id: "named-python", description: "(?P<y>...) opens a group and (?P=y) is a backreference", pattern: "(?P<y>a)(?P=y)", expect: [["group-open", "(?P<y>"], ["literal", "a"], ["group-close", ")"], ["backref", "(?P=y)"]] },
  // The quoted spelling.
  { id: "named-quote", description: "(?'q'...) opens a named group", pattern: "(?'q'a)", expect: [["group-open", "(?'q'"], ["literal", "a"], ["group-close", ")"]] },
  // A bare option group and a scoped one.
  { id: "modifiers", description: "(?i) is a modifier token and (?s: opens a group", pattern: "(?i)a(?s:.)", expect: [["modifier", "(?i)"], ["literal", "a"], ["group-open", "(?s:"], ["dot", "."], ["group-close", ")"]] },
  // A property escape is one class shorthand, quantifiable.
  { id: "property", description: "\\p{L} is one class shorthand and takes a quantifier", pattern: "\\p{L}+", expect: [["class-shorthand", "\\p{L}"], ["quantifier", "+"]] },
  // Hex, Unicode and control escapes are one character each.
  { id: "char-escapes", description: "\\x41, \\u00e9 and \\cJ are single escapes", pattern: "\\x41\\u00e9\\cJ", expect: [["escape", "\\x41"], ["escape", "\\u00e9"], ["escape", "\\cJ"]] },
];

// ---- v2 (2026-10-26): portability -------------------------------------------

/** s, d, u: same, different, unsupported (compact so each row reads in one line). */
type V = "s" | "d" | "u";
/** One expected row: construct, the three verdict letters (ES, PCRE2, Tcl), and optionally the three note keys and the count. */
type Row = [PortConstructId, V, V, V, ([string, string, string] | null)?, number?];

/** A portability vector: pattern, flags and the exact rows in order. */
export interface PortabilityVector {
  /** Stable vector id. */
  id: string;
  /** What the vector proves. */
  description: string;
  /** The pattern, as the reader would type it. */
  pattern: string;
  /** The tester's flags (only u and v change a verdict). */
  flags: string;
  /** The rows, in first-occurrence order. */
  expect: Row[];
  /** Parameter values the first rows must carry, by row index. */
  expectParams?: Record<number, Record<string, string | number>>;
  /** True when the pattern is over the cap. */
  expectTooLong?: boolean;
}

/** One or more vectors for every construct; the order of rows is first occurrence. */
export const PORTABILITY_VECTORS: PortabilityVector[] = [
  // The component's Portability example (D-83): verbatim from here.
  { id: "showcase", description: "lookbehind, named group, \\w and \\b: three flavours, three answers", pattern: "(?<=user=)(?<name>\\w+)\\b", flags: "g", expect: [["lookbehindFixed", "s", "s", "u"], ["namedGroup", "s", "s", "u"], ["wordClass", "s", "s", "d"], ["wordBoundary", "s", "s", "d"]], expectParams: { 0: { max: 5 }, 1: { name: "name", nonAscii: 0 } } },
  // Variable but bounded: PCRE2 10.43+ only.
  { id: "lookbehind-bounded", description: "(?<=colou?r) varies from 5 to 6 characters", pattern: "(?<=colou?r)x", flags: "", expect: [["lookbehindBounded", "s", "d", "u", ["es", "pcre2", "tcl"]]], expectParams: { 0: { max: 6 } } },
  // Over the default limit of 255.
  { id: "lookbehind-over-255", description: "a branch of up to 300 characters exceeds PCRE2's default 255", pattern: "(?<=a{1,300})b", flags: "", expect: [["lookbehindBounded", "s", "u", "u", ["es", "pcre2Over", "tcl"]]], expectParams: { 0: { max: 300 } } },
  // Unlimited repetition.
  { id: "lookbehind-unbounded", description: "(?<=\\d+) has no maximum length", pattern: "(?<=\\d+)px", flags: "", expect: [["lookbehindUnbounded", "s", "u", "u"]] },
  // Alternatives of different fixed lengths stay fixed for PCRE2.
  { id: "lookbehind-alternatives", description: "(?<=colour|color): each branch fixed, lengths differ", pattern: "(?<=colour|color):", flags: "", expect: [["lookbehindFixed", "s", "s", "u"]], expectParams: { 0: { max: 6 } } },
  // A backreference to an unbounded group inside a lookbehind.
  { id: "lookbehind-backref", description: "\\1 inside a lookbehind takes the width of (a+), which is unbounded", pattern: "(a+)(?<=\\1)", flags: "", expect: [["lookbehindUnbounded", "s", "u", "u"]] },
  // Lookaheads with a capture and with a backreference.
  { id: "lookahead-groups", description: "Tcl never captures inside a lookahead and forbids backreferences there", pattern: "(?=(a))(?!\\1)", flags: "", expect: [["lookaheadGroups", "s", "s", "d", ["es", "pcre2", "tcl"]], ["lookaheadGroups", "s", "s", "u", ["es", "pcre2", "tclBackref"]]] },
  // The Python spellings.
  { id: "named-python", description: "(?P<y>...) and (?P=y) are PCRE2 only", pattern: "(?P<y>\\d+)-(?P=y)", flags: "", expect: [["namedGroupAlt", "u", "s", "u"], ["backrefPcreOnly", "u", "s", "u"]] },
  // The shared spelling and \k<name>.
  { id: "named-shared", description: "(?<y>...) and \\k<y> are shared by ECMAScript and PCRE2", pattern: "(?<y>\\d{4})-\\k<y>", flags: "", expect: [["namedGroup", "s", "s", "u"], ["namedBackref", "s", "s", "u"]] },
  // A non-ASCII group name.
  { id: "named-non-ascii", description: "a name outside ASCII needs PCRE2's UTF mode", pattern: "(?<año>\\d+)", flags: "", expect: [["namedGroup", "s", "d", "u", ["es", "pcre2NonAscii", "tcl"]]] },
  // Every other backreference spelling PCRE2 accepts, merged into one row of five.
  { id: "backref-spellings", description: "\\k'q', \\k{q}, \\g{q}, \\g1 and \\g{-1} are PCRE2 only", pattern: "(?'q'a)\\k'q'\\k{q}\\g{q}\\g1\\g{-1}", flags: "", expect: [["namedGroupAlt", "u", "s", "u"], ["backrefPcreOnly", "u", "s", "u", null, 5]] },
  // Scoped modifiers ECMAScript accepts, and the dot inside one.
  { id: "flags-scoped", description: "(?i:...) and (?-s:...) are ECMAScript 2025 modifiers too", pattern: "(?i:abc)(?-s:.)", flags: "", expect: [["inlineFlagsScoped", "s", "s", "u"], ["inlineFlagsScoped", "s", "s", "u"], ["dot", "s", "d", "d"]], expectParams: { 0: { letters: "i" }, 1: { letters: "-s" } } },
  // A letter ECMAScript does not take.
  { id: "flags-scoped-x", description: "(?x:...) is PCRE2 only", pattern: "(?x: a b )", flags: "", expect: [["inlineFlagsScoped", "u", "s", "u", ["esLetters", "pcre2", "tcl"]]], expectParams: { 0: { letters: "x" } } },
  // Bare options at the start.
  { id: "flags-global-start", description: "(?i) at the start means the same in PCRE2 and Tcl", pattern: "(?i)abc", flags: "", expect: [["inlineFlagsGlobal", "u", "s", "s", ["es", "pcre2", "tclSame"]]] },
  // Bare options later on.
  { id: "flags-global-mid", description: "Tcl takes embedded options only at the start", pattern: "a(?i)b", flags: "", expect: [["inlineFlagsGlobal", "u", "s", "u", ["es", "pcre2", "tclNotStart"]]] },
  // Tcl's own reading of m, and $.
  { id: "flags-global-tcl-m", description: "(?m) is newline-sensitive matching in Tcl", pattern: "(?m)^ok$", flags: "", expect: [["inlineFlagsGlobal", "u", "s", "d", ["es", "pcre2", "tclDiffers"]], ["dollar", "s", "d", "s"]] },
  // A hyphen Tcl does not take.
  { id: "flags-global-hyphen", description: "Tcl has no hyphen to turn an option off", pattern: "(?i-s)a", flags: "", expect: [["inlineFlagsGlobal", "u", "s", "u", ["es", "pcre2", "tclLetters"]]] },
  // Possessive quantifiers, merged.
  { id: "possessive", description: "\\d++ and [a-z]*+ are PCRE2 only", pattern: "\\d++[a-z]*+", flags: "", expect: [["possessive", "u", "s", "u", null, 2]] },
  // An atomic group.
  { id: "atomic", description: "(?>...) is PCRE2 only", pattern: "(?>\\d+)foo", flags: "", expect: [["atomicGroup", "u", "s", "u"]] },
  // The three subject anchors.
  { id: "anchors", description: "\\A, \\Z and \\z", pattern: "\\Aadmin\\Z|\\Aroot\\z", flags: "", expect: [["anchorStart", "u", "s", "s", null, 2], ["anchorEndNewline", "u", "s", "d"], ["anchorEnd", "u", "s", "u"]] },
  // $ before a final newline in PCRE2.
  { id: "dollar", description: "a validator ending in $ accepts a trailing newline in PCRE2 by default", pattern: "^\\d{3}-\\d{4}$", flags: "", expect: [["dollar", "s", "d", "s"]] },
  // The dot.
  { id: "dot", description: "the dot and newlines", pattern: "a.b", flags: "", expect: [["dot", "s", "d", "d"]] },
  // POSIX classes: a shared name, a PCRE2-only name and a word edge.
  { id: "posix", description: "[:alpha:] in both, [:word:] PCRE2 only, [[:<:]] in both", pattern: "[[:alpha:]][[:word:]][[:<:]]", flags: "", expect: [["posixClass", "u", "s", "d", ["es", "pcre2", "tcl"]], ["posixClass", "u", "s", "u", ["es", "pcre2", "tclUnknown"]], ["posixWordEdge", "u", "s", "s"]] },
  // \Q...\E, with the dot inside it not compared.
  { id: "quote", description: "\\Q...\\E is PCRE2 only, and its inside is literal there", pattern: "\\Qa.b\\E+", flags: "", expect: [["quoteLiteral", "u", "s", "u"]] },
  // \p without u.
  { id: "property-no-u", description: "without u, a browser reads \\p{L} as literal text", pattern: "\\p{L}+", flags: "", expect: [["unicodeProperty", "u", "s", "u", ["esNoU", "pcre2", "tcl"]]] },
  // \p with u.
  { id: "property-u", description: "with u, ECMAScript wants Script= before a script name", pattern: "\\p{Script=Greek}", flags: "u", expect: [["unicodeProperty", "d", "s", "u", ["esU", "pcre2", "tcl"]]] },
  // The one-letter form.
  { id: "property-short", description: "\\pL is PCRE2 only", pattern: "\\pL\\pN", flags: "", expect: [["unicodePropertyShort", "u", "s", "u", null, 2]] },
  // Lazy quantifiers, after a dot.
  { id: "lazy", description: "a lazy quantifier follows Tcl's preference rules", pattern: "<.+?>", flags: "", expect: [["dot", "s", "d", "d"], ["lazy", "s", "s", "d"]] },
  // Word boundaries.
  { id: "boundaries", description: "\\b is backspace and \\B a backslash in Tcl", pattern: "\\bcat\\B", flags: "", expect: [["wordBoundary", "s", "s", "d"], ["nonWordBoundary", "s", "s", "d"]] },
  // A negated shorthand inside brackets.
  { id: "class-negated", description: "[\\W_] is illegal in a Tcl ARE", pattern: "[\\W_]+", flags: "", expect: [["classNegatedShorthand", "s", "s", "u"]] },
  // Tcl's word constraints.
  { id: "tcl-constraints", description: "\\m and \\M are Tcl only", pattern: "\\mword\\M", flags: "", expect: [["tclWordConstraint", "u", "u", "s", null, 2]] },
  // {,n}.
  { id: "omitted-min", description: "{,3} is a quantifier only in PCRE2 10.43 and later", pattern: "a{,3}", flags: "", expect: [["quantifierOmittedMin", "u", "s", "u"]] },
  // Nothing to report.
  { id: "none", description: "a plain anchored literal raises nothing", pattern: "^abc", flags: "", expect: [] },
  // Over the cap.
  { id: "too-long", description: "a pattern over the cap is not read", pattern: "a".repeat(MAX_PORTABILITY_LENGTH + 1), flags: "", expect: [], expectTooLong: true },
];

/** The letter for a verdict. */
const LETTER: Record<string, V> = { same: "s", different: "d", unsupported: "u" };

/** The showcase pattern run in this engine (D-83: the component's Portability example text is this input). */
export const SHOWCASE_MATCH_VECTORS: MatchVector[] = [
  // JavaScript accepts the lookbehind and the named group: one match, "admin".
  { id: "showcase-match", description: "the showcase matches the user name after user=", pattern: "(?<=user=)(?<name>\\w+)\\b", flags: "g", input: "user=admin&role=ops", expectOk: true, expectCount: 1, expectFirst: "admin", expectGroup1: "admin", expectNamed: { name: "admin" } },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of FLAG_VECTORS) {
    const r = parseFlags(v.flags);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok ${r.ok}/${v.expectOk}`);
    if (v.expectErrorIncludes && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push("err");
    if (errs.length) failures.push(`[flag:${v.id}] ${errs.join(";")}`);
    else passed++;
  }
  for (const v of COMPILE_VECTORS) {
    const r = compileRegex(v.pattern, v.flags);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok ${r.ok}/${v.expectOk}`);
    if (v.expectErrorIncludes && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`err: ${r.error?.message}`);
    if (errs.length) failures.push(`[compile:${v.id}] ${errs.join(";")}`);
    else passed++;
  }
  for (const v of MATCH_VECTORS) {
    const r = findMatches(v.pattern, v.flags, v.input);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok ${r.ok}/${v.expectOk}`);
    if (v.expectInputTooLong !== undefined && r.inputTooLong !== v.expectInputTooLong) errs.push(`tooLong ${r.inputTooLong}`);
    if (v.expectCount !== undefined && r.count !== v.expectCount) errs.push(`count ${r.count}/${v.expectCount}`);
    if (v.expectFirst !== undefined && r.matches[0]?.match !== v.expectFirst) errs.push(`first ${r.matches[0]?.match}`);
    if (v.expectGroup1 !== undefined && r.matches[0]?.groups[0]?.value !== v.expectGroup1) errs.push(`g1 ${r.matches[0]?.groups[0]?.value}`);
    if (v.expectNamed) for (const [k, val] of Object.entries(v.expectNamed)) if (r.matches[0]?.named[k] !== val) errs.push(`named.${k}`);
    if (errs.length) failures.push(`[match:${v.id}] ${errs.join(";")}`);
    else passed++;
  }
  for (const v of EXPLAIN_VECTORS) {
    const types = explainPattern(v.pattern).map((t) => t.type);
    if (JSON.stringify(types) !== JSON.stringify(v.expectTypes)) failures.push(`[explain:${v.id}] got ${JSON.stringify(types)}`);
    else passed++;
  }
  for (const v of REDOS_VECTORS) {
    const r = detectReDoS(v.pattern);
    if (r.risky !== v.expectRisky) failures.push(`[redos:${v.id}] risky ${r.risky}/${v.expectRisky}`);
    else passed++;
  }

  // v2: the showcase run in this engine, checked like the v1 match vectors.
  for (const v of SHOWCASE_MATCH_VECTORS) {
    // Run it.
    const r = findMatches(v.pattern, v.flags, v.input);
    // Collected mismatches.
    const errs: string[] = [];
    // Compiled and ran.
    if (r.ok !== v.expectOk) errs.push(`ok ${r.ok}/${v.expectOk}`);
    // Match count.
    if (v.expectCount !== undefined && r.count !== v.expectCount) errs.push(`count ${r.count}/${v.expectCount}`);
    // First match text.
    if (v.expectFirst !== undefined && r.matches[0]?.match !== v.expectFirst) errs.push(`first ${r.matches[0]?.match}`);
    // First group.
    if (v.expectGroup1 !== undefined && r.matches[0]?.groups[0]?.value !== v.expectGroup1) errs.push(`g1 ${r.matches[0]?.groups[0]?.value}`);
    // Named groups.
    if (v.expectNamed) for (const [k, val] of Object.entries(v.expectNamed)) if (r.matches[0]?.named[k] !== val) errs.push(`named.${k}`);
    // One line per vector, or a pass.
    if (errs.length) failures.push(`[showcase:${v.id}] ${errs.join(";")}`);
    else passed++;
  }

  // v2: the tokenizer's new forms, type and text byte for byte.
  for (const v of TOKEN_VECTORS) {
    // The actual tokens as [type, text] pairs.
    const got = explainPattern(v.pattern).map((t) => [t.type, t.text]);
    // Compare the serialised forms.
    if (JSON.stringify(got) !== JSON.stringify(v.expect)) failures.push(`[token:${v.id}] got ${JSON.stringify(got)}`);
    // Count a pass.
    else passed++;
  }

  // v2: portability rows, in order, with verdicts, notes, counts and parameters.
  for (const v of PORTABILITY_VECTORS) {
    // The report for this pattern and these flags.
    const r = portabilityOf(v.pattern, v.flags);
    // Collected mismatches for this vector.
    const errs: string[] = [];
    // The over-length flag.
    if (r.tooLong !== (v.expectTooLong ?? false)) errs.push(`tooLong ${r.tooLong}`);
    // The rows as compact tuples.
    const got = r.findings.map((f) => [f.id, LETTER[f.cells.ecmascript.verdict], LETTER[f.cells.pcre2.verdict], LETTER[f.cells.tcl.verdict]]);
    // The expected tuples, without the optional notes and counts.
    const want = v.expect.map((e) => [e[0], e[1], e[2], e[3]]);
    // Ids and verdicts must match exactly, in order.
    if (JSON.stringify(got) !== JSON.stringify(want)) errs.push(`rows ${JSON.stringify(got)}`);
    // Notes and counts where the vector states them.
    v.expect.forEach((e, i) => {
      // The row under test.
      const f = r.findings[i];
      // Missing rows are already reported above.
      if (!f) return;
      // The three note keys, when stated.
      if (e[4] && JSON.stringify([f.cells.ecmascript.note, f.cells.pcre2.note, f.cells.tcl.note]) !== JSON.stringify(e[4])) errs.push(`notes[${i}] ${f.cells.ecmascript.note},${f.cells.pcre2.note},${f.cells.tcl.note}`);
      // The occurrence count, when stated.
      if (e[5] !== undefined && f.count !== e[5]) errs.push(`count[${i}] ${f.count}`);
    });
    // Parameter values, when stated.
    for (const [i, ps] of Object.entries(v.expectParams ?? {})) for (const [k, val] of Object.entries(ps)) if (r.findings[Number(i)]?.params[k] !== val) errs.push(`param[${i}].${k} ${r.findings[Number(i)]?.params[k]}`);
    // One failure line per vector, or a pass.
    if (errs.length) failures.push(`[portability:${v.id}] ${errs.join(";")}`);
    else passed++;
  }

  // v2: every construct in the catalogue has at least one vector.
  const covered = new Set(PORTABILITY_VECTORS.flatMap((v) => v.expect.map((e) => e[0])));
  // Report any construct left untested.
  for (const id of PORTABILITY_CONSTRUCTS) if (!covered.has(id)) failures.push(`[portability-coverage] ${id} has no vector`);
  // v2: every rule cites only sources the manifest carries.
  for (const id of PORTABILITY_CONSTRUCTS) for (const s of portabilitySourcesFor(id)) if (!PORTABILITY_SOURCE_IDS.includes(s)) failures.push(`[portability-sources] ${id} cites unknown source ${s}`);
  // The two catalogue checks count as one pass each when clean.
  if (!failures.some((f) => f.startsWith("[portability-coverage]"))) passed++;
  // Sources clean.
  if (!failures.some((f) => f.startsWith("[portability-sources]"))) passed++;

  return { passed, failed: failures.length, failures };
}
