// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/reading-path-vendors.ts
// ----------------------------------------------------------------------------
// Which vendor a reading path belongs to.
//
// Vendor detection is DERIVED from the path id rather than stored as a field
// (D-74: deriving beats adding a field nobody remembers to set). A path belongs
// to a vendor when its id starts with one of that vendor's tokens, with or
// without a separator - so "ping-identity-platform" and
// "pingfederate-administration" both land under Ping.
//
// This lived inside /study-guides/page.tsx until 2026-07-27, when the vendor
// hubs needed the same answer in order to show a vendor's reading paths as
// cards. Two copies of a rule like this drift the first time a vendor is added
// and only one copy is updated, and the failure is silent: paths simply stop
// appearing on one of the two surfaces. One exported function, used by both.
// ============================================================================

/** Tokens that mark a path id as belonging to a vendor.
 *  "bigip" is F5's product name rather than a separate vendor, and the Extreme
 *  operating systems are named on paths that never say "extreme". */
const VENDOR_ALIASES: Record<string, string[]> = {
  f5: ["f5", "bigip"],
  extreme: ["extreme", "exos", "voss"],
  fortinet: ["fortinet", "fortigate"],
  netskope: ["netskope"],
  ping: ["ping"],
  zscaler: ["zscaler"],
  checkpoint: ["checkpoint", "check-point"],
};

/**
 * The vendor key a reading path belongs to, or "general" for the
 * vendor-agnostic ones.
 *
 * @param id     reading path id, e.g. "bigip-fundamentals"
 * @param order  the vendor keys to consider, in precedence order. Callers pass
 *               their own so the answer stays consistent with whatever list
 *               that surface is already rendering.
 */
export function readingPathVendor(id: string, order: readonly string[]): string {
  return (
    order.find(
      (v) => v !== "general" && (VENDOR_ALIASES[v] ?? []).some((tok) => id.startsWith(tok)),
    ) ?? "general"
  );
}

/** Vendor keys that have at least one alias, for callers that need the set. */
export const READING_PATH_VENDOR_KEYS = Object.keys(VENDOR_ALIASES);
