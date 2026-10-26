// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/cmp-concentration/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the CMP concentration lab (set 2026-10-26a). Three cases
// marked "checked" were run in the original interactive model on 2026-10-26 and
// compared figure for figure: 10,000 req/s on 8 TMMs spread evenly is 1,250 on
// the busiest (12.5 %); with a global it is 10,000 (100 %); 12,345 on 7 is
// 1,763.57 (14.3 %). The fourth checked case, a concentrated subtable at 50,000
// req/s on 16 TMMs, is CORRECTED here: the original put all 50,000 requests on
// one TMM, but F5's table reference concentrates the subtable's entries, not
// the virtual server's requests, so the requests stay at 3,125 per TMM and the
// 50,000 table operations land on one processor. Reject vectors pin the stable
// error codes. verifyVectors() runs them all; scripts/run-golden-vectors runs
// it at prebuild and fails the build on any drift.
// ============================================================================

import { CmpError, compute, type CmpErrorCode, type CmpInput, type CmpResult, type StatePattern } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "cmp-concentration/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: CmpInput;
  /** The fields of the result that must match. */
  expect: Partial<CmpResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range. */
  input: CmpInput;
  /** The code the refusal must carry. */
  code: CmpErrorCode;
}

/** The accept cases. */
export const CMP_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: an even spread puts 1,250 of 10,000 requests per second on each of 8 TMMs, 12.5 % each.
  { id: "checked-spread-10000-8", input: { rate: 10000, tmms: 8, pattern: "spread", tableOpsPerRequest: 1 }, expect: { busiestRequests: 1250, busiestShare: 0.125, idleTmms: 0, subtableOpsOnOne: null, demoted: false } },
  // Checked: a modified global demotes the virtual server, so one TMM carries all 10,000 and seven sit idle for it.
  { id: "checked-global-10000-8", input: { rate: 10000, tmms: 8, pattern: "global", tableOpsPerRequest: 1 }, expect: { busiestRequests: 10000, busiestShare: 1, idleTmms: 7, subtableOpsOnOne: null, demoted: true } },
  // Checked: 12,345 requests per second on 7 TMMs is 1,763.57 on each, a seventh of the load.
  { id: "checked-spread-12345-7", input: { rate: 12345, tmms: 7, pattern: "spread", tableOpsPerRequest: 0 }, expect: { busiestRequests: 12345 / 7, busiestShare: 1 / 7, idleTmms: 0, demoted: false } },
  // Checked case, corrected: the subtable concentrates its 50,000 operations per second, not the requests, which stay at 3,125 per TMM.
  { id: "corrected-subtable-50000-16", input: { rate: 50000, tmms: 16, pattern: "subtable", tableOpsPerRequest: 1 }, expect: { busiestRequests: 3125, busiestShare: 0.0625, idleTmms: 0, subtableOpsOnOne: 50000, demoted: false } },
  // Three table operations per request triple the work on the subtable's processor.
  { id: "subtable-three-ops", input: { rate: 10000, tmms: 8, pattern: "subtable", tableOpsPerRequest: 3 }, expect: { busiestRequests: 1250, subtableOpsOnOne: 30000 } },
  // A single TMM: spreading and demotion are the same thing, and nothing is idle.
  { id: "one-tmm", input: { rate: 500, tmms: 1, pattern: "global", tableOpsPerRequest: 0 }, expect: { busiestRequests: 500, busiestShare: 1, idleTmms: 0, demoted: true } },
]);

/** The reject cases. */
export const CMP_REJECTS: readonly RejectVector[] = Object.freeze([
  // No requests at all.
  { id: "zero-rate", input: { rate: 0, tmms: 8, pattern: "spread", tableOpsPerRequest: 0 }, code: "bad-rate" },
  // No TMMs.
  { id: "zero-tmms", input: { rate: 1000, tmms: 0, pattern: "spread", tableOpsPerRequest: 0 }, code: "bad-tmms" },
  // A fractional TMM count.
  { id: "fractional-tmms", input: { rate: 1000, tmms: 2.5, pattern: "spread", tableOpsPerRequest: 0 }, code: "bad-tmms" },
  // Too many table operations per request for the lab.
  { id: "too-many-ops", input: { rate: 1000, tmms: 8, pattern: "subtable", tableOpsPerRequest: 101 }, code: "bad-ops" },
  // A pattern the control cannot produce.
  { id: "bad-pattern", input: { rate: 1000, tmms: 8, pattern: "static" as unknown as StatePattern, tableOpsPerRequest: 0 }, code: "bad-pattern" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of CMP_VECTORS) {
    // The model's answer, or the refusal it should not have made.
    let got: CmpResult;
    // Run it.
    try {
      // Should not throw.
      got = compute(v.input);
    } catch (e) {
      // An unexpected refusal fails the case.
      failures.push(`${v.id}: refused with ${e instanceof CmpError ? e.code : String(e)}`);
      // Nothing to compare.
      continue;
    }
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof CmpResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of CMP_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof CmpError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = CMP_VECTORS.length + CMP_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
