// ============================================================================
// src/config/toolFunding.ts
// ----------------------------------------------------------------------------
// PER-TOOL FUNDING — a contextual "support this tool" mechanism.
//
// Distinct from the general TipJar (/support, "support the project"). This
// appears ON a specific tool, at the moment of value, and can be tied to a
// concrete purpose for THAT tool (e.g. funding its next feature). Same model as
// everything else: config-driven, admin-panel-ready, gated by the `toolFunding`
// feature flag (currently OFF).
//
// DOUBLE-GATED at render time: the flag must be on AND the tool must have at
// least one funding link, so it can never appear half-built. Empty by default;
// configure per tool when ready.
//
// Note on "progress": a live funding total/progress bar needs real data, which
// requires the service layer. This config supports a stated PURPOSE (an honest
// goal in words), not a fake live total. Live progress wires in with the service.
// ============================================================================

export interface FundingLink {
  /** Button label, e.g. "Sponsor on GitHub" or "Ko-fi". */
  label: string;
  /** Direct support URL. Empty = not configured = never shown. */
  url: string;
}

export interface ToolFundingConfig {
  /** Optional concrete purpose for this tool's funding (plain words). */
  purpose?: string;
  /** Support links. Only links with a URL are ever shown. */
  links: FundingLink[];
}

// ----------------------------------------------------------------------------
// Funding by tool id. Add or edit per tool. Links go DIRECT to the provider
// (0% commission, same principle as the TipJar). Empty until configured.
//
// TODO(Rodolfo): set a purpose and paste support links for the tools you want.
// ----------------------------------------------------------------------------
const FUNDING: Record<string, ToolFundingConfig> = {
  cidr: {
    purpose: "", // e.g. "Funding IPv6 support and a saved-subnets feature"
    links: [
      // { label: "Sponsor on GitHub", url: "" },
      // { label: "Ko-fi", url: "" },
    ],
  },
};

/** Only the links that actually have a URL. */
function activeLinks(cfg: ToolFundingConfig): FundingLink[] {
  return cfg.links.filter((l) => l.url.trim().length > 0);
}

/** The funding config for a tool, or null if none recorded. */
export function fundingFor(toolId: string): ToolFundingConfig | null {
  return FUNDING[toolId] ?? null;
}

/** True if a tool has at least one usable funding link (so it can render). */
export function hasFunding(toolId: string): boolean {
  const cfg = FUNDING[toolId];
  return !!cfg && activeLinks(cfg).length > 0;
}

/** A tool's active funding links (URL present). */
export function fundingLinksFor(toolId: string): FundingLink[] {
  const cfg = FUNDING[toolId];
  return cfg ? activeLinks(cfg) : [];
}
