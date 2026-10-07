// ============================================================================
// src/app/[locale]/speaking/page.tsx
// ----------------------------------------------------------------------------
// SPEAKING: what the talks are about, the two prepared talks, the formats and
// audiences, the work behind them, how Speaking differs from Training and
// Advisory, what goes beyond a talk, and booking.
//
// REBUILT 2026-10-06, milestone (s1): PRIME chose option B of the Speaking
// options (17:43) and answered the six questions of the PROPOSTA of 2026-10-04
// (17:54). How each answer shows here:
//   1. "it can be both, leave it neutral, and direct all inquiries to me":
//      Booking names no contracting party and says to write directly; every
//      button on the page opens the contact form's speaking route.
//   2. panels, fireside and executive briefings are wanted, "as long as you
//      feature executive briefings in the advisory section": the formats list
//      the first two, and the briefing points to its featured card on
//      /advisory#executive-briefings, where the work belongs.
//   3. no future in the hero: the title and the tracks stay with where the
//      industry came from and the people in it (PRIME's wish to study
//      futurism in depth is recorded in the canon, not promised here).
//   4. no further home-page promotion: the home page keeps the card its
//      review adopted on 2026-10-05 (item 25), with copy matched to this page.
//   5. the second track's name, "help me define what's best": ANVIL's choice,
//      "Humans behind the peripherals", with a plain line under it saying who
//      it is for (the reasoning is in BUILD-s1 in the canon).
//   6. "We don't talk about pricing on the site": the word "fees" leaves
//      Booking; nothing on the page prices anything.
//
// NO LONGER UNLINKED. The 2026-08-06 arrangement ("reachable by URL only")
// ended with the home page's "Work with me" card (2026-10-05); Advisory,
// Training, About, the contact form and the footer link here too.
//
// WHY THIS IS A SEPARATE PAGE FROM /advisory still holds: the two prepared
// talks, "A Revolução da Tecnologia" and "Hard Work, Hard Party", are not
// technical; the buyer is an event organiser or a team lead, not an
// infrastructure manager with a decision to make. The talks are recorded in
// the project material as "Temas especiais" with exactly the framing used
// here, including the second one's disclaimer, which is part of the joke.
//
// NOTHING INVENTED: no lengths beyond "an hour" for an internal session (the
// page's earlier copy), no event logos, no testimonials, no reel, no "keynote
// speaker" label; those come when real material exists.
//
// STRUCTURE: hero (facts, two buttons) -> two tracks -> the talks -> formats
// and audiences -> other subjects and the work behind the talks -> Speaking,
// Training and Advisory -> beyond the talk -> booking.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// The industry record's size, from the registry (2026-10-06), for the "Other subjects" paragraph.
import { getSiteCounts } from "@/lib/siteCounts";
// Styles the one mention of Red Education (the Training line of the three-way difference).
import ReduBrand from "@/components/ReduBrand";

/** The contact form's speaking route: the topic preselected and the event template prefilled (ContactForm). */
const BOOK_HREF = "/contact?intent=speaking#contact-form";

/** The two tracks, each with its prepared talk and that talk's anchor on this page. */
const TRACKS = [
  { key: "track1", talk: "talk1", anchor: "a-revolucao-da-tecnologia" },
  { key: "track2", talk: "talk2", anchor: "hard-work-hard-party" },
] as const;

/** The formats a booking can take, in the order an organiser meets them; the briefing follows, pointing to Advisory. */
const FORMATS = [1, 2, 3, 4, 5] as const;

/** The audiences named, without ranking. */
const AUDIENCES = [1, 2, 3, 4, 5, 6, 7] as const;

/** The three shapes "Beyond the talk" can take, from the lightest to the most designed. */
const BEYOND = [1, 2, 3] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "speaking" });
  return { title: t("title"), ...ogImages("page", "speaking", locale, t("title")) };
}

export default async function SpeakingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("speaking");
  const tNav = await getTranslations("nav");

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero: the title and lede as before (no future in it, PRIME's answer 3), then the three facts an
              organiser checks first, and the two next steps as buttons. */}
          <section className="section">
            <div className="container section-narrow">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              <dl className="speaking-facts">
                <div className="speaking-fact">
                  <dt className="speaking-fact-label">{t("factLanguageLabel")}</dt>
                  <dd className="speaking-fact-value">{t("factLanguage")}</dd>
                </div>
                <div className="speaking-fact">
                  <dt className="speaking-fact-label">{t("factEventsLabel")}</dt>
                  <dd className="speaking-fact-value">{t("factEvents")}</dd>
                </div>
                <div className="speaking-fact">
                  <dt className="speaking-fact-label">{t("factTravelLabel")}</dt>
                  <dd className="speaking-fact-value">{t("factTravel")}</dd>
                </div>
              </dl>
              <div className="hero-cta speaking-hero-actions">
                <Link href={BOOK_HREF} className="btn btn-primary">{t("heroCta")}</Link>
                <a href="#talks" className="btn btn-secondary">{t("heroCtaTalks")}</a>
              </div>
            </div>
          </section>

          {/* The two tracks: what the talks are about, before the talks themselves. Each names who it is for and
              its prepared talk, linked to the talk's card below. */}
          <section className="section section-accent" id="tracks">
            <div className="container">
              <h2 className="section-title">{t("tracksTitle")}</h2>
              <p className="section-body">{t("tracksLede")}</p>
              <ul className="speaking-tracks">
                {TRACKS.map(({ key, talk, anchor }) => (
                  <li key={key} className="speaking-track">
                    <h3 className="speaking-track-title">{t(`${key}Title`)}</h3>
                    <p className="speaking-track-body">{t(`${key}Body`)}</p>
                    <p className="speaking-track-for">{t(`${key}For`)}</p>
                    <p className="speaking-track-talk">
                      <span className="speaking-track-talk-label">{t("trackTalkLabel")}</span>{" "}
                      <a href={`#${anchor}`}>{t(`${talk}Title`)}</a>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* The talks. Two, presented as equals: they suit different moments rather than different budgets. Both
              keep their Portuguese titles in every locale, as named works; the subtitle carries the sense. Each card
              names its track and carries the anchor the track links to. */}
          <section className="section" id="talks">
            <div className="container">
              <h2 className="section-title">{t("talksTitle")}</h2>
              {/* learn-card pattern again - reuse rather than new classes. */}
              <ul className="learn-grid">
                {TRACKS.map(({ key, talk, anchor }) => (
                  <li key={talk} className="learn-grid-item speaking-talk" id={anchor}>
                    <div className="learn-card">
                      <p className="speaking-talk-track mono">{t(`${key}Title`)}</p>
                      <h3 className="learn-card-title">{t(`${talk}Title`)}</h3>
                      <p className="vendor-note-body mono">{t(`${talk}Sub`)}</p>
                      <p className="learn-card-summary">{t(`${talk}Body`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Formats and audiences (PRIME's answer 2): the five formats wanted, then the executive briefing, which is
              advisory work and points to its featured card on /advisory; then the audiences, as chips. */}
          <section className="section section-accent" id="formats">
            <div className="container section-narrow">
              <h2 className="section-title">{t("formatsTitle")}</h2>
              <ul className="speaking-formats">
                {FORMATS.map((n) => (
                  <li key={n} className="speaking-format">
                    <span className="speaking-format-term">{t(`format${n}Term`)}</span>
                    <span className="speaking-format-body">{t(`format${n}Body`)}</span>
                  </li>
                ))}
                {/* The one format that lives elsewhere, marked as such. */}
                <li className="speaking-format speaking-format--elsewhere">
                  <span className="speaking-format-term">{t("briefingTerm")}</span>
                  <span className="speaking-format-body">
                    {t("briefingBody")}{" "}
                    <Link href="/advisory#executive-briefings" className="speaking-format-link">
                      {t("briefingLink")} <span aria-hidden="true">&#8594;</span>
                    </Link>
                  </span>
                </li>
              </ul>
              <h3 className="speaking-subtitle">{t("audiencesTitle")}</h3>
              <ul className="speaking-audiences">
                {AUDIENCES.map((n) => (
                  <li key={n} className="speaking-audience">{t(`audience${n}`)}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Other subjects, and the work behind the talks. The count is the registry's own (2026-10-06, SCOUT's
              adoption audit row 7), so it moves with the record instead of going stale in the copy. The evidence line
              names the three bodies of work an organiser can read before booking: the industry record, the career
              record and Learn. */}
          <section className="section" id="other-subjects">
            <div className="container section-narrow">
              <h2 className="section-title">{t("customTitle")}</h2>
              <p className="section-body">{t("customBody", { count: getSiteCounts(locale).industry })}</p>
              <p className="section-body">{t("customEvidence")}</p>
              <p className="section-cta speaking-links">
                <Link href="/industry" className="section-cta-link">
                  {t("customLink")} &rarr;
                </Link>
                <Link href="/industry/chapters" className="section-cta-link">
                  {t("customLinkCareer")} &rarr;
                </Link>
                <Link href="/learn" className="section-cta-link">
                  {t("customLinkLearn")} &rarr;
                </Link>
              </p>
            </div>
          </section>

          {/* Speaking, Training and Advisory. The former "one thing this is not" boundary, widened to the three
              offerings: an event organiser who liked a talk is exactly the person who will next ask for a training
              day or for advice, and the redirect has to be on the page they are reading. */}
          <section className="section section-accent" id="different">
            <div className="container section-narrow">
              <h2 className="section-title">{t("differTitle")}</h2>
              <p className="section-body">{t("differLede")}</p>
              <ul className="speaking-formats speaking-differ">
                <li className="speaking-format">
                  <span className="speaking-format-term">{t("differSpeakingTerm")}</span>
                  <span className="speaking-format-body">{t("differSpeakingBody")}</span>
                </li>
                <li className="speaking-format">
                  <span className="speaking-format-term">
                    <Link href="/training">{t("differTrainingTerm")}</Link>
                  </span>
                  <span className="speaking-format-body"><ReduBrand>{t("differTrainingBody")}</ReduBrand></span>
                </li>
                <li className="speaking-format">
                  <span className="speaking-format-term">
                    <Link href="/advisory">{t("differAdvisoryTerm")}</Link>
                  </span>
                  <span className="speaking-format-body">{t("differAdvisoryBody")}</span>
                </li>
              </ul>
              <p className="section-body">{t("differNote")}</p>
            </div>
          </section>

          {/* Beyond the talk: the facilitation line, visible enough to invite and not presented as mature (the
              PROPOSTA of 2026-10-04, section 4; part of option B). Lower on the page and quieter than the talks; no
              page of its own until there are delivered engagements to show. */}
          <section className="section" id="beyond-the-talk">
            <div className="container section-narrow">
              <h2 className="section-title">{t("beyondTitle")}</h2>
              <p className="section-body">{t("beyondLede")}</p>
              <ul className="speaking-beyond">
                {BEYOND.map((n) => (
                  <li key={n} className="speaking-beyond-item">
                    <span className="speaking-format-term">{t(`beyond${n}Term`)}</span>
                    <span className="speaking-format-body">{t(`beyond${n}Body`)}</span>
                  </li>
                ))}
              </ul>
              <p className="speaking-beyond-cta">
                {t("beyondCtaLead")} <Link href={BOOK_HREF}>{t("beyondCtaLink")}</Link>
              </p>
            </div>
          </section>

          {/* Booking: neutral about who contracts (PRIME's answer 1), every inquiry to PRIME, no fees (answer 6). */}
          <section className="section section-accent" id="booking">
            <div className="container section-narrow">
              <h2 className="section-title">{t("bookTitle")}</h2>
              <p className="section-body">{t("bookBody")}</p>
              <p className="section-cta">
                <Link href={BOOK_HREF} className="btn btn-primary">
                  {t("bookButton")}
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
