// ============================================================================
// src/content/vendors/profiles/pulse-secure.ts
// ----------------------------------------------------------------------------
// PULSE SECURE - the SSL VPN lineage: Neoteris to NetScreen to Juniper to
// Siris to Ivanti. A CAREER vendor page profile (Rodolfo distributed Pulse
// Secure in his ScanSource year, 2018-2019; corrected from Westcon,
// PRIME 2026-07-16). Verified 2026-07-15 vs SEC 8-K,
// Ivanti's official Pulse history page, and press: Siris Capital acquired
// the Junos Pulse business from Juniper Networks in 2014 (~$250M per press),
// forming Pulse Secure LLC; MobileSpaces acquired the same year; Pulse One
// launched 2015; Brocade's virtual ADC business (the Zeus/SteelApp lineage)
// acquired 2017; Ivanti announced the acquisition September 28, 2020
// (terms undisclosed; from Siris) alongside MobileIron, both closing
// December 1, 2020. Upstream lineage: the Neoteris "Instant Virtual
// Extranet" SSL VPN was acquired by NetScreen in 2003 (widely documented),
// and Juniper's 2004 NetScreen acquisition carried it in - the SA series,
// then Junos Pulse. Cross-links: the NetScreen/Juniper career page tells
// the upstream chapters; the MobileIron partner page tells the sibling
// acquisition; Rodolfo's own Juniper chapter (2009-2010) overlaps the
// Junos Pulse era from inside.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const pulseSecureProfile: VendorProfile = {
  slug: "pulse-secure",
  foundings: [
    {
      company: "Pulse Secure",
      year: 2014,
      place: "San Jose, California",
      founders: ["Carved out of Juniper Networks by Siris Capital"],
      story:
        "Pulse Secure was born a veteran. The product at its heart began as Neoteris's Instant Virtual Extranet - the appliance that defined clientless SSL VPN - which NetScreen bought in 2003 and Juniper inherited with NetScreen itself in 2004. Inside Juniper it became the SA series and then Junos Pulse, the remote-access standard of a corporate era; in 2014 Siris Capital carved the business out for roughly $250 million and Pulse Secure stood alone, one product family carrying four companies' history. This site's author met it from the distribution side, carrying Pulse in the ScanSource portfolio - while his own earlier chapter inside Juniper had overlapped the very years Junos Pulse took shape.",
    },
  ],
  timeline: [
    { year: 2003, title: "The Neoteris inheritance", detail: "NetScreen acquires Neoteris, whose Instant Virtual Extranet defined the clientless SSL VPN; Juniper's 2004 acquisition of NetScreen brings the line in-house - the story the NetScreen/Juniper page tells from the other side.", sourceNote: "Neoteris-NetScreen (2003) and NetScreen-Juniper (2004) per the widely documented deal record." },
    { year: 2014, title: "Siris carves out Pulse Secure", detail: "Siris Capital acquires the Junos Pulse business from Juniper (~$250 million per press coverage), forming Pulse Secure LLC - the SSL VPN franchise as a standalone company, with mobile-security startup MobileSpaces bought the same year." },
    { year: 2015, title: "Pulse One", detail: "Central policy management arrives, unifying secure access across endpoints and mobile devices to applications on-premises and in cloud - the portfolio widening beyond the gateway." },
    { year: 2017, title: "The Zeus thread arrives", detail: "Pulse acquires Brocade's virtual ADC business - the load-balancing lineage that began at Zeus Technology and passed through Riverbed as SteelApp - briefly uniting two storied product bloodlines under one small vendor." },
    { year: 2020, title: "Into Ivanti", detail: "September 28, 2020: Ivanti announces the acquisition of Pulse Secure from Siris (terms undisclosed) alongside MobileIron; both close December 1, 2020. Pulse Connect Secure becomes Ivanti Connect Secure - the remote-access line under its fifth flag.", sourceNote: "SEC 8-K and Ivanti/Siris announcements." },
  ],
  products: [
    { name: "Pulse Connect Secure", what: "The SSL VPN flagship - the Neoteris-lineage gateway, remote access for a generation of enterprises, now Ivanti Connect Secure." },
    { name: "Pulse Policy Secure", what: "Network access control from the same platform: posture, profiling, and enforcement at the point of entry." },
    { name: "Pulse One", what: "The central management plane across gateways, endpoints, and mobile." },
  ],
  innovations: [
    { title: "Clientless SSL VPN", detail: "The Neoteris design Pulse inherited put remote access in a browser - no fat client, no IPsec ceremony - and set the template enterprise VPNs followed for two decades." },
    { title: "One product, five flags", detail: "Neoteris, NetScreen, Juniper, Pulse Secure, Ivanti: the same secure-access lineage carried through four acquisitions - networking's supply chain of ideas in a single product family." },
  ],
  markets: [
    "The Pulse portfolio now ships as Ivanti's secure-access line, defending a vast VPN installed base while the market's center of gravity shifts toward zero-trust network access - the incumbent estate every ZTNA vendor bids to replace.",
  ],
  analyst: [
    "For years the SSL VPN reference alongside Cisco and F5 in the secure-access evaluations - the standing that made the franchise worth carving out, and worth acquiring twice.",
  ],
};
