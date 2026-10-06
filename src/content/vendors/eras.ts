// ============================================================================
// src/content/vendors/eras.ts
// ----------------------------------------------------------------------------
// THE ERAS OF THE INDUSTRY TIMELINE (E13 of Round 1, SCOUT; adopted 2026-10-06).
//
// SCOUT asked for an era navigator over the chronology, with "editorial labels
// to be researched, not adopted blindly from the reviewer's examples". The
// labels here are written from the site's OWN milestones (src/content/
// milestones/milestones.ts), each of which cites its primary source: an era
// opens at a milestone and is named for what that milestone changed, so the
// boundaries are sourced facts rather than round decades. The anchors are the
// milestone slugs; the navigator links each era to them on /industry/milestones
// and the reader can check the date and the source for every boundary.
//
// WHAT AN ERA FILTERS. A company sits in the era its story starts in
// (partners.ts storyStart: storyBegins.year when set, else founded), which is
// the year the timeline already orders by, so the navigator and the gutter
// agree. The ranges are closed on both ends and contiguous, and the guard in
// scripts/check-eras.mjs fails the build if they overlap, leave a gap, or
// anchor on a milestone that does not exist.
//
// COPY LIVES IN MESSAGES (industry.eras.<key>.title and .lede, both authored
// locales); this file carries structure and the anchors only.
// ============================================================================

/** One era: a closed year range and the milestones that open and define it. */
export interface IndustryEra {
  key: string;
  /** First year of the era, inclusive. */
  from: number;
  /** Last year of the era, inclusive; the open-ended last era uses the current year. */
  to: number;
  /** Milestone slugs (milestones.ts) the era is named from, the opening one first. */
  anchors: readonly string[];
}

/** The current year, so the last era needs no editing in January. */
const THIS_YEAR = new Date().getUTCFullYear();

/** The seven eras, in order. */
export const INDUSTRY_ERAS: readonly IndustryEra[] = [
  // Everything before the first ARPANET link: the telegraph, the telephone, the transistor, the integrated
  // circuit and the modem; the companies founded here (Nokia, Siemens, Bell Labs, IBM) predate networking.
  { key: "before-the-network", from: 1800, to: 1968, anchors: ["integrated-circuit", "first-modem", "moores-law"] },
  // From the first ARPANET links (1969) to the day the ARPANET switched to TCP/IP (1 January 1983): the packet,
  // Ethernet, the TCP paper, DNS.
  { key: "the-packet-and-the-wire", from: 1969, to: 1983, anchors: ["arpanet", "ethernet-memo", "tcp-paper", "tcpip-flag-day"] },
  // The router and switch companies: spanning tree (1985), SNMP (1988), the Ethernet switch (1990); in Brazil the
  // market reserve (1984) decides who gets to build.
  { key: "routers-switches-and-the-reserve", from: 1984, to: 1990, anchors: ["spanning-tree", "snmp", "ethernet-switch", "market-reserve"] },
  // The web made public and the first commercial firewall, both 1991; LDAP; the open signatures of 1998.
  { key: "the-web-and-the-firewall", from: 1991, to: 1999, anchors: ["world-wide-web", "first-commercial-firewall", "ldap", "open-signatures"] },
  // From the February 2000 denial of service to the smartphone (2007), through utility computing (2006).
  { key: "the-flood-and-the-rental", from: 2000, to: 2007, anchors: ["february-2000-ddos", "utility-computing", "the-smartphone"] },
  // Software takes the network: control separated from forwarding (2008), Stuxnet (2010), containers (2013),
  // free certificates (2015).
  { key: "software-takes-the-network", from: 2008, to: 2015, anchors: ["separating-control-and-forwarding", "stuxnet", "container-packaging", "free-certificates"] },
  // Mirai (2016) to the conversational models (2022) and today: the platform companies.
  { key: "platforms-and-the-things", from: 2016, to: THIS_YEAR, anchors: ["mirai", "conversational-models"] },
] as const;

/** The era a story year falls in, or undefined for a year outside every range. */
export function eraOfYear(year: number): IndustryEra | undefined {
  return INDUSTRY_ERAS.find((e) => year >= e.from && year <= e.to);
}
