// ============================================================================
// src/config/vendors.ts
// ----------------------------------------------------------------------------
// VENDOR FAMILIES - the second, ADDITIVE grouping dimension over the toolbox.
//
// A tool's functional home is still its single `category` (src/config/tools.ts):
// that is unchanged and still drives the /tools index grouping. On top of it, a
// tool may also belong to one or more VENDOR families via the optional
// ToolEntry.vendors[] array. The four vendors are exactly Rodolfo Nutzmann's
// training pillars, and they line up with the public-copy guardrail (only F5,
// Fortinet, Extreme Networks, and Netskope are named publicly).
//
// Multi-membership: an F5 tool sits in its functional category (e.g.
// "networking") AND in the F5 vendor family, so an instructor can find it either
// way. Learn articles carry the same vendors[] tag, so a vendor view surfaces
// tools and articles together.
//
// VISIBILITY: only vendors that actually have tools are surfaced, EXCEPT that a
// vendor with alwaysShow=true is surfaced regardless. Today only F5 is populated
// and shown; Fortinet/Netskope/Extreme stay hidden until they have tools, so we
// never render an empty vendor shelf.
//
// Labels are i18n (tools.vendors.<key>), never hard-coded here - same rule as
// categories. Colors are SUPPLEMENTARY (a dot + a soft border; the label carries
// the meaning), exactly like categoryColors.ts, so contrast is the theme's on all
// six themes. The hues below are provisional brand-adjacent values and can be
// tuned in one place.
// ============================================================================

import { tools } from "@/config/tools";

export interface VendorFamily {
  /** Stable key: matches ToolEntry.vendors[] and the tools.vendors.<key> label. */
  readonly key: string;
  /** Surface in browse UI even with zero tools (F5 is live; the rest wait). */
  readonly alwaysShow: boolean;
}

/** Declared browse order - the four training-pillar vendors. */
export const VENDOR_FAMILIES: readonly VendorFamily[] = Object.freeze([
  { key: "f5", alwaysShow: true },
  { key: "fortinet", alwaysShow: false },
  { key: "netskope", alwaysShow: false },
  { key: "extreme", alwaysShow: false },
]);

/** vendor key -> supplementary hue (dot + soft border only). Provisional; tune here. */
export const VENDOR_COLORS: Record<string, string> = {
  f5: "#E4002B", // F5 red
  fortinet: "#C8102E", // Fortinet red
  netskope: "#00A9E0", // Netskope blue
  extreme: "#582C83", // Extreme Networks purple
};

/** Neutral fallback so a future vendor is never invisible. */
export const VENDOR_COLOR_FALLBACK = "#94A3B8";

/** The hue for a vendor key, with fallback. */
export function vendorColor(key: string): string {
  return VENDOR_COLORS[key] ?? VENDOR_COLOR_FALLBACK;
}

/** True when a key names a known vendor family. */
export function isVendor(key: string): boolean {
  return VENDOR_FAMILIES.some((v) => v.key === key);
}

/** Vendor keys that have at least one AVAILABLE tool, in declared order. */
export function populatedVendors(): string[] {
  const seen = new Set<string>();
  for (const t of tools) {
    if (!t.available || !t.vendors) continue;
    for (const v of t.vendors) seen.add(v);
  }
  return VENDOR_FAMILIES.filter((v) => seen.has(v.key)).map((v) => v.key);
}

/** Vendor keys to surface in browse UI: populated ones plus any alwaysShow, in order. */
export function browseVendors(): string[] {
  const pop = new Set(populatedVendors());
  return VENDOR_FAMILIES.filter((v) => pop.has(v.key) || v.alwaysShow).map((v) => v.key);
}
