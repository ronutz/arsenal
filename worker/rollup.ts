/**
 * worker/rollup.ts
 *
 * THE DAILY ADDING-UP (PRIME 12/11/2026 02:35). The counting store, Cloudflare's
 * Workers Analytics Engine, keeps a row for three months. To see how interest
 * moves over a year, the Worker adds each finished UTC day up ONCE and keeps
 * the day's totals in D1 (migrations/0002_daily_rollups.sql): pages served to
 * people per address, the interest counts per kind and item, and a handful of
 * whole-site figures. It runs on a schedule (wrangler.jsonc, triggers.crons),
 * and the operator can run it for a chosen day through /api/stats/rollup.
 *
 * WHAT IT READS AND WRITES. Sums in, sums out. Each query below groups the
 * day's rows by what they are ABOUT (an address, a kind and an item, a class
 * of client, a referring host) and never by anything about a reader, because
 * the rows hold nothing about one (worker/analytics.ts, worker/events.ts). The
 * three tables it writes are as apart as the datasets they come from: nothing
 * in daily_pages can be matched to anything in daily_events.
 *
 * A DAY IS REPLACED WHOLE. Adding a day up again deletes that day's rows and
 * writes the new sums in one D1 batch (a transaction), so a second run cannot
 * double anything and a failed run leaves the previous sums in place.
 *
 * THE SCOREBOARD'S DAY (the site owner, 12/11/2026 17:06 to 17:09). Two
 * figures come from the games' own table in the same database rather than
 * from the counting store: fun_rounds, the rounds published that puzzle day,
 * and fun_browsers, how many browsers published at least one (the sum of the
 * yes-or-no each browser's first round of the day carries; migrations/0004).
 * The board keeps its rows for 400 days; these sums keep the trend after
 * that. A day before the board's first kept row has no fun_rounds, and a day
 * before the first round that carried the yes has no fun_browsers: "no
 * data", never a zero.
 *
 * RETENTION. Rows older than KEEP_DAYS are deleted by the same job. 760 days
 * is about 25 months, the longest the French regulator's guidance on audience
 * measurement suggests keeping such figures (CNIL, read 2026-11-12), and
 * enough to compare a month with the same month a year and two years before.
 */

// The SQL API call, the dataset names and the filters every people panel uses, so the totals here match the page's.
import { PAGEVIEWS, PEOPLE, REFERRERS, SERVED, MISSING, REFERRER_SINCE, query, type StatsEnv } from "./stats";
// The family of a referring host (search, ai, social, other), derived from the host as the stats page derives it.
import { classifyReferrer } from "./analytics";
// The languages an address can start with, to split an address into language and section.
import { LOCALE_CODES } from "../src/i18n/locales";
// The kinds an interest count can have: only these are kept in the daily totals.
import { INTEREST_KINDS } from "../src/lib/interest/shape";

/** The interest counts' dataset (worker/events.ts writes it; wrangler.jsonc names it). */
export const EVENTS = "ronutz_events";

/** How long a day's totals are kept, in days (about 25 months). */
export const KEEP_DAYS = 760;

/** The most addresses added up for one day; a day that reaches it says so in its "cut" figure. */
const PAGES_LIMIT = 30000;
/** The most interest-count combinations added up for one day. */
const EVENTS_LIMIT = 30000;
/** How many rows travel in one D1 statement (as one JSON array, far under D1's size limits). */
const CHUNK = 1500;

/** What the adding-up needs: the SQL API's credentials (StatsEnv) and the D1 database. */
export interface RollupEnv extends StatsEnv {
  /** The D1 database the totals are kept in (the scoreboard's; absent on a deployment without it). */
  SCORES?: D1Database;
}

/** What one run reports. */
export interface RollupReport {
  /** The day added up, YYYY-MM-DD (UTC). */
  day: string;
  /** Addresses written. */
  pages: number;
  /** Interest-count combinations written. */
  events: number;
  /** Whether the addresses reached PAGES_LIMIT (the day's page sums are then the most-read part only). */
  cut: boolean;
}

/** A UTC day as YYYY-MM-DD, checked before it goes anywhere near SQL. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The UTC day `offset` days from a given day.
 *
 * @param day a day, YYYY-MM-DD
 * @param offset days to add (negative for earlier)
 * @returns the other day, YYYY-MM-DD
 */
export function shiftDay(day: string, offset: number): string {
  // Midnight UTC of the day, moved, back to its date part.
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
}

/**
 * Yesterday in UTC, the newest day that is over.
 *
 * @param now the current time in milliseconds
 * @returns the day, YYYY-MM-DD
 */
export function lastFullDay(now: number): string {
  // Today's date part, one day back.
  return shiftDay(new Date(now).toISOString().slice(0, 10), -1);
}

/**
 * Split an address into its language and its section, as the trend panels group them.
 *
 * @param path an address as counted ("/en/tools/cidr/")
 * @returns the language ("" when the address has none) and the section ("home" for a language's front page)
 */
export function sectionOf(path: string): { locale: string; section: string } {
  // The address's parts.
  const parts = path.split("/").filter(Boolean);
  // A language first, when the first part is one the site knows.
  const locale = parts.length > 0 && LOCALE_CODES.includes(parts[0]) ? parts[0] : "";
  // What follows the language.
  const rest = locale ? parts.slice(1) : parts;
  // A language's front page.
  if (rest.length === 0) return { locale, section: "home" };
  // The puzzles (/dev/fun/) and the arcade (/arcade/) are one section, as the site presents them.
  if ((rest[0] === "dev" && rest[1] === "fun") || rest[0] === "arcade") return { locale, section: "fun" };
  // Everything else by its first part, capped so a strange address cannot write a long section name.
  return { locale, section: rest[0].slice(0, 40) };
}

/**
 * Add one finished UTC day up and replace its totals in D1.
 *
 * @param env the Worker's bindings (the SQL API's credentials and the database)
 * @param day the day, YYYY-MM-DD (UTC)
 * @param now the current time in milliseconds (the "rolled" stamp)
 * @returns what was written
 */
export async function rollupDay(env: RollupEnv, day: string, now: number): Promise<RollupReport> {
  // A real day only: the value is placed in SQL text below.
  if (!DAY.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`))) throw new Error("bad_day");
  // The database and the credentials must both be there.
  const db = env.SCORES;
  if (!db || !env.CF_ACCOUNT_ID || !env.CF_ANALYTICS_TOKEN) throw new Error("not_configured");
  // The day's bounds in the counting store's clock (UTC).
  const range = `timestamp >= toDateTime('${day} 00:00:00') AND timestamp < toDateTime('${shiftDay(day, 1)} 00:00:00')`;

  // ---- Read the day's sums from the counting store -------------------------
  // Four reads at once; each groups by what the rows are about.
  const [pageRows, clientRows, missingRows, hostRows] = await Promise.all([
    // Pages served to people, per address, the most read first.
    query(env, `SELECT blob1 AS path, SUM(_sample_interval) AS views FROM ${PAGEVIEWS}
                WHERE ${range} AND ${PEOPLE} GROUP BY path ORDER BY views DESC LIMIT ${PAGES_LIMIT}`),
    // Pages served, per class of client (a person, or which kind of machine).
    query(env, `SELECT blob4 AS client, SUM(_sample_interval) AS views FROM ${PAGEVIEWS}
                WHERE ${range} AND ${SERVED} GROUP BY client`),
    // Requests for addresses that are not pages.
    query(env, `SELECT SUM(_sample_interval) AS views FROM ${PAGEVIEWS} WHERE ${range} AND ${MISSING}`),
    // Arrivals by referring host (people only, by the rule the stats page uses).
    query(env, `SELECT index1 AS host, SUM(_sample_interval) AS views FROM ${REFERRERS}
                WHERE ${range} AND ${REFERRER_SINCE} GROUP BY host ORDER BY views DESC LIMIT 2000`),
  ]);
  // The interest counts. Their dataset exists only once a first count has been written, and the SQL API answers an
  // unknown dataset with an error: until then the day simply has none.
  let eventRows: unknown[] = [];
  try {
    eventRows = await query(env, `SELECT blob1 AS kind, blob2 AS section, blob3 AS item, blob4 AS locale, blob5 AS detail,
                                  SUM(_sample_interval) AS n FROM ${EVENTS}
                                  WHERE ${range} GROUP BY kind, section, item, locale, detail ORDER BY n DESC LIMIT ${EVENTS_LIMIT}`);
  } catch {
    eventRows = []; // no interest counts yet (or the dataset is not there): the day's other sums still stand
  }

  // ---- Shape the rows ------------------------------------------------------
  // Pages: [locale, section, path, views], an address longer than 300 characters cut (none of the site's is).
  const pages = (pageRows as Array<{ path?: unknown; views?: unknown }>)
    .map((r) => ({ path: String(r.path ?? "").slice(0, 300), views: Math.round(Number(r.views ?? 0)) }))
    .filter((r) => r.path.startsWith("/") && r.views > 0)
    .map((r) => { const { locale, section } = sectionOf(r.path); return [locale, section, r.path, r.views]; });
  // Interest counts: [kind, section, item, locale, detail, n], each field capped as the write side caps it.
  const events = (eventRows as Array<Record<string, unknown>>)
    .map((r) => [String(r.kind ?? "").slice(0, 24), String(r.section ?? "").slice(0, 24), String(r.item ?? "").slice(0, 96),
                 String(r.locale ?? "").slice(0, 12), String(r.detail ?? "").slice(0, 40), Math.round(Number(r.n ?? 0))])
    // Only kinds from the list (the write side refuses any other, so this changes nothing in practice).
    .filter((r) => (INTEREST_KINDS as readonly string[]).includes(r[0] as string) && (r[5] as number) > 0);
  // Whole-site figures.
  const totals = new Map<string, number>();
  // People and automation, from the class of client.
  for (const r of clientRows as Array<{ client?: unknown; views?: unknown }>) {
    // A person's browser, or a machine of some kind.
    const key = String(r.client ?? "") === "human" ? "people" : "automation";
    totals.set(key, (totals.get(key) ?? 0) + Math.round(Number(r.views ?? 0)));
  }
  // Requests that found no page.
  totals.set("missing", Math.round(Number((missingRows[0] as { views?: unknown } | undefined)?.views ?? 0)));
  // Arrivals by family of referring site: "search:google" and "search" both count as search.
  for (const r of hostRows as Array<{ host?: unknown; views?: unknown }>) {
    // The family, from the host.
    const family = classifyReferrer(String(r.host ?? "")).split(":")[0] || "other";
    // One of the four the page shows; anything else is "other".
    const key = `source:${["search", "ai", "social"].includes(family) ? family : "other"}`;
    totals.set(key, (totals.get(key) ?? 0) + Math.round(Number(r.views ?? 0)));
  }
  // The scoreboard's rounds and browsers that puzzle day, where the day has them (see funFigures).
  for (const [k, v] of await funFigures(db, day)) totals.set(k, v);
  // Whether the page list was cut, and when the day was added up.
  totals.set("cut", pages.length >= PAGES_LIMIT ? 1 : 0);
  totals.set("rolled", Math.floor(now / 1000));

  // ---- Replace the day in D1, as one transaction ---------------------------
  const statements: D1PreparedStatement[] = [
    // The day's old rows go.
    db.prepare("DELETE FROM daily_pages WHERE day = ?1").bind(day),
    db.prepare("DELETE FROM daily_events WHERE day = ?1").bind(day),
    db.prepare("DELETE FROM daily_totals WHERE day = ?1").bind(day),
    // And everything past its keeping time, in the same pass.
    db.prepare("DELETE FROM daily_pages WHERE day < ?1").bind(shiftDay(day, -KEEP_DAYS)),
    db.prepare("DELETE FROM daily_events WHERE day < ?1").bind(shiftDay(day, -KEEP_DAYS)),
    db.prepare("DELETE FROM daily_totals WHERE day < ?1").bind(shiftDay(day, -KEEP_DAYS)),
  ];
  // The pages, CHUNK rows to a statement: the rows travel as one JSON array and SQLite unpacks it (json_each).
  for (let i = 0; i < pages.length; i += CHUNK) {
    statements.push(
      db.prepare(`INSERT OR REPLACE INTO daily_pages (day, locale, section, path, views)
                  SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), json_extract(value, '$[3]')
                  FROM json_each(?2)`).bind(day, JSON.stringify(pages.slice(i, i + CHUNK))),
    );
  }
  // The interest counts, the same way.
  for (let i = 0; i < events.length; i += CHUNK) {
    statements.push(
      db.prepare(`INSERT OR REPLACE INTO daily_events (day, kind, section, item, locale, detail, n)
                  SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'),
                         json_extract(value, '$[3]'), json_extract(value, '$[4]'), json_extract(value, '$[5]')
                  FROM json_each(?2)`).bind(day, JSON.stringify(events.slice(i, i + CHUNK))),
    );
  }
  // The whole-site figures, one small statement.
  statements.push(
    db.prepare(`INSERT OR REPLACE INTO daily_totals (day, metric, value)
                SELECT ?1, json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?2)`)
      .bind(day, JSON.stringify([...totals.entries()])),
  );
  // All or nothing.
  await db.batch(statements);
  // What was written.
  return { day, pages: pages.length, events: events.length, cut: pages.length >= PAGES_LIMIT };
}

/**
 * The scoreboard's figures for one puzzle day, read from the board's own table (migrations/0001 and 0004): the rounds
 * published, when the board already kept rows by then, and the browsers that published, when the yes-or-no bit
 * existed by then. A figure the day cannot have is left out, so the trend shows "no data" there rather than zero.
 *
 * @param db the database
 * @param day the puzzle day, YYYY-MM-DD
 * @returns the figures to keep, by name
 */
async function funFigures(db: D1Database, day: string): Promise<Array<[string, number]>> {
  // The figures found.
  const out: Array<[string, number]> = [];
  // The rounds, and the board's first kept day; a board table that cannot be read leaves both out.
  let rounds = 0;
  try {
    // One read: the day's rounds and the first day any row is kept for.
    const r = await db.prepare("SELECT (SELECT COUNT(*) FROM fun_scores WHERE day = ?1) AS n, (SELECT MIN(day) FROM fun_scores) AS since").bind(day).first<{ n: number; since: string | null }>();
    // The day's rounds.
    rounds = Number(r?.n ?? 0);
    // Kept only from the board's first kept day on (before it, the board did not exist or its rows are gone).
    if (r?.since && day >= r.since) out.push(["fun_rounds", rounds]);
    else return out;
  } catch {
    // No board table: no scoreboard figures for the day.
    return out;
  }
  // The browsers: the bits of the day, and the first day any round carried one; a missing column leaves them out.
  try {
    // Both through the index of the rows with the bit set (migrations/0004).
    const b = await db.prepare("SELECT (SELECT COUNT(*) FROM fun_scores WHERE first_today = 1 AND day = ?1) AS n, (SELECT MIN(day) FROM fun_scores WHERE first_today = 1) AS since").bind(day).first<{ n: number; since: string | null }>();
    // The day's browsers.
    const n = Number(b?.n ?? 0);
    // From the first day counted on; rounds without a single bit (pages from before the count) are no data, not zero.
    if (b?.since && day >= b.since && !(n === 0 && rounds > 0)) out.push(["fun_browsers", n]);
  } catch {
    // The column is not there yet: no browsers' figure.
  }
  // What the day has.
  return out;
}

/**
 * The scheduled run: yesterday, and up to two of the days before it that were never added up (a missed night heals
 * itself while its counts are still in the counting store).
 *
 * @param env the Worker's bindings
 * @param now the current time in milliseconds
 * @returns the days added up
 */
export async function rollupDue(env: RollupEnv, now: number): Promise<RollupReport[]> {
  // The newest finished day.
  const last = lastFullDay(now);
  // The database.
  const db = env.SCORES;
  if (!db) throw new Error("not_configured");
  // The week before it, and which of those days already have their "rolled" stamp.
  const week = Array.from({ length: 7 }, (_, i) => shiftDay(last, -i));
  const done = new Set<string>();
  try {
    // The stamped days of the week.
    const got = await db.prepare("SELECT day FROM daily_totals WHERE metric = 'rolled' AND day >= ?1").bind(week[week.length - 1]).all<{ day: string }>();
    for (const r of got.results ?? []) done.add(String(r.day));
  } catch {
    /* the table is not there yet (the migration has not been applied): the run below says so by failing */
  }
  // Yesterday always (a second run replaces the first), then the two newest days that are missing.
  const due = [last, ...week.slice(1).filter((d) => !done.has(d)).slice(0, 2)];
  // One after the other: each is four reads and one write, and the order keeps the SQL API's rate comfortable.
  const out: RollupReport[] = [];
  for (const day of due) out.push(await rollupDay(env, day, now));
  // What was done.
  return out;
}
