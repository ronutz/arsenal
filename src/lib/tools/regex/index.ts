// ============================================================================
// src/lib/tools/regex/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING REGEX TOOLKIT - a self-contained {manifest, run, vectors}
// triple. Compile, test, and explain JavaScript regular expressions, with a
// static ReDoS heuristic and an input cap so a pasted pattern cannot silently
// lock up the page. The always-safe direction (run) explains a pattern without
// executing it. Bounded, offline.
// 2026-10-26: a portability view compares the pattern's constructs against
// PCRE2 (NGINX) and Tcl AREs (BIG-IP iRules), statically; the tester still runs
// only ECMAScript. Its first-party sources are spread in from compute.ts.
// ============================================================================

import { explainPattern, PORTABILITY_SOURCES, type RegexToken } from "./compute";
// The v1 groups, unchanged, and (2026-10-26) the tokenizer and portability groups.
import { GOLDEN_VECTOR_SET_ID, FLAG_VECTORS, COMPILE_VECTORS, MATCH_VECTORS, EXPLAIN_VECTORS, REDOS_VECTORS, TOKEN_VECTORS, PORTABILITY_VECTORS, SHOWCASE_MATCH_VECTORS } from "./golden-vectors";

export {
  parseFlags,
  compileRegex,
  findMatches,
  explainPattern,
  detectReDoS,
  run,
  MAX_INPUT_LENGTH,
  MAX_MATCHES,
  VALID_FLAGS,
  // 2026-10-26: the portability view.
  portabilityReport,
  portabilityOf,
  portabilitySourcesFor,
  FLAVOURS,
  PORTABILITY_CONSTRUCTS,
  PORTABILITY_SOURCES,
  MAX_PORTABILITY_LENGTH,
} from "./compute";
export type { FlagsResult, CompileResult, MatchResult, RegexMatch, MatchGroup, RegexToken, TokenType, ReDoSResult } from "./compute";
// 2026-10-26: the portability types.
export type { Flavour, PortVerdict, PortCell, PortConstructId, PortFinding, PortabilityReport, PortSource } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, PORTABILITY_VECTORS } from "./golden-vectors";

/** The D-49 declarative manifest for the regex toolkit. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities",
  toolSlug: "regex",
  canonicalAliases: ["regular-expression", "regexp", "regex-tester", "regex-explainer"],
  inputDetectors: [
    { kind: "regex", pattern: "\\\\[dwsbDWSB]|\\(\\?[:=!<]", priority: 3, example: "\\d{3}-(?:\\d{4})" },
    // S4 sweep, 2026-10-27: the constructs the portability view compares that the pattern above misses, so a pasted
    // PCRE2 (NGINX) or Tcl (iRules, Expect) pattern reaches the tool that now reads it: inline options (?i) (?i-s:
    // (?-s:, the other group openers (?P< (?P= (?' (?>, a POSIX class [:alpha:] and Tcl's [[:<:]], \p{...}, and the
    // named backreferences \k< \k' \k{. Anchors such as \A and Tcl's \m or \y are left out: Windows paths are full of
    // them. Every branch is a bounded run of one class after literals, with no nested quantifiers: linear (ReDoS-safe).
    { kind: "regex", pattern: "\\(\\?(?:[imsx]{1,4}(?:-[imsx]{1,4})?[:)]|-[imsx]{1,4}[:)]|P[<=>]|'[A-Za-z_]|>)|\\[:[a-z]{1,6}:\\]|\\[\\[:[<>]:\\]\\]|\\\\p\\{[A-Za-z_=]{1,30}\\}|\\\\k[<'{][A-Za-z_]", priority: 3, example: "(?i)abc" }, // portability vector flags-global-start
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "redos-guard", "input-length-cap"],
  shareSafetyDefault: "ephemeral", // the test text may be sensitive

  // -- Teaching & provenance --
  // S4 sweep, 2026-10-27: plus the Expect article on -re patterns, which follow Tcl's regexp syntax (the Tcl column).
  learnLinks: ["learn/regex-quantifiers-and-classes", "learn/regex-groups-and-backreferences", "learn/regex-catastrophic-backtracking", "learn/regex-anchors-and-boundaries", "learn/regex-flags-and-modes", "learn/expect-patterns-and-the-buffer"],
  sources: [
    {
      id: "mdn-regex",
      label: "MDN: Regular expressions",
      type: "vendor-docs",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions",
      access_date: "2026-06-29",
      scope: "JavaScript regex syntax, flags, groups, and assertions",
      status: "active",
    },
    {
      id: "ecma262-regexp",
      label: "ECMAScript Language Specification: RegExp",
      type: "spec",
      url: "https://tc39.es/ecma262/multipage/text-processing.html",
      // Re-read 2026-10-26 (the 2027 draft; its RegExp grammar matches the 2026 edition).
      access_date: "2026-10-26",
      scope: "the normative regex grammar and semantics",
      status: "active",
    },
    {
      id: "owasp-redos",
      label: "OWASP: Regular expression Denial of Service (ReDoS)",
      type: "vendor-docs",
      url: "https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS",
      access_date: "2026-06-29",
      scope: "catastrophic backtracking and how to avoid it",
      status: "active",
    },
    {
      id: "regex101",
      label: "regex101",
      type: "reference",
      url: "https://regex101.com/",
      access_date: "2026-07-17",
      scope: "an interactive tester and debugger across PCRE2, JavaScript, Python, Java, .NET, Go, and Rust flavours, with a live explanation pane",
      status: "active",
    },
    {
      id: "regexr",
      label: "RegExr",
      type: "reference",
      url: "https://regexr.com/",
      access_date: "2026-07-17",
      scope: "a real-time tester for JavaScript and PCRE with contextual help, test suites, and searchable community patterns",
      status: "active",
    },
    {
      id: "rexegg",
      label: "RexEgg",
      type: "guide",
      url: "https://www.rexegg.com/",
      access_date: "2026-07-17",
      scope: "in-depth tutorials from fundamentals to advanced techniques, tricks, and cross-flavor comparisons",
      status: "active",
    },
    {
      id: "regular-expressions-info",
      label: "Regular-Expressions.info",
      type: "reference",
      url: "https://www.regular-expressions.info/",
      access_date: "2026-07-17",
      scope: "the classic independent reference: engine internals, flavour differences, and a complete tutorial",
      status: "active",
    },
    {
      id: "regexone",
      label: "RegexOne",
      type: "guide",
      url: "https://regexone.com/",
      access_date: "2026-07-17",
      scope: "short interactive lessons and practice problems for building regex skill from zero",
      status: "active",
    },
    {
      id: "regexlearn",
      label: "RegexLearn",
      type: "guide",
      url: "https://regexlearn.com/",
      access_date: "2026-07-17",
      scope: "step-by-step interactive lessons and a one-page cheatsheet, from zero to advanced",
      status: "active",
    },
    // 2026-10-26: the first-party documents behind the portability view (ECMA-262 2026,
    // the PCRE2 manual, the Tcl re_syntax and regexp manuals, F5 K6091 and K36322151,
    // F5's ASM signature syntax and nginx's location, map, configure and captures pages).
    ...PORTABILITY_SOURCES,
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

// Every vector group, v1 first, then the 2026-10-26 tokenizer and portability groups.
export const goldenVectors = [...FLAG_VECTORS, ...COMPILE_VECTORS, ...MATCH_VECTORS, ...EXPLAIN_VECTORS, ...REDOS_VECTORS, ...TOKEN_VECTORS, ...PORTABILITY_VECTORS, ...SHOWCASE_MATCH_VECTORS];

export type ToolRunResult = RegexToken[];
