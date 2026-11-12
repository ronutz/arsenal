// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/board.ts
// ----------------------------------------------------------------------------
// THE PUBLIC SCOREBOARD, BROWSER SIDE (PRIME's decisions of 08/11/2026).
//
// SENDING. When a game records a finished daily puzzle on its own day
// (storage.ts recordResult), afterDailyRecord() is told. Unless the player
// switched "Share my results on the public board" off, it sends that round
// once: the game, the mode, the day, the part of the game's own saved state
// the server re-checks (board-rules.ts sentState(), never a score and never
// a time of day), the initials remembered in this browser (or none, shown as
// ???), and a nonce of 128 random bits made fresh for this one submission.
// Fire-and-forget: it runs after the game's finish, never delays the result
// panel, and a board that is down changes nothing in the game. Practice,
// earlier puzzles (?day=) and any day other than today (UTC; yesterday's in
// the first hour after midnight) are never sent.
//
// REMEMBERED (in the games' one storage key, storage.ts): the switch, the
// initials, and for each round of today and yesterday its nonce and what the
// board answered, so the same round is never sent twice and its initials can
// be changed the same day. Nothing here identifies the browser: a new nonce
// is made for every submission.
//
// ONE YES OR NO FOR THE DAY'S COUNT OF BROWSERS (the site owner, 12/11/2026
// 17:06 to 17:09). This browser keeps the puzzle day of the last round it
// published, under a key of its own that never leaves it and never travels
// with the desk's sync (ronutz:fun:posted-day; src/lib/desk/registry.ts lists
// it as local-only). A round of a later day than that is the first this
// browser publishes on its day, and goes with `first: true`; every other
// round goes with `first: false`. The day is written only after the board
// answers that the round is stored; changing initials never touches it. The
// server adds the yeses up per day: how many browsers published a round, not
// how many people, and nothing in it says which browser (worker/scores.ts).
//
// READING. fetchBoard() and fetchTotals() read the board's public answers.
// The player's own score is never put in an address (an address is what the
// host's request logs keep); the place shown after posting comes from the
// post's own answer.
// ============================================================================

// The shared rules: the games on the board, the day window, the initials, the sent state, the addresses.
import { BOARD_API, NO_INITIALS, acceptedDays, boardGame, boardPath, initialsProblem, isBoardMode, looksFinished, sentState, totalsPath, type BoardUnit, type TotalsWindow } from "./board-rules";
// The one storage key: the game's saved day, and the board's choices.
import { loadBoardLocal, loadRecord, updateBoardLocal, type PostedRound } from "./storage";
// The games' time format (m:ss).
import { formatDuration } from "./share";

/**
 * The key a sent round is remembered under.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 * @returns "game|mode|day"
 */
export function postKey(game: string, mode: string, day: string): string {
  // The day last, so pruning can read it from the end.
  return `${game}|${mode}|${day}`;
}

/** Everyone on this page who shows the board's state: told after every change. */
const LISTENERS = new Set<() => void>();

/**
 * Be told whenever the board's choices or a sent round change.
 *
 * @param fn the listener
 * @returns the way to stop listening
 */
export function subscribeBoard(fn: () => void): () => void {
  // Added.
  LISTENERS.add(fn);
  // Removed on request.
  return () => {
    // Gone.
    LISTENERS.delete(fn);
  };
}

/** Tell every listener. */
function notify(): void {
  // Each one; a listener's fault never stops the others.
  for (const fn of LISTENERS) {
    // Called.
    try {
      // Told.
      fn();
    } catch {
      // Ignored.
    }
  }
}

/**
 * Whether finished daily rounds go to the public board: on unless the player switched it off.
 *
 * @returns the switch
 */
export function shareOn(): boolean {
  // Only an explicit false turns it off.
  return loadBoardLocal().share !== false;
}

/**
 * Set the switch.
 *
 * @param on share or not
 */
export function setShare(on: boolean): void {
  // Written with the other choices.
  updateBoardLocal((b) => ({ ...b, share: on }));
  // Shown everywhere on the page.
  notify();
}

/**
 * The initials remembered in this browser, when they are still acceptable.
 *
 * @returns three characters, or null
 */
export function rememberedInitials(): string | null {
  // The stored value.
  const v = loadBoardLocal().initials;
  // Only acceptable initials are used.
  return typeof v === "string" && initialsProblem(v) === null ? v : null;
}

/**
 * Remember initials for the next rounds (null forgets them).
 *
 * @param v the initials, or null
 */
export function rememberInitials(v: string | null): void {
  // Written, or removed.
  updateBoardLocal((b) => {
    // A copy.
    const next = { ...b };
    // Set or forgotten.
    if (v === null) delete next.initials;
    else next.initials = v.trim().toUpperCase();
    // Back.
    return next;
  });
  // Shown.
  notify();
}

/**
 * What this browser sent for a round, if anything.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 * @returns the sent round, or null
 */
export function postedRound(game: string, mode: string, day: string): PostedRound | null {
  // Looked up.
  return loadBoardLocal().posted?.[postKey(game, mode, day)] ?? null;
}

/**
 * Remember what happened to a sent round.
 *
 * @param key the round's key
 * @param round what to remember
 */
function remember(key: string, round: PostedRound): void {
  // Written with the others.
  updateBoardLocal((b) => ({ ...b, posted: { ...(b.posted ?? {}), [key]: round } }));
  // Shown.
  notify();
}

/**
 * A fresh nonce: 128 random bits from the browser's cryptographic generator, as 32 hex digits.
 *
 * @returns the nonce
 */
function newNonce(): string {
  // Sixteen random bytes.
  const bytes = new Uint8Array(16);
  // Filled by the browser.
  crypto.getRandomValues(bytes);
  // As hex.
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The key of the puzzle day of this browser's last published round: local-only, never sent, never synced. */
export const POSTED_DAY_KEY = "ronutz:fun:posted-day";

/**
 * The puzzle day of the last round this browser published, as YYYY-MM-DD, or "" when none is known.
 *
 * @returns the day, or ""
 */
function postedDay(): string {
  // Storage can be missing or refuse (a private window, blocked site data): nothing known then.
  try {
    // The stored value.
    const v = window.localStorage.getItem(POSTED_DAY_KEY);
    // Only a well-formed day counts.
    return v !== null && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  } catch {
    // Unreadable.
    return "";
  }
}

/**
 * Remember a published round's puzzle day, never moving the day backwards (yesterday's round, sent in the first hour
 * after midnight after today's, leaves today's day in place).
 *
 * @param day the round's puzzle day
 */
function rememberPostedDay(day: string): void {
  // An earlier day than the one kept changes nothing.
  if (day <= postedDay()) return;
  // Written; a storage that refuses only means the next round may count this browser again.
  try {
    // The day, as YYYY-MM-DD.
    window.localStorage.setItem(POSTED_DAY_KEY, day);
  } catch {
    // Not kept.
  }
}

/** The sends carrying `first: true`, by puzzle day: a second round of that day waits for the first's answer. */
const FIRST_SENDS = new Map<string, Promise<void>>();

/** What sending a round came to. */
export type PostOutcome = "posted" | "refused" | "unavailable" | "initials" | "late";

/** The answer the board gives a posted round. */
interface PostAnswer {
  /** Stored (or stored before, with the same nonce). */
  ok?: boolean;
  /** The server's own score. */
  score?: number | null;
  /** Solved, by the server's check. */
  won?: boolean;
  /** Counted for the top ten. */
  plausible?: boolean;
  /** The place, the rounds counted, the rounds beaten. */
  place?: number;
  of?: number;
  beat?: number;
  /** Why it was refused. */
  error?: string;
}

/** The sends on their way, by round: a second call for the same round waits for the first instead of sending again. */
const IN_FLIGHT = new Map<string, Promise<PostOutcome>>();

/**
 * Send one round to the board (or send it again after a failure, with the same nonce, so it is never stored twice).
 * While a send for the round is on its way, a second call shares it.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 * @param initials initials typed for this round; the remembered ones (or none) otherwise
 * @returns what happened
 */
export function postRound(game: string, mode: string, day: string, initials?: string): Promise<PostOutcome> {
  // The round's key.
  const key = postKey(game, mode, day);
  // A send already on its way.
  const going = IN_FLIGHT.get(key);
  // Shared.
  if (going) return going;
  // A new send, forgotten once it settles.
  const p = sendRound(game, mode, day, initials).finally(() => IN_FLIGHT.delete(key));
  // Remembered while on its way.
  IN_FLIGHT.set(key, p);
  // The outcome.
  return p;
}

/**
 * The send itself (postRound shares it between callers).
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 * @param initials initials typed for this round; the remembered ones (or none) otherwise
 * @returns what happened
 */
async function sendRound(game: string, mode: string, day: string, initials?: string): Promise<PostOutcome> {
  // The game's board rules.
  const g = boardGame(game);
  // Not a board game, or not one of its modes.
  if (!g || !isBoardMode(g, mode)) return "refused";
  // Only today's puzzle (and yesterday's in the first hour after midnight).
  if (!acceptedDays(new Date()).includes(day)) return "late";
  // The fields of the game's saved day the server re-checks.
  const state = sentState(game, mode, loadRecord(game).daily[day]);
  // Nothing finished to send.
  if (!state) return "refused";
  // The round's key and what was sent before.
  const key = postKey(game, mode, day);
  const before = postedRound(game, mode, day);
  // Already stored or refused: never sent twice.
  if (before && before.status !== "pending") return before.status === "posted" ? "posted" : "refused";
  // The initials: typed now, else remembered, else none.
  const typed = initials !== undefined && initials.trim() !== "" ? initials.trim().toUpperCase() : null;
  // Typed initials must be acceptable.
  if (typed !== null && initialsProblem(typed) !== null) return "initials";
  // What the round is sent with.
  const use = typed ?? rememberedInitials();
  // The nonce: the earlier attempt's, so a retry is recognised; a new one otherwise.
  const nonce = before?.nonce ?? newNonce();
  // Remembered as pending before anything is sent.
  remember(key, { nonce, status: "pending", initials: use ?? NO_INITIALS });
  // Another round of this day already on its way with `first: true`: its answer decides this round's flag.
  for (let wait = FIRST_SENDS.get(day); wait; wait = FIRST_SENDS.get(day)) await wait;
  // The first round this browser publishes on this puzzle day, by the day it keeps (no day kept: the first).
  const first = postedDay() < day;
  // While this send carries the yes, other rounds of the day wait for it; released whatever the outcome.
  let release: () => void = () => undefined;
  if (first) FIRST_SENDS.set(day, new Promise<void>((done) => (release = done)));
  // The request; any failure leaves the round pending, to be tried again later today.
  try {
    // Sent; keepalive lets it finish if the player leaves the page at once.
    const res = await fetch(`${BOARD_API}/score`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ game, mode, day, state, nonce, first, ...(use ? { initials: use } : {}) }),
      keepalive: true,
    });
    // The answer.
    const a = (await res.json().catch(() => ({}))) as PostAnswer;
    // Stored.
    if (res.ok && a.ok) {
      // The board holds a round of this day from this browser: the next ones go with `first: false`.
      rememberPostedDay(day);
      // Remembered with the server's numbers.
      remember(key, { nonce, status: "posted", initials: use ?? NO_INITIALS, score: a.score ?? null, won: a.won === true, plausible: a.plausible !== false, place: a.place, of: a.of, beat: a.beat });
      // Done.
      return "posted";
    }
    // Not a genuine finished round, by the server's check: never sent again.
    if (res.status === 422) {
      // Remembered as refused.
      remember(key, { nonce, status: "refused", initials: use ?? NO_INITIALS });
      // Said.
      return "refused";
    }
    // Initials refused by the server.
    if (a.error === "initials") return "initials";
    // Anything else: the board is unavailable for now.
    return "unavailable";
  } catch {
    // No network, or no board.
    return "unavailable";
  } finally {
    // The yes is settled: the day's other rounds may go (with `first: false` once this one was stored).
    if (first) {
      // Forgotten, then the waiting sends released.
      FIRST_SENDS.delete(day);
      release();
    }
  }
}

/**
 * A daily puzzle was finished on its own day (storage.ts recordResult): send each finished, unsent round of it,
 * unless sharing is off. Deferred to the next turn of the event loop, so a game that saves its final state just
 * after recording has done so.
 *
 * @param game the game's id
 * @param day the puzzle's day
 */
export function afterDailyRecord(game: string, day: string): void {
  // The game's board rules.
  const g = boardGame(game);
  // Not on the board, sharing off, or not today's puzzle.
  if (!g || !shareOn() || !acceptedDays(new Date()).includes(day)) return;
  // After the game's own finish.
  window.setTimeout(() => {
    // The day's saved state, as the game left it.
    const state = loadRecord(game).daily[day];
    // Each of the game's modes (Spanning Tree's two levels; "daily" for the rest).
    for (const mode of g.modes) {
      // Not finished, or already sent.
      if (!looksFinished(game, mode, state) || postedRound(game, mode, day)) continue;
      // Sent; never awaited.
      void postRound(game, mode, day);
    }
  }, 0);
}

/**
 * Try again a round whose sending failed earlier today (the board was down, or the page was left mid-request);
 * the board on the page calls it once when it appears.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 */
export function retryPending(game: string, mode: string, day: string): void {
  // Only a pending round, with sharing still on.
  if (!shareOn() || postedRound(game, mode, day)?.status !== "pending") return;
  // Sent again with its own nonce; never awaited.
  void postRound(game, mode, day);
}

/**
 * Read a posted round's place again, now that more players may have posted: the round is sent once more with its own
 * nonce, which the board recognises (it stores nothing new) and answers with the place as it stands. Sent in a
 * request body, never in an address, so the score stays out of the host's request logs. Quietly does nothing when
 * the round is not posted, its day has passed, or the board is down.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 */
export async function refreshPlace(game: string, mode: string, day: string): Promise<void> {
  // The round as sent.
  const round = postedRound(game, mode, day);
  // Only a posted round of a day the board still takes.
  if (!round || round.status !== "posted" || !acceptedDays(new Date()).includes(day)) return;
  // The same fields as the first time.
  const state = sentState(game, mode, loadRecord(game).daily[day]);
  // Nothing to send.
  if (!state) return;
  // Asked; any failure keeps the place already known.
  try {
    // The same submission, the same nonce.
    const res = await fetch(`${BOARD_API}/score`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ game, mode, day, state, nonce: round.nonce }) });
    // The answer.
    const a = (await res.json().catch(() => ({}))) as PostAnswer;
    // The place as it stands now.
    if (res.ok && a.ok) remember(postKey(game, mode, day), { ...round, place: a.place, of: a.of, beat: a.beat, plausible: a.plausible !== false });
  } catch {
    // Kept as it was.
  }
}

/** What changing initials came to. */
export type InitialsOutcome = "ok" | "initials" | "not_found" | "unavailable";

/**
 * Change the initials of a round posted today (its nonce authorises it), and remember them for the next rounds.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 * @param initials the new initials
 * @returns what happened
 */
export async function changeInitials(game: string, mode: string, day: string, initials: string): Promise<InitialsOutcome> {
  // The cleaned form.
  const v = initials.trim().toUpperCase();
  // Refused here first.
  if (initialsProblem(v) !== null) return "initials";
  // The round as sent.
  const round = postedRound(game, mode, day);
  // Nothing posted to change.
  if (!round || round.status !== "posted") return "not_found";
  // The request.
  try {
    // Sent.
    const res = await fetch(`${BOARD_API}/score/initials`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nonce: round.nonce, initials: v }) });
    // Changed.
    if (res.ok) {
      // Remembered on the round and for the next ones.
      remember(postKey(game, mode, day), { ...round, initials: v });
      rememberInitials(v);
      // Done.
      return "ok";
    }
    // The server's reasons.
    if (res.status === 404) return "not_found";
    if (res.status === 400) return "initials";
    // Anything else.
    return "unavailable";
  } catch {
    // No network, or no board.
    return "unavailable";
  }
}

/** One bar of a board's histogram. */
export interface BoardBin {
  /** The bar's lowest score. */
  from: number;
  /** The first score of the next bar, or null for an open last bar. */
  to: number | null;
  /** Rounds in it. */
  n: number;
}

/** One row of a top ten or a record. */
export interface BoardRow {
  /** Three characters, or ???. */
  initials: string;
  /** Two letters, or null. */
  country: string | null;
  /** The score. */
  score: number;
  /** The tie-breaking time, where the game has one. */
  time?: number;
  /** The day, for a record. */
  day?: string;
}

/** A day's board for one game and mode, as the board answers. */
export interface BoardAnswer {
  /** The game. */
  game: string;
  /** The mode. */
  mode: string;
  /** The day. */
  day: string;
  /** How its score is shown. */
  unit: BoardUnit;
  /** Whether higher is better. */
  higherIsBetter: boolean;
  /** Whether the server re-checks its rounds with the engine. */
  verified: boolean;
  /** Rounds posted. */
  played: number;
  /** Rounds solved. */
  solved: number;
  /** The mean and the median score of the plausible scored rounds. */
  avg: number | null;
  median: number | null;
  /** The histogram, lowest bar first. */
  histogram: BoardBin[];
  /** Rounds without a score (unsolved). */
  unsolved: number;
  /** The top ten. */
  top: BoardRow[];
  /** Countries with at least three rounds. */
  countries: { code: string; n: number }[];
}

/** The shelf over a window, as the board answers. */
export interface TotalsAnswer {
  /** "1" (today), "7", "30" or "all". */
  days: string;
  /** The first day counted. */
  since: string;
  /** Rounds posted and solved. */
  played: number;
  solved: number;
  /** Per game and mode, with its best round. */
  games: { game: string; mode: string; played: number; solved: number; days: number; record: BoardRow | null }[];
  /** The shelf per day; `browsers` is how many browsers published a round that day, or null for "no data". */
  byDay: { day: string; played: number; solved: number; browsers?: number | null }[];
  /** The first day the browsers' count covers, or null (none yet); absent from an answer before the count existed. */
  browsersFrom?: string | null;
  /** Countries with at least three rounds. */
  countries: { code: string; n: number }[];
}

/**
 * How many browsers published a round on a day, from a totals answer, or null for "no data" (a day before the count
 * began, a day whose rounds carried no yes, or a board that does not count yet). A day after the count began with no
 * round at all is 0.
 *
 * @param t the totals
 * @param day the puzzle day
 * @returns the browsers, or null
 */
export function browsersOn(t: TotalsAnswer, day: string): number | null {
  // No count, or a day before it.
  if (!t.browsersFrom || day < t.browsersFrom) return null;
  // The day's line, when it had rounds.
  const line = t.byDay.find((d) => d.day === day);
  // No rounds that day: nobody published.
  if (!line) return 0;
  // The board's own figure (null stays "no data").
  return line.browsers ?? null;
}

/**
 * Read one game's board for one day.
 *
 * @param game the game's id
 * @param mode the board mode
 * @param day the puzzle's day
 * @returns the board, or null when it is unavailable
 */
export async function fetchBoard(game: string, mode: string, day: string): Promise<BoardAnswer | null> {
  // Read; any failure is "unavailable".
  try {
    // The board's address, the same one the Worker caches.
    const res = await fetch(boardPath(game, mode, day));
    // Only a good answer is a board.
    return res.ok ? ((await res.json()) as BoardAnswer) : null;
  } catch {
    // No network, or no board.
    return null;
  }
}

/**
 * Read the shelf's totals over a window.
 *
 * @param days today, the last 7 or 30 days, or every day kept
 * @returns the totals, or null when they are unavailable
 */
export async function fetchTotals(days: TotalsWindow): Promise<TotalsAnswer | null> {
  // Read; any failure is "unavailable".
  try {
    // The address.
    const res = await fetch(totalsPath(days));
    // Only a good answer.
    return res.ok ? ((await res.json()) as TotalsAnswer) : null;
  } catch {
    // No network, or no board.
    return null;
  }
}

// (flagOf, which built a flag emoji from regional indicator letters, was removed on 2026-11-10: Windows desktops
// draw those as two letters. Flags are SVG files now; see src/lib/flags.ts.)

/**
 * A score as a game shows it: tries and clues and answers out of their total ("3/6"), a time as m:ss, points as a
 * number in the page's language. An average keeps one decimal where the unit counts out of a total.
 *
 * @param game the game's id
 * @param score the score
 * @param locale the page's language
 * @returns the text
 */
export function formatScore(game: string, score: number, locale: string): string {
  // The game's rules.
  const g = boardGame(game);
  // A time.
  if (g?.unit === "time") return formatDuration(score);
  // Counted out of a total, an average with one decimal.
  if (g?.outOf !== undefined) return `${score.toLocaleString(locale, { maximumFractionDigits: 1 })}/${g.outOf}`;
  // Points, whole.
  return Math.round(score).toLocaleString(locale);
}

/**
 * The share of other players a round beat, as a whole percentage.
 *
 * @param beat the rounds it beat
 * @param of every round of the day, its own included
 * @returns 0 to 100, or null when it is the only round
 */
export function beatPercent(beat: number | undefined, of: number | undefined): number | null {
  // Nothing to compare with.
  if (beat === undefined || of === undefined || of < 2) return null;
  // The others it beat, of all the others.
  return Math.round((100 * Math.min(beat, of - 1)) / (of - 1));
}
