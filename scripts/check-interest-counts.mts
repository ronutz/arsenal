// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-interest-counts.mts
// ----------------------------------------------------------------------------
// PRE-BUILD GUARD (12/11/2026): the interest counts keep the promises the
// privacy page makes about them. The page says a count names a thing on the
// site and what was done with it, that nothing is written for a browser that
// sends Global Privacy Control or for automation, that the words of a search
// are kept only when the search found nothing and the words are plain, and
// that those words are never in a public answer. This guard runs the Worker's
// own code (worker/events.ts, worker/intel.ts, worker/rollup.ts) and the
// shared rules (src/lib/interest/shape.ts) against stand-ins, with no network
// and no secrets, and fails the build when any of those stops being true:
//
//   1. the rules: what plainSearchTerm keeps and refuses; what checkInterest
//      accepts and refuses;
//   2. the write: a good count writes ONE row of exactly five text fields and
//      nothing else; a count from another site, from automation, or from a
//      browser sending Global Privacy Control writes none; a search's words
//      that are not plain are dropped before the row is written;
//   3. the read: the words of searches are answered only to the operator's
//      key, and no public route's answer contains them;
//   4. the adding-up: a day is replaced whole, in one batch, and an address
//      is split into language and section as the trend panels expect;
//   5. the "save" kind (My desk, 12/11/2026): a save names a section and an
//      item and carries no detail, is written as one row like every other
//      kind, and reaches the per-day and per-item answers the panels read.
// Prints what it checked.
// ============================================================================

// The rules shared by the page and the Worker.
import { INTEREST_DETAILS, INTEREST_KINDS, checkInterest, pageItem, plainSearchTerm } from "../src/lib/interest/shape";
// The write side.
import { handleEvent } from "../worker/events";
// The read side.
import { handleIntel } from "../worker/intel";
// The daily adding-up.
import { rollupDay, sectionOf, shiftDay } from "../worker/rollup";
// The languages the site is published in.
import { LIVE_LOCALE_CODES } from "../src/i18n/locales";

/** The guard's name in its output. */
const TAG = "[check-interest-counts]";
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

// ---- 1. The rules -----------------------------------------------------------
// Kept: a few plain words.
for (const [q, want] of [["BFD echo", "bfd echo"], ["802.1x", "802.1x"], ["  rfc   9293 ", "rfc 9293"], ["segurança de borda", "segurança de borda"], ["c++", "c++"], ["TCP/IP", "tcp/ip"], ["node.js", "node.js"], ["man-in-the-middle", "man-in-the-middle"]] as const) {
  check(plainSearchTerm(q) === want, `plainSearchTerm keeps "${q}" as "${want}"`);
}
// Refused: an address, an e-mail address, a long number, a token, a sentence, an injection, nothing at all.
for (const q of ["10.20.30.40", "someone@example.com", "55 11 91234 5678", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "how do i configure the thing on my router", "<script>alert(1)</script>", "a' OR 1=1", "{count}", "", "   ",
  // A short IP address (four digits only), a host name with a subdomain, an address with a path, a hardware address.
  "10.0.0.1", "fw01.corp.example.com", "example.com/login", "https://example.com", "aa-bb-cc-dd-ee-ff", "a/b/c"]) {
  check(plainSearchTerm(q) === "", `plainSearchTerm refuses "${q}"`);
}
// Accepted counts.
check(checkInterest({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "" }, LIVE_LOCALE_CODES) !== null, "checkInterest accepts a tool use");
check(checkInterest({ k: "game_end", s: "fun", i: "patch-path", l: "pt-BR", d: "won" }, LIVE_LOCALE_CODES) !== null, "checkInterest accepts a won round");
check(checkInterest({ k: "search", s: "site", i: "empty", l: "en", d: "bfd echo" }, LIVE_LOCALE_CODES)?.detail === "bfd echo", "checkInterest keeps the plain words of an empty search");
// Refused or stripped counts.
check(checkInterest({ k: "search", s: "site", i: "hit", l: "en", d: "bfd echo" }, LIVE_LOCALE_CODES)?.detail === "", "checkInterest drops the words of a search that found something");
check(checkInterest({ k: "search", s: "site", i: "empty", l: "en", d: "10.20.30.40" }, LIVE_LOCALE_CODES)?.detail === "", "checkInterest drops words that are not plain");
check(checkInterest({ k: "search", s: "site", i: "empty", l: "en", d: "BFD Echo" }, LIVE_LOCALE_CODES)?.detail === "", "checkInterest drops words not already in kept form");
check(checkInterest({ k: "page_view", s: "tools", i: "cidr", l: "en", d: "" }, LIVE_LOCALE_CODES) === null, "checkInterest refuses a kind outside the list");
check(checkInterest({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "10.0.0.0/8" }, LIVE_LOCALE_CODES) === null, "checkInterest refuses a detail on a kind that has none (a tool's input)");
check(checkInterest({ k: "tool_use", s: "tools", i: "../../etc", l: "en", d: "" }, LIVE_LOCALE_CODES) === null, "checkInterest refuses an item that is not a slug");
check(checkInterest({ k: "tool_use", s: "tools", i: "cidr", l: "xx", d: "" }, LIVE_LOCALE_CODES) === null, "checkInterest refuses a language the site does not publish");
check(checkInterest({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "", id: "visitor-1" }, LIVE_LOCALE_CODES) !== null &&
  !("id" in (checkInterest({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "", id: "visitor-1" }, LIVE_LOCALE_CODES) as object)), "checkInterest carries no extra field into the row");
// The address of a page names its section and item.
check(JSON.stringify(pageItem("/en/tools/cidr/")) === JSON.stringify({ section: "tools", item: "cidr" }), "pageItem reads a tool's address");
check(JSON.stringify(pageItem("/pt-BR/dev/fun/patch-path/")) === JSON.stringify({ section: "fun", item: "patch-path" }), "pageItem reads a puzzle's address");
check(JSON.stringify(pageItem("/en/arcade/whack-a-bug/")) === JSON.stringify({ section: "fun", item: "whack-a-bug" }), "pageItem reads an arcade game's address");
// The save kind (My desk, 12/11/2026): in the list, with no fixed words of its own.
check((INTEREST_KINDS as readonly string[]).includes("save") && INTEREST_DETAILS["save"] === undefined, "save is a kind, and carries no detail words");
// A save of an item of every section is accepted, as the item's section and slug.
for (const [s, i] of [["tools", "cidr"], ["learn", "tftp"], ["glossary", "bfd"], ["fun", "patch-path"], ["site", "traffic-diversion"]] as const) {
  check(JSON.stringify(checkInterest({ k: "save", s, i, l: "en", d: "" }, LIVE_LOCALE_CODES)) === JSON.stringify({ kind: "save", section: s, item: i, locale: "en", detail: "" }), `checkInterest accepts a save in ${s}`);
}
// A save that carries anything else is refused: a detail (how or where it was saved), an item that is not a slug.
check(checkInterest({ k: "save", s: "learn", i: "tftp", l: "en", d: "path" }, LIVE_LOCALE_CODES) === null, "checkInterest refuses a save with a detail");
check(checkInterest({ k: "save", s: "learn", i: "learn:tftp", l: "en", d: "" }, LIVE_LOCALE_CODES) === null, "checkInterest refuses a save whose item is not a slug");

// ---- 2. The write -------------------------------------------------------------
/** The rows the stand-in dataset received. */
const written: Array<{ blobs?: string[]; doubles?: number[]; indexes?: string[] }> = [];
/** A stand-in for the Analytics Engine dataset. */
const dataset = { writeDataPoint: (row: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => { written.push(row); } };
/** The headers a person's browser sends with a count from one of the site's own pages. */
const BROWSER = {
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "accept-language": "en-GB,en;q=0.9",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  origin: "https://ronutz.com",
  "content-type": "text/plain;charset=UTF-8",
};

/**
 * Post one count to the Worker's handler.
 *
 * @param body the body, as text
 * @param headers the request's headers
 * @param method the method
 * @returns the status and how many rows were written by this call
 */
async function post(body: string, headers: Record<string, string> = BROWSER, method = "POST"): Promise<{ status: number; rows: number }> {
  // Rows before.
  const before = written.length;
  // The request, its length declared as a browser declares it.
  const req = new Request("https://ronutz.com/api/e", { method, headers: method === "POST" ? { ...headers, "content-length": String(new TextEncoder().encode(body).length) } : headers, body: method === "POST" ? body : undefined });
  // Answered.
  const res = await handleEvent(req, new URL(req.url), { EVENTS: dataset });
  // The status and the rows this call wrote.
  return { status: res?.status ?? 0, rows: written.length - before };
}

// A good count: 204 and exactly one row of five text fields, one double, the kind as the index.
{
  const r = await post(JSON.stringify({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "" }));
  const row = written[written.length - 1];
  check(r.status === 204 && r.rows === 1, "a good count is answered 204 and writes one row");
  check(JSON.stringify(row?.blobs) === JSON.stringify(["tool_use", "tools", "cidr", "en", ""]), "the row holds exactly kind, section, item, language, detail");
  check(JSON.stringify(row?.doubles) === "[1]" && JSON.stringify(row?.indexes) === JSON.stringify(["tool_use"]), "the row counts one and is indexed by its kind");
}
// A save: 204 and one row of the same five fields, indexed by its kind.
{
  const r = await post(JSON.stringify({ k: "save", s: "learn", i: "tftp", l: "pt-BR", d: "" }));
  const row = written[written.length - 1];
  check(r.status === 204 && r.rows === 1 && JSON.stringify(row?.blobs) === JSON.stringify(["save", "learn", "tftp", "pt-BR", ""]) && JSON.stringify(row?.indexes) === JSON.stringify(["save"]), "a save is written as one row: kind, section, item, language, no detail");
}
// A search that found nothing, with words that are not plain: the row is written without them.
{
  const r = await post(JSON.stringify({ k: "search", s: "site", i: "empty", l: "en", d: "192.168.10.20" }));
  check(r.rows === 1 && written[written.length - 1]?.blobs?.[4] === "", "words that are not plain never reach the row");
}
// Global Privacy Control: answered the same, nothing written.
{
  const r = await post(JSON.stringify({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "" }), { ...BROWSER, "sec-gpc": "1" });
  check(r.status === 204 && r.rows === 0, "a browser sending Global Privacy Control is not counted");
}
// Automation: answered the same, nothing written.
{
  const r = await post(JSON.stringify({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "" }), { "user-agent": "curl/8.5.0" });
  check(r.status === 204 && r.rows === 0, "automation is not counted");
}
// Another site's page: refused.
{
  const r = await post(JSON.stringify({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "" }), { ...BROWSER, "sec-fetch-site": "cross-site", origin: "https://elsewhere.example" });
  check(r.status === 403 && r.rows === 0, "a count from another site is refused");
}
// Not a count: refused, nothing written.
for (const [body, why] of [["not json", "a body that is not JSON"], [JSON.stringify({ k: "tool_use" }), "a body with fields missing"], [JSON.stringify({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "x".repeat(600) }), "an oversized body"]] as const) {
  const r = await post(body);
  check((r.status === 400 || r.status === 413) && r.rows === 0, `${why} is refused`);
}
// Reading is not offered.
{
  const r = await post("", BROWSER, "GET");
  check(r.status === 405 && r.rows === 0, "the endpoint answers only POST");
}
// An oversized body that does not declare its length is refused all the same (the read stops at the limit).
{
  const before = written.length;
  const req = new Request("https://ronutz.com/api/e", { method: "POST", headers: BROWSER, body: JSON.stringify({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "x".repeat(5000) }) });
  const res = await handleEvent(req, new URL(req.url), { EVENTS: dataset });
  check(res?.status === 413 && written.length === before, "an oversized body with no declared length is refused");
}
// A good count that does not declare its length is still counted.
{
  const before = written.length;
  const req = new Request("https://ronutz.com/api/e", { method: "POST", headers: BROWSER, body: JSON.stringify({ k: "tool_use", s: "tools", i: "cidr", l: "en", d: "" }) });
  const res = await handleEvent(req, new URL(req.url), { EVENTS: dataset });
  check(res?.status === 204 && written.length === before + 1, "a good count with no declared length is counted");
}

// ---- 3. The read ----------------------------------------------------------------
/** The SQL the Worker sent to the stand-in SQL API. */
const sent: string[] = [];
// The stand-in SQL API: every read answers with rows that carry a search's words, to see where they come out.
globalThis.fetch = (async (_input: unknown, init?: { body?: unknown }) => {
  // The statement.
  sent.push(String(init?.body ?? ""));
  // Rows as the interest dataset would answer them, a secret word in every text field a query might select.
  return new Response(JSON.stringify({ data: [{ kind: "search", section: "site", item: "empty", detail: "secretword", term: "secretword", locale: "en", n: "3", day: "2026-11-11 00:00:00", views: "7", path: "/en/tools/cidr/", client: "human", host: "www.google.com" }] }), { status: 200 });
}) as typeof fetch;
/** Bindings for the read side: credentials the stand-in never checks, and the operator's key. */
const readEnv = { CF_ACCOUNT_ID: "account", CF_ANALYTICS_TOKEN: "token", STATS_DETAIL_KEY: "operator-key" };

/**
 * Ask the read side for a route.
 *
 * @param path the route and its query
 * @param key the operator's key to send, if any
 * @returns the status and the body's text
 */
async function read(path: string, key?: string): Promise<{ status: number; text: string }> {
  // The request.
  const req = new Request(`https://ronutz.com/api/stats/${path}`, { headers: key ? { "x-stats-key": key } : {} });
  // Answered.
  const res = await handleIntel(req, new URL(req.url), readEnv);
  // Its status and text.
  return { status: res?.status ?? 0, text: res ? await res.text() : "" };
}

// The words are answered to the key only.
check((await read("searches?window=30d")).status === 401, "the words of searches are refused without the operator's key");
check((await read("searches?window=30d", "wrong-key-xx")).status === 401, "the words of searches are refused with a wrong key");
{
  const r = await read("searches?window=30d", "operator-key");
  check(r.status === 200 && r.text.includes("secretword"), "the words of searches are answered to the operator's key");
}
// No public route's answer holds them.
for (const route of ["interest?window=30d", "pulse?window=30d"]) {
  const r = await read(route);
  check(r.status === 200 && !r.text.includes("secretword"), `the public route ${route.split("?")[0]} never answers a search's words`);
}
// Nor do the daily totals' public answers, whatever a row of the database holds.
{
  /** A stand-in database whose every row carries a search's words in every text field. */
  const wordy = {
    prepare: () => {
      // One statement that answers the same row whatever is bound.
      const st = { bind: () => st, all: async () => ({ results: [{ day: "2026-11-11", kind: "search", section: "site", item: "empty", detail: "secretword", term: "secretword", n: 3 }, { day: "2026-11-11", kind: "search:empty", n: 3 }, { day: "2026-11-11", kind: "secretword", n: 1 }] }) };
      return st;
    },
  };
  for (const series of ["items", "events"]) {
    // The request, answered with the stand-in database bound and the operator's key sent.
    const req = new Request(`https://ronutz.com/api/stats/history?series=${series}&days=30`, { headers: { "x-stats-key": "operator-key" } });
    const res = await handleIntel(req, new URL(req.url), { ...readEnv, SCORES: wordy as never });
    const text = res ? await res.text() : "";
    check(res?.status === 200 && !text.includes("secretword") && text.includes("search"), `the daily totals' "${series}" answer never holds a search's words`);
    check((res?.headers.get("cache-control") ?? "").includes("no-store"), `the daily totals' "${series}" answer is never cached`);
  }
  // Without the key the daily totals are not read at all (every read of them walks the database).
  {
    const req = new Request("https://ronutz.com/api/stats/history?series=sections&days=30");
    const res = await handleIntel(req, new URL(req.url), { ...readEnv, SCORES: wordy as never });
    check(res?.status === 401, "the daily totals are refused without the operator's key");
  }
}
// The saves reach the daily totals' answers the dashboard reads: per day under their kind, per item with no detail.
{
  /** A stand-in database whose rows are saves. */
  const saving = {
    prepare: () => {
      // One statement that answers the same rows whatever is bound.
      const st = { bind: () => st, all: async () => ({ results: [{ day: "2026-11-11", kind: "save", section: "learn", item: "tftp", detail: "", n: 4 }] }) };
      return st;
    },
  };
  for (const series of ["events", "items"]) {
    // The request, with the operator's key.
    const req = new Request(`https://ronutz.com/api/stats/history?series=${series}&days=30`, { headers: { "x-stats-key": "operator-key" } });
    const res = await handleIntel(req, new URL(req.url), { ...readEnv, SCORES: saving as never });
    const body = res ? ((await res.json()) as { rows?: Array<{ kind?: string; n?: number }> }) : {};
    check(res?.status === 200 && (body.rows ?? []).some((r) => r.kind === "save" && r.n === 4), `the daily totals' "${series}" answer carries the saves`);
  }
}
// Reading routes refuse anything but a read.
{
  const req = new Request("https://ronutz.com/api/stats/interest?window=30d", { method: "POST" });
  const res = await handleIntel(req, new URL(req.url), readEnv);
  check(res?.status === 405, "a public route answers only GET and HEAD");
}
// The adding-up and its report ask for the key too.
check((await read("rollup")).status === 401, "the adding-up is refused without the operator's key");
// A window outside the list is refused, never placed in SQL.
check((await read("interest?window=1%27%20OR%201=1")).status === 400, "a window outside the list is refused");

// ---- 4. The adding-up ------------------------------------------------------------
// An address splits into language and section.
check(JSON.stringify(sectionOf("/en/tools/cidr/")) === JSON.stringify({ locale: "en", section: "tools" }), "sectionOf reads a tool's address");
check(JSON.stringify(sectionOf("/pt-BR/")) === JSON.stringify({ locale: "pt-BR", section: "home" }), "sectionOf reads a front page");
check(sectionOf("/en/dev/fun/patch-path/").section === "fun" && sectionOf("/en/arcade/ttl/").section === "fun", "sectionOf puts the puzzles and the arcade in one section");
check(shiftDay("2026-03-01", -1) === "2026-02-28" && shiftDay("2026-12-31", 1) === "2027-01-01", "shiftDay crosses month and year ends");
// A day is replaced whole, in one batch.
{
  /** The statements the stand-in database received, with their bound values. */
  const statements: Array<{ sql: string; values: unknown[] }> = [];
  /** How many batches were run. */
  let batches = 0;
  /** A stand-in for the D1 database. */
  const db = {
    prepare: (sql: string) => {
      // One statement, its values kept when bound.
      const st = { sql, values: [] as unknown[], bind(...v: unknown[]) { st.values = v; return st; }, all: async () => ({ results: [] }) };
      statements.push(st);
      return st;
    },
    batch: async (list: unknown[]) => { batches += 1; return list; },
  };
  // Added up.
  const report = await rollupDay({ ...readEnv, SCORES: db as never }, "2026-11-11", Date.UTC(2026, 10, 12, 3, 17));
  // The day's three deletes come before any insert, and everything travels in one batch.
  const deletes = statements.filter((s) => /^DELETE FROM daily_(pages|events|totals) WHERE day = \?1$/.test(s.sql) && s.values[0] === "2026-11-11").length;
  const firstInsert = statements.findIndex((s) => s.sql.startsWith("INSERT"));
  check(batches === 1 && deletes === 3 && firstInsert >= 3, "a day is deleted and written again in one batch");
  check(report.day === "2026-11-11" && report.pages === 1, "the adding-up reports the day and its pages");
  // The page row carries language, section, address and a count, and nothing else.
  const pageInsert = statements.find((s) => s.sql.includes("INTO daily_pages"));
  check(pageInsert !== undefined && String(pageInsert.values[1]) === JSON.stringify([["en", "tools", "/en/tools/cidr/", 7]]), "a page's daily row is language, section, address and a count");
  // Every value is bound; none is written into a statement's text.
  check(statements.every((s) => !s.sql.includes("2026-11-11") && !s.sql.includes("/en/tools/cidr/")), "the adding-up binds its values, never writes them into SQL text");
}
// A day that is not a day is refused before any SQL is made.
{
  let threw = false;
  try { await rollupDay({ ...readEnv, SCORES: {} as never }, "2026-11-11' OR 1=1", 0); } catch { threw = true; }
  check(threw, "a day that is not a day is refused");
}

// ---- The verdict -------------------------------------------------------------------
if (errors.length > 0) {
  // Each broken promise, named.
  console.error(`${TAG} FAIL: ${errors.length} of ${checks} check(s) on the interest counts did not hold:`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error("  The privacy page states these as facts about the code (privacy_page.interest*). Fix the code, or change the page in the same commit.");
  process.exit(1);
}
// What was checked.
console.log(`${TAG} OK: ${checks} checks: the rules for what a count may hold, the write (one row of five fields; nothing for Global Privacy Control, automation or another site), the read (search words only to the operator's key), the daily adding-up (a day replaced whole, values bound) and the save kind (section and item, no detail, carried to the totals).`);
