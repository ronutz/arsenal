"use client";

// ============================================================================
// src/components/ToolProvenance.tsx
// ----------------------------------------------------------------------------
// TOOL PROVENANCE PANEL — collapsible "Credits & Sources" for a tool.
//
// Shows what a tool computes from and the standards/sources behind it, with a
// show/hide toggle (canon: provenance is available but not in the way). Gated by
// the `toolProvenance` feature flag; renders nothing if the flag is off or the
// tool has no provenance recorded.
//
// Client component for the toggle. The provenance data and the feature-flag
// result are resolved by the parent (server) and passed in, so this stays a
// pure presentational toggle.
// ============================================================================

import { useState } from "react";
import type { ToolProvenance as ToolProvenanceData } from "@/config/toolProvenance";

export interface ProvenanceCopy {
  title: string;
  show: string;
  hide: string;
  basisLabel: string;
  sourcesLabel: string;
  /** Vendor-documentation disclaimer sentence (shown only for vendor-doc tools). */
  disclaimer?: string;
}

interface ToolProvenanceProps {
  /** Resolved on the server: flag enabled AND provenance exists. */
  enabled: boolean;
  data: ToolProvenanceData | null;
  copy: ProvenanceCopy;
}

export default function ToolProvenance({ enabled, data, copy }: ToolProvenanceProps) {
  const [open, setOpen] = useState(false);

  // Nothing to show.
  if (!enabled || !data) return null;

  return (
    <section className="provenance">
      <button
        type="button"
        className="provenance-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="provenance-toggle-label">{copy.title}</span>
        <span className="provenance-toggle-action mono">{open ? copy.hide : copy.show}</span>
      </button>

      {open && (
        <div className="provenance-body">
          <div className="provenance-block">
            <span className="provenance-block-label">{copy.basisLabel}</span>
            <p className="provenance-basis">{data.basis}</p>
          </div>

          <div className="provenance-block">
            <span className="provenance-block-label">{copy.sourcesLabel}</span>
            <ul className="provenance-sources">
              {data.sources.map((s, i) => (
                <li className="provenance-source" key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="provenance-source-link">
                      {s.label}
                    </a>
                  ) : (
                    <span className="provenance-source-label">{s.label}</span>
                  )}
                  {s.note && <span className="provenance-source-note">{s.note}</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Vendor-documentation disclaimer: only when the tool's provenance
              marks it as vendor-doc AND the caller supplied the localized copy. */}
          {data.disclaimer === "vendor-docs" && copy.disclaimer && (
            <p className="provenance-disclaimer">{copy.disclaimer}</p>
          )}
        </div>
      )}
    </section>
  );
}
