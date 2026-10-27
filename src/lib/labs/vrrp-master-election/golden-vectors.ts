// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/vrrp-master-election/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the VRRP election lab (set 2026-10-26a). Every timer is
// worked by hand from RFC 9568, section 6.1: Skew_Time = ((256 - Priority) *
// Active_Adver_Interval) / 256 and Active_Down_Interval = 3 * interval +
// Skew_Time, in centiseconds; at the default interval of 100 that gives the
// article's own table (254: 300.78125; 200: 321.875; 100: 360.9375; 1:
// 399.609375) and its 1-centisecond case (254: 3.0078125). Every election is
// worked from the state machine of section 6.4 (startup, Backup and Active
// states). Each case is compared as a short summary string of the steps, so a
// drift in any step, time or tie shows. Reject vectors pin the stable error
// codes. verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on any drift.
// ============================================================================

import { compute, VrrpError, type VrrpErrorCode, type VrrpInput, type VrrpResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "vrrp-master-election/2026-10-26a";

/** The compared summary of a result: each part a short string, so a mismatch names what drifted. */
interface Summary {
  /** The outcome of every step, in order, joined by spaces. */
  outcomes: string;
  /** The Active Router after every step (R1..R4, or "none"), joined by spaces. */
  actives: string;
  /** How long every step took in centiseconds ("-" when nothing changed), joined by spaces. */
  times: string;
  /** The routers that tied in each step ("-" when none), joined by spaces. */
  tied: string;
  /** Each router's Active_Down_Interval in centiseconds, joined by spaces. */
  downs: string;
  /** Each router's final state, joined by spaces. */
  states: string;
  /** The best running router after the last event (R1..R4, or "none"). */
  best: string;
  /** The runner-up of each step (R1..R4, or "-"). */
  runners: string;
}

/** A router index as its name. */
function name(i: number | null): string {
  // Null is no router.
  return i === null ? "none" : `R${i + 1}`;
}

/** Reduce a result to its compared summary. */
export function summarise(r: VrrpResult): Summary {
  // Each part, in the order the account shows it.
  return {
    // The rules that decided each step.
    outcomes: r.steps.map((s) => s.outcome).join(" "),
    // Who was Active after each step.
    actives: r.steps.map((s) => name(s.active)).join(" "),
    // The time each change took.
    times: r.steps.map((s) => (s.timeCs === null ? "-" : String(s.timeCs))).join(" "),
    // The ties.
    tied: r.steps.map((s) => (s.tied.length ? s.tied.map((i) => name(i)).join("+") : "-")).join(" "),
    // The routers' timers.
    downs: r.rows.map((row) => String(row.downCs)).join(" "),
    // The routers' final states.
    states: r.rows.map((row) => row.finalState).join(" "),
    // The best running router.
    best: name(r.bestRunning),
    // The runner-up of each step.
    runners: r.steps.map((s) => (s.runnerUp === null ? "-" : name(s.runnerUp))).join(" "),
  };
}

/** A case the model must answer exactly so (every listed part compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: VrrpInput;
  /** The parts of the summary that must match. */
  expect: Partial<Summary>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: VrrpInput;
  /** The code the refusal must carry. */
  code: VrrpErrorCode;
}

/** The common shape of most cases: two routers, default interval, preemption on, nobody held back. */
const base: VrrpInput = { routers: 2, priorities: [200, 100, 100, 100], preempt: true, intervalCs: 100, late: "none", events: ["none", "none", "none"] };

/** The accept cases. */
export const VRRP_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: R1 (200) wins at start after 321.875 cs; it fails and R2 (100) waits 360.9375 cs; R1 returns and preempts after its own 321.875 cs.
  { id: "default-fail-and-preempt", input: { ...base, events: ["fail", "start1", "none"] }, expect: { outcomes: "elected-at-start failover preempts", actives: "R1 R2 R1", times: "321.875 360.9375 321.875", tied: "- - -", downs: "321.875 360.9375", states: "active backup", best: "R1" } },
  // The Example: preemption off; R2 (150) beats R3 (100) on skew, 341.40625 against 360.9375, and keeps the gateway when R1 (200) returns.
  { id: "example-no-preempt", input: { ...base, routers: 3, priorities: [200, 150, 100, 100], preempt: false, events: ["fail", "start1", "none"] }, expect: { outcomes: "elected-at-start failover stays-no-preempt", actives: "R1 R2 R2", times: "321.875 341.40625 -", downs: "321.875 341.40625 360.9375", states: "backup active backup", best: "R1", runners: "R2 R3 -" } },
  // A clean shutdown sends priority 0: the Backup takes over after Skew_Time alone, 60.9375 cs at priority 100.
  { id: "shutdown-skew-only", input: { ...base, events: ["shutdown", "none", "none"] }, expect: { outcomes: "elected-at-start shutdown-handover", actives: "R1 R2", times: "321.875 60.9375", states: "down active", runners: "R2 -" } },
  // All three at the default 100: they time out together, all become Active, and the highest address, R3, stays.
  { id: "tie-at-start", input: { ...base, routers: 3, priorities: [100, 100, 100, 100] }, expect: { outcomes: "elected-at-start", actives: "R3", times: "360.9375", tied: "R1+R2+R3", states: "backup backup active" } },
  // A tie between the two Backups after a failure: R3 (192.0.2.4) beats R2 (192.0.2.3).
  { id: "tie-at-failover", input: { ...base, routers: 3, priorities: [200, 150, 150, 100], events: ["fail", "none", "none"] }, expect: { outcomes: "elected-at-start failover", actives: "R1 R3", times: "321.875 341.40625", tied: "- R2+R3", runners: "R3 -" } },
  // A later router of equal priority and a higher address stays Backup: "greater than or equal" resets its timer.
  { id: "equal-newcomer-stays", input: { ...base, priorities: [100, 100, 100, 100], late: "2", events: ["start2", "none", "none"] }, expect: { outcomes: "elected-at-start stays-equal", actives: "R1 R1", times: "360.9375 -", states: "active backup", best: "R2" } },
  // The owner is Active at once, loses it on failure, and takes it back at once even with preemption off.
  { id: "owner-always-preempts", input: { ...base, priorities: [255, 200, 100, 100], preempt: false, events: ["fail", "start1", "none"] }, expect: { outcomes: "owner-at-start failover owner-preempts", actives: "R1 R2 R1", times: "0 321.875 0", downs: "300.390625 321.875" } },
  // A higher-priority router joining late, preemption on: it takes over one Active_Down_Interval after it starts.
  { id: "late-joiner-preempts", input: { ...base, routers: 3, priorities: [100, 150, 250, 100], late: "3", events: ["start3", "none", "none"] }, expect: { outcomes: "elected-at-start preempts", actives: "R2 R3", times: "341.40625 302.34375" } },
  // The same joiner with preemption off stays Backup.
  { id: "late-joiner-no-preempt", input: { ...base, routers: 3, priorities: [100, 150, 250, 100], preempt: false, late: "3", events: ["start3", "none", "none"] }, expect: { outcomes: "elected-at-start stays-no-preempt", actives: "R2 R2", best: "R3" } },
  // A lower-priority router starting finds a higher-priority Active Router and stays Backup.
  { id: "lower-newcomer-stays", input: { ...base, late: "2", events: ["start2", "none", "none"] }, expect: { outcomes: "elected-at-start stays-lower", actives: "R1 R1" } },
  // Both fail: nobody is left; the third event finds nothing to stop.
  { id: "none-left", input: { ...base, events: ["fail", "fail", "fail"] }, expect: { outcomes: "elected-at-start failover none-left nothing-to-stop", actives: "R1 R2 none none", times: "321.875 360.9375 - -", states: "down down", best: "none" } },
  // Back from nothing: R2 starts alone and its timer, unanswered, makes it Active after 360.9375 cs.
  { id: "start-alone", input: { ...base, events: ["fail", "fail", "start2"] }, expect: { outcomes: "elected-at-start failover none-left start-alone", actives: "R1 R2 none R2", times: "321.875 360.9375 - 360.9375" } },
  // The owner starting into an empty group is Active at once.
  { id: "owner-alone", input: { ...base, priorities: [255, 100, 100, 100], events: ["fail", "fail", "start1"] }, expect: { outcomes: "owner-at-start failover none-left owner-alone", actives: "R1 R2 none R1", times: "0 360.9375 - 0" } },
  // Starting a router that is already running changes nothing.
  { id: "already-running", input: { ...base, events: ["start2", "none", "none"] }, expect: { outcomes: "elected-at-start already-running", actives: "R1 R1", times: "321.875 -" } },
  // The article's sub-second case: interval 1 cs, priority 254 waits 3.0078125 cs.
  { id: "one-centisecond", input: { ...base, priorities: [254, 1, 100, 100], intervalCs: 1 }, expect: { downs: "3.0078125 3.99609375", times: "3.0078125" } },
  // The slowest Backup at the default interval: priority 1 waits 399.609375 cs, under the 4 seconds section 3 promises.
  { id: "priority-one", input: { ...base, priorities: [254, 1, 100, 100], events: ["fail", "none", "none"] }, expect: { downs: "300.78125 399.609375", times: "300.78125 399.609375" } },
  // The longest interval erratum 8301 allows: 4095 cs at priority 100 is 14780.390625 cs.
  { id: "max-interval", input: { ...base, priorities: [100, 100, 100, 100], intervalCs: 4095 }, expect: { downs: "14780.390625 14780.390625", tied: "R1+R2", actives: "R2" } },
]);

/** The reject cases. */
export const VRRP_REJECTS: readonly RejectVector[] = Object.freeze([
  // Five routers.
  { id: "bad-routers", input: { ...base, routers: 5 }, code: "bad-routers" },
  // Priority 0 is reserved for an Active Router that is relinquishing.
  { id: "bad-priority-zero", input: { ...base, priorities: [0, 100, 100, 100] }, code: "bad-priority" },
  // A blank field reaches the model as NaN.
  { id: "bad-priority-blank", input: { ...base, priorities: [200, Number.NaN, 100, 100] }, code: "bad-priority" },
  // Two owners on one link.
  { id: "two-owners", input: { ...base, priorities: [255, 255, 100, 100] }, code: "two-owners" },
  // An interval of zero: the "mayhem" of erratum 8301.
  { id: "bad-interval-zero", input: { ...base, intervalCs: 0 }, code: "bad-interval" },
  // Beyond the 12-bit field.
  { id: "bad-interval-big", input: { ...base, intervalCs: 4096 }, code: "bad-interval" },
  // Holding back a router the group does not have.
  { id: "bad-late", input: { ...base, late: "3" }, code: "bad-late" },
  // Starting a router the group does not have.
  { id: "bad-event", input: { ...base, events: ["start3", "none", "none"] }, code: "bad-event" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute, summarise and compare every expected part.
  for (const v of VRRP_VECTORS) {
    // The model's answer, summarised.
    const got = summarise(compute(v.input));
    // Each expected part in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that part.
      const have = got[k as keyof Summary];
      // A difference is a failure naming the case and the part.
      if (have !== want) failures.push(`${v.id}: ${k} is "${have}", expected "${want}"`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of VRRP_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof VrrpError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = VRRP_VECTORS.length + VRRP_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several parts, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
