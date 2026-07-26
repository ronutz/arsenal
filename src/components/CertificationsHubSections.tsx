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
  /** Set when the vendor has not released the exam yet — a DIFFERENT fact from
   *  "we have not transcribed the blueprint yet". */
  availabilityNote?: string | null;
  /** Set when a version of this exam is being withdrawn (PRIME 2026-07-26).
   *  Shown on the card because a deadline changes what to book. */
  retirement?: { exam: string; until: string; replacedBy: string | null } | null;
  cta: string;
}

export interface HubCert {
  key: string;
  name: string;
  code: string;
  /** Precomputed "requires all N exams" line. */
  /** Null when requirementMode is "custom" and the note carries the rule. */
  requiresText: string | null;
  /** Official wording for a requirement the mode cannot express (NSE 8's
   *  "Core practical exam AND one elective"). Null when there is nothing extra. */
  requirementNote?: string | null;
  /** Certifications that must be ACTIVE before this one can be earned. */
  prerequisites?: string[];
  prerequisitesLabel?: string;
  retiringLabel?: string;
  /** The vendor's own page for this certification, so requirements can be
   *  checked against the source rather than trusted to this site. */
  sourceUrl?: string | null;
  sourceLabel?: string;
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

      {/* ---- Expand / collapse all: placed directly ABOVE the certifications
             list rather than above the vendor cards (PRIME 2026-07-24), so the
             controls sit with the thing they control instead of floating at
             the top of the page. Acts on vendors AND certification rows. ---- */}
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
                      {cert.requiresText && (
                        <p className="certs-group-intro">{cert.requiresText}</p>
                      )}
                      {/* Requirements sit with the certification LEVEL, not with
                          the individual exams, because that is the unit a
                          candidate plans against (PRIME 2026-07-25). */}
                      {cert.requirementNote && (
                        <p className="certs-group-intro">{cert.requirementNote}</p>
                      )}
                      {cert.sourceUrl && (
                        <p className="certs-group-intro">
                          <a
                            className="certhub-guide-cta"
                            href={cert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {cert.sourceLabel} &#8599;
                          </a>
                        </p>
                      )}
                      {cert.prerequisites && cert.prerequisites.length > 0 && (
                        <p className="certs-group-intro">
                          <strong>{cert.prerequisitesLabel}:</strong>{" "}
                          {cert.prerequisites.join(" · ")}
                        </p>
                      )}
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
                                {/* Availability caveat sits on the CARD so a
                                    reader scanning a level sees which exams
                                    cannot be sat yet without opening each one. */}
                                {guide.retirement && (
                                  <p className="certhub-guide-badge certhub-guide-badge--prep">
                                    {cert.retiringLabel} {guide.retirement.until}
                                  </p>
                                )}
                                {guide.availabilityNote && (
                                  <span className="certhub-guide-badge certhub-guide-badge--prep">
                                    {guide.availabilityNote}
                                  </span>
                                )}
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
