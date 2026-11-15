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

// English dates and lists in British form, through one helper (PRIME 11/11/2026 00:09).
import { intlLocale } from "@/i18n/locales";
import { notFound } from "next/navigation";
import MessageSlice from "@/components/MessageSlice";
import ShareControl from "@/components/ShareControl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeLocaliseLinks from "@/lib/rehypeLocaliseLinks";
// Links to other sites open in a new tab (PRIME 2026-10-27; src/lib/rehypeExternalLinks.ts).
import rehypeExternalLinks from "@/lib/rehypeExternalLinks";
import GlossaryTerm from "@/components/GlossaryTerm";
// The psychological-operations blocks (PRIME 2026-11-09): a labelled opinion of Rodolfo Nützmann, a claim with its
// evidence status, and the method note; a post tagged "psychological-operations" is held to them (check-rod-voice.mjs, which also keeps opinion blocks out).
import ReaderQuestions from "@/components/learn/ReaderQuestions"; // open questions for the reader (PRIME 12/11/2026 15:18; the opinion block is gone)
import Claim from "@/components/learn/Claim";
import MethodNote from "@/components/learn/MethodNote";
import { rehypeGlossaryHints } from "@/lib/rehypeGlossaryHints";
import { getHintSurfaces } from "@/lib/glossaryHints";
import remarkGfm from "remark-gfm";
import { routing } from "@/i18n/routing";
import { BlogPostingSchema } from "@/components/PersonSchema";
import { getPost, getAllPostSlugs } from "@/lib/blog";
import { getArticle } from "@/lib/learn";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
// The author's instructor profile on Red Education's site, linked from every byline (PRIME 15/11/2026 01:40: "ok, link to my
// Red Education profile"), attributed at render like every outbound Red Education link (UTM rule 2026-07-22).
import { RED_EDUCATION_INSTRUCTOR_PROFILE, attributeRedEducationUrl, externalRel } from "@/config/redEducation";

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

  const fmt = new Intl.DateTimeFormat(intlLocale(locale), {
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
              {/* The byline ends with the author's instructor profile at Red Education: one attributed link per post
                  (pageType blog, the post's slug, cta byline), checked on its own by check-red-education-links.mjs
                  (exactly one per post page) and kept out of the site-wide baseline, as the footer link is. */}
              {" - "}
              <a
                href={attributeRedEducationUrl(RED_EDUCATION_INSTRUCTOR_PROFILE, { pageType: "blog", pageSlug: post.slug, locale, cta: "byline" })}
                target="_blank"
                rel={externalRel(RED_EDUCATION_INSTRUCTOR_PROFILE)}
                className="redu-inline-link"
              >
                {t("bylineProfile")}
              </a>
            </p>
            <p className="article-summary">{post.summary}</p>

            {/* Optional illustration. Site policy: original art, or the
                author's own photograph of an object he owns. Rendered above the
                body because on this blog the picture is evidence for the piece
                rather than decoration after it. */}
            {/* Machine-readable authorship: the post, and a REFERENCE to the
                Person carried by /about's layout. Added 2026-09-11. */}
            <BlogPostingSchema
              title={post.title}
              description={post.summary}
              slug={post.slug}
              locale={locale}
              datePublished={post.date}
              dateModified={post.updated}
            />

            {post.image && (
              <figure className="gloss-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="gloss-figure-img"
                  src={post.image.src}
                  alt={post.image.alt}
                  loading="lazy"
                  decoding="async"
                />
                {(post.image.caption || post.image.credit) && (
                  <figcaption className="gloss-figure-caption">
                    {post.image.caption}
                    {post.image.credit && (
                      <span className="gloss-figure-credit">{post.image.credit}</span>
                    )}
                  </figcaption>
                )}
              </figure>
            )}

            <div className="article-body">
              <MDXRemote
                source={post.body}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    // Root-relative links get this page's locale (src/lib/rehypeLocaliseLinks.ts).
                    rehypePlugins: [[rehypeGlossaryHints, getHintSurfaces()], [rehypeLocaliseLinks, locale], rehypeExternalLinks],
                  },
                }}
                components={{ GlossaryTerm, ReaderQuestions, Claim, MethodNote }}
              />
            </div>

            {/* The closing illustration: what the piece leaves you looking at.
                Carries a credit line because a third-party diagram under a
                share-alike licence must name its author and licence on the
                page, not only in the repository's metadata. */}
            {post.imageEnd && (
              <figure className="gloss-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="gloss-figure-img"
                  src={post.imageEnd.src}
                  alt={post.imageEnd.alt}
                  loading="lazy"
                  decoding="async"
                />
                {(post.imageEnd.caption || post.imageEnd.credit) && (
                  <figcaption className="gloss-figure-caption">
                    {post.imageEnd.caption}
                    {post.imageEnd.credit && (
                      <span className="gloss-figure-credit">{post.imageEnd.credit}</span>
                    )}
                  </figcaption>
                )}
              </figure>
            )}

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
