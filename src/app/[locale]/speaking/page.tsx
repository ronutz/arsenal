// ============================================================================
// src/app/[locale]/speaking/page.tsx
// ----------------------------------------------------------------------------
// SPEAKING — the two prepared talks, and availability for events.
//
// *** ALSO DELIBERATELY UNLINKED (PRIME 2026-08-06).*** Same arrangement as
// /advisory: builds, renders, appears in sitemap.xml and llms.txt because those
// walk out/, and is reachable by URL only until the structure is settled.
//
// WHY THIS IS A SEPARATE PAGE FROM /advisory, AND NOT A SECTION INSIDE IT. The
// deciding fact came from PRIME's own material rather than from a theory of
// site structure: the two prepared talks are "A Revolução da Tecnologia" and
// "Hard Work, Hard Party", and NEITHER IS TECHNICAL. One is a wide-angle
// keynote about where the industry is heading; the other is field-engineer
// storytelling. Those cannot sit beside "independent assessment of a vendor
// proposal" without reading as a category error, and the buyer is different in
// every respect - an event organiser or a marketing lead, not an infrastructure
// manager with a decision to make.
//
// The talks are recorded in the project material as "Temas especiais" with
// exactly the framing used here, including the disclaimer on the second one,
// which is reproduced because it is part of the joke rather than a legal note.
//
// NAV CONSEQUENCE: two new pages would have taken the primary nav from five
// items back to seven, undoing the trim made the same day. When these are
// published, the intended arrangement is ONE nav entry for /advisory, with
// /speaking linked from it and from /about - because people who book speakers
// arrive from a bio, a referral or a search, not from browsing a nav.
//
// STRUCTURE: hero -> availability -> the two talks -> other subjects ->
// the not-training boundary -> booking.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "speaking" });
  return { ...ogImages("page", "speaking", locale, t("title")) };
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

  // Both talks keep their Portuguese titles in every locale. They are named
  // works rather than descriptions, and "A Revolução da Tecnologia" is what the
  // talk is called; the subtitle carries the sense for a reader who needs it.
  const talks = [{ key: "talk1" }, { key: "talk2" }] as const;

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="section">
            <div className="container section-narrow">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* Availability */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("availabilityTitle")}</h2>
              <p className="section-body">{t("availabilityBody")}</p>
            </div>
          </section>

          {/* The talks. Two, presented as equals - there is no headline talk
              and no attempt to rank them, because they suit different events
              rather than different budgets. */}
          <section className="section section-accent">
            <div className="container">
              <h2 className="section-title">{t("talksTitle")}</h2>
              {/* learn-card pattern again - reuse rather than new classes. */}
              <ul className="learn-grid">
                {talks.map(({ key }) => (
                  <li key={key} className="learn-grid-item">
                    <div className="learn-card">
                      <h3 className="learn-card-title">{t(`${key}Title`)}</h3>
                      <p className="vendor-note-body mono">{t(`${key}Sub`)}</p>
                      <p className="learn-card-summary">{t(`${key}Body`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Other subjects, pointing at the industry record. This is the one
              genuine differentiator available to a speaker with no video reel
              yet: a hundred and sixty published company histories are evidence
              that the material exists and has been researched. */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("customTitle")}</h2>
              <p className="section-body">{t("customBody")}</p>
              <p className="section-cta">
                <Link href="/industry" className="section-cta-link">
                  {t("customLink")} &rarr;
                </Link>
              </p>
            </div>
          </section>

          {/* The boundary. Stated here as well as on /advisory because an event
              organiser who liked a talk is exactly the person who will next ask
              for a training day, and the redirect has to be on the page they
              are reading. */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("notTitle")}</h2>
              <p className="section-body">{t("notBody")}</p>
            </div>
          </section>

          {/* Booking */}
          <section className="section section-accent">
            <div className="container section-narrow">
              <h2 className="section-title">{t("bookTitle")}</h2>
              <p className="section-body">{t("bookBody")}</p>
              <p className="section-cta">
                <Link href="/contact" className="btn btn-primary">
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
