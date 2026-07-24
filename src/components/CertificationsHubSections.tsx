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
  /** One-line summary shown on the vendor card at the top of the hub. */
  vendorBlurb: string;
  /** Precomputed "N certifications - M exam guides" line for the card. */
  vendorCount: string;
  certs: HubCert[];
}

export default function CertificationsHubSections({
  groups,
  expandAllLabel,
  collapseAllLabel,
  vendorsHeading,
}: {
  groups: HubVendorGroup[];
  expandAllLabel: string;
  collapseAllLabel: string;
  /** Heading above the vendor overview cards. */
  vendorsHeading: string;
}) {
  // -- Open/closed state now covers BOTH levels (PRIME 2026-07-24):
  //    a flag per VENDOR (`vendor-<key>`) and a flag per CERTIFICATION
  //    (`<cert.key>`). Both default to COLLAPSED, so a reader first sees
  //    every vendor at a glance and expands only the one they care about.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Expand-all / collapse-all must act on EVERY collapsible on the page,
  // vendors and certifications alike, or "expand all" would leave the
  // certification rows hidden inside a newly opened vendor.
  const allKeys = [
    ...groups.map((g) => `vendor-${g.vendor}`),
    ...groups.flatMap((g) => g.certs.map((c) => c.key)),
  ];
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

      {/* ---- Vendor overview cards (PRIME 2026-07-24): every vendor the hub
             covers, visible at a glance before anything is expanded. Clicking
             a card opens that vendor's section and scrolls to it, so the cards
             double as a table of contents. ---- */}
      <section className="section">
        <div className="container certs-container">
          <h2 className="certs-group-title">{vendorsHeading}</h2>
          <ul className="certhub-guide-grid">
            {groups.map((g) => (
              <li className="certhub-guide-card-wrap" key={`card-${g.vendor}`}>
                <a
                  href={`#vendor-${g.vendor}`}
                  className="certhub-guide-card"
                  onClick={() => setOpen((o) => ({ ...o, [`vendor-${g.vendor}`]: true }))}
                >
                  <span className="certhub-guide-name">{g.vendorLabel}</span>
                  <span className="certhub-guide-meta">
                    <span className="certhub-guide-badge">{g.vendorCount}</span>
                  </span>
                  <span className="certs-group-intro">{g.vendorBlurb}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- One COLLAPSIBLE section per vendor, in hub order ---- */}
      {groups.map((g) => {
        const vKey = `vendor-${g.vendor}`;
        const vOpen = !!open[vKey];
        return (
        <section className="section certhub-cert" id={vKey} key={g.vendor}>
          <div className="container certs-container">
            {/* Vendor title is now the collapse control itself. */}
            <button
              type="button"
              className="certhub-cert-row"
              aria-expanded={vOpen}
              aria-controls={`${vKey}-certs`}
              onClick={() => setOpen((o) => ({ ...o, [vKey]: !o[vKey] }))}
            >
              <span className="certhub-guide-cta" aria-hidden="true">
                {vOpen ? "\u25be" : "\u25b8"}
              </span>
              <h2 className="certs-group-title">{g.vendorLabel}</h2>
              <span className="certs-badge certs-badge--current mono">{g.vendorCount}</span>
            </button>

            {/* ---- Collapsible certification rows, in certification order ---- */}
            {vOpen && (
            <div id={`${vKey}-certs`}>
            {g.certs.map((cert) => {
              const isOpen = !!open[cert.key];
              return (
                <div id={cert.key} key={cert.key}>
                  <button
                    type="button"
                    className="certhub-cert-row"
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
            )}
          </div>
        </section>
        );
      })}
    </>
  );
}
