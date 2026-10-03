// ============================================================================
// src/lib/tools/f5-irules-string-extract/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the findstr / substr / getfield explainer
// (set "f5-irules-string-extract-golden-2026-10-03").
//
// The first vectors are F5's own published examples (the tmsh-reference
// pages for findstr and substr), so the tool is pinned to the documented
// results; the rest cover the cases F5 does not document, each of which the
// tool flags. The plain-Tcl equivalents were run in Tcl 8.4.6.
//
// Expected values were captured from compute.run() on 2026-10-03.
// The plain-Tcl part of every vector (8 checks) was also run in a real
// Tcl 8.4.6 interpreter, built from the tcltk/tcl tag core-8-4-6, on 2026-10-03:
// 8 of 8 agree. Nothing here is pinned from the engine alone where
// the reference can answer.
// ============================================================================

import { run, type StringExtractInput, type StringExtractResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-string-extract-golden-2026-10-03";

/** The fields a vector pins. */
export type StringExtractPinned = { ok: boolean; result?: string; error?: string; command: string; segments: StringExtractResult["segments"]; notes: string[]; equivalent?: StringExtractResult["equivalent"] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface StringExtractVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: StringExtractInput;
  // The pinned fields of the result.
  expect: StringExtractPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: StringExtractResult): StringExtractPinned {
  // Notes as code(param=value,...) strings.
  const notes = r.notes.map((n) => n.code + (n.params ? "(" + Object.entries(n.params).map(([k, v]) => k + "=" + v).join(",") + ")" : ""));
  // The pinned fields.
  return { ok: r.ok, result: r.result, error: r.error, command: r.command, segments: r.segments, notes, equivalent: r.equivalent };
}

/** The vectors. */
export const VECTORS: StringExtractVector[] = [
  // F5's findstr example: skip the @, stop before >.
  {
    id: "findstr-f5-sip",
    input: { command: "findstr", string: "<sip:+12065551234@sip.example.com>", args: ["@", "1", ">"] },
    expect: {
      ok: true,
      result: "sip.example.com",
      command: "findstr <sip:+12065551234@sip.example.com> @ 1 >",
      segments: [
        { from: 17, to: 17, role: "match" },
        { from: 17, to: 17, role: "skipped" },
        { from: 18, to: 32, role: "result" },
        { from: 33, to: 33, role: "terminator" },
      ],
      notes: ["findstr-found(at=17,skip=1)", "cut-terminator(terminator=>,at=33)"],
    },
  },
  // F5's findstr example: skip the three a's, stop before xyz.
  {
    id: "findstr-f5-aaa",
    input: { command: "findstr", string: "aaa123456xxyz", args: ["aaa", "3", "xyz"] },
    expect: {
      ok: true,
      result: "123456x",
      command: "findstr aaa123456xxyz aaa 3 xyz",
      segments: [
        { from: 0, to: 2, role: "match" },
        { from: 0, to: 2, role: "skipped" },
        { from: 3, to: 9, role: "result" },
        { from: 10, to: 12, role: "terminator" },
      ],
      notes: ["findstr-found(at=0,skip=3)", "cut-terminator(terminator=xyz,at=10)"],
    },
  },
  // A query parameter: skip "user=" (5 characters), stop at &.
  {
    id: "findstr-query",
    input: { command: "findstr", string: "/login.php?user=abcdefg&lang=en", args: ["user=", "5", "&"] },
    expect: {
      ok: true,
      result: "abcdefg",
      command: "findstr /login.php?user=abcdefg&lang=en user= 5 &",
      segments: [
        { from: 11, to: 15, role: "match" },
        { from: 11, to: 15, role: "skipped" },
        { from: 16, to: 22, role: "result" },
        { from: 23, to: 23, role: "terminator" },
      ],
      notes: ["findstr-found(at=11,skip=5)", "cut-terminator(terminator=&,at=23)"],
    },
  },
  // Two arguments: from the match to the end, as F5's string range equivalent gives.
  {
    id: "findstr-two-args",
    input: { command: "findstr", string: "/login.php?user=abcdefg", args: ["user="] },
    expect: {
      ok: true,
      result: "user=abcdefg",
      command: "findstr /login.php?user=abcdefg user=",
      segments: [{ from: 11, to: 15, role: "match" }, { from: 11, to: 22, role: "result" }],
      notes: ["findstr-found(at=11,skip=0)"],
      equivalent: {
        script: "string range /login.php?user=abcdefg [string first user= /login.php?user=abcdefg] end",
        result: "user=abcdefg",
        agrees: true,
      },
    },
  },
  // Undocumented: the search string is absent. F5's stated equivalent returns the whole string.
  {
    id: "findstr-not-found",
    input: { command: "findstr", string: "/login.php", args: ["user="] },
    expect: {
      ok: true,
      result: "",
      command: "findstr /login.php user=",
      segments: [],
      notes: ["undocumented-findstr-not-found(search=user=)"],
      equivalent: {
        script: "string range /login.php [string first user= /login.php] end",
        result: "/login.php",
        agrees: false,
      },
    },
  },
  // F5's substr example: terminator absent, so to the end.
  {
    id: "substr-f5-x",
    input: { command: "substr", string: "abcdefghijklm", args: ["2", "x"] },
    expect: {
      ok: true,
      result: "cdefghijklm",
      command: "substr abcdefghijklm 2 x",
      segments: [{ from: 0, to: 1, role: "skipped" }, { from: 2, to: 12, role: "result" }],
      notes: ["cut-terminator-absent(terminator=x)"],
      equivalent: {
        script: "set s abcdefghijklm; set stop [string first x $s 2]; string range $s 2 [expr {$stop < 0 ? \"end\" : $stop - 1}]",
        result: "cdefghijklm",
        agrees: true,
      },
    },
  },
  // F5's substr example: up to gh.
  {
    id: "substr-f5-gh",
    input: { command: "substr", string: "abcdefghijklm", args: ["2", "gh"] },
    expect: {
      ok: true,
      result: "cdef",
      command: "substr abcdefghijklm 2 gh",
      segments: [
        { from: 0, to: 1, role: "skipped" },
        { from: 2, to: 5, role: "result" },
        { from: 6, to: 7, role: "terminator" },
      ],
      notes: ["cut-terminator(terminator=gh,at=6)"],
      equivalent: {
        script: "set s abcdefghijklm; set stop [string first gh $s 2]; string range $s 2 [expr {$stop < 0 ? \"end\" : $stop - 1}]",
        result: "cdef",
        agrees: true,
      },
    },
  },
  // F5's substr example: four characters.
  {
    id: "substr-f5-4",
    input: { command: "substr", string: "abcdefghijklm", args: ["2", "4"] },
    expect: {
      ok: true,
      result: "cdef",
      command: "substr abcdefghijklm 2 4",
      segments: [{ from: 0, to: 1, role: "skipped" }, { from: 2, to: 5, role: "result" }],
      notes: ["cut-count(count=4)"],
      equivalent: { script: "string range abcdefghijklm 2 5", result: "cdef", agrees: true },
    },
  },
  // F5's substr example: a count past the end stops at the end.
  {
    id: "substr-f5-20",
    input: { command: "substr", string: "abcdefghijklm", args: ["2", "20"] },
    expect: {
      ok: true,
      result: "cdefghijklm",
      command: "substr abcdefghijklm 2 20",
      segments: [{ from: 0, to: 1, role: "skipped" }, { from: 2, to: 12, role: "result" }],
      notes: ["cut-count(count=20)"],
      equivalent: { script: "string range abcdefghijklm 2 21", result: "cdefghijklm", agrees: true },
    },
  },
  // F5's substr example with 0 returns the rest, contradicting its own count rule; flagged.
  {
    id: "substr-f5-0",
    input: { command: "substr", string: "abcdefghijklm", args: ["2", "0"] },
    expect: {
      ok: true,
      result: "cdefghijklm",
      command: "substr abcdefghijklm 2 0",
      segments: [{ from: 0, to: 1, role: "skipped" }, { from: 2, to: 12, role: "result" }],
      notes: ["undocumented-count-zero(cmd=substr)"],
    },
  },
  // Field numbers start at 1.
  {
    id: "getfield-colon",
    input: { command: "getfield", string: "a:b:c", args: [":", "2"] },
    expect: {
      ok: true,
      result: "b",
      command: "getfield a:b:c : 2",
      segments: [
        { from: 1, to: 1, role: "separator" },
        { from: 2, to: 2, role: "field" },
        { from: 3, to: 3, role: "separator" },
      ],
      notes: ["getfield(count=3,field=2)"],
      equivalent: { script: "lindex [split a:b:c :] 1", result: "b", agrees: true },
    },
  },
  // The query string is field 2 when splitting on ?.
  {
    id: "getfield-query",
    input: { command: "getfield", string: "/login.php?user=abc", args: ["?", "2"] },
    expect: {
      ok: true,
      result: "user=abc",
      command: "getfield /login.php?user=abc ? 2",
      segments: [{ from: 10, to: 10, role: "separator" }, { from: 11, to: 18, role: "field" }],
      notes: ["getfield(count=2,field=2)"],
      equivalent: { script: "lindex [split /login.php?user=abc ?] 1", result: "user=abc", agrees: true },
    },
  },
  // A multi-character separator; plain split would treat each character as a separator.
  {
    id: "getfield-multichar",
    input: { command: "getfield", string: "one--two--three", args: ["--", "3"] },
    expect: {
      ok: true,
      result: "three",
      command: "getfield one--two--three -- 3",
      segments: [
        { from: 3, to: 4, role: "separator" },
        { from: 8, to: 9, role: "separator" },
        { from: 10, to: 14, role: "field" },
      ],
      notes: ["getfield(count=3,field=3)", "split-chars(sep=--)"],
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
