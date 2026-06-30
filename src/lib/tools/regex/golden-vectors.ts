// ============================================================================
// src/lib/tools/regex/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the regex toolkit: flag validation, compilation, matching (with
// positional and named groups, the zero-width guard, and the no-g single-match
// path), the explainer's token output, and the ReDoS heuristic.
// ============================================================================

import { parseFlags, compileRegex, findMatches, explainPattern, detectReDoS } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "regex-toolkit-golden-v1";

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

  return { passed, failed: failures.length, failures };
}
