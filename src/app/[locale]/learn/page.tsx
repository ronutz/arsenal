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
import { partnerVendors } from "@/content/vendors/partners";
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import { studyGuides, objectiveCount } from "@/content/certifications/study-guides";
import FamilyChip from "@/components/FamilyChip";
import { articleCategories, categoryColor } from "@/config/categoryColors";
import { Link } from "@/i18n/navigation";
import { VENDOR_FAMILIES } from "@/config/vendors";
import { getPracticeArticles } from "@/lib/practice";
import { ROLES } from "@/lib/roles";
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
  return { title: alt, ...ogImages("page", "learn", locale, alt) };
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
  // Total across the category groups - the badge on the jump-to-articles card.
  const articleCount = getArticlesByCategory(locale).reduce((n, g) => n + g.articles.length, 0);
  // Computed, never written down: the card and the section read one source.
  const practiceCount = getPracticeArticles(locale).length;
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
              {/* PRIME 2026-07-27: three doors ahead of the existing pair.
                  The first is an in-page jump rather than a link - the article
                  index is what this page IS, and it sat below three screens of
                  portal cards with nothing pointing at it. The other two
                  replace the per-vendor pill strip that used to sit here: one
                  door to the hubs and one to the certification guides, instead
                  of a row that grew by one pill per vendor. */}
              <a
                href="#articles"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-primary)" } as React.CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9660;</span>
                <p className="learn-portal-title">
                  {t("portalArticles")} <span className="learn-portal-arrow">&#8595;</span>
                </p>
                <p className="learn-portal-lede">{t("portalArticlesLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("portalArticleCount", { count: articleCount })}</span>
                </p>
              </a>
              <Link
                href="/vendor-hubs"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-warning)" } as React.CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {t("portalHubs")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("portalHubsLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("portalHubCount", { count: VENDOR_FAMILIES.length })}</span>
                </p>
              </Link>
              {/* THE PRACTICE (PRIME 2026-08-06). A SIBLING card, not a nested
                  section: PRIME asked whether the corpus should live under
                  /learn and the answer was no. Learn holds 528 articles on how
                  the TECHNOLOGY works; The Practice holds writing on how the
                  WORK is done. A reader arrives here with a protocol question
                  and there with a professional one, and nesting the second
                  under the first would have made it look like product
                  documentation and buried 48 articles under 528.

                  The count is COMPUTED from the corpus rather than written
                  down, so the card cannot claim a number the section then
                  contradicts. */}
              <Link
                href="/practice"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-danger)" } as React.CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">
                  {t("portalPractice")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("portalPracticeLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">
                    {t("portalPracticeCount", { count: practiceCount })}
                  </span>
                </p>
              </Link>

              {/* THE ROLES (PRIME 2026-08-14). Placed immediately after The
                  Practice because the two are a pair: that corpus is how the
                  work is done, this one is what the positions are. Sibling
                  card, same as the Practice card - the section lives at
                  /roles, a top-level peer rather than a child of learn. */}
              <Link
                href="/roles"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-accent)" } as React.CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {t("portalRoles")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("portalRolesLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">
                    {t("portalRolesCount", { count: ROLES.length })}
                  </span>
                </p>
              </Link>
              <Link
                href="/certifications"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-primary)" } as React.CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#10003;</span>
                <p className="learn-portal-title">
                  {t("portalCerts")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("portalCertsLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("portalGuides", { count: studyGuides.length })}</span>
                </p>
              </Link>
              {/* THE INDUSTRY (PRIME 2026-09-01). The largest body of written
                  material on this site that the Learn portal did not point at:
                  profiles of the companies and the people, the lineage
                  timeline, and the acquisition trail that explains why the
                  product on the shelf carries a different name from the one
                  that built it. Counts come from the registries, so the card
                  cannot drift from the section. */}
              <Link
                href="/industry"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-secondary)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#8620;</span>
                <p className="learn-portal-title">
                  {t("portalIndustry")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("portalIndustryLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">
                    {t("portalCompanies", { count: partnerVendors.length })}
                  </span>
                </p>
              </Link>
              {/* PEOPLE (PRIME 2026-09-01). The individuals were in the
                  glossary all along with no address of their own; the flag on
                  each entry is what made a page possible. Count is derived, so
                  it cannot drift from the data. */}
              <Link
                href="/people"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-amber)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9787;</span>
                <p className="learn-portal-title">
                  {t("portalPeople")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("portalPeopleLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">
                    {t("portalPeopleCount", { count: GLOSSARY.filter((e) => e.person).length })}
                  </span>
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
            </div>



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

            {/* Jump target for the articles card at the top of the page: the
                article index is what this page is for, and nothing pointed at
                it. Self-closing anchor rather than a wrapper - no closing tag
                to misplace - with the offset that clears the sticky header. */}
            <div id="articles" aria-hidden className="learn-articles-anchor" />

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
