// ============================================================================
// COMPAQ - the clone that became the king. Knowledge-based, dates
// well-documented (2026-07-16): founded Feb 1982, Houston, by Rod Canion, Jim
// Harris, Bill Murto (ex-Texas Instruments; the famous placemat sketch);
// clean-room reverse-engineered IBM PC BIOS; Compaq Portable 1983 ($111M
// first-year revenue - a record); Deskpro 386 Sept 1986 (beats IBM to the
// 386); EISA consortium vs IBM's MCA 1988; Pfeiffer CEO 1991 price war ->
// world's largest PC maker mid-90s; ProLiant 1993; Tandem acquired 1997
// (~$3B), DEC 1998 (~$9.6B); Pfeiffer out 1999; HP merger announced Sept 3,
// 2001, completed May 3, 2002 (~$25B; the Fiorina-Hewlett proxy fight).
// Cross-link: the DEC page tells the absorbed bloodline.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const compaqProfile: VendorProfile = {
  slug: "compaq",
  foundings: [
    {
      company: "Compaq",
      year: 1982,
      place: "Houston, Texas",
      founders: ["Rod Canion", "Jim Harris", "Bill Murto"],
      story:
        "Three Texas Instruments managers sketched a portable computer on a House of Pies placemat in 1982 and built the most consequential clone in history. Compaq's real invention was legal, not technical: a clean-room reverse-engineering of the IBM PC BIOS - engineers who had never seen IBM's code writing to a specification prepared by those who had - which made 'IBM compatible' a lawful product category. The Portable earned a record $111 million in its first year, and the compatible industry Compaq legitimized eventually outgrew IBM itself.",
    },
  ],
  timeline: [
    { year: 1983, title: "The Portable, and the record", detail: "The 28-pound 'luggable' ships fully IBM-compatible; $111 million in first-year revenue - the fastest start in American business history to that point." },
    { year: 1986, title: "Deskpro 386: beating IBM", detail: "September 1986: Compaq ships Intel's 80386 before IBM does - the moment leadership of the PC standard visibly passes from the standard's creator to its cloners." },
    { year: 1988, title: "EISA vs Micro Channel", detail: "Compaq marshals the 'Gang of Nine' behind the open EISA bus against IBM's proprietary MCA - and wins; the compatible industry, not IBM, now governs the platform." },
    { year: 1993, title: "ProLiant, and the price war", detail: "Eckhard Pfeiffer's 1992 price offensive and the ProLiant server line take Compaq to world's-largest-PC-maker by mid-decade - x86 servers begin eating the room the minicomputers lived in." },
    { year: 1998, title: "Swallowing Tandem and DEC", detail: "Tandem's NonStop line (1997, ~$3B) and then Digital Equipment (~$9.6 billion, 1998 - the largest computer deal to date) make Compaq an everything-company overnight; digesting DEC proves harder than buying it. The absorbed bloodline is told on this section's DEC page." },
    { year: 2002, title: "The HP merger", detail: "May 3, 2002: the ~$25 billion merger with HP completes after the bitter Fiorina-versus-Walter-Hewlett proxy fight - the placemat company ends inside the garage company, and the Compaq brand fades through the decade.", sourceNote: "Announced September 3, 2001; close per the deal record." },
  ],
  products: [
    { name: "Compaq Portable", what: "The luggable that founded the compatible industry - and the company - in one product." },
    { name: "Deskpro line", what: "The corporate desktop standard-bearer that repeatedly beat IBM to Intel's next chip." },
    { name: "ProLiant servers", what: "The x86 server franchise that outlived every brand above it - still HPE's server name today." },
  ],
  innovations: [
    { title: "The clean-room BIOS", detail: "Compaq's legal engineering made the PC an open platform in practice - every compatible, and arguably the commodity-hardware world this site's tools run on, descends from it." },
    { title: "Platform governance by coalition", detail: "EISA proved the clones could out-standardize the standard's owner - industry consortia as a competitive weapon." },
  ],
  markets: [
    "Compaq's DNA survives as HPE's ProLiant line and HP's consumer heritage; its deeper legacy is the open PC platform itself, wrestled from IBM without a lawsuit lost.",
  ],
  analyst: [
    "The reference compatible of the evaluations for two decades - first as the premium clone, then as the volume king the direct-sales model finally undercut.",
  ],
};
