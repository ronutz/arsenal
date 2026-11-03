// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/whack-a-bug/engine.ts
// ----------------------------------------------------------------------------
// WHACK-A-BUG, the rules (PRIME 03/11/2026: "one's job is to tap/click on
// elements briefly appearing on the screen").
//
// A round is 60 seconds on a 3 x 3 board. Bugs pop up in the nine slots for a
// moment and must be hit before they vanish; "features" must be left alone
// (hitting one costs points: it is not a bug, it is a feature); a rare golden
// bug is worth more; consecutive hits build a combo multiplier. The pace and
// the density rise through the round.
//
// Everything a round contains is decided before it starts: the spawn timeline
// (slot, kind, appear time, lifetime) is a pure function of a seed. The daily
// run draws it from dailyRng, so everyone gets the same 60 seconds on a UTC
// day; a practice run uses a seed the page picks. The scoring is a pure fold
// over the taps, so the live score on screen and the final score are the same
// computation, and the self-test can play a perfect bot and an idle one.
// ============================================================================

// The seeded generators and the daily seed.
import { dailyRng, makeRng, addDays, LAUNCH_DAY, type Rng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id (storage key, folder, page slug). */
export const GAME_ID = "whack-a-bug";
/** Length of a round, in milliseconds. */
export const ROUND_MS = 60_000;
/** Slots on the board (3 x 3). */
export const SLOTS = 9;
/** The shortest time an item stays up, in milliseconds. */
export const MIN_LIFE = 600;
/** The longest time an item stays up, in milliseconds. */
export const MAX_LIFE = 1500;
/** A slot rests at least this long between two items, so a new item never looks like the old one. */
export const SLOT_REST_MS = 150;
/** No item appears in the first moment of the round. */
const FIRST_SPAWN_MS = 600;
/** Hard cap on items in a round: the generator's loop is bounded by it. */
const MAX_ITEMS = 220;

/** Points for a bug hit, before the multiplier. */
export const POINTS_BUG = 10;
/** Points for a golden bug hit, before the multiplier. */
export const POINTS_GOLDEN = 50;
/** Points lost for hitting a feature (not multiplied). */
export const PENALTY_FEATURE = 30;
/** Hits needed for each step of the multiplier. */
export const COMBO_STEP = 5;
/** The highest multiplier. */
export const MAX_MULT = 4;

/** What pops up in a slot. */
export type ItemKind = "bug" | "feature" | "golden";

/** One item of the schedule. */
export interface Spawn {
  /** Its index in the schedule (0, 1, 2, ...), in order of appearance. */
  id: number;
  /** The slot, 0-8, row by row from the top left. */
  slot: number;
  /** What it is. */
  kind: ItemKind;
  /** When it appears, in milliseconds from the start of the round. */
  at: number;
  /** How long it stays up, in milliseconds. */
  life: number;
}

/**
 * Linear interpolation, for the pace curves.
 *
 * @param a the value at the start of the round
 * @param b the value at the end
 * @param p progress through the round, 0 to 1
 * @returns the value at p
 */
function lerp(a: number, b: number, p: number): number {
  // The straight line from a to b.
  return a + (b - a) * p;
}

/**
 * The spawn timeline of one round, drawn from a seeded generator.
 *
 * Waves come at shrinking intervals (about 820 ms apart at the start, 300 ms at
 * the end), items stay up for less time as the round goes on (about 1,450 ms
 * down to 700 ms), and late waves sometimes bring two items at once. Each item
 * takes a slot that is free for its whole life plus a rest; when every slot is
 * busy the item is skipped, never forced in.
 *
 * @param rng the round's generator
 * @returns the schedule, in order of appearance
 */
export function makeSchedule(rng: Rng): Spawn[] {
  // The items so far.
  const out: Spawn[] = [];
  // For each slot, the time it is free again (its last item's end plus the rest).
  const freeAt = new Array<number>(SLOTS).fill(0);
  // The time of the next wave.
  let t = FIRST_SPAWN_MS;
  // Golden bugs so far: at most three in a round, so they stay rare.
  let goldens = 0;
  // Bounded: the loop stops at the end of the round or at the item cap.
  for (let wave = 0; wave < MAX_ITEMS && t < ROUND_MS && out.length < MAX_ITEMS; wave++) {
    // Progress through the round, 0 to 1.
    const p = t / ROUND_MS;
    // One item, or two late in the round (the chance rises from 0 to 35 %).
    const count = rng.chance(lerp(0, 0.35, p)) ? 2 : 1;
    // Each item of the wave.
    for (let k = 0; k < count; k++) {
      // The kind: golden is rare, features grow from 12 % to 24 % of the items.
      const roll = rng.next();
      // Golden first (3.5 %, three at most), then feature, then bug.
      const kind: ItemKind = roll < 0.035 && goldens < 3 ? "golden" : roll < 0.035 + lerp(0.12, 0.24, p) ? "feature" : "bug";
      // The lifetime: the curve, plus or minus 10 %, golden bugs a fifth quicker.
      const base = lerp(1450, 700, p) * (0.9 + rng.next() * 0.2) * (kind === "golden" ? 0.8 : 1);
      // Kept inside the bounds, in whole milliseconds.
      const life = Math.round(Math.min(MAX_LIFE, Math.max(MIN_LIFE, base)));
      // Items must be gone before the round ends.
      if (t + life > ROUND_MS) continue;
      // The slots free for this item's whole life.
      const open: number[] = [];
      // Each slot whose last item (plus the rest) has ended.
      for (let s = 0; s < SLOTS; s++) if (freeAt[s] <= t) open.push(s);
      // No free slot: skip this item.
      if (open.length === 0) continue;
      // A free slot at random.
      const slot = rng.pick(open);
      // The slot is busy until the item ends, then rests.
      freeAt[slot] = t + life + SLOT_REST_MS;
      // A golden bug counted.
      if (kind === "golden") goldens++;
      // The item.
      out.push({ id: out.length, slot, kind, at: Math.round(t), life });
    }
    // The next wave: the interval shrinks, with 20 % jitter either way.
    t += lerp(820, 300, p) * (0.8 + rng.next() * 0.4);
  }
  // The timeline.
  return out;
}

/**
 * The daily round of a UTC day: the same for everyone.
 *
 * @param dayKey the date as YYYY-MM-DD
 * @returns that day's schedule
 */
export function dailySchedule(dayKey: string): Spawn[] {
  // The day's generator for this game.
  return makeSchedule(dailyRng(GAME_ID, dayKey));
}

/**
 * A practice round from a seed the page picks.
 *
 * @param seed any unsigned 32-bit number
 * @returns that seed's schedule
 */
export function practiceSchedule(seed: number): Spawn[] {
  // A plain seeded generator.
  return makeSchedule(makeRng(seed));
}

/** The running score of a round: the state the taps fold into. */
export interface ScoreState {
  /** Points so far (never below zero). */
  score: number;
  /** Consecutive hits right now. */
  combo: number;
  /** The longest run of consecutive hits. */
  bestCombo: number;
  /** Bugs hit (golden included). */
  hits: number;
  /** Golden bugs hit. */
  goldens: number;
  /** Features hit (penalties). */
  features: number;
  /** Taps on an empty slot. */
  whiffs: number;
  /** Bugs that vanished unhit. */
  escapes: number;
  /** All taps. */
  taps: number;
  /** Which schedule items have been hit, by id. */
  hit: boolean[];
  /** How many items, in order of their end time, have been checked for escape. */
  ended: number;
}

/** What one tap did, for the board's feedback and the live region. */
export type TapOutcome = "bug" | "golden" | "feature" | "empty";

/**
 * A fresh score for a schedule.
 *
 * @param schedule the round's items
 * @returns the zero state
 */
export function initScore(schedule: readonly Spawn[]): ScoreState {
  // Nothing hit, nothing counted.
  return { score: 0, combo: 0, bestCombo: 0, hits: 0, goldens: 0, features: 0, whiffs: 0, escapes: 0, taps: 0, hit: new Array<boolean>(schedule.length).fill(false), ended: 0 };
}

/**
 * The schedule's item ids in order of their end time (ties by id), for the escape sweep.
 *
 * @param schedule the round's items
 * @returns ids sorted by at + life
 */
export function endOrder(schedule: readonly Spawn[]): number[] {
  // Every id, sorted by end time, then by id so the order is total.
  return schedule.map((s) => s.id).sort((a, b) => schedule[a].at + schedule[a].life - (schedule[b].at + schedule[b].life) || a - b);
}

/**
 * The multiplier for the next hit, from the combo before it.
 *
 * @param combo consecutive hits so far
 * @returns 1 to MAX_MULT
 */
export function multiplier(combo: number): number {
  // One step every COMBO_STEP hits, capped.
  return Math.min(MAX_MULT, 1 + Math.floor(combo / COMBO_STEP));
}

/**
 * Account for every item that ended at or before a time: an unhit bug that vanished breaks the combo.
 *
 * @param schedule the round's items
 * @param order the ids in end order (endOrder(schedule))
 * @param st the score so far
 * @param t the time now, in milliseconds
 * @returns the score with the escapes counted
 */
export function advance(schedule: readonly Spawn[], order: readonly number[], st: ScoreState, t: number): ScoreState {
  // Work on a copy; the input stays untouched.
  const out: ScoreState = { ...st };
  // Each item whose end has passed and that has not been checked yet.
  while (out.ended < order.length) {
    // The next item to end.
    const item = schedule[order[out.ended]];
    // Not ended yet: stop here.
    if (item.at + item.life > t) break;
    // Checked now.
    out.ended++;
    // A bug (golden or not) that nobody hit got away.
    if (item.kind !== "feature" && !out.hit[item.id]) {
      // One more escape.
      out.escapes++;
      // The run of hits is broken.
      out.combo = 0;
    }
  }
  // The updated score.
  return out;
}

/**
 * The item up in a slot at a time, if any (and not already hit).
 *
 * @param schedule the round's items
 * @param st the score so far (for what has been hit)
 * @param t the time, in milliseconds
 * @param slot the slot, 0-8
 * @returns the item, or null when the slot is empty
 */
export function itemAt(schedule: readonly Spawn[], st: ScoreState, t: number, slot: number): Spawn | null {
  // A linear scan is plenty for a couple of hundred items.
  for (const s of schedule) {
    // Up in this slot at this time, and not hit yet.
    if (s.slot === slot && s.at <= t && t < s.at + s.life && !st.hit[s.id]) return s;
  }
  // Nothing there.
  return null;
}

/**
 * One tap: escapes up to its time are counted first, then the tap lands.
 *
 * @param schedule the round's items
 * @param order the ids in end order
 * @param st the score so far
 * @param t when the tap happened, in milliseconds
 * @param slot which slot was tapped
 * @returns the new score and what the tap hit
 */
export function applyTap(schedule: readonly Spawn[], order: readonly number[], st: ScoreState, t: number, slot: number): { state: ScoreState; outcome: TapOutcome } {
  // Escapes before this instant first, so the combo is right.
  const out = advance(schedule, order, st, t);
  // One more tap.
  out.taps++;
  // What is in the slot.
  const item = itemAt(schedule, out, t, slot);
  // An empty slot: a whiff breaks the run.
  if (!item) {
    // Counted.
    out.whiffs++;
    // Run broken.
    out.combo = 0;
    // No points either way.
    return { state: out, outcome: "empty" };
  }
  // The hit list is copied before it changes.
  out.hit = out.hit.slice();
  // The item is gone now.
  out.hit[item.id] = true;
  // A feature: a penalty, and the run is broken.
  if (item.kind === "feature") {
    // Counted.
    out.features++;
    // Points lost, never below zero.
    out.score = Math.max(0, out.score - PENALTY_FEATURE);
    // Run broken.
    out.combo = 0;
    // Reported.
    return { state: out, outcome: "feature" };
  }
  // A bug: points times the multiplier earned so far.
  out.score += (item.kind === "golden" ? POINTS_GOLDEN : POINTS_BUG) * multiplier(out.combo);
  // One more in the run.
  out.combo++;
  // The best run follows it.
  out.bestCombo = Math.max(out.bestCombo, out.combo);
  // Counted.
  out.hits++;
  // Golden ones counted apart too.
  if (item.kind === "golden") out.goldens++;
  // Reported.
  return { state: out, outcome: item.kind };
}

/** One tap as recorded: when and where. */
export interface Tap {
  /** Milliseconds from the start of the round. */
  t: number;
  /** The slot, 0-8. */
  slot: number;
}

/**
 * The final score of a round: every tap in time order, then every escape to the end.
 *
 * @param schedule the round's items
 * @param taps the taps, in any order
 * @returns the final score
 */
export function scoreRound(schedule: readonly Spawn[], taps: readonly Tap[]): ScoreState {
  // The ids in end order.
  const order = endOrder(schedule);
  // From zero.
  let st = initScore(schedule);
  // Taps in time order (ties by slot, so the result never depends on the input order).
  const sorted = taps.slice().sort((a, b) => a.t - b.t || a.slot - b.slot);
  // Each tap folds in.
  for (const tap of sorted) st = applyTap(schedule, order, st, tap.t, tap.slot).state;
  // Whatever is left ends by the end of the round.
  return advance(schedule, order, st, ROUND_MS);
}

/**
 * Accuracy: good hits over all taps, as a whole percentage.
 *
 * @param st a score
 * @returns 0-100 (0 when nothing was tapped)
 */
export function accuracy(st: ScoreState): number {
  // No taps, no accuracy to speak of.
  if (st.taps === 0) return 0;
  // Rounded to a whole percent.
  return Math.round((st.hits / st.taps) * 100);
}

/**
 * The taps of a perfect player: every bug and golden bug, a reaction time after it appears; no feature, no whiff.
 *
 * @param schedule the round's items
 * @param reactionMs how long after appearing each is hit
 * @returns the taps
 */
export function perfectTaps(schedule: readonly Spawn[], reactionMs = 250): Tap[] {
  // Every item that is not a feature, hit within its life.
  return schedule.filter((s) => s.kind !== "feature").map((s) => ({ t: s.at + Math.min(reactionMs, s.life - 1), slot: s.slot }));
}

/**
 * The taps of a player who mashes every slot every so often (to prove that mashing does not pay).
 *
 * @param everyMs the interval between sweeps
 * @returns the taps
 */
export function mashTaps(everyMs = 100): Tap[] {
  // The taps.
  const out: Tap[] = [];
  // Every sweep through the round.
  for (let t = 0; t < ROUND_MS; t += everyMs) for (let s = 0; s < SLOTS; s++) out.push({ t, slot: s });
  // All of them.
  return out;
}

/**
 * Check one schedule: bounds, order, ids, and no two items in a slot at once.
 *
 * @param sched the schedule
 * @returns problems found, empty when well formed
 */
function checkSchedule(sched: readonly Spawn[]): string[] {
  // Problems.
  const bad: string[] = [];
  // Each item on its own.
  sched.forEach((s, i) => {
    // Ids are positions.
    if (s.id !== i) bad.push(`item ${i} has id ${s.id}`);
    // A real slot.
    if (!Number.isInteger(s.slot) || s.slot < 0 || s.slot >= SLOTS) bad.push(`item ${i} slot ${s.slot}`);
    // A lifetime within bounds.
    if (s.life < MIN_LIFE || s.life > MAX_LIFE) bad.push(`item ${i} life ${s.life}`);
    // Inside the round.
    if (s.at < 0 || s.at + s.life > ROUND_MS) bad.push(`item ${i} outside the round`);
    // In order of appearance.
    if (i > 0 && s.at < sched[i - 1].at) bad.push(`item ${i} out of order`);
  });
  // Per slot, each item ends (plus the rest) before the next one appears.
  for (let slot = 0; slot < SLOTS; slot++) {
    // The slot's items, in order.
    const mine = sched.filter((s) => s.slot === slot);
    // Each consecutive pair.
    for (let i = 1; i < mine.length; i++) if (mine[i - 1].at + mine[i - 1].life + SLOT_REST_MS > mine[i].at) bad.push(`slot ${slot} overlap at ${mine[i].at}`);
  }
  // The list.
  return bad;
}

/**
 * The self-test: 400 daily rounds from launch, plus 100 practice seeds.
 *
 * For each: generated twice and identical; well formed (bounds, order, no two
 * items in one slot at once); enough bugs to play; a perfect bot scores at
 * least ten points a bug with no penalty and nothing escaping; a player who
 * never taps scores zero with every bug escaping; a masher scores less than
 * the perfect bot; and the score fold does not depend on the order of the taps.
 *
 * @returns the report
 */
export function selfTest(): SelfTestReport {
  // Problems found.
  const failures: string[] = [];
  // Rounds checked.
  let checked = 0;
  // The days and seeds to check: 400 days from launch, then 100 practice seeds.
  const cases: { label: string; make: () => Spawn[] }[] = [];
  // The daily rounds.
  for (let d = 0; d < 400; d++) {
    // The day.
    const day = addDays(LAUNCH_DAY, d);
    // Its case.
    cases.push({ label: day, make: () => dailySchedule(day) });
  }
  // The practice seeds (a fixed spread of 32-bit values).
  for (let k = 0; k < 100; k++) {
    // A seed far from the others.
    const seed = (Math.imul(k + 1, 0x9e3779b1) >>> 0);
    // Its case.
    cases.push({ label: `seed ${seed}`, make: () => practiceSchedule(seed) });
  }
  // Each case.
  for (const c of cases) {
    // Generated twice.
    const a = c.make();
    const b = c.make();
    // Identical, field for field.
    if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${c.label}: not deterministic`);
    // Well formed.
    for (const p of checkSchedule(a)) failures.push(`${c.label}: ${p}`);
    // Bugs to hit: at least sixty in a minute.
    const bugs = a.filter((s) => s.kind !== "feature").length;
    if (bugs < 60) failures.push(`${c.label}: only ${bugs} bugs`);
    // Some features to avoid.
    if (!a.some((s) => s.kind === "feature")) failures.push(`${c.label}: no feature to avoid`);
    // The perfect bot.
    const perfect = scoreRound(a, perfectTaps(a));
    // Every bug hit, nothing else.
    if (perfect.hits !== bugs || perfect.escapes !== 0 || perfect.features !== 0 || perfect.whiffs !== 0) failures.push(`${c.label}: perfect bot missed something`);
    // At least ten points a bug, and full accuracy.
    if (perfect.score < bugs * POINTS_BUG || accuracy(perfect) !== 100) failures.push(`${c.label}: perfect score ${perfect.score} too low`);
    // The idle player.
    const idle = scoreRound(a, []);
    // Zero points, every bug escaped, no accuracy.
    if (idle.score !== 0 || idle.escapes !== bugs || idle.hits !== 0 || accuracy(idle) !== 0) failures.push(`${c.label}: never-click score not zero`);
    // The masher does worse than the perfect bot.
    const mash = scoreRound(a, mashTaps());
    if (mash.score >= perfect.score) failures.push(`${c.label}: mashing (${mash.score}) beats perfect play (${perfect.score})`);
    // The fold is order independent: the same taps reversed give the same score.
    if (scoreRound(a, perfectTaps(a).reverse()).score !== perfect.score) failures.push(`${c.label}: tap order changes the score`);
    // One more round checked.
    checked++;
  }
  // The report.
  return { checked, failures };
}
