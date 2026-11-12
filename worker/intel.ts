/**
 * worker/intel.ts
 *
 * THE READ SIDE OF THE INTEREST COUNTS AND OF THE DAILY TOTALS (PRIME
 * 12/11/2026 02:35): the routes behind the Stats page's interest panels and
 * the operator's dashboard. Everything under /api/stats/ that worker/stats.ts
 * does not answer and that starts with one of the names below is answered
 * here.
 *
 * PUBLIC AND PRIVATE, AND WHY THE LINE IS WHERE IT IS
 * ---------------------------------------------------
 * A count of how often a tool was used is the same kind of figure as a count
 * of how often its page was served: about the site, not about anybody. Those
 * are public, like the rest of the Stats page.
 *
 * The WORDS of searches that found nothing are different in kind. They were
 * typed by readers. They pass a filter before they are kept (plain words only,
 * src/lib/interest/shape.ts), and they are kept because they say what the site
 * lacks; but republishing what readers typed is not what they were kept for.
 * So the public routes count searches and never list their words, and the
 * route that lists them answers only to the operator's key, exactly as the
 * full referring addresses do in worker/stats.ts. Collecting is one thing;
 * publishing is another.
 *
 * The operator's key travels in a header (x-stats-key), not in the address,
 * so it is not written into request logs with the address.
 *
 * THE DAILY TOTALS ANSWER TO THE KEY TOO, for a different reason. Nothing in them is private (they are sums per
 * address and per item, the same figures the public routes give for a window), but every read of them walks the
 * database, and only the operator's dashboard reads them. A public address that anyone could call in a loop would
 * be a way to run up the database's reads for nothing. The two public routes read the counting store instead and
 * are answered from the edge cache for five minutes, so a loop of requests costs the store one read.
 *
 * ROUTES
 *   interest          public   the interest counts of a window, per kind and item, and summed per kind
 *                              (one answer behind the Stats page's three interest panels and the dashboard)
 *   pulse             public   per-day pages and interest counts, this window and the one before
 *   history           key      the daily totals kept in D1: sections, totals, events, items, movers, split, path, days
 *   searches          key      the words of searches that found nothing
 *   rollup            key      add a day up now (POST), or report which days are added up (GET)
 */

// The SQL API call, the dataset name, the window list and the people filter, shared with worker/stats.ts.
import { PAGEVIEWS, PEOPLE, WINDOWS, query, type StatsEnv } from "./stats";
// The lists a public answer's text is checked against on the way out, the same lists the write side checks on the way in.
import { INTEREST_DETAILS, INTEREST_KINDS, INTEREST_SLUG, type InterestKind } from "../src/lib/interest/shape";
// The interest counts' dataset, the adding-up itself, and the day arithmetic.
import { EVENTS, KEEP_DAYS, lastFullDay, rollupDay, shiftDay, type RollupEnv } from "./rollup";

/** What these routes need: the SQL API's credentials, the operator's key, and the D1 database. */
export type IntelEnv = StatsEnv & RollupEnv;

/** The route names answered here. */
const ROUTES = ["interest", "pulse", "history", "searches", "rollup"] as const;

/** A sum that allows for sampling, as every total in worker/stats.ts does. */
const N = "SUM(_sample_interval) AS n";

/**
 * The series a per-day answer may name: every kind but search, and a search's two outcomes. Read from the list in
 * src/lib/interest/shape.ts, so a kind added there (as "save", My desk, 12/11/2026) is answered here, kept by the
 * daily adding-up (worker/rollup.ts) and written by worker/events.ts with no change to any of the three.
 */
const SERIES_NAMES: ReadonlySet<string> = new Set([...INTEREST_KINDS.filter((k) => k !== "search"), "search:hit", "search:empty"]);

/** The most rows the public "interest" answer lists (kind, section, item and fixed word, most used first). */
const INTEREST_LIMIT = 5000;

/** The most days one "rollup" call adds up (each is four reads and a write). */
const ROLLUP_MAX_DAYS = 14;

/**
 * A JSON answer. Public answers are cached briefly, like the Stats page's; private ones never.
 *
 * @param body the answer
 * @param status the HTTP status
 * @param priv true for an answer given to the operator's key
 * @returns the response
 */
const json = (body: unknown, status = 200, priv = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Public figures may be read from any page; private ones are for the operator's own page only.
      ...(priv ? {} : { "access-control-allow-origin": "*" }),
      // Public figures change slowly; private ones are never stored anywhere.
      "cache-control": priv ? "private, no-store" : "public, max-age=300",
    },
  });

/**
 * Whether the request carries the operator's key (header x-stats-key), compared without leaking where two keys differ.
 *
 * @param request the request
 * @param env the Worker's bindings
 * @returns true when a key is configured and the request's matches it
 */
function isOperator(request: Request | undefined, env: IntelEnv): boolean {
  // No key configured: nobody is the operator.
  const want = env.STATS_DETAIL_KEY ?? "";
  // The key offered.
  const got = request?.headers.get("x-stats-key") ?? "";
  // Both present and of one length.
  if (want === "" || got.length !== want.length) return false;
  // Every character compared, so the time taken says nothing about where they differ.
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

/**
 * One interest row as a PUBLIC answer may carry it: a kind from the list, a slug, and a detail only when it is one of
 * the kind's fixed words. The write side already refuses anything else (worker/events.ts), so this changes nothing in
 * practice; it is here so that no row, however it came to be in the store, can put free text into a public answer.
 *
 * @param r a row as the store answered it
 * @returns the row with its text checked, or null when its kind or item is not one a public answer names
 */
function publicRow(r: Record<string, unknown>): { kind: string; section: string; item: string; detail: string; n: number } | null {
  // The kind, from the list.
  const kind = String(r.kind ?? "");
  if (!(INTEREST_KINDS as readonly string[]).includes(kind)) return null;
  // The item, a slug (a search's "hit" and "empty" are slugs too).
  const item = String(r.item ?? "");
  if (!INTEREST_SLUG.test(item)) return null;
  // The detail, only one of the kind's fixed words; a search's words never pass (search has no fixed words).
  const detail = String(r.detail ?? "");
  const fixed = INTEREST_DETAILS[kind as InterestKind] ?? [];
  // The section, a short word.
  const section = String(r.section ?? "");
  return { kind, section: /^[a-z]{1,12}$/.test(section) ? section : "", item, detail: fixed.includes(detail) ? detail : "", n: Number(r.n ?? 0) };
}

/**
 * The edge cache, where the runtime has one (Cloudflare's does; the build's checks, run under Node, do not).
 *
 * @returns the cache, or null
 */
function edgeCache(): { match(key: Request): Promise<Response | undefined>; put(key: Request, value: Response): Promise<void> } | null {
  // The Workers runtime exposes it as caches.default.
  const store = (globalThis as { caches?: { default?: unknown } }).caches?.default;
  // Typed by the two methods used here.
  return (store as ReturnType<typeof edgeCache>) ?? null;
}

/**
 * A whole number from the address, within bounds.
 *
 * @param raw the value as written
 * @param fallback the value when none was given
 * @param min the least allowed
 * @param max the most allowed
 * @returns the number, or null when it is not a whole number within the bounds
 */
function wholeNumber(raw: string | null, fallback: number, min: number, max: number): number | null {
  // None given.
  if (raw === null || raw === "") return fallback;
  // Digits only.
  if (!/^\d{1,4}$/.test(raw)) return null;
  // Within bounds.
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

/**
 * Answer one of this file's routes, or return null for any other so the Worker goes on.
 *
 * @param request the request (its method and the operator's key)
 * @param url its parsed address
 * @param env the Worker's bindings
 * @returns the answer, or null when the route is not one of this file's
 */
export async function handleIntel(request: Request, url: URL, env: IntelEnv): Promise<Response | null> {
  // Under /api/stats/ only.
  if (!url.pathname.startsWith("/api/stats/")) return null;
  // The route's name.
  const route = url.pathname.slice("/api/stats/".length).replace(/\/+$/, "");
  // Not one of this file's: worker/stats.ts answers (or refuses) it.
  if (!(ROUTES as readonly string[]).includes(route)) return null;
  // The private routes ask for the key before anything else is looked at.
  const priv = route === "searches" || route === "rollup" || route === "history";
  // Every route but the adding-up is a read: GET or HEAD only.
  if (route !== "rollup" && request.method !== "GET" && request.method !== "HEAD") return json({ error: "method_not_allowed" }, 405, priv);
  if (priv && !isOperator(request, env)) return json({ error: "unauthorized" }, 401, true);

  try {
    // ---- The daily totals kept in D1 --------------------------------------
    if (route === "history") return await history(url, env);
    if (route === "rollup") return await rollup(request, url, env);

    // ---- The counting store (Analytics Engine) ------------------------------
    // Its credentials must be there.
    if (!env.CF_ACCOUNT_ID || !env.CF_ANALYTICS_TOKEN) return json({ configured: false }, 503, priv);
    // The window, from the same short list the Stats page offers; never interpolated from the address.
    const winKey = url.searchParams.get("window") ?? "30d";
    const win = WINDOWS[winKey];
    if (!win) return json({ error: "bad_window", allowed: Object.keys(WINDOWS) }, 400, priv);
    const since = `timestamp > NOW() - INTERVAL '${win}`;

    // The interest counts' dataset exists only once a first count has been written; until then every read of it is
    // an error upstream, which here means "none yet".
    const events = async (sql: string): Promise<Array<Record<string, unknown>>> => {
      try {
        return (await query(env, sql)) as Array<Record<string, unknown>>;
      } catch {
        return [];
      }
    };

    // The two public answers are kept at the edge for five minutes, under an address made of the route and the
    // window only, so nothing a caller adds to the address can make a second copy or force a fresh read.
    const cacheKey = new Request(`${url.origin}/api/stats/${route}?window=${winKey}`);
    const cache = priv ? null : edgeCache();
    if (cache) {
      // A copy still fresh: answered without touching the counting store.
      const hit = await cache.match(cacheKey).catch(() => undefined);
      if (hit) return hit;
    }
    /** Keep a public answer at the edge (only a 200), and return it. */
    const keep = async (res: Response): Promise<Response> => {
      // Stored as a copy; a failure to store changes nothing for the caller.
      if (cache && res.status === 200) await cache.put(cacheKey, res.clone()).catch(() => undefined);
      return res;
    };

    switch (route) {
      // Every kind and item of the window, and each kind's total. A search's words are never in a public answer:
      // searches are summed per outcome (found something, found nothing) with the detail left out. The per-kind
      // totals are their own small query, so they stay exact even when the item list is cut at its row limit.
      case "interest": {
        const [rows, searches, kinds] = await Promise.all([
          events(`SELECT blob1 AS kind, blob2 AS section, blob3 AS item, blob5 AS detail, ${N} FROM ${EVENTS}
                  WHERE ${since} AND blob1 != 'search' GROUP BY kind, section, item, detail ORDER BY n DESC LIMIT ${INTEREST_LIMIT}`),
          events(`SELECT blob1 AS kind, blob2 AS section, blob3 AS item, ${N} FROM ${EVENTS}
                  WHERE ${since} AND blob1 = 'search' GROUP BY kind, section, item ORDER BY n DESC LIMIT 10`),
          events(`SELECT blob1 AS kind, ${N} FROM ${EVENTS} WHERE ${since} GROUP BY kind ORDER BY n DESC LIMIT 20`),
        ]);
        // Every row through publicRow: a kind from the list, a slug, a fixed word or nothing.
        const out = [...rows, ...searches].map(publicRow).filter((r) => r !== null);
        return keep(json({
          window: winKey,
          sampled: true,
          // Whether the item list reached its row limit (the per-kind totals below are whole either way).
          cut: rows.length >= INTEREST_LIMIT,
          limit: INTEREST_LIMIT,
          rows: out,
          // One row per kind, only kinds from the list; "views" so the Stats page's panels read it like any other list.
          kinds: kinds
            .map((r) => ({ kind: String(r.kind ?? ""), views: Number(r.n ?? 0) }))
            .filter((r) => (INTEREST_KINDS as readonly string[]).includes(r.kind)),
        }));
      }

      // Per day: pages served to people, and the interest counts per kind, over the window and the equal stretch
      // before it (so a figure can be shown beside what it was), as far back as the store keeps (three months).
      case "pulse": {
        // The window's length in days, doubled, capped at the store's three months.
        const days = Number.parseInt(win, 10);
        const span = Math.min(days * 2, 90);
        const sinceSpan = `timestamp > NOW() - INTERVAL '${span}' DAY`;
        const [views, kinds, searches] = await Promise.all([
          query(env, `SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, SUM(_sample_interval) AS views FROM ${PAGEVIEWS}
                      WHERE ${sinceSpan} AND ${PEOPLE} GROUP BY day ORDER BY day ASC LIMIT 200`),
          // Every kind but search, summed per day and kind: at most a few hundred rows however many items there are.
          events(`SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, blob1 AS kind, ${N} FROM ${EVENTS}
                  WHERE ${sinceSpan} AND blob1 != 'search' GROUP BY day, kind ORDER BY day ASC LIMIT 2000`),
          // Searches per day and outcome (the outcome is the item: "hit" or "empty"); their words are not selected.
          events(`SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, blob3 AS item, ${N} FROM ${EVENTS}
                  WHERE ${sinceSpan} AND blob1 = 'search' AND blob3 IN ('hit', 'empty') GROUP BY day, item ORDER BY day ASC LIMIT 500`),
        ]);
        // One list of { day, series, n }: a kind's own name, or "search:hit" and "search:empty".
        const perDay: Array<{ day: string; kind: string; n: number }> = [];
        for (const r of kinds) {
          // Only kinds from the list.
          const kind = String(r.kind ?? "");
          if (SERIES_NAMES.has(kind)) perDay.push({ day: String(r.day ?? "").slice(0, 10), kind, n: Number(r.n ?? 0) });
        }
        for (const r of searches) {
          // Only the two outcomes.
          const kind = `search:${String(r.item ?? "")}`;
          if (SERIES_NAMES.has(kind)) perDay.push({ day: String(r.day ?? "").slice(0, 10), kind, n: Number(r.n ?? 0) });
        }
        return keep(json({
          window: winKey,
          days,
          span,
          views: (views as Array<{ day?: unknown; views?: unknown }>).map((r) => ({ day: String(r.day ?? "").slice(0, 10), views: Number(r.views ?? 0) })),
          events: perDay,
        }));
      }

      // The words of searches that found nothing, for the operator only (see the note at the top).
      case "searches":
        return json({
          window: winKey,
          rows: (await events(`SELECT blob5 AS term, blob4 AS locale, ${N} FROM ${EVENTS}
                               WHERE ${since} AND blob1 = 'search' AND blob3 = 'empty' AND blob5 != ''
                               GROUP BY term, locale ORDER BY n DESC LIMIT 500`))
            .map((r) => ({ term: String(r.term ?? ""), locale: String(r.locale ?? ""), n: Number(r.n ?? 0) })),
        }, 200, true);

      // Unreachable: every name in ROUTES is handled above.
      default:
        return json({ error: "not_found" }, 404, priv);
    }
  } catch (err) {
    // As in worker/stats.ts: an upstream refusal is a 502 with its status, anything else is this file's own fault,
    // and no message is ever passed on (the upstream one can carry the account's id).
    const m = err instanceof Error ? /^sql (\d{3})$/.exec(err.message) : null;
    if (m) return json({ error: "upstream_unavailable", upstream_status: Number(m[1]) }, 502, priv);
    if (err instanceof Error && err.message === "not_configured") return json({ configured: false }, 503, priv);
    if (err instanceof Error && err.message === "bad_day") return json({ error: "bad_day" }, 400, priv);
    // The daily totals' tables are not there (the migration has not been applied to this database yet).
    if (err instanceof Error && /no such table/i.test(err.message)) return json({ configured: false, reason: "no_tables" }, 503, priv);
    return json({ error: "handler_error" }, 500, priv);
  }
}

/**
 * The daily totals kept in D1, for the trend panels. Every value from the address is checked against a pattern or a
 * list and then BOUND to the statement, never written into its text.
 *
 * @param url the request's address (series, days, and the series' own parameters)
 * @param env the Worker's bindings
 * @returns the answer
 */
async function history(url: URL, env: IntelEnv): Promise<Response> {
  // Every answer of this function is the operator's: never cached, anywhere.
  const answer = (body: unknown, status = 200) => json(body, status, true);
  // The database.
  const db = env.SCORES;
  if (!db) return answer({ configured: false }, 503);
  // How far back, in days.
  const days = wholeNumber(url.searchParams.get("days"), 90, 1, KEEP_DAYS);
  if (days === null) return answer({ error: "bad_days" }, 400);
  // The newest finished day and the first day of the stretch.
  const last = lastFullDay(Date.now());
  const from = shiftDay(last, -(days - 1));
  // Which series.
  const series = url.searchParams.get("series") ?? "sections";
  // Run one statement and return its rows.
  const all = async (sql: string, ...values: unknown[]) => (await db.prepare(sql).bind(...values).all()).results ?? [];

  switch (series) {
    // Pages served to people per section per day.
    case "sections":
      return answer({ series, from, to: last, rows: await all(
        "SELECT day, section, SUM(views) AS views FROM daily_pages WHERE day >= ?1 GROUP BY day, section ORDER BY day ASC", from) });

    // The whole-site figures per day, the scoreboard's fun_rounds and fun_browsers among them (worker/rollup.ts; a
    // day without one of those has no row for it, which the dashboard shows as no data).
    case "totals":
      return answer({ series, from, to: last, rows: await all(
        "SELECT day, metric, value FROM daily_totals WHERE day >= ?1 AND metric != 'rolled' ORDER BY day ASC", from) });

    // The interest counts per kind per day (a search keeps its outcome; its words are never in a public answer).
    case "events":
      return answer({ series, from, to: last, rows: (await all(
        `SELECT day, CASE WHEN kind = 'search' THEN 'search:' || item ELSE kind END AS kind, SUM(n) AS n
         FROM daily_events WHERE day >= ?1 GROUP BY day, 2 ORDER BY day ASC`, from))
        // Only the three fields, and only a series name from the list: nothing else a row holds can come out.
        .map((r) => { const row = r as Record<string, unknown>; return { day: String(row.day ?? "").slice(0, 10), kind: String(row.kind ?? ""), n: Number(row.n ?? 0) }; })
        .filter((r) => SERIES_NAMES.has(r.kind)) });

    // The interest counts per kind and item over the stretch (for the per-tool and per-game tables on a long window).
    case "items":
      return answer({ series, from, to: last, rows: (await all(
        `SELECT kind, section, item, CASE WHEN kind = 'search' THEN '' ELSE detail END AS detail, SUM(n) AS n
         FROM daily_events WHERE day >= ?1 GROUP BY 1, 2, 3, 4 ORDER BY n DESC LIMIT 5000`, from))
        // Every row through publicRow, as the live "interest" route does.
        .map((r) => publicRow(r as Record<string, unknown>)).filter((r) => r !== null) });

    // Pages whose reading moved most: the stretch against the equal stretch before it.
    case "movers": {
      // The stretch before this one starts here.
      const before = shiftDay(from, -days);
      return answer({ series, from, to: last, before, rows: await all(
        `SELECT path, section,
                SUM(CASE WHEN day >= ?1 THEN views ELSE 0 END) AS cur,
                SUM(CASE WHEN day <  ?1 THEN views ELSE 0 END) AS prev
         FROM daily_pages WHERE day >= ?2 GROUP BY path
         HAVING cur + prev >= 5 ORDER BY ABS(cur - prev) DESC LIMIT 400`, from, before) });
    }

    // One section's pages before and after a date (what a rewrite did to an entry's reading): the same number of
    // days on each side of the cut, as far as the kept totals go.
    case "split": {
      // The section, from the short list of names the adding-up writes.
      const section = url.searchParams.get("section") ?? "";
      if (!/^[a-z][a-z0-9-]{0,39}$/.test(section)) return answer({ error: "bad_section" }, 400);
      // The date of the cut.
      const cut = url.searchParams.get("cut") ?? "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cut) || Number.isNaN(Date.parse(`${cut}T00:00:00Z`))) return answer({ error: "bad_cut" }, 400);
      // The days after the cut that are over, at most `days`; the same number before it.
      const after = Math.min(days, Math.max(0, Math.round((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${cut}T00:00:00Z`)) / 86400000) + 1));
      const start = shiftDay(cut, -after);
      const end = shiftDay(cut, after - 1);
      return answer({ series, section, cut, days: after, from: start, to: end, rows: after === 0 ? [] : await all(
        `SELECT path,
                SUM(CASE WHEN day <  ?1 THEN views ELSE 0 END) AS prev,
                SUM(CASE WHEN day >= ?1 THEN views ELSE 0 END) AS cur
         FROM daily_pages WHERE section = ?2 AND day >= ?3 AND day <= ?4 GROUP BY path ORDER BY cur DESC LIMIT 5000`,
        cut, section, start, end) });
    }

    // One address per day.
    case "path": {
      // The address, in the same strict shape worker/stats.ts asks of its "item" route.
      const path = url.searchParams.get("path") ?? "";
      if (!/^\/[A-Za-z0-9\-/._]{0,200}$/.test(path)) return answer({ error: "bad_path" }, 400);
      return answer({ series, path, from, to: last, rows: await all(
        "SELECT day, views FROM daily_pages WHERE path = ?1 AND day >= ?2 ORDER BY day ASC", path, from) });
    }

    // Which days are added up (so a page can say how far its trends reach).
    case "days":
      return answer({ series, from, to: last, rows: await all(
        "SELECT day FROM daily_totals WHERE metric = 'rolled' AND day >= ?1 ORDER BY day ASC", from) });

    // Not a series.
    default:
      return answer({ error: "bad_series", allowed: ["sections", "totals", "events", "items", "movers", "split", "path", "days"] }, 400);
  }
}

/**
 * The operator's adding-up: POST adds days up now; GET says which of the last 90 days are added up.
 *
 * @param request the request (already known to carry the operator's key)
 * @param url its address: day=YYYY-MM-DD, or days=N for the N newest finished days
 * @param env the Worker's bindings
 * @returns the answer
 */
async function rollup(request: Request, url: URL, env: IntelEnv): Promise<Response> {
  // Now, once.
  const now = Date.now();
  // The newest finished day.
  const last = lastFullDay(now);
  // Reading: which days are done.
  if (request.method === "GET") {
    const db = env.SCORES;
    if (!db) return json({ configured: false }, 503, true);
    const rows = (await db.prepare("SELECT day, value FROM daily_totals WHERE metric = 'rolled' AND day >= ?1 ORDER BY day ASC").bind(shiftDay(last, -89)).all()).results ?? [];
    return json({ to: last, rolled: rows }, 200, true);
  }
  // Anything but GET and POST.
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, true);
  // One named day, or the N newest finished days.
  const day = url.searchParams.get("day");
  let due: string[];
  if (day !== null) {
    // A real, finished day.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > last) return json({ error: "bad_day" }, 400, true);
    due = [day];
  } else {
    // How many days, the newest first; a start further back moves the batch (so 90 days are seven calls).
    const count = wholeNumber(url.searchParams.get("days"), 1, 1, ROLLUP_MAX_DAYS);
    const skip = wholeNumber(url.searchParams.get("skip"), 0, 0, 120);
    if (count === null || skip === null) return json({ error: "bad_days", max: ROLLUP_MAX_DAYS }, 400, true);
    due = Array.from({ length: count }, (_, i) => shiftDay(last, -(skip + i)));
  }
  // One after the other.
  const done = [];
  for (const d of due) done.push(await rollupDay(env, d, now));
  // What was written.
  return json({ done }, 200, true);
}
