// ============================================================================
// scripts/gen-og.mts
// ----------------------------------------------------------------------------
// SOCIAL-PREVIEW (OG IMAGE) GENERATOR - PILOT / SAMPLES MODE.
//
// Canon: og-social-preview-system-spec-v1 (ratified 2026-07-09: all kinds,
// en + pt-BR, portrait on brand pages, taglines per spec table, gitignored
// CI-generated output, pilot-first rollout).
//
// THIS FILE IS THE ENGINE. It currently runs in SAMPLES mode: it renders a
// representative card per template kind to /mnt/user-data/outputs/og-samples/
// for PRIME's visual sign-off. After sign-off, the site-wide enumeration
// (every tool/article/glossary/guide/vendor/static route x {en, pt-BR}), the
// content-hash manifest, the public/og/ output path, the check-og gate, and
// the generateMetadata wiring are added around this same engine - the card
// rendering below is final-shape.
//
// TECHNIQUE
//   satori (element tree -> SVG, fonts embedded) + @resvg/resvg-js (SVG ->
//   1200x630 PNG). Fonts come from the @fontsource npm packages (woff format,
//   which satori supports; woff2 is NOT supported). The latin subset covers
//   en + pt-BR diacritics (Latin-1 range).
//
// DATA SOURCES (structural reads, the same technique the prebuild gates use -
// no path-alias imports, so this runs standalone under tsx in CI):
//   - tool names/blurbs ......... src/i18n/messages/{en,pt-BR}.json  tools.<slug>
//   - glossary defs ............. glossary registry slugs + messages glossary.<slug>
//   - article title/description . src/content/learn/<locale>/<slug>.mdx frontmatter
//   - study-guide exam names .... src/content/certifications/study-guides.ts
//   - category/vendor colors .... src/config/categoryColors.ts / vendors.ts
//
// DESIGN (OBSIDIAN): canvas #020617, cyan #22D3EE, amber #F59E0B, Inter for
// titles/taglines, JetBrains Mono for wordmark/eyebrow/codes. Left color bar
// carries the category/vendor signal. Brand pages get a portrait variant
// (portrait files supplied by PRIME via the project mount).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

// ---------------------------------------------------------------------------
// Fonts (from @fontsource, woff): Inter 400/700/800 + JetBrains Mono 400/700.
// ---------------------------------------------------------------------------
const font = (pkg: string, file: string) =>
  fs.readFileSync(path.join(ROOT, "node_modules", pkg, "files", file));

const FONTS = [
  { name: "Inter", data: font("@fontsource/inter", "inter-latin-400-normal.woff"), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: font("@fontsource/inter", "inter-latin-700-normal.woff"), weight: 700 as const, style: "normal" as const },
  { name: "Inter", data: font("@fontsource/inter", "inter-latin-800-normal.woff"), weight: 800 as const, style: "normal" as const },
  { name: "JetBrains Mono", data: font("@fontsource/jetbrains-mono", "jetbrains-mono-latin-400-normal.woff"), weight: 400 as const, style: "normal" as const },
  { name: "JetBrains Mono", data: font("@fontsource/jetbrains-mono", "jetbrains-mono-latin-700-normal.woff"), weight: 700 as const, style: "normal" as const },
];

// ---------------------------------------------------------------------------
// OBSIDIAN palette (mirrors globals.css; the site-wide run keeps this single
// source here on purpose: OG images are theme-locked to OBSIDIAN regardless of
// the visitor's chosen theme, because a share unfurl has no theme context).
// ---------------------------------------------------------------------------
const C = {
  canvas: "#020617",
  panel: "#0B1220",
  text: "#F8FAFC",
  sub: "#94A3B8",
  faint: "#64748B",
  cyan: "#22D3EE",
  amber: "#F59E0B",
  border: "rgba(148, 163, 184, 0.25)",
};

// Thesis line (site-wide footer of every card; en/pt per spec table).
const THESIS: Record<string, string> = {
  en: "tools that compute, never guess",
  "pt-BR": "ferramentas que calculam, nunca chutam",
};

// ---------------------------------------------------------------------------
// Structural data reads (gate-style; see header).
// ---------------------------------------------------------------------------
const messages = (locale: string) =>
  JSON.parse(read(`src/i18n/messages/${locale}.json`));

/** Tool name + blurb (first sentence) + category color for a tool id. */
function toolCard(slug: string, locale: string) {
  const m = messages(locale);
  const t = m.tools?.[slug] ?? messages("en").tools[slug];
  // category from tools.ts: find the id's object block, pull its category.
  const cfg = read("src/config/tools.ts");
  const block = cfg.slice(cfg.indexOf(`id: "${slug}"`), cfg.indexOf(`id: "${slug}"`) + 600);
  const category = block.match(/category:\s*"([a-z0-9-]+)"/)?.[1] ?? "";
  return {
    title: t.name as string,
    tagline: firstSentence(t.blurb as string),
    color: categoryColor(category),
    footTag: category,
  };
}

/** CATEGORY_COLORS map lookup (regex over the config file). */
function categoryColor(category: string): string {
  const src = read("src/config/categoryColors.ts");
  const m = src.match(new RegExp(`"?${category}"?:\\s*"(#[0-9A-Fa-f]{3,8})"`));
  return m?.[1] ?? C.cyan;
}

/** Vendor color from vendors.ts (regex). */
function vendorColor(vendor: string): string {
  const src = read("src/config/vendors.ts");
  const m = src.match(new RegExp(`"?${vendor}"?:[^#]*"(#[0-9A-Fa-f]{3,8})"`));
  return m?.[1] ?? C.cyan;
}

/** Article frontmatter title + description from the mdx file. */
function articleCard(slug: string, locale: string) {
  const p = `src/content/learn/${locale}/${slug}.mdx`;
  const src = read(fs.existsSync(path.join(ROOT, p)) ? p : `src/content/learn/en/${slug}.mdx`);
  const fm = src.slice(0, src.indexOf("---", 4));
  const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? slug;
  const description = fm.match(/^summary:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? "";
  const vendor = fm.match(/^vendor:\s*["']?([a-z0-9-]+)/m)?.[1] ?? "";
  return { title, tagline: firstSentence(description), color: vendor ? vendorColor(vendor) : C.cyan, footTag: vendor };
}

/** Glossary entry: term (slug prettified via registry) + en/pt def.
 *  Defs live under glossary.entries.<slug> in the message packs. */
function glossaryCard(slug: string, locale: string) {
  const g =
    messages(locale).glossary?.entries?.[slug] ??
    messages("en").glossary.entries[slug];
  const reg = read("src/content/glossary/glossary.ts");
  const block = reg.slice(reg.indexOf(`slug: "${slug}"`), reg.indexOf(`slug: "${slug}"`) + 400);
  const term = block.match(/headword:\s*"([^"]+)"/)?.[1] ?? slug;
  return { title: term, tagline: firstSentence(g.def as string), color: C.amber, footTag: "glossary" };
}

/** Study-guide exam: verbatim examName + code from the registry. */
function guideCard(slug: string) {
  const reg = read("src/content/certifications/study-guides.ts");
  const block = reg.slice(reg.indexOf(`slug: "${slug}"`), reg.indexOf(`slug: "${slug}"`) + 600);
  const examName = block.match(/examName:\s*"([^"]+)"/)?.[1] ?? slug;
  const examCode = block.match(/examCode:\s*"([^"]+)"/)?.[1] ?? "";
  return { title: examName, tagline: `${examCode} - F5 Certified Administrator, BIG-IP`, color: vendorColor("f5"), footTag: examCode };
}

const firstSentence = (s: string) =>
  (s ?? "").split(/(?<=[.!?])\s/)[0]?.trim() ?? "";

/** Truncate defensively; satori clamps by box, this keeps text sane. */
const clamp = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

// ---------------------------------------------------------------------------
// Card element tree (satori plain-object form; every multi-child div is flex).
// ---------------------------------------------------------------------------
type CardInput = {
  eyebrow: string;       // kind label (TOOL / ARTICLE / ...), locale-aware
  title: string;
  tagline: string;
  color: string;         // left-bar + eyebrow signal color
  footTag?: string;      // small mono tag bottom-right (category/code/locale)
  locale: string;
  portrait?: { dataUri: string; mode: "circle" | "panel" };
};

const div = (style: Record<string, unknown>, children: unknown) => ({
  type: "div",
  props: { style, children },
});
const txt = (style: Record<string, unknown>, s: string) => div(style, s);

function card(i: CardInput) {
  const titleSize = i.title.length > 60 ? 52 : i.title.length > 34 ? 62 : 72;
  const contentWidth = i.portrait?.mode === "panel" ? 720 : i.portrait?.mode === "circle" ? 780 : 1050;

  const main = div(
    {
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
      padding: "52px 60px 44px 56px",
      height: "100%",
    },
    [
      // Top row: wordmark + eyebrow
      div(
        { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" },
        [
          txt({ fontFamily: "JetBrains Mono", fontSize: 30, fontWeight: 700, color: C.cyan }, "ronutz.com"),
          txt(
            { fontFamily: "JetBrains Mono", fontSize: 24, fontWeight: 700, color: i.color, letterSpacing: 4 },
            i.eyebrow.toUpperCase(),
          ),
        ],
      ),
      // Middle: title + tagline
      div(
        { display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, width: contentWidth },
        [
          txt(
            { fontFamily: "Inter", fontSize: titleSize, fontWeight: 800, color: C.text, lineHeight: 1.12, letterSpacing: -1 },
            clamp(i.title, 90),
          ),
          txt(
            { fontFamily: "Inter", fontSize: 29, fontWeight: 400, color: C.sub, lineHeight: 1.45, marginTop: 26 },
            clamp(i.tagline, 150),
          ),
        ],
      ),
      // Bottom row: thesis + tag
      div(
        { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" },
        [
          txt({ fontFamily: "JetBrains Mono", fontSize: 22, color: C.faint }, THESIS[i.locale] ?? THESIS.en),
          i.footTag
            ? div({ display: "flex", alignItems: "center" }, [
                div({ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: i.color, marginRight: 12 }, []),
                txt({ fontFamily: "JetBrains Mono", fontSize: 22, color: C.sub }, i.footTag),
              ])
            : div({ display: "flex" }, []),
        ],
      ),
    ],
  );

  const children: unknown[] = [
    // Left color signal bar
    div({ display: "flex", width: 12, height: "100%", backgroundColor: i.color }, []),
    main,
  ];

  // Portrait variants (brand pages only)
  if (i.portrait?.mode === "circle") {
    children.push(
      div(
        { display: "flex", alignItems: "center", paddingRight: 64 },
        [
          {
            type: "img",
            props: {
              src: i.portrait.dataUri,
              width: 280,
              height: 280,
              style: { borderRadius: 140, border: `6px solid ${C.cyan}`, objectFit: "cover" },
            },
          },
        ],
      ),
    );
  } else if (i.portrait?.mode === "panel") {
    children.push(
      div({ display: "flex", position: "relative", width: 400, height: "100%" }, [
        {
          type: "img",
          props: { src: i.portrait.dataUri, width: 400, height: 630, style: { objectFit: "cover" } },
        },
        // Blend gradient over the panel's left edge into the canvas
        div(
          {
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            width: 400,
            height: 630,
            backgroundImage: `linear-gradient(90deg, ${C.canvas} 0%, rgba(2,6,23,0.25) 45%, rgba(2,6,23,0) 100%)`,
          },
          [],
        ),
      ]),
    );
  }

  return div(
    {
      display: "flex",
      width: 1200,
      height: 630,
      backgroundColor: C.canvas,
      backgroundImage: `radial-gradient(circle at 88% 0%, rgba(34,211,238,0.10) 0%, rgba(2,6,23,0) 55%)`,
    },
    children,
  );
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------
async function render(name: string, input: CardInput, outDir: string) {
  const svg = await satori(card(input) as never, { width: 1200, height: 630, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  const out = path.join(outDir, `${name}.png`);
  fs.writeFileSync(out, png);
  console.log(`  ${name}.png  ${(png.length / 1024).toFixed(0)} KB`);
}

const imgDataUri = (absPath: string) => {
  const buf = fs.readFileSync(absPath);
  const ext = absPath.toLowerCase().endsWith(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
};

// Locale-aware kind eyebrows (chrome text; full set lives in i18n at wiring).
const EYEBROW: Record<string, Record<string, string>> = {
  tool: { en: "Tool", "pt-BR": "Ferramenta" },
  article: { en: "Article", "pt-BR": "Artigo" },
  glossary: { en: "Glossary", "pt-BR": "Glossário" },
  guide: { en: "Study guide", "pt-BR": "Guia de estudo" },
  vendor: { en: "Vendor hub", "pt-BR": "Hub do fabricante" },
  page: { en: "ronutz.com", "pt-BR": "ronutz.com" },
};

// ---------------------------------------------------------------------------
// SITE-WIDE enumeration (the real run). Writes public/og/<kind>/<slug>.<ext>
// for every route x {en, pt-BR}, skipping unchanged images via a content-hash
// manifest (public/og/manifest.json). Photographic (portrait) cards ship JPEG;
// everything else PNG. Filenames + the ogMetadata helper agree on the scheme:
//   public/og/<kind>/<locale>/<slug>.<ext>, kind in
//   {tool, article, glossary, guide, vendor, page}; the fallback is
//   public/og/default.png. og:image URL = /og/<kind>/<locale>/<slug>.<ext>.
// ---------------------------------------------------------------------------
import crypto from "node:crypto";

const OG_DIR = path.join(ROOT, "public/og");
const TEMPLATE_VERSION = "2"; // bump to force full regeneration on design change

type Job = {
  kind: keyof typeof EYEBROW;
  slug: string;
  locale: string;
  input: CardInput;
  ext: "png" | "jpeg";
};

/** Portrait config per brand page (both variants approved; per-page choice).
 *  Paths are repo-relative build inputs under assets/og-portraits/ (committed,
 *  so CI can read them - NOT the sandbox project mount). */
const BRAND_PORTRAITS: Record<string, { file: string; mode: "circle" | "panel" }> = {
  // home + about -> circle (headshot); training + red-education -> panel.
  "": { file: "assets/og-portraits/rodolfo-headshot.jpeg", mode: "circle" },
  about: { file: "assets/og-portraits/rodolfo-headshot.jpeg", mode: "circle" },
  training: { file: "assets/og-portraits/rodolfo-office.jpg", mode: "panel" },
  "red-education": { file: "assets/og-portraits/rodolfo-office.jpg", mode: "panel" },
};

// Static/main pages and their hand-picked taglines (en + pt-BR).
const STATIC_PAGES: { slug: string; title: Record<string, string>; tagline: Record<string, string>; brand?: boolean }[] = [
  { slug: "", title: { en: "Network, security, and identity tools", "pt-BR": "Ferramentas de rede, segurança e identidade" }, tagline: { en: "Deterministic, local-compute tools by Rodolfo Nützmann - teaching enterprise networks since 1996.", "pt-BR": "Ferramentas determinísticas de computação local, por Rodolfo Nützmann - ensinando redes corporativas desde 1996." }, brand: true },
  { slug: "tools", title: { en: "Tools", "pt-BR": "Ferramentas" }, tagline: { en: "Deterministic network, security, and identity tools that compute, never guess.", "pt-BR": "Ferramentas determinísticas de rede, segurança e identidade que calculam, nunca chutam." } },
  { slug: "learn", title: { en: "Learn", "pt-BR": "Aprender" }, tagline: { en: "Grounded articles on networking, security, and identity - sourced, never hand-wavy.", "pt-BR": "Artigos fundamentados sobre redes, segurança e identidade - com fontes, nunca vagos." } },
  { slug: "certifications", title: { en: "Certification study guides", "pt-BR": "Guias de estudo para certificação" }, tagline: { en: "Blueprint-guided study maps: every exam objective linked to the articles, tools, and manuals that teach it.", "pt-BR": "Mapas de estudo guiados pelo blueprint: cada objetivo ligado aos artigos, ferramentas e manuais que o ensinam." } },
  { slug: "study-guides", title: { en: "Study guides", "pt-BR": "Guias de estudo" }, tagline: { en: "Curated reading paths through the Learn library, plus blueprint-mapped certification guides - all free.", "pt-BR": "Trilhas de leitura pela biblioteca Learn e guias de certificação mapeados por blueprint - tudo gratuito." } },
  { slug: "glossary", title: { en: "Glossary", "pt-BR": "Glossário" }, tagline: { en: "Plain-language definitions for networking, security, and identity terms.", "pt-BR": "Definições em linguagem clara para termos de rede, segurança e identidade." } },
  { slug: "training", title: { en: "Instructor-led training", "pt-BR": "Treinamento com instrutor" }, tagline: { en: "Authorized F5, Fortinet, Netskope, and Extreme training by Rodolfo Nützmann at Red Education.", "pt-BR": "Treinamento oficial F5, Fortinet, Netskope e Extreme por Rodolfo Nützmann na Red Education." }, brand: true },
  { slug: "about", title: { en: "About", "pt-BR": "Sobre" }, tagline: { en: "Rodolfo Nützmann - senior technical instructor and the architect of ronutz.com.", "pt-BR": "Rodolfo Nützmann - instrutor técnico sênior e arquiteto do ronutz.com." }, brand: true },
  { slug: "red-education", title: { en: "Red Education", "pt-BR": "Red Education" }, tagline: { en: "A global Authorized Training Center - and the home of Rodolfo Nützmann's classroom since 2023.", "pt-BR": "Um Centro de Treinamento Autorizado global - e a casa das aulas de Rodolfo Nützmann desde 2023." }, brand: true },
];

const LOCALES = ["en", "pt-BR"];

/** Build the full job list from the registries. */
function enumerateJobs(): Job[] {
  const jobs: Job[] = [];
  // Built tool PAGES = TOOL_PAGES keys in the route file (the authoritative
  // /tools/<slug> set; tools.ts `id:` includes catalogue/API-only tools that
  // are NOT routed, so we must read the route map, not tools.ts).
  const routeSrc = read("src/app/[locale]/tools/[slug]/page.tsx");
  const tpStart = routeSrc.indexOf("const TOOL_PAGES");
  const tpSeg = routeSrc.slice(tpStart, routeSrc.indexOf("generateStaticParams", tpStart));
  const builtTools = [...tpSeg.matchAll(/^ {2}"?([a-z0-9-]+)"?:\s*\{/gm)].map((m) => m[1]);
  const articleSlugs = fs.readdirSync(path.join(ROOT, "src/content/learn/en")).filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
  const glossaryReg = read("src/content/glossary/glossary.ts");
  const glossarySlugs = [...glossaryReg.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  const guideReg = read("src/content/certifications/study-guides.ts");
  const guideSlugs = [...guideReg.slice(guideReg.indexOf("export const studyGuides")).matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  const vendorSlugs = ["f5", "fortinet", "netskope", "extreme"];

  for (const locale of LOCALES) {
    for (const s of builtTools) jobs.push({ kind: "tool", slug: s, locale, ext: "png", input: { eyebrow: EYEBROW.tool[locale] ?? EYEBROW.tool.en, locale, ...toolCard(s, locale) } });
    for (const s of articleSlugs) jobs.push({ kind: "article", slug: s, locale, ext: "png", input: { eyebrow: EYEBROW.article[locale] ?? EYEBROW.article.en, locale, ...articleCard(s, locale) } });
    for (const s of glossarySlugs) jobs.push({ kind: "glossary", slug: s, locale, ext: "png", input: { eyebrow: EYEBROW.glossary[locale] ?? EYEBROW.glossary.en, locale, ...glossaryCard(s, locale) } });
    for (const s of guideSlugs) jobs.push({ kind: "guide", slug: s, locale, ext: "png", input: { eyebrow: EYEBROW.guide[locale] ?? EYEBROW.guide.en, locale, ...guideCard(s) } });
    for (const s of vendorSlugs) {
      const m = messages(locale);
      const label = m.tools?.vendors?.[s] ?? s;
      const lede = (m.vendorHub?.lede ?? "").replace("{vendor}", label);
      jobs.push({ kind: "vendor", slug: s, locale, ext: "png", input: { eyebrow: EYEBROW.vendor[locale] ?? EYEBROW.vendor.en, locale, title: label, tagline: firstSentence(lede) || label, color: vendorColor(s), footTag: s } });
    }
    for (const p of STATIC_PAGES) {
      const portrait = p.brand && BRAND_PORTRAITS[p.slug]
        ? { dataUri: imgDataUri(path.join(ROOT, BRAND_PORTRAITS[p.slug].file)), mode: BRAND_PORTRAITS[p.slug].mode }
        : undefined;
      jobs.push({ kind: "page", slug: p.slug || "home", locale, ext: portrait ? "jpeg" : "png", input: { eyebrow: EYEBROW.page[locale] ?? EYEBROW.page.en, locale, title: p.title[locale] ?? p.title.en, tagline: p.tagline[locale] ?? p.tagline.en, color: p.slug === "red-education" ? C.amber : C.cyan, portrait } });
    }
  }
  return jobs;
}

async function renderJob(job: Job, manifest: Record<string, string>): Promise<"written" | "skipped"> {
  // Content hash: any change to title/tagline/color/portrait/template -> rewrite.
  const key = `${job.kind}/${job.locale}/${job.slug}.${job.ext}`;
  const hash = crypto.createHash("sha1").update(TEMPLATE_VERSION + JSON.stringify({ ...job.input, portrait: job.input.portrait?.mode ?? null }) + (job.input.portrait ? "P" : "")).digest("hex").slice(0, 16);
  const outPath = path.join(OG_DIR, key);
  if (manifest[key] === hash && fs.existsSync(outPath)) return "skipped";

  const svg = await satori(card(job.input) as never, { width: 1200, height: 630, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (job.ext === "jpeg") {
    // Photographic cards: PNG->JPEG via sharp (present in the toolchain) keeps
    // portrait cards well under the WhatsApp ceiling (verified 362KB->~60KB).
    const sharp = (await import("sharp")).default;
    fs.writeFileSync(outPath, await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer());
  } else {
    fs.writeFileSync(outPath, png);
  }
  manifest[key] = hash;
  return "written";
}

async function siteWide() {
  fs.mkdirSync(OG_DIR, { recursive: true });
  const manifestPath = path.join(OG_DIR, "manifest.json");
  const manifest: Record<string, string> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  const jobs = enumerateJobs();
  let written = 0, skipped = 0;
  // Default fallback card (kind "page", slug "default"), always PNG.
  await render("default", { eyebrow: EYEBROW.page.en, locale: "en", title: "ronutz.com", tagline: "Network, security, and identity tools that compute, never guess.", color: C.cyan }, OG_DIR);
  for (const job of jobs) {
    const r = await renderJob(job, manifest);
    if (r === "written") {
      written++;
      // Flush the manifest every 50 writes so an interrupted run resumes
      // instead of restarting (generation of the full set exceeds some
      // sandbox tool timeouts; CI runs it uninterrupted).
      if (written % 50 === 0) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0));
    } else skipped++;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0));
  console.log(`[gen-og] site-wide: ${written} written, ${skipped} unchanged, ${jobs.length} total (+ default). manifest: ${Object.keys(manifest).length} entries.`);
}

// ---------------------------------------------------------------------------
// SAMPLES (pilot): one representative card per kind + pt-BR + portrait A/B.
// ---------------------------------------------------------------------------
async function samples() {
  const outDir = "/mnt/user-data/outputs/og-samples";
  fs.mkdirSync(outDir, { recursive: true });
  console.log("[gen-og] rendering pilot samples:");

  // 1-2. Tool, en + pt-BR
  const tEn = toolCard("f5-bigd-thread-calculator", "en");
  await render("01-tool-en", { eyebrow: EYEBROW.tool.en, locale: "en", ...tEn }, outDir);
  const tPt = toolCard("f5-bigd-thread-calculator", "pt-BR");
  await render("02-tool-pt-BR", { eyebrow: EYEBROW.tool["pt-BR"], locale: "pt-BR", ...tPt }, outDir);

  // 3. Article, en
  const aEn = articleCard("bigip-cmp-clustered-multiprocessing", "en");
  await render("03-article-en", { eyebrow: EYEBROW.article.en, locale: "en", ...aEn }, outDir);

  // 4. Glossary, en (prefer a well-known slug when present)
  const reg = read("src/content/glossary/glossary.ts");
  const slugs = [...reg.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  const gSlug = ["anycast", "bogon", "asn"].find((s) => slugs.includes(s)) ?? slugs[0];
  const gEn = glossaryCard(gSlug, "en");
  await render("04-glossary-en", { eyebrow: EYEBROW.glossary.en, locale: "en", ...gEn }, outDir);

  // 5. Study guide (F5CAB1)
  const sg = guideCard("f5-ca-install-config-upgrade");
  await render("05-studyguide-en", { eyebrow: EYEBROW.guide.en, locale: "en", ...sg }, outDir);

  // 6. Vendor hub (F5)
  await render(
    "06-vendor-f5-en",
    {
      eyebrow: EYEBROW.vendor.en,
      locale: "en",
      title: "F5",
      tagline: "Tools, articles, and study guides for the F5 BIG-IP ecosystem.",
      color: vendorColor("f5"),
      footTag: "f5",
    },
    outDir,
  );

  // 7. Main page: certifications hub
  await render(
    "07-main-certifications-en",
    {
      eyebrow: EYEBROW.page.en,
      locale: "en",
      title: "Certification study guides",
      tagline: "Blueprint-guided study maps: every exam objective linked to the articles, tools, and manuals that teach it.",
      color: C.cyan,
      footTag: "certifications",
    },
    outDir,
  );

  // 8-9. Brand pages with portrait variants A (circle) and B (panel)
  await render(
    "08-home-portrait-A-en",
    {
      eyebrow: EYEBROW.page.en,
      locale: "en",
      title: "Network, security, and identity tools",
      tagline: "Deterministic, local-compute tools by Rodolfo Nützmann - teaching enterprise networks since 1996.",
      color: C.cyan,
      portrait: { dataUri: imgDataUri(path.join(ROOT, "assets/og-portraits/rodolfo-headshot.jpeg")), mode: "circle" },
    },
    outDir,
  );
  await render(
    "09-red-education-portrait-B-en",
    {
      eyebrow: EYEBROW.page.en,
      locale: "en",
      title: "Red Education",
      tagline: "A global Authorized Training Center - and the home of Rodolfo Nützmann's classroom since 2023.",
      color: C.amber,
      portrait: { dataUri: imgDataUri(path.join(ROOT, "assets/og-portraits/rodolfo-office.jpg")), mode: "panel" },
    },
    outDir,
  );

  // 10. Default fallback
  await render(
    "10-default-fallback-en",
    {
      eyebrow: EYEBROW.page.en,
      locale: "en",
      title: "ronutz.com",
      tagline: "Network, security, and identity tools that compute, never guess.",
      color: C.cyan,
    },
    outDir,
  );

  console.log("[gen-og] done.");
}

// Mode dispatch: `--samples` renders the pilot set to outputs; default is the
// site-wide run into public/og/ (used by CI prebuild).
const MODE = process.argv.includes("--samples") ? "samples" : "site-wide";
(MODE === "samples" ? samples() : siteWide()).catch((e) => {
  console.error(e);
  process.exit(1);
});
