// ============================================================================
// src/components/AcquisitionTimeline.tsx
// ----------------------------------------------------------------------------
// A rich, vertical corporate-acquisition timeline for a single vendor. Unlike
// the horizontal LineageDiagram (which suits a short merger chain), this is
// built for a long, dated acquisition list - a vendor like F5 with ~20+ deals
// reads best as a ledger down the page: a year rail on the left, deal cards on
// the right, with "became" hooks that connect a purchase to the product line it
// turned into.
//
// Pure presentational, server-safe. Renders factual company-history text in the
// site's original typographic styling; no vendor logos or brand assets. All
// copy comes from the caller's verified data module.
// ============================================================================

import type { VendorLineage } from "@/content/lineages/f5";

export interface AcquisitionTimelineProps {
  lineage: VendorLineage;
  /** Localized section labels. */
  labels: {
    founded: string;
    acquisitions: string;
    became: string;
    sources: string;
    asOf: string;
    nameChanges: string;
  };
}

export default function AcquisitionTimeline({ lineage, labels }: AcquisitionTimelineProps) {
  const { founded, names, origin, acquisitions, asOf, sources } = lineage;

  // Chronological (oldest-first): the rail sits under the founding date and the
  // forward name-evolution, so acquisitions read as a growth story in the same
  // direction. Consistent with the vendor-profile timelines.
  const byYearAsc = [...acquisitions].sort((a, b) => a.year - b.year);
  const disclosed = acquisitions.filter((a) => /\d/.test(a.price)).length;

  return (
    <div className="lineage">
      {/* Founding + name-evolution header */}
      <header className="lineage-head">
        <div className="lineage-founded">
          <span className="lineage-founded-year mono">{founded.year}</span>
          <div className="lineage-founded-body">
            <p className="lineage-founded-line">
              Founded <strong>{founded.dateText}</strong> in {founded.place} as{" "}
              <strong>{founded.asName}</strong>
              {founded.founder ? ` by ${founded.founder}.` : "."}
            </p>
            <p className="lineage-origin">{origin}</p>
          </div>
        </div>

        {/* Name evolution: asName -> ... -> current */}
        <div className="lineage-names" aria-label={labels.nameChanges}>
          {names.map((n, i) => (
            <div className="lineage-name-step" key={n.name}>
              <div className="lineage-name-row">
                <span className="lineage-name mono">{n.name}</span>
                <span className="lineage-name-from mono">{n.from}</span>
              </div>
              {n.note && <p className="lineage-name-note">{n.note}</p>}
              {i < names.length - 1 && <span className="lineage-name-arrow" aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
      </header>

      {/* Acquisition ledger */}
      <section className="lineage-acq">
        <div className="lineage-acq-head">
          <h3 className="lineage-acq-title">{labels.acquisitions}</h3>
          <span className="lineage-acq-count mono">
            {acquisitions.length} · {disclosed} {labels.asOf} {asOf}
          </span>
        </div>

        <ol className="lineage-timeline">
          {byYearAsc.map((a, i) => (
            <li className="lineage-deal" key={`${a.year}-${a.name}`} data-first={i === 0 ? "true" : undefined}>
              <div className="lineage-deal-rail" aria-hidden="true">
                <span className="lineage-deal-year mono">{a.year}</span>
                <span className="lineage-deal-dot" />
              </div>
              <div className="lineage-deal-card">
                <div className="lineage-deal-top">
                  <span className="lineage-deal-name">{a.name}</span>
                  <span className="lineage-deal-price mono">{a.price}</span>
                </div>
                <p className="lineage-deal-what">{a.what}</p>
                {a.became && (
                  <p className="lineage-deal-became">
                    <span className="lineage-deal-became-label">{labels.became}</span>
                    {a.became}
                  </p>
                )}
                {a.sourceNote && <p className="lineage-deal-note">{a.sourceNote}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Provenance */}
      <footer className="lineage-sources">
        <span className="lineage-sources-label">{labels.sources}</span>
        <ul className="lineage-sources-list">
          {sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="lineage-source-link">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
