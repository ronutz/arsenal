// ============================================================================
// src/content/certifications/overlays/pt-BR/index.ts
// ----------------------------------------------------------------------------
// Merges the per-vendor pt-BR study-guide overlays into one map (26/10/2026). A
// slug defined in two vendor files is a merge mistake that would silently drop
// one translation, so it stops the build here instead.
// ============================================================================

// The overlay's shape.
import type { GuideOverlay } from "@/content/certifications/localized";
// Check Point.
import { PT_BR_CHECKPOINT } from "./checkpoint";
// F5.
import { PT_BR_F5 } from "./f5";
// Fortinet.
import { PT_BR_FORTINET } from "./fortinet";
// Netskope.
import { PT_BR_NETSKOPE } from "./netskope";
// Ping Identity.
import { PT_BR_PING } from "./ping";

/** Merge vendor maps, refusing a slug defined twice. */
function mergeVendors(...maps: Record<string, GuideOverlay>[]): Record<string, GuideOverlay> {
  // The merged result.
  const out: Record<string, GuideOverlay> = {};
  // Each vendor file in turn.
  for (const m of maps) {
    // Each guide in it.
    for (const [slug, overlay] of Object.entries(m)) {
      // Two translations of one guide: stop rather than pick one.
      if (slug in out) throw new Error(`pt-BR guide overlay for "${slug}" is defined in two places`);
      // Keep it.
      out[slug] = overlay;
    }
  }
  // Done.
  return out;
}

/** Every pt-BR study-guide overlay, keyed by guide slug. */
export const PT_BR_GUIDE_OVERLAYS = mergeVendors(PT_BR_CHECKPOINT, PT_BR_F5, PT_BR_FORTINET, PT_BR_NETSKOPE, PT_BR_PING);
