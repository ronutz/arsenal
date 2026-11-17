// ============================================================================
// src/content/vendors/overlays/pt-BR/index.ts
// ----------------------------------------------------------------------------
// Merges the eight pt-BR translation shards into one map (2026-10-25). A slug
// that appears in two shards is a merge mistake that would silently drop one
// translation, so it stops the build here instead.
// ============================================================================

import type { PartnerVendorOverlay } from "@/content/vendors/localized";
import { SHARD_1 } from "./shard-1";
import { SHARD_2 } from "./shard-2";
import { SHARD_3 } from "./shard-3";
import { SHARD_4 } from "./shard-4";
import { SHARD_5 } from "./shard-5";
import { SHARD_6 } from "./shard-6";
import { SHARD_7 } from "./shard-7";
import { SHARD_8 } from "./shard-8";
// The financial-markets companies of 16/11/2026 (Industry wave I1 to I6).
import { SHARD_9 } from "./shard-9";
// The companies behind the hacking-devices series, 17/11/2026 (Industry wave J1 to J4).
import { SHARD_10 } from "./shard-10";

/** Merge shard maps, refusing a slug defined twice. */
export function mergeShards(
  ...maps: Record<string, PartnerVendorOverlay>[]
): Record<string, PartnerVendorOverlay> {
  // The merged result.
  const out: Record<string, PartnerVendorOverlay> = {};
  // Each shard in turn.
  for (const m of maps) {
    // Each record in the shard.
    for (const [slug, overlay] of Object.entries(m)) {
      // Two translations of one record: stop rather than pick one.
      if (slug in out) throw new Error(`pt-BR overlay for "${slug}" is defined in two places`);
      // Keep it.
      out[slug] = overlay;
    }
  }
  // Done.
  return out;
}

/** All pt-BR shard overlays. */
export const PT_BR_SHARDS = mergeShards(SHARD_1, SHARD_2, SHARD_3, SHARD_4, SHARD_5, SHARD_6, SHARD_7, SHARD_8, SHARD_9, SHARD_10);
