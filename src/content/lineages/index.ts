// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/lineages/index.ts
// ----------------------------------------------------------------------------
// Which vendors have a researched corporate lineage.
//
// A lineage page moved from /about/vendor-lineages to /<vendor>/vendor-lineage
// on 2026-07-27 (PRIME): the story of how a platform was assembled belongs
// beside that platform's tools and articles, not in a biography section. The
// old page was written as a HUB for every vendor's lineage and shipped with a
// single entry, which is why its copy talked about vendors in general while
// showing only F5.
//
// This map is the whole registry. Adding a vendor means adding its data module
// and one line here; the route generates itself from the keys, so there is no
// page to remember to edit and no way to ship a lineage that nothing links to.
//
// The bar for entry is the same as it was: every acquisition verified against
// primary sources before it ships. An unresearched vendor is simply absent,
// and its hub shows no lineage card, which is the honest default.
// ============================================================================

import { f5Lineage } from "./f5";
import { extremeLineage } from "./extreme";
import { checkPointLineage } from "./check-point";
import { nginxLineage } from "./nginx";
import { fortinetLineage } from "./fortinet";
import { pingLineage } from "./ping-identity";
import { zscalerLineage } from "./zscaler";
import { netskopeLineage } from "./netskope";
import type { VendorLineage } from "./f5";

/** Vendor key (as in src/config/vendors.ts) -> its researched lineage. */
export const LINEAGES: Record<string, VendorLineage> = {
  f5: f5Lineage,
  extreme: extremeLineage,
  checkpoint: checkPointLineage,
  nginx: nginxLineage,
  fortinet: fortinetLineage,
  ping: pingLineage,
  zscaler: zscalerLineage,
  netskope: netskopeLineage,
};

/** Vendor keys that have a lineage page. Drives generateStaticParams. */
export const LINEAGE_VENDORS = Object.keys(LINEAGES);

/** The lineage for a vendor, or null when none has been researched yet. */
export function lineageFor(vendor: string): VendorLineage | null {
  return LINEAGES[vendor] ?? null;
}
