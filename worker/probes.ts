/**
 * worker/probes.ts
 *
 * REQUESTS FOR PAGES THAT DO NOT EXIST (PRIME, 2026-10-07 21:06: "They don't
 * even belong in the category they're being shown in now as they are NOT pages
 * served to people - you seem to be counting 404").
 *
 * Until this module, the Worker counted a request before it looked the page
 * up, so a scanner asking for /wp-json/batch/v1 was redirected to
 * /en/wp-json/batch/v1/, counted, and only then answered 404. From the deploy
 * that introduced this file, every row carries the response's status (blob6,
 * worker/analytics.ts) and the people panels count only pages served. The rows
 * written before carry no status; for them, this module's legacy patterns
 * stand in, by path.
 *
 * Two things live here:
 *   1. PROBE_FAMILIES: what a request for a missing page was looking for, so
 *      the stats page can group them and explain each group. First match wins;
 *      a path that matches none is an honest miss (a moved address, a guess).
 *   2. LEGACY_LIKE and LEGACY_EXACT: the SQL that recognises, in the rows with
 *      no status, the requests that were not for a page. LIKE's "_" is a
 *      single-character wildcard in Analytics Engine SQL, with no escape, so
 *      the patterns avoid it wherever a real page could match ("openid_connect"
 *      would have matched /learn/openid-connect/); scripts/check-probe-patterns.mjs
 *      fails the build if any pattern or family matches a page of the build.
 *
 * THE LEGACY LIST HAS A SHELF LIFE. The longest window the stats page offers
 * is 90 days; once the status has been recorded for 90 days, no window reaches
 * a row without one, and LEGACY_LIKE, LEGACY_EXACT and their predicate can go.
 */

/** The groups of not-found requests the stats page explains, in display order. */
export type ProbeFamily =
  | "wp-batch"
  | "wp-plugin"
  | "wp-rest"
  | "wp-core"
  | "secrets"
  | "frameworks"
  | "laravel"
  | "platforms"
  | "backdoors"
  | "logins"
  | "exposure"
  | "ipfs"
  | "ai"
  | "crawlers"
  | "misses";

/** Each family and the pattern of the paths it holds (tested lower-cased, locale prefix included). Order matters.
 *  The families named by common words (admin, files, mcp, vendors...) are anchored one folder below the language,
 *  where the scanners ask: /en/vendors/ is a probe, /en/industry/vendors/ is a page (check-probe-patterns caught it). */
export const PROBE_FAMILIES: ReadonlyArray<{ id: ProbeFamily; re: RegExp }> = [
  // WordPress's REST batch endpoint, the entry of the wp2shell chain (CVE-2026-63030 with CVE-2026-60137).
  { id: "wp-batch", re: /\/wp-json\/batch\/v1\/?$/ },
  // A WordPress plugin's REST endpoint with a published flaw (Gravity SMTP, CVE-2026-4020).
  { id: "wp-plugin", re: /\/wp-json\/gravitysmtp\// },
  // The WordPress REST API's index and its content listings.
  { id: "wp-rest", re: /\/wp-json(\/wp\/v2\/[a-z]+)?\/?$/ },
  // WordPress's own folders, its usual install folders, and its feed address.
  // The install folders since 2026-11-02 also include site, news, cms and press: on this site's own counts (/stats, 30 and
  // 90 days, read 2026-11-02) each is asked bare about 800 times, in step with the same folder plus /wp-json/ and
  // /wp-json/batch/v1/, which is how the WordPress scanners look for an install in a subfolder. /blog/ is a real page here.
  { id: "wp-core", re: /\/(wp-admin|wp-includes|wp-content)(\/|$)|^\/[^/]+\/(wp|wordpress|site|news|cms|press)\/?$|^\/[^/]+\/feed\/?$/ },
  // Source code, keys and histories left in a folder the web server publishes (any dot-file but .well-known).
  { id: "secrets", re: /\/\.(?!well-known)[^/]+|\/ds_store\/?$/ },
  // Framework endpoints that reveal configuration or a version.
  // Since 2026-11-05 also the Actuator's own discovery page, /actuator bare (Spring Boot: "available on /actuator by
  // default"), and Symfony's profiler page /_profiler/phpinfo (WebProfilerBundle's /phpinfo route under the /_profiler
  // prefix its recipe mounts when@dev), both asked daily in the windows the currency checks of 3 and 5 November read.
  { id: "frameworks", re: /^\/[^/]+\/(actuator(\/[a-z]+)?|env|manage\/env|debug\/default\/view|magento_version|healthz|_profiler\/phpinfo)\/?$/ },
  // Laravel's own addresses (2026-11-05, the largest unexplained group in the 7- and 30-day windows read on 3 and 5
  // November): Livewire 3's update endpoint, bare or under any guessed prefixes (/login/, /register/, /admin/login/),
  // the Telescope, Horizon, Pulse and Nova dashboards, and the sign-in routes of Fortify and laravel/ui. Placed before
  // logins, so an address such as /admin/login/livewire/update is read as Livewire, not as a sign-in page.
  { id: "laravel", re: /^\/[^/]+\/(([a-z0-9_-]+\/)*livewire\/update|telescope|horizon|pulse|nova|two-factor-challenge|email\/verify|password\/reset)\/?$/ },
  // Folder names that identify another platform (Drupal, Joomla, OpenCart, Magento, cPanel, OJS).
  // Since 2026-11-05 also Next.js's build folder, _next/static, asked for under a guessed subfolder (/v1/, /client/,
  // /frontend/...): at least one folder is required between the language and _next, so this site's own /_next/static/
  // files, served at the root, can never match.
  { id: "platforms", re: /^\/[^/]+\/(administrator|admin\/controller\/extension\/extension|sites\/default\/files|user\/login|openid_connect\/cpanelid|plugins\/(generic|themes)|pub\/media|pub|modules)\/?$|^\/[^/]+\/([a-z0-9_-]+\/)+_next\/static\/?$/ },
  // Names of backdoors someone else may have planted.
  { id: "backdoors", re: /^\/[^/]+\/(modules\/mod_webshell|blocks\/rce(\/lang(\/en)?)?|blocks)\/?$/ },
  // Any sign-in or admin page to try passwords on.
  // Registration, password-reset and dashboard pages since 2026-11-02 (the most-requested unclassified addresses of the
  // 7- and 90-day windows read that day: /register/, /admin/login/, /forgot-password/, /auth/login/, /dashboard/).
  // Since 2026-11-05 also /auth/register and the admin sections behind a sign-in (users, settings, dashboard, reports,
  // orders, products), named exactly because "admin" alone is too common a word to follow with any folder.
  { id: "logins", re: /^\/[^/]+\/(admin|admin\/api|admin\/login|auth\/login|auth\/register|admin\/(users|settings|dashboard|reports|orders|products)|login|register|forgot-password|dashboard|manager|webmail|mail)\/?$/ },
  // Common folder names, forgotten copies of a site, and the well-known folder itself.
  { id: "exposure", re: /^\/[^/]+\/(staging|tmp|config|files?|images|uploads|pdf|new|newsite|vendors|published|submit|\.well-known)\/?$/ },
  // The path form of an IPFS gateway.
  { id: "ipfs", re: /\/ipfs\/[a-z0-9]+\/?$/ },
  // AI services: an MCP endpoint, or an OpenAI-style model list.
  { id: "ai", re: /^\/[^/]+\/(\.well-known\/(web)?mcp|mcp|docs\/mcp|v1\/models|models)\/?$/ },
  // Pages this site does not have: careers and jobs, shop and trade sign-up.
  { id: "crawlers", re: /^\/[^/]+\/((company|about|about-us)\/)?(careers|jobs|join-us|work-with-us)(\/(jobs|openings))?\/?$|^\/[^/]+\/(shop|stockist-registration|trade-account|wholesale-signup)\/?$/ },
];

/** The family of a path that is not a page: the first that matches, else an honest miss. */
export function probeFamily(path: string): ProbeFamily {
  // Lower-cased once: scanners vary the case ("Batch", "DS_Store").
  const p = path.toLowerCase();
  for (const f of PROBE_FAMILIES) if (f.re.test(p)) return f.id;
  return "misses";
}

/** ILIKE patterns that recognise, in rows written before the status was recorded, a request that was not for a page. */
export const LEGACY_LIKE: readonly string[] = [
  "%/wp-json%",
  "%/wp-admin%",
  "%/wp-includes%",
  "%/wp-content%",
  "%/wp/%",
  "%/wordpress/%",
  // Any segment that starts with a dot: .git, .aws, .env, .well-known, the shell histories, .DS_Store.
  "%/.%",
  "%/ds_store%",
  "%/ipfs/%",
  "%/actuator/%",
  "%/manage/env%",
  "%/debug/default/%",
  "%/magento_version%",
  "%/healthz%",
  "%/sites/default/%",
  "%/administrator%",
  "%/cpanelid%",
  "%/mod_webshell%",
  "%/blocks/rce%",
];

/** The other not-a-page paths seen in the 30- and 90-day windows read on 2026-10-07 (people's rows), named exactly
 *  because their words (admin, login, files, careers...) are too common to trust to a pattern. */
export const LEGACY_EXACT: readonly string[] = [
  "/de/contribute/tools/",
  "/en//pt-BR/learn/url-anatomy/",
  "/en/about-us/careers/",
  "/en/about/careers/",
  "/en/admin",
  "/en/admin/",
  "/en/admin/api/",
  "/en/admin/controller/extension/extension/",
  "/en/archive/sites/ntz-com-br-2013/",
  "/en/blocks/",
  "/en/careers",
  "/en/careers/",
  "/en/careers/jobs/",
  "/en/careers/openings/",
  "/en/company/careers/",
  "/en/config/",
  "/en/contribute/tools",
  "/en/contribute/tools/",
  "/en/docs/mcp/",
  "/en/env/",
  "/en/feed/",
  "/en/file/",
  "/en/files/",
  "/en/images/",
  "/en/industry/chapters/dec/",
  "/en/industry/chapters/ibm/",
  "/en/jobs/",
  "/en/join-us/",
  "/en/learn/bigip-persistence-cookies/",
  "/en/learn/edx/",
  "/en/learn/fortinet-soc-architecture-and-adversary-behaviour/index.txt/",
  "/en/learn/secure-headers-overview/index.txt/",
  "/en/login/",
  "/en/mail/",
  "/en/manager/",
  "/en/mcp/",
  "/en/models/",
  "/en/modules/",
  "/en/new/",
  "/en/newsite/",
  "/en/pdf/",
  "/en/plugins/generic/",
  "/en/plugins/themes/",
  "/en/pt-BR/learn/url-anatomy/",
  "/en/pub/",
  "/en/pub/media/",
  "/en/published/",
  "/en/shop/",
  "/en/staging/",
  "/en/stockist-registration/",
  "/en/submit/",
  "/en/tmp/",
  "/en/trade-account/",
  "/en/uploads/",
  "/en/user/login/",
  "/en/v1/models/",
  "/en/vendors/",
  "/en/webmail/",
  "/en/wholesale-signup/",
  "/en/work-with-us/",
];

/** A string as an SQL literal: the only quotes in these constants would be a mistake, so they are refused, not escaped. */
function literal(s: string): string {
  if (s.includes("'")) throw new Error(`probe pattern with a quote: ${s}`);
  return `'${s}'`;
}

/** The SQL predicate, on blob1 (the path), for a legacy row that was not a request for a page. */
export const LEGACY_NOT_A_PAGE = `(${LEGACY_LIKE.map((p) => `blob1 ILIKE ${literal(p)}`).join(" OR ")} OR blob1 IN (${LEGACY_EXACT.map(literal).join(", ")}))`;
