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
             WHERE ${since} AND blob4 = 'human'
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
        const rows = await query(
          env,
          `SELECT ${VIEWS} FROM ${PAGEVIEWS}
           WHERE ${since} AND blob4 = 'human' AND blob1 = '${path.replace(/'/g, "")}'`
        );
        const first = rows[0] as { views?: string } | undefined;
        return json({ path, views: Number(first?.views ?? 0), sampled: true });
      }

      // ---- Humans versus automation, and the bot families --------------
      case "clients":
        return json({
          rows: await query(
            env,
            `SELECT blob4 AS client, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} GROUP BY client ORDER BY views DESC`
          ),
          note: "client 'human' is everything not matched as automation; the rest are bot families.",
        });

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
            `SELECT index1 AS host, ${VIEWS} FROM ${REFERRERS}
             WHERE ${since} GROUP BY host ORDER BY views DESC LIMIT 100`
          ),
        });
      }

      // ---- Reach, without identifying anybody ---------------------------
      case "countries":
        return json({
          rows: await query(
            env,
            `SELECT blob3 AS country, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} AND blob4 = 'human'
             GROUP BY country ORDER BY views DESC LIMIT 100`
          ),
        });

      case "locales":
        return json({
          rows: await query(
            env,
            `SELECT blob2 AS locale, ${VIEWS} FROM ${PAGEVIEWS}
             WHERE ${since} AND blob4 = 'human'
             GROUP BY locale ORDER BY views DESC`
          ),
        });

      default:
        return json(
          {
            error: "not_found",
            routes: ["pages", "item", "clients", "referrers", "countries", "locales"],
          },
          404
        );
    }
  } catch {
    // Never leak the upstream error: it can carry the account ID.
    return json({ error: "upstream_unavailable" }, 502);
  }
}
