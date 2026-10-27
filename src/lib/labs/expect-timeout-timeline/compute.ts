// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/expect-timeout-timeline/compute.ts
// ----------------------------------------------------------------------------
// THE EXPECT TIMEOUT TIMELINE LAB'S MODEL (2026-10-27), the interactive
// companion of the article "Expect's timeouts, eof and loops". One expect
// command waits for a device's prompt. The device prints a progress line
// ("Please wait") every few seconds, a set number of times, and then shows its
// prompt, closes the connection, or falls silent. The reader chooses how the
// script sets its timeout, what the expect does when a progress line arrives,
// and which keyword arms (timeout, eof, default) it carries; the model lays the
// wait out second by second: every progress line, every restart of the timer,
// and the moment the expect returns, with the arm that ran.
//
// The rules are expect(1)'s, the manual page of Expect 5.45.4 (Don Libes,
// NIST), read 2026-10-27 at core.tcl-lang.org, each one named in the article:
//   - "The default timeout period is 10 seconds but may be set, for example to
//     30, by the command "set timeout 30". An infinite timeout may be
//     designated by the value -1."
//   - "If a pattern is the keyword timeout, the corresponding body is executed
//     upon timeout. If no timeout keyword is used, an implicit null action is
//     executed upon timeout." The script then runs its next line.
//   - "If a pattern is the keyword eof, the corresponding body is executed upon
//     end-of-file"; "If a pattern is the keyword default, the corresponding
//     body is executed upon either timeout or end-of-file." With no eof or
//     default arm, the expect returns at end of file and the script carries
//     on; it does not wait for the timeout (the manual's hint: "expect will not
//     timeout - instead it will get an eof indication").
//   - "By default exp_continue resets the timeout timer. The -continue_timer
//     flag prevents timer from being restarted." An arm whose body does not
//     call exp_continue ends the expect: "If a pattern matches, then the
//     corresponding body is executed", and expect returns.
//   - Output that matches no pattern does not move the deadline: the timer
//     counts from the start of the expect (or from the last exp_continue), not
//     from the last character received. This is the code of expect.c in the
//     5.45.4 release (end_time = start + timeout, recomputed only on a
//     restart), read 2026-10-27, and it held in every run (runs 01, 02, 13).
//   - The timeout is read as a whole number of seconds (expect.c reads the
//     variable with atoi), so the lab takes whole seconds only.
// What the model assumes and leaves out (the lab's scope note): events land on
// whole seconds and an event due in the same second as the deadline arrives
// too late (in a real run that second is a race: run 13 saw it go both ways);
// the real deadline is counted on the clock's whole seconds, so after text
// arrives a real wait can end up to a second early or late (expect.c keeps
// end_time and the remaining time in whole seconds); pattern order when several patterns
// match at once, expect_before and expect_after, full_buffer and match_max are
// out of scope; so are the time a program takes to start and the speed of the
// link.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The default timeout of expect(1), in seconds. */
export const DEFAULT_TIMEOUT_S = 10;
/** The largest timeout the lab accepts for "set timeout N", in seconds. */
export const MAX_TIMEOUT_S = 600;
/** The longest gap between two progress lines the lab accepts, in seconds. */
export const MAX_EVERY_S = 600;
/** The most progress lines the lab shows (enough for every lesson, short enough to read). */
export const MAX_PROGRESS = 20;
/** The latest second the ending may name. */
export const MAX_END_S = 3600;

/** How the script sets its timeout: not at all (the default), to a number, or to -1 (no limit). */
export type TimeoutMode = "default" | "value" | "infinite";
/** Every value the timeout-mode control can take. */
export const TIMEOUT_MODES: readonly TimeoutMode[] = ["default", "value", "infinite"];

/** What the expect does with a progress line: no arm for it, an arm ending in exp_continue, with -continue_timer, or an arm without exp_continue. */
export type ProgressArm = "none" | "continue" | "continue-timer" | "return";
/** Every value the progress-arm control can take. */
export const PROGRESS_ARMS: readonly ProgressArm[] = ["none", "continue", "continue-timer", "return"];

/** How the device's output ends: its prompt, end of file, or silence. */
export type Ending = "prompt" | "eof" | "silence";
/** Every value the ending control can take. */
export const ENDINGS: readonly Ending[] = ["prompt", "eof", "silence"];

/** The keyword arms the expect carries. */
export type KeywordArms = "timeout-eof" | "timeout" | "eof" | "default" | "none";
/** Every value the keyword-arms control can take. */
export const KEYWORD_ARMS: readonly KeywordArms[] = ["timeout-eof", "timeout", "eof", "default", "none"];

/** The reader's settings, all times in whole seconds from the start of the expect. */
export interface TimeoutTimelineInput {
  /** How the script sets its timeout. */
  timeoutMode: TimeoutMode;
  /** The N of "set timeout N" (read only when timeoutMode is "value"). */
  timeoutS: number;
  /** What the expect does with a progress line. */
  progressArm: ProgressArm;
  /** The gap between progress lines: the first comes at this second, the next at twice it, and so on. */
  progressEveryS: number;
  /** How many progress lines the device prints (0 for none). */
  progressCount: number;
  /** How the device's output ends. */
  ending: Ending;
  /** When the prompt or the end of file comes (read only when the ending is not silence). */
  endAtS: number;
  /** The keyword arms the expect carries. */
  arms: KeywordArms;
}

/** What happens at one moment of the wait. */
export type StepKind =
  | "start"
  | "progress-unmatched"
  | "progress-restart"
  | "progress-keep"
  | "progress-return"
  | "prompt"
  | "eof-arm"
  | "default-eof"
  | "eof-no-arm"
  | "timeout-arm"
  | "default-timeout"
  | "timeout-null";

/** One moment of the wait: when, what, and the deadline in force once it has happened. */
export interface TimelineStep {
  /** The second it happens. */
  atS: number;
  /** What happens. */
  kind: StepKind;
  /** The second the timer runs out once this step is taken in, or null when there is no limit (or the wait is over). */
  deadlineS: number | null;
}

/** How the wait ends. */
export type Outcome =
  | "prompt"
  | "progress-arm"
  | "timeout-arm"
  | "default-timeout"
  | "timeout-null"
  | "eof-arm"
  | "default-eof"
  | "eof-no-arm"
  | "forever";

/** How the wait would end with the other exp_continue form, for comparison. */
export interface Alternative {
  /** The other form. */
  progressArm: "continue" | "continue-timer";
  /** Its outcome. */
  outcome: Outcome;
  /** When its expect returns, or null when it never does. */
  returnsAtS: number | null;
}

/** The model's answer. */
export interface TimeoutTimelineResult {
  /** The timeout in force, in seconds, or null when there is no limit (-1). */
  timeoutS: number | null;
  /** Every step of the wait, in time order. */
  steps: TimelineStep[];
  /** How the wait ends. */
  outcome: Outcome;
  /** When the expect returns, or null when it never does. */
  returnsAtS: number | null;
  /** Progress lines that matched the progress arm. */
  progressMatched: number;
  /** Progress lines that arrived and matched nothing. */
  progressUnmatched: number;
  /** Times exp_continue restarted the timer. */
  restarts: number;
  /** True when the script's next line runs with nothing to tell it the wait failed (the implicit null action, or an eof with no arm). */
  carriesOn: boolean;
  /** The same device with the other exp_continue form, when the progress arm uses one; null otherwise. */
  alternative: Alternative | null;
}

/** The stable codes an invalid input is refused with. */
export type TimeoutTimelineErrorCode =
  | "bad-choice"
  | "bad-timeout"
  | "bad-progress-every"
  | "bad-progress-count"
  | "bad-end-time"
  | "end-before-progress";

/** An invalid input, refused with a stable code the interface can word. */
export class TimeoutTimelineError extends Error {
  /** The stable code. */
  readonly code: TimeoutTimelineErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: TimeoutTimelineErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** True when v is a whole number from lo to hi. */
function wholeIn(v: number, lo: number, hi: number): boolean {
  // An integer inside the range (NaN and infinities fail Number.isInteger).
  return Number.isInteger(v) && v >= lo && v <= hi;
}

/** Refuse an input the lab cannot model, with the first problem found. */
function validate(i: TimeoutTimelineInput): void {
  // Every select must hold one of its values.
  if (!TIMEOUT_MODES.includes(i.timeoutMode) || !PROGRESS_ARMS.includes(i.progressArm) || !ENDINGS.includes(i.ending) || !KEYWORD_ARMS.includes(i.arms)) {
    // A value no control can produce.
    throw new TimeoutTimelineError("bad-choice", "a choice outside the lab's options");
  }
  // "set timeout N": a whole number of seconds, 0 included (0 polls once and returns).
  if (i.timeoutMode === "value" && !wholeIn(i.timeoutS, 0, MAX_TIMEOUT_S)) throw new TimeoutTimelineError("bad-timeout", `timeout not a whole number from 0 to ${MAX_TIMEOUT_S}: ${String(i.timeoutS)}`);
  // The number of progress lines.
  if (!wholeIn(i.progressCount, 0, MAX_PROGRESS)) throw new TimeoutTimelineError("bad-progress-count", `progress count not a whole number from 0 to ${MAX_PROGRESS}: ${String(i.progressCount)}`);
  // Their spacing, when there are any.
  if (i.progressCount > 0 && !wholeIn(i.progressEveryS, 1, MAX_EVERY_S)) throw new TimeoutTimelineError("bad-progress-every", `progress spacing not a whole number from 1 to ${MAX_EVERY_S}: ${String(i.progressEveryS)}`);
  // The prompt or the end of file needs a second of its own.
  if (i.ending !== "silence") {
    // A whole second inside the range.
    if (!wholeIn(i.endAtS, 1, MAX_END_S)) throw new TimeoutTimelineError("bad-end-time", `end time not a whole number from 1 to ${MAX_END_S}: ${String(i.endAtS)}`);
    // The device prints its progress lines first, then ends: the ending comes after the last of them.
    if (i.progressCount > 0 && i.endAtS <= i.progressCount * i.progressEveryS) throw new TimeoutTimelineError("end-before-progress", "the ending must come after the last progress line");
  }
}

/** The timeout in force for these settings: 10 by default, N, or null for -1. */
function timeoutOf(i: TimeoutTimelineInput): number | null {
  // Not set: the default of expect(1).
  if (i.timeoutMode === "default") return DEFAULT_TIMEOUT_S;
  // -1: no limit.
  if (i.timeoutMode === "infinite") return null;
  // set timeout N.
  return i.timeoutS;
}

/** The device's output as timed events, in order: progress lines, then the ending (none for silence). */
function eventsOf(i: TimeoutTimelineInput): { atS: number; what: "progress" | "prompt" | "eof" }[] {
  // The events.
  const ev: { atS: number; what: "progress" | "prompt" | "eof" }[] = [];
  // One progress line every progressEveryS seconds.
  for (let n = 1; n <= i.progressCount; n++) ev.push({ atS: n * i.progressEveryS, what: "progress" });
  // The ending, unless the device falls silent.
  if (i.ending !== "silence") ev.push({ atS: i.endAtS, what: i.ending });
  // Already in time order: the ending comes after the last progress line (validated).
  return ev;
}

/** The core of the model: follow one expect through the events (input already validated). */
function simulate(i: TimeoutTimelineInput): Omit<TimeoutTimelineResult, "alternative"> {
  // The timeout in force.
  const timeoutS = timeoutOf(i);
  // The deadline: the timeout counted from second 0, or none.
  let deadline: number | null = timeoutS;
  // The steps, opening with the start of the expect.
  const steps: TimelineStep[] = [{ atS: 0, kind: "start", deadlineS: deadline }];
  // Counters.
  let progressMatched = 0;
  // Lines that matched nothing.
  let progressUnmatched = 0;
  // Restarts of the timer.
  let restarts = 0;
  // Which keyword arms exist.
  const hasTimeoutArm = i.arms === "timeout-eof" || i.arms === "timeout";
  // The eof arm.
  const hasEofArm = i.arms === "timeout-eof" || i.arms === "eof";
  // The default arm covers both.
  const hasDefault = i.arms === "default";
  // Walk the device's events in time order.
  for (const ev of eventsOf(i)) {
    // An event in the same second as the deadline, or later, comes too late: the timer runs out first.
    if (deadline !== null && ev.atS >= deadline) break;
    // A progress line.
    if (ev.what === "progress") {
      // No arm for it: the text arrives, matches nothing, and the deadline does not move.
      if (i.progressArm === "none") {
        // Counted.
        progressUnmatched++;
        // The step.
        steps.push({ atS: ev.atS, kind: "progress-unmatched", deadlineS: deadline });
        // Next event.
        continue;
      }
      // Every other arm matches it.
      progressMatched++;
      // exp_continue: the timer restarts from now (no limit stays no limit).
      if (i.progressArm === "continue") {
        // The new deadline.
        deadline = timeoutS === null ? null : ev.atS + timeoutS;
        // Counted.
        restarts++;
        // The step.
        steps.push({ atS: ev.atS, kind: "progress-restart", deadlineS: deadline });
        // Next event.
        continue;
      }
      // exp_continue -continue_timer: the expect goes on, the deadline stays.
      if (i.progressArm === "continue-timer") {
        // The step.
        steps.push({ atS: ev.atS, kind: "progress-keep", deadlineS: deadline });
        // Next event.
        continue;
      }
      // An arm without exp_continue: its body runs and the expect returns, here.
      steps.push({ atS: ev.atS, kind: "progress-return", deadlineS: null });
      // The answer.
      return { timeoutS, steps, outcome: "progress-arm", returnsAtS: ev.atS, progressMatched, progressUnmatched, restarts, carriesOn: false };
    }
    // The prompt: matched; the expect returns.
    if (ev.what === "prompt") {
      // The step.
      steps.push({ atS: ev.atS, kind: "prompt", deadlineS: null });
      // The answer.
      return { timeoutS, steps, outcome: "prompt", returnsAtS: ev.atS, progressMatched, progressUnmatched, restarts, carriesOn: false };
    }
    // End of file: the eof arm, the default arm, or no arm at all (the expect returns and the script carries on).
    const kind: StepKind = hasEofArm ? "eof-arm" : hasDefault ? "default-eof" : "eof-no-arm";
    // The step.
    steps.push({ atS: ev.atS, kind, deadlineS: null });
    // The answer.
    return { timeoutS, steps, outcome: kind, returnsAtS: ev.atS, progressMatched, progressUnmatched, restarts, carriesOn: kind === "eof-no-arm" };
  }
  // No event ended the wait. With no limit, it never ends.
  if (deadline === null) return { timeoutS, steps, outcome: "forever", returnsAtS: null, progressMatched, progressUnmatched, restarts, carriesOn: false };
  // The timer runs out: the timeout arm, the default arm, or the implicit null action.
  const kind: StepKind = hasTimeoutArm ? "timeout-arm" : hasDefault ? "default-timeout" : "timeout-null";
  // The step.
  steps.push({ atS: deadline, kind, deadlineS: null });
  // The answer.
  return { timeoutS, steps, outcome: kind, returnsAtS: deadline, progressMatched, progressUnmatched, restarts, carriesOn: kind === "timeout-null" };
}

/** Follow one expect through the device's output, and compare the other exp_continue form when one is used. */
export function compute(input: TimeoutTimelineInput): TimeoutTimelineResult {
  // Refuse what the lab cannot model.
  validate(input);
  // The wait as set.
  const main = simulate(input);
  // The other exp_continue form, when the progress arm uses one.
  let alternative: Alternative | null = null;
  // Only for the two exp_continue forms.
  if (input.progressArm === "continue" || input.progressArm === "continue-timer") {
    // The other one.
    const other = input.progressArm === "continue" ? "continue-timer" : "continue";
    // The same device and script with it.
    const alt = simulate({ ...input, progressArm: other });
    // Its outcome and return time.
    alternative = { progressArm: other, outcome: alt.outcome, returnsAtS: alt.returnsAtS };
  }
  // The answer.
  return { ...main, alternative };
}

/** The opening state: set timeout 10, exp_continue on every progress line, timeout and eof arms; the prompt comes at 22 s and is matched. */
export const DEFAULT_INPUT: TimeoutTimelineInput = { timeoutMode: "value", timeoutS: 10, progressArm: "continue", progressEveryS: 4, progressCount: 5, ending: "prompt", endAtS: 22, arms: "timeout-eof" };

/** The Example: the same device with -continue_timer and no keyword arms: the timer runs out at 10 s and the script carries on blind. */
export const EXAMPLE_INPUT: TimeoutTimelineInput = { timeoutMode: "value", timeoutS: 10, progressArm: "continue-timer", progressEveryS: 4, progressCount: 5, ending: "prompt", endAtS: 22, arms: "none" };
