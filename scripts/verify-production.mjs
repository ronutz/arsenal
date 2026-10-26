#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/verify-production.mjs   (ON DEMAND - drives a real browser; added 2026-10-26)
// ----------------------------------------------------------------------------
// A REPEATABLE, READ-ONLY VERIFICATION RUN AGAINST THE LIVE SITE (or any base).
//
// WHY. Round 1's closure states (plan section 3e, adopted from the external
// audit's release protocol) separate "Implemented locally" from "Verified
// production closure", and plan item B12 (PRIME approved batch B on 25/10/2026
// 20:28) asks for the browser checks ANVIL ran by hand during Round 1 (the
// scratchpad check7, check9, check11 and check-a11y scripts) as one script that
// can be rerun after every push and leaves dated evidence behind. A closure is
// claimed from this file's output, not from memory of a run.
//
// WHAT IT CHECKS (the package each check closes is named in the evidence):
//   RT01   The quick CIDR box on Home hands its value to the calculator in the
//          fragment (#input=) and the value appears in no request URL and no
//          Referer header, from the first keystroke to the loaded tool; a
//          legacy ?input= address is rewritten to the fragment form.
//   RT02   On one registry tool (the ASN lookup), typing, Example and Clear
//          send nothing; Enter pressed twice while a query is in flight sends
//          one request; a special-purpose ASN sends none; the Ask button sends
//          exactly one. Only that Ask request may reach a registry: every other
//          cross-origin request is answered or refused inside the browser.
//   RT03   Search returns focus to its opener after Escape, the Close button
//          and a click on the backdrop.
//   RT04   The skip link is the first Tab stop and is visible 400 ms later.
//   ARC-02 Industry records state their lifecycle (ended with a year, ended
//          without a date, unverified, or nothing for an active company).
//   ARC-06 A sample of page types carries a description, an og:description
//          and a twitter:description, and the three agree.
//   MARKER The build stamp the footer prints, the response's cache headers, and
//          whether a verifiedAt marker is published (it is not expected to be).
//
// HOW IT STAYS HONEST AND POLITE.
//   - Every navigation carries a unique cb= query and every same-origin
//     request carries Cache-Control: no-cache and Pragma: no-cache; the
//     service worker is blocked so nothing is answered from a PWA cache.
//   - No form is submitted. At most ONE request leaves for a registry in a
//     whole run (the Ask check); --no-live-registry makes that zero.
//   - No-cache headers are added to same-origin requests only: on a
//     cross-origin fetch they would force a CORS preflight and change what the
//     registry check observes.
//
// USAGE
//   node scripts/verify-production.mjs --out <evidence-dir>
//        [--base https://ronutz.com] [--locales en,pt-BR]
//        [--registry-locale en] [--no-live-registry] [--headed]
// Writes <evidence-dir>/verify-production-<YYYYMMDD-HHMMSS>.json (every
// observation) and a .md summary beside it. Exit 0 when nothing FAILED, 1 when
// a check failed, 2 when the run itself could not start.
// Playwright must be resolvable (it is not a dependency of this repository):
// it is preinstalled in the sandbox; elsewhere run with `npx -p playwright`.
// Never run `playwright install` from this script's context.
// ============================================================================

// CommonJS require from an ES module, so Playwright resolves through NODE_PATH as well as node_modules.
import { createRequire } from "node:module";
// Writing the evidence files.
import fs from "node:fs";
// Joining the evidence paths.
import path from "node:path";

// The require function anchored at this file.
const require = createRequire(import.meta.url);
// The browser driver, loaded defensively so a missing install says what to do.
let chromium;
// Try the normal resolution first.
try {
  // Playwright's Chromium entry point.
  ({ chromium } = require("playwright"));
} catch {
  // Explain and stop: the run cannot start without a browser.
  console.error("[verify-production] Playwright is not resolvable. Run with `npx -p playwright node scripts/verify-production.mjs ...` or set NODE_PATH.");
  // Exit code 2: the run did not start.
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Read `--name value` pairs and bare `--flag`s. */
function readArgs(argv) {
  // The parsed options.
  const o = {};
  // Walk the tokens after `node script`.
  for (let i = 2; i < argv.length; i += 1) {
    // Only `--` tokens are options.
    if (!argv[i].startsWith("--")) continue;
    // Name without dashes.
    const k = argv[i].slice(2);
    // The next token when it is a value.
    const v = argv[i + 1];
    // A value-bearing option consumes it; a flag is true.
    if (v !== undefined && !v.startsWith("--")) { o[k] = v; i += 1; } else o[k] = true;
  }
  // Hand back the options.
  return o;
}

// The options of this run.
const ARGS = readArgs(process.argv);
// The evidence folder is required: evidence that is not written is not evidence.
if (typeof ARGS.out !== "string") {
  // Say how to call it.
  console.error("[verify-production] usage: node scripts/verify-production.mjs --out <evidence-dir> [--base URL] [--locales en,pt-BR]");
  // The run did not start.
  process.exit(2);
}
// The site under test, without a trailing slash.
const BASE = (typeof ARGS.base === "string" ? ARGS.base : "https://ronutz.com").replace(/\/+$/, "");
// Its origin, to tell same-origin requests from cross-origin ones.
const ORIGIN = new URL(BASE).origin;
// The locales to check (the two authored ones by default).
const LOCALES = typeof ARGS.locales === "string" ? ARGS.locales.split(",").map((s) => s.trim()).filter(Boolean) : ["en", "pt-BR"];
// The single locale in which the registry check runs (it may spend the run's one live lookup).
const REGISTRY_LOCALE = typeof ARGS["registry-locale"] === "string" ? ARGS["registry-locale"] : LOCALES[0];
// Whether the Ask check may send its one real request.
const LIVE_REGISTRY = !ARGS["no-live-registry"];
// The value handed from Home to the calculator (the audit's own example, RT01).
const CIDR_VALUE = "10.10.1.1/31";
// The fragment of it that must never appear in a request.
const CIDR_NEEDLE = "10.10.1.1";
// The message packs of this checkout, for the lifecycle wording (optional: years are checked without them).
const MESSAGES = path.join(process.cwd(), "src", "i18n", "messages");

// ---------------------------------------------------------------------------
// Time and identity of the run
// ---------------------------------------------------------------------------

/** The current time in São Paulo as an ISO string with its offset (the project's clock, GMT-3). */
function saoPauloIso(d = new Date()) {
  // The wall-clock parts in São Paulo.
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })  // a 24-hour formatter fixed to the project time zone
      .formatToParts(d)  // the formatted parts of the instant
      .map((p) => [p.type, p.value]),  // as [name, value] pairs for Object.fromEntries
  );
  // The offset in minutes between that wall clock and UTC.
  const offMin = Math.round((Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - d.getTime()) / 60000);
  // Its sign.
  const sign = offMin < 0 ? "-" : "+";
  // Hours and minutes of the offset.
  const oh = String(Math.floor(Math.abs(offMin) / 60)).padStart(2, "0");
  // Minutes part.
  const om = String(Math.abs(offMin) % 60).padStart(2, "0");
  // The ISO string.
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${oh}:${om}`;
}

// When the run started, in São Paulo time.
const STARTED = saoPauloIso();
// A compact stamp for file names and cache-busters (YYYYMMDD-HHMMSS).
const STAMP = STARTED.slice(0, 19).replace(/[-:]/g, "").replace("T", "-");
// A per-run token so two runs never share a cache-buster.
const RUN_ID = `${STAMP}-${Math.random().toString(36).slice(2, 8)}`;
// Navigation counter, so every navigation has its own cache-buster.
let navCount = 0;

/** A URL on the base with a unique cb= parameter appended (the rest of the query and the fragment kept). */
function bust(pathAndQuery) {
  // Resolve against the base.
  const u = new URL(BASE + pathAndQuery);
  // A fresh token per navigation.
  navCount += 1;
  // Append, never replace, so a test query (?input=) survives.
  u.searchParams.append("cb", `${RUN_ID}-${navCount}`);
  // The full address.
  return u.toString();
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

// Everything observed, written as JSON at the end.
const EVIDENCE = {
  tool: "scripts/verify-production.mjs",  // which script wrote the file
  runId: RUN_ID,  // the run token used in every cache-buster
  startedAt: STARTED,  // start time, São Paulo
  base: BASE,  // the site under test
  locales: LOCALES,  // the locales checked
  registryLocale: REGISTRY_LOCALE,  // where the registry check ran
  liveRegistryAllowed: LIVE_REGISTRY,  // whether one live lookup was allowed
  browser: null,  // filled with the Chromium version at launch
  checks: [],  // one entry per check, in run order
  crossOrigin: [],  // every cross-origin request attempted, with its fate
  liveRegistryRequests: [],  // the requests that actually left for a registry (at most one)
  pageErrors: [],  // uncaught exceptions seen on any page
  finishedAt: null,  // end time, São Paulo
};

/** Record one check's outcome: PASS, FAIL, WARN or INFO, with the data it rests on. */
function record(id, pkg, locale, status, summary, data = {}) {
  // Into the evidence.
  EVIDENCE.checks.push({ id, package: pkg, locale, status, summary, data, at: saoPauloIso() });
  // And onto the console as the run goes.
  console.log(`${status.padEnd(4)} ${pkg.padEnd(6)} ${(locale ?? "-").padEnd(5)} ${id}: ${summary}`);
}

// ---------------------------------------------------------------------------
// Browser plumbing
// ---------------------------------------------------------------------------

// The outbound proxy, when the environment has one and the base is not local.
const PROXY = process.env.HTTPS_PROXY && !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE) ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;

/**
 * The cross-origin policy of the run. Each context reads `mode`:
 *   "refuse": abort every cross-origin request (the default);
 *   "hold":   answer it locally after a delay with a synthetic 404, so a query stays in flight and nothing leaves;
 *   "live":   let exactly one through to the network, then refuse the rest.
 */
const POLICY = { mode: "refuse", liveBudget: LIVE_REGISTRY ? 1 : 0, holdMs: 1500, tag: null };

/** A new browser context with the run's caching and cross-origin rules, and a request log. */
async function newContext(browser, viewport = { width: 1280, height: 800 }) {
  // The service worker is blocked so every answer comes from the network, not a PWA cache.
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  // Every request the context makes, in order.
  const log = [];
  // Log each request when the browser issues it (before routing decides its fate).
  context.on("request", (r) => log.push({ url: r.url(), method: r.method(), type: r.resourceType(), referer: r.headers().referer ?? null, at: Date.now() }));
  // One handler for every request.
  await context.route("**/*", async (route) => {
    // The request being routed.
    const req = route.request();
    // Its origin.
    const origin = new URL(req.url()).origin;
    // Same origin: add the no-cache headers and let it go.
    if (origin === ORIGIN) return route.continue({ headers: { ...req.headers(), "cache-control": "no-cache", pragma: "no-cache" } });
    // data: and blob: URLs never leave the browser.
    if (!/^https?:/.test(req.url())) return route.continue();
    // A cross-origin request: note it for the evidence.
    const entry = { url: req.url(), method: req.method(), mode: POLICY.mode, tag: POLICY.tag, at: saoPauloIso() };
    // Into the evidence.
    EVIDENCE.crossOrigin.push(entry);
    // Live: one request through, then refuse.
    if (POLICY.mode === "live" && POLICY.liveBudget > 0) {
      // Spend the budget before continuing, so a racing second request cannot pass.
      POLICY.liveBudget -= 1;
      // Record the live request.
      EVIDENCE.liveRegistryRequests.push(entry);
      // Mark its fate.
      entry.fate = "sent";
      // Let it reach the registry.
      return route.continue();
    }
    // Hold: answer inside the browser after a delay (nothing leaves the machine).
    if (POLICY.mode === "hold") {
      // Mark its fate.
      entry.fate = "answered-locally";
      // Keep the query in flight for a while.
      await new Promise((r) => setTimeout(r, POLICY.holdMs));
      // A synthetic "not found", with the CORS header the page needs to read it.
      return route.fulfill({ status: 404, contentType: "application/rdap+json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ errorCode: 404, title: "verify-production: answered locally, not sent" }) });
    }
    // Refuse: abort.
    entry.fate = "refused";
    // The page sees a network failure.
    return route.abort("blockedbyclient");
  });
  // Hand back the context and its log.
  return { context, log };
}

/** A new page in a context, collecting uncaught errors under a label. */
async function newPage(context, label) {
  // The page.
  const page = await context.newPage();
  // Uncaught exceptions go into the evidence with their check's label.
  page.on("pageerror", (e) => EVIDENCE.pageErrors.push({ label, error: String(e).slice(0, 300), at: saoPauloIso() }));
  // Hand it back.
  return page;
}

/** Navigate with a cache-buster and wait for the network to settle; returns the response (or null). */
async function go(page, pathAndQuery, waitUntil = "networkidle") {
  // The busted address.
  const url = bust(pathAndQuery);
  // Navigate; a timeout is reported by the caller.
  return page.goto(url, { waitUntil, timeout: 45000 });
}

/** Describe the focused element (tag#id.classes) for the log. */
async function describeActive(page) {
  // Evaluated in the page.
  return page.evaluate(() => {
    // The focused element.
    const a = document.activeElement;
    // None at all.
    if (!a) return "null";
    // A short identifier.
    return a.tagName.toLowerCase() + (a.id ? `#${a.id}` : "") + (a.classList.length ? `.${[...a.classList].join(".")}` : "");
  });
}

/** True when a URL (decoded) contains the needle. */
function urlCarries(url, needle) {
  // Decode once (a malformed escape falls back to the raw string).
  let d = url;
  // Percent-decoding may throw on a broken sequence.
  try { d = decodeURIComponent(url); } catch { /* keep the raw URL */ }
  // Either form counts.
  return url.includes(needle) || d.includes(needle) || d.replace(/\+/g, " ").includes(needle);
}

// ---------------------------------------------------------------------------
// RT01: the fragment handoff
// ---------------------------------------------------------------------------

/** The Home quick box hands its value in the fragment; no request carries it; a legacy ?input= is normalised. */
async function checkHandoff(browser, locale) {
  // A fresh context per locale, so nothing carries over.
  const { context, log } = await newContext(browser);
  // The page.
  const page = await newPage(context, `RT01 ${locale}`);
  // Failures inside must not stop the run.
  try {
    // Home, cache-busted.
    await go(page, `/${locale}/`);
    // Start counting from the first keystroke: a prefetch triggered by typing would already leak.
    const from = log.length;
    // The quick CIDR field (current id; the older markup is matched by class).
    const field = page.locator("#home-cidr, .quick-cidr input").first();
    // Without the box there is nothing to hand off.
    if (!(await field.count())) { record("handoff-home", "RT01", locale, "FAIL", "the quick CIDR box was not found on Home"); return; }
    // The box opens with an example in it: empty it first, as a reader would select and delete.
    await field.fill("");
    // Type the value as a reader would.
    await field.pressSequentially(CIDR_VALUE, { delay: 40 });
    // Let the box settle and any prefetch fire.
    await page.waitForTimeout(1200);
    // The links to the calculator that now carry the value.
    const hrefs = await page.evaluate((needle) => [...document.querySelectorAll('a[href*="/tools/cidr"]')].map((a) => a.getAttribute("href")).filter((h) => h && decodeURIComponent(h).includes(needle)), CIDR_NEEDLE);
    // The fragment form, and no query form.
    const fragmentOnly = hrefs.length > 0 && hrefs.every((h) => h.includes("#input=") && !/[?&]input=/.test(h));
    // Report the links.
    record("handoff-link", "RT01", locale, fragmentOnly ? "PASS" : "FAIL", fragmentOnly ? `calculator link carries #input= (${hrefs[0]})` : `calculator links: ${JSON.stringify(hrefs.slice(0, 3))}`, { hrefs });
    // The "full calculator" link (the old markup: any calculator link carrying the value).
    const link = page.locator(".quick-cidr-more a.page-jump-link, .quick-cidr a.quick-cidr-toolbox").first();
    // Follow it as a reader would, if it exists.
    if (await link.count()) {
      // Click and wait for the calculator.
      await Promise.all([page.waitForURL(/\/tools\/cidr/, { timeout: 30000 }), link.click()]);
      // Let the tool load everything it loads.
      await page.waitForLoadState("networkidle");
    } else if (hrefs[0]) {  // no link element but a carried address: fall back to it
      // No dedicated link: open the carried address directly (same effect for the network check).
      await page.goto(new URL(hrefs[0], BASE).toString(), { waitUntil: "networkidle" });
    }
    // A client-side navigation hydrates the tool a moment after the network settles: wait up to 6 s for the value.
    await page.waitForFunction((needle) => [...document.querySelectorAll("input, textarea")].some((i) => i.value.includes(needle)), CIDR_NEEDLE, { timeout: 6000 }).catch(() => null);
    // The address the tool ended on.
    const landed = page.url();
    // The value in the tool's field, if prefilled.
    const prefilled = await page.evaluate((needle) => [...document.querySelectorAll("input, textarea")].map((i) => i.value).find((v) => v.includes(needle)) ?? null, CIDR_NEEDLE);
    // Every request from the first keystroke to now.
    const seen = log.slice(from);
    // Requests whose URL carries the value.
    const leakedUrl = seen.filter((r) => urlCarries(r.url, CIDR_NEEDLE)).map((r) => r.url);
    // Requests whose Referer carries the value.
    const leakedRef = seen.filter((r) => r.referer && urlCarries(r.referer, CIDR_NEEDLE)).map((r) => `${r.url} <- ${r.referer}`);
    // The verdict: fragment on the landed address, a prefilled field, and no carrier.
    const ok = /#input=/.test(landed) && !/[?&]input=/.test(new URL(landed).search) && leakedUrl.length === 0 && leakedRef.length === 0;
    // Report.
    record("handoff-network", "RT01", locale, ok ? "PASS" : "FAIL",
      `landed ${landed.replace(BASE, "")}; prefilled=${prefilled !== null}; ${seen.length} request(s) observed, ${leakedUrl.length} carry the value in the URL, ${leakedRef.length} in the Referer`,  // the one-line observation
      { landed, prefilled, requests: seen.map((r) => ({ url: r.url, type: r.type, referer: r.referer })), leakedUrl, leakedRef });  // the data behind it: every request with its referer
    // A prefilled field is part of the handoff working at all.
    if (prefilled === null) record("handoff-prefill", "RT01", locale, "FAIL", "the calculator did not show the handed value");
    // The legacy address: the value in the query (this request necessarily carries it; the page must rewrite itself).
    const legacyPath = `/${locale}/tools/cidr/?input=${encodeURIComponent(CIDR_VALUE)}`;
    // Open it.
    await go(page, legacyPath);
    // A moment for the rewrite (history.replaceState, which sends nothing).
    await page.waitForTimeout(800);
    // Where the address bar is now.
    const after = new URL(page.url());
    // Normalised: no input in the query, the value in the fragment.
    const normalised = !after.searchParams.has("input") && /input=/.test(after.hash);
    // Report.
    record("handoff-legacy", "RT01", locale, normalised ? "PASS" : "FAIL", `legacy ?input= now reads ${after.pathname}${after.search}${after.hash}`, { opened: legacyPath, now: after.toString() });
  } catch (e) {
    // A crash in the check is a failure of the check.
    record("handoff", "RT01", locale, "FAIL", `check did not complete: ${String(e.message).split("\n")[0]}`);
  } finally {
    // Release the context.
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// RT02: Ask and Enter on the ASN lookup
// ---------------------------------------------------------------------------

/** Cross-origin attempts logged since index `from`. */
const crossSince = (from) => EVIDENCE.crossOrigin.slice(from);

/** Only the explicit action sends; Enter is single-flight; special-purpose ASNs stay local; Ask sends exactly one. */
async function checkRegistry(browser, locale) {
  // A fresh context.
  const { context } = await newContext(browser);
  // The page.
  const page = await newPage(context, `RT02 ${locale}`);
  // Start in refuse mode: nothing may leave while the page loads and the reader types.
  POLICY.mode = "refuse";
  // Tag the phase.
  POLICY.tag = "load";
  // Failures inside must not stop the run.
  try {
    // The ASN lookup.
    const resp = await go(page, `/${locale}/dev/out/asn-lookup/`);
    // A missing page ends the check.
    if (!resp || resp.status() >= 400) { record("registry-page", "RT02", locale, "FAIL", `ASN lookup answered HTTP ${resp ? resp.status() : "none"}`); return; }
    // Anything the page fetched cross-origin on load.
    const onLoad = crossSince(0).length;
    // The field (current id first, then the first text input in main).
    const field = page.locator("#asn-input, main input[type=text], main input:not([type])").first();
    // Without a field there is nothing to test.
    if (!(await field.count())) { record("registry-field", "RT02", locale, "FAIL", "no input field found"); return; }
    // Phase 1: typing, Example and Clear.
    POLICY.tag = "typing";
    // Mark the log position.
    let mark = EVIDENCE.crossOrigin.length;
    // Empty the field first (a page may open with an example in it).
    await field.fill("");
    // Type a public ASN.
    await field.pressSequentially("AS15169", { delay: 40 });
    // The Example and Clear buttons (in the field's header row).
    const buttons = page.locator(".dig-input-actions button");
    // Click Example, if present.
    if ((await buttons.count()) >= 1) await buttons.nth(0).click();
    // Click Clear, if present.
    if ((await buttons.count()) >= 2) await buttons.nth(1).click();
    // Time for any eager fetch to show itself.
    await page.waitForTimeout(1500);
    // Nothing may have been attempted.
    const typed = crossSince(mark);
    // Report.
    record("registry-typing", "RT02", locale, typed.length === 0 ? "PASS" : "FAIL", `typing, Example and Clear attempted ${typed.length} cross-origin request(s) (all refused in the browser)`, { attempts: typed, onLoad });
    // Phase 2: a special-purpose ASN and Enter (must stay local).
    POLICY.mode = "hold";
    // Tag it.
    POLICY.tag = "special-enter";
    // Mark.
    mark = EVIDENCE.crossOrigin.length;
    // A private-use ASN (RFC 6996).
    await field.fill("AS64512");
    // Enter in the field.
    await field.press("Enter");
    // Time for a fetch to start.
    await page.waitForTimeout(1500);
    // Attempts.
    const special = crossSince(mark);
    // Report.
    record("registry-special", "RT02", locale, special.length === 0 ? "PASS" : "FAIL", `Enter on AS64512 (private use) attempted ${special.length} request(s)`, { attempts: special });
    // Phase 3: Enter twice while the first query is in flight (answered locally after a delay).
    POLICY.tag = "enter-twice";
    // Mark.
    mark = EVIDENCE.crossOrigin.length;
    // A public ASN.
    await field.fill("AS15169");
    // First Enter.
    await field.press("Enter");
    // A short gap, well inside the hold.
    await page.waitForTimeout(150);
    // Second Enter while the first is held.
    await field.press("Enter");
    // Let the held answer arrive.
    await page.waitForTimeout(POLICY.holdMs + 1500);
    // Attempts.
    const twice = crossSince(mark);
    // Exactly one.
    record("registry-enter", "RT02", locale, twice.length === 1 ? "PASS" : "FAIL", `two Enters during one query attempted ${twice.length} request(s) (answered locally, not sent)`, { attempts: twice });
    // Phase 4: the Ask button, the one live request of the run.
    POLICY.mode = LIVE_REGISTRY ? "live" : "hold";
    // Tag it.
    POLICY.tag = "ask";
    // Mark.
    mark = EVIDENCE.crossOrigin.length;
    // The Ask button (current markup first, then a button whose name reads Ask or Perguntar).
    const ask = page.locator(".rdap-ask-row button").or(page.getByRole("button", { name: /^(Ask|Perguntar|Consultar)\b/i })).first();
    // Without it, Ask cannot be tested.
    if (!(await ask.count())) { record("registry-ask", "RT02", locale, "FAIL", "no Ask button found"); return; }
    // The response, if the live request is let through.
    const respPromise = LIVE_REGISTRY ? page.waitForResponse((r) => new URL(r.url()).origin !== ORIGIN, { timeout: 15000 }).catch(() => null) : Promise.resolve(null);
    // One click.
    await ask.click();
    // Wait for the answer (or its absence).
    const r = await respPromise;
    // Let the page render the outcome.
    await page.waitForTimeout(2500);
    // Attempts.
    const asked = crossSince(mark);
    // What the page shows after Ask (its result panel), first lines only.
    const shown = await page.evaluate(() => (document.querySelector(".jwt-results")?.innerText ?? "").split("\n").slice(0, 3).join(" / ").slice(0, 200));
    // Exactly one attempt, and at most one sent.
    const ok = asked.length === 1 && EVIDENCE.liveRegistryRequests.length <= 1;
    // Report.
    record("registry-ask", "RT02", locale, ok ? "PASS" : "FAIL",
      `Ask attempted ${asked.length} request(s); ${asked.filter((a) => a.fate === "sent").length} sent to ${asked[0] ? new URL(asked[0].url).host : "-"}; HTTP ${r ? r.status() : "n/a"}; page shows "${shown}"`,  // the one-line observation
      { attempts: asked, status: r ? r.status() : null, corsHeader: r ? (r.headers()["access-control-allow-origin"] ?? null) : null, shown });  // the data behind it, including the CORS header the registry sent
  } catch (e) {
    // A crash in the check.
    record("registry", "RT02", locale, "FAIL", `check did not complete: ${String(e.message).split("\n")[0]}`);
  } finally {
    // Back to refuse for every later check.
    POLICY.mode = "refuse";
    // Clear the tag.
    POLICY.tag = null;
    // Release the context.
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// RT03: search focus return
// ---------------------------------------------------------------------------

/** Escape, Close and backdrop each return focus to the header Search button. */
async function checkSearchFocus(browser, locale) {
  // A fresh context.
  const { context } = await newContext(browser);
  // The page.
  const page = await newPage(context, `RT03 ${locale}`);
  // Each dismissal path.
  for (const how of ["escape", "close", "backdrop"]) {
    // One path must not stop the others.
    try {
      // Home, freshly loaded for each path.
      await go(page, `/${locale}/`);
      // The header opener.
      const opener = page.locator("header .search-trigger").first();
      // Mark it so the comparison survives re-renders.
      await opener.evaluate((el) => el.setAttribute("data-verify-opener", "1"));
      // Keyboard focus on it.
      await opener.focus();
      // Open the dialog from the keyboard.
      await page.keyboard.press("Enter");
      // The modal dialog appears.
      await page.waitForSelector('[role="dialog"][aria-modal="true"]', { state: "visible", timeout: 10000 });
      // A moment for focus to move into it.
      await page.waitForTimeout(500);
      // Escape anywhere closes it.
      if (how === "escape") await page.keyboard.press("Escape");
      // The Close button from the keyboard.
      if (how === "close") { await page.locator(".search-close").first().focus(); await page.keyboard.press("Enter"); }
      // A click in the corner, on the overlay outside the box.
      if (how === "backdrop") await page.mouse.click(4, 4);
      // Wait for the dialog to go.
      await page.waitForSelector('[role="dialog"][aria-modal="true"]', { state: "detached", timeout: 6000 });
      // One frame for the focus-return effect.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
      // Is focus back on the opener?
      const back = await page.evaluate(() => document.activeElement?.getAttribute("data-verify-opener") === "1");
      // Report.
      record(`search-${how}`, "RT03", locale, back ? "PASS" : "FAIL", back ? "focus returned to the header Search button" : `focus went to ${await describeActive(page)}`);
    } catch (e) {
      // A timeout or missing element.
      record(`search-${how}`, "RT03", locale, "FAIL", `check did not complete: ${String(e.message).split("\n")[0]}`);
    }
  }
  // Release the context.
  await context.close();
}

// ---------------------------------------------------------------------------
// RT04: the skip link
// ---------------------------------------------------------------------------

/** The first Tab focuses the skip link, which is visible 400 ms later (after its slide-in transition). */
async function checkSkipLink(browser, locale) {
  // A fresh context.
  const { context } = await newContext(browser);
  // The page.
  const page = await newPage(context, `RT04 ${locale}`);
  // A shell, a tool and a record.
  for (const p of ["/", "/tools/cidr/", "/industry/3com/"]) {
    // One page must not stop the others.
    try {
      // Load it.
      const resp = await go(page, `/${locale}${p}`);
      // A missing page is a failure.
      if (!resp || resp.status() >= 400) { record(`skip ${p}`, "RT04", locale, "FAIL", `HTTP ${resp ? resp.status() : "none"}`); continue; }
      // The first Tab from a fresh load.
      await page.keyboard.press("Tab");
      // The transition (0.15 s) and any late focus move.
      await page.waitForTimeout(400);
      // Facts about the focused element.
      const f = await page.evaluate(() => {
        // The focused element.
        const a = document.activeElement;
        // Its box.
        const r = a ? a.getBoundingClientRect() : null;
        // What is painted at its centre (visible means the element itself, or its child, is on top there).
        const hit = r && r.width > 0 && r.height > 0 ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        // The facts.
        return {
          href: a?.getAttribute("href") ?? null,  // where the focused element points
          isSkipClass: !!a?.classList.contains("skip-link"),  // whether it carries the current skip-link class
          text: (a?.textContent ?? "").trim().slice(0, 60),  // its visible text
          inViewport: !!r && r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight,  // inside the viewport with a real size
          painted: !!hit && (hit === a || a.contains(hit)),  // actually painted on top at its centre
          skipLinks: document.querySelectorAll('a[href="#main"]').length,  // how many links to #main the page has
        };
      });
      // First stop is the link to #main.
      const first = f.href === "#main";
      // Visible on screen.
      const visible = f.inViewport && f.painted;
      // Report.
      record(`skip ${p}`, "RT04", locale, first && visible ? "PASS" : "FAIL",
        `first Tab -> ${first ? `skip link "${f.text}"` : await describeActive(page)}; visible after 400 ms: ${visible}; links to #main on the page: ${f.skipLinks}`, f);  // the one-line observation
    } catch (e) {
      // A crash in the check.
      record(`skip ${p}`, "RT04", locale, "FAIL", `check did not complete: ${String(e.message).split("\n")[0]}`);
    }
  }
  // Release the context.
  await context.close();
}

// ---------------------------------------------------------------------------
// ARC-02: industry lifecycle labels
// ---------------------------------------------------------------------------

// The sample: one record per lifecycle state, with the state src/content/vendors/partners.ts lifecycleOf() gave on
// 2026-10-26. A record whose data later changes makes this expectation stale: update it from the same function.
const LIFECYCLE_SAMPLE = [
  // Ended with a year: founded 1979, acquired by HP in 2010.
  { slug: "3com", state: "ended", from: 1979, to: 2010 },
  // Ended without a recorded date.
  { slug: "nortel-bay", state: "ended-undated", from: 1895 },
  // Nothing says it ended and nothing shows it trading.
  { slug: "olitel", state: "unverified" },
  // Its own site on file: active, and the hero adds nothing.
  { slug: "akamai", state: "active" },
  // Active and owned (PRIME ruling 1, 26/10/2026): no end line, and the hero names the parent and the year.
  { slug: "netscreen-juniper", state: "active", from: 1996, parent: "HPE", since: 2025 },
  // A lineage card (PRIME ruling 2, 26/10/2026): the end line says it has no single status.
  { slug: "dns-bind", state: "lineage", from: 1983 },
];

/** The lifecycle templates of a locale, from this checkout's packs (null when the packs are not present). */
function lifecycleTemplates(locale) {
  // The pack's file.
  const f = path.join(MESSAGES, `${locale}.json`);
  // Without the packs, the check falls back to years only.
  if (!fs.existsSync(f)) return null;
  // The partnerVendors namespace.
  const ns = JSON.parse(fs.readFileSync(f, "utf8")).partnerVendors ?? {};
  // The three templates the hero uses.
  return { span: ns.timelineSpan, undated: ns.timelineEndedUndated, unverified: ns.timelineUnverified, lineage: ns.timelineLineage };
}

/** Each sampled record states its lifecycle as the record says, and never "present" for a company that ended. */
async function checkLifecycle(browser, locale) {
  // A fresh context.
  const { context } = await newContext(browser);
  // The page.
  const page = await newPage(context, `ARC-02 ${locale}`);
  // The locale's templates.
  const T = lifecycleTemplates(locale);
  // Fill {from} and {to} in a template.
  const fill = (tpl, v) => (tpl ?? "").replace("{from}", String(v.from ?? "")).replace("{to}", String(v.to ?? ""));
  // Each sampled record.
  for (const v of LIFECYCLE_SAMPLE) {
    // One record must not stop the others.
    try {
      // Load it.
      const resp = await go(page, `/${locale}/industry/${v.slug}/`);
      // A missing page is a failure.
      if (!resp || resp.status() >= 400) { record(`lifecycle ${v.slug}`, "ARC-02", locale, "FAIL", `HTTP ${resp ? resp.status() : "none"}`); continue; }
      // The hero's lifecycle line and the whole hero's text.
      const got = await page.evaluate(() => ({ end: document.querySelector(".vendor-hero .vendor-card-end")?.textContent?.trim() ?? null, hero: document.querySelector(".vendor-hero")?.textContent ?? "" }));
      // "present" anywhere in the hero (en or pt-BR).
      const saysPresent = /\b(present|presente)\b/i.test(got.hero);
      // The verdict by state.
      let ok;
      // Ended: the line names both years.
      if (v.state === "ended") ok = !!got.end && got.end.includes(String(v.from)) && got.end.includes(String(v.to)) && (!T || got.end.includes(fill(T.span, v)));
      // Ended without a date: the line says so.
      else if (v.state === "ended-undated") ok = !!got.end && got.end.includes(String(v.from)) && (!T || got.end.includes(fill(T.undated, v)));
      // Unverified: the line says the status is not verified.
      else if (v.state === "unverified") ok = !!got.end && (!T || got.end.includes(fill(T.unverified, v).replace(/^\s*[-,]?\s*/, "").trim()) || got.end.includes(fill(T.unverified, v)));
      // A lineage card: the line carries the lineage template with its year.
      else if (v.state === "lineage") ok = !!got.end && got.end.includes(String(v.from)) && (!T || !T.lineage || got.end.includes(fill(T.lineage, v)));
      // Active: no end line; a subsidiary's hero also names its parent and the year the ownership began.
      else ok = got.end === null && (!v.parent || (got.hero.includes(v.parent) && got.hero.includes(String(v.since))));
      // Never "present" for a record that is not active.
      if (v.state !== "active" && saysPresent) ok = false;
      // Report.
      record(`lifecycle ${v.slug}`, "ARC-02", locale, ok ? "PASS" : "FAIL", `expected ${v.state}; hero line: ${got.end === null ? "(none)" : `"${got.end.slice(0, 140)}"`}${saysPresent ? "; hero says present" : ""}`, { expected: v, line: got.end, saysPresent });
    } catch (e) {
      // A crash in the check.
      record(`lifecycle ${v.slug}`, "ARC-02", locale, "FAIL", `check did not complete: ${String(e.message).split("\n")[0]}`);
    }
  }
  // Release the context.
  await context.close();
}

// ---------------------------------------------------------------------------
// ARC-06: descriptions
// ---------------------------------------------------------------------------

// One page of each type: shells, indexes, a tool and its docs, an article, a term, a record, a guide, a hub, a course.
const DESCRIPTION_SAMPLE = ["/", "/tools/", "/tools/cidr/", "/tools/cidr/docs/", "/learn/", "/learn/cidr-notation/", "/learn/series/", "/glossary/bgp/", "/industry/3com/", "/certifications/", "/certifications/netskope-nsk101/", "/f5/", "/training/f5/", "/study-guides/", "/privacy/"];

/** Each sampled page carries description, og:description and twitter:description, and the three agree. */
async function checkDescriptions(browser, locale) {
  // A fresh context.
  const { context } = await newContext(browser);
  // The page.
  const page = await newPage(context, `ARC-06 ${locale}`);
  // The description each sampled page carried, to spot one value shared by many pages (an inherited site default).
  const seen = new Map();
  // Each sampled path.
  for (const p of DESCRIPTION_SAMPLE) {
    // One page must not stop the others.
    try {
      // The DOM is enough: metadata is in the static head.
      const resp = await go(page, `/${locale}${p}`, "domcontentloaded");
      // A missing page is a failure.
      if (!resp || resp.status() >= 400) { record(`description ${p}`, "ARC-06", locale, "FAIL", `HTTP ${resp ? resp.status() : "none"}`); continue; }
      // The three values.
      const m = await page.evaluate(() => ({
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,  // the plain description
        og: document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? null,  // the Open Graph description
        twitter: document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ?? null,  // the Twitter card description
      }));
      // Present and non-empty.
      const present = !!m.description?.trim() && !!m.og?.trim();
      // The three agree (twitter optional but, when present, equal).
      const agree = present && m.description === m.og && (m.twitter === null || m.twitter === m.description);
      // Remember which pages carried this value.
      if (m.description) seen.set(m.description, [...(seen.get(m.description) ?? []), p]);
      // Report.
      record(`description ${p}`, "ARC-06", locale, present ? (agree ? "PASS" : "WARN") : "FAIL",
        `${present ? "description and og:description present" : "missing description or og:description"}${present && !agree ? "; the values differ" : ""} ("${(m.description ?? "").slice(0, 80)}")`, m);  // the one-line observation
    } catch (e) {
      // A crash in the check.
      record(`description ${p}`, "ARC-06", locale, "FAIL", `check did not complete: ${String(e.message).split("\n")[0]}`);
    }
  }
  // One value on three or more sampled pages is the layout's site-wide default, not a description of each page.
  for (const [desc, pages] of seen) {
    // Below the threshold, a shared value is a coincidence worth no line.
    if (pages.length < 3) continue;
    // Report it once, with the pages that inherit it.
    record("description shared", "ARC-06", locale, "WARN", `${pages.length} sampled pages carry the same description ("${desc.slice(0, 70)}"): ${pages.join(" ")}`, { description: desc, pages });
  }
  // Release the context.
  await context.close();
}

// ---------------------------------------------------------------------------
// MARKER: what the site says about its own build
// ---------------------------------------------------------------------------

/** The footer's build stamp, the response's cache headers, and whether a verifiedAt marker is published. */
async function checkMarker(browser, locale) {
  // A fresh context.
  const { context } = await newContext(browser);
  // The page.
  const page = await newPage(context, `MARKER ${locale}`);
  // Failures inside must not stop the run.
  try {
    // Home.
    const resp = await go(page, `/${locale}/`);
    // The response headers that tell a cached copy from a fresh one.
    const h = resp ? resp.headers() : {};
    // The footer's quiet line, where the build stamp lives.
    const stampText = await page.evaluate(() => document.querySelector(".footer-machine")?.textContent ?? "");
    // The stamp itself (YYYY-MM-DD HH:MM UTC).
    const stamp = (stampText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC/) ?? [null])[0];
    // Report the stamp.
    record("build-stamp", "MARKER", locale, stamp ? "INFO" : "WARN", stamp ? `footer build stamp ${stamp}` : "no build stamp in the footer", { stamp, status: resp?.status() ?? null, headers: { "cache-control": h["cache-control"] ?? null, "cf-cache-status": h["cf-cache-status"] ?? null, age: h.age ?? null, etag: h.etag ?? null, "last-modified": h["last-modified"] ?? null, date: h.date ?? null } });
    // The verifiedAt marker is a repository file (.build-verified.json); probe whether the host serves it.
    const probe = await context.request.get(bust("/.build-verified.json"), { headers: { "cache-control": "no-cache", pragma: "no-cache" }, failOnStatusCode: false, maxRedirects: 0 });
    // A JSON body with verifiedAt means it is published.
    let verifiedAt = null;
    // Only a 200 can carry it.
    if (probe.status() === 200) {
      // Parse defensively: an HTML 404 page served with 200 is not a marker.
      try { verifiedAt = JSON.parse(await probe.text()).verifiedAt ?? null; } catch { verifiedAt = null; }
    }
    // Report.
    record("verified-at", "MARKER", locale, "INFO", verifiedAt ? `verifiedAt published: ${verifiedAt}` : `no verifiedAt published (/.build-verified.json answered HTTP ${probe.status()})`, { status: probe.status(), verifiedAt });
  } catch (e) {
    // A crash in the check.
    record("marker", "MARKER", locale, "WARN", `check did not complete: ${String(e.message).split("\n")[0]}`);
  } finally {
    // Release the context.
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// The summary
// ---------------------------------------------------------------------------

/** The Markdown summary of the evidence. */
function summaryMarkdown(jsonName) {
  // Counts by status.
  const n = (s) => EVIDENCE.checks.filter((c) => c.status === s).length;
  // Escape a table cell.
  const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  // The lines of the file.
  const lines = [
    `# Production verification, ${EVIDENCE.startedAt}`,  // title with the run date
    "",  // blank line
    `- Base: ${EVIDENCE.base}`,  // the site under test
    `- Locales: ${EVIDENCE.locales.join(", ")} (registry check in ${EVIDENCE.registryLocale})`,  // the locales and the registry locale
    `- Run: ${EVIDENCE.runId}, finished ${EVIDENCE.finishedAt}; browser ${EVIDENCE.browser}`,  // run token, end time, browser
    `- Cache: every navigation cache-busted (cb=), no-cache headers on same-origin requests, service worker blocked`,  // how freshness was forced
    `- Registry: ${EVIDENCE.liveRegistryRequests.length} live request(s) sent (budget ${LIVE_REGISTRY ? 1 : 0}); ${EVIDENCE.crossOrigin.length} cross-origin attempt(s) observed in all, the rest refused or answered inside the browser`,  // what left for a registry
    `- Totals: ${n("PASS")} pass, ${n("FAIL")} fail, ${n("WARN")} warn, ${n("INFO")} info; ${EVIDENCE.pageErrors.length} uncaught page error(s)`,  // the totals
    `- Evidence: ${jsonName}`,  // the JSON file beside this one
    "",  // blank line
    "| Package | Locale | Check | Status | Observation |",  // table header
    "|---|---|---|---|---|",  // table rule
    // One row per check.
    ...EVIDENCE.checks.map((c) => `| ${c.package} | ${c.locale ?? "-"} | ${cell(c.id)} | ${c.status} | ${cell(c.summary)} |`),
    "",  // blank line
  ];
  // Page errors, when any.
  if (EVIDENCE.pageErrors.length) lines.push("## Uncaught page errors", "", ...EVIDENCE.pageErrors.slice(0, 20).map((e) => `- ${e.label}: ${cell(e.error)}`), "");
  // The text.
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

/** Launch, run every check, write the evidence, exit with the right code. */
async function main() {
  // Headless Chromium (the preinstalled browser), through the proxy when there is one.
  const browser = await chromium.launch({ headless: !ARGS.headed, proxy: PROXY });
  // Record the browser version.
  EVIDENCE.browser = browser.version();
  // Always close the browser.
  try {
    // The marker once, in the first locale.
    await checkMarker(browser, LOCALES[0]);
    // Per locale: the handoff, search focus, the skip link, lifecycle labels, descriptions.
    for (const locale of LOCALES) {
      // RT01.
      await checkHandoff(browser, locale);
      // RT02 only in its one locale, so the run spends at most one live lookup.
      if (locale === REGISTRY_LOCALE) await checkRegistry(browser, locale);
      // RT03.
      await checkSearchFocus(browser, locale);
      // RT04.
      await checkSkipLink(browser, locale);
      // ARC-02.
      await checkLifecycle(browser, locale);
      // ARC-06.
      await checkDescriptions(browser, locale);
    }
  } finally {
    // Release the browser.
    await browser.close();
  }
  // When the run finished.
  EVIDENCE.finishedAt = saoPauloIso();
  // The evidence folder.
  const dir = path.resolve(ARGS.out);
  // Create it if needed.
  fs.mkdirSync(dir, { recursive: true });
  // The file names, dated in São Paulo time.
  const base = `verify-production-${STAMP}`;
  // The JSON evidence.
  fs.writeFileSync(path.join(dir, `${base}.json`), `${JSON.stringify(EVIDENCE, null, 2)}\n`);
  // The Markdown summary.
  fs.writeFileSync(path.join(dir, `${base}.md`), summaryMarkdown(`${base}.json`));
  // Failures decide the exit code.
  const failed = EVIDENCE.checks.filter((c) => c.status === "FAIL").length;
  // One closing line.
  console.log(`[verify-production] ${failed ? "FAIL" : "OK"}: ${EVIDENCE.checks.length} checks, ${failed} failed; evidence in ${path.join(dir, `${base}.json`)}`);
  // Exit 1 when anything failed.
  process.exit(failed ? 1 : 0);
}

// Run, and turn a crash into exit code 2.
main().catch((e) => { console.error("[verify-production] crashed:", e); process.exit(2); });
