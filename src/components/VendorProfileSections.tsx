// ============================================================================
// src/components/VendorProfileSections.tsx
// ----------------------------------------------------------------------------
// RICH VENDOR PROFILE SECTIONS - renders a VendorProfile (founding stories,
// founders, converged timeline, flagship products, innovations, markets,
// analyst standing) inside a vendor page. Used first by the partner/[slug]
// pages; the legacy career vendor pages migrate to it in later rounds.
//
// The timeline intentionally reuses the .lineage-* ledger styling from the
// AcquisitionTimeline so the whole vendor system shares one visual language:
// a year rail, a spine, and event cards, with sourceNote honesty preserved.
// Pure presentational, server-safe; no vendor logos or brand assets.
// ============================================================================

import { Link } from "@/i18n/navigation";
import type { VendorProfile } from "@/content/vendors/profile-types";

export interface ProfileLabels {
  founding: string;
  /** Chip text for timeline events marked personal (e.g. "Rodolfo's chapter"). */
  personalChip: string;
  founders: string;
  timeline: string;
  products: string;
  innovations: string;
  markets: string;
  analyst: string;
}

export default function VendorProfileSections({
  profile,
  labels,
}: {
  profile: VendorProfile;
  labels: ProfileLabels;
}) {
  // Oldest-first: a vendor's story reads as a chronological history (founding
  // era -> milestones -> today), matching the career-vendor list order and the
  // forward name-evolution in the lineage rail.
  const events = [...profile.timeline].sort((a, b) => a.year - b.year);

  return (
    <div className="vprofile">
      {/* Founding stories - one block per converging company */}
      <section className="vprofile-block">
        <h2 className="vprofile-title">{labels.founding}</h2>
        <div className="vprofile-foundings">
          {profile.foundings.map((f) => (
            <article className="vprofile-founding" key={f.company}>
              <header className="vprofile-founding-head">
                <span className="vprofile-founding-year mono">{f.year}</span>
                <div>
                  <h3 className="vprofile-founding-company">{f.company}</h3>
                  <p className="vprofile-founding-meta">
                    {f.place} · <span className="vprofile-founders-label">{labels.founders}:</span>{" "}
                    {f.founders.join(", ")}
                  </p>
                </div>
              </header>
              <p className="vprofile-founding-story">{f.story}</p>
              {f.sourceNote && <p className="lineage-deal-note">{f.sourceNote}</p>}
            </article>
          ))}
        </div>
      </section>

      {/* Converged corporate timeline - reuses the lineage ledger styling */}
      <section className="vprofile-block">
        <h2 className="vprofile-title">{labels.timeline}</h2>
        <ol className="lineage-timeline">
          {events.map((e, i) => (
            <li
              className={e.personal ? "lineage-deal lineage-deal--personal" : "lineage-deal"}
              key={`${e.year}-${e.title}`}
              data-first={i === 0 ? "true" : undefined}
            >
              <div className="lineage-deal-rail" aria-hidden="true">
                <span className="lineage-deal-year mono">{e.year}</span>
                <span className="lineage-deal-dot" />
              </div>
              <div className="lineage-deal-card">
                <div className="lineage-deal-top">
                  <span className="lineage-deal-name">{e.title}</span>
                  {/* Personal-involvement marker: the localized chip makes the
                      career connection findable at a glance (2026-07-16). */}
                  {e.personal && (
                    <span className="lineage-deal-chip mono">{labels.personalChip}</span>
                  )}
                </div>
                <p className="lineage-deal-what">{e.detail}</p>
                {e.sourceNote && <p className="lineage-deal-note">{e.sourceNote}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Flagship products */}
      <section className="vprofile-block">
        <h2 className="vprofile-title">{labels.products}</h2>
        <ul className="vprofile-products">
          {profile.products.map((p) => (
            <li className="vprofile-product" key={p.name}>
              <span className="vprofile-product-name">{p.name}</span>
              <span className="vprofile-product-what">{p.what}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Key innovations */}
      <section className="vprofile-block">
        <h2 className="vprofile-title">{labels.innovations}</h2>
        <ul className="vprofile-innovs">
          {profile.innovations.map((n) => (
            <li className="vprofile-innov" key={n.title}>
              <span className="vprofile-innov-title">{n.title}</span>
              <span className="vprofile-innov-detail">{n.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Markets */}
      <section className="vprofile-block">
        <h2 className="vprofile-title">{labels.markets}</h2>
        <div className="partner-body">
          {profile.markets.map((m, i) => (
            <p className="partner-body-p" key={i}>{m}</p>
          ))}
        </div>
      </section>

      {/* Analyst standing */}
      <section className="vprofile-block">
        <h2 className="vprofile-title">{labels.analyst}</h2>
        <ul className="partner-awards-list">
          {profile.analyst.map((a) => (
            <li className="partner-award" key={a}>{a}</li>
          ))}
        </ul>
      </section>

      {/* Cross-link to the career page, when one exists */}
      {profile.careerLink && (
        <section className="vprofile-block">
          <Link href={profile.careerLink.href} className="era-next">
            <span className="era-next-label">→</span>
            <span className="era-next-title">{profile.careerLink.label}</span>
          </Link>
        </section>
      )}
    </div>
  );
}
