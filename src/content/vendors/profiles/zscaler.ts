// ============================================================================
// src/content/vendors/profiles/zscaler.ts
// ----------------------------------------------------------------------------
// ZSCALER - the newest chapter. AUTHORIZATION UPDATE (PRIME 2026-07-15):
// Rodolfo is cleared as an authorized Zscaler instructor; the hub is open
// (JA3/JA4 tools carry the zscaler tag) and the i18n narrative states the
// authorization (the earlier disclaimer is retired). Sixth vendor in the
// teaching portfolio.
//
// Verified 2026-07-15: Wikipedia (founded 2007 by Jay Chaudhry and K.
// Kailash; platform launched 2008; IPO March 2018 raising $192M, Nasdaq ZS;
// added to the Nasdaq-100 December 17, 2021; Avalor acquired March 2024 for
// a reported $310M; Airgap Networks April 2024; Zero Trust SASE announced
// January 2024), Zscaler 8-K FY2024 (Avalor and Airgap business highlights),
// Zscaler press release (Red Canary acquisition completed August 1, 2025;
// ~45% of the Fortune 500; >500 billion daily transactions), Zscaler 8-K
// FY2026 Q1 (Red Canary + SPLX closed for $692.0M aggregate consideration).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const zscalerProfile: VendorProfile = {
  slug: "zscaler",
  foundings: [
    {
      company: "Zscaler",
      year: 2007,
      place: "San Jose, California",
      founders: ["Jay Chaudhry", "K. Kailash"],
      story:
        "Jay Chaudhry had already founded and sold a string of security companies - SecureIT, CipherTrust, AirDefense among them - when he bet his own money in 2007 on the least fashionable idea of the appliance era: that the secure web gateway should not be a box at all. With co-founder K. Kailash he built Zscaler as a multi-tenant inspection cloud from day one, launched in 2008, so that a user in any city would traverse a nearby enforcement node instead of being hairpinned through headquarters. It took the industry a decade and a pandemic to agree.",
    },
  ],
  timeline: [
    { year: 2007, title: "A cloud, not a box", detail: "Zscaler is founded in San Jose on the premise that security belongs between the user and the internet as a service - the platform goes live in 2008, years before 'SASE' or 'SSE' exist as words." },
    { year: 2016, title: "ZPA and the zero trust turn", detail: "Zscaler Private Access applies the same idea to internal applications: connect users to apps, never to networks. Together with ZIA it becomes the template for what analysts will later formalize as zero trust network access." },
    { year: 2018, title: "IPO: ZS", detail: "March 2018: Zscaler lists on Nasdaq, raising $192 million - the first of the pure cloud-security names to go public, and a bellwether for the model. It joins the Nasdaq-100 in December 2021." },
    { year: 2023, title: "The Zero Trust Exchange at scale", detail: "The platform brand consolidates around the Zero Trust Exchange - a global inspection cloud brokering user-to-app, workload-to-workload, and IoT/OT connections, processing hundreds of billions of transactions a day." },
    { year: 2024, title: "Data fabric and single-vendor SASE", detail: "January brings Zero Trust SASE on the company's SSE platform; March adds Avalor's Data Fabric for Security (a reported $310 million) and April the agentless segmentation of Airgap Networks - the analytics and east-west pieces.", sourceNote: "Zscaler 8-K FY2024; Avalor figure per press reporting." },
    { year: 2025, title: "Red Canary and the AI SOC", detail: "August 1, 2025: Zscaler completes the acquisition of MDR leader Red Canary, pairing its agentic detection-and-response expertise with the Zero Trust Exchange's telemetry; with the SPLX deal it totals $692 million in consideration - the stated ambition is the AI-powered SOC.", sourceNote: "Zscaler press release; 8-K FY2026 Q1 aggregate figure." },
    { year: 2026, title: "Scale as the moat", detail: "Protecting roughly 45 percent of the Fortune 500 and inspecting over 500 billion transactions daily, Zscaler's argument is now less about the idea - everyone concedes it - and more about who operates the biggest, smartest enforcement cloud." },
    { year: 2026, personal: true, title: "Rodolfo's chapter", detail: "Cleared as an authorized Zscaler instructor in 2026 - the sixth vendor in the teaching portfolio, and the newest chapter of this record, with the hub on this site already open." },
  ],
  products: [
    { name: "Zscaler Internet Access (ZIA)", what: "The founding product: cloud-delivered secure web gateway, firewall, sandbox, and DLP between users and the internet." },
    { name: "Zscaler Private Access (ZPA)", what: "Zero trust network access to internal applications - users reach apps through the exchange without ever joining the network." },
    { name: "Zscaler Digital Experience (ZDX)", what: "End-to-end user experience monitoring across the same cloud - the operations counterpart to inline security." },
    { name: "Zero Trust Exchange", what: "The platform itself: the globally distributed inspection and policy cloud all the services run on, now feeding an AI-driven security operations stack built on the Avalor data fabric and Red Canary." },
  ],
  innovations: [
    { title: "Security as a multi-tenant cloud", detail: "Building the inspection plane as a purpose-built global service in 2008 - the architectural bet that predated, and then defined, the SSE category." },
    { title: "User-to-app, never user-to-network", detail: "ZPA's inversion of remote access: no inbound listeners, no lateral movement surface - the pattern the whole ZTNA market standardized on." },
    { title: "Telemetry into operations", detail: "Turning half a trillion daily transactions into a data fabric (Avalor) and agentic detection and response (Red Canary) - security operations as a product of scale." },
  ],
  markets: [
    "Zscaler leads the cloud-delivered security edge market it effectively created, selling to large enterprises replacing web proxy appliances and VPN concentrators - and competes squarely with Netskope, Palo Alto Networks, and Cisco as the SSE and zero trust categories consolidate.",
  ],
  analyst: [
    "A fixture among the Leaders of Gartner's Security Service Edge Magic Quadrant since its inaugural edition, with the secure-web-gateway heritage that made it the reference point the category was drawn around.",
  ],
};
