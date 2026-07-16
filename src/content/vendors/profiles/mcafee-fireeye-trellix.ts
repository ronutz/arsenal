// ============================================================================
// src/content/vendors/profiles/mcafee-fireeye-trellix.ts
// ----------------------------------------------------------------------------
// McAFEE, FIREEYE & MANDIANT - THE ROAD TO TRELLIX. Three security pioneers,
// one private-equity remix: in 2021-2022 Symphony Technology Group carved out
// McAfee Enterprise ($4.0B) and FireEye's products plus the FireEye name
// ($1.2B), fused them into Trellix and spun the SSE portfolio out as Skyhigh
// Security; the remaining company renamed itself Mandiant and was absorbed
// into Google Cloud; McAfee's consumer business went private for over $14B.
//
// Verified 2026-07-14 against primary sources: Alphabet 10-K FY2022 (Mandiant
// closed Sep 12, 2022 - $6.1B total incl. cash and debt vs $5.4B announced),
// McAfee SEC 8-K (Advent/Permira take-private >$14B, closed Mar 1, 2022),
// Trellix press release (FireEye $1.2B close, Oct 2021), Dark Reading /
// Computer Weekly / CyberScoop (Trellix Jan 2022, Skyhigh Mar 2022),
// Wikipedia + industry press for the McAfee corporate arc (Intel $7.68B
// closed Feb 2011; TPG JV closed Apr 3, 2017; second IPO Oct 2020).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const mcafeeFireeyeTrellixProfile: VendorProfile = {
  slug: "mcafee-fireeye-trellix",
  foundings: [
    {
      company: "McAfee Associates",
      year: 1987,
      place: "Santa Clara, California",
      founders: ["John McAfee"],
      story:
        "One of the first commercial antivirus companies, built on a then-radical shareware distribution model: let the software spread, charge the businesses. John McAfee resigned as CEO in 1993 and left the company in 1994; the business merged with Network General (alongside PGP and Helix Software) to form Network Associates in 1997, then took the McAfee name back in 2004. The brand outlived its founder's involvement by decades.",
    },
    {
      company: "FireEye",
      year: 2004,
      place: "Milpitas, California",
      founders: ["Ashar Aziz"],
      story:
        "Founded by a former Sun Microsystems engineer on a simple, expensive idea: detonate suspicious traffic inside virtual machines before it reaches the network. The MVX engine shipped as FireEye's first commercial product in 2010, and after its September 2013 IPO the company became the name enterprises called when they suspected a nation-state was already inside.",
    },
    {
      company: "Mandiant",
      year: 2004,
      place: "Alexandria, Virginia",
      founders: ["Kevin Mandia"],
      story:
        "A former US Air Force officer founded the firm as Red Cliff Consulting in 2004 and rebranded it Mandiant in 2006, turning incident response into a discipline: the team you call when something has already gone very wrong. The February 2013 APT1 report traced espionage against more than 141 organizations to PLA Unit 61398 in Shanghai's Pudong district - a landmark in public attribution. Mandiant later led the responses to SolarWinds (2020) and Colonial Pipeline (2021).",
    },
  ],
  timeline: [
    { year: 1987, title: "McAfee Associates founded", detail: "John McAfee starts one of the first commercial antivirus companies, distributing VirusScan shareware-style." },
    { year: 1994, title: "John McAfee leaves", detail: "The founder resigned as CEO in 1993, moved to CTO, and departed entirely in 1994 - the brand carried on without him." },
    { year: 1997, title: "Network Associates formed", detail: "McAfee Associates merges with Network General, alongside PGP and Helix Software - endpoint and network security under one roof." },
    { year: 2004, title: "Three stories align", detail: "Network Associates sells Magic and Sniffer and takes back the McAfee name. The same year, Ashar Aziz founds FireEye in Milpitas and Kevin Mandia founds Red Cliff Consulting in Virginia (renamed Mandiant in 2006)." },
    { year: 2010, title: "Intel bids for McAfee; FireEye ships", detail: "On August 19, 2010 Intel announces a $48-per-share, $7.68 billion acquisition of McAfee. FireEye's MVX-based product line reaches market the same year." },
    { year: 2011, title: "Intel closes; the chip-security era", detail: "The acquisition completes in February 2011; from January 2014 the brand becomes Intel Security - an experiment in embedding security into silicon that never quite found its synergy." },
    { year: 2013, title: "APT1, the FireEye IPO, and a $1B union", detail: "February: Mandiant's APT1 report names PLA Unit 61398. September: FireEye IPOs. December 30: FireEye closes its acquisition of Mandiant for over $1 billion (~$900M in stock plus ~$106.5M cash) - detection technology meets the industry's premier responders." },
    { year: 2017, title: "McAfee spins back out", detail: "Intel's joint venture with TPG closes on April 3, 2017: TPG takes 51%, Intel keeps 49%, the McAfee name returns at a ~$4.2 billion valuation." },
    { year: 2020, title: "Second IPO; SolarWinds", detail: "McAfee returns to NASDAQ in October 2020 at $20 per share (~$8.6B valuation). In December, Mandiant leads the investigation of the SolarWinds supply-chain compromise." },
    { year: 2021, title: "The STG carve-outs", detail: "Symphony Technology Group buys McAfee Enterprise for $4.0 billion (announced March 8, closed July) and FireEye's products business - including the FireEye name - for $1.2 billion (announced June, closed October). The remaining company renames itself Mandiant.", sourceNote: "Trellix press release; CyberScoop; Dark Reading." },
    { year: 2022, title: "The remix completes", detail: "January 19: STG launches Trellix - McAfee Enterprise plus FireEye, an XDR company with ~40,000 customers, ~5,000 employees and nearly $2B in revenue, led by Bryan Palma. March: the SSE portfolio spins out as Skyhigh Security, and an Advent/Permira-led group takes McAfee's consumer business private for over $14 billion (closed March 1). September 12: Google closes its acquisition of Mandiant.", sourceNote: "Announced at $5.4B; Alphabet's 10-K records a $6.1B total purchase price including cash and debt - Google's second-largest acquisition after Motorola Mobility." },
    { year: 2024, title: "Mandia steps back", detail: "Kevin Mandia transitions to an advisory role at Google on May 31, 2024, two decades after founding the firm." },
    { year: 2025, title: "Trellix changes hands at the top", detail: "STG names Vishal Rao as Trellix CEO in January 2025." },
    { year: 2015, personal: true, title: "Rodolfo's chapter: the distribution side", detail: "2015 to 2019: FireEye and McAfee ran through the portfolios Rodolfo carried at Westcon-Comstor and ScanSource in Brazil - pre-sales architecture, demonstrations, and channel enablement on both lines. The distribution career page tells the story." },
  ],
  products: [
    { name: "VirusScan and ePolicy Orchestrator (ePO)", what: "The endpoint suite and the management console that ran a generation of enterprise endpoints - ePO's centralized policy model became the template for the category." },
    { name: "FireEye MVX appliances", what: "Network and email detonation: suspicious objects executed in instrumented virtual machines before delivery - the sandbox that defined APT detection." },
    { name: "Mandiant incident response and threat intelligence", what: "Breach response, forensics, and adversary intelligence - now Mandiant Consulting and Google Threat Intelligence inside Google Cloud." },
    { name: "Trellix XDR platform", what: "The merged portfolio - FireEye Helix analytics plus McAfee ENS endpoint - built to ingest more than 600 native and open security technologies." },
    { name: "Skyhigh Security SSE", what: "The McAfee Enterprise edge portfolio relaunched: secure web gateway, CASB, ZTNA, cloud DLP, remote browser isolation, cloud firewall, and CNAPP." },
  ],
  innovations: [
    { title: "Commercial antivirus at scale", detail: "McAfee proved security software could spread like the threats it fought - shareware distribution built the installed base, enterprises paid for management." },
    { title: "Centralized endpoint management", detail: "ePolicy Orchestrator made thousands of endpoints administrable from one console, defining how enterprise endpoint security is operated." },
    { title: "Virtual-machine detonation", detail: "FireEye's MVX engine analyzed malware by letting it run in a controlled VM - catching what signatures could not." },
    { title: "Public APT attribution", detail: "Mandiant's APT1 report named a specific Chinese military unit with published evidence, changing what private-sector threat intelligence was allowed to say out loud." },
    { title: "Incident response as an industry", detail: "Mandiant turned 'who you call after the breach' into a product category - and ultimately into a $6.1B Google acquisition." },
  ],
  markets: [
    "The lineage now spans four owners and four markets: Trellix (STG) sells XDR and endpoint security to enterprises, launched with roughly 40,000 customers and nearly $2 billion in revenue; Skyhigh Security (STG) carries the SSE portfolio; Mandiant operates inside Google Cloud as its threat-intelligence and incident-response arm; and McAfee's consumer business protects home users as a private company under an Advent/Permira-led group.",
    "Rodolfo's own connection to this lineage is from the distribution side: he carried the FireEye and McAfee lines in Brazil during his Westcon-Comstor and ScanSource years.",
  ],
  analyst: [
    "At launch in January 2022, Trellix combined roughly 40,000 customers, 5,000 employees, and nearly $2 billion in revenue - immediately one of the largest pure-play enterprise security vendors.",
    "Google's purchase of Mandiant closed as the company's second-largest acquisition ever, behind only the $12.5 billion Motorola Mobility deal - a measure of what incident-response credibility had become worth.",
  ],
  careerLink: {
    href: "/about/vendors/fireeye-mcafee-ixia",
    label: "Rodolfo distributed FireEye and McAfee in Brazil - see the career page",
  },
};
