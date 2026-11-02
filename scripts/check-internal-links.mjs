#!/usr/bin/env node
// ============================================================================
// check-internal-links  —  POST-BUILD, because it reads the built site.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. The 2026-08-16 audit found /about/pre-1996 still linking to
// /industry/history, the address it was moved FROM. Both targets had ceased to
// exist and nothing noticed: a route disappears, and the href that pointed at
// it stays a perfectly valid string.
//
//   A PAGE THAT MOVES TAKES ITS OWN OUTBOUND LINKS WITH IT.
//
// So every internal href in the built output must resolve to something that
// was actually built — a route directory with an index.html, or a real file
// such as the machine-readable /tools/<slug>.md companions.
//
// IT RUNS AFTER THE BUILD, NOT BEFORE. The prebuild guards read source; this
// one needs the artefact, and a check that cannot see the artefact is how the
// last three faults survived.
//
// A RATCHET. Three broken links pre-dated this guard. Two were repaired on
// 2026-08-16 once their real causes were found - a career link pointing at
// /industry/chapters/versa when the lineage page is /industry/versa, and a
// history card pointing at a profile slug that had been DISSOLVED and replaced.
// Neither was a judgement call in the end; both were simply wrong.
//
// THE LAST ONE WAS REPAIRED ON 2026-10-18 (production audit of 2026-10-15,
// F06): the changelog's two links to the pre-1996 page's old address now point
// at the page itself, the entry's text still naming the address of the day, and
// public/_redirects carries the trailing-slash forms of the history rules that
// the bare rules never matched. Baseline: zero.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const OUT = "out";
// One locale is enough — the routes are generated per locale — but WHICH locale
// must adapt to what was built. R-18 audit finding (2026-08-26): this guard was
// pinned to "en", so single-locale pt-BR verification builds hit the SKIP branch
// and shipped with internal links entirely unchecked. Now it prefers en when
// present and otherwise takes the first built locale, so every build gets read.
// TWO LOCALES NOW, NOT ONE. The premise stated above - "one locale is enough,
// the routes are generated per locale" - stopped being true on 2026-09-10, when
// the Learn and glossary DETAIL pages became authored-locales-only and every
// other live locale dropped from ~3,383 pages to ~1,007. Reading only "en"
// would leave a broken link inside a non-authored locale permanently invisible,
// and those locales are exactly where link targets have just disappeared.
//
// So: the preferred locale (en) AND, when one was built, the first
// non-authored one. Nothing is assumed about which locales a verification build
// contains; if only en was built this behaves exactly as before.
const AUTHORED_SET = new Set(
  [...(fs.readFileSync("src/i18n/locales.ts", "utf8")
    .match(/AUTHORED_CONTENT_LOCALES\s*=\s*\[([^\]]*)\]/)?.[1] ?? "")
    .matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1])
);
const BUILT_LOCALES = fs.existsSync(OUT)
  ? fs.readdirSync(OUT, { withFileTypes: true })
      .filter(
        (e) =>
          e.isDirectory() &&
          /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(e.name) &&
          fs.existsSync(path.join(OUT, e.name, "index.html"))
      )
      .map((e) => e.name)
      .sort()
  : [];
const EXTRA_LOCALE = BUILT_LOCALES.find((l) => !AUTHORED_SET.has(l));

const LOCALE = fs.existsSync(path.join(OUT, "en", "index.html"))
  ? "en"
  : (fs.existsSync(OUT)
      ? fs.readdirSync(OUT, { withFileTypes: true })
          .filter(
            (e) =>
              e.isDirectory() &&
              /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(e.name) && // locale-shaped only: out/404/ is a page, not a locale
              fs.existsSync(path.join(OUT, e.name, "index.html"))
          )
          .map((e) => e.name)
          .sort()[0]
      : undefined);
const BASE = LOCALE ? path.join(OUT, LOCALE) : undefined;

if (!BASE || !fs.existsSync(BASE)) {
  console.log("[check-internal-links] SKIP: no build output to read.");
  process.exit(0);
}
const LOCALES_TO_READ = [LOCALE, ...(EXTRA_LOCALE && EXTRA_LOCALE !== LOCALE ? [EXTRA_LOCALE] : [])];
console.log(
  `[check-internal-links] reading locale(s): ${LOCALES_TO_READ.join(", ")}` +
    (EXTRA_LOCALE && EXTRA_LOCALE !== LOCALE
      ? ` (${EXTRA_LOCALE} is non-authored - where the corpus routes no longer exist)`
      : "")
);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// Each locale is resolved against ITS OWN tree: a link in /de/ points at /de/...
// and must resolve inside /de/. Sharing one route set between locales would let
// a link to a page that exists only in English pass while it is broken in
// German - the precise failure this widening exists to catch.
// ---------------------------------------------------------------------------
// REDIRECTS COUNT AS RESOLVING - added 2026-09-27.
//
// Until now this guard asked "was this target BUILT", and a 301 in
// public/_redirects was invisible to it. That is the wrong question: the thing
// a reader experiences is whether the link lands somewhere, and a permanent
// redirect lands. It is how every moved route on this site is meant to behave,
// and treating those as broken turns a working site into permanent baseline debt.
//
// STRICTER, not looser. A redirect only excuses a link when its DESTINATION
// resolves. A rule pointing at a route that no longer exists is a broken link
// with an extra hop, and that case now fails where before it was never examined.
const REDIRECTS = (() => {
  const out = [];
  const file = path.join(process.cwd(), "public", "_redirects");
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const [from, to] = s.split(/\s+/);
    if (!from || !to) continue;
    out.push({ from, to });
  }
  return out;
})();

/** Apply the redirect table to a locale-qualified path, or null if no rule matches. */
function followRedirect(fullPath) {
  for (const { from, to } of REDIRECTS) {
    if (from.endsWith("/*")) {
      const stem = from.slice(0, -1); // keep the trailing slash
      if (fullPath.startsWith(stem)) {
        return to.replace(":splat", fullPath.slice(stem.length));
      }
    } else if (from === fullPath) {
      // EXACT, as Cloudflare matches (audit F06, 2026-10-18). Until then a bare rule was accepted for a trailing-slash
      // link, which is how /industry/history/pre-1996/ passed this guard for a year while production answered 404.
      return to;
    }
  }
  return null;
}

let pages = [];
const broken = new Map();
/** Redirect rules whose own destination does not resolve. Always fatal. */
const danglingRedirects = new Map();
/** Links in a fallback locale that point at an article or entry the locale does not carry, and so pass through the
 *  Worker's redirect to English (2026-11-02). Always fatal: such a link must name the English page itself. */
const viaCorpusRedirect = new Map();
/** Links from a fallback locale to the English page of an article or entry, checked against the English build. */
let crossToDefault = 0;
// The English tree, when this build has one, for the cross-locale check.
const EN_BASE = path.join(OUT, "en");

for (const loc of LOCALES_TO_READ) {
  const base = path.join(OUT, loc);
  if (!fs.existsSync(base)) continue;
  const all = walk(base);
  const localePages = all.filter((f) => f.endsWith("index.html"));
  pages = pages.concat(localePages);

  const routes = new Set(
    localePages.map((f) => "/" + path.relative(base, path.dirname(f)).split(path.sep).join("/"))
  );
  routes.add("/.");
  routes.add("/");
  const files = new Set(
    all.filter((f) => !f.endsWith(".html")).map((f) => "/" + path.relative(base, f).split(path.sep).join("/"))
  );

  for (const f of localePages) {
    const from = `/${loc}/` + path.relative(base, path.dirname(f)).split(path.sep).join("/");
    const html = fs.readFileSync(f, "utf8");
    for (const m of html.matchAll(new RegExp(`href="/${loc}([^"#?]*)"`, "g"))) {
      const raw = m[1] || "/";
      const target = raw.replace(/\/$/, "") || "/";
      if (routes.has(target) || files.has(raw) || files.has(target)) continue;
      // NOT BROKEN BUT NOT ALLOWED EITHER (2026-11-02). In a locale that does not
      // carry the authored corpora, a link to a Learn article or a glossary entry
      // is answered by the Worker with a 302 to the English page (2026-09-10).
      // Until 2026-11-02 this guard exempted such links; they are now the defect
      // PRIME asked to fix ("the links passing through the temporary redirect to
      // English"): the site's links name the English page themselves (see
      // src/i18n/corpus-routing.ts), so one left pointing at the redirect fails.
      if (
        !AUTHORED_SET.has(loc) &&
        (target.startsWith("/learn/") || target.startsWith("/glossary/"))
      ) {
        if (!viaCorpusRedirect.has(`${loc}:${target}`)) viaCorpusRedirect.set(`${loc}:${target}`, from);
        continue;
      }
      // A 301 in public/_redirects answers this link. Accept it only if the
      // destination itself resolves; otherwise the redirect is the defect.
      const hop = followRedirect(`/${loc}${raw}`);
      if (hop) {
        const hopLocal = hop.startsWith(`/${loc}/`) ? hop.slice(loc.length + 1) : null;
        const hopTarget = hopLocal ? hopLocal.replace(/\/$/, "") || "/" : null;
        if (hopTarget && (routes.has(hopTarget) || files.has(hopLocal) || files.has(hopTarget))) continue;
        const dk = `${loc}:${raw}`;
        if (!danglingRedirects.has(dk)) danglingRedirects.set(dk, hop);
      }
      const key = `${loc}:${target}`;
      if (!broken.has(key)) broken.set(key, from);
    }
    // THE OTHER HALF (2026-11-02): from a fallback locale, a link to an English article or entry must land on a page
    // the English build holds. Read only when this build has the English tree (a single-locale build cannot judge).
    if (!AUTHORED_SET.has(loc) && fs.existsSync(EN_BASE)) {
      for (const m of html.matchAll(/href="\/en(\/(?:learn|glossary)\/[^"#?]*)"/g)) {
        // The route below /en/, without its trailing slash.
        const enTarget = m[1].replace(/\/$/, "");
        crossToDefault += 1;
        // Built as a page, or as a file (the .md twin).
        if (fs.existsSync(path.join(EN_BASE, enTarget, "index.html")) || fs.existsSync(path.join(EN_BASE, enTarget))) continue;
        const key = `en:${enTarget}`;
        if (!broken.has(key)) broken.set(key, from);
      }
    }
  }
}

// Links into the Worker's corpus redirect from a fallback locale: fatal, baseline 0 (2026-11-02).
if (viaCorpusRedirect.size > 0) {
  console.error(`\n[check-internal-links] FAIL: ${viaCorpusRedirect.size} link(s) in a fallback locale point at a Learn article or glossary entry that locale does not carry, so the reader passes through the redirect to English.\n`);
  for (const [k, from] of [...viaCorpusRedirect].slice(0, 20)) console.error(`      ${k}   (linked from ${from})`);
  console.error("\n      Link to the English page itself: the shared Link, localiseHref and the glossary hints do it through src/i18n/corpus-routing.ts; a link built by hand must use linkLocaleFor().\n");
  process.exit(1);
}

const LEGACY_UNUSED = (
true);

// ---------------------------------------------------------------------------
// FRAGMENTS (added 2026-10-04). PRIME found the training page's "both
// engagements, in detail" button landing at the TOP of /red-education: the
// link said #cases and the section's id was case-studies. Every href above
// was checked only up to the "#", so a dangling fragment was invisible to this
// guard for as long as it existed. This pass reads each in-locale href that
// carries a fragment, finds the built page it points at, and requires an
// element with that id (or an anchor name) in its HTML. Same shape as the
// route check: distinct (target, fragment) pairs, baseline 0, no exemptions,
// because an anchor that does not exist is exactly a route that does not exist
// with the error one screen further down.
// ---------------------------------------------------------------------------
// Declared, with the reason, never a bare entry. Keyed by route (no locale) and fragment.
const DECLARED_FRAGMENTS = new Map([
  ["/admin1029384756#main", "the private admin surface: its <main id=\"main\"> sits inside PrivPreviewOnly and is rendered only for an authorised client, so the static HTML carries the skip link and not yet its target; for that client the link is correct"],
  ["/copy8825140637#main", "the private copy surface: same gate, same reason"],
]);
const brokenFragments = new Map();
for (const loc of LOCALES_TO_READ) {
  const base = path.join(OUT, loc);
  if (!fs.existsSync(base)) continue;
  const localePages = walk(base).filter((f) => f.endsWith("index.html"));
  // id="x" and name="x" of every built page, read lazily and cached per page.
  const idCache = new Map();
  const idsOf = (file) => {
    if (idCache.has(file)) return idCache.get(file);
    const set = new Set();
    if (fs.existsSync(file)) {
      const h = fs.readFileSync(file, "utf8");
      for (const m of h.matchAll(/\s(?:id|name)="([^"]+)"/g)) set.add(m[1]);
    }
    idCache.set(file, set);
    return set;
  };
  for (const f of localePages) {
    const from = `/${loc}/` + path.relative(base, path.dirname(f)).split(path.sep).join("/");
    const html = fs.readFileSync(f, "utf8");
    for (const m of html.matchAll(new RegExp(`href="(?:/${loc}([^"#?]*))?#([^"]+)"`, "g"))) {
      const rawPath = m[1];
      const frag = decodeURIComponent(m[2]);
      // Same-page fragment ("#contact") when no path precedes the hash; otherwise the named page.
      const targetFile = rawPath === undefined ? f : path.join(base, rawPath.replace(/^\//, "").replace(/\/$/, ""), "index.html");
      // A page that does not exist is the route check's finding, not this one's.
      if (!fs.existsSync(targetFile)) continue;
      // A tool hand-off ("#input=<value>", Round 1 RT01, src/lib/handoff.ts) is state the target tool reads from the
      // address, never an element id; it is accepted only on a tool page, so a stray "#input=" elsewhere still fails.
      if (frag.startsWith("input=") && /^\/tools\/[^/]+\/?$/.test(rawPath ?? "")) continue;
      // "#main" and "#top" are the skip-link and the scroll-to-top conventions; main carries id="main" on every page.
      if (idsOf(targetFile).has(frag)) continue;
      // A declared exception is skipped by route and fragment, whatever the locale.
      const route = (rawPath === undefined ? from.slice(loc.length + 1) : rawPath).replace(/\/$/, "") || "/";
      if (DECLARED_FRAGMENTS.has(`${route}#${frag}`)) continue;
      const key = `${rawPath === undefined ? from : "/" + loc + rawPath}#${frag}`;
      if (!brokenFragments.has(key)) brokenFragments.set(key, from);
    }
  }
}
if (brokenFragments.size > 0) {
  console.error(`\n[check-internal-links] FAIL: ${brokenFragments.size} fragment link(s) point at an id that does not exist on the target page.\n`);
  for (const [k, from] of [...brokenFragments].slice(0, 20)) console.error(`      ${k}   (linked from ${from})`);
  console.error("\n      An anchor that does not exist lands the reader at the top of the page, which reads as a broken link that pretends to work.\n      A target that exists only for an authorised client is declared in DECLARED_FRAGMENTS with its reason.\n");
  process.exit(1);
}

// CLOSED AT ZERO, 2026-09-27.
//
// The one entry this baseline held was the changelog's dated link to
// /industry/history/pre-1996, kept on the reasoning that editing a dated record
// to tidy a report is worse than the broken link. That reasoning is right and it
// was never the only option: public/_redirects had carried a comment since
// 2026-08-06 announcing exactly this redirect, and the rules under it were for
// an unrelated block. The redirect had been documented and never written, so the
// link answered 404 for seven weeks while the guard recorded it as deliberate.
//
// Written now, for all sixteen built locales, bare and splat forms. The record
// is untouched and the reader lands on /about/pre-1996. This guard also learned
// to read the redirect table, and to verify each destination, so a moved route
// with a working 301 is no longer counted as debt and a rule pointing at
// nothing is fatal rather than invisible.
//
// The baseline still counts DISTINCT TARGETS rather than occurrences, because
// since 2026-09-10 the guard reads more than one locale and an occurrence count
// would depend on how many locales a given build included, which is not a
// property of the site.
const distinctTargets = new Set([...broken.keys()].map((k) => k.split(":").slice(1).join(":")));
const BASELINE = 0;

// A redirect whose destination does not resolve is worse than a plain broken
// link: it looks handled. No baseline, ever.
if (danglingRedirects.size > 0) {
  console.error(`\n[check-internal-links] FAIL: ${danglingRedirects.size} link(s) are answered by a redirect whose DESTINATION resolves to nothing.\n`);
  for (const [k, to] of danglingRedirects) console.error(`      ${k}  ->  ${to}`);
  console.error("\n      A rule pointing at a route that no longer exists is a broken link with an extra hop.\n");
  process.exit(1);
}

if (distinctTargets.size > BASELINE) {
  console.error(`\n[check-internal-links] FAIL: ${distinctTargets.size} distinct target(s) resolve to nothing, above the baseline of ${BASELINE}.\n`);
  for (const [target, from] of [...broken].slice(0, 20)) {
    console.error(`      ${target}   (linked from ${from})`);
  }
  console.error("\n      A route that moved leaves its old address looking like a valid string.\n");
  process.exit(1);
}

console.log(
  `[check-internal-links] OK: ${pages.length} page(s), every internal href resolves;` +
  ` ${distinctTargets.size} known-broken target(s) (baseline ${BASELINE}, may only go down);` +
  ` 0 links into the corpus redirect, ${crossToDefault} fallback-locale link(s) to English articles and entries checked.` +
  (distinctTargets.size < BASELINE ? ` LOWER - drop BASELINE to ${distinctTargets.size}.` : ""),
);
