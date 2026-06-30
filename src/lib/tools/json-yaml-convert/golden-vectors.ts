// ============================================================================
// src/lib/tools/json-yaml-convert/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden + reject vectors for the JSON <-> YAML converter.
//
// YAML -> JSON output is fully deterministic (JSON.stringify), so those vectors
// assert the exact JSON text. JSON -> YAML output formatting comes from js-yaml,
// so those vectors assert structural substrings AND a round trip back to the
// original value, which is robust without pinning exact whitespace.
// verifyVectors() runs the set.
// ============================================================================

import { convert, type ConvertOptions, type IndentWidth } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "json-yaml-convert-golden-v1";

const j2y = (indent: IndentWidth = 2): ConvertOptions => ({ direction: "json-to-yaml", indent });
const y2j = (indent: IndentWidth = 2): ConvertOptions => ({ direction: "yaml-to-json", indent });

export interface ConvGoldenVector {
  id: string;
  description: string;
  input: string;
  options: ConvertOptions;
  expectOutput?: string; // exact
  expectContains?: string[]; // all must be substrings of output
  expectRoundTripValue?: unknown; // convert output back and deep-equal this
  expectNotes?: string[]; // exact set (order-insensitive)
}

export interface ConvRejectVector {
  id: string;
  description: string;
  input: string;
  options: ConvertOptions;
  expectMessageIncludes: string;
  expectLine?: number;
  expectColumn?: number;
  expectPointer?: string;
}

export const CONV_GOLDEN_VECTORS: ConvGoldenVector[] = [
  {
    id: "j2y-object",
    description: "JSON object to block YAML",
    input: '{"name":"Ada","count":3,"active":true}',
    options: j2y(),
    expectContains: ["name: Ada", "count: 3", "active: true"],
    expectRoundTripValue: { name: "Ada", count: 3, active: true },
  },
  {
    id: "j2y-array",
    description: "JSON array to YAML sequence",
    input: '[1,"two",true,null]',
    options: j2y(),
    expectContains: ["- 1", "- two", "- true", "- null"],
    expectRoundTripValue: [1, "two", true, null],
  },
  {
    id: "j2y-norway",
    description: "Strings that YAML would coerce stay quoted",
    input: '{"country":"NO","ver":"1.0","flag":"yes"}',
    options: j2y(),
    expectContains: ['country: "NO"', 'ver: "1.0"', 'flag: "yes"'],
    expectRoundTripValue: { country: "NO", ver: "1.0", flag: "yes" },
  },
  {
    id: "j2y-nested",
    description: "Nested object and array",
    input: '{"a":{"b":{"c":[1,2]}}}',
    options: j2y(),
    expectContains: ["a:", "b:", "c:", "- 1", "- 2"],
    expectRoundTripValue: { a: { b: { c: [1, 2] } } },
  },
  {
    id: "j2y-indent4",
    description: "Four-space indentation",
    input: '{"a":{"b":1}}',
    options: j2y(4),
    expectContains: ["a:", "    b: 1"],
    expectRoundTripValue: { a: { b: 1 } },
  },
  {
    id: "j2y-large-number-note",
    description: "A large integer raises the precision note",
    input: '{"id":12345678901234567890}',
    options: j2y(),
    expectNotes: ["LARGE_NUMBER"],
  },
  {
    id: "y2j-basic",
    description: "Simple YAML mapping to JSON",
    input: "name: api\nport: 80",
    options: y2j(),
    expectOutput: '{\n  "name": "api",\n  "port": 80\n}',
  },
  {
    id: "y2j-anchors",
    description: "Anchors and aliases are expanded inline",
    input: "def: &d\n  r: 3\nuse:\n  v: *d",
    options: y2j(),
    expectOutput: '{\n  "def": {\n    "r": 3\n  },\n  "use": {\n    "v": {\n      "r": 3\n    }\n  }\n}',
    expectNotes: ["ANCHORS_EXPANDED"],
  },
  {
    id: "y2j-flow",
    description: "Flow-style sequences and maps",
    input: "a: [1, 2, 3]\nb: {x: 1}",
    options: y2j(),
    expectOutput: '{\n  "a": [\n    1,\n    2,\n    3\n  ],\n  "b": {\n    "x": 1\n  }\n}',
  },
  {
    id: "y2j-multiline",
    description: "Literal block scalar becomes a string with newlines",
    input: "text: |\n  one\n  two",
    options: y2j(),
    expectOutput: '{\n  "text": "one\\ntwo\\n"\n}',
  },
  {
    id: "y2j-comment",
    description: "Comments are dropped (note raised)",
    input: "# a comment\nk: v",
    options: y2j(),
    expectOutput: '{\n  "k": "v"\n}',
    expectNotes: ["COMMENTS_DROPPED"],
  },
  {
    id: "roundtrip",
    description: "JSON survives a round trip through YAML",
    input: '{"z":1,"a":[true,null,"NO"],"n":{"x":3.5}}',
    options: j2y(),
    expectRoundTripValue: { z: 1, a: [true, null, "NO"], n: { x: 3.5 } },
  },
];

export const CONV_REJECT_VECTORS: ConvRejectVector[] = [
  {
    id: "j2y-bad-json",
    description: "Invalid JSON reports precise location",
    input: '{"a":1,}',
    options: j2y(),
    expectMessageIncludes: "Trailing comma",
    expectLine: 1,
    expectColumn: 8,
    expectPointer: "",
  },
  {
    id: "y2j-bad-yaml",
    description: "Invalid YAML reports a line",
    input: "a:\n  b: [1, 2\nc: 3",
    options: y2j(),
    expectMessageIncludes: "Invalid YAML",
    expectLine: 3,
  },
  {
    id: "y2j-empty",
    description: "Empty YAML input",
    input: "   ",
    options: y2j(),
    expectMessageIncludes: "Enter YAML",
  },
  {
    id: "j2y-empty",
    description: "Empty JSON input",
    input: "",
    options: j2y(),
    expectMessageIncludes: "Empty input",
  },
];

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of CONV_GOLDEN_VECTORS) {
    const r = convert(v.input, v.options);
    const errs: string[] = [];
    if (!r.ok) {
      errs.push(`unexpected error: ${r.error?.message}`);
    } else {
      const out = r.output ?? "";
      if (v.expectOutput !== undefined && out !== v.expectOutput) errs.push(`output mismatch:\n  got ${JSON.stringify(out)}\n  want ${JSON.stringify(v.expectOutput)}`);
      for (const sub of v.expectContains ?? []) if (!out.includes(sub)) errs.push(`output missing ${JSON.stringify(sub)}`);
      if (v.expectRoundTripValue !== undefined) {
        const backDir = v.options.direction === "json-to-yaml" ? "yaml-to-json" : "json-to-yaml";
        const back = convert(out, { direction: backDir, indent: 2 });
        if (!back.ok) errs.push(`round trip failed to parse: ${back.error?.message}`);
        else if (!deepEqual(JSON.parse(back.output ?? "null"), v.expectRoundTripValue)) errs.push(`round-trip value mismatch: got ${back.output}`);
      }
      if (v.expectNotes !== undefined) {
        const got = [...r.notes].sort();
        const want = [...v.expectNotes].sort();
        if (JSON.stringify(got) !== JSON.stringify(want)) errs.push(`notes: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
      }
    }
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  for (const v of CONV_REJECT_VECTORS) {
    const r = convert(v.input, v.options);
    const errs: string[] = [];
    if (r.ok || !r.error) errs.push("expected an error but conversion succeeded");
    else {
      if (!r.error.message.includes(v.expectMessageIncludes)) errs.push(`message missing ${JSON.stringify(v.expectMessageIncludes)}: ${JSON.stringify(r.error.message)}`);
      if (v.expectLine !== undefined && r.error.line !== v.expectLine) errs.push(`line: got ${r.error.line} want ${v.expectLine}`);
      if (v.expectColumn !== undefined && r.error.column !== v.expectColumn) errs.push(`column: got ${r.error.column} want ${v.expectColumn}`);
      if (v.expectPointer !== undefined && r.error.pointer !== v.expectPointer) errs.push(`pointer: got ${JSON.stringify(r.error.pointer)} want ${JSON.stringify(v.expectPointer)}`);
    }
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}
