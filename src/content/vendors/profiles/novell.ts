// ============================================================================
// NOVELL - the network operating system. Knowledge-based, dates
// well-documented (2026-07-16): Novell Data Systems 1979 Provo; reorganized
// as Novell Inc. 1983 under Ray Noorda; NetWare (1983) + IPX/SPX own the LAN
// era; NDS 1993; USL/UnixWare bought 1993 (Unix copyrights - the later SCO
// saga's hinge), WordPerfect 1994 (~$855M stock, unwound 1996); Eric Schmidt
// CEO 1997-2001; SUSE acquired 2003; Microsoft interop pact 2006; Attachmate
// acquires Novell 2011 (~$2.2B; SUSE separated), Micro Focus acquires
// Attachmate 2014; OpenText completes Micro Focus acquisition January 31,
// 2023 - the lineage's final flag. CNE culture; the LAN era's defining firm.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const novellProfile: VendorProfile = {
  slug: "novell",
  foundings: [
    {
      company: "Novell",
      year: 1983,
      place: "Provo, Utah",
      founders: ["Ray Noorda (reorganizing Novell Data Systems, f. 1979)"],
      story:
        "Before TCP/IP won, the office network spoke IPX and logged into NetWare. Ray Noorda took over a struggling Utah hardware startup in 1983, threw away the hardware, and bet on software that made a PC into a file server - and NetWare became the operating system of the LAN era itself, at its peak running the majority of the world's office networks. Noorda coined 'coopetition,' funded half the industry's plumbing, and built a certification culture - the CNE - that trained a generation of network engineers, this site's author's era included.",
    },
  ],
  timeline: [
    { year: 1983, title: "NetWare ships", detail: "Noorda's reorganized Novell releases the network operating system: file and print services over IPX/SPX that turn PC islands into offices - the product the LAN decade runs on." },
    { year: 1993, title: "NDS, and the Unix gambit", detail: "NetWare Directory Services ships a global directory years ahead of its rivals - while Novell buys Unix System Laboratories from AT&T, acquiring the Unix copyrights whose later disposition fuels the SCO litigation saga of the 2000s." },
    { year: 1994, title: "The WordPerfect mistake", detail: "The ~$855 million WordPerfect acquisition tries to build a Microsoft-scale rival and fails at speed - sold to Corel in 1996 as NetWare's own franchise comes under Windows NT siege." },
    { year: 2003, title: "The Linux pivot: SUSE", detail: "Novell buys SUSE and Ximian, remaking itself as an enterprise-Linux company; the controversial 2006 Microsoft interoperability pact defines its final independent act." },
    { year: 2011, title: "Into the consolidators", detail: "Attachmate acquires Novell for ~$2.2 billion, separating SUSE; Micro Focus swallows Attachmate in 2014 - NetWare's descendants become maintenance-mode products in an acquirer's portfolio." },
    { year: 2023, title: "The last flag: OpenText", detail: "January 31, 2023: OpenText completes its acquisition of Micro Focus - the final corporate resting place of the lineage that once ran the world's LANs.", sourceNote: "OpenText close per the deal record." },
  ],
  products: [
    { name: "NetWare", what: "THE network operating system of the LAN era - file, print, and later directory services that defined what a server was." },
    { name: "NDS / eDirectory", what: "The directory service that beat Active Directory to market by seven years - identity's LAN-era ancestor." },
    { name: "IPX/SPX", what: "The protocol suite an entire generation configured before TCP/IP swept the field." },
  ],
  innovations: [
    { title: "The network OS category", detail: "Novell defined the server as a product category and the LAN as an administered thing - the job description of the network administrator is substantially Novell's invention." },
    { title: "Certification as an industry", detail: "The CNE program built the template - curriculum, exams, career ladder - that every vendor certification since, this site's teaching world included, descends from." },
  ],
  markets: [
    "Novell's markets were absorbed by Windows Server and TCP/IP; its directory heritage persists in niches under OpenText, and its true legacy is the certified-professional culture the whole industry now runs on.",
  ],
  analyst: [
    "The undisputed leader of the network-OS evaluations for a decade - then the textbook case of a category king losing the platform war above its category.",
  ],
};
