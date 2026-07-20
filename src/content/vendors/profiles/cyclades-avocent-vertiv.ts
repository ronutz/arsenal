// ============================================================================
// CYCLADES -> AVOCENT -> VERTIV - out-of-band and the physical layer of
// uptime, with a Brazilian founding story. Founding facts verified 2026-07-19
// against pt.wikipedia.org/wiki/Cyclades: Cyclades founded 1988 in Sao Paulo
// (a Vila Olimpia garage, ~US$6k initial capital; the idea sparked that year
// at the Wells lanchonete on Rua Augusta) by Joao "John" Lima and Daniel
// Dalarossa, later relocating to Fremont, California. Linux-embracing console
// servers (TS/ACS, AlterPath) define
// out-of-band management. The name invites the honorable disambiguation to
// Louis Pouzin's CYCLADES research network (France, 1970s) - the datagram
// pioneer whose ideas Cerf credits in TCP/IP's ancestry. Avocent (formed
// 2000 from the Apex + Cybex KVM merger) acquires Cyclades 2006 (~$90M);
// Emerson Electric acquires Avocent 2009 (~$1.2B) into Emerson Network
// Power (whose other great root is Liebert, 1965, precision cooling/UPS);
// Emerson Network Power sold to Platinum Equity 2016 (~$4B) and renamed
// VERTIV; public 2020. The stack that keeps the racks alive.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const cycladesAvocentVertivProfile: VendorProfile = {
  slug: "cyclades-avocent-vertiv",
  foundings: [
    {
      company: "Cyclades Corporation",
      year: 1988,
      place: "São Paulo, Brazil",
      founders: ["João \"John\" Lima", "Daniel Dalarossa"],
      story:
        "Cyclades began in 1988 in a Vila Olímpia garage in São Paulo - the idea sparked that year over a table at the Wells lanchonete on Rua Augusta - founded by João \"John\" Lima and Daniel Dalarossa on roughly six thousand dollars of initial capital. It later relocated to Fremont, California, but the founding was Brazilian, and so was the instinct: build the discipline of reaching equipment when the network is down - serial console servers, out-of-band paths, remote power, the last-resort plane every operator prays they configured. An early and vocal Linux adopter (its console servers ran and championed open source), Cyclades became the name on the RJ-45-to-serial adapters in a generation of data-center crash carts - and a quiet landmark of the Brazilian technology diaspora.",
      sourceNote: "Founding year, São Paulo origin, and founder names per pt.wikipedia.org/wiki/Cyclades.",
    },
    {
      company: "Liebert (Vertiv's physical-layer root)",
      year: 1965,
      place: "Columbus, Ohio",
      founders: ["Ralph Liebert"],
      story:
        "Ralph Liebert built the first precision air conditioning made for computer rooms - the recognition that machines need their own weather. Liebert's cooling and UPS lines, acquired by Emerson in 1987, became the backbone of Emerson Network Power: the other half of the story that ends in Vertiv, where the console server and the CRAC unit share a badge - management and environment, the two halves of physical uptime.",
    },
  ],
  timeline: [
    { year: 1994, title: "The console-server category", detail: "Cyclades' terminal and console servers turn 'drive to the site with a laptop and a cable' into a network service - out-of-band access as a designed layer, not an emergency improvisation." },
    { year: 2000, title: "Avocent forms", detail: "Apex and Cybex - the two KVM-switch leaders - merge as Avocent: keyboard, video, and mouse over distance, the other remote-hands technology of the era." },
    { year: 2006, title: "Cyclades joins Avocent", detail: "Avocent acquires Cyclades (~$90 million): serial consoles and KVM under one roof - the complete out-of-band toolkit, Linux heritage included.", sourceNote: "Deal figure per the public record." },
    { year: 2009, title: "Into Emerson Network Power", detail: "Emerson Electric acquires Avocent (~$1.2 billion), joining it to the Liebert cooling and power lines - management plane and physical plane consolidated." },
    { year: 2016, title: "Vertiv", detail: "Emerson carves out Network Power to Platinum Equity (~$4 billion); renamed Vertiv, it goes public in 2020 - UPS, cooling, PDUs, and the Avocent/Cyclades access heritage as one company whose product is, effectively, uptime itself.", sourceNote: "Deal figures per the public record." },
    { year: 2023, title: "The AI density era", detail: "As racks climb from kilowatts toward the tens, Vertiv's problem set - power, liquid cooling, and still that serial console when everything else is dark - becomes the constraint the whole industry plans around." },
  ],
  products: [
    { name: "Cyclades TS/ACS console servers", what: "The out-of-band access line - serial consoles reachable when the production network is not." },
    { name: "Avocent KVM and DCIM", what: "Remote keyboard-video-mouse and the data-center infrastructure management layer that grew from it." },
    { name: "Liebert power and cooling", what: "Precision cooling and UPS - the environmental half of keeping the racks alive." },
  ],
  innovations: [
    { title: "Out-of-band as architecture", detail: "Cyclades made the management plane's independence a design principle: a path to the console that shares no fate with the network it manages - the discipline every runbook on these pages assumes." },
    { title: "Uptime as a product category", detail: "The Vertiv consolidation named a truth: access, power, and cooling are one problem - the physical layer of availability." },
  ],
  markets: [
    "Vertiv today is one of the defining suppliers of the AI build-out - power and cooling at unprecedented density - with the Avocent/Cyclades access lineage still in the catalog.",
  ],
  analyst: [
    "The entry with a homeland note: a Brazilian-founded company at the root of the out-of-band discipline - and, one honorable name-twin away, Pouzin's CYCLADES network, the French datagram pioneer TCP/IP's authors credit. Two lineages, one name, both worth knowing.",
  ],
};
