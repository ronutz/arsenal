// ============================================================================
// src/app/[locale]/study-guides/page.tsx
// ----------------------------------------------------------------------------
// THE STUDY GUIDES PAGE - the Learn-side umbrella over the site's two study
// systems, and the page the human sitemap's "Study guides" link lands on:
//
//   1. CURATED READING PATHS (src/content/study-guides/reading-paths.ts):
//      ordered walks through the Learn library, each pairing its articles
//      (titles resolved live from the article registry, so a rename can never
//      leave a stale label) with the tools a reader practices on. Guarded by
//      scripts/check-reading-paths.mjs.
//   2. CERTIFICATION STUDY GUIDES (src/content/certifications/study-guides.ts):
//      the blueprint-mapped exam guides. Rendered here as the SAME cards the
//      /certifications hub uses (shared certhub-guide-* classes), linking into
//      the per-exam pages - one card language across both entrances.
//
// Copy lives in the "studyGuidesIndex" i18n namespace (en + native pt-BR,
// English fallback elsewhere); card labels reuse "certGuides" so the two
// surfaces can never drift apart. Statically generated for every locale. No
// new CSS classes: composed entirely from the existing page-hero, section,
// certhub-guide, and category-dot vocabulary.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { ogImages } from "@/lib/og";
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import {
  getCertifications,
  getGuidesForCertification,
  objectiveCount,
} from "@/content/certifications/study-guides";
import { getArticle } from "@/lib/learn";
import { tools as toolRegistry } from "@/config/tools";
import { categoryColor } from "@/config/categoryColors";

/** Statically generated for every locale (English fallback per next-intl). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "studyGuidesIndex" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { title: alt, description: t("lede"), ...ogImages("page", "study-guides", locale, alt) };
}

export default async function StudyGuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("studyGuidesIndex");
  const tCert = await getTranslations("certGuides");
  const tTools = await getTranslations("tools");
  const tNav = await getTranslations("nav");
  const certs = getCertifications();

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero - the shared page-hero standard (D-84). */}
          <section className="certs-hero">
            <div className="container certs-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* 1. Curated reading paths - the topic-first, exam-free syllabi. */}
          <section className="section" id="reading-paths">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("pathsTitle")}</h2>
              </div>
              <p className="certs-group-intro">{t("pathsLede")}</p>

              {READING_PATHS.map((path) => {
                // Resolve every step live from the article registry: the title
                // shown is always the article's current localized title.
                const steps = path.articles
                  .map((slug) => getArticle(slug, locale))
                  .filter((a): a is NonNullable<typeof a> => a !== null);
                const pathTools = path.tools
                  .map((id) => toolRegistry.find((tl) => tl.id === id))
                  .filter((tl): tl is NonNullable<typeof tl> => Boolean(tl));
                return (
                  <div className="certhub-note" id={path.id} key={path.id}>
                    <h3 className="certhub-note-title">
                      <span
                        className="category-dot"
                        style={{ background: categoryColor(path.category) }}
                        aria-hidden
                      />{" "}
                      {t(`paths.${path.id}.title`)}{" "}
                      <span className="certhub-guide-code mono">
                        {t("articlesCount", { count: steps.length })}
                      </span>
                    </h3>
                    <p className="certhub-note-body">{t(`paths.${path.id}.lede`)}</p>
                    {/* The ordered syllabus: numbered links, reading order. */}
                    <p className="certhub-note-body">
                      <strong>{t("stepsLabel")}:</strong>
                    </p>
                    <ol>
                      {steps.map((a) => (
                        <li key={a.slug}>
                          <Link href={`/learn/${a.slug}`}>{a.title}</Link>
                        </li>
                      ))}
                    </ol>
                    {/* The practice bench: the tools this path exercises. */}
                    {pathTools.length > 0 && (
                      <p className="certhub-note-body">
                        <strong>{t("practiceLabel")}:</strong>{" "}
                        {pathTools.map((tl, i) => (
                          <span key={tl.id}>
                            {i > 0 && " · "}
                            <Link href={tl.href}>{tTools(`${tl.id}.name`)}</Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Certification study guides - the same cards as /certifications. */}
          <section className="section" id="certification-guides">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("certTitle")}</h2>
              </div>
              <p className="certs-group-intro">{t("certLede")}</p>

              {certs.map((cert) => {
                const guides = getGuidesForCertification(cert.key);
                return (
                  <div key={cert.key}>
                    <p className="certs-group-intro">
                      <strong>{cert.name}</strong>{" "}
                      <span className="certs-badge certs-badge--current mono">{cert.code}</span>
                    </p>
                    <ul className="certhub-guide-grid">
                      {guides.map((g) => {
                        const n = objectiveCount(g);
                        return (
                          <li className="certhub-guide-card-wrap" key={g.slug}>
                            <Link href={`/certifications/${g.slug}`} className="certhub-guide-card">
                              <span className="certhub-guide-code mono">{g.examCode}</span>
                              <span className="certhub-guide-name">{g.examName}</span>
                              <span className="certhub-guide-meta">
                                {g.status === "preparing" ? (
                                  <span className="certhub-guide-badge certhub-guide-badge--prep">
                                    {tCert("inPreparation")}
                                  </span>
                                ) : (
                                  <span className="certhub-guide-badge">
                                    {tCert("objectivesCount", { count: n })}
                                  </span>
                                )}
                                <span className="certhub-guide-cta">{tCert("openGuide")} &#8594;</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}

              <p>
                <Link className="btn btn-secondary" href="/certifications">
                  {t("certAllCta")} &#8594;
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
