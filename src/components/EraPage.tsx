// ============================================================================
// src/components/EraPage.tsx
// ----------------------------------------------------------------------------
// REUSABLE HISTORY-ERA PAGE — the shared presentation for all three era pages.
//
// Each era page (pre-1996, 1996-2020, 2020-present) passes its translation
// namespace key and an ordered list of section keys; this component renders the
// consistent structure: breadcrumb, hero (years + title + subtitle), intro,
// numbered body sections, a closing reflection, and a link to the next era.
//
// Keeping this DRY means the three pages stay visually and structurally
// consistent, and a change to the era layout happens in one place. Server
// component (static). All copy comes from the "history" message namespace.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export interface EraPageProps {
  /** The translation key for this era, e.g. "pre1996". */
  eraKey: string;
  /** Ordered section keys to render (e.g. ["s1", "s2", "s3", "s4"]). */
  sections: string[];
  /** The next era's slug + key for the "read next" link, or null if last. */
  next: { slug: string; key: string } | null;
}

export default async function EraPage({ eraKey, sections, next }: EraPageProps) {
  const t = await getTranslations("history");
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
          <section className="era-hero">
            <div className="container era-container">
              <Link href="/about/history" className="article-back">
                ← {t("backToHistory")}
              </Link>
              <p className="era-years mono">{t(`${eraKey}.years`)}</p>
              <h1 className="era-title">{t(`${eraKey}.title`)}</h1>
              <p className="era-subtitle">{t(`${eraKey}.subtitle`)}</p>
            </div>
          </section>

          {/* Intro */}
          <section className="section">
            <div className="container era-container">
              <p className="era-intro">{t(`${eraKey}.intro`)}</p>
            </div>
          </section>

          {/* Numbered body sections */}
          <section className="section era-body-section">
            <div className="container era-container">
              <div className="era-sections">
                {sections.map((s, i) => (
                  <div className="era-section" key={s}>
                    <span className="era-section-num mono">{String(i + 1).padStart(2, "0")}</span>
                    <div className="era-section-content">
                      <h2 className="era-section-title">{t(`${eraKey}.${s}Title`)}</h2>
                      <p className="era-section-body">{t(`${eraKey}.${s}Body`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Closing reflection */}
          <section className="section era-closer-section">
            <div className="container era-container">
              <p className="era-closer">{t(`${eraKey}.closer`)}</p>
            </div>
          </section>

          {/* Next era */}
          {next && (
            <section className="section">
              <div className="container era-container">
                <Link href={`/about/history/${next.slug}`} className="era-next">
                  <span className="era-next-label">{t("readNext")}</span>
                  <span className="era-next-years mono">{t(`${next.key}.years`)}</span>
                  <span className="era-next-title">{t(`${next.key}.title`)} →</span>
                </Link>
              </div>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
