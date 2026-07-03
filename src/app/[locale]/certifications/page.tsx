// ============================================================================
// src/app/[locale]/certifications/page.tsx
// ----------------------------------------------------------------------------
// CERTIFICATIONS PAGE.
//
// Leads with what is CURRENT and unmistakable, instructor authorizations and
// currently-valid certifications, shown as prominent cards. Then the F5 MVP
// recognition. Then the full HISTORICAL record grouped by vendor, present for
// depth but visually secondary, with a jump link from the top. Cert names are
// rendered directly (proper nouns); only headings/labels come from i18n.
// Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import EvidenceLinks, { type EvidenceCopy } from "@/components/EvidenceLinks";
import {
  instructorAuthorizations,
  currentCertifications,
  recognition,
  historical,
  CREDLY_PROFILE,
} from "@/content/certifications/data";

export default async function CertificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("certs");
  const tNav = await getTranslations("nav");

  // Evidence-link labels, passed to the EvidenceLinks server component.
  const evidenceCopy: EvidenceCopy = {
    verify: t("verify"),
    credly: t("credly"),
    certificate: t("certificate"),
    code: t("verifyCode"),
    candidate: t("candidateId"),
  };

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
              <div className="certs-hero-links">
                <a href="#historical" className="certs-jump">
                  {t("jumpToHistorical")} ↓
                </a>
                <a
                  href={CREDLY_PROFILE}
                  className="certs-jump"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("credlyVerify")} ↗
                </a>
              </div>
            </div>
          </section>

          {/* CURRENT: instructor authorizations */}
          <section className="section">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("instructorTitle")}</h2>
                <span className="certs-badge certs-badge--current">{t("current")}</span>
              </div>
              <p className="certs-group-intro">{t("instructorIntro")}</p>
              <ul className="certs-current-grid">
                {instructorAuthorizations.map((c) => (
                  <li className="certs-current-card" key={c.name}>
                    <span className="certs-current-issuer mono">{c.issuer}</span>
                    <span className="certs-current-name">{c.name}</span>
                    <EvidenceLinks evidence={c.evidence} copy={evidenceCopy} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* CURRENT: certifications */}
          <section className="section">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("currentCertsTitle")}</h2>
                <span className="certs-badge certs-badge--current">{t("current")}</span>
              </div>
              <ul className="certs-current-grid">
                {currentCertifications.map((c) => (
                  <li className="certs-current-card" key={c.name}>
                    <span className="certs-current-issuer mono">{c.issuer}</span>
                    <span className="certs-current-name">{c.name}</span>
                    {c.detail && <span className="certs-current-detail">{c.detail}</span>}
                    {c.period && <span className="certs-current-period mono">{c.period}</span>}
                    <EvidenceLinks evidence={c.evidence} copy={evidenceCopy} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* RECOGNITION */}
          <section className="section certs-recognition-section">
            <div className="container certs-container">
              <h2 className="certs-group-title">{t("recognitionTitle")}</h2>
              {recognition.map((r) => (
                <div className="certs-recognition" key={r.name}>
                  <div className="certs-recognition-main">
                    <span className="certs-recognition-name">{r.name}</span>
                    {r.period && <span className="certs-recognition-period mono">{r.period}</span>}
                  </div>
                  {r.note && <p className="certs-recognition-note">{r.note}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* HISTORICAL, grouped by vendor */}
          <section className="section certs-historical-section" id="historical">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("historicalTitle")}</h2>
                <span className="certs-badge certs-badge--past">{t("historical")}</span>
              </div>
              <p className="certs-group-intro">{t("historicalIntro")}</p>

              <div className="certs-historical-groups">
                {historical.map((g) => (
                  <div className="certs-vendor-group" key={g.vendor}>
                    <h3 className="certs-vendor-name">{g.vendor}</h3>
                    {g.note && <p className="certs-vendor-note">{g.note}</p>}
                    <ul className="certs-vendor-list">
                      {g.items.map((c) => (
                        <li className="certs-hist-item" key={c.name}>
                          <span className="certs-hist-main">
                            <span className="certs-hist-name">{c.name}</span>
                            {c.detail && <span className="certs-hist-detail">{c.detail}</span>}
                            <EvidenceLinks evidence={c.evidence} copy={evidenceCopy} />
                          </span>
                          {c.period && <span className="certs-hist-period mono">{c.period}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
