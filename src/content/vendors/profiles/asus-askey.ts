// ============================================================================
// ASUS + ASKEY - the motherboard empire and its network-communications arm.
// Live-verified 2026-07-22 (Wikipedia infobox for ASUS; askey.com.tw,
// Crunchbase, Golden, CES/MWC exhibitor records for Askey): ASUS founded
// 2 April 1989 in Taipei by four ex-Acer engineers (Ted Hsu, M.T. Liao,
// Wayne Tsiah, T.H. Tung; the infobox also lists Luca D.M.); name from
// Pegasus; grew from motherboards into the world's fifth-largest PC vendor,
// with ROG as the gaming standard-bearer and subsidiaries including Askey,
// AAEON, and ASMedia. Askey founded 1989 in Taipei as a modem maker; today
// a member of the ASUS Group (Golden records the Asus acquisition as 2006;
// Askey's own materials describe it as a member of ASUSTeK) - a
// 5,000-7,000-person ODM of carrier CPE: cable and DSL modems, gateways,
// set-top boxes, small cells, 5G FWA - with R&D and business offices that
// include Brazil. Consolidated per PRIME's grouping directive 2026-07-22.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const asusAskeyProfile: VendorProfile = {
  slug: "asus-askey",
  foundings: [
    {
      company: "ASUS (ASUSTeK Computer)",
      year: 1989,
      place: "Taipei, Taiwan",
      founders: ["Ted Hsu", "M.T. Liao", "Wayne Tsiah", "T.H. Tung"],
      story:
        "Four hardware engineers left Acer to build the motherboard company they thought Taiwan deserved - named for Pegasus, with the first three letters dropped so it would still file near the top of a catalog. ASUS earned its reputation the unglamorous way: boards that ran Intel's newest silicon correctly, sometimes before Intel's own reference designs did. The motherboard trust compounded into laptops, servers, phones, and the Republic of Gamers line, carrying the company to the world's top five PC vendors - an empire that started with getting the chipset traces right.",
      sourceNote:
        "Founding date and founders per the Wikipedia company record (which additionally lists Luca D.M. among the founders); 'fifth-largest PC vendor' per the same record's market-share citation.",
    },
    {
      company: "Askey Computer",
      year: 1989,
      place: "Taipei, Taiwan",
      founders: [],
      story:
        "Founded the same year as ASUS and later folded into its group, Askey took the invisible half of the networking business: the ODM side. If you rented a cable modem, a DSL gateway, or a carrier set-top box across three decades - in North America, Europe, or Brazil, where Askey keeps an office - there is a fair chance Askey built it, whatever brand was on the label. The portfolio followed the access network itself: analog modems, then DOCSIS and DSL, then Wi-Fi CPE, and now 5G fixed-wireless units and private-5G small cells.",
      sourceNote:
        "Founding year and ASUS Group membership per Askey's own materials and exhibitor records; Golden's company record dates the Asus acquisition to 2006. Founder names are not consistently recorded in public sources and are left unstated rather than guessed.",
    },
  ],
  timeline: [
    { year: 1989, title: "Two Taipei foundings", detail: "ASUS starts on motherboards; Askey starts on modems - the branded and the white-label halves of what becomes one group." },
    { year: 1997, title: "ASUS goes beyond the board", detail: "Notebooks join the line; the component maker becomes a systems company while keeping the enthusiast motherboard crown." },
    { year: 2006, title: "Askey joins the ASUS Group", detail: "Askey becomes an ASUS Group member and scales as a network-communications ODM, running major manufacturing in Taiwan and Suzhou.", sourceNote: "Acquisition year per Golden's company record; Askey's materials describe ongoing ASUSTeK membership." },
    { year: 2006, title: "Republic of Gamers", detail: "ASUS launches ROG, the sub-brand that turns enthusiast hardware into a durable identity and pulls the whole PC-gaming market's expectations upward." },
    { year: 2008, title: "The netbook moment", detail: "The Eee PC wave - ASUS briefly redefines the cheap-portable category and demonstrates its ability to create markets, not just serve them." },
    { year: 2020, title: "Askey rides the access transitions", detail: "The CPE portfolio spans DOCSIS, xPON, Wi-Fi 6 and beyond, 5G fixed wireless, and private-5G small cells - the same invisible-builder role, one access generation later." },
  ],
  products: [
    { name: "ASUS motherboards / ROG", what: "The enthusiast and OEM board lines that built the brand, and the gaming sub-brand that extended it." },
    { name: "ASUS systems", what: "Notebooks, desktops, servers, and networking gear - a top-five global PC vendor's full portfolio." },
    { name: "Askey carrier CPE", what: "Cable and DSL modems, residential gateways, set-top boxes, 5G FWA units, and small cells, built ODM for operators worldwide." },
  ],
  innovations: [
    { title: "Trust as a component", detail: "ASUS made the motherboard - the least visible, most failure-prone part of a PC - into a brand consumers asked for by name; the group's whole arc follows from that earned trust." },
    { title: "The ODM access machine", detail: "Askey's role is the industry's open secret: the access network's endpoints are largely built by companies nobody's heard of, at scale, to each operator's spec - and Askey is one of the biggest of them." },
  ],
  markets: [
    "ASUS competes across consumer and commercial PCs, components, and gaming; Askey serves carriers and operators as a network-communications ODM with manufacturing in Taiwan, China, and Vietnam and offices including Brazil.",
  ],
  analyst: [
    "Placed among the contemporaries: ASUS as one of the PC industry's enduring top-tier vendors, Askey as the group's networking arm and a reminder that much of the connected world's edge hardware is ODM-built. Consolidated into one profile per the grouping that makes corporate sense.",
  ],
};
