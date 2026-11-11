// ============================================================================
// BANYAN SYSTEMS - the directory pioneer. Knowledge-based, dates
// well-documented (2026-07-16): founded 1983, Westborough MA, by David
// Mahoney and ex-Data General engineers (a DG bloodline - cross-link);
// VINES (VIrtual NEtworking System) on a Unix System V base; **StreetTalk**
// global directory/naming service - true enterprise-wide directory YEARS
// before Novell NDS (1993) or Microsoft Active Directory (2000); flagship
// customer: the U.S. Marine Corps; strong federal/large-enterprise niche;
// loses the NOS war to NetWare's channel and NT's bundling through the
// 1990s; pivots (Switchboard web directory), renamed ePresence 2001,
// wound down ~2004. The idea won everywhere; the company did not.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const banyanProfile: VendorProfile = {
  slug: "banyan",
  foundings: [
    {
      company: "Banyan Systems",
      year: 1983,
      place: "Westborough, Massachusetts",
      founders: ["David Mahoney (with ex-Data General engineers)"],
      story:
        "Banyan - founded by Data General alumni, another branch of that bloodline - solved enterprise networking's hardest problem first. StreetTalk, the naming and directory service inside VINES, gave every user, printer, and service one global name across an entire worldwide network: log in anywhere, find anything, a decade before the industry caught up. The United States Marine Corps ran on it. Being architecturally right in 1985 was not enough against NetWare's channel machine and Windows NT's bundling - the company faded; the directory idea now runs every enterprise on earth.",
    },
  ],
  timeline: [
    { year: 1984, title: "VINES ships", detail: "A network operating system built on Unix System V - routing, services, and administration designed for MANY networks joined together, when rivals still thought in single LANs." },
    { year: 1985, title: "StreetTalk", detail: "The global directory arrives: three-part names (item@group@organization) resolvable from anywhere on the internetwork - authentication, location, and administration unified years before NDS or Active Directory existed." },
    { year: 1991, title: "The Marine Corps standard", detail: "Banyan's federal beachhead peaks: the U.S. Marine Corps and other agencies standardize on VINES for exactly what StreetTalk does best - one directory across a scattered world." },
    { year: 1994, title: "Losing the platform war", detail: "NetWare's reseller army and then Windows NT's bundling squeeze VINES from both sides; ENS (StreetTalk for NetWare/NT) tries to sell the crown jewel cross-platform, too late to change the arithmetic." },
    { year: 1996, title: "Switchboard", detail: "Banyan takes the directory idea to the consumer web - Switchboard.com, a people-and-business finder - a prescient pivot that presages the search era without capturing it." },
    { year: 2001, title: "ePresence, and the end", detail: "Renamed ePresence Solutions, the company winds down its products and dissolves within a few years - while every enterprise on earth deploys the global directory concept Banyan shipped first." },
  ],
  products: [
    { name: "VINES", what: "The Unix-based network operating system built for internetworks of networks." },
    { name: "StreetTalk", what: "The first true enterprise-wide directory service - naming, authentication, and location as one fabric." },
    { name: "ENS", what: "Enterprise Network Services: StreetTalk offered atop NetWare and NT - the crown jewel, unbundled too late." },
  ],
  innovations: [
    { title: "The global directory", detail: "One namespace for every user and resource across an entire organization - Banyan shipped the concept Active Directory later made universal." },
    { title: "WAN-first network thinking", detail: "VINES assumed the multi-site enterprise from day one - routing and services designed for the wide area while competitors optimized the single LAN." },
  ],
  markets: [
    "Banyan's market went to Novell and then Microsoft; its architecture went everywhere - modern identity, from AD to the cloud directories this site's identity tools decode, descends from StreetTalk's premise.",
  ],
  analyst: [
    "The perennial technically-superior third in the NOS evaluations - and the industry's cleanest proof that the best directory does not beat the best distribution.",
  ],
};
