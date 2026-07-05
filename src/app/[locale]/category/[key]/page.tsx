// ============================================================================
// src/app/[locale]/category/[key]/page.tsx
// ----------------------------------------------------------------------------
// PER-CATEGORY INDEX PAGE - a landing page for a single functional category
// that gathers BOTH its tools and its Learn articles in one place. The category
// is the shared axis between the two: every tool carries a `category` and every
// article carries the same category KEY, resolved to a label through the shared
// tools.categories.* i18n keys (one label set serves tools, Learn, and here).
//
// Statically generated for every (locale, category). The category set is the
// tool categories unioned with the article categories, so a category with only
// tools (or only articles) still gets a page. The page chrome is localized via a
// small "category" namespace; tool names/blurbs and article titles/summaries are
// already localized at their source, with English fallback for untranslated
// locales. On this page the category chip is dropped (the page IS the category);
// vendor chips are kept because they add information a tool card would not
// otherwise carry here.
// ============================================================================

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import FamilyChip from "@/components/FamilyChip";
import Breadcrumbs from "@/components/Breadcrumbs";
import { tools } from "@/config/tools";
import { getArticlesByCategory } from "@/lib/learn";
import { categoryColor } from "@/config/categoryColors";
import { vendorColor } from "@/config/vendors";

/**
 * The valid category keys: tool categories unioned with the categories that
 * have at least one article. Keeps a page alive for a category even if it is
 * currently tool-only or article-only.
 */
function categoryKeys(): string[] {
  const set = new Set<string>();
  for (const t of tools.filter((tool) => !(tool.vendors ?? []).length)) {
    set.add(t.category);
    for (const c of t.secondaryCategories ?? []) set.add(c);
  }
  for (const group of getArticlesByCategory()) {
    if (group.articles.length > 0) set.add(group.category);
  }
  return Array.from(set);
}

export function generateStaticParams() {
  const keys = categoryKeys();
  return routing.locales.flatMap((locale) => keys.map((key) => ({ locale, key })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}): Promise<Metadata> {
  const { locale, key } = await params;
  if (!categoryKeys().includes(key)) return {};
  const t = await getTranslations({ locale, namespace: "tools" });
  const tCat = await getTranslations({ locale, namespace: "category" });
  return { title: `${t(`categories.${key}`)} ${tCat("eyebrow")}` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  if (!categoryKeys().includes(key)) notFound();

  const tNav = await getTranslations("nav");
  const t = await getTranslations("tools"); // category labels + tool name/blurb
  const tCat = await getTranslations("category"); // page chrome

  // Tools in this category, available only, sorted by localized name.
  const catTools = tools
    .filter((tool) => (tool.category === key || (tool.secondaryCategories ?? []).includes(key)) && tool.available && !(tool.vendors ?? []).length)
    .sort((a, b) => t(`${a.id}.name`).localeCompare(t(`${b.id}.name`), locale));

  // Articles in this category, in the loader's curated order (English fallback
  // handled inside the loader).
  const catArticles =
    getArticlesByCategory(locale).find((group) => group.category === key)?.articles ?? [];

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: tNav("tools"), href: "/tools" },
                { label: t(`categories.${key}`) },
              ]}
            />
            <p className="hero-eyebrow">
              <span
                className="category-dot"
                style={{ "--chip-color": categoryColor(key) } as CSSProperties}
                aria-hidden="true"
              />{" "}
              {tCat("eyebrow")}
            </p>
            <h1 className="page-hero-title">
              {t(`categories.${key}`)}
            </h1>
            <p className="page-hero-lede" style={{ marginBottom: "2.5rem" }}>
              {tCat("lede")}
            </p>

            {/* Tools in this category. */}
            {catTools.length > 0 && (
              <section style={{ marginBottom: "2.5rem" }}>
                <h2 className="tools-category">{tCat("toolsHeading")}</h2>
                <ul className="tools-grid">
                  {catTools.map((tool) => (
                    <li
                      key={tool.id}
                      className="tools-grid-item"
                      data-vendors={(tool.vendors ?? []).join(" ")}
                    >
                      <Link href={tool.href} className="tools-card">
                        <h3 className="tools-card-name">{t(`${tool.id}.name`)}</h3>
                        <p className="tools-card-blurb">{t(`${tool.id}.blurb`)}</p>
                        {(tool.vendors ?? []).length > 0 && (
                          <span className="family-chip-row">
                            {(tool.vendors ?? []).map((v) => (
                              <FamilyChip
                                key={v}
                                category={v}
                                label={t(`vendors.${v}`)}
                                color={vendorColor(v)}
                              />
                            ))}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Articles in this category. */}
            {catArticles.length > 0 && (
              <section style={{ marginBottom: "2.5rem" }}>
                <h2 className="tools-category">{tCat("articlesHeading")}</h2>
                <ul className="learn-grid">
                  {catArticles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/learn/${a.slug}`} className="learn-card">
                        <h3 className="learn-card-title">{a.title}</h3>
                        <p className="learn-card-summary">{a.summary}</p>
                        <span className="learn-card-cta">{tCat("read")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Link href="/tools" className="btn btn-secondary">
              {tCat("backToTools")} →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
