// ============================================================================
// SUN MICROSYSTEMS - "the network is the computer." Knowledge-based, dates
// well-documented (2026-07-16): founded Feb 1982 by Vinod Khosla, Andy
// Bechtolsheim (his Stanford University Network workstation gave the company
// its name), Scott McNealy, with Bill Joy (BSD) joining months in; NFS 1984
// (published as an open protocol); SPARC 1987; Solaris; Java launched 1995;
// dot-com peak ("the dot in dot-com"); post-2001 collapse; open-sourced
// Solaris 2005 and OpenSSO (the ForgeRock bloodline, told on the Ping page);
// MySQL ~$1B 2008; Oracle acquisition closed January 27, 2010 (~$7.4B).
// Cross-links: Bechtolsheim -> Arista; ForgeRock -> Ping page; Oracle page.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const sunMicrosystemsProfile: VendorProfile = {
  slug: "sun-microsystems",
  foundings: [
    {
      company: "Sun Microsystems",
      year: 1982,
      place: "Santa Clara, California",
      founders: ["Vinod Khosla", "Andy Bechtolsheim", "Scott McNealy", "Bill Joy"],
      story:
        "Sun began as a Stanford graduate project with a business plan attached: Andy Bechtolsheim's SUN workstation - the Stanford University Network board - joined Vinod Khosla's ambition, Scott McNealy's operations, and, within months, Bill Joy, who carried Berkeley Unix in with him. The founding insight was in the name: computers were network citizens first. 'The network is the computer' sounded like marketing in 1984 when Sun published NFS as an open protocol; it reads like a prophecy now.",
    },
  ],
  timeline: [
    { year: 1982, title: "Four founders, one network", detail: "Workstations running BSD Unix with Ethernet on board by default - Sun ships the network-native computer while rivals still treat networking as an option." },
    { year: 1984, title: "NFS, given away", detail: "Sun publishes the Network File System as an open, licensable protocol - files across the network become ordinary, and Sun's openness play becomes the industry's template." },
    { year: 1987, title: "SPARC", detail: "Sun bets the company on its own RISC architecture and wins a decade of the workstation and server market; Solaris follows as the Unix to beat." },
    { year: 1995, title: "Java changes the subject", detail: "Write once, run anywhere: Gosling's language turns Sun from a hardware vendor into the center of internet software - and eventually runs on billions of devices its inventor never sold." },
    { year: 2000, title: "The dot in dot-com", detail: "Sun's E10000 servers power the internet buildout and the slogan writes itself; when the bubble bursts, the crash lands hardest on the company that sold the boom its hardware." },
    { year: 2005, title: "The open-source pivot", detail: "OpenSolaris, and the open-sourcing of the identity stack as OpenSSO - the code five ex-Sun engineers would rescue as ForgeRock in 2010, a lifeboat story told on this section's Ping Identity page. MySQL joins for ~$1 billion in 2008." },
    { year: 2010, title: "Oracle closes", detail: "January 27, 2010: Oracle completes the ~$7.4 billion acquisition after an EU review. Java, Solaris, and SPARC continue under new management; the Sun diaspora - Bechtolsheim to Arista among them - continues everywhere else.", sourceNote: "Close date per the deal record; buyer's side on the Oracle page." },
  ],
  products: [
    { name: "SPARC and Solaris", what: "The architecture-and-OS pair that defined enterprise Unix for two decades." },
    { name: "Java", what: "The language and runtime that outgrew its maker - still one of the most deployed platforms on earth." },
    { name: "NFS", what: "The open network file protocol that made 'the network is the computer' a daily reality." },
  ],
  innovations: [
    { title: "Open protocols as strategy", detail: "Publishing NFS and licensing SPARC taught the industry that openness could be a weapon - the playbook every open-source vendor since has run." },
    { title: "The network-native computer", detail: "Sun shipped machines that assumed the network from day one, a decade before the rest of the industry accepted the premise." },
  ],
  markets: [
    "Sun's technologies persist inside Oracle and across the industry - Java everywhere, ZFS and DTrace in open descendants - while its people seeded Arista, ForgeRock, and half of Silicon Valley's infrastructure companies.",
  ],
  analyst: [
    "For the Unix-workstation and internet-server eras, Sun was the reference vendor the evaluations were written around - until commodity x86 and Linux unwrote the category itself.",
  ],
};
