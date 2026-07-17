// ============================================================================
// src/app/[locale]/about/history/pre-1996/page.tsx
// ----------------------------------------------------------------------------
// ERA PAGE: Before 1996 — "The curiosity". This era gets a BESPOKE layout
// (the other two eras use the shared <EraPage>): the pre-1996 story is the
// richest — ham radio, the national micros, the BBS years, the phreaking
// scene, and the first academic internet — so it is told as a dated timeline
// map, a seven-movement narrative, and a "field guide" of era terms (two of
// which open into the glossary's phone-phreaking lineage). All copy lives in
// the "history.pre1996" message namespace; EN + pt-BR authored natively, the
// other locales fall back per-key. Server component (static).
//
// The phreaking material is historical: the analog phone network, the token
// payphone (orelhão/fichas), and single-line BBSs are decades gone, so the
// era is documented as memoir, not as instruction for any live system.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

interface Beat {
  years: string;
  where: string;
  what: string;
}

interface Movement {
  title: string;
  body: string[];
}

// Field-guide cards. `id` keys the copy in history.pre1996.field.<id>;
// `slug`, when present, links the card to that glossary entry. The slugs are
// structural (not translated) and verified to exist in the glossary.
const FIELD_TERMS: { id: string; slug?: string }[] = [
  { id: "bbs" },
  { id: "sysop" },
  { id: "baud" },
  { id: "ansi" },
  { id: "door" },
  { id: "fidonet" },
  { id: "qsl" },
  { id: "orelhao" },
  { id: "phreaking", slug: "captain-crunch" },
  { id: "bluebox", slug: "blue-box" },
  { id: "wardialing" },
  { id: "shell" },
];

export default async function Pre1996Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("history");
  const tNav = await getTranslations("nav");

  const beats = t.raw("pre1996.tl") as Beat[];
  const movements = t.raw("pre1996.mv") as Movement[];

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="era-hero">
            <div className="container era-container">
              <Link href="/about/history" className="article-back">
                ← {t("backToHistory")}
              </Link>
              <p className="era-years mono">{t("pre1996.years")}</p>
              <h1 className="era-title">{t("pre1996.title")}</h1>
              <p className="era-subtitle">{t("pre1996.subtitle")}</p>
            </div>
          </section>

          {/* Intro */}
          <section className="section">
            <div className="container era-container">
              <p className="era-intro">{t("pre1996.intro")}</p>
            </div>
          </section>

          {/* Timeline map — the dated skeleton the narrative then expands */}
          <section className="section">
            <div className="container era-container">
              <h2 className="era-section-title">{t("pre1996.mapTitle")}</h2>
              <p className="era-section-body">{t("pre1996.mapNote")}</p>
              <ol className="about-timeline">
                {beats.map((b) => (
                  /* Key combines years + where: two beats can share a year
                     (e.g. the 1991 sysop and 1991 academic-internet beats). */
                  <li className="about-era" key={`${b.years} ${b.where}`}>
                    <span className="about-era-years mono">{b.years}</span>
                    <span className="about-era-where">{b.where}</span>
                    <span className="about-era-what">{b.what}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Narrative — seven numbered movements, multi-paragraph bodies */}
          <section className="section era-body-section">
            <div className="container era-container">
              <h2 className="era-section-title">{t("pre1996.storyTitle")}</h2>
              <div className="era-sections">
                {movements.map((m, i) => (
                  <div className="era-section" key={i}>
                    <span className="era-section-num mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="era-section-content">
                      <h3 className="era-section-title">{m.title}</h3>
                      {m.body.map((p, j) => (
                        <p className="era-section-body" key={j}>
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Field guide — era vocabulary; two cards open into the glossary */}
          <section className="section">
            <div className="container era-container">
              <h2 className="era-section-title">{t("pre1996.fieldTitle")}</h2>
              <p className="era-section-body">{t("pre1996.fieldIntro")}</p>
              <div className="about-cred-grid">
                {FIELD_TERMS.map(({ id, slug }) => {
                  const inner = (
                    <>
                      <span className="about-cred-eyebrow">
                        {t(`pre1996.field.${id}.tag`)}
                      </span>
                      <span className="about-cred-title">
                        {t(`pre1996.field.${id}.term`)}
                      </span>
                      <span className="about-cred-desc">
                        {t(`pre1996.field.${id}.desc`)}
                      </span>
                      {slug && (
                        <span className="about-cred-eyebrow">
                          {t("pre1996.fieldMore")}
                        </span>
                      )}
                    </>
                  );
                  return slug ? (
                    <Link
                      href={`/glossary/${slug}`}
                      className="about-cred-card"
                      key={id}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="about-cred-card" key={id}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Closing reflection */}
          <section className="section era-closer-section">
            <div className="container era-container">
              <p className="era-closer">{t("pre1996.closer")}</p>
            </div>
          </section>

          {/* Next era */}
          <section className="section">
            <div className="container era-container">
              <Link href="/about/history/1996-2020" className="era-next">
                <span className="era-next-label">{t("readNext")}</span>
                <span className="era-next-years mono">
                  {t("era19962020.years")}
                </span>
                <span className="era-next-title">
                  {t("era19962020.title")} →
                </span>
              </Link>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
