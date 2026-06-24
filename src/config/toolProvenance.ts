// ============================================================================
// src/config/toolProvenance.ts
// ----------------------------------------------------------------------------
// TOOL PROVENANCE — per-tool "Credits & Sources".
//
// For each tool, this records WHERE its logic and authority come from: the
// standards or algorithms it implements, the data sources it draws on, and any
// references worth citing. Showing this builds trust ("compute, never guess" is
// verifiable) and credits the work the tool rests on. It is a provenance panel,
// not a funding ask.
//
// Gated by the `toolProvenance` feature flag (currently ON; it is informational
// and costs nothing). Data-driven: a tool with no provenance entry simply shows
// no panel. Populated per tool as the tool surface grows.
// ============================================================================

export interface ProvenanceSource {
  /** Label, e.g. "RFC 4632" or "IANA IPv4 registry". */
  label: string;
  /** Optional link to the source. */
  url?: string;
  /** Optional one-line note on how it is used. */
  note?: string;
}

export interface ToolProvenance {
  /** What the tool computes from / implements (plain language). */
  basis: string;
  /** Standards, algorithms, and data sources. */
  sources: ProvenanceSource[];
}

// ----------------------------------------------------------------------------
// Provenance by tool id. Add tools here as they ship. Example below is the CIDR
// / subnet tool (the live one), with real, citable standards.
// ----------------------------------------------------------------------------
const PROVENANCE: Record<string, ToolProvenance> = {
  cidr: {
    basis:
      "All results are computed locally from the address and prefix you enter, using standard IPv4 addressing arithmetic. Nothing is looked up remotely and nothing is sent anywhere.",
    sources: [
      {
        label: "RFC 4632 (CIDR)",
        url: "https://www.rfc-editor.org/rfc/rfc4632",
        note: "Classless Inter-Domain Routing address aggregation",
      },
      {
        label: "RFC 1918",
        url: "https://www.rfc-editor.org/rfc/rfc1918",
        note: "Private address ranges",
      },
      {
        label: "RFC 791 (IPv4)",
        url: "https://www.rfc-editor.org/rfc/rfc791",
        note: "The Internet Protocol",
      },
    ],
  },
};

/** Provenance for a tool id, or null if none recorded. */
export function provenanceFor(toolId: string): ToolProvenance | null {
  return PROVENANCE[toolId] ?? null;
}
