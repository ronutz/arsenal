// ============================================================================
// CYCLADES (the French research network) - where the datagram was born.
// Live-verified 2026-07-22 (INRIA's own historical account, the History of
// Computer Communications archive, historyofinformation.com, general
// record): project hosted at IRIA (today INRIA) under Louis Pouzin, launched
// 1972 (Pouzin recruited via the Delegation a l'Informatique, November
// 1971); first demonstration November 1973 with three hosts and one packet
// switch. CYCLADES was the FIRST network to make hosts responsible for
// reliable delivery over an unreliable datagram substrate - Pouzin coined
// "datagram" (data + telegram) - and Cerf and Kahn's May 1974 TCP paper
// cites the CYCLADES work directly. Killed by PTT politics: the state
// telecom monopoly would not tolerate a funded competitor to Transpac/X.25;
// INRIA's account has the project shut down in 1977, the general record has
// the network forced off by 1981 - the discrepancy is preserved below.
// Distinct from (and deliberately shelved beside) the BRAZILIAN Cyclades of
// the console-server story - same name, different continent, both honored.
// NOT a company: filed like RAND and NCSA, the research institutions whose
// ideas the industry is built on.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const cycladesNetworkProfile: VendorProfile = {
  slug: "cyclades-network",
  foundings: [
    {
      company: "CYCLADES (IRIA research network)",
      year: 1972,
      place: "IRIA (now INRIA), Rocquencourt, France",
      founders: ["Louis Pouzin"],
      story:
        "Louis Pouzin was handed a mandate most engineers would have played safe: build France's answer to ARPANET. Instead he built ARPANET's correction. Where the American network made its switches responsible for reliability, Pouzin's team pushed reliability out to the hosts and let the network carry simple, self-contained, unreliable packets he named datagrams - data plus telegram. The first demonstration ran in November 1973 on three hosts and one packet switch, and the idea traveled faster than the network: Vint Cerf and Bob Kahn's 1974 paper that became TCP/IP cites the CYCLADES work directly. The internet's deepest design decision - dumb network, smart edges - was proven here first.",
      sourceNote:
        "Project launch (1972), Pouzin's November 1971 recruitment, and the November 1973 first demonstration per INRIA's historical account and the History of Computer Communications archive; the Cerf-Kahn 1974 citations per the paper's own reference list as documented in the general record.",
    },
  ],
  timeline: [
    { year: 1971, title: "Pouzin gets the mandate", detail: "Recruited through the Delegation a l'Informatique in November 1971, Louis Pouzin - a Multics alumnus - is asked to build a French research network, and assembles the IRIA team." },
    { year: 1972, title: "CYCLADES launches at IRIA", detail: "Design and staffing begin. The architectural bet is set early: an unreliable datagram network layer, with reliability as an end-to-end, host-side responsibility." },
    { year: 1973, title: "Three hosts, one switch - and a new word", detail: "The first demonstration runs in November 1973. Within the project Pouzin coins 'datagram', and the Cigale packet subnet proves the connectionless design works in practice." },
    { year: 1974, title: "The idea crosses the Atlantic", detail: "Cerf and Kahn's 'A Protocol for Packet Network Intercommunication' - the TCP/IP founding paper - cites the CYCLADES contributions directly; Pouzin had been arguing the datagram case in the International Network Working Group since 1973.", sourceNote: "The paper's citations of the CYCLADES work per the general record of its reference list." },
    { year: 1977, title: "The PTT closes in", detail: "Data transmission is a French state monopoly, and the PTT sees no reason to fund a competitor to its coming Transpac X.25 network. INRIA's account has CYCLADES shut down in 1977; the general record describes the network being forced off by 1981.", sourceNote: "Shutdown date discrepancy preserved: 1977 per INRIA's own historical account; 'by 1981' per the general record. Both agree on the cause." },
    { year: 2013, title: "History pays its debt", detail: "Louis Pouzin shares the inaugural Queen Elizabeth Prize for Engineering with Cerf, Kahn, Berners-Lee, and Andreessen - the datagram's inventor recognized alongside the internet and web he made possible." },
  ],
  products: [
    { name: "The datagram", what: "The self-contained, connectionless packet - Pouzin's coinage and CYCLADES's substrate, and the packet model the internet still runs on." },
    { name: "Cigale", what: "The CYCLADES packet-switching subnet - deliberately simple switches, because the intelligence lived at the edges." },
    { name: "The end-to-end argument, in practice", what: "Host-responsible reliability over an unreliable network - demonstrated working at scale before the principle had its famous name." },
  ],
  innovations: [
    { title: "Dumb network, smart edges", detail: "CYCLADES proved that moving reliability into the hosts simplified the switches and produced a well-functioning network - the cornerstone design decision of TCP/IP and the internet." },
    { title: "The cost of killing it", detail: "The PTT's victory for Transpac and X.25 is the industry's canonical cautionary tale about incumbent monopolies and innovation: France, having invented the internet's key idea, adopted the internet late - veterans of the project put the lost industrial lead at well over a decade." },
  ],
  markets: [
    "A state-funded research network, not a company - its market was ideas, and its ideas won everywhere except, for twenty painful years, at home.",
  ],
  analyst: [
    "Filed in the pioneer lineage beside RAND and NCSA: the research institutions the industry is built on. And shelved, with a smile, near the Brazilian Cyclades of the console-server story - same name, different continent, both part of this site's history.",
  ],
};
