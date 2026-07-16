// ============================================================================
// MARCONI - wireless itself, then the bubble. Knowledge-based, dates
// well-documented (2026-07-16): Wireless Telegraph & Signal Co founded 1897,
// London, by Guglielmo Marconi (renamed Marconi's Wireless Telegraph Co
// 1900); transatlantic signal Dec 12, 1901 (Poldhu, Cornwall -> Signal Hill,
// Newfoundland); Titanic 1912 (Marconi operators, the wireless that saved
// 700+); English Electric absorbs 1946; GEC (founded 1886) acquires English
// Electric 1968 - Weinstock's conglomerate; GEC-Marconi defense arm sold to
// British Aerospace 1999 (-> BAE Systems); remainder renamed Marconi plc,
// bets on telecom: FORE Systems ~$4.5B + RELTEC ~$2.1B at the 1999-2000 top;
// 2001 collapse (profit warnings, shares down ~97%, debt restructuring 2003
// wipes shareholders); Ericsson acquires the key assets ~GBP 1.2B, completed
// January 2006; the rump becomes telent. Radio's father; telecom's Icarus.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const marconiProfile: VendorProfile = {
  slug: "marconi",
  foundings: [
    {
      company: "Marconi (Wireless Telegraph & Signal Company)",
      year: 1897,
      place: "London, United Kingdom",
      founders: ["Guglielmo Marconi"],
      story:
        "Guglielmo Marconi did not discover radio waves - Hertz did that - but he made them a business: the 1897 Wireless Telegraph and Signal Company turned laboratory sparks into ship-to-shore service, and the 1901 transatlantic signal from Cornwall to Newfoundland made wireless a world industry with one name on it. A century later that name, revived atop the remains of the GEC conglomerate, became telecom's most instructive collapse: the company that bet everything on network equipment at the exact top of the bubble.",
    },
  ],
  timeline: [
    { year: 1901, title: "Across the Atlantic", detail: "December 12, 1901: the letter S, sent from Poldhu in Cornwall, is received at Signal Hill, Newfoundland - long-distance wireless is real, and Marconi's company owns the moment and the market." },
    { year: 1912, title: "Titanic", detail: "The Marconi operators aboard Titanic work the CQD and SOS calls that bring Carpathia; over 700 survive because wireless was aboard - the disaster that made radio at sea mandatory, and the company a household name." },
    { year: 1968, title: "Into the GEC empire", detail: "English Electric, which had absorbed Marconi in 1946, is acquired by Arnold Weinstock's General Electric Company - the Marconi name becomes the electronics and defense crown of Britain's great conglomerate for three decades." },
    { year: 1999, title: "The fateful rebirth", detail: "GEC sells its defense business to British Aerospace (the seed of BAE Systems), renames the remainder Marconi plc, and spends the famous cash pile on American telecom equipment - FORE Systems for ~$4.5 billion, RELTEC for ~$2.1 billion - at the precise top of the market.", sourceNote: "Deal values as reported at announcement." },
    { year: 2001, title: "The collapse", detail: "Carrier spending stops; profit warnings cascade; the shares lose roughly 97% of their value, and the 2003 debt-for-equity restructuring effectively wipes the old shareholders - the U.K.'s starkest dot-com corporate casualty." },
    { year: 2006, title: "Ericsson takes the assets", detail: "January 2006: Ericsson completes the ~GBP 1.2 billion acquisition of Marconi's principal telecom businesses; the remainder becomes telent, a services firm - and the name that began radio leaves network equipment.", sourceNote: "Close per the deal record." },
  ],
  products: [
    { name: "Marine and long-distance wireless", what: "The founding business: ship-to-shore stations, transoceanic circuits, and the operators who staffed them." },
    { name: "GEC-Marconi electronics", what: "Radar, avionics, and defense electronics - the conglomerate decades, sold into what became BAE Systems." },
    { name: "Optical and access networks (Marconi plc)", what: "The final act's SDH, optical, and access portfolio - the pieces Ericsson kept." },
  ],
  innovations: [
    { title: "Radio as infrastructure", detail: "Marconi turned electromagnetic curiosity into scheduled, charged-for communication service - the business model of every wireless network since." },
    { title: "A cautionary masterpiece", detail: "The 1999-2001 arc - conglomerate cash converted to top-of-bubble acquisitions - is taught as the textbook failure of strategy by momentum." },
  ],
  markets: [
    "The Marconi name survives in heritage and in telent's services; its wireless legacy is the entire radio industry, and its collapse remains the reference case for telecom's bubble decade.",
  ],
  analyst: [
    "For the first half of the twentieth century, the standard the wireless world was measured against; for the twenty-first, the case study every telecom strategy review cites.",
  ],
};
