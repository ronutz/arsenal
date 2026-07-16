// ============================================================================
// src/content/vendors/partners.ts
// ----------------------------------------------------------------------------
// PARTNER & OTHER-VENDOR DATA - drives the non-career vendor pages linked from
// the Vendors index. Three groups:
//
//   group: "redu"  -> vendors Red Education is an AUTHORIZED training partner
//                     for, but that Rodolfo does NOT personally deliver. These
//                     pages carry a clear disclaimer (he doesn't teach it; Red
//                     Education's award-winning team does) plus verified award
//                     facts.
//   group: "other" -> vendors from Rodolfo's career-era lineage that map onto a
//                     current company via their IP, founders, or key people.
//                     Corporate-history pages, no training claim of any kind.
//
// ACCURACY GUARDRAILS (verified 2026-07-14 against primary sources):
//   - Rodolfo's OWN authorized-instructor vendors are ONLY F5, Fortinet,
//     Netskope, Extreme Networks. NONE of the vendors in this file are ones he
//     delivers training for - the redu pages say so explicitly.
//   - Red Education does NOT deliver HPE / Aruba / Juniper training. Those live
//     in the "other" group as corporate-lineage entries only, with no Red
//     Education association implied.
//   - Every acquisition/ownership fact must be cross-checked before it ships;
//     entries here were verified against company sites, SEC filings, and
//     reputable press. Pages for unverified vendors are omitted until checked.
// ============================================================================

export interface PartnerVendor {
  slug: string;
  group: "redu" | "other" | "contemporary";
  /** Display name (current company for "other", the vendor for "redu"). */
  name: string;
  /** One-line positioning shown on the card and hero. */
  tagline: string;
  /** Longer intro paragraph on the page. */
  intro: string;
  /** For "redu": what Red Education delivers + award proof. For "other": the lineage story. */
  body: string[];
  /** Optional verified awards/recognitions (redu group). */
  awards?: string[];
  /** Optional external link (vendor training page / company page). */
  externalUrl?: string;
  /** Optional label for the external link. */
  externalLabel?: string;
  /** Source list for provenance. */
  sources?: { label: string; url: string }[];
  /** Optional accuracy note rendered as an aside (e.g. training-delivery facts). */
  note?: string;
}

// Verified Red Education award facts, reused across redu pages (2026-07-14).
const REDU_AWARDS_GENERAL = [
  "Cybersecurity Excellence Awards 2025 - Best Cybersecurity Education Provider",
  "Cybersecurity Excellence Awards 2025 - Best Cybersecurity Certification Training",
  "Cybersecurity Excellence Awards 2025 - Cybersecurity Instructor Team of the Year",
  "100,000+ students trained across 132 countries; 4.9-star average from 5,000+ reviews",
];

const REDU_SOURCES = [
  { label: "Red Education - vendor training pages", url: "https://www.rededucation.com/" },
  { label: "Red Education - awards", url: "https://www.rededucation.com/news/" },
];

export const partnerVendors: PartnerVendor[] = [
  // ---- GROUP: Red Education training partners (Rodolfo does NOT teach these) ----
  {
    slug: "nutanix",
    group: "redu",
    name: "Nutanix",
    tagline: "Hybrid multicloud and hyper-converged infrastructure.",
    intro:
      "Nutanix builds the hybrid multicloud platform that runs and manages applications and data across private and public clouds, built on hyper-converged infrastructure.",
    body: [
      "Red Education is a Nutanix Authorised Training Partner, recognised by Nutanix as Highest Quality and Top Performing Authorized Training Partner of the Year, with a 98% customer-satisfaction rating on its Nutanix courses.",
    ],
    awards: [
      "Nutanix Highest Quality and Top Performing Authorized Training Partner of the Year",
      ...REDU_AWARDS_GENERAL,
    ],
    externalUrl: "https://www.rededucation.com/nutanix/",
    externalLabel: "Nutanix training at Red Education",
    sources: [
      { label: "Red Education - Nutanix (ATP, 98% CSAT)", url: "https://www.rededucation.com/nutanix/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "arista",
    group: "redu",
    name: "Arista Networks",
    tagline: "Cloud-scale data-center and campus networking (EOS).",
    intro:
      "Arista Networks builds high-performance, cloud-scale networking - switches and routers running the programmable EOS operating system, widely deployed in data centers.",
    body: [
      "Red Education is an authorised training partner for Arista, delivering the Arista Cloud Engineer (ACE) certification program with a 98% customer-satisfaction rating.",
    ],
    awards: REDU_AWARDS_GENERAL,
    externalUrl: "https://www.rededucation.com/arista/",
    externalLabel: "Arista training at Red Education",
    sources: [
      { label: "Red Education - Arista (authorised training partner)", url: "https://www.rededucation.com/arista/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "check-point",
    group: "redu",
    name: "Check Point Software Technologies",
    tagline: "Enterprise network security and threat prevention.",
    intro:
      "Check Point Software Technologies is one of the longest-established network-security vendors, known for its firewall and unified threat-prevention platforms across enterprise, cloud, and endpoint.",
    body: [
      "Red Education is a Check Point Authorized Training Center, named Check Point Software Technologies Platinum Elite ATC Partner of the Year 2024 and a Gold Stevie Award winner with Check Point for Global Partnership of the Year.",
    ],
    awards: [
      "Check Point Platinum Elite ATC Partner of the Year 2024",
      "Gold Stevie Award - Global Partnership of the Year (with Check Point)",
      ...REDU_AWARDS_GENERAL,
    ],
    externalUrl: "https://www.rededucation.com/checkpoint/",
    externalLabel: "Check Point training at Red Education",
    sources: [
      { label: "Red Education - Check Point (CCSA/CCSE ATC)", url: "https://www.rededucation.com/checkpoint/" },
      ...REDU_SOURCES,
    ],
  },

  // ---- GROUP: Other vendors (corporate lineage; no training association) ----
  {
    slug: "avaya",
    group: "redu",
    name: "Avaya",
    tagline: "Enterprise communications: Aura, IP Office, and contact center.",
    intro:
      "Avaya builds enterprise communications and contact-center platforms - the Aura suite, IP Office, and the Experience Platform - carrying decades of voice-engineering heritage into unified communications and CX.",
    body: [
      "Red Education runs one of the deepest Avaya schedules in its catalogue: Aura core components, System Manager and Communication Manager administration, IP Office integration and support, Meetings Server, Messaging, Experience Portal, and Call Center Elite courses run across all five of its regions, with public dates virtually every week.",
      "Avaya was spun out of Lucent Technologies in 2000, inheriting the enterprise half of a lineage that reaches back through AT&T to Bell Labs. It restructured through Chapter 11 twice, in 2017 and again briefly in 2023, and today concentrates on large-enterprise communications and contact center, increasingly delivered as cloud and hybrid services.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/avaya/",
    externalLabel: "Avaya training at Red Education",
    sources: [
      { label: "Red Education - Avaya training", url: "https://www.rededucation.com/avaya/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "aws",
    group: "redu",
    name: "Amazon Web Services",
    tagline: "The cloud platform that defined the category.",
    intro:
      "Amazon Web Services is the largest public cloud, the platform whose 2006 launch of S3 and EC2 turned computing into a utility and defined what the industry now means by cloud.",
    body: [
      "Red Education names AWS among the leading brands it works with in its award submissions and delivers AWS coursework alongside its security-vendor portfolio, extending the same instructor-led, lab-driven format to cloud fundamentals and architecture.",
      "AWS began inside Amazon as infrastructure plumbing and was opened to the world in 2006; within a decade it was the profit engine of its parent and the default substrate for startups and enterprises alike. Every SASE, SSE, and cloud-security curriculum in the rest of this catalogue ultimately assumes a world AWS created.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - Cybersecurity Excellence Awards profile", url: "https://cybersecurity-excellence-awards.com/candidates/red-education/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "cyberark",
    group: "redu",
    name: "CyberArk",
    tagline: "Privileged access and identity security.",
    intro:
      "CyberArk defined the privileged-access-management category: vaulting, rotating, and brokering the credentials and secrets that hold the keys to everything else, extended over time into a full identity-security platform.",
    body: [
      "Red Education delivers CyberArk's official training track, with PAM administration courses running publicly across its Australasia, SAARC, and ASEAN schedules and available to the other regions on demand.",
      "Founded in 1999 in Israel by Udi Mokady and Alon Cohen, CyberArk listed on NASDAQ in 2014 and became the reference vendor auditors name when they say privileged access. In February 2026 it became part of Palo Alto Networks in the largest security acquisition on record, a combination this site's Palo Alto Networks history page covers from the acquirer's side.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/cyberark/",
    externalLabel: "CyberArk training at Red Education",
    sources: [
      { label: "Red Education - CyberArk training", url: "https://www.rededucation.com/cyberark/" },
      { label: "Palo Alto Networks 10-Q (CyberArk acquisition completed Feb 2026)", url: "https://investors.paloaltonetworks.com/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "epi",
    group: "redu",
    name: "EPI",
    tagline: "Data-centre training and TIA-942 certification.",
    intro:
      "EPI (Enterprise Products Integration Pte Ltd) is the Singapore-headquartered body behind the vendor-neutral data-centre certification ladder - CDCP, CDCS, CDCE, CDFOM and peers - and one of the leading auditors certifying facilities against the ANSI/TIA-942 standard.",
    body: [
      "Red Education delivers EPI's data-centre courses across its regions, bringing facility design, operations, and standards-compliance training into the same catalogue as its network and security tracks; the certifications are examined independently through EXIN.",
      "EPI's framework is taught in more than 50 countries and has become the common language of data-centre operations teams: the CDCP alone is the entry credential facilities engineers worldwide are asked for by name. Its TIA-942 audit practice certifies the buildings the rest of this industry's software runs in.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/epi/",
    externalLabel: "EPI training at Red Education",
    sources: [
      { label: "EPI - training and TIA-942 services", url: "https://www.epi-ap.com/" },
      { label: "Red Education - EPI training", url: "https://www.rededucation.com/epi/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "microsoft",
    group: "redu",
    name: "Microsoft",
    tagline: "The platform company: Windows, Azure, and Microsoft 365.",
    intro:
      "Microsoft's operating systems, productivity suite, and Azure cloud form the substrate of most enterprise IT estates, which makes its technologies a standing presence in any serious training catalogue.",
    body: [
      "Microsoft appears as a selectable vendor in Red Education's course finder, taught with the same instructor-led model as the rest of the portfolio and often alongside the security platforms that protect Microsoft-centric estates.",
      "Founded in 1975 by Bill Gates and Paul Allen, Microsoft has anchored enterprise computing for five decades, from BASIC and MS-DOS through Windows and Office to Azure and its security business, today one of the industry's largest. Several stories in this site's glossary, from the Homebrew Computer Club's Open Letter to the disputed 640K quote, trace back to it.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - course finder (vendor list)", url: "https://www.rededucation.com/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "mobileiron",
    group: "redu",
    name: "MobileIron",
    tagline: "Mobile device management pioneer, now part of Ivanti.",
    intro:
      "MobileIron was one of the pioneers of mobile device management, building the platform enterprises first used to enroll, secure, and wipe fleets of smartphones as they flooded into the workplace.",
    body: [
      "MobileIron courseware remains in Red Education's regional catalogues for the installed base that still runs it, taught within the same unified-endpoint-management context its successor products live in.",
      "Founded in 2007 in Mountain View, MobileIron helped define MDM as a category and listed on NASDAQ in 2014. In December 2020 it was acquired by Ivanti, together with Pulse Secure, and its technology continues inside Ivanti's unified endpoint management line - a lineage note this site records the same way it does for its career-era vendors.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Ivanti press release - acquisition of MobileIron and Pulse Secure (Dec 2020)", url: "https://www.ivanti.com/company/press-releases/2020/ivanti-acquires-mobileiron-and-pulse-secure" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "paessler",
    group: "redu",
    name: "Paessler",
    tagline: "PRTG: the network monitoring standard of the mid-market.",
    intro:
      "Paessler builds PRTG, the sensor-based monitoring platform that thousands of IT teams use as their single pane for network, server, and infrastructure health.",
    body: [
      "Red Education carries Paessler across all five of its regional schedules, delivering official PRTG training that turns the tool most admins learn by osmosis into a discipline taught properly.",
      "Founded in 1997 by Dirk Paessler in Nuremberg, Germany, the company has stayed focused and independent for nearly three decades, an increasingly rare trajectory in this catalogue of acquisitions. PRTG's sensor model made monitoring approachable for teams without a tooling budget the size of their network.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    externalUrl: "https://www.rededucation.com/paessler/",
    externalLabel: "Paessler training at Red Education",
    sources: [
      { label: "Red Education - Paessler training", url: "https://www.rededucation.com/paessler/" },
      { label: "Paessler - company", url: "https://www.paessler.com/company" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "red-hat",
    group: "redu",
    name: "Red Hat",
    tagline: "Enterprise open source: RHEL, OpenShift, Ansible.",
    intro:
      "Red Hat made open source safe for the enterprise: Red Hat Enterprise Linux, OpenShift, and Ansible are the commercially supported spine of Linux estates, container platforms, and automation worldwide.",
    body: [
      "Red Hat training runs in Red Education's Australasia catalogue and through its course finder, extending the portfolio from network and security appliances to the operating system and automation layer beneath them.",
      "Founded in 1993 and profitable on a business model skeptics said could not exist - selling support for software anyone could copy - Red Hat proved the open-source enterprise thesis, a story this site's glossary tells through The Cathedral and the Bazaar. IBM acquired it in July 2019 for 34 billion dollars, then the largest software acquisition ever, and runs it as a distinct unit.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - course finder (vendor list)", url: "https://www.rededucation.com/" },
      { label: "IBM - Red Hat acquisition (2019)", url: "https://newsroom.ibm.com/2019-07-09-IBM-Closes-Landmark-Acquisition-of-Red-Hat-for-34-Billion-Defines-Open-Hybrid-Cloud-Future" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "riverbed",
    group: "redu",
    name: "Riverbed",
    tagline: "WAN optimization pioneer turned observability company.",
    intro:
      "Riverbed defined WAN optimization: its SteelHead appliances made far-away applications feel local in the era when every branch office lived at the end of a thin, expensive circuit, and the company has since rebuilt itself around observability and acceleration.",
    body: [
      "Red Education has provided Riverbed skills to the market since 2008 and is a Riverbed Authorised Consulting Partner, with courses continuing in its Australasia, SAARC, and ASEAN catalogues.",
      "Founded in 2002 by Jerry Kennelly and Steve McCanne - the latter a co-author of tcpdump and the Berkeley Packet Filter, tools half this site's tutorials assume - Riverbed rode the SteelHead era to an IPO, was taken private in 2015, and went through a court-supervised restructuring in late 2021. Today it competes in unified observability, a long way from the branch-office WAN it was built to shrink.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Red Education - Professional Services (Riverbed since 2008)", url: "https://www.rededucation.com/professional-services/" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "symantec",
    group: "redu",
    name: "Symantec",
    tagline: "The security brand of a generation, now Broadcom's enterprise line.",
    intro:
      "Symantec was for decades the biggest name in security software, from Norton on the desktop to the enterprise endpoint, web, and data-protection suites that carried its yellow badge into every large IT estate.",
    body: [
      "Symantec enterprise courseware remains in Red Education's Australasia, SAARC, and ASEAN catalogues, serving the substantial installed base of its endpoint and web-security platforms.",
      "Founded in 1982, Symantec grew by acquisition into a security conglomerate before splitting itself: the enterprise security business was sold to Broadcom in November 2019, which retains the Symantec brand for it, while the consumer side became NortonLifeLock and, after merging with Avast, Gen Digital. It is one more lineage this site's industry pages trace: the name survives, the company that carried it does not.",
    ],
    awards: [...REDU_AWARDS_GENERAL],
    sources: [
      { label: "Broadcom - Symantec enterprise security (2019)", url: "https://www.broadcom.com/company/news/financial-releases/broadcom-completes-acquisition-of-symantec-enterprise-security-business" },
      ...REDU_SOURCES,
    ],
  },
  {
    slug: "hpe-juniper-aruba",
    group: "other",
    name: "HPE Networking - HP, 3Com, Aruba, Juniper",
    tagline: "The great consolidation: from the Addison Avenue garage to the $14B Juniper merger.",
    intro:
      "Four founding stories converged into one company: Hewlett-Packard (1939), 3Com and the commercialization of Ethernet (1979), Juniper Networks and purpose-built routing silicon (1996), and Aruba Networks and the mobile-first enterprise (2002). HP acquired 3Com in 2010 and Aruba in 2015, split into HP Inc and HPE that same year, and closed the acquisition of Juniper Networks on July 2, 2025 - assembling the industry's broadest challenge to Cisco.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers HPE, Aruba, or Juniper training. Those courses are run by HPE Education Services and by HPE / Juniper authorized education partners. This page is corporate history - a lineage record of the pioneers, verified against primary sources.",
    sources: [
      { label: "HPE 10-K FY2025 - Juniper merger closed Jul 2, 2025 (~$13.4B cash)", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001645590&type=10-K" },
      { label: "HPE / Juniper - DOJ settlement release (SEC 8-K, Jun 28, 2025)", url: "https://www.sec.gov/Archives/edgar/data/1043604/000119312525154400/d912160dex991.htm" },
      { label: "NetScreen SEC Form 425 - Juniper/NetScreen merger (Feb 9, 2004)", url: "https://www.sec.gov/Archives/edgar/data/0001088454/000089161804000509/f96338j2e425.htm" },
      { label: "Aruba SEC 8-K - HP to acquire Aruba (Mar 2, 2015)", url: "https://www.sec.gov/Archives/edgar/data/0001173752/000119312515073722/d884514dex991.htm" },
      { label: "Juniper 10-Q FY2019 - Mist acquisition ($359.2M)", url: "https://www.sec.gov/Archives/edgar/data/1043604/000104360419000094/jnpr-10q20190630.htm" },
      { label: "Juniper.net - Gartner 2025 MQ Enterprise Wired & Wireless LAN (Leader)", url: "https://www.juniper.net/us/en/training/education-centers.html" },
    ],
  },
  {
    slug: "brocade-broadcom",
    group: "other",
    name: "Brocade & Foundry - the Broadcom diaspora",
    tagline: "Two 1990s pioneers, one 2017 dismemberment: SAN to Broadcom, data center to Extreme, campus and Wi-Fi to CommScope.",
    intro:
      "Brocade built the switched Fibre Channel fabric that made storage area networks possible; Foundry shipped the first gigabit Ethernet, Layer 3, and Layer 4-7 switches. They merged in 2008, and in 2017 Broadcom took the combination apart: the SAN business stayed with Broadcom, the Foundry-derived data-center lines went to Extreme Networks, and campus switching plus Ruckus Wi-Fi went to ARRIS, then CommScope - with Belden announced as the next owner in 2026.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Brocade or Broadcom training. This page is corporate history, verified against SEC filings and primary sources. One accurate connection: Extreme Networks, which absorbed the Foundry-derived data-center portfolio in 2017, is one of the four vendors Rodolfo is authorized to teach.",
    sources: [
      { label: "Broadcom 10-K FY2018 - Brocade closed Nov 17, 2017 (~$5.3B + $701M debt)", url: "https://www.sec.gov/Archives/edgar/data/0001730168/000173016818000084/avgo-11042018x10k.htm" },
      { label: "Broadcom / Extreme press release - data-center business, $55M (Mar 29, 2017)", url: "https://investors.broadcom.com/news-releases/news-release-details/extreme-networks-acquire-brocades-data-center-networking" },
      { label: "ARRIS SEC 8-K - Ruckus + ICX, $800M (Feb 22, 2017)", url: "https://www.sec.gov/Archives/edgar/data/0001645494/000119312517053883/d330887dex991.htm" },
      { label: "Brocade 10-Q FY2008 - Foundry agreement ($19.25/share announced)", url: "https://www.sec.gov/Archives/edgar/data/0001009626/000095013408015646/f43239e10vq.htm" },
      { label: "Foundry Networks 10-K FY1999 - founded May 1996", url: "https://www.sec.gov/Archives/edgar/data/0001090071/000101287000001468/0001012870-00-001468.txt" },
      { label: "Foundry Networks - Wikipedia (renegotiation; completed Dec 18, 2008)", url: "https://en.wikipedia.org/wiki/Foundry_Networks" },
      { label: "Ruckus Networks - Wikipedia (CommScope 2019; Belden announced Apr 30, 2026)", url: "https://en.wikipedia.org/wiki/Ruckus_Networks" },
    ],
  },
  {
    slug: "mcafee-fireeye-trellix",
    group: "other",
    name: "McAfee, FireEye & Mandiant - the road to Trellix",
    tagline: "Three security pioneers, one private-equity remix: Trellix and Skyhigh under STG, Mandiant inside Google Cloud, McAfee consumer private.",
    intro:
      "Three founding stories - McAfee and commercial antivirus (1987), FireEye and virtual-machine detonation (2004), Mandiant and incident response as a discipline (2004) - collided in 2021-2022. Symphony Technology Group carved out McAfee Enterprise ($4.0B) and FireEye's products plus the FireEye name ($1.2B), fused them into Trellix, and spun the SSE portfolio out as Skyhigh Security; the remaining company renamed itself Mandiant and joined Google Cloud; McAfee's consumer business went private for over $14 billion.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers McAfee, Trellix, FireEye, or Mandiant training. This page is corporate history, verified against SEC filings and primary sources. Rodolfo's own connection is from the distribution side: he carried the FireEye and McAfee lines in Brazil during his Westcon-Comstor and ScanSource years.",
    sources: [
      { label: "Alphabet 10-K FY2022 - Mandiant closed Sep 12, 2022 ($6.1B total incl. cash and debt)", url: "https://www.sec.gov/Archives/edgar/data/1652044/000165204423000016/goog-20221231.htm" },
      { label: "McAfee SEC 8-K - Advent/Permira take-private completed (>$14B, Mar 1, 2022)", url: "https://www.sec.gov/Archives/edgar/data/1783317/000119312522060146/d319834dex991.htm" },
      { label: "Trellix - Combination of McAfee Enterprise and FireEye complete ($1.2B)", url: "https://www.trellix.com/news/press-releases/combination-of-mcafee-enterprise-and-fireeye-complete/" },
      { label: "Computer Weekly - Skyhigh Security spun out of McAfee Enterprise (Mar 2022)", url: "https://www.computerweekly.com/news/252514998/Private-equity-house-spins-SSE-company-out-of-McAfee-Enterprise" },
      { label: "Mandiant - Wikipedia (Red Cliff 2004; APT1 2013; FireEye $1B Dec 2013)", url: "https://en.wikipedia.org/wiki/Mandiant" },
      { label: "McAfee - Wikipedia (1987; NAI 1997; Intel Feb 2011; TPG Apr 2017; IPO 2020)", url: "https://en.wikipedia.org/wiki/McAfee" },
    ],
  },
  {
    slug: "mikrotik",
    group: "other",
    name: "MikroTik - Latvia's quiet giant",
    tagline: "RouterOS on commodity hardware: the company that made carrier-grade routing affordable everywhere - and stayed independent.",
    intro:
      "Founded in Riga in 1996, MikroTik put carrier-grade routing software on ordinary x86 PCs (RouterOS, 1997), then on its own boards (RouterBOARD, 2002). The price-performance formula made it ubiquitous among ISPs and wireless ISPs worldwide - including Brazil - and in 2022 it became the first private company in Latvia to pass EUR 1 billion in value. Still private, still in Riga, still founder-controlled.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers MikroTik training. This page is corporate history, verified against MikroTik's own company history and public records. Rodolfo's connection is from the field: MikroTik gear is the backbone of countless Brazilian ISP and WISP networks he has worked alongside since the 1990s.",
    sources: [
      { label: "MikroTik - company history (RouterOS 1997; RouterBOARD 2002)", url: "https://mikrotik.com/aboutus" },
      { label: "MikroTik - Wikipedia (founders; 2022 EUR 1.30B; first Latvian private company past EUR 1B)", url: "https://en.wikipedia.org/wiki/MikroTik" },
    ],
  },
  {
    slug: "radware",
    group: "other",
    name: "Radware - the Zisapel lineage",
    tagline: "Born of Israel's RAD Group in 1997; the ADC and DDoS specialist that rescued Alteon from Nortel's wreckage for ~$18M.",
    intro:
      "A father-and-son founding inside Israel's most storied networking family: RAD Group patriarch Yehuda Zisapel and his son Roy, CEO since inception. Radware IPO'd on NASDAQ in 1999, built the DefensePro DDoS line, and in April 2009 bought Nortel's legendary Alteon application-switching assets out of bankruptcy for about $18 million - instantly a top-three ADC vendor. Still independent, still founder-led.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Radware training. This page is corporate history, verified against SEC filings and primary sources. Radware competes in the application delivery market where Rodolfo teaches F5 daily - knowing the rivals is part of knowing the market.",
    sources: [
      { label: "Radware SEC 6-K FY2009 - founders' biographies (inception dated May 1996)", url: "https://www.sec.gov/Archives/edgar/data/0001094366/000117891309001371/exhibit_1-1.htm" },
      { label: "Network World (Apr 2009) - Radware pays $18M for Nortel's Alteon assets", url: "https://www.networkworld.com/article/2267100/radware-pays--18-million-for-nortel-s-alteon-assets.html" },
      { label: "Radware - Wikipedia (April 1997; stakes; acquisitions)", url: "https://en.wikipedia.org/wiki/Radware" },
    ],
  },
  {
    slug: "imperva-thales",
    group: "other",
    name: "Imperva - from WebCohort to Thales",
    tagline: "The WAF pioneer founded by a Check Point co-founder, now the application-security arm of a French defense giant.",
    intro:
      "Founded in Israel in 2002 as WebCohort by Shlomo Kramer (co-founder of Check Point, later founder of Cato Networks), Amichai Shulman, and Mickey Boodaei, the company shipped SecureSphere in 2003 and helped define the web application firewall category. NYSE IPO in 2011, a $2.1 billion Thoma Bravo take-private in January 2019, and a $3.6 billion acquisition by Thales completed on December 4, 2023.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Imperva or Thales training. This page is corporate history, verified against primary sources. Imperva pioneered the WAF market Rodolfo teaches through F5 Advanced WAF - the rivals' history is the market's history.",
    sources: [
      { label: "Imperva - Wikipedia (WebCohort 2002; SecureSphere 2003; Thales completed Dec 4, 2023)", url: "https://en.wikipedia.org/wiki/Imperva" },
      { label: "Globes (Jul 25, 2023) - Thales acquires Imperva for $3.6B; Thoma Bravo Jan 2019 $2.1B; founders' later startups", url: "https://en.globes.co.il/en/article-thales-acquires-cybersecurity-co-imperva-for-36b-1001453187" },
      { label: "Times of Israel (Jul 25, 2023) - founder backgrounds", url: "https://www.timesofisrael.com/israeli-founded-imperva-is-snapped-up-by-frances-thales-in-3-6b-cybersecurity-deal/" },
    ],
  },
  {
    slug: "versa",
    group: "other",
    name: "Versa Networks - the SASE independent",
    tagline: "Two ex-Riverstone, ex-Juniper brothers building unified SASE - one of the last large independents in a consolidated market.",
    intro:
      "Founded in 2012 by brothers Kumar and Apurva Mehta after eight years leading Juniper's MX series - and, before that, senior roles at Riverstone Networks, where Rodolfo worked from 2000 to 2002. Versa built networking and security as one multi-tenant software stack years before Gartner named the category SASE, raised roughly $316 million while rivals sold to Cisco, VMware, Aruba, and Palo Alto, and remains independent.",
    body: [],
    note:
      "Neither Rodolfo nor Red Education delivers Versa training. This page is corporate history, verified against Versa's own leadership biographies and primary sources. The lineage connection is real: both founders built at Riverstone Networks - Rodolfo's Santa Clara employer, 2000-2002 - before their Juniper years.",
    sources: [
      { label: "Versa Networks - leadership biographies (Riverstone, Yago, Centillion; Juniper MX)", url: "https://versa-networks.com/about/leadership/" },
      { label: "TechCrunch (Oct 27, 2022) - $120M round; Ahuja CEO since 2016; consolidation context", url: "https://techcrunch.com/2022/10/27/versa-raises-120m-for-its-software-defined-networking-and-security-stack/" },
      { label: "Tracxn - $316M total over 6 rounds; first round Nov 26, 2012", url: "https://tracxn.com/d/companies/versa-networks/__wlcJlkKIuL61D2aM_ev5JQIkme5Hbd0Mne4_z3tmlfY" },
    ],
  },
  {
    slug: "nortel-bay",
    group: "other",
    name: "Nortel & Bay Networks - the giant that vanished",
    tagline: "From 1895 Montreal to a third of Canada's stock index to the largest bankruptcy in Canadian history - and the $4.5B patent auction that ended it.",
    intro:
      "Northern Electric (1895) became Northern Telecom, bet everything on digital switching in 1976, and grew into Nortel - worth C$398 billion at the 2000 peak, more than a third of the entire Toronto Stock Exchange. Along the way it swallowed Bay Networks (the 1994 SynOptics-Wellfleet merger) for $9.1 billion and Alteon WebSystems for $7.8 billion. The collapse erased it all: the January 14, 2009 filing was the largest corporate failure in Canadian history, the pieces scattered to Ericsson, Avaya, Ciena, Radware, and eventually Extreme Networks, and the 2011 Rockstar patent auction - $4.5 billion, against Google's pi-themed bids - was the tombstone.",
    body: [],
    note:
      "Nortel, Bay Networks, SynOptics, and Wellfleet no longer exist as companies, and no training association is implied with them or their successors. This page is corporate history, verified against SEC filings and primary sources. Rodolfo's connection is from the other side of the battlefield: he spent 1996-2000 at Cabletron Systems, Bay Networks' direct rival in the hub-and-switch wars - and the Bay-descended enterprise portfolio now lives at Extreme Networks, one of the four vendors he teaches.",
    sources: [
      { label: "Bay Networks SEC 8-K (Jun 15, 1998) - Nortel-Bay US$9.1B announcement", url: "https://www.sec.gov/Archives/edgar/data/0000876516/000089375098000173/0000893750-98-000173.txt" },
      { label: "Alteon WebSystems SEC Form 425 (Jul 28, 2000) - US$7.8B; Orr employee email", url: "https://www.sec.gov/Archives/edgar/data/0001089925/000090342300000344/0001.txt" },
      { label: "Timeline of Nortel - Wikipedia (1895; peak; asset sales; Rockstar and the pi bids)", url: "https://en.wikipedia.org/wiki/Timeline_of_Nortel" },
      { label: "Nortel - Wikipedia (Digital World 1976; bankruptcy; Radware $18M Alteon sale)", url: "https://en.wikipedia.org/wiki/Nortel" },
      { label: "Avaya 10-K FY2010 - Nortel NES closed Dec 18, 2009 ($943M cash, $933M final)", url: "https://www.sec.gov/Archives/edgar/data/0001116521/000119312510275681/d10k.htm" },
      { label: "Extreme Networks 10-Q FY2017 - Avaya Networking closed Jul 14, 2017 ($79.8M net)", url: "https://www.sec.gov/Archives/edgar/data/0001078271/000156459017023316/extr-10q_20170930.htm" },
      { label: "Wellfleet Communications - Wikipedia (1986 founders; $2.7B merger)", url: "https://en.wikipedia.org/wiki/Wellfleet_Communications" },
      { label: "SynOptics - Wikipedia (1985 founders; twisted-pair Ethernet; Jul 6, 1994 merger)", url: "https://en.wikipedia.org/wiki/SynOptics_Communications" },
    ],
  },
  {
    slug: "madge",
    group: "other",
    name: "Madge Networks - Token Ring's standard-bearer",
    tagline: "From a Buckinghamshire farm to beating IBM in court at IBM's own game - and down with the protocol it championed: 'the Betamax of the networking world.'",
    intro:
      "Robert Madge founded the company on his family's farm in 1986 with no new technology at all - just the bet that IBM's Token Ring could be built better and sold harder than IBM did. He won the court fight that made it royalty-free, rode the ring to more than 25 countries and the Sunday Times Rich List, hedged with Israel's Lannet (sold to Lucent for $117 million in 1998), and absorbed rival Olicom's Token Ring business in 1999 - by which point the ring was 81 percent of sales, a market shrinking beneath its last champion. A Dutch court granted the bankruptcy order in 2003; the remains ended up at Ringdale, crowned the world's largest supplier of Token Ring technology after the world had stopped buying it.",
    body: [],
    note:
      "Madge Networks no longer exists as an operating company, and no training association is implied with it or any successor. This page is corporate history, verified against Madge's SEC filings and primary sources. Rodolfo's connection is from the opposite trench of the great protocol war: at Cabletron from 1996 to 2000, he fought for Ethernet in the IBM-shop accounts - common in Brazil - where Madge's Token Ring was the incumbent. Every hub-war page in this section tells Ethernet's side; this one honors the technology that lost.",
    sources: [
      { label: "Madge Networks - Wikipedia (1986 founding; HSTR; Olicom; April 2003 bankruptcy; Ringdale)", url: "https://en.wikipedia.org/wiki/Madge_Networks" },
      { label: "Madge Networks N.V. company history - encyclopedia.com (farm founding; chess games; Lannet to Lucent Jul 1998)", url: "https://www.encyclopedia.com/books/politics-and-business-magazines/madge-networks-nv" },
      { label: "The Register (May 23, 2003) - Dutch administrator Apr 17, 2003; bankruptcy order; 'Betamax of networking'", url: "https://www.theregister.com/2003/05/23/madge_networks_goes_titsup_flips/" },
      { label: "Computerworld - Robert Madge interview (IBM court fight; left 2001; Madge Inc to Network Technology/Ringdale 2006)", url: "https://www.computerworld.com/article/1682392/robert-madge.html" },
      { label: "Madge SEC F-3/F-3A (1999) - Token Ring 65/65/72% of sales 1996-98, 81% 9M 1999; Lannet $117M; restructuring", url: "https://www.sec.gov/" },
    ],
  },
  // ---- The pioneer-giants wave (PRIME directive 2026-07-16): twelve founders
  // of the industry itself, each with a full lineage profile. ----
  {
    slug: "sun-microsystems",
    group: "other",
    name: "Sun Microsystems - the network is the computer",
    tagline: "Four Stanford-orbit founders, SPARC, Solaris, Java - the dot in dot-com, absorbed by Oracle in 2010.",
    intro: "Sun packed more industry-shaping ideas into 28 years than most vendors manage in a century: the workstation, the network-first slogan it took the world decades to catch up with, NFS, SPARC, Solaris, and Java. Its 2010 end inside Oracle scattered a diaspora that still runs the industry - including the ForgeRock and Arista stories elsewhere in this section.",
    body: ["From Andy Bechtolsheim's Stanford University Network workstation to Java running on billions of devices, Sun's arc is the arc of open systems itself - told in full in the profile below, with the bloodlines that lead out of it."],
  },
  {
    slug: "silicon-graphics",
    group: "other",
    name: "Silicon Graphics - the geometry of Hollywood",
    tagline: "Jim Clark's geometry engines rendered Jurassic Park and invented OpenGL; the name ended at HPE in 2016.",
    intro: "SGI built the machines that taught computers to see: geometry pipelines, IRIX on MIPS, and the purple workstations behind a decade of movie magic. Its fall is as instructive as its rise - commodity PCs ate the graphics market SGI created, and OpenGL outlived the company that wrote it.",
    body: ["Founder Jim Clark left in 1994 to co-found Netscape; the company's Cray chapter, its two bankruptcies, and the 2016 HPE acquisition close the loop told in the profile below."],
  },
  {
    slug: "xerox",
    group: "other",
    name: "Xerox - the company that fumbled the future",
    tagline: "Xerography built the empire; PARC invented Ethernet, the GUI, and laser printing - and networking's history runs through that lab.",
    intro: "Xerox matters to this site for one building above all: the Palo Alto Research Center, where Ethernet itself was invented in 1973. The copier giant commercialized almost none of what PARC created - the most productive fumble in technology history - and its own print business marches on, completing the Lexmark acquisition in 2025.",
    body: ["From Chester Carlson's xerography patent to Bob Metcalfe's Ethernet memo, the profile below follows both the empire and the laboratory that gave this industry its wires."],
  },
  {
    slug: "dec",
    group: "other",
    name: "Digital Equipment Corporation - the minicomputer king",
    tagline: "Ken Olsen's PDP and VAX machines defined two decades of computing; DEC co-authored Ethernet and ended inside Compaq in 1998.",
    intro: "DEC took computing out of the glass house: the PDP-8 made computers departmental, the PDP-11 made them ubiquitous, and VAX/VMS made them an architecture empire. DEC also co-signed the DIX Ethernet standard with Intel and Xerox - the reason this industry cables the way it does.",
    body: ["The profile traces Maynard's woolen mill to the $9.6 billion Compaq acquisition - then the largest in computer history - and the VMS-to-Windows-NT bloodline that followed the people out."],
  },
  {
    slug: "nokia",
    group: "other",
    name: "Nokia - from paper mill to network giant",
    tagline: "A 160-year arc: rubber boots to world phone leader to one of the three companies that build the world's mobile networks.",
    intro: "Nokia is the industry's great shapeshifter: an 1865 Finnish paper mill that became the world's largest phone maker, lost that crown in the smartphone wars, and rebuilt itself as a networks powerhouse - absorbing Alcatel-Lucent and Bell Labs in 2016 and optical vendor Infinera in 2025.",
    body: ["The profile follows every act, through the Microsoft phone sale, the Siemens joint venture, and the 2025 leadership change that put a data-center executive at the helm."],
  },
  {
    slug: "ericsson",
    group: "other",
    name: "Ericsson - 150 years of telephony",
    tagline: "From an 1876 Stockholm telegraph workshop to the AXE switch, GSM, Bluetooth, and today's 5G triumvirate.",
    intro: "Ericsson has been building the telephone network since the telephone was new. The AXE digital switch wired the world, its engineers were central to GSM, a 1990s Ericsson project gave the world Bluetooth, and today it stands with Nokia and Huawei as one of three companies that can build a national mobile network end to end.",
    body: ["The profile below runs from Lars Magnus Ericsson's workshop through the Sony Ericsson decade to the modern 5G and enterprise-wireless era."],
  },
  {
    slug: "huawei",
    group: "other",
    name: "Huawei - the Shenzhen ascent",
    tagline: "From a 1987 PBX reseller to the world's largest telecom equipment maker - and the center of the decade's biggest technology-policy storm.",
    intro: "Huawei's rise is the defining industrial story of modern networking: founded in Shenzhen in 1987 with about 21,000 yuan, it out-engineered and out-priced the incumbents until it led the world in telecom equipment. The 2019 United States Entity List placed it at the center of the technology-sovereignty era, and its silicon comeback since is a story still being written.",
    body: ["The profile tells the arc factually - the rural-first strategy, HiSilicon, the sanctions years, and the employee-owned structure - from the public record."],
  },
  {
    slug: "siemens",
    group: "other",
    name: "Siemens - the 1847 telegraph startup",
    tagline: "Werner von Siemens built the Indo-European telegraph line; the conglomerate's communications bloodline runs through EWSD, the Nokia JV, and Unify.",
    intro: "Siemens is the oldest company in this section by decades: an 1847 Berlin workshop whose pointer telegraph grew into a global electrical empire. Its communications lineage - telephone exchanges, the EWSD switch, Nokia Siemens Networks, and the Unify enterprise-communications line - threads through half the industry's history, while today's Siemens leads industrial automation and its networking.",
    body: ["The profile follows the telegraph century, the telecom exits, and where the communications bloodlines ended up."],
  },
  {
    slug: "novell",
    group: "other",
    name: "Novell - the network operating system",
    tagline: "NetWare owned the LAN era and IPX ran the world's offices; the lineage ended at OpenText in 2023.",
    intro: "Before TCP/IP won, the corporate network spoke IPX and logged into NetWare - and an entire profession grew up around Novell certifications. The company that defined the network operating system then spent two decades searching for a second act: UnixWare, WordPerfect, SUSE, the Microsoft pact, and a chain of acquisitions ending at OpenText in 2023.",
    body: ["The profile below is LAN-era history in full: Ray Noorda's coopetition, the Utah empire, and the long unwinding."],
  },
  {
    slug: "oracle",
    group: "other",
    name: "Oracle - the database empire",
    tagline: "The first commercial SQL database, four decades of acquisitions - Sun included - and 2025's handover to co-CEOs for the AI era.",
    intro: "Oracle commercialized the relational database before IBM, its inventor's employer, got around to it - and has compounded that head start for nearly fifty years. Its acquisition machine reshaped the industry map, absorbing PeopleSoft, BEA, Sun Microsystems, NetSuite, and Cerner, and its 2025 leadership handover to co-CEOs marks the pivot to the AI-infrastructure era.",
    body: ["The profile runs from the CIA project that named the company to the September 2025 succession, verified against Oracle's own SEC filings."],
  },
  {
    slug: "ibm",
    group: "other",
    name: "IBM - the century company",
    tagline: "Punched cards to System/360 to the PC to Red Hat: the company the rest of the industry defined itself against.",
    intro: "For most of computing's history, IBM was the industry: the tabulating monopoly, the $5 billion System/360 bet that created the mainframe world, the PC that accidentally crowned Microsoft and Intel, and the services turnaround that saved it. Its networking fingerprints - SNA, Token Ring - run through several other pages in this section, and the 2019 Red Hat acquisition ties it to the open-source lineage told there.",
    body: ["The profile compresses eleven decades into the moments that shaped this industry, Token Ring wars included."],
  },
  {
    slug: "sap",
    group: "other",
    name: "SAP - five engineers against the mainframe",
    tagline: "Ex-IBM founders built the ERP category in 1972; R/3 conquered the client-server world and HANA reinvented the core.",
    intro: "SAP is Europe's greatest software story: five IBM engineers in Mannheim who bet in 1972 that business software could be a standard product, not a custom project. R/3 rode the client-server wave into nearly every large enterprise on earth, and the company reinvented its own foundations twice - in-memory HANA in 2010 and the cloud pivot after it.",
    body: ["The profile follows Walldorf from R/1 to RISE, the ecosystem that employs a small nation of consultants, and the networking-adjacent reality that SAP traffic shaped a generation of QoS designs."],
  },
  // ---- Pioneer wave 2 (PRIME 2026-07-16): six more founders of the industry. ----
  {
    slug: "3com",
    group: "other",
    name: "3Com - Ethernet leaves the lab",
    tagline: "Bob Metcalfe commercialized his own PARC invention; EtherLink wired the PC era, Palm rode along, and the story ended at HP in 2010.",
    intro: "3Com is the second half of the Ethernet story this section starts on the Xerox page: Metcalfe left PARC in 1979 to sell the network he had invented, and the EtherLink card put Ethernet inside the IBM PC itself. Computers, Communication, Compatibility - the three Coms - became the connectivity company of the LAN decade.",
    body: ["From the first PC Ethernet adapters through the US Robotics merger that brought Palm aboard, to the H3C venture in China and the 2010 HP acquisition - the profile below follows the wire out of the lab and into everything."],
  },
  {
    slug: "compaq",
    group: "other",
    name: "Compaq - the clone that became the king",
    tagline: "Three ex-TI engineers sketched a portable on a placemat, clean-roomed the IBM BIOS, and built the fastest company to a billion dollars - then bought DEC and merged into HP.",
    intro: "Compaq legitimized the PC-compatible industry: its 1982 clean-room BIOS made 'IBM compatible' a legal product category, its Deskpro 386 beat IBM to Intel's 386, and by the mid-1990s it was the world's largest PC maker. Its acquisitions of Tandem and DEC made it, briefly, the industry's everything-company - until the 2002 HP merger closed the arc.",
    body: ["The profile runs from the Houston placemat sketch to the proxy-fight merger, with the DEC bloodline this section tells separately flowing through it."],
  },
  {
    slug: "netscape",
    group: "other",
    name: "Netscape - the company that opened the web",
    tagline: "Clark and Andreessen's Navigator took the internet mainstream; SSL, JavaScript, and the cookie were invented here - the browser lost the war, the inventions won everything.",
    intro: "No company on this page matters more to this site's daily subject matter: SSL - the ancestor of every TLS session the tools here decode - was designed at Netscape, as were JavaScript and the HTTP cookie. The Navigator browser took the web from academia to everyone, triggered the browser wars, and left behind Mozilla and the open web itself.",
    body: ["From Jim Clark's post-SGI second act and the 1995 IPO that started the dot-com era, to the AOL acquisition and the Firefox afterlife - the profile follows the fifty-one months that rewired the world."],
  },
  {
    slug: "motorola",
    group: "other",
    name: "Motorola - the radio century",
    tagline: "Car radios to the walkie-talkie to the first handheld cell call and the moon itself; split in 2011 into Solutions and a Mobility arm that passed through Google to Lenovo.",
    intro: "Motorola put radio everywhere: in cars in the 1930s, on soldiers' backs in the 1940s, on the Moon in 1969, and in Martin Cooper's hand for the first handheld cellular call in 1973. The century company split in 2011 - Motorola Solutions carries the mission-critical radio and public-safety network lineage today, while the phone side journeyed through Google to Lenovo.",
    body: ["The profile covers the Galvin brothers' Chicago startup, the DynaTAC and RAZR eras, the Iridium gamble, the 68000 processor family that powered a computing generation, and both halves of the split."],
  },
  {
    slug: "unisys",
    group: "other",
    name: "Unisys - computing's oldest bloodlines",
    tagline: "Burroughs (1886) plus Sperry's UNIVAC - the ENIAC creators' company - merged in 1986: the deepest lineage in this section, still running ClearPath descendants today.",
    intro: "Unisys is where computing's two oldest commercial bloodlines meet: William Seward Burroughs's 1886 adding-machine company, and Sperry's UNIVAC division - built on Eckert and Mauchly, the engineers of ENIAC itself, whose UNIVAC I of 1951 was America's first commercial computer and famously called the 1952 election on CBS. The 1986 merger created Unisys; the mainframe heritage survives in ClearPath.",
    body: ["The profile traces both trunks - the adding machine and ENIAC - through the 1986 merger, the services pivot, and the modern company."],
  },
  {
    slug: "data-general",
    group: "other",
    name: "Data General - the soul of a new machine",
    tagline: "Edson de Castro left DEC to build the Nova; Tracy Kidder's Pulitzer immortalized the Eagle; CLARiiON storage carried the DNA into EMC in 1999.",
    intro: "Data General was born from the industry's most famous walkout: Edson de Castro, designer of DEC's PDP-8, left when Ken Olsen shelved his next design, and the 1969 Nova - elegant, cheap, sixteen bits - forced the entire minicomputer market to respond. Tracy Kidder's The Soul of a New Machine made its Eagle project the most celebrated engineering story ever written.",
    body: ["The profile follows the Nova and Eclipse decades, the AViiON pivot, and the CLARiiON storage line whose 1999 acquisition by EMC seeded the midrange-storage dynasty that lives on at Dell today."],
  },
  // ---- Pioneer wave 3 (PRIME 2026-07-16): the deep bench. ----
  {
    slug: "marconi",
    group: "other",
    name: "Marconi - wireless itself, then the bubble",
    tagline: "Guglielmo Marconi bridged the Atlantic in 1901; a century later the company bearing his name became telecom's starkest dot-com cautionary tale, carved up by Ericsson in 2006.",
    intro: "Marconi is two stories a century apart: the man who made radio a business - transatlantic signals in 1901, the operators aboard Titanic in 1912 - and the GEC conglomerate that took his name in 1999, bet its fortune on telecom equipment at the bubble's exact top, and collapsed within two years. Few lineages contain both the birth of an industry and its most instructive corporate death.",
    body: ["The profile follows the Wireless Telegraph and Signal Company through GEC's electronics empire, the 1999 renaming and acquisition spree, the 2001 collapse, and the 2006 Ericsson carve-up that ended the name in networking."],
  },
  {
    slug: "wang",
    group: "other",
    name: "Wang Laboratories - the office before the PC",
    tagline: "An Wang's core-memory patents funded a word-processing empire that owned the office of the late 1970s - and the PC unmade it inside a decade.",
    intro: "Before the PC, the office ran on Wang: dedicated word-processing systems so dominant that secretaries listed 'Wang' as a skill. Dr. An Wang - who sold his magnetic-core memory patents to IBM and built the Massachusetts Miracle's signature company - saw the minicomputer and the office converge before almost anyone. The general-purpose PC running WordPerfect erased the category he created.",
    body: ["From the 1951 Boston founding through the WPS and VS golden years, the failed succession, and the 1992 Chapter 11, the profile tells the sharpest single-product rise and fall in this section."],
  },
  {
    slug: "tandem",
    group: "other",
    name: "Tandem Computers - the machine that never stops",
    tagline: "Jimmy Treybig's NonStop architecture made fault tolerance a product in 1976; it still runs stock exchanges and card networks today, as HPE NonStop.",
    intro: "Tandem built computers on one premise: no single point of failure - paired processors, mirrored everything, hardware and software designed so the system survives any one fault mid-transaction. ATMs, card networks, stock exchanges, and 911 systems standardized on NonStop, and half a century later the architecture is still sold, by HPE, doing the same jobs.",
    body: ["The profile covers the 1974 founding, the process-pair architecture, the legendary company culture, the ServerNet interconnect whose ideas fed InfiniBand, and the 1997 Compaq acquisition that carried NonStop into HP."],
  },
  {
    slug: "banyan",
    group: "other",
    name: "Banyan Systems - the directory pioneer",
    tagline: "VINES and StreetTalk delivered a true global directory service years before NDS or Active Directory - and lost anyway; the idea won everywhere.",
    intro: "Banyan solved enterprise networking's hardest problem first: StreetTalk, the global naming and directory service inside VINES, let a user log in anywhere on a worldwide network years before Novell's NDS or Microsoft's Active Directory existed. The United States Marine Corps ran on it. Being right early, against NetWare's channel and NT's bundling, was not enough.",
    body: ["The profile pairs naturally with the Novell page: the 1983 founding, the Unix-based VINES architecture, StreetTalk's design lead, the loss of the platform war, and the quiet 2000s dissolution of the company whose core idea now runs every enterprise on earth."],
  },
  {
    slug: "fujitsu",
    group: "other",
    name: "Fujitsu - Japan's computing standard-bearer",
    tagline: "Born from a 1935 Fuji Electric spin-off (itself a Furukawa-Siemens venture), Fujitsu fought IBM with Amdahl, absorbed ICL, and built the K and Fugaku supercomputers.",
    intro: "Fujitsu carries Japan's mainframe century: FACOM computers from the 1950s, the Amdahl partnership that took the IBM-compatible fight to IBM's own customers, the ICL acquisition that made it a European power, and the K and Fugaku machines that twice topped the world's supercomputer rankings. Its optical and network businesses wire a substantial share of the Pacific.",
    body: ["The profile traces the Siemens-adjacent founding lineage, the plug-compatible wars, the services transformation into Japan's largest IT company, and the ARM-based Fugaku era."],
  },
  {
    slug: "nec",
    group: "other",
    name: "NEC - Japan's first joint venture",
    tagline: "Founded 1899 with Western Electric capital; NEAX switched the world's calls, the PC-98 owned Japan's PC market, and the C&C vision named the convergence everyone now lives in.",
    intro: "NEC was Japan's first joint venture with foreign capital - Western Electric, 1899 - and grew into the country's communications backbone: NEAX exchanges, satellites, submarine cable systems, and the SX vector supercomputers behind the Earth Simulator. Its PC-8001 and PC-98 lines dominated Japan's personal-computer market for over a decade, and Koji Kobayashi's 1977 'C&C' - Computers and Communications - named the convergence this whole industry became.",
    body: ["The profile covers the Western Electric founding, the switching and space decades, the PC-98 era, the world-number-one semiconductor years that ended in the Renesas merger, and today's biometrics and submarine-cable strengths."],
  },
  {
    slug: "bell-labs-lucent-alcatel",
    group: "other",
    name: "Bell Labs, Lucent & Alcatel - the transistor's bloodline",
    tagline: "The transistor, information theory, Unix, the laser, cellular - ten Nobel Prizes of foundations, spun into Lucent in 1996, merged with Alcatel in 2006, carried into Nokia in 2016.",
    intro: "No institution shaped this industry more than Bell Telephone Laboratories: the 1947 transistor, Shannon's 1948 information theory, Unix and C, the CCD, the cellular concept. Its corporate afterlife - the record-setting Lucent IPO, the bubble's hardest fall, the Alcatel merger, the Nokia acquisition - is the industry's sharpest lesson that inventing the future and capturing its value are different skills.",
    body: ["The profile covers the 1925 founding, the 1947-1969 invention run, the 1996 trivestiture and Lucent's rise and fall, Alcatel's CGE-to-ITT ascent, the 2006 merger, and the 2016 passage into Nokia - where Bell Labs continues."],
  },
  {
    slug: "intel-amd",
    group: "other",
    name: "Intel & AMD - Fairchild's children: the x86 rivalry",
    tagline: "The 4004, Moore's Law, and the second source that wrote AMD64 - one entry, because neither story parses without the other.",
    intro: "Both companies walked out of Fairchild Semiconductor a year apart - Noyce and Moore in 1968, Jerry Sanders in 1969 - and spent the next half-century pricing computing for everyone. Intel invented the commercial microprocessor and set the industry's cadence; AMD went from licensed second source to the author of the 64-bit x86 instruction set the whole world (Intel included) now runs.",
    body: ["The profile covers the Fairchild exodus, the 4004 and the IBM PC's dual-source mandate, the memory exit, the gigahertz race, the AMD64 irony, Zen's comeback, and the duopoly's diverging bets."],
  },
  {
    slug: "rand",
    group: "other",
    name: "RAND Corporation - where packet switching was imagined",
    tagline: "Paul Baran's 1964 'On Distributed Communications' argued a network with no center could survive anything - AT&T declined to build it; the internet did.",
    intro: "A Santa Monica think tank, not a vendor - included on merit no vendor matches. RAND built the postwar decision sciences (game theory's workshop, linear programming, the Delphi method), ran early AI on its own JOHNNIAC, and employed the engineer whose eleven 1964 reports specified distributed, message-block, store-and-forward networking: the conceptual root of every router on these pages.",
    body: ["The profile covers Project RAND's 1946 origins, the mathematical toolkit years, Baran's survivability argument and its parallel invention by Donald Davies, and the flow of the idea into the ARPANET."],
  },
  {
    slug: "toshiba",
    group: "other",
    name: "Toshiba - the company that gave the world flash",
    tagline: "Fujio Masuoka invented NOR and then NAND flash at Toshiba in the 1980s - every SSD, phone, and memory card descends from it; the T1100 started the laptop era.",
    intro: "From an 1875 telegraph works founded by a maker of mechanical dolls to the conglomerate that invented flash memory and the mass-market laptop - and then, through the Westinghouse disaster and the accounting scandal, sold the memory crown jewels (today's Kioxia) and left the stock exchange after 74 years. One immortal contribution bracketed by a very mortal corporate story.",
    body: ["The profile covers the Tanaka and Hakunetsusha roots, the 1939 merger, the JW-10 and T1100 firsts, Masuoka's NOR and NAND inventions, the DVD and HD DVD chapters, and the Westinghouse-to-Kioxia unwinding."],
  },
  {
    slug: "hitachi",
    group: "other",
    name: "Hitachi - the industrial giant that stores the world",
    tagline: "From a mine's five-horsepower motor in 1910 to VSP arrays, HGST drives, and Britain's express trains - the conglomerate whose storage lineage runs through every SAN.",
    intro: "Namihei Odaira believed Japan should build its own machines; the repair shop he ran became one of the broadest engineering companies on earth. For this site's purposes the storage line matters most: the plug-compatible mainframe wars (and the 1982 FBI sting), Hitachi Data Systems' enterprise arrays, and the 2003 purchase of IBM's disk-drive business - the company that invented the hard drive, absorbed and carried forward.",
    body: ["The profile covers the 1910 founding, rail from 1924 to the UK fleets, the mainframe era and the IBM case, HDS to Vantara, HGST to Western Digital, and the Lumada-era pivot to data."],
  },
  {
    slug: "bull",
    group: "other",
    name: "Bull - Europe's computing champion",
    tagline: "Punch-card wars against IBM in the 1930s, the prophetic Gamma 60, nationalization and privatization - and a final act building Europe's first exascale supercomputer.",
    intro: "Founded on a Norwegian engineer's tabulator patents, Compagnie des Machines Bull spent ninety years as the definitive national champion: fighting IBM card format against card format, surviving GE and Honeywell ownership, nationalization under Mitterrand, and privatization - to end up, inside Atos/Eviden, building the BullSequana machines that power JUPITER, Europe's first exascale system. The GECOS field in /etc/passwd is its Unix-era fingerprint.",
    body: ["The profile covers Fredrik Rosing Bull's patents, the Gamma 3 and Gamma 60, Plan Calcul and CII-Honeywell-Bull, the Groupe Bull years, the HPC pivot from Tera-10 to BullSequana, and the Atos/Eviden exascale finale."],
  },
  {
    slug: "ncsa",
    group: "other",
    name: "NCSA - the campus lab that made the web visible",
    tagline: "Mosaic gave the web a face in 1993; NCSA httpd's orphaned patches became Apache; NCSA Telnet networked a generation of campuses.",
    intro: "A national supercomputing center whose side projects changed the world: Andreessen and Bina's Mosaic made the internet something you could see (and, via Spyglass, seeded Internet Explorer too), Rob McCool's httpd and CGI defined how the early web served and ran programs, and its patch community became the Apache HTTP Server. The Netscape page on this site is the sequel to this one.",
    body: ["The profile covers the 1983 Black Proposal and 1986 founding, NCSA Telnet, Mosaic's 1993 explosion and its two browser-war descendants, httpd and CGI, and the birth of Apache from the orphaned patches."],
  },
  {
    slug: "ciena",
    group: "other",
    name: "Ciena - the company that taught fiber to carry colors",
    tagline: "The first commercial DWDM deployment (Sprint, 1996) multiplied installed fiber sixteenfold - and Ciena has compounded the optical layer ever since, Nortel inheritance included.",
    intro: "David Huber's dense wavelength-division multiplexing turned one strand of glass into sixteen channels without digging a meter of trench - the 1996 Sprint deployment that changed long-haul economics overnight. Ciena survived the crash that killed its rivals, inherited Nortel's optical crown in 2010, and its WaveLogic coherent optics have made wavelength capacity a semiconductor curve.",
    body: ["The profile covers the 1992 founding, the MultiWave 1600 and the record 1997 IPO, the crash years, the Nortel optical acquisition, and the coherent era from 40G to today's 800G class."],
  },
  {
    slug: "sniffer-lineage",
    group: "other",
    name: "The Sniffer lineage - Network General to NetScout",
    tagline: "The 1986 Sniffer made protocol analysis a profession; through Dolch luggables, Network Associates, and Arbor's DDoS telemetry, the whole bloodline converged on NetScout.",
    intro: "One entry for five companies, because they are one story: Network General's Sniffer named the practice every engineer still uses, Volker Dolch's rugged luggables were its field chassis, the Network Associates merger and un-merger carried the brand through the roll-up era, Arbor Networks scaled packet thinking to internet-wide DDoS telemetry - and NetScout, founded two years before the Sniffer existed, became the house where the whole analyzer tradition came home.",
    body: ["The profile covers the 1986 Sniffer, Sniffer University, the Dolch chassis, the 1997 NAI merger and 2004 rebirth, Arbor's Peakflow and ATLAS, and NetScout's 2007 and 2015 consolidating acquisitions."],
  },
  {
    slug: "blue-coat-packeteer",
    group: "other",
    name: "Blue Coat & Packeteer - the checkpoint companies",
    tagline: "CacheFlow's pivot made the proxy a security platform; PacketShaper created traffic shaping - together, the prehistory of the SSE category.",
    intro: "Two 1996 companies that answered the same question - what happens at the checkpoint - for content and for bandwidth. Blue Coat (born CacheFlow) made the inline proxy the enterprise web's enforcement point, SSL inspection included; Packeteer's PacketShaper taught the WAN that traffic has identity. Merged in 2008, carried through Symantec into Broadcom, their architecture is what every cloud secure web gateway runs today.",
    body: ["The profile covers the legendary CacheFlow IPO, the 2002 pivot to Blue Coat, PacketShaper's category creation, the 2008 acquisition, the private-equity years, and the Symantec-to-Broadcom passage."],
  },
  {
    slug: "cyclades-avocent-vertiv",
    group: "other",
    name: "Cyclades, Avocent & Vertiv - the physical layer of uptime",
    tagline: "A Brazilian-founded console-server pioneer, the KVM leaders, and Liebert's computer-room weather - consolidated into the company whose product is uptime itself.",
    intro: "Cyclades - founded in Fremont by Brazilian engineers, an early Linux champion - built the out-of-band discipline: the console path that shares no fate with the network it manages. Through Avocent's KVM heritage and Emerson Network Power (whose other root is Ralph Liebert's 1965 precision cooling), the lineage became Vertiv: access, power, and cooling as one problem, now the constraint the AI build-out plans around. The name also earns an honorable footnote: Pouzin's CYCLADES research network, TCP/IP's credited French ancestor.",
    body: ["The profile covers the 1989 Brazilian founding, the console-server category, the 2006 Avocent acquisition, Emerson Network Power and the Liebert root, the 2016 Vertiv carve-out, and the AI-density era."],
  },
  {
    slug: "dell-force10",
    group: "other",
    name: "Dell & Force10 - the direct model and its fabric",
    tagline: "A dorm-room assembler became the datacenter's broadest supplier - and the 10GbE pioneer it absorbed in 2011 became its switching lineage.",
    intro: "Michael Dell's direct model reset how hardware reaches buyers; the 2013 take-private and the 2016 EMC acquisition - the largest technology deal in history - rebuilt the company around the datacenter. Inside it runs Force10's engineering: the 1999 startup whose purpose-built E-Series delivered line-rate 10 Gigabit Ethernet before anyone else, whose FTOS lineage survives as Dell's switching OS today.",
    body: ["The profile covers the 1984 dorm-room founding and the direct model, Force10's E1200 and HPC fabrics, the 2011 acquisition, the take-private, the EMC megadeal, and the PowerSwitch present."],
  },
  {
    slug: "zte",
    group: "other",
    name: "ZTE - China's other giant",
    tagline: "Shenzhen 1985, top-four in 5G - and the 2018 denial order that made supply-chain dependency the industry's most vivid lesson.",
    intro: "Founded two years before its Shenzhen neighbor Huawei, ZTE grew from digital switching into one of the world's four mobile-equipment majors. In April 2018 a US component ban halted the company within weeks; the $1.4 billion settlement that restarted it - fine, escrow, replaced management, embedded monitors - turned 'where does your silicon come from' into a board-level network-design question everywhere.",
    body: ["The profile covers the 1985 founding, the ZXJ10 era, global scale through CDMA and handsets, the 2017 plea and 2018 denial-order crisis with its settlement, and the bifurcated 5G market ZTE now inhabits."],
  },
  {
    slug: "fluke",
    group: "other",
    name: "Fluke - the meters and certifiers in every field bag",
    tagline: "The 87 multimeter and the DSX CableAnalyzer - and a 2015 three-way split (Fortive, NetScout, NetAlly) worth knowing cold.",
    intro: "John Fluke Sr.'s 1948 instruments company became the generic word for the multimeter itself, and Fluke Networks made cabling certification an instrument category with legal weight. The 2015 Danaher deal split the story: enterprise visibility went to NetScout (the handheld line later reborn as NetAlly), while cable certification stayed Fluke Networks under Fortive - one company, three present-day homes.",
    body: ["The profile covers the 1948 founding, the 87, the DSP-to-DSX certification lineage, AirMagnet, the carefully-told 2015 split, and the Fortive present."],
  },
  {
    slug: "dns-bind",
    group: "other",
    name: "DNS & BIND - the internet's phone book and its reference implementation",
    tagline: "Mockapetris's 1983 design and Berkeley's software that ran it - delegation, caching, and forty years of the same wire format.",
    intro: "Before the DNS, the internet's names lived in a text file everyone downloaded. Paul Mockapetris's 1983 design replaced it with a delegated, cached, planetary database - and four Berkeley grad students wrote BIND, the implementation that made 'running DNS' and 'running BIND' the same sentence for a quarter century.",
    body: ["The profile covers HOSTS.TXT's collapse, RFC 882/883 and 1034/1035, the MX record, Vixie and ISC, BIND 9, the Kaminsky patch, the 2010 root signing, Dyn day, and the DoT/DoH era."],
  },
  {
    slug: "http-gopher",
    group: "other",
    name: "HTTP & Gopher - the web's protocol and the rival it eclipsed",
    tagline: "Two futures shipped in 1991; one spring of licensing decided between them - CERN gave the web away, Minnesota asked for money.",
    intro: "Gopher was the better-organized system and for two years it was winning. Then, weeks apart in 1993, Minnesota announced server fees and CERN declared the web royalty-free forever - the cleanest natural experiment in protocol economics ever run. HTTP went on to replace its own transport twice without breaking a URL.",
    body: ["The profile covers the 1989 CERN proposal and HTTP/0.9, Gopher's rise and Veronica, the spring-1993 licensing fork, Mosaic, the Host header, REST, and the HTTP/2-to-HTTP/3-over-QUIC arc this site's WAF material continues."],
  },
  {
    slug: "nvidia",
    group: "contemporary",
    name: "Nvidia - the GPU company that runs the fabric",
    tagline: "CUDA's decade-early bet, the AlexNet ignition, Mellanox - the network's biggest customer became one of its vendors.",
    intro: "Nvidia named the GPU, made it programmable a decade before the world needed it, and became the platform of the AI era. For this site's readers the 2020 Mellanox acquisition is the hinge: InfiniBand, Spectrum-X Ethernet, and BlueField DPUs make Nvidia simultaneously the most demanding workload networks carry and a top-tier network vendor - both sides of the AI-fabric argument.",
    body: ["The profile covers the 1993 founding, RIVA-to-GeForce survival and naming, CUDA, AlexNet, the Mellanox networking turn, the trillion-dollar ascent, and the NVLink/InfiniBand/Spectrum-X fabric wars."],
  },
  {
    slug: "ubiquiti",
    group: "contemporary",
    name: "Ubiquiti - enterprise features at prosumer prices",
    tagline: "airMAX armed the WISPs, UniFi made the controller model a $200 purchase - and two incidents every security reader should know cold.",
    intro: "Robert Pera's bet was that big-vendor radio performance could ship at a fraction of the price, sold by community instead of a sales force. airMAX connected the places carriers skipped; UniFi became the default answer for small networks and a rising share of serious ones. Kept factual, its 2015 BEC fraud and 2020-21 insider case are canonical security teaching material.",
    body: ["The profile covers the 2005 founding, the WISP world, UniFi and the 2011 IPO, the product-led model, and the two incidents on the public record."],
  },
  {
    slug: "access-home-fleet",
    group: "contemporary",
    name: "The access & home fleet - Netgear, TP-Link, Zyxel, Asus & Askey, Allied Telesis",
    tagline: "The boxes everyone actually owns: the first hop of most packets on Earth, told as one fleet.",
    intro: "Five names, one layer: the CPE and SOHO gear that put networking in ordinary rooms. Netgear's Bay Networks spinoff roots, TP-Link's decade-plus shipment crown, Zyxel's modem-era pedigree, the ASUS/Askey retail-and-ODM pairing, and Allied Telesis holding the access edge since 1987 - plus the 2024 geopolitics that scale eventually attracts.",
    body: ["The profile tells the five foundings, the mesh and cloud-management turns, the enthusiast-firmware culture, the invisible carrier-ODM fleet, and why this tier is both the industry's proving ground and its largest attack surface."],
  },
  {
    slug: "watchguard",
    group: "contemporary",
    name: "WatchGuard - the red box that made the firewall an appliance",
    tagline: "The 1996 Firebox turned security from a project into an object - and the mid-market has run on it since.",
    intro: "WatchGuard's founding bet was packaging: firewall software sealed into a red steel appliance, priced and consoled for the company with one IT person. The category the giants now dominate was proven here first - and the company never abandoned the mid-market and MSP channel it created.",
    body: ["The profile covers the Firebox, the 1999 IPO and 2006 take-private, the UTM years on Fireware, AuthPoint, the Panda Security acquisition, and the MSP-first present."],
  },
  {
    slug: "a10-kemp",
    group: "contemporary",
    name: "A10 & Kemp - the ADC challengers",
    tagline: "The second tier that kept the load-balancing leaders honest: A10 from the throughput flank, Kemp from below.",
    intro: "Application delivery never became a monopoly, and these two are why. Lee Chen's A10 built its franchise where traffic is heaviest - CGNAT, DDoS, the service-provider tier - while Kemp's LoadMaster priced the ADC for the Exchange administrator and went virtual before the market did. Every leader's quote was written knowing they existed.",
    body: ["The profile covers both foundings, the Brocade litigation chapter, the 2014 A10 IPO, the CGNAT decade, Thunder TPS, Kemp's virtual-first bet, and the 2021 Progress acquisition."],
  },
  {
    slug: "datacom",
    group: "contemporary",
    name: "Datacom - Brazil's networking manufacturer",
    tagline: "The hometown entry: carrier gear, GPON, and a national OS, designed and built in Rio Grande do Sul since 1998.",
    intro: "Every other company in this encyclopedia had to be imported into Brazil; Datacom grew there. Its own switching and GPON lines on its own DmOS carried the country's regional-ISP fiber boom - a standing existence proof that network sovereignty is buildable, from the same southern engineering culture that produced Cyclades' founders.",
    body: ["The profile covers the 1998 founding, the DmSwitch carrier-Ethernet years, DmOS, the provedores' GPON wave, the domestic-financing structural factor stated plainly, and the quarter-century mark."],
  },
];

/** Look up a partner vendor by slug. */
export function getPartnerVendor(slug: string): PartnerVendor | undefined {
  return partnerVendors.find((v) => v.slug === slug);
}

/** All slugs, for static generation. */
export const partnerVendorSlugs = partnerVendors.map((v) => v.slug);
