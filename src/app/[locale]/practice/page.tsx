// ============================================================================
// src/app/[locale]/practice/page.tsx
// ----------------------------------------------------------------------------
// THE PRACTICE — the index.
//
// THE ORGANISING PRINCIPLE, AND WHY IT IS NOT A LIST OF ARTICLES. The industry
// timeline works because its order is a FACT rather than a judgement: founding
// year. Nobody has to decide where a new company goes. This index needs the
// same property, and it has it - the six parts follow the life of a system,
// from before it exists to after it is gone, and the work itself says which
// part an article belongs to.
//
// That gives a reader two entirely different ways in, both of which have to
// work:
//
//   READING - start at the top and go down. The parts are in order, each with
//   its own framing sentence, and somebody who reads the whole thing has been
//   walked through the arc of a system's life. This is the mode that makes the
//   corpus worth writing rather than worth searching.
//
//   SEARCHING - arrive from a search engine holding one question, land on one
//   article, and leave. This is most traffic, and it is why every article has
//   its thesis rendered on the index: a reader scanning for "the one about
//   escalation" is scanning theses, not titles.
//
// THE STANCE COUNTS ARE COMPUTED, never written down. Same discipline as the
// industry tag chips: a count and its contents come from one pass over the same
// records, so the page cannot claim a number it then contradicts.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import {
  practiceByPart,
  practiceStanceCounts,
  PRACTICE_STANCES,
} from "@/lib/practice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "practice" });
  return { ...ogImages("page", "practice", locale, t("title")) };
}

export default async function PracticeIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("practice");
  const tNav = await getTranslations("nav");

  const groups = practiceByPart(locale);
  const counts = practiceStanceCounts(locale);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="section">
            <div className="container section-narrow">
              <Breadcrumbs
                ariaLabel={tNav("breadcrumb")}
                items={[
                  { label: tNav("home"), href: "/" },
                  { label: t("navLabel") },
                ]}
              />
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* HOW TO READ IT. Two paragraphs that pay for themselves: a reader
              who understands the spine reads more than one article, and a
              reader who does not reads exactly the one they arrived for. */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("howTitle")}</h2>
              <p className="section-body">{t("howBody")}</p>
              <p className="section-body">{t("howSearch")}</p>
            </div>
          </section>

          {/* THE STANCE LEGEND. This belongs on the index rather than only on
              the articles, because it is the corpus's central honesty claim and
              a reader should meet it before the first article rather than
              inside one. Counts are computed. */}
          <section className="section section-accent">
            <div className="container section-narrow">
              <h2 className="section-title">{t("stanceTitle")}</h2>
              <p className="section-body">{t("stanceIntro")}</p>
              {/* Cards rather than list items: this is the corpus's central
                  honesty claim, and it was rendering as a bare bullet. The
                  accent descends with the strength of the claim being made
                  (practised → witnessed → documented), which is the one true
                  structural fact about the trio. Counts are computed. */}
              <ul className="stance-legend">
                {PRACTICE_STANCES.map((s) => (
                  <li
                    key={s}
                    className="stance-card"
                    style={
                      {
                        "--stance-accent":
                          s === "practised"
                            ? "var(--accent-primary)"
                            : s === "witnessed"
                              ? "var(--accent-amber)"
                              : "var(--text-tertiary)",
                      } as React.CSSProperties
                    }
                  >
                    <span className="stance-count">{t("stance.count", { n: counts[s] })}</span>
                    <span className="stance-label">{t(`stance.${s}.label`)}</span>
                    <p className="stance-note">{t(`stance.${s}.note`)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* PART INDEX (PRIME 2026-08-09). A jump index to the six parts, placed
              between the stance legend and the spine.

              NO NEW MESSAGE KEYS. `parts.<part>.title`, `.note` and the plural
              `stance.count` already exist and already carry the right meaning in
              all sixteen locales, so this adds navigation without adding
              translation debt. The numbered `.title` form ("VI. The craft") is
              used deliberately over `.short` - in an index the numeral IS the
              information, because the spine's order is its argument.

              Derived from `groups`, the same source the spine renders from, so a
              part cannot appear here and be missing below, or vice versa. Empty
              parts are absent from `groups` and therefore absent here without a
              second rule needing to say so. */}
          <section className="section">
            <div className="container">
              {/* <details open> rather than a JavaScript disclosure, on purpose:
                  it collapses and expands with no hydration, it is keyboard- and
                  screen-reader-accessible for free, it prints expanded, and it
                  still works if the bundle never loads. `open` gives PRIME's
                  "all expanded by default" as a property of the markup rather
                  than of a script that has to run first.

                  The part title carries an anchor link beside it rather than
                  being one: a <summary> already owns the click, so a nested link
                  would fight it. The small arrow jumps to the same part in the
                  spine below, where the theses are. */}
              <nav className="practice-part-nav" aria-label={t("title")}>
                {groups.map(({ part, articles }) => (
                  <details className="practice-part-details" key={part} open>
                    <summary className="practice-part-summary">
                      <span className="practice-part-card-title">
                        {t(`parts.${part}.title`)}
                      </span>
                      <span className="practice-part-card-count mono">
                        {t("stance.count", { n: articles.length })}
                      </span>
                    </summary>
                    <p className="practice-part-card-note">
                      {t(`parts.${part}.note`)}{" "}
                      <a
                        className="practice-part-jump"
                        href={`#part-${part}`}
                        aria-label={t(`parts.${part}.title`)}
                      >
                        &#8595;
                      </a>
                    </p>
                    <ol className="practice-part-list">
                      {articles.map((a) => (
                        <li key={a.slug}>
                          <Link href={`/practice/${a.slug}`}>{a.title}</Link>
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </nav>
            </div>
          </section>

          {/* THE SPINE. Parts in order, each with its framing sentence, each
              article showing its THESIS rather than a summary - because a
              scanning reader is matching a question to an argument, and a
              summary answers a different need. */}
          {groups.map(({ part, articles }) => (
            <section
              className="section practice-part-section"
              id={`part-${part}`}
              key={part}
            >
              <div className="container">
                <div className="vendor-divider">
                  <h2 className="vendor-divider-title">
                    {t(`parts.${part}.title`)}
                  </h2>
                  <p className="vendor-divider-note">
                    {t(`parts.${part}.note`)}
                  </p>
                </div>
                <ul className="learn-grid">
                  {articles.map((a) => (
                    <li key={a.slug} className="learn-grid-item">
                      <Link
                        href={`/practice/${a.slug}`}
                        className="learn-card practice-card"
                      >
                        {/* Initial-only pill, upper right, coloured with the same
                            three values the stance legend uses above - so the
                            legend teaches the colour once and every card after
                            it is readable without a key.

                            title= gives the full word on hover; aria-label gives
                            it to a screen reader, because a bare "P" is not a
                            word. The letter is decorative to assistive tech and
                            the label carries the meaning. */}
                        <span
                          className="practice-stance-pill"
                          title={t(`stance.${a.stance}.label`)}
                          aria-label={t(`stance.${a.stance}.label`)}
                          style={
                            {
                              "--stance-accent":
                                a.stance === "practised"
                                  ? "var(--accent-primary)"
                                  : a.stance === "witnessed"
                                    ? "var(--accent-amber)"
                                    : "var(--text-tertiary)",
                            } as React.CSSProperties
                          }
                        >
                          <span aria-hidden="true">
                            {t(`stance.${a.stance}.label`).charAt(0)}
                          </span>
                        </span>
                        <h3 className="learn-card-title">{a.title}</h3>
                        <p className="learn-card-summary">{a.thesis}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
