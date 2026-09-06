/**
 * worker/stats.ts
 *
 * The READ side of the site's own request counting. Serves aggregated JSON to
 * the /stats section and to the per-item counters embedded on tool and article
 * pages.
 *
 * THE PRIVACY DECISION THAT SHAPES THIS FILE
 * ------------------------------------------
 * The write side keeps full referring URLs including query strings, because
 * PRIME asked for them and they are what answers "where does traffic come
 * from". Those strings can contain other people's data: we do not control the
 * pages that link here, and a referring URL can carry someone's search terms
 * or, on a carelessly built site, a token.
 *
 * Keeping that in a private dataset is one thing. Republishing it on a public
 * page would be another entirely - it would take data we merely received and
 * broadcast it. So:
 *
 *   PUBLIC endpoints aggregate referrers to the HOST. facebook.com, 12 visits.
 *   Never the path, never the query string, never the full URL.
 *
 *   The full-URL view exists behind ?detail=1 and requires the same shared
 *   secret used to authenticate an operator. It answers PRIME's campaign
 *   question without putting the raw strings on the open web.
 *
 * This is the difference between collecting something and publishing it, and
 * the site's whole position rests on being precise about that difference.
 *
 * CREDENTIALS
 * -----------
 * Querying Analytics Engine needs an account ID and an API token. Both are
 * secrets, set by PRIME with `wrangler secret put` - they are never in this
 * repository, never in the Wrangler config, and never seen by the assistant
 * that wrote this file. If they are absent the endpoints return a documented
 * "not configured" response rather than failing obscurely.
 */

export interface StatsEnv {
  /** Cloudflare account ID that owns the datasets. Secret. */
  CF_ACCOUNT_ID?: string;
  /** API token with Account Analytics Read. Secret. */
  CF_ANALYTICS_TOKEN?: string;
  /** Shared secret gating the detailed (full-URL) referrer view. Secret. */
  STATS_DETAIL_KEY?: string;
}

const SQL_API = (account: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`;

const PAGEVIEWS = "ronutz_pageviews";
const REFERRERS = "ronutz_referrers";

/** Windows the UI offers. Anything else is rejected rather than interpolated,
 *  because these strings are concatenated into SQL. */
const WINDOWS: Record<string, string> = {
  "24h": "1' DAY",
  "7d": "7' DAY",
  "30d": "30' DAY",
  "90d": "90' DAY",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      // Counts are not sensitive and change slowly; a short cache keeps the
      // SQL API well inside its rate limits even if a page is refreshed hard.
      "cache-control": "public, max-age=300",
    },
  });

/**
 * Run one query against the Analytics Engine SQL API.
 *
 * Every caller composes its own SQL from the constants in this file; no value
 * derived from a request ever reaches the query except through the WINDOWS
 * whitelist and a path that is matched against a strict pattern first.
 */
async function query(env: StatsEnv, sql: string): Promise<unknown[]> {
  const res = await fetch(SQL_API(env.CF_ACCOUNT_ID!), {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`,
      "content-type": "text/plain",
    },
    body: sql,
  });
  if (!res.ok) throw new Error(`sql ${res.status}`);
  const out = (await res.json()) as { data?: unknown[] };
  return out.data ?? [];
}

/**
 * Analytics Engine samples. A raw COUNT(*) undercounts, sometimes badly, so
 * every total in this file is SUM(_sample_interval). Reporting a sampled count
 * as though it were exact would be the same class of error the site's own
 * test-and-measurement article warns about: a number without its conditions.
 */
const VIEWS = "SUM(_sample_interval) AS views";

// ---------------------------------------------------------------------------
// RETROACTIVE RECLASSIFICATION (2026-09-06)
// Rows written before the datacenter classifier deployed carry
// blob4 = 'human' for a scraper fleet that was, in the data, ~29,000 of
// ~31,000 "human" requests in a week, all from one country. Analytics Engine
// rows cannot be edited, so the correction is applied at read time: a human
// row from that country before the cutoff is treated as 'unverified:datacenter'
// everywhere - excluded from every people-only panel, and shown in the clients
// panel under its own label so the count is visible rather than deleted.
// The handful of genuine readers in that country in that window are lost to
// the same rule; that is the smaller error by four orders of magnitude.
// ---------------------------------------------------------------------------
const RECLASS_COUNTRY = "SG";
const RECLASS_BEFORE = "2026-09-07 12:00:00";
const POLLUTED = `(blob4 = 'human' AND blob3 = '${RECLASS_COUNTRY}' AND timestamp < toDateTime('${RECLASS_BEFORE}'))`;
/** The people-only filter every human panel uses. */
const HUMAN = `(blob4 = 'human' AND NOT ${POLLUTED})`;

export async function handleStats(
  url: URL,
  env: StatsEnv
): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/stats/")) return null;

  if (!env.CF_ACCOUNT_ID || !env.CF_ANALYTICS_TOKEN) {
    return json(
      {
        configured: false,
        message:
          "Statistics are not configured on this deployment. The read endpoint needs CF_ACCOUNT_ID and CF_ANALYTICS_TOKEN as Worker secrets.",
      },
      503
    );
  }

  const win = WINDOWS[url.searchParams.get("window") ?? "30d"];
  if (!win) return json({ error: "bad_window", allowed: Object.keys(WINDOWS) }, 400);
  const since = `timestamp > NOW() - INTERVAL '${win}`;
  const route = url.pathname.slice("/api/stats/".length).replace(/\/+$/, "");

  try {
    switch (route) {
      // ---- Top pages, humans only -------------------------------------
      case "pages":
        return json({
          window: url.searchParams.get("window") ?? "30d",
          sampled: true,
          rows: await query(
            env,
            `SELECT blob1 AS path, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} AND ${HUMAN}
             GROUP BY path ORDER BY views DESC LIMIT 100`
          ),
        });

      // ---- One item's own count, for the counter on a tool or article --
      case "item": {
        const path = url.searchParams.get("path") ?? "";
        // Strict shape check before the value goes anywhere near SQL.
        if (!/^\/[A-Za-z0-9\-/._]{0,200}$/.test(path)) {
          return json({ error: "bad_path" }, 400);
        }
        const safe = path.replace(/'/g, "");
        // Total and a per-day series in one response (2026-09-06): the
        // series is what the small chart under an article draws. Same SQL
        // shape as the timeline route, filtered to one path.
        const [rows, days] = await Promise.all([
          query(env, `SELECT ${VIEWS} FROM ${PAGEVIEWS}
                      WHERE ${since} AND ${HUMAN} AND blob1 = '${safe}'`),
          query(env, `SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, ${VIEWS}
                      FROM ${PAGEVIEWS} WHERE ${since} AND ${HUMAN} AND blob1 = '${safe}'
                      GROUP BY day ORDER BY day ASC LIMIT 400`),
        ]);
        const first = rows[0] as { views?: string } | undefined;
        return json({
          path,
          views: Number(first?.views ?? 0),
          series: (days as Array<{ day?: string; views?: string }>).map((d) => ({
            day: String(d.day ?? "").slice(0, 10),
            views: Number(d.views ?? 0),
          })),
          sampled: true,
        });
      }

      // ---- Humans versus automation, and the bot families --------------
      case "clients": {
        // Two queries: the family breakdown, and the count of rows the
        // retroactive rule relabels. The relabelled count is moved from
        // 'human' to its own row so it is visible, not deleted.
        const [rows, polluted] = await Promise.all([
          query(env, `SELECT blob4 AS client, ${VIEWS} FROM ${PAGEVIEWS}
                      WHERE ${since} GROUP BY client ORDER BY views DESC`),
          query(env, `SELECT ${VIEWS} FROM ${PAGEVIEWS} WHERE ${since} AND ${POLLUTED}`),
        ]);
        const p = Number((polluted[0] as { views?: string } | undefined)?.views ?? 0);
        const out = (rows as Array<{ client: string; views: string }>).map((r) =>
          r.client === "human" ? { ...r, views: String(Math.max(0, Number(r.views) - p)) } : r
        );
        if (p > 0) {
          const i = out.findIndex((r) => r.client === "unverified:datacenter");
          if (i >= 0) out[i] = { ...out[i], views: String(Number(out[i].views) + p) };
          else out.push({ client: "unverified:datacenter", views: String(p) });
        }
        out.sort((a, b) => Number(b.views) - Number(a.views));
        return json({
          rows: out,
          note: "client 'human' is everything not matched as automation and not from a datacenter network; the rest are families.",
        });
      }

      // ---- Where readers come from -------------------------------------
      // PUBLIC: aggregated to the referring host. The full URL, with its query
      // string, is only returned when the operator secret is presented.
      case "referrers": {
        const detail =
          url.searchParams.get("detail") === "1" &&
          env.STATS_DETAIL_KEY &&
          url.searchParams.get("key") === env.STATS_DETAIL_KEY;

        if (detail) {
          return json({
            detail: true,
            rows: await query(
              env,
              `SELECT blob1 AS url, ${VIEWS} FROM ${REFERRERS}
               WHERE ${since} GROUP BY url ORDER BY views DESC LIMIT 200`
            ),
          });
        }
        return json({
          detail: false,
          note: "Aggregated to the referring host. Full referring URLs are not published.",
          rows: await query(
            env,
            `SELECT index1 AS host, blob2 AS source, ${VIEWS} FROM ${REFERRERS}
             WHERE ${since} GROUP BY host, source ORDER BY views DESC LIMIT 100`
          ),
        });
      }

      // ---- Where readers come from, by source family --------------------
      // search:google, ai:perplexity, social:linkedin, other. Derived from
      // the referring host, which every engine still sends. Public.
      case "sources":
        return json({
          rows: await query(
            env,
            `SELECT blob2 AS source, ${VIEWS} FROM ${REFERRERS}
             WHERE ${since} AND blob2 != '' GROUP BY source ORDER BY views DESC LIMIT 50`
          ),
        });

      // ---- Readers per day ---------------------------------------------
      // Human requests only, bucketed by UTC day. The trend that makes every
      // other panel legible: a page count means little without knowing
      // whether the site had a normal week. Still no visitor, ever - a day is
      // the coarsest bucket there is.
      case "timeline":
        return json({
          rows: await query(
            env,
            `SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, ${VIEWS}
             FROM ${PAGEVIEWS} WHERE ${since} AND ${HUMAN}
             GROUP BY day ORDER BY day ASC LIMIT 400`
          ),
        });

      // ---- Mobile versus desktop ------------------------------------------
      // Humans only. Three coarse words derived from the User-Agent at write
      // time; the UA itself is never stored. Percentages are computed on the
      // page from these totals.
      case "devices":
        return json({
          rows: await query(
            env,
            `SELECT blob5 AS device, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} AND ${HUMAN} AND blob5 != ''
             GROUP BY device ORDER BY views DESC LIMIT 5`
          ),
        });

      // ---- Automation by day and family ----------------------------------
      // Every non-human class, per UTC day. The page derives the AI-crawler
      // share from this: the one trend this site has a particular reason to
      // publish. Same SQL shapes as the panels above; nothing new to trust.
      case "crawlers":
        return json({
          rows: await query(
            env,
            `SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, blob4 AS client, ${VIEWS}
             FROM ${PAGEVIEWS} WHERE ${since} AND (blob4 != 'human' OR ${POLLUTED})
             GROUP BY day, client ORDER BY day ASC LIMIT 4000`
          ),
        });

      // ---- Every page people read in the window --------------------------
      // Path and count, no ranking cut. One response serves three panels on
      // the page: traffic by section, the long tail, and how many distinct
      // pages were read at all. Paths are public URLs; there is nothing here
      // about who read them.
      case "paths":
        return json({
          rows: await query(
            env,
            `SELECT blob1 AS path, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} AND ${HUMAN}
             GROUP BY path ORDER BY views DESC LIMIT 6000`
          ),
        });

      // ---- When the site is read ------------------------------------------
      // Human requests in UTC-hour buckets. The page folds these into hour of
      // day and day of week. An hour is a coarse bucket and a share of many
      // readers; it identifies nobody.
      case "hourly":
        return json({
          rows: await query(
            env,
            `SELECT toStartOfInterval(timestamp, INTERVAL '1' HOUR) AS hour, ${VIEWS}
             FROM ${PAGEVIEWS} WHERE ${since} AND ${HUMAN}
             GROUP BY hour ORDER BY hour ASC LIMIT 2500`
          ),
        });

      // ---- Reach, without identifying anybody ---------------------------
      case "countries":
        return json({
          rows: await query(
            env,
            `SELECT blob3 AS country, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} AND ${HUMAN}
             GROUP BY country ORDER BY views DESC LIMIT 100`
          ),
        });

      case "locales":
        return json({
          rows: await query(
            env,
            `SELECT blob2 AS locale, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} AND ${HUMAN}
             GROUP BY locale ORDER BY views DESC`
          ),
        });

      default:
        return json(
          {
            error: "not_found",
            routes: ["pages", "item", "clients", "referrers", "sources", "timeline", "devices", "crawlers", "paths", "hourly", "countries", "locales"],
          },
          404
        );
    }
  } catch {
    // Never leak the upstream error: it can carry the account ID.
    return json({ error: "upstream_unavailable" }, 502);
  }
}
