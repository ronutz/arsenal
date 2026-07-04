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
import { getArticlesByCategory, getArticleVendors } from "@/lib/learn";
import FamilyChip from "@/components/FamilyChip";
import { articleCategories, categoryColor } from "@/config/categoryColors";
import { Link } from "@/i18n/navigation";
import { populatedVendors, vendorColor } from "@/config/vendors";
import ScrollToTop from "@/components/ScrollToTop";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

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
  // Articles, grouped by the loader (within each group: curated order; English
  // fallback handled inside). Category groups themselves are sorted A->Z by
  // resolved label, locale-aware, to mirror the Tools index taxonomy.
  const groups = getArticlesByCategory(locale).sort((a, b) =>
    tTools(`categories.${a.category}`).localeCompare(
      tTools(`categories.${b.category}`),
      locale,
    ),
  );


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


            {/* Category jump-nav */}
            {groups.length > 1 && (
              <nav className="category-nav" aria-label={tTools("jumpTo")}>
                <span className="category-nav-label">{tTools("jumpTo")}</span>
                <ul className="category-nav-list">
                  {groups.map((group) => (
                    <li key={group.category} data-jumpnav={group.category}>
                      <a href={`#${group.category}`} className="category-nav-link">
                        {tTools(`categories.${group.category}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

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
                  </Link>
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
