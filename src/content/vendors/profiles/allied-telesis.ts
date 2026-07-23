// ============================================================================
// ALLIED TELESIS - Japan's global Ethernet workhorse. Live-verified
// 2026-07-22 (Wikipedia company record, alliedtelesis.com founder memorial,
// Japan Times profile, financial-record aggregators): founded March 1987 in
// Tokyo by Takayoshi Oshima (1940-2022; ex-ITT, Fairchild, AMD, and
// Ungermann-Bass) as System Plus Co., renamed Allied Telesis K.K. in
// September 1987; the US/international arm operated as Allied Telesyn from
// 1990 before the global rename back to Allied Telesis; humble beginnings
// in Ethernet media converters (the company's own telling); TSE listing
// 2000 (6835); today an enterprise/industrial networking vendor known for
// resilient-ring and self-defending-network work, dual-headquartered
// energy between Tokyo and San Jose.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const alliedTelesisProfile: VendorProfile = {
  slug: "allied-telesis",
  foundings: [
    {
      company: "Allied Telesis",
      year: 1987,
      place: "Tokyo, Japan",
      founders: ["Takayoshi Oshima"],
      story:
        "Takayoshi Oshima had already worked the American semiconductor and networking trenches - ITT, Fairchild, AMD, Ungermann-Bass - before going home to build Japan's answer to the Ethernet boom. The company began life in March 1987 as System Plus, took the Allied Telesis name within months, and started with the humblest product in the catalog: the media converter, the little box that marries copper to fiber. From that unglamorous foothold it grew into a global switching and infrastructure vendor - Allied Telesyn to a generation of international buyers - listed in Tokyo in 2000, and still dual-hearted between Japan and Silicon Valley. Oshima led it for 35 years until his death in 2022.",
      sourceNote:
        "Founding name and 1987 dates per the Wikipedia company chronology (System Plus, March 1987; renamed September 1987); Oshima's career background and the media-converter origin per Allied Telesis's own memorial and history materials. Some secondary sources render the original name as 'System & Control Japan'; the company chronology's 'System Plus' is used here.",
    },
  ],
  timeline: [
    { year: 1987, title: "System Plus becomes Allied Telesis", detail: "Founded in Tokyo in March; renamed Allied Telesis K.K. in September - an Ethernet company from day one, starting with media converters." },
    { year: 1990, title: "Allied Telesyn goes abroad", detail: "The international arm launches under the Allied Telesyn name, planting the brand across Asia-Pacific, the Americas, and Europe through the 1990s." },
    { year: 2000, title: "Tokyo listing", detail: "Allied Telesis lists on the Tokyo Stock Exchange (6835) - one of the first Japanese networking firms at genuinely global scale." },
    { year: 2006, title: "One name worldwide", detail: "The Telesyn-era branding converges back to Allied Telesis globally as the product line moves up into managed switching, resilient rings, and converged infrastructure." },
    { year: 2015, title: "Self-defending networks", detail: "The company's security-automation push - isolate-on-threat behavior in the network fabric itself - becomes its signature enterprise story, developed with Japanese university partnerships." },
    { year: 2022, title: "The founder's chapter closes", detail: "Takayoshi Oshima dies on October 7, 2022, after 35 years leading the company he founded.", sourceNote: "Per the company's memorial announcement." },
  ],
  products: [
    { name: "Media converters", what: "The founding product line - copper-to-fiber conversion, still a catalog staple and a fitting origin for an Ethernet-infrastructure company." },
    { name: "Switching and industrial networking", what: "Managed enterprise and ruggedized industrial switches, with resilient-ring architectures for utilities and transport." },
    { name: "AMF / Self-Defending Network", what: "Autonomous management and threat-isolation across the fabric - the automation layer over the hardware line." },
  ],
  innovations: [
    { title: "Reliability as the brand", detail: "Allied Telesis never chased the bleeding edge; it standardized the dependable middle - the switches and converters that run schools, hospitals, factories, and city infrastructure for decades between thoughts." },
  ],
  markets: [
    "Enterprise, government, education, and industrial networking worldwide, with particular depth in Japan and Asia-Pacific and a durable install base wherever unglamorous uptime is the requirement.",
  ],
  analyst: [
    "Placed among the contemporaries as the steady-state survivor: one founder, one focus, from a 1987 media converter to a global infrastructure line - proof that endurance is itself a strategy in this industry.",
  ],
};
