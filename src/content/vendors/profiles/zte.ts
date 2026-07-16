// ============================================================================
// ZTE - China's other giant, and the industry's starkest supply-chain lesson.
// Knowledge-based, dates well-documented (2026-07-16): founded 1985 in
// Shenzhen (Zhongxing Semiconductor -> Zhongxing Telecommunication
// Equipment), Hou Weigui founding chairman; ZXJ10 digital switch in the
// early 1990s; CDMA and handset scale in the 2000s; top-5 global telecom
// equipment by the 2010s. The sanctions saga: March 2017 guilty plea
// (~$892M penalties, Iran/North Korea export violations, plus $300M
// suspended); April 2018 US denial order (seven-year component ban) halts
// major operations within weeks - the demonstration of dependency; June-July
// 2018 settlement ($1B fine + $400M escrow, board and management replaced,
// embedded compliance monitors) restores supply. 5G era: one of the four
// global RAN majors (with Huawei, Ericsson, Nokia); on the US covered list.
// Pairs with the live Huawei profile.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const zteProfile: VendorProfile = {
  slug: "zte",
  foundings: [
    {
      company: "ZTE (Zhongxing Telecommunication Equipment)",
      year: 1985,
      place: "Shenzhen, China",
      founders: ["Hou Weigui (founding chairman) and aerospace-ministry investors"],
      story:
        "Founded in the Shenzhen special economic zone in 1985 - two years before its neighbor Huawei - ZTE grew from semiconductor assembly into China's other telecom equipment giant: the state-linked, publicly listed counterpart to its privately held rival. Its ZXJ10 switch helped wire China's telephone boom, its CDMA gear and handsets scaled globally through the 2000s, and by the 2010s it stood among the world's top-five equipment makers. Then, in 2018, a US denial order switched off its component supply - and for a few weeks the world watched a hundred-thousand-person company demonstrate exactly what dependency means.",
    },
  ],
  timeline: [
    { year: 1993, title: "ZXJ10", detail: "ZTE's large digital switching system arrives as China's telephone network explodes - domestic switching for the world's fastest-growing market, the revenue base everything later stood on." },
    { year: 2005, title: "Global scale", detail: "CDMA systems, DSL, and low-cost handsets carry ZTE into emerging markets worldwide; alongside Huawei it makes 'Chinese telecom equipment' a global category rather than a domestic one." },
    { year: 2017, title: "The guilty plea", detail: "March 2017: ZTE pleads guilty in the US to illegally shipping US-origin equipment to Iran and North Korea - roughly $892 million in penalties with a further $300 million suspended, contingent on compliance.", sourceNote: "Figures per the US Department of Commerce/DOJ settlements, public record." },
    { year: 2018, title: "The denial order", detail: "April 2018: having violated the settlement's terms, ZTE is barred from US components for seven years. Within weeks major operations cease - no Qualcomm silicon, no US optics, no Android licensing. The starkest live demonstration the industry has ever had of supply-chain dependency as existential risk.", sourceNote: "Per the public record of the BIS denial order and ZTE's own disclosure that major operating activities had ceased." },
    { year: 2018, title: "The $1.4 billion restart", detail: "June-July 2018: a superseding settlement - $1 billion fine, $400 million in escrow, the board and senior management replaced, US-selected compliance monitors embedded - lifts the ban. ZTE survives, permanently changed, and every network operator on earth re-reads its bill of materials.", sourceNote: "Settlement terms per the public record." },
    { year: 2020, title: "The 5G major", detail: "ZTE ships as one of the four global RAN majors - dominant at home, significant across Asia, Africa, and Latin America - while the US covered-list designation walls it out of American networks; the bifurcated market becomes the industry's map." },
  ],
  products: [
    { name: "ZXJ10 and successors", what: "The digital switching lineage that wired China's boom - ZTE's founding franchise." },
    { name: "RAN and core (5G)", what: "One of four global-scale mobile network portfolios, from radio through packet core." },
    { name: "Fixed access and optics", what: "GPON, DSL, and transport lines carrying much of the emerging world's broadband." },
  ],
  innovations: [
    { title: "Cost-engineering at national scale", detail: "ZTE's contribution was economic: equipment priced for markets the incumbents ignored - the playbook that redrew the vendor map of the Global South." },
    { title: "The compliance lesson (learned in public)", detail: "The 2018 shutdown-and-restart made export-control exposure a board-level engineering input industry-wide - ZTE is the case study every supply-chain risk assessment cites." },
  ],
  markets: [
    "ZTE remains a top-four mobile-equipment vendor globally and a fixed-access giant - inside one half of a bifurcated world market whose dividing line its own 2018 crisis helped draw.",
  ],
  analyst: [
    "Paired deliberately with the Huawei profile: two Shenzhen giants, two ownership stories, one shared lesson - and for this site's readers, THE canonical answer to why 'where does your silicon come from' is a network-design question.",
  ],
};
