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
