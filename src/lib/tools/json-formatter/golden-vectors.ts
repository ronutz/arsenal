// ============================================================================
// src/lib/tools/json-formatter/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden (valid) + reject (error) vectors for the JSON formatter. Golden vectors
// assert exact formatted output, duplicate-key pointers, and stats. Reject
// vectors assert the precise error location (line, column, pointer) and a
// message fragment. verifyVectors() runs the set.
// ============================================================================

import { formatJson, type FormatOptions, type IndentStyle } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "json-formatter-golden-v1";

const opt = (o: Partial<FormatOptions> = {}): FormatOptions => ({ mode: "pretty", indent: 2 as IndentStyle, sortKeys: false, ...o });

export interface JsonGoldenVector {
  id: string;
  description: string;
  input: string;
  options: FormatOptions;
  expectOutput: string;
  expectDuplicatePointers?: string[]; // pointer/key joined as "pointer|key"
  expectStats?: Partial<{ objects: number; arrays: number; keys: number; maxDepth: number }>;
}

export interface JsonRejectVector {
  id: string;
  description: string;
  input: string;
  expectLine: number;
  expectColumn: number;
  expectPointer: string;
  expectMessageIncludes: string;
}

export const JSON_GOLDEN_VECTORS: JsonGoldenVector[] = [
  {
    id: "pretty-basic",
    description: "Pretty-print with two-space indent",
    input: '{"b":1,"a":[1,2]}',
    options: opt(),
    expectOutput: '{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}',
    expectStats: { objects: 1, arrays: 1, keys: 2, maxDepth: 2 },
  },
  {
    id: "minify-basic",
    description: "Minify removes all insignificant whitespace",
    input: '{ "a" : 1 , "b" : [ 2 , 3 ] }',
    options: opt({ mode: "minify" }),
    expectOutput: '{"a":1,"b":[2,3]}',
  },
  {
    id: "sort-keys",
    description: "Keys are sorted lexicographically at every level",
    input: '{"c":1,"a":2,"b":3}',
    options: opt({ sortKeys: true }),
    expectOutput: '{\n  "a": 2,\n  "b": 3,\n  "c": 1\n}',
  },
  {
    id: "tab-indent",
    description: "Tab indentation",
    input: '{"a":{"b":1}}',
    options: opt({ indent: "tab" }),
    expectOutput: '{\n\t"a": {\n\t\t"b": 1\n\t}\n}',
  },
  {
    id: "big-number-preserve",
    description: "Large integer and high-precision decimal survive untouched",
    input: '{"id":12345678901234567890,"pi":3.14159265358979323846,"exp":1e400}',
    options: opt({ mode: "minify" }),
    expectOutput: '{"id":12345678901234567890,"pi":3.14159265358979323846,"exp":1e400}',
  },
  {
    id: "empty-containers",
    description: "Empty object and array render compactly",
    input: '{"o":{},"a":[]}',
    options: opt(),
    expectOutput: '{\n  "o": {},\n  "a": []\n}',
  },
  {
    id: "unicode-roundtrip",
    description: "Escaped and literal Unicode are preserved as text",
    input: '{"esc":"caf\\u00e9","emoji":"\\ud83d\\ude00"}',
    options: opt({ mode: "minify" }),
    expectOutput: '{"esc":"café","emoji":"😀"}',
  },
  {
    id: "duplicate-keys",
    description: "Duplicate keys are reported with pointers; tree keeps last",
    input: '{"a":1,"a":2,"b":{"c":1,"c":2}}',
    options: opt({ mode: "minify" }),
    expectOutput: '{"a":2,"b":{"c":2}}',
    expectDuplicatePointers: ["|a", "/b|c"],
  },
  {
    id: "nested-depth",
    description: "Deeply nested structure reports correct max depth",
    input: '{"a":{"b":{"c":[{"d":1}]}}}',
    options: opt({ mode: "minify" }),
    expectOutput: '{"a":{"b":{"c":[{"d":1}]}}}',
    expectStats: { maxDepth: 5, objects: 4, arrays: 1 },
  },
  {
    id: "scalar-root",
    description: "A bare scalar is a valid JSON document",
    input: "  42  ",
    options: opt({ mode: "minify" }),
    expectOutput: "42",
  },
  {
    id: "escape-special",
    description: "Control characters re-escaped on output",
    input: '{"tab":"a\\tb","nl":"x\\ny"}',
    options: opt({ mode: "minify" }),
    expectOutput: '{"tab":"a\\tb","nl":"x\\ny"}',
  },
];

export const JSON_REJECT_VECTORS: JsonRejectVector[] = [
  { id: "trailing-comma-obj", description: "Trailing comma before }", input: '{"a":1,}', expectLine: 1, expectColumn: 8, expectPointer: "", expectMessageIncludes: "Trailing comma" },
  { id: "trailing-comma-arr", description: "Trailing comma before ]", input: "[1,2,]", expectLine: 1, expectColumn: 6, expectPointer: "", expectMessageIncludes: "Trailing comma" },
  { id: "unquoted-key", description: "Unquoted object key", input: "{a:1}", expectLine: 1, expectColumn: 2, expectPointer: "", expectMessageIncludes: "double-quoted" },
  { id: "missing-colon", description: "Missing colon after key", input: '{"a" 1}', expectLine: 1, expectColumn: 6, expectPointer: "/a", expectMessageIncludes: "colon" },
  { id: "unexpected-end", description: "Input ends after colon", input: '{"a":', expectLine: 1, expectColumn: 6, expectPointer: "/a", expectMessageIncludes: "Unexpected end" },
  { id: "extra-content", description: "Content after the value", input: "{} junk", expectLine: 1, expectColumn: 4, expectPointer: "", expectMessageIncludes: "after the JSON value" },
  { id: "single-quote-value", description: "Single-quoted value", input: '["a", '+"'b']", expectLine: 1, expectColumn: 7, expectPointer: "/1", expectMessageIncludes: "double quotes" },
  { id: "multiline", description: "Error on line 3 reports correct line/column", input: '{\n  "a": 1,\n  "b": x\n}', expectLine: 3, expectColumn: 8, expectPointer: "/b", expectMessageIncludes: "value was expected" },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of JSON_GOLDEN_VECTORS) {
    const r = formatJson(v.input, v.options);
    const errs: string[] = [];
    if (!r.ok) errs.push(`unexpected error: ${r.error?.message}`);
    else {
      if (r.output !== v.expectOutput) errs.push(`output mismatch:\n  got ${JSON.stringify(r.output)}\n  want ${JSON.stringify(v.expectOutput)}`);
      if (v.expectDuplicatePointers) {
        const got = r.duplicateKeys.map((d) => `${d.pointer}|${d.key}`).sort();
        const want = [...v.expectDuplicatePointers].sort();
        if (JSON.stringify(got) !== JSON.stringify(want)) errs.push(`duplicates: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
      }
      if (v.expectStats && r.stats) {
        for (const [k, val] of Object.entries(v.expectStats)) {
          if ((r.stats as unknown as Record<string, number>)[k] !== val) errs.push(`stats.${k}: got ${(r.stats as unknown as Record<string, number>)[k]} want ${val}`);
        }
      }
    }
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  for (const v of JSON_REJECT_VECTORS) {
    const r = formatJson(v.input, opt());
    const errs: string[] = [];
    if (r.ok || !r.error) errs.push("expected an error but parsed successfully");
    else {
      if (r.error.line !== v.expectLine) errs.push(`line: got ${r.error.line} want ${v.expectLine}`);
      if (r.error.column !== v.expectColumn) errs.push(`column: got ${r.error.column} want ${v.expectColumn}`);
      if (r.error.pointer !== v.expectPointer) errs.push(`pointer: got ${JSON.stringify(r.error.pointer)} want ${JSON.stringify(v.expectPointer)}`);
      if (!r.error.message.includes(v.expectMessageIncludes)) errs.push(`message missing ${JSON.stringify(v.expectMessageIncludes)}: ${JSON.stringify(r.error.message)}`);
    }
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}
