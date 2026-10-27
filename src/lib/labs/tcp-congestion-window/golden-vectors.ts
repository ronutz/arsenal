// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcp-congestion-window/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the TCP congestion window lab (set 2026-10-26a). Every
// number is worked by hand from RFC 5681 (sections 3.1 and 3.2) and RFC 6928
// (section 2), read on 2026-10-26:
//   - the initial window at the thresholds 1,095 and 2,190 bytes: 4, 3 and 2
//     segments (536 -> 2,144; 1,095 -> 4,380; 1,096 -> 3,288; 2,190 -> 6,570;
//     2,191 -> 4,382), and RFC 6928's min(10 x SMSS, max(2 x SMSS, 14,600))
//     (1,460 -> 14,600; 2,190 -> 14,600; 9,000 -> 18,000; 536 -> 5,360);
//   - the opening case: 4,380 doubling to 8,760, 17,520 and 35,040, stopped at
//     ssthresh 65,535 in round 5, then +1,460 a round to 69,915 in round 8,
//     the loss: ssthresh = max(floor(69,915 / 2), 2 x 1,460) = 34,957;
//   - found by three duplicate ACKs: 34,957 + 3 x 1,460 = 39,337 in round 9,
//     deflated to 34,957 in round 10, 36,417 in round 11;
//   - found by the timer: 1,460 in round 9, then 2,920, 5,840, 11,680, 23,360
//     and 34,957 (stopped at ssthresh) in round 14, four rounds later than
//     the duplicate ACKs' round 10;
//   - a one-segment window (the lost-SYN rule) cannot raise a duplicate ACK,
//     so its loss is found by the timer, and ssthresh falls to 2 x SMSS.
// Reject vectors pin the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, CwndError, initialWindow, type CwndErrorCode, type CwndInput, type IwRule } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "tcp-congestion-window/2026-10-26a";

/** An initial-window case: rule, SMSS, expected bytes. */
type IwVector = readonly [IwRule, number, number];

/** A whole-run case: the cwnd of every round shown, and the summary fields. */
interface RunVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: CwndInput;
  /** cwnd at the start of each round, from round 1. */
  cwnd: readonly number[];
  /** ssthresh after the loss, or null with no loss. */
  ssthreshAfter: number | null;
  /** The detection in use, or null with no loss. */
  detection: "dupacks" | "timeout" | null;
  /** True when the timer was forced. */
  forcedTimeout: boolean;
  /** The round cwnd is back at ssthresh on the path in use, or null with no loss. */
  backRound: number | null;
  /** The same on the other path, or null. */
  otherBackRound: number | null;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (the interface's parser can produce every one of them). */
  input: CwndInput;
  /** The code the refusal must carry. */
  code: CwndErrorCode;
}

/** The initial-window cases, at and around RFC 5681's thresholds and with RFC 6928's bound. */
export const IW_VECTORS: readonly IwVector[] = Object.freeze([
  ["rfc5681", 536, 2144],
  ["rfc5681", 1095, 4380],
  ["rfc5681", 1096, 3288],
  ["rfc5681", 1460, 4380],
  ["rfc5681", 2190, 6570],
  ["rfc5681", 2191, 4382],
  ["rfc6928", 536, 5360],
  ["rfc6928", 1460, 14600],
  ["rfc6928", 2190, 14600],
  ["rfc6928", 9000, 18000],
  ["one", 1460, 1460],
] as const);

/** The whole-run cases. */
export const CWND_RUNS: readonly RunVector[] = Object.freeze([
  // The opening case: the loss in round 8 found by three duplicate ACKs.
  {
    id: "default-dupacks",
    input: { smss: 1460, iw: "rfc5681", ssthresh: 65535, lossRound: 8, detection: "dupacks" },
    cwnd: [4380, 8760, 17520, 35040, 65535, 66995, 68455, 69915, 39337, 34957, 36417, 37877, 39337, 40797, 42257, 43717],
    ssthreshAfter: 34957,
    detection: "dupacks",
    forcedTimeout: false,
    backRound: 10,
    otherBackRound: 14,
  },
  // The Example: the same loss found by the retransmission timer.
  {
    id: "example-timeout",
    input: { smss: 1460, iw: "rfc5681", ssthresh: 65535, lossRound: 8, detection: "timeout" },
    cwnd: [4380, 8760, 17520, 35040, 65535, 66995, 68455, 69915, 1460, 2920, 5840, 11680, 23360, 34957, 36417, 37877],
    ssthreshAfter: 34957,
    detection: "timeout",
    forcedTimeout: false,
    backRound: 14,
    otherBackRound: 10,
  },
  // A loss during slow start with RFC 6928's window and a very high ssthresh: half of 233,600 is 116,800.
  {
    id: "rfc6928-slow-start-loss",
    input: { smss: 1460, iw: "rfc6928", ssthresh: 1073741824, lossRound: 5, detection: "dupacks" },
    cwnd: [14600, 29200, 58400, 116800, 233600, 121180, 116800, 118260, 119720, 121180, 122640, 124100, 125560, 127020],
    ssthreshAfter: 116800,
    detection: "dupacks",
    forcedTimeout: false,
    backRound: 7,
    otherBackRound: 13,
  },
  // One segment in flight: no duplicate ACK can come back, so the timer finds the loss; ssthresh floors at 2 x SMSS.
  {
    id: "one-segment-forced-timeout",
    input: { smss: 1460, iw: "one", ssthresh: 65535, lossRound: 1, detection: "dupacks" },
    cwnd: [1460, 1460, 2920, 4380, 5840, 7300, 8760, 10220, 11680],
    ssthreshAfter: 2920,
    detection: "timeout",
    forcedTimeout: true,
    backRound: 3,
    otherBackRound: null,
  },
  // No loss, small segments: 4 x 536 doubling to ssthresh in round 6, then +536 a round.
  {
    id: "no-loss-536",
    input: { smss: 536, iw: "rfc5681", ssthresh: 65535, lossRound: 0, detection: "dupacks" },
    cwnd: [2144, 4288, 8576, 17152, 34304, 65535, 66071, 66607, 67143, 67679, 68215, 68751],
    ssthreshAfter: null,
    detection: null,
    forcedTimeout: false,
    backRound: null,
    otherBackRound: null,
  },
  // ssthresh below the initial window: congestion avoidance from the first round, one SMSS a round.
  {
    id: "ssthresh-below-iw",
    input: { smss: 1000, iw: "rfc5681", ssthresh: 2000, lossRound: 0, detection: "dupacks" },
    cwnd: [4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000],
    ssthreshAfter: null,
    detection: null,
    forcedTimeout: false,
    backRound: null,
    otherBackRound: null,
  },
]);

/** The reject cases. */
export const CWND_REJECTS: readonly RejectVector[] = Object.freeze([
  // An SMSS of zero.
  { id: "bad-smss-zero", input: { smss: 0, iw: "rfc5681", ssthresh: 65535, lossRound: 0, detection: "dupacks" }, code: "bad-smss" },
  // A fractional SMSS.
  { id: "bad-smss-fraction", input: { smss: 1460.5, iw: "rfc5681", ssthresh: 65535, lossRound: 0, detection: "dupacks" }, code: "bad-smss" },
  // An ssthresh past 1 GiB.
  { id: "bad-ssthresh", input: { smss: 1460, iw: "rfc5681", ssthresh: 1073741825, lossRound: 0, detection: "dupacks" }, code: "bad-ssthresh" },
  // A loss round past 20.
  { id: "bad-loss-round", input: { smss: 1460, iw: "rfc5681", ssthresh: 65535, lossRound: 21, detection: "dupacks" }, code: "bad-loss-round" },
  // An initial window rule the control cannot produce.
  { id: "bad-choice", input: { smss: 1460, iw: "rfc3390" as unknown as IwRule, ssthresh: 65535, lossRound: 0, detection: "dupacks" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // The initial windows.
  for (const [rule, smss, want] of IW_VECTORS) {
    // The model's window.
    const got = initialWindow(rule, smss);
    // Compared exactly.
    if (got !== want) failures.push(`iw ${rule} ${smss}: ${got}, expected ${want}`);
  }
  // The runs.
  for (const v of CWND_RUNS) {
    // The model's answer.
    const r = compute(v.input);
    // Every round's cwnd, as one list.
    const got = r.rounds.map((x) => x.cwnd).join(",");
    // Compared as one string.
    if (got !== v.cwnd.join(",")) failures.push(`${v.id}: cwnd ${got}, expected ${v.cwnd.join(",")}`);
    // ssthresh after the loss.
    const ss = r.used ? r.used.ssthresh : null;
    // Compared.
    if (ss !== v.ssthreshAfter) failures.push(`${v.id}: ssthresh after ${String(ss)}, expected ${String(v.ssthreshAfter)}`);
    // The detection in use.
    if (r.detection !== v.detection) failures.push(`${v.id}: detection ${String(r.detection)}, expected ${String(v.detection)}`);
    // The forced timer.
    if (r.forcedTimeout !== v.forcedTimeout) failures.push(`${v.id}: forcedTimeout ${r.forcedTimeout}, expected ${v.forcedTimeout}`);
    // The round back at ssthresh.
    const back = r.used ? r.used.backRound : null;
    // Compared.
    if (back !== v.backRound) failures.push(`${v.id}: back in round ${String(back)}, expected ${String(v.backRound)}`);
    // The same on the other path.
    const otherBack = r.other ? r.other.backRound : null;
    // Compared.
    if (otherBack !== v.otherBackRound) failures.push(`${v.id}: other back in round ${String(otherBack)}, expected ${String(v.otherBackRound)}`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of CWND_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof CwndError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = IW_VECTORS.length + CWND_RUNS.length + CWND_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
