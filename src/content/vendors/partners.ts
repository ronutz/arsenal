// ============================================================================
// src/content/vendors/partners.ts
// ----------------------------------------------------------------------------
// PARTNER & OTHER-VENDOR DATA - drives the non-career vendor pages linked from
// the Vendors index. Two groups:
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
  group: "redu" | "other";
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
];

/** Look up a partner vendor by slug. */
export function getPartnerVendor(slug: string): PartnerVendor | undefined {
  return partnerVendors.find((v) => v.slug === slug);
}

/** All slugs, for static generation. */
export const partnerVendorSlugs = partnerVendors.map((v) => v.slug);
