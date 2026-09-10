// ============================================================================
// src/app/[locale]/stories/page.tsx
// ----------------------------------------------------------------------------
// THE STITCHERS, GATHERED.
//
// PRIME, 2026-09-09: a page listing and linking the index articles and story
// stitchers, reachable from a card on Learn and from the map on the home page.
//
// WHAT THIS PAGE IS FOR. Most of the Learn corpus answers a question. A small
// number of articles do something else: they put other articles in an order
// that argues something the individual pieces do not say on their own - what
// the failure cases have in common, what a request actually traverses, why the
// same interchange bug keeps recurring. Those are hard to find by browsing a
// category list, because a category sorts by subject and these are sorted by
// argument. This page is the only place they appear as a set.
//
// EVERY TITLE AND SUMMARY IS READ FROM THE ARTICLE'S OWN FRONTMATTER at build
// time, never restated here or in the message pack. That is deliberate: a page
// that lists other pages is exactly the kind of thing that goes quietly stale,
// and the only reliable way to prevent it is to give the copy one home. If an
// article is retitled, this page retitles with it.
//
// The registry is src/content/learn/stories.ts; the guard is
// scripts/check-stories.mjs.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import { getArticle } from "@/lib/learn";
import { STORY_GROUPS } from "@/content/learn/stories";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stories" });
  return { title: t("title"), ...ogImages("page", "stories", locale, t("title")) };
}

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("stories");
  const tNav = await getTranslations("nav");

  // Resolve each slug to its article in THIS locale, so a reader in Portuguese
  // gets Portuguese titles and summaries. A slug that does not resolve is
  // dropped rather than rendered blank; check-stories.mjs fails the build for
  // that case, so a silent gap here would already have been a loud one.
  const groups = STORY_GROUPS.map((g) => ({
    key: g.key,
    articles: g.slugs
      .map((slug) => getArticle(slug, locale))
      .filter((a): a is NonNullable<typeof a> => a !== null),
  })).filter((g) => g.articles.length > 0);

  const total = groups.reduce((n, g) => n + g.articles.length, 0);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="section">
            <div className="container section-narrow">
              <Breadcrumbs
                ariaLabel={tNav("breadcrumb")}
                items={[
                  { label: tNav("home"), href: "/" },
                  { label: tNav("learn"), href: "/learn" },
                  { label: t("navLabel") },
                ]}
              />
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              <p className="section-body">{t("count", { count: total })}</p>
            </div>
          </section>

          {groups.map((g) => (
            <section className="section" key={g.key}>
              <div className="container section-narrow">
                <h2 className="section-title">{t(`group.${g.key}.title`)}</h2>
                <p className="section-body">{t(`group.${g.key}.lede`)}</p>
                <ul className="story-list">
                  {g.articles.map((a) => (
                    <li className="story-item" key={a.slug}>
                      <Link href={`/learn/${a.slug}`} className="story-link">
                        {a.title}
                      </Link>
                      {/* The article's own summary, not a second description
                          written here - see the header of this file. */}
                      <p className="story-summary">{a.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <section className="section">
            <div className="container section-narrow">
              <p className="section-body">{t("closer")}</p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
