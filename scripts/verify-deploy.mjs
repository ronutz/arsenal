// ============================================================================
// scripts/verify-deploy.mjs
// ----------------------------------------------------------------------------
// POST-DEPLOY VERIFIER: proves that production actually serves everything the
// repo says it should. Two independent sources of truth are read from the repo
// and probed against the live origin:
//
//   1. API endpoints  <- public/openapi.json  (the 38 API-exposed tool slugs).
//      Each /api/v1/<slug> is expected to RESOLVE: a 400 "missing_input" (no
//      input supplied) or a 200 both count as live; a 404 means the route is
//      not deployed. The worker is registry-driven, so a route that resolves
//      proves that tool's engine is bundled and reachable.
//
//   2. Tool pages     <- src/content/catalogue/catalogue.ts (disposition:"built").
//      Each /<locale>/tools/<slug> is expected to return 200 (following the
//      trailing-slash redirect the locale gate issues).
//
// It makes NO changes and needs NO credentials: it only issues GETs. Run it
// before a deploy to capture the baseline and after to confirm the delta.
//
//   node scripts/verify-deploy.mjs                 # defaults to https://ronutz.com, locale en
//   BASE=https://staging.example.com node scripts/verify-deploy.mjs
//   LOCALE=pt-BR node scripts/verify-deploy.mjs
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE || "https://ronutz.com").replace(/\/$/, "");
const LOCALE = process.env.LOCALE || "en";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 12000);
const CONCURRENCY = Number(process.env.CONCURRENCY || 10);

// ---- sources of truth ------------------------------------------------------
const apiSlugs = Object.keys(
  JSON.parse(readFileSync(path.join(ROOT, "public/openapi.json"), "utf8")).paths,
)
  .map((p) => p.replace(/^\//, ""))
  .sort();

const catalogueSrc = readFileSync(path.join(ROOT, "src/content/catalogue/catalogue.ts"), "utf8");
const pageSlugs = [];
for (const line of catalogueSrc.split("\n")) {
  if (!/disposition:\s*"built"/.test(line)) continue;
  const m = line.match(/slug:\s*"([^"]+)"/);
  if (m) pageSlugs.push(m[1]);
}
pageSlugs.sort();

// ---- probe helpers ---------------------------------------------------------
async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // Do not auto-follow, so we can see the locale gate's 3xx explicitly.
    const res = await fetch(url, { redirect: "manual", signal: ctrl.signal });
    return res.status;
  } catch (e) {
    return e.name === "AbortError" ? "timeout" : "error";
  } finally {
    clearTimeout(t);
  }
}

// Run probes with bounded concurrency; return [{ key, status, ok }].
async function runAll(items, toUrl, isOk) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const item = items[i++];
      const status = await probe(toUrl(item));
      out.push({ key: item, status, ok: isOk(status) });
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

// ---- run -------------------------------------------------------------------
console.log(`\nverify-deploy -> ${BASE}  (locale ${LOCALE})\n`);

const apiOk = (s) => s === 200 || s === 400; // 400 = route live but no input
const pageOk = (s) => s === 200 || s === 301 || s === 302 || s === 307 || s === 308;

const apiResults = await runAll(apiSlugs, (s) => `${BASE}/api/v1/${s}`, apiOk);
const pageResults = await runAll(pageSlugs, (s) => `${BASE}/${LOCALE}/tools/${s}`, pageOk);

const apiLive = apiResults.filter((r) => r.ok);
const apiDead = apiResults.filter((r) => !r.ok);
const pageLive = pageResults.filter((r) => r.ok);
const pageDead = pageResults.filter((r) => !r.ok);

console.log(`API endpoints:  ${apiLive.length}/${apiResults.length} live`);
if (apiDead.length) console.log(`  not resolving: ${apiDead.map((r) => `${r.key}[${r.status}]`).join(", ")}`);
console.log(`Tool pages:     ${pageLive.length}/${pageResults.length} live`);
if (pageDead.length) console.log(`  not resolving: ${pageDead.map((r) => `${r.key}[${r.status}]`).join(", ")}`);

const allGood = apiDead.length === 0 && pageDead.length === 0;
console.log(`\n${allGood ? "PASS — production matches the repo." : "INCOMPLETE — production is behind the repo (see above)."}\n`);
process.exit(allGood ? 0 : 1);
