// ============================================================================
// src/lib/tools/f5-irules-expression-lab/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules expression lab
// (set "f5-irules-expression-lab-golden-2026-10-03").
//
// Each vector is an expression plus the set commands that give its variables
// their values. The pinned fields are the outcome, the precedence grouping,
// the == / eq / < / > comparison panel and the evaluation trace, flattened to
// one line per node: kind | source | value | held | note codes.
//
// Expected values were captured from compute.run() on 2026-10-03.
// The plain-Tcl part of every vector (8 checks) was also run in a real
// Tcl 8.4.6 interpreter, built from the tcltk/tcl tag core-8-4-6, on 2026-10-03:
// 8 of 8 agree. Nothing here is pinned from the engine alone where
// the reference can answer.
// ============================================================================

import { run, type ExpressionLabInput, type ExpressionLabResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-expression-lab-golden-2026-10-03";

/** The fields a vector pins. */
export type ExpressionLabPinned = { ok: boolean; value?: string; held?: string; error?: string; stage?: string; errorPos?: number; grouping?: string; comparison?: ExpressionLabResult["comparison"]; trace: string[] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface ExpressionLabVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: ExpressionLabInput;
  // The pinned fields of the result.
  expect: ExpressionLabPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: ExpressionLabResult): ExpressionLabPinned {
  // Flatten the trace tree, depth first, one line per node.
  const trace: string[] = [];
  // Visit a node and its operands.
  const walk = (n: NonNullable<ExpressionLabResult["tree"]>, d: number): void => { trace.push(`${"  ".repeat(d)}${n.kind} | ${n.text} | ${n.skipped ? "(skipped)" : n.error !== undefined ? "error: " + n.error : n.value ?? ""} | ${n.held ?? ""} | ${n.notes.map((x) => x.code).join(",")}`); for (const k of n.kids) walk(k, d + 1); };
  // The tree is absent when the expression did not parse.
  if (r.tree) walk(r.tree, 0);
  // The pinned fields.
  return { ok: r.ok, value: r.value, held: r.held, error: r.error, stage: r.stage, errorPos: r.errorPos, grouping: r.grouping, comparison: r.comparison, trace };
}

/** The vectors. */
export const VECTORS: ExpressionLabVector[] = [
  // * binds tighter than +: $a + ($b * 2).
  {
    id: "precedence",
    input: { expression: "$a + $b * 2", setup: "set a 3; set b 4", mode: "tcl" },
    expect: {
      ok: true,
      value: "11",
      held: "int",
      grouping: "($a + ($b * 2))",
      trace: [
        "bin | $a + $b * 2 | 11 | int | arith",
        "  var | $a | 3 |  | var",
        "  bin | $b * 2 | 8 | int | arith",
        "    var | $b | 4 |  | var",
        "    lit | 2 | 2 |  | lit-int",
      ],
    },
  },
  // Upper case sorts first in a string comparison: "bench" is NOT less than "Chair".
  {
    id: "string-compare-case",
    input: { expression: "\"bench\" < \"Chair\"", setup: "", mode: "tcl" },
    expect: {
      ok: true,
      value: "0",
      held: "int",
      grouping: "(\"bench\" < \"Chair\")",
      comparison: {
        left: "\"bench\"",
        right: "\"Chair\"",
        results: [
          { op: "==", ok: true, result: "0" },
          { op: "eq", ok: true, result: "0" },
          { op: "<", ok: true, result: "0" },
          { op: ">", ok: true, result: "1" },
        ],
      },
      trace: [
        "bin | \"bench\" < \"Chair\" | 0 | int | cmp-string",
        "  quote | \"bench\" | bench |  | quoted",
        "  quote | \"Chair\" | Chair |  | quoted",
      ],
    },
  },
  // 012 is octal ten, so == is true while eq is false.
  {
    id: "octal-equality",
    input: { expression: "$x == $y", setup: "set x 012; set y 10", mode: "tcl" },
    expect: {
      ok: true,
      value: "1",
      held: "int",
      grouping: "($x == $y)",
      comparison: {
        left: "$x",
        right: "$y",
        results: [
          { op: "==", ok: true, result: "1" },
          { op: "eq", ok: true, result: "0" },
          { op: "<", ok: true, result: "0" },
          { op: ">", ok: true, result: "0" },
        ],
      },
      trace: ["bin | $x == $y | 1 | int | cmp-number", "  var | $x | 012 |  | var", "  var | $y | 10 |  | var"],
    },
  },
  // true is a boolean word, not a number: == compares it as a string.
  {
    id: "true-is-not-1",
    input: { expression: "true == 1", setup: "", mode: "tcl" },
    expect: {
      ok: true,
      value: "0",
      held: "int",
      grouping: "(true == 1)",
      comparison: {
        left: "true",
        right: "1",
        results: [
          { op: "==", ok: true, result: "0" },
          { op: "eq", ok: true, result: "0" },
          { op: "<", ok: true, result: "0" },
          { op: ">", ok: true, result: "1" },
        ],
      },
      trace: [
        "bin | true == 1 | 0 | int | cmp-string",
        "  lit | true | true |  | lit-bool",
        "  lit | 1 | 1 |  | lit-int",
      ],
    },
  },
  // Tcl 8.4 has no ** operator: the second * is a syntax error.
  {
    id: "no-power-operator",
    input: { expression: "2 ** 3", setup: "", mode: "tcl" },
    expect: {
      ok: false,
      error: "syntax error in expression \"2 ** 3\": unexpected operator *",
      stage: "parse",
      errorPos: 3,
      trace: [],
    },
  },
  // Integer division rounds toward negative infinity: 7 / -2 is -4.
  {
    id: "floor-division",
    input: { expression: "7 / -2", setup: "", mode: "tcl" },
    expect: {
      ok: true,
      value: "-4",
      held: "int",
      grouping: "(7 / (-2))",
      trace: [
        "bin | 7 / -2 | -4 | int | intdiv",
        "  lit | 7 | 7 |  | lit-int",
        "  un | -2 | -2 | int | uminus",
        "    lit | 2 | 2 |  | lit-int",
      ],
    },
  },
  // || stops once the left side is true: [incr n] never runs.
  {
    id: "short-circuit",
    input: { expression: "$n > 5 || [incr n] > 0", setup: "set n 7", mode: "tcl" },
    expect: {
      ok: true,
      value: "1",
      held: "string",
      grouping: "(($n > 5) || ([incr n] > 0))",
      trace: [
        "bin | $n > 5 || [incr n] > 0 | 1 | string | short-circuit",
        "  bin | $n > 5 | 1 | int | cmp-number",
        "    var | $n | 7 |  | var",
        "    lit | 5 | 5 |  | lit-int",
        "  bin | [incr n] > 0 | (skipped) |  | ",
      ],
    },
  },
  // F5's starts_with operator on the request URI.
  {
    id: "irules-starts-with",
    input: { expression: "[HTTP::uri] starts_with \"/login\"", setup: "", mode: "irules" },
    expect: {
      ok: true,
      value: "1",
      held: "int",
      grouping: "([HTTP::uri] starts_with \"/login\")",
      trace: [
        "bin | [HTTP::uri] starts_with \"/login\" | 1 | int | f5-op",
        "  cmd | [HTTP::uri] | /login.php?user=abc |  | cmd",
        "  quote | \"/login\" | /login |  | quoted",
      ],
    },
  },
  // F5's word operators: contains, and.
  {
    id: "irules-and",
    input: {
      expression: "[HTTP::host] contains \"example\" and [HTTP::method] eq \"GET\"",
      setup: "",
      mode: "irules",
    },
    expect: {
      ok: true,
      value: "1",
      held: "int",
      grouping: "(([HTTP::host] contains \"example\") and ([HTTP::method] eq \"GET\"))",
      trace: [
        "bin | [HTTP::host] contains \"example\" and [HTTP::method] eq \"GET\" | 1 | int | logic",
        "  bin | [HTTP::host] contains \"example\" | 1 | int | f5-op",
        "    cmd | [HTTP::host] | www.example.com |  | cmd",
        "    quote | \"example\" | example |  | quoted",
        "  bin | [HTTP::method] eq \"GET\" | 1 | int | streq",
        "    cmd | [HTTP::method] | GET |  | cmd",
        "    quote | \"GET\" | GET |  | quoted",
      ],
    },
  },
  // 08 written in the expression itself is rejected before anything runs.
  {
    id: "literal-08",
    input: { expression: "$code == 08", setup: "set code 8", mode: "tcl" },
    expect: {
      ok: false,
      error: "expected integer but got \"08\" (looks like invalid octal number)",
      stage: "parse",
      errorPos: 9,
      trace: [],
    },
  },
];

/** What verifyVectors reports (the shape scripts/run-golden-vectors.mts reads). */
export interface VerifyReport {
  // The set id.
  setId: string;
  // Vectors run.
  total: number;
  // Vectors whose pinned fields matched.
  passed: number;
  // The ones that did not, with the first difference.
  failures: { id: string; reason: string }[];
}

/** Run every vector and compare its pinned fields byte for byte. */
export function verifyVectors(): VerifyReport {
  // Failures found.
  const failures: { id: string; reason: string }[] = [];
  // Each vector.
  for (const v of VECTORS) {
    // A throw is a failure too.
    try {
      // Run and reduce (through JSON, as the expected values were captured).
      const got = JSON.stringify(pin(run(v.input)));
      // The expected text.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character, for a readable reason.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push({ id: v.id, reason: `differs at ${k}: got ...${got.slice(Math.max(0, k - 30), k + 50)}... want ...${want.slice(Math.max(0, k - 30), k + 50)}...` });
      }
    } catch (e) {
      // The error.
      failures.push({ id: v.id, reason: `threw: ${(e as Error).message}` });
    }
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
