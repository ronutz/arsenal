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
import { getArticlesByCategory } from "@/lib/learn";
import FamilyChip from "@/components/FamilyChip";
import { articleCategories, categoryColor } from "@/config/categoryColors";
import { Link } from "@/i18n/navigation";
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
  // Category labels are shared with the tools index (tools.categories.*).
  const tTools = await getTranslations("tools");
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
            <p className="hero-eyebrow">Learn</p>
            <h1 className="section-title" style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)" }}>
              Network and security concepts, explained clearly.
            </h1>
            <p className="section-body" style={{ marginBottom: "2.5rem" }}>
              Practical explanations of the concepts behind the tools. Each article is written to
              build genuine understanding, not just to define a term.
            </p>

            {/* Category jump-nav */}
            {groups.length > 1 && (
              <nav className="category-nav" aria-label={tTools("jumpTo")}>
                <span className="category-nav-label">{tTools("jumpTo")}</span>
                <ul className="category-nav-list">
                  {groups.map((group) => (
                    <li key={group.category}>
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
                  {tTools(`categories.${group.category}`)}
                </h2>
                <ul className="learn-grid">
                  {group.articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/learn/${a.slug}`} className="learn-card">
                        <h3 className="learn-card-title">{a.title}</h3>
                        <p className="learn-card-summary">{a.summary}</p>
                        <span className="family-chip-row">
                          {articleCategories(a).map((cat) => (
                            <FamilyChip key={cat} category={cat} label={tTools(`categories.${cat}`)} />
                          ))}
                        </span>
                        <span className="learn-card-cta">Read</span>
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
    </>
  );
}
