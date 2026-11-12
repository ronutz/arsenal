// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

/**
 * worker/desk.ts
 *
 * THE DESK'S OPTIONAL SYNC (PRIME 12/11/2026 12:42, "My desk", phase 4): the
 * one place on the server a reader's desk can be kept, and only when the
 * reader turns sync on. The desk itself lives in the reader's browser
 * (ronutz:desk:v1); this route keeps an ENCRYPTED COPY of it so a second
 * device holding the same sync code can read it.
 *
 *   GET    /api/desk/<id>   the stored copy: 200 {"version": n, "data": "<b64url>"}, or 404 {"error":"not_found"}
 *   PUT    /api/desk/<id>   a new copy: {"data": "<b64url>", "base": n} -> 200 {"version": n + 1}, or
 *                           409 {"error":"conflict","version": m,"data":"<b64url>"} when n is not the stored version
 *   DELETE /api/desk/<id>   the copy deleted: 204, also when nothing was stored
 *
 * WHAT THE SERVER CAN AND CANNOT READ
 * -----------------------------------
 * The browser makes a sync code of 20 random bytes and keeps it. From the
 * code it derives two things the server never sees together with the code:
 * the id (the first 32 hex characters of SHA-256 over "ronutz-desk-id:" and
 * the code) and an AES-GCM 256-bit key (HKDF-SHA-256 over the code's bytes).
 * The data is a fresh 12-byte IV followed by the AES-GCM ciphertext, as
 * base64url. The server stores that string as it arrives and cannot decrypt
 * it: it holds no key, and the id cannot be turned back into the code.
 *
 * WHAT A ROW HOLDS (migrations/0003_desk_sync.sql), AND NOTHING ELSE
 * -----------------------------------------------------------------
 * The id, the ciphertext, its version number, its size in bytes, the UTC day
 * it was last read or written, and the UTC day and count of the writes that
 * day (for the daily write limit). No IP address, no user agent, no cookie,
 * no account, no time finer than a day. This file writes no log line, which
 * scripts/check-counting-source.mjs holds it to.
 *
 * THE LIMITS
 * ----------
 * A body of at most 140,000 bytes, read with a capped stream (the same reader
 * as worker/events.ts) so an oversized body is never held whole; data that
 * decodes to at most 98,304 bytes; at most 300 writes to one id in one UTC
 * day. A row nobody has read or written for more than 365 days is deleted by
 * the daily scheduled run (cleanIdleDesks below, called from worker/index.ts).
 *
 * VERSIONS. Each write names the version it was made from (base, 0 when the
 * browser believes nothing is stored). A write from an older version is
 * refused with 409 and the stored copy, which the browser decrypts, merges
 * with its own and sends again; the database only accepts a write whose base
 * is still the stored version, so two devices writing at once cannot overwrite
 * each other unseen. When nothing is stored, the stored version is 0, so a
 * write with any other base is answered 409 with version 0 and empty data.
 *
 * SAME ORIGIN ONLY. The answers carry no Access-Control-Allow-Origin header,
 * so another site's page cannot read them; a preflight (OPTIONS) is answered
 * 405, so another site's page cannot send a PUT or a DELETE either; and a
 * request a browser marks as coming from another site is refused with 403,
 * the rule worker/events.ts applies to the interest counts.
 *
 * THE BINDING IS OPTIONAL, AND SO IS THE TABLE. Without SCORES, or when the
 * database answers with an error (the migration has not been applied yet),
 * every route answers 503 {"error":"unavailable"} and the desk keeps working
 * in the browser alone.
 *
 * WHAT THIS CANNOT PROMISE. The route is public, like every page: anyone can
 * store a well-formed blob under an id of their own making. The size cap, the
 * daily write limit and the idle deletion bound what one id costs; they do not
 * bound how many ids there are, because nothing here knows who is asking.
 */

// The capped body reader the interest counts use: a body longer than the cap is never read whole.
import { readCapped } from "./events";
// The UTC day arithmetic the daily adding-up uses.
import { shiftDay } from "./rollup";

/** The binding this module needs. Optional, so the Worker runs without the database configured. */
export interface DeskEnv {
  /** The site's one D1 database (wrangler.jsonc: ronutz-scores), which also holds the desk_sync table. */
  SCORES?: D1Database;
}

/** Where the route starts. */
export const DESK_PREFIX = "/api/desk";

/** An id: 32 lower-case hex characters (the first half of a SHA-256 the browser computes from the sync code). */
export const DESK_ID_RE = /^[0-9a-f]{32}$/;

/** The most bytes a stored copy may decode to (96 KiB). */
export const DESK_MAX_DATA_BYTES = 98_304;

/** The most bytes a PUT body may have (the base64url of the largest copy, plus the JSON around it, with room). */
export const DESK_MAX_BODY_BYTES = 140_000;

/** The most writes to one id in one UTC day; the next is answered 429. */
export const DESK_DAILY_WRITES = 300;

/** A row neither read nor written for more than this many days is deleted by the daily scheduled run. */
export const DESK_IDLE_DAYS = 365;

/** The fewest bytes a copy can decode to: a 12-byte IV and a 16-byte AES-GCM tag, with an empty plaintext. */
const DESK_MIN_DATA_BYTES = 28;

/** base64url without padding: letters, digits, "-" and "_", at least one. */
const B64URL_RE = /^[A-Za-z0-9_-]+$/;

/** The methods the route answers. */
const ALLOW = "GET, PUT, DELETE";

/**
 * An answer: JSON (or no body for 204), never cached, and with no CORS header (the route is for this site's own pages).
 *
 * @param body the JSON body, or null for none
 * @param status the HTTP status
 * @param extra further headers
 * @returns the response
 */
function answer(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  // The headers every answer carries: never stored anywhere, and the type never guessed.
  const headers: Record<string, string> = { "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra };
  // A body, as JSON.
  if (body !== null) headers["content-type"] = "application/json; charset=utf-8";
  // The response.
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

/** The answer when the database is not bound or answers with an error: the desk then works in the browser alone. */
const UNAVAILABLE = () => answer({ error: "unavailable" }, 503);

/** The answer to a body that is too large, or data that decodes to too many bytes. */
const TOO_LARGE = () => answer({ error: "too_large" }, 413);

/**
 * The UTC day of an instant.
 *
 * @param now the instant, in milliseconds
 * @returns the day, YYYY-MM-DD
 */
export function utcDay(now: number): string {
  // The ISO form's date part is the UTC day.
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * How many bytes a base64url string without padding decodes to.
 *
 * @param s the string (already checked to hold only base64url characters)
 * @returns the byte count, or -1 when the length is not one base64url can have (a lone last character)
 */
function decodedLength(s: string): number {
  // Four characters carry three bytes; a remainder of one character carries no whole byte and cannot occur.
  return s.length % 4 === 1 ? -1 : Math.floor((s.length * 3) / 4);
}

/** A stored row, as the reads below select it. */
interface StoredRow {
  /** The stored version. */
  version: number;
  /** The stored ciphertext, base64url. */
  data: string;
  /** The UTC day of the counted writes. */
  writes_day: string;
  /** Writes counted on that day. */
  writes: number;
}

/**
 * Read one id's row.
 *
 * @param db the database
 * @param id the id
 * @returns the row, or null when nothing is stored
 */
async function readRow(db: D1Database, id: string): Promise<StoredRow | null> {
  // The four fields the write path needs, the id bound, never written into the statement.
  return db.prepare("SELECT version, data, writes_day, writes FROM desk_sync WHERE id = ?1").bind(id).first<StoredRow>();
}

/**
 * Whether a row has used up its writes for a day.
 *
 * @param row the row, or null
 * @param today the UTC day
 * @returns true when the next write must be refused
 */
function limited(row: StoredRow | null, today: string): boolean {
  // The day's count, when the counted day is today.
  return row !== null && row.writes_day === today && Number(row.writes) >= DESK_DAILY_WRITES;
}

/**
 * The 429 answer, with the seconds left until the UTC day turns.
 *
 * @param now the current instant, in milliseconds
 * @param today the UTC day
 * @returns the response
 */
function rateLimited(now: number, today: string): Response {
  // Midnight UTC of the next day.
  const next = Date.parse(`${shiftDay(today, 1)}T00:00:00Z`);
  // At least one second.
  return answer({ error: "rate_limited" }, 429, { "retry-after": String(Math.max(1, Math.ceil((next - now) / 1000))) });
}

/**
 * The 409 answer: the stored version and copy, for the browser to decrypt, merge and send again.
 *
 * @param row the stored row, or null when nothing is stored (version 0, empty data)
 * @returns the response
 */
function conflict(row: StoredRow | null): Response {
  // The stored version and data; nothing stored reads as version 0 with no data.
  return answer({ error: "conflict", version: row ? Number(row.version) : 0, data: row ? String(row.data) : "" }, 409);
}

/**
 * GET: the stored copy, and the row's last-touched day moved to today (in the same transaction).
 *
 * @param db the database
 * @param id the id
 * @param today the UTC day
 * @returns the answer
 */
async function getDesk(db: D1Database, id: string, today: string): Promise<Response> {
  // One round trip: the day refreshed (only when it changes), then the row read.
  const [, read] = await db.batch([
    db.prepare("UPDATE desk_sync SET touched_day = ?2 WHERE id = ?1 AND touched_day <> ?2").bind(id, today),
    db.prepare("SELECT version, data FROM desk_sync WHERE id = ?1").bind(id),
  ]);
  // The row, if there is one.
  const row = (read?.results?.[0] ?? null) as { version: unknown; data: unknown } | null;
  // Nothing stored under this id.
  if (!row) return answer({ error: "not_found" }, 404);
  // The copy and its version.
  return answer({ version: Number(row.version), data: String(row.data) }, 200);
}

/**
 * DELETE: the row gone, whether or not there was one.
 *
 * @param db the database
 * @param id the id
 * @returns the answer
 */
async function deleteDesk(db: D1Database, id: string): Promise<Response> {
  // Deleted outright: no tombstone, no record that it existed.
  await db.prepare("DELETE FROM desk_sync WHERE id = ?1").bind(id).run();
  // No body.
  return answer(null, 204);
}

/**
 * PUT: a new copy, accepted only when its base is the stored version and the id has writes left today.
 *
 * @param request the request
 * @param db the database (null when not bound: the body is still checked first)
 * @param id the id
 * @param now the current instant, in milliseconds
 * @returns the answer
 */
async function putDesk(request: Request, db: D1Database | undefined, id: string, now: number): Promise<Response> {
  // ---- The body: at most DESK_MAX_BODY_BYTES, JSON, two fields ---------------
  // The declared length first, so an oversized body is never read at all.
  const length = request.headers.get("content-length");
  if (length !== null && !(Number(length) <= DESK_MAX_BODY_BYTES)) return TOO_LARGE();
  // The text, read no further than the cap whatever was declared (a body may declare nothing, or lie).
  let text: string | null;
  try {
    text = await readCapped(request, DESK_MAX_BODY_BYTES);
  } catch {
    // A body that cannot be read is not JSON.
    return answer({ error: "bad_json" }, 400);
  }
  // Longer than the cap.
  if (text === null) return TOO_LARGE();
  // Parsed.
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    // Not JSON.
    return answer({ error: "bad_json" }, 400);
  }
  // An object with the two fields; anything else is refused, never repaired.
  if (body === null || typeof body !== "object" || Array.isArray(body)) return answer({ error: "bad_request" }, 400);
  const { data, base } = body as Record<string, unknown>;
  // The base: the version the browser last saw, a whole number from 0.
  if (typeof base !== "number" || !Number.isSafeInteger(base) || base < 0) return answer({ error: "bad_request" }, 400);
  // The data: base64url without padding.
  if (typeof data !== "string" || !B64URL_RE.test(data)) return answer({ error: "bad_request" }, 400);
  // What it decodes to.
  const size = decodedLength(data);
  // Not a length base64url can have.
  if (size < 0) return answer({ error: "bad_request" }, 400);
  // Larger than a copy may be.
  if (size > DESK_MAX_DATA_BYTES) return TOO_LARGE();
  // Smaller than an IV and a tag: not an encrypted copy.
  if (size < DESK_MIN_DATA_BYTES) return answer({ error: "bad_request" }, 400);

  // ---- The database ---------------------------------------------------------
  // Not bound: the desk works in the browser alone.
  if (!db) return UNAVAILABLE();
  // Today, in UTC.
  const today = utcDay(now);
  // The row as it is.
  const row = await readRow(db, id);
  // No writes left today.
  if (limited(row, today)) return rateLimited(now, today);
  // Written from a version that is not the stored one (nothing stored is version 0).
  if (base !== (row ? Number(row.version) : 0)) return conflict(row);
  // The write, conditional in the database itself, so a write that raced this one cannot be overwritten unseen.
  const result = row
    ? // An update: only while the stored version is still the base and the day's writes are not used up; the day's
      // count starts again at 1 on a new day (SQLite reads writes_day in the CASE before the SET changes it).
      await db
        .prepare(
          `UPDATE desk_sync SET data = ?2, version = version + 1, size = ?3, touched_day = ?4,
                  writes = CASE WHEN writes_day = ?4 THEN writes + 1 ELSE 1 END, writes_day = ?4
           WHERE id = ?1 AND version = ?5 AND NOT (writes_day = ?4 AND writes >= ?6)`,
        )
        .bind(id, data, size, today, base, DESK_DAILY_WRITES)
        .run()
    : // An insert: only while nothing is stored under the id.
      await db
        .prepare(
          `INSERT INTO desk_sync (id, data, version, size, touched_day, writes_day, writes)
           VALUES (?1, ?2, 1, ?3, ?4, ?4, 1) ON CONFLICT(id) DO NOTHING`,
        )
        .bind(id, data, size, today)
        .run();
  // Written: the new version.
  if ((result.meta?.changes ?? 0) === 1) return answer({ version: base + 1 }, 200);
  // Another write got there first: the row as it is now decides the answer.
  const now2 = await readRow(db, id);
  // That write used the day's last one.
  if (limited(now2, today)) return rateLimited(now, today);
  // Otherwise the browser merges with what is stored now and tries again.
  return conflict(now2);
}

/**
 * Answer /api/desk/<id>, or return null for any other address so the Worker goes on to its other routes.
 *
 * @param request the request
 * @param url its parsed address
 * @param env the Worker's bindings
 * @param now the current instant in milliseconds (a parameter so the build's check can move the day)
 * @returns the answer, or null when the address is not this route's
 */
export async function handleDesk(request: Request, url: URL, env: DeskEnv, now: number = Date.now()): Promise<Response | null> {
  // Not this route.
  if (url.pathname !== DESK_PREFIX && !url.pathname.startsWith(`${DESK_PREFIX}/`)) return null;
  // Three methods; anything else (a preflight included, so another site's page cannot write) is refused.
  const method = request.method;
  if (method !== "GET" && method !== "PUT" && method !== "DELETE") return answer({ error: "method_not_allowed" }, 405, { allow: ALLOW });
  // ---- Same site only -------------------------------------------------------
  // A browser says where a request came from; a request another site's page made is refused (as worker/events.ts
  // does). A request typed into the address bar ("none") or sent from outside a browser carries no such claim.
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site" || site === "same-site") return answer({ error: "forbidden" }, 403);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return answer({ error: "forbidden" }, 403);
  // ---- The id ---------------------------------------------------------------
  // What follows the prefix, one trailing slash tolerated.
  const id = url.pathname.slice(DESK_PREFIX.length + 1).replace(/\/$/, "");
  // 32 lower-case hex characters, nothing else.
  if (!DESK_ID_RE.test(id)) return answer({ error: "bad_id" }, 400);
  // ---- The work ---------------------------------------------------------------
  // The database's own error text (a missing table, an outage) is never passed on: it is "unavailable".
  try {
    // A write checks its body before it needs the database.
    if (method === "PUT") return await putDesk(request, env.SCORES, id, now);
    // The reads and the delete need the database.
    const db = env.SCORES;
    if (!db) return UNAVAILABLE();
    // Each method.
    if (method === "GET") return await getDesk(db, id, utcDay(now));
    return await deleteDesk(db, id);
  } catch {
    // The table is not there yet, or the database failed: the desk keeps working in the browser.
    return UNAVAILABLE();
  }
}

/**
 * THE DAILY CLEAN-UP: delete every row neither read nor written for more than DESK_IDLE_DAYS days. Run by the
 * Worker's scheduled handler (worker/index.ts) once a day. Logs nothing; a failure (no table yet) is the caller's to
 * swallow, and the next night tries again.
 *
 * @param env the Worker's bindings
 * @param now the current instant, in milliseconds
 * @returns how many rows were deleted (0 without the database)
 */
export async function cleanIdleDesks(env: DeskEnv, now: number): Promise<number> {
  // No database, nothing to clean.
  const db = env.SCORES;
  if (!db) return 0;
  // The oldest day a row may have been touched and still be kept: a row touched before it is idle for more than
  // DESK_IDLE_DAYS days.
  const cutoff = shiftDay(utcDay(now), -DESK_IDLE_DAYS);
  // Deleted, the day bound (the index on touched_day keeps this from reading the stored copies).
  const res = await db.prepare("DELETE FROM desk_sync WHERE touched_day < ?1").bind(cutoff).run();
  // How many went.
  return res.meta?.changes ?? 0;
}
