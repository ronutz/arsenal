/**
 * worker/events.ts
 *
 * The WRITE side of the interest counts (PRIME 12/11/2026 02:35): one small
 * endpoint, POST /api/e, that a page calls ONLY after the reader has said yes
 * to "count my use", and that writes one row naming a thing on the site and
 * what was done with it. The rules for what a row may hold live in
 * src/lib/interest/shape.ts and are read by the page and by this file alike.
 *
 * WHY A THIRD DATASET
 * -------------------
 * worker/analytics.ts keeps page requests and referrers in two datasets that
 * cannot be joined, so that an arrival cannot be reconstructed. The interest
 * counts follow the same rule: their own dataset, EVENTS, whose rows carry no
 * country, no device, no referrer, no bot class and no path. A row says "the
 * CIDR calculator was used, on a page in English". It cannot be laid beside a
 * pageview row to say who, from where, or after what.
 *
 *   EVENTS   kind, section, item, locale, detail      - never a country, a
 *                                                       device, a referrer, a
 *                                                       path, or an identifier
 *
 * WHAT IS NEVER WRITTEN
 * ---------------------
 * IP address. User agent. Cookie (the page sends none: it posts with
 * credentials omitted). Any value typed into a tool. The sampling index is the
 * kind, an axis of the report, never a visitor.
 *
 * WHAT IS READ AND NOT KEPT
 * -------------------------
 * The same headers worker/analytics.ts reads to tell a person's browser from
 * automation (the user agent, the fetch-metadata headers, the network's
 * number): a count from automation is dropped, and only that decision is used.
 * The Sec-GPC header: a browser that sends Global Privacy Control is not
 * counted even if a page somehow asked, the server-side half of the rule the
 * page applies before it ever asks for consent.
 *
 * WHAT THIS CANNOT PROMISE
 * ------------------------
 * The endpoint is public, as every page's own address is: anyone can post a
 * well-formed count, exactly as anyone can request a page a thousand times.
 * The mitigations are the ones the page counts have: automation is dropped by
 * class, a request from another site is refused, and the row's shape leaves
 * nothing worth forging. The counts are a guide to interest, not an audit.
 */

// The decision "a person's browser, or automation", shared with the page counts.
import { classifyClient } from "./analytics";
// The languages the site is published in (the single registry).
import { LIVE_LOCALE_CODES } from "../src/i18n/locales";
// What a count may hold, checked here exactly as the page checks it before sending.
import { checkInterest } from "../src/lib/interest/shape";

/** The binding this module needs. Optional, so a deployment without it (local dev, a preview) simply does not count. */
export interface EventsEnv {
  /** The interest counts' own Analytics Engine dataset (wrangler.jsonc: ronutz_events). */
  EVENTS?: EventsDataset;
}

/** The one method of an Analytics Engine dataset this module calls. */
interface EventsDataset {
  /** Write one row; returns at once, the runtime flushes in the background. */
  writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

/** The endpoint's address. Short on purpose: it is sent from every counted action. */
export const EVENTS_PATH = "/api/e";

/** The largest body read, in bytes: a count is five short fields, so anything longer is not one. */
const MAX_BODY = 512;

/** An answer with no body and no caching: accepted and dropped counts look the same from outside. */
const empty = (status: number, extra: Record<string, string> = {}) =>
  new Response(null, { status, headers: { "cache-control": "no-store", ...extra } });

/**
 * Read a request's body as text, stopping as soon as it is longer than the limit: an oversized body is never held
 * in memory whole, whether or not it declared its length. Exported (12/11/2026) so the desk's sync route
 * (worker/desk.ts) reads its bodies the same way.
 *
 * @param request the request
 * @param max the most bytes a body may have
 * @returns the text, or null when the body is longer than the limit
 */
export async function readCapped(request: Request, max: number): Promise<string | null> {
  // No body at all reads as empty text.
  const reader = request.body?.getReader();
  if (!reader) return "";
  // The pieces as they arrive, and their size so far.
  const pieces: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    // The next piece.
    const { done, value } = await reader.read();
    if (done) break;
    // Past the limit: stop reading, and say so.
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    pieces.push(value);
  }
  // The pieces as one run of bytes.
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const piece of pieces) { bytes.set(piece, at); at += piece.byteLength; }
  // As text.
  return new TextDecoder().decode(bytes);
}

/**
 * Answer POST /api/e, or return null for any other address so the Worker goes on to its other routes.
 *
 * @param request the request
 * @param url its parsed address
 * @param env the Worker's bindings
 * @returns the answer, or null when the address is not this endpoint's
 */
export async function handleEvent(request: Request, url: URL, env: EventsEnv): Promise<Response | null> {
  // Not this endpoint.
  if (url.pathname !== EVENTS_PATH) return null;
  // Counts are posted; nothing is read from here.
  if (request.method !== "POST") return empty(405, { allow: "POST" });

  // ---- Same site only ------------------------------------------------------
  // A browser says where a request came from in two headers. A count is only ever sent by the site's own pages, so
  // a request another site's page made is refused. (A script outside a browser can leave both out; see the note at
  // the top on what this cannot promise.)
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return empty(403);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return empty(403);

  // ---- The body: small, JSON, five text fields -----------------------------
  // The declared length first, so an oversized body is never read at all.
  const length = request.headers.get("content-length");
  if (length !== null && !(Number(length) <= MAX_BODY)) return empty(413);
  // The text, read no further than the limit whatever was declared (a body may declare nothing, or lie).
  let text: string | null = "";
  try {
    text = await readCapped(request, MAX_BODY);
  } catch {
    return empty(400); // a body that cannot be read is not a count
  }
  // Longer than a count can be.
  if (text === null) return empty(413);
  // Parsed.
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return empty(400); // not JSON
  }
  // Checked against every rule in src/lib/interest/shape.ts; a payload that breaks one is refused, never repaired.
  const row = checkInterest(payload, LIVE_LOCALE_CODES);
  if (!row) return empty(400);

  // ---- Dropped quietly: Global Privacy Control, automation, no dataset -----
  // From here on the answer is 204 whether or not a row is written, so the page learns nothing from it and a script
  // probing the endpoint cannot tell an accepted count from a dropped one.
  // A browser that sends Global Privacy Control is not counted (the page does not even ask it for consent).
  if (request.headers.get("sec-gpc") === "1") return empty(204);
  // Automation is not interest. The headers are read here and not kept; only the decision is used.
  if (classifyClient(request) !== "human") return empty(204);
  // No dataset bound on this deployment: nothing to write to.
  if (!env.EVENTS) return empty(204);

  // ---- The row -------------------------------------------------------------
  // Wrapped: a fault while counting must never surface to the page that sent the count.
  try {
    env.EVENTS.writeDataPoint({
      // blob1 kind, blob2 section, blob3 item, blob4 locale, blob5 detail. Nothing else, ever.
      blobs: [row.kind, row.section, row.item, row.locale, row.detail],
      // One use.
      doubles: [1],
      // Sampled per kind, an axis of the report; never a visitor identifier.
      indexes: [row.kind],
    });
  } catch {
    /* counting never breaks the page */
  }
  // Counted (or not): no body, never cached.
  return empty(204);
}
