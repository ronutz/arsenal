"use client";

// ============================================================================
// src/components/CertificationsHubSections.tsx
// ----------------------------------------------------------------------------
// COLLAPSIBLE CERTIFICATIONS HUB (PRIME directive 2026-07-21, item 2).
// Vendors render as always-visible sections in hub order; each certification
// under a vendor is a collapsible row - COLLAPSED by default, expanding to
// its exam-guide cards - with Expand-all / Collapse-all controls at the top.
// All display strings are precomputed server-side and passed as props, so
// this component owns only the open/closed state (no i18n namespace needed
// client-side). House CSS classes only; D-19 comments throughout.
// ============================================================================

import { useState } from "react";
import { Link } from "@/i18n/navigation";

export interface HubGuide {
  slug: string;
  examCode: string;
  examName: string;
  /** Precomputed badge text: "N objectives" or the in-preparation label. */
  badge: string;
  preparing: boolean;
  cta: string;
}

export interface HubCert {
  key: string;
  name: string;
  code: string;
  /** Precomputed "requires all N exams" line. */
  requiresText: string;
  renewalNote?: string | null;
  guides: HubGuide[];
}

export interface HubVendorGroup {
  vendor: string;
  vendorLabel: string;
  certs: HubCert[];
}

export default function CertificationsHubSections({
  groups,
  expandAllLabel,
  collapseAllLabel,
}: {
  groups: HubVendorGroup[];
  expandAllLabel: string;
  collapseAllLabel: string;
}) {
  // -- One open/closed flag per certification key; default all COLLAPSED
  //    (the directive's default view: vendors visible, cert titles closed).
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const allKeys = groups.flatMap((g) => g.certs.map((c) => c.key));
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(allKeys.map((k) => [k, value])));

  return (
    <>
      {/* ---- Expand / collapse all (acts on every certification row) ---- */}
      <section className="section">
        <div className="container certs-container">
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setAll(true)}>
              {expandAllLabel}
            </button>
            <button type="button" className="b64-copy" onClick={() => setAll(false)}>
              {collapseAllLabel}
            </button>
          </div>
        </div>
      </section>

      {/* ---- One always-visible section per vendor, in hub order ---- */}
      {groups.map((g) => (
        <section className="section certhub-cert" id={`vendor-${g.vendor}`} key={g.vendor}>
          <div className="container certs-container">
            <h2 className="certs-group-title">{g.vendorLabel}</h2>

            {/* ---- Collapsible certification rows, in certification order ---- */}
            {g.certs.map((cert) => {
              const isOpen = !!open[cert.key];
              return (
                <div id={cert.key} key={cert.key}>
                  <button
                    type="button"
                    className="certs-group-head certhub-guide-card"
                    aria-expanded={isOpen}
                    aria-controls={`${cert.key}-guides`}
                    onClick={() => setOpen((o) => ({ ...o, [cert.key]: !o[cert.key] }))}
                  >
                    <span className="certhub-guide-cta" aria-hidden="true">
                      {isOpen ? "\u25be" : "\u25b8"}
                    </span>
                    <span className="certhub-guide-name">{cert.name}</span>
                    <span className="certs-badge certs-badge--current mono">{cert.code}</span>
                  </button>

                  {isOpen && (
                    <div id={`${cert.key}-guides`}>
                      <p className="certs-group-intro">{cert.requiresText}</p>
                      <ul className="certhub-guide-grid">
                        {cert.guides.map((guide) => (
                          <li className="certhub-guide-card-wrap" key={guide.slug}>
                            <Link
                              href={`/certifications/${guide.slug}`}
                              className="certhub-guide-card"
                            >
                              <span className="certhub-guide-code mono">{guide.examCode}</span>
                              <span className="certhub-guide-name">{guide.examName}</span>
                              <span className="certhub-guide-meta">
                                <span
                                  className={
                                    guide.preparing
                                      ? "certhub-guide-badge certhub-guide-badge--prep"
                                      : "certhub-guide-badge"
                                  }
                                >
                                  {guide.badge}
                                </span>
                                <span className="certhub-guide-cta">{guide.cta} &#8594;</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {cert.renewalNote && <p className="certhub-renewal">{cert.renewalNote}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
