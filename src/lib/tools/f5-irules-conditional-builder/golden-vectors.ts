// ============================================================================
// src/lib/tools/f5-irules-conditional-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules if / switch / class builder
// (set "f5-irules-conditional-builder-golden-2026-10-03").
//
// Each vector is one decision. The pinned fields are the generated code of
// every form, the pool each form chose for the test value, whether they
// agree, the first rule in order, the shadowed rules and the note codes.
//
// Expected values were captured from compute.run() on 2026-10-03.
// These vectors pin generated text and findings, which have no Tcl 8.4.6
// reference answer; the Tcl parts they rely on (the parser, the interpreter)
// are covered by the engine's own differential tests.
// ============================================================================

import { run, type ConditionalBuilderInput, type ConditionalBuilderResult } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-conditional-builder-golden-2026-10-03";

/** The fields a vector pins. */
export type ConditionalBuilderPinned = { forms: { kind: string; pool: string | null; error?: string; unavailable?: string; code: string; tmsh?: string }[]; agree: boolean; firstRule: number; shadowed: ConditionalBuilderResult["shadowed"]; notes: string[] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface ConditionalBuilderVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: ConditionalBuilderInput;
  // The pinned fields of the result.
  expect: ConditionalBuilderPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: ConditionalBuilderResult): ConditionalBuilderPinned {
  // Each form with its code.
  const forms = r.forms.map((f) => ({ kind: f.kind, pool: f.pool, error: f.error, unavailable: f.unavailable, code: f.code, tmsh: f.tmsh }));
  // The pinned fields.
  return { forms, agree: r.agree, firstRule: r.firstRule, shadowed: r.shadowed, notes: r.notes.map((n) => n.code) };
}

/** The vectors. */
export const VECTORS: ConditionalBuilderVector[] = [
  // if and switch take the first match (/api); class match starts_with takes the longest (/api/v2).
  {
    id: "longest-vs-first",
    input: {
      subject: "path",
      lowercase: true,
      rules: [
        { op: "starts_with", value: "/api", pool: "api_pool" },
        { op: "starts_with", value: "/api/v2", pool: "api_v2_pool" },
        { op: "equals", value: "/login", pool: "login_pool" },
      ],
      defaultPool: "web_pool",
      testValue: "/api/v2/users",
      dataGroup: "path_pools",
    },
    expect: {
      forms: [
        {
          kind: "if",
          pool: "api_pool",
          code: "when HTTP_REQUEST priority 500 {\n    set value [string tolower [HTTP::path]]\n    if { ${value} starts_with \"/api\" } {\n        pool api_pool\n    } elseif { ${value} starts_with \"/api/v2\" } {\n        pool api_v2_pool\n    } elseif { ${value} eq \"/login\" } {\n        pool login_pool\n    } else {\n        pool web_pool\n    }\n}",
        },
        {
          kind: "switch",
          pool: "api_pool",
          code: "when HTTP_REQUEST priority 500 {\n    switch -glob -- [string tolower [HTTP::path]] {\n        /api* {\n            pool api_pool\n        }\n        /api/v2* {\n            pool api_v2_pool\n        }\n        /login {\n            pool login_pool\n        }\n        default {\n            pool web_pool\n        }\n    }\n}",
        },
        {
          kind: "class",
          pool: "api_v2_pool",
          code: "when HTTP_REQUEST priority 500 {\n    set value [string tolower [HTTP::path]]\n    set target [class match -value -- ${value} starts_with path_pools_starts_with]\n    if { ${target} eq \"\" } {\n        set target [class match -value -- ${value} equals path_pools_equals]\n    }\n    if { ${target} ne \"\" } {\n        pool ${target}\n    } else {\n        pool web_pool\n    }\n}",
          tmsh: "ltm data-group internal path_pools_starts_with {\n    records {\n        /api {\n            data api_pool\n        }\n        /api/v2 {\n            data api_v2_pool\n        }\n    }\n    type string\n}\nltm data-group internal path_pools_equals {\n    records {\n        /login {\n            data login_pool\n        }\n    }\n    type string\n}",
        },
      ],
      agree: false,
      firstRule: 0,
      shadowed: [{ rule: 1, by: 0 }],
      notes: ["class-multiple-groups", "class-longest-vs-first"],
    },
  },
  // A glob rule has no class operator, so the class form is not offered.
  {
    id: "host-glob",
    input: {
      subject: "host",
      lowercase: true,
      rules: [
        { op: "equals", value: "www.example.com", pool: "www_pool" },
        { op: "glob", value: "*.example.com", pool: "sub_pool" },
      ],
      defaultPool: "web_pool",
      testValue: "shop.example.com",
      dataGroup: "host_pools",
    },
    expect: {
      forms: [
        {
          kind: "if",
          pool: "sub_pool",
          code: "when HTTP_REQUEST priority 500 {\n    set value [string tolower [HTTP::host]]\n    if { ${value} eq \"www.example.com\" } {\n        pool www_pool\n    } elseif { [string match *.example.com ${value}] } {\n        pool sub_pool\n    } else {\n        pool web_pool\n    }\n}",
        },
        {
          kind: "switch",
          pool: "sub_pool",
          code: "when HTTP_REQUEST priority 500 {\n    switch -glob -- [string tolower [HTTP::host]] {\n        www.example.com {\n            pool www_pool\n        }\n        *.example.com {\n            pool sub_pool\n        }\n        default {\n            pool web_pool\n        }\n    }\n}",
        },
        { kind: "class", pool: null, unavailable: "glob", code: "" },
      ],
      agree: true,
      firstRule: 1,
      shadowed: [],
      notes: [],
    },
  },
  // A header compared without lower-casing: the comparison is case-sensitive.
  {
    id: "header-contains",
    input: {
      subject: "header",
      headerName: "User-Agent",
      lowercase: false,
      rules: [{ op: "contains", value: "curl", pool: "tools_pool" }],
      defaultPool: "web_pool",
      testValue: "curl/8.0",
      dataGroup: "ua_pools",
    },
    expect: {
      forms: [
        {
          kind: "if",
          pool: "tools_pool",
          code: "when HTTP_REQUEST priority 500 {\n    set value [HTTP::header value User-Agent]\n    if { ${value} contains \"curl\" } {\n        pool tools_pool\n    } else {\n        pool web_pool\n    }\n}",
        },
        {
          kind: "switch",
          pool: "tools_pool",
          code: "when HTTP_REQUEST priority 500 {\n    switch -glob -- [HTTP::header value User-Agent] {\n        *curl* {\n            pool tools_pool\n        }\n        default {\n            pool web_pool\n        }\n    }\n}",
        },
        {
          kind: "class",
          pool: "tools_pool",
          code: "when HTTP_REQUEST priority 500 {\n    set value [HTTP::header value User-Agent]\n    set target [class match -value -- ${value} contains ua_pools]\n    if { ${target} ne \"\" } {\n        pool ${target}\n    } else {\n        pool web_pool\n    }\n}",
          tmsh: "ltm data-group internal ua_pools {\n    records {\n        curl {\n            data tools_pool\n        }\n    }\n    type string\n}",
        },
      ],
      agree: true,
      firstRule: 0,
      shadowed: [],
      notes: ["case-sensitive"],
    },
  },
  // A lone brace in a rule value is written as \{ in the if form: Tcl counts braces inside a braced body, even between double quotes.
  {
    id: "lone-brace",
    input: {
      subject: "path",
      lowercase: false,
      rules: [{ op: "contains", value: "{", pool: "template_pool" }],
      defaultPool: "web_pool",
      testValue: "/users/{id}",
      dataGroup: "brace_pools",
    },
    expect: {
      forms: [
        {
          kind: "if",
          pool: "template_pool",
          code: "when HTTP_REQUEST priority 500 {\n    set value [HTTP::path]\n    if { ${value} contains \"\\{\" } {\n        pool template_pool\n    } else {\n        pool web_pool\n    }\n}",
        },
        {
          kind: "switch",
          pool: "template_pool",
          code: "when HTTP_REQUEST priority 500 {\n    switch -glob -- [HTTP::path] {\n        *\\{* {\n            pool template_pool\n        }\n        default {\n            pool web_pool\n        }\n    }\n}",
        },
        {
          kind: "class",
          pool: "template_pool",
          code: "when HTTP_REQUEST priority 500 {\n    set value [HTTP::path]\n    set target [class match -value -- ${value} contains brace_pools]\n    if { ${target} ne \"\" } {\n        pool ${target}\n    } else {\n        pool web_pool\n    }\n}",
          tmsh: "ltm data-group internal brace_pools {\n    records {\n        \"{\" {\n            data template_pool\n        }\n    }\n    type string\n}",
        },
      ],
      agree: true,
      firstRule: 0,
      shadowed: [],
      notes: ["unmatched-brace", "tmsh-quoted"],
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
