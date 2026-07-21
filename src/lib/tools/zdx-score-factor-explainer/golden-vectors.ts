// ============================================================================
// src/lib/tools/zdx-score-factor-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the ZDX score factor explainer. Twelve vectors pin the
// engine's ground truth: the documented Poor band (0-33) with its auto-RCA
// note, the refusal to invent band edges above it, per-metric probe-family
// attribution and documented facts (PFT's top-level-document design, SRT as
// time-to-first-byte), the web-versus-path diagnostic appearing exactly when
// both families are present, the always-on formula-honesty note, and the
// error paths (range, bounds, duplicates, unknown metric, empty input).
// GOLDEN_VECTOR_SET_ID: zdx-score-factor-explainer-golden-v1 (D-19 comments.)
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "zdx-score-factor-explainer-golden-v1";

export interface ZdxVector {
  name: string;
  input: string;
  expect: (r: ReturnType<typeof run>) => boolean;
  expectError?: RegExp;
}

export const ZDX_VECTORS: ZdxVector[] = [
  {
    // V1: a Poor score classifies into the documented 0-33 band + auto-RCA note.
    name: "score 28 lands in documented Poor band with auto-RCA note",
    input: "score = 28",
    expect: (r) =>
      r.readings.length === 1 &&
      r.readings[0].family === "composite" &&
      r.readings[0].lines.some((l) => l.includes("Poor band (0-33)")) &&
      r.readings[0].lines.some((l) => l.includes("root-cause analysis")),
  },
  {
    // V2: a non-Poor score refuses invented finer band edges.
    name: "score 72 states above-Poor and refuses invented band edges",
    input: "score = 72",
    expect: (r) =>
      r.readings[0].lines.some((l) => l.includes("above the documented Poor band")) &&
      r.readings[0].lines.some((l) => l.includes("does not invent finer band edges")),
  },
  {
    // V3: the lowest-of-the-hour pessimism note rides every score reading.
    name: "score reading carries lowest-of-hour + group-averaging semantics",
    input: "score = 55",
    expect: (r) =>
      r.readings[0].lines.some((l) => l.includes("LOWEST score observed during the hour")),
  },
  {
    // V4: score out of the documented 1-100 range errors.
    name: "score 0 rejected (1-100 documented range)",
    input: "score = 0",
    expect: () => false,
    expectError: /1-100/,
  },
  {
    // V5: PFT is a web-family metric carrying the top-level-document design fact.
    name: "pft attributes to web family with top-level-document fact",
    input: "pft = 850",
    expect: (r) =>
      r.readings[0].family === "web" &&
      r.readings[0].lines.some((l) => l.includes("top-level page document")),
  },
  {
    // V6: SRT explains as time to first byte.
    name: "srt explains as time to first byte",
    input: "srt = 420",
    expect: (r) =>
      r.readings[0].family === "web" &&
      r.readings[0].lines.some((l) => l.includes("time to first byte")),
  },
  {
    // V7: availability outside 0-100 errors on documented percentage bounds.
    name: "availability 140 rejected as percentage",
    input: "availability = 140",
    expect: () => false,
    expectError: /percentage from 0 to 100/,
  },
  {
    // V8: path-loss attributes to the CloudPath family.
    name: "path-loss attributes to cloudpath family",
    input: "path-loss = 4",
    expect: (r) => r.readings[0].family === "cloudpath",
  },
  {
    // V9: the web-versus-path diagnostic appears exactly when both families
    //     are present - and every non-score metric carries the
    //     no-published-threshold refusal line.
    name: "both families present yields the diagnostic split; single family does not",
    input: "pft = 850\npath-loss = 4",
    expect: (r) =>
      r.diagnostic.length === 1 &&
      r.readings.every(
        (x) => x.lines.some((l) => l.includes("No published threshold")),
      ) &&
      run("pft = 850").diagnostic.length === 0,
  },
  {
    // V10: the formula-honesty note is always emitted.
    name: "formula-not-published honesty note always present",
    input: "dns = 120",
    expect: (r) => r.notes.some((n) => n.includes("NOT published")),
  },
  {
    // V11: duplicate metrics rejected.
    name: "duplicate metric rejected",
    input: "pft = 100\npft = 200",
    expect: () => false,
    expectError: /appears twice/,
  },
  {
    // V12: unknown metric and empty input both error helpfully.
    name: "unknown metric rejected with the known list",
    input: "jitter = 30",
    expect: () => false,
    expectError: /unknown metric/,
  },
];

/** Run every vector; return the list of failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of ZDX_VECTORS) {
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
