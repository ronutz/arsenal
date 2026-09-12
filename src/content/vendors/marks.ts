// ============================================================================
// src/content/vendors/marks.ts
// ----------------------------------------------------------------------------
// VENDOR WORDMARK REGISTRY, WITH ERAS.
//
// WHAT THIS IS: a small registry of vendor logos held in public/img/marks/,
// each carrying the PERIOD during which it was that company's official mark.
// The site's history pages cover four decades, and a company's mark is itself
// dated evidence: showing Cisco's current mark beside a 1996 story is a quiet
// anachronism, in the same family as putting a modern screenshot in a story
// about a product that shipped on floppy disk.
//
// WHY IT EXISTS AT ALL (the decision, 2026-09-09): until today the site
// published NO vendor logo. src/components/TechIcons.tsx exists precisely
// because of that: original, generic, hand-drawn SVG for the vendor-page hero,
// depicting technical concepts rather than anyone's branding. PRIME supplied a
// curated set and stated he had personally verified each file against the
// respective vendor's brand guidelines. That verification is the basis on
// which these are held; it is recorded here so the reason is not lost.
//
// THE RULES, which the guard in scripts/check-marks.mjs enforces:
//
//   1. NOMINATIVE USE ONLY. A mark identifies the company being written about.
//      It never appears as decoration, never in a hero, never in a grid of
//      "technologies we work with", and never anywhere that could read as the
//      vendor endorsing this site or its author. The site states its own
//      authorizations in words, on /about and /about/credentials, and those
//      words are the claim - a logo is not a credential.
//
//   2. ERA MATCHING. A mark may only illustrate a period inside its own
//      `from`/`to` window. `to: null` means "still current". The guard cannot
//      read intent, so it enforces the machine-checkable half: every entry
//      resolves to a file that exists, eras do not overlap within a vendor,
//      and every vendor has at most one current mark.
//
//   3. NO TRADEMARK SYMBOLS ADDED OR REMOVED. Where a mark carries (R) or (TM)
//      in its artwork, it stays.
//
//   3b. A MARK MAY BE REDRAWN, INCLUDING TRACED TO VECTOR, FOR QUALITY ONLY
//      (PRIME, 2026-09-12; this reverses the earlier "used as supplied, never
//      redrawn"). The permitted reason is a limitation of the FILE - a raster
//      too small for a high-DPI render, a blurry scan, a bad export. The result
//      must stay FAITHFUL: same geometry, same proportions, same colours, same
//      trademark symbols.
//
//      What that rules out, still: restyling, recolouring, simplifying a
//      letterform because the tracer found it awkward, or "cleaning up" a mark
//      that is merely old-fashioned. If the redraw and the original are placed
//      side by side and a reader can tell which is which by anything other than
//      sharpness, it has gone too far.
//
//      A REDRAWN MARK SAYS SO IN ITS NOTE. Fidelity is a human judgement that
//      no guard can make, so the honest compensation is that the reader can
//      always tell a vendor's own file from one of ours. check-marks enforces
//      that every entry HAS a note; only a person can check that the note is
//      true.
//
//   4. ATTRIBUTION IN THE REPOSITORY, NOT ON THE PAGE. Each mark remains the
//      property of its owner; see the NOTICE file. These are not licensed
//      under the repository's Apache-2.0 (code) or CC BY 4.0 (content) terms,
//      which is why they are listed as an exception in REUSE.toml.
//
// The historic entries matter most and are the reason PRIME sent the set:
// Cabletron, Enterasys, Riverstone and NetScreen no longer exist as
// independent companies, so their marks are the only ones that will ever be
// correct for them - there is no "current" version coming.
// ============================================================================

/** One mark, and the period during which it was the company's official one. */
export interface VendorMark {
  /** Vendor key. Several marks may share one key across different eras. */
  vendor: string;
  /** Display name, as the company wrote it during this era. */
  label: string;
  /** Path under public/. */
  src: string;
  /** First year this mark was in official use (approximate is acceptable). */
  from: number;
  /** Last year of official use, or null if it is still current. */
  to: number | null;
  /**
   * Why this file is held, in one line. Present so that a reader of the
   * repository can see the provenance without leaving the source.
   */
  note: string;
}

export const VENDOR_MARKS: VendorMark[] = [
  // --- Companies that no longer exist independently -------------------------
  // These four are the reason the registry exists. Each is the mark of a
  // company that was acquired or dissolved, so no current version exists and
  // none ever will.
  {
    vendor: "cabletron",
    label: "Cabletron Systems",
    src: "/img/marks/cabletron-systems.svg",
    from: 1983,
    to: 2000,
    note: "Split into four companies in February 2000; the mark retired with the operating company.",
  },
  {
    vendor: "enterasys",
    label: "Enterasys Networks",
    src: "/img/marks/enterasys-networks.svg",
    from: 2000,
    to: 2013,
    note: "The enterprise half of the Cabletron split; acquired by Extreme Networks.",
  },
  {
    vendor: "riverstone",
    label: "Riverstone Networks",
    src: "/img/marks/riverstone-networks.svg",
    from: 2000,
    to: 2006,
    note: "The service-provider half of the Cabletron split; assets sold and the company wound down.",
  },
  {
    vendor: "netscreen",
    label: "NetScreen Technologies",
    src: "/img/marks/netscreen.svg",
    from: 1997,
    to: 2004,
    note: "Acquired by Juniper Networks; the product line continued under other names.",
  },
  {
    vendor: "ixia",
    label: "Ixia",
    src: "/img/marks/ixia.svg",
    from: 1997,
    to: 2017,
    note: "Test and measurement; acquired by Keysight Technologies.",
  },
  {
    vendor: "mcafee",
    label: "McAfee",
    src: "/img/marks/mcafee.svg",
    from: 1987,
    to: 2022,
    note: "Held for the enterprise-security era; the enterprise business was later separated and renamed.",
  },

  // --- Retired marks of companies that still exist --------------------------
  // The point of the whole registry: when the site writes about 1996, the mark
  // that belongs beside the text is the one the company used in 1996.
  {
    vendor: "cisco",
    label: "Cisco Systems",
    src: "/img/marks/cisco-systems-wordmark-pre2006.svg",
    from: 1984,
    to: 2006,
    note: "The 'Cisco Systems' wordmark with the bridge device, retired when the company shortened its public name to Cisco.",
  },
  {
    vendor: "juniper",
    label: "Juniper Networks",
    src: "/img/marks/juniper-networks-leaf-pre2019.svg",
    from: 1996,
    to: 2019,
    note: "The blue leaf-and-wordmark used through the Junos and SRX years covered by this site's history.",
  },

  // --- Current marks --------------------------------------------------------
  {
    vendor: "cisco",
    label: "Cisco",
    src: "/img/marks/cisco-current.svg",
    from: 2006,
    to: null,
    note: "The bridge device above the wordmark.",
  },
  {
    vendor: "juniper",
    label: "Juniper Networks",
    src: "/img/marks/juniper-networks-current.svg",
    from: 2019,
    to: null,
    note: "The current typographic wordmark.",
  },
  {
    vendor: "f5",
    label: "F5",
    src: "/img/marks/f5-current.svg",
    from: 1996,
    to: null,
    note: "Authorized-instructor platform; see /about/credentials for the credentials themselves.",
  },
  {
    vendor: "extreme",
    label: "Extreme Networks",
    src: "/img/marks/extreme-networks-swoosh.svg",
    from: 1996,
    to: 2015,
    note:
      "The purple swoosh with the green 'networks'. THIS FILE WAS PREVIOUSLY " +
      "REGISTERED AS THE CURRENT MARK, dated from the founding year - so the " +
      "entry was wrong twice and the two errors cancelled, rendering the right " +
      "logo for the wrong reason. Corrected 2026-09-11.",
  },
  {
    vendor: "extreme",
    label: "Extreme Networks",
    src: "/img/marks/extreme-networks-current.png",
    from: 2016,
    to: null,
    note:
      "The purple E with 'Extreme networks'. Dating evidence rather than proof: " +
      "Wikimedia Commons holds this artwork as 'Extreme Networks logo - new.png' " +
      "dated December 2015, and Extreme announced a new CEO and a new " +
      "solutions-based strategy in May 2015. The switchover ran through 2015; " +
      "the boundary is set at the year end because no source gives the date. " +
      "Good to a year, not to a day.",
  },
  {
    vendor: "fortinet",
    label: "Fortinet",
    src: "/img/marks/fortinet-current.svg",
    from: 2000,
    to: null,
    note: "Authorized-instructor platform.",
  },
  {
    vendor: "paloalto",
    label: "Palo Alto Networks",
    src: "/img/marks/palo-alto-networks-pre2020.png",
    from: 2005,
    to: 2019,
    note:
      "The boxed waveform in blue and green. Added 2026-09-11 after PRIME caught " +
      "that this registry held only the current mark and dated it from the " +
      "company's founding year - which put the 2020 logo on a chapter about 2013.",
  },
  {
    vendor: "paloalto",
    label: "Palo Alto Networks",
    src: "/img/marks/palo-alto-networks-current.svg",
    from: 2020,
    to: null,
    note:
      "The orange triad. Corrected from 'since 2005' on 2026-09-11. The rebrand " +
      "is confirmed by the agency that did it - Godfrey Dadich describe the mark " +
      "evolving 'from its original boxed-in waveform to a harmonious triad of " +
      "intersecting elements' - but no primary source gives a launch DATE, so " +
      "2020 is taken from the aggregators and from PRIME, who works with the " +
      "vendor. Treat the year as good-to-a-year, not to-a-day.",
  },
  {
    vendor: "fireeye",
    label: "FireEye",
    src: "/img/marks/fireeye.png",
    from: 2004,
    to: 2021,
    note:
      "The eye and flame. Added 2026-09-11 because the distribution chapter " +
      "carried NO mark at all: its career key is \"distribution\", a role rather " +
      "than a company, which resolves to nothing. Closed at 2021, when the " +
      "FireEye name and products went to Symphony Technology Group and the " +
      "remaining company renamed itself Mandiant; the mark is historic.",
  },
  {
    vendor: "tippingpoint",
    label: "TippingPoint",
    src: "/img/marks/tippingpoint.jpg",
    from: 1999,
    to: 2016,
    note:
      "The two-tone wordmark. Closed at 2016, when the line passed from HP to " +
      "Trend Micro and was folded into their Network Defense branding; the mark " +
      "is historic. Added 2026-09-11 with the catalogue entry - PRIME asked for " +
      "TippingPoint after a logo search for \"ping\" matched it, which was itself " +
      "the near-miss that nearly put this company's mark on the Ping Identity " +
      "chapter.",
  },
  {
    vendor: "netskope",
    label: "Netskope",
    src: "/img/marks/netskope-current.svg",
    from: 2024,
    to: null,
    note:
      "Vendor-supplied vector, the FULL-COLOUR primary. Netskope also publishes " +
      "a reversed variant for dark backgrounds; full-colour is correct here " +
      "because the mark sits on a white plate, not on the page canvas. Dated " +
      "from the year this site's record of the vendor begins - the adoption " +
      "date of the mark itself is not established, and is not guessed at.",
  },
  {
    vendor: "zscaler",
    label: "Zscaler",
    src: "/img/marks/zscaler-current.svg",
    from: 2026,
    to: null,
    note:
      "REDRAWN, NOT VENDOR-SUPPLIED - declared here because rule 3b requires it. " +
      "The supplied file was a 250x54 raster, thin for a high-DPI render. " +
      "Upscaling was tested first and rejected: at the rendered size the " +
      "upscaled and original are indistinguishable, because interpolation adds " +
      "no detail. This is a vector trace of that raster, checked side by side " +
      "against it - geometry, proportions, colour #0068B5 and the trademark " +
      "symbol all preserved. A file from Zscaler's own brand kit should replace " +
      "it if one becomes available. Dated from the year the record begins; the " +
      "mark's adoption date is not established.",
  },
  {
    vendor: "ping",
    label: "Ping Identity",
    src: "/img/marks/ping-identity-current.svg",
    from: 2025,
    to: null,
    note:
      "True vector. Dated from the year the record begins; adoption date not " +
      "established. This site claims NO Ping authorization - see " +
      "scripts/check-authorization-claims.mjs, which enforces that in prose.",
  },
  {
    vendor: "forgerock",
    label: "ForgeRock",
    src: "/img/marks/forgerock.png",
    from: 2010,
    to: 2023,
    note:
      "Historic. ForgeRock was founded in 2010 and acquired by Ping Identity " +
      "under Thoma Bravo in 2023, after which the brand was folded into Ping's. " +
      "Those two years are from general knowledge rather than a cited source in " +
      "this repository; treat them as good to a year and verify before they are " +
      "used for any claim that depends on the exact date.",
  },
  {
    vendor: "pulse",
    label: "Pulse Secure",
    src: "/img/marks/pulse-secure.png",
    from: 2014,
    to: 2020,
    note:
      "Historic. Pulse Secure existed as a company only between the Siris " +
      "Capital carve-out from Juniper in 2014 and Ivanti's acquisition, which " +
      "closed 1 December 2020 - so the mark's era IS the company's lifetime, " +
      "which is unusually easy to date. The line it carried is older than the " +
      "name and continues after it; see the pulse-secure chapter.",
  },
  {
    vendor: "checkpoint",
    label: "Check Point Software Technologies",
    src: "/img/marks/check-point.png",
    from: 2026,
    to: null,
    note:
      "CROPPED, not redrawn: the supplied file was a composite - the wordmark " +
      "above a large illustrated panel - and only the wordmark is the mark. " +
      "Selecting it changes nothing about the artwork. Dated from the year this " +
      "site's record begins; Check Point was founded in 1993 and the adoption " +
      "date of this wordmark is not established, so no earlier claim is made. " +
      "This site claims NO Check Point authorization.",
  },
  {
    vendor: "ironport",
    label: "IronPort Systems",
    src: "/img/marks/ironport.png",
    from: 2000,
    to: 2007,
    note:
      "Historic. IronPort was founded in 2000 and acquired by Cisco in 2007, " +
      "after which the appliances were sold under Cisco's name and the mark " +
      "retired. Dates are from general knowledge rather than a source cited in " +
      "this repository; good to a year.",
  },
];

/**
 * The mark that was official in a given year, for a vendor.
 *
 * Returns undefined when no mark covers that year, which is the correct
 * outcome for a period the registry does not hold - callers render the vendor
 * name as text rather than reaching for a mark from the wrong decade.
 *
 * @param vendor - vendor key, e.g. "cisco"
 * @param year - the year the surrounding text is about
 */
export function markForYear(vendor: string, year: number): VendorMark | undefined {
  return VENDOR_MARKS.find(
    (m) => m.vendor === vendor && year >= m.from && (m.to === null || year <= m.to)
  );
}

/** Every mark held for a vendor, oldest first. */
export function marksForVendor(vendor: string): VendorMark[] {
  return VENDOR_MARKS.filter((m) => m.vendor === vendor).sort((a, b) => a.from - b.from);
}
