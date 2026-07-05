// ============================================================================
// src/app/[locale]/learn/[slug]/page.tsx
// ----------------------------------------------------------------------------
// THE LEARN ARTICLE PAGE — renders one MDX article (surface b detail view).
//
// Statically generated for every article × every locale. The MDX body is
// compiled to React via next-mdx-remote (RSC variant). Related tools and
// "read next" articles render from the article's frontmatter — the same
// cross-linking metadata the in-tool panels use.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import BigipTimeline from "@/components/learn/BigipTimeline";
import remarkGfm from "remark-gfm";
import { routing } from "@/i18n/routing";
import { getArticle, getAllArticleSlugs, getRelatedArticles, getArticleVendors } from "@/lib/learn";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import { populatedVendors } from "@/config/vendors";
import SiteFooter from "@/components/SiteFooter";

/** Pre-generate every article page for every locale at build time. */
export function generateStaticParams() {
  const slugs = getAllArticleSlugs();
  // One entry per (locale, slug). Articles fall back to English content.
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = getArticle(slug, locale);
  if (!article) notFound();

  const tNav = await getTranslations("nav");
  const tLearn = await getTranslations("learn");
  const tTools = await getTranslations("tools"); // category labels live here
  // Vendor articles trail through the vendor hub (Home > Vendor > Article), for
  // symmetry with vendor tools. An article's vendors are DERIVED (getArticleVendors
  // = concepts that are vendor keys UNION the vendors of its relatedTools), so this
  // can in principle be 0, 1, or several; take the first that is actually populated
  // (populatedVendors is derived from available vendored tools, so its hub page is
  // guaranteed to exist — this keeps the vendor crumb a real, built page and never a
  // dangling link). Falls back to null (the category trail) for non-vendor articles.
  // Today every vendored article resolves to exactly one populated vendor (F5); the
  // .find keeps this correct if a multi-vendor article ever appears.
  const populated = new Set(populatedVendors());
  const hubVendor = getArticleVendors(article).find((v) => populated.has(v)) ?? null;
  const related = getRelatedArticles(article, locale);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article className="section">
          <div className="container article-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={
                hubVendor
                  ? [
                      { label: tNav("home"), href: "/" },
                      { label: tTools(`vendors.${hubVendor}`), href: `/${hubVendor}` },
                      { label: article.title },
                    ]
                  : [
                      { label: tNav("home"), href: "/" },
                      { label: tNav("learn"), href: "/learn" },
                      ...(article.category
                        ? [{ label: tTools(`categories.${article.category}`), href: `/category/${article.category}` }]
                        : []),
                      { label: article.title },
                    ]
              }
            />
            <h1 className="article-title">{article.title}</h1>
            <p className="article-summary">{article.summary}</p>
            {(locale === "en" || locale === "pt-BR") && (
              <p className="doc-md-link">
                <a href={`/${locale}/learn/${slug}.md`}>
                  {locale === "pt-BR" ? "Ver em Markdown" : "View as Markdown"}
                </a>
              </p>
            )}

            {/* The MDX body, compiled to React. Content is trusted (authored by
                us / reviewed contributors), rendered through MDX, not raw HTML.
                remark-gfm enables GitHub-flavored Markdown (tables, strikethrough,
                task lists) for every article; table styling lives in components.css
                under `.article-body table`. */}
            <div className="article-body">
              <MDXRemote
                source={article.body}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                components={{ BigipTimeline }}
              />
            </div>

            {/* Read-next: related articles from frontmatter. */}
            {related.length > 0 && (
              <nav className="article-related" aria-label={tLearn("relatedAria")}>
                <h2 className="article-related-title">{tLearn("readNext")}</h2>
                <ul className="article-related-list">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/learn/${r.slug}`} className="article-related-link">
                        <span className="article-related-link-title">{r.title}</span>
                        <span className="article-related-link-summary">{r.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
