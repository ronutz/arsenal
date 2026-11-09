// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/board-rules.ts
// ----------------------------------------------------------------------------
// THE PUBLIC SCOREBOARD'S SHARED RULES (PRIME's decisions of 08/11/2026). One
// small, pure module that the Worker (worker/scores.ts) and the browser
// (src/lib/fun/board.ts, the games' "Today's board") both import, so the two
// sides can never disagree about:
//   - which games post to the board, in which modes, which way their score
//     counts and what unit it is shown in;
//   - what initials are accepted: three characters, A to Z and 0 to 9, as on
//     an arcade machine, "???" when none are given, and a short list of
//     offensive three-letter words that both sides refuse;
//   - which puzzle days the board takes (today's, in UTC, and yesterday's for
//     the first hour after 00:00 UTC, for a round finished at midnight);
//   - what part of a game's saved daily state is sent: only the fields the
//     server needs to re-check the round, never a wall-clock time (Exit the
//     Editor keeps the instant its attempt started; it stays in the browser);
//   - the limits: the body size, the nonce's shape, how long rows are kept.
// It imports no engine, so the pages that use it stay light; the engines'
// re-checking lives in src/lib/fun/verify.ts, which only the Worker and the
// pre-build check import.
// ============================================================================

// The UTC day of an instant and the day arithmetic.
import { addDays, utcDayKey } from "./daily";

/** The board's endpoints, under the Worker's /api routing. */
export const BOARD_API = "/api/v1/fun";

/**
 * The address of one game's board for one day, written the same way by the pages and by the Worker (which forgets
 * the cached copy at exactly this address when a round is posted).
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 * @returns the path and query
 */
export function boardPath(game: string, mode: string, day: string): string {
  // Always the same order of parameters, so the edge cache sees one address per board.
  return `${BOARD_API}/board?game=${encodeURIComponent(game)}&mode=${encodeURIComponent(mode)}&day=${encodeURIComponent(day)}`;
}

/**
 * The address of the shelf's totals over a window.
 *
 * @param days the last 7 or 30 days, or every day kept
 * @returns the path and query
 */
export function totalsPath(days: "7" | "30" | "all"): string {
  // One parameter.
  return `${BOARD_API}/totals?days=${days}`;
}

/** How a game's headline number is shown: tries out of six, clues out of five, a time, answers right, or points. */
export type BoardUnit = "tries" | "clues" | "time" | "right" | "points";

/** One game on the board. */
export interface BoardGame {
  /** The game's stable id (its page slug and storage sub-key). */
  readonly id: string;
  /** Its daily modes: "daily", or Spanning Tree's two levels, each a board of its own. */
  readonly modes: readonly string[];
  /** Whether a higher score is better (points, answers right) or a lower one (tries, clues, a time). */
  readonly higherIsBetter: boolean;
  /** How the score is shown. */
  readonly unit: BoardUnit;
  /** The most the score can be, for the units counted out of a fixed number (tries, clues, answers). */
  readonly outOf?: number;
  /** Whether a time breaks ties between equal scores (shown beside the score on the board). */
  readonly timeTieBreak: boolean;
  /** Whether the server re-checks the round with the game's engine (false: plausibility bounds only). */
  readonly verified: boolean;
}

/** The games on the board, in shelf order. Incident Commander is not a daily game and stays off it. */
export const BOARD_GAMES: readonly BoardGame[] = [
  // Six tries at the day's network; fewer is better; the tries are re-graded against the day's answer.
  { id: "prefix-of-the-day", modes: ["daily"], higherIsBetter: false, unit: "tries", outOf: 6, timeTieBreak: false, verified: true },
  // Five clues; fewer used is better; every guess is judged again against the day's answers.
  { id: "five-clues", modes: ["daily"], higherIsBetter: false, unit: "clues", outOf: 5, timeTieBreak: false, verified: true },
  // A floor plan solved against the clock; the board is re-checked, the time is plausibility-bounded.
  { id: "access-points", modes: ["daily"], higherIsBetter: false, unit: "time", timeTieBreak: false, verified: true },
  // The bit grid, the same way.
  { id: "bit-balance", modes: ["daily"], higherIsBetter: false, unit: "time", timeTieBreak: false, verified: true },
  // The cable, the same way.
  { id: "patch-path", modes: ["daily"], higherIsBetter: false, unit: "time", timeTieBreak: false, verified: true },
  // Two daily levels, each its own board; the score is seconds plus ten a mistake (lower is better).
  { id: "spanning-tree", modes: ["easy", "hard"], higherIsBetter: false, unit: "points", timeTieBreak: true, verified: true },
  // Three answers about the day's log; more right is better, the time breaks ties.
  { id: "log-detective", modes: ["daily"], higherIsBetter: true, unit: "right", outOf: 3, timeTieBreak: true, verified: true },
  // Fifteen cards; the points (with the streak bonus) are better higher, the time breaks ties.
  { id: "phish-or-legit", modes: ["daily"], higherIsBetter: true, unit: "points", timeTieBreak: true, verified: true },
  // A real-time minute: it cannot be replayed, so its numbers are only held to what the day's run allows.
  { id: "whack-a-bug", modes: ["daily"], higherIsBetter: true, unit: "points", timeTieBreak: false, verified: false },
  // The sliding board keeps no list of moves, so its final board is only checked for consistency.
  { id: "aggregate", modes: ["daily"], higherIsBetter: true, unit: "points", timeTieBreak: false, verified: false },
  // The day's access list is judged again by the access-list engine; the level's score is better higher.
  { id: "first-match", modes: ["daily"], higherIsBetter: true, unit: "points", timeTieBreak: false, verified: true },
  // The keystrokes are replayed through the day's trap; the score is better higher.
  { id: "exit-the-editor", modes: ["daily"], higherIsBetter: true, unit: "points", timeTieBreak: false, verified: true },
  // The day's placements are replayed through the day's deal and scored again; more points is better.
  { id: "packet-stack", modes: ["daily"], higherIsBetter: true, unit: "points", timeTieBreak: false, verified: true },
  // Twelve packets through the day's network: the turns are replayed on the server; more points is better, and the run's
  // own clock (the sum of its ticks, worked out by the replay) breaks ties.
  { id: "ttl", modes: ["daily"], higherIsBetter: true, unit: "points", timeTieBreak: true, verified: true },
  // Fifteen calls a shift, judged again against the day's shift (the engine's SHIFT_SIZE); more right is better, the time breaks ties.
  { id: "rule-inspector", modes: ["daily"], higherIsBetter: true, unit: "right", outOf: 15, timeTieBreak: true, verified: true },
];

/**
 * One game's board rules.
 *
 * @param id the game's id
 * @returns its rules, or undefined when the game does not post to the board
 */
export function boardGame(id: string): BoardGame | undefined {
  // A plain lookup in the short list.
  return BOARD_GAMES.find((g) => g.id === id);
}

/**
 * Whether a mode is one of a game's board modes.
 *
 * @param game the game's rules
 * @param mode the mode asked for
 * @returns true when that game posts rounds in that mode
 */
export function isBoardMode(game: BoardGame, mode: string): boolean {
  // Listed.
  return game.modes.includes(mode);
}

/** What a round shows when no initials were given, as an arcade machine does. */
export const NO_INITIALS = "???";

/** Three characters, A to Z and 0 to 9. */
export const INITIALS_RE = /^[A-Z0-9]{3}$/;

// ---- The block list -----------------------------------------------------------
// A short list of three-letter combinations that read as slurs, sexual terms or abuse in English or Portuguese,
// refused on both sides and never shown to anyone. It is kept letter-shifted (ROT13, each letter moved thirteen
// places; digits stay), so the source reads as codes rather than as the words themselves. Short on purpose: it
// stops the obvious, it is not a filter of everything a player could spell.
/** The refused combinations, letter-shifted. */
const BLOCKED_SHIFTED: readonly string[] = [
  // English.
  "NFF", "PHZ", "PBX", "PBP", "QVP", "QVX", "QPX", "SNT", "SPX", "SHP", "SHX", "SHD", "WVM", "XXX", "AVT", "ATE", "FRK", "FUG", "GVG", "GJG", "INT", "JAX", "PAG", "AMV",
  // Portuguese.
  "SQC", "CDC", "IFS", "IGP", "GAP", "OPG", "XPG",
];

/**
 * ROT13 one string: letters move thirteen places (so the same function encodes and decodes); digits stay.
 *
 * @param s the text
 * @returns the shifted text
 */
function rot13(s: string): string {
  // Each character in turn.
  return s.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + 13) % 26) + 65));
}

/** The refused combinations, read once. */
const BLOCKED: ReadonlySet<string> = new Set(BLOCKED_SHIFTED.map(rot13));

/** Why initials are refused, or null when they are fine. */
export type InitialsProblem = "format" | "blocked" | null;

/**
 * Check initials as typed: trimmed and upper-cased first.
 *
 * @param raw what the player typed
 * @returns the problem, or null when they can be used
 */
export function initialsProblem(raw: string): InitialsProblem {
  // The cleaned form.
  const v = raw.trim().toUpperCase();
  // Exactly three of A to Z and 0 to 9.
  if (!INITIALS_RE.test(v)) return "format";
  // Not one of the refused combinations.
  if (BLOCKED.has(v)) return "blocked";
  // Fine.
  return null;
}

/**
 * Initials as stored: the cleaned three characters when they are accepted, otherwise null.
 *
 * @param raw what the player typed (or what a request carried)
 * @returns the initials, or null
 */
export function normaliseInitials(raw: unknown): string | null {
  // Only text can be initials.
  if (typeof raw !== "string") return null;
  // Refused for any reason.
  if (initialsProblem(raw) !== null) return null;
  // The cleaned form.
  return raw.trim().toUpperCase();
}

/** A submission's nonce: 128 random bits, as 32 lower-case hex digits, made in the browser per submission. */
export const NONCE_RE = /^[0-9a-f]{32}$/;

/** The largest request body the board reads, in bytes (the longest saved state, Exit the Editor's keys, fits well). */
export const MAX_BODY_BYTES = 32 * 1024;

/** The largest body of an initials change, in bytes. */
export const MAX_INITIALS_BODY_BYTES = 512;

/** How many days a row is kept, counted from the UTC day it was received. */
export const KEEP_DAYS = 400;

/** The fewest players from one country before the country is shown on a board. */
export const MIN_COUNTRY_PLAYERS = 3;

/** How many rounds a top list shows. */
export const TOP_N = 10;

/** A puzzle day as YYYY-MM-DD. */
export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The puzzle days the board accepts a round for at an instant: today's (UTC), and, during the first hour after
 * 00:00 UTC, yesterday's too, so a round finished at midnight still counts.
 *
 * @param now the instant
 * @returns the accepted days, today first
 */
export function acceptedDays(now: Date): string[] {
  // Today, in UTC.
  const today = utcDayKey(now);
  // The first hour of the UTC day also takes yesterday's puzzle.
  return now.getUTCHours() === 0 ? [today, addDays(today, -1)] : [today];
}

/**
 * Pick the named fields of an object, leaving everything else behind.
 *
 * @param x the saved state
 * @param keys the fields to keep
 * @returns a new object with only those fields, or null when x is not an object
 */
function pick(x: unknown, keys: readonly string[]): Record<string, unknown> | null {
  // Only a plain object has fields.
  if (x === null || typeof x !== "object" || Array.isArray(x)) return null;
  // The source.
  const src = x as Record<string, unknown>;
  // The kept fields.
  const out: Record<string, unknown> = {};
  // Each one present.
  for (const k of keys) if (k in src) out[k] = src[k];
  // The copy.
  return out;
}

/** The fields of each game's saved daily state that the server needs to re-check a round (and nothing else). */
const SENT_FIELDS: Readonly<Record<string, readonly string[]>> = {
  // The tries, and whether hard mode was on throughout.
  "prefix-of-the-day": ["guesses", "hard"],
  // The guesses and the solved flag.
  "five-clues": ["guesses", "solved"],
  // The logic puzzle kit's round: board, clock, checks, hints, assist, finished, final time.
  "access-points": ["b", "e", "k", "h", "a", "d", "t"],
  // The same kit.
  "bit-balance": ["b", "e", "k", "h", "a", "d", "t"],
  // The same kit.
  "patch-path": ["b", "e", "k", "h", "a", "d", "t"],
  // One level's marks, mistakes, time and outcome (picked from the day's two levels below).
  "spanning-tree": ["marks", "mistakes", "ms", "done", "won"],
  // The three answers and the time.
  "log-detective": ["answers", "elapsed"],
  // The fifteen picks and the clock.
  "phish-or-legit": ["picks", "e", "t"],
  // The closed run's numbers.
  "whack-a-bug": ["done", "interrupted", "score", "acc", "bestCombo", "hits", "goldens", "features"],
  // The counted round's final board (the day's best board and tries stay behind).
  aggregate: ["game", "counted"],
  // The list, the waves and the outcome.
  "first-match": ["order", "waves", "done", "won"],
  // The keystrokes, the hints asked for, the outcome and the time; NOT startedAt, the wall-clock instant.
  "exit-the-editor": ["keys", "asked", "done", "ms"],
  // The placements (one digit each), the outcome and the playing time.
  "packet-stack": ["m", "done", "ms"],
  // The turns, the ticks played and whether the run is over: the server replays the run from them.
  ttl: ["turns", "ticks", "done"],
  // The fifteen calls, the final time and the finished flag.
  "rule-inspector": ["calls", "t", "done"],
};

/**
 * What the browser sends of a game's saved daily state: the fields the server re-checks, nothing more.
 *
 * @param game the game's id
 * @param mode the board mode (Spanning Tree's level picks that level's state out of the day's)
 * @param state the day's saved state, as the game stored it
 * @returns the state to send, or null when there is nothing usable
 */
export function sentState(game: string, mode: string, state: unknown): Record<string, unknown> | null {
  // The game's field list.
  const fields = SENT_FIELDS[game];
  // A game that does not post.
  if (!fields) return null;
  // Spanning Tree keeps both levels under one day: the level's own state is the round.
  const round = game === "spanning-tree" && state !== null && typeof state === "object" ? (state as Record<string, unknown>)[mode] : state;
  // The kept fields.
  return pick(round, fields);
}

/**
 * Whether a game's saved state for a mode is a finished round, read from the state alone (no engine): the browser
 * uses it to know which of Spanning Tree's levels to post; every other game posts when it records its daily result.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param state the day's saved state
 * @returns true when that mode's round is over
 */
export function looksFinished(game: string, mode: string, state: unknown): boolean {
  // Only Spanning Tree has two rounds a day to tell apart.
  if (game !== "spanning-tree") return state !== null && state !== undefined;
  // The level's state.
  const lvl = sentState(game, mode, state);
  // Over when marked done.
  return lvl !== null && lvl.done === true;
}

/** What a self-test reports (the same shape as the engines'). */
export interface RulesReport {
  /** Cases checked. */
  checked: number;
  /** One line per problem. */
  failures: string[];
}

/**
 * The rules' self-test, run before every build with the engines' (scripts/check-fun-games.mts): the initials rule
 * accepts and refuses what it should, the block list is well formed, the day window opens and closes at 01:00 UTC,
 * and every board game has its sent fields.
 *
 * @returns what was checked and what failed
 */
export function rulesSelfTest(): RulesReport {
  // Problems.
  const failures: string[] = [];
  // Cases.
  let checked = 0;
  // A check: a label and whether it held.
  const ok = (label: string, cond: boolean) => {
    // Counted.
    checked++;
    // Reported when false.
    if (!cond) failures.push(label);
  };
  // Plain initials, cleaned.
  ok("ab1 normalises to AB1", normaliseInitials(" ab1 ") === "AB1");
  // Too short, too long, a symbol.
  ok("two characters refused", initialsProblem("AB") === "format");
  ok("four characters refused", initialsProblem("ABCD") === "format");
  ok("a symbol refused", initialsProblem("A-B") === "format");
  // The empty placeholder is never accepted as typed initials.
  ok("??? refused as typed initials", initialsProblem(NO_INITIALS) === "format");
  // Every listed combination is three letters or digits, refused, and listed once.
  ok("block list has no repeats", BLOCKED.size === BLOCKED_SHIFTED.length);
  for (const b of BLOCKED) ok(`block list entry ${rot13(b)} (shifted) is refused`, INITIALS_RE.test(b) && initialsProblem(b.toLowerCase()) === "blocked");
  // An ordinary set of initials passes.
  ok("RON accepted", initialsProblem("RON") === null);
  // The day window: yesterday is accepted only before 01:00 UTC.
  ok("00:30 UTC takes yesterday", acceptedDays(new Date("2026-11-08T00:30:00Z")).join(",") === "2026-11-08,2026-11-07");
  ok("01:00 UTC takes today only", acceptedDays(new Date("2026-11-08T01:00:00Z")).join(",") === "2026-11-08");
  // Every board game has its sent fields, and Exit the Editor never sends its start instant.
  for (const g of BOARD_GAMES) ok(`${g.id} has sent fields`, Array.isArray(SENT_FIELDS[g.id]) && SENT_FIELDS[g.id].length > 0);
  ok("exit-the-editor does not send startedAt", sentState("exit-the-editor", "daily", { keys: ["q"], startedAt: 1, done: true, ms: 5 })?.startedAt === undefined);
  // Spanning Tree sends the level's own state.
  ok("spanning-tree picks the level", sentState("spanning-tree", "hard", { easy: { done: true }, hard: { done: false, ms: 3 } })?.ms === 3);
  // The report.
  return { checked, failures };
}
