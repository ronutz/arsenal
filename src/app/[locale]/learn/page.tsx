// ============================================================================
// src/app/[locale]/learn/page.tsx
// ----------------------------------------------------------------------------
// THE LEARN HUB (wave L of Round 1, 2026-10-05; SCOUT L1 to L9, L11, L25, L32;
// PRIME's decision 6). Two layers on one page, one anchor:
//
//   GUIDED (first): the ways in, each explained. Five learning modes as intent
//   cards (the home's "Start here" vocabulary: a question, a destination, a
//   verb): understand a subject, learn in order, prepare for a certification,
//   learn a platform, look something up. Then "Browse by subject", the
//   category browser as a major section with counts computed at build time.
//   Then three Stories as editorial discovery. Then the contextual areas
//   (The Practice, Roles, People, Industry, where the industry learns), lower
//   and quieter: contextual extensions of Learn, not competing ways to find an
//   article.
//
//   DIRECTORY (below, or first when the switch says so): the complete article
//   index, explicitly named and counted, with its jump-to, filter and view
//   controls, grouped by category exactly as before (the same taxonomy as the
//   tools index; the grouping lives in getArticlesByCategory, the labels in the
//   shared tools.categories.* keys). Nothing was removed: the eleven peer
//   portal cards that led the page were demoted into the modes and the
//   contextual rows (the canon rule: demote, do not remove; a hub explains
//   choices, an index exposes inventory, never both at equal priority).
//
// The Guided | Directory switch (HubViewSwitch) writes data-hub-view on <main>;
// the stylesheet hides the guided layer in the directory reading. /learn#directory
// opens in the directory reading. The scoped search field (wave 0) sits under
// the lede and opens the one dialog inside the Understand world.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { STORY_GROUPS, STORY_SLUGS } from "@/content/learn/stories";
import { ogImages } from "@/lib/og";
import { getArticle, getArticlesByCategory, getArticleVendors } from "@/lib/learn";
import type { CSSProperties } from "react";
import { GLOSSARY } from "@/content/glossary/glossary";
import { partnerVendors } from "@/content/vendors/partners";
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import { studyGuides, objectiveCount } from "@/content/certifications/study-guides";
import FamilyChip from "@/components/FamilyChip";
import { articleCategories, categoryColor } from "@/config/categoryColors";
import { Link } from "@/i18n/navigation";
import { VENDOR_FAMILIES } from "@/config/vendors";
import { getPracticeArticles } from "@/lib/practice";
import { ROLES } from "@/lib/roles";
import ScrollToTop from "@/components/ScrollToTop";
import CategoryFilter from "@/components/CategoryFilter";
import ViewToggle from "@/components/ViewToggle";
import Header from "@/components/Header";
import HubSearch from "@/components/HubSearch";
import HubViewSwitch from "@/components/HubViewSwitch";
// Learn P1 (L33, L30; 2026-10-05): New and Revised from each article's own `updated` stamp and the changelog, the
// home's Most read reused for articles, the first article of each subject on its card, three starting points, and
// the tools an article names shown on its index row. Nothing typed by hand except the three starting sentences.
import HomePopular from "@/components/HomePopular";
import MessageSlice from "@/components/MessageSlice";
import { CHANGELOG } from "@/content/changelog/changelog";
import { tools as toolRegistry } from "@/config/tools";
import SiteFooter from "@/components/SiteFooter";
// The shared named counts (2026-10-06): the platform-article figure the index's lede states beside its own.
import { getSiteCounts } from "@/lib/siteCounts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learn" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { title: alt, ...ogImages("page", "learn", locale, alt) };
}

export default async function LearnIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations("nav");
  const t = await getTranslations("learn");
  // Computed, never written down - the card and the destination read one source.
  const trainingPartnerCount = partnerVendors.filter((v) =>
    (v.tags as readonly string[]).includes("training")
  ).length;
  const tStories = await getTranslations("stories");
  // Category labels are shared with the tools index (tools.categories.*).
  const tTools = await getTranslations("tools");
  // Articles, grouped by the loader (within each group: curated order; English
  // fallback handled inside). Category groups themselves are sorted A->Z by
  // resolved label, locale-aware, to mirror the Tools index taxonomy.
  // Total across the category groups - the badge on the jump-to-articles card.
  const articleCount = getArticlesByCategory(locale).reduce((n, g) => n + g.articles.length, 0);
  // Computed, never written down: the card and the section read one source.
  const practiceCount = getPracticeArticles(locale).length;
  const groups = getArticlesByCategory(locale).sort((a, b) =>
    tTools(`categories.${a.category}`).localeCompare(
      tTools(`categories.${b.category}`),
      locale,
    ),
  );


  // Total mapped objectives across every certification study guide - the
  // number on the learning-paths mode, derived live from the registry.
  const totalObjectives = studyGuides.reduce((n, g) => n + objectiveCount(g), 0);
  // The three featured stories: the first thread of each group (the groups are the editorial order); the rest are
  // one link away on /stories. Titles in the reader's locale, English fallback inside the loader.
  const featuredStories = STORY_GROUPS.map((g) => getArticle(g.slugs[0], locale)).filter((a): a is NonNullable<typeof a> => a !== null).slice(0, 3);
  // NEW AND REVISED (L33a): the six most recently touched articles by their `updated` stamp. An article is "new" when
  // the changelog announced it on that same date (a changelog entry listing its slug, dated the day it was updated),
  // otherwise it is a revision of something older. Both facts come from the files, none from memory.
  const announcedOn = new Map<string, string>();
  for (const e of CHANGELOG) for (const slug of e.articles ?? []) if (!announcedOn.has(slug)) announcedOn.set(slug, e.date);
  const recentArticles = groups
    .flatMap((g) => g.articles)
    .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : a.title.localeCompare(b.title, locale)))
    .slice(0, 6)
    .map((a) => ({ slug: a.slug, title: a.title, updated: a.updated, isNew: announcedOn.get(a.slug) === a.updated }));
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  // THE TOOLS AN ARTICLE NAMES (L30): the first two of its relatedTools that are live, by name, on its index row.
  const toolName = (id: string) => (toolRegistry.some((tl) => tl.id === id && tl.available) ? tTools(`${id}.name`) : null);
  // People in the glossary, the count on the People row.
  const peopleCount = GLOSSARY.filter((e) => e.person).length;
  // THE FIVE LEARNING MODES (SCOUT L4): a question, a destination, a verb, a count where one is counted.
  const modes: { key: string; href: string; accent: string; count: string }[] = [
    { key: "subject", href: "#subjects", accent: "var(--accent-primary)", count: t("hub.modeCount.subject", { count: articleCount, subjects: groups.length }) },
    { key: "path", href: "/study-guides", accent: "var(--color-warning)", count: t("hub.modeCount.path", { count: READING_PATHS.length }) },
    { key: "certification", href: "/certifications", accent: "var(--color-success)", count: t("hub.modeCount.certification", { count: studyGuides.length, objectives: totalObjectives }) },
    { key: "platform", href: "/vendor-hubs", accent: "var(--accent-secondary)", count: t("hub.modeCount.platform", { count: VENDOR_FAMILIES.length }) },
    { key: "lookup", href: "/glossary", accent: "var(--accent-amber)", count: t("hub.modeCount.lookup", { count: GLOSSARY.length }) },
  ];
  // THE CONTEXTUAL AREAS (SCOUT L6, L7): around Learn, lower and quieter.
  const around: { key: string; href: string; count: string }[] = [
    { key: "practice", href: "/practice", count: t("portalPracticeCount", { count: practiceCount }) },
    { key: "roles", href: "/roles", count: t("portalRolesCount", { count: ROLES.length }) },
    { key: "people", href: "/people", count: t("portalPeopleCount", { count: peopleCount }) },
    { key: "industry", href: "/industry", count: t("portalCompanies", { count: partnerVendors.length }) },
    { key: "learning", href: "/industry/learning", count: t("portalLearningCount", { count: trainingPartnerCount }) },
    { key: "tools", href: "/tools", count: "" },
  ];

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede learn-hero-lede">{t("lede")}</p>
            {/* The scoped search field (wave 0, 2026-10-05; SCOUT L17): opens the one dialog inside the Understand world. */}
            <HubSearch scope="understand" label={t("hubSearch.label")} placeholder={t("hubSearch.placeholder")} examplesLabel={t("hubSearch.examples")} examples={["BGP", "TLS 1.3", "SASE", "NSE 4", "802.1X", "OUI"]} />

            {/* GUIDED | DIRECTORY: the switch between the two readings of this page (decision 6). */}
            <HubViewSwitch targetId="main" storageKey="ronutz:hub:learn" legend={t("hub.switchLegend")} guidedLabel={t("hub.switchGuided")} directoryLabel={t("hub.switchDirectory")} />

            {/* ---- THE GUIDED LAYER: hidden in the directory reading. ---- */}
            <div className="hub-guided">
              {/* 1. The five learning modes: the first choices are learner intentions, not content structures (L3, L4). */}
              <h2 className="section-title hub-h2">{t("hub.modesTitle")}</h2>
              <ul className="intent-grid intent-grid--hub">
                {modes.map((m) => (
                  <li key={m.key} className="intent" style={{ "--intent-accent": m.accent } as CSSProperties}>
                    {m.href.startsWith("#") ? (
                      <a href={m.href} className="intent-link">
                        <span className="intent-q">{t(`hub.mode.${m.key}.q`)}</span>
                        <span className="intent-label">{t(`hub.mode.${m.key}.label`)} <span aria-hidden="true">&#8595;</span></span>
                        <span className="intent-verb mono">{t(`hub.mode.${m.key}.verb`)} · {m.count}</span>
                      </a>
                    ) : (
                      <Link href={m.href} className="intent-link">
                        <span className="intent-q">{t(`hub.mode.${m.key}.q`)}</span>
                        <span className="intent-label">{t(`hub.mode.${m.key}.label`)} <span aria-hidden="true">&#8594;</span></span>
                        <span className="intent-verb mono">{t(`hub.mode.${m.key}.verb`)} · {m.count}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {/* 2. Browse by subject (L8, L18): the category browser as a major section, one card per subject with its
                  count, each card the door to the subject's own page and to its block in the directory below. */}
              <div className="hub-subjects" id="subjects">
                <h2 className="section-title hub-h2">{t("hub.subjectsTitle")}</h2>
                <p className="hub-lede">{t("hub.subjectsLede", { count: articleCount, subjects: groups.length })}</p>
                <ul className="hub-subject-grid">
                  {groups.map((group) => (
                    <li key={group.category} className="hub-subject" style={{ "--chip-color": categoryColor(group.category) } as CSSProperties}>
                      <Link href={`/category/${group.category}`} className="hub-subject-link">
                        <span className="category-dot" aria-hidden="true" />
                        <span className="hub-subject-name">{tTools(`categories.${group.category}`)}</span>
                        <span className="hub-subject-count mono">{t("hub.subjectCount", { count: group.articles.length })}</span>
                      </Link>
                      {/* L33c: the subject's first article (the index's own order) as the card's representative. */}
                      {group.articles[0] && <Link href={`/learn/${group.articles[0].slug}`} className="hub-subject-first">{group.articles[0].title}</Link>}
                      <a href={`#${group.category}`} className="hub-subject-index">{t("hub.subjectInIndex")} <span aria-hidden="true">&#8595;</span></a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2b. New and revised (L33a) beside Most read (L33b): what moved lately and what is read most, two
                  short columns in the home's "happening" idiom. Most read renders nothing until the anonymous
                  stats answer, and nothing at all when they are absent. */}
              <div className="hub-fresh">
                <div className="happening-col hub-fresh-col">
                  <h3 className="happening-title">{t("hub.freshTitle")}</h3>
                  <ol className="happening-list">
                    {recentArticles.map((a) => (
                      <li key={a.slug} className="happening-item">
                        <span className={`happening-kind ${a.isNew ? "happening-kind--tool" : "happening-kind--article"}`}>{a.isNew ? t("hub.freshNew") : t("hub.freshRevised")}</span>
                        <Link href={`/learn/${a.slug}`} className="happening-link">{a.title}</Link>
                        <time className="hub-fresh-date mono" dateTime={a.updated}>{dateFmt.format(new Date(`${a.updated}T12:00:00Z`))}</time>
                      </li>
                    ))}
                  </ol>
                </div>
                <MessageSlice namespaces={["home.front"]}><HomePopular kinds={["article"]} title={t("hub.popularTitle")} className="hub-fresh-col" /></MessageSlice>
              </div>

              {/* 2c. New here? (L33d): three starting points, each an existing path. */}
              <div className="hub-start">
                <h2 className="section-title hub-h2">{t("hub.startTitle")}</h2>
                <ul className="hub-around-list">
                  {(["fundamentals", "exam", "problem"] as const).map((k) => (
                    <li key={k} className="hub-around-item">
                      <Link href={k === "fundamentals" ? "/category/networking" : k === "exam" ? "/certifications" : "/practice"} className="hub-around-link">{t(`hub.start.${k}.label`)}</Link>
                      <span className="hub-around-lede">{t(`hub.start.${k}.lede`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Stories as editorial discovery (L5): three threads, the rest one link away. */}
              <div className="hub-stories">
                <h2 className="section-title hub-h2">{tStories("navLabel")}</h2>
                <p className="hub-lede">{tStories("lede")}</p>
                <ul className="hub-story-list">
                  {featuredStories.map((a) => (
                    <li key={a.slug} className="hub-story">
                      <Link href={`/learn/${a.slug}`} className="hub-story-link">
                        <span className="hub-story-title">{a.title}</span>
                        <span className="hub-story-summary">{a.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="hub-more"><Link href="/stories">{t("hub.storiesBrowse", { count: STORY_SLUGS.length })} <span aria-hidden="true">&#8594;</span></Link></p>
              </div>

              {/* 4. Around Learn (L6, L7): the contextual areas, demoted from the peer cards, not removed. */}
              <div className="hub-around">
                <h2 className="section-title hub-h2">{t("hub.aroundTitle")}</h2>
                <ul className="hub-around-list">
                  {around.map((a) => (
                    <li key={a.key} className="hub-around-item">
                      <Link href={a.href} className="hub-around-link">{t(`hub.around.${a.key}.label`)} <span aria-hidden="true">&#8594;</span></Link>
                      <span className="hub-around-lede">{t(`hub.around.${a.key}.lede`)}</span>
                      {a.count && <span className="hub-around-count mono">{a.count}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ---- THE DIRECTORY: the complete article index, explicitly named and counted (L9, L28). ---- */}
            <div className="hub-directory-head" id="directory">
              <h2 className="section-title hub-h2">{t("hub.directoryTitle")}</h2>
              {/* The scope stated with the number (SCOUT's adoption audit, 2026-10-06, rows 4 and 22): this index holds the
                  vendor-neutral articles; the ones about a single vendor's platform are counted beside them, from the same
                  corpus split getArticlesByCategory applies, with the door to the hubs that gather them. */}
              <p className="hub-lede">
                {t.rich("hub.directoryLede", {
                  count: articleCount,
                  subjects: groups.length,
                  platform: getSiteCounts(locale).articlesPlatform,
                  hubs: (chunks) => <Link href="/vendor-hubs">{chunks}</Link>,
                })}
              </p>
            </div>

            {/* Sticky nav-utility bar (PRIME 2026-07-09): jump-to + show-only +
                view density in one strip that sticks below the site header on
                scroll. Contained (already inside the article container). The bar
                always renders (view toggle is always available); the jump-nav and
                filter appear only when there is more than one category. Both start
                collapsed. */}
            <div className="nav-utility-bar nav-utility-bar--contained">
              <div className="nav-utility-inner">
                {groups.length > 1 && (
                  <details className="jumpnav">
                    <summary className="jumpnav-summary" aria-label={tTools("jumpTo")}>
                      <span className="jumpnav-chevron" aria-hidden="true">
                        &#9656;
                      </span>
                      {tTools("jumpTo")}
                    </summary>
                    <ul className="category-nav-list">
                      {groups.map((group) => (
                        <li key={group.category} data-jumpnav={group.category}>
                          <a href={`#${group.category}`} className="category-nav-link">
                            {tTools(`categories.${group.category}`)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="nav-utility-controls">
                  {groups.length > 1 && (
                    <CategoryFilter
                      legend={tTools("filterLegend")}
                      allLabel={tTools("filterAll")}
                      noneLabel={tTools("filterNone")}
                      emptyLabel={tTools("filterEmpty")}
                      moreLabel={tTools("filterMore")}
                      fewerLabel={tTools("filterFewer")}
                      groups={groups.map((group) => ({
                        key: group.category,
                        sectionId: group.category,
                        label: tTools(`categories.${group.category}`),
                        color: categoryColor(group.category),
                      }))}
                    />
                  )}
                  <ViewToggle
                    targetId="main"
                    storageKey="ronutz:view:learn"
                    legend={tTools("viewLegend")}
                    cardsLabel={tTools("viewCards")}
                    listLabel={tTools("viewList")}
                  />
                </div>
              </div>
            </div>

            {/* Jump target for the articles card at the top of the page: the
                article index is what this page is for, and nothing pointed at
                it. Self-closing anchor rather than a wrapper - no closing tag
                to misplace - with the offset that clears the sticky header. */}
            <div id="articles" aria-hidden className="learn-articles-anchor" />

            {/* One block per category, mirroring the tools index taxonomy. */}
            {groups.map((group) => (
              <section className="category-section" id={group.category} key={group.category} style={{ marginBottom: "2.5rem" }}>
                <h2 className="tools-category">
                  <span
                    className="category-dot"
                    style={{ "--chip-color": categoryColor(group.category) } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  <Link href={`/category/${group.category}`} className="tools-category-link">
                    {tTools(`categories.${group.category}`)}
                  </Link>{" "}
                  <span className="category-count">({group.articles.length})</span>
                </h2>
                <ul className="learn-grid">
                  {group.articles.map((a) => (
                    <li key={a.slug} className="learn-grid-item" data-vendors={getArticleVendors(a).join(" ")}>
                      <Link href={`/learn/${a.slug}`} className="learn-card">
                        <h3 className="learn-card-title">{a.title}</h3>
                        <p className="learn-card-summary">{a.summary}</p>
                        <span className="family-chip-row">
                          {articleCategories(a).map((cat) => (
                            <FamilyChip key={cat} category={cat} label={tTools(`categories.${cat}`)} />
                          ))}
                        </span>
                        {/* L30: the tools the article names, two at most, as quiet text (the card is one link). */}
                        {a.relatedTools.filter((id) => toolName(id)).length > 0 && (
                          <span className="learn-card-tools">{t("hub.rowTools")} {a.relatedTools.filter((id) => toolName(id)).slice(0, 2).map((id) => toolName(id)).join(" · ")}</span>
                        )}
                        <span className="learn-card-cta">{t("read")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* LIST VIEW — same articles in catalogue anatomy (admin-table
                    vocabulary); summary rides the wide notes-style column. */}
                <div className="admin-table-wrap pubcat">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{t("listHead.article")}</th>
                        <th>{t("listHead.topic")}</th>
                        <th>{t("listHead.summary")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.articles.map((a) => (
                        <tr key={a.slug} data-vendors={getArticleVendors(a).join(" ")}>
                          <td>
                            <Link href={`/learn/${a.slug}`} className="pubcat-toollink">
                              <span className="admin-name">{a.title}</span>
                            </Link>
                          </td>
                          <td className="admin-status-cell">
                            <span className="admin-badges">
                              {articleCategories(a).map((cat) => (
                                <FamilyChip key={cat} category={cat} label={tTools(`categories.${cat}`)} />
                              ))}
                            </span>
                          </td>
                          <td className="admin-note">{a.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />

      <ScrollToTop label={tTools("backToTop")} />
    </>
  );
}
