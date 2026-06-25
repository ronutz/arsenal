// ============================================================================
// src/config/tools.ts
// ----------------------------------------------------------------------------
// TOOL REGISTRY — the single source of truth for the /tools index. Add a tool
// by adding one entry here; the index page renders it automatically. Today the
// toolbox holds one tool (the CIDR calculator on the home page), but this is
// built to grow, so the index exists now and fills in as tools ship.
//
// `available: false` renders a tool as a muted "coming soon" card (useful for
// signalling what is next without linking to an unfinished page).
//
// NOTE: tool name/blurb are English here for now; when the toolbox grows they
// can move to the message packs like the rest of the copy.
// ============================================================================

export interface ToolEntry {
  /** Stable id (also the in-page anchor / future route segment). */
  id: string;
  /** Display name. */
  name: string;
  /** One-line description of what it does. */
  blurb: string;
  /** Where the tool lives (an in-page anchor today, a route later). */
  href: string;
  /** Grouping label, e.g. "Networking". */
  category: string;
  /** False renders a muted "coming soon" card with no link. */
  available: boolean;
}

export const tools: ToolEntry[] = [
  {
    id: "cidr",
    name: "CIDR / Subnet Calculator",
    blurb:
      "Break down any IPv4 CIDR block into network and broadcast addresses, usable host range, host count, and netmask. Runs entirely in your browser.",
    href: "/#cidr",
    category: "Networking",
    available: true,
  },
];

/** Tools that are live and linkable. */
export function availableTools(): ToolEntry[] {
  return tools.filter((t) => t.available);
}

/** Distinct categories present in the registry, in first-seen order. */
export function toolCategories(): string[] {
  const seen: string[] = [];
  for (const t of tools) if (!seen.includes(t.category)) seen.push(t.category);
  return seen;
}
