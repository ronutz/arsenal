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
//
// 2026-11-16 (PRIME 03:54: "How about we show the number of each blog post on the blog index page? How about categories
// and filters?"): each card carries the post's number in publication order, its category beside the date, and its
// topics (the frontmatter tags, labelled in every language) as links; above the list, the BlogFilter island narrows it
// by one category and one topic. Every post is still rendered here, so the list reads whole without JavaScript.
// ============================================================================

// English dates and lists in British form, through one helper (PRIME 11/11/2026 00:09).
import { intlLocale } from "@/i18n/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { countBy, getAllPosts } from "@/lib/blog";
import { categoryColor } from "@/config/categoryColors";
import BlogFilter from "@/components/blog/BlogFilter";
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
  const tCat = await getTranslations("tools.categories"); // the site's category labels, shared with tools and Learn
  const posts = getAllPosts(locale);

  // The filter's chips (PRIME 16/11/2026 03:54): the categories and topics in use, most posts first, ties by label.
  const collator = new Intl.Collator(intlLocale(locale)); // label order in the reader's language
  const byCount = (counts: Map<string, number>, label: (k: string) => string) =>
    [...counts.keys()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || collator.compare(label(a), label(b))); // most first
  const catLabel = (k: string) => tCat(k); // a category's label
  const tagLabel = (k: string) => t(`tags.${k}`); // a topic's label (check-blog proves every tag in use has one)
  const tagCounts = countBy(posts, (p) => p.tags ?? []); // posts per topic
  const categories = byCount(countBy(posts, (p) => [p.category]), catLabel).map((k) => ({ key: k, label: catLabel(k), color: categoryColor(k) })); // category chips
  const topics = byCount(tagCounts, tagLabel).map((k) => ({ key: k, label: tagLabel(k) })); // topic chips
  // The topics shared by two posts or more show at once (at least six); the rest wait behind "more topics".
  const topicsShown = Math.min(topics.length, Math.max(6, topics.filter((x) => (tagCounts.get(x.key) ?? 0) >= 2).length));

  // Dates are rendered in the reader's locale, from the ISO frontmatter value.
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
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
              <>
                {/* The filter (PRIME 16/11/2026 03:54): one category and one topic at a time; %SHOWN% and %TOTAL% are
                    filled in by the island as the reader filters. */}
                <BlogFilter
                  posts={posts.map((p) => ({ category: p.category, tags: p.tags ?? [] }))}
                  categories={categories}
                  topics={topics}
                  topicsShown={topicsShown}
                  label={t("filter.label")}
                  categoryLegend={t("filter.categoryLegend")}
                  topicLegend={t("filter.topicLegend")}
                  allCategoriesLabel={t("filter.allCategories")}
                  allTopicsLabel={t("filter.allTopics")}
                  moreTopicsLabel={t("filter.moreTopics", { count: topics.length - topicsShown })}
                  fewerTopicsLabel={t("filter.fewerTopics")}
                  showingTemplate={t("filter.showing", { shown: "%SHOWN%", total: "%TOTAL%" })}
                  clearLabel={t("filter.clear")}
                  emptyLabel={t("filter.empty")}
                />
                <ul className="blog-list">
                  {posts.map((p) => (
                    // The row carries what the filter reads: its category and its topics.
                    <li key={p.slug} data-blog-entry="" data-category={p.category} data-tags={(p.tags ?? []).join(" ")}>
                      <article className="blog-entry">
                        {/* The post's number in publication order: read out in full, drawn as a small prefix over a large
                            numeral in the card's margin. */}
                        <p className="blog-entry-number">
                          <span className="sr-only">{t("numberAria", { n: p.number })}</span>
                          <span className="blog-entry-number-prefix" aria-hidden="true">
                            {t("numberPrefix")}
                          </span>
                          <span className="blog-entry-number-n" aria-hidden="true">
                            {p.number}
                          </span>
                        </p>
                        <div className="blog-entry-body">
                          <h2 className="blog-entry-title">
                            <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                          </h2>
                          {/* The date, then the category with its colour, as the tool and Learn indexes mark it. */}
                          <p className="blog-entry-meta">
                            <time dateTime={p.date}>{fmt.format(new Date(`${p.date}T12:00:00Z`))}</time>
                            <span className="blog-entry-cat">
                              <span className="blog-entry-cat-dot" style={{ background: categoryColor(p.category) }} aria-hidden="true" />
                              {catLabel(p.category)}
                            </span>
                          </p>
                          <p className="blog-entry-lede">{p.summary}</p>
                          {/* The topics: each a link to the index filtered by it, raised above the card's stretched link. */}
                          {(p.tags ?? []).length > 0 ? (
                            <ul className="blog-entry-topics" aria-label={t("topicsAria")}>
                              {(p.tags ?? []).map((tag) => (
                                <li key={tag}>
                                  <Link href={`/blog?tag=${encodeURIComponent(tag)}`} className="blog-entry-topic" data-blog-tag={tag}>
                                    {tagLabel(tag)}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
