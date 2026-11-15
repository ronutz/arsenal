// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/verify.ts
// ----------------------------------------------------------------------------
// THE SCOREBOARD'S HONESTY CHECK (PRIME's decisions of 08/11/2026). Pure, no
// React, no browser: the Worker (worker/scores.ts) runs it on every posted
// round, and the pre-build check (scripts/check-fun-games.mts) runs its golden
// cases. The browser never imports it, so the engines it pulls in do not
// travel to every game page.
//
// THE RULE. The browser sends a game's OWN saved daily state (the fields
// src/lib/fun/board-rules.ts sentState() keeps) and never a score. For each
// daily game a function here regenerates that day's puzzle with the game's
// engine and grades the board, the answers or the picks again; the server
// stores what this returns, never what the browser claimed. A state that is
// not a genuine finished round of that day's puzzle returns null and is
// refused, so a forged "solved" never reaches the board.
//
// WHAT CANNOT BE PROVEN, SAID PLAINLY.
//   - A time. A clock runs in the player's browser; a state can carry any
//     number. Where the score is a time, it is recomputed from its parts (the
//     clock plus the penalties for checks, hints and the assist), and a
//     plausibility floor per game marks a time faster than any person could
//     enter the solution as implausible: it is stored and counted in the day's
//     totals, but kept out of the top ten and out of the averages.
//   - Counts the game keeps about itself and that no board shows afterwards:
//     Spanning Tree's mistakes, First Match's waves, the hints Exit the Editor
//     was asked for. They only ever cost the player, so a forged state can only
//     claim fewer; they are taken as sent, and the board says which games are
//     checked in full.
//   - Whack-a-Bug's minute is played in real time and keeps no record of its
//     taps, and Aggregate keeps no list of its moves: neither can be replayed.
//     Both are held to bounds the day's own puzzle sets (no more hits than the
//     day's bugs, no score above a perfect run; a final board whose score its
//     tiles can account for) and carry a "not verified" flag.
//   - Incident Commander is not a daily game and never reaches the board.
// ============================================================================

// The day arithmetic, for the self-test's run of days.
import { LAUNCH_DAY, addDays } from "./daily";
// Prefix of the Day: the day's answer, the marks and hard mode.
import { MAX_TRIES, allOk, dailyPuzzle, grade, hardViolation, isBitsTry, solve as podSolve, type Facts } from "./games/prefix-of-the-day/engine";
// Five Clues: the day's puzzle and the judge.
import { CLUES, acceptedAnswers, dailyFor, judge as fiveJudge } from "./games/five-clues/engine";
// Access Points: the day's floor and the solved test.
import { generate as apGenerate, isSolved as apSolved, type ApMark, type ApPuzzle } from "./games/access-points/engine";
// Bit Balance: the day's grid and the solved test.
import { BB_N, generate as bbGenerate, isSolved as bbSolved, type BbPuzzle } from "./games/bit-balance/engine";
// Patch Path: the day's panel, the step rule and the solved test.
import { canStep, generate as ppGenerate, isSolved as ppSolved, type PpPuzzle } from "./games/patch-path/engine";
// Spanning Tree: the day's network per level, its answer and the score.
import { dailyStp, solveStp, stpScore, type StpAnswer, type StpLevel, type StpPuzzle } from "./games/spanning-tree/engine";
// Log Detective: the day's case and the answers.
import { QUESTIONS, dailyCase, isRight, type Case } from "./games/log-detective/engine";
// Phish or Legit: the day's cards and the scoring.
import { DAILY_SIZE, PASS_MARK, dailyRound, scoreRun, type Card } from "./games/phish-or-legit/engine";
// Whack-a-Bug: the day's schedule and a perfect run's score.
import { dailySchedule, perfectTaps, scoreRound, type Spawn } from "./games/whack-a-bug/engine";
// Aggregate: the round's shape, its moves and a fresh daily round's /16.
import { CELLS, blockSize, canMove, isState, newGame, playGreedy, type State as AggState, type Tile } from "./games/aggregate/engine";
// First Match: the day's level, the access-list judge and the score.
import { DAILY_WAVES, dailyLevel, judge as fmJudge, levelScore as fmLevelScore, solve as fmSolve, type FmLevel } from "./games/first-match/engine";
// Exit the Editor: the day's trap, the replay and the score.
import { dailyEscape, levelScore as exitLevelScore, replayDaily, type DailyEscape } from "./games/exit-the-editor/engine";
// Packet Stack: the day's deal, the replay of its placements and the pass mark.
import { DAILY_BLOCKS as PS_BLOCKS, PASS_MARK as PS_PASS, dailyDeal as psDailyDeal, perfectScore as psPerfect, playFromScreen as psPlay, playIdle as psIdle, replay as psReplay, type Block as PsBlock } from "./games/packet-stack/engine";
// TTL: the run replayed from its turns, and the safe bot's completed run of a day for the golden cases.
import { goldenSave as ttlGoldenSave, verifySaved as ttlVerifySaved } from "./games/ttl/engine";
// Rule Inspector: the day's shift, the grading, the pass mark and the shift's size.
import { PASS_MARK as RI_PASS, SHIFT_SIZE as RI_SIZE, dailyShift as riDailyShift, grade as riGrade, type Shift as RiShift } from "./games/rule-inspector/engine";

/** A round as the server stores it, every number worked out here. */
export interface Verified {
  /** Solved (or passed, or won) by the game's own rule. */
  won: boolean;
  /** The headline number in the game's direction, or null when the round has none (an unsolved X). */
  score: number | null;
  /** The time that breaks ties between equal scores, in milliseconds, or null. */
  timeMs: number | null;
  /** The parts the game shows (tries, checks, hints, assist, mistakes, waves...). */
  parts: Record<string, number | boolean>;
  /** True when the engine re-graded the round; false for the games held to plausibility bounds only. */
  verified: boolean;
  /** False when the time is faster than a person could enter the solution: counted, kept out of the top ten. */
  plausible: boolean;
}

/** The longest believable round, in milliseconds: a day (a clock that says more is broken or forged). */
const MAX_MS = 86_400_000;

/** The largest believable count of checks, hints or mistakes. */
const MAX_COUNT = 10_000;

/** The most keystrokes an Exit the Editor attempt is read for. */
const MAX_KEYS = 5000;

/** Log Detective's pass mark: right answers that keep the streak (the component's PASS, src/components/dev/fun/games/LogDetective.tsx). */
const LD_PASS = 2;

/** The logic puzzle kit's penalty per Check and per Hint, in milliseconds (each grid game's PENALTY_S, 10 s). */
const KIT_PENALTY_MS = 10_000;

/** Access Points' price for the auto-mark, once per floor, in milliseconds (its AUTO_MARK_S, 30 s). */
const AP_ASSIST_MS = 30_000;

// ---- Plausibility floors ---------------------------------------------------------------------------------------
// Each floor is the fewest inputs the day's board needs, at a pace no person keeps up while also reading the board;
// below it, only a script that already knows the answer is that fast. They are deliberately low: a fast, genuine
// player is never caught by one, and a time under one is still counted in the day's totals.
/** No timed round is believable under three seconds: the board has to be read before the first move. */
const FLOOR_MIN_MS = 3000;
/** Access Points: each access point needs a double tap or a long press, about half a second with the reading. */
const AP_MS_PER_POINT = 500;
/** Bit Balance: each empty cell needs at least one tap. */
const BB_MS_PER_CELL = 150;
/** Patch Path: a drag can run through cells quickly, but not faster than this each. */
const PP_MS_PER_CELL = 60;
/** Spanning Tree: the root, each root port and each designated port is a click on the drawing. */
const STP_MS_PER_CLICK = 250;
/** Log Detective: three answers about a log of dozens of lines cannot be given in less. */
const LD_FLOOR_MS = 4000;
/** Phish or Legit: fifteen cards, each read and judged (the clock stops while an explanation is up). */
const POL_MS_PER_CARD = 400;
/** Exit the Editor: the clock starts on the first key, and each later key takes at least this long to type. */
const EXIT_MS_PER_KEY = 60;
/** Packet Stack: each block is steered, its field set and dropped; no person keeps up more than about eight a second. */
const PS_MS_PER_BLOCK = 120;
/** Rule Inspector: each of the fifteen connections is read against the policy before it is called. */
const RI_MS_PER_CALL = 400;

// ---- Small readers ------------------------------------------------------------------------------------------------

/**
 * A plain object, or null.
 *
 * @param x anything
 * @returns x as a record when it is a plain object
 */
function obj(x: unknown): Record<string, unknown> | null {
  // Arrays and null are not records.
  return x !== null && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
}

/**
 * A whole number in a range, or null.
 *
 * @param x anything
 * @param lo the smallest allowed
 * @param hi the largest allowed
 * @returns x when it is an integer in [lo, hi]
 */
function int(x: unknown, lo: number, hi: number): number | null {
  // Integers only, inside the range.
  return typeof x === "number" && Number.isInteger(x) && x >= lo && x <= hi ? x : null;
}

/**
 * A time in milliseconds, or null.
 *
 * @param x anything
 * @returns x when it is a finite number from 0 to a day
 */
function ms(x: unknown): number | null {
  // Finite, not negative, not beyond a day.
  return typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= MAX_MS ? x : null;
}

// ---- A small memory of generated puzzles ------------------------------------------------------------------------
// The Worker lives on across requests, and a day's puzzle is the same for everyone, so it is built once per day and
// game rather than once per post. Bounded, oldest first out.
/** The generated puzzles, by "game|day|variant". */
const MEMO = new Map<string, unknown>();
/** How many puzzles are kept at most. */
const MEMO_MAX = 64;

/**
 * A generated value, built once per key.
 *
 * @param key the game, day and variant
 * @param make how to build it
 * @returns the value
 */
function cached<T>(key: string, make: () => T): T {
  // Built before.
  if (MEMO.has(key)) return MEMO.get(key) as T;
  // Built now.
  const v = make();
  // The oldest entry leaves when the memory is full (a Map keeps insertion order).
  if (MEMO.size >= MEMO_MAX) MEMO.delete(MEMO.keys().next().value as string);
  // Kept.
  MEMO.set(key, v);
  // Returned.
  return v;
}

// ---- The games ----------------------------------------------------------------------------------------------------

/**
 * Prefix of the Day: the tries are graded again against the day's answer. The round ends on the solving try or on the
 * sixth, so a try after a solve, a seventh try or an open round is refused. Hard mode is reported only when every try
 * kept to every earlier hint.
 *
 * @param day the puzzle's day
 * @param state the saved state ({ guesses, hard })
 * @returns the round, or null
 */
function verifyPrefix(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // The tries.
  const rows = s?.guesses;
  // One to six tries.
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_TRIES) return null;
  // Each try: four whole numbers (an address, an address, a mask, a host count), all inside IPv4's range.
  const facts: Facts[] = [];
  // Read in order.
  for (const row of rows) {
    // Four entries.
    if (!Array.isArray(row) || row.length !== 4) return null;
    // Each a whole number from 0 to 2^32.
    const v = row.map((n) => int(n, 0, 2 ** 32));
    // Any malformed entry refuses the round.
    if (v.some((n) => n === null)) return null;
    // As the engine's facts.
    facts.push({ network: v[0]!, broadcast: v[1]!, mask: v[2]!, hosts: v[3]! });
  }
  // The day's answer.
  const answer = cached(`pod|${day}`, () => podSolve(dailyPuzzle(day)));
  // The first solving try.
  const solvedAt = facts.findIndex((g) => allOk(grade(g, answer)));
  // A try after the solve is not how the game plays.
  if (solvedAt >= 0 && solvedAt !== facts.length - 1) return null;
  // An unsolved round is finished only after the sixth try.
  if (solvedAt < 0 && facts.length < MAX_TRIES) return null;
  // Solved or not.
  const won = solvedAt >= 0;
  // Hard mode, kept only when every try respected every earlier hint.
  let hard = s?.hard === true;
  // Each try against the ones before it.
  for (let i = 1; hard && i < facts.length; i++) if (hardViolation(facts.slice(0, i), answer, facts[i]) !== null) hard = false;
  // The round: tries are the score (fewer is better), X when unsolved.
  // The bit view was turned on: its marker row is one of the tries (the penalty), counted like any other try.
  const bits = facts.some(isBitsTry);
  // The round: tries are the score (fewer is better), X when unsolved.
  return { won, score: won ? facts.length : null, timeMs: null, parts: { tries: facts.length, hard, bits }, verified: true, plausible: true };
}

/**
 * Five Clues: every guess is judged again. A clue passed is an empty guess; a guess the game calls "close" never
 * spends a clue, so it cannot be in a saved round. The round ends on the right guess or after the fifth clue.
 *
 * @param day the puzzle's day
 * @param state the saved state ({ guesses, solved })
 * @returns the round, or null
 */
function verifyFiveClues(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // The guesses.
  const g = s?.guesses;
  // One to five, each a short string.
  if (!Array.isArray(g) || g.length < 1 || g.length > CLUES || !g.every((x) => typeof x === "string" && x.length <= 200)) return null;
  // The day's puzzle.
  const p = cached(`five|${day}`, () => dailyFor(day));
  // Each guess's verdict ("" is a pass).
  const verdicts = (g as string[]).map((x) => (x.trim() === "" ? "pass" : fiveJudge(x, p)));
  // A "close" or an empty-but-not-blank guess cannot have spent a clue.
  if (verdicts.some((v) => v === "close" || v === "empty")) return null;
  // The first right guess.
  const rightAt = verdicts.indexOf("right");
  // A guess after the right one is not how the game plays.
  if (rightAt >= 0 && rightAt !== verdicts.length - 1) return null;
  // Solved or not.
  const won = rightAt >= 0;
  // An unsolved round is over only after the fifth clue.
  if (!won && g.length < CLUES) return null;
  // The saved flag must agree with the judge (a forged "solved" is refused).
  if (s?.solved !== won) return null;
  // The round: clues used are the score (fewer is better).
  return { won, score: won ? g.length : null, timeMs: null, parts: { clues: g.length }, verified: true, plausible: true };
}

/** What the logic puzzle kit saves, as the server reads it. */
interface KitRound {
  /** The board. */
  b: unknown;
  /** The clock, without penalties. */
  e: number;
  /** Checks. */
  k: number;
  /** Hints. */
  h: number;
  /** The assist taken. */
  a: boolean;
}

/**
 * The logic puzzle kit's saved round, read and its time recomputed from its parts (the clock, plus a check's and a
 * hint's price each, plus the assist's once); a claimed final time that disagrees with the parts is refused.
 *
 * @param state the saved state ({ b, e, k, h, a, d, t })
 * @param assistMs the game's assist price (0 for none)
 * @returns the round's parts and total, or null
 */
function readKit(state: unknown, assistMs: number): (KitRound & { total: number }) | null {
  // The state.
  const s = obj(state);
  // Only a finished round.
  if (!s || s.d !== true) return null;
  // The clock.
  const e = ms(s.e);
  // Checks, and hints (none in a round saved before hints existed).
  const k = int(s.k, 0, MAX_COUNT);
  const h = s.h === undefined ? 0 : int(s.h, 0, MAX_COUNT);
  // Malformed numbers refuse the round.
  if (e === null || k === null || h === null) return null;
  // The assist (absent before assists existed).
  const a = s.a === true;
  // The total from the parts.
  const total = e + (k + h) * KIT_PENALTY_MS + (a ? assistMs : 0);
  // The saved final time must be the same total (a millisecond of rounding allowed).
  if (typeof s.t !== "number" || !Number.isFinite(s.t) || Math.abs(s.t - total) > 1) return null;
  // The parts.
  return { b: s.b, e, k, h, a, total };
}

/**
 * A kit round as the board stores it.
 *
 * @param r the read round
 * @param floorMs the game's plausibility floor for this puzzle
 * @returns the verified round
 */
function kitVerified(r: KitRound & { total: number }, floorMs: number): Verified {
  // The time with penalties is the score (lower is better); the clock alone is held to the floor.
  return {
    won: true,
    score: Math.round(r.total),
    timeMs: Math.round(r.total),
    parts: { clockMs: Math.round(r.e), checks: r.k, hints: r.h, assist: r.a },
    verified: true,
    plausible: r.e >= floorMs,
  };
}

/**
 * Access Points: the board must hold the day's unique answer (n access points, none sharing a row, column or zone,
 * none touching), as the engine checks it.
 *
 * @param day the puzzle's day
 * @param state the kit's saved round
 * @returns the round, or null
 */
function verifyAccessPoints(day: string, state: unknown): Verified | null {
  // Parts and total.
  const r = readKit(state, AP_ASSIST_MS);
  // Not a finished round.
  if (!r) return null;
  // The day's floor plan.
  const p = cached<ApPuzzle>(`ap|${day}`, () => apGenerate(day));
  // n * n marks, each nothing, a cross or an access point.
  const b = r.b;
  // The board's shape.
  if (!Array.isArray(b) || b.length !== p.n * p.n || !b.every((v) => v === 0 || v === 1 || v === 2)) return null;
  // Solved by the engine's rule.
  if (!apSolved(p, b as ApMark[])) return null;
  // The floor: n placements.
  return kitVerified(r, Math.max(FLOOR_MIN_MS, p.n * AP_MS_PER_POINT));
}

/**
 * Bit Balance: the grid must be full, keep its givens and break no rule (the answer is unique).
 *
 * @param day the puzzle's day
 * @param state the kit's saved round
 * @returns the round, or null
 */
function verifyBitBalance(day: string, state: unknown): Verified | null {
  // Parts and total.
  const r = readKit(state, 0);
  // Not a finished round.
  if (!r) return null;
  // The day's grid.
  const p = cached<BbPuzzle>(`bb|${day}`, () => bbGenerate(day));
  // The board.
  const b = r.b;
  // 36 cells, each empty, 0 or 1, the givens untouched.
  if (!Array.isArray(b) || b.length !== BB_N * BB_N || !b.every((v, i) => (v === -1 || v === 0 || v === 1) && (p.given[i] < 0 || v === p.given[i]))) return null;
  // Solved by the engine's rule.
  if (!bbSolved(p, b as number[])) return null;
  // The floor: one tap per empty cell.
  return kitVerified(r, Math.max(FLOOR_MIN_MS, p.given.filter((v) => v < 0).length * BB_MS_PER_CELL));
}

/**
 * Patch Path: the cable must run through every cell, step legally, visit the ports in order and end on the last.
 *
 * @param day the puzzle's day
 * @param state the kit's saved round
 * @returns the round, or null
 */
function verifyPatchPath(day: string, state: unknown): Verified | null {
  // Parts and total.
  const r = readKit(state, 0);
  // Not a finished round.
  if (!r) return null;
  // The day's panel.
  const p = cached<PpPuzzle>(`pp|${day}`, () => ppGenerate(day));
  // The cable.
  const b = r.b;
  // Distinct in-range cells, each step a legal one.
  if (!Array.isArray(b) || !b.every((v) => Number.isInteger(v) && v >= 0 && v < p.n * p.n) || !b.every((v, k) => k === 0 || canStep(p, b[k - 1] as number, v as number))) return null;
  // Solved by the engine's rule.
  if (!ppSolved(p, b as number[])) return null;
  // The floor: every cell.
  return kitVerified(r, Math.max(FLOOR_MIN_MS, p.n * p.n * PP_MS_PER_CELL));
}

/**
 * Whether a list of port numbers is exactly a set of ports.
 *
 * @param x the saved list
 * @param want the answer's ports
 * @returns true when x holds the same ports, each once
 */
function samePorts(x: unknown, want: readonly number[]): boolean {
  // A list of whole numbers.
  if (!Array.isArray(x) || !x.every((v) => Number.isInteger(v))) return false;
  // The same size, no repeats, and every one wanted.
  return x.length === want.length && new Set(x).size === x.length && x.every((v) => want.includes(v as number));
}

/**
 * Spanning Tree, one level: a solved level's marks must be the day's answer (the root, every root port, every
 * designated port and the blocked ones); a level given up shows the answer and counts as played, not solved. The
 * mistakes are taken as sent (they only cost the player).
 *
 * @param day the puzzle's day
 * @param state the level's saved state ({ marks, mistakes, ms, done, won })
 * @param mode the level, "easy" or "hard"
 * @returns the round, or null
 */
function verifySpanningTree(day: string, state: unknown, mode: string): Verified | null {
  // Only the two levels.
  if (mode !== "easy" && mode !== "hard") return null;
  // The state.
  const s = obj(state);
  // Only a finished level.
  if (!s || s.done !== true) return null;
  // The time.
  const t = ms(s.ms);
  // The mistakes per step.
  const m = s.mistakes;
  // Three whole numbers.
  if (t === null || !Array.isArray(m) || m.length !== 3 || m.some((x) => int(x, 0, MAX_COUNT) === null)) return null;
  // Their sum.
  const mistakes = (m as number[]).reduce((a, b) => a + b, 0);
  // Given up: played, not solved.
  if (s.won !== true) return { won: false, score: null, timeMs: null, parts: { ms: Math.round(t), mistakes }, verified: true, plausible: true };
  // The day's network for the level, and its answer.
  const pz = cached<StpPuzzle>(`stp|${day}|${mode}`, () => dailyStp(day, mode as StpLevel));
  const ans = cached<StpAnswer>(`stpa|${day}|${mode}`, () => solveStp(pz).answer);
  // The marks.
  const marks = obj(s.marks);
  // The root, the root ports, the designated ports and the blocked ones, all the answer's.
  const right =
    !!marks &&
    marks.root === ans.root &&
    samePorts(marks.rp, ans.rootPort.filter((p): p is number => p !== null)) &&
    samePorts(marks.dp, ans.designated) &&
    samePorts(marks.bk, ans.blocked);
  // A "solved" level whose marks are not the answer is refused.
  if (!right) return null;
  // The floor: one click for the root, each root port and each designated port.
  const floor = Math.max(FLOOR_MIN_MS, (1 + (pz.switches.length - 1) + pz.segments.length) * STP_MS_PER_CLICK);
  // The score: whole seconds plus ten a mistake (lower is better); the time breaks ties.
  return { won: true, score: stpScore(t, mistakes), timeMs: Math.round(t), parts: { ms: Math.round(t), mistakes }, verified: true, plausible: t >= floor };
}

/**
 * Log Detective: the three answers (the attacker's address, the first malicious line, the line where it got in) are
 * checked against the day's case; two right keep the streak.
 *
 * @param day the puzzle's day
 * @param state the saved state ({ answers, elapsed })
 * @returns the round, or null
 */
function verifyLogDetective(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // The answers.
  const a = s?.answers;
  // The time.
  const t = ms(s?.elapsed);
  // Three answers and a time.
  if (!Array.isArray(a) || a.length !== 3 || t === null) return null;
  // The day's case.
  const kase = cached<Case>(`ld|${day}`, () => dailyCase(day));
  // An address, then two line numbers inside the log.
  if (typeof a[0] !== "string" || a[0].length > 64 || int(a[1], 0, kase.lines.length - 1) === null || int(a[2], 0, kase.lines.length - 1) === null) return null;
  // The right ones.
  const right = a.filter((x, i) => isRight(kase, QUESTIONS[i], x as string | number)).length;
  // The round: answers right are the score (more is better), the time breaks ties.
  return { won: right >= LD_PASS, score: right, timeMs: Math.round(t), parts: { right, ms: Math.round(t) }, verified: true, plausible: t >= LD_FLOOR_MS };
}

/**
 * Phish or Legit: the fifteen picks are scored again against the day's cards (points with the streak bonus); ten
 * right keep the streak. A round saved before the clock existed (08/11/2026) has no time and breaks no ties.
 *
 * @param day the puzzle's day
 * @param state the saved state ({ picks, e, t })
 * @returns the round, or null
 */
function verifyPhishOrLegit(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // The picks, one letter a card.
  const picks = s?.picks;
  // Exactly fifteen, each p (phish) or l (legit).
  if (typeof picks !== "string" || picks.length !== DAILY_SIZE || !/^[pl]+$/.test(picks)) return null;
  // The day's cards.
  const cards = cached<Card[]>(`pol|${day}`, () => dailyRound(day));
  // Each right or wrong.
  const oks = Array.from(picks).map((ch, i) => (ch === "p" ? "phish" : "legit") === cards[i].verdict);
  // The points, the right answers and the best streak.
  const sc = scoreRun(oks);
  // The final time, when there is one (a malformed one refuses the round).
  const t = s?.t === undefined ? null : ms(s.t);
  // Present but malformed.
  if (s?.t !== undefined && t === null) return null;
  // The round: points are the score (more is better), the time breaks ties.
  return {
    won: sc.correct >= PASS_MARK,
    score: sc.points,
    timeMs: t === null ? null : Math.round(t),
    parts: { correct: sc.correct, streak: sc.bestStreak, ...(t === null ? {} : { ms: Math.round(t) }) },
    verified: true,
    plausible: t === null || t >= DAILY_SIZE * POL_MS_PER_CARD,
  };
}

/** What the day's Whack-a-Bug run allows at most. */
interface WabBounds {
  /** Bugs, golden ones included. */
  bugs: number;
  /** Golden bugs. */
  goldens: number;
  /** Features. */
  features: number;
  /** A perfect run's score: every bug hit, none missed, nothing else tapped. */
  perfect: number;
}

/**
 * Whack-a-Bug, plausibility only: the minute is played in real time and keeps no record of its taps, so the run's
 * numbers are held to what the day's schedule allows (no more hits than bugs, no score above a perfect run) and a
 * run with every bug hit, no feature tapped and full accuracy, which is what the engine's own perfect bot does, is
 * kept out of the top ten.
 *
 * @param day the puzzle's day
 * @param state the closed run ({ done, score, acc, bestCombo, hits, goldens, features, interrupted })
 * @returns the round, or null
 */
function verifyWhackABug(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // Only a closed run.
  if (!s || s.done !== true) return null;
  // The day's limits.
  const lim = cached<WabBounds>(`wab|${day}`, () => {
    // The day's items.
    const sched: Spawn[] = dailySchedule(day);
    // Counted by kind, and a perfect run scored by the engine.
    return {
      bugs: sched.filter((x) => x.kind !== "feature").length,
      goldens: sched.filter((x) => x.kind === "golden").length,
      features: sched.filter((x) => x.kind === "feature").length,
      perfect: scoreRound(sched, perfectTaps(sched)).score,
    };
  });
  // The numbers, each inside what the day allows.
  const hits = int(s.hits, 0, lim.bugs);
  const goldens = int(s.goldens, 0, lim.goldens);
  const features = int(s.features, 0, lim.features);
  const acc = int(s.acc, 0, 100);
  const score = int(s.score, 0, lim.perfect);
  // Any number outside its bound refuses the run.
  if (hits === null || goldens === null || features === null || acc === null || score === null || goldens > hits) return null;
  // The longest run of hits cannot exceed the hits.
  const combo = int(s.bestCombo, 0, hits);
  // Malformed.
  if (combo === null) return null;
  // The perfect bot's signature.
  const botLike = hits === lim.bugs && features === 0 && acc === 100;
  // The round: points (more is better), not verified.
  return {
    won: score > 0,
    score,
    timeMs: null,
    parts: { hits, goldens, features, acc, bestCombo: combo, interrupted: s.interrupted === true },
    verified: false,
    plausible: !botLike,
  };
}

/**
 * Aggregate, plausibility only: the round keeps its final board but not its moves, so the board is checked for what
 * any finished daily round must be (the day's own /16, no move left, no two tiles overlapping, the largest block on
 * the board), and the score for what its tiles can account for. A tile of length L holds 2^(32 - L) addresses built
 * from /27 and /26 spawns; merging scores the merged block's size, so the tile scored between its size times
 * (26 - L) (all /26 spawns) and its size times (27 - L) (all /27 spawns), and every merge scores a multiple of 64.
 *
 * @param day the puzzle's day
 * @param state the saved day ({ game, counted })
 * @returns the round, or null
 */
function verifyAggregate(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // The counted round.
  const g = s?.game;
  // A well-formed round, finished, of this day's challenge.
  if (!isState(g) || g.over !== true || g.source.kind !== "daily" || g.source.day !== day || g.cells.length !== CELLS) return null;
  // The day's /16, from a fresh round of the same day.
  const base = cached<number>(`agg|${day}`, () => newGame({ kind: "daily", day }).base);
  // Another /16 is another round.
  if (g.base !== base) return null;
  // The tiles on the board.
  const tiles = g.cells.filter((c): c is Tile => c !== null);
  // Each aligned on its own size.
  if (!tiles.every((t) => (t.net - base) % blockSize(t.len) === 0)) return null;
  // No two overlapping (prefixes are nested or disjoint, so a start inside the other's range is an overlap).
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) {
    // The pair.
    const a = tiles[i], b = tiles[j];
    // Overlapping.
    if (a.net < b.net + blockSize(b.len) && b.net < a.net + blockSize(a.len)) return null;
  }
  // No move left.
  if (canMove(g as AggState)) return null;
  // The largest block on the board is the round's best (tiles only ever merge).
  if (tiles.length > 0 && g.bestLen !== Math.min(...tiles.map((t) => t.len))) return null;
  // The score its tiles can account for.
  const lo = tiles.reduce((sum, t) => sum + blockSize(t.len) * Math.max(0, 26 - t.len), 0);
  const hi = tiles.reduce((sum, t) => sum + blockSize(t.len) * (27 - t.len), 0);
  // Outside the bounds, or not a multiple of the smallest merge.
  if (!Number.isInteger(g.score) || g.score < lo || g.score > hi || g.score % 64 !== 0) return null;
  // The round: addresses summarised (more is better), won at a /24 or larger; not verified.
  return { won: g.bestLen <= 24, score: g.score, timeMs: null, parts: { bestLen: g.bestLen, moves: g.moves }, verified: false, plausible: true };
}

/**
 * First Match: the final list is judged again by the access-list engine against the day's wave; a passed daily
 * scores as a level does (ten a packet, a bonus at par, less for extra waves). The waves sent before are taken as
 * sent (they only cost the player). A lost daily (out of waves, or the answer asked for) is played, not solved.
 *
 * @param day the puzzle's day
 * @param state the saved state ({ order, waves, done, won })
 * @returns the round, or null
 */
function verifyFirstMatch(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // Only a finished daily.
  if (!s || s.done !== true) return null;
  // The day's level.
  const level = cached<FmLevel>(`fm|${day}`, () => dailyLevel(day));
  // The cards by id.
  const byId = new Map(level.cards.map((c) => [c.id, c]));
  // The list.
  const order = s.order;
  // Card ids, each once.
  if (!Array.isArray(order) || order.length > level.cards.length || !order.every((id) => typeof id === "string" && byId.has(id)) || new Set(order).size !== order.length) return null;
  // The waves sent.
  const waves = s.waves;
  // Up to the day's waves, each a list of right and wrong.
  if (!Array.isArray(waves) || waves.length > DAILY_WAVES || !waves.every((w) => Array.isArray(w) && w.every((x) => typeof x === "boolean"))) return null;
  // The list passes when every packet is judged right.
  const passes = fmJudge((order as string[]).map((id) => byId.get(id)!.line), level.packets).every((j) => j.correct);
  // Lost: played, not solved.
  if (s.won !== true) return { won: false, score: null, timeMs: null, parts: { rules: order.length, par: level.par, waves: waves.length }, verified: true, plausible: true };
  // A "passed" daily whose list does not pass, or that sent no wave, is refused.
  if (!passes || waves.length < 1) return null;
  // The round: the level's score (more is better).
  return { won: true, score: fmLevelScore(level, order.length, waves.length, 0), timeMs: null, parts: { rules: order.length, par: level.par, waves: waves.length }, verified: true, plausible: true };
}

/**
 * Exit the Editor: the keystrokes are replayed through the day's trap, restarts included; only an attempt that
 * leaves the program counts. The time is the browser's and is held to a floor; the hints asked for are taken as sent.
 *
 * @param day the puzzle's day
 * @param state the saved attempt ({ keys, asked, done, ms })
 * @returns the round, or null
 */
function verifyExitTheEditor(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // Only an escape.
  if (!s || s.done !== true) return null;
  // The keys.
  const keys = s.keys;
  // A bounded list of short key names.
  if (!Array.isArray(keys) || keys.length < 1 || keys.length > MAX_KEYS || !keys.every((k) => typeof k === "string" && k.length <= 16)) return null;
  // The time and the hints asked for.
  const t = ms(s.ms);
  const asked = int(s.asked, 0, 100);
  // Malformed.
  if (t === null || asked === null) return null;
  // The day's trap.
  const d = cached<DailyEscape>(`exit|${day}`, () => dailyEscape(day));
  // The attempt, replayed.
  const r = replayDaily(d, keys as string[]);
  // Not out of the program: refused.
  if (r.st.outcome !== "exit") return null;
  // The round: the level's score (more is better), from the replayed keystrokes.
  return {
    won: true,
    score: exitLevelScore(r.keys, d.par, t, asked),
    timeMs: Math.round(t),
    parts: { keys: r.keys, par: d.par, fails: r.fails, hints: asked, ms: Math.round(t) },
    verified: true,
    plausible: t >= Math.max(0, r.keys - 1) * EXIT_MS_PER_KEY,
  };
}

/**
 * Packet Stack: the placements are replayed through the day's deal, every one checked against what the game allows
 * (the column reachable along the top row, a field value the header has), and the run must be over (every block
 * placed, or the well full); the frames delivered, the streaks and the points are the replay's own. The time is the
 * browser's and is held to a floor.
 *
 * @param day the puzzle's day
 * @param state the saved run ({ m, done, ms })
 * @returns the round, or null
 */
function verifyPacketStack(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // Only a finished run.
  if (!s || s.done !== true) return null;
  // The placements: hexadecimal digits, no more than the day has blocks.
  const m = s.m;
  // Malformed.
  if (typeof m !== "string" || m.length < 1 || m.length > PS_BLOCKS || !/^[0-9a-f]+$/.test(m)) return null;
  // The playing time.
  const t = ms(s.ms);
  // Malformed.
  if (t === null) return null;
  // The day's deal.
  const deal = cached<PsBlock[]>(`ps|${day}`, () => psDailyDeal(day));
  // The run, replayed.
  const run = psReplay(deal, m);
  // A placement the game does not allow, or a run that is not over: refused.
  if (!run || !run.over) return null;
  // The round: the replay's points (more is better).
  return {
    won: run.delivered >= PS_PASS,
    score: run.score,
    timeMs: null,
    parts: { delivered: run.delivered, dropped: run.dropped, bestStreak: run.bestStreak, blocks: m.length, toppedOut: run.toppedOut, ms: Math.round(t) },
    verified: true,
    plausible: t >= Math.max(FLOOR_MIN_MS, m.length * PS_MS_PER_BLOCK),
  };
}

/**
 * TTL: the turns are replayed over the day's network, tick by tick, and must end the run on the tick the save claims;
 * the points, the packets delivered and the run's own clock (the sum of its ticks) all come from the replay. Nothing
 * here is measured by the browser, so the time that breaks ties is checked as fully as the score.
 *
 * @param day the puzzle's day
 * @param state the saved run ({ turns, ticks, done })
 * @returns the round, or null
 */
function verifyTtl(day: string, state: unknown): Verified | null {
  // The engine's replay.
  const r = ttlVerifySaved(day, state);
  // Not a finished run of that day.
  if (!r) return null;
  // The round: points (more is better), won when all twelve packets were delivered, the run's clock breaking ties.
  return { won: r.won, score: r.score, timeMs: r.ms, parts: r.parts, verified: true, plausible: true };
}

/**
 * Rule Inspector: the fifteen calls are graded again against the day's shift (every connection's verdict comes from
 * the engine's firewall model); twelve right pass. The time is the browser's and is held to a floor.
 *
 * @param day the puzzle's day
 * @param state the saved shift ({ calls, t, done })
 * @returns the round, or null
 */
function verifyRuleInspector(day: string, state: unknown): Verified | null {
  // The state.
  const s = obj(state);
  // Only a finished shift.
  if (!s || s.done !== true) return null;
  // The calls: exactly fifteen, each p (permit) or d (deny).
  const calls = s.calls;
  // Malformed calls refuse the shift.
  if (typeof calls !== "string" || calls.length !== RI_SIZE || !/^[pd]+$/.test(calls)) return null;
  // The final time.
  const t = ms(s.t);
  // Missing or malformed.
  if (t === null) return null;
  // The day's shift.
  const shift = cached<RiShift>(`ri|${day}`, () => riDailyShift(day));
  // The calls, graded.
  const g = riGrade(shift, calls);
  // The round: calls right are the score (more is better), the time breaks ties.
  return { won: g.right >= RI_PASS, score: g.right, timeMs: Math.round(t), parts: { right: g.right, ms: Math.round(t) }, verified: true, plausible: t >= Math.max(FLOOR_MIN_MS, RI_SIZE * RI_MS_PER_CALL) };
}

/** One game's check: the day, the state sent, the mode. */
type Verifier = (day: string, state: unknown, mode: string) => Verified | null;

/** Every board game's check, by id. */
const VERIFIERS: Readonly<Record<string, Verifier>> = {
  // Re-graded tries.
  "prefix-of-the-day": verifyPrefix,
  // Re-judged guesses.
  "five-clues": verifyFiveClues,
  // Re-checked boards, with a time floor.
  "access-points": verifyAccessPoints,
  "bit-balance": verifyBitBalance,
  "patch-path": verifyPatchPath,
  // Re-checked marks, per level.
  "spanning-tree": verifySpanningTree,
  // Re-checked answers.
  "log-detective": verifyLogDetective,
  // Re-scored picks.
  "phish-or-legit": verifyPhishOrLegit,
  // Bounds only.
  "whack-a-bug": verifyWhackABug,
  "aggregate": verifyAggregate,
  // Re-judged list.
  "first-match": verifyFirstMatch,
  // Replayed keystrokes.
  "exit-the-editor": verifyExitTheEditor,
  // Replayed placements.
  "packet-stack": verifyPacketStack,
  // Replayed turns.
  ttl: verifyTtl,
  // Re-graded calls.
  "rule-inspector": verifyRuleInspector,
};

/**
 * Verify one posted round.
 *
 * @param game the game's id
 * @param day the puzzle's day, YYYY-MM-DD
 * @param state the state the browser sent (board-rules.ts sentState())
 * @param mode the board mode ("daily", or Spanning Tree's level)
 * @returns the round as the server stores it, or null when it is not a genuine finished round of that day
 */
export function verifyRound(game: string, day: string, state: unknown, mode = "daily"): Verified | null {
  // The game's check.
  const v = VERIFIERS[game];
  // A game that does not post, or a malformed day.
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  // Any throw inside an engine (a state shaped to trip it) is a refusal, never a crash.
  try {
    // The check.
    return v(day, state, mode);
  } catch {
    // Refused.
    return null;
  }
}

/** The ids the checks cover, for the self-test's coverage line. */
export const VERIFIED_GAMES: readonly string[] = Object.keys(VERIFIERS);

// ---- The golden cases ---------------------------------------------------------------------------------------------

/** What the self-test reports (the engines' shape). */
export interface VerifyReport {
  /** Cases checked. */
  checked: number;
  /** One line per problem. */
  failures: string[];
}

/** How many days from launch the golden cases run over. */
const GOLDEN_DAYS = 14;

/**
 * The golden cases, run before every build with the engines' self-tests: for each game and each of the first
 * GOLDEN_DAYS days, a round built from the engine's own answer verifies with the expected score, and the same round
 * tampered with (a wrong cell, a missing key, a claimed time that disagrees with its parts, a score beyond the day's
 * bounds) is refused or scored as what it really is.
 *
 * @returns what was checked and what failed
 */
export function verifySelfTest(): VerifyReport {
  // Problems.
  const failures: string[] = [];
  // Cases.
  let checked = 0;
  // One case: a label and whether it held.
  const ok = (label: string, cond: boolean) => {
    // Counted.
    checked++;
    // Reported.
    if (!cond) failures.push(label);
  };
  // Each day.
  for (let d = 0; d < GOLDEN_DAYS; d++) {
    // The day.
    const day = addDays(LAUNCH_DAY, d);

    // Prefix of the Day: solved on the first try; six wrong tries; a try after the solve; an open round.
    const ans = podSolve(dailyPuzzle(day));
    const right = [ans.network, ans.broadcast, ans.mask, ans.hosts];
    const wrong = [0, 0, 0, 0];
    ok(`${day} prefix solved in 1`, verifyRound("prefix-of-the-day", day, { guesses: [right], hard: true })?.score === 1);
    ok(`${day} prefix six wrong is a lost round`, verifyRound("prefix-of-the-day", day, { guesses: [wrong, wrong, wrong, wrong, wrong, wrong] })?.won === false);
    ok(`${day} prefix try after the solve refused`, verifyRound("prefix-of-the-day", day, { guesses: [right, wrong] }) === null);
    ok(`${day} prefix open round refused`, verifyRound("prefix-of-the-day", day, { guesses: [wrong] }) === null);
    // The bit view (12/11/2026): its marker row is one try spent, keeps a hard round hard, and is reported in the parts.
    const bitsRow = [2 ** 32, 2 ** 32, 2 ** 32, 2 ** 32];
    const withBits = verifyRound("prefix-of-the-day", day, { guesses: [bitsRow, right], hard: true });
    ok(`${day} prefix bit view costs one try`, withBits?.score === 2 && withBits?.parts.bits === true && withBits?.parts.hard === true);

    // Five Clues: right on the first clue; five passes; a forged "solved" on a wrong guess.
    const fp = dailyFor(day);
    ok(`${day} five clues solved in 1`, verifyRound("five-clues", day, { guesses: [acceptedAnswers(fp)[0]], solved: true })?.score === 1);
    ok(`${day} five clues five passes lost`, verifyRound("five-clues", day, { guesses: ["", "", "", "", ""], solved: false })?.won === false);
    ok(`${day} five clues forged solve refused`, verifyRound("five-clues", day, { guesses: ["qqqqqqqq zzzzzzzz"], solved: true }) === null);

    // Access Points: the answer's board, with a check, no hint and the assist; one access point moved; a wrong total.
    const ap = apGenerate(day);
    const apBoard = new Array(ap.n * ap.n).fill(0);
    ap.solution.forEach((c, r) => (apBoard[r * ap.n + c] = 2));
    const apRound = { b: apBoard, e: 60_000, k: 1, h: 0, a: true, d: true, t: 100_000 };
    ok(`${day} access points solved scores 100000`, verifyRound("access-points", day, apRound)?.score === 100_000);
    const apMoved = apBoard.slice();
    const at = apMoved.indexOf(2);
    apMoved[at] = 0;
    apMoved[(at + 1) % apMoved.length] = 2;
    ok(`${day} access points moved point refused`, verifyRound("access-points", day, { ...apRound, b: apMoved }) === null);
    ok(`${day} access points forged total refused`, verifyRound("access-points", day, { ...apRound, t: 20_000 }) === null);
    ok(`${day} access points too fast is implausible`, verifyRound("access-points", day, { ...apRound, e: 500, t: 40_500 })?.plausible === false);

    // Bit Balance: the answer; one free cell flipped.
    const bb = bbGenerate(day);
    const bbRound = { b: bb.solution.slice(), e: 90_000, k: 0, h: 2, d: true, t: 110_000 };
    ok(`${day} bit balance solved`, verifyRound("bit-balance", day, bbRound)?.won === true);
    const free = bb.given.findIndex((v) => v < 0);
    const bbFlipped = bb.solution.slice();
    bbFlipped[free] = 1 - bbFlipped[free];
    ok(`${day} bit balance flipped cell refused`, verifyRound("bit-balance", day, { ...bbRound, b: bbFlipped }) === null);

    // Patch Path: the answer; the cable one cell short.
    const pp = ppGenerate(day);
    const ppRound = { b: pp.solution.slice(), e: 45_000, k: 0, h: 0, d: true, t: 45_000 };
    ok(`${day} patch path solved`, verifyRound("patch-path", day, ppRound)?.score === 45_000);
    ok(`${day} patch path short cable refused`, verifyRound("patch-path", day, { ...ppRound, b: pp.solution.slice(0, -1) }) === null);

    // Spanning Tree, both levels: the answer's marks; the wrong root.
    for (const lvl of ["easy", "hard"] as const) {
      const sa = solveStp(dailyStp(day, lvl)).answer;
      const marks = { root: sa.root, rp: sa.rootPort.filter((p): p is number => p !== null), dp: sa.designated.slice(), bk: sa.blocked.slice() };
      const st = { marks, mistakes: [0, 1, 0], ms: 42_000, done: true, won: true };
      ok(`${day} spanning tree ${lvl} solved scores 52`, verifyRound("spanning-tree", day, st, lvl)?.score === stpScore(42_000, 1));
      ok(`${day} spanning tree ${lvl} wrong root refused`, verifyRound("spanning-tree", day, { ...st, marks: { ...marks, root: sa.root + 1 } }, lvl) === null);
    }

    // Log Detective: three right; one right; two answers only.
    const kase = dailyCase(day);
    ok(`${day} log detective three right`, verifyRound("log-detective", day, { answers: [kase.attacker, kase.first, kase.success], elapsed: 70_000 })?.score === 3);
    // Two line numbers that are not the answers.
    const notFirst = kase.first === 0 ? 1 : 0;
    const notSuccess = kase.success === 0 ? 1 : 0;
    ok(`${day} log detective one right is lost`, verifyRound("log-detective", day, { answers: [kase.attacker, notFirst, notSuccess], elapsed: 70_000 })?.won === false);
    ok(`${day} log detective two answers refused`, verifyRound("log-detective", day, { answers: [kase.attacker, kase.first], elapsed: 70_000 }) === null);

    // Phish or Legit: every pick right; every pick wrong; fourteen picks.
    const cards = dailyRound(day);
    const allRight = cards.map((c) => (c.verdict === "phish" ? "p" : "l")).join("");
    const allWrong = cards.map((c) => (c.verdict === "phish" ? "l" : "p")).join("");
    ok(`${day} phish or legit fifteen right`, verifyRound("phish-or-legit", day, { picks: allRight, e: 80_000, t: 80_000 })?.parts.correct === DAILY_SIZE);
    ok(`${day} phish or legit all wrong lost`, verifyRound("phish-or-legit", day, { picks: allWrong, e: 80_000, t: 80_000 })?.won === false);
    ok(`${day} phish or legit fourteen picks refused`, verifyRound("phish-or-legit", day, { picks: allRight.slice(1), t: 80_000 }) === null);

    // Whack-a-Bug: a run of every other bug is plausible; the perfect bot's run is not; a score past a perfect run.
    const sched = dailySchedule(day);
    const half = scoreRound(sched, perfectTaps(sched).filter((_, i) => i % 2 === 0));
    const summary = (x: typeof half) => ({ done: true, score: x.score, acc: x.taps ? Math.round((x.hits / x.taps) * 100) : 0, bestCombo: x.bestCombo, hits: x.hits, goldens: x.goldens, features: x.features });
    ok(`${day} whack-a-bug half run plausible`, verifyRound("whack-a-bug", day, summary(half))?.plausible === true);
    const perfect = scoreRound(sched, perfectTaps(sched));
    ok(`${day} whack-a-bug perfect bot implausible`, verifyRound("whack-a-bug", day, summary(perfect))?.plausible === false);
    ok(`${day} whack-a-bug beyond perfect refused`, verifyRound("whack-a-bug", day, { ...summary(perfect), score: perfect.score + 10 }) === null);

    // Aggregate: the greedy bot's finished round; the same round with its score raised; another day's round.
    const bot = playGreedy({ kind: "daily", day });
    const greedy = bot.state;
    // A round the bot's move cap stopped is not finished, so it is refused like any open round.
    ok(`${day} aggregate greedy round ${bot.capped ? "capped, refused" : "accepted"}`, bot.capped ? verifyRound("aggregate", day, { game: greedy, counted: true }) === null : verifyRound("aggregate", day, { game: greedy, counted: true })?.score === greedy.score);
    ok(`${day} aggregate raised score refused`, verifyRound("aggregate", day, { game: { ...greedy, score: greedy.score + 64 * 1000 }, counted: true }) === null);
    ok(`${day} aggregate another day refused`, verifyRound("aggregate", addDays(day, 1), { game: greedy, counted: true }) === null);

    // First Match: a shortest passing list in one wave; an empty list claimed passed.
    const level = dailyLevel(day);
    const best = fmSolve(level).shortest[0].map((i) => level.cards[i].id);
    ok(`${day} first match passed at par`, verifyRound("first-match", day, { order: best, waves: [level.packets.map(() => true)], done: true, won: true })?.score === fmLevelScore(level, level.par, 1, 0));
    ok(`${day} first match empty list refused`, verifyRound("first-match", day, { order: [], waves: [[true]], done: true, won: true }) === null);

    // Exit the Editor: the first documented way out; the same keys without the last one.
    const esc = dailyEscape(day);
    const way = esc.solutions[0];
    ok(`${day} exit the editor way out escapes`, verifyRound("exit-the-editor", day, { keys: way, asked: 0, done: true, ms: 9000 })?.won === true);
    ok(`${day} exit the editor short keys refused`, verifyRound("exit-the-editor", day, { keys: way.slice(0, -1), asked: 0, done: true, ms: 9000 }) === null);

    // Packet Stack: the run played from the screen; one placement short; one too many; a run claimed done that is not;
    // too fast; the untouched run, which tops out unsolved.
    const psDeal = psDailyDeal(day);
    const psMoves = psPlay(psDeal).run.moves;
    ok(`${day} packet stack perfect run scores ${psPerfect(16)}`, verifyRound("packet-stack", day, { m: psMoves, done: true, ms: 150_000 })?.score === psPerfect(16));
    ok(`${day} packet stack one placement short refused`, verifyRound("packet-stack", day, { m: psMoves.slice(0, -1), done: true, ms: 150_000 }) === null);
    ok(`${day} packet stack extra placement refused`, verifyRound("packet-stack", day, { m: psMoves + "0", done: true, ms: 150_000 }) === null);
    ok(`${day} packet stack open run refused`, verifyRound("packet-stack", day, { m: psMoves, done: false, ms: 150_000 }) === null);
    ok(`${day} packet stack too fast is implausible`, verifyRound("packet-stack", day, { m: psMoves, done: true, ms: 2000 })?.plausible === false);
    ok(`${day} packet stack untouched run is lost`, verifyRound("packet-stack", day, { m: psIdle(psDeal).moves, done: true, ms: 60_000 })?.won === false);

    // TTL: the safe bot's completed run; the same turns a tick short of their end; the same run claimed open.
    const ttlRun = ttlGoldenSave(day);
    ok(`${day} ttl completed run verifies`, verifyRound("ttl", day, ttlRun)?.won === true);
    ok(`${day} ttl cut run refused`, verifyRound("ttl", day, { ...ttlRun, ticks: ttlRun.ticks - 1 }) === null);
    ok(`${day} ttl open run refused`, verifyRound("ttl", day, { ...ttlRun, done: false }) === null);

    // Rule Inspector: every call right; every call wrong; fourteen calls; a shift not marked done; a time too fast.
    const ri = riDailyShift(day);
    const riRight = ri.decisions.map((x) => (x.action === "permit" ? "p" : "d")).join("");
    const riWrong = ri.decisions.map((x) => (x.action === "permit" ? "d" : "p")).join("");
    ok(`${day} rule inspector fifteen right`, verifyRound("rule-inspector", day, { calls: riRight, t: 90_000, done: true })?.score === RI_SIZE);
    ok(`${day} rule inspector all wrong lost`, verifyRound("rule-inspector", day, { calls: riWrong, t: 90_000, done: true })?.won === false);
    ok(`${day} rule inspector fourteen calls refused`, verifyRound("rule-inspector", day, { calls: riRight.slice(1), t: 90_000, done: true }) === null);
    ok(`${day} rule inspector open shift refused`, verifyRound("rule-inspector", day, { calls: riRight, t: 90_000 }) === null);
    ok(`${day} rule inspector too fast is implausible`, verifyRound("rule-inspector", day, { calls: riRight, t: 2_000, done: true })?.plausible === false);
  }
  // Every board game is covered by a check.
  ok("every board game has a check", ["prefix-of-the-day", "five-clues", "access-points", "bit-balance", "patch-path", "spanning-tree", "log-detective", "phish-or-legit", "whack-a-bug", "aggregate", "first-match", "exit-the-editor", "packet-stack", "ttl", "rule-inspector"].every((g) => g in VERIFIERS));
  // An unknown game is refused.
  ok("an unknown game is refused", verifyRound("incident-commander", LAUNCH_DAY, {}) === null);
  // The report.
  return { checked, failures };
}
