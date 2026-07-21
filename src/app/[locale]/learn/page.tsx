// ============================================================================
// src/app/[locale]/learn/page.tsx
// ----------------------------------------------------------------------------
// THE LEARN SECTION INDEX — surface (b): the standalone reference/Learn area.
//
// Articles are GROUPED BY CATEGORY (the same taxonomy as the tools index), so
// the two sections read as one coherent library as the catalogue grows. The
// grouping + ordering lives in the loader (getArticlesByCategory); the category
// LABELS come from the shared "tools.categories.*" i18n keys, so one label set
// serves both indexes. Fed by the SAME loader as the in-tool panels — one
// content source, two surfaces.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { getArticlesByCategory, getArticleVendors } from "@/lib/learn";
import type { CSSProperties } from "react";
import { GLOSSARY } from "@/content/glossary/glossary";
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import { studyGuides, objectiveCount } from "@/content/certifications/study-guides";
import FamilyChip from "@/components/FamilyChip";
import { articleCategories, categoryColor } from "@/config/categoryColors";
import { Link } from "@/i18n/navigation";
import { populatedVendors, vendorColor } from "@/config/vendors";
import ScrollToTop from "@/components/ScrollToTop";
import CategoryFilter from "@/components/CategoryFilter";
import ViewToggle from "@/components/ViewToggle";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learn" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { ...ogImages("page", "learn", locale, alt) };
}

export default async function LearnIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations("nav");
  const t = await getTranslations("learn");
  // Category labels are shared with the tools index (tools.categories.*).
  const tTools = await getTranslations("tools");
  const tHub = await getTranslations("vendorHub"); // hub-strip chrome
  const tGloss = await getTranslations("glossary");
  const tSg = await getTranslations("studyGuidesIndex"); // glossary callout
  // Articles, grouped by the loader (within each group: curated order; English
  // fallback handled inside). Category groups themselves are sorted A->Z by
  // resolved label, locale-aware, to mirror the Tools index taxonomy.
  const groups = getArticlesByCategory(locale).sort((a, b) =>
    tTools(`categories.${a.category}`).localeCompare(
      tTools(`categories.${b.category}`),
      locale,
    ),
  );


  // Total mapped objectives across every certification study guide - the
  // number on the study-guides portal badge, derived live from the registry.
  const totalObjectives = studyGuides.reduce((n, g) => n + objectiveCount(g), 0);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede learn-hero-lede">{t("lede")}</p>

            {/* Learn portal cards (PRIME 2026-07-21): the Glossary and the
                Study-guides doors, upgraded from two long phrases to feature
                cards - type ornament, per-card accent, live count badges
                derived from the registries (never hand-counted). */}
            <div className="learn-portal-grid">
              <Link
                href="/glossary"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>A&ndash;Z</span>
                <p className="learn-portal-title">
                  {tGloss("title")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{tGloss("tagline")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("portalTerms", { count: GLOSSARY.length })}</span>
                </p>
              </Link>
              <Link
                href="/study-guides"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>1&#8594;2&#8594;3</span>
                <p className="learn-portal-title">
                  {tSg("title")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("portalStudyLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("portalPaths", { count: READING_PATHS.length })}</span>
                  <span className="learn-portal-badge">{t("portalGuides", { count: studyGuides.length })}</span>
                  <span className="learn-portal-badge">{t("portalObjectives", { count: totalObjectives })}</span>
                </p>
              </Link>
            </div>

            {/* Vendor hub strip - see tools/page.tsx: discoverability on top
                of the listing, nav stays small (PRIME 2026-07-03). */}
            {populatedVendors().length > 0 && (
              <p className="vendor-hub-strip">
                {populatedVendors().map((v) => (
                  <Link key={v} href={`/${v}`} className="vendor-hub-strip-link">
                    <span
                      className="category-dot"
                      style={{ "--chip-color": vendorColor(v) } as React.CSSProperties}
                      aria-hidden="true"
                    />
                    {tTools(`vendors.${v}`)} {tHub("eyebrow")} →
                  </Link>
                ))}
              </p>
            )}


            {/* Sticky nav-utility bar (PRIME 2026-07-09): jump-to + show-only +
                view density in one strip that sticks below the site header on
                scroll. Contained (already inside the article container). The bar
                always renders (view toggle is always available); the jump-nav and
                filter appear only when there is more than one category. Both start
                collapsed. */}
            <div className="nav-utility-bar nav-utility-bar--contained">
              <div className="nav-utility-inner">
                {groups.length > 1 && (
                  <details className="jumpnav">
                    <summary className="jumpnav-summary" aria-label={tTools("jumpTo")}>
                      <span className="jumpnav-chevron" aria-hidden="true">
                        &#9656;
                      </span>
                      {tTools("jumpTo")}
                    </summary>
                    <ul className="category-nav-list">
                      {groups.map((group) => (
                        <li key={group.category} data-jumpnav={group.category}>
                          <a href={`#${group.category}`} className="category-nav-link">
                            {tTools(`categories.${group.category}`)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="nav-utility-controls">
                  {groups.length > 1 && (
                    <CategoryFilter
                      legend={tTools("filterLegend")}
                      allLabel={tTools("filterAll")}
                      noneLabel={tTools("filterNone")}
                      emptyLabel={tTools("filterEmpty")}
                      moreLabel={tTools("filterMore")}
                      fewerLabel={tTools("filterFewer")}
                      groups={groups.map((group) => ({
                        key: group.category,
                        sectionId: group.category,
                        label: tTools(`categories.${group.category}`),
                        color: categoryColor(group.category),
                      }))}
                    />
                  )}
                  <ViewToggle
                    targetId="main"
                    storageKey="ronutz:view:learn"
                    legend={tTools("viewLegend")}
                    cardsLabel={tTools("viewCards")}
                    listLabel={tTools("viewList")}
                  />
                </div>
              </div>
            </div>

            {/* One block per category, mirroring the tools index taxonomy. */}
            {groups.map((group) => (
              <section className="category-section" id={group.category} key={group.category} style={{ marginBottom: "2.5rem" }}>
                <h2 className="tools-category">
                  <span
                    className="category-dot"
                    style={{ "--chip-color": categoryColor(group.category) } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  <Link href={`/category/${group.category}`} className="tools-category-link">
                    {tTools(`categories.${group.category}`)}
                  </Link>{" "}
                  <span className="category-count">({group.articles.length})</span>
                </h2>
                <ul className="learn-grid">
                  {group.articles.map((a) => (
                    <li key={a.slug} className="learn-grid-item" data-vendors={getArticleVendors(a).join(" ")}>
                      <Link href={`/learn/${a.slug}`} className="learn-card">
                        <h3 className="learn-card-title">{a.title}</h3>
                        <p className="learn-card-summary">{a.summary}</p>
                        <span className="family-chip-row">
                          {articleCategories(a).map((cat) => (
                            <FamilyChip key={cat} category={cat} label={tTools(`categories.${cat}`)} />
                          ))}
                        </span>
                        <span className="learn-card-cta">{t("read")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* LIST VIEW — same articles in catalogue anatomy (admin-table
                    vocabulary); summary rides the wide notes-style column. */}
                <div className="admin-table-wrap pubcat">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{t("listHead.article")}</th>
                        <th>{t("listHead.topic")}</th>
                        <th>{t("listHead.summary")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.articles.map((a) => (
                        <tr key={a.slug} data-vendors={getArticleVendors(a).join(" ")}>
                          <td>
                            <Link href={`/learn/${a.slug}`} className="pubcat-toollink">
                              <span className="admin-name">{a.title}</span>
                            </Link>
                          </td>
                          <td className="admin-status-cell">
                            <span className="admin-badges">
                              {articleCategories(a).map((cat) => (
                                <FamilyChip key={cat} category={cat} label={tTools(`categories.${cat}`)} />
                              ))}
                            </span>
                          </td>
                          <td className="admin-note">{a.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />

      <ScrollToTop label={tTools("backToTop")} />
    </>
  );
}
