// ============================================================================
// src/content/vendors/profiles/fireeye-mcafee-ixia.ts
// ----------------------------------------------------------------------------
// FIREEYE, McAFEE & IXIA - the 2015-2018 value-added distribution years,
// three vendors carried into the Brazilian channel at a hinge moment for all
// three: FireEye at peak nation-state fame, McAfee mid-divorce from Intel,
// Ixia finishing its acquisition ladder and selling to Keysight. Per the
// career page's standing choice, distributor names stay out of public copy.
//
// Design: the McAfee-FireEye-Mandiant-Trellix saga already has its full
// record on the Trellix partner page (Round 3); this profile keeps those two
// compressed and gives IXIA - which has no other home on the site - its full
// verified record. careerLink cross-references the partner page.
//
// Verified 2026-07-15: Wikipedia Ixia (founded 1997 by Errol Ginsberg + Joel
// Weissberger, Calabasas; CEO arc Bhatnagar 2007, Alston 2012, Bethany Mayer
// at sale; Catapult Jun 2009; Agilent N2X line 2009 $44M; VeriWave Jul 2011;
// Anue completed Jun 4, 2012; BreakingPoint announced Aug 24, 2012; Net
// Optics announced Oct 29, 2013; Keysight ~$1.6B 2017), TheStreet/Seeking
// Alpha/Fibre Systems (Anue $145-155M; BreakingPoint $160M; Net Optics
// $190M; $19.65/share = 45% premium to Dec 1, 2016 unaffected price;
// announced Jan 30, 2017), Grokipedia (NASDAQ XXIA; ~1,750-1,800 staff, ~25
// countries; top 15 NEMs, 47 of top 50 carriers, 77 of Fortune 100;
// PerfectStorm terabit-scale from BreakingPoint; Flex Tap 1G-400G), Temcom
// (FY2015 revenue $516M). R3 canon (Trellix partner page): McAfee 1987;
// Intel $7.68B closed Feb 2011; TPG JV closed Apr 3, 2017 (51/49, ~$4.2B);
// FireEye founded 2004 Milpitas by Ashar Aziz (ex-Sun), MVX, IPO Sep 2013;
// Mandiant closed Dec 30, 2013 (>$1B); APT1 Feb 2013; STG 2021 (McAfee
// Enterprise $4.0B Jul; FireEye products + name $1.2B Oct); Trellix Jan 19,
// 2022; McAfee consumer >$14B closed Mar 1, 2022; Google-Mandiant closed
// Sep 12, 2022.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const fireeyeMcafeeIxiaProfile: VendorProfile = {
  slug: "fireeye-mcafee-ixia",
  foundings: [
    {
      company: "McAfee",
      year: 1987,
      place: "Santa Clara, California",
      founders: ["John McAfee"],
      story:
        "John McAfee founded the company in 1987 and effectively created the commercial antivirus category - software that would ride three decades of ownership changes, from Network Associates through Intel to private equity. The founder himself was gone by 1994; the brand outlived every parent. The full corporate saga - Intel, TPG, STG, and the Trellix merger - is told on this site's Trellix partner page.",
    },
    {
      company: "FireEye",
      year: 2004,
      place: "Milpitas, California",
      founders: ["Ashar Aziz"],
      story:
        "Sun Microsystems veteran Ashar Aziz founded FireEye around a contrarian engine: instead of matching signatures, detonate suspicious code in virtual machines and watch what it does - the Multi-Vector Virtual Execution (MVX) architecture. The approach made FireEye the name enterprises called when nation-states came knocking, a reputation sealed by the 2013 Mandiant acquisition and the APT1 report that named a Chinese military unit in public.",
    },
    {
      company: "Ixia",
      year: 1997,
      place: "Calabasas, California",
      founders: ["Errol Ginsberg", "Joel Weissberger"],
      story:
        "Ginsberg and Weissberger built the industry's referee: hardware and software that generated traffic at line rate and told the truth about whether networks and the boxes inside them actually performed as claimed. Every serious router, switch, and firewall of the era faced an Ixia chassis before it faced a customer. From IP test the company expanded into wireless, visibility, and security testing - largely by acquisition - and listed on NASDAQ as XXIA, growing to roughly 1,800 people across some 25 countries.",
    },
  ],
  timeline: [
    { year: 1997, title: "Ixia: the referee incorporates", detail: "Founded in Calabasas as the network industry's test bench - protocol emulation and load generation at line rate. Errol Ginsberg runs it for a decade before handing the CEO chair to Atul Bhatnagar in 2007; Bethany Mayer holds it at the end." },
    { year: 2004, title: "FireEye founded", detail: "Ashar Aziz starts FireEye in Milpitas around MVX - signatureless detection by detonation. The first product ships in 2010; the September 2013 IPO and the Mandiant deal (closed December 30, 2013, at over $1 billion) make it the marquee name of the nation-state era.", sourceNote: "Trellix partner-page canon (Round 3)." },
    { year: 2009, title: "Ixia's ladder begins - with Agilent's own line", detail: "Catapult Communications (June 2009) takes Ixia into wireless test, and the N2X data networks product line arrives for $44 million - bought from Agilent Technologies, whose future spinoff would one day buy Ixia whole." },
    { year: 2012, title: "Visibility and security testing in one year", detail: "Anue Systems closes June 4, 2012 (~$145 million) bringing network visibility and tap aggregation; BreakingPoint follows in August ($160 million), whose threat-simulation engine becomes the PerfectStorm platform - terabit-scale traffic emulating millions of endpoints. Net Optics adds the tap portfolio in 2013 for $190 million.", sourceNote: "Anue reported between $145M and $155M across coverage." },
    { year: 2015, personal: true, title: "Rodolfo's distribution chapter opens", detail: "The 2015-2018 value-added distribution years: carrying FireEye, McAfee, and Ixia into the Brazilian channel - three vendors at three different inflection points, sold side by side into the same security-conscious accounts." },
    { year: 2017, title: "Two of the three change hands mid-chapter", detail: "April 3, 2017: Intel's majority stake in McAfee moves to TPG (a 51/49 joint venture valuing the business around $4.2 billion) - the brand becomes independent again mid-distribution-cycle. January 30, 2017: Keysight announces the $1.6 billion all-cash acquisition of Ixia at $19.65 per share - a 45 percent premium - completing it later that year.", sourceNote: "McAfee per Trellix partner-page canon; Ixia terms per contemporary coverage of the Jan 30, 2017 announcement." },
    { year: 2017, title: "Ixia joins the oldest lineage in the industry", detail: "Keysight is Agilent's 2014 test-and-measurement spinoff, and Agilent was Hewlett-Packard's 1999 spinoff - so the referee of the Internet era ended up inside the direct descendant of the original 1939 Palo Alto garage instrument business.", sourceNote: "Keysight corporate lineage per its published history." },
    { year: 2022, title: "The security endgames", detail: "The other two stories resolve after the distribution years: STG assembles McAfee Enterprise ($4.0 billion, 2021) and FireEye's products and name ($1.2 billion, 2021) into Trellix (January 19, 2022); McAfee's consumer business goes private at over $14 billion (March 2022); Google closes Mandiant that September. The complete record lives on the Trellix partner page." },
  ],
  products: [
    { name: "Ixia IxNetwork and hardware chassis", what: "The protocol-emulation and load platforms that certified a generation of routers and switches - the gear on which vendors' datasheet claims lived or died." },
    { name: "Ixia PerfectStorm and BreakingPoint", what: "Security testing at terabit scale: real application traffic and live attack simulation - DDoS, exploits, malware - against millions of emulated endpoints." },
    { name: "Ixia visibility: taps and packet brokers", what: "The Anue and Net Optics lineage - passive Flex Taps from 1G to 400G and aggregation layers feeding monitoring and security tools without blind spots." },
    { name: "FireEye MVX appliances", what: "Detonation-based detection across email, web, and file vectors - the platform that defined advanced-threat defense in the mid-2010s channel." },
    { name: "McAfee ePO and the endpoint suite", what: "ePolicy Orchestrator and the endpoint estate - the management console that made McAfee the incumbent standard the channel knew how to sell." },
  ],
  innovations: [
    { title: "Test as ground truth", detail: "Ixia made independent, repeatable measurement the industry's arbiter - performance was not what the datasheet said, it was what the chassis proved." },
    { title: "Detection by detonation", detail: "FireEye's MVX replaced signature matching with behavior: run the suspect code in instrumented virtual machines and judge the actions, not the hash." },
    { title: "The category John McAfee started", detail: "Commercial antivirus as a product - born 1987, and durable enough to survive every owner it ever had." },
    { title: "Growth by bolt-on", detail: "Ixia assembled wireless, visibility, and security testing through five acquisitions in five years - then became the bolt-on itself, at a 45 percent premium." },
  ],
  markets: [
    "Ixia's franchise was quietly universal: its customers included the top 15 network equipment manufacturers, 47 of the top 50 carriers, and 77 of the Fortune 100 - with roughly $516 million in fiscal 2015 revenue as it entered the distribution years told above.",
    "The 2015-2018 chapter put all three side by side in the Brazilian channel: FireEye at the height of its nation-state reputation, McAfee regaining independence from Intel mid-cycle, and Ixia validating and monitoring the very networks the other two defended.",
  ],
  analyst: [
    "Keysight's $19.65 per share represented a 45 percent premium to Ixia's unaffected price - the market's verdict on owning the industry's measurement layer.",
    "The three endgames diverged completely: Ixia into a test-and-measurement dynasty (2017), McAfee and FireEye recombined by STG into Trellix with some 40,000 customers (2022), and Mandiant into Google - three channel line cards, three different fates.",
  ],
  careerLink: {
    href: "/about/vendors/partner/mcafee-fireeye-trellix",
    label: "The full McAfee, FireEye, Mandiant and Trellix corporate saga - the Trellix partner page",
  },
};
