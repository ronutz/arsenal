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
// The article series (LS-0, 2026-10-06), for their door among the areas around Learn.
import { LEARN_SERIES } from "@/content/learn/series";
import { ogImages } from "@/lib/og";
// One bounded description for the meta, og and twitter fields (src/lib/metaDescription.ts).
import { withDescription } from "@/lib/metaDescription";
import { getArticle, getArticlesByCategory, getArticleVendors } from "@/lib/learn";
import type { CSSProperties } from "react";
import { GLOSSARY } from "@/content/glossary/glossary";
import { partnerVendors } from "@/content/vendors/partners";
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import { studyGuides, objectiveCount } from "@/content/certifications/study-guides";
// The open course material (milestone (m2), 2026-10-06): its count and its slides for the sixth way to learn.
import { MATERIALS } from "@/content/materials/materials";
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
// The "Interactive" marker (PRIME, 2026-10-26 15:20): which articles embed a lab, read from their bodies.
import { labIdsIn } from "@/content/learn/labs";
import { interactiveArticles } from "@/lib/learnLabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learn" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts), with the page's own one-sentence description merged
  // into it (PRIME 2026-10-26: this page had inherited the site tagline as its meta, og and twitter description).
  return { title: alt, ...withDescription(t("metaDescription"), ogImages("page", "learn", locale, alt), "learn") };
}

export default async function LearnIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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
  // THE SIX LEARNING MODES (SCOUT L4; the sixth, the open course, since (m2)): a question, a destination, a verb, a count
  // where one is counted.
  const modes: { key: string; href: string; accent: string; count: string }[] = [
    { key: "subject", href: "#subjects", accent: "var(--accent-primary)", count: t("hub.modeCount.subject", { count: articleCount, subjects: groups.length }) },
    { key: "path", href: "/study-guides", accent: "var(--color-warning)", count: t("hub.modeCount.path", { count: READING_PATHS.length }) },
    { key: "certification", href: "/certifications", accent: "var(--color-success)", count: t("hub.modeCount.certification", { count: studyGuides.length, objectives: totalObjectives }) },
    // Orange (27/10/2026): the platform mode named the then-undefined --accent-secondary; amber is already the path's and the lookup's.
    { key: "platform", href: "/vendor-hubs", accent: "var(--color-orange)", count: t("hub.modeCount.platform", { count: VENDOR_FAMILIES.length }) },
    { key: "lookup", href: "/glossary", accent: "var(--accent-amber)", count: t("hub.modeCount.lookup", { count: GLOSSARY.length }) },
    // The sixth (milestone (m2); PRIME 2026-10-06 19:21: the doors to /materials "more easily findable, in the Learn ...
    // sections"): a whole course, slides and notes, to present in the browser or download.
    { key: "course", href: "/materials", accent: "var(--color-info)", count: t("hub.modeCount.course", { count: MATERIALS.length, slides: MATERIALS.reduce((n, m) => n + m.slides, 0) }) },
  ];
  // THE INTERACTIVE ARTICLES (2026-10-26): every article, vendor ones included, whose body embeds a lab, so a learner
  // finds every lab from here even though the directory below lists only the vendor-neutral articles.
  // LAID OUT AS LABS (PRIME 2026-10-27 11:07: the flat list of titles, each with the same badge, read as "a bunch of
  // text"): one card per lab, named by what the reader does in it, with the article it lives in under that, grouped by
  // the article's subject in the subject browser's own labels and colours, groups A->Z and labs A->Z inside each.
  const tLabs = await getTranslations("learnLabs");
  // One entry per lab and article (a lab embedded in two articles gets a card in each, saying which).
  const labEntries = interactiveArticles(locale).flatMap((a) =>
    a.labs.map((id) => ({ id, slug: a.slug, category: a.category, title: tLabs(`${id}.title`), article: a.title })),
  );
  // The subjects that have at least one lab, sorted by their resolved label like the subject browser.
  const labGroups = [...new Set(labEntries.map((e) => e.category))]
    .sort((a, b) => tTools(`categories.${a}`).localeCompare(tTools(`categories.${b}`), locale))
    .map((category) => ({
      category, // the subject key (also its colour)
      labs: labEntries.filter((e) => e.category === category).sort((a, b) => a.title.localeCompare(b.title, locale)), // its labs
    }));
  // THE CONTEXTUAL AREAS (SCOUT L6, L7): around Learn, lower and quieter.
  const around: { key: string; href: string; count: string }[] = [
    // The article series first among the areas around Learn (LS-0): subjects told in order, opener first.
    { key: "series", href: "/learn/series", count: t("portalSeriesCount", { count: LEARN_SERIES.length }) },
    { key: "practice", href: "/practice", count: t("portalPracticeCount", { count: practiceCount }) },
    { key: "roles", href: "/roles", count: t("portalRolesCount", { count: ROLES.length }) },
    { key: "people", href: "/people", count: t("portalPeopleCount", { count: peopleCount }) },
    { key: "industry", href: "/industry", count: t("portalCompanies", { count: partnerVendors.length }) },
    { key: "learning", href: "/industry/learning", count: t("portalLearningCount", { count: trainingPartnerCount }) },
    { key: "tools", href: "/tools", count: "" },
  ];

  return (
    <>
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
                  count, each card the door to the subject's own page and to its block in the directory below.
                  LAID OUT 2026-10-27 (PRIME's UX rule of 11:07, finding L1): the count beside the name forced the name to
                  wrap and the first article read as an unlabelled sentence. Now the name stands alone on the first line
                  and its link covers the card (the CSS stretches it); the count is a quiet second line that is also the
                  jump to the subject's block below (the arrow the lede names, once per card instead of an "In the
                  index" link on every card); the first article in reading order closes the card under a "Start with"
                  label. The two smaller links sit above the stretched one, so each stays its own target. */}
              <div className="hub-subjects" id="subjects">
                <h2 className="section-title hub-h2">{t("hub.subjectsTitle")}</h2>
                <p className="hub-lede">{t("hub.subjectsLede", { count: articleCount, subjects: groups.length })}</p>
                <ul className="hub-subject-grid">
                  {groups.map((group) => (
                    <li key={group.category} className="hub-subject" style={{ "--chip-color": categoryColor(group.category) } as CSSProperties}>
                      {/* The subject's name, its colour dot, the door to its page; the card's main target. */}
                      <Link href={`/category/${group.category}`} className="hub-subject-link">
                        <span className="category-dot" aria-hidden="true" />
                        <span className="hub-subject-name">{tTools(`categories.${group.category}`)}</span>
                      </Link>
                      {/* The count, and the jump to the subject's block in the index below (the lede's arrow). */}
                      <a href={`#${group.category}`} className="hub-subject-jump">
                        <span className="hub-subject-count mono">{t("hub.subjectCount", { count: group.articles.length })}</span> <span aria-hidden="true">&#8595;</span>
                      </a>
                      {/* L33c: the subject's first article in the index's reading order (curated `order`, then title),
                          labelled as what it is: where to start. */}
                      {group.articles[0] && (
                        <p className="hub-subject-start">
                          <span className="hub-subject-start-label">{t("hub.subjectStart")}</span>
                          <Link href={`/learn/${group.articles[0].slug}`} className="hub-subject-first">{group.articles[0].title}</Link>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2b. New and revised (L33a) beside Most read (L33b): what moved lately and what is read most, two
                  short columns in the home's "happening" idiom. Most read renders nothing until the anonymous
                  stats answer, and nothing at all when they are absent.
                  ROWS FIXED 2026-10-27 (finding L2): the badge, the title and the date shared one wrapping line, so the
                  date sat inline on one row and on its own line on the next. Every row is now two lines at any width:
                  the title (what to act on), then the badge and the date together (the context). */}
              <div className="hub-fresh">
                <div className="happening-col hub-fresh-col">
                  <h3 className="happening-title">{t("hub.freshTitle")}</h3>
                  <ol className="happening-list">
                    {recentArticles.map((a) => (
                      <li key={a.slug} className="happening-item hub-fresh-item">
                        {/* The primary line: the article. */}
                        <Link href={`/learn/${a.slug}`} className="happening-link">{a.title}</Link>
                        {/* The second line: new or revised, and when. */}
                        <span className="hub-fresh-meta">
                          <span className={`happening-kind ${a.isNew ? "happening-kind--tool" : "happening-kind--article"}`}>{a.isNew ? t("hub.freshNew") : t("hub.freshRevised")}</span>
                          <time className="hub-fresh-date mono" dateTime={a.updated}>{dateFmt.format(new Date(`${a.updated}T12:00:00Z`))}</time>
                        </span>
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
                  {/* The open course first (m2): a beginner's most complete start, from the routing concepts up. */}
                  {MATERIALS[0] && (
                    <li className="hub-around-item">
                      <Link href={`/materials/${MATERIALS[0].slug}`} className="hub-around-link">{t("hub.start.course.label")}</Link>
                      <span className="hub-around-lede">{t("hub.start.course.lede", { slides: MATERIALS[0].slides })}</span>
                    </li>
                  )}
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
              {/* Every article that carries an interactive lab (2026-10-26): the "Interactive" marker's own list. */}
              {labEntries.length > 0 && (
                <div className="hub-labs" id="interactive">
                  <h2 className="section-title hub-h2">{t("hub.labsTitle")}</h2>
                  <p className="hub-lede">{t("hub.labsLede")}</p>
                  <div className="hub-labs-groups">
                    {labGroups.map((g) => (
                      <section key={g.category} className="hub-labs-group" aria-labelledby={`labs-${g.category}`} style={{ "--chip-color": categoryColor(g.category) } as CSSProperties}>
                        {/* The subject: its colour dot, its name and how many labs it holds. */}
                        <h3 id={`labs-${g.category}`} className="hub-labs-group-title">
                          <span className="category-dot" aria-hidden="true" />
                          <span>{tTools(`categories.${g.category}`)}</span>
                          <span className="hub-labs-count mono">{g.labs.length}</span>
                        </h3>
                        <ul className="hub-labs-list">
                          {g.labs.map((l) => (
                            <li key={`${l.slug}-${l.id}`} className="hub-lab">
                              {/* The whole card is the link, straight to the lab inside its article. */}
                              <Link href={`/learn/${l.slug}#lab-${l.id}`} className="hub-lab-link">
                                <span className="hub-lab-title">{l.title}</span>
                                <span className="hub-lab-article">{t("hub.labsIn", { article: l.article })}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </div>
              )}
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
                {/* THE CARDS, laid out 2026-10-27 (PRIME's UX rule of 11:07, finding L4). Each card used to repeat the
                    chip of the subject its heading already names, end in a "Read" line, and run its summary to eight
                    lines, so the heights of neighbours differed wildly. Now: the li IS the card (no wrapper, fewer bytes
                    on a page near its weight ceiling); the title's link is stretched over the card by the CSS, so the
                    whole card is the target while the link's accessible name stays the title alone; the summary is
                    clamped to three lines by CSS with its full text still in the document (search and the List view
                    read it); the chips row keeps only what adds information (the other subjects an article's tools
                    belong to, and the "Interactive" marker) and is omitted when empty; the "Tools:" line stays. */}
                <ul className="learn-grid learn-grid--index">
                  {group.articles.map((a) => {
                    // The subjects beyond this group's own (the heading names it), from the tools the article relates to.
                    const otherSubjects = articleCategories(a).filter((cat) => cat !== group.category);
                    // Whether the article embeds a lab (the "Interactive" marker).
                    const hasLab = labIdsIn(a.body).length > 0;
                    // The live tools the article names, by id, in its own order.
                    const namedTools = a.relatedTools.filter((id) => toolName(id));
                    return (
                      <li key={a.slug} className="learn-grid-item learn-card" data-vendors={getArticleVendors(a).join(" ")}>
                        {/* The title, and the card's one link. */}
                        <h3 className="learn-card-title"><Link href={`/learn/${a.slug}`}>{a.title}</Link></h3>
                        {/* The summary, three lines on screen, whole in the document. */}
                        <p className="learn-card-summary">{a.summary}</p>
                        {/* Only the chips that tell the reader something the heading does not. */}
                        {(otherSubjects.length > 0 || hasLab) && (
                          <span className="family-chip-row">
                            {otherSubjects.map((cat) => (
                              <FamilyChip key={cat} category={cat} label={tTools(`categories.${cat}`)} />
                            ))}
                            {/* The "Interactive" marker: this article embeds a lab. */}
                            {hasLab && <span className="lab-badge">{t("interactive")}</span>}
                          </span>
                        )}
                        {/* L30: the tools the article names, two at most, as quiet text (the card is one link). */}
                        {namedTools.length > 0 && (
                          <span className="learn-card-tools">{t("hub.rowTools")} {namedTools.slice(0, 2).map((id) => toolName(id)).join(" · ")}</span>
                        )}
                      </li>
                    );
                  })}
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
                            {/* The "Interactive" marker in the list reading too. */}
                            {labIdsIn(a.body).length > 0 && <> <span className="lab-badge">{t("interactive")}</span></>}
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
