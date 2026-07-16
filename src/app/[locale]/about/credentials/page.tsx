// ============================================================================
// src/app/[locale]/about/credentials/page.tsx
// ----------------------------------------------------------------------------
// CREDENTIALS PAGE (Rodolfo's own certifications, recognition, and history).
//
// Moved here from the former top-level /certifications route (2026-07-09): the
// top-level Certifications section is now a candidate-facing STUDY-AID hub, so
// Rodolfo's OWN credentials live under About, alongside /about/vendors and
// /about/history, reached from the About page's credentials card.
//
// Content is a verbatim move of the former page: it leads with what is CURRENT
// (instructor authorizations and currently-valid certifications) as prominent
// cards, then F5 MVP recognition, then the full HISTORICAL record grouped by
// vendor. Cert names render directly (proper nouns); only headings/labels come
// from i18n. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import EvidenceLinks, { EvidenceCodes, type EvidenceCopy } from "@/components/EvidenceLinks";
import {
  instructorAuthorizations,
  recognition,
  getFullRecord,
  CREDLY_PROFILE,
} from "@/content/certifications/data";

export default async function CredentialsPage({
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

  // The merged full record: current + past certs + training, grouped by vendor.
  const fullRecord = getFullRecord();

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
              {/* Back to About: this page now lives under the About section. */}
              <Link href="/about" className="article-back">
                ← {t("backToAbout")}
              </Link>
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
              {/* Pointer to the candidate study-aid hub (the repurposed
                  top-level Certifications section). */}
              <p className="certs-studyguides-pointer">
                <Link href="/certifications" className="certs-studyguides-link">
                  {t("studyGuidesPointer")} →
                </Link>
              </p>
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
                    {c.noCertificate && (
                      <span className="certs-current-note">{t("noCertificateNote")}</span>
                    )}
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
                  <EvidenceLinks evidence={r.evidence} copy={evidenceCopy} />
                </div>
              ))}
            </div>
          </section>

          {/* HISTORICAL, grouped by vendor */}
          <section className="section certs-historical-section" id="historical">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("historicalTitle")}</h2>
                <span className="certs-badge certs-badge--current">{t("current")}</span>
                <span className="certs-badge certs-badge--past">{t("historical")}</span>
              </div>
              <p className="certs-group-intro">{t("historicalIntro")}</p>

              {/* Vendor jump buttons over the merged record. */}
              {(() => {
                const anchor = (v: string) =>
                  `cert-${v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
                const record = fullRecord;

                // One item row. `current` drives the amber date treatment.
                const renderItem = (c: (typeof record)[number]["pastCerts"][number]) => (
                  <li
                    className="certs-hist-item"
                    data-current={c.current ? "true" : undefined}
                    key={c.name}
                  >
                    <span className="certs-hist-main">
                      <span className="certs-hist-name">{c.name}</span>
                      {(c.detail || c.evidence?.verifyId || c.evidence?.candidateId) && (
                        <span className="certs-hist-sub">
                          {c.detail && <span className="certs-hist-detail">{c.detail}</span>}
                          <EvidenceCodes evidence={c.evidence} copy={evidenceCopy} />
                        </span>
                      )}
                    </span>
                    <span className="certs-hist-side">
                      {c.period && (
                        <span className="certs-hist-period mono">{c.period}</span>
                      )}
                      <EvidenceLinks evidence={c.evidence} copy={evidenceCopy} />
                    </span>
                  </li>
                );

                return (
                  <>
                    <nav className="certs-vendor-jumps" aria-label={t("historicalTitle")}>
                      {record.map((g) => (
                        <a key={g.vendor} href={`#${anchor(g.vendor)}`} className="certs-vendor-jump">
                          {g.vendor}
                        </a>
                      ))}
                    </nav>

                    <div className="certs-historical-groups">
                      {record.map((g) => (
                        <div
                          className="certs-vendor-group"
                          key={g.vendor}
                          id={anchor(g.vendor)}
                        >
                          <h3 className="certs-vendor-name">{g.vendor}</h3>

                          {/* Currently-valid certifications (amber dates) followed by
                              past certifications with no era, in ONE list. They used to
                              be two sibling <ul>s, but the row divider is a border-top
                              on .certs-hist-item with :first-child exempt, so the first
                              past cert (e.g. F5-CTP right after F5-CA) lost its divider
                              at the list boundary. One merged list = dividers between
                              every adjacent pair; data-current still styles the rows. */}
                          {(g.currentCerts.length > 0 || g.pastCerts.length > 0) && (
                            <ul className="certs-vendor-list">
                              {g.currentCerts.map(renderItem)}
                              {g.pastCerts.map(renderItem)}
                            </ul>
                          )}

                          {/* Past certifications grouped by era (Fortinet). */}
                          {g.eraCerts.map((e) => (
                            <div className="certs-era" key={e.era}>
                              <h4 className="certs-era-heading">{e.era}</h4>
                              <ul className="certs-vendor-list">
                                {e.items.map(renderItem)}
                              </ul>
                            </div>
                          ))}

                          {/* Training-course completions, in their own sub-section. */}
                          {g.training.length > 0 && (
                            <div className="certs-training">
                              <h4 className="certs-training-heading">{t("trainingLabel")}</h4>
                              <ul className="certs-vendor-list">
                                {g.training.map(renderItem)}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* Fortinet certification-program transition note, placed at the
                  foot of the record (moved here from the Fortinet group so it
                  reads as a closing footnote rather than a top-of-list banner). */}
              <aside className="certs-footnote">
                <h3 className="certs-footnote-title">{t("fortinetTransitionLabel")}</h3>
                <p className="certs-footnote-text">{t("fortinetTransitionNote")}</p>
              </aside>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
