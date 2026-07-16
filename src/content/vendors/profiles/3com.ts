// ============================================================================
// 3COM - Ethernet leaves the lab. Knowledge-based, dates well-documented
// (2026-07-16): founded June 1979 by Bob Metcalfe (ex-PARC, Ethernet's
// inventor) with Howard Charney, Bruce Borden, Greg Shaw ("Computers,
// Communication, Compatibility"); DIX standard 1980; EtherLink ISA card 1982
// (first PC Ethernet adapter with on-chip transceiver); Bridge Communications
// merger 1987; US Robotics merger June 1997 (~$6.6B stock - Palm arrives);
// Palm IPO March 2000 (spun off July 2000); exits high-end enterprise 2000;
// H3C JV with Huawei 2003, full ownership Nov 2007; Bain+Huawei buyout
// blocked over CFIUS concerns 2008; HP acquisition ~$2.7B announced Nov 11,
// 2009, completed April 12, 2010. Cross-links: Xerox/PARC page (invention),
// HPE page family. This is the commercialization half of the Ethernet story.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const threeComProfile: VendorProfile = {
  slug: "3com",
  foundings: [
    {
      company: "3Com",
      year: 1979,
      place: "Santa Clara, California",
      founders: ["Bob Metcalfe", "Howard Charney", "Bruce Borden", "Greg Shaw"],
      story:
        "Bob Metcalfe invented Ethernet at Xerox PARC in 1973; in 1979 he left to sell it. 3Com - Computers, Communication, Compatibility - bet that the network Xerox would not commercialize could become a product for everyone, and the 1980 DIX standard (Metcalfe had persuaded DEC, Intel, and his old employer to publish it) made the bet safe. The 1982 EtherLink card put Ethernet on an ISA slot inside the IBM PC, and the LAN stopped being a laboratory concept. Where the Xerox page in this section tells the invention, this page tells the industry.",
    },
  ],
  timeline: [
    { year: 1980, title: "The DIX standard", detail: "Metcalfe's evangelism gets DEC, Intel, and Xerox to publish Ethernet as an open specification - the single act that let a startup build a market on a giant's invention." },
    { year: 1982, title: "EtherLink", detail: "The first Ethernet adapter for the IBM PC with the transceiver on the card itself - thin coax, one slot, and the office LAN becomes something a business buys at retail." },
    { year: 1987, title: "Bridge Communications", detail: "The merger with Bridge adds routers, terminal servers, and enterprise ambition; through the 1990s 3Com's adapters, hubs, and switches wire an enormous share of the world's desktops." },
    { year: 1997, title: "US Robotics - and Palm", detail: "The ~$6.6 billion stock merger brings modems at their peak and, almost incidentally, Palm - whose Pilot becomes the defining handheld and, by its March 2000 IPO, briefly worth more than its parent.", sourceNote: "Deal value ~$6.6B as widely reported at announcement." },
    { year: 2003, title: "H3C: the China venture", detail: "After retreating from high-end enterprise in 2000, 3Com forms Huawei-3Com; it buys full ownership in November 2007, and a 2008 Bain-led buyout involving Huawei collapses over CFIUS national-security review - a preview of the decade to come." },
    { year: 2010, title: "HP closes", detail: "April 12, 2010: HP completes the ~$2.7 billion acquisition, aiming H3C and 3Com's networking at Cisco; the brand dissolves into HP Networking, and its Chinese arm later anchors the H3C that Tsinghua Unigroup majority-owns.", sourceNote: "Announced November 11, 2009; close per the deal record." },
  ],
  products: [
    { name: "EtherLink adapters", what: "The cards that put Ethernet in the PC - among the highest-volume networking products of their era." },
    { name: "SuperStack and CoreBuilder", what: "The stackable and enterprise switching lines of the 1990s LAN buildout." },
    { name: "Palm (1997-2000)", what: "The handheld that arrived with US Robotics and briefly out-shone everything else in the house." },
  ],
  innovations: [
    { title: "Commercializing an open standard", detail: "3Com proved the playbook this whole industry runs on: give the standard away, win the implementation - the founder sold the market on openness before selling it a single card." },
    { title: "Ethernet on the desktop", detail: "On-board transceivers and PC-slot economics turned Ethernet from facility infrastructure into a per-desk commodity." },
  ],
  markets: [
    "3Com's lineage persists inside HPE's networking portfolio and in H3C's China market; its true monument is that the port it commercialized is simply called Ethernet everywhere.",
  ],
  analyst: [
    "For the adapter and SMB-networking categories of the late 80s and 90s, 3Com was the volume leader the evaluations assumed - the counterweight to Cisco below the enterprise core until the categories merged over it.",
  ],
};
