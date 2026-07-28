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

import { VENDOR_FAMILIES } from "@/config/vendors";

/** EXTRA tokens that mark a path id as belonging to a vendor, beyond the
 *  vendor key itself.
 *
 *  This map holds EXCEPTIONS ONLY. Every vendor key matches itself by default
 *  (see `tokensFor`), so onboarding a vendor needs no edit here unless its
 *  paths are named after something other than the vendor - "bigip" for F5, or
 *  the operating systems for Extreme, whose paths never say "extreme".
 *
 *  It did not always work that way, and the failure is worth recording: this
 *  map originally listed every vendor explicitly, NGINX was onboarded after it
 *  was written, and its reading path silently grouped as "general". The path
 *  appeared on the study-guides index under the wrong heading and vanished
 *  from the NGINX hub entirely, with no error anywhere - a missing key in a
 *  lookup that falls back to a default is invisible by construction.
 *  Defaulting to the vendor's own key removes the class of bug rather than
 *  the instance. */
const VENDOR_ALIASES: Record<string, string[]> = {
  f5: ["f5", "bigip"],
  extreme: ["extreme", "exos", "voss"],
  fortinet: ["fortinet", "fortigate"],
  netskope: ["netskope"],
  ping: ["ping"],
  zscaler: ["zscaler"],
  checkpoint: ["checkpoint", "check-point"],
};

/** Every token that marks a path as this vendor's: its own key, plus any
 *  exceptions declared above. */
const tokensFor = (vendor: string): string[] => [vendor, ...(VENDOR_ALIASES[vendor] ?? [])];

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
    order.find((v) => v !== "general" && tokensFor(v).some((tok) => id.startsWith(tok))) ??
    "general"
  );
}

/** The vendor keys to consider, derived from the live vendor families so a
 *  newly onboarded vendor is included automatically. Ordered as the families
 *  are, which keeps grouping stable and predictable. */
export const READING_PATH_VENDOR_KEYS = VENDOR_FAMILIES.map((f) => f.key);
