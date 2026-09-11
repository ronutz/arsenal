// ============================================================================
// src/app/[locale]/blog/[slug]/page.tsx
// ----------------------------------------------------------------------------
// THE BLOG POST PAGE — one dated commentary post.
//
// Shares the Learn article renderer deliberately (same MDX pipeline, same
// glossary-hint rehype plugin, same share control), so prose looks identical
// wherever it appears on the site. What differs is the HEADER: a post carries
// a visible byline and date, because commentary is signed and time-bound in a
// way an evergreen Learn article is not.
// ============================================================================

import { notFound } from "next/navigation";
import MessageSlice from "@/components/MessageSlice";
import ShareControl from "@/components/ShareControl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import GlossaryTerm from "@/components/GlossaryTerm";
import { rehypeGlossaryHints } from "@/lib/rehypeGlossaryHints";
import { getHintSurfaces } from "@/lib/glossaryHints";
import remarkGfm from "remark-gfm";
import { routing } from "@/i18n/routing";
import { getPost, getAllPostSlugs } from "@/lib/blog";
import { getArticle } from "@/lib/learn";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";

/** Pre-generate every post page for every locale at build time. */
export function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPost(slug, locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    ...ogImages("article", slug, locale, post.title),
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPost(slug, locale);
  if (!post) notFound();

  const tNav = await getTranslations("nav");
  const t = await getTranslations("blog");

  const fmt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Further reading points at EVERGREEN Learn articles, not other posts: the
  // point of a dated piece is to send you somewhere that stays true.
  const related = (post.relatedArticles ?? [])
    .map((s) => getArticle(s, locale))
    .filter((a): a is NonNullable<typeof a> => a != null);

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
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("title"), href: "/blog" },
                { label: post.title },
              ]}
            />
            <h1 className="article-title">{post.title}</h1>
            {/* Byline + date: commentary is signed and time-bound. */}
            <p className="lbm-facts">
              {post.author}
              {" - "}
              <time dateTime={post.date}>{fmt.format(new Date(`${post.date}T12:00:00Z`))}</time>
            </p>
            <p className="article-summary">{post.summary}</p>

            <div className="article-body">
              <MDXRemote
                source={post.body}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [[rehypeGlossaryHints, getHintSurfaces()]],
                  },
                }}
                components={{ GlossaryTerm }}
              />
            </div>

            <MessageSlice namespaces={["share"]}>
              <div className="article-share">
                <ShareControl title={post.title} />
              </div>
            </MessageSlice>

            {related.length > 0 && (
              <nav className="article-related" aria-label={t("furtherReadingAria")}>
                <h2 className="article-related-title">{t("furtherReading")}</h2>
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
