// ============================================================================
// src/components/ToolRequirements.tsx
// ----------------------------------------------------------------------------
// THE "WHAT THIS PAGE NEEDS" PILL ROW (a server component; no "use client").
//
// A small, honest capability row shown on a tool page. It tells a reader, up
// front, what their browser must support for the tool to be fully functional,
// and it degrades gracefully when JavaScript is off.
//
// It renders three things:
//   1. A "Runs in your browser" pill. Every interactive tool on this site
//      COMPUTES LOCALLY (nothing is sent to a server), which is the privacy
//      point of the whole toolbox — but that also means the calculator needs
//      JavaScript to run. This pill states the client-side requirements plainly
//      (JavaScript + CSS), so nothing is a surprise.
//   2. An "API-ready" pill, shown ONLY when the tool is API-capable (its slug
//      is in the API registry, src/lib/tools/registry.ts). It is deliberately
//      truthful: the HTTP API is BUILT but NOT CURRENTLY ENABLED, so the pill
//      says "API-ready" and the note says it is not live yet. When the API is
//      switched on later, only the note copy changes — the capability is real.
//   3. A <noscript> block: the reduced-function story. With JavaScript off, the
//      page's TITLE, SUMMARY, the linked Markdown reference, the Learn article,
//      the API documentation, provenance, and the sources list all still
//      render (they are server-rendered HTML). Only the live calculator is
//      unavailable. The <noscript> spells that out and points at what still
//      works, so a no-JS visitor is informed, not stranded.
//
// COPY lives entirely in the caller (the page passes already-localized strings,
// exactly like FamilyChip), so this file carries no i18n dependency and is
// trivially server-renderable. VISUAL lives entirely in the .tool-req CSS in
// src/app/components.css and references only semantic theme tokens.
//
// This is a REVIEWABLE PROOF OF CONCEPT: it is wired onto a single tool page
// first (see the page's POC gate). Rolling it out to every tool/page later is a
// call-site change, not a change to this component.
// ============================================================================

export interface ToolRequirementsLabels {
  /** Row heading, e.g. "What this page needs". */
  heading: string;
  /** "Runs in your browser" pill label. */
  browserPill: string;
  /** Short client-side requirements line, e.g. "JavaScript + CSS". */
  clientNeeds: string;
  /** One-sentence why: computes locally, so it needs JavaScript. */
  browserNote: string;
  /** "API-ready" pill label (only rendered when apiReady is true). */
  apiPill: string;
  /** Note clarifying the API is built but not yet live. */
  apiNote: string;
  /** <noscript> heading, e.g. "JavaScript is off". */
  noscriptHeading: string;
  /** <noscript> body: what still works without JavaScript. */
  noscriptBody: string;
}

export default function ToolRequirements({
  apiReady,
  processingOn = false,
  labels,
}: {
  /** True when this tool exposes an HTTP API (slug present in API_TOOLS). */
  apiReady: boolean;
  /** True when local API processing is switched on. Drives the API pill colour:
      green when served locally, neutral grey/white when documented-not-served. */
  processingOn?: boolean;
  /** Already-localized strings (the page resolves these). */
  labels: ToolRequirementsLabels;
}) {
  return (
    <section className="tool-req" aria-label={labels.heading}>
      <h2 className="tool-req-heading">{labels.heading}</h2>

      <div className="tool-req-pills">
        {/* Always shown: the browser (client-side) requirement. */}
        <span className="tool-req-pill tool-req-pill--browser">
          <span className="tool-req-pill-dot" aria-hidden="true" />
          <span className="tool-req-pill-label">{labels.browserPill}</span>
          <span className="tool-req-pill-meta mono">{labels.clientNeeds}</span>
        </span>

        {/* Shown only for API-capable tools. data-processing drives the colour:
            "on" => green (served locally), "off" => neutral (built, not live). */}
        {apiReady && (
          <span
            className="tool-req-pill tool-req-pill--api"
            data-processing={processingOn ? "on" : "off"}
          >
            <span className="tool-req-pill-dot" aria-hidden="true" />
            <span className="tool-req-pill-label">{labels.apiPill}</span>
          </span>
        )}
      </div>

      {/* Plain-language why for the browser requirement. */}
      <p className="tool-req-note">{labels.browserNote}</p>
      {/* The API caveat, kept adjacent to its pill's meaning. */}
      {apiReady && <p className="tool-req-note tool-req-note--api">{labels.apiNote}</p>}

      {/* The reduced-function path: what a no-JavaScript visitor still gets. */}
      <noscript>
        <div className="tool-req-noscript" role="note">
          <strong className="tool-req-noscript-heading">{labels.noscriptHeading}</strong>
          <span className="tool-req-noscript-body">{labels.noscriptBody}</span>
        </div>
      </noscript>
    </section>
  );
}
