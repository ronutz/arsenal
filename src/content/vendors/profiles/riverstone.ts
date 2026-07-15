// ============================================================================
// src/content/vendors/profiles/riverstone.ts
// ----------------------------------------------------------------------------
// RIVERSTONE NETWORKS - RODOLFO'S SANTA CLARA YEARS (2000-2002), with the full
// verified record: born as Yago Systems (Sep 1996), acquired by Cabletron
// (Mar 17, 1998, renamed Riverstone), spun out in the Feb 2000 four-way split,
// IPO Feb 16, 2001 ($12/share, net $108.8M), the 2002-2003 accounting scandal,
// and the 2006 Section 363 auction won by Lucent at $207M over Ericsson.
//
// Verified 2026-07-15 against primary sources: Enterasys 10-K FY2002 (IPO Feb
// 16, 2001: 10.0M shares at $12, net $108.8M; strategic investors +5.4M),
// Riverstone SEC 8-K Feb 7, 2006 (the $170M Lucent agreement + deliberate
// solvent-company Section 363 filing, audit suspended), Riverstone 8-K FY2004
// ($18.5M class settlement; $254.4M cash Feb 2004; Toshiba + Enterasys
// disputes), Computerworld Mar 2006 (Lucent wins at $207M, +$37M over its own
// bid, topping Ericsson's $178M), Riverstone Wikipedia (auction Mar 21, 2006;
// Alcatel-Lucent merger Dec 1, 2006; wind-down), NH Business Review (SEC
// complaint: ~$30M inflated revenue; Pereira $1.2M gains; $1.06/share initial
// return), Grokipedia + vintage wikis (Yago Sep 1996 Sunnyvale; RS/RapidOS/
// HPS product detail; Ch.11 Feb 7, 2006, assets ~$98M vs liabilities ~$130M),
// Wall Street Transcript (Pereira: one of three Yago founders with Patel;
// ex-Cisco, ex-Kalpana). Yago-Cabletron terms per R6 canon (SEC 10-Q/A:
// $165.7M recorded cost; announced ~$90M, Jan 1998).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const riverstoneProfile: VendorProfile = {
  slug: "riverstone",
  foundings: [
    {
      company: "Yago Systems",
      year: 1996,
      place: "Sunnyvale, California",
      founders: ["Piyush Patel", "Romulus Pereira"],
      story:
        "Founded in September 1996 by three partners including Patel and Pereira - the latter fresh from Cisco and Kalpana, the company that had invented the Ethernet switch. Yago built wire-speed Layer 3/4 switching for Gigabit Ethernet backbones from a Sunnyvale office on Vaqueros Avenue, on a lean $4.9 million from backers including Sequoia Capital. Cabletron took a quarter of the company early, announced the acquisition of the rest in January 1998 at roughly $90 million, and closed on March 17, 1998 at a recorded cost of $165.7 million - then, per its own prospectus language, 'renamed Yago to Riverstone.'",
    },
    {
      company: "Riverstone Networks",
      year: 2000,
      place: "Santa Clara, California",
      founders: ["Romulus Pereira", "the Yago engineering team"],
      story:
        "Born in Cabletron's February 2000 four-way split as the service-provider company: roughly 250 people around the Yago-derived SmartSwitch Router line, led by Pereira as CEO, aimed at the metro networks carriers were racing to build. This is where Rodolfo worked from 2000 to 2002 - Santa Clara, at the center of the carrier Ethernet wave, in the company whose engineering DNA later resurfaced in Versa Networks.",
    },
  ],
  timeline: [
    { year: 1996, title: "Yago Systems founded", detail: "September 1996, Sunnyvale: wire-speed routing and Layer-4 switching for the Gigabit Ethernet era, from a three-founder team including Piyush Patel and ex-Cisco, ex-Kalpana engineer Romulus Pereira." },
    { year: 1998, title: "Cabletron closes on Yago", detail: "Announced in January at about $90 million and closed March 17, 1998 at a recorded cost of $165.7 million in stock, with $150 million written to in-process R&D. Cabletron renames Yago to Riverstone; the SmartSwitch Router becomes the group's flagship.", sourceNote: "Cabletron 10-Q/A and Riverstone 424B4 SEC filings." },
    { year: 2000, title: "The split creates Riverstone", detail: "February 2000: Cabletron's four-way split makes Riverstone the service-provider company - Santa Clara, Pereira as CEO, carrier-focused spins of the Yago line. Rodolfo joins the same year." },
    { year: 2001, title: "IPO and independence", detail: "February 16, 2001: Riverstone sells 10.0 million shares at $12 for net proceeds of $108.8 million - one of the few networking IPOs to get out after the bubble burst. That August, Cabletron distributes its 87 percent stake to shareholders and dissolves; Riverstone is the split's only true spin-off.", sourceNote: "Enterasys 10-K FY2002; Cabletron 8-K, Jul 30, 2001." },
    { year: 2002, title: "The SEC comes calling", detail: "Riverstone discloses an SEC investigation into its revenue accounting; the stock halves to $7.70, erasing nearly a billion dollars of value as the telecom collapse guts carrier spending." },
    { year: 2003, title: "The restatement", detail: "August 2003: fiscal 2002 and 2003 results are restated - the SEC's later complaint put the inflated revenue at nearly $30 million from improper deals. Quarterly revenue falls to $12.7 million from $30.1 million a year earlier." },
    { year: 2004, title: "Cleanup under new management", detail: "A $18.5 million settlement of the securities class actions is agreed in March 2004; the company still holds $254.4 million in cash but fights the Toshiba patent case, an Enterasys arbitration, and delisting - trading moves to the Pink Sheets as RSTN.PK." },
    { year: 2006, title: "Section 363 by design", detail: "February 7, 2006: Riverstone signs a $170 million asset purchase agreement with Lucent and files Chapter 11 in Delaware the same week - deliberately, as a solvent company (about $98 million in assets against $130 million in liabilities on the petition, plus its cash), using the Section 363 supervised auction to sell cleanly and dissolve.", sourceNote: "Riverstone SEC 8-K, Feb 7, 2006." },
    { year: 2006, title: "Lucent outbids Ericsson: $207 million", detail: "March 21, 2006: Lucent wins the auction at $207 million in cash, raising its own offer by $37 million to top Ericsson's $178 million bid. The sale closes in May; the shell renames itself RNI Wind Down Corporation, and shareholders initially receive $1.06 per share against the $12 IPO price.", sourceNote: "Computerworld/Network World, Mar 2006; NH Business Review." },
    { year: 2006, title: "Into Alcatel-Lucent, and out", detail: "December 1, 2006: Lucent completes its merger of equals with Alcatel. Riverstone's products overlap the combined portfolio, and the line is wound down - the Yago-to-Riverstone thread ends inside Alcatel-Lucent, eight years and three owners after the garage-era SmartSwitch Router." },
  ],
  products: [
    { name: "RS switch routers", what: "The RS 3000/8000/8600/32000/38000 multilayer switch routers - the Yago SmartSwitch lineage rebuilt for carriers, purpose-built for IP over Ethernet and MPLS VPN services in metro networks." },
    { name: "RapidOS", what: "Riverstone's carrier-class operating system: MPLS, per-flow accounting via LFAP, RMON, and the Hitless Protection System - control-module failover and even software upgrades without dropping traffic sessions." },
    { name: "Riverstone 15000", what: "The Ethernet edge router line that, with the RS family, made Riverstone the first MPLS Ethernet router vendor listed by the USDA Rural Utilities Service - opening rural broadband funding to its gear." },
  ],
  innovations: [
    { title: "Wire-speed Layer 3/4 in silicon", detail: "The Yago inheritance: routing and Layer-4 intelligence at switch speeds, in hardware, when most routers still did it in software." },
    { title: "Carrier Ethernet before the name", detail: "Riverstone sold Ethernet to carriers for metro triple-play services years before 'Carrier Ethernet' became the industry's banner - the market Lucent and Ericsson later fought over at auction." },
    { title: "Hitless operations", detail: "RapidOS's Hitless Protection System kept sessions alive through control failovers and software upgrades - an availability bar set for carrier gear." },
    { title: "Bankruptcy as an instrument", detail: "The 2006 filing was strategy, not collapse: a solvent company using Section 363 to run a clean supervised auction - and the auction worked, adding $37 million to the opening price." },
  ],
  markets: [
    "Riverstone competed in metro and carrier Ethernet against Cisco, Extreme, and Foundry, selling to carriers, ISPs, and cable operators building triple-play networks. The 2002-2003 accounting scandal and the telecom depression broke its independence; the technology was valuable enough that Lucent and Ericsson bid against each other for the remains.",
    "The alumni network is this page's living legacy: Kumar and Apurva Mehta, both senior at Riverstone and Yago before their Juniper years, went on to found Versa Networks - and Rodolfo, who worked here from 2000 to 2002, teaches the successor technologies of this whole era today.",
  ],
  analyst: [
    "The auction verdict on the technology: Lucent raised its own stalking-horse bid by $37 million to win at $207 million over Ericsson's $178 million - both giants wanted the metro Ethernet portfolio to fill data gaps.",
    "The shareholder ledger, per the public record: a $12 IPO in February 2001, $7.70 after the SEC disclosure, and an initial $1.06 per share returned from the wind-down.",
  ],
  careerLink: {
    href: "/about/vendors/partner/versa",
    label: "Riverstone alumni Kumar and Apurva Mehta founded Versa Networks - the Versa lineage page",
  },
};
