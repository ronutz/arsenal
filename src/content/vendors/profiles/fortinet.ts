// ============================================================================
// src/content/vendors/profiles/fortinet.ts
// ----------------------------------------------------------------------------
// FORTINET - the second teaching pillar. The company story has a direct bridge
// to this site's NetScreen/Juniper page: Ken Xie founded NetScreen in 1996,
// sold it to Juniper for $4B, and had already left to start Fortinet with his
// brother Michael in October 2000.
//
// Verified 2026-07-15: Fortinet IR board bios (co-founded October 2000; Ken
// Xie CEO since founding, previously founder/CEO of NetScreen, acquired by
// Juniper April 2004; Michael Xie President & CTO, ex-NetScreen software
// director/architect), Wikipedia/HandWiki (Appligation -> ApSecure ->
// Fortinet, "Fortified Networks"; FortiGate first product 2002 - May 2002 per
// Ken Xie's bio; $13M private funding 2000-2003; IPO November 2009 NASDAQ
// FTNT raising ~$156M; >15% of the UTM market per IDC at IPO time; Security
// Fabric introduced April 2016; Meru Networks 2015; Bradford Networks June
// 2018; enSilo and CyberSponse late 2019; Lacework June 2024; Next DLP
// August 2024), and this site's own July 15, 2026 record of the NSE
// certification program restoration.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const fortinetProfile: VendorProfile = {
  slug: "fortinet",
  foundings: [
    {
      company: "Fortinet (born Appligation, then ApSecure)",
      year: 2000,
      place: "Sunnyvale, California",
      founders: ["Ken Xie", "Michael Xie"],
      story:
        "Ken Xie had already built the first ASIC-based firewall/VPN appliance and founded NetScreen when he left in 2000 to start again with his brother Michael, an engineer out of NetScreen and Milkyway Networks. Incorporated in October 2000 - first as Appligation, then ApSecure, finally Fortinet, from 'Fortified Networks' - the company bet that security functions belonged together, in purpose-built silicon, at network speed. The FortiGate that followed fused firewall, VPN, antivirus, and intrusion prevention in one ASIC-accelerated box and named a category: unified threat management. Ken has been CEO since day one; Michael, President and CTO, still runs the technology.",
    },
  ],
  timeline: [
    { year: 2000, title: "The second act after NetScreen", detail: "October 2000: the Xie brothers incorporate in Sunnyvale in the teeth of the dot-com crash, raising $13 million in private funding through early 2003 on a working prototype and a performance argument: integrated security without the throughput penalty.", sourceNote: "Fortinet IR board bios; Wikipedia." },
    { year: 2002, title: "FortiGate ships", detail: "May 2002: the first FortiGate appliances launch - firewall, VPN, antivirus, and intrusion prevention consolidated on FortiASIC hardware under FortiOS. Anti-spam and web filtering follow, and the unified threat management category forms around the product." },
    { year: 2009, title: "IPO as the UTM leader", detail: "November 2009: Fortinet lists on NASDAQ as FTNT, raising about $156 million, with IDC crediting it more than 15 percent of the unified threat management market - the quiet crash-era startup arrives as a category leader." },
    { year: 2015, title: "Meru and the move into wireless", detail: "The acquisition of Meru Networks brings enterprise Wi-Fi into the portfolio, the first big step in growing from the firewall outward into the whole network edge - switching, access points, and later SD-WAN on the same FortiOS." },
    { year: 2016, title: "The Security Fabric", detail: "April 2016: Fortinet articulates the Security Fabric - FortiGate, endpoints, access, cloud, and third parties sharing telemetry and policy as one system. It becomes the company's organizing idea and sales story for the decade." },
    { year: 2019, title: "Filling the SOC shelf", detail: "Bradford Networks (2018) had brought network access control as FortiNAC; late 2019 adds enSilo (endpoint detection, becoming FortiEDR) and CyberSponse (SOAR) - the operations side of the fabric fills in." },
    { year: 2024, title: "Lacework and the cloud-native push", detail: "June 2024: Fortinet acquires cloud security company Lacework, folding a CNAPP into its universal SASE and cloud story; data-loss-prevention specialist Next DLP follows in August." },
    { year: 2026, title: "The NSE program returns", detail: "July 15, 2026: Fortinet retires the FCF / FCA / FCP / FCSS certification names and restores the eight-level NSE 1-8 progression, converting active certifications forward - the training arc this site's credentials page records first-hand." },
    { year: 2024, personal: true, title: "Rodolfo's chapter", detail: "The NSE ladder climbed from 2022, Fortinet Certified Trainer since 2024 - the FCP curriculum delivered as the portfolio's third teaching pillar." },
  ],
  products: [
    { name: "FortiGate", what: "The flagship next-generation firewall family, from desktop units to chassis and virtual and cloud editions, all running FortiOS with FortiASIC/NP-series acceleration." },
    { name: "FortiOS", what: "The single operating system across the portfolio - firewalling, SD-WAN, ZTNA, switching and Wi-Fi control converged in one policy model." },
    { name: "FortiManager and FortiAnalyzer", what: "Centralized management and logging/analytics for fleets of FortiGates - the operational pair taught in every Fortinet track." },
    { name: "FortiGuard Labs", what: "The threat-intelligence and security-services engine behind the subscriptions: IPS signatures, web filtering, antivirus, and AI-assisted detection feeds." },
  ],
  innovations: [
    { title: "Security in silicon", detail: "Purpose-built ASICs (FortiASIC, later the NP and CP lines) doing security work at wire speed - the founding thesis, and still the performance-per-dollar argument behind FortiGate." },
    { title: "Unified threat management", detail: "The consolidation of firewall, VPN, antivirus, IPS, and filtering into one appliance - the category FortiGate effectively created and rode to the 2009 IPO." },
    { title: "The Security Fabric", detail: "One vendor's whole portfolio behaving as a single, telemetry-sharing system - consolidation as an architecture rather than a bundle." },
  ],
  markets: [
    "Fortinet is one of the most widely deployed security vendors on earth, anchored by FortiGate's dominance in unit volume from branch offices to data centers, with a fast-grown second business in secure networking - switching, Wi-Fi, SD-WAN - plus OT security and, since 2024, a deeper cloud-native security push.",
  ],
  analyst: [
    "IDC credited Fortinet the top share of unified threat management at its 2009 IPO; in the years since, the firm has been a fixture among the leaders of the analyst network-firewall and SD-WAN evaluations, with the Security Fabric consolidation story central to that standing.",
  ],
};
