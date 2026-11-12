// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-desk-sync.mts
// ----------------------------------------------------------------------------
// PRE-BUILD GUARD (12/11/2026): the desk's optional encrypted sync keeps the
// contract the desk's page and the Privacy page are written against. This
// guard runs the Worker's own code (worker/desk.ts, and worker/index.ts for
// the wiring) against a stand-in for Cloudflare D1 built on an in-memory
// SQLite database (node:sqlite), into which the real migration
// (migrations/0003_desk_sync.sql) is applied, so the SQL the Worker sends is
// run for real. No network, no secrets. It fails the build when any of these
// stops being true:
//
//   1. the table: exactly the seven columns of the contract, no row number,
//      the migration safe to apply twice;
//   2. the routes: GET, PUT and DELETE /api/desk/<id> only, every other
//      method 405 (a preflight included, ahead of the Worker's open CORS);
//      an id that is not 32 lower-case hex characters 400 bad_id; a request
//      another site made 403; every answer never cached and never readable by
//      another site (no Access-Control-Allow-Origin);
//   3. the versions: a first write from base 0 is version 1, each accepted
//      write adds one, a write from any other base is 409 with the stored
//      version and copy (version 0 and no data when nothing is stored), and a
//      write that loses a race in the database is 409 too;
//   4. the limits: a body over 140,000 bytes or data over 98,304 bytes 413
//      (whether or not the body declared its length), bad JSON 400, the 301st
//      write to one id in a UTC day 429 until the day turns;
//   5. what is kept: a read moves the row's last-touched day, a delete leaves
//      nothing, values are bound and never written into SQL text, and the
//      handler writes no log line;
//   6. the database missing: no binding, or no table yet, is 503 unavailable;
//   7. the idle clean-up: rows untouched for more than 365 days are deleted,
//      the 365th day kept, by cleanIdleDesks and by the Worker's daily
//      scheduled run.
// Prints what it checked.
// ============================================================================

// File reading, for the migration.
import { readFileSync } from "node:fs";
// The real SQL engine under the stand-in (Node's built-in SQLite).
import { DatabaseSync } from "node:sqlite";
// Random bytes, to make stand-in ciphertexts.
import { randomBytes } from "node:crypto";
// The route, its limits and the clean-up.
import { DESK_DAILY_WRITES, DESK_MAX_BODY_BYTES, DESK_MAX_DATA_BYTES, cleanIdleDesks, handleDesk, utcDay } from "../worker/desk";
// The Worker itself, to check the wiring (the route before the open preflight, the clean-up in the scheduled run).
import worker from "../worker/index";
// The day arithmetic.
import { shiftDay } from "../worker/rollup";

/** The guard's name in its output. */
const TAG = "[check-desk-sync]";
/** What went wrong. */
const errors: string[] = [];
/** How many things were checked. */
let checks = 0;

/**
 * Record one check.
 *
 * @param ok whether it held
 * @param what the promise checked, in words
 */
function check(ok: boolean, what: string): void {
  // Counted.
  checks += 1;
  // Kept when it failed.
  if (!ok) errors.push(what);
}

// ---- The stand-in for D1 ---------------------------------------------------------
/** One statement as the stand-in ran it: its text and its bound values. */
interface Ran {
  /** The SQL text. */
  sql: string;
  /** The bound values. */
  values: unknown[];
}

/** A statement, shaped like D1's: bind() returns a bound copy; first(), all() and run() execute it. */
class FakeStatement {
  /**
   * @param db the stand-in database that runs it
   * @param sql the SQL text
   * @param values the bound values
   */
  constructor(private readonly db: FakeD1, readonly sql: string, readonly values: unknown[] = []) {}
  /** A copy with these values bound (D1's ?1, ?2 ... are positional). */
  bind(...values: unknown[]): FakeStatement {
    // A new statement: D1's bind does not change the prepared one.
    return new FakeStatement(this.db, this.sql, values);
  }
  /** Every row. */
  async all(): Promise<{ results: Record<string, unknown>[]; success: boolean; meta: { changes: number } }> {
    // Run now.
    return this.db.execute(this);
  }
  /** Run, with the count of changed rows in meta. */
  async run(): Promise<{ results: Record<string, unknown>[]; success: boolean; meta: { changes: number } }> {
    // Run now.
    return this.db.execute(this);
  }
  /** The first row, or null. */
  async first<T>(): Promise<T | null> {
    // The first row of the result.
    return (this.db.execute(this).results[0] ?? null) as T | null;
  }
}

/** A stand-in for a D1 database, on an in-memory SQLite database. */
class FakeD1 {
  /** The SQLite database. */
  readonly sqlite = new DatabaseSync(":memory:");
  /** Every statement run, in order. */
  readonly ran: Ran[] = [];
  /** Called before a statement runs (to play another device's write landing in between). */
  beforeRun: ((sql: string) => void) | null = null;
  /**
   * @param migrated whether the real migration is applied (false plays a database where it has not been yet)
   */
  constructor(migrated: boolean) {
    // The migration, as wrangler would apply it.
    if (migrated) this.sqlite.exec(MIGRATION);
  }
  /** A statement, prepared lazily as D1 does: a missing table is an error when it runs, not when it is prepared. */
  prepare(sql: string): FakeStatement {
    // Not run yet.
    return new FakeStatement(this, sql);
  }
  /**
   * Run one statement.
   *
   * @param st the statement
   * @returns D1's result shape
   */
  execute(st: FakeStatement): { results: Record<string, unknown>[]; success: boolean; meta: { changes: number } } {
    // The hook first.
    this.beforeRun?.(st.sql);
    // Logged.
    this.ran.push({ sql: st.sql, values: st.values });
    // Prepared now (a missing table throws here, as D1 throws on run).
    const prepared = this.sqlite.prepare(st.sql);
    // The values as SQLite takes them.
    const values = st.values as Array<string | number | null>;
    // A read (or a write that returns rows): its rows.
    if (/^\s*SELECT\b/i.test(st.sql) || /\bRETURNING\b/i.test(st.sql)) return { results: prepared.all(...values) as Record<string, unknown>[], success: true, meta: { changes: 0 } };
    // A write: its count of changed rows.
    const r = prepared.run(...values);
    // As D1 reports it.
    return { results: [], success: true, meta: { changes: Number(r.changes) } };
  }
  /** Several statements as one transaction, as D1's batch runs them. */
  async batch(list: FakeStatement[]): Promise<Array<{ results: Record<string, unknown>[]; success: boolean; meta: { changes: number } }>> {
    // All or nothing.
    this.sqlite.exec("BEGIN");
    try {
      // Each in order.
      const out = list.map((st) => this.execute(st));
      // Kept.
      this.sqlite.exec("COMMIT");
      return out;
    } catch (err) {
      // Undone.
      this.sqlite.exec("ROLLBACK");
      throw err;
    }
  }
  /** One stored row, read directly (not through the Worker). */
  row(id: string): Record<string, unknown> | undefined {
    // Every column.
    return this.sqlite.prepare("SELECT * FROM desk_sync WHERE id = ?1").get(id) as Record<string, unknown> | undefined;
  }
}

/** The real migration, as written. */
const MIGRATION = readFileSync("migrations/0003_desk_sync.sql", "utf8");

// ---- Helpers -----------------------------------------------------------------------
/** The moment the checks run at: 12 November 2026, 15:00 UTC. */
const NOW = Date.UTC(2026, 10, 12, 15, 0, 0);
/** Its UTC day. */
const TODAY = utcDay(NOW);
/** One day in milliseconds. */
const DAY_MS = 86_400_000;
/** The site's origin. */
const ORIGIN = "https://ronutz.com";
/** A browser's headers for a request from the site's own page. */
const SAME = { "sec-fetch-site": "same-origin", origin: ORIGIN };

/**
 * An id as the browser makes them: 32 lower-case hex characters.
 *
 * @returns a fresh id
 */
const newId = (): string => randomBytes(16).toString("hex");

/**
 * A stand-in ciphertext: base64url, no padding, of this many random bytes.
 *
 * @param bytes how many bytes it decodes to
 * @returns the string
 */
const blob = (bytes: number): string => randomBytes(bytes).toString("base64url");

/** What a call answered. */
interface Answer {
  /** The status. */
  status: number;
  /** The headers. */
  headers: Headers;
  /** The body parsed as JSON, or null when there is none. */
  json: Record<string, unknown> | null;
}

/**
 * Call the route.
 *
 * @param method the HTTP method
 * @param path the path after the origin
 * @param opts the body, extra headers, the bindings and the moment
 * @returns what was answered (or null when the handler said the address is not its)
 */
async function call(method: string, path: string, opts: { body?: string; headers?: Record<string, string>; env?: { SCORES?: unknown }; now?: number } = {}): Promise<Answer | null> {
  // The request, as the browser sends it.
  const req = new Request(`${ORIGIN}${path}`, { method, headers: { ...SAME, ...(opts.body !== undefined ? { "content-type": "application/json" } : {}), ...(opts.headers ?? {}) }, body: opts.body });
  // Answered.
  const res = await handleDesk(req, new URL(req.url), (opts.env ?? {}) as never, opts.now ?? NOW);
  // Not the route's.
  if (!res) return null;
  // The body's text.
  const text = await res.text();
  // Parsed when there is one.
  return { status: res.status, headers: res.headers, json: text ? (JSON.parse(text) as Record<string, unknown>) : null };
}

/**
 * Write a copy.
 *
 * @param env the bindings
 * @param id the id
 * @param data the copy
 * @param base the version the write is made from
 * @param now the moment
 * @returns what was answered
 */
async function put(env: { SCORES?: unknown }, id: string, data: string, base: number, now = NOW): Promise<Answer> {
  // The body the desk's page sends.
  return (await call("PUT", `/api/desk/${id}`, { env, body: JSON.stringify({ data, base }), now })) as Answer;
}

/** Every answer seen, to check the headers they all must carry. */
const answers: Array<{ what: string; a: Answer }> = [];

/**
 * Keep an answer for the header checks, and return it.
 *
 * @param what which call it was
 * @param a the answer
 * @returns the answer
 */
function seen(what: string, a: Answer | null): Answer {
  // Kept (a missing answer is a failure of its own).
  if (a) answers.push({ what, a });
  // Returned for the caller's checks.
  return a ?? { status: 0, headers: new Headers(), json: null };
}

// ---- No log lines: every console method counted while the Worker's code runs ----------
/** The console methods replaced, and their originals. */
const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug", "trace"] as const;
/** The originals, restored before the verdict. */
const originals = CONSOLE_METHODS.map((m) => console[m]);
/** How many log lines the Worker's code wrote. */
let logged = 0;
// Each method replaced by a counter.
for (const m of CONSOLE_METHODS) (console as unknown as Record<string, () => void>)[m] = () => { logged += 1; };

// ---- 1. The table ---------------------------------------------------------------------
{
  // A database with the migration applied twice: the second must change nothing and fail on nothing.
  const db = new FakeD1(true);
  let twice = true;
  try { db.sqlite.exec(MIGRATION); } catch { twice = false; }
  check(twice, "the migration can be applied twice (CREATE ... IF NOT EXISTS)");
  // The columns, in order.
  const cols = (db.sqlite.prepare("PRAGMA table_info(desk_sync)").all() as Array<{ name: string }>).map((c) => c.name);
  check(JSON.stringify(cols) === JSON.stringify(["id", "data", "version", "size", "touched_day", "writes_day", "writes"]), "the table has exactly the contract's seven columns");
  // No row number: the table is WITHOUT ROWID.
  const sql = String((db.sqlite.prepare("SELECT sql FROM sqlite_master WHERE name = 'desk_sync'").get() as { sql?: string } | undefined)?.sql ?? "");
  check(/WITHOUT ROWID/i.test(sql), "the table keeps no row number (WITHOUT ROWID)");
  // The idle clean-up's index.
  check(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'desk_sync_touched'").get() !== undefined, "the idle clean-up reads an index on touched_day");
}

// ---- 2. The routes ------------------------------------------------------------------------
{
  // A migrated database.
  const db = new FakeD1(true);
  const env = { SCORES: db };
  // Other addresses are not the route's.
  for (const path of ["/api/e", "/api/deskx", "/api/v1/fun/board", "/en/desk/", "/api/stats/interest"]) {
    check((await call("GET", path, { env })) === null, `${path} is not the desk route`);
  }
  // A bad id, in every shape.
  const good = newId();
  for (const path of ["/api/desk", "/api/desk/", "/api/desk/xyz", `/api/desk/${good.toUpperCase()}`, `/api/desk/${good.slice(1)}`, `/api/desk/${good}0`, `/api/desk/${good}/x`, `/api/desk/${"g".repeat(32)}`]) {
    const a = seen(`GET ${path}`, await call("GET", path, { env }));
    check(a.status === 400 && a.json?.error === "bad_id", `GET ${path} is 400 bad_id`);
  }
  // A trailing slash after a good id is tolerated.
  check(seen("GET id/", await call("GET", `/api/desk/${good}/`, { env })).status === 404, "a good id with a trailing slash is read like the id");
  // Any other method, a preflight included.
  for (const method of ["POST", "PATCH", "OPTIONS", "HEAD"]) {
    const a = seen(method, await call(method, `/api/desk/${good}`, { env }));
    check(a.status === 405 && a.headers.get("allow") === "GET, PUT, DELETE", `${method} is 405 with Allow: GET, PUT, DELETE`);
  }
  // A request another site's page made.
  check(seen("cross-site", await call("GET", `/api/desk/${good}`, { env, headers: { "sec-fetch-site": "cross-site" } })).status === 403, "a request another site made is refused");
  check(seen("other origin", await call("PUT", `/api/desk/${good}`, { env, headers: { origin: "https://elsewhere.example" }, body: JSON.stringify({ data: blob(64), base: 0 }) })).status === 403, "a write from another origin is refused");
  check(db.row(good) === undefined, "a refused write stores nothing");
  // Unknown: 404 not_found.
  const a404 = seen("GET unknown", await call("GET", `/api/desk/${good}`, { env }));
  check(a404.status === 404 && a404.json?.error === "not_found", "GET of an id with nothing stored is 404 not_found");
  // Through the Worker: the desk's preflight is 405, ahead of the open CORS preflight every other /api route gets.
  const viaWorker = await worker.fetch(new Request(`${ORIGIN}/api/desk/${good}`, { method: "OPTIONS", headers: { origin: "https://elsewhere.example", "access-control-request-method": "PUT" } }), env as never);
  check(viaWorker.status === 405 && viaWorker.headers.get("access-control-allow-origin") === null, "through the Worker, a preflight to the desk is 405 with no CORS header");
  // Through the Worker: a read reaches the route.
  const viaWorkerGet = await worker.fetch(new Request(`${ORIGIN}/api/desk/${good}`, { headers: SAME }), env as never);
  check(viaWorkerGet.status === 404 && viaWorkerGet.headers.get("cache-control") === "no-store", "through the Worker, GET /api/desk/<id> reaches the route");
}

// ---- 3. The versions -------------------------------------------------------------------------
{
  // A migrated database.
  const db = new FakeD1(true);
  const env = { SCORES: db };
  // One id, three copies.
  const id = newId();
  const [d1, d2, d3] = [blob(200), blob(300), blob(400)];
  // The first write.
  const w1 = seen("PUT base 0", await put(env, id, d1, 0));
  check(w1.status === 200 && JSON.stringify(w1.json) === JSON.stringify({ version: 1 }), "a first write from base 0 is 200 {version: 1}");
  // Read back.
  const r1 = seen("GET v1", await call("GET", `/api/desk/${id}`, { env }));
  check(r1.status === 200 && JSON.stringify(r1.json) === JSON.stringify({ version: 1, data: d1 }), "GET answers {version, data} exactly as stored");
  // The next write, from the stored version.
  const w2 = seen("PUT base 1", await put(env, id, d2, 1));
  check(w2.status === 200 && w2.json?.version === 2, "a write from the stored version is 200 with the next version");
  // A write from an old version.
  const w3 = seen("PUT base 1 again", await put(env, id, d3, 1));
  check(w3.status === 409 && JSON.stringify(w3.json) === JSON.stringify({ error: "conflict", version: 2, data: d2 }), "a write from an old version is 409 with the stored version and copy");
  // A write that believes nothing is stored.
  const w4 = seen("PUT base 0 over v2", await put(env, id, d3, 0));
  check(w4.status === 409 && w4.json?.version === 2 && w4.json?.data === d2, "a write from base 0 over a stored copy is 409");
  // A refused write changed nothing.
  check(db.row(id)?.data === d2 && db.row(id)?.version === 2, "a refused write leaves the stored copy as it was");
  // The row's fields: the size decoded, today's day twice, two writes counted.
  const row = db.row(id);
  check(row?.size === 300 && row?.touched_day === TODAY && row?.writes_day === TODAY && row?.writes === 2, "a row holds the copy's size, the day it was touched and the day's write count");
  // Nothing stored, a base other than 0.
  const other = newId();
  const w5 = seen("PUT base 3 nothing stored", await put(env, other, d1, 3));
  check(w5.status === 409 && JSON.stringify(w5.json) === JSON.stringify({ error: "conflict", version: 0, data: "" }), "a write from base 3 when nothing is stored is 409 {version: 0, data: \"\"}");
  // A race lost in the database: another device's write lands between the read and the update.
  const raced = newId();
  await put(env, raced, d1, 0);
  db.beforeRun = (sql) => {
    // Only once, just before the Worker's update.
    if (!sql.startsWith("UPDATE desk_sync SET data")) return;
    db.beforeRun = null;
    db.sqlite.prepare("UPDATE desk_sync SET data = ?1, version = 2 WHERE id = ?2").run(d3, raced);
  };
  const w6 = seen("PUT race update", await put(env, raced, d2, 1));
  check(w6.status === 409 && w6.json?.version === 2 && w6.json?.data === d3, "a write that loses a race to another device's update is 409 with the winner's copy");
  // The same for a first write: another device creates the row between the read and the insert.
  const created = newId();
  db.beforeRun = (sql) => {
    // Only once, just before the Worker's insert.
    if (!sql.startsWith("INSERT INTO desk_sync")) return;
    db.beforeRun = null;
    db.sqlite.prepare("INSERT INTO desk_sync (id, data, version, size, touched_day, writes_day, writes) VALUES (?1, ?2, 1, 30, ?3, ?3, 1)").run(created, d3, TODAY);
  };
  const w7 = seen("PUT race insert", await put(env, created, d1, 0));
  check(w7.status === 409 && w7.json?.version === 1 && w7.json?.data === d3, "a first write that loses a race to another device's first write is 409");
  // Delete: 204, nothing left, and 204 again when nothing is stored.
  const del = seen("DELETE", await call("DELETE", `/api/desk/${id}`, { env }));
  check(del.status === 204 && del.json === null && db.row(id) === undefined, "DELETE is 204 with no body and leaves nothing");
  check(seen("DELETE again", await call("DELETE", `/api/desk/${id}`, { env })).status === 204, "DELETE of an id with nothing stored is 204");
  check(seen("GET deleted", await call("GET", `/api/desk/${id}`, { env })).status === 404, "a deleted copy is 404");
  // Values are bound, never written into SQL text: no statement's text holds an id or a copy.
  check(db.ran.length > 0 && db.ran.every((r) => ![id, other, raced, created, d1, d2, d3].some((v) => r.sql.includes(v))), "every id and copy is bound, never written into SQL text");
}

// ---- 4. The limits -----------------------------------------------------------------------------
{
  // A migrated database.
  const db = new FakeD1(true);
  const env = { SCORES: db };
  // The largest copy is accepted; one byte more is not.
  const big = newId();
  const atCap = seen("PUT at cap", await put(env, big, blob(DESK_MAX_DATA_BYTES), 0));
  check(atCap.status === 200, `data of exactly ${DESK_MAX_DATA_BYTES} bytes is accepted`);
  const overCap = seen("PUT over cap", await put(env, big, blob(DESK_MAX_DATA_BYTES + 1), 1));
  check(overCap.status === 413 && overCap.json?.error === "too_large", `data of ${DESK_MAX_DATA_BYTES + 1} bytes is 413 too_large`);
  // A body over the cap with no declared length: the read stops at the cap.
  const id = newId();
  const long = seen("PUT long body", await call("PUT", `/api/desk/${id}`, { env, body: JSON.stringify({ data: blob(64), base: 0, pad: "x".repeat(DESK_MAX_BODY_BYTES) }) }));
  check(long.status === 413 && long.json?.error === "too_large" && db.row(id) === undefined, `a body over ${DESK_MAX_BODY_BYTES} bytes with no declared length is 413`);
  // A declared length over the cap: refused without reading.
  const declared = seen("PUT declared", await call("PUT", `/api/desk/${id}`, { env, body: JSON.stringify({ data: blob(64), base: 0 }), headers: { "content-length": String(DESK_MAX_BODY_BYTES + 1) } }));
  check(declared.status === 413, "a declared length over the cap is 413");
  // Not JSON.
  const notJson = seen("PUT not json", await call("PUT", `/api/desk/${id}`, { env, body: "not json" }));
  check(notJson.status === 400 && notJson.json?.error === "bad_json", "a body that is not JSON is 400 bad_json");
  // JSON of the wrong shape, each refused and nothing stored.
  for (const [body, why] of [
    ["[]", "an array"], ["null", "null"], [JSON.stringify({ data: blob(64) }), "no base"], [JSON.stringify({ data: blob(64), base: -1 }), "a negative base"],
    [JSON.stringify({ data: blob(64), base: 1.5 }), "a base that is not whole"], [JSON.stringify({ data: blob(64), base: "0" }), "a base as text"],
    [JSON.stringify({ base: 0 }), "no data"], [JSON.stringify({ data: randomBytes(64).toString("base64"), base: 0 }), "data with base64 padding or + and /"],
    [JSON.stringify({ data: "A".repeat(41), base: 0 }), "data of a length base64url cannot have"], [JSON.stringify({ data: blob(27), base: 0 }), "data shorter than an IV and a tag"],
    [JSON.stringify({ data: "", base: 0 }), "empty data"],
  ] as const) {
    const a = seen(`PUT ${why}`, await call("PUT", `/api/desk/${id}`, { env, body }));
    check(a.status === 400 && a.json?.error === "bad_request" && db.row(id) === undefined, `${why} is 400 bad_request`);
  }
  // The daily write limit: DESK_DAILY_WRITES writes to one id in a day are accepted, the next one is not.
  const busy = newId();
  let version = 0;
  let allOk = true;
  for (let i = 0; i < DESK_DAILY_WRITES; i++) {
    // Each write from the version the last one made.
    const a = await put(env, busy, blob(40), version);
    if (a.status !== 200) allOk = false;
    version = Number(a.json?.version ?? version);
  }
  check(allOk && version === DESK_DAILY_WRITES, `${DESK_DAILY_WRITES} writes to one id in one UTC day are accepted`);
  const limited = seen("PUT over limit", await put(env, busy, blob(40), version));
  check(limited.status === 429 && limited.json?.error === "rate_limited", `write ${DESK_DAILY_WRITES + 1} in one UTC day is 429 rate_limited`);
  // The answer says when the day turns: 15:00 UTC to midnight is nine hours.
  check(limited.headers.get("retry-after") === String(9 * 3600), "the 429 says how many seconds are left until the UTC day turns");
  check(db.row(busy)?.version === DESK_DAILY_WRITES, "a refused write over the limit stores nothing");
  // The next UTC day, the count starts again.
  const tomorrow = seen("PUT next day", await put(env, busy, blob(40), version, NOW + DAY_MS));
  check(tomorrow.status === 200 && db.row(busy)?.writes === 1 && db.row(busy)?.writes_day === shiftDay(TODAY, 1), "on the next UTC day the write count starts again at 1");
}

// ---- 5. What is kept, and when -----------------------------------------------------------------
{
  // A migrated database.
  const db = new FakeD1(true);
  const env = { SCORES: db };
  // Written today, read ten days later.
  const id = newId();
  await put(env, id, blob(64), 0);
  const later = NOW + 10 * DAY_MS;
  const r = seen("GET ten days later", await call("GET", `/api/desk/${id}`, { env, now: later }));
  check(r.status === 200 && db.row(id)?.touched_day === utcDay(later) && db.row(id)?.writes_day === TODAY, "a read moves the row's last-touched day and nothing else");
}

// ---- 6. The database missing ----------------------------------------------------------------------
{
  // No binding at all, and a database without the table.
  for (const [env, why] of [[{}, "no database bound"], [{ SCORES: new FakeD1(false) }, "no table yet"]] as const) {
    const id = newId();
    for (const [method, body] of [["GET", undefined], ["PUT", JSON.stringify({ data: blob(64), base: 0 })], ["DELETE", undefined]] as const) {
      const a = seen(`${method} ${why}`, await call(method, `/api/desk/${id}`, { env, body }));
      check(a.status === 503 && a.json?.error === "unavailable", `${method} with ${why} is 503 unavailable`);
    }
  }
}

// ---- Every answer: never cached, never readable by another site, JSON unless 204 ------------------
check(answers.length > 0 && answers.every(({ a }) => a.headers.get("cache-control") === "no-store"), "every answer is Cache-Control: no-store");
check(answers.every(({ a }) => a.headers.get("access-control-allow-origin") === null), "no answer carries Access-Control-Allow-Origin (same origin only)");
check(answers.every(({ a }) => a.status === 204 || (a.headers.get("content-type") ?? "").startsWith("application/json")), "every answer but 204 is JSON");

// ---- 7. The idle clean-up ---------------------------------------------------------------------------
{
  // A migrated database with rows touched 366, 365 and 1 days ago.
  const db = new FakeD1(true);
  const insert = db.sqlite.prepare("INSERT INTO desk_sync (id, data, version, size, touched_day, writes_day, writes) VALUES (?1, 'AAAA', 1, 3, ?2, ?2, 1)");
  const [old, edge, fresh] = [newId(), newId(), newId()];
  insert.run(old, shiftDay(TODAY, -366));
  insert.run(edge, shiftDay(TODAY, -365));
  insert.run(fresh, shiftDay(TODAY, -1));
  // Cleaned.
  const gone = await cleanIdleDesks({ SCORES: db as never }, NOW);
  check(gone === 1 && db.row(old) === undefined && db.row(edge) !== undefined && db.row(fresh) !== undefined, "rows idle for more than 365 days are deleted; the 365th day is kept");
  // No database: nothing to do, no failure.
  check((await cleanIdleDesks({}, NOW)) === 0, "the clean-up without a database does nothing");
  // Through the Worker's daily scheduled run (its adding-up fails here for want of credentials, and is swallowed).
  const older = newId();
  insert.run(older, shiftDay(TODAY, -400));
  const pending: Promise<unknown>[] = [];
  await worker.scheduled({}, { SCORES: db } as never, { waitUntil: (p: Promise<unknown>) => { pending.push(p); }, passThroughOnException: () => undefined } as never);
  await Promise.all(pending);
  check(db.row(older) === undefined && db.row(edge) !== undefined, "the Worker's daily scheduled run deletes idle rows");
  // A database without the table: the scheduled run swallows the failure.
  let threw = false;
  const pending2: Promise<unknown>[] = [];
  try {
    await worker.scheduled({}, { SCORES: new FakeD1(false) } as never, { waitUntil: (p: Promise<unknown>) => { pending2.push(p); }, passThroughOnException: () => undefined } as never);
    await Promise.all(pending2);
  } catch {
    threw = true;
  }
  check(!threw, "the scheduled run survives a database without the table");
}

// ---- No log line ----------------------------------------------------------------------------------------
// The console back.
CONSOLE_METHODS.forEach((m, i) => { (console as unknown as Record<string, unknown>)[m] = originals[i]; });
check(logged === 0, "the route and the clean-up write no log line");

// ---- The verdict -------------------------------------------------------------------------------------------
if (errors.length > 0) {
  // Each broken promise, named.
  console.error(`${TAG} FAIL: ${errors.length} of ${checks} check(s) on the desk's sync did not hold:`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error("  The desk's page (src/lib/desk/) and the Privacy page are written against this contract. Fix worker/desk.ts, or change the contract, the page and the Privacy text together.");
  process.exit(1);
}
// What was checked.
console.log(`${TAG} OK: ${checks} checks: the table (seven columns, no row number), the routes (GET, PUT, DELETE only; bad ids, other methods and other sites refused; never cached, same origin only), the versions (409 with the stored copy, races included), the limits (${DESK_MAX_BODY_BYTES}-byte body, ${DESK_MAX_DATA_BYTES}-byte copy, ${DESK_DAILY_WRITES} writes a day), 503 without the database or its table, and the idle clean-up after 365 days, with no log line.`);
