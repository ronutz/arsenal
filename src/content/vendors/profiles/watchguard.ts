// ============================================================================
// WATCHGUARD - the red box that made the firewall an appliance. Knowledge-
// based, dates well-documented (2026-07-17): founded 1996 in Seattle as
// Seattle Software Labs; the Firebox (1996) among the first purpose-built
// firewall appliances - the red steel box as category icon. IPO 1999;
// taken private 2006 by Francisco Partners and Vector Capital (~$151M,
// stated with sourceNote). UTM/XTM era on Fireware; Panda Security
// acquired 2020 (endpoint, confident); AuthPoint MFA 2018; the MSP-first
// unified security platform positioning of the present. Founder names not
// individually asserted (record commonly cites the Seattle Software Labs
// origin rather than a canonical founder list) - the RAND/Cyclades
// precedent for honest founders-line phrasing applies.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const watchguardProfile: VendorProfile = {
  slug: "watchguard",
  foundings: [
    {
      company: "WatchGuard Technologies (founded as Seattle Software Labs)",
      year: 1996,
      place: "Seattle, Washington",
      founders: ["Founded as Seattle Software Labs, 1996"],
      story:
        "In 1996 a firewall was mostly a project: software, a hardened UNIX box, and a consultant who knew both. WatchGuard's founding insight was that the mid-market would never buy a project - it would buy an object. The Firebox was that object: firewall software sealed into a distinctive red steel appliance, configured from a Windows console, priced for companies with one overworked IT person instead of a security team. The red box became the category's icon, and 'security appliance' became a product class largely because WatchGuard proved businesses would buy one off a shelf.",
    },
  ],
  timeline: [
    { year: 1996, title: "The Firebox ships", detail: "Security-in-a-box for the mid-market: the Firebox packages firewalling into a red appliance with approachable management - the form factor the entire industry, up to and including the giants, would eventually adopt." },
    { year: 1999, title: "Public in the boom", detail: "WatchGuard IPOs into the dot-com security wave, the red boxes multiplying through the SMB and branch-office world the enterprise vendors priced past." },
    { year: 2006, title: "Private again", detail: "Francisco Partners and Vector Capital take WatchGuard private, and the company settles into its long game: the unglamorous, durable mid-market it has never stopped serving.", sourceNote: "Take-private at approximately $151M per contemporaneous reporting, 2006." },
    { year: 2008, title: "The UTM years", detail: "Fireware-based XTM platforms bundle firewall, VPN, gateway antivirus, and content filtering - unified threat management as the mid-market's whole security stack in one red chassis." },
    { year: 2018, title: "AuthPoint", detail: "Cloud MFA joins the portfolio - identity arriving as the new perimeter for exactly the customers least equipped to build it themselves." },
    { year: 2020, title: "Panda Security", detail: "WatchGuard acquires the Spanish endpoint vendor, completing the pivot from firewall maker to unified security platform: network, identity, and endpoint under one MSP-friendly console." },
    { year: 2024, title: "The MSP channel era", detail: "The company's center of gravity is now the managed service provider - thousands of small businesses secured by proxy, the red box increasingly a cloud-managed node in someone else's operations center." },
  ],
  products: [
    { name: "Firebox", what: "The appliance that named the approach: firewall, VPN, and UTM services in the signature red chassis, from desktop branch units to rackmount." },
    { name: "Fireware", what: "The operating system and policy engine underneath - one management model across the range." },
    { name: "The unified platform", what: "AuthPoint MFA, Panda-lineage endpoint (EPDR), DNS filtering, and cloud management - the whole mid-market stack, MSP-operated." },
  ],
  innovations: [
    { title: "Security as an appliance", detail: "WatchGuard bet that packaging - a sealed box, a sane console, a predictable price - was itself the product the mid-market needed. Every firewall vendor's appliance line descends from that bet." },
    { title: "The MSP-first model", detail: "Long before 'MSSP' was a market segment, WatchGuard built for the channel operator managing fifty small networks at once - multi-tenant management as a first-class design goal rather than an enterprise afterthought." },
  ],
  markets: [
    "The mid-market and MSP channel: retail chains, clinics, schools, branch offices - the enormous stratum of networks below the enterprise vendors' attention and above doing nothing, defended disproportionately by red boxes.",
  ],
  analyst: [
    "WatchGuard's quarter-century is proof the mid-market is a durable security business, not a stepping stone - the company outlasted flashier rivals by never abandoning the buyer everyone else outgrew.",
    "The Firebox lineage is also a running argument this site's firewall material engages constantly: integrated simplicity versus best-of-breed depth, and what a small operation can realistically run.",
  ],
};
