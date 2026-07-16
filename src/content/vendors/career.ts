// ============================================================================
// src/content/vendors/career.ts
// ----------------------------------------------------------------------------
// CAREER VENDOR REGISTRY - the eight deep-research career pages, in
// chronological order of first engagement (1996 onward). Extracted from
// /about/vendors/page.tsx on 2026-07-15 so the /industry hub and the About
// index share one source of truth (PRIME directive: /industry is the new
// discoverable front door to this research).
//
// `slug` is the route segment under /about/vendors/<slug>; `key` is the
// i18n prefix under the "vendors" namespace (name / years / tagline).
// ============================================================================

export const CAREER_VENDORS = [
  { slug: "cabletron-enterasys", key: "cabletron" },
  { slug: "riverstone", key: "riverstone" },
  { slug: "cisco", key: "cisco" },
  { slug: "ironport", key: "ironport" },
  { slug: "netscreen-juniper", key: "juniper" },
  { slug: "extreme", key: "extreme" },
  { slug: "fireeye-mcafee-ixia", key: "distribution" },
  { slug: "palo-alto", key: "paloalto" },
  // The teaching-era chapters (PRIME directive 2026-07-15: career vendors
  // include ALL vendors to today). Chronological by first engagement:
  { slug: "f5", key: "f5" },                     // certified 2015, instructor 2020
  { slug: "fortinet", key: "fortinet" },         // NSE ladder 2022, FCT 2024
  { slug: "netskope", key: "netskope" },         // accreditations 2024, instructor 2025
  { slug: "ping-identity", key: "ping" },        // PingFederate Practitioner 2025
  { slug: "zscaler", key: "zscaler" },           // chapter opening 2026; hub on the roadmap
] as const;

// ============================================================================
// VENDOR HUB -> CAREER PAGE MAP (PRIME directive 2026-07-15, item 1):
// each /[vendor] hub links at the top to that vendor's page in the industry
// section (/about/vendors/<slug>). Keyed by the vendor KEY from
// src/config/vendors.ts; every current key has a career page.
// ============================================================================

export const VENDOR_CAREER_SLUGS: Record<string, string> = {
  f5: "f5",
  fortinet: "fortinet",
  netskope: "netskope",
  extreme: "extreme",
  ping: "ping-identity",
  zscaler: "zscaler",
};

// ============================================================================
// RED EDUCATION PARTNER CROSS-LINKS (PRIME directive 2026-07-15).
// The established Group B list (scope map, vendor-profiles session
// 2026-07-15) is Nutanix, Arista, Check Point PLUS Cisco and Palo Alto
// Networks - the last two are verified Red Education partners whose pages
// already exist as CAREER pages, so the "Red Education training partners"
// section links them here rather than duplicating them as partner entries.
// (F5 / Fortinet / Netskope / Extreme are Red Education partners too; since
// 2026-07-15 they ALSO have career pages above - the hubs stay under /[vendor].)
// `key` is the i18n prefix under the "vendors" namespace, as above.
// ============================================================================

export const REDU_CAREER_PARTNERS = [
  { slug: "cisco", key: "cisco" },
  { slug: "palo-alto", key: "paloalto" },
] as const;

