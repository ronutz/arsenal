// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/f5-monitor-timing/compute.ts
// ----------------------------------------------------------------------------
// THE F5 MONITOR TIMING LAB'S MODEL (2026-10-26), the interactive companion of
// the article "How LTM Health Monitors Decide Up or Down". One BIG-IP LTM
// health monitor watches one pool member. The reader sets the monitor's
// Interval, Timeout, Up Interval and Time Until Up, and a timeline for the
// server (healthy, silent from second X, healthy again from second Y); the
// model lists the probes and the moments the member is marked down and back
// up, with the rule that decided each.
//
// The rules are F5's, read on 2026-10-26, each named in the article:
//   - Interval: how often the monitor checks a member that is down or whose
//     status is unknown; Up Interval (0 = off): how often while it is up
//     (BIG-IP 21.1.0 LTM Monitors Reference, Monitors Settings Reference,
//     HTTP monitor settings; TMSH Reference v17, ltm monitor http).
//   - The Timeout runs from the first probe that goes unanswered: with
//     Interval 5 and Timeout 16 the probes at 0, 5, 10 and 15 s fail and the
//     member is marked down at 16 s, while an answer inside that window keeps
//     it up (K350). Once down, it stays down until a probe gets a correct
//     reply (K11359). A probe due exactly when the Timeout runs out comes too
//     late: the 3 x Interval + 1 rule exists so that the member is not marked
//     down "before sending the last check" (K12531).
//   - The system refuses a Timeout shorter than the Interval; while the member
//     is up it is checked every Up Interval, and once it is marked down the
//     Interval is used until it answers, after which the Up Interval resumes
//     (K000138395).
//   - The recommendation: Timeout = 3 x Interval + 1 (K350, K12531, K11359);
//     a monitor that marks a member down and back up repeatedly is bouncing
//     (K12531). The Interval and the Up Interval should be multiples of each
//     other (21.1.0 Settings Reference; TMSH Reference v17).
//   - Time Until Up 0: up on the first correct response. Above 0: up that many
//     seconds after the first correct response, only if every response in the
//     period is correct (21.1.0 Monitors Concepts; Settings Reference).
// What the model assumes, because F5 does not document it (the lab's scope
// note): probes start at second 0 and are evenly spaced, with no jitter; a
// healthy server answers at once; after a member is marked down between two
// Up Interval probes, the next probe goes out one Interval later (the reading
// of K000138395's "then the Interval is used"). What it leaves out: replies
// that arrive late, a server that refuses with a reset (marked down at once,
// TMSH Reference v17), Manual Resume, several monitors on one member, node
// monitors, and bigd's own scheduling and load.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The longest Interval or Up Interval the lab accepts, in seconds. */
export const MAX_INTERVAL_S = 300;
/** The longest Timeout or Time Until Up the lab accepts, in seconds. */
export const MAX_TIMEOUT_S = 900;
/** The latest second the timeline may name. */
export const MAX_TIMELINE_S = 3600;
/** A hard stop on the probe loop (never reached inside the ranges above; a guard against a modelling error). */
const MAX_PROBES = 20000;

/** The reader's settings, all in whole seconds. */
export interface MonitorTimingInput {
  /** Interval: the check frequency while the member is down or unknown. */
  intervalS: number;
  /** Timeout: how long the member has to answer, counted from the first unanswered probe. */
  timeoutS: number;
  /** Up Interval: the check frequency while the member is up; 0 means off (the Interval is used throughout). */
  upIntervalS: number;
  /** Time Until Up: the delay after the first correct response before the member is marked up; 0 means at once. */
  timeUntilUpS: number;
  /** Second X: the server stops answering. */
  failAtS: number;
  /** Second Y: the server answers again (after X). */
  recoverAtS: number;
}

/** The member's status as the monitor sees it: up, down, or down and counting Time Until Up. */
export type MemberStatus = "up" | "down" | "pending";

/** One probe. */
export interface Probe {
  /** The second it is sent (and, the model assumes, answered or not). */
  atS: number;
  /** True when the server answered it correctly. */
  answered: boolean;
  /** The member's status once this probe's outcome is taken in. */
  statusAfter: MemberStatus;
}

/** A run of probes with the same outcome and spacing, for a compact display. */
export interface ProbeRun {
  /** The first probe's second. */
  fromS: number;
  /** The last probe's second. */
  toS: number;
  /** The spacing between them, or null for a run of one. */
  everyS: number | null;
  /** How many probes. */
  count: number;
  /** Whether they were answered. */
  answered: boolean;
  /** The member's status after each of them. */
  status: MemberStatus;
}

/** How the outage plays out. */
export type Outcome = "unseen" | "ridden-through" | "down-up";

/** The model's answer. */
export interface MonitorTimingResult {
  /** F5's recommended Timeout for this Interval: 3 x Interval + 1. */
  recommendedTimeoutS: number;
  /** True when the Timeout is below that recommendation. */
  belowRecommendation: boolean;
  /** How many probes fit in one Timeout window while the member is still up. */
  windowProbes: number;
  /** True when an Up Interval is set and neither it nor the Interval is a multiple of the other. */
  upIntervalNotMultiple: boolean;
  /** The last probe before the failure (always answered). */
  lastAnsweredBeforeS: number;
  /** The first unanswered probe, or null when no probe fell inside the outage. */
  firstMissedS: number | null;
  /** When the Timeout from that probe runs out, or null. */
  deadlineS: number | null;
  /** Unanswered probes while the member was still up. */
  missedWhileUp: number;
  /** The answered probe that kept the member up inside its window, or null. */
  riddenAtS: number | null;
  /** When the member is marked down, or null. */
  markedDownS: number | null;
  /** Unanswered probes while the member was down. */
  missedWhileDown: number;
  /** The first answered probe at or after the recovery. */
  firstAnsweredAfterS: number;
  /** When the member is marked up again, or null when it was never down. */
  markedUpS: number | null;
  /** How the outage plays out. */
  outcome: Outcome;
  /** Seconds from the failure to the down mark, or null. */
  detectionS: number | null;
  /** Seconds from the recovery to the up mark, or null. */
  returnS: number | null;
  /** Seconds the member spent marked down, or null. */
  downForS: number | null;
  /** Whether the same timeline marks the member down with the recommended Timeout, or null when the Timeout already is that. */
  recommendedMarksDown: boolean | null;
  /** True when the member was marked down and up for an outage the recommended Timeout would have ridden through. */
  flap: boolean;
  /** Every probe, in order. */
  probes: Probe[];
  /** The probes grouped into runs. */
  runs: ProbeRun[];
}

/** The stable codes an invalid input is refused with. */
export type MonitorTimingErrorCode = "bad-interval" | "bad-timeout" | "timeout-below-interval" | "bad-up-interval" | "bad-time-until-up" | "bad-timeline";

/** An invalid input, refused with a stable code the interface can word. */
export class MonitorTimingError extends Error {
  /** The stable code. */
  readonly code: MonitorTimingErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: MonitorTimingErrorCode, message: string) {
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

/** What one run of the timeline produces (the parts compute() reports and compares). */
interface Simulation {
  /** Every probe. */
  probes: Probe[];
  /** First unanswered probe. */
  firstMissedS: number | null;
  /** Unanswered probes while up. */
  missedWhileUp: number;
  /** The answered probe that closed the window while up. */
  riddenAtS: number | null;
  /** The down mark. */
  markedDownS: number | null;
  /** Unanswered probes while down. */
  missedWhileDown: number;
  /** The up mark. */
  markedUpS: number | null;
}

/** Follow the monitor through the timeline (inputs already validated). */
function simulate(i: MonitorTimingInput): Simulation {
  // The probes, in order.
  const probes: Probe[] = [];
  // The member starts up: it has been answering before the timeline begins.
  let status: MemberStatus = "up";
  // The first unanswered probe of the current window while up, or null.
  let windowStart: number | null = null;
  // Recorded once: the first unanswered probe of the outage.
  let firstMissedS: number | null = null;
  // Counters and marks.
  let missedWhileUp = 0;
  // The probe that answered inside the window.
  let riddenAtS: number | null = null;
  // The down mark.
  let markedDownS: number | null = null;
  // Probes missed while down.
  let missedWhileDown = 0;
  // The up mark.
  let markedUpS: number | null = null;
  // The first correct response while down, which starts Time Until Up.
  let goodSince: number | null = null;
  // The next probe goes out at second 0.
  let next = 0;

  // One probe per turn, with the timers that fall before it handled first.
  for (let n = 0; n < MAX_PROBES; n++) {
    // The Timeout runs out at or before the next probe: marked down (a probe due at that very second is too late, K12531).
    if (status === "up" && windowStart !== null && windowStart + i.timeoutS <= next) {
      // The down mark, at the end of the window.
      markedDownS = windowStart + i.timeoutS;
      // Now down.
      status = "down";
      // From here the Interval is used (K000138395): the next probe comes no later than one Interval after the mark.
      next = Math.min(next, markedDownS + i.intervalS);
    }
    // Time Until Up runs out with every response correct before the next probe: marked up, and the account ends.
    if (status === "pending" && goodSince !== null && goodSince + i.timeUntilUpS <= next) {
      // The up mark, Time Until Up after the first correct response.
      markedUpS = goodSince + i.timeUntilUpS;
      // Nothing more to show.
      break;
    }
    // The probe goes out; the server answers unless it is inside the outage [X, Y).
    const at = next;
    // Healthy before X and from Y on.
    const answered = at < i.failAtS || at >= i.recoverAtS;
    // Take the outcome in, by status.
    if (status === "up") {
      // While up: an answer closes any open window; a miss opens one (or counts inside it).
      if (answered) {
        // An answer inside an open window keeps the member up (K350).
        if (windowStart !== null) riddenAtS = at;
        // The window closes.
        windowStart = null;
      } else {
        // A miss: the window starts at the first one.
        if (windowStart === null) windowStart = at;
        // The outage's first miss, once.
        if (firstMissedS === null) firstMissedS = at;
        // Counted.
        missedWhileUp++;
      }
    } else if (status === "down") {
      // While down: a correct answer marks the member up at once, or starts Time Until Up (Concepts).
      if (answered) {
        // Time Until Up 0: up immediately.
        if (i.timeUntilUpS === 0) {
          // The up mark.
          markedUpS = at;
          // Up again.
          status = "up";
        } else {
          // Counting from this first correct response.
          goodSince = at;
          // Still down while counting.
          status = "pending";
        }
      } else {
        // Another miss while down.
        missedWhileDown++;
      }
    } else if (!answered) {
      // Pending and a wrong answer: every response in the period must be correct, so back to down (Concepts).
      status = "down";
      // The count starts again at the next correct response.
      goodSince = null;
    }
    // Record the probe with the status it leaves.
    probes.push({ atS: at, answered, statusAfter: status });
    // The account ends with the first answered probe after the recovery that leaves the member up.
    if (status === "up" && answered && at >= i.recoverAtS) break;
    // The next probe: one Up Interval later while up (when set), one Interval otherwise.
    next = at + (status === "up" && i.upIntervalS > 0 ? i.upIntervalS : i.intervalS);
  }
  // Everything compute() needs.
  return { probes, firstMissedS, missedWhileUp, riddenAtS, markedDownS, missedWhileDown, markedUpS };
}

/** Group probes into runs of the same outcome, the same status after them, and the same spacing. */
function toRuns(probes: Probe[]): ProbeRun[] {
  // The runs, built left to right.
  const runs: ProbeRun[] = [];
  // Each probe joins the last run or starts a new one.
  for (const p of probes) {
    // The run it might join.
    const last = runs[runs.length - 1];
    // The gap to the previous probe in that run.
    const gap = last ? p.atS - last.toS : null;
    // It joins when the outcome and the status match and the spacing is the run's (or the run has one probe so far).
    if (last && last.answered === p.answered && last.status === p.statusAfter && (last.everyS === null || last.everyS === gap)) {
      // The run's spacing is fixed by its second probe.
      last.everyS = gap;
      // The run now ends here.
      last.toS = p.atS;
      // One more probe.
      last.count++;
    } else {
      // A new run of one.
      runs.push({ fromS: p.atS, toS: p.atS, everyS: null, count: 1, answered: p.answered, status: p.statusAfter });
    }
  }
  // The runs, in order.
  return runs;
}

/** Follow the monitor through the reader's timeline and say what it decides and why. */
export function compute(input: MonitorTimingInput): MonitorTimingResult {
  // The Interval: a whole number of seconds in range.
  if (!wholeIn(input.intervalS, 1, MAX_INTERVAL_S)) throw new MonitorTimingError("bad-interval", `intervalS must be a whole number from 1 to ${MAX_INTERVAL_S}`);
  // The Timeout: a whole number of seconds in range.
  if (!wholeIn(input.timeoutS, 1, MAX_TIMEOUT_S)) throw new MonitorTimingError("bad-timeout", `timeoutS must be a whole number from 1 to ${MAX_TIMEOUT_S}`);
  // The system refuses a Timeout shorter than the Interval (K000138395).
  if (input.timeoutS < input.intervalS) throw new MonitorTimingError("timeout-below-interval", "timeoutS must not be shorter than intervalS");
  // The Up Interval: 0 (off) or a whole number of seconds in range.
  if (!wholeIn(input.upIntervalS, 0, MAX_INTERVAL_S)) throw new MonitorTimingError("bad-up-interval", `upIntervalS must be a whole number from 0 to ${MAX_INTERVAL_S}`);
  // Time Until Up: 0 or a whole number of seconds in range.
  if (!wholeIn(input.timeUntilUpS, 0, MAX_TIMEOUT_S)) throw new MonitorTimingError("bad-time-until-up", `timeUntilUpS must be a whole number from 0 to ${MAX_TIMEOUT_S}`);
  // The timeline: X from 1 (the member starts up), Y after X, both within range.
  if (!wholeIn(input.failAtS, 1, MAX_TIMELINE_S - 1) || !wholeIn(input.recoverAtS, input.failAtS + 1, MAX_TIMELINE_S)) {
    // Refused as one error: the two seconds are read together.
    throw new MonitorTimingError("bad-timeline", `failAtS must be 1 to ${MAX_TIMELINE_S - 1} and recoverAtS after it, up to ${MAX_TIMELINE_S}`);
  }

  // The reader's timeline, followed.
  const s = simulate(input);
  // The recommendation for this Interval (K350).
  const recommendedTimeoutS = 3 * input.intervalS + 1;
  // The spacing of probes while the member is still up.
  const upGap = input.upIntervalS > 0 ? input.upIntervalS : input.intervalS;
  // Probes that fit before the window closes: at 0, g, 2g ... strictly before the Timeout.
  const windowProbes = Math.ceil(input.timeoutS / upGap);
  // The multiples recommendation, checked only when an Up Interval is set and differs from the Interval.
  const lo = Math.min(input.intervalS, input.upIntervalS);
  // The larger of the two.
  const hi = Math.max(input.intervalS, input.upIntervalS);
  // Neither divides the other.
  const upIntervalNotMultiple = input.upIntervalS > 0 && hi % lo !== 0;
  // The last probe before the failure: the last one sent before X (the probe at 0 always is, since X is at least 1).
  const lastAnsweredBeforeS = s.probes.filter((p) => p.atS < input.failAtS).reduce((m, p) => Math.max(m, p.atS), 0);
  // The first answered probe at or after Y (the loop always ends on one, or on Time Until Up after one).
  const firstAnsweredAfterS = s.probes.find((p) => p.answered && p.atS >= input.recoverAtS)?.atS ?? input.recoverAtS;
  // How the outage plays out.
  const outcome: Outcome = s.markedDownS !== null ? "down-up" : s.firstMissedS !== null ? "ridden-through" : "unseen";
  // The same timeline with the recommended Timeout, when the reader's differs from it.
  const recommendedMarksDown = input.timeoutS === recommendedTimeoutS ? null : simulate({ ...input, timeoutS: recommendedTimeoutS }).markedDownS !== null;
  // The full answer.
  return {
    recommendedTimeoutS,
    belowRecommendation: input.timeoutS < recommendedTimeoutS,
    windowProbes,
    upIntervalNotMultiple,
    lastAnsweredBeforeS,
    firstMissedS: s.firstMissedS,
    deadlineS: s.firstMissedS === null ? null : s.firstMissedS + input.timeoutS,
    missedWhileUp: s.missedWhileUp,
    riddenAtS: s.riddenAtS,
    markedDownS: s.markedDownS,
    missedWhileDown: s.missedWhileDown,
    firstAnsweredAfterS,
    markedUpS: s.markedUpS,
    outcome,
    detectionS: s.markedDownS === null ? null : s.markedDownS - input.failAtS,
    returnS: s.markedUpS === null ? null : s.markedUpS - input.recoverAtS,
    downForS: s.markedDownS === null || s.markedUpS === null ? null : s.markedUpS - s.markedDownS,
    recommendedMarksDown,
    flap: outcome === "down-up" && recommendedMarksDown === false,
    probes: s.probes,
    runs: toRuns(s.probes),
  };
}

/** The opening state: the http defaults (5 s, 16 s), a server silent from second 30 to second 90. */
export const DEFAULT_INPUT: MonitorTimingInput = { intervalS: 5, timeoutS: 16, upIntervalS: 0, timeUntilUpS: 0, failAtS: 30, recoverAtS: 90 };

/** The Example: a Timeout of 6 s against an 11-second stall; the member bounces where 16 s would ride it through. */
export const EXAMPLE_INPUT: MonitorTimingInput = { intervalS: 5, timeoutS: 6, upIntervalS: 0, timeUntilUpS: 0, failAtS: 32, recoverAtS: 43 };
