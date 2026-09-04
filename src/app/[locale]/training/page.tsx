// ============================================================================
// src/app/[locale]/training/page.tsx
// ----------------------------------------------------------------------------
// "TRAINING I DELIVER" — the flagship training landing page.
//
// This is both the section's front door AND the "how I teach" narrative the
// brief called for: a compelling synthesis of why Rodolfo Nützmann is an
// excellent instructor (and, clearly implied, advisor/consultant) choice. It is
// SEO-oriented and traffic-driving: it links to the full history, to each
// platform's course catalog, and, subtly, surfaces the free tools to drive
// usage. Statically generated per locale.
//
// Structure: hero -> why-it-matters narrative -> the four platforms (linking to
// course indexes) -> beyond-the-classroom (advisor implication) -> the tools ->
// the history link -> closing CTA.
// ============================================================================

import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { PLATFORMS, COURSE_COUNT } from "@/content/training/courses";

import ReduBrand from "@/components/ReduBrand";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teach" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { title: t("title"), ...ogImages("page", "training", locale, alt) };
}

export default async function TrainingLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("teach");
  const tT = await getTranslations("training");
  const tNav = await getTranslations("nav");
  // "What I do now" moved here from /about and kept its original keys.
  const tAbout = await getTranslations("about");
  const tRedu = await getTranslations("redEducation"); // /red-education link label

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      {/* teach-tight: section rhythm at one third of the site default (PRIME
          2026-08-06). Scoped here rather than changed on .section globally,
          because this page is short blocks and card grids where the standard
          rhythm reads as slack, and every other page is not. */}
      <main id="main" className="teach-tight">
        <article>
          {/* Hero */}
          <section className="teach-hero">
            <div className="container teach-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* Instructor — who teaches these courses; links to the professional
              showcase so a prospective client can verify credentials before
              booking.
              PRIME 2026-07-24: the three destinations were plain buttons at the
              bottom of the bio card and read as an afterthought. They are now
              PORTAL CARDS ABOVE the bio, reusing the learn-portal-* vocabulary
              already established on /learn for the Glossary and Study-guides
              doors, so the three showcase surfaces are the first thing a
              prospective client sees. Reuse-only: no new CSS classes. */}
          <section className="section teach-instructor">
            <div className="container teach-container">
              <p className="teach-instructor-eyebrow">
                {t("instructor.eyebrow")}
              </p>

              <div className="teach-instructor-card">
                <div className="teach-instructor-text">
                  <h2 className="teach-instructor-name">Rodolfo Nützmann</h2>
                  <p className="teach-instructor-body">
                    {t("instructor.body")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- WHAT I DO NOW (MOVED FROM /about, PRIME 2026-08-06) ---
               The heading and body came from the about page, where they
               described how courses are taught to a reader who had arrived for
               a biography. Here they answer a question the reader actually
               has, and they sit immediately before "Why this matters in a
               classroom", which now reads as the argument that follows from
               the description rather than as an opening assertion.

               The message keys stayed `about.now.*` rather than being renamed
               into the teach namespace: renaming would have required
               retranslating in sixteen locales to change nothing a reader can
               see. The `tAbout` namespace binding below is the whole cost of
               that decision.

               The biographical facts that used to sit under this heading -
               based in, teaches, languages - did NOT move. They remain on
               /about, where they belong. */}
          {/* DISCLAIMER (PRIME 2026-08-11), the same card as /advisory and placed
              the same way: FIRST, before anything it qualifies.

              The two pages carry opposite versions of one fact. /advisory says
              training is not offered there; this says training is offered ONLY
              through Red Education. A reader who lands on either now learns the
              same boundary from whichever door they came through, which is the
              point of stating it at the top rather than in a footer.

              `ReduBrand` styles the name wherever it appears in the sentence,
              so the two mentions here are branded without any markup in the
              translated string. */}
          <section className="section">
            <div className="container teach-container">
              <div className="vendor-note">
                <p className="vendor-note-title">{t("disclaimerTitle")}</p>
                <p className="vendor-note-body">
                  <ReduBrand>{t("disclaimerBody")}</ReduBrand>
                </p>
              </div>
            </div>
          </section>

          <section className="section section-accent">
            <div className="container teach-container">
              <h2 className="teach-block-title">{tAbout("now.title")}</h2>
              <p className="teach-block-body">{tAbout("now.body")}</p>
            </div>
          </section>

          {/* Why it matters / complex made clear / hands-on */}
          <section className="section">
            <div className="container teach-container">
              <div className="teach-blocks">
                {["s1"].map((s) => (
                  <div className="teach-block" key={s}>
                    <h2 className="teach-block-title">{t(`${s}Title`)}</h2>
                    <p className="teach-block-body">{t(`${s}Body`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* The four platforms, linking to course indexes */}
          <section className="section section-accent" id="catalog">
            <div className="container teach-container">
              <h2 className="teach-section-heading">{t("platformsTitle")}</h2>
              <p className="teach-section-intro">{t("platformsBody")}</p>
              <ul className="platform-grid">
                {PLATFORMS.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/training/${p.slug}`}
                      className="platform-card"
                    >
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
              <p className="training-note">{tT("representativeNote")}</p>
            </div>
          </section>

          {/* Remote training environments (PRIME 2026-07-09): how remote
              delivery actually works - vILT platforms and hands-on lab
              environments. Facts supplied by PRIME; reuses teach-block-*
              styling (no new CSS). */}
          <section className="section">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("envTitle")}</h2>
              <p className="teach-block-body">{t("envBody1")}</p>
              <p className="teach-block-body">
                <ReduBrand>{t("envBody2")}</ReduBrand>
              </p>
            </div>
          </section>

          {/* MOVED HERE 2026-08-08 (PRIME): "Complex made clear",
              "Hands-on, not hand-wavy" and "Recognized, certified, and current"
              now sit AFTER the environments section and BEFORE "Where to go
              next". "Why this matters in a classroom" (s1) deliberately stays
              up top, where it introduces the page. */}
          <section className="section section-accent">
            <div className="container teach-container">
              <div className="teach-blocks">
                {["s2", "s3"].map((s) => (
                  <div className="teach-block" key={s}>
                    <h2 className="teach-block-title">{t(`${s}Title`)}</h2>
                    <p className="teach-block-body">{t(`${s}Body`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Credibility */}
          <section className="section teach-credibility">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("s4Title")}</h2>
              <p className="teach-block-body">
                <ReduBrand>{t("s4Body")}</ReduBrand>
              </p>
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
          <section className="section teach-cta-section">
            <div className="container teach-container">
              <h2 className="teach-cta-title">{t("ctaTitle")}</h2>
              <p className="teach-cta-body">{t("ctaBody")}</p>
              <div className="teach-cta-buttons">
                <Link href="/contact" className="btn btn-primary">
                  {t("ctaButton")}
                </Link>
                <a href="#catalog" className="btn btn-secondary">
                  {t("coursesButton")}
                </a>
              </div>
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
