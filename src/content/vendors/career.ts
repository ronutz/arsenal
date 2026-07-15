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
] as const;

// ============================================================================
// RED EDUCATION PARTNER CROSS-LINKS (PRIME directive 2026-07-15).
// The established Group B list (scope map, vendor-profiles session
// 2026-07-15) is Nutanix, Arista, Check Point PLUS Cisco and Palo Alto
// Networks - the last two are verified Red Education partners whose pages
// already exist as CAREER pages, so the "Red Education training partners"
// section links them here rather than duplicating them as partner entries.
// (F5 / Fortinet / Netskope / Extreme are Red Education partners too, but
// Rodolfo teaches those - they live under /vendors, not in this section.)
// `key` is the i18n prefix under the "vendors" namespace, as above.
// ============================================================================

export const REDU_CAREER_PARTNERS = [
  { slug: "cisco", key: "cisco" },
  { slug: "palo-alto", key: "paloalto" },
] as const;
