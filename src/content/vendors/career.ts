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

import { partnerVendors } from "./partners";

/** A career chapter: the vendor page slug, its i18n key, and the year the
 *  company's story begins.
 *
 *  `founded` was added 2026-07-28 so these chapters can join the industry
 *  lineage timeline, which orders by founding year. Each was DERIVED from that
 *  vendor's own profile timeline (its earliest dated entry) and cross-checked
 *  against the lineage files where one exists - seven of seven matched
 *  exactly, which is the reason to trust the other eight. */
export interface CareerVendor {
  slug: string;
  key: string;
  founded?: number;
}

export const CAREER_VENDORS: CareerVendor[] = [
  { slug: "cabletron-enterasys", key: "cabletron", founded: 1983 },
  { slug: "riverstone", key: "riverstone", founded: 1996 },
  { slug: "cisco", key: "cisco", founded: 1984 },
  { slug: "ironport", key: "ironport", founded: 2000 },
  { slug: "netscreen-juniper", key: "juniper", founded: 1996 },
  { slug: "extreme", key: "extreme", founded: 1996 },
  { slug: "fireeye-mcafee-ixia", key: "distribution", founded: 1987 },
  // Pulse Secure: distributed in the ScanSource year (PRIME 2026-07-16) - the
  // Neoteris/NetScreen/Juniper secure-access lineage as its own chapter.
  { slug: "pulse-secure", key: "pulse", founded: 2003 },
  { slug: "palo-alto", key: "paloalto", founded: 2005 },
  // The teaching-era chapters (PRIME directive 2026-07-15: career vendors
  // include ALL vendors to today). Chronological by first engagement:
  { slug: "f5", key: "f5", founded: 1996 },                     // certified 2015, instructor 2020
  { slug: "fortinet", key: "fortinet", founded: 2000 },         // NSE ladder 2022, FCT 2024
  { slug: "netskope", key: "netskope", founded: 2012 },         // accreditations 2024, instructor 2025
  { slug: "ping-identity", key: "ping", founded: 2002 },        // PingFederate Practitioner 2025
  { slug: "zscaler", key: "zscaler", founded: 2007 },           // chapter opening 2026; hub on the roadmap
  { slug: "check-point", key: "checkpoint", founded: 1993 },    // chapter opening 2026; studying toward CCSA/CCSE, no delivery claim
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
  // Check Point's hub key is one word while its career slug is hyphenated,
  // which is why it was missing: nothing failed and no check complained, the
  // career card simply never rendered on that one hub. Added 2026-07-29.
  checkpoint: "check-point",
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

/** Career chapters that are ALSO Red Education training partners.
 *
 *  Populated 2026-07-28 (PRIME: "some should have two pills - Red Education's
 *  and mine"). The list was declared here long ago and left empty, so the
 *  industry timeline could only ever show one pill per company - and it showed
 *  the career one, because that was the strand the entry came from.
 *
 *  The two facts are independent and both are true of these nine: Rodolfo
 *  worked inside them AND Red Education delivers their authorized training.
 *  The six career chapters NOT listed here - Cabletron/Enterasys, Riverstone,
 *  IronPort, NetScreen/Juniper, FireEye/McAfee/Ixia and Pulse Secure - are
 *  absent for a simple reason: they no longer exist independently, so there is
 *  nobody left to partner with.
 *
 *  Source: the partner list rendered on /red-education, cross-checked against
 *  the Group B scope map noted above. */
/**
 * Red Education's vendor partnerships, DERIVED rather than declared.
 *
 * *** THIS WAS A HAND-MAINTAINED ARRAY OF NINE UNTIL 2026-08-06, AND IT WAS
 * WRONG. *** PRIME spotted that Avaya carried no partner pill on the industry
 * timeline; the cause was that Red Education partners with twenty-one vendors
 * represented on this site and only nine were listed here. Twelve companies -
 * Avaya, CyberArk, EPI, Nutanix, Paessler, Arista, Red Hat, Riverbed, Symantec,
 * MobileIron, Microsoft and AWS - were silently missing.
 *
 * The file already carried a comment warning that "two lists describing one
 * fact is exactly how they drifted apart", written after an earlier drift
 * between this list and the card renderer. The warning was right and the second
 * list survived it anyway. So the list is now COMPUTED from the `relationships`
 * declaration on each vendor, which is the same source the industry timeline
 * reads. It cannot disagree with the cards any more, because it is the cards.
 *
 * To change who is a partner, edit that vendor's `relationships` in
 * partners.ts. There is nothing to keep in step here.
 */
export const REDU_CAREER_PARTNERS: readonly string[] = partnerVendors
  .filter((v) => v.relationships?.includes("red-education-partner"))
  .map((v) => v.slug);

/** Vendors whose OFFICIAL training Rodolfo is authorized to deliver.
 *
 *  Narrower than REDU_CAREER_PARTNERS on purpose. Red Education partners with
 *  many vendors; Rodolfo personally holds instructor authorization for four.
 *  Conflating the two would overclaim, which is the exact error the vendor
 *  naming rules exist to prevent - so they are separate lists and the page
 *  shows separate tags. */
export const AUTHORIZED_INSTRUCTOR_VENDORS = [
  "f5",
  "fortinet",
  "netskope",
  "extreme",
] as const;
