// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/f5-monitor-timing/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the F5 monitor timing lab (set 2026-10-26a). Each case is
// worked by hand from the rules in compute.ts and pinned field by field, with
// the probe runs written as "from-to/every x count outcome status". Two cases
// reproduce F5's own worked examples: K350 and K11359's 5 s / 16 s timeline
// (probes at 0, 5, 10 and 15 s unanswered, marked down at 16 s after the first
// miss) and K000138395's Up Interval example (checked every 20 s while up,
// marked down 10 s after a missed probe, then checked every 3 s). The others
// pin the Example's bounce against the recommended Timeout, the deadline tie
// behind the "+1" (K12531), Time Until Up, an outage no probe sees, and a
// Timeout equal to the Interval. Reject vectors pin every error code.
// verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on any drift.
// ============================================================================

import { compute, MonitorTimingError, type MonitorTimingErrorCode, type MonitorTimingInput, type MonitorTimingResult, type ProbeRun } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "f5-monitor-timing/2026-10-26a";

/** The scalar fields a case can pin. */
type Scalars = Omit<MonitorTimingResult, "probes" | "runs">;

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: MonitorTimingInput;
  /** The scalar fields that must match. */
  expect: Partial<Scalars>;
  /** The probe runs, as runsOf() writes them. */
  runs: string;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings the model must refuse. */
  input: MonitorTimingInput;
  /** The code the refusal must carry. */
  code: MonitorTimingErrorCode;
}

/** One run as a short stable string. */
function runOf(r: ProbeRun): string {
  // Seconds, spacing (or "-" for a run of one), count, answered (A) or missed (M), the status after.
  return `${r.fromS}-${r.toS}/${r.everyS ?? "-"}x${r.count} ${r.answered ? "A" : "M"} ${r.status}`;
}

/** Every run of a result, in order, as one string. */
export function runsOf(r: MonitorTimingResult): string {
  // Joined with a separator that never appears inside a run.
  return r.runs.map(runOf).join(" | ");
}

/** The accept cases. */
export const MONITOR_TIMING_VECTORS: readonly AcceptVector[] = Object.freeze([
  // K350 / K11359: the http defaults; four probes miss (30, 35, 40, 45), marked down 16 s after the first, up on the first answer.
  {
    id: "defaults-down-up",
    input: { intervalS: 5, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 0, failAtS: 30, recoverAtS: 90 },
    expect: { recommendedTimeoutS: 16, belowRecommendation: false, windowProbes: 4, upIntervalNotMultiple: false, lastAnsweredBeforeS: 25, firstMissedS: 30, deadlineS: 46, missedWhileUp: 4, riddenAtS: null, markedDownS: 46, missedWhileDown: 8, firstAnsweredAfterS: 90, markedUpS: 90, outcome: "down-up", detectionS: 16, returnS: 0, downForS: 44, recommendedMarksDown: null, flap: false },
    runs: "0-25/5x6 A up | 30-45/5x4 M up | 50-85/5x8 M down | 90-90/-x1 A up",
  },
  // The Example: Timeout 6 s, an 11-second stall: down at 41, up at 45; with 16 s the answer at 45 is inside the window.
  {
    id: "short-timeout-bounces",
    input: { intervalS: 5, timeoutS: 6, upIntervalS: 0, timeUntilUpS: 0, failAtS: 32, recoverAtS: 43 },
    expect: { recommendedTimeoutS: 16, belowRecommendation: true, windowProbes: 2, firstMissedS: 35, deadlineS: 41, missedWhileUp: 2, markedDownS: 41, missedWhileDown: 0, markedUpS: 45, outcome: "down-up", detectionS: 9, returnS: 2, downForS: 4, recommendedMarksDown: false, flap: true },
    runs: "0-30/5x7 A up | 35-40/5x2 M up | 45-45/-x1 A up",
  },
  // The same stall with the recommended Timeout: the answer at 45 comes before 51, so the member stays up (K350).
  {
    id: "recommended-rides-through",
    input: { intervalS: 5, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 0, failAtS: 32, recoverAtS: 43 },
    expect: { firstMissedS: 35, deadlineS: 51, missedWhileUp: 2, riddenAtS: 45, markedDownS: null, markedUpS: null, outcome: "ridden-through", detectionS: null, returnS: null, downForS: null, recommendedMarksDown: null, flap: false },
    runs: "0-30/5x7 A up | 35-40/5x2 M up | 45-45/-x1 A up",
  },
  // K12531's "+1": with 15 s the deadline falls on the probe at 50, which is too late; down and up at 50. 16 s rides through.
  {
    id: "deadline-tie",
    input: { intervalS: 5, timeoutS: 15, upIntervalS: 0, timeUntilUpS: 0, failAtS: 32, recoverAtS: 48 },
    expect: { belowRecommendation: true, windowProbes: 3, firstMissedS: 35, deadlineS: 50, missedWhileUp: 3, markedDownS: 50, markedUpS: 50, detectionS: 18, returnS: 2, downForS: 0, recommendedMarksDown: false, flap: true },
    runs: "0-30/5x7 A up | 35-45/5x3 M up | 50-50/-x1 A up",
  },
  // Time Until Up 10 s: the first answer at 90 starts the count; marked up at 100 (21.1.0 Monitors Concepts).
  {
    id: "time-until-up",
    input: { intervalS: 5, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 10, failAtS: 30, recoverAtS: 90 },
    expect: { markedDownS: 46, firstAnsweredAfterS: 90, markedUpS: 100, returnS: 10, downForS: 54, outcome: "down-up", flap: false },
    runs: "0-25/5x6 A up | 30-45/5x4 M up | 50-85/5x8 M down | 90-95/5x2 A pending",
  },
  // K000138395: Up Interval 20, Interval 3, Timeout 10; one missed probe at 60, down at 70, then every 3 s until it answers.
  {
    id: "up-interval-k000138395",
    input: { intervalS: 3, timeoutS: 10, upIntervalS: 20, timeUntilUpS: 0, failAtS: 50, recoverAtS: 100 },
    expect: { recommendedTimeoutS: 10, belowRecommendation: false, windowProbes: 1, upIntervalNotMultiple: true, lastAnsweredBeforeS: 40, firstMissedS: 60, deadlineS: 70, missedWhileUp: 1, markedDownS: 70, missedWhileDown: 9, markedUpS: 100, detectionS: 20, returnS: 0, downForS: 30, recommendedMarksDown: null },
    runs: "0-40/20x3 A up | 60-60/-x1 M up | 73-97/3x9 M down | 100-100/-x1 A up",
  },
  // A blip between two probes: the probe at 30 is before it and the one at 35 after it, so the monitor never sees it.
  {
    id: "unseen-blip",
    input: { intervalS: 5, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 0, failAtS: 31, recoverAtS: 33 },
    expect: { lastAnsweredBeforeS: 30, firstMissedS: null, deadlineS: null, missedWhileUp: 0, markedDownS: null, firstAnsweredAfterS: 35, outcome: "unseen", flap: false },
    runs: "0-35/5x8 A up",
  },
  // Timeout equal to the Interval (the shortest the system accepts, K000138395): one missed probe is enough; a 28-second outage is a real one, so 16 s marks it down too.
  {
    id: "timeout-equals-interval",
    input: { intervalS: 5, timeoutS: 5, upIntervalS: 0, timeUntilUpS: 0, failAtS: 32, recoverAtS: 60 },
    expect: { windowProbes: 1, firstMissedS: 35, deadlineS: 40, missedWhileUp: 1, markedDownS: 40, missedWhileDown: 4, markedUpS: 60, recommendedMarksDown: true, flap: false },
    runs: "0-30/5x7 A up | 35-35/-x1 M up | 40-55/5x4 M down | 60-60/-x1 A up",
  },
]);

/** The reject cases, one per error code. */
export const MONITOR_TIMING_REJECTS: readonly RejectVector[] = Object.freeze([
  // An Interval of zero.
  { id: "bad-interval", input: { intervalS: 0, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 0, failAtS: 30, recoverAtS: 90 }, code: "bad-interval" },
  // A Timeout beyond the lab's range.
  { id: "bad-timeout", input: { intervalS: 5, timeoutS: 1000, upIntervalS: 0, timeUntilUpS: 0, failAtS: 30, recoverAtS: 90 }, code: "bad-timeout" },
  // A Timeout shorter than the Interval, which the system refuses (K000138395).
  { id: "timeout-below-interval", input: { intervalS: 10, timeoutS: 5, upIntervalS: 0, timeUntilUpS: 0, failAtS: 30, recoverAtS: 90 }, code: "timeout-below-interval" },
  // A negative Up Interval.
  { id: "bad-up-interval", input: { intervalS: 5, timeoutS: 16, upIntervalS: -1, timeUntilUpS: 0, failAtS: 30, recoverAtS: 90 }, code: "bad-up-interval" },
  // A fractional Time Until Up.
  { id: "bad-time-until-up", input: { intervalS: 5, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 1.5, failAtS: 30, recoverAtS: 90 }, code: "bad-time-until-up" },
  // A recovery that is not after the failure.
  { id: "bad-timeline", input: { intervalS: 5, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 0, failAtS: 30, recoverAtS: 30 }, code: "bad-timeline" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute, compare every expected field, then the runs.
  for (const v of MONITOR_TIMING_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected scalar in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof Scalars];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // The probe runs, compared as one string.
    const r = runsOf(got);
    // A different sequence is a failure showing both.
    if (r !== v.runs) failures.push(`${v.id}: runs are "${r}", expected "${v.runs}"`);
  }
  // Each reject case: it must throw with the right code.
  for (const rj of MONITOR_TIMING_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(rj.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof MonitorTimingError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== rj.code) failures.push(`${rj.id}: refused with ${String(code)}, expected ${rj.code}`);
  }
  // The report in the shape the runner reads.
  const total = MONITOR_TIMING_VECTORS.length + MONITOR_TIMING_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
