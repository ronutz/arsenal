// ============================================================================
// src/app/[locale]/certifications/page.tsx
// ----------------------------------------------------------------------------
// CERTIFICATION STUDY-AID HUB (candidate-facing).
//
// The top-level Certifications section was repurposed on 2026-07-09: it no
// longer shows Rodolfo's own credentials (those moved to /about/credentials).
// It now serves certification CANDIDATES with blueprint-guided study maps.
//
// The hub lists each certification (a credential earned by passing one or more
// exams) and, under it, one card per exam study guide. Guides whose official
// blueprint has not yet been transcribed show an "in preparation" badge; the
// guide page itself renders an honest placeholder until the blueprint is mapped.
//
// See the ethics guardrail in src/content/certifications/study-guides.ts: these
// guides map PUBLISHED blueprint objectives to learning resources and never
// contain exam questions or dumps. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TrainingCta from "@/components/TrainingCta";
import {
  getCertifications,
  getGuidesForCertification,
  objectiveCount,
} from "@/content/certifications/study-guides";

export default async function CertificationsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("certGuides");
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
          {/* Hero */}
          <section className="certs-hero">
            <div className="container certs-container">
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* Study philosophy + ethics stance */}
          <section className="section">
            <div className="container certs-container certhub-notes">
              <div className="certhub-note">
                <h2 className="certhub-note-title">{t("philosophyTitle")}</h2>
                <p className="certhub-note-body">{t("philosophyBody")}</p>
              </div>
              <div className="certhub-note certhub-note--ethics">
                <h2 className="certhub-note-title">{t("ethicsTitle")}</h2>
                <p className="certhub-note-body">{t("ethicsBody")}</p>
              </div>
            </div>
          </section>

          {/* One section per certification, with its exam guides as cards. */}
          {certs.map((cert) => {
            const guides = getGuidesForCertification(cert.key);
            return (
              <section className="section certhub-cert" id={cert.key} key={cert.key}>
                <div className="container certs-container">
                  <div className="certs-group-head">
                    <h2 className="certs-group-title">{cert.name}</h2>
                    <span className="certs-badge certs-badge--current mono">{cert.code}</span>
                  </div>
                  <p className="certs-group-intro">
                    {t("requiresAll", { count: cert.examSlugs.length })}
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
                                  {t("inPreparation")}
                                </span>
                              ) : (
                                <span className="certhub-guide-badge">
                                  {t("objectivesCount", { count: n })}
                                </span>
                              )}
                              <span className="certhub-guide-cta">{t("openGuide")} &#8594;</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {cert.renewalNote && (
                    <p className="certhub-renewal">{cert.renewalNote}</p>
                  )}
                </div>
              </section>
            );
          })}

          {/* Instructor-led training CTA (subtle): high-intent candidates can
              learn these live with an authorized instructor at Red Education. */}
          <section className="section">
            <div className="container certs-container">
              <TrainingCta />
            </div>
          </section>

          {/* Pointer to Rodolfo's own credentials (moved under About). */}
          <section className="section">
            <div className="container certs-container">
              <p className="certs-studyguides-pointer">
                <Link href="/about/credentials" className="certs-studyguides-link">
                  {t("credentialsPointer")} &#8594;
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
