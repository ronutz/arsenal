// ============================================================================
// src/app/[locale]/practice/[slug]/page.tsx
// ----------------------------------------------------------------------------
// THE PRACTICE — a single article.
//
// WHY THIS FILE EXISTS AT ALL, STATED PLAINLY. The previous turn shipped
// src/lib/practice.ts, the guard, and one article file, and reported it as
// "first article shipped". An audit PRIME asked for found that claim was
// overstated: the FILE shipped, but there was no route, so nothing rendered,
// nothing was searchable, and every frontmatter field was inert. This is the
// presentation layer that was missing.
//
// PARITY WITH /learn IS DELIBERATE AND COMPLETE. A reader should not be able to
// tell that this section was built later. Everything the learn route does, this
// does: MDX compiled to React, GitHub-flavoured Markdown for tables, the
// build-time glossary pass that links acronyms on first mention, breadcrumbs,
// the end-of-read share control, read-next links, and the .md twin link for the
// two natively authored locales.
//
// WHAT IS ADDED HERE THAT LEARN DOES NOT HAVE: the STANCE marker. It sits
// directly under the title, before the reader has read a word of the body,
// because its whole purpose is to condition how the body is read. An article
// marked "documented" is scholarship and should be read as such; one marked
// "practised" is testimony. Putting that at the end, or in small print, would
// defeat it.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import MessageSlice from "@/components/MessageSlice";
import ShareControl from "@/components/ShareControl";
import GlossaryTerm from "@/components/GlossaryTerm";
import { rehypeGlossaryHints } from "@/lib/rehypeGlossaryHints";
import { getHintSurfaces } from "@/lib/glossaryHints";
import { routing } from "@/i18n/routing";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import {
  getPracticeArticle,
  getPracticeArticles,
} from "@/lib/practice";
import { rolesUsingPracticeArticle } from "@/lib/roles";

export function generateStaticParams() {
  // Slugs come from the English corpus: it is the authored spine, and every
  // article is required by the guard to exist in both day-one locales.
  return routing.locales.flatMap((locale) =>
    getPracticeArticles("en").map((a) => ({ locale, slug: a.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = getPracticeArticle(locale, slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.thesis,
    ...ogImages("page", "practice", locale, article.title),
  };
}

export default async function PracticeArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = getPracticeArticle(locale, slug);
  if (!article) notFound();

  const t = await getTranslations("practice");
  const tNav = await getTranslations("nav");

  // Read-next comes from the article's own frontmatter, resolved against the
  // corpus so a stale slug simply disappears rather than rendering a dead link.
  const all = getPracticeArticles(locale);
  /* WHO DOES THIS WORK — derived from The Roles rather than stored here, so the
     relation is written once and read in both directions. See
     rolesUsingPracticeArticle(). */
  const doneBy = rolesUsingPracticeArticle(slug);

  const related = article.relatedPractice
    .map((s) => all.find((a) => a.slug === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <div className="container article-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("navLabel"), href: "/practice" },
                { label: t(`parts.${article.part}.short`), href: "/practice" },
                { label: article.title },
              ]}
            />

            <h1 className="article-title">{article.title}</h1>

            {/* The thesis, not a summary. What this article argues. */}
            <p className="article-summary">{article.thesis}</p>

            {/* The Markdown twin, for the two natively authored locales - same
                affordance the learn articles carry, and the reason a machine
                can read this corpus without parsing HTML. */}
            {(locale === "en" || locale === "pt-BR") && (
              <p className="doc-md-link">
                <a href={`/${locale}/practice/${slug}.md`}>
                  {locale === "pt-BR" ? "Ver em Markdown" : "View as Markdown"}
                </a>
              </p>
            )}

            {/* The body. remark-gfm for tables and lists; rehypeGlossaryHints
                is the build-time pass that wraps the FIRST prose mention of
                each eligible term - which is what makes acronyms explain
                themselves in a corpus written for people who are still
                learning the vocabulary. */}
            <div className="article-body">
              <MDXRemote
                source={article.body}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [[rehypeGlossaryHints, getHintSurfaces()]],
                  },
                }}
                components={{ GlossaryTerm }}
              />
            </div>

            {/* The artefact, where the article produces one. Named rather than
                buried, because a checklist somebody can take away is the
                difference between reading and improving - which is the stated
                purpose of the corpus. */}
            {article.artefact && (
              <p className="vendor-note-body mono">
                {t("artefactLabel")}: {article.artefact}
              </p>
            )}

            <MessageSlice namespaces={["share"]}>
              <div className="article-share">
                <ShareControl title={article.title} />
              </div>
            </MessageSlice>

            {doneBy.length > 0 && (
              <nav className="article-related" aria-label={t("rolesAria")}>
                <h2 className="article-related-title">{t("whoDoesThis")}</h2>
                <ul className="article-related-list">
                  {doneBy.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/roles/${r.slug}`} className="article-related-link">
                        <span className="article-related-link-title">{r.title}</span>
                        <span className="article-related-link-summary">
                          {r.whatItIs.split(". ")[0]}.
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {related.length > 0 && (
              <nav className="article-related" aria-label={t("relatedAria")}>
                <h2 className="article-related-title">{t("readNext")}</h2>
                <ul className="article-related-list">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/practice/${r.slug}`}
                        className="article-related-link"
                      >
                        <span className="article-related-link-title">
                          {r.title}
                        </span>
                        <span className="article-related-link-summary">
                          {r.thesis}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <p className="article-back">
              <Link href="/practice">{t("backToIndex")}</Link>
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
