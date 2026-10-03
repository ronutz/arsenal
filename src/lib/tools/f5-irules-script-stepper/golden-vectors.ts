// ============================================================================
// src/lib/tools/f5-irules-script-stepper/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules script stepper
// (set "f5-irules-script-stepper-golden-2026-10-03").
//
// Each vector is a short script and a mode. The pinned fields are how it
// ended, its result, the final variables, the log lines, the recorded
// actions, and every executed command as depth, line, words, result, error
// and note codes.
//
// Expected values were captured from compute.run() on 2026-10-03.
// The plain-Tcl part of every vector (5 checks) was also run in a real
// Tcl 8.4.6 interpreter, built from the tcltk/tcl tag core-8-4-6, on 2026-10-03:
// 5 of 5 agree. Nothing here is pinned from the engine alone where
// the reference can answer.
// ============================================================================

import { run, type ScriptStepperInput, type ScriptStepperResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-script-stepper-golden-2026-10-03";

/** The fields a vector pins. */
export type ScriptStepperPinned = { code: string; result: string; vars: ScriptStepperResult["vars"]; logs: ScriptStepperResult["logs"]; actions: ScriptStepperResult["actions"]; events: (string | number | string[] | null)[][] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface ScriptStepperVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: ScriptStepperInput;
  // The pinned fields of the result.
  expect: ScriptStepperPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: ScriptStepperResult): ScriptStepperPinned {
  // Each event as a compact row.
  const events = r.events.map((e) => [e.depth, e.line, e.words, e.result ?? null, e.error ?? null, e.notes.map((n) => n.code).join(",")]);
  // The pinned fields.
  return { code: r.code, result: r.result, vars: r.vars, logs: r.logs, actions: r.actions, events };
}

/** The vectors. */
export const VECTORS: ScriptStepperVector[] = [
  // "$a$b" joins with nothing between; "$a $b" keeps the space.
  {
    id: "quote-concat",
    input: { script: "set a \"foo\"\nset b \"bar\"\nset c \"$a$b\"\nset d \"$a $b\"", mode: "tcl" },
    expect: {
      code: "ok",
      result: "foo bar",
      vars: [
        { name: "a", value: "foo" },
        { name: "b", value: "bar" },
        { name: "c", value: "foobar" },
        { name: "d", value: "foo bar" },
      ],
      logs: [],
      actions: [],
      events: [
        [0, 1, ["set", "a", "foo"], "foo", null, ""],
        [0, 2, ["set", "b", "bar"], "bar", null, ""],
        [0, 3, ["set", "c", "foobar"], "foobar", null, ""],
        [0, 4, ["set", "d", "foo bar"], "foo bar", null, ""],
      ],
    },
  },
  // append keeps every space; concat trims each argument and joins with one space.
  {
    id: "append-vs-concat",
    input: { script: "set x \" a \"\nappend x \" b\"\nset y [concat \" a \" \" b\"]", mode: "tcl" },
    expect: {
      code: "ok",
      result: "a b",
      vars: [{ name: "x", value: " a  b" }, { name: "y", value: "a b" }],
      logs: [],
      actions: [],
      events: [
        [0, 1, ["set", "x", " a "], " a ", null, ""],
        [0, 2, ["append", "x", " b"], " a  b", null, ""],
        [0, 3, ["set", "y", "a b"], "a b", null, ""],
        [1, 1, ["concat", " a ", " b"], "a b", null, "concat"],
      ],
    },
  },
  // incr reads 010 as octal eight, so the result is 9.
  {
    id: "incr-octal",
    input: { script: "set n 010\nincr n", mode: "tcl" },
    expect: {
      code: "ok",
      result: "9",
      vars: [{ name: "n", value: "9" }],
      logs: [],
      actions: [],
      events: [[0, 1, ["set", "n", "010"], "010", null, ""], [0, 2, ["incr", "n"], "9", null, "incr-octal"]],
    },
  },
  // A value with spaces is a list of three elements to foreach.
  {
    id: "foreach-count",
    input: {
      script: "set items \"red green blue\"\nset count 0\nforeach item $items {\n    incr count\n}\nset count",
      mode: "tcl",
    },
    expect: {
      code: "ok",
      result: "3",
      vars: [
        { name: "items", value: "red green blue" },
        { name: "count", value: "3" },
        { name: "item", value: "blue" },
      ],
      logs: [],
      actions: [],
      events: [
        [0, 1, ["set", "items", "red green blue"], "red green blue", null, ""],
        [0, 2, ["set", "count", "0"], "0", null, ""],
        [0, 3, ["foreach", "item", "red green blue", "\n    incr count\n"], "", null, "foreach"],
        [1, 2, ["incr", "count"], "1", null, ""],
        [1, 2, ["incr", "count"], "2", null, ""],
        [1, 2, ["incr", "count"], "3", null, ""],
        [0, 6, ["set", "count"], "3", null, ""],
      ],
    },
  },
  // append glues text; lappend adds list elements.
  {
    id: "append-vs-lappend",
    input: {
      script: "set s \"\"\nforeach w {one two three} {\n    append s $w\n}\nset l {}\nforeach w {one two three} {\n    lappend l $w\n}\nlist $s $l",
      mode: "tcl",
    },
    expect: {
      code: "ok",
      result: "onetwothree {one two three}",
      vars: [
        { name: "s", value: "onetwothree" },
        { name: "w", value: "three" },
        { name: "l", value: "one two three" },
      ],
      logs: [],
      actions: [],
      events: [
        [0, 1, ["set", "s", ""], "", null, ""],
        [0, 2, ["foreach", "w", "one two three", "\n    append s $w\n"], "", null, "foreach"],
        [1, 2, ["append", "s", "one"], "one", null, ""],
        [1, 2, ["append", "s", "two"], "onetwo", null, ""],
        [1, 2, ["append", "s", "three"], "onetwothree", null, ""],
        [0, 5, ["set", "l", ""], "", null, ""],
        [0, 6, ["foreach", "w", "one two three", "\n    lappend l $w\n"], "", null, "foreach"],
        [1, 2, ["lappend", "l", "one"], "one", null, ""],
        [1, 2, ["lappend", "l", "two"], "one two", null, ""],
        [1, 2, ["lappend", "l", "three"], "one two three", null, ""],
        [0, 9, ["list", "onetwothree", "one two three"], "onetwothree {one two three}", null, ""],
      ],
    },
  },
  // switch -glob with -- before the value, as F5 recommends.
  {
    id: "switch-glob",
    input: {
      script: "set host [string tolower [HTTP::host]]\nswitch -glob -- $host {\n    \"*.example.com\" { pool example_pool }\n    default { pool web_pool }\n}",
      mode: "irules",
    },
    expect: {
      code: "ok",
      result: "",
      vars: [{ name: "host", value: "www.example.com" }],
      logs: [],
      actions: [{ command: "pool", args: ["example_pool"] }],
      events: [
        [0, 1, ["set", "host", "www.example.com"], "www.example.com", null, ""],
        [1, 1, ["string", "tolower", "www.example.com"], "www.example.com", null, ""],
        [2, 1, ["HTTP::host"], "www.example.com", null, ""],
        [
          0,
          2,
          [
            "switch",
            "-glob",
            "--",
            "www.example.com",
            "\n    \"*.example.com\" { pool example_pool }\n    default { pool web_pool }\n",
          ],
          "",
          null,
          "switch-list,switch-match",
        ],
        [1, 1, ["pool", "example_pool"], "", null, ""],
      ],
    },
  },
  // The first true condition wins; the log line shows the value used.
  {
    id: "if-elseif",
    input: {
      script: "set uri [HTTP::uri]\nif { $uri starts_with \"/login\" } {\n    log local0. \"login: $uri\"\n} elseif { $uri starts_with \"/api\" } {\n    pool api_pool\n} else {\n    pool web_pool\n}",
      mode: "irules",
    },
    expect: {
      code: "ok",
      result: "",
      vars: [{ name: "uri", value: "/login.php?user=abc" }],
      logs: [{ facility: "local0.", message: "login: /login.php?user=abc" }],
      actions: [],
      events: [
        [0, 1, ["set", "uri", "/login.php?user=abc"], "/login.php?user=abc", null, ""],
        [1, 1, ["HTTP::uri"], "/login.php?user=abc", null, ""],
        [
          0,
          2,
          [
            "if",
            " $uri starts_with \"/login\" ",
            "\n    log local0. \"login: $uri\"\n",
            "elseif",
            " $uri starts_with \"/api\" ",
            "\n    pool api_pool\n",
            "else",
            "\n    pool web_pool\n",
          ],
          "",
          null,
          "if-branch",
        ],
        [1, 2, ["log", "local0.", "login: /login.php?user=abc"], "", null, ""],
      ],
    },
  },
  // An unbraced expr substitutes twice: the [log ...] text held in $d RUNS.
  {
    id: "double-substitution",
    input: {
      script: "set d {[log local0. \"ran inside expr\"]}\nset r [catch {expr $d + 1} err]\nset err",
      mode: "irules",
    },
    expect: {
      code: "ok",
      result: "can't use empty string as operand of \"+\"",
      vars: [
        { name: "d", value: "[log local0. \"ran inside expr\"]" },
        { name: "err", value: "can't use empty string as operand of \"+\"" },
        { name: "r", value: "1" },
      ],
      logs: [{ facility: "local0.", message: "ran inside expr" }],
      actions: [],
      events: [
        [
          0,
          1,
          ["set", "d", "[log local0. \"ran inside expr\"]"],
          "[log local0. \"ran inside expr\"]",
          null,
          "",
        ],
        [0, 2, ["set", "r", "1"], "1", null, ""],
        [1, 1, ["catch", "expr $d + 1", "err"], "1", null, "catch"],
        [
          2,
          1,
          ["expr", "[log local0. \"ran inside expr\"]", "+", "1"],
          null,
          "can't use empty string as operand of \"+\"",
          "expr-unbraced",
        ],
        [3, 1, ["log", "local0.", "ran inside expr"], "", null, ""],
        [0, 3, ["set", "err"], "can't use empty string as operand of \"+\"", null, ""],
      ],
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
