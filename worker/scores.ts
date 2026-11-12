// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

/**
 * worker/scores.ts
 *
 * The /dev/fun games' PUBLIC SCOREBOARD (PRIME's decisions of 08/11/2026):
 * the four endpoints under /api/v1/fun/, backed by one Cloudflare D1 table
 * (migrations/0001_fun_scores.sql).
 *
 *   POST /api/v1/fun/score            a finished daily round: { game, mode?, day, state, initials?, nonce, first? }
 *   POST /api/v1/fun/score/initials   change that round's initials the same day: { nonce, initials }
 *   GET  /api/v1/fun/board            one game's board for one day: ?game=&mode=&day= (and ?score=&time=)
 *   GET  /api/v1/fun/totals           the shelf over the last days: ?days=1|7|30|all (1 = today, for the dashboard);
 *                                     each byDay entry carries `browsers` (a number, or null for "no data"), and
 *                                     `browsersFrom` names the first day the count covers (null: none yet)
 *
 * WHY THIS SHAPE
 * --------------
 * The board has to be honest about two things at once: the scores, and what
 * it keeps about the people who post them.
 *
 * The scores. The browser never sends a score. It sends the game's own saved
 * daily state, and src/lib/fun/verify.ts rebuilds that day's puzzle with the
 * game's engine and grades the round again; what is stored is what the server
 * worked out. A state that is not a genuine finished round of the day's
 * puzzle is refused. Times cannot be proven (a clock runs in the browser), so
 * they are recomputed from their parts and held to a floor per game; a time
 * under it is stored and counted but kept out of the top ten. One row per
 * submission nonce, enforced by the table's key; one submission per game and
 * day per browser, enforced in the browser. Nothing is rate-limited by who is
 * asking, because nothing here knows who is asking.
 *
 * What it keeps. Each row is the game, the puzzle's day, the mode, solved or
 * not, the score and its parts, the initials (or ???), the country Cloudflare
 * attaches to the request (two letters) and the UTC date it arrived. That is
 * all.
 *
 * WHAT IS NEVER WRITTEN, ANYWHERE
 * -------------------------------
 * IP address. User agent string. Any request header: the only thing read from
 * the request besides its body and address is request.cf.country, which
 * Cloudflare computes, and it is kept as two letters. No cookie is read or
 * set, there is no account, and no identifier of the browser or the device is
 * made or kept: the nonce is 128 random bits made fresh for each submission,
 * so two rounds from one browser share nothing. No time finer than the day:
 * the row keeps the UTC date of receipt and nothing else, and the table has no
 * row number (WITHOUT ROWID), because insertion order is a clock too. Request
 * bodies are never logged; this file writes no log line at all, which the
 * build checks (scripts/check-counting-source.mjs). As in worker/analytics.ts,
 * the absence of those columns is the promise, not a policy about how they
 * are queried.
 *
 * Without a browser identifier the board cannot stop one person posting the
 * same day from two browsers. That is the trade, stated on the scores page,
 * and the reason the board shows initials rather than claiming identities.
 * For the same reason streaks are not computed: nothing links one day's round
 * to the next day's.
 *
 * UNIQUE BROWSERS A DAY, WITHOUT AN IDENTIFIER (the site owner, 12/11/2026
 * 17:06 to 17:09; migrations/0004_fun_first_today.sql). The browser keeps the
 * day of its last published round in its own storage (src/lib/fun/board.ts,
 * ronutz:fun:posted-day, never sent) and says, with one yes or no in the body
 * (`first`), whether this round is the first it publishes on the round's day.
 * Only that bit is stored, on the new row, as first_today; a nonce already
 * stored or a refused round adds nothing. The day's sum of the bits is how
 * many browsers published a round that day: browsers, not people (a phone and
 * a laptop count two; a private window or cleared site data counts again).
 * The day is the puzzle's day (the `day` column), as every count here is. If
 * the column is missing (the migration not yet applied), the round is stored
 * without the bit and the count is reported as unavailable, never as zero.
 *
 * Rows are kept for 400 days from the day they were received; about one write
 * in 200 also deletes the rows past that.
 *
 * THE BINDING IS OPTIONAL. Without SCORES (the D1 database bound in
 * wrangler.jsonc), or when the database cannot be read, every endpoint
 * answers 503 {"board":"unavailable"} and the games carry on as before, their
 * record kept in the browser only.
 */

// The shared rules: the games on the board, the initials, the day window, the limits, the endpoint paths.
import {
  BOARD_GAMES,
  DAY_RE,
  KEEP_DAYS,
  MAX_BODY_BYTES,
  MAX_INITIALS_BODY_BYTES,
  MIN_COUNTRY_PLAYERS,
  NONCE_RE,
  NO_INITIALS,
  TOP_N,
  acceptedDays,
  boardGame,
  boardPath,
  initialsProblem,
  isBoardMode,
  type BoardGame,
} from "../src/lib/fun/board-rules";
// The honesty check: the day's puzzle rebuilt and the round graded again.
import { verifyRound, type Verified } from "../src/lib/fun/verify";
// The UTC day of an instant and the day arithmetic.
import { addDays, utcDayKey } from "../src/lib/fun/daily";

/** The binding this module needs. Optional, so the Worker runs without the board configured. */
export interface ScoresEnv {
  /** The scoreboard's D1 database (see sb's wrangler stanza; absent until PRIME creates and binds it). */
  SCORES?: D1Database;
}

/** The part of the Worker's context this module uses: work that may finish after the response. */
interface Later {
  /** Keep the isolate alive for a promise after the response has gone. */
  waitUntil(promise: Promise<unknown>): void;
}

/** Where the board's routes start. */
const PREFIX = "/api/v1/fun";

/** How long a GET answer is cached at the edge, in seconds. */
const CACHE_SECONDS = 60;

/** One write in this many also deletes the rows older than KEEP_DAYS. */
const CLEANUP_ONE_IN = 200;

/** The most rows a board reads for its averages, median, histogram and places. */
const BOARD_READ_LIMIT = 20000;

/** The most bins a histogram draws (one more for "and over"). */
const MAX_BINS = 12;

/**
 * A JSON answer, open to any origin (the board is public), cached only when asked.
 *
 * @param body the answer
 * @param status the HTTP status
 * @param cacheSeconds how long the edge and browsers may keep it (0: not at all)
 * @returns the response
 */
function json(body: unknown, status = 200, cacheSeconds = 0): Response {
  // The response, with the CORS headers the rest of /api uses.
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      // A short public cache for reads; nothing else is kept anywhere.
      "cache-control": cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : "no-store",
    },
  });
}

/** The answer when the database is not bound or cannot be read: the games then behave as before. */
const UNAVAILABLE = () => json({ board: "unavailable" }, 503);

/**
 * Read a request body, giving up as soon as it passes a size (the body is streamed, never read whole first). The
 * body is parsed and verified, never logged or stored as sent.
 *
 * @param request the request
 * @param cap the most bytes accepted
 * @returns the text, or null when it is larger than the cap
 */
async function readCapped(request: Request, cap: number): Promise<string | null> {
  // No body at all.
  if (!request.body) return "";
  // The stream's reader.
  const reader = request.body.getReader();
  // The pieces read so far, and their size.
  const parts: Uint8Array[] = [];
  let size = 0;
  // Until the stream ends.
  for (;;) {
    // The next piece.
    const { done, value } = await reader.read();
    // The end.
    if (done) break;
    // Counted.
    size += value.byteLength;
    // Past the cap: stop reading at once.
    if (size > cap) {
      // The rest is discarded.
      await reader.cancel();
      // Too large.
      return null;
    }
    // Kept.
    parts.push(value);
  }
  // The pieces joined.
  const all = new Uint8Array(size);
  // Each in turn.
  let at = 0;
  for (const p of parts) {
    // Copied in.
    all.set(p, at);
    // Moved on.
    at += p.byteLength;
  }
  // As text.
  return new TextDecoder().decode(all);
}

/**
 * The visiting country as Cloudflare reports it, two capital letters, or null (absent, unknown "XX", or Tor "T1").
 *
 * @param request the request
 * @returns the code, or null
 */
function countryOf(request: Request): string | null {
  // Cloudflare's request properties; nothing else about the request is read.
  const raw = (request as { cf?: { country?: unknown } }).cf?.country;
  // Two capital letters that name a country.
  return typeof raw === "string" && /^[A-Z]{2}$/.test(raw) && raw !== "XX" && raw !== "T1" ? raw : null;
}

/** A row's place on a board: its score and its tie-breaking time. */
interface Ranked {
  /** The score. */
  score: number;
  /** The time, or null. */
  time: number | null;
}

/**
 * Compare two rounds on a game's board.
 *
 * @param g the game's rules
 * @param a one round
 * @param b another
 * @returns negative when a is better, positive when b is, 0 when they tie
 */
function compare(g: BoardGame, a: Ranked, b: Ranked): number {
  // The score first, in the game's direction.
  const byScore = g.higherIsBetter ? b.score - a.score : a.score - b.score;
  // A difference decides.
  if (byScore !== 0) return byScore;
  // Then the time, where the game breaks ties with one; a round with no time comes after one with a time.
  if (!g.timeTieBreak) return 0;
  // Both without: a tie.
  if (a.time === null && b.time === null) return 0;
  // Only one has a time: it is the better.
  if (a.time === null) return 1;
  if (b.time === null) return -1;
  // The faster is better.
  return a.time - b.time;
}

/** A place on a board: the rank, the rounds counted, and how many rounds it beats. */
interface Place {
  /** 1 for the best. */
  place: number;
  /** Rounds posted that day. */
  of: number;
  /** Rounds strictly worse, unsolved ones included. */
  beat: number;
}

/**
 * Where a score sits among a day's rounds.
 *
 * @param g the game's rules
 * @param list the day's plausible scored rounds
 * @param played every round posted that day
 * @param unscored the rounds without a score (unsolved), which every score beats
 * @param me the score being placed
 * @returns its place
 */
function placeOf(g: BoardGame, list: readonly Ranked[], played: number, unscored: number, me: Ranked): Place {
  // Strictly better and strictly worse rounds.
  let better = 0;
  let worse = 0;
  // Each round of the day.
  for (const r of list) {
    // The comparison.
    const c = compare(g, r, me);
    // Counted.
    if (c < 0) better++;
    else if (c > 0) worse++;
  }
  // The place.
  return { place: better + 1, of: played, beat: worse + unscored };
}

/**
 * A round's numbers for the board's lists, from a database row.
 *
 * @param row the row
 * @returns its score and time
 */
function ranked(row: { score: unknown; time_ms: unknown }): Ranked {
  // Numbers, a missing time as null.
  return { score: Number(row.score), time: row.time_ms === null || row.time_ms === undefined ? null : Number(row.time_ms) };
}

/** Bin widths a histogram may use: whole numbers, then times in milliseconds (5 s to an hour). */
const POINT_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000, 100000];
/** Bin widths for times. */
const TIME_STEPS = [5000, 10000, 15000, 30000, 60000, 120000, 300000, 600000, 900000, 1800000, 3600000];

/** One bar of a histogram: scores from `from` up to `to` (exclusive), or from `from` up when `to` is null. */
interface Bin {
  /** The bar's lowest score. */
  from: number;
  /** The first score of the next bar, or null for the last, open bar. */
  to: number | null;
  /** Rounds in the bar. */
  n: number;
}

/**
 * A histogram of a day's scores, drawn to the game's own scale: one bar per value for scores counted out of a fixed
 * number, otherwise bars of a round width chosen so that at most MAX_BINS cover the scores up to the 95th percentile,
 * with the rest in a last, open bar.
 *
 * @param g the game's rules
 * @param scores the scores, ascending
 * @returns the bars, lowest first
 */
function histogram(g: BoardGame, scores: readonly number[]): Bin[] {
  // Nothing to draw.
  if (scores.length === 0) return [];
  // Counted out of a fixed number: one bar per value (answers right start at 0, tries and clues at 1).
  if (g.outOf !== undefined) {
    // The lowest value.
    const low = g.unit === "right" ? 0 : 1;
    // Each value's bar.
    return Array.from({ length: g.outOf - low + 1 }, (_, i) => ({ from: low + i, to: low + i + 1, n: scores.filter((s) => s === low + i).length }));
  }
  // The range up to the 95th percentile, so one outlier does not flatten every bar.
  const lo = scores[0];
  const hi = scores[Math.min(scores.length - 1, Math.floor(scores.length * 0.95))];
  // The steps for this unit.
  const steps = g.unit === "time" ? TIME_STEPS : POINT_STEPS;
  // The smallest width that covers the range in MAX_BINS bars (the largest when none does).
  const width = steps.find((w) => Math.floor(hi / w) - Math.floor(lo / w) + 1 <= MAX_BINS) ?? steps[steps.length - 1];
  // The first bar starts at a round value.
  const start = Math.floor(lo / width) * width;
  // How many closed bars.
  const count = Math.floor(hi / width) - Math.floor(lo / width) + 1;
  // The bars.
  const bins: Bin[] = Array.from({ length: count }, (_, i) => ({ from: start + i * width, to: start + (i + 1) * width, n: 0 }));
  // The open bar for anything past the last closed one.
  const top = start + count * width;
  // Each score.
  let over = 0;
  for (const s of scores) {
    // Past the closed bars.
    if (s >= top) over++;
    // Its bar.
    else bins[Math.floor((s - start) / width)].n++;
  }
  // The open bar, when anything is in it.
  if (over > 0) bins.push({ from: top, to: null, n: over });
  // The histogram.
  return bins;
}

/**
 * The middle of an ascending list.
 *
 * @param xs the values, ascending
 * @returns the median, or null for an empty list
 */
function median(xs: readonly number[]): number | null {
  // Nothing.
  if (xs.length === 0) return null;
  // The middle index.
  const mid = Math.floor(xs.length / 2);
  // Odd: the middle one; even: the mean of the middle two.
  return xs.length % 2 === 1 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

/**
 * A number rounded for the answer: whole for times and points, two decimals for counts out of a fixed number.
 *
 * @param g the game's rules
 * @param x the value
 * @returns the value rounded
 */
function tidy(g: BoardGame, x: number | null): number | null {
  // Nothing to round.
  if (x === null) return null;
  // Tries, clues and answers read as 2.37; times and points as whole numbers.
  return g.outOf !== undefined ? Math.round(x * 100) / 100 : Math.round(x);
}

/**
 * The game and mode a request names, checked against the board's list.
 *
 * @param game the game's id
 * @param mode the mode, or null for the game's first
 * @returns the game's rules and the mode, or null
 */
function gameAndMode(game: unknown, mode: unknown): { g: BoardGame; mode: string } | null {
  // A known game.
  const g = typeof game === "string" ? boardGame(game) : undefined;
  // Not on the board.
  if (!g) return null;
  // The mode asked for, or the game's first.
  const m = typeof mode === "string" && mode !== "" ? mode : g.modes[0];
  // One of the game's.
  return isBoardMode(g, m) ? { g, mode: m } : null;
}

/** The edge cache, where the runtime has one (it does on a custom domain; it does not in a local test). */
function edgeCache(): Cache | null {
  // The default cache, when present.
  return typeof caches !== "undefined" ? caches.default : null;
}

/**
 * Forget the cached board of a game, mode and day in this data centre, so the player who just posted sees the row.
 *
 * @param origin the site's origin
 * @param game the game
 * @param mode the mode
 * @param day the day
 */
async function forgetBoard(origin: string, game: string, mode: string, day: string): Promise<void> {
  // The cache.
  const c = edgeCache();
  // Nothing cached here.
  if (!c) return;
  // The board's address exactly as the pages ask for it (board-rules.ts boardPath()).
  await c.delete(new Request(`${origin}${boardPath(game, mode, day)}`));
}

/**
 * The day's played, solved and unscored counts, and its plausible scored rounds best first.
 *
 * @param db the database
 * @param g the game's rules
 * @param mode the mode
 * @param day the day
 * @returns the counts and the list
 */
async function dayRounds(db: D1Database, g: BoardGame, mode: string, day: string): Promise<{ played: number; solved: number; unscored: number; list: Ranked[] }> {
  // Two reads in one round trip.
  const [counts, rows] = await db.batch([
    // Every round of the day.
    db
      .prepare("SELECT COUNT(*) AS played, COALESCE(SUM(won), 0) AS solved, COALESCE(SUM(CASE WHEN score IS NULL THEN 1 ELSE 0 END), 0) AS unscored FROM fun_scores WHERE game = ?1 AND mode = ?2 AND day = ?3")
      .bind(g.id, mode, day),
    // The plausible scored rounds.
    db
      .prepare(`SELECT score, time_ms FROM fun_scores WHERE game = ?1 AND mode = ?2 AND day = ?3 AND score IS NOT NULL AND plausible = 1 LIMIT ${BOARD_READ_LIMIT}`)
      .bind(g.id, mode, day),
  ]);
  // The counts' row.
  const c = (counts.results[0] ?? {}) as { played?: unknown; solved?: unknown; unscored?: unknown };
  // The list, best first.
  const list = (rows.results as Array<{ score: unknown; time_ms: unknown }>).map(ranked).sort((a, b) => compare(g, a, b));
  // Both.
  return { played: Number(c.played ?? 0), solved: Number(c.solved ?? 0), unscored: Number(c.unscored ?? 0), list };
}

/**
 * POST /api/v1/fun/score: verify a finished daily round and store the server's own result.
 *
 * @param request the request
 * @param url its address
 * @param db the database
 * @param later the context, for the cleanup and the cache
 * @returns the answer
 */
async function postScore(request: Request, url: URL, db: D1Database, later: Later | undefined): Promise<Response> {
  // The body, capped.
  const text = await readCapped(request, MAX_BODY_BYTES);
  // Too large.
  if (text === null) return json({ error: "too_large", limit: MAX_BODY_BYTES }, 413);
  // Parsed.
  let body: Record<string, unknown>;
  // A body that is not JSON.
  try {
    // The object.
    const parsed: unknown = JSON.parse(text);
    // Only an object is a submission.
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "bad_request" }, 400);
    // Kept.
    body = parsed as Record<string, unknown>;
  } catch {
    // Not JSON.
    return json({ error: "bad_json" }, 400);
  }
  // The game and mode.
  const gm = gameAndMode(body.game, body.mode);
  // Not a board game or mode.
  if (!gm) return json({ error: "bad_game" }, 400);
  // The nonce.
  const nonce = body.nonce;
  // 32 hex digits.
  if (typeof nonce !== "string" || !NONCE_RE.test(nonce)) return json({ error: "bad_nonce" }, 400);
  // The day.
  const day = body.day;
  // Today's puzzle only (and yesterday's in the first hour after 00:00 UTC).
  const now = new Date();
  if (typeof day !== "string" || !DAY_RE.test(day) || !acceptedDays(now).includes(day)) return json({ error: "bad_day" }, 400);
  // The initials: none gives ???; anything given must be accepted.
  const raw = body.initials;
  // Absent or empty is fine.
  const given = typeof raw === "string" && raw.trim() !== "";
  // Refused initials are said so (the browser checks the same rule first).
  if (given && initialsProblem(raw as string) !== null) return json({ error: "initials" }, 400);
  // The stored form.
  const initials = given ? (raw as string).trim().toUpperCase() : NO_INITIALS;
  // The honesty check: the day's puzzle rebuilt and the round graded again.
  const v: Verified | null = verifyRound(gm.g.id, day, body.state, gm.mode);
  // Not a genuine finished round of that day's puzzle.
  if (!v) return json({ error: "not_verified" }, 422);
  // The browser's one yes or no: this is the first round it publishes on this puzzle day (anything but true is no).
  const first = body.first === true ? 1 : 0;
  // The row's values, the same with or without the bit.
  const values = [nonce, gm.g.id, day, gm.mode, v.won ? 1 : 0, v.score, v.timeMs, JSON.stringify(v.parts), initials, countryOf(request), v.verified ? 1 : 0, v.plausible ? 1 : 0, utcDayKey(now)];
  // The row, inserted once per nonce; the bit goes only on a new row (a nonce already stored keeps its own).
  let ins: D1Result;
  // With the bit, where the table has its column (migrations/0004).
  try {
    // Inserted with first_today as the fourteenth value.
    ins = await db
      .prepare(
        "INSERT INTO fun_scores (nonce, game, day, mode, won, score, time_ms, parts, initials, country, verified, plausible, received, first_today) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14) ON CONFLICT(nonce) DO NOTHING",
      )
      .bind(...values, first)
      .run();
  } catch (err) {
    // Any other failure is the database's, answered as "unavailable" by the caller.
    if (!/first_today/.test(err instanceof Error ? err.message : String(err))) throw err;
    // The column is not there yet: the round is stored without the bit, and the count reads as unavailable.
    ins = await db
      .prepare(
        "INSERT INTO fun_scores (nonce, game, day, mode, won, score, time_ms, parts, initials, country, verified, plausible, received) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13) ON CONFLICT(nonce) DO NOTHING",
      )
      .bind(...values)
      .run();
  }
  // Whether this nonce was already on the board.
  const duplicate = (ins.meta?.changes ?? 0) === 0;
  // The stored round: this one, or the one posted before with the same nonce.
  const stored = duplicate
    ? await db.prepare("SELECT game, mode, day, won, score, time_ms, plausible, verified FROM fun_scores WHERE nonce = ?1").bind(nonce).first<{ game: string; mode: string; day: string; won: number; score: number | null; time_ms: number | null; plausible: number; verified: number }>()
    : { game: gm.g.id, mode: gm.mode, day, won: v.won ? 1 : 0, score: v.score, time_ms: v.timeMs, plausible: v.plausible ? 1 : 0, verified: v.verified ? 1 : 0 };
  // A nonce that cannot be read back (cannot happen after a conflict, but never trusted).
  if (!stored) return UNAVAILABLE();
  // The stored round's game.
  const sg = boardGame(stored.game) ?? gm.g;
  // The day's rounds now.
  const day0 = await dayRounds(db, sg, stored.mode, stored.day);
  // Its place, when it has a score.
  const place = stored.score === null ? null : placeOf(sg, day0.list, day0.played, day0.unscored, { score: Number(stored.score), time: stored.time_ms === null ? null : Number(stored.time_ms) });
  // The cached board no longer shows everyone: forgotten here, after the answer.
  later?.waitUntil(forgetBoard(url.origin, stored.game, stored.mode, stored.day).catch(() => undefined));
  // Now and then, the rows past the keeping period go.
  if (!duplicate && Math.random() < 1 / CLEANUP_ONE_IN) {
    // Received more than KEEP_DAYS days ago.
    const cutoff = addDays(utcDayKey(now), -KEEP_DAYS);
    // Deleted after the answer.
    later?.waitUntil(db.prepare("DELETE FROM fun_scores WHERE received < ?1").bind(cutoff).run().catch(() => undefined));
  }
  // The answer: the server's own numbers, and the place.
  return json({
    ok: true,
    duplicate,
    won: stored.won === 1,
    score: stored.score,
    verified: stored.verified === 1,
    plausible: stored.plausible === 1,
    of: day0.played,
    ...(place ? { place: place.place, beat: place.beat } : {}),
  });
}

/**
 * POST /api/v1/fun/score/initials: change the initials of a round posted today, authorised by its nonce alone.
 *
 * @param request the request
 * @param url its address
 * @param db the database
 * @param later the context, for the cache
 * @returns the answer
 */
async function postInitials(request: Request, url: URL, db: D1Database, later: Later | undefined): Promise<Response> {
  // The body, capped small.
  const text = await readCapped(request, MAX_INITIALS_BODY_BYTES);
  // Too large.
  if (text === null) return json({ error: "too_large", limit: MAX_INITIALS_BODY_BYTES }, 413);
  // Parsed.
  let body: Record<string, unknown>;
  // Not JSON.
  try {
    // The object.
    const parsed: unknown = JSON.parse(text);
    // Only an object.
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "bad_request" }, 400);
    // Kept.
    body = parsed as Record<string, unknown>;
  } catch {
    // Not JSON.
    return json({ error: "bad_json" }, 400);
  }
  // The nonce.
  if (typeof body.nonce !== "string" || !NONCE_RE.test(body.nonce)) return json({ error: "bad_nonce" }, 400);
  // The initials, which must be accepted.
  if (typeof body.initials !== "string" || initialsProblem(body.initials) !== null) return json({ error: "initials" }, 400);
  // The days a round can still be changed on: today's, and yesterday's in the first hour.
  const days = acceptedDays(new Date());
  // Changed, for that round only, while its day lasts.
  const res = await db
    .prepare("UPDATE fun_scores SET initials = ?1 WHERE nonce = ?2 AND day IN (?3, ?4) RETURNING game, mode, day")
    .bind(body.initials.trim().toUpperCase(), body.nonce, days[0], days[days.length - 1])
    .all<{ game: string; mode: string; day: string }>();
  // The round, if there was one.
  const row = res.results[0];
  // No such round today.
  if (!row) return json({ error: "not_found" }, 404);
  // The cached board shows the old initials: forgotten here.
  later?.waitUntil(forgetBoard(url.origin, row.game, row.mode, row.day).catch(() => undefined));
  // Done.
  return json({ ok: true });
}

/**
 * GET /api/v1/fun/board: one game's board for one day.
 *
 * @param url its address
 * @param db the database
 * @returns the answer
 */
async function getBoard(url: URL, db: D1Database): Promise<Response> {
  // The game and mode.
  const gm = gameAndMode(url.searchParams.get("game"), url.searchParams.get("mode"));
  // Unknown.
  if (!gm) return json({ error: "bad_game", games: BOARD_GAMES.map((g) => ({ game: g.id, modes: g.modes })) }, 400);
  // Today, in UTC.
  const today = utcDayKey(new Date());
  // The day asked for, today by default.
  const day = url.searchParams.get("day") ?? today;
  // A real day, not in the future, not past the keeping period.
  if (!DAY_RE.test(day) || day > today || day < addDays(today, -KEEP_DAYS)) return json({ error: "bad_day" }, 400);
  // The game's direction, for the SQL (a constant, never a value from the request).
  const dir = gm.g.higherIsBetter ? "DESC" : "ASC";
  // The day's rounds, and the top ten and the countries.
  const [day0, extra] = await Promise.all([
    dayRounds(db, gm.g, gm.mode, day),
    db.batch([
      // The top ten: plausible scored rounds, best first, the time breaking ties.
      db
        .prepare(`SELECT initials, country, score, time_ms FROM fun_scores WHERE game = ?1 AND mode = ?2 AND day = ?3 AND score IS NOT NULL AND plausible = 1 ORDER BY score ${dir}, time_ms IS NULL, time_ms ASC LIMIT ${TOP_N}`)
        .bind(gm.g.id, gm.mode, day),
      // The countries with at least MIN_COUNTRY_PLAYERS rounds.
      db
        .prepare(`SELECT country AS code, COUNT(*) AS n FROM fun_scores WHERE game = ?1 AND mode = ?2 AND day = ?3 AND country IS NOT NULL GROUP BY country HAVING COUNT(*) >= ${MIN_COUNTRY_PLAYERS} ORDER BY n DESC, code ASC LIMIT 60`)
        .bind(gm.g.id, gm.mode, day),
    ]),
  ]);
  // The scores, ascending, for the averages and the histogram.
  const scores = day0.list.map((r) => r.score).sort((a, b) => a - b);
  // Their mean.
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  // A place, when the request asks where a score would sit.
  const q = url.searchParams.get("score");
  // The score and the time asked about.
  const qs = q === null ? NaN : Number(q);
  const qtRaw = url.searchParams.get("time");
  const qt = qtRaw === null ? null : Number(qtRaw);
  // Only real numbers are placed.
  const yourPlace = Number.isFinite(qs) && (qt === null || Number.isFinite(qt)) ? placeOf(gm.g, day0.list, day0.played, day0.unscored, { score: qs, time: qt }) : undefined;
  // The answer.
  return json(
    {
      game: gm.g.id,
      mode: gm.mode,
      day,
      unit: gm.g.unit,
      higherIsBetter: gm.g.higherIsBetter,
      verified: gm.g.verified,
      played: day0.played,
      solved: day0.solved,
      avg: tidy(gm.g, avg),
      median: tidy(gm.g, median(scores)),
      histogram: histogram(gm.g, scores),
      unsolved: day0.unscored,
      top: (extra[0].results as Array<{ initials: string; country: string | null; score: number; time_ms: number | null }>).map((r) => ({
        initials: r.initials,
        country: r.country,
        score: r.score,
        ...(gm.g.timeTieBreak && r.time_ms !== null ? { time: r.time_ms } : {}),
      })),
      countries: (extra[1].results as Array<{ code: string; n: number }>).map((r) => ({ code: r.code, n: Number(r.n) })),
      ...(yourPlace ? { yourPlace } : {}),
    },
    200,
    CACHE_SECONDS,
  );
}

/** The browsers' count over a window: the first day any round carried the bit, and the bits per day from `since`. */
interface BrowserCounts {
  /** The first puzzle day with the bit set on any kept row, or null when none has it yet. */
  from: string | null;
  /** Rounds with the bit set, per puzzle day, from the window's first day. */
  perDay: Map<string, number>;
}

/**
 * Read the browsers' count for a window, through the index of the rows that carry the bit (migrations/0004).
 *
 * @param db the database
 * @param since the window's first day
 * @returns the counts, or null when they cannot be read (the column is not there yet)
 */
async function browserCounts(db: D1Database, since: string): Promise<BrowserCounts | null> {
  // A failure here is the missing column: the count is unavailable, the rest of the answer stands.
  try {
    // Two reads in one round trip, both on the rows with the bit set.
    const [first, days] = await db.batch([
      // The first day counted, over every kept row.
      db.prepare("SELECT MIN(day) AS d FROM fun_scores WHERE first_today = 1"),
      // The bits per day in the window.
      db.prepare("SELECT day, COUNT(*) AS n FROM fun_scores WHERE first_today = 1 AND day >= ?1 GROUP BY day").bind(since),
    ]);
    // The first day, when there is one.
    const d = (first.results[0] as { d?: unknown } | undefined)?.d;
    // Both, as plain values.
    return { from: typeof d === "string" ? d : null, perDay: new Map((days.results as Array<{ day: string; n: number }>).map((r) => [r.day, Number(r.n)])) };
  } catch {
    // Not readable: "no data" everywhere.
    return null;
  }
}

/**
 * One day's browsers, or null for "no data": a day before the first one counted, any day while the count cannot be
 * read, and a day whose rounds all came without the bit (from pages loaded before the count began) are never zero.
 *
 * @param c the window's counts, or null
 * @param day the puzzle day
 * @param played the rounds posted that day
 * @returns the browsers, or null
 */
function browsersOn(c: BrowserCounts | null, day: string, played: number): number | null {
  // No count, or a day before it began.
  if (!c || c.from === null || day < c.from) return null;
  // The day's bits.
  const n = c.perDay.get(day) ?? 0;
  // Rounds without a single bit cannot mean no browser: no data.
  return n === 0 && played > 0 ? null : n;
}

/**
 * GET /api/v1/fun/totals: the shelf over the last 7 or 30 days, or every day kept.
 *
 * @param url its address
 * @param db the database
 * @returns the answer
 */
async function getTotals(url: URL, db: D1Database): Promise<Response> {
  // The window asked for.
  const days = url.searchParams.get("days") ?? "7";
  // Only the windows the pages offer: today (the dashboard, 09/11/2026), the last 7 or 30 days, or every day kept.
  if (days !== "1" && days !== "7" && days !== "30" && days !== "all") return json({ error: "bad_days", allowed: ["1", "7", "30", "all"] }, 400);
  // Today, in UTC.
  const today = utcDayKey(new Date());
  // The first day in the window.
  const since = addDays(today, -((days === "all" ? KEEP_DAYS : Number(days)) - 1));
  // The games whose higher scores are better, for the records' order (constants from the board's list).
  const higher = BOARD_GAMES.filter((g) => g.higherIsBetter).map((g) => `'${g.id}'`).join(", ");
  // Four reads in one round trip.
  const [games, byDay, records, countries] = await db.batch([
    // Per game and mode.
    db.prepare("SELECT game, mode, COUNT(*) AS played, COALESCE(SUM(won), 0) AS solved, COUNT(DISTINCT day) AS days FROM fun_scores WHERE day >= ?1 GROUP BY game, mode").bind(since),
    // The shelf, per day.
    db.prepare("SELECT day, COUNT(*) AS played, COALESCE(SUM(won), 0) AS solved FROM fun_scores WHERE day >= ?1 GROUP BY day ORDER BY day ASC").bind(since),
    // Each game's and mode's best plausible round in the window.
    db
      .prepare(
        `SELECT game, mode, initials, country, score, time_ms, day FROM (SELECT game, mode, initials, country, score, time_ms, day, ROW_NUMBER() OVER (PARTITION BY game, mode ORDER BY CASE WHEN game IN (${higher}) THEN -score ELSE score END ASC, time_ms IS NULL, time_ms ASC) AS rn FROM fun_scores WHERE day >= ?1 AND score IS NOT NULL AND plausible = 1) WHERE rn = 1`,
      )
      .bind(since),
    // The countries with at least MIN_COUNTRY_PLAYERS rounds.
    db.prepare(`SELECT country AS code, COUNT(*) AS n FROM fun_scores WHERE day >= ?1 AND country IS NOT NULL GROUP BY country HAVING COUNT(*) >= ${MIN_COUNTRY_PLAYERS} ORDER BY n DESC, code ASC LIMIT 60`).bind(since),
  ]);
  // Records by game and mode.
  const best = new Map((records.results as Array<{ game: string; mode: string; initials: string; country: string | null; score: number; time_ms: number | null; day: string }>).map((r) => [`${r.game}|${r.mode}`, r]));
  // The per-game rows, in shelf order.
  const perGame = (games.results as Array<{ game: string; mode: string; played: number; solved: number; days: number }>)
    .map((r) => {
      // The game's rules (rows of a game no longer on the board are left out).
      const g = boardGame(r.game);
      // Its record.
      const rec = best.get(`${r.game}|${r.mode}`);
      // The row.
      return g
        ? {
            game: r.game,
            mode: r.mode,
            played: Number(r.played),
            solved: Number(r.solved),
            days: Number(r.days),
            record: rec ? { initials: rec.initials, country: rec.country, score: rec.score, day: rec.day, ...(g.timeTieBreak && rec.time_ms !== null ? { time: rec.time_ms } : {}) } : null,
          }
        : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => BOARD_GAMES.findIndex((g) => g.id === a.game) - BOARD_GAMES.findIndex((g) => g.id === b.game) || a.mode.localeCompare(b.mode));
  // The browsers per day, read apart: a table without the bit's column (migration not applied) must not fail the rest.
  const counts = await browserCounts(db, since);
  // The shelf per day, each day with its browsers (null: no data for that day).
  const series = (byDay.results as Array<{ day: string; played: number; solved: number }>).map((r) => ({
    day: r.day,
    played: Number(r.played),
    solved: Number(r.solved),
    browsers: browsersOn(counts, r.day, Number(r.played)),
  }));
  // The answer; streaks are not computed, because nothing links one day's rounds to another's.
  return json(
    {
      days,
      since,
      played: series.reduce((a, r) => a + r.played, 0),
      solved: series.reduce((a, r) => a + r.solved, 0),
      games: perGame,
      byDay: series,
      // The first day the browsers' count covers; null while there is none (no bit stored yet, or no column).
      browsersFrom: counts?.from ?? null,
      countries: (countries.results as Array<{ code: string; n: number }>).map((r) => ({ code: r.code, n: Number(r.n) })),
      streaks: null,
      note: "Streaks are not computed: no identifier links one day's rounds to another day's.",
      // What the browsers' count is, in words, for anyone reading the answer.
      browsersNote: "byDay[].browsers: browsers that published at least one round that puzzle day, each counted once by a yes or no its first round carried; not people, and no identifier. null means no data.",
    },
    200,
    CACHE_SECONDS,
  );
}

/**
 * The board's routes. Returns null for any address outside /api/v1/fun, so the Worker carries on with its own.
 *
 * @param request the request
 * @param url its address
 * @param env the bindings
 * @param later the context, for work after the response
 * @returns the answer, or null
 */
export async function handleScores(request: Request, url: URL, env: ScoresEnv, later?: Later): Promise<Response | null> {
  // Not the board's.
  if (url.pathname !== PREFIX && !url.pathname.startsWith(`${PREFIX}/`)) return null;
  // The route, without a trailing slash.
  const route = url.pathname.slice(PREFIX.length).replace(/\/+$/, "");
  // The four routes and their methods.
  const methods: Record<string, string> = { "/score": "POST", "/score/initials": "POST", "/board": "GET", "/totals": "GET" };
  // An unknown route.
  if (!(route in methods)) return json({ error: "not_found", routes: Object.keys(methods).map((r) => `${methods[r]} ${PREFIX}${r}`) }, 404);
  // The wrong method.
  if (request.method !== methods[route]) return json({ error: "method_not_allowed", allow: methods[route] }, 405);
  // No database bound: the board is unavailable and the games carry on as before.
  const db = env.SCORES;
  if (!db) return UNAVAILABLE();
  // A read answered from the edge cache when it can be.
  const cache = request.method === "GET" ? edgeCache() : null;
  // The cache key: the address exactly as asked.
  const key = new Request(url.toString(), { method: "GET" });
  // A cached answer.
  if (cache) {
    // Looked up.
    const hit = await cache.match(key);
    // Served.
    if (hit) return hit;
  }
  // The route's work; a database that cannot be read (not migrated yet, or down) is "unavailable", never a crash.
  try {
    // Each route.
    if (route === "/score") return await postScore(request, url, db, later);
    if (route === "/score/initials") return await postInitials(request, url, db, later);
    // The reads.
    const res = route === "/board" ? await getBoard(url, db) : await getTotals(url, db);
    // Kept at the edge for a minute when it is a good answer.
    if (cache && res.status === 200) later?.waitUntil(cache.put(key, res.clone()).catch(() => undefined));
    // Answered.
    return res;
  } catch {
    // The database's own error text is not passed on.
    return UNAVAILABLE();
  }
}
