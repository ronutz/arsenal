// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/guide/page.tsx
// ----------------------------------------------------------------------------
// THE SITE USER GUIDE. Four parts, in order:
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

  // Datasheet rows: label + value. Counts are derived; the rest are facts.
  const datasheet: { label: string; value: string }[] = [
    { label: t("ds.tools"), value: String(liveToolCount) },
    { label: t("ds.categories"), value: String(categoryCount) },
    { label: t("ds.articles"), value: String(articleCount) },
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
      <a href="#main" className="skip-link">
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
                <a href="#datasheet" className="guide-toc-link">{t("nav.datasheet")}</a>
                <a href="#quickref" className="guide-toc-link">{t("nav.quickref")}</a>
                <a href="#usage" className="guide-toc-link">{t("nav.usage")}</a>
                <a href="#manual" className="guide-toc-link">{t("nav.manual")}</a>
              </nav>
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
          <section id="quickref" className="section">
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
          <section id="manual" className="section">
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
