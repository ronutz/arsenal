// ============================================================================
// src/lib/tools/f5-irules-style-checker/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules style checker
// (set "f5-irules-style-checker-golden-2026-10-03").
//
// Each vector is an iRule. The pinned fields are every finding (rule,
// severity, line, parameters), the counts, whether Tcl 8.4 parses it, and the
// events with their priorities.
//
// Expected values were captured from compute.run() on 2026-10-03.
// These vectors pin generated text and findings, which have no Tcl 8.4.6
// reference answer; the Tcl parts they rely on (the parser, the interpreter)
// are covered by the engine's own differential tests.
// ============================================================================

import { run, type StyleCheckerResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-style-checker-golden-2026-10-03";

/** The fields a vector pins. */
export type StyleCheckerPinned = { findings: (string | number)[][]; counts: StyleCheckerResult["counts"]; parses: boolean; events: StyleCheckerResult["events"] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface StyleCheckerVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: { irule: string };
  // The pinned fields of the result.
  expect: StyleCheckerPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: StyleCheckerResult): StyleCheckerPinned {
  // Each finding as a compact row: rule, severity, line, parameters.
  const findings = r.findings.map((f) => [f.rule, f.severity, f.line, f.params ? JSON.stringify(f.params) : ""]);
  // The pinned fields.
  return { findings, counts: r.counts, parses: r.parses, events: r.events };
}

/** The vectors. */
export const VECTORS: StyleCheckerVector[] = [
  // A rule that breaks several of the guide's rules at once.
  {
    id: "messy",
    input: {
      irule: "when HTTP_REQUEST {\n\tif {[HTTP::uri] eq \"/old\"} { HTTP::redirect \"https://[HTTP::host]/new\" }\n    set n [expr $count + 1]   ;# bump\n    switch [HTTP::path] {\n        \"/a\" { pool a_pool }\n        default { pool web_pool }\n    }\n    if { $a and $b } {\n        #log local0. \"debug\"\n        set static::flag 1\n    }\n}\n",
    },
    expect: {
      findings: [
        ["R16", "warning", 1, "{\"event\":\"HTTP_REQUEST\"}"],
        ["E1", "warning", 2, "{\"what\":\"tab\"}"],
        ["R8", "warning", 2, ""],
        ["R6", "warning", 3, "{\"what\":\"eol\"}"],
        ["R12", "warning", 3, "{\"word\":\"$count + 1\"}"],
        ["R15", "warning", 4, "{\"command\":\"switch\"}"],
        ["R10", "warning", 8, ""],
        ["R14", "info", 8, ""],
        ["R20", "info", 9, "{\"what\":\"commented-code\"}"],
        ["R18", "info", 10, "{\"name\":\"flag\"}"],
      ],
      counts: { error: 0, warning: 7, info: 3 },
      parses: true,
      events: [{ name: "HTTP_REQUEST", line: 1, priority: null }],
    },
  },
  // The same kind of decision written the way the guide asks: no findings.
  {
    id: "clean",
    input: {
      irule: "when HTTP_REQUEST priority 500 {\n    # Send API traffic to its own pool.\n    set path [string tolower [HTTP::path]]\n    switch -glob -- ${path} {\n        \"/api/*\" {\n            pool api_pool\n        }\n        default {\n            pool web_pool\n        }\n    }\n}\n",
    },
    expect: {
      findings: [],
      counts: { error: 0, warning: 0, info: 0 },
      parses: true,
      events: [{ name: "HTTP_REQUEST", line: 1, priority: "500" }],
    },
  },
  // }{ with no space: Tcl 8.4 cannot load it (and R11 asks for the space).
  {
    id: "brace-brace",
    input: { irule: "when HTTP_REQUEST priority 500 {\n    if { 1 }{\n        pool a\n    }\n}\n" },
    expect: {
      findings: [
        ["syntax", "error", 2, "{\"message\":\"extra characters after close-brace\"}"],
        ["R11", "warning", 2, ""],
      ],
      counts: { error: 1, warning: 1, info: 0 },
      parses: false,
      events: [{ name: "HTTP_REQUEST", line: 1, priority: "500" }],
    },
  },
  // A ZERO WIDTH SPACE after a closing brace: invisible, and Tcl 8.4.6 stops with extra characters after close-brace (R1 and syntax).
  {
    id: "zero-width",
    input: {
      irule: "when RULE_INIT priority 500 {\n    set static::myapp_limit 10\n}\u200B\nwhen HTTP_REQUEST priority 500 {\n    log local0. \"limit ${static::myapp_limit}\"\n}\n",
    },
    expect: {
      findings: [
        [
          "R1",
          "error",
          3,
          "{\"what\":\"invisible\",\"char\":\"U+200B\",\"name\":\"ZERO WIDTH SPACE\",\"col\":2,\"count\":1}",
        ],
        ["syntax", "error", 3, "{\"message\":\"extra characters after close-brace\"}"],
      ],
      counts: { error: 2, warning: 0, info: 0 },
      parses: false,
      events: [],
    },
  },
  // Pasted from a word processor: an EN DASH where -- belongs (so switch takes it as the value), curly quotes and a NO-BREAK SPACE.
  {
    id: "word-processor",
    input: {
      irule: "when HTTP_REQUEST priority 500 {\n    switch \u2013- [HTTP::host] {\n        \u201Cwww.example.com\u201D {\n            pool\u00A0web_pool\n        }\n    }\n}\n",
    },
    expect: {
      findings: [
        [
          "E3",
          "warning",
          2,
          "{\"what\":\"dash\",\"char\":\"U+2013\",\"name\":\"EN DASH\",\"col\":12,\"count\":1}",
        ],
        ["R15", "warning", 2, "{\"command\":\"switch\"}"],
        [
          "R1",
          "error",
          3,
          "{\"what\":\"quote\",\"char\":\"U+201C\",\"name\":\"LEFT DOUBLE QUOTATION MARK\",\"col\":9,\"count\":2}",
        ],
        [
          "R1",
          "error",
          4,
          "{\"what\":\"space\",\"char\":\"U+00A0\",\"name\":\"NO-BREAK SPACE\",\"col\":17,\"count\":1}",
        ],
      ],
      counts: { error: 2, warning: 2, info: 0 },
      parses: true,
      events: [{ name: "HTTP_REQUEST", line: 1, priority: "500" }],
    },
  },
  // The comment thread's points: == against a piece of text (D1), break in a switch arm with no loop (D2 error) and return in an arm (D2 note).
  {
    id: "thread-points",
    input: {
      irule: "when HTTP_REQUEST priority 500 {\n    if { ${state} == \"IL\" } {\n        pool gold_pool\n    }\n    switch -- [HTTP::method] {\n        \"GET\" {\n            pool get_pool\n            break\n        }\n        default {\n            return\n        }\n    }\n}\n",
    },
    expect: {
      findings: [
        ["D1", "warning", 2, "{\"op\":\"==\",\"text\":\"\\\"IL\\\"\",\"suggest\":\"eq\"}"],
        ["D2", "error", 8, "{\"what\":\"outside-loop\",\"cmd\":\"break\"}"],
        ["D2", "info", 11, "{\"what\":\"return-arm\"}"],
      ],
      counts: { error: 1, warning: 1, info: 1 },
      parses: true,
      events: [{ name: "HTTP_REQUEST", line: 1, priority: "500" }],
    },
  },
  // An array variable (valid Tcl the engine does not model: a note, and the rest is still checked) and if{ glued to its brace (R11 error).
  {
    id: "array-and-keyword",
    input: {
      irule: "when HTTP_REQUEST priority 500 {\n    set key [string tolower [HTTP::host]]\n    if { [info exists static::myapp_pools(${key})] } {\n        pool $static::myapp_pools(${key})\n    }\n    if{ [HTTP::method] eq \"POST\" } {\n        log local0. \"post\"\n    }\n}\n",
    },
    expect: {
      findings: [
        ["limit", "info", 4, "{\"what\":\"array\",\"ref\":\"$static::myapp_pools(${key})\"}"],
        ["R11", "error", 6, "{\"what\":\"keyword-brace\",\"word\":\"if{\"}"],
      ],
      counts: { error: 1, warning: 0, info: 1 },
      parses: true,
      events: [{ name: "HTTP_REQUEST", line: 1, priority: "500" }],
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
