/**
 * worker/analytics.ts
 *
 * Server-side, cookie-free, script-free request counting for ronutz.com.
 *
 * WHY THIS SHAPE
 * --------------
 * PRIME asked for three things at once: page counts, a referrer report that
 * keeps query strings, and bot statistics broken down by family. The obvious
 * implementation writes one wide row per request carrying all of it, and that
 * implementation is the one thing we must not build, because a row containing
 * both a referrer and a country and a path is a row that can be correlated. A
 * single visitor's arrival becomes reconstructable from the columns sitting
 * next to each other.
 *
 * So the design is DISJOINT DATASETS. Each request may produce up to two rows,
 * in separate datasets, and no row carries a field from another's subject:
 *
 *   PAGEVIEWS  path, locale, country, bot-class      - never a referrer
 *   REFERRERS  referring URL only                    - never a path, never a
 *                                                      country, never a bot
 *                                                      class, never a time
 *                                                      correlation we expose
 *
 * The referrer row is deliberately impoverished. It records that a referrer
 * was seen, and nothing whatever about who saw it or what they then read. That
 * is what "without associating it to any other data point" has to mean if it
 * is to mean anything: not a promise about how we query, but an absence of the
 * columns that would make the query possible.
 *
 * WHAT IS NEVER WRITTEN, ANYWHERE
 * -------------------------------
 * IP address. User agent string. Any header other than the two read below.
 * No identifier of any kind is used as the sampling index; the index is the
 * path (for pageviews) or the referring host (for referrers), because those
 * are the axes we group by and they describe the site, not the person.
 *
 * The canonical Analytics Engine example found in circulation uses
 * `cf-connecting-ip` as the index. Copying it here would write a visitor
 * identifier as the primary key of the dataset, which is exactly the property
 * this site exists to not have. It is called out so nobody restores it.
 *
 * REFERRER HAZARD, STATED PLAINLY
 * -------------------------------
 * Query strings are kept because PRIME asked for them: they carry the campaign
 * and search parameters that answer "where does traffic come from". They can
 * also carry other people's data, because we do not control the pages that
 * link here - a referring URL can contain someone's search terms or, on a
 * badly built site, a token. Two mitigations are applied and neither is
 * perfect: the value is length-capped, and the whole row is unjoinable by
 * construction. The residual risk is documented rather than hidden.
 */

/** Bindings this module needs. Both are optional so the Worker runs without
 *  analytics configured - local dev, previews, and any deploy where the
 *  datasets are not bound simply skip collection. */
export interface AnalyticsEnv {
  PAGEVIEWS?: AnalyticsEngineDataset;
  REFERRERS?: AnalyticsEngineDataset;
}

interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

/** Referrer values are capped rather than truncated silently at the storage
 *  layer, so the cap is a decision recorded here rather than an accident. */
const MAX_REFERRER = 512;

// ---------------------------------------------------------------------------
// REFERRER SOURCE + SEARCH TERM (PRIME 2026-09-06)
//
// What IS reliably in the Referer is the HOST - the major engines stopped
// sending the query years ago - and classifying the host into a source family
// (search, AI assistant, social, other) is the report that can be produced.
// Search TERMS come from Search Console, not from headers; a term-extraction
// step was built and removed on 2026-09-06 for that reason.
// ---------------------------------------------------------------------------

/** Referring host -> source family. Longest-match on suffix; unknown -> "other". */
const REFERRER_SOURCES: Array<[string, string]> = [
  // search
  ["google.", "search:google"], ["bing.com", "search:bing"], ["duckduckgo.com", "search:duckduckgo"],
  ["yandex.", "search:yandex"], ["baidu.com", "search:baidu"], ["yahoo.", "search:yahoo"],
  ["ecosia.org", "search:ecosia"], ["brave.com", "search:brave"], ["startpage.com", "search:startpage"],
  ["qwant.com", "search:qwant"], ["kagi.com", "search:kagi"],
  // AI assistants that link out
  ["perplexity.ai", "ai:perplexity"], ["chatgpt.com", "ai:openai"], ["openai.com", "ai:openai"],
  ["claude.ai", "ai:anthropic"], ["anthropic.com", "ai:anthropic"], ["gemini.google.com", "ai:google"],
  ["copilot.microsoft.com", "ai:microsoft"], ["you.com", "ai:you"], ["phind.com", "ai:phind"],
  // social / community
  ["linkedin.com", "social:linkedin"], ["lnkd.in", "social:linkedin"], ["x.com", "social:x"],
  ["twitter.com", "social:x"], ["t.co", "social:x"], ["facebook.com", "social:facebook"],
  ["reddit.com", "social:reddit"], ["news.ycombinator.com", "social:hackernews"],
  ["youtube.com", "social:youtube"], ["mastodon.", "social:mastodon"], ["bsky.app", "social:bluesky"],
];

function classifyReferrer(host: string): string {
  const h = host.toLowerCase();
  // gemini.google.com must win over google.; check longer patterns first
  const ordered = [...REFERRER_SOURCES].sort((a, b) => b[0].length - a[0].length);
  for (const [needle, family] of ordered) {
    if (h === needle || h.endsWith("." + needle) || h.includes(needle)) return family;
  }
  return "other";
}



/** Paths that are machinery rather than reading. Counting them would inflate
 *  every figure and answer no question anyone has. */
const IGNORED = [/^\/api\//, /^\/_next\//, /^\/pagefind\//, /\.[a-z0-9]+$/i];

/**
 * Classify the client into a bot family.
 *
 * Cloudflare's bot management supplies a verified-bot flag and a category on
 * `request.cf`; where it is present we trust it, because it is authenticated
 * against published crawler IP ranges rather than a claimed name. Where it is
 * absent (it is not on every plan) we fall back to a small, explicit
 * user-agent table.
 *
 * IMPORTANT: the user agent is read to DERIVE this label and is never itself
 * stored. What lands in the dataset is one of the short strings below - a
 * classification, not a fingerprint.
 */
const UA_FAMILIES: Array<[RegExp, string]> = [
  [/googlebot|google-inspectiontool|storebot-google/i, "search:google"],
  [/bingbot|adidxbot|bingpreview/i, "search:bing"],
  [/duckduckbot/i, "search:duckduckgo"],
  [/yandex(bot|images)/i, "search:yandex"],
  [/baiduspider/i, "search:baidu"],
  [/applebot/i, "search:apple"],
  [/gptbot|oai-searchbot|chatgpt-user/i, "ai:openai"],
  [/claudebot|anthropic-ai|claude-web/i, "ai:anthropic"],
  [/perplexitybot|perplexity-user/i, "ai:perplexity"],
  [/google-extended|bard|gemini/i, "ai:google"],
  [/ccbot/i, "ai:commoncrawl"],
  [/bytespider|amazonbot|meta-externalagent|facebookbot/i, "ai:other"],
  [/ahrefsbot|semrushbot|mj12bot|dotbot|dataforseo/i, "seo"],
  [/uptimerobot|pingdom|statuscake|betteruptime/i, "monitor"],
  [/slackbot|discordbot|twitterbot|whatsapp|telegrambot|linkedinbot/i, "preview"],
  [/curl|wget|python-requests|go-http-client|axios|node-fetch/i, "tool"],
  [/bot|crawler|spider|crawl/i, "other"],
];


/**
 * Coarse device class from the User-Agent, for a mobile-versus-desktop share.
 * The UA string is READ here and NEVER STORED, exactly as classifyClient does
 * for bots: the only thing written is one of three words. Tablets count as
 * mobile; anything unrecognised is "other" rather than guessed.
 */
export function classifyDevice(request: Request): string {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua) return "other";
  if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(ua)) return "mobile";
  if (/Windows NT|Macintosh|X11|Linux|CrOS/i.test(ua)) return "desktop";
  return "other";
}

export function classifyClient(request: Request): string {
  const cf = (request as { cf?: Record<string, unknown> }).cf;
  const bm = cf?.botManagement as
    | { verifiedBot?: boolean; score?: number; corporateProxy?: boolean }
    | undefined;

  const ua = request.headers.get("user-agent") ?? "";

  // A verified bot is authenticated by Cloudflare against the crawler's own
  // published ranges, so the family label from the user agent is trustworthy
  // in that case and is worth keeping at full specificity.
  if (bm?.verifiedBot) {
    for (const [re, family] of UA_FAMILIES) if (re.test(ua)) return family;
    return "verified:other";
  }

  for (const [re, family] of UA_FAMILIES) if (re.test(ua)) return family;

  // Bot score, where present, runs 1 (certainly automated) to 99 (certainly
  // human). Anything low that did not match a known family is unidentified
  // automation, which is a useful category of its own.
  if (typeof bm?.score === "number" && bm.score <= 30) return "unverified";

  // BROWSER CONSISTENCY (2026-09-06). Without Bot Management the score above
  // is absent, and the first day of live data showed why that matters: about
  // 29,000 of 31,000 "human" requests in a week came from one country, from
  // clients presenting a browser User-Agent. A real browser sends the
  // Sec-Fetch-* headers on navigations (every current engine does) and, in
  // practice, Accept-Language. A headless client wearing a browser's name
  // very often sends neither. Presenting as a browser while lacking BOTH is
  // classed as unverified rather than human. The headers are read and not
  // stored; the only thing written is the word. Old browsers, some privacy
  // tools and curl-with-a-fake-UA will land here too, which is why the class
  // is called "unverified" and not "bot".
  if (/Mozilla\//.test(ua)) {
    const hasFetchMeta = !!request.headers.get("sec-fetch-mode");
    const hasLanguage = !!request.headers.get("accept-language");
    if (!hasFetchMeta && !hasLanguage) return "unverified:headless";
  }

  return "human";
}

/**
 * Record one request. Fire-and-forget by design: writeDataPoint returns
 * immediately and the runtime flushes in the background, so this adds no
 * latency to the response and must never be awaited.
 */
export function record(
  request: Request,
  url: URL,
  locale: string,
  env: AnalyticsEnv
): void {
  if (request.method !== "GET") return;
  for (const re of IGNORED) if (re.test(url.pathname)) return;

  const botClass = classifyClient(request);

  // ---- Row 1: the pageview. No referrer here, ever. ----------------------
  if (env.PAGEVIEWS) {
    const country =
      ((request as { cf?: Record<string, unknown> }).cf?.country as string) ??
      "XX";
    // blob5: device class, humans only (a crawler has no screen). Empty on
    // rows written before 2026-09-06.
    const device = botClass === "human" ? classifyDevice(request) : "";
    env.PAGEVIEWS.writeDataPoint({
      blobs: [url.pathname, locale, country, botClass, device],
      doubles: [1],
      // Sampling key is the PATH. Never a visitor identifier.
      indexes: [url.pathname],
    });
  }

  // ---- Row 2: the referrer, alone. ---------------------------------------
  // Written only for human traffic: a crawler's referrer says nothing about
  // where readers come from, and including it would corrupt the one report
  // this row exists to produce.
  if (env.REFERRERS && botClass === "human") {
    const raw = request.headers.get("referer");
    if (raw) {
      let host = "";
      try {
        const r = new URL(raw);
        // Self-referrals are internal navigation, not a traffic source.
        if (r.host === url.host) return;
        host = r.host;
      } catch {
        return; // unparseable referrer: discard rather than store a fragment
      }
      // Source family and search term derived from the referrer itself -
      // still nothing about the visitor, the page, or the country. blob2 and
      // blob3 are empty on rows written before 2026-09-06.
      const source = classifyReferrer(host);
      env.REFERRERS.writeDataPoint({
        // The full referring URL, query string included, per PRIME's request -
        // and NOTHING else. No path, no country, no class, no locale.
        // blob3 (a search term) was added and removed the same day: engines
        // no longer send one, and a field nothing reads is collection without
        // purpose. Search terms come from Search Console.
        blobs: [raw.slice(0, MAX_REFERRER), source],
        doubles: [1],
        // Grouped by referring host, which is the axis the report uses.
        indexes: [host],
      });
    }
  }
}
