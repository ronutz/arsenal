// ============================================================================
// src/app/[locale]/training/page.tsx
// ----------------------------------------------------------------------------
// "TRAINING I DELIVER" — the flagship training landing page.
//
// RESTRUCTURED 2026-10-04 (PRIME, acting on the independent review of this
// page and on his own amendments to it). The review's diagnosis: the page
// proved that the author is an experienced instructor, where it should help a
// learner or a training buyer decide whether he is the right instructor, what
// training they need, what they will get and how to proceed through Red
// Education. Its P0 items and PRIME's amendments, all here:
//   - the two negative comparisons are gone ("people who learned the material
//     to teach it", "not a presenter reading slides"); the proposition is made
//     positively, and Red Education's wider bench is named as an advantage;
//   - Model A, the PERSONAL CATALOGUE (PRIME: "should be adopted"): the
//     platform section says these are the courses currently delivered, the
//     exact set, with a deliberate call-out to Red Education's broader
//     catalogue immediately after it;
//   - whether a buyer can ask for this instructor is answered in words;
//   - the Fortinet entries follow the programme as Fortinet reorganised it on
//     15 July 2026 (courses.ts);
//   - three buyer routes (known course / team / capability), evidence from
//     students on this page, the two Red Education engagements as team cases,
//     a specific CTA, and the "information is abundant; guided understanding is
//     valuable" argument as positioning rather than as a footnote (PRIME: 21
//     and 22 "especially important");
//   - the country list replaced by live clocks across the teaching regions
//     with a class-time converter (PRIME: a useful visualization first,
//     interaction only where it adds value), the platform names kept for their
//     search value but moved out of the sales narrative.
//
// Structure: hero with proof strip -> three routes -> what I currently teach
// (+ Red's catalogue) -> how I teach -> why live training still matters ->
// evidence from students -> training for teams -> where and when (clocks) ->
// the platform behind the class -> after the class -> where to go next ->
// history -> CTA. Statically generated per locale.
//
// HISTORY kept for the record: hero -> why-it-matters -> platforms ->
// environments -> blocks -> credibility -> where-to-go-next -> history -> CTA
// (2026-07 to 2026-10-03), with the "What I do now" block moved in from /about
// on 2026-08-06 (its about.now.* keys are superseded here by teach.how*).
// ============================================================================

import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
// MARKS (PRIME 2026-10-04): the current wordmark on each platform card.
import VendorMark from "@/components/VendorMark";
import SiteFooter from "@/components/SiteFooter";
import { PLATFORMS } from "@/content/training/courses";
// The five verbatim student quotations rendered on this page (ids in kinds.ts).
import { TESTIMONIALS } from "@/content/testimonials/data";
// The live clocks across the teaching regions; a client island with its own slice.
import GlobalClocks from "@/components/GlobalClocks";
import MessageSlice from "@/components/MessageSlice";
import { attributeRedEducationUrl, externalRel } from "@/config/redEducation";

import ReduBrand from "@/components/ReduBrand";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teach" });
  const alt = t("title");
  // The <title> and description are the training proposition by name (the
  // review found the page surfacing under a generic title); the social card
  // keeps the h1 as its alt text.
  return { title: t("metaTitle"), description: t("metaDescription"), ...ogImages("page", "training", locale, alt) };
}

export default async function TrainingLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("teach");
  // The era caption for the marks' alt text, and the year the current marks are looked up for.
  const tMarks = await getTranslations("partnerVendors");
  const era = (e: string) => tMarks("markEra", { era: e });
  // "since {year}" in the page's language, for the marks still in use.
  const since = (y: number) => tMarks("markSince", { year: y });
  const thisYear = new Date().getFullYear();
  // Platform slug to mark registry key (the registry uses short keys).
  const MARK_KEY: Record<string, string> = { f5: "f5", extreme: "extreme", fortinet: "fortinet", netskope: "netskope" };
  const tT = await getTranslations("training");
  const tNav = await getTranslations("nav");
  const tRedu = await getTranslations("redEducation"); // /red-education link label

  // The five student quotations, verbatim from the catalogue by id, each under
  // the one-line framing teach.evidence<id> holds (the framing names what the
  // quotation shows and never adds to it). The order is the order shown.
  const EVIDENCE_IDS = ["90", "88", "87", "18", "41"];
  const evidence = EVIDENCE_IDS.map((id) => TESTIMONIALS.find((x) => x.id === id)).filter(
    (q): q is NonNullable<typeof q> => Boolean(q),
  );
  // The one outbound Red Education link in the catalogue call-out, attributed
  // at render as the standing UTM schema requires.
  const redCatalogueUrl = attributeRedEducationUrl("https://www.rededucation.com/", {
    pageType: "training",
    locale,
    cta: "broader-catalogue",
  });

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      {/* teach-tight: section rhythm at one third of the site default (PRIME
          2026-08-06). Scoped here rather than changed on .section globally,
          because this page is short blocks and card grids where the standard
          rhythm reads as slack, and every other page is not. */}
      <main id="main" className="teach-tight">
        <article>
          {/* Hero: the proposition, made positively, and a proof strip a buyer
              reads in one line (platforms, languages, delivery, the ATC). */}
          <section className="teach-hero">
            <div className="container teach-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("heroBody")}</p>
              <ul className="teach-proof">
                <li className="teach-proof-item">{t("proofPlatforms")}</li>
                <li className="teach-proof-item">{t("proofLanguages")}</li>
                <li className="teach-proof-item">{t("proofDelivery")}</li>
                <li className="teach-proof-item"><ReduBrand>{t("proofThrough")}</ReduBrand></li>
              </ul>
            </div>
          </section>

          {/* Three routes: the three kinds of buyer the review found the page
              addressing without acknowledging, each with its own door. */}
          <section className="section section-accent">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("routesTitle")}</h2>
              <p className="teach-block-body">{t("routesLede")}</p>
              <ul className="teach-routes">
                <li className="teach-route">
                  <h3 className="teach-route-title">{t("route1Title")}</h3>
                  <p className="teach-route-body">{t("route1Body")}</p>
                  <a href="#catalog" className="teach-route-cta">{t("route1Cta")} <span aria-hidden="true">&#8595;</span></a>
                </li>
                <li className="teach-route">
                  <h3 className="teach-route-title">{t("route2Title")}</h3>
                  <p className="teach-route-body">{t("route2Body")}</p>
                  <Link href="/contact" className="teach-route-cta">{t("route2Cta")} <span aria-hidden="true">&#8594;</span></Link>
                </li>
                <li className="teach-route">
                  <h3 className="teach-route-title">{t("route3Title")}</h3>
                  <p className="teach-route-body">{t("route3Body")}</p>
                  <Link href="/contact" className="teach-route-cta">{t("route3Cta")} <span aria-hidden="true">&#8594;</span></Link>
                </li>
              </ul>
            </div>
          </section>

          {/* What I currently teach: the personal catalogue (Model A), the exact
              set, then the deliberate bridge to Red Education's broader one. */}
          <section className="section" id="catalog">
            <div className="container teach-container">
              <h2 className="teach-section-heading">{t("catalogueTitle")}</h2>
              <p className="teach-section-intro">{t("catalogueBody")}</p>
              <ul className="platform-grid">
                {PLATFORMS.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/training/${p.slug}`}
                      className="platform-card"
                    >
                      {MARK_KEY[p.slug] && <VendorMark vendor={MARK_KEY[p.slug]} year={thisYear} eraLabel={era} since={since} compact />}
                      <span className="platform-card-name">{p.name}</span>
                      <span className="platform-card-tagline">{p.tagline}</span>
                      <span className="platform-card-meta mono">
                        {tT("courseCount", { count: p.courses.length })} ·{" "}
                        {tT("since")} {p.since}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="training-note">{t("catalogueNote")}</p>
              <div className="vendor-note teach-red-catalogue">
                <VendorMark vendor="rededucation" year={thisYear} eraLabel={era} since={since} compact />
                <p className="vendor-note-title">{t("redCatalogueTitle")}</p>
                <p className="vendor-note-body"><ReduBrand>{t("redCatalogueBody")}</ReduBrand></p>
                <p className="teach-red-catalogue-cta">
                  <a href={redCatalogueUrl} rel={externalRel(redCatalogueUrl)} target="_blank" className="btn btn-secondary">{t("redCatalogueCta")} <span aria-hidden="true">&#8599;</span></a>
                </p>
              </div>
            </div>
          </section>

          {/* How I teach: the curriculum is the vendor's; three principles and
              the practitioner paragraph say what the instructor adds, without
              anyone else having to be worse. Replaces "What I do", "Why this
              matters in a classroom", "Complex made clear" and "Hands-on, not
              hand-wavy", which said one thing four ways. */}
          <section className="section section-accent">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("howTitle")}</h2>
              <p className="teach-block-body">{t("howLede")}</p>
              <ol className="teach-principles">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="teach-principle">
                    <h3 className="teach-principle-title">{t(`how${n}Title`)}</h3>
                    <p className="teach-principle-body">{t(`how${n}Body`)}</p>
                  </li>
                ))}
              </ol>
              <p className="teach-block-body teach-practitioner">{t("howPractitioner")}</p>
            </div>
          </section>

          {/* Why live training still matters: information is abundant, guided
              understanding is not. Positioning, not a footnote (PRIME: items 21
              and 22 "especially important"), and framed without calling AI,
              self-paced material or anyone else inferior. */}
          <section className="section">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("liveTitle")}</h2>
              <p className="teach-live-lede">{t("liveLede")}</p>
              <p className="teach-block-body">{t("liveBody")}</p>
              <p className="teach-block-body teach-live-ladder">{t("liveLadder")}</p>
            </div>
          </section>

          {/* Evidence from students: five verbatim quotations chosen for what
              each shows, the proof the review found "one click too far away". */}
          <section className="section section-accent">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("evidenceTitle")}</h2>
              <p className="teach-block-body">{t("evidenceLede")}</p>
              <ul className="advisory-evidence teach-evidence">
                {evidence.map((q) => {
                  const text = q.textEnglish ?? q.text;
                  return (
                    <li key={q.id}>
                      <p className="advisory-evidence-frame">{t(`evidence${q.id}`)}</p>
                      <figure className="about-featured-quote">
                        <blockquote className="about-featured-quote-text">
                          {text.split("\n").map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </blockquote>
                        <figcaption className="about-featured-quote-meta">
                          <span className="about-featured-quote-author">{q.author}</span>
                          {q.title ? <span className="about-featured-quote-title">{q.title}</span> : null}
                          <span className="about-featured-quote-source">
                            {q.source} &middot; {q.date}
                          </span>
                        </figcaption>
                      </figure>
                    </li>
                  );
                })}
              </ul>
              <p className="section-cta">
                <Link href="/endorsements?kind=training" className="btn btn-secondary">{t("evidenceAll")}</Link>
              </p>
            </div>
          </section>

          {/* Training for teams: the two engagements Red Education published,
              compact, each linking to the summaries on /red-education. */}
          <section className="section">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("teamsTitle")}</h2>
              <p className="teach-block-body">{t("teamsLede")}</p>
              <ul className="teach-teams">
                <li className="teach-team">
                  <VendorMark vendor="fortinet" year={thisYear} eraLabel={era} since={since} compact />
                  <h3 className="teach-team-title">{t("team1Title")}</h3>
                  <p className="teach-team-body">{t("team1Body")}</p>
                </li>
                <li className="teach-team">
                  <VendorMark vendor="f5" year={thisYear} eraLabel={era} since={since} compact />
                  <h3 className="teach-team-title">{t("team2Title")}</h3>
                  <p className="teach-team-body">{t("team2Body")}</p>
                </li>
              </ul>
              <p className="section-cta">
                <Link href="/red-education#case-studies" className="btn btn-secondary">{t("teamsCta")} <span aria-hidden="true">&#8594;</span></Link>
              </p>
            </div>
          </section>

          {/* Where and when: live clocks across the teaching regions with the
              class-time converter, the country list kept as a record under a
              disclosure, and the delivery platforms kept for their search value
              but out of the narrative. */}
          <section className="section section-accent" id="where-and-when">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("worldTitle")}</h2>
              <p className="teach-block-body">{t("worldLede")}</p>
              <MessageSlice namespaces={["teach.clocks"]}>
                <GlobalClocks />
              </MessageSlice>
              <details className="teach-details">
                <summary className="teach-details-summary">{t("worldCountries")}</summary>
                <p className="teach-details-body">{t("worldCountriesList")}</p>
              </details>
              <details className="teach-details">
                <summary className="teach-details-summary">{t("platformsDeliveryTitle")}</summary>
                <p className="teach-details-body"><ReduBrand>{t("platformsDeliveryBody")}</ReduBrand></p>
              </details>
            </div>
          </section>

          {/* The platform behind the class: the same fact the "Before you read
              further" card stated (full time at Red Education; everything
              delivered through it), now as the advantage it is, with the honest
              answer to "can I ask for him". */}
          <section className="section">
            <div className="container teach-container">
              <div className="vendor-note teach-behind">
                <VendorMark vendor="rededucation" year={thisYear} eraLabel={era} since={since} compact />
                <p className="vendor-note-title">{t("behindTitle")}</p>
                <p className="vendor-note-body"><ReduBrand>{t("behindBody")}</ReduBrand></p>
                <p className="vendor-note-body teach-behind-ask"><ReduBrand>{t("behindAsk")}</ReduBrand></p>
                <p className="teach-redu-link-row">
                  <Link href="/red-education" className="btn btn-secondary">{t("behindCta")} <span aria-hidden="true">&#8594;</span></Link>
                </p>
              </div>
            </div>
          </section>

          {/* After the class: transfer, the next course, the certification, the
              reference shelf. "The course ends. The reference material does not." */}
          <section className="section section-accent">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("afterTitle")}</h2>
              <p className="teach-live-lede">{t("afterLede")}</p>
              <ul className="teach-after">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="teach-after-item">
                    <h3 className="teach-after-title">{t(`after${n}Title`)}</h3>
                    <p className="teach-after-body">{t(`after${n}Body`)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* "BEYOND THE CLASSROOM" DELETED, NOT MOVED (PRIME 2026-08-06
              left the choice open).
              Two reasons for deleting rather than relocating. First, /advisory
              now says this properly and specifically - "the experience behind
              it is available to teams that need more than a course" is a
              vaguer version of a page that already exists, and running both
              would be two claims about one offer. Second, and more
              importantly, IT CONTRADICTS THAT PAGE: /advisory opens by stating
              the work is deliberately limited and happens outside Red
              Education hours, while this section implied open availability for
              "the hard problems that do not fit a syllabus".
              Advisory is in the primary nav, which is the door. */}

          {/* --- WHERE TO GO NEXT (PRIME 2026-08-06) ---
               Navigation cards in the /learn idiom, placed after the instructor
               section because that is the point at which a reader has decided
               whether they trust the person and needs somewhere to go.

               ORDER IS DELIBERATE and follows commitment rather than
               importance: the catalogue first for somebody ready to book, the
               certification guides next for somebody deciding what to book, and
               then the two FREE bodies of writing for somebody not ready to
               book anything. A page that leads with what it wants to sell and
               ends with what it gives away reads correctly in both directions.

               Reuse-only, as with the instructor portals above: the
               learn-portal-* vocabulary, no new classes. */}
          <section className="section">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("navTitle")}</h2>
              <p className="teach-block-body">{t("navLede")}</p>
              <div className="learn-portal-grid">
                {/* The catalogue leads and takes the row on its own (PRIME
                    2026-08-08): it is what this page is for, and the cards
                    below it are the free material for readers not ready to
                    book. Jumps to the #catalog section on this page, so the
                    arrow points UP rather than across. */}
                <a
                  href="#catalog"
                  className="learn-portal-card learn-portal-card-lead"
                  style={
                    {
                      "--note-accent": "var(--accent-primary)",
                    } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#9632;
                  </span>
                  <p className="learn-portal-title">
                    {t("navCatalog")}{" "}
                    <span className="learn-portal-arrow">&#8593;</span>
                  </p>
                  <p className="learn-portal-lede">{t("navCatalogLede")}</p>
                </a>
                <Link
                  href="/certifications"
                  className="learn-portal-card"
                  style={
                    {
                      "--note-accent": "var(--accent-primary)",
                    } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#9679;
                  </span>
                  <p className="learn-portal-title">
                    {t("navCerts")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">{t("navCertsLede")}</p>
                </Link>
                <Link
                  href="/learn"
                  className="learn-portal-card"
                  style={
                    { "--note-accent": "var(--color-warning)" } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#9632;
                  </span>
                  <p className="learn-portal-title">
                    {t("navLearn")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">{t("navLearnLede")}</p>
                </Link>
                <Link
                  href="/tools"
                  className="learn-portal-card"
                  style={
                    { "--note-accent": "var(--color-success)" } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#9670;
                  </span>
                  <p className="learn-portal-title">
                    {t("navTools")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">{t("navToolsLede")}</p>
                </Link>

                {/* GLOSSARY (PRIME 2026-08-06). A course leaves people with
                    vocabulary they half-remember; this is where they check it
                    afterwards, which makes it a training destination rather
                    than a reference curiosity. */}
                <Link
                  href="/glossary"
                  className="learn-portal-card"
                  style={
                    { "--note-accent": "var(--color-danger)" } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#9679;
                  </span>
                  <p className="learn-portal-title">
                    {t("navGlossary")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">{t("navGlossaryLede")}</p>
                </Link>

                {/* About / Credentials / Endorsements MOVED IN from their own
                    section below (PRIME 2026-08-06). They were a second card
                    grid doing the same job a few hundred pixels further down;
                    one grid of seven doors reads as a map, two grids of three
                    and four read as indecision. */}
                <Link
                  href="/about"
                  className="learn-portal-card"
                  style={
                    {
                      "--note-accent": "var(--accent-primary)",
                    } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    RN
                  </span>
                  <p className="learn-portal-title">
                    {t("instructor.about")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">
                    {t("instructor.aboutLede")}
                  </p>
                </Link>
                <Link
                  href="/about/credentials"
                  className="learn-portal-card"
                  style={
                    { "--note-accent": "var(--color-warning)" } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#10003;
                  </span>
                  <p className="learn-portal-title">
                    {t("instructor.certs")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">
                    {t("instructor.certsLede")}
                  </p>
                </Link>
                <Link
                  href="/endorsements"
                  className="learn-portal-card"
                  style={
                    { "--note-accent": "var(--color-success)" } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#8220;&#8221;
                  </span>
                  <p className="learn-portal-title">
                    {t("instructor.endorsements")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">
                    {t("instructor.endorsementsLede")}
                  </p>
                </Link>
                {/* CAREER (PRIME 2026-09-01). A reader who has just decided
                    whether to trust the instructor is often deciding about
                    their own next step rather than about a course, and the
                    roles material answers that question without selling
                    anything. Reuse-only, as with the cards above. */}
                <Link
                  href="/roles"
                  className="learn-portal-card"
                  style={
                    {
                      "--note-accent": "var(--accent-secondary)",
                    } as CSSProperties
                  }
                >
                  <span className="learn-portal-ornament" aria-hidden>
                    &#9670;
                  </span>
                  <p className="learn-portal-title">
                    {t("navCareer")}{" "}
                    <span className="learn-portal-arrow">&#8594;</span>
                  </p>
                  <p className="learn-portal-lede">{t("navCareerLede")}</p>
                </Link>
              </div>
            </div>
          </section>

          {/* TOOLS PROMOTION REMOVED (PRIME 2026-08-06). The page already
              points at the tools from the "Where to go next" cards further
              down, and a second pitch for a free thing in the middle of a page
              selling training interrupted the argument it was making. */}

          {/* History link */}
          <section className="section section-accent">
            <div className="container teach-container">
              <div className="teach-history">
                <div>
                  <h2 className="teach-block-title">{t("historyTitle")}</h2>
                  <p className="teach-block-body">{t("historyBody")}</p>
                </div>
                <Link
                  href="/about"
                  className="btn btn-secondary teach-history-btn"
                >
                  {t("historyCta")} →
                </Link>
              </div>
            </div>
          </section>

          {/* Closing CTA */}
          <section className="section teach-cta-section" id="contact">
            <div className="container teach-container">
              {/* The specific prompt (review item 30) in place of "Let's work
                  together"; the advisory clause left the CTA for the same reason
                  speaking left /advisory: one page, one offer. */}
              <h2 className="teach-cta-title">{t("ctaTitle2")}</h2>
              <p className="teach-cta-body"><ReduBrand>{t("ctaBody2")}</ReduBrand></p>
              <div className="teach-cta-buttons">
                <Link href="/contact" className="btn btn-primary">
                  {t("ctaButton")}
                </Link>
                <a href="#catalog" className="btn btn-secondary">
                  {t("coursesButton")}
                </a>
              </div>
              <p className="advisory-speaking-note">
                {t("ctaAdvisory")} <Link href="/advisory">{t("ctaAdvisoryLink")}</Link>
                <br />
                {t("ctaSpeaking")} <Link href="/speaking">{t("ctaSpeakingLink")}</Link>
              </p>
              {/* Contextual link to the Red Education profile/homage page
                  (PRIME 2026-07-09): the ATC these courses are booked through. */}
              <p className="teach-redu-link-row">
                <Link href="/red-education" className="redu-inline-link">
                  {/* linked={false} because this text is ALREADY inside a Link to
                      /red-education. Wrapping it would nest an anchor inside an
                      anchor, which is invalid HTML and which browsers recover
                      from inconsistently. The enclosing link does the
                      navigation; ReduBrand does only the colour. */}
                  <ReduBrand linked={false}>{tRedu("aboutLink")}</ReduBrand>{" "}
                  <span aria-hidden="true">&#8594;</span>
                </Link>
              </p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
