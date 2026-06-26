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

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { PLATFORMS, COURSE_COUNT } from "@/content/training/courses";

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

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="teach-hero">
            <div className="container teach-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="teach-title">{t("title")}</h1>
              <p className="teach-lede">{t("lede")}</p>
            </div>
          </section>

          {/* Why it matters / complex made clear / hands-on */}
          <section className="section">
            <div className="container teach-container">
              <div className="teach-blocks">
                {["s1", "s2", "s3"].map((s) => (
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
              <p className="teach-block-body">{t("s4Body")}</p>
            </div>
          </section>

          {/* The four platforms, linking to course indexes */}
          <section className="section" id="catalog">
            <div className="container teach-container">
              <h2 className="teach-section-heading">{t("platformsTitle")}</h2>
              <p className="teach-section-intro">{t("platformsBody")}</p>
              <ul className="platform-grid">
                {PLATFORMS.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/training/${p.slug}`} className="platform-card">
                      <span className="platform-card-name">{p.name}</span>
                      <span className="platform-card-tagline">{p.tagline}</span>
                      <span className="platform-card-meta mono">
                        {tT("courseCount", { count: p.courses.length })} · {tT("since")} {p.since}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="training-note">{tT("representativeNote")}</p>
            </div>
          </section>

          {/* Beyond the classroom (advisor/consultant implication) */}
          <section className="section teach-advisor">
            <div className="container teach-container">
              <h2 className="teach-block-title">{t("s5Title")}</h2>
              <p className="teach-block-body">{t("s5Body")}</p>
            </div>
          </section>

          {/* Subtle tool promotion */}
          <section className="section">
            <div className="container teach-container">
              <div className="teach-tools">
                <h2 className="teach-tools-title">{t("toolsTitle")}</h2>
                <p className="teach-tools-body">{t("toolsBody")}</p>
                <Link href="/tools" className="btn btn-secondary">
                  {t("toolsCta")} →
                </Link>
              </div>
            </div>
          </section>

          {/* History link */}
          <section className="section">
            <div className="container teach-container">
              <div className="teach-history">
                <div>
                  <h2 className="teach-block-title">{t("historyTitle")}</h2>
                  <p className="teach-block-body">{t("historyBody")}</p>
                </div>
                <Link href="/about/history" className="btn btn-secondary teach-history-btn">
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
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
