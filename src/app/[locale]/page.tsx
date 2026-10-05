// ============================================================================
// src/app/[locale]/page.tsx
// ----------------------------------------------------------------------------
// THE HOME PAGE: the front door of a practitioner's workbench for an entire
// field (rebuilt 2026-10-05 on the external review of 2026-10-04 and PRIME's
// decisions, REVIEW-chatgpt-home-page-and-learn-hub-20261004 in the canon).
//
// WHAT CHANGED, AND WHY. The previous page (2026-08-06 to 2026-10-04) opened
// as "the Day-1 authority surface + the first live tool" and then accreted:
// career strip, roles strip, taught platforms, a 21-card map, a privacy
// section, and the live tool last. It asked the visitor to admire the size of
// the site before experiencing it. The order is now the one the design brief
// always intended, promise → experience → explanation → evidence:
//
//   1. Hero: the broader thesis (a workbench, not only a toolbox), the search
//      field as the first interaction, three counts (utility · knowledge ·
//      history).
//   2. Start here: five intents and "surprise me", not a taxonomy.
//   3. Try something now: the compact CIDR check with the privacy sentence
//      beside the data it protects.
//   4. Browse by platform: the vendor hubs, kept apart from the platforms the
//      author teaches (that distinction is a guard, check-authorization-claims;
//      a whole section separates the strip from the Training card).
//   5. What's happening: new (from the changelog, generated), most read this
//      week (the site's own anonymous stats, client-fetched), a rabbit hole.
//   6. Work with me: Training, Advisory, Speaking, with their verbs.
//   7. Why trust this: four kinds of trust in one strip, the one-sentence
//      credibility line and four proof links; the career and role strips
//      live on /about and /industry/chapters, one click away.
//   8. Continue where you left off: local-only, shown only when there is one.
//   9. Everything on ronutz: the complete directory, grouped into five worlds,
//      compact, late, for the reader who already understands the place.
//
// EVERY NUMBER IS COUNTED FROM THE THING ITSELF at build time (D-63); nothing
// here is typed. Client islands: the omnibox, the quick CIDR, the popular list,
// the rabbit hole, the continue module, the count-up band. The rest is static.
// Superseded message keys (hero.*, credibility.*, pillars.*, map.* ledes,
// privacy.*, toolPreview.*) stay in the packs; the labels under map.* are
// reused by the directory so nothing is retranslated.
// ============================================================================

import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import MessageSlice from "@/components/MessageSlice";
import { ogImages } from "@/lib/og";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import HomeStats from "@/components/HomeStats";
import HomeOmnibox from "@/components/HomeOmnibox";
import HomeQuickCidr from "@/components/HomeQuickCidr";
import HomePopular from "@/components/HomePopular";
import HomeContinue from "@/components/HomeContinue";
import HomeSurpriseIntent from "@/components/HomeSurpriseIntent";
import HomeRabbitHole from "@/components/HomeRabbitHole";
import VendorMark from "@/components/VendorMark";
import { STORY_SLUGS } from "@/content/learn/stories";
import { CAREER_VENDORS } from "@/content/vendors/career";
import { partnerVendors } from "@/content/vendors/partners";
import { getPracticeArticles } from "@/lib/practice";
import { studyGuides } from "@/content/certifications/study-guides";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getAllArticles } from "@/lib/learn";
import { ROLES } from "@/lib/roles";
import { VENDOR_FAMILIES, vendorColor } from "@/config/vendors";
import { GLOSSARY } from "@/content/glossary/glossary";
import { PLATFORMS, COURSE_COUNT } from "@/content/training/courses";
import { WORLDS } from "@/config/worlds";
import { CHANGELOG, type ChangelogEntry } from "@/content/changelog/changelog";
import { TESTIMONIALS } from "@/content/testimonials/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  // The title and description of the new front door (PRIME's decision 4 of 05/10); the OG card keeps the page's own alt.
  return {
    title: t("front.metaTitle"),
    description: t("front.metaDescription"),
    ...ogImages("page", "home", locale, t("front.title")),
  };
}

/** The latest changelog entry of a kind set, for "New"; newest first is the file's own order.
 *  `withArticle` asks for an entry that names an article; `except` keeps one card from repeating another's entry. */
function latest(kinds: ChangelogEntry["kind"][], withArticle = false, except: (ChangelogEntry | undefined)[] = []): ChangelogEntry | undefined {
  return CHANGELOG.find((e) => kinds.includes(e.kind) && !except.includes(e) && (!withArticle || (e.articles && e.articles.length > 0)));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  // Next.js 15: route params are async. Await before use.
  const { locale } = await params;
  // Enable static rendering for this locale (App Router requirement).
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const tTools = await getTranslations("tools");
  // The era caption for the Red Education mark on the Training card.
  const tMarks = await getTranslations("partnerVendors");

  // THE COUNTS, from the registries the pages render from (D-63).
  const toolCount = CATALOGUE.filter((tool) => tool.status === "live").length;
  const articleCount = getAllArticles().length;
  const industryCount = partnerVendors.length;
  const practiceCount = getPracticeArticles(locale).length;
  const guideCount = studyGuides.length;
  const hubCount = VENDOR_FAMILIES.length;
  const glossaryCount = GLOSSARY.length;
  const careerCount = CAREER_VENDORS.length;
  const roleCount = ROLES.length;
  const platformCount = PLATFORMS.length;
  const endorsementCount = TESTIMONIALS.length;
  const storyCount = STORY_SLUGS.length;

  // RECENTLY SHIPPED: the newest tool, the newest article, the newest improvement, read from the changelog.
  const newTool = latest(["tool"]);
  const newArticle = latest(["content", "tool", "feature"], true);
  // The improvement: the newest feature, infrastructure or localisation entry that is neither of the two above.
  const newImprovement = latest(["feature", "infra", "i18n"], false, [newTool, newArticle]);
  // The link each card carries: the tool or article it names; an improvement always opens the changelog, where its entry is read in full.
  const shipped = [
    newTool && { key: "tool", entry: newTool, href: newTool.tools?.[0] ? `/tools/${newTool.tools[0]}` : "/changelog" },
    newArticle && { key: "article", entry: newArticle, href: newArticle.articles?.[0] ? `/learn/${newArticle.articles[0]}` : "/changelog" },
    newImprovement && { key: "improvement", entry: newImprovement, href: "/changelog" },
  ].filter(Boolean) as { key: string; entry: ChangelogEntry; href: string }[];

  // THE FIVE INTENTS of "Start here": a question, a destination, a verb.
  const intents: { key: string; href: string; accent: string }[] = [
    { key: "tools", href: "/tools", accent: "var(--accent-primary)" },
    { key: "learn", href: "/learn", accent: "var(--color-warning)" },
    { key: "industry", href: "/industry", accent: "var(--color-success)" },
    { key: "training", href: "/training", accent: "var(--redu-brand)" },
    { key: "advisory", href: "/advisory", accent: "var(--accent-amber)" },
  ];

  // THE FIVE WORLDS of the directory, from the shared registry (src/config/worlds.ts, wave 0: the footer, the human
  // sitemap and the search's scope draw the same five). Each item keeps its map.* label; a count is attached by href
  // where one is counted, in the words the home has always used.
  const counts: Record<string, string> = {
    "/tools": t("map.toolsBadge", { count: toolCount }),
    "/learn": t("map.learnBadge", { count: articleCount }),
    "/stories": t("map.storiesBadge", { count: storyCount }),
    "/study-guides": t("map.guidesBadge", { count: guideCount }),
    "/certifications": t("map.certsBadge", { count: guideCount }),
    "/glossary": t("map.glossaryBadge", { count: glossaryCount }),
    "/practice": t("map.practiceBadge", { count: practiceCount }),
    "/industry": t("map.industryBadge", { count: industryCount }),
    "/vendor-hubs": t("map.hubsBadge", { count: hubCount }),
    "/roles": t("map.rolesBadge", { count: roleCount }),
    "/industry/chapters": t("map.careerBadge", { count: careerCount }),
    "/training": t("map.trainingBadge", { count: COURSE_COUNT, vendors: platformCount }),
    "/endorsements": t("front.endorsementsBadge", { count: endorsementCount }),
  };
  const worlds: { key: string; items: { label: string; href: string; count?: string }[] }[] = WORLDS.map((w) => ({
    key: w.key,
    items: w.items.map((it) => ({ label: t(it.label), href: it.href, count: counts[it.href] })),
  }));

  return (
    <>
      {/* Keyboard skip link — first focusable element. */}
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>

      <Header />

      <main id="main">
        {/* --- 1. HERO: the thesis, the search, the counts --- */}
        <section className="hero front-hero">
          <div className="container">
            <p className="hero-eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="page-hero-title front-title">{t("front.title")}</h1>
            <p className="page-hero-lede front-lede">{t("front.lede")}</p>
            {/* The closing line, PRIME's decision 1 of 05/10: the packet and the people behind it. */}
            <p className="front-tag">{t("front.tag")}</p>
            <MessageSlice namespaces={["home.front"]}><HomeOmnibox /></MessageSlice>
          </div>
        </section>

        {/* --- The three counts: utility · knowledge · history (count-up on scroll, D-63) --- */}
        <MessageSlice namespaces={["home"]}><HomeStats tools={toolCount} articles={articleCount} companies={industryCount} /></MessageSlice>

        {/* --- 2. START HERE: intents, not taxonomy --- */}
        <section className="section" id="start">
          <div className="container">
            <h2 className="section-title">{t("front.startTitle")}</h2>
            <ul className="intent-grid">
              {intents.map((i) => (
                <li key={i.key} className="intent" style={{ "--intent-accent": i.accent } as CSSProperties}>
                  <Link href={i.href} className="intent-link">
                    <span className="intent-q">{t(`front.intent.${i.key}.q`)}</span>
                    <span className="intent-label">{t(`front.intent.${i.key}.label`)} <span aria-hidden="true">&#8594;</span></span>
                    <span className="intent-verb mono">{t(`front.intent.${i.key}.verb`)}</span>
                  </Link>
                </li>
              ))}
              {/* The sixth: not an intent, a door to the "Take me somewhere" column below. Neutral grey, the colour of
                  "not yet decided" (never the fuchsia WebAssembly mark, reserved for that one meaning site-wide). A click
                  asks the column for a draw and goes there, so the reader lands on a destination already named and chooses
                  (PRIME 03:10, 11:03, 11:35). Without JavaScript it is the plain anchor. */}
              <li className="intent intent--surprise" style={{ "--intent-accent": "var(--color-neutral)" } as CSSProperties}>
                <HomeSurpriseIntent q={t("front.intent.surprise.q")} label={t("front.intent.surprise.label")} verb={t("front.intent.surprise.verb")} />
              </li>
            </ul>
          </div>
        </section>

        {/* --- 3. TRY SOMETHING NOW: the compact CIDR check with privacy beside it --- */}
        <section className="section section-accent" id="cidr">
          <div className="container section-narrow">
            <h2 className="section-title">{t("front.tryTitle")}</h2>
            <p className="section-body">{t("front.tryBody")}</p>
            <MessageSlice namespaces={["home.front"]}><HomeQuickCidr /></MessageSlice>
          </div>
        </section>

        {/* --- 4. BROWSE BY PLATFORM: the hubs, apart from the platforms taught. Placed BEFORE "What's happening" so a whole
            section separates the hub names from the Training card's teaching vocabulary (check-authorization-claims, kept
            in the rendered order as well as in the message packs). --- */}
        <section className="section" id="platforms">
          <div className="container">
            <h2 className="section-title">{t("front.platformsTitle")}</h2>
            <p className="section-body">{t("front.platformsBody")}</p>
            <ul className="platform-strip">
              {VENDOR_FAMILIES.map((v) => (
                <li key={v.key}>
                  <Link href={`/${v.key}`} className="platform-link" style={{ "--chip-color": vendorColor(v.key) } as CSSProperties}>
                    <span className="family-chip-dot" aria-hidden="true" />
                    {tTools(`vendors.${v.key}`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/vendor-hubs" className="platform-link platform-link--all">{t("front.platformsAll")} <span aria-hidden="true">&#8594;</span></Link>
              </li>
            </ul>
          </div>
        </section>

        {/* --- 5. WHAT'S HAPPENING: new, popular, unexpected --- */}
        <section className="section section-accent" id="happening">
          <div className="container">
            <h2 className="section-title">{t("front.happeningTitle")}</h2>
            <div className="happening-grid">
              {/* New: generated from the changelog, no editorial maintenance. */}
              <div className="happening-col">
                <h3 className="happening-title">{t("front.newTitle")}</h3>
                <ol className="happening-list">
                  {shipped.map((s) => (
                    <li key={s.key} className="happening-item">
                      <span className={`happening-kind happening-kind--${s.key}`}>{t(`front.shipped.${s.key}`)}</span>
                      <Link href={s.href} className="happening-link">{s.entry.title}</Link>
                      <span className="happening-date mono">{s.entry.date}</span>
                    </li>
                  ))}
                </ol>
                <p className="happening-note"><Link href="/changelog">{t("front.changelogLink")} <span aria-hidden="true">&#8594;</span></Link></p>
              </div>
              {/* Popular: the site's own anonymous stats, after load; renders nothing when there is nothing to say. */}
              <MessageSlice namespaces={["home.front"]}><HomePopular /></MessageSlice>
              {/* Unexpected: one random thing from the whole corpus, on request; the reader chooses to open it or draw again. */}
              <div className="happening-col happening-col--surprise" id="surprise">
                <h3 className="happening-title">{t("front.surpriseTitle")}</h3>
                <p className="happening-lede">{t("front.surpriseLede")}</p>
                <MessageSlice namespaces={["home.front"]}><HomeRabbitHole /></MessageSlice>
                {/* From the archive: the oldest thing here, humanising the site more than a bio paragraph would. */}
                <p className="happening-note happening-archive">
                  {t("front.archiveLine")} <Link href="/tools/bits-bytes">{t("front.archiveTool")}</Link> · <Link href="/about/earlier-sites/nutzmann-net-2004">{t("front.archiveClone")}</Link> · <Link href="/about/earlier-sites">{t("front.archiveSites")}</Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 6. WORK WITH ME: three ways, three verbs --- */}
        <section className="section" id="work">
          <div className="container">
            <h2 className="section-title">{t("front.workTitle")}</h2>
            <p className="section-body">{t("front.workBody")}</p>
            <div className="work-grid">
              <article className="work-card work-card--training">
                <p className="work-verb">{t("front.work.trainingVerb")}</p>
                <h3 className="work-title"><Link href="/training">{t("front.work.trainingTitle")}</Link></h3>
                <p className="work-body">{t("front.work.trainingBody")}</p>
                {/* The four platforms taught, by name, where the Training card is: never beside the hubs above. */}
                <p className="work-platforms mono">F5 · Fortinet · Extreme Networks · Netskope</p>
                {/* A div, not a <p>: the mark renders a <figure>, which a paragraph cannot contain (the parser would close
                    the paragraph early and the hydrated tree would not match the server's). */}
                <div className="work-via">
                  <Link href="/red-education" className="work-via-link">
                    <VendorMark vendor="rededucation" year={new Date().getFullYear()} eraLabel={(e) => tMarks("markEra", { era: e })} since={(y) => tMarks("markSince", { year: y })} compact />
                    <span className="work-via-text">{t("front.work.trainingVia")}</span>
                  </Link>
                </div>
                <Link href="/training" className="page-jump-link">{t("front.work.trainingCta")} <span aria-hidden="true">&#8594;</span></Link>
              </article>
              <article className="work-card work-card--advisory">
                <p className="work-verb">{t("front.work.advisoryVerb")}</p>
                <h3 className="work-title"><Link href="/advisory">{t("front.work.advisoryTitle")}</Link></h3>
                <p className="work-body">{t("front.work.advisoryBody")}</p>
                <Link href="/advisory" className="page-jump-link">{t("front.work.advisoryCta")} <span aria-hidden="true">&#8594;</span></Link>
              </article>
              <article className="work-card work-card--speaking">
                <p className="work-verb">{t("front.work.speakingVerb")}</p>
                <h3 className="work-title"><Link href="/speaking">{t("front.work.speakingTitle")}</Link></h3>
                <p className="work-body">{t("front.work.speakingBody")}</p>
                <Link href="/speaking" className="page-jump-link">{t("front.work.speakingCta")} <span aria-hidden="true">&#8594;</span></Link>
              </article>
            </div>
          </div>
        </section>

        {/* --- 7. WHY TRUST THIS: four kinds of trust, one sentence of biography, four proofs --- */}
        <section className="section section-accent" id="trust">
          <div className="container section-narrow">
            <h2 className="section-title">{t("front.trustTitle")}</h2>
            <ul className="trust-strip">
              <li className="trust-item">
                <Link href="/privacy" className="trust-link">
                  <span className="trust-head">{t("front.trust.local")}</span>
                  <span className="trust-body">{t("front.trust.localBody")}</span>
                </Link>
              </li>
              <li className="trust-item">
                <Link href="/colophon#principles" className="trust-link">
                  <span className="trust-head">{t("front.trust.sourced")}</span>
                  <span className="trust-body">{t("front.trust.sourcedBody")}</span>
                </Link>
              </li>
              <li className="trust-item">
                <a href="https://github.com/ronutz/arsenal" className="trust-link" target="_blank" rel="noopener noreferrer">
                  <span className="trust-head">{t("front.trust.open")}</span>
                  <span className="trust-body">{t("front.trust.openBody")}</span>
                </a>
              </li>
              <li className="trust-item">
                <Link href="/about" className="trust-link">
                  <span className="trust-head">{t("front.trust.named")}</span>
                  <span className="trust-body">{t("front.trust.namedBody")}</span>
                </Link>
              </li>
            </ul>
            {/* The one sentence of biography and the four proofs; the strips themselves live on /about and /industry/chapters. */}
            <p className="section-body trust-bio">{t("front.builtBy")}</p>
            <ul className="trust-proofs">
              <li><Link href="/industry/chapters">{t("map.career")} <span aria-hidden="true">&#8594;</span></Link></li>
              <li><Link href="/about/credentials">{t("front.proofCredentials")} <span aria-hidden="true">&#8594;</span></Link></li>
              <li><Link href="/endorsements">{t("front.proofEndorsements", { count: endorsementCount })} <span aria-hidden="true">&#8594;</span></Link></li>
              <li><Link href="/colophon">{t("front.proofColophon")} <span aria-hidden="true">&#8594;</span></Link></li>
            </ul>
            <p className="trust-public mono">
              <a href="https://github.com/ronutz/arsenal" target="_blank" rel="noopener noreferrer">{t("front.publicSource")}</a> · <Link href="/changelog">{t("front.publicChangelog")}</Link> · <Link href="/roadmap">{t("front.publicRoadmap")}</Link>
            </p>
          </div>
        </section>

        {/* --- 8. CONTINUE WHERE YOU LEFT OFF: local only, shown only when there is one --- */}
        <MessageSlice namespaces={["home.front"]}><HomeContinue /></MessageSlice>

        {/* --- 9. EVERYTHING ON RONUTZ: the complete directory, five worlds, compact and late --- */}
        <section className="section" id="everything">
          <div className="container">
            <h2 className="section-title">{t("front.everythingTitle")}</h2>
            <p className="section-body">{t("front.everythingBody")}</p>
            <div className="worlds">
              {worlds.map((w) => (
                <div key={w.key} className={`world world--${w.key}`}>
                  <h3 className="world-title">{t(`front.world.${w.key}`)}</h3>
                  <p className="world-verb mono">{t(`front.worldVerb.${w.key}`)}</p>
                  <ul className="world-list">
                    {w.items.map((it) => (
                      <li key={it.href}>
                        <Link href={it.href} className="world-link">{it.label}</Link>
                        {it.count && <span className="world-count mono">{it.count}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER (shared component; single source of truth) --- */}
      <SiteFooter />
    </>
  );
}
