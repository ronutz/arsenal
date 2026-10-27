// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcp-congestion-window/compute.ts
// ----------------------------------------------------------------------------
// THE TCP CONGESTION WINDOW LAB'S MODEL (2026-10-26), an interactive companion
// of the article "TCP Connection Lifecycle" (its section "The middle act: how
// much can be in flight"). One TCP sender that always has data to send and a
// receiver whose window never limits it. The reader sets the sender maximum
// segment size (SMSS), the initial window rule, the initial slow start
// threshold (ssthresh), the round trip in which one segment is lost and how
// the loss is detected, and the model gives the congestion window (cwnd) and
// ssthresh at the start of every round trip, with the rule that set them.
//
// The rules are RFC 5681's (Draft Standard, updated by RFC 9438; read on
// 2026-10-26), section 3.1 unless marked:
//   1. The initial window: IW = 4 x SMSS when SMSS <= 1,095 bytes, 3 x SMSS
//      when SMSS <= 2,190 bytes, 2 x SMSS above that, as an upper bound; one
//      segment when the SYN or SYN/ACK was lost. As an option, RFC 6928's
//      larger bound, min(10 x SMSS, max(2 x SMSS, 14,600 bytes)) (RFC 6928,
//      section 2; an Experimental RFC, its status at the RFC Editor on
//      2026-10-26). The lab uses each bound as the window.
//   2. Slow start while cwnd < ssthresh: each ACK for new data adds at most
//      SMSS, so with one ACK per segment a full window of ACKs doubles cwnd in
//      one round trip. The lab stops the doubling at ssthresh: an increase may
//      be smaller than SMSS, and slow start may end when cwnd reaches ssthresh.
//   3. Congestion avoidance while cwnd > ssthresh: about one SMSS per round
//      trip and never more; at cwnd = ssthresh either algorithm is allowed and
//      the lab uses congestion avoidance. The lab adds exactly SMSS per round.
//   4. On a loss, ssthresh = max(FlightSize / 2, 2 x SMSS) (equation 4),
//      FlightSize being the data sent and not yet acknowledged: here the
//      whole window of the round with the loss. Integer bytes, rounded down
//      ("no more than" the equation's value).
//   5. Found by three duplicate ACKs (section 3.2): the missing segment is
//      retransmitted, cwnd = ssthresh + 3 x SMSS (inflated by the three
//      segments that left the network), one SMSS more per further duplicate
//      ACK; when the ACK for new data arrives, one round trip later, cwnd =
//      ssthresh (deflated) and congestion avoidance continues.
//   6. Found by the retransmission timer: cwnd = the loss window, one
//      full-sized segment, whatever IW was, and slow start runs again up to
//      the new ssthresh.
// A window of one segment cannot produce a duplicate ACK (only an arriving
// segment makes the receiver send one, section 3.2), so a loss in such a
// window is found by the timer whatever the reader picked; the lab says so.
// What the model leaves out (the lab's scope note): CUBIC (RFC 9438) and every
// other algorithm, the receiver's window, delayed ACKs, the per-ACK inflation
// count during fast recovery, limited transmit, several losses, SACK, the
// duration of the retransmission timeout and the wait it costs.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The initial window rule: RFC 5681's bound, RFC 6928's larger bound, or one segment after a lost SYN or SYN/ACK. */
export type IwRule = "rfc5681" | "rfc6928" | "one";
/** Every value the initial window control can take. */
export const IW_RULES: readonly IwRule[] = ["rfc5681", "rfc6928", "one"];
/** How the loss is detected. */
export type Detection = "dupacks" | "timeout";
/** Every value the detection control can take. */
export const DETECTIONS: readonly Detection[] = ["dupacks", "timeout"];

/** The largest SMSS the lab accepts, in bytes (the MSS option's 16-bit field). */
export const MAX_SMSS = 65535;
/** The largest initial ssthresh the lab accepts, in bytes (1 GiB, the largest window RFC 7323 allows). */
export const MAX_SSTHRESH = 1073741824;
/** The latest round trip the loss can be placed in. */
export const MAX_LOSS_ROUND = 20;
/** The rounds shown when there is no loss. */
export const ROUNDS_NO_LOSS = 12;
/** The rounds shown after the round with the loss, at least. */
export const ROUNDS_AFTER_LOSS = 8;
/** The most rounds the table ever shows. */
export const MAX_ROUNDS = 40;

/** The reader's settings. */
export interface CwndInput {
  /** The sender maximum segment size, in whole bytes. */
  smss: number;
  /** The initial window rule. */
  iw: IwRule;
  /** The initial slow start threshold, in whole bytes. */
  ssthresh: number;
  /** The round trip in which one segment is lost, 1 to 20; 0 for no loss. */
  lossRound: number;
  /** How the loss is detected. */
  detection: Detection;
}

/** What governs a round. */
export type Phase = "slow-start" | "avoidance" | "recovery";

/** What happened at the start of a round, if anything worth naming. */
export type RoundEvent = "initial" | "doubled" | "capped" | "added" | "fast-retransmit" | "deflated" | "timeout";

/** One round trip in the table. */
export interface Round {
  /** Its number, from 1. */
  n: number;
  /** cwnd at its start, in bytes. */
  cwnd: number;
  /** ssthresh at its start, in bytes. */
  ssthresh: number;
  /** The algorithm in charge. */
  phase: Phase;
  /** What set cwnd for this round. */
  event: RoundEvent;
  /** True for the round in which the segment is lost. */
  loss: boolean;
}

/** One way of finding the loss, worked out in full for the comparison. */
export interface LossPath {
  /** The detection actually used (a one-segment window forces the timer). */
  detection: Detection;
  /** ssthresh after the loss, in bytes. */
  ssthresh: number;
  /** cwnd in the first round after the loss, in bytes. */
  firstCwnd: number;
  /** The first round after the loss whose cwnd is back at ssthresh. */
  backRound: number;
  /** The rounds, from the first to the last shown. */
  rounds: Round[];
}

/** The model's answer. */
export interface CwndResult {
  /** The initial window, in bytes. */
  iwBytes: number;
  /** The rounds of the detection in use. */
  rounds: Round[];
  /** The window of the round with the loss, the FlightSize at detection, or null with no loss. */
  flightSize: number | null;
  /** The detection in use, or null with no loss. */
  detection: Detection | null;
  /** True when the reader picked duplicate ACKs but a one-segment window forced the timer. */
  forcedTimeout: boolean;
  /** The path of the detection in use, or null with no loss. */
  used: LossPath | null;
  /** The other detection's path, for the comparison, or null with no loss or when the timer was forced. */
  other: LossPath | null;
  /** The first round in slow start whose cwnd reached ssthresh before any loss, or null. */
  firstCapRound: number | null;
}

/** The stable codes an invalid input is refused with. */
export type CwndErrorCode = "bad-smss" | "bad-ssthresh" | "bad-loss-round" | "bad-choice";

/** The error a refused input throws, with its stable code. */
export class CwndError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: CwndErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: CwndErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when a value is a whole number from min to max. */
function wholeIn(v: unknown, min: number, max: number): v is number {
  // A finite integer inside the bounds.
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

/** The initial window in bytes for a rule and an SMSS (rule 1). */
export function initialWindow(rule: IwRule, smss: number): number {
  // One segment after a lost SYN or SYN/ACK.
  if (rule === "one") return smss;
  // RFC 6928, equation (1): min(10*MSS, max(2*MSS, 14600)).
  if (rule === "rfc6928") return Math.min(10 * smss, Math.max(2 * smss, 14600));
  // RFC 5681: 2 segments above 2,190 bytes.
  if (smss > 2190) return 2 * smss;
  // 3 segments above 1,095 bytes.
  if (smss > 1095) return 3 * smss;
  // 4 segments otherwise.
  return 4 * smss;
}

/** The next round's cwnd and what set it, with no loss in the current round (rules 2 and 3). */
function grow(cwnd: number, ssthresh: number, smss: number): { cwnd: number; event: RoundEvent } {
  // Slow start: a full window of ACKs doubles cwnd, stopped at ssthresh.
  if (cwnd < ssthresh) {
    // The doubled window.
    const doubled = 2 * cwnd;
    // Past ssthresh: stop there.
    return doubled >= ssthresh ? { cwnd: ssthresh, event: "capped" } : { cwnd: doubled, event: "doubled" };
  }
  // Congestion avoidance: one SMSS per round trip.
  return { cwnd: cwnd + smss, event: "added" };
}

/** The phase that governs a round starting at this cwnd (at equality the lab uses congestion avoidance). */
function phaseOf(cwnd: number, ssthresh: number): Phase {
  // Below ssthresh: slow start; at or above: congestion avoidance.
  return cwnd < ssthresh ? "slow-start" : "avoidance";
}

/** Run the rounds from a given start until the last round, with no further loss. */
function runOn(rounds: Round[], from: number, last: number, smss: number): void {
  // Each following round grows from the one before.
  for (let n = from; n <= last; n++) {
    // The round before.
    const prev = rounds[rounds.length - 1];
    // A recovery round is followed by the deflation (handled by the caller), so here prev is ordinary.
    const g = grow(prev.cwnd, prev.ssthresh, smss);
    // The new round.
    rounds.push({ n, cwnd: g.cwnd, ssthresh: prev.ssthresh, phase: phaseOf(g.cwnd, prev.ssthresh), event: g.event, loss: false });
  }
}

/** Work out one loss path from the rounds up to and including the loss. */
function lossPath(before: Round[], detection: Detection, smss: number, lastRound: number): LossPath {
  // The round with the loss.
  const lossR = before[before.length - 1];
  // Rule 4: ssthresh = max(FlightSize / 2, 2 x SMSS), whole bytes rounded down.
  const ss = Math.max(Math.floor(lossR.cwnd / 2), 2 * smss);
  // The rounds so far, copied.
  const rounds = before.map((r) => ({ ...r }));
  // The loss round's number.
  const L = lossR.n;
  // The round in which cwnd is back at ssthresh.
  let backRound: number;
  // cwnd in the first round after the loss.
  let firstCwnd: number;
  if (detection === "dupacks") {
    // Rule 5: the third duplicate ACK, one round trip later: retransmit, inflate.
    firstCwnd = ss + 3 * smss;
    // The recovery round.
    rounds.push({ n: L + 1, cwnd: firstCwnd, ssthresh: ss, phase: "recovery", event: "fast-retransmit", loss: false });
    // The ACK for new data, one round trip after the retransmission: deflate to ssthresh.
    rounds.push({ n: L + 2, cwnd: ss, ssthresh: ss, phase: phaseOf(ss, ss), event: "deflated", loss: false });
    // Back at ssthresh two rounds after the loss.
    backRound = L + 2;
    // Congestion avoidance from there.
    runOn(rounds, L + 3, lastRound, smss);
  } else {
    // Rule 6: the timer: cwnd = the loss window, one SMSS, and slow start again.
    firstCwnd = smss;
    // The first round after the timer.
    rounds.push({ n: L + 1, cwnd: smss, ssthresh: ss, phase: phaseOf(smss, ss), event: "timeout", loss: false });
    // Slow start and congestion avoidance from there.
    runOn(rounds, L + 2, lastRound, smss);
    // The first round whose cwnd has reached ssthresh again: one SMSS doubled until it gets there (counted, so it holds past the table's end too).
    backRound = L + 1 + roundsToRecover(ss, smss);
  }
  // The finished path.
  return { detection, ssthresh: ss, firstCwnd, backRound, rounds };
}

/** The round trips after a timeout until cwnd reaches ssthresh again, from one SMSS by doubling. */
function roundsToRecover(ss: number, smss: number): number {
  // The count of rounds after the first one.
  let k = 0;
  // The window, starting at one segment.
  let w = smss;
  // Double until ssthresh is reached (the lab caps the last step at ssthresh).
  while (w < ss) {
    // One more round.
    w *= 2;
    // Counted.
    k++;
  }
  // The number of rounds.
  return k;
}

/** Follow cwnd and ssthresh round by round. */
export function compute(input: CwndInput): CwndResult {
  // SMSS: a whole number of bytes from 1 to 65,535.
  if (!wholeIn(input.smss, 1, MAX_SMSS)) throw new CwndError("bad-smss", `SMSS must be a whole number of bytes from 1 to ${MAX_SMSS}: ${String(input.smss)}`);
  // ssthresh: a whole number of bytes from 1 to 1 GiB.
  if (!wholeIn(input.ssthresh, 1, MAX_SSTHRESH)) throw new CwndError("bad-ssthresh", `ssthresh must be a whole number of bytes from 1 to ${MAX_SSTHRESH}: ${String(input.ssthresh)}`);
  // The loss round: 0 for none, or 1 to 20.
  if (!wholeIn(input.lossRound, 0, MAX_LOSS_ROUND)) throw new CwndError("bad-loss-round", `loss round must be a whole number from 0 to ${MAX_LOSS_ROUND}: ${String(input.lossRound)}`);
  // The two selects.
  if (!IW_RULES.includes(input.iw) || !DETECTIONS.includes(input.detection)) throw new CwndError("bad-choice", `not a lab option: ${String(input.iw)}, ${String(input.detection)}`);
  // The SMSS.
  const smss = input.smss;
  // Rule 1: the initial window.
  const iwBytes = initialWindow(input.iw, smss);
  // Round 1 starts at IW, with the reader's ssthresh.
  const rounds: Round[] = [{ n: 1, cwnd: iwBytes, ssthresh: input.ssthresh, phase: phaseOf(iwBytes, input.ssthresh), event: "initial", loss: false }];
  // No loss: grow for the fixed number of rounds.
  if (input.lossRound === 0) {
    // Rounds 2 to 12.
    runOn(rounds, 2, ROUNDS_NO_LOSS, smss);
    // The first round slow start stopped at ssthresh, if it did.
    const cap = rounds.find((r) => r.event === "capped");
    // The answer without a loss.
    return { iwBytes, rounds, flightSize: null, detection: null, forcedTimeout: false, used: null, other: null, firstCapRound: cap ? cap.n : null };
  }
  // Grow up to the round with the loss.
  runOn(rounds, 2, input.lossRound, smss);
  // Mark it.
  rounds[rounds.length - 1].loss = true;
  // The window of that round: the FlightSize when the loss is detected.
  const flightSize = rounds[rounds.length - 1].cwnd;
  // A window of one segment leaves nothing behind the lost one to trigger a duplicate ACK: the timer finds it.
  const forcedTimeout = input.detection === "dupacks" && flightSize <= smss;
  // The detection actually in use.
  const detection: Detection = forcedTimeout ? "timeout" : input.detection;
  // ssthresh after the loss (rule 4), the same for both detections.
  const ss = Math.max(Math.floor(flightSize / 2), 2 * smss);
  // Enough rounds to show the slower recovery (the timer's) and a round of congestion avoidance after it, within the cap.
  const lastRound = Math.min(MAX_ROUNDS, Math.max(input.lossRound + ROUNDS_AFTER_LOSS, input.lossRound + 1 + roundsToRecover(ss, smss) + 1));
  // The path in use.
  const used = lossPath(rounds, detection, smss, lastRound);
  // The other path, for the comparison, unless the timer was the only possibility.
  const other = forcedTimeout ? null : lossPath(rounds, detection === "dupacks" ? "timeout" : "dupacks", smss, lastRound);
  // The first round slow start stopped at ssthresh before the loss, if it did.
  const cap = rounds.find((r) => r.event === "capped");
  // The answer.
  return { iwBytes, rounds: used.rounds, flightSize, detection, forcedTimeout, used, other, firstCapRound: cap ? cap.n : null };
}

/** The lab's opening state: 1,460-byte segments, RFC 5681's window, ssthresh at 64 KiB less one byte, a loss in round 8 found by three duplicate ACKs. */
export const DEFAULT_INPUT: CwndInput = { smss: 1460, iw: "rfc5681", ssthresh: 65535, lossRound: 8, detection: "dupacks" };

/** The Example button's state: the same loss found by the retransmission timer instead. */
export const EXAMPLE_INPUT: CwndInput = { smss: 1460, iw: "rfc5681", ssthresh: 65535, lossRound: 8, detection: "timeout" };
