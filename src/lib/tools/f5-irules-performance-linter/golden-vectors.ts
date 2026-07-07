// ============================================================================
// src/lib/tools/f5-irules-performance-linter/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules performance linter
// (set id: "f5-irules-performance-linter/golden@1").
//
// Vector 1 is a deliberately anti-pattern-laden rule that exercises every
// detector AND the non-false-positive guards on the same lines (static:: is not
// flagged; the matchclass line also carries a $::datagroup global; the expr line
// also carries a global). Vector 2 is a clean rule (static::, class match, a
// braced expr) that must produce zero findings. Vector 3 is empty input. Values
// captured from compute.run().
// ============================================================================

import type { LinterResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-irules-performance-linter/golden@1";

export interface LinterGoldenVector {
  name: string;
  input: { irule: string };
  expected: LinterResult;
}

export const F5_IRULES_PERFORMANCE_LINTER_GOLDEN_VECTORS: LinterGoldenVector[] = [
  {
    name: "anti-patterns-every-rule",
    input: {
      irule: `when RULE_INIT {
    set static::maxcpu 60
    set ::legacy_flag 1
}
when HTTP_REQUEST {
    if { [matchclass [HTTP::uri] starts_with $::redirectURIs] } {
        set n [expr $::legacy_flag * 2]
        if { [regexp {^/api/} [HTTP::path]] } { log local0. "hit" }
    }
}`,
    },
    expected: {
      findings: [
        { category: "global-variable", severity: "high", line: 3, snippet: "set ::legacy_flag 1", match: "set ::legacy_flag" },
        { category: "global-variable", severity: "high", line: 6, snippet: 'if { [matchclass [HTTP::uri] starts_with $::redirectURIs] } {', match: "$::redirectURIs" },
        { category: "matchclass", severity: "info", line: 6, snippet: 'if { [matchclass [HTTP::uri] starts_with $::redirectURIs] } {', match: "matchclass" },
        { category: "global-variable", severity: "high", line: 7, snippet: "set n [expr $::legacy_flag * 2]", match: "$::legacy_flag" },
        { category: "expr-no-braces", severity: "warning", line: 7, snippet: "set n [expr $::legacy_flag * 2]", match: "expr" },
        { category: "regex", severity: "info", line: 8, snippet: 'if { [regexp {^/api/} [HTTP::path]] } { log local0. "hit" }', match: "regexp" },
      ],
      lineCount: 10,
      scannedLines: 10,
      counts: { high: 3, warning: 1, info: 2 },
    },
  },
  {
    name: "clean-rule-no-findings",
    input: {
      irule: `when RULE_INIT {
    set static::api_prefix "/api/"
}
when HTTP_REQUEST {
    if { [class match [HTTP::path] starts_with allowed_paths] } {
        set n [expr { [HTTP::header count] + 1 }]
        pool app_pool
    }
}`,
    },
    expected: {
      findings: [],
      lineCount: 9,
      scannedLines: 9,
      counts: { high: 0, warning: 0, info: 0 },
    },
  },
  {
    name: "empty-input",
    input: { irule: "" },
    expected: {
      findings: [],
      lineCount: 1,
      scannedLines: 0,
      counts: { high: 0, warning: 0, info: 0 },
    },
  },
];
