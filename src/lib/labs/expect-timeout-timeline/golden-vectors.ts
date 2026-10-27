// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/expect-timeout-timeline/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Expect timeout timeline lab (set 2026-10-27a). Each
// case is worked by hand from the rules in compute.ts and pinned field by field,
// with the steps written as "second:kind/deadline". The cases marked CHECKED
// were replayed against the real Expect 5.45.4 (Tcl 8.6.14) on 2026-10-27 with
// a fake device that prints on the same schedule, and the outcome, the second
// the expect returned and the number of progress lines matched agreed with the
// model (the transcripts are kept with the helper's evidence: runs 01, 02, 03
// and 13). Reject vectors pin every error code. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, TimeoutTimelineError, type TimeoutTimelineErrorCode, type TimeoutTimelineInput, type TimeoutTimelineResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "expect-timeout-timeline/2026-10-27a";

/** The scalar fields a case can pin (the steps and the alternative are compared as strings). */
type Scalars = Omit<TimeoutTimelineResult, "steps" | "alternative">;

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: TimeoutTimelineInput;
  /** The scalar fields that must match. */
  expect: Partial<Scalars>;
  /** The steps, as stepsOf() writes them. */
  steps: string;
  /** The alternative, as altOf() writes it ("none" when there is none). */
  alt: string;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings the model must refuse. */
  input: TimeoutTimelineInput;
  /** The code the refusal must carry. */
  code: TimeoutTimelineErrorCode;
}

/** Every step of a result as one short stable string: second, kind, and the deadline after it ("-" for none). */
export function stepsOf(r: TimeoutTimelineResult): string {
  // Joined with a separator that never appears inside a step.
  return r.steps.map((s) => `${s.atS}:${s.kind}/${s.deadlineS ?? "-"}`).join(" | ");
}

/** The alternative of a result as one short stable string. */
export function altOf(r: TimeoutTimelineResult): string {
  // None, or the form, the outcome and the second.
  return r.alternative === null ? "none" : `${r.alternative.progressArm} ${r.alternative.outcome} ${r.alternative.returnsAtS ?? "-"}`;
}

/** A shorthand for an input, so each case reads on one line. */
function inp(timeoutMode: TimeoutTimelineInput["timeoutMode"], timeoutS: number, progressArm: TimeoutTimelineInput["progressArm"], progressEveryS: number, progressCount: number, ending: TimeoutTimelineInput["ending"], endAtS: number, arms: TimeoutTimelineInput["arms"]): TimeoutTimelineInput {
  // The fields in the order the controls show them.
  return { timeoutMode, timeoutS, progressArm, progressEveryS, progressCount, ending, endAtS, arms };
}

/** The accept cases. */
export const TIMEOUT_TIMELINE_VECTORS: readonly AcceptVector[] = Object.freeze([
  // CHECKED (run 13): the opening state. exp_continue restarts the timer at every progress line; the prompt at 22 s beats the deadline of 30 s.
  { id: "default-input-prompt-at-22", input: inp("value", 10, "continue", 4, 5, "prompt", 22, "timeout-eof"), expect: { timeoutS: 10, outcome: "prompt", returnsAtS: 22, progressMatched: 5, progressUnmatched: 0, restarts: 5, carriesOn: false }, steps: "0:start/10 | 4:progress-restart/14 | 8:progress-restart/18 | 12:progress-restart/22 | 16:progress-restart/26 | 20:progress-restart/30 | 22:prompt/-", alt: "continue-timer timeout-arm 10" },
  // CHECKED (run 13): the Example. -continue_timer keeps the 10 s deadline; with no timeout arm the implicit null action runs and the script carries on.
  { id: "example-continue-timer-null-action", input: inp("value", 10, "continue-timer", 4, 5, "prompt", 22, "none"), expect: { outcome: "timeout-null", returnsAtS: 10, progressMatched: 2, restarts: 0, carriesOn: true }, steps: "0:start/10 | 4:progress-keep/10 | 8:progress-keep/10 | 10:timeout-null/-", alt: "continue prompt 22" },
  // CHECKED (run 13): a progress line due in the same second as the deadline comes too late; the timeout arm runs at 5 s.
  // In a real run this second is a race (the deadline is counted on the clock's whole seconds): run 13's second batch
  // saw a line due at the deadline matched just before the timer ran out. The lab's rule, too late, is its stated assumption.
  { id: "line-at-the-deadline-is-late", input: inp("value", 5, "continue", 5, 2, "prompt", 12, "timeout"), expect: { outcome: "timeout-arm", returnsAtS: 5, progressMatched: 0, restarts: 0, carriesOn: false }, steps: "0:start/5 | 5:timeout-arm/-", alt: "continue-timer timeout-arm 5" },
  // CHECKED (run 13): text that matches nothing does not move the deadline.
  { id: "unmatched-text-keeps-deadline", input: inp("value", 3, "none", 1, 2, "prompt", 5, "none"), expect: { outcome: "timeout-null", returnsAtS: 3, progressMatched: 0, progressUnmatched: 2, carriesOn: true }, steps: "0:start/3 | 1:progress-unmatched/3 | 2:progress-unmatched/3 | 3:timeout-null/-", alt: "none" },
  // CHECKED (run 13): end of file with only a timeout arm: the expect returns at once, no arm runs, the script carries on.
  { id: "eof-without-eof-arm", input: inp("value", 4, "continue", 2, 1, "eof", 3, "timeout"), expect: { outcome: "eof-no-arm", returnsAtS: 3, progressMatched: 1, restarts: 1, carriesOn: true }, steps: "0:start/4 | 2:progress-restart/6 | 3:eof-no-arm/-", alt: "continue-timer eof-no-arm 3" },
  // CHECKED (run 13): the default arm runs on end of file.
  { id: "default-arm-on-eof", input: inp("value", 4, "continue", 2, 1, "eof", 3, "default"), expect: { outcome: "default-eof", returnsAtS: 3, carriesOn: false }, steps: "0:start/4 | 2:progress-restart/6 | 3:default-eof/-", alt: "continue-timer default-eof 3" },
  // CHECKED (run 13): an arm without exp_continue ends the expect at the first progress line.
  { id: "arm-without-exp-continue-returns", input: inp("value", 6, "return", 2, 3, "prompt", 9, "timeout-eof"), expect: { outcome: "progress-arm", returnsAtS: 2, progressMatched: 1, carriesOn: false }, steps: "0:start/6 | 2:progress-return/-", alt: "none" },
  // CHECKED (run 13): timeout not set: the default of 10 s, here with a timeout arm and a device that falls silent.
  { id: "default-timeout-is-ten", input: inp("default", 0, "none", 2, 3, "silence", 0, "timeout"), expect: { timeoutS: 10, outcome: "timeout-arm", returnsAtS: 10, progressUnmatched: 3 }, steps: "0:start/10 | 2:progress-unmatched/10 | 4:progress-unmatched/10 | 6:progress-unmatched/10 | 10:timeout-arm/-", alt: "none" },
  // CHECKED (run 02, variant A): busy at 3, 6, 9, 12, 15 s and the prompt at 17 s against a 5 s timeout, with exp_continue.
  { id: "run02-exp-continue", input: inp("value", 5, "continue", 3, 5, "prompt", 17, "timeout"), expect: { outcome: "prompt", returnsAtS: 17, progressMatched: 5, restarts: 5 }, steps: "0:start/5 | 3:progress-restart/8 | 6:progress-restart/11 | 9:progress-restart/14 | 12:progress-restart/17 | 15:progress-restart/20 | 17:prompt/-", alt: "continue-timer timeout-arm 5" },
  // CHECKED (run 02, variant B): the same with -continue_timer: timeout at 5 s after one busy line.
  { id: "run02-continue-timer", input: inp("value", 5, "continue-timer", 3, 5, "prompt", 17, "timeout"), expect: { outcome: "timeout-arm", returnsAtS: 5, progressMatched: 1, restarts: 0 }, steps: "0:start/5 | 3:progress-keep/5 | 5:timeout-arm/-", alt: "continue prompt 17" },
  // CHECKED (run 02b, variant D): busy every 6 s against a 5 s timeout: exp_continue never gets the chance.
  { id: "run02b-slower-than-timeout", input: inp("value", 5, "continue", 6, 2, "prompt", 14, "timeout"), expect: { outcome: "timeout-arm", returnsAtS: 5, progressMatched: 0 }, steps: "0:start/5 | 5:timeout-arm/-", alt: "continue-timer timeout-arm 5" },
  // CHECKED (run 02b, variant G): -1 waits past ten seconds for a line at 12 s.
  { id: "run02b-infinite-waits", input: inp("infinite", 0, "none", 1, 0, "prompt", 12, "none"), expect: { timeoutS: null, outcome: "prompt", returnsAtS: 12 }, steps: "0:start/- | 12:prompt/-", alt: "none" },
  // CHECKED (run 02b, variant E): timeout 0 polls once and returns at once when nothing has arrived.
  { id: "run02b-timeout-zero", input: inp("value", 0, "none", 1, 0, "prompt", 1, "timeout"), expect: { timeoutS: 0, outcome: "timeout-arm", returnsAtS: 0 }, steps: "0:start/0 | 0:timeout-arm/-", alt: "none" },
  // CHECKED (run 01): the default timeout with noise every 2 s that matches nothing: the implicit null action at 10 s.
  { id: "run01-default-null-action", input: inp("default", 0, "none", 2, 6, "silence", 0, "none"), expect: { timeoutS: 10, outcome: "timeout-null", returnsAtS: 10, progressUnmatched: 4, carriesOn: true }, steps: "0:start/10 | 2:progress-unmatched/10 | 4:progress-unmatched/10 | 6:progress-unmatched/10 | 8:progress-unmatched/10 | 10:timeout-null/-", alt: "none" },
  // CHECKED (run 03, case A): end of file at 1 s with an eof arm.
  { id: "run03-eof-arm", input: inp("default", 0, "none", 1, 0, "eof", 1, "timeout-eof"), expect: { outcome: "eof-arm", returnsAtS: 1, carriesOn: false }, steps: "0:start/10 | 1:eof-arm/-", alt: "none" },
  // -1 and a device that falls silent: the expect never returns.
  { id: "infinite-silence-forever", input: inp("infinite", 0, "none", 1, 0, "silence", 0, "timeout-eof"), expect: { timeoutS: null, outcome: "forever", returnsAtS: null, carriesOn: false }, steps: "0:start/-", alt: "none" },
  // -1 with exp_continue: the restarts change nothing, there is no deadline to move.
  { id: "infinite-with-continue", input: inp("infinite", 0, "continue", 30, 2, "silence", 0, "timeout"), expect: { outcome: "forever", returnsAtS: null, progressMatched: 2, restarts: 2 }, steps: "0:start/- | 30:progress-restart/- | 60:progress-restart/-", alt: "continue-timer forever -" },
  // The default arm on a timeout.
  { id: "default-arm-on-timeout", input: inp("value", 7, "none", 1, 0, "silence", 0, "default"), expect: { outcome: "default-timeout", returnsAtS: 7, carriesOn: false }, steps: "0:start/7 | 7:default-timeout/-", alt: "none" },
  // An eof arm only: a timeout still takes the implicit null action.
  { id: "eof-arm-only-times-out-blind", input: inp("value", 3, "none", 1, 0, "silence", 0, "eof"), expect: { outcome: "timeout-null", returnsAtS: 3, carriesOn: true }, steps: "0:start/3 | 3:timeout-null/-", alt: "none" },
  // The last restart pushes the deadline past the prompt, one second at a time (run 13's second batch agreed: prompt at
  // 5 s after 4 lines; its -continue_timer twin also ended at 2 s with no arm, though the line due at 2 s won the race there).
  { id: "last-restart-just-in-time", input: inp("value", 2, "continue", 1, 4, "prompt", 5, "none"), expect: { outcome: "prompt", returnsAtS: 5, restarts: 4 }, steps: "0:start/2 | 1:progress-restart/3 | 2:progress-restart/4 | 3:progress-restart/5 | 4:progress-restart/6 | 5:prompt/-", alt: "continue-timer timeout-null 2" },
]);

/** The reject cases. */
export const TIMEOUT_TIMELINE_REJECTS: readonly RejectVector[] = Object.freeze([
  // A select value no control can produce.
  { id: "bad-choice", input: { ...inp("value", 10, "continue", 4, 5, "prompt", 22, "none"), arms: "both" as unknown as "none" }, code: "bad-choice" },
  // A fractional timeout (expect.c reads it with atoi; the lab asks for whole seconds).
  { id: "bad-timeout-fraction", input: inp("value", 2.5, "none", 1, 0, "silence", 0, "none"), code: "bad-timeout" },
  // A timeout above the lab's range.
  { id: "bad-timeout-range", input: inp("value", 601, "none", 1, 0, "silence", 0, "none"), code: "bad-timeout" },
  // Too many progress lines.
  { id: "bad-progress-count", input: inp("value", 10, "continue", 1, 21, "silence", 0, "none"), code: "bad-progress-count" },
  // A zero gap between progress lines.
  { id: "bad-progress-every", input: inp("value", 10, "continue", 0, 3, "silence", 0, "none"), code: "bad-progress-every" },
  // An ending at second 0.
  { id: "bad-end-time", input: inp("value", 10, "none", 1, 0, "prompt", 0, "none"), code: "bad-end-time" },
  // An ending before the last progress line.
  { id: "end-before-progress", input: inp("value", 10, "continue", 4, 5, "prompt", 20, "none"), code: "end-before-progress" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every pinned field, the steps and the alternative.
  for (const v of TIMEOUT_TIMELINE_VECTORS) {
    // The model's answer, or the refusal it should not have given.
    let got: TimeoutTimelineResult;
    // Run it.
    try {
      // Compute.
      got = compute(v.input);
    } catch (e) {
      // An accept case must not be refused.
      failures.push(`${v.id}: refused with ${e instanceof TimeoutTimelineError ? e.code : String(e)}`);
      // Next case.
      continue;
    }
    // Each pinned scalar.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value.
      const have = got[k as keyof Scalars];
      // A difference names the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // The steps.
    const steps = stepsOf(got);
    // Compared as one string.
    if (steps !== v.steps) failures.push(`${v.id}: steps are "${steps}", expected "${v.steps}"`);
    // The alternative.
    const alt = altOf(got);
    // Compared as one string.
    if (alt !== v.alt) failures.push(`${v.id}: alternative is "${alt}", expected "${v.alt}"`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of TIMEOUT_TIMELINE_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof TimeoutTimelineError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = TIMEOUT_TIMELINE_VECTORS.length + TIMEOUT_TIMELINE_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
