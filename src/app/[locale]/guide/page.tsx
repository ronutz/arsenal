// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/guide/page.tsx
// ----------------------------------------------------------------------------
// THE SITE USER GUIDE: "How to use ronutz" (G9 of Round 1, SCOUT's option A, built 2026-10-06: broaden the
// tool manual to the whole site - tools, learn, study guides, vendor hubs, industry, search, privacy and local
// behaviour). Six parts, in order:
//
//   0. THE MAP        — the site in one minute: the five worlds from src/config/worlds.ts (the same registry
//                       the home directory, the footer and the human sitemap draw), each entry with the count
//                       the home page shows, from src/lib/siteCounts.ts, so the guide and the home never
//                       disagree about a number.
//
//   0b. HOW TO        — seven short sections, one per surface (tools, learn, study guides, vendor hubs, the
//                       industry record, search and shortcuts, privacy and local behaviour): what it is, how
//                       to use it, where to start. Prose from the "guide" namespace in both authored locales;
//                       every link is a route that exists (check-internal-links fails the build otherwise).
//
//   1. DATASHEET      — at-a-glance facts. Every number is DERIVED at build time
//                       from the authoritative sources (the catalogue for the
//                       live tool count, getAllArticles() for the article count,
//                       the tool registry for the category count, LIVE_LOCALES
//                       for the language count). It therefore cannot go stale:
//                       add or remove a tool/article/locale and the datasheet
//                       changes with the next build.
//
//   2. QUICK REFERENCE— every live, vendor-agnostic tool, grouped by category,
//                       one line each, GENERATED from the registry (the same
//                       source the /tools index uses). A new tool appears here
//                       automatically; a deleted one disappears.
//
//   3. SUGGESTED USAGE— curated task->tools recipes (src/content/guide/recipes.ts).
//                       The one hand-authored part; a build guard
//                       (check-user-guide.mjs) fails if a recipe points at a tool
//                       that no longer exists, so it stays honest.
//
//   4. DETAILED MANUAL— prose how-to for the site's cross-cutting features
//                       (running a tool, privacy, the API, languages, source).
//
// Chrome + all copy are localized via the "guide" namespace in every live
// locale pack (en + native pt-BR authored; others fall back per key). The tool
// names/blurbs and category labels are resolved through the existing
// tools.<id>.* / tools.categories.* keys, so the guide inherits every
// translation the tools already have.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import FamilyChip from "@/components/FamilyChip";
import { tools } from "@/config/tools";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getAllArticles } from "@/lib/learn";
import { getAllGlossaryEntries } from "@/content/glossary/glossary";
import { TRANSLATED_LOCALE_COUNT } from "@/i18n/locales";
import { GUIDE_RECIPES } from "@/content/guide/recipes";
import { WORLDS } from "@/config/worlds";
import { getSiteCounts } from "@/lib/siteCounts";
import { getWorldCountLabels } from "@/lib/worldCounts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  return { title: t("title") };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("guide");
  const tTools = await getTranslations("tools");
  const tNav = await getTranslations("nav");

  // --- Derived datasheet numbers (authoritative sources; never hand-typed) ---
  const liveToolCount = CATALOGUE.filter((tool) => tool.status === "live").length;
  const articleCount = getAllArticles().length;
  const glossaryCount = getAllGlossaryEntries().length;
  const localeCount = TRANSLATED_LOCALE_COUNT;

  // Vendor-agnostic live tools, grouped by category for the quick reference,
  // exactly like the /tools index. (Vendor tools live on their vendor hubs.)
  const agnosticTools = tools.filter((tl) => tl.available && !(tl.vendors ?? []).length);
  const categories = [...new Set(agnosticTools.map((tl) => tl.category))].sort((a, b) =>
    tTools(`categories.${a}`).localeCompare(tTools(`categories.${b}`), locale),
  );
  const categoryCount = categories.length;

  // Resolve a recipe's tool ids to {id, href, name}, dropping any that are not
  // currently available (defense in depth; the build guard also enforces this).
  const recipes = GUIDE_RECIPES.map((r) => ({
    id: r.id,
    steps: r.toolIds
      .map((id) => tools.find((tl) => tl.id === id && tl.available))
      .filter((tl): tl is NonNullable<typeof tl> => Boolean(tl))
      .map((tl) => ({ id: tl.id, href: tl.href, name: tTools(`${tl.id}.name`) })),
  })).filter((r) => r.steps.length > 0);

  // THE MAP (G9): the five worlds and their entries from the shared registry, each entry labelled the way the
  // home directory labels it (home.map.*, nav.*, or a literal) and carrying the count the home shows for it.
  const tHome = await getTranslations("home");
  const counted = getSiteCounts(locale);
  // The count phrases by destination, from the table the footer and the colophon read too (src/lib/worldCounts.ts,
  // 2026-10-06), so the guide's map cannot state a figure the footer contradicts.
  const countFor = await getWorldCountLabels(locale);
  /** A world entry's label: "map.x" and "front.x" under home, "nav.x" under nav, "=Literal" as written. */
  const worldLabel = (label: string) =>
    label.startsWith("=") ? label.slice(1) : label.startsWith("nav.") ? tNav(label.slice(4)) : tHome(label);
  const worlds = WORLDS.map((w) => ({
    key: w.key,
    title: tHome(`front.world.${w.key}`),
    verb: tHome(`front.worldVerb.${w.key}`),
    // Every entry, the footer's included (the home directory skips the Blog; a guide does not).
    items: w.items.map((it) => ({ label: worldLabel(it.label), href: it.href, count: countFor[it.href] })),
  }));

  // HOW TO (G9): one block per surface. The prose is in messages; the links are routes, three at most each.
  const how: { key: string; links: { href: string; label: string }[] }[] = [
    { key: "tools", links: [{ href: "/tools", label: t("how.tools.l1") }, { href: "/tools#hub-paste-title", label: t("how.tools.l2") }, { href: "/api", label: t("how.tools.l3") }] },
    // The article series and the training series (row 62, 2026-10-07): the reading-in-order surfaces the Guide had not named.
    { key: "learn", links: [{ href: "/learn", label: t("how.learn.l1") }, { href: "/learn/series", label: t("how.learn.l4") }, { href: "/glossary", label: t("how.learn.l2") }, { href: "/practice", label: t("how.learn.l3") }] },
    { key: "guides", links: [{ href: "/study-guides#training-series", label: t("how.guides.l3") }, { href: "/study-guides", label: t("how.guides.l1") }, { href: "/certifications", label: t("how.guides.l2") }] },
    { key: "hubs", links: [{ href: "/vendor-hubs", label: t("how.hubs.l1") }, { href: "/training", label: t("how.hubs.l2") }] },
    { key: "industry", links: [{ href: "/industry", label: t("how.industry.l1") }, { href: "/industry/chapters", label: t("how.industry.l2") }, { href: "/industry/method", label: t("how.industry.l3") }] },
    { key: "search", links: [{ href: "/settings", label: t("how.search.l1") }, { href: "/sitemap", label: t("how.search.l2") }] },
    { key: "privacy", links: [{ href: "/privacy", label: t("how.privacy.l1") }, { href: "/stats", label: t("how.privacy.l2") }, { href: "/colophon", label: t("how.privacy.l3") }] },
  ];

  // Datasheet rows: label + value. Counts are derived; the rest are facts.
  const datasheet: { label: string; value: string }[] = [
    { label: t("ds.tools"), value: String(liveToolCount) },
    { label: t("ds.categories"), value: String(categoryCount) },
    { label: t("ds.articles"), value: String(articleCount) },
    // Two rows where there was one (2026-10-06): the reading paths and the certification guides are different
    // datasets, and the row once labelled "Study guides" carried the certification figure.
    { label: t("ds.paths"), value: String(counted.readingPaths) },
    { label: t("ds.guides"), value: String(counted.guides) },
    { label: t("ds.hubs"), value: String(counted.hubs) },
    { label: t("ds.industry"), value: String(counted.industry) },
    { label: t("ds.people"), value: String(counted.people) },
    { label: t("ds.glossary"), value: String(glossaryCount) },
    { label: t("ds.languages"), value: String(localeCount) },
    { label: t("ds.compute"), value: t("ds.computeValue") },
    { label: t("ds.privacy"), value: t("ds.privacyValue") },
    { label: t("ds.codeLicense"), value: "Apache-2.0" },
    { label: t("ds.contentLicense"), value: "CC BY 4.0" },
    { label: t("ds.tech"), value: t("ds.techValue") },
    { label: t("ds.cost"), value: t("ds.costValue") },
  ];

  // Detailed-manual sections: heading + body, all from i18n.
  const manual: { h: string; b: string }[] = [
    { h: t("manual.start.h"), b: t("manual.start.b") },
    { h: t("manual.learning.h"), b: t("manual.learning.b") },
    { h: t("manual.beyond.h"), b: t("manual.beyond.b") },
    { h: t("manual.privacy.h"), b: t("manual.privacy.b") },
    { h: t("manual.api.h"), b: t("manual.api.b") },
    { h: t("manual.languages.h"), b: t("manual.languages.b") },
    { h: t("manual.offline.h"), b: t("manual.offline.b") },
    { h: t("manual.source.h"), b: t("manual.source.b") },
  ];

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="colophon-hero">
            <div className="container colophon-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              {/* In-page nav to the four parts. */}
              <nav className="guide-toc" aria-label={t("tocAria")}>
                <a href="#map" className="guide-toc-link">{t("nav.map")}</a>
                {how.map((h) => (
                  <a key={h.key} href={`#how-${h.key}`} className="guide-toc-link">{t(`how.${h.key}.nav`)}</a>
                ))}
                <a href="#datasheet" className="guide-toc-link">{t("nav.datasheet")}</a>
                <a href="#quickref" className="guide-toc-link">{t("nav.quickref")}</a>
                <a href="#usage" className="guide-toc-link">{t("nav.usage")}</a>
                <a href="#manual" className="guide-toc-link">{t("nav.manual")}</a>
              </nav>
            </div>
          </section>

          {/* 0. THE MAP: the five worlds, with the home's counts */}
          <section id="map" className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("mapHeading")}</h2>
              <p className="colophon-body">{t("mapIntro")}</p>
              <div className="guide-map">
                {worlds.map((w) => (
                  <div className="guide-map-world" key={w.key}>
                    <h3 className="guide-map-world-title">
                      <span className="guide-map-world-verb mono">{w.verb}</span>
                      {w.title}
                    </h3>
                    <ul className="guide-map-items">
                      {w.items.map((it) => (
                        <li className="guide-map-item" key={it.href}>
                          <Link href={it.href} className="guide-map-link">{it.label}</Link>
                          {it.count && <span className="guide-map-count mono">{it.count}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 0b. HOW TO: one block per surface */}
          <section id="how" className="section section-accent">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("howHeading")}</h2>
              <p className="colophon-body">{t("howIntro")}</p>
              {how.map((h) => (
                <div className="guide-how" id={`how-${h.key}`} key={h.key}>
                  <h3 className="guide-how-h">{t(`how.${h.key}.h`)}</h3>
                  <p className="colophon-body">{t(`how.${h.key}.p1`)}</p>
                  <p className="colophon-body">{t(`how.${h.key}.p2`)}</p>
                  {/* A third paragraph where a surface needs one (row 62: the five ways to read in order). */}
                  {t.has(`how.${h.key}.p3`) && <p className="colophon-body">{t(`how.${h.key}.p3`)}</p>}
                  <p className="guide-how-links">
                    <span className="guide-how-start mono">{t("howStart")}</span>
                    {h.links.map((l, i) => (
                      <span key={l.href}>
                        {i > 0 && " · "}
                        <Link href={l.href} className="guide-how-link">{l.label}</Link>
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 1. DATASHEET */}
          <section id="datasheet" className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("datasheetHeading")}</h2>
              <p className="colophon-body">{t("datasheetIntro")}</p>
              <dl className="guide-datasheet">
                {datasheet.map((row) => (
                  <div className="guide-ds-row" key={row.label}>
                    <dt className="guide-ds-label">{row.label}</dt>
                    <dd className="guide-ds-value">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* 2. QUICK REFERENCE */}
          <section id="quickref" className="section section-accent">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("quickrefHeading")}</h2>
              <p className="colophon-body">{t("quickrefIntro")}</p>
              {categories.map((category) => (
                <div className="guide-qr-group" key={category}>
                  <h3 className="guide-qr-cat">
                    <Link href={`/category/${category}`} className="guide-qr-catlink">
                      {tTools(`categories.${category}`)}
                    </Link>
                  </h3>
                  <ul className="guide-qr-list">
                    {agnosticTools
                      .filter((tl) => tl.category === category)
                      .sort((a, b) =>
                        tTools(`${a.id}.name`).localeCompare(tTools(`${b.id}.name`), locale),
                      )
                      .map((tl) => (
                        <li className="guide-qr-item" key={tl.id}>
                          <Link href={tl.href} className="guide-qr-name">
                            {tTools(`${tl.id}.name`)}
                          </Link>
                          <span className="guide-qr-blurb">{tTools(`${tl.id}.blurb`)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 3. SUGGESTED USAGE */}
          <section id="usage" className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("usageHeading")}</h2>
              <p className="colophon-body">{t("usageIntro")}</p>
              <div className="guide-recipes">
                {recipes.map((r) => (
                  <div className="guide-recipe" key={r.id}>
                    <h3 className="guide-recipe-title">{t(`recipes.${r.id}.title`)}</h3>
                    <p className="guide-recipe-desc">{t(`recipes.${r.id}.desc`)}</p>
                    <ol className="guide-recipe-steps">
                      {r.steps.map((s) => (
                        <li className="guide-recipe-step" key={s.id}>
                          <Link href={s.href} className="guide-recipe-tool">
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. DETAILED MANUAL */}
          <section id="manual" className="section section-accent">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("manualHeading")}</h2>
              {manual.map((m) => (
                <div className="guide-manual-block" key={m.h}>
                  <h3 className="guide-manual-h">{m.h}</h3>
                  <p className="colophon-body">{m.b}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer CTAs: back to the tools, and into the Learn library — the
              guide reports the article count in the datasheet, so give the
              reader a direct way to reach those articles. */}
          <section className="section">
            <div className="container colophon-container guide-cta-row">
              <Link href="/tools" className="btn btn-secondary colophon-back">
                {t("backToTools")} →
              </Link>
              <Link href="/learn" className="btn btn-secondary">
                {t("exploreLearn")} →
              </Link>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
