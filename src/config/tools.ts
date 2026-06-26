// ============================================================================
// src/config/tools.ts
// ----------------------------------------------------------------------------
// TOOL REGISTRY — the single source of truth for the /tools index. Add a tool
// by adding one entry here; the index page renders it automatically.
//
// User-facing strings live in the message packs, NOT here: a tool's display
// name and blurb are `tools.<id>.name` / `tools.<id>.blurb`, and the category
// label is `tools.categories.<category>`. This keeps every visible tool-UI
// string translatable (English in en.json, other locales layered on top via
// deepMerge). The registry holds only structural data: id, route, category
// key, and availability.
//
// `available: false` renders a tool as a muted "coming soon" card (useful for
// signalling what is next without linking to an unfinished page).
// ============================================================================

export interface ToolEntry {
  /** Stable id. Also the in-page anchor / route segment AND the i18n key
   *  segment: the index resolves tools.<id>.name and tools.<id>.blurb. */
  id: string;
  /** Where the tool lives (an in-page anchor for cidr, a route otherwise). */
  href: string;
  /** Category KEY, resolved to a label through tools.categories.<key>. */
  category: string;
  /** False renders a muted "coming soon" card with no link. */
  available: boolean;
}

export const tools: ToolEntry[] = [
  { id: "jwt", href: "/tools/jwt", category: "identity", available: true },
  { id: "pkce", href: "/tools/pkce", category: "identity", available: true },
  { id: "base64", href: "/tools/base64", category: "encoding", available: true },
  { id: "hash", href: "/tools/hash", category: "hashing", available: true },
  { id: "hmac", href: "/tools/hmac", category: "hashing", available: true },
  { id: "uuid", href: "/tools/uuid", category: "identifiers", available: true },
  { id: "x509", href: "/tools/x509", category: "pki", available: true },
  { id: "ipv6", href: "/tools/ipv6", category: "networking", available: true },
  { id: "cidr", href: "/#cidr", category: "networking", available: true },
];

/** Tools that are live and linkable. */
export function availableTools(): ToolEntry[] {
  return tools.filter((t) => t.available);
}

/** Distinct category keys present in the registry, in first-seen order. */
export function toolCategories(): string[] {
  const seen: string[] = [];
  for (const t of tools) if (!seen.includes(t.category)) seen.push(t.category);
  return seen;
}
