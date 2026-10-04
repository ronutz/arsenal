// ============================================================================
// src/lib/tools/f5-bigip-index-base-finder/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BIG-IP zero-or-one finder
// (set "f5-bigip-index-base-finder-golden-2026-10-03").
//
// Two kinds of vector. A look-up pins the number of entries, the count per
// base and the ids that match, in catalogue order. A translation pins the
// answer, every row (command, base, kind, result, agreement, engine notes)
// and the notes about the question.
//
// Expected values were captured from compute.run() on 2026-10-03.
// The plain-Tcl part of every vector (21 checks) was also run in a real
// Tcl 8.4.6 interpreter, built from the tcltk/tcl tag core-8-4-6, on 2026-10-03:
// 21 of 21 agree. Nothing here is pinned from the engine alone where
// the reference can answer.
// ============================================================================

import { run, type IndexBaseInput, type IndexBaseResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-bigip-index-base-finder-golden-2026-10-03";

/** The fields a vector pins. */
export type IndexBaseFinderPinned = Record<string, unknown>;

/** One vector: a name, an input, and the pinned fields of its result. */
export interface IndexBaseFinderVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: IndexBaseInput;
  // The pinned fields of the result.
  expect: IndexBaseFinderPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: IndexBaseResult): IndexBaseFinderPinned {
  // A look-up: the totals and the matching ids, in catalogue order.
  if (r.mode === "lookup") return { mode: r.mode, total: r.total, counts: r.counts, ids: r.entries.map((e) => e.id) };
  // A translation: the answer, every row and the notes.
  return { mode: r.mode, answer: r.answer, rows: r.rows.map((x) => ({ form: x.form, base: x.base, kind: x.kind, code: x.code, result: x.result, error: x.error, agrees: x.agrees, notes: x.notes })), notes: r.notes };
}

/** The vectors. */
export const VECTORS: IndexBaseFinderVector[] = [
  // Every entry, with the count per base.
  {
    id: "lookup-all",
    input: { mode: "lookup" },
    expect: {
      mode: "lookup",
      total: 76,
      counts: { zero: 43, one: 21, right: 2, mixed: 1, value: 7, count: 2 },
      ids: [
        "tcl-string-index",
        "tcl-string-range",
        "tcl-string-first",
        "tcl-string-compare",
        "tcl-truth",
        "tcl-string-other",
        "tcl-end-keyword",
        "tcl-lindex",
        "tcl-lrange",
        "tcl-lsearch",
        "tcl-list-edit",
        "tcl-lsort-index",
        "tcl-split",
        "tcl-regexp-indices",
        "tcl-regexp-groups",
        "tcl-positional",
        "tcl-scan-count",
        "tcl-clock-zero",
        "tcl-clock-one",
        "tcl-binary-at",
        "tcl-levels",
        "tcl-rand",
        "f5-getfield",
        "f5-substr",
        "f5-findstr",
        "f5-domain",
        "f5-uri-path",
        "f5-request-num",
        "f5-http-header",
        "f5-payload",
        "f5-tcp-offset",
        "f5-ssl-cert",
        "f5-ssl-extensions",
        "f5-class-index",
        "f5-matchclass",
        "f5-tmm-cmp",
        "f5-sip-index",
        "f5-diameter-avp",
        "f5-radius-avp",
        "f5-message-field",
        "f5-name-response",
        "f5-json-array",
        "f5-dns-lists",
        "f5-whereis",
        "f5-member-lists",
        "f5-table-incr",
        "f5-stats-fields",
        "f5-priority",
        "f5-mr-clone-id",
        "f5-mr-instance",
        "f5-ssl-verify-result",
        "f5-lb-server",
        "cfg-route-domain",
        "cfg-priority-group",
        "cfg-ratio",
        "cfg-zero-limits",
        "cfg-port-zero",
        "cfg-policy-numbers",
        "cfg-policy-index",
        "cfg-policy-precedence",
        "cfg-gtm-order",
        "cfg-vlan-tag",
        "cfg-traffic-group",
        "cfg-apm-acl-order",
        "plat-interfaces",
        "plat-f5os-ports",
        "plat-slots",
        "plat-volumes",
        "plat-tmm-ids",
        "api-rest-skip",
        "api-rest-page-index",
        "api-soap-sysloglevel",
        "log-severity",
        "log-facility",
        "cap-tcpdump-00",
        "cap-ethtrailer",
      ],
    },
  },
  // Only the places that count from 1.
  {
    id: "lookup-one",
    input: { mode: "lookup", base: "one" },
    expect: {
      mode: "lookup",
      total: 76,
      counts: { zero: 0, one: 21, right: 0, mixed: 0, value: 0, count: 0 },
      ids: [
        "tcl-regexp-groups",
        "tcl-positional",
        "tcl-clock-one",
        "f5-getfield",
        "f5-uri-path",
        "f5-request-num",
        "f5-matchclass",
        "f5-table-incr",
        "f5-stats-fields",
        "f5-mr-clone-id",
        "cfg-ratio",
        "cfg-policy-index",
        "cfg-policy-precedence",
        "cfg-vlan-tag",
        "cfg-traffic-group",
        "plat-interfaces",
        "plat-f5os-ports",
        "plat-slots",
        "plat-volumes",
        "api-rest-page-index",
        "api-soap-sysloglevel",
      ],
    },
  },
  // Searching for path finds the ways a path is cut and counted.
  {
    id: "lookup-path",
    input: { mode: "lookup", query: "path" },
    expect: {
      mode: "lookup",
      total: 76,
      counts: { zero: 1, one: 3, right: 0, mixed: 0, value: 0, count: 0 },
      ids: ["tcl-split", "f5-getfield", "f5-uri-path", "cfg-policy-index"],
    },
  },
  // Configuration fields where 0 is a value with a meaning, not a position.
  {
    id: "lookup-config-value",
    input: { mode: "lookup", area: "config", base: "value" },
    expect: {
      mode: "lookup",
      total: 76,
      counts: { zero: 0, one: 0, right: 0, mixed: 0, value: 2, count: 0 },
      ids: ["cfg-zero-limits", "cfg-port-zero"],
    },
  },
  // The 2nd path segment: index 2 for split (the leading slash makes an empty element 0), field 3 for getfield.
  {
    id: "segment-2",
    input: { mode: "translate", question: "segment", value: "/api/v2/users", n: 2 },
    expect: {
      mode: "translate",
      answer: "v2",
      rows: [
        {
          form: "split-lindex",
          base: "zero",
          kind: "right",
          code: "lindex [split $v /] 2",
          result: "v2",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "getfield",
          base: "one",
          kind: "right",
          code: "getfield $v / 3",
          result: "v2",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "split-lindex-forgot",
          base: "zero",
          kind: "trap",
          code: "lindex [split $v /] 1",
          result: "api",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [{ code: "leading-slash" }, { code: "getfield-leading-assumed" }],
    },
  },
  // The 3rd character: index 2 for string index, string range and substr.
  {
    id: "char-3",
    input: { mode: "translate", question: "char", value: "abcdef", n: 3 },
    expect: {
      mode: "translate",
      answer: "c",
      rows: [
        {
          form: "string-index",
          base: "zero",
          kind: "right",
          code: "string index $v 2",
          result: "c",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "string-range",
          base: "zero",
          kind: "right",
          code: "string range $v 2 2",
          result: "c",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "substr",
          base: "zero",
          kind: "right",
          code: "substr $v 2 1",
          result: "c",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "string-index-n",
          base: "zero",
          kind: "trap",
          code: "string index $v 3",
          result: "d",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [],
    },
  },
  // The 3rd octet: field 3 for getfield, index 2 after split.
  {
    id: "field-octet-3",
    input: { mode: "translate", question: "field", value: "10.20.30.40", n: 3, separator: "." },
    expect: {
      mode: "translate",
      answer: "30",
      rows: [
        {
          form: "getfield",
          base: "one",
          kind: "right",
          code: "getfield $v . 3",
          result: "30",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "split-lindex",
          base: "zero",
          kind: "right",
          code: "lindex [split $v .] 2",
          result: "30",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "getfield-n-1",
          base: "one",
          kind: "trap",
          code: "getfield $v . 2",
          result: "20",
          error: false,
          agrees: false,
          notes: [],
        },
        {
          form: "split-lindex-n",
          base: "zero",
          kind: "trap",
          code: "lindex [split $v .] 3",
          result: "40",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [],
    },
  },
  // A two-character separator: getfield splits on the whole string, split on each character.
  {
    id: "field-multichar",
    input: { mode: "translate", question: "field", value: "one--two--three", n: 3, separator: "--" },
    expect: {
      mode: "translate",
      answer: "three",
      rows: [
        {
          form: "getfield",
          base: "one",
          kind: "right",
          code: "getfield $v -- 3",
          result: "three",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "split-lindex",
          base: "zero",
          kind: "right",
          code: "lindex [split $v --] 2",
          result: "two",
          error: false,
          agrees: false,
          notes: [],
        },
        {
          form: "getfield-n-1",
          base: "one",
          kind: "trap",
          code: "getfield $v -- 2",
          result: "two",
          error: false,
          agrees: false,
          notes: [],
        },
        {
          form: "split-lindex-n",
          base: "zero",
          kind: "trap",
          code: "lindex [split $v --] 3",
          result: "",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [{ code: "split-multichar", params: { sep: "--" } }, { code: "right-rows-disagree" }],
    },
  },
  // F5's domain example: the last 2 labels, counted from the right.
  {
    id: "label-2",
    input: { mode: "translate", question: "label", value: "www.sub.my.domain.com", n: 2 },
    expect: {
      mode: "translate",
      answer: "domain.com",
      rows: [
        {
          form: "domain",
          base: "right",
          kind: "right",
          code: "domain $v 2",
          result: "domain.com",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "lrange-end",
          base: "right",
          kind: "right",
          code: "join [lrange [split $v .] end-1 end] .",
          result: "domain.com",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "lindex-end",
          base: "right",
          kind: "other",
          code: "lindex [split $v .] end-1",
          result: "domain",
          error: false,
          agrees: false,
          notes: [],
        },
        {
          form: "lrange-end-n",
          base: "right",
          kind: "trap",
          code: "join [lrange [split $v .] end-2 end] .",
          result: "my.domain.com",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [],
    },
  },
  // The 2nd element of a list of address and port pairs (active_members -list shape).
  {
    id: "element-2",
    input: { mode: "translate", question: "element", value: "{192.168.1.1 80} {192.168.1.2 80}", n: 2 },
    expect: {
      mode: "translate",
      answer: "192.168.1.2 80",
      rows: [
        {
          form: "lindex",
          base: "zero",
          kind: "right",
          code: "lindex $v 1",
          result: "192.168.1.2 80",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "lrange",
          base: "zero",
          kind: "other",
          code: "lrange $v 1 1",
          result: "{192.168.1.2 80}",
          error: false,
          agrees: false,
          notes: [],
        },
        {
          form: "lindex-n",
          base: "zero",
          kind: "trap",
          code: "lindex $v 2",
          result: "",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [{ code: "lrange-list" }],
    },
  },
  // Found at index 0, which an if reads as false.
  {
    id: "search-at-zero",
    input: { mode: "translate", question: "search", value: "xyz", n: 1, needle: "x" },
    expect: {
      mode: "translate",
      answer: "0",
      rows: [
        {
          form: "string-first",
          base: "zero",
          kind: "right",
          code: "string first x $v",
          result: "0",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "first-test",
          base: "value",
          kind: "right",
          code: "expr {[string first x $v] >= 0}",
          result: "1",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "first-if",
          base: "value",
          kind: "trap",
          code: "if {[string first x $v]} { set r yes } else { set r no }",
          result: "no",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [{ code: "found-at-zero", params: { index: "0", position: 1 } }],
    },
  },
  // Not found: -1, which an if reads as true.
  {
    id: "search-missing",
    input: { mode: "translate", question: "search", value: "xyz", n: 1, needle: "q" },
    expect: {
      mode: "translate",
      answer: "-1",
      rows: [
        {
          form: "string-first",
          base: "zero",
          kind: "right",
          code: "string first q $v",
          result: "-1",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "first-test",
          base: "value",
          kind: "right",
          code: "expr {[string first q $v] >= 0}",
          result: "0",
          error: false,
          agrees: true,
          notes: [],
        },
        {
          form: "first-if",
          base: "value",
          kind: "trap",
          code: "if {[string first q $v]} { set r yes } else { set r no }",
          result: "yes",
          error: false,
          agrees: false,
          notes: [],
        },
      ],
      notes: [{ code: "not-found", params: { index: "-1", position: 0 } }],
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
