// ============================================================================
// src/app/[locale]/about/page.tsx
// ----------------------------------------------------------------------------
// THE ABOUT / INSTRUCTOR PAGE — the authority centerpiece.
//
// SOURCING & EVIDENCE-GATING (per canon guardrails):
//   Every factual claim here traces to a verified project-knowledge source
//   (the CVs, the LinkedIn Profile.pdf, the Professional Experience timeline,
//   the F5/Extreme/Fortinet/Netskope certificates). Where the canon IA wants
//   content the files do NOT substantiate, it is marked with a GAP flag that
//   renders ONLY in development (a visible banner), never in production — so
//   Rodolfo can see exactly what needs his input without shipping a TODO.
//
//   Guardrails actively applied (NOT copied from the older CVs, which violate
//   them): "Rodolfo Nützmann" never "Rod"; "since 1996" not "30+ years"; FOUR
//   pillars only (F5, Fortinet, Extreme Networks, Netskope) — Palo Alto / Ping
//   excluded; only Red Education named as a company; em-dash-free; no cadence
//   claims; credential-forward, no overclaiming. Testimonials are NOT included
//   here (they are verbatim-only and belong in their own reviewed component).
//
// All visible copy is localized via getTranslations (English base + fallback).
// This is a server component (static). The GAP banner is dev-only.
// ============================================================================

import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

// Dev-only gap flag. In production (NODE_ENV === "production") it renders
// nothing, so no TODO ever ships. In dev it shows a visible amber note.
function Gap({ note }: { note: string }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <span
      style={{
        display: "inline-block",
        background: "rgba(245,158,11,0.15)",
        border: "1px solid rgba(245,158,11,0.5)",
        color: "#f59e0b",
        fontSize: "0.75rem",
        padding: "0.15rem 0.5rem",
        borderRadius: "6px",
        margin: "0.25rem 0",
        fontFamily: "var(--font-mono)",
      }}
    >
      GAP: {note}
    </span>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const alt = "Rodolfo Nützmann";
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  //
  // The TITLE is separate from the card's alt text, and until 2026-08-16 this
  // page set only the card - so it inherited the site-wide default title, along
  // with nine other index pages. Ten of the most important pages on the site
  // shared one <title>, which is the single strongest on-page signal there is.
  return { title: t("metaTitle"), ...ogImages("page", "about", locale, alt) };
}

/** The three era chapters, now living under /about. */
const ERAS = [
  { slug: "pre-1996", key: "pre1996" },
  { slug: "1996-2020", key: "era19962020" },
  { slug: "2020-present", key: "era2020present" },
] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  // The era copy keeps its own namespace: the strings did not move, only the
  // pages that render them.
  const tHistory = await getTranslations("history");
  const tNav = await getTranslations("nav");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      {/* about-tight: section padding reduced to a third of the site
          default (PRIME 2026-08-06). Scoped to this page rather than changed
          on .section globally, because the instruction was about /about and a
          global change would have re-spaced every page on the site. */}
      <main id="main" className="about-tight">
        {/* --- HERO --- */}
        <section className="about-hero">
          <div className="container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">Rodolfo Nützmann</h1>
            <p className="about-role">{t("role")}</p>
            <p className="page-hero-lede">{t("lede")}</p>
          </div>
        </section>

        {/* --- THE FACTS ---
             "What I do now" (heading and body) MOVED TO /training on 2026-08-06
             at PRIME's instruction: the text describes how courses are taught,
             which is a question a reader has on the training page and not one
             they arrived at the biography with.

             The facts below did NOT move, because they are biographical rather
             than pedagogical - where he is, what he teaches, which languages.
             They kept their `now.*` message keys so the move needed no
             retranslation in sixteen locales.

             They now render WITHOUT a heading, directly under the hero, because
             the heading that used to introduce them has gone and inventing a
             replacement was not asked for. Read as hero metadata, which is what
             they are. */}
        <section className="section about-facts-section">
          <div className="container section-narrow">
            {/* CARD ORDER (PRIME 2026-09-05): Based in, Citizenships, Travel
                permits, Teaches, Languages, Offers. The order answers a reader's
                questions in the sequence they arise - where is he, what is he
                entitled to, can he come here, what does he do, in what language,
                and what else is on offer. Citizenships and travel permits are
                two different facts and are kept apart: one is status, the other
                is the practical ability to appear somewhere next month. */}
            <ul className="about-facts">
              <li className="about-fact">
                <span className="about-fact-label">{t("now.basedLabel")}</span>
                <span className="about-fact-value">{t("now.basedValue")}</span>
              </li>
              <li className="about-fact">
                <span className="about-fact-label">{t("now.citizenshipsLabel")}</span>
                <span className="about-fact-value">{t("now.citizenshipsValue")}</span>
              </li>
              <li className="about-fact">
                <span className="about-fact-label">{t("now.permitsLabel")}</span>
                <span className="about-fact-value">{t("now.permitsValue")}</span>
              </li>
              <li className="about-fact">
                <span className="about-fact-label">{t("now.teachesLabel")}</span>
                <span className="about-fact-value">{t("now.teachesValue")}</span>
              </li>
              <li className="about-fact">
                <span className="about-fact-label">{t("now.languagesLabel")}</span>
                <span className="about-fact-value">{t("now.languagesValue")}</span>
              </li>
              <li className="about-fact">
                <span className="about-fact-label">{t("now.offersLabel")}</span>
                <span className="about-fact-value">{t("now.offersValue")}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* --- THE FOUR PLATFORMS (current authorized teaching) --- */}
        <section className="section section-accent">
          <div className="container">
            <h2 className="section-title">{t("platforms.title")}</h2>
            <p className="section-body" style={{ marginBottom: "2rem" }}>
              {t("platforms.body")}
            </p>
            <ul className="about-platforms">
              <li className="about-platform">
                <span className="about-platform-name">F5</span>
                <span className="about-platform-detail">{t("platforms.f5")}</span>
              </li>
              <li className="about-platform">
                <span className="about-platform-name">Fortinet</span>
                <span className="about-platform-detail">{t("platforms.fortinet")}</span>
              </li>
              <li className="about-platform">
                <span className="about-platform-name">Extreme Networks</span>
                <span className="about-platform-detail">{t("platforms.extreme")}</span>
              </li>
              <li className="about-platform">
                <span className="about-platform-name">Netskope</span>
                <span className="about-platform-detail">{t("platforms.netskope")}</span>
              </li>
            </ul>

            {/* "How I teach" MOVED HERE (PRIME 2026-08-06), inside the
                platforms section and after the cards. It reads as the answer
                to the question the cards raise: having just listed four
                platforms taught in depth, the obvious next thought is how.
                Kept as an h3 inside this section rather than an h2 of its own,
                because it is now subordinate to the platforms heading rather
                than a peer of it. */}
            <h3 className="vendor-note-title" style={{ marginTop: "2.5rem" }}>
              {t("approach.title")}
            </h3>
            <p className="section-body">{t("approach.body")}</p>

            {/* HOW I ADVISE (PRIME 2026-09-05). Sits directly under "How I
                teach" because the two are the same practice pointed at
                different audiences: one explains a platform to the people who
                will run it, the other explains a decision to the people who
                will own it. Kept as a peer h3 rather than its own section, so
                the page does not imply these are separate careers. */}
            <h3 className="vendor-note-title" style={{ marginTop: "2.5rem" }}>
              {t("advise.title")}
            </h3>
            <p className="section-body">{t("advise.body")}</p>
            <Gap note="Expand teaching-philosophy copy with Rodolfo's own words if desired (current text is from the verified bio only)." />
          </div>
        </section>

        {/* --- RECOGNITION: REMOVED, NOT MOVED (PRIME 2026-08-06) ---
             The instruction was to move the F5 DevCentral MVP section to the
             F5 training and F5 career pages, and to evaluate what those pages
             already said. They already say it, in both cases with more context
             than this section had:

               /industry/chapters/f5, section "The instructor's chair and
               DevCentral" - "F5's DevCentral community named Rodolfo an MVP
               three consecutive years, 2022 through 2024", sitting beside the
               instructor authorization and the twelve courses.

               /training, section "Recognized, certified, and current" - "F5
               DevCentral MVP for three consecutive years, in 2022, 2023, and
               2024", sitting beside the certifications and the delivery
               regions.

             It is also in the F5 vendor profile timeline and in the
             certifications data as a formal award record. Moving this section
             would have produced a FOURTH statement of the same fact. So it is
             deleted here rather than relocated, and the about page loses a
             claim it was making twice on the same site. */}

        {/* --- WHERE IT STARTED + THE PATH (PRIME 2026-08-06) ---
             One section, not two. "Where it started" moved up to sit directly
             above "The path here" with NO separator between them, because they
             are one continuous account: the origin and then the route from it.
             Two <section> wrappers would have drawn a divider between a
             sentence and its own continuation.

             They share a single container for that reason. The origin keeps an
             h2 because it now opens the account; the path follows it as a
             second h2 within the same block, which is correct - these are two
             headings of equal weight in one narrative, not a heading and a
             subheading. */}
        <section className="section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("origins.title")}</h2>
            <p className="section-body" style={{ marginBottom: "2.5rem" }}>
              {t("origins.body")}
            </p>

            <h2 className="section-title">{t("path.title")}</h2>
            <p className="section-body" style={{ marginBottom: "2rem" }}>
              {t("path.intro")}
            </p>

            <ol className="about-timeline">
              <li className="about-era">
                <span className="about-era-years mono">1996 – 2000</span>
                <span className="about-era-where">Cabletron Systems · São Paulo</span>
                <span className="about-era-what">{t("path.cabletron")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2000 – 2002</span>
                <span className="about-era-where">Riverstone Networks · Santa Clara, California</span>
                <span className="about-era-what">{t("path.riverstone")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2003 – 2004</span>
                <span className="about-era-where">Cisco Systems · Brasília</span>
                <span className="about-era-what">{t("path.cisco")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2005 – 2007</span>
                <span className="about-era-where">Enterasys Networks · São Paulo</span>
                <span className="about-era-what">{t("path.enterasys")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2009 – 2010</span>
                <span className="about-era-where">Juniper Networks · São Paulo</span>
                <span className="about-era-what">{t("path.juniper")}</span>
              </li>
              {/* ADDED 2026-08-05 (PRIME). The record jumped from 2010 to 2015
                  with no entry for the four years in between, which read as a
                  gap rather than as what it was: implementation work through
                  resellers and direct engagements. Supplied first-hand. */}
              <li className="about-era">
                <span className="about-era-years mono">2011 – 2014</span>
                <span className="about-era-where">Implementation · via CYLK, TDec and direct engagements</span>
                <span className="about-era-what">{t("path.implementation")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2015 – 2019</span>
                <span className="about-era-where">F5 Networks · channel (Westcon, ScanSource)</span>
                <span className="about-era-what">{t("path.f5channel")}</span>
              </li>
              <li className="about-era about-era--current">
                <span className="about-era-years mono">2020 – {t("path.present")}</span>
                <span className="about-era-where">Red Education</span>
                <span className="about-era-what">{t("path.rededucation")}</span>
              </li>
            </ol>

            {/* --- THE HISTORY (moved here from /industry/history, PRIME
                 2026-08-06) ---
                 The index page is deleted and its contents live here, which
                 removes a page that existed only to introduce three others.
                 The three era pages moved with it, to /about/<slug>.

                 Rendered with the ORIGINAL history-era-* classes rather than
                 restyled: PRIME asked for the cards "just like" the page they
                 came from, and the stylesheet already held every class they
                 need. */}
            <h2 className="section-title" style={{ marginTop: "3rem" }}>
              {t("historySectionTitle")}
            </h2>
            <p className="section-body">{tHistory("indexLede")}</p>

            <ol className="history-eras">
              {ERAS.map((era, i) => (
                <li key={era.slug}>
                  <Link href={`/about/${era.slug}`} className="history-era-card">
                    <span className="history-era-num mono">
                      {tHistory("eraLabel")} {i + 1}
                    </span>
                    <span className="history-era-years mono">
                      {tHistory(`${era.key}.years`)}
                    </span>
                    <span className="history-era-title">
                      {tHistory(`${era.key}.title`)}
                    </span>
                    <span className="history-era-subtitle">
                      {tHistory(`${era.key}.subtitle`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            {/* Four cards where three buttons used to be (PRIME 2026-07-27).
                Certifications and endorsements moved down from the top of the
                page to join them: they are where a reader goes AFTER the career
                timeline, not before it. The vendor-lineage link is gone - it
                belongs on the vendor hubs, which is where it now lives. */}
            <div className="learn-portal-grid" style={{ marginTop: "2rem" }}>
              {/* RESTYLED into the learn-portal idiom (PRIME 2026-08-06), which
                  is the vocabulary the homepage, Learn and Training already use
                  for "where to go next". Four cards where there were four, one
                  of them replaced: the history card is gone because the history
                  is now a section above, and Courses takes its place because a
                  reader who has just read a career record is the most likely
                  person on this site to want the catalogue. */}
              <Link
                href="/industry/chapters"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9679;</span>
                <p className="learn-portal-title">
                  {t("credibility.recordTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.recordDesc")}</p>
              </Link>
              <Link
                href="/about/credentials"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#10003;</span>
                <p className="learn-portal-title">
                  {t("credibility.certsTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.certsDesc")}</p>
              </Link>
              <Link
                href="/endorsements"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-success)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#8220;&#8221;</span>
                <p className="learn-portal-title">
                  {t("credibility.endorsementsTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.endorsementsDesc")}</p>
              </Link>
              <Link
                href="/training#catalog"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-danger)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">
                  {t("credibility.coursesTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.coursesDesc")}</p>
              </Link>
              {/* BLOG (PRIME 2026-08-06), moved out of the footer where it was
                  one link among fifteen. On this page it sits beside the other
                  things somebody reads after the career record. */}
              <Link
                href="/blog"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9671;</span>
                <p className="learn-portal-title">
                  {t("credibility.blogTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.blogDesc")}</p>
              </Link>
            </div>
          </div>
        </section>

        {/* --- CTA --- */}
        <section className="section">
          <div className="container section-narrow about-cta">
            {/* CTA REPLACED (PRIME 2026-08-06): "Start with the concepts" sent
                a reader who had just finished a biography off to Learn and
                Tools, which are one click away in the nav and were never what
                this page was building toward. A page about a person ends by
                letting you contact the person. */}
            <h2 className="section-title">{t("cta.title")}</h2>
            <p className="section-body" style={{ marginBottom: "1.5rem" }}>
              {t("cta.body")}
            </p>
            <div className="hero-cta">
              <Link href="/contact" className="btn btn-primary">
                {t("cta.contactButton")}
              </Link>
              <Link href="/stats" className="btn btn-secondary">
                {t("cta.statsButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
