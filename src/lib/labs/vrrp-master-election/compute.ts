// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/vrrp-master-election/compute.ts
// ----------------------------------------------------------------------------
// THE VRRP ELECTION LAB'S MODEL (2026-10-26), the interactive companion of the
// article "First-hop redundancy: VRRP, HSRP, and the gateway that is a
// fiction". Two to four routers, R1 to R4, back up one virtual router on one
// LAN. Their primary addresses rise with their numbers (192.0.2.2 to
// 192.0.2.5, the documentation range of RFC 5737), so a tie on priority is
// broken in favour of the higher-numbered router. The reader sets each
// router's priority (255 makes it the address owner), Preempt_Mode, the
// Advertisement_Interval, which router (if any) is not running at the start,
// and up to three events in order: the Active Router fails silently, the
// Active Router shuts down cleanly, or a router starts (joins, or comes back).
// The model runs RFC 9568's state machine through them and says, after the
// start and after every event, which router is Active, the rule that decided
// it, and how long the change took.
//
// The rules, all from RFC 9568 (VRRP version 3, April 2024, which obsoletes
// RFC 5798; read on rfc-editor.org on 2026-10-26, together with its six
// verified errata, none of which touches these rules except 8301, the 1 to
// 4095 range of the interval):
//   1. Priority 255 is reserved for the address owner; Backups use 1 to 254;
//      0 is reserved for an Active Router that is relinquishing (section 6.1).
//   2. Skew_Time = ((256 - Priority) * Active_Adver_Interval) / 256 and
//      Active_Down_Interval = (3 * Active_Adver_Interval) + Skew_Time, both in
//      centiseconds (section 6.1). RFC 5798 called them Master_Adver_Interval
//      and Master_Down_Interval. The RFC sets no rounding, so the model keeps
//      the exact value (it is always a whole number of 1/256 centisecond).
//   3. Startup (section 6.4.1): the owner sends an ADVERTISEMENT and becomes
//      Active at once; any other router becomes Backup with its
//      Active_Down_Timer set to Active_Down_Interval.
//   4. Backup (section 6.4.2): the router becomes Active when its
//      Active_Down_Timer fires. An ADVERTISEMENT with priority 0 sets the
//      timer to Skew_Time. Any other ADVERTISEMENT resets the timer if
//      Preempt_Mode is False or the advertised priority is greater than or
//      equal to the local one; otherwise (preemption on, lower priority) it
//      is discarded, so the timer runs out and the Backup takes over.
//   5. Active (section 6.4.3): a Shutdown sends an ADVERTISEMENT with
//      priority 0. An ADVERTISEMENT with a higher priority, or an equal one
//      from a higher primary address (unsigned comparison), sends the Active
//      Router back to Backup; Preempt_Mode is not considered in this state.
//   6. The owner always preempts, whatever Preempt_Mode says (section 6.1);
//      only one router SHOULD have priority 255 (section 8.3.2), so the lab
//      refuses two.
// Consequences the model shows, each a direct reading of those rules: after a
// silent failure the highest-priority Backup's timer fires first, one
// Active_Down_Interval after the last ADVERTISEMENT it heard; after a clean
// shutdown it fires after Skew_Time; a starting Backup with a higher priority
// and preemption on takes over one Active_Down_Interval after it starts; two
// Backups with the same top priority time out together, both become Active,
// and the rule of point 5 leaves the higher primary address Active; a Backup
// of equal priority that starts later stays Backup, because the address
// breaks ties only between Active Routers.
//
// What the model leaves out (the lab's scope note): propagation and queueing
// delay (simultaneous timers expire at the same instant here), mismatched
// intervals between routers, Accept_Mode, tracking and other vendor
// features, IPv6, the gratuitous ARP and how quickly switches relearn the
// MAC, and HSRP.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The most routers the lab offers. */
export const MAX_ROUTERS = 4;
/** The fewest routers the lab offers (one virtual router needs a Backup to be interesting). */
export const MIN_ROUTERS = 2;
/** The owner's priority (RFC 9568, section 6.1). */
export const OWNER_PRIORITY = 255;
/** The default Backup priority (RFC 9568, section 6.1). */
export const DEFAULT_PRIORITY = 100;
/** The default Advertisement_Interval, in centiseconds (RFC 9568, section 6.1). */
export const DEFAULT_INTERVAL_CS = 100;
/** The largest Advertisement_Interval, in centiseconds (RFC 9568, verified erratum 8301: 1 to 4095). */
export const MAX_INTERVAL_CS = 4095;
/** Each router's primary address (RFC 5737 documentation range), rising with its number. */
export const ADDRESSES: readonly string[] = Object.freeze(["192.0.2.2", "192.0.2.3", "192.0.2.4", "192.0.2.5"]);
/** The virtual router's address, the one the owner carries on its own interface. */
export const VIRTUAL_ADDRESS = "192.0.2.1";

/** An event, in the order the reader lists them: nothing, a silent failure, a clean shutdown, or router n starting. */
export type VrrpEvent = "none" | "fail" | "shutdown" | "start1" | "start2" | "start3" | "start4";
/** Every value an event control can take. */
export const EVENTS: readonly VrrpEvent[] = Object.freeze(["none", "fail", "shutdown", "start1", "start2", "start3", "start4"]);
/** The router held back at the start, or none. */
export type LateRouter = "none" | "1" | "2" | "3" | "4";
/** Every value the held-back control can take. */
export const LATE_VALUES: readonly LateRouter[] = Object.freeze(["none", "1", "2", "3", "4"]);

/** The reader's settings. */
export interface VrrpInput {
  /** How many routers take part, 2 to 4. */
  routers: number;
  /** Each router's priority, R1 first (only the first `routers` are read). */
  priorities: readonly number[];
  /** Preempt_Mode on every router (the owner preempts regardless). */
  preempt: boolean;
  /** Advertisement_Interval in centiseconds, the same on every router. */
  intervalCs: number;
  /** The router that is not running at the start, if any. */
  late: LateRouter;
  /** Up to three events, applied in order ("none" entries are skipped). */
  events: readonly VrrpEvent[];
}

/** One router in the result table. */
export interface RouterRow {
  /** 0-based index (R1 is 0). */
  index: number;
  /** Its configured priority. */
  priority: number;
  /** Its primary address. */
  address: string;
  /** True when it owns the virtual address (priority 255). */
  owner: boolean;
  /** Its Skew_Time in centiseconds. */
  skewCs: number;
  /** Its Active_Down_Interval in centiseconds. */
  downCs: number;
  /** Its state after the last event. */
  finalState: "active" | "backup" | "down";
}

/** How a change of Active Router was decided, for the account of each step. */
export type Outcome =
  // Startup: the owner is Active at once.
  | "owner-at-start"
  // Startup: no owner; the highest-priority Backup's timer fired first.
  | "elected-at-start"
  // A silent failure: the highest-priority Backup took over when its Active_Down_Timer fired.
  | "failover"
  // A clean shutdown: the highest-priority Backup took over after Skew_Time.
  | "shutdown-handover"
  // A failure or shutdown left no router running.
  | "none-left"
  // A failure or shutdown with no Active Router: nothing happened.
  | "nothing-to-stop"
  // A starting owner preempted at once.
  | "owner-preempts"
  // A starting owner found nobody Active and became Active at once.
  | "owner-alone"
  // A starting router found nobody Active and took over when its timer fired.
  | "start-alone"
  // A starting higher-priority router with preemption on took over when its timer fired.
  | "preempts"
  // A starting router stayed Backup: the Active Router's priority is higher.
  | "stays-lower"
  // A starting router stayed Backup: same priority as the Active Router.
  | "stays-equal"
  // A starting router stayed Backup: its priority is higher, but preemption is off.
  | "stays-no-preempt"
  // The router named was already running: nothing happened.
  | "already-running";

/** One step of the account: the start or one event. */
export interface Step {
  /** What happened: the start, or the event as listed. */
  event: "start" | VrrpEvent;
  /** The rule that decided it. */
  outcome: Outcome;
  /** The router the event concerned (the one that failed, shut down or started), if any. */
  subject: number | null;
  /** The Active Router after this step, or null when there is none. */
  active: number | null;
  /** The Active Router before this step, or null. */
  previous: number | null;
  /** How long the change took, in centiseconds, or null when nothing changed. */
  timeCs: number | null;
  /** The routers that tied on the top priority and timed out together (empty when there was no tie). */
  tied: number[];
  /** The best Backup below the winner's priority, whose timer would have fired next, or null. */
  runnerUp: number | null;
}

/** The model's answer. */
export interface VrrpResult {
  /** Every router, with its timers and final state. */
  rows: RouterRow[];
  /** The start and every listed event, in order. */
  steps: Step[];
  /** The Active Router after the last event, or null. */
  finalActive: number | null;
  /** The highest-priority running router after the last event (ties to the higher address), or null. */
  bestRunning: number | null;
}

/** The stable codes an invalid input is refused with. */
export type VrrpErrorCode = "bad-routers" | "bad-priority" | "two-owners" | "bad-interval" | "bad-late" | "bad-event";

/** An invalid input, refused with a stable code the interface can word. */
export class VrrpError extends Error {
  /** The stable code. */
  readonly code: VrrpErrorCode;
  /** The 0-based router the refusal concerns, when it concerns one. */
  readonly router: number | null;
  /** Build the refusal with its code, the router it concerns and an English message for logs. */
  constructor(code: VrrpErrorCode, router: number | null, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
    // The router, for the field to mark.
    this.router = router;
  }
}

/** Skew_Time in centiseconds: ((256 - Priority) * Active_Adver_Interval) / 256 (RFC 9568, section 6.1). */
export function skewTime(priority: number, intervalCs: number): number {
  // Exact: a multiple of 1/256, which a double holds without rounding.
  return ((256 - priority) * intervalCs) / 256;
}

/** Active_Down_Interval in centiseconds: (3 * Active_Adver_Interval) + Skew_Time (RFC 9568, section 6.1). */
export function activeDownInterval(priority: number, intervalCs: number): number {
  // Three intervals plus the router's skew.
  return 3 * intervalCs + skewTime(priority, intervalCs);
}

/** Map an event to the 0-based router it starts, or null for the other events. */
function startedRouter(e: VrrpEvent): number | null {
  // "startN" names router N.
  return e.startsWith("start") ? Number(e.slice(5)) - 1 : null;
}

/** Run the start and the events through RFC 9568's state machine. */
export function compute(input: VrrpInput): VrrpResult {
  // The router count must be one the lab offers.
  if (!Number.isInteger(input.routers) || input.routers < MIN_ROUTERS || input.routers > MAX_ROUTERS) throw new VrrpError("bad-routers", null, `routers must be 2 to 4, got ${String(input.routers)}`);
  // How many routers take part.
  const n = input.routers;
  // Each router's priority must be a whole number from 1 to 255 (0 is reserved for resigning).
  for (let i = 0; i < n; i++) {
    // The router's priority as given.
    const p = input.priorities[i];
    // Refused when it is not a whole number in range.
    if (!Number.isInteger(p) || p < 1 || p > OWNER_PRIORITY) throw new VrrpError("bad-priority", i, `R${i + 1}: priority must be 1 to 255, got ${String(p)}`);
  }
  // The priorities in use.
  const prio = input.priorities.slice(0, n);
  // At most one owner on the link (RFC 9568, section 8.3.2; erratum 8298 describes what two would do).
  if (prio.filter((p) => p === OWNER_PRIORITY).length > 1) throw new VrrpError("two-owners", prio.lastIndexOf(OWNER_PRIORITY), "only one router may have priority 255");
  // The interval must be a whole number of centiseconds from 1 to 4095 (erratum 8301).
  if (!Number.isInteger(input.intervalCs) || input.intervalCs < 1 || input.intervalCs > MAX_INTERVAL_CS) throw new VrrpError("bad-interval", null, `interval must be 1 to 4095 cs, got ${String(input.intervalCs)}`);
  // The held-back router must be none or one of the routers taking part.
  if (!LATE_VALUES.includes(input.late) || (input.late !== "none" && Number(input.late) > n)) throw new VrrpError("bad-late", null, `not a router of this group: ${String(input.late)}`);
  // Each event must be a known one and name a router taking part.
  for (const e of input.events) {
    // An unknown value, or a start of a router beyond the count, is refused.
    if (!EVENTS.includes(e) || (startedRouter(e) ?? 0) >= n) throw new VrrpError("bad-event", null, `not an event of this group: ${String(e)}`);
  }

  // The interval every router advertises and assumes.
  const iv = input.intervalCs;
  /** True when router i owns the virtual address. */
  const isOwner = (i: number): boolean => prio[i] === OWNER_PRIORITY;
  /** Order two routers: higher priority first, then the higher primary address (the higher index). */
  const better = (a: number, b: number): number => prio[b] - prio[a] || b - a;
  /** The routers running, as a set of indices. */
  const running = new Set<number>();
  // Every router starts, except the one held back.
  for (let i = 0; i < n; i++) if (String(i + 1) !== input.late) running.add(i);
  // The account, step by step.
  const steps: Step[] = [];

  /** Among the running routers other than `except`, the Backups whose timers fire first: the top priority, all of them. */
  const topBackups = (except: number | null): number[] => {
    // The candidates.
    const c = [...running].filter((i) => i !== except);
    // None left.
    if (c.length === 0) return [];
    // The highest priority among them.
    const top = Math.max(...c.map((i) => prio[i]));
    // Everyone at that priority, in address order.
    return c.filter((i) => prio[i] === top).sort((a, b) => a - b);
  };
  /** Among the running routers other than `except`, the best one below the top priority (the next timer to fire), or null. */
  const nextBackup = (except: number | null): number | null => {
    // The candidates.
    const c = [...running].filter((i) => i !== except);
    // The top priority among them (none: no runner-up).
    if (c.length === 0) return null;
    // The highest priority.
    const top = Math.max(...c.map((i) => prio[i]));
    // Those below it, best first (priority, then address).
    const below = c.filter((i) => prio[i] < top).sort(better);
    // The first of them, if any.
    return below.length ? below[0] : null;
  };
  /** From routers that became Active together, the one rule 5 leaves Active: the higher primary address. */
  const tieWinner = (tied: number[]): number => tied[tied.length - 1];

  // ---- the start: every running router receives its Startup event at the same instant ----
  // The Active Router.
  let active: number | null;
  // An owner among the running routers goes Active at once (rule 3).
  const runningOwner = [...running].find((i) => isOwner(i));
  // The owner case.
  if (runningOwner !== undefined) {
    // Active at once; every other router hears priority 255 and stays Backup.
    active = runningOwner;
    // The account.
    steps.push({ event: "start", outcome: "owner-at-start", subject: null, active, previous: null, timeCs: 0, tied: [], runnerUp: null });
  } else {
    // No owner: everyone is Backup, and the shortest Active_Down_Interval (the top priority) fires first.
    const tied = topBackups(null);
    // The higher primary address stays Active if several fired together.
    active = tieWinner(tied);
    // The account: the winner's own interval, computed with the configured interval.
    steps.push({ event: "start", outcome: "elected-at-start", subject: null, active, previous: null, timeCs: activeDownInterval(prio[active], iv), tied: tied.length > 1 ? tied : [], runnerUp: nextBackup(null) });
  }

  // ---- the events, in order ----
  for (const e of input.events) {
    // Nothing to do.
    if (e === "none") continue;
    // The Active Router before this event.
    const previous = active;
    // A failure or a shutdown stops the Active Router.
    if (e === "fail" || e === "shutdown") {
      // Nobody is Active: nothing to stop.
      if (previous === null) {
        // The account.
        steps.push({ event: e, outcome: "nothing-to-stop", subject: null, active: null, previous: null, timeCs: null, tied: [], runnerUp: null });
        // Next event.
        continue;
      }
      // The Backups whose timers fire first.
      const tied = topBackups(previous);
      // The next one, whose timer would have fired after them.
      const runnerUp = nextBackup(previous);
      // The stopped router leaves.
      running.delete(previous);
      // Nobody left: the virtual router is gone.
      if (tied.length === 0) {
        // No Active Router.
        active = null;
        // The account.
        steps.push({ event: e, outcome: "none-left", subject: previous, active: null, previous, timeCs: null, tied: [], runnerUp: null });
        // Next event.
        continue;
      }
      // The new Active Router (the higher address if several fired together).
      active = tieWinner(tied);
      // A silent failure waits out Active_Down_Interval from the last ADVERTISEMENT; a priority-0 ADVERTISEMENT cuts it to Skew_Time.
      const timeCs = e === "fail" ? activeDownInterval(prio[active], iv) : skewTime(prio[active], iv);
      // The account.
      steps.push({ event: e, outcome: e === "fail" ? "failover" : "shutdown-handover", subject: previous, active, previous, timeCs, tied: tied.length > 1 ? tied : [], runnerUp });
      // Next event.
      continue;
    }
    // A router starts.
    const r = startedRouter(e) as number;
    // Already running: nothing happens.
    if (running.has(r)) {
      // The account.
      steps.push({ event: e, outcome: "already-running", subject: r, active, previous, timeCs: null, tied: [], runnerUp: null });
      // Next event.
      continue;
    }
    // It joins.
    running.add(r);
    // The owner goes Active at once and the current Active Router, hearing 255, steps back (rules 3 and 6).
    if (isOwner(r)) {
      // Active at once.
      active = r;
      // The account.
      steps.push({ event: e, outcome: previous === null ? "owner-alone" : "owner-preempts", subject: r, active, previous, timeCs: 0, tied: [], runnerUp: null });
      // Next event.
      continue;
    }
    // Nobody Active: no ADVERTISEMENT arrives, so its timer runs out.
    if (previous === null) {
      // It takes over.
      active = r;
      // The account.
      steps.push({ event: e, outcome: "start-alone", subject: r, active, previous, timeCs: activeDownInterval(prio[r], iv), tied: [], runnerUp: null });
      // Next event.
      continue;
    }
    // The Active Router's priority is higher: its ADVERTISEMENTs reset the newcomer's timer.
    if (prio[previous] > prio[r]) {
      // The account.
      steps.push({ event: e, outcome: "stays-lower", subject: r, active, previous, timeCs: null, tied: [], runnerUp: null });
      // Next event.
      continue;
    }
    // Equal priority: "greater than or equal" resets the timer; the address breaks ties only between Active Routers.
    if (prio[previous] === prio[r]) {
      // The account.
      steps.push({ event: e, outcome: "stays-equal", subject: r, active, previous, timeCs: null, tied: [], runnerUp: null });
      // Next event.
      continue;
    }
    // Higher priority, preemption off: it accepts the lower-priority ADVERTISEMENTs and stays Backup.
    if (!input.preempt) {
      // The account.
      steps.push({ event: e, outcome: "stays-no-preempt", subject: r, active, previous, timeCs: null, tied: [], runnerUp: null });
      // Next event.
      continue;
    }
    // Higher priority, preemption on: it discards the ADVERTISEMENTs, its timer fires, and the old Active Router hears the higher priority.
    active = r;
    // The account.
    steps.push({ event: e, outcome: "preempts", subject: r, active, previous, timeCs: activeDownInterval(prio[r], iv), tied: [], runnerUp: null });
  }

  // The table: every router, its timers and where it ended.
  const rows: RouterRow[] = prio.map((p, i) => ({
    // Its index.
    index: i,
    // Its priority.
    priority: p,
    // Its primary address.
    address: ADDRESSES[i],
    // Owner or not.
    owner: isOwner(i),
    // Its Skew_Time.
    skewCs: skewTime(p, iv),
    // Its Active_Down_Interval.
    downCs: activeDownInterval(p, iv),
    // Active, Backup or not running.
    finalState: i === active ? "active" : running.has(i) ? "backup" : "down",
  }));
  // The router that would be Active if preemption always applied: the best running one.
  const bestRunning = running.size ? [...running].sort(better)[0] : null;
  // The full answer.
  return { rows, steps, finalActive: active, bestRunning };
}

/** The opening state: R1 at 200 and R2 at the default 100, preemption on; R1 fails and comes back. */
export const DEFAULT_INPUT: VrrpInput = { routers: 2, priorities: [200, 100, 100, 100], preempt: true, intervalCs: 100, late: "none", events: ["fail", "start1", "none"] };

/** The Example: three routers, preemption off; the skew hands the gateway to R2, and R1 (200) comes back to find R2 (150) keeping it. */
export const EXAMPLE_INPUT: VrrpInput = { routers: 3, priorities: [200, 150, 100, 100], preempt: false, intervalCs: 100, late: "none", events: ["fail", "start1", "none"] };
