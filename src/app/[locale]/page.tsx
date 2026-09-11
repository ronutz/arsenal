// ============================================================================
// src/app/[locale]/page.tsx
// ----------------------------------------------------------------------------
// THE HOME PAGE — the Day-1 authority surface + the first live tool.
//
// STRUCTURE (the hero is a thesis, per the design brief): we open with the most
// characteristic thing in this subject's world — not a generic big-number
// template, but a clear statement of the product's reason to exist (privacy-
// first local compute) immediately backed by a tool the visitor can USE. The
// sections then establish credibility (since 1996), the four taught platforms,
// why local-first matters for security, and the live CIDR tool.
//
// All copy comes from the message pack (localized, English fallback). This is a
// server component; only the CIDR tool and the language switcher are client
// islands, so the page is fast and mostly static.
// ============================================================================

import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MessageSlice from "@/components/MessageSlice";
import { ogImages } from "@/lib/og";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import CidrTool from "@/components/CidrTool";
import ToolLearnPanel from "@/components/ToolLearnPanel";
import ToolProvenance from "@/components/ToolProvenance";
import { isEnabled } from "@/config/features";
import { provenanceFor } from "@/config/toolProvenance";
import ToolFunding from "@/components/ToolFunding";
import { fundingFor, hasFunding, fundingLinksFor } from "@/config/toolFunding";
import { Link } from "@/i18n/navigation";
import HomeStats from "@/components/HomeStats";
// Career chip strip, moved here from /industry (PRIME 2026-08-06). The data
// lives in the career module so the homepage and /industry/chapters cannot drift.
import { CAREER_VENDORS } from "@/content/vendors/career";
import { partnerVendors } from "@/content/vendors/partners";
import { getPracticeArticles } from "@/lib/practice";
import { studyGuides } from "@/content/certifications/study-guides";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getAllArticles } from "@/lib/learn";

import { ROLES } from "@/lib/roles";
import { VENDOR_FAMILIES } from "@/config/vendors";
import { GLOSSARY } from "@/content/glossary/glossary";
import { PLATFORMS, COURSE_COUNT } from "@/content/training/courses";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const alt = t("hero.title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { ...ogImages("page", "home", locale, alt) };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  // Next.js 15: route params are async. Await before use.
  const { locale } = await params;
  // Enable static rendering for this locale (App Router requirement).
  setRequestLocale(locale);

  // Async server component → use getTranslations (the async server function),
  // NOT the useTranslations hook (which is for client/sync components).
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  // Career strip copy: headings from the "industry" namespace, per-vendor
  // name/years from "vendors". Both reused verbatim so the move requires no
  // retranslation in any of the sixteen locales.
  const ti = await getTranslations("industry");
  const tVendors = await getTranslations("vendors");

  // Toolbox totals, derived from the canonical sources (canon rule D-63): live
  // tools from the catalogue, articles from the EN Learn corpus. These are never
  // hand-written, so any tool or article added or removed updates the figures
  // automatically on the next build — they cannot drift out of date.
  const toolCount = CATALOGUE.filter((tool) => tool.status === "live").length;
  const articleCount = getAllArticles().length;

  // EVERY NUMBER ON THE MAP BELOW IS READ FROM THE THING ITSELF at build time.
  // A hand-written "138 tools" is a claim that rots the day somebody ships the
  // 139th; these cannot disagree with what a reader finds, because they are
  // counted from the same data the pages render.
  const industryCount = partnerVendors.length;
  const practiceCount = getPracticeArticles(locale).length;
  const guideCount = studyGuides.length;
  /* Counts PRIME asked the cards to carry (2026-08-16). Computed from the
     registries, never typed: the "64 of 48" bug came from a total written by
     hand beside a count that moved. */
  const hubCount = VENDOR_FAMILIES.length;
  const glossaryCount = GLOSSARY.length;
  const careerCount = CAREER_VENDORS.length;
  const roleCount = ROLES.length;
  const platformCount = PLATFORMS.length;

  // ANNIVERSARIES, COMPUTED. The timeline knows every founding year, so the
  // page can say something true this year that it did not say last year and
  // will not say next year - with nobody editing anything. Round anniversaries
  // only, largest first, because "40 years old" is worth a sentence and "37"
  // is not. Renders nothing at all in a year where no cohort lands on one.
  const thisYear = new Date().getFullYear();
  const anniversary = [50, 40, 30, 25, 20]
    .map((age) => ({
      age,
      count: partnerVendors.filter((v) => v.founded === thisYear - age).length,
    }))
    .find((a) => a.count > 0);

  return (
    <>
      {/* Keyboard skip link — first focusable element. */}
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>

      <Header />

      <main id="main">
        {/* --- HERO: the thesis --- */}
        <section className="hero">
          <div className="container">
            <p className="hero-eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="page-hero-title">{t("hero.title")}</h1>
            <p className="page-hero-lede">{t("hero.subtitle")}</p>
            {/* THE SECOND SENTENCE (PRIME 2026-08-16). The title states the
                product and its guarantee, which is the strongest claim on the
                site and should not be diluted by adding clauses to it. What
                surrounds the tools — the articles, the industry record, the
                practice and the roles — is most of the site by page count and
                went unmentioned. So: a second line, deliberately smaller and
                quieter than the lede above it, doing one job of its own. */}
            <p className="vendor-divider-note">{t("hero.beyond")}</p>
          </div>
        </section>

        {/* --- TOOLBOX TOTALS: derived live counts, count-up on scroll (D-63) --- */}
        <MessageSlice namespaces={["home"]}><HomeStats tools={toolCount} articles={articleCount} /></MessageSlice>

        {/* --- CREDIBILITY --- */}
        <section className="section" id="who">
          <div className="container section-narrow">
            <h2 className="section-title">{t("credibility.title")}</h2>
            <p className="section-body">{t("credibility.body")}</p>

            {/* ---- The chapters lived from inside (moved here 2026-08-06) ----
                 The claim above is that the work was done rather than marketed.
                 This is the evidence for it, and it belongs immediately after
                 the claim rather than on a page the reader may never reach:
                 sixteen vendors, each with its years, each linking to the
                 chapter that says what the job actually was.

                 Rendered from CAREER_VENDORS so the homepage cannot fall out of
                 step with /industry/chapters - one list, two places that read it. */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{ti("careerStripTitle")}</h2>
              <p className="vendor-divider-note">{ti("careerStripNote")}</p>
            </div>
            <ul className="career-strip">
              {CAREER_VENDORS.map((v) => (
                <li key={v.slug}>
                  <Link href={`/industry/chapters/${v.slug}`} className="career-chip">
                    <span className="career-chip-name">{tVendors(`${v.key}.name`)}</span>
                    <span className="career-chip-years mono">{tVendors(`${v.key}.years`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* ---- The roles held (PRIME 2026-08-16) ----
                 The strip above says WHICH COMPANIES; this one says WHAT THE JOB
                 WAS, and links each title to the entry in The Roles that
                 describes it.

                 DERIVED, never typed: the years come from each role's own
                 provenance citation, which already carries the non-contiguous
                 spans — a consulting engineer at integrators in 2010-2011,
                 2013-2014 and 2020; a field engineer in 1996-2000 and 2005-2007.
                 One fact, one place, read here. */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{t("credibility.rolesStripTitle")}</h2>
              <p className="vendor-divider-note">{t("credibility.rolesStripNote")}</p>
            </div>
            <ul className="career-strip">
              {ROLES.filter((r) => r.provenance.kind === "held")
                /* CHRONOLOGICAL BY START (PRIME 2026-08-16). The order was the
                   corpus order, which is the path a product takes - right for
                   /roles/, wrong here, where the reader is following one
                   person's years.

                   The first year is READ OUT OF THE CITATION rather than stored
                   beside it: `when` already carries "1996-2000, 2005-2007" and
                   "2010-2011, 2012, 2013-2014, 2020", so the sort key is the
                   first four-digit number in it. One fact, one place - a second
                   `startYear` field would be the same year written twice, free
                   to disagree with itself. */
                .slice()
                .sort((a, b) => {
                  const first = (w: string) => Number(/\d{4}/.exec(w)?.[0] ?? "9999");
                  return first(a.provenance.when ?? "") - first(b.provenance.when ?? "");
                })
                .map((r) => (
                <li key={r.slug}>
                  <Link href={`/roles/${r.slug}`} className="career-chip">
                    <span className="career-chip-name">{r.title}</span>
                    <span className="career-chip-years mono">{r.provenance.when}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --- FOUR PILLARS --- */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">{t("pillars.title")}</h2>
            <ul className="pillars">
              <li className="pillar">
                <Link href="/training/f5" className="pillar-link">{t("pillars.f5")}</Link>
              </li>
              <li className="pillar">
                <Link href="/training/fortinet" className="pillar-link">{t("pillars.fortinet")}</Link>
              </li>
              <li className="pillar">
                <Link href="/training/extreme" className="pillar-link">{t("pillars.extreme")}</Link>
              </li>
              <li className="pillar">
                <Link href="/training/netskope" className="pillar-link">{t("pillars.netskope")}</Link>
              </li>
            </ul>
          </div>
        </section>

        {/* --- WHAT IS HERE: the map the nav cannot be (PRIME 2026-08-06) ---
             Schema D put six items in the primary nav, which is the most it can
             hold. This site has more than six things worth finding, and two of
             them - The Practice and the certification guides - are not in the
             nav at all.

             So the homepage carries the map instead. Every card states a
             COUNTED number rather than a written one, which is the same
             discipline the tools follow: compute, never guess. Reuses the
             learn-portal-* vocabulary rather than introducing a card style. */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">{t("map.title")}</h2>
            <div className="learn-portal-grid">

              <Link href="/vendor-hubs" className="learn-portal-card" style={{ "--note-accent": "var(--color-success)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {t("map.hubs")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.hubsLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.hubsBadge", { count: hubCount })}</span>
                </p>
              </Link>
              <Link href="/certifications" className="learn-portal-card" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#10003;</span>
                <p className="learn-portal-title">
                  {t("map.certs")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.certsLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.certsBadge", { count: guideCount })}</span>
                </p>
              </Link>
              <Link href="/study-guides" className="learn-portal-card" style={{ "--note-accent": "var(--color-success)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#10003;</span>
                <p className="learn-portal-title">
                  {t("map.guides")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.guidesLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.guidesBadge", { count: guideCount })}</span>
                </p>
              </Link>
              <Link href="/glossary" className="learn-portal-card" style={{ "--note-accent": "var(--color-danger)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9679;</span>
                <p className="learn-portal-title">
                  {t("map.glossary")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.glossaryLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.glossaryBadge", { count: glossaryCount })}</span>
                </p>
              </Link>
              <Link href="/practice" className="learn-portal-card" style={{ "--note-accent": "var(--color-danger)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9650;</span>
                <p className="learn-portal-title">
                  {t("map.practice")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.practiceLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.practiceBadge", { count: practiceCount })}</span>
                </p>
              </Link>
              <Link href="/roles" className="learn-portal-card" style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {t("map.roles")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.rolesLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.rolesBadge", { count: roleCount })}</span>
                </p>
              </Link>
              <Link href="/tools" className="learn-portal-card" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {t("map.tools")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.toolsLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.toolsBadge", { count: toolCount })}</span>
                </p>
              </Link>
              <Link href="/learn" className="learn-portal-card" style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">
                  {t("map.learn")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.learnLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.learnBadge", { count: articleCount })}</span>
                </p>
              </Link>
              <Link href="/industry" className="learn-portal-card" style={{ "--note-accent": "var(--color-success)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9679;</span>
                <p className="learn-portal-title">
                  {t("map.industry")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.industryLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.industryBadge", { count: industryCount })}</span>
                  {/* The anniversary line, only in a year where one lands. */}
                  {anniversary && (
                    <span className="learn-portal-badge">
                      {t("map.anniversary", { count: anniversary.count, age: anniversary.age })}
                    </span>
                  )}
                </p>
              </Link>
              <Link href="/about" className="learn-portal-card" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9671;</span>
                <p className="learn-portal-title">
                  {t("map.about")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.aboutLede")}</p>
              </Link>
              <Link href="/people" className="learn-portal-card" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9675;</span>
                <p className="learn-portal-title">
                  {t("map.people")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.peopleLede")}</p>
              </Link>
              <Link href="/speaking" className="learn-portal-card" style={{ "--note-accent": "var(--color-amber)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {t("map.speaking")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.speakingLede")}</p>
              </Link>
              <Link href="/blog" className="learn-portal-card" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9674;</span>
                <p className="learn-portal-title">
                  {t("map.blog")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.blogLede")}</p>
              </Link>
              <Link href="/endorsements" className="learn-portal-card" style={{ "--note-accent": "var(--color-amber)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#10022;</span>
                <p className="learn-portal-title">
                  {t("map.endorsements")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.endorsementsLede")}</p>
              </Link>
              <Link href="/dev" className="learn-portal-card" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9881;</span>
                <p className="learn-portal-title">
                  {t("map.dev")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.devLede")}</p>
              </Link>
              <Link href="/contribute" className="learn-portal-card" style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9998;</span>
                <p className="learn-portal-title">
                  {t("map.contribute")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.contributeLede")}</p>
              </Link>
              <Link href="/industry/chapters" className="learn-portal-card" style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9679;</span>
                <p className="learn-portal-title">
                  {t("map.career")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.careerLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.careerBadge", { count: careerCount })}</span>
                </p>
              </Link>
              <Link href="/advisory" className="learn-portal-card" style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9671;</span>
                <p className="learn-portal-title">
                  {t("map.advisory")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.advisoryLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.advisoryBadge")}</span>
                </p>
              </Link>
              <Link href="/training" className="learn-portal-card" style={{ "--note-accent": "var(--color-danger)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">
                  {t("map.training")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.trainingLede")}</p>
                <p className="learn-portal-badges">
                  <span className="learn-portal-badge">{t("map.trainingBadge", { count: COURSE_COUNT, vendors: platformCount })}</span>
                </p>
              </Link>
              <Link href="/red-education" className="learn-portal-card" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">
                  {t("map.redu")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("map.reduLede")}</p>
              </Link>
            </div>
          </div>
        </section>

        {/* --- PRIVACY EXPLAINER --- */}
        <section className="section section-accent">
          <div className="container section-narrow">
            {/* Title carries emphasis on "doesn't leave" (PRIME 2026-09-06),
                so it is rendered rich rather than plain. */}
            <h2 className="section-title">
              {t.rich("privacy.title", { em: (c) => <em>{c}</em> })}
            </h2>
            <p className="section-body">{t("privacy.body")}</p>
          </div>
        </section>

        {/* --- LIVE TOOL --- */}
        <section className="section" id="cidr">
          <div className="container section-narrow">
            <h2 className="section-title">{t("toolPreview.title")}</h2>
            <p className="section-body">{t("toolPreview.body")}</p>
            <p className="tool-toolbox-cta">
              <Link href="/tools" className="tool-toolbox-link">
                {t("toolPreview.toolboxCta")} →
              </Link>
            </p>
            <div className="tool-mount">
              <MessageSlice namespaces={["tools.cidr"]}><CidrTool /></MessageSlice>
              {/* In-tool Learn panel (surface a): contextual articles for this
                  tool, resolved via the Tools->Learn bridge. Same content source
                  as the standalone Learn section. */}
              <ToolLearnPanel
                toolSlug="cidr"
                locale={locale}
                heading={t("toolPreview.learnHeading")}
                seeAll={{ href: "/learn", label: t("toolPreview.seeAllArticles") }}
              />
              {/* Credits & Sources (provenance): gated by the toolProvenance
                  flag; shows the standards the tool implements. */}
              <ToolProvenance
                enabled={isEnabled("toolProvenance") && provenanceFor("cidr") !== null}
                data={provenanceFor("cidr")}
                copy={{
                  title: t("provenance.title"),
                  show: t("provenance.show"),
                  hide: t("provenance.hide"),
                  basisLabel: t("provenance.basisLabel"),
                  sourcesLabel: t("provenance.sourcesLabel"),
                  disclaimer: t("provenance.disclaimer"),
                }}
              />
              {/* Per-tool funding (support this tool): gated by the toolFunding
                  flag and the tool having configured funding links. */}
              <ToolFunding
                enabled={isEnabled("toolFunding") && hasFunding("cidr")}
                purpose={fundingFor("cidr")?.purpose}
                links={fundingLinksFor("cidr")}
                copy={{
                  title: t("funding.title"),
                  pitch: t("funding.pitch"),
                  purposeLabel: t("funding.purposeLabel"),
                }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER (shared component; single source of truth) --- */}
      <SiteFooter />
    </>
  );
}
