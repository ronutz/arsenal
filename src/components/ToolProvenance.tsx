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
//
// PAGE LANGUAGE (2026-11-02, batch H5). The parent passes the panel already in
// the page's language (provenanceFor in src/config/toolProvenance.ts reads the
// basis, the notes and our own labels from the toolProvenance message pack); a
// published title stays as published and arrives marked labelLang "en" on pages
// in other languages, which this component sets as the link's lang attribute.
// ============================================================================

import { useState } from "react"; // the open/closed state
import type { ProvenanceView as ToolProvenanceData } from "@/config/toolProvenance"; // the panel in the page's language

/** The panel's chrome in the page's language (home.provenance.*, resolved by the parent). */
export interface ProvenanceCopy {
  /** The toggle's title ("Credits & sources"). */
  title: string;
  /** The toggle's action while closed. */
  show: string;
  /** The toggle's action while open. */
  hide: string;
  /** The heading over the basis paragraph. */
  basisLabel: string;
  /** The heading over the source list. */
  sourcesLabel: string;
  /** Vendor-documentation disclaimer sentence (shown only for vendor-doc tools). */
  disclaimer?: string;
}

/** What the parent passes. */
interface ToolProvenanceProps {
  /** Resolved on the server: flag enabled AND provenance exists. */
  enabled: boolean;
  /** The panel's content in the page's language, or null. */
  data: ToolProvenanceData | null;
  /** The panel's chrome in the page's language. */
  copy: ProvenanceCopy;
}

/**
 * The collapsible "Credits & sources" panel.
 * @param props whether it is on, its content and its chrome
 * @returns the panel, or nothing
 */
export default function ToolProvenance({ enabled, data, copy }: ToolProvenanceProps) {
  const [open, setOpen] = useState(false); // closed until the reader opens it

  // Nothing to show.
  if (!enabled || !data) return null;

  return (
    <section className="provenance">
      {/* The toggle: the title and the show/hide action. */}
      <button
        type="button"
        className="provenance-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="provenance-toggle-label">{copy.title}</span>
        <span className="provenance-toggle-action mono">{open ? copy.hide : copy.show}</span>
      </button>

      {/* RENDER AND HIDE (LESSONS 19, 2026-08-16). Provenance is the basis a
          tool's answer rests on and the sources behind it - the most
          citation-worthy content on a tool page, and it was mounted only after
          a click, so no crawler and no find-in-page ever saw it. */}
      <div className="provenance-body" hidden={!open}>
          {/* How it works: the basis paragraph. */}
          <div className="provenance-block">
            <span className="provenance-block-label">{copy.basisLabel}</span>
            <p className="provenance-basis">{data.basis}</p>
          </div>

          {/* Standards & sources: one item per source, in the registry's order. */}
          <div className="provenance-block">
            <span className="provenance-block-label">{copy.sourcesLabel}</span>
            <ul className="provenance-sources">
              {data.sources.map((s, i) => (
                <li className="provenance-source" key={i}>
                  {/* The label: a link when the source has one; lang="en" when it is a published English title on another page. */}
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="provenance-source-link" lang={s.labelLang}>
                      {s.label}
                    </a>
                  ) : (
                    <span className="provenance-source-label" lang={s.labelLang}>{s.label}</span>
                  )}
                  {/* What the tool takes from the source, in the page's language. */}
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
    </section>
  );
}
