// ============================================================================
// src/lib/tools/f5-irules-string-workbench/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules string workbench
// (set "f5-irules-string-workbench-golden-2026-10-03").
//
// Each vector is one string subcommand with its arguments. The pinned fields
// are the result, the paste-ready command, the marked spans, how index
// arguments were read, the string map pass, and the note codes.
//
// Expected values were captured from compute.run() on 2026-10-03.
// The plain-Tcl part of every vector (17 checks) was also run in a real
// Tcl 8.4.6 interpreter, built from the tcltk/tcl tag core-8-4-6, on 2026-10-03:
// 17 of 17 agree. Nothing here is pinned from the engine alone where
// the reference can answer.
// ============================================================================

import { run, type StringWorkbenchInput, type StringWorkbenchResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-string-workbench-golden-2026-10-03";

/** The fields a vector pins. */
export type StringWorkbenchPinned = { ok: boolean; result?: string; error?: string; command: string; spans: StringWorkbenchResult["spans"]; readings: StringWorkbenchResult["readings"]; mapSteps?: StringWorkbenchResult["mapSteps"]; notes: string[] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface StringWorkbenchVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: StringWorkbenchInput;
  // The pinned fields of the result.
  expect: StringWorkbenchPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: StringWorkbenchResult): StringWorkbenchPinned {
  // Copy the outcome and its markings.
  return { ok: r.ok, result: r.result, error: r.error, command: r.command, spans: r.spans, readings: r.readings, mapSteps: r.mapSteps, notes: r.notes };
}

/** The vectors. */
export const VECTORS: StringWorkbenchVector[] = [
  // length counts characters.
  {
    id: "length-utf8",
    input: { op: "length", args: ["héllo"] },
    expect: {
      ok: true,
      result: "5",
      command: "string length héllo",
      spans: [{ from: 0, to: 4, role: "result" }],
      readings: [],
      notes: [],
    },
  },
  // bytelength counts the bytes of Tcl's internal UTF-8: é takes two.
  {
    id: "bytelength-utf8",
    input: { op: "bytelength", args: ["héllo"] },
    expect: {
      ok: true,
      result: "6",
      command: "string bytelength héllo",
      spans: [],
      readings: [],
      notes: ["bytes-differ"],
    },
  },
  // range takes first and last indexes, both included.
  {
    id: "range-path",
    input: { op: "range", args: ["/login.php?user=abc", "0", "9"] },
    expect: {
      ok: true,
      result: "/login.php",
      command: "string range /login.php?user=abc 0 9",
      spans: [{ from: 0, to: 9, role: "result" }],
      readings: [
        { label: "first", text: "0", value: 0, form: "int", base: 8, clamped: 0 },
        { label: "last", text: "9", value: 9, form: "int", base: 10, clamped: 9 },
      ],
      notes: [],
    },
  },
  // first returns the index where the needle starts.
  {
    id: "first-param",
    input: { op: "first", args: ["user=", "/login.php?user=abc"] },
    expect: {
      ok: true,
      result: "11",
      command: "string first user= /login.php?user=abc",
      spans: [{ from: 0, to: 18, role: "window" }, { from: 11, to: 15, role: "match" }],
      readings: [],
      notes: [],
    },
  },
  // map replaces every occurrence in one left-to-right pass.
  {
    id: "map-version",
    input: { op: "map", args: ["/v1/ /v2/", "/v1/users?next=/v1/orders"] },
    expect: {
      ok: true,
      result: "/v2/users?next=/v2/orders",
      command: "string map {/v1/ /v2/} /v1/users?next=/v1/orders",
      spans: [{ from: 0, to: 3, role: "replaced" }, { from: 15, to: 18, role: "replaced" }],
      readings: [],
      mapSteps: [
        { at: 0, action: "replace", text: "/v1/", value: "/v2/", pair: 0 },
        { at: 4, action: "keep", text: "users?next=" },
        { at: 15, action: "replace", text: "/v1/", value: "/v2/", pair: 0 },
        { at: 19, action: "keep", text: "orders" },
      ],
      notes: ["map-one-pass"],
    },
  },
  // At each position the FIRST key in the list that matches wins: a is tried before ab.
  {
    id: "map-order",
    input: { op: "map", args: ["a 1 ab 2", "abab"] },
    expect: {
      ok: true,
      result: "1b1b",
      command: "string map {a 1 ab 2} abab",
      spans: [{ from: 0, to: 0, role: "replaced" }, { from: 2, to: 2, role: "replaced" }],
      readings: [],
      mapSteps: [
        { at: 0, action: "replace", text: "a", value: "1", pair: 0 },
        { at: 1, action: "keep", text: "b" },
        { at: 2, action: "replace", text: "a", value: "1", pair: 0 },
        { at: 3, action: "keep", text: "b" },
      ],
      notes: ["map-one-pass"],
    },
  },
  // -nocase folds case before glob matching.
  {
    id: "match-nocase",
    input: { op: "match", args: ["*.EXAMPLE.com", "www.example.com"], nocase: true },
    expect: {
      ok: true,
      result: "1",
      command: "string match -nocase *.EXAMPLE.com www.example.com",
      spans: [],
      readings: [],
      notes: [],
    },
  },
  // Without -nocase the glob match is case-sensitive.
  {
    id: "match-case",
    input: { op: "match", args: ["*.EXAMPLE.com", "www.example.com"] },
    expect: {
      ok: true,
      result: "0",
      command: "string match *.EXAMPLE.com www.example.com",
      spans: [],
      readings: [],
      notes: [],
    },
  },
  // tolower before comparing host names.
  {
    id: "tolower-host",
    input: { op: "tolower", args: ["WWW.Example.COM"] },
    expect: {
      ok: true,
      result: "www.example.com",
      command: "string tolower WWW.Example.COM",
      spans: [{ from: 0, to: 14, role: "result" }],
      readings: [],
      notes: [],
    },
  },
  // An index written 010 is read as octal: character 8.
  {
    id: "index-octal",
    input: { op: "index", args: ["abcdefghij", "010"] },
    expect: {
      ok: true,
      result: "i",
      command: "string index abcdefghij 010",
      spans: [{ from: 8, to: 8, role: "result" }],
      readings: [{ label: "charIndex", text: "010", value: 8, form: "int", base: 8 }],
      notes: ["octal-index"],
    },
  },
  // end-1 counts back from the last character.
  {
    id: "range-end",
    input: { op: "range", args: ["abcdef", "1", "end-1"] },
    expect: {
      ok: true,
      result: "bcde",
      command: "string range abcdef 1 end-1",
      spans: [{ from: 1, to: 4, role: "result" }],
      readings: [
        { label: "first", text: "1", value: 1, form: "int", base: 10, clamped: 1 },
        { label: "last", text: "end-1", value: 4, form: "end", offset: 1, clamped: 4 },
      ],
      notes: [],
    },
  },
  // trim removes white space from both ends.
  {
    id: "trim-path",
    input: { op: "trim", args: ["  /path/  "] },
    expect: {
      ok: true,
      result: "/path/",
      command: "string trim {  /path/  }",
      spans: [{ from: 0, to: 1, role: "trimmed" }, { from: 8, to: 9, role: "trimmed" }],
      readings: [],
      notes: [],
    },
  },
  // compare orders by character code: b (98) comes after C (67).
  {
    id: "compare-case",
    input: { op: "compare", args: ["bench", "Chair"] },
    expect: {
      ok: true,
      result: "1",
      command: "string compare bench Chair",
      spans: [{ from: 0, to: 0, role: "differ" }],
      readings: [],
      notes: ["compare-codes"],
    },
  },
  // equal -nocase ignores case.
  {
    id: "equal-nocase",
    input: { op: "equal", args: ["Bench", "bench"], nocase: true },
    expect: {
      ok: true,
      result: "1",
      command: "string equal -nocase Bench bench",
      spans: [],
      readings: [],
      notes: ["compare-codes"],
    },
  },
  // last finds the final occurrence.
  {
    id: "last-slash",
    input: { op: "last", args: ["/", "/a/b/c.html"] },
    expect: {
      ok: true,
      result: "4",
      command: "string last / /a/b/c.html",
      spans: [{ from: 0, to: 10, role: "window" }, { from: 4, to: 4, role: "match" }],
      readings: [],
      notes: [],
    },
  },
  // replace swaps the characters from first to last.
  {
    id: "replace-segment",
    input: { op: "replace", args: ["/old/path", "1", "3", "new"] },
    expect: {
      ok: true,
      result: "/new/path",
      command: "string replace /old/path 1 3 new",
      spans: [{ from: 1, to: 3, role: "replaced" }],
      readings: [
        { label: "first", text: "1", value: 1, form: "int", base: 10 },
        { label: "last", text: "3", value: 3, form: "int", base: 10 },
      ],
      notes: [],
    },
  },
  // repeat joins copies.
  {
    id: "repeat",
    input: { op: "repeat", args: ["ab", "3"] },
    expect: { ok: true, result: "ababab", command: "string repeat ab 3", spans: [], readings: [], notes: [] },
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
