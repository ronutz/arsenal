// ============================================================================
// src/app/[locale]/blog/page.tsx
// ----------------------------------------------------------------------------
// THE BLOG INDEX — dated commentary, newest first.
//
// Deliberately plainer than the Learn index: Learn is a curriculum and needs
// category grouping and reading order, whereas a blog is a timeline. One
// reverse-chronological list, each entry showing date, title, summary, and
// tags. Ratified by PRIME 2026-07-23 (URL /blog, categories reused, byline
// "Rodolfo Nützmann"). Statically generated for every locale.
//
// 2026-10-05 (PRIME 14:49, SCOUT G17): the page keeps its place but steps back
// from the home directory to the footer, and carries one honest status line
// under the intro, with the live post count and the changelog link.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/blog";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";

/** Pre-generate the index for every locale. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("title"),
    description: t("intro"),
    ...ogImages("page", "blog", locale, t("title")),
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations("nav");
  const t = await getTranslations("blog");
  const posts = getAllPosts(locale);

  // Dates are rendered in the reader's locale, from the ISO frontmatter value.
  const fmt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container article-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[{ label: tNav("home"), href: "/" }, { label: t("title") }]}
            />
            <h1 className="article-title">{t("title")}</h1>
            <p className="article-summary">{t("intro")}</p>
            {/* The honest status line (PRIME 2026-10-05 14:49, SCOUT G17): how many pieces there are, that they come as
                they are written, and where the site's own news lives. The count is the real one, so the line stays
                true as posts are added; the changelog link is the "what changed here" the blog is not for. */}
            <p className="blog-status">
              {t.rich("status", {
                n: posts.length,
                link: (chunks) => <Link href="/changelog">{chunks}</Link>,
              })}
            </p>

            {/* The posts as content, not as a list of links (2026-10-06, SCOUT's Round 1 adoption audit, row "Blog"):
                each entry used to be one link wrapping title, date and summary, a shape text extractors read as
                navigation and drop, which is how an outside crawler reported "twelve pieces so far" over an empty
                page. Now each post is an article: its title a heading that carries the link, the date in a <time>,
                the summary as plain text. The title link stretches over the card (CSS ::after), so the whole card
                stays one click target while the words stay readable as words. */}
            {posts.length === 0 ? (
              <p className="ztc-empty">{t("empty")}</p>
            ) : (
              <ul className="blog-list">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <article className="blog-entry">
                      <h2 className="blog-entry-title">
                        <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      </h2>
                      <p className="blog-entry-meta">
                        <time dateTime={p.date}>{fmt.format(new Date(`${p.date}T12:00:00Z`))}</time>
                      </p>
                      <p className="blog-entry-lede">{p.summary}</p>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
