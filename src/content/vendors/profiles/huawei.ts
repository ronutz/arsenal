// ============================================================================
// HUAWEI - the Shenzhen ascent. Knowledge-based, factual/neutral tone by
// design (2026-07-16): founded 1987 in Shenzhen by Ren Zhengfei with ~21,000
// yuan, initially reselling PBX equipment; own R&D from the early 1990s;
// rural-first then global expansion; HiSilicon founded 2004; passes Ericsson
// as largest telecom-equipment maker ~2012; #2 smartphone maker 2019; US
// Entity List May 2019; Meng Wanzhou detained 2018, returned 2021, later a
// rotating chairwoman; Mate 60 / Kirin silicon return 2023; HarmonyOS;
// employee-shareholding structure; rotating-chairman governance. Public
// record throughout; policy controversies stated factually, not litigated.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const huaweiProfile: VendorProfile = {
  slug: "huawei",
  foundings: [
    {
      company: "Huawei",
      year: 1987,
      place: "Shenzhen, China",
      founders: ["Ren Zhengfei"],
      story:
        "Ren Zhengfei, a former People's Liberation Army engineer, founded Huawei in Shenzhen in 1987 with about 21,000 yuan and a business reselling imported PBX switches. The company's defining decision came early: pour revenue into its own R&D and sell first where the incumbents would not go - China's countryside, then the developing world, then everywhere. Three decades later Huawei led the world in telecom equipment, and its collision with United States technology policy became the defining industrial-policy story of the era.",
    },
  ],
  timeline: [
    { year: 1987, title: "Twenty-one thousand yuan", detail: "Founded in Shenzhen as a PBX reseller; by the early 1990s Huawei is designing its own switches and adopting the strategy that defines it: surround the cities from the countryside." },
    { year: 2004, title: "HiSilicon", detail: "Huawei founds its own chip design arm - a hedge against supplier dependence that, fifteen years later, becomes the center of its survival story." },
    { year: 2012, title: "Number one", detail: "Huawei passes Ericsson as the world's largest telecom-equipment maker - the first time the industry's top vendor is Chinese - while its enterprise and consumer lines accelerate." },
    { year: 2019, title: "The Entity List", detail: "May 2019: the United States places Huawei on the export-control Entity List, cutting access to American technology including advanced semiconductors and Google services; allied restrictions on 5G equipment follow in several countries. Meng Wanzhou, detained in Canada since 2018, returns to China in 2021." },
    { year: 2023, title: "The silicon return", detail: "The Mate 60 ships with a domestically fabricated Kirin processor - the sanctions-era comeback nobody outside predicted on that timetable - as HarmonyOS matures into a full ecosystem play." },
    { year: 2024, title: "The parallel stack", detail: "Huawei's current chapter is vertical: its own silicon, its own OS, cloud, and AI hardware - building a complete technology stack designed to need no permission, with the employee-owned, rotating-chairman structure unchanged beneath it." },
  ],
  products: [
    { name: "Carrier networks", what: "Wireless, fixed, and optical infrastructure: the portfolio that made Huawei the largest equipment vendor on earth." },
    { name: "Enterprise and cloud", what: "Campus and datacenter networking, storage, and Huawei Cloud - the CloudEngine and OceanStor lines." },
    { name: "Devices and HarmonyOS", what: "The consumer arm: Mate and Pura flagships on Kirin silicon, and the in-house operating system across them." },
  ],
  innovations: [
    { title: "R&D at overwhelming scale", detail: "Huawei's research spending - tens of billions of dollars a year, among the world's largest - turned a reseller into a company that files more patents than almost anyone." },
    { title: "The self-sufficiency stack", detail: "Silicon to OS to cloud under one roof, built under export controls: whatever one's politics, an industrial feat without modern precedent." },
  ],
  markets: [
    "Huawei sells carrier, enterprise, cloud, and consumer technology across most of the world, restricted in several Western markets - one of the 5G triumvirate with Ericsson and Nokia, and the center of the technology-sovereignty era's defining argument.",
  ],
  analyst: [
    "A leader across the carrier-infrastructure evaluations for over a decade - with a geopolitical asterisk no other vendor in this section carries.",
  ],
};
