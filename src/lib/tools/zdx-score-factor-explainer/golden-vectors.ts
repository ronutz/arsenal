// ============================================================================
// src/lib/tools/zdx-score-factor-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the ZDX score factor explainer. Fifteen vectors pin the
// engine's ground truth: the three documented bands (Poor 0-33 with its
// auto-RCA note, Okay 34-65, Good 66-100) and their inclusive edges, the 0-100
// scale (0 accepted, 101 refused) and whole-number scores, the roll-up rules,
// per-metric probe-family attribution and documented facts (PFT's
// top-level-document design, SRT as time-to-first-byte), the web-versus-path
// diagnostic appearing exactly when both families are present, the always-on
// formula-honesty and score-type notes, and the error paths (range, bounds,
// duplicates, unknown metric).
// GOLDEN_VECTOR_SET_ID: zdx-score-factor-explainer-golden-2026-10-26. Changed
// from -golden-v1 on 2026-10-26: Zscaler's "Understanding the ZDX Score" page
// (read that day) documents a 0-100 scale and all three bands, so the 1-100
// bound and the Poor-only classification were corrected. (D-19 comments.)
// ============================================================================

import { run } from "./compute";

// The dated set id: it changes whenever the vectors change (check-api-sync reads it).
export const GOLDEN_VECTOR_SET_ID = "zdx-score-factor-explainer-golden-2026-10-26";

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
    // Input: one score line.
    input: "score = 28",
    // One composite reading naming the Poor band and the root-cause analysis.
    expect: (r) =>
      r.readings.length === 1 &&
      r.readings[0].family === "composite" &&
      r.readings[0].lines.some((l) => l.includes("Poor band (0-33, red)")) &&
      r.readings[0].lines.some((l) => l.includes("root-cause analysis")),
  },
  {
    // V2: a score of 72 lands in the documented Good band.
    name: "score 72 lands in documented Good band (66-100)",
    // Input: one score line.
    input: "score = 72",
    // The Good band line, and no Poor or Okay classification.
    expect: (r) =>
      r.readings[0].lines.some((l) => l.includes("Good band (66-100, green)")) &&
      !r.readings[0].lines.some((l) => l.includes("Poor band") || l.includes("Okay band")),
  },
  {
    // V3: a score of 50 lands in Okay, and the roll-up rules ride every score reading.
    name: "score 50 lands in Okay band and carries the lowest-of-hour and roll-up rules",
    // Input: one score line.
    input: "score = 50",
    // Okay band plus the pessimism and both roll-up shapes.
    expect: (r) =>
      r.readings[0].lines.some((l) => l.includes("Okay band (34-65, amber)")) &&
      r.readings[0].lines.some(
        (l) =>
          l.includes("LOWEST five-minute value observed during the hour") &&
          l.includes("averages each user's lowest value") &&
          l.includes("lowest value of each time interval"),
      ),
  },
  {
    // V4: 0 is the bottom of the documented 0-100 scale and is Poor, not an error.
    name: "score 0 accepted and classified Poor",
    // Input: the lowest documented score.
    input: "score = 0",
    // Accepted, and classified into the Poor band.
    expect: (r) => r.readings[0].lines.some((l) => l.includes("Poor band (0-33, red)")),
  },
  {
    // V5: the band edges are inclusive exactly as published.
    name: "band edges 33/34, 65/66 and 100 classify as published",
    // Input: one edge here; the others are run inside the expectation.
    input: "score = 33",
    // 33 Poor, 34 Okay, 65 Okay, 66 Good, 100 Good.
    expect: (r) =>
      r.readings[0].lines.some((l) => l.includes("Poor band")) &&
      run("score = 34").readings[0].lines.some((l) => l.includes("Okay band")) &&
      run("score = 65").readings[0].lines.some((l) => l.includes("Okay band")) &&
      run("score = 66").readings[0].lines.some((l) => l.includes("Good band")) &&
      run("score = 100").readings[0].lines.some((l) => l.includes("Good band")),
  },
  {
    // V6: a score above the documented 0-100 scale errors.
    name: "score 101 rejected (0-100 documented scale)",
    // Input: one over the top of the scale.
    input: "score = 101",
    // No success path is acceptable here.
    expect: () => false,
    // The error names the documented scale.
    expectError: /0-100/,
  },
  {
    // V7: a fractional score errors, because ZDX scores are rounded to whole numbers.
    name: "score 33.5 rejected (whole numbers only)",
    // Input: a fraction that would straddle the Poor/Okay edge.
    input: "score = 33.5",
    // No success path is acceptable here.
    expect: () => false,
    // The error explains the documented rounding.
    expectError: /whole numbers/,
  },
  {
    // V8: PFT is a web-family metric carrying the top-level-document design fact.
    name: "pft attributes to web family with top-level-document fact",
    // Input: one Page Fetch Time line.
    input: "pft = 850",
    // Web family and the documented top-level-document design.
    expect: (r) =>
      r.readings[0].family === "web" &&
      r.readings[0].lines.some((l) => l.includes("top-level page document")),
  },
  {
    // V9: SRT explains as time to first byte.
    name: "srt explains as time to first byte",
    // Input: one Server Response Time line.
    input: "srt = 420",
    // Web family and the time-to-first-byte meaning.
    expect: (r) =>
      r.readings[0].family === "web" &&
      r.readings[0].lines.some((l) => l.includes("time to first byte")),
  },
  {
    // V10: availability outside 0-100 errors on documented percentage bounds.
    name: "availability 140 rejected as percentage",
    // Input: an impossible percentage.
    input: "availability = 140",
    // No success path is acceptable here.
    expect: () => false,
    // The error names the percentage bounds.
    expectError: /percentage from 0 to 100/,
  },
  {
    // V11: path-loss attributes to the CloudPath family.
    name: "path-loss attributes to cloudpath family",
    // Input: one CloudPath loss line.
    input: "path-loss = 4",
    // CloudPath family.
    expect: (r) => r.readings[0].family === "cloudpath",
  },
  {
    // V12: the web-versus-path diagnostic appears exactly when both families
    //      are present - and every non-score metric carries the
    //      no-published-threshold refusal line.
    name: "both families present yields the diagnostic split; single family does not",
    // Input: one web metric and one path metric.
    input: "pft = 850\npath-loss = 4",
    // One diagnostic line, refusal lines on both, none for a single family.
    expect: (r) =>
      r.diagnostic.length === 1 &&
      r.readings.every(
        (x) => x.lines.some((l) => l.includes("No published threshold")),
      ) &&
      run("pft = 850").diagnostic.length === 0,
  },
  {
    // V13: the formula-honesty note and the score-type note are always emitted.
    name: "formula-not-published and score-type notes always present",
    // Input: any metric.
    input: "dns = 120",
    // Both standing notes, with the 0-100 scale and the three score types.
    expect: (r) =>
      r.notes.some((n) => n.includes("NOT published") && n.includes("0-100")) &&
      r.notes.some(
        (n) => n.includes("Synthetic Probe Score") && n.includes("RUM Score") && n.includes("Combined Score"),
      ),
  },
  {
    // V14: duplicate metrics rejected.
    name: "duplicate metric rejected",
    // Input: the same metric twice.
    input: "pft = 100\npft = 200",
    // No success path is acceptable here.
    expect: () => false,
    // The error names the duplication.
    expectError: /appears twice/,
  },
  {
    // V15: an unknown metric errors helpfully.
    name: "unknown metric rejected with the known list",
    // Input: a metric the grammar does not define.
    input: "jitter = 30",
    // No success path is acceptable here.
    expect: () => false,
    // The error names the problem.
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
