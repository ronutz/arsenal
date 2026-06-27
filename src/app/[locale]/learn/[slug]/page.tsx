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
import remarkGfm from "remark-gfm";
import { routing } from "@/i18n/routing";
import { getArticle, getAllArticleSlugs, getRelatedArticles } from "@/lib/learn";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
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
            <Link href="/learn" className="article-back">
              ← Learn
            </Link>
            <h1 className="article-title">{article.title}</h1>
            <p className="article-summary">{article.summary}</p>

            {/* The MDX body, compiled to React. Content is trusted (authored by
                us / reviewed contributors), rendered through MDX, not raw HTML.
                remark-gfm enables GitHub-flavored Markdown (tables, strikethrough,
                task lists) for every article; table styling lives in components.css
                under `.article-body table`. */}
            <div className="article-body">
              <MDXRemote
                source={article.body}
                options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
              />
            </div>

            {/* Read-next: related articles from frontmatter. */}
            {related.length > 0 && (
              <nav className="article-related" aria-label="Related articles">
                <h2 className="article-related-title">Read next</h2>
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
