// ============================================================================
// ZYXEL - the modem-era first-mover from Hsinchu. Live-verified 2026-07-22
// (zyxel.com company history and 30th-anniversary release, Wikipedia,
// company-record aggregators): Dr. Shun-I Chu starts modem development in a
// rented Taoyuan apartment in 1988; Zyxel formally founded 1989 at Hsinchu
// Science Park; the name is a deliberate end-of-alphabet contrarian pick
// ("el" for excellence); world-first integrated 3-in-1 data/fax/voice modem
// in 1992 and first integrated analog/digital ISDN modem in 1995 (the
// legendary U-1496 family made the brand among BBS operators); TSE listing
// 1999 (3704); holding restructure (Unizyx, later Zyxel Group). Kept
// factual: the 2025 refusal to patch actively-exploited zero-days in
// end-of-life CPE, per public reporting, stands in the record.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const zyxelProfile: VendorProfile = {
  slug: "zyxel",
  foundings: [
    {
      company: "Zyxel",
      year: 1989,
      place: "Hsinchu Science Park, Taiwan (begun 1988 in a Taoyuan apartment)",
      founders: ["Dr. Shun-I Chu"],
      story:
        "While Taiwan's startups crowded the front of the alphabet for directory placement, Shun-I Chu went the other way on purpose - Zyx, from the end, with 'el' for excellence - and built modems good enough to make the contrarian name famous. Development started in a rented Taoyuan apartment in 1988; the company proper landed in Hsinchu Science Park in 1989. To the BBS generation, the ZyXEL U-1496 was the modem you saved for: firmware-upgradeable, feature-dense, and faster than the spec sheet era around it. The firsts followed - the integrated data/fax/voice modem in 1992, the analog/digital ISDN modem in 1995 - before the company rode every access transition since: DSL, fiber CPE, firewalls, Wi-Fi, and 5G fixed wireless.",
      sourceNote:
        "Apartment origin (1988, Taoyuan) and 1989 Hsinchu founding per Zyxel's own 30th-anniversary and history materials; the 1992 and 1995 world-firsts per the company record; U-1496 standing in the BBS era per the general record of the period.",
    },
  ],
  timeline: [
    { year: 1988, title: "The apartment lab", detail: "Shun-I Chu rents an apartment in Taoyuan and starts building an analog modem - the garage story, Taiwan edition." },
    { year: 1989, title: "Hsinchu founding", detail: "Zyxel is established at Hsinchu Science Park with a handful of engineers and a deliberately backwards name." },
    { year: 1992, title: "Three machines in one", detail: "The world's first integrated data/fax/voice modem ships - and the U-1496 family makes Zyxel the connoisseur's modem of the BBS world.", sourceNote: "World-first claim per the company record." },
    { year: 1995, title: "Analog meets digital", detail: "The first integrated analog/digital ISDN modem bridges the two access worlds in one box.", sourceNote: "Per the company record." },
    { year: 1999, title: "Public on the TSE", detail: "Zyxel lists on the Taiwan Stock Exchange (3704); the modem maker is now a broad access-equipment vendor for carriers and businesses." },
    { year: 2016, title: "The holding era", detail: "Corporate restructuring places the operating companies under a holding structure (Unizyx, later Zyxel Group) spanning carrier CPE, business networking, and security." },
    { year: 2025, title: "The end-of-life lesson", detail: "Zyxel declines to patch actively-exploited zero-days in end-of-life CPE still in the field and still on sale through marketplaces - a case study this site's readers should know: EOL policy is a security property.", sourceNote: "Per public security reporting, 2025; recorded factually." },
  ],
  products: [
    { name: "U-1496 and the modem line", what: "The firmware-upgradeable high-speed modems that built the brand in the BBS era." },
    { name: "Carrier CPE", what: "DSL, fiber, and 5G fixed-wireless endpoints for service providers - the volume backbone of the business." },
    { name: "Business networking and security", what: "Firewalls, switches, access points, and Nebula cloud management for the SMB tier." },
  ],
  innovations: [
    { title: "Integration firsts", detail: "The 1992 data/fax/voice and 1995 analog/digital ISDN integrations were genuine world-firsts - Zyxel repeatedly collapsed adjacent boxes into one before the market expected it." },
  ],
  markets: [
    "Carrier access CPE and SMB networking-and-security worldwide, from a Hsinchu base - one of the modem era's names still competing in every access generation since.",
  ],
  analyst: [
    "Placed among the contemporaries with genuine pioneer credentials in the modem era: a first-mover whose BBS-age reputation PRIME's generation of sysops remembers firsthand, and whose 2025 EOL episode keeps the record honest.",
  ],
};
