#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-hub-counts.mjs   (POSTBUILD - reads out/; added 2026-10-26)
// ----------------------------------------------------------------------------
// EVERY NUMBER A HUB CARD STATES MUST EQUAL WHAT IT ACTUALLY RENDERS.
//
// WHY. Round 1's external audit (finding CC10, a "Keep") observed that the hub
// counts reconcile, and plan item B5 (PRIME approved batch B on 25/10/2026
// 20:28) asks for a check that keeps it so. The site already derives every
// count from its registries (src/lib/siteCounts.ts, D-63), and two guards
// watch the counts from the source side: check-count-semantics (postbuild)
// pairs each figure with the right noun, and check-vendor-hub-coverage
// (prebuild) proves every vendor-tagged tool lands in some hub section. Neither
// looks at the finished page from the reader's side: a card can derive "64
// tools" from the registry while the hub it opens renders 63 links (a filter
// that differs by one predicate, an article missing in one locale, a guide that
// sits under two certifications and is counted twice). This guard reads the
// built HTML and compares each stated number with the number of DISTINCT
// targets the card or its destination renders.
//
// WHAT IT CHECKS, per locale built in full (en and pt-BR by default):
//   1. /vendor-hubs: each live card's tool and article figures against the
//      distinct tool and article links in the hub's #tools and #learn sections;
//      each hub's own "(N)" section headings against the same sets.
//   2. Each vendor hub's reading-path cards: the article figure against the
//      distinct steps of the same path on /study-guides (matched by title).
//   3. /study-guides: each path card's badge and each family link's badge
//      against the distinct article links in that path's reading order.
//   4. /learn/series: each card's "written of total" against its linked and
//      listed parts; each group's count and jump chip against its cards; the
//      numbers line against the cards, groups and distinct articles.
//   5. /training: each platform card's course figure against the distinct
//      course links on the platform page, and that page's heading likewise.
//   6. /certifications: each vendor card and vendor section badge
//      (certifications, guides) against the certification blocks and the
//      distinct guide links of that vendor; the readiness line, status by
//      status, against the distinct guides carrying each data-status.
//   7. /learn: each subject card and section count against the distinct
//      articles of that subject; the subjects line and the learning modes and
//      surrounding areas whose destination is reconciled elsewhere here.
//   8. /tools: each intent's count against its distinct tools; the directory
//      line (general tools, categories, platform tools) against the index and
//      the union of the vendor hubs.
//   9. /practice: each part's count against its distinct articles.
//  10. The footer directory (read on the home page): each destination's
//      number against the distinct targets that destination renders.
//  11. /industry: each tag chip against the distinct company cards of its tag
//      page, and that page's count line likewise.
//  12. /sitemap: its tool total against the tools the index and hubs render.
// Not reconciled (no distinct target to count on the card's page): objective
// and slide totals, the glossary and people areas on /learn, the industry
// country filters, the endorsements count, the study-guide curriculum and
// module counts. The footer rows it cannot reconcile are listed in --json.
//
// HOW IT STAYS INDEPENDENT OF WORDING. Elements are found by their class names
// and link targets, never by copy. Where one element states several numbers
// (the readiness line, the series numbers line), the order of the numbers is
// read from the locale's own ICU template in src/i18n/messages (the order of
// its top-level arguments), so a translation that reorders the sentence keeps
// working. Numbers are read in either locale's grouping ("1,645" or "1.645").
// A count element whose numbers cannot be mapped fails CLOSED, as a finding.
//
// WHAT "RENDERED" MEANS. Distinct internal link targets present in the static
// HTML inside the relevant container, fragment and query stripped, trailing
// slash normalised. Elements hidden with the `hidden` attribute still count:
// they are in the document (the 2026-08-16 rule on /certifications), and a
// reader reaches them by expanding or filtering.
//
// USAGE
//   node scripts/check-hub-counts.mjs [--out <dir>] [--locales en,pt-BR]
//                                     [--json <file>] [--report-only]
//   --report-only prints the findings and exits 0 (for a stale build).
// A locale whose Learn hub was not built is skipped and named; if no locale is
// built in full the guard skips with exit 0, as check-count-semantics does.
// ============================================================================

// File system access to read the built pages and the message packs.
import fs from "node:fs";
// Path joining for the out/ tree and the packs.
import path from "node:path";
// The WHATWG-conformant HTML parser already in dependencies (package.json), so the guard reads markup as a browser does.
import { parse } from "parse5";

// The tag every line of output starts with, in the house style.
const TAG = "[check-hub-counts]";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

/** Read `--name value` and bare `--flag` arguments into an object. */
function readArgs(argv) {
  // The parsed options.
  const out = {};
  // Walk the arguments after `node script`.
  for (let i = 2; i < argv.length; i += 1) {
    // The current token.
    const a = argv[i];
    // Only `--` tokens are options.
    if (!a.startsWith("--")) continue;
    // The option name without its dashes.
    const key = a.slice(2);
    // The next token, when it is a value rather than another option.
    const next = argv[i + 1];
    // A value-bearing option consumes the next token; a bare flag is true.
    if (next !== undefined && !next.startsWith("--")) {
      // Store the value.
      out[key] = next;
      // Skip the consumed value.
      i += 1;
    } else {
      // Store the flag.
      out[key] = true;
    }
  }
  // Hand the options back.
  return out;
}

// The options for this run.
const ARGS = readArgs(process.argv);
// The built site's root (default: out/ in the working directory, where `next build` writes it).
const OUT = path.resolve(typeof ARGS.out === "string" ? ARGS.out : path.join(process.cwd(), "out"));
// The locales to check: en and pt-BR are authored; the other fourteen render the same figures in English copy.
const LOCALES = typeof ARGS.locales === "string" ? ARGS.locales.split(",").map((s) => s.trim()).filter(Boolean) : ["en", "pt-BR"];
// The message packs, for the ICU templates that fix the order of several numbers in one sentence.
const MESSAGES = path.join(process.cwd(), "src", "i18n", "messages");
// The route folders, to tell an entity route (/industry/<slug>) from a static sibling (/industry/milestones).
const APP_LOCALE = path.join(process.cwd(), "src", "app", "[locale]");

// ---------------------------------------------------------------------------
// The DOM, read with parse5
// ---------------------------------------------------------------------------

// Parsed documents, one parse per page per run.
const DOC_CACHE = new Map();

/** The parsed document for out/<locale>/<rel>/index.html, or null when the page was not built. */
function load(locale, rel) {
  // The page's file on disk (the home page is out/<locale>/index.html).
  const file = path.join(OUT, locale, rel, "index.html");
  // Serve a page parsed earlier in this run.
  if (DOC_CACHE.has(file)) return DOC_CACHE.get(file);
  // A page the build did not emit is reported by the caller, not here.
  const doc = fs.existsSync(file) ? parse(fs.readFileSync(file, "utf8")) : null;
  // Remember the result, including a miss.
  DOC_CACHE.set(file, doc);
  // Hand it back.
  return doc;
}

/** Every element below `node`, depth first, in document order (template contents are not part of the page). */
function* descendants(node) {
  // parse5 keeps children in childNodes; text and comment nodes have none.
  for (const child of node.childNodes ?? []) {
    // Only elements carry a tagName.
    if (child.tagName) yield child;
    // Recurse into the child's own children.
    yield* descendants(child);
  }
}

/** The value of an attribute, or null. */
function attr(el, name) {
  // parse5 stores attributes as [{name, value}].
  const a = (el.attrs ?? []).find((x) => x.name === name);
  // The value when present.
  return a ? a.value : null;
}

/** True when the element's class list contains `c`. */
function hasClass(el, c) {
  // The class attribute split on whitespace, as the DOM's classList does.
  return (attr(el, "class") ?? "").split(/\s+/).includes(c);
}

/** All descendant elements matching a predicate. */
function all(node, pred) {
  // Collect in document order.
  const found = [];
  // Test every descendant.
  for (const el of descendants(node)) if (pred(el)) found.push(el);
  // Hand back the matches.
  return found;
}

/** The first descendant element matching a predicate, or null. */
function first(node, pred) {
  // Stop at the first match.
  for (const el of descendants(node)) if (pred(el)) return el;
  // None matched.
  return null;
}

/** The element with this id, or null. */
function byId(node, id) {
  // ids are unique in a valid document; the first wins otherwise.
  return node ? first(node, (el) => attr(el, "id") === id) : null;
}

/** Predicate: element of a tag (optional) with a class. */
const tc = (tag, c) => (el) => (!tag || el.tagName === tag) && hasClass(el, c);

/** The direct element children of a node. */
function kids(node) {
  // Elements only.
  return (node.childNodes ?? []).filter((n) => n.tagName);
}

/** The visible text of a node: text nodes joined, script and style left out, whitespace collapsed. */
function text(node) {
  // The pieces in order.
  const parts = [];
  // Recursive collector.
  const walk = (n) => {
    // A text node contributes its (already entity-decoded) value.
    if (n.nodeName === "#text") parts.push(n.value);
    // Script, style and template content is not visible text.
    if (n.tagName === "script" || n.tagName === "style" || n.tagName === "template") return;
    // Recurse into children.
    for (const c of n.childNodes ?? []) walk(c);
  };
  // Start at the node itself.
  walk(node);
  // Collapse whitespace the way a reader sees it.
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** The <main> of a page, where its content lives: the header and footer chrome links must not count as targets. */
function mainOf(doc) {
  // Every page in this site renders <main id="main"> (the skip link's target).
  return doc ? first(doc, (el) => el.tagName === "main") : null;
}

// ---------------------------------------------------------------------------
// Link targets
// ---------------------------------------------------------------------------

/** An internal href reduced to its path: origin, query and fragment dropped, trailing slash added. Null when external. */
function normHref(href) {
  // No href, no target.
  if (!href) return null;
  // An absolute link to this site counts as internal (canonical links are written that way in a few places).
  let h = href.replace(/^https?:\/\/(www\.)?ronutz\.com/i, "");
  // Anything else that is not root-relative is external or a pure fragment.
  if (!h.startsWith("/")) return null;
  // Drop the query and the fragment: they address the same page.
  h = h.replace(/[?#].*$/, "");
  // The static export writes directory URLs with a trailing slash; normalise the rest to match.
  return h.endsWith("/") ? h : `${h}/`;
}

/** The fragment of an href (without '#'), or null. */
function hashOf(href) {
  // The part after '#', when present.
  const i = (href ?? "").indexOf("#");
  // Return it, or null when there is none.
  return i === -1 ? null : href.slice(i + 1);
}

/** The distinct normalised targets of the <a> elements below `node` whose path matches `re`. */
function targets(node, re) {
  // A Set keeps each target once, which is the point of "distinct".
  const set = new Set();
  // A missing container renders nothing.
  if (!node) return set;
  // Every anchor below the node.
  for (const a of all(node, (el) => el.tagName === "a")) {
    // Its normalised path.
    const p = normHref(attr(a, "href"));
    // Keep the ones of the wanted kind.
    if (p && re.test(p)) set.add(p);
  }
  // Hand the set back.
  return set;
}

/** Escape a string for use inside a RegExp. */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The target patterns of one locale: one path segment after the section, so docs pages and indexes never count. */
function patterns(locale) {
  // The locale prefix every internal link carries.
  const L = `/${esc(locale)}`;
  // The patterns by kind of target.
  return {
    // A tool page (/tools/<slug>/), not the index and not /tools/<slug>/docs/.
    tool: new RegExp(`^${L}/tools/[^/]+/$`),
    // A Learn article (/learn/<slug>/); /learn/series/ is a static route, not an article.
    article: new RegExp(`^${L}/learn/(?!series/)[^/]+/$`),
    // A certification guide (/certifications/<slug>/).
    guide: new RegExp(`^${L}/certifications/[^/]+/$`),
    // A Practice article (/practice/<slug>/).
    practice: new RegExp(`^${L}/practice/[^/]+/$`),
    // A course page (/training/<platform>/<course>/).
    course: new RegExp(`^${L}/training/[^/]+/[^/]+/$`),
    // An open material (/materials/<slug>/).
    material: new RegExp(`^${L}/materials/[^/]+/$`),
  };
}

/** The pattern for the entity pages of a section (/<section>/<slug>/), minus the section's static sibling routes. */
function entityPattern(locale, section) {
  // The route folder of the section in the app tree.
  const dir = path.join(APP_LOCALE, ...section.split("/"));
  // The section's route folders.
  const dirs = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  // With a [dynamic] segment, the other folders are static siblings (industry/milestones, roles/levels) and are
  // excluded; without one, the folders ARE the entities (industry/chapters/<chapter> is one folder per chapter).
  const statics = dirs.some((d) => d.startsWith("[")) ? dirs.filter((d) => !d.startsWith("[")) : [];
  // A negative lookahead per static sibling, so /industry/milestones/ is not taken for a company.
  const not = statics.length ? `(?!(?:${statics.map(esc).join("|")})/)` : "";
  // One segment after the section.
  return new RegExp(`^/${esc(locale)}/${section.split("/").map(esc).join("/")}/${not}[^/]+/$`);
}

// ---------------------------------------------------------------------------
// Numbers and ICU argument order
// ---------------------------------------------------------------------------

/** Every number in a string, in order: digit runs with either locale's grouping ("1,645", "1.645", "1 645"). */
function numbersIn(s) {
  // Grouped thousands (comma, dot, no-break or narrow no-break space) or a plain run of digits.
  const re = /\d{1,3}(?:[.,  ]\d{3})+(?!\d)|\d+/g;
  // Strip the separators and read each as an integer.
  return [...(s ?? "").matchAll(re)].map((m) => Number(m[0].replace(/[^\d]/g, "")));
}

// The message packs, read once per locale.
const PACKS = new Map();

/** The ICU template at a dotted key for a locale, falling back to English as next-intl does. */
function msg(locale, key) {
  // Read a pack on first use.
  const pack = (loc) => {
    // Serve the cached pack.
    if (PACKS.has(loc)) return PACKS.get(loc);
    // The pack's file.
    const f = path.join(MESSAGES, `${loc}.json`);
    // A missing pack reads as empty.
    const p = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
    // Cache it.
    PACKS.set(loc, p);
    // Hand it back.
    return p;
  };
  // Walk a dotted key through an object.
  const get = (obj) => key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
  // The locale's own string, else the English one.
  const v = get(pack(locale)) ?? get(pack("en"));
  // Only strings are templates.
  return typeof v === "string" ? v : null;
}

/** The names of a template's top-level ICU arguments, in the order they appear ("{a} ... {b, plural, ...}" -> [a, b]). */
function argOrder(template) {
  // The names found at brace depth zero.
  const names = [];
  // The current brace depth.
  let depth = 0;
  // Scan character by character.
  for (let i = 0; i < template.length; i += 1) {
    // The current character.
    const ch = template[i];
    // An opening brace at depth zero starts a top-level argument.
    if (ch === "{") {
      // Record the argument's name.
      if (depth === 0) {
        // The identifier right after the brace.
        const m = /^\s*([A-Za-z_][\w]*)/.exec(template.slice(i + 1));
        // Keep each name once, at its first position.
        if (m && !names.includes(m[1])) names.push(m[1]);
      }
      // Go one level deeper.
      depth += 1;
    } else if (ch === "}") {  // a closing brace ends the current argument or branch
      // Come back up one level.
      depth = Math.max(0, depth - 1);
    }
  }
  // The names in order.
  return names;
}

/**
 * Read the named numeric arguments out of an element's text, mapping the numbers found to the template's argument
 * order. Returns {values} or {error}. A branch such as "=0 {no articles yet}" prints no digits; when the text has
 * no number at all and the template has an "=0" branch, a single argument reads as 0.
 */
function readArgsFrom(textValue, template, names) {
  // A missing template cannot be mapped.
  if (!template) return { error: "no ICU template found for this element" };
  // The wanted names in the template's order.
  const order = argOrder(template).filter((n) => names.includes(n));
  // Every wanted name must be in the template.
  if (order.length !== names.length) return { error: `template lacks ${names.filter((n) => !order.includes(n)).join(", ")}` };
  // The numbers in the element's text.
  const nums = numbersIn(textValue);
  // The zero branch: one argument, no digits printed.
  if (nums.length === 0 && order.length === 1 && /=0\s*\{/.test(template)) return { values: { [order[0]]: 0 } };
  // Otherwise the counts must match one to one, or the mapping is unsafe.
  if (nums.length !== order.length) return { error: `expected ${order.length} number(s) (${order.join(", ")}), found ${nums.length} in "${textValue.slice(0, 120)}"` };
  // Pair them up.
  return { values: Object.fromEntries(order.map((n, i) => [n, nums[i]])) };
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

// Every comparison made, for the JSON report.
const RESULTS = [];
// The mismatches and unreadable elements.
const FINDINGS = [];

/** Record one comparison: a stated number against the distinct targets rendered. */
function expect(locale, page, card, stated, rendered, sample = []) {
  // The comparison as data.
  const row = { locale, page, card, stated, rendered, ok: stated === rendered };
  // Keep a few targets on a mismatch so the finding can be traced without rerunning.
  if (!row.ok) row.sample = [...sample].slice(0, 5);
  // Every comparison goes to the report.
  RESULTS.push(row);
  // A mismatch is a finding.
  if (!row.ok) FINDINGS.push(`${locale}/${page}: ${card}: states ${stated}, renders ${rendered} distinct target(s)`);
}

/** Record an element that should state a count and could not be read. */
function unreadable(locale, page, card, why) {
  // Unreadable is a finding: a guard that cannot read a count must not pass it.
  FINDINGS.push(`${locale}/${page}: ${card}: count not readable (${why})`);
  // And a row in the report.
  RESULTS.push({ locale, page, card, ok: false, error: why });
}

/** Record a page the check needs and the build did not emit. */
function missing(locale, page, why) {
  // A hub that vanished is a finding in its own right.
  FINDINGS.push(`${locale}/${page}: page missing (needed for ${why})`);
}

// ---------------------------------------------------------------------------
// The checks, one function per hub family
// ---------------------------------------------------------------------------

/** 1 and 2: /vendor-hubs cards, each hub's own section headings, and its reading-path badges. Returns the hub sets. */
function checkVendorHubs(locale, P) {
  // The sets every later check may reuse: the union of hub tools and hub articles, and the card count.
  const acc = { tools: new Set(), articles: new Set(), cards: 0, hubs: [] };
  // The vendor home.
  const doc = load(locale, "vendor-hubs");
  // Without it nothing on this family can be checked.
  if (!doc) return missing(locale, "vendor-hubs", "the vendor cards"), acc;
  // The page's content area.
  const main = mainOf(doc);
  // The labels the pack prints after each figure, used to tell the tools figure from the articles figure.
  const toolsLabel = (msg(locale, "vendorsHome.toolsLabel") ?? "").trim().toLowerCase();
  // The articles label.
  const articlesLabel = (msg(locale, "vendorsHome.articlesLabel") ?? "").trim().toLowerCase();
  // Every card, live or coming soon.
  const cards = all(main, (el) => hasClass(el, "vendors-card"));
  // The footer reconciles against this number.
  acc.cards = cards.length;
  // Live cards are links to a hub.
  for (const card of cards.filter((el) => el.tagName === "a")) {
    // The hub's route relative to the locale ("f5").
    const hubPath = normHref(attr(card, "href"));
    // The hub's key, the last path segment.
    const hub = hubPath ? hubPath.split("/").filter(Boolean).pop() : null;
    // The card's display name, for the messages.
    const name = text(first(card, tc("h2", "vendors-card-title")) ?? card);
    // The counts paragraph.
    const counts = first(card, tc("p", "vendors-card-counts"));
    // The stated figures by kind.
    const stated = {};
    // Walk the paragraph's children: a count span, then the label text up to the next span.
    if (counts) {
      // The children in order.
      const nodes = counts.childNodes ?? [];
      // Index-based so the label after each span can be read.
      for (let i = 0; i < nodes.length; i += 1) {
        // Only the count spans start a figure.
        if (!(nodes[i].tagName && hasClass(nodes[i], "vendors-card-count"))) continue;
        // The figure.
        const n = numbersIn(text(nodes[i]))[0];
        // The label: the text nodes after the span, up to the next element that is not a comment.
        let label = "";
        // Collect forward.
        for (let j = i + 1; j < nodes.length && !nodes[j].tagName; j += 1) if (nodes[j].nodeName === "#text") label += nodes[j].value;
        // Compare the way the pack has it.
        label = label.replace(/\s+/g, " ").trim().toLowerCase();
        // Assign by label, from the pack, never from typed copy.
        if (label === toolsLabel) stated.tools = n;
        // The articles figure.
        else if (label === articlesLabel) stated.articles = n;
        // A figure whose label is neither is unreadable.
        else unreadable(locale, "vendor-hubs", `${name} card`, `a figure labelled "${label}" matches neither vendorsHome.toolsLabel nor articlesLabel`);
      }
    }
    // The hub page the card opens.
    const hubDoc = hub ? load(locale, hub) : null;
    // A live card must open a built hub.
    if (!hubDoc) { missing(locale, hub ?? "(unknown hub)", `the ${name} card`); continue; }
    // The hub's content area.
    const hubMain = mainOf(hubDoc);
    // The hub's tools section.
    const toolsSec = byId(hubMain, "tools");
    // The hub's articles section.
    const learnSec = byId(hubMain, "learn");
    // The distinct tools the hub renders.
    const hubTools = targets(toolsSec, P.tool);
    // The distinct articles the hub renders.
    const hubArticles = targets(learnSec, P.article);
    // Into the unions the footer and /tools checks use.
    for (const t of hubTools) acc.tools.add(t);
    // Same for articles.
    for (const a of hubArticles) acc.articles.add(a);
    // Remember the hub for the summary.
    acc.hubs.push(hub);
    // The card's tools figure against the hub.
    if (stated.tools === undefined) unreadable(locale, "vendor-hubs", `${name} card`, "no tools figure");
    // Compare when read.
    else expect(locale, "vendor-hubs", `${name} card, tools`, stated.tools, hubTools.size, hubTools);
    // The articles figure is omitted when zero (the page renders it only when articles > 0).
    expect(locale, "vendor-hubs", `${name} card, articles`, stated.articles ?? 0, hubArticles.size, hubArticles);
    // The hub's own headings, "Tools (N)" and "Articles (N)".
    for (const [sec, set, label] of [[toolsSec, hubTools, "tools heading"], [learnSec, hubArticles, "articles heading"]]) {
      // A hub without the section is reported once.
      if (!sec) { unreadable(locale, hub, label, "section missing"); continue; }
      // The section's first heading.
      const h2 = first(sec, (el) => el.tagName === "h2");
      // The numbers in it (the heading's words carry none).
      const nums = h2 ? numbersIn(text(h2)) : [];
      // Exactly one number, or the heading is unreadable.
      if (nums.length !== 1) unreadable(locale, hub, label, `expected one number in "${h2 ? text(h2) : ""}"`);
      // Compare it.
      else expect(locale, hub, label, nums[0], set.size, set);
    }
    // 2. The hub's reading-path cards, which link to the vendor's group on /study-guides.
    for (const rp of all(hubMain, (el) => el.tagName === "a" && hasClass(el, "learn-portal-card") && (hashOf(attr(el, "href")) ?? "").startsWith("paths-"))) {
      // The path's title as the card shows it, the arrow left out.
      const title = text(first(rp, tc("p", "learn-portal-title")) ?? rp).replace(/[→→]/g, "").trim();
      // The badge with the article figure.
      const badge = first(rp, tc("span", "learn-portal-badge"));
      // The figure, mapped through the template.
      const read = readArgsFrom(badge ? text(badge) : "", msg(locale, "studyGuidesIndex.articlesCount"), ["count"]);
      // Unreadable badges are findings.
      if (read.error) { unreadable(locale, hub, `reading path "${title}"`, read.error); continue; }
      // The same path on /study-guides.
      const steps = studyGuideSteps(locale, P, hashOf(attr(rp, "href")), title);
      // A path the study guides page does not render is a finding.
      if (!steps) { unreadable(locale, hub, `reading path "${title}"`, "no card with this title in its group on /study-guides"); continue; }
      // Compare the hub's figure with the steps the path renders.
      expect(locale, hub, `reading path "${title}"`, read.values.count, steps.size, steps);
    }
  }
  // Hand the unions back.
  return acc;
}

/** The distinct article steps of the path card titled `title` inside the group `groupId` on /study-guides. */
function studyGuideSteps(locale, P, groupId, title) {
  // The study guides page.
  const doc = load(locale, "study-guides");
  // The vendor's group.
  const group = byId(mainOf(doc), groupId);
  // No group, no steps.
  if (!group) return null;
  // Each path card in the group.
  for (const card of all(group, (el) => hasClass(el, "certhub-note") && attr(el, "id"))) {
    // The card's title without its badge.
    const h4 = first(card, (el) => el.tagName === "h4");
    // Title text minus the badge text.
    const badge = h4 ? first(h4, tc("span", "certhub-guide-code")) : null;
    // Compare like with like.
    const t = h4 ? text(h4).replace(badge ? text(badge) : "", "").trim() : "";
    // The matching card's steps.
    if (t === title) return targets(first(card, tc("ol", "reading-path-steps")), P.article);
  }
  // No card with that title.
  return null;
}

/** 3: /study-guides path badges and family links. Returns the number of path cards. */
function checkStudyGuides(locale, P) {
  // The page.
  const doc = load(locale, "study-guides");
  // Report a missing page once.
  if (!doc) return missing(locale, "study-guides", "the reading paths"), null;
  // Its content area.
  const main = mainOf(doc);
  // The template of the badge ("{depth} · {count} articles").
  const tpl = msg(locale, "studyGuidesIndex.articlesCountDepth");
  // Steps per path id, for the family links.
  const stepsById = new Map();
  // Every path card (a certhub-note with an id, inside a reading-path list).
  const cards = all(main, (el) => hasClass(el, "reading-path-list")).flatMap((list) => kids(list).filter((el) => hasClass(el, "certhub-note") && attr(el, "id")));
  // Check each card.
  for (const card of cards) {
    // The path id.
    const id = attr(card, "id");
    // Its distinct steps.
    const steps = targets(first(card, tc("ol", "reading-path-steps")), P.article);
    // Kept for the family links.
    stepsById.set(id, steps);
    // The badge in the card's heading.
    const badge = first(first(card, (el) => el.tagName === "h4") ?? card, tc("span", "certhub-guide-code"));
    // Read the figure.
    const read = readArgsFrom(badge ? text(badge) : "", tpl, ["count"]);
    // Unreadable is a finding.
    if (read.error) unreadable(locale, "study-guides", `path ${id}`, read.error);
    // Compare.
    else expect(locale, "study-guides", `path ${id}`, read.values.count, steps.size, steps);
  }
  // The family links above the cards, each an anchor to a card with the same badge.
  for (const a of all(main, tc("a", "reading-path-family-link"))) {
    // The path the link points at.
    const id = hashOf(attr(a, "href"));
    // Its badge.
    const badge = first(a, tc("span", "certhub-guide-code"));
    // Read it.
    const read = readArgsFrom(badge ? text(badge) : "", tpl, ["count"]);
    // A link to a card that does not exist is a finding.
    if (!stepsById.has(id)) { unreadable(locale, "study-guides", `family link #${id}`, "no path card with this id"); continue; }
    // Unreadable is a finding.
    if (read.error) unreadable(locale, "study-guides", `family link #${id}`, read.error);
    // Compare.
    else expect(locale, "study-guides", `family link #${id}`, read.values.count, stepsById.get(id).size, stepsById.get(id));
  }
  // The number of reading paths the page renders, for the footer and the Learn modes.
  return cards.length;
}

/** 4: /learn/series. Returns the number of series cards. */
function checkSeries(locale, P) {
  // The page.
  const doc = load(locale, "learn/series");
  // Report a missing page once.
  if (!doc) return missing(locale, "learn/series", "the series cards"), null;
  // Its content area.
  const main = mainOf(doc);
  // Every series card.
  const cards = all(main, tc("li", "series-card"));
  // Each card: "written of total parts".
  for (const card of cards) {
    // The series id.
    const id = attr(card, "id") ?? "(no id)";
    // The parts list.
    const ol = first(card, (el) => el.tagName === "ol");
    // Every listed part, written or planned.
    const items = ol ? kids(ol).filter((el) => el.tagName === "li") : [];
    // The distinct written parts.
    const linked = targets(ol, P.article);
    // The count line.
    const line = first(card, tc("p", "series-card-count"));
    // Read written and total in the template's order.
    const read = readArgsFrom(line ? text(line) : "", msg(locale, "learnSeries.count"), ["written", "total"]);
    // Unreadable is a finding.
    if (read.error) { unreadable(locale, "learn/series", `series ${id}`, read.error); continue; }
    // Written against the distinct linked parts.
    expect(locale, "learn/series", `series ${id}, written`, read.values.written, linked.size, linked);
    // Total against the listed parts.
    expect(locale, "learn/series", `series ${id}, parts`, read.values.total, items.length);
  }
  // Each group's count against its cards.
  for (const group of all(main, tc("section", "series-group"))) {
    // The group's anchor id ("group-<g>").
    const gid = attr(group, "id");
    // Its cards.
    const n = all(group, tc("li", "series-card")).length;
    // The heading's count.
    const span = first(group, tc("span", "series-group-count"));
    // Read it.
    const read = readArgsFrom(span ? text(span) : "", msg(locale, "learnSeries.groupCount"), ["count"]);
    // Unreadable is a finding.
    if (read.error) unreadable(locale, "learn/series", `${gid} heading`, read.error);
    // Compare.
    else expect(locale, "learn/series", `${gid} heading`, read.values.count, n);
    // The jump chip that points at this group.
    const chip = first(main, (el) => el.tagName === "a" && attr(el, "href") === `#${gid}`);
    // Its bare number.
    const nums = chip ? numbersIn(text(first(chip, tc("span", "mono")) ?? chip)) : [];
    // A missing or unreadable chip is a finding.
    if (nums.length !== 1) unreadable(locale, "learn/series", `${gid} jump chip`, "no single number");
    // Compare.
    else expect(locale, "learn/series", `${gid} jump chip`, nums[0], n);
  }
  // The numbers line: series, subjects, vendors, articles.
  const stats = first(main, tc("p", "series-index-stats"));
  // Read it in the template's order.
  const read = readArgsFrom(stats ? text(stats) : "", msg(locale, "learnSeries.indexStats"), ["series", "subjects", "vendors", "articles"]);
  // Unreadable is a finding.
  if (read.error) unreadable(locale, "learn/series", "numbers line", read.error);
  else {  // the template could be read: compare each figure
    // The distinct articles across every card (opener and parts).
    const arts = new Set(cards.flatMap((c) => [...targets(c, P.article)]));
    // Series against cards.
    expect(locale, "learn/series", "numbers line, series", read.values.series, cards.length);
    // Subjects against the groups of the subjects half.
    expect(locale, "learn/series", "numbers line, subjects", read.values.subjects, all(byId(main, "half-subjects") ?? { childNodes: [] }, tc("section", "series-group")).length);
    // Vendors against the groups of the vendors half.
    expect(locale, "learn/series", "numbers line, vendors", read.values.vendors, all(byId(main, "half-vendors") ?? { childNodes: [] }, tc("section", "series-group")).length);
    // Articles against the distinct articles.
    expect(locale, "learn/series", "numbers line, articles", read.values.articles, arts.size, arts);
  }
  // The number of series, for the footer and Learn.
  return cards.length;
}

/** 5: /training platform cards and platform pages. Returns the distinct courses across platforms. */
function checkTraining(locale, P) {
  // The distinct courses across every platform page.
  const courses = new Set();
  // The training page.
  const doc = load(locale, "training");
  // Report a missing page once.
  if (!doc) return missing(locale, "training", "the platform cards"), null;
  // Each platform card.
  for (const card of all(mainOf(doc), tc("a", "platform-card"))) {
    // The platform route ("training/f5").
    const rel = (normHref(attr(card, "href")) ?? "").split("/").filter(Boolean).slice(1).join("/");
    // The meta line: the course figure first, then "since <year>" (JSX order on the training page).
    const meta = first(card, tc("span", "platform-card-meta"));
    // Its numbers.
    const nums = meta ? numbersIn(text(meta)) : [];
    // The platform page.
    const pDoc = load(locale, rel);
    // A card that opens no page is a finding.
    if (!pDoc) { missing(locale, rel, "a platform card"); continue; }
    // The platform page's content area.
    const pMain = mainOf(pDoc);
    // The distinct courses listed there.
    const list = targets(first(pMain, tc("ul", "course-list")), P.course);
    // Into the union.
    for (const c of list) courses.add(c);
    // Two numbers (courses, year) are expected; anything else is unreadable.
    if (nums.length !== 2) unreadable(locale, "training", `${rel} card`, `expected the course figure and the year, found "${meta ? text(meta) : ""}"`);
    // Compare the figure.
    else expect(locale, "training", `${rel} card`, nums[0], list.size, list);
    // The platform page's heading ("N courses").
    const h2 = first(pMain, tc("h2", "platform-courses-heading"));
    // Read it.
    const read = readArgsFrom(h2 ? text(h2) : "", msg(locale, "training.coursesHeading"), ["count"]);
    // Unreadable is a finding.
    if (read.error) unreadable(locale, rel, "courses heading", read.error);
    // Compare.
    else expect(locale, rel, "courses heading", read.values.count, list.size, list);
  }
  // The union, for the footer.
  return courses;
}

/** 6: /certifications vendor cards, vendor sections and the readiness line. Returns the distinct guides. */
function checkCertifications(locale, P) {
  // The page.
  const doc = load(locale, "certifications");
  // Report a missing page once.
  if (!doc) return missing(locale, "certifications", "the certification hub"), null;
  // Its content area.
  const main = mainOf(doc);
  // The template of the vendor figure ("{certs} certifications, {guides} exam guides").
  const tpl = msg(locale, "certGuides.vendorCount");
  // Each vendor section.
  for (const sec of all(main, (el) => el.tagName === "section" && (attr(el, "id") ?? "").startsWith("vendor-"))) {
    // Its anchor id.
    const vKey = attr(sec, "id");
    // The certifications container.
    const certsBox = byId(sec, `${vKey}-certs`);
    // The certification blocks: direct children with an id and a toggle row.
    const certs = certsBox ? kids(certsBox).filter((el) => attr(el, "id") && first(el, tc("button", "certhub-cert-row"))) : [];
    // The distinct guides of this vendor.
    const guides = targets(sec, P.guide);
    // The section's own badge, inside its toggle button.
    const head = first(sec, tc("button", "certhub-cert-row"));
    // The badge span.
    const badge = head ? first(head, tc("span", "certs-badge")) : null;
    // The overview card that points at this section.
    const card = first(main, (el) => el.tagName === "a" && attr(el, "href") === `#${vKey}`);
    // Its badge.
    const cardBadge = card ? first(card, tc("span", "certhub-guide-badge")) : null;
    // Check both places the figure is stated.
    for (const [where, el] of [[`${vKey} section`, badge], [`${vKey} card`, cardBadge]]) {
      // Read certifications and guides in the template's order.
      const read = readArgsFrom(el ? text(el) : "", tpl, ["certs", "guides"]);
      // Unreadable is a finding.
      if (read.error) { unreadable(locale, "certifications", where, read.error); continue; }
      // Certifications against the blocks.
      expect(locale, "certifications", `${where}, certifications`, read.values.certs, certs.length);
      // Guides against the distinct guide links.
      expect(locale, "certifications", `${where}, guides`, read.values.guides, guides.size, guides);
    }
  }
  // The readiness line, status by status.
  // "announced" since 26/10/2026 (src/lib/certStatus.ts), in the template's order.
  const statuses = ["current", "announced", "transitioning", "beta", "superseded", "unknown", "preparing", "retired"];
  // The line itself.
  const line = first(main, tc("p", "certs-readiness"));
  // Read the eight figures in the template's order.
  const read = readArgsFrom(line ? text(line) : "", msg(locale, "certGuides.readiness"), statuses);
  // The distinct guides by status, from each card's data-status.
  const byStatus = Object.fromEntries(statuses.map((s) => [s, new Set()]));
  // Each guide card wrapper.
  for (const li of all(main, (el) => el.tagName === "li" && attr(el, "data-status"))) {
    // The guide it links.
    for (const g of targets(li, P.guide)) (byStatus[attr(li, "data-status")] ??= new Set()).add(g);
  }
  // Unreadable is a finding.
  if (read.error) unreadable(locale, "certifications", "readiness line", read.error);
  // Each status against its distinct guides.
  else for (const s of statuses) expect(locale, "certifications", `readiness, ${s}`, read.values[s], byStatus[s].size, byStatus[s]);
  // The distinct guides on the page, for the footer and Learn.
  return targets(main, P.guide);
}

/** 7a: the /learn subject cards and sections. Returns the distinct vendor-neutral articles and the subject count. */
function checkLearnSubjects(locale, P) {
  // The Learn hub.
  const doc = load(locale, "learn");
  // Report a missing page once.
  if (!doc) return missing(locale, "learn", "the subject cards"), null;
  // Its content area.
  const main = mainOf(doc);
  // The article sections: a category-section with an id and a learn grid.
  const sections = all(main, (el) => el.tagName === "section" && hasClass(el, "category-section") && attr(el, "id") && first(el, tc("ul", "learn-grid")));
  // The distinct articles per subject.
  const bySubject = new Map(sections.map((s) => [attr(s, "id"), targets(first(s, tc("ul", "learn-grid")), P.article)]));
  // The union across subjects.
  const union = new Set([...bySubject.values()].flatMap((s) => [...s]));
  // Each section's own "(N)".
  for (const s of sections) {
    // The count span in its heading.
    const span = first(s, tc("span", "category-count"));
    // Its number.
    const nums = span ? numbersIn(text(span)) : [];
    // Exactly one number.
    if (nums.length !== 1) unreadable(locale, "learn", `#${attr(s, "id")} heading`, "no single number");
    // Compare.
    else expect(locale, "learn", `#${attr(s, "id")} heading`, nums[0], bySubject.get(attr(s, "id")).size, bySubject.get(attr(s, "id")));
  }
  // Each subject card.
  for (const li of all(main, tc("li", "hub-subject"))) {
    // The subject key from the card's link (/category/<key>/).
    const key = (normHref(attr(first(li, tc("a", "hub-subject-link")) ?? li, "href")) ?? "").split("/").filter(Boolean).pop();
    // The card's count.
    const span = first(li, tc("span", "hub-subject-count"));
    // Read it.
    const read = readArgsFrom(span ? text(span) : "", msg(locale, "learn.hub.subjectCount"), ["count"]);
    // Unreadable is a finding.
    if (read.error) { unreadable(locale, "learn", `subject card ${key}`, read.error); continue; }
    // A card for a subject the index does not render is a finding.
    if (!bySubject.has(key)) { unreadable(locale, "learn", `subject card ${key}`, "no section with this id"); continue; }
    // Compare.
    expect(locale, "learn", `subject card ${key}`, read.values.count, bySubject.get(key).size, bySubject.get(key));
  }
  // The subjects line ("N articles in M subjects").
  const lede = first(first(main, (el) => hasClass(el, "hub-subjects")) ?? { childNodes: [] }, tc("p", "hub-lede"));
  // Read it.
  const read = readArgsFrom(lede ? text(lede) : "", msg(locale, "learn.hub.subjectsLede"), ["count", "subjects"]);
  // Unreadable is a finding.
  if (read.error) unreadable(locale, "learn", "subjects line", read.error);
  else {  // the template could be read: compare each figure
    // Articles against the union.
    expect(locale, "learn", "subjects line, articles", read.values.count, union.size, union);
    // Subjects against the sections.
    expect(locale, "learn", "subjects line, subjects", read.values.subjects, sections.length);
  }
  // Hand back what the modes and the footer need.
  return { union, subjects: sections.length, main };
}

/** 7b: the /learn modes and surrounding areas whose destinations are reconciled elsewhere in this run. */
function checkLearnModes(locale, learn, known) {
  // Nothing to do without the hub.
  if (!learn) return;
  // The modes: href -> [template key, the stated argument this run can reconcile, the rendered value].
  const modes = {
    // The subjects mode counts the vendor-neutral articles and the subjects.
    "#subjects": ["learn.hub.modeCount.subject", ["count", "subjects"], { count: learn.union.size, subjects: learn.subjects }],
    // The reading paths mode counts the path cards on /study-guides.
    "/study-guides": ["learn.hub.modeCount.path", ["count"], { count: known.paths }],
    // The certification mode counts the guides (its objectives figure is not a card target and is not reconciled here).
    "/certifications": ["learn.hub.modeCount.certification", ["count", "objectives"], { count: known.guides?.size }],
    // The platform mode counts the vendor hubs (the cards on /vendor-hubs).
    "/vendor-hubs": ["learn.hub.modeCount.platform", ["count"], { count: known.hubCards }],
    // The course mode counts the open materials (its slides figure is not a card target).
    "/materials": ["learn.hub.modeCount.course", ["count", "slides"], { count: known.materials?.size }],
  };
  // Each mode card.
  for (const a of all(learn.main, tc("a", "intent-link"))) {
    // The raw href: the subjects mode is a fragment on this page.
    const raw = attr(a, "href") ?? "";
    // The key: the fragment itself, or the path without the locale.
    const key = raw.startsWith("#") ? raw : `/${(normHref(raw) ?? "").split("/").filter(Boolean).slice(1).join("/")}`;
    // Modes this run does not reconcile (the glossary) are skipped.
    if (!modes[key]) continue;
    // The template, the names and the rendered values.
    const [tplKey, names, rendered] = modes[key];
    // The verb-and-count span (the verb carries no digits).
    const span = first(a, tc("span", "intent-verb"));
    // Read the numbers in the template's order.
    const read = readArgsFrom(span ? text(span) : "", msg(locale, tplKey), names);
    // Unreadable is a finding.
    if (read.error) { unreadable(locale, "learn", `mode ${key}`, read.error); continue; }
    // Compare every argument this run can reconcile.
    for (const [n, v] of Object.entries(rendered)) if (v !== undefined && v !== null) expect(locale, "learn", `mode ${key}, ${n}`, read.values[n], v);
  }
  // The surrounding areas: href -> [template key, rendered].
  const around = {
    // The series area counts the series cards.
    "/learn/series": ["learn.portalSeriesCount", known.series],
    // The Practice area counts the distinct Practice articles.
    "/practice": ["learn.portalPracticeCount", known.practice?.size],
    // The roles area counts the distinct role pages on /roles.
    "/roles": ["learn.portalRolesCount", known.roles?.size],
  };
  // Each area row.
  for (const li of all(learn.main, tc("li", "hub-around-item"))) {
    // Its link.
    const link = first(li, tc("a", "hub-around-link"));
    // The key without the locale.
    const key = `/${(normHref(attr(link ?? li, "href")) ?? "").split("/").filter(Boolean).slice(1).join("/")}`;
    // Areas this run does not reconcile are skipped.
    if (!around[key] || around[key][1] === undefined || around[key][1] === null) continue;
    // The count span (absent for areas without a count).
    const span = first(li, tc("span", "hub-around-count"));
    // A row without a count states nothing (the "where to start" list reuses this row class for plain links).
    if (!span) continue;
    // Read the single figure.
    const read = readArgsFrom(span ? text(span) : "", msg(locale, around[key][0]), ["count"]);
    // Unreadable is a finding.
    if (read.error) unreadable(locale, "learn", `area ${key}`, read.error);
    // Compare.
    else expect(locale, "learn", `area ${key}`, read.values.count, around[key][1]);
  }
}

/** 8: /tools intents and the directory line. Returns the distinct general-purpose tools. */
function checkTools(locale, P, hubTools) {
  // The page.
  const doc = load(locale, "tools");
  // Report a missing page once.
  if (!doc) return missing(locale, "tools", "the tools hub"), null;
  // Its content area.
  const main = mainOf(doc);
  // Each intent card.
  for (const d of all(main, tc("details", "hub-intent"))) {
    // Its id ("intent-<x>").
    const id = attr(d, "id") ?? "(intent)";
    // Its distinct tools.
    const set = targets(first(d, tc("ul", "hub-intent-list")), P.tool);
    // Its bare number.
    const nums = numbersIn(text(first(d, tc("span", "hub-intent-count")) ?? { childNodes: [] }));
    // Exactly one number.
    if (nums.length !== 1) unreadable(locale, "tools", id, "no single number");
    // Compare.
    else expect(locale, "tools", id, nums[0], set.size, set);
  }
  // The directory: category sections with a tools grid.
  const sections = all(main, (el) => el.tagName === "section" && hasClass(el, "category-section") && attr(el, "id") && first(el, tc("ul", "tools-grid")));
  // The distinct general-purpose tools.
  const general = new Set(sections.flatMap((s) => [...targets(first(s, tc("ul", "tools-grid")), P.tool)]));
  // The platform tools: on some hub and not in the general index.
  const platform = new Set([...hubTools].filter((t) => !general.has(t)));
  // The directory line.
  const lede = first(byId(main, "directory") ?? { childNodes: [] }, tc("p", "hub-lede"));
  // Read it in the template's order.
  const read = readArgsFrom(lede ? text(lede) : "", msg(locale, "tools.hub.directoryLede"), ["count", "categories", "platform"]);
  // Unreadable is a finding.
  if (read.error) unreadable(locale, "tools", "directory line", read.error);
  else {  // the template could be read: compare each figure
    // General tools against the index.
    expect(locale, "tools", "directory line, general-purpose tools", read.values.count, general.size, general);
    // Categories against the sections.
    expect(locale, "tools", "directory line, categories", read.values.categories, sections.length);
    // Platform tools against the hubs minus the index.
    expect(locale, "tools", "directory line, platform tools", read.values.platform, platform.size, platform);
  }
  // The general set, for the footer.
  return general;
}

/** 9: /practice part cards. Returns the distinct Practice articles. */
function checkPractice(locale, P) {
  // The page.
  const doc = load(locale, "practice");
  // Report a missing page once.
  if (!doc) return missing(locale, "practice", "the part cards"), null;
  // Its content area.
  const main = mainOf(doc);
  // Each part card is a <details> holding a count and a list.
  for (const d of all(main, (el) => el.tagName === "details" && first(el, tc("span", "practice-part-card-count")))) {
    // The part's title, for the message.
    const title = text(first(d, tc("span", "practice-part-card-title")) ?? d).slice(0, 60);
    // Its distinct articles.
    const set = targets(first(d, tc("ol", "practice-part-list")), P.practice);
    // Read the figure (an "=0" branch prints no digits).
    const read = readArgsFrom(text(first(d, tc("span", "practice-part-card-count"))), msg(locale, "practice.articleCount"), ["n"]);
    // Unreadable is a finding.
    if (read.error) unreadable(locale, "practice", `part "${title}"`, read.error);
    // Compare.
    else expect(locale, "practice", `part "${title}"`, read.values.n, set.size, set);
  }
  // The distinct Practice articles on the page.
  return targets(main, P.practice);
}

/** 11: /industry tag chips and the tag pages. Returns the distinct company records on /industry. */
function checkIndustry(locale) {
  // The industry index.
  const doc = load(locale, "industry");
  // Report a missing page once.
  if (!doc) return missing(locale, "industry", "the industry record"), null;
  // Its content area.
  const main = mainOf(doc);
  // The company pattern: /industry/<slug>/ minus the static siblings.
  const re = entityPattern(locale, "industry");
  // The company cards (the tag chips share the [slug] route, so cards are told apart by their class).
  const companies = (node) => new Set(all(node, tc("a", "vendor-card")).map((a) => normHref(attr(a, "href"))).filter((p) => p && re.test(p)));
  // Each tag chip opens a tag page that lists its companies.
  for (const chip of all(main, tc("a", "industry-tag-chip"))) {
    // The tag page route ("industry/vendors").
    const rel = (normHref(attr(chip, "href")) ?? "").split("/").filter(Boolean).slice(1).join("/");
    // The chip's bare number.
    const nums = numbersIn(text(first(chip, tc("span", "industry-tag-chip-n")) ?? { childNodes: [] }));
    // The tag page.
    const tDoc = load(locale, rel);
    // A chip that opens no page is a finding.
    if (!tDoc) { missing(locale, rel, "an industry tag chip"); continue; }
    // The distinct companies the tag page lists.
    const listed = companies(mainOf(tDoc));
    // Exactly one number on the chip.
    if (nums.length !== 1) unreadable(locale, "industry", `tag chip ${rel}`, "no single number");
    // Compare the chip.
    else expect(locale, "industry", `tag chip ${rel}`, nums[0], listed.size, listed);
    // The tag page's own count line (an "=0" branch prints no digits).
    const read = readArgsFrom(text(first(mainOf(tDoc), tc("p", "ztc-notes")) ?? { childNodes: [] }), msg(locale, "industryTags.count"), ["count"]);
    // Unreadable is a finding.
    if (read.error) unreadable(locale, rel, "count line", read.error);
    // Compare.
    else expect(locale, rel, "count line", read.values.count, listed.size, listed);
  }
  // The distinct companies on the index, for the footer.
  return companies(main);
}

/** The distinct entity pages a section's index renders inside its <main> (/industry/<slug>, /roles/<slug>...). */
function entityTargets(locale, section, within) {
  // The section's index page.
  const doc = load(locale, section);
  // No page, no set.
  if (!doc) return null;
  // The container: the whole main, or the elements of a class when the page links entities in other ways too.
  const main = mainOf(doc);
  // The pattern for the section's entity routes.
  const re = within?.re ?? entityPattern(locale, section);
  // Scoped to a class when given (the stories page links its stories with story-link).
  if (within?.cls) return new Set(all(main, tc("a", within.cls)).map((a) => normHref(attr(a, "href"))).filter((p) => p && re.test(p)));
  // Otherwise every matching link in main.
  return targets(main, re);
}

/** 10: the footer directory, read on the home page. */
function checkFooter(locale, known) {
  // The home page.
  const doc = load(locale, "");
  // Report a missing page once.
  if (!doc) return missing(locale, "(home)", "the footer directory");
  // The footer (the chrome, so not mainOf).
  const footer = first(doc, (el) => el.tagName === "footer");
  // Each directory row with a count.
  for (const li of all(footer ?? doc, tc("li", "footer-world-item"))) {
    // Its link.
    const a = first(li, tc("a", "footer-world-link"));
    // Its count span.
    const c = first(li, tc("span", "footer-world-count"));
    // Rows without a count (Dev tools, Advisory...) are not counts.
    if (!a || !c) continue;
    // The destination without the locale ("/tools").
    const dest = `/${(normHref(attr(a, "href")) ?? "").split("/").filter(Boolean).slice(1).join("/")}`;
    // The bare number, in the aria-hidden span (the sr-only phrase repeats it with words).
    const nums = numbersIn(text(first(c, (el) => attr(el, "aria-hidden") === "true") ?? c));
    // The rendered value for this destination, when this run reconciles it.
    const rendered = known.footer[dest];
    // Destinations not reconciled are listed in the report, not failed.
    if (rendered === undefined || rendered === null) { RESULTS.push({ locale, page: "(footer)", card: dest, ok: true, note: "not reconciled by this guard" }); continue; }
    // The first number is the count (the aria-hidden span holds only it).
    if (nums.length < 1) unreadable(locale, "(footer)", dest, "no number");
    // Compare.
    else expect(locale, "(footer)", dest, nums[0], rendered.size ?? rendered, rendered instanceof Set ? rendered : []);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

// The locales actually checked.
const checked = [];
// The locales skipped because the build did not render them in full.
const skipped = [];
// Check each requested locale.
for (const locale of LOCALES) {
  // A locale counts as built in full when its Learn hub exists (the rule check-count-semantics uses).
  if (!fs.existsSync(path.join(OUT, locale, "learn", "index.html"))) { skipped.push(locale); continue; }
  // Record it.
  checked.push(locale);
  // The target patterns for this locale.
  const P = patterns(locale);
  // 1-2: vendor hubs, which also yield the hub unions.
  const hubs = checkVendorHubs(locale, P);
  // 3: the study guides.
  const paths = checkStudyGuides(locale, P);
  // 4: the series.
  const series = checkSeries(locale, P);
  // 5: training.
  const courses = checkTraining(locale, P);
  // 6: certifications.
  const guides = checkCertifications(locale, P);
  // 7a: Learn subjects.
  const learn = checkLearnSubjects(locale, P);
  // 8: tools.
  const general = checkTools(locale, P, hubs.tools);
  // 9: practice.
  const practice = checkPractice(locale, P);
  // The open materials and the entity indexes, counted once for the modes and the footer.
  const materials = entityTargets(locale, "materials", { re: P.material });
  // The roles on /roles.
  const roles = entityTargets(locale, "roles");
  // 7b: the Learn modes and areas.
  checkLearnModes(locale, learn, { paths, guides, hubCards: hubs.cards, materials, series, practice, roles });
  // All tools the site renders: the general index and the hubs together (the footer and /sitemap state this figure).
  const allTools = general ? new Set([...general, ...hubs.tools]) : null;
  // 12: /sitemap states the tool total without listing tools; it must equal what the index and the hubs render.
  const smDoc = load(locale, "sitemap");
  // Only when both the page and the union exist.
  if (smDoc && allTools) {
    // The count line.
    const line = first(mainOf(smDoc), tc("p", "sitemap-tools-count"));
    // Read it through the template.
    const read = readArgsFrom(line ? text(line) : "", msg(locale, "sitemap.toolsCount"), ["count"]);
    // Unreadable is a finding.
    if (read.error) unreadable(locale, "sitemap", "tools count", read.error);
    // Compare.
    else expect(locale, "sitemap", "tools count", read.values.count, allTools.size, allTools);
  }
  // 10: the footer, each destination against what it renders.
  checkFooter(locale, {
    footer: {  // destination path -> what that destination renders (a Set, a number, or null when not reconciled)
      // All tools: the general index and the hubs together.
      "/tools": allTools,
      // All articles: the subject index and the hubs together.
      "/learn": learn ? new Set([...learn.union, ...hubs.articles]) : null,
      // The series cards.
      "/learn/series": series,
      // The stories, linked by story-link on /stories.
      "/stories": entityTargets(locale, "stories", { re: P.article, cls: "story-link" }),
      // The reading paths.
      "/study-guides": paths,
      // The open materials.
      "/materials": materials,
      // The certification guides.
      "/certifications": guides,
      // The glossary entries.
      "/glossary": entityTargets(locale, "glossary"),
      // The Practice articles.
      "/practice": practice,
      // The industry records (company cards; the tag chips are checked against their own pages).
      "/industry": checkIndustry(locale),
      // The vendor hubs (every card, live or coming soon).
      "/vendor-hubs": hubs.cards,
      // The roles.
      "/roles": roles,
      // The career chapters.
      "/industry/chapters": entityTargets(locale, "industry/chapters"),
      // The courses taught, across the platform pages.
      "/training": courses,
    },
  });
}

// The machine-readable report, when asked for.
if (typeof ARGS.json === "string") {
  // Write the comparisons and the findings.
  fs.writeFileSync(ARGS.json, `${JSON.stringify({ out: OUT, checked, skipped, findings: FINDINGS, results: RESULTS }, null, 2)}\n`);
}
// Nothing built in full: skip, as the sibling postbuild guards do.
if (checked.length === 0) {
  // Say so plainly.
  console.log(`${TAG} SKIP: no locale built in full (no out/<locale>/learn/index.html for ${LOCALES.join(", ")}).`);
  // Not a failure: a gated build has nothing to reconcile.
  process.exit(0);
}
// The number of comparisons made.
const compared = RESULTS.filter((r) => r.stated !== undefined).length;
// Findings fail the build unless the run is a report on a stale tree.
if (FINDINGS.length) {
  // The header line.
  console.error(`${TAG} ${ARGS["report-only"] ? "REPORT" : "FAIL"}: ${FINDINGS.length} finding(s) in ${checked.join(", ")} (${compared} comparisons)${skipped.length ? `; skipped ${skipped.join(", ")} (not built in full)` : ""}:`);
  // One line per finding.
  for (const f of FINDINGS) console.error(`  - ${f}`);
  // Exit 0 for a report, 1 for the guard.
  process.exit(ARGS["report-only"] ? 0 : 1);
}
// All good.
console.log(`${TAG} OK: ${checked.join(", ")}; ${compared} stated counts equal their distinct rendered targets${skipped.length ? `; skipped ${skipped.join(", ")} (not built in full)` : ""}.`);
