// ============================================================================
// src/lib/tools/regex/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING REGEX TOOLKIT - a self-contained {manifest, run, vectors}
// triple. Compile, test, and explain JavaScript regular expressions, with a
// static ReDoS heuristic and an input cap so a pasted pattern cannot silently
// lock up the page. The always-safe direction (run) explains a pattern without
// executing it. Bounded, offline.
// ============================================================================

import { explainPattern, type RegexToken } from "./compute";
import { GOLDEN_VECTOR_SET_ID, FLAG_VECTORS, COMPILE_VECTORS, MATCH_VECTORS, EXPLAIN_VECTORS, REDOS_VECTORS } from "./golden-vectors";

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
} from "./compute";
export type { FlagsResult, CompileResult, MatchResult, RegexMatch, MatchGroup, RegexToken, TokenType, ReDoSResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the regex toolkit. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities",
  toolSlug: "regex",
  canonicalAliases: ["regular-expression", "regexp", "regex-tester", "regex-explainer"],
  inputDetectors: [
    { kind: "regex", pattern: "\\\\[dwsbDWSB]|\\(\\?[:=!<]", priority: 3, example: "\\d{3}-(?:\\d{4})" },
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
  learnLinks: ["learn/regex-quantifiers-and-classes", "learn/regex-groups-and-backreferences", "learn/regex-catastrophic-backtracking", "learn/regex-anchors-and-boundaries", "learn/regex-flags-and-modes"],
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
      access_date: "2026-06-29",
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
      scope: "an interactive tester and debugger across PCRE2, JavaScript, Python, Java, .NET, Go, and Rust flavors, with a live explanation pane",
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
      scope: "the classic independent reference: engine internals, flavor differences, and a complete tutorial",
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
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = [...FLAG_VECTORS, ...COMPILE_VECTORS, ...MATCH_VECTORS, ...EXPLAIN_VECTORS, ...REDOS_VECTORS];

export type ToolRunResult = RegexToken[];
