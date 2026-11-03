// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/incident-commander/engine.ts
// ----------------------------------------------------------------------------
// INCIDENT COMMANDER, the simulation (PRIME 03/11/2026): an idle game about
// running a service. Requests come in, the servers serve what they can, every
// request served earns credits, and credits buy capacity and resilience.
// Incidents arrive on a seeded schedule whose rate depends on the setup; each
// has three possible responses and one is right. Every run's first incident is
// scripted to arrive early (FIRST_INCIDENT_S), and the rate starts higher and
// eases down over the first half hour, so a new player meets the game's main
// mechanic in minutes rather than once or twice a run (review R3-12,
// 03/11/2026). Monitoring finds incidents
// sooner, runbooks fix them faster, on-call engineers take some on their own.
// The "Approve without review" switch ships features faster (more demand,
// more income) but makes bad deploys far more likely. Writing the post-mortem
// resets the run for a permanent bonus.
//
// Pure: a state, an action or a time step in, a new state out; deterministic
// for a seed. The randomness is mulberry32 from src/lib/fun/daily.ts, its
// 32-bit state kept inside the game's state so a save can be restored exactly.
// The page renders and dispatches; it never decides anything.
// ============================================================================

// The seeded generator.
import { makeRng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id. */
export const GAME_ID = "incident-commander";
/** The save format's version. */
export const SAVE_VERSION = 1;
/** The longest time away that counts, in seconds (8 hours). */
export const OFFLINE_CAP_S = 8 * 3600;
/** Income while away, as a share of the online rate. */
export const OFFLINE_RATE = 0.5;
/** Credits earned in one run that make the post-mortem available. */
export const PRESTIGE_AT = 50_000;
/** Seconds between two releases with review. */
export const SHIP_REVIEWED_S = 50;
/** Seconds between two releases without review. */
export const SHIP_UNREVIEWED_S = 20;
/** The chance a reviewed release is a bad deploy. */
export const BAD_REVIEWED = 0.04;
/** The chance an unreviewed release is a bad deploy. */
export const BAD_UNREVIEWED = 0.25;
/** Seconds an unhandled incident lasts before it fades on its own. */
const SELF_HEAL_S = 600;
/** Seconds a wrong call costs before another can be tried. */
const WRONG_LOCK_S = 20;
/** Uptime is a moving average with this half-life, in seconds. */
const UPTIME_HALF_LIFE_S = 3600;
/** No random incident in the first moments of a run. */
const GRACE_S = 120;
/** Every run's first incident arrives at this second, if none has come before it (review R3-12, 03/11/2026). */
export const FIRST_INCIDENT_S = 150;
/** The kinds the scripted first incident is drawn from: plain ones whose right call reads clearly. */
const FIRST_KINDS: readonly IncidentKind[] = ["tls", "disk", "alwaysDns"];
/** At a run's start, random incidents come this many times as often as the setup alone would bring them. */
export const EARLY_BOOST = 3;
/** The early boost eases down to nothing over this many seconds of a run. */
export const EARLY_S = 1800;
/** Events kept for the page's feed. */
const EVENTS_KEPT = 8;

/** Things to buy. */
export type ItemId = "servers" | "loadBalancer" | "caching" | "cdn" | "autoscaling" | "monitoring" | "onCall" | "runbooks" | "staging" | "chaos";
/** Kinds of incident. */
export type IncidentKind = "tls" | "disk" | "dnsTtl" | "bgp" | "ddos" | "badDeploy" | "memLeak" | "stampede" | "dbLock" | "region" | "alwaysDns";

/** A thing to buy: its cost curve and its ceiling. */
export interface ItemDef {
  /** Its id. */
  id: ItemId;
  /** The first one's cost. */
  base: number;
  /** Each next one costs this much more (a factor). */
  growth: number;
  /** The most that can be owned. */
  max: number;
}

/** The shop, in display order. */
export const ITEMS: readonly ItemDef[] = [
  { id: "servers", base: 10, growth: 1.15, max: 250 },
  { id: "loadBalancer", base: 150, growth: 5, max: 3 },
  { id: "caching", base: 120, growth: 3.5, max: 4 },
  { id: "cdn", base: 600, growth: 5, max: 3 },
  { id: "autoscaling", base: 1500, growth: 4, max: 3 },
  { id: "monitoring", base: 80, growth: 3.5, max: 4 },
  { id: "onCall", base: 250, growth: 1.8, max: 6 },
  { id: "runbooks", base: 200, growth: 3, max: 4 },
  { id: "staging", base: 700, growth: 4, max: 2 },
  { id: "chaos", base: 2500, growth: 4, max: 3 },
];

/** An incident kind: how often (per hour, before the setup's effects), how bad, how long to fix. */
interface KindDef {
  /** Its id. */
  id: IncidentKind;
  /** Base arrivals per hour (bad deploys come from releases instead). */
  perHour: number;
  /** Share of capacity lost while it lasts, before mitigation. */
  severity: number;
  /** Seconds to fix once the right call is made, before runbooks. */
  fix: number;
}

/** The incident kinds. Each has three responses in the strings; response 0 is the right one. */
export const KINDS: readonly KindDef[] = [
  { id: "tls", perHour: 1.0, severity: 0.9, fix: 30 },
  { id: "disk", perHour: 1.4, severity: 0.5, fix: 25 },
  { id: "dnsTtl", perHour: 0.6, severity: 0.4, fix: 60 },
  { id: "bgp", perHour: 0.3, severity: 0.6, fix: 50 },
  { id: "ddos", perHour: 0.4, severity: 0.8, fix: 40 },
  { id: "badDeploy", perHour: 0, severity: 0.5, fix: 20 },
  { id: "memLeak", perHour: 1.0, severity: 0.35, fix: 30 },
  { id: "stampede", perHour: 0.8, severity: 0.5, fix: 20 },
  { id: "dbLock", perHour: 0.4, severity: 0.6, fix: 25 },
  { id: "region", perHour: 0.15, severity: 0.9, fix: 60 },
  { id: "alwaysDns", perHour: 0.5, severity: 0.7, fix: 30 },
];

/** One incident in progress. */
export interface Incident {
  /** A number unique within the run. */
  id: number;
  /** Its kind. */
  kind: IncidentKind;
  /** When it began (simulated seconds). */
  start: number;
  /** When monitoring (or users) noticed it. */
  detectAt: number;
  /** When it will be over: set by the right call, by on-call, or the self-heal time. */
  endAt: number;
  /** Whether the right call (or on-call) has been made, so endAt is a fix, not a fade. */
  fixing: boolean;
  /** Whether an on-call engineer took it. */
  onCall: boolean;
  /** No call can be made before this time (after a wrong one). */
  lockUntil: number;
  /** Responses already tried and wrong (indices into the kind's three). */
  tried: number[];
  /** The order the three responses are shown in (a permutation of 0, 1, 2). */
  order: number[];
  /** Share of capacity lost while it lasts, after mitigation. */
  severity: number;
}

/** Something that happened, for the page's feed. */
export interface GameEvent {
  /** When. */
  t: number;
  /** What: a release, a bad deploy, an incident, a fix, a wrong call, the night shift. */
  type: "ship" | "bad" | "incident" | "fixed" | "oncall" | "wrong" | "faded";
  /** The incident kind, when there is one. */
  kind?: IncidentKind;
}

/** The whole game. */
export interface IcState {
  /** Save format. */
  v: number;
  /** The generator's 32-bit state. */
  rng: number;
  /** Simulated seconds since the run began. */
  t: number;
  /** Seconds not yet simulated (the step runs in whole seconds). */
  frac: number;
  /** Credits in hand. */
  credits: number;
  /** Credits earned in this run (for the post-mortem milestone). */
  earned: number;
  /** Credits earned in all runs. */
  lifetime: number;
  /** Reputation, 0 to 100. */
  rep: number;
  /** Uptime, as a decaying sum of served-share seconds. */
  up: number;
  /** The decaying sum of all seconds (up / total is the availability). */
  total: number;
  /** What has been bought. */
  levels: Record<ItemId, number>;
  /** True while "Approve without review" is on. */
  approve: boolean;
  /** Releases shipped in this run. */
  features: number;
  /** When the next release ships. */
  nextShip: number;
  /** Bad deploys in this run. */
  badDeploys: number;
  /** Incidents in this run. */
  incidents: number;
  /** Incidents the player fixed with the right call. */
  fixedByYou: number;
  /** Incidents on-call engineers fixed. */
  fixedByOnCall: number;
  /** Wrong calls made. */
  wrongCalls: number;
  /** Incidents in progress. */
  active: Incident[];
  /** The next incident's id. */
  nextId: number;
  /** Lessons learned: the permanent bonus from post-mortems. */
  lessons: number;
  /** Post-mortems written. */
  postMortems: number;
  /** Recent events. */
  events: GameEvent[];
}

/** What the page shows, worked out from the state. */
export interface Derived {
  /** Requests per second the setup can serve, with nothing broken. */
  capacity: number;
  /** Requests per second the users send. */
  demand: number;
  /** Requests per second actually served. */
  served: number;
  /** Share of capacity lost to incidents right now. */
  impact: number;
  /** Share of the requests the setup would serve that incidents are failing right now (what uptime counts). */
  loss: number;
  /** Credits per second right now. */
  perSecond: number;
  /** Availability, 0 to 1. */
  availability: number;
  /** Availability as nines (-log10 of the unavailability), 0 to 9. */
  nines: number;
  /** Seconds an incident goes unnoticed. */
  detectS: number;
  /** The chance an on-call engineer takes an incident. */
  onCallChance: number;
  /** Seconds between releases. */
  shipEveryS: number;
  /** The chance a release is a bad deploy. */
  badChance: number;
  /** Whether the post-mortem can be written. */
  canPrestige: boolean;
  /** Lessons the post-mortem would add. */
  lessonsOnPrestige: number;
}

/** Actions the page dispatches. */
export type IcAction =
  | { type: "buy"; item: ItemId }
  | { type: "respond"; id: number; choice: number }
  | { type: "approve"; on: boolean }
  | { type: "prestige" };

/** What a time away brought. */
export interface AwaySummary {
  /** Seconds counted (capped). */
  seconds: number;
  /** Seconds actually away. */
  awaySeconds: number;
  /** Credits earned while away. */
  credits: number;
  /** Incidents that happened, about. */
  incidents: number;
  /** Of which on-call engineers handled, about. */
  handled: number;
}

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

/**
 * One draw in [0, 1) from the state's generator; the generator's state advances.
 *
 * mulberry32 from daily.ts: makeRng(a).next() adds the increment to a and mixes,
 * so starting a new makeRng at the stored state and adding the same increment
 * here walks exactly the sequence makeRng(seed) would.
 *
 * @param s the state (its rng field changes)
 * @returns the draw
 */
function draw(s: IcState): number {
  // The next value of the sequence from the stored state.
  const v = makeRng(s.rng).next();
  // The state moves on by mulberry32's increment.
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  // The value.
  return v;
}

// ---------------------------------------------------------------------------
// The state and what follows from it
// ---------------------------------------------------------------------------

/**
 * Every item at zero, with one server.
 *
 * @returns the starting levels
 */
function startLevels(): Record<ItemId, number> {
  // One server to start; nothing else.
  return { servers: 1, loadBalancer: 0, caching: 0, cdn: 0, autoscaling: 0, monitoring: 0, onCall: 0, runbooks: 0, staging: 0, chaos: 0 };
}

/** The decaying sum's ceiling: 1 / (1 - per-second decay). */
const DECAY = Math.pow(2, -1 / UPTIME_HALF_LIFE_S);
/** The sum of all seconds when the window is full. */
const FULL_WINDOW = 1 / (1 - DECAY);

/**
 * A new game.
 *
 * @param seed any 32-bit number
 * @param lessons lessons learned carried in (for a new run after a post-mortem)
 * @param postMortems post-mortems already written
 * @param lifetime credits earned in earlier runs
 * @returns the state
 */
export function newGame(seed: number, lessons = 0, postMortems = 0, lifetime = 0): IcState {
  // Everything at its start; uptime begins at three nines.
  return {
    v: SAVE_VERSION,
    rng: seed >>> 0,
    t: 0,
    frac: 0,
    credits: 15,
    earned: 0,
    lifetime,
    rep: 50,
    up: FULL_WINDOW * 0.999,
    total: FULL_WINDOW,
    levels: startLevels(),
    approve: false,
    features: 0,
    nextShip: SHIP_REVIEWED_S,
    badDeploys: 0,
    incidents: 0,
    fixedByYou: 0,
    fixedByOnCall: 0,
    wrongCalls: 0,
    active: [],
    nextId: 1,
    lessons,
    postMortems,
    events: [],
  };
}

/**
 * The cost of the next unit of an item.
 *
 * @param s the state
 * @param item the item
 * @returns credits, or Infinity at the ceiling
 */
export function cost(s: IcState, item: ItemId): number {
  // The item's definition.
  const def = ITEMS.find((d) => d.id === item) as ItemDef;
  // Already at the ceiling.
  if (s.levels[item] >= def.max) return Infinity;
  // Servers start at one owned, so the curve counts the ones bought.
  const n = item === "servers" ? s.levels[item] - 1 : s.levels[item];
  // The curve.
  return Math.round(def.base * Math.pow(def.growth, n));
}

/**
 * Requests per second the setup serves with nothing broken.
 *
 * @param s the state
 * @returns the capacity
 */
function capacityOf(s: IcState): number {
  // The levels.
  const L = s.levels;
  // 6 per server, multiplied by the load balancer, the cache, the CDN and autoscaling.
  return L.servers * 6 * (1 + 0.2 * L.loadBalancer) * (1 + 0.15 * L.caching) * (1 + 0.2 * L.cdn) * (1 + 0.1 * L.autoscaling);
}

/**
 * Requests per second the users send: more with every release, more with a better reputation.
 *
 * @param s the state
 * @returns the demand
 */
function demandOf(s: IcState): number {
  // A base that grows with every release (a little faster than linearly), scaled by reputation (1.0 at 50, 1.4 at 100, 0.6 at 0).
  return 30 * Math.pow(1 + 0.2 * s.features, 1.35) * (0.6 + s.rep / 125);
}

/**
 * The share of capacity lost to the incidents in progress (the worst one counts).
 *
 * @param s the state
 * @returns 0 to 1
 */
function impactOf(s: IcState): number {
  // The worst severity among those in progress.
  let worst = 0;
  // Each incident.
  for (const inc of s.active) worst = Math.max(worst, inc.severity);
  // The share.
  return worst;
}

/**
 * Seconds before an incident is noticed: 40, then 40 % less per monitoring level.
 *
 * @param s the state
 * @returns seconds
 */
function detectOf(s: IcState): number {
  // The curve.
  return 40 * Math.pow(0.6, s.levels.monitoring);
}

/**
 * The chance an on-call engineer takes a noticed incident.
 *
 * @param s the state
 * @returns 0 to 1
 */
function onCallChanceOf(s: IcState): number {
  // Each engineer has a 35 % chance of being the one who takes it.
  return 1 - Math.pow(0.65, s.levels.onCall);
}

/**
 * The income multiplier from lessons learned.
 *
 * @param s the state
 * @returns the factor
 */
function lessonsFactor(s: IcState): number {
  // Ten per cent a lesson.
  return 1 + 0.1 * s.lessons;
}

/**
 * Lessons a post-mortem would add.
 *
 * @param s the state
 * @returns lessons (0 before the milestone)
 */
function lessonsFor(s: IcState): number {
  // None before the milestone.
  if (s.earned < PRESTIGE_AT) return 0;
  // Three at the milestone, growing with the square root of what was earned.
  return Math.floor(3 * Math.sqrt(s.earned / PRESTIGE_AT));
}

/**
 * Everything the page shows, from the state.
 *
 * @param s the state
 * @returns the derived values
 */
export function derive(s: IcState): Derived {
  // Capacity, demand and what is lost.
  const capacity = capacityOf(s);
  const demand = demandOf(s);
  const impact = impactOf(s);
  // What would be served with nothing broken, and what is served.
  const healthy = Math.min(demand, capacity);
  const served = Math.min(demand, capacity * (1 - impact));
  // Spare capacity absorbs an incident: only what falls below the healthy level counts against uptime.
  const loss = healthy > 0 ? Math.max(0, (healthy - served) / healthy) : 0;
  // Availability from the moving sums.
  const availability = s.total > 0 ? Math.min(1, Math.max(0, s.up / s.total)) : 1;
  // Nines, capped at nine.
  const nines = availability >= 1 - 1e-9 ? 9 : Math.min(9, Math.max(0, -Math.log10(1 - availability)));
  // The values.
  return {
    capacity,
    demand,
    served,
    impact,
    loss,
    perSecond: served * 0.1 * lessonsFactor(s),
    availability,
    nines,
    detectS: detectOf(s),
    onCallChance: onCallChanceOf(s),
    shipEveryS: s.approve ? SHIP_UNREVIEWED_S : SHIP_REVIEWED_S,
    badChance: (s.approve ? BAD_UNREVIEWED : BAD_REVIEWED) * Math.pow(0.5, s.levels.staging),
    canPrestige: s.earned >= PRESTIGE_AT,
    lessonsOnPrestige: lessonsFor(s),
  };
}

/**
 * Arrivals per hour of each random incident kind for this setup.
 *
 * @param s the state
 * @returns per-hour rates, by kind (bad deploys excluded: releases bring those)
 */
export function ratesPerHour(s: IcState): Record<IncidentKind, number> {
  // The levels.
  const L = s.levels;
  // Each kind's base rate, shaped by the setup.
  return {
    // Certificate expiry alerts come with monitoring.
    tls: 1.0 * (L.monitoring >= 1 ? 0.3 : 1),
    // Disk-usage alerts come with the second monitoring level.
    disk: 1.4 * (L.monitoring >= 2 ? 0.4 : 1),
    // A long TTL on a moved record: nothing here prevents it.
    dnsTtl: 0.6,
    // Route leaks come from elsewhere.
    bgp: 0.3,
    // A better-known service draws more attacks.
    ddos: 0.4 * (1 + s.rep / 50),
    // Releases bring these.
    badDeploy: 0,
    // Staging and chaos drills catch leaks before production.
    memLeak: 1.0 * Math.pow(0.6, L.staging) * Math.pow(0.8, L.chaos),
    // A stampede needs a cache.
    stampede: L.caching >= 1 ? 0.8 : 0,
    // Locks grow with the load.
    dbLock: 0.4 * (1 + demandOf(s) / 200),
    // Cloud regions fail rarely.
    region: 0.15,
    // And it is always DNS.
    alwaysDns: 0.5,
  };
}

/**
 * An incident's severity after the setup's mitigations.
 *
 * @param s the state
 * @param kind the kind
 * @returns 0 to 1
 */
function severityFor(s: IcState, kind: IncidentKind): number {
  // The kind's base.
  const base = (KINDS.find((k) => k.id === kind) as KindDef).severity;
  // The levels.
  const L = s.levels;
  // The CDN absorbs a share of a DDoS; chaos drills and autoscaling soften a region outage.
  const specific = kind === "ddos" ? 1 - 0.25 * L.cdn : kind === "region" ? (1 - 0.25 * L.chaos) * (L.autoscaling >= 1 ? 0.7 : 1) : 1;
  // A load balancer routes around the broken part and chaos drills make every failure smaller.
  return Math.max(0.05, base * specific * (1 - 0.08 * L.loadBalancer) * (1 - 0.1 * L.chaos));
}

/**
 * Seconds to fix an incident once the right call is made: runbooks take 30 % off per level.
 *
 * @param s the state
 * @param kind the kind
 * @returns seconds
 */
function fixFor(s: IcState, kind: IncidentKind): number {
  // The kind's base, shortened by runbooks.
  return Math.max(3, (KINDS.find((k) => k.id === kind) as KindDef).fix * Math.pow(0.7, s.levels.runbooks));
}

// ---------------------------------------------------------------------------
// Changes
// ---------------------------------------------------------------------------

/**
 * A deep enough copy to change freely.
 *
 * @param s the state
 * @returns the copy
 */
function copy(s: IcState): IcState {
  // The nested parts copied; incidents copied one by one.
  return { ...s, levels: { ...s.levels }, active: s.active.map((i) => ({ ...i, tried: i.tried.slice(), order: i.order.slice() })), events: s.events.slice() };
}

/**
 * Add an event to the feed, keeping only the latest few.
 *
 * @param s the state (changed in place)
 * @param e the event
 */
function note(s: IcState, e: GameEvent): void {
  // Newest first.
  s.events.unshift(e);
  // Trimmed.
  if (s.events.length > EVENTS_KEPT) s.events.length = EVENTS_KEPT;
}

/**
 * Start an incident now.
 *
 * @param s the state (changed in place)
 * @param kind its kind
 */
function spawn(s: IcState, kind: IncidentKind): void {
  // The three responses, shuffled for display (Fisher-Yates with the state's generator).
  const order = [0, 1, 2];
  // From the end.
  for (let i = 2; i > 0; i--) {
    // The partner.
    const j = Math.floor(draw(s) * (i + 1));
    // The swap.
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Noticed after the monitoring delay.
  const detectAt = s.t + detectOf(s);
  // The incident.
  const inc: Incident = { id: s.nextId++, kind, start: s.t, detectAt, endAt: detectAt + SELF_HEAL_S, fixing: false, onCall: false, lockUntil: 0, tried: [], order, severity: severityFor(s, kind) };
  // On-call: decided now, acting once it is noticed.
  if (draw(s) < onCallChanceOf(s)) {
    // Taken by an engineer: twice the fix time of a right call, after noticing.
    inc.onCall = true;
    inc.fixing = true;
    inc.endAt = detectAt + 2 * fixFor(s, kind);
  }
  // In progress.
  s.active.push(inc);
  // Counted.
  s.incidents++;
  // In the feed.
  note(s, { t: s.t, type: "incident", kind });
}

/**
 * One simulated second.
 *
 * @param s the state (changed in place)
 */
function second(s: IcState): void {
  // The derived values at the start of the second.
  const d = derive(s);
  // Income.
  const income = d.perSecond;
  // Credits.
  s.credits += income;
  s.earned += income;
  s.lifetime += income;
  // Uptime: the share of the requests that would have been served that were served, in the decaying sums.
  s.up = s.up * DECAY + (1 - d.loss);
  s.total = s.total * DECAY + 1;
  // Reputation: down while broken, slowly up otherwise.
  s.rep = Math.max(0, Math.min(100, s.rep + (d.loss > 0 ? -0.03 * d.loss : 0.004)));
  // The clock.
  s.t += 1;
  // Incidents that end now.
  const still: Incident[] = [];
  // Each one.
  for (const inc of s.active) {
    // Not over yet.
    if (inc.endAt > s.t) {
      // Kept.
      still.push(inc);
      // Next.
      continue;
    }
    // Over: fixed by on-call, by the player, or faded.
    if (inc.onCall) {
      // On-call's.
      s.fixedByOnCall++;
      note(s, { t: s.t, type: "oncall", kind: inc.kind });
    } else if (inc.fixing) {
      // The player's.
      s.fixedByYou++;
      note(s, { t: s.t, type: "fixed", kind: inc.kind });
    } else {
      // Nobody's: it faded, and the reputation remembers.
      s.rep = Math.max(0, s.rep - 2);
      note(s, { t: s.t, type: "faded", kind: inc.kind });
    }
  }
  // The rest stay.
  s.active = still;
  // A release, when it is due.
  if (s.t >= s.nextShip) {
    // Shipped.
    s.features++;
    // The next one.
    s.nextShip = s.t + d.shipEveryS;
    // Perhaps a bad deploy.
    if (draw(s) < d.badChance) {
      // Counted and started; users notice, and the reputation pays.
      s.badDeploys++;
      s.rep = Math.max(0, s.rep - 2.5);
      note(s, { t: s.t, type: "bad" });
      spawn(s, "badDeploy");
    } else note(s, { t: s.t, type: "ship" });
  }
  // The run's first incident, scripted: it arrives at FIRST_INCIDENT_S when nothing has come before it.
  if (s.incidents === 0 && s.t >= FIRST_INCIDENT_S && s.active.length < 3) {
    // One of the plain kinds, drawn from the run's generator.
    spawn(s, FIRST_KINDS[Math.min(FIRST_KINDS.length - 1, Math.floor(draw(s) * FIRST_KINDS.length))]);
  }
  // A random incident, after the grace period: one draw for "any", one for which.
  else if (s.t > GRACE_S && s.active.length < 3) {
    // The rates.
    const rates = ratesPerHour(s);
    // Their sum, per hour.
    const perHour = Object.values(rates).reduce((a, b) => a + b, 0);
    // The early boost: EARLY_BOOST times at the start of a run, easing to none by EARLY_S.
    const boost = 1 + (EARLY_BOOST - 1) * Math.max(0, 1 - s.t / EARLY_S);
    // The chance of one this second.
    const sum = (perHour * boost) / 3600;
    // Any incident this second?
    if (draw(s) < sum) {
      // Which: a weighted pick among the setup's rates.
      let r = draw(s) * perHour;
      // The kinds in order.
      for (const k of KINDS) {
        // This kind's share.
        r -= rates[k.id];
        // Picked.
        if (r < 0) {
          // Started.
          spawn(s, k.id);
          // Done.
          break;
        }
      }
    }
  }
}

/**
 * Advance the simulation by some time, in whole simulated seconds (the remainder is kept).
 *
 * @param s0 the state
 * @param dt seconds (negative or not finite counts as 0; more than an hour is cut to an hour)
 * @returns the new state
 */
export function tick(s0: IcState, dt: number): IcState {
  // A safe amount of time.
  const safe = Number.isFinite(dt) && dt > 0 ? Math.min(3600, dt) : 0;
  // Nothing to do.
  if (safe === 0) return s0;
  // A copy to change.
  const s = copy(s0);
  // The time to simulate.
  s.frac += safe;
  // Whole seconds.
  while (s.frac >= 1) {
    // One.
    second(s);
    // Counted.
    s.frac -= 1;
  }
  // The new state.
  return s;
}

/**
 * Apply an action at the current time.
 *
 * @param s0 the state
 * @param a the action
 * @returns the new state (the same object when the action does nothing)
 */
export function act(s0: IcState, a: IcAction): IcState {
  // Buying.
  if (a.type === "buy") {
    // Its price.
    const price = cost(s0, a.item);
    // Not affordable, or at the ceiling.
    if (!Number.isFinite(price) || s0.credits < price) return s0;
    // A copy.
    const s = copy(s0);
    // Paid.
    s.credits -= price;
    // Owned.
    s.levels[a.item]++;
    // The new state.
    return s;
  }
  // The switch.
  if (a.type === "approve") {
    // No change.
    if (s0.approve === a.on) return s0;
    // A copy.
    const s = copy(s0);
    // Flipped.
    s.approve = a.on;
    // The next release comes no later than the new interval allows.
    s.nextShip = Math.min(s.nextShip, s.t + (a.on ? SHIP_UNREVIEWED_S : SHIP_REVIEWED_S));
    // The new state.
    return s;
  }
  // The post-mortem.
  if (a.type === "prestige") {
    // Not yet.
    if (s0.earned < PRESTIGE_AT) return s0;
    // A fresh run with the lessons kept, and the generator carried on.
    const next = newGame(s0.rng, s0.lessons + lessonsFor(s0), s0.postMortems + 1, s0.lifetime);
    // The switch keeps its position.
    next.approve = s0.approve;
    // The new state.
    return next;
  }
  // A response to an incident.
  const idx = s0.active.findIndex((i) => i.id === a.id);
  // No such incident.
  if (idx < 0) return s0;
  // The incident.
  const inc0 = s0.active[idx];
  // Not noticed yet, already being fixed, locked after a wrong call, or a response already tried.
  if (s0.t < inc0.detectAt || inc0.fixing || s0.t < inc0.lockUntil || inc0.tried.includes(a.choice) || a.choice < 0 || a.choice > 2) return s0;
  // A copy.
  const s = copy(s0);
  // The incident in the copy.
  const inc = s.active[idx];
  // The right call: fixed after the fix time.
  if (a.choice === 0) {
    // Being fixed.
    inc.fixing = true;
    inc.endAt = s.t + fixFor(s, inc.kind);
    // A little reputation for a good call.
    s.rep = Math.min(100, s.rep + 0.5);
    // The new state.
    return s;
  }
  // A wrong call: time lost, a little reputation lost.
  inc.tried.push(a.choice);
  inc.lockUntil = s.t + WRONG_LOCK_S;
  s.wrongCalls++;
  s.rep = Math.max(0, s.rep - 0.3);
  note(s, { t: s.t, type: "wrong", kind: inc.kind });
  // The new state.
  return s;
}

/**
 * The time away: income at a reduced rate for at most eight hours, less the expected downtime; no releases.
 *
 * Computed from expected values, not simulated, so it is instant and exact for any length of absence.
 * Incidents in progress are over when the player comes back (handled by the night shift or faded).
 *
 * @param s0 the state as saved
 * @param awaySeconds seconds since the save
 * @returns the new state and a summary for "While you were away"
 */
export function offline(s0: IcState, awaySeconds: number): { state: IcState; summary: AwaySummary } {
  // A safe, capped time.
  const away = Number.isFinite(awaySeconds) && awaySeconds > 0 ? awaySeconds : 0;
  const seconds = Math.min(OFFLINE_CAP_S, away);
  // A copy.
  const s = copy(s0);
  // Nothing in progress while away.
  s.active = [];
  // The expected incidents per second.
  const rates = ratesPerHour(s);
  const perSec = Object.values(rates).reduce((a, b) => a + b, 0) / 3600;
  // On-call's share.
  const chance = onCallChanceOf(s);
  // Mean length: on-call's fix, or the fade.
  const meanFix = KINDS.reduce((a, k) => a + fixFor(s, k.id), 0) / KINDS.length;
  const meanLen = detectOf(s) + chance * 2 * meanFix + (1 - chance) * SELF_HEAL_S;
  // Mean severity.
  const meanSev = KINDS.reduce((a, k) => a + severityFor(s, k.id), 0) / KINDS.length;
  // The share of time served, about (never below a fifth).
  const servedShare = Math.max(0.2, 1 - perSec * meanLen * meanSev);
  // The income rate with nothing broken.
  const base = { ...s, active: [] as Incident[] };
  const rate = derive(base).perSecond * OFFLINE_RATE * servedShare;
  // The credits.
  const credits = rate * seconds;
  // Earned.
  s.credits += credits;
  s.earned += credits;
  s.lifetime += credits;
  // Uptime drifts towards the away availability.
  const d = Math.pow(DECAY, seconds);
  const a = s.total > 0 ? s.up / s.total : 1;
  s.up = s.total * Math.min(1, Math.max(0, a * d + servedShare * (1 - d)));
  // The clock moves on; the next release comes after the usual interval.
  s.t += Math.floor(seconds);
  s.nextShip = s.t + (s.approve ? SHIP_UNREVIEWED_S : SHIP_REVIEWED_S);
  // The incidents, about.
  const incidents = Math.round(perSec * seconds);
  // The summary.
  return { state: s, summary: { seconds, awaySeconds: away, credits, incidents, handled: Math.round(incidents * chance) } };
}

/**
 * Whether a parsed object is a usable save (shape, version and numbers checked).
 *
 * @param x the parsed value
 * @returns the state, or null
 */
export function restore(x: unknown): IcState | null {
  // An object.
  if (!x || typeof x !== "object") return null;
  // The fields that matter.
  const s = x as Partial<IcState>;
  // Version and the main numbers.
  if (s.v !== SAVE_VERSION || !s.levels || !Array.isArray(s.active) || !Array.isArray(s.events)) return null;
  // Every number finite and not negative.
  for (const k of ["rng", "t", "frac", "credits", "earned", "lifetime", "rep", "up", "total", "features", "nextShip", "badDeploys", "incidents", "fixedByYou", "fixedByOnCall", "wrongCalls", "nextId", "lessons", "postMortems"] as const) {
    // The value.
    const v = s[k];
    // Must be a usable number.
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return null;
  }
  // Every level a whole number within its ceiling.
  for (const def of ITEMS) {
    // The level.
    const v = (s.levels as Record<string, unknown>)[def.id];
    // Checked.
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > def.max) return null;
  }
  // Usable.
  return s as IcState;
}

/**
 * A number in a compact form: 950, 1.2k, 3.4M, 5.6B, 7.8T.
 *
 * @param n the number
 * @param sep the decimal separator ("." or ",")
 * @returns the text
 */
export function compact(n: number, sep = "."): string {
  // Not a number, or negative: shown as zero (the engine never produces either).
  if (!Number.isFinite(n) || n <= 0) return "0";
  // The steps.
  const steps: [number, string][] = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "k"]];
  // The first step the number reaches.
  for (const [v, suffix] of steps) {
    // Reached.
    if (n >= v) {
      // One decimal below ten of the unit, none above a hundred.
      const x = n / v;
      // The digits.
      const digits = x < 10 ? x.toFixed(1) : x < 100 ? x.toFixed(1) : x.toFixed(0);
      // Trailing ".0" dropped, the separator applied.
      return digits.replace(/\.0$/, "").replace(".", sep) + suffix;
    }
  }
  // Below a thousand: whole numbers, one decimal under ten.
  return (n < 10 ? n.toFixed(1).replace(/\.0$/, "") : Math.floor(n).toString()).replace(".", sep);
}

// ---------------------------------------------------------------------------
// The self-test
// ---------------------------------------------------------------------------

/**
 * A scripted "sensible" player for one second: answer noticed incidents right after a short pause, keep
 * capacity ahead of demand, buy the cheapest other upgrade it can afford, write the post-mortem when it can.
 *
 * @param s the state
 * @param approve the switch position this player keeps
 * @param prestige whether it writes the post-mortem when available
 * @returns the state after its actions
 */
function sensible(s: IcState, approve: boolean, prestige: boolean): IcState {
  // The switch.
  let x = act(s, { type: "approve", on: approve });
  // Incidents noticed three seconds ago or more, not yet being fixed: the right call.
  for (const inc of x.active) if (!inc.fixing && x.t >= inc.detectAt + 3) x = act(x, { type: "respond", id: inc.id, choice: 0 });
  // Shopping, a few purchases at most each second.
  for (let k = 0; k < 4; k++) {
    // The current numbers.
    const d = derive(x);
    // Capacity short: a server first.
    if (d.capacity < d.demand * 1.2 && x.credits >= cost(x, "servers")) {
      // Bought.
      x = act(x, { type: "buy", item: "servers" });
      // Next purchase.
      continue;
    }
    // Otherwise the cheapest other item it can afford.
    const other = ITEMS.filter((i) => i.id !== "servers" && x.credits >= cost(x, i.id)).sort((a, b) => cost(x, a.id) - cost(x, b.id))[0];
    // Bought.
    if (other) {
      // The purchase.
      x = act(x, { type: "buy", item: other.id });
      // Next purchase.
      continue;
    }
    // Nothing else: a server when well off.
    if (x.credits >= 3 * cost(x, "servers")) {
      // Bought.
      x = act(x, { type: "buy", item: "servers" });
      // Next purchase.
      continue;
    }
    // Nothing to buy.
    break;
  }
  // The post-mortem.
  if (prestige && derive(x).canPrestige) x = act(x, { type: "prestige" });
  // The state.
  return x;
}

/**
 * Every number in the state finite and not negative, reputation within 0-100, levels within their ceilings.
 *
 * @param s the state
 * @returns a problem, or ""
 */
function badNumbers(s: IcState): string {
  // The top-level numbers.
  for (const [k, v] of Object.entries(s)) if (typeof v === "number" && (!Number.isFinite(v) || v < 0)) return `${k} = ${v}`;
  // Reputation's range.
  if (s.rep > 100) return `rep = ${s.rep}`;
  // Levels.
  for (const def of ITEMS) if (!Number.isInteger(s.levels[def.id]) || s.levels[def.id] < 0 || s.levels[def.id] > def.max) return `${def.id} = ${s.levels[def.id]}`;
  // Derived values.
  const d = derive(s);
  for (const [k, v] of Object.entries(d)) if (typeof v === "number" && (!Number.isFinite(v) || v < 0)) return `derived ${k} = ${v}`;
  // Incidents.
  for (const inc of s.active) if (![inc.start, inc.detectAt, inc.endAt, inc.lockUntil, inc.severity].every((v) => Number.isFinite(v) && v >= 0)) return `incident ${inc.id}`;
  // Fine.
  return "";
}

/**
 * The self-test.
 *
 * Proves: the simulation is deterministic for a seed; every run's first incident has arrived by FIRST_INCIDENT_S,
 * for a player who does nothing and for one who plays, in a first run and in the run after a post-mortem; a run's
 * first half hour brings several incidents, not a storm; the sensible player writes its first post-mortem after
 * 20 to 60 simulated minutes (over several seeds); a player who approves everything has at least three times
 * as many bad deploys over the same half hour; time away is capped at eight hours and pays less than being
 * there; and 10,000 random action sequences leave no NaN, no infinity and no negative number anywhere.
 *
 * @returns the report
 */
export function selfTest(): SelfTestReport {
  // Problems.
  const failures: string[] = [];
  // Cases.
  let checked = 0;
  // Determinism: the same seed and the same play, twice.
  const play = (seed: number, minutes: number, approve: boolean): IcState => {
    // From the start.
    let s = newGame(seed);
    // Each second.
    for (let i = 0; i < minutes * 60; i++) s = tick(sensible(s, approve, false), 1);
    // The end.
    return s;
  };
  // Run twice.
  if (JSON.stringify(play(42, 20, false)) !== JSON.stringify(play(42, 20, false))) failures.push("simulation is not deterministic");
  checked++;
  // The first incident arrives by FIRST_INCIDENT_S (review R3-12), and the first half hour is busy but not stormy.
  let early = 0;
  // Ten seeds.
  for (let seed = 1; seed <= 10; seed++) {
    // A player who does nothing, and the sensible one.
    for (const active of [false, true]) {
      // From the start.
      let s = newGame(seed * 7919);
      // Up to the scripted second.
      while (s.t < FIRST_INCIDENT_S) s = tick(active ? sensible(s, false, false) : s, 1);
      // At least one incident by then.
      if (s.incidents < 1) failures.push(`seed ${seed}${active ? " (played)" : ""}: no incident by ${FIRST_INCIDENT_S} s`);
      checked++;
      // The idle player's first half hour, counted.
      if (!active) {
        // On to 30 minutes.
        while (s.t < 1800) s = tick(s, 1);
        // Summed over the seeds.
        early += s.incidents;
      }
    }
  }
  // About one every few minutes on average: at least three, at most fifteen per half hour.
  if (early / 10 < 3 || early / 10 > 15) failures.push(`first half hour: ${early / 10} incidents on average`);
  checked++;
  // After a post-mortem the new run's first incident is scripted too.
  const ready = { ...newGame(99), earned: PRESTIGE_AT, credits: 10 };
  let after = act(ready, { type: "prestige" });
  // Up to the scripted second of the new run.
  while (after.t < FIRST_INCIDENT_S) after = tick(after, 1);
  if (after.postMortems !== 1 || after.incidents < 1) failures.push("after a post-mortem the first incident did not come");
  checked++;
  // The first post-mortem's time, over ten seeds.
  for (let seed = 1; seed <= 10; seed++) {
    // From the start.
    let s = newGame(seed * 7919);
    // The second it became available.
    let at = -1;
    // At most two hours.
    for (let i = 0; i < 7200 && at < 0; i++) {
      // One second of play.
      s = tick(sensible(s, false, false), 1);
      // Available now.
      if (derive(s).canPrestige) at = s.t;
    }
    // Between 20 and 60 minutes.
    if (at < 20 * 60 || at > 60 * 60) failures.push(`seed ${seed}: first post-mortem at ${at < 0 ? "never" : Math.round(at / 60) + " min"}`);
    checked++;
  }
  // Bad deploys: reviewed against approve-everything, half an hour each, over five seeds, summed.
  let reviewed = 0;
  let approved = 0;
  // Each seed.
  for (let seed = 1; seed <= 5; seed++) {
    // Both players.
    reviewed += play(seed * 104729, 30, false).badDeploys;
    approved += play(seed * 104729, 30, true).badDeploys;
    checked++;
  }
  // At least three times as many (and some at all).
  if (approved < 3 * Math.max(1, reviewed)) failures.push(`approve-everything had ${approved} bad deploys against ${reviewed} reviewed`);
  // Time away.
  const base = play(7, 25, false);
  // Eight hours and a day pay the same.
  const eight = offline(base, OFFLINE_CAP_S).summary.credits;
  const day = offline(base, 24 * 3600).summary.credits;
  if (Math.abs(eight - day) > 1e-6) failures.push(`offline not capped: 8 h ${eight}, 24 h ${day}`);
  // An hour pays less than eight.
  if (!(offline(base, 3600).summary.credits < eight)) failures.push("offline: an hour pays as much as eight");
  // Away pays no more than the online rate times the share.
  if (eight > derive({ ...base, active: [] }).perSecond * OFFLINE_RATE * OFFLINE_CAP_S + 1e-6) failures.push("offline pays more than half the online rate");
  // Nothing negative or broken.
  const bad = badNumbers(offline(base, 1e12).state) || badNumbers(offline(base, -5).state) || badNumbers(offline(base, NaN).state);
  if (bad) failures.push(`offline: ${bad}`);
  checked++;
  // The random sequences.
  const rng = makeRng(0xc0ffee);
  // The actions to draw from.
  const actions = ["buy", "respond", "approve", "prestige", "tick", "tick", "tick", "offline"] as const;
  // 10,000 of them.
  for (let n = 0; n < 10_000; n++) {
    // A fresh game, or one already played a little.
    let s = n % 10 === 0 ? base : newGame(rng.int(0x100000000));
    // A few credits sometimes, so purchases happen.
    if (n % 3 === 0) s = { ...s, credits: s.credits + rng.int(5000) };
    // Eight actions.
    for (let i = 0; i < 8; i++) {
      // Which.
      const kind = rng.pick(actions);
      // Applied.
      if (kind === "buy") s = act(s, { type: "buy", item: rng.pick(ITEMS).id });
      else if (kind === "respond") s = act(s, { type: "respond", id: s.active.length ? rng.pick(s.active).id : rng.int(5), choice: rng.int(4) - (rng.chance(0.1) ? 1 : 0) });
      else if (kind === "approve") s = act(s, { type: "approve", on: rng.chance(0.5) });
      else if (kind === "prestige") s = act(s, { type: "prestige" });
      else if (kind === "tick") s = tick(s, rng.chance(0.05) ? -3 : rng.next() * 20);
      else s = offline(s, rng.chance(0.1) ? Infinity : rng.next() * 50_000).state;
      // Checked after every action.
      const problem = badNumbers(s);
      // Reported once per sequence.
      if (problem) {
        failures.push(`sequence ${n}: ${problem} after ${kind}`);
        break;
      }
    }
    // Counted.
    checked++;
  }
  // The report.
  return { checked, failures: failures.slice(0, 30) };
}
