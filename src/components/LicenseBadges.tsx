// ============================================================================
// src/components/LicenseBadges.tsx
// ----------------------------------------------------------------------------
// THE OPEN-SOURCE / LICENSE BADGES.
//
// Three hand-authored, SELF-HOSTED, inline SVG marks that declare how the
// project is licensed once it is opened:
//   - Open Source   (general status: the project is open source)
//   - Apache-2.0    (the CODE license; SPDX id Apache-2.0)
//   - CC BY 4.0     (the CONTENT license; SPDX id CC-BY-4.0)
//
// WHY HAND-AUTHORED INLINE SVG (not vendored PNGs or shields.io):
//   * The site self-hosts everything; its CSP is script-src 'self' /
//     style-src 'self', so an external badge host (shields.io, a CC CDN) would
//     be blocked and would leak a request. Inline SVG is same-origin by nature.
//   * Inline SVG inherits the design tokens (currentColor + CSS custom
//     properties), so the badges theme with the rest of the site across all six
//     themes, and stay crisp at any size. A raster badge cannot do either.
//   * Correctness/trademark: Apache has no "license logo" — the ASF feather is
//     the FOUNDATION's trademark, and using it to indicate a license can imply
//     ASF endorsement, so the Apache mark here is a clean SPDX text badge. The
//     Creative Commons glyphs (the circled "CC" and the circled attribution
//     figure) are marks CC publishes FOR creators to display to indicate a CC
//     licence, so reproducing them is their intended use. "Open Source" is
//     rendered as a neutral mark rather than leaning on the OSI keyhole
//     trademark.
//
// This is a SERVER component: it renders in the static HTML with no client JS,
// which matches the rest of the site (the badges are meaningful even with
// scripting off). All visible text is passed in already-localized by the
// caller (the label/aria strings), so this file holds no copy of its own.
//
// LICENSE BASIS: Apache-2.0 (code) + CC BY 4.0 (content) — the pairing recorded
// in README.md and the one the /license page will adopt when the project is
// opened. If that decision changes, the set below is the single place to edit.
// ============================================================================

import { Link } from "@/i18n/navigation";

export interface LicenseBadgeLabels {
  /** Screen-reader/link title, e.g. "Licensing details". */
  groupAria: string;
  openSource: string; // "Open Source"
  codeLicense: string; // "Apache-2.0"
  contentLicense: string; // "CC BY 4.0"
  /** Small caption under the large row, e.g. "Code · Content". Optional. */
  caption?: string;
}

/**
 * `page`   — large badges with visible labels + caption, for the /license page.
 * `footer` — compact icon+short-label cluster, links to /license, sitewide.
 */
export default function LicenseBadges({
  variant = "page",
  labels,
}: {
  variant?: "page" | "footer";
  labels: LicenseBadgeLabels;
}) {
  const isFooter = variant === "footer";
  const cls = isFooter ? "license-badges license-badges--footer" : "license-badges";

  const badges = (
    <>
      {/* --- Open Source: an open padlock (open = open source), neutral. --- */}
      <span className="license-badge license-badge--os">
        <svg
          className="license-badge-icon"
          viewBox="0 0 24 24"
          role="img"
          aria-hidden="true"
          focusable="false"
        >
          {/* shackle, swung open to the left */}
          <path
            d="M7 10V7a5 5 0 0 1 9.6-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* body */}
          <rect x="4.5" y="10" width="11" height="9" rx="1.6" fill="currentColor" />
          {/* keyhole */}
          <circle cx="10" cy="13.6" r="1.25" fill="var(--surface-base, #020617)" />
          <rect
            x="9.35"
            y="14.2"
            width="1.3"
            height="2.6"
            rx="0.65"
            fill="var(--surface-base, #020617)"
          />
        </svg>
        <span className="license-badge-label">{labels.openSource}</span>
      </span>

      {/* --- Apache-2.0: clean SPDX text badge (no ASF feather by design). --- */}
      <span className="license-badge license-badge--apache">
        <span className="license-badge-key" aria-hidden="true">
          SPDX
        </span>
        <span className="license-badge-label">{labels.codeLicense}</span>
      </span>

      {/* --- CC BY 4.0: the Creative Commons circled marks (CC + attribution). --- */}
      <span className="license-badge license-badge--cc">
        <svg
          className="license-badge-icon license-badge-icon--cc"
          viewBox="0 0 48 24"
          role="img"
          aria-hidden="true"
          focusable="false"
        >
          {/* "CC" ring */}
          <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          {/* two lowercase c's */}
          <path
            d="M10.4 9.6a3.2 3.2 0 1 0 0 4.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M15.6 9.6a3.2 3.2 0 1 0 0 4.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* "BY" (attribution) ring: head + shoulders figure */}
          <circle cx="36" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="36" cy="8.4" r="2.1" fill="currentColor" />
          <path
            d="M31.6 17.4c0-2.9 1.9-4.6 4.4-4.6s4.4 1.7 4.4 4.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="license-badge-label">{labels.contentLicense}</span>
      </span>
    </>
  );

  if (isFooter) {
    // Compact cluster that is itself the link to the licensing page.
    return (
      <Link href="/license" className={cls} aria-label={labels.groupAria}>
        {badges}
      </Link>
    );
  }

  // Large row for the /license page, with an optional caption underneath.
  return (
    <div className={cls} role="group" aria-label={labels.groupAria}>
      <div className="license-badges-row">{badges}</div>
      {labels.caption ? <p className="license-badges-caption">{labels.caption}</p> : null}
    </div>
  );
}
