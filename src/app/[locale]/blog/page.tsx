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
      <a href="#main" className="skip-link">
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

            {posts.length === 0 ? (
              <p className="ztc-empty">{t("empty")}</p>
            ) : (
              <ul className="article-related-list">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className="article-related-link">
                      <span className="article-related-link-title">{p.title}</span>
                      <span className="article-related-link-summary">
                        <time dateTime={p.date}>{fmt.format(new Date(`${p.date}T12:00:00Z`))}</time>
                        {" - "}
                        {p.summary}
                      </span>
                    </Link>
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
