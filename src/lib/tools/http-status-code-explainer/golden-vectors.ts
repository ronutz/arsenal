// ============================================================================
// src/lib/tools/http-status-code-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the status-code explainer: the redirect distinctions,
// the 401-vs-403 pair, the 5xx triage trio note, the family-fallback answer
// for unknown codes, family queries, dedupe, and the validation paths.
// GOLDEN_VECTOR_SET_ID: http-status-code-explainer-golden-v1.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "http-status-code-explainer-golden-v1";

export interface StatusVector {
  name: string;
  input: string;
  expect: (r: ReturnType<typeof run>) => boolean;
  expectError?: RegExp;
}

export const STATUS_VECTORS: StatusVector[] = [
  {
    name: "404 decodes with family and the 410 contrast note",
    input: "404",
    expect: (r) =>
      r.codes.length === 1 && r.codes[0].name === "Not Found" && r.codes[0].familyName.startsWith("4xx") &&
      r.codes[0].notes.some((n) => n.includes("410 Gone")),
  },
  {
    name: "redirect trio: 307 declares method preservation",
    input: "301 302 307",
    expect: (r) =>
      r.codes.length === 3 && r.codes[2].meaning.includes("preserves the request method"),
  },
  {
    name: "304 is explained as the conditional-cache payoff, not a redirect",
    input: "304",
    expect: (r) => r.codes[0].meaning.includes("Not a redirect at all"),
  },
  {
    name: "401 carries the WWW-Authenticate note and the 403 contrast",
    input: "401 403",
    expect: (r) =>
      r.codes[0].notes.some((n) => n.includes("WWW-Authenticate")) &&
      r.codes[1].notes.some((n) => n.includes("401 asks for credentials")),
  },
  {
    name: "429 carries Retry-After guidance",
    input: "429",
    expect: (r) => r.codes[0].notes.some((n) => n.includes("Retry-After")),
  },
  {
    name: "5xx proxy trio adds the triage note",
    input: "502 503 504",
    expect: (r) => r.notes.some((n) => n.includes("Incident triage")),
  },
  {
    name: "unknown 599 answers with the family fallback rule",
    input: "599",
    expect: (r) => r.codes[0].fallback && r.codes[0].notes[0].includes("treat it as 500"),
  },
  {
    name: "family query 4xx returns the family explanation",
    input: "4xx",
    expect: (r) => r.families.length === 1 && r.families[0].familyName === "4xx Client Error" && r.codes.length === 0,
  },
  {
    name: "duplicates dedupe preserving order",
    input: "200 404 200",
    expect: (r) => r.codes.length === 2 && r.codes[0].code === 200 && r.codes[1].code === 404,
  },
  {
    name: "non-numeric token rejected with position",
    input: "200 banana",
    expect: () => false,
    expectError: /Token 2 \("banana"\)/,
  },
  {
    name: "out-of-range code rejected",
    input: "099",
    expect: () => false,
    expectError: /run 100-599/,
  },
  {
    name: "empty input rejected helpfully",
    input: "   ",
    expect: () => false,
    expectError: /Paste at least one status code/,
  },
];

/** Run every vector; return failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of STATUS_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectError) failures.push(`${v.name}: expected error, got success`);
      else if (!v.expect(r)) failures.push(`${v.name}: expectation failed`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!v.expectError) failures.push(`${v.name}: unexpected error ${msg}`);
      else if (!v.expectError.test(msg)) failures.push(`${v.name}: error mismatch ${msg}`);
    }
  }
  return failures;
}
