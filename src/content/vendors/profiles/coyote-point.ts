// ============================================================================
// src/content/vendors/profiles/coyote-point.ts
// ----------------------------------------------------------------------------
// Coyote Point Systems, the Equalizer load balancer, acquired by Fortinet in
// 2013 (PRIME, 2026-11-02 07:59: "Add an entry for Coyote Point (acquired by
// Fortinet)").
//
// Sources, all read on 2026-11-02 (the Fortinet and SEC pages in PRIME's Chrome,
// because the investor site refuses this sandbox's curl; the rest with curl):
//   - Fortinet press release, 22 March 2013, "Fortinet(R) to Acquire Coyote
//     Point": definitive merger agreement; "Coyote Point was founded in 1999
//     and markets the Equalizer ADC product line"; Bill Kish "CEO and founder".
//   - Fortinet 10-K for 2013, note 6: acquired 21 March 2013 for $6.0 million in
//     cash plus up to $5.5 million in earn-out payments over two years.
//   - Fortinet press release, 12 August 2013: the FortiADC-300E is "Based on
//     Coyote Point's top-selling Equalizer E370LX".
//   - Fortinet Product Life Cycle (FortiCare sign-in), Hardware, Coyote Point:
//     the last Equalizer models' end of support, 13 September 2021.
//   - Coyote Point's own releases as republished: MacTech, 4 January 1999
//     (datelined Sunnyvale, California) and LWN, 25 October 2000 (Santa Clara).
//   - Wikipedia: the infobox records the company founded 1998.
// The founding year is a recorded conflict, kept in sourceNote rather than
// resolved silently: Fortinet says 1999, but Coyote Point's own release of
// 4 January 1999 already announces the Equalizer and a partnership.
// ============================================================================
import type { VendorProfile } from "@/content/vendors/profile-types";

/** The Coyote Point profile: one founding, a short timeline, the product, two
 *  documented firsts, the market and the acquisition record. */
export const coyotePointProfile: VendorProfile = {
  // Matches the partners.ts record.
  slug: "coyote-point",
  // The founding, with the year conflict and the place's provenance stated.
  foundings: [
    {
      company: "Coyote Point Systems",
      year: 1998,
      place: "Sunnyvale, California",
      founders: ["Bill Kish"],
      story:
        "Coyote Point made one product for most of its life: the Equalizer, an adaptive load balancer that sat in front of a group of web servers and spread the traffic across them. The company sold it from the start on price, as \"cost-effective load balancing hardware\" in its own words of January 1999, to the people who ran web sites rather than to the buyers of the largest application delivery platforms.",
      sourceNote:
        "Fortinet's release of 22 March 2013 says \"Coyote Point was founded in 1999\", but Coyote Point's own release of 4 January 1999, datelined Sunnyvale, California, already announces the Equalizer and a partnership, and Wikipedia's infobox records 1998; this record uses 1998. The place is the dateline of that earliest release; later releases are datelined Santa Clara, and Wikipedia gives the headquarters as Millerton, New York, and San Jose, California. Bill Kish is named \"CEO and founder\" by Fortinet; a complete founder list is not established here.",
    },
  ],
  // The timeline: the founding, two releases from the company's own record, the acquisition and what followed.
  timeline: [
    { year: 1998, title: "Coyote Point Systems is founded", detail: "A company built around one appliance, the Equalizer load balancer.", sourceNote: "Year per Wikipedia and the January 1999 release; Fortinet's 2013 release says 1999." },
    { year: 1999, title: "The Equalizer meets a monitoring partner", detail: "In January Coyote Point and Bright Tiger Technologies announced that the Equalizer's \"adaptive load balancing\" would work with Bright Tiger's ClusterCATS server monitoring, with open protocols written for the purpose.", sourceNote: "Coyote Point and Bright Tiger release, Sunnyvale, 4 January 1999, as republished by MacTech." },
    { year: 2000, title: "Equalizer 5.0 balances UDP", detail: "Announced for Internet World 2000 in New York: failover and high availability for WAP devices and network-attached storage devices, over UDP.", sourceNote: "Coyote Point release, Santa Clara, 25 October 2000, as republished by LWN." },
    { year: 2013, title: "Fortinet acquires Coyote Point", detail: "Announced on 22 March as a definitive merger agreement; Fortinet's annual report dates the acquisition 21 March and records $6.0 million in cash plus up to $5.5 million in earn-out payments over two years.", sourceNote: "Fortinet press release of 22 March 2013; Fortinet 10-K for 2013, note 6." },
    { year: 2013, title: "The first FortiADC built on an Equalizer", detail: "In August Fortinet announced the FortiADC-300E, \"Based on Coyote Point's top-selling Equalizer E370LX\", and a hosted global server load balancing service that worked with FortiADC, FortiBalancer and the Equalizer line.", sourceNote: "Fortinet press release of 12 August 2013." },
    { year: 2021, title: "The last Equalizers reach end of support", detail: "Fortinet's product life cycle lists the E250GX, E370LX, E470LX, E670LX and E970LX with an end-of-order date of 13 September 2016 and an end of support on 13 September 2021.", sourceNote: "Fortinet Product Life Cycle, Hardware, Coyote Point (FortiCare sign-in), read 2 November 2026." },
  ],
  // The product, and the Fortinet product it fed.
  products: [
    { name: "Equalizer", what: "The load balancing appliance, from the late-1990s models to the GX and LX series Fortinet supported until 2021: traffic spread across a server group, with failover, sold on price and performance." },
    { name: "FortiADC-300E (Fortinet)", what: "Fortinet's mid-range application delivery controller of August 2013, based on the Equalizer E370LX; the line continues as FortiADC." },
  ],
  // Two documented firsts, each from the company's own releases.
  innovations: [
    { title: "Load balancing sold on price", detail: "From \"cost-effective load balancing hardware\" in 1999 to \"the price/performance leader in Internet traffic management technology\" in 2000, Coyote Point positioned the Equalizer for the budget of a web team rather than a data centre programme." },
    { title: "Past the web: UDP in 2000", detail: "Equalizer 5.0 extended failover and high availability to UDP, naming WAP devices and network-attached storage devices as the targets." },
  ],
  // Who bought it, in the words of the record.
  markets: [
    "Organisations that needed their web and application servers kept available without the cost of the largest application delivery vendors. At the acquisition Bill Kish spoke of a \"top class ADC product portfolio and loyal customer base\" and of the chance, inside Fortinet, to make \"strategic technology investments in our ADC platform\".",
  ],
  // The acquisition as filed.
  analyst: [
    "Fortinet's annual report for 2013 records the price, $6.0 million in cash plus up to $5.5 million in earn-out payments, and the 2013 release described Coyote Point as \"a privately-held leading provider of enterprise-class application delivery, load balancing and acceleration solutions\".",
  ],
};
