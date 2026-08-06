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
  getPracticeArticles,
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
  const total = getPracticeArticles(locale).length;

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
              <ul className="course-list">
                {PRACTICE_STANCES.map((s) => (
                  <li key={s}>
                    <strong>{t(`stance.${s}.label`)}</strong>
                    {" — "}
                    {t(`stance.${s}.note`)}{" "}
                    <span className="mono">({counts[s]})</span>
                  </li>
                ))}
              </ul>
              <p className="vendor-note-body">
                {t("stanceWhy")}
              </p>
            </div>
          </section>

          {/* THE SPINE. Parts in order, each with its framing sentence, each
              article showing its THESIS rather than a summary - because a
              scanning reader is matching a question to an argument, and a
              summary answers a different need. */}
          {groups.map(({ part, articles }) => (
            <section className="section" key={part}>
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
                        className="learn-card"
                      >
                        <h3 className="learn-card-title">{a.title}</h3>
                        <p className="vendor-note-body mono">
                          {t(`stance.${a.stance}.label`)}
                        </p>
                        <p className="learn-card-summary">{a.thesis}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          {/* PROGRESS, STATED HONESTLY. The roster is 48 and the corpus is not
              finished. Saying so is better than an index that silently implies
              completeness, and it is the same instinct as the stance field. */}
          <section className="section">
            <div className="container section-narrow">
              <h2 className="section-title">{t("progressTitle")}</h2>
              <p className="section-body">
                {t("progressBody", { published: total, planned: 48 })}
              </p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
