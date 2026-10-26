// ============================================================================
// src/config/providerSources.ts
// ----------------------------------------------------------------------------
// WHAT THE HOST DOES, WITH ITS OWN DOCUMENTATION (privacy round 3, 2026-10-26).
//
// PRIME decided on 26/10/2026 that the Privacy page discloses two things the
// site's own code cannot show and does not do, both done by Cloudflare as the
// host:
//   1. Workers Logs. wrangler.jsonc has no `observability` block, and
//      Cloudflare turns Workers Logs on by default for new Workers, so every
//      request that passes through the site's Worker may leave a record in the
//      account for up to seven days.
//   2. The bot check. Live pages read on 26/10/2026 carry Cloudflare's
//      JavaScript Detections snippet (/cdn-cgi/challenge-platform/scripts/jsd/
//      main.js, inside a hidden 1x1 iframe), and Cloudflare documents the
//      `__cf_bm` and `cf_clearance` cookies that go with its bot products.
//   3. Network Error Logging (ANVIL follow-up, same day, PRIME's standing
//      choice of disclosure). Every live response carries Cloudflare's `NEL`
//      and `Report-To` headers (success_fraction 0.0, max_age 604800, reports
//      to a.nel.cloudflare.com); neither public/_headers nor the Worker sets
//      them, and nothing of the site's receives the reports.
//
// The page cites Cloudflare's own pages for each fact, with the day they were
// read, the way src/config/countingSource.ts does for the count. The addresses
// live here, once, so the page and the guard that holds it
// (scripts/check-counting-source.mjs) read the same list.
//
// The read date is the day the pages were downloaded with curl and checked:
// all HTTP 200, saved with the notes of this change. Each URL is a page's
// canonical address; the copy read was its Markdown twin (index.md).
// ============================================================================

/** Cloudflare, Workers Logs: on by default for new Workers, what an invocation log holds, retention by plan. */
export const WORKERS_LOGS_SOURCE = "https://developers.cloudflare.com/workers/observability/logs/workers-logs/";

/** Cloudflare, Query Builder: names the fields of a log event (request path, response status, CPU time, country). */
export const WORKERS_LOGS_FIELDS_SOURCE = "https://developers.cloudflare.com/workers/observability/query-builder/";

/** Cloudflare, Observability pricing: seven-day retention on Free and Paid from 1 December 2026. */
export const WORKERS_LOGS_RETENTION_SOURCE = "https://developers.cloudflare.com/observability/pricing/";

/** Cloudflare, JavaScript Detections: the script injected into HTML pages, whose result is kept in cf_clearance. */
export const BOT_SCRIPT_SOURCE = "https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/";

/** Cloudflare, Cloudflare Cookies: __cf_bm's purpose and lifetime, strictly necessary, processing in the United States. */
export const BOT_COOKIES_SOURCE = "https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/";

/** Cloudflare, Clearance: cf_clearance is tied to the visitor and device it was issued to. */
export const BOT_CLEARANCE_SOURCE = "https://developers.cloudflare.com/cloudflare-challenges/concepts/clearance/";

/** Cloudflare, Challenge Passage: cf_clearance lives 30 minutes by default (a zone setting the code cannot see). */
export const BOT_PASSAGE_SOURCE = "https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/challenge-passage/";

/** Cloudflare, Network Error Logging: the NEL / Report-To headers, a report's contents, what Cloudflare keeps of the IP. */
export const NEL_SOURCE = "https://developers.cloudflare.com/network-error-logging/";

/** W3C, Network Error Logging (Working Draft): what success_fraction, failure_fraction and max_age mean. */
export const NEL_SPEC_SOURCE = "https://w3c.github.io/network-error-logging/";

/** The day the nine pages above, and the live headers the NEL paragraph quotes, were read (ISO date). */
export const PROVIDER_SOURCES_READ = "2026-10-26";
