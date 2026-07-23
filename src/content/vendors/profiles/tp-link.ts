// ============================================================================
// TP-LINK - the volume king of consumer networking. Knowledge-based, dates
// well-documented (2026-07-22): founded 1996 in Shenzhen by brothers Zhao
// Jianjun and Zhao Jiaxing; the name abbreviates "twisted pair link"; for
// roughly a decade running, the world's number-one shipper of consumer WLAN
// devices (per IDC rankings widely cited by the company and press); Kasa/
// Tapo smart-home lines; Omada as the SMB cloud-managed tier; corporate
// restructuring separated TP-Link Systems (US-headquartered) from the
// original Shenzhen entity in the 2020s; on the public record, US-government
// scrutiny of TP-Link routers reported since late 2024 - noted factually,
// outcome unresolved at verification date.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const tpLinkProfile: VendorProfile = {
  slug: "tp-link",
  foundings: [
    {
      company: "TP-Link",
      year: 1996,
      place: "Shenzhen, China",
      founders: ["Zhao Jianjun", "Zhao Jiaxing"],
      story:
        "Two brothers in Shenzhen named their company after the cable itself - TP for twisted pair - and built the most disciplined volume machine consumer networking has seen. The playbook was consistency at a price nobody could match: routers, switches, and adapters that worked out of the box, shipped in staggering quantity, and iterated relentlessly. It carried TP-Link to the top of the global consumer WLAN shipment rankings and kept it there year after year - the brand a large share of the connected world actually runs on, whether it thinks about networking or not.",
      sourceNote:
        "Founding year, founders, and the twisted-pair name origin per the standard corporate record; the sustained number-one consumer-WLAN shipment ranking per IDC figures as widely cited.",
    },
  ],
  timeline: [
    { year: 1996, title: "Named after the cable", detail: "The Zhao brothers found TP-Link in Shenzhen - 'twisted pair link' - building network adapters and the value tier of home networking." },
    { year: 2005, title: "Going global", detail: "International expansion begins in earnest; the value-plus-reliability formula translates across markets and TP-Link becomes a worldwide retail fixture." },
    { year: 2010, title: "The shipment crown", detail: "TP-Link reaches the top of global consumer WLAN shipment rankings - a position it holds for years running.", sourceNote: "Per IDC rankings as widely cited by the company and trade press." },
    { year: 2016, title: "Beyond the router", detail: "Kasa (and later Tapo) smart-home lines, Deco whole-home mesh, and the Omada cloud-managed SMB tier broaden the portfolio up-market and into the home." },
    { year: 2024, title: "Under the microscope", detail: "US-government scrutiny of TP-Link routers is reported, with potential restrictions discussed; the corporate structure has meanwhile split a US-headquartered TP-Link Systems from the Shenzhen original.", sourceNote: "Per press reporting from late 2024 onward; unresolved as of this profile's verification date (2026-07-22) - recorded factually, not adjudicated." },
  ],
  products: [
    { name: "Archer / Deco", what: "The consumer router and whole-home mesh lines - the volume core." },
    { name: "Omada", what: "Cloud-managed SMB networking: access points, switching, gateways - the controller model at the value tier." },
    { name: "Kasa / Tapo", what: "Smart plugs, cameras, and home automation - the router company's beachhead in the smart home." },
  ],
  innovations: [
    { title: "Discipline as strategy", detail: "TP-Link's contribution is operational: proof that supply-chain rigor and relentless cost-performance iteration can win a global market against every incumbent - the hard version of 'good enough, everywhere, affordably'." },
  ],
  markets: [
    "The global consumer networking volume leader for years running, with growing SMB (Omada) and smart-home (Tapo) positions - and, kept factual, a geopolitical spotlight it now navigates.",
  ],
  analyst: [
    "Placed among the contemporaries as the definitive volume story of the category NETGEAR invented - and a live case study in how networking hardware has become an object of supply-chain and national-security politics.",
  ],
};
