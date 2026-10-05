// ============================================================================
// src/components/WasmChip.tsx
// ----------------------------------------------------------------------------
// THE WEBASSEMBLY PILL. A tool that runs a third-party interpreter compiled to
// WebAssembly wears this mark so a reader is never surprised by what it does:
// the full form "WebAssembly" on the tool page (with the engine, its runtime
// and the first-use size), the short "WASM" on cards, search results and the
// roadmap. The hue is --color-wasm, a fuchsia used nowhere else on the site, so
// it cannot be read as a theme accent or a status colour (PROPOSTA-wasm-tools
// decision 1, ratified by PRIME 2026-10-04).
//
// It borrows the family-chip grammar (dot + pill) through --chip-color, so the
// existing stylesheet carries it with no new rule beyond the detail class; the
// label text takes a theme token, keeping contrast on every theme. Server-safe:
// no state, renders anywhere.
// ============================================================================

export default function WasmChip({
  label,
  detail,
}: {
  /** The pill's word: "WebAssembly" in full, or "WASM" short (localized by the caller). */
  label: string;
  /** Optional trailing detail shown only in the full form, e.g. "Pyodide 314.0.7 (Python 3.14.2) · 13 MB on first use". */
  detail?: string;
}) {
  return (
    <span
      className="family-chip wasm-chip"
      // The fuchsia mark drives the dot, the border and the background tint through the shared grammar.
      style={{ "--chip-color": "var(--color-wasm)" } as React.CSSProperties}
    >
      <span className="family-chip-dot" aria-hidden="true" />
      <span className="wasm-chip-label">{label}</span>
      {detail ? <span className="wasm-chip-detail">{detail}</span> : null}
    </span>
  );
}
