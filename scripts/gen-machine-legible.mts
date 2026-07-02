// ============================================================================
// scripts/gen-machine-legible.mts
// ----------------------------------------------------------------------------
// Emits machine- and human-legible companions into out/, AFTER `next build`.
// Everything here is DERIVED from the single content/config sources and is
// regenerated on every build, so it can never drift from the site (D-76): when
// an article or tool is created, updated, or deleted, its companions change with
// it automatically (and a fresh build environment means deletions drop out too).
//
//   1. out/<locale>/learn/<slug>.md   — clean Markdown TWIN of every genuine
//      article (present in that locale's dir; no English-fallback duplicates).
//
//   2. out/<locale>/tools/<slug>.md   — a documentation SIBLING for every built
//      tool (en + pt-BR, which have full tool i18n). NOT the tool itself: it is
//      derived extended documentation (name, detailed blurb, family, local-
//      compute usage, and links to the tool's related Learn article twins where
//      the deep explanations live). Grounded entirely in authoritative metadata.
//
//   3. out/feed.xml                   — RSS 2.0 feed of the most recent English
//      articles (by `updated`), for human subscribers and aggregators.
//
//   4. out/llms.txt                   — an llms.txt map (llmstxt.org) pointing at
//      the tool sibling docs, the article twins, and the feed.
//
// The tools API is deliberately omitted while it is desurfaced.
// Runs after pagefind (which only indexes HTML, so these files are ignored).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { tools } from "../src/config/tools";

const ORIGIN = "https://ronutz.com";
const OUT = path.join(process.cwd(), "out");
const CONTENT = path.join(process.cwd(), "src", "content", "learn");
const SOURCE_LOCALE = "en";
// Locales with complete tool i18n (name + blurb + category labels).
const DOC_LOCALES = ["en", "pt-BR"];

// ---- i18n (tool names/blurbs, category labels) ---------------------------
const I18N: Record<string, any> = {};
for (const l of DOC_LOCALES) {
  I18N[l] = JSON.parse(fs.readFileSync(`src/i18n/messages/${l}.json`, "utf8"));
}
const SITE_NAME: string = I18N.en.site?.name ?? "ronutz";
const TAGLINE: string = I18N.en.site?.tagline ?? "";
const toolName = (locale: string, id: string): string =>
  I18N[locale]?.tools?.[id]?.name ?? I18N.en?.tools?.[id]?.name ?? id;
const toolBlurb = (locale: string, id: string): string =>
  I18N[locale]?.tools?.[id]?.blurb ?? I18N.en?.tools?.[id]?.blurb ?? "";
const categoryLabel = (locale: string, c: string): string =>
  I18N[locale]?.tools?.categories?.[c] ?? I18N.en?.tools?.categories?.[c] ?? c;

interface Art {
  slug: string;
  title: string;
  summary?: string;
  category?: string;
  relatedTools?: string[];
  updated?: string;
  body: string;
}

/** Genuine articles physically present in a locale's content dir. */
function readLocale(locale: string): Art[] {
  const dir = path.join(CONTENT, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      return { ...(data as Record<string, unknown>), body: content } as unknown as Art;
    });
}

/** Root-relative Markdown links -> absolute, locale-aware; leave others alone. */
function absolutize(body: string, locale: string): string {
  return body.replace(/\]\((\/[^)]*)\)/g, (_m, p) => `](${ORIGIN}/${locale}${p})`);
}

const xml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (d?: string): string => (d ? new Date(d) : new Date()).toUTCString();

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    (m.get(k) ?? m.set(k, []).get(k)!).push(it);
  }
  return m;
}

// Preload genuine articles for the documented locales (twins + related lookup).
const articlesByLocale: Record<string, Art[]> = {};
for (const l of DOC_LOCALES) articlesByLocale[l] = readLocale(l);

// Clean previously-generated companions first, so a cache-restored out/ can
// never retain a stale twin/doc for a deleted article or tool (D-76 currency).
function cleanCompanions() {
  if (!fs.existsSync(OUT)) return;
  for (const entry of fs.readdirSync(OUT)) {
    for (const sub of ["learn", "tools"]) {
      const dir = path.join(OUT, entry, sub);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (f.endsWith(".md")) fs.rmSync(path.join(dir, f));
      }
    }
  }
  for (const f of ["llms.txt", "feed.xml"]) {
    const p = path.join(OUT, f);
    if (fs.existsSync(p)) fs.rmSync(p);
  }
}
cleanCompanions();

// ---- 1. article .md twins (all locales) ----------------------------------
function articleMarkdown(a: Art, locale: string): string {
  const canonical = `${ORIGIN}/${locale}/learn/${a.slug}`;
  const out: string[] = [`# ${a.title}`, ""];
  if (a.summary) out.push(`> ${a.summary}`, "");
  const meta = [`Source: ${canonical}`];
  if (a.updated) meta.push(`Updated: ${a.updated}`);
  if (a.relatedTools?.length) {
    meta.push(
      `Related tools: ${a.relatedTools.map((t) => `${ORIGIN}/${locale}/tools/${t}`).join(", ")}`,
    );
  }
  out.push(meta.join("  \n"), "", "---", "", absolutize(a.body, locale).trim(), "");
  return out.join("\n");
}

let mdCount = 0;
for (const locale of DOC_LOCALES) {
  for (const a of articlesByLocale[locale]) {
    if (!a.slug || !a.title) continue;
    const dir = path.join(OUT, locale, "learn");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${a.slug}.md`), articleMarkdown(a, locale), "utf8");
    mdCount++;
  }
}

// ---- 2. tool sibling docs (en + pt-BR) -----------------------------------
const liveTools = tools.filter((t) => t.available);

interface Source {
  label: string;
  url?: string;
  scope?: string;
}

function toolMarkdown(
  id: string,
  category: string,
  href: string,
  locale: string,
  sources: Source[],
): string {
  const url = `${ORIGIN}/${locale}${href}`;
  const related = (articlesByLocale[locale] ?? [])
    .filter((a) => a.relatedTools?.includes(id))
    .sort((a, b) => a.title.localeCompare(b.title));
  const out: string[] = [`# ${toolName(locale, id)}`, ""];
  const blurb = toolBlurb(locale, id);
  if (blurb) out.push(`> ${blurb}`, "");
  out.push(`- Tool: ${url}`, `- Family: ${categoryLabel(locale, category)}`, "", "---", "");
  out.push(
    "## How to use it",
    "",
    `Open ${url} and enter your input. The tool computes entirely in your browser; your input never leaves your device, and the result is deterministic.`,
    "",
  );
  if (sources.length) {
    out.push("## Standards and references", "");
    for (const s of sources) {
      const link = s.url ? `[${s.label}](${s.url})` : s.label;
      out.push(`- ${link}${s.scope ? ` — ${s.scope}` : ""}`);
    }
    out.push("");
  }
  if (related.length) {
    out.push("## Related reading", "");
    for (const a of related) {
      out.push(
        `- [${a.title}](${ORIGIN}/${locale}/learn/${a.slug}.md)${a.summary ? `: ${a.summary}` : ""}`,
      );
    }
    out.push("");
  }
  return out.join("\n");
}

// Preload each tool's provenance sources from its manifest (dynamic import so
// this stays generic; failures degrade to no Standards section for that tool).
const toolSources: Record<string, Source[]> = {};
for (const t of liveTools) {
  try {
    const mod: { manifest?: { sources?: Source[] } } = await import(
      `../src/lib/tools/${t.id}/index.ts`
    );
    toolSources[t.id] = mod.manifest?.sources ?? [];
  } catch {
    toolSources[t.id] = [];
  }
}

let toolDocCount = 0;
for (const locale of DOC_LOCALES) {
  for (const t of liveTools) {
    const dir = path.join(OUT, locale, "tools");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${t.id}.md`),
      toolMarkdown(t.id, t.category, t.href, locale, toolSources[t.id] ?? []),
      "utf8",
    );
    toolDocCount++;
  }
}

// ---- 3. RSS 2.0 feed (English, most recent by `updated`) ------------------
const enArticles = (articlesByLocale[SOURCE_LOCALE] ?? []).filter((a) => a.slug && a.title);
const feedItems = enArticles
  .filter((a) => a.updated)
  .sort((a, b) => new Date(b.updated!).getTime() - new Date(a.updated!).getTime())
  .slice(0, 50);

const rss: string[] = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  "  <channel>",
  `    <title>${xml(SITE_NAME)} — Learn</title>`,
  `    <link>${ORIGIN}/${SOURCE_LOCALE}/learn</link>`,
  `    <description>${xml(TAGLINE)}</description>`,
  "    <language>en</language>",
  `    <lastBuildDate>${rfc822()}</lastBuildDate>`,
  `    <atom:link href="${ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />`,
];
for (const a of feedItems) {
  const link = `${ORIGIN}/${SOURCE_LOCALE}/learn/${a.slug}`;
  rss.push(
    "    <item>",
    `      <title>${xml(a.title)}</title>`,
    `      <link>${link}</link>`,
    `      <guid isPermaLink="true">${link}</guid>`,
    `      <pubDate>${rfc822(a.updated)}</pubDate>`,
    a.summary ? `      <description>${xml(a.summary)}</description>` : "",
    "    </item>",
  );
}
rss.push("  </channel>", "</rss>", "");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "feed.xml"), rss.filter((l) => l !== "").join("\n"), "utf8");

// ---- 4. llms.txt ---------------------------------------------------------
const L: string[] = [`# ${SITE_NAME}.com`, ""];
if (TAGLINE) L.push(`> ${TAGLINE}`, "");
L.push(
  "Deterministic network, security, and identity tools that run locally in your browser, alongside in-depth Learn articles. Each tool and article links to a clean Markdown version below.",
  "",
);

L.push("## Tools", "");
for (const [cat, ts] of groupBy(liveTools, (t) => t.category)) {
  L.push(`### ${categoryLabel(SOURCE_LOCALE, cat)}`, "");
  for (const t of [...ts].sort((a, b) =>
    toolName(SOURCE_LOCALE, a.id).localeCompare(toolName(SOURCE_LOCALE, b.id)),
  )) {
    const blurb = toolBlurb(SOURCE_LOCALE, t.id);
    L.push(
      `- [${toolName(SOURCE_LOCALE, t.id)}](${ORIGIN}/${SOURCE_LOCALE}/tools/${t.id}.md)${blurb ? `: ${blurb}` : ""}`,
    );
  }
  L.push("");
}

L.push("## Learn", "");
for (const [cat, arts] of groupBy(enArticles, (a) => a.category ?? "other")) {
  L.push(`### ${categoryLabel(SOURCE_LOCALE, cat)}`, "");
  for (const a of [...arts].sort((x, y) => x.title.localeCompare(y.title))) {
    L.push(
      `- [${a.title}](${ORIGIN}/${SOURCE_LOCALE}/learn/${a.slug}.md)${a.summary ? `: ${a.summary}` : ""}`,
    );
  }
  L.push("");
}

L.push(
  "## More",
  "",
  `- [About](${ORIGIN}/${SOURCE_LOCALE}/about): background, credentials, and history`,
  `- [Training](${ORIGIN}/${SOURCE_LOCALE}/training): instructor-led course offerings`,
  `- [Learn RSS feed](${ORIGIN}/feed.xml): most recent articles`,
  "",
);
fs.writeFileSync(path.join(OUT, "llms.txt"), L.join("\n"), "utf8");

console.log(
  `[gen-machine-legible] ${mdCount} article .md (${DOC_LOCALES.length} locales), ` +
    `${toolDocCount} tool .md (${DOC_LOCALES.length} locales), feed.xml (${feedItems.length} items), ` +
    `llms.txt (${liveTools.length} tools, ${enArticles.length} EN articles).`,
);
