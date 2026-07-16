// ============================================================================
// BELL LABS -> LUCENT -> ALCATEL(-LUCENT) - the transistor's bloodline.
// Knowledge-based, dates well-documented (2026-07-16): Bell Telephone
// Laboratories founded Jan 1, 1925 (AT&T + Western Electric R&D); the
// transistor Dec 1947 (Bardeen/Brattain/Shockley, Nobel 1956); Shannon's
// information theory 1948; the photovoltaic cell 1954; the laser groundwork
// 1958; the CCD 1969 (Nobel 2009); Unix 1969 and C ~1972; the cellular
// concept 1947 -> AMPS commercial 1983; the CMB discovery 1964 (Nobel 1978);
// ten Nobel Prizes per Nokia Bell Labs' own count. AT&T trivestiture: Lucent
// IPO Apr 1996 (largest US IPO then), spin complete Sep 1996; bubble peak
// Dec 1999, crash to under a dollar by 2002; Avaya (2000) and Agere (2001)
// spun off. Alcatel: CGE 1898; the Alcatel acronym (Societe Alsacienne...);
// ITT telecom acquired 1986-87 -> world #2. Merger announced Apr 2, 2006,
// completed Nov 30, 2006 (~EUR 10.6B). Nokia acquires Alcatel-Lucent
// (announced Apr 2015, completed Jan 2016, ~EUR 15.6B); Bell Labs continues
// as Nokia Bell Labs. Cross-links the live Nokia profile.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const bellLabsLucentAlcatelProfile: VendorProfile = {
  slug: "bell-labs-lucent-alcatel",
  foundings: [
    {
      company: "Bell Telephone Laboratories",
      year: 1925,
      place: "New York City (later Murray Hill, New Jersey)",
      founders: ["AT&T and Western Electric (consolidated R&D)"],
      story:
        "AT&T folded its engineering departments into a single laboratory on January 1, 1925, and accidentally built the most consequential research institution the industry has ever had. The transistor (1947), information theory (1948), the photovoltaic cell (1954), the laser's theoretical groundwork (1958), the CCD (1969), Unix and C, the cellular concept - work done in its halls has earned ten Nobel Prizes (per Nokia Bell Labs' own tally, which includes the 2018 prize), and there is essentially no device on this site's subject matter that does not descend from something invented there.",
    },
    {
      company: "Compagnie Générale d'Électricité (Alcatel's root)",
      year: 1898,
      place: "Paris, France",
      founders: ["Pierre Azaria"],
      story:
        "The French electrical conglomerate that would, generations later, lend the industry the name Alcatel - an acronym inherited from a subsidiary, the Société Alsacienne de Constructions Atomiques, de Télécommunications et d'Électronique. When CGE's telecom arm absorbed ITT's European telephone empire in 1986-87, Alcatel became the world's second-largest telecom equipment maker overnight - the European counterweight to the Bell System's industrial descendants.",
    },
  ],
  timeline: [
    { year: 1947, title: "The transistor", detail: "December 1947, Murray Hill: Bardeen, Brattain, and Shockley demonstrate the point-contact transistor. Every processor, switch, and radio since is a descendant. Nobel Prize, 1956 - and Shockley's later startup seeds Silicon Valley itself." },
    { year: 1948, title: "Information theory", detail: "Claude Shannon publishes A Mathematical Theory of Communication in the Bell System Technical Journal - bits, channel capacity, coding: the mathematics under every link budget, every modem, every compression scheme." },
    { year: 1969, title: "Unix, C, and the CCD", detail: "Thompson and Ritchie start Unix on a spare PDP-7; Ritchie's C follows in the early 1970s; the same year Boyle and Smith invent the charge-coupled device. Operating systems, the language of systems programming, and digital imaging - one lab, one year." },
    { year: 1983, title: "Cellular goes commercial", detail: "The cellular concept sketched in a 1947 Bell Labs memo becomes AMPS, commercially launched in 1983 - the architecture of frequency reuse and handoff that every mobile generation since refines." },
    { year: 1996, title: "Lucent Technologies", detail: "AT&T's trivestiture spins its equipment business - Western Electric's heritage plus Bell Labs - into Lucent. The April 1996 IPO is the largest in US history to that point; by December 1999 Lucent is among the most valuable companies on earth.", sourceNote: "IPO scale and peak per the public record." },
    { year: 2002, title: "The fall", detail: "The telecom bubble bursts and Lucent falls harder than almost anyone: revenue collapses, accounting troubles surface, headcount drops from over 150,000 toward 30,000, and the stock touches under a dollar - after spinning off Avaya (2000) and Agere (2001) on the way down." },
    { year: 2006, title: "Alcatel-Lucent", detail: "Announced April 2, completed November 30, 2006: the roughly EUR 10.6 billion transatlantic merger joins the Bell System's heir to Europe's champion - a marriage of two proud engineering cultures that never quite made money together.", sourceNote: "Deal figures per the public record." },
    { year: 2016, title: "Into Nokia", detail: "Nokia completes its ~EUR 15.6 billion acquisition of Alcatel-Lucent in January 2016. Bell Labs continues as Nokia Bell Labs, still in Murray Hill - the bloodline that began in 1925 now flowing through Espoo." },
  ],
  products: [
    { name: "The transistor and its descendants", what: "The point-contact and junction transistors - the founding artifacts of the semiconductor age." },
    { name: "Unix and C", what: "The operating system and language that became the substrate of servers, network devices, and every BSD/Linux descendant this site's tools run against." },
    { name: "5ESS", what: "The 1982 digital switch that carried a substantial share of the world's calls for decades - Western Electric/Lucent's flagship of the circuit-switched era." },
    { name: "Alcatel's optical and DSL lines", what: "Submarine systems, SDH/DWDM transport, and the DSLAM lines that wired much of the world's broadband first mile." },
  ],
  innovations: [
    { title: "The research laboratory as an institution", detail: "Bell Labs proved that a corporation could run open-ended fundamental research at scale and harvest it for a century - the model every corporate lab since has imitated and none has matched." },
    { title: "Information theory", detail: "Shannon gave the industry its physics: capacity, entropy, coding. Every 'how fast can this link go' answer on this site is downstream of one 1948 paper." },
  ],
  markets: [
    "The lineage persists inside Nokia: Nokia Bell Labs continues fundamental research, and the merged portfolio - fixed, mobile, optical, submarine - competes across every carrier network on earth.",
  ],
  analyst: [
    "No entry on these pages carries more weight per paragraph: the transistor, information theory, Unix, the laser, cellular - subtract Bell Labs and the industry this site teaches simply does not exist.",
    "The corporate afterlife is its own lesson: peerless research, three owners, one bubble, and the hard truth that inventing the future and capturing its value are different skills.",
  ],
};
