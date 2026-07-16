// ============================================================================
// BULL - Europe's computing champion. Knowledge-based, dates well-documented
// (2026-07-16): Fredrik Rosing Bull's punch-card patents 1919-21; H.W.
// Egli-Bull 1931 Paris; Compagnie des Machines Bull 1933. Gamma 3 (1952,
// ~1200 units); Gamma 60 (1960, pioneering multiprocessing, commercially
// heavy). 1964 crisis -> GE control (Bull-GE); 1970 -> Honeywell Bull; Plan
// Calcul 1966 creates CII; 1975 CII-Honeywell-Bull; 1982 nationalization ->
// Groupe Bull; GCOS lineage from GE (the /etc/passwd GECOS field!); Zenith
// Data Systems 1989; privatized 1994-97; HPC pivot (Tera-10 2005, bullx,
// BullSequana); Atos acquires Bull 2014 (~EUR 620M); Eviden brand 2023;
// BullSequana XH3000 powers JUPITER, Europe's first exascale system (Julich,
// inaugurated 2025).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const bullProfile: VendorProfile = {
  slug: "bull",
  foundings: [
    {
      company: "Compagnie des Machines Bull",
      year: 1931,
      place: "Paris, France",
      founders: ["Founded on Fredrik Rosing Bull's patents (H.W. Egli-Bull, 1931; renamed 1933)"],
      story:
        "Fredrik Rosing Bull was a Norwegian engineer who patented punch-card tabulating machines for an insurance company between 1919 and 1921 - and died young in 1925. His patents crossed Europe to Paris, where the company bearing his name became the continent's answer to IBM: the punch-card wars of the 1930s-50s, fought card format against card format, were Bull's founding battles. For ninety years since, Bull has been the case study in what a national computing champion is - through crises, foreign owners, nationalization, privatization, and a final act as Europe's supercomputer builder.",
    },
  ],
  timeline: [
    { year: 1952, title: "Gamma 3", detail: "Bull's electronic calculator ships and sells on a scale rare for 1950s Europe - roughly 1,200 units - proving a European maker could productize electronics against IBM's tide." },
    { year: 1960, title: "Gamma 60", detail: "Wildly ambitious: one of the first computers designed for genuine multiprocessing and parallel program units - architecturally prophetic, commercially punishing, and a lesson in being a decade early." },
    { year: 1966, title: "Plan Calcul", detail: "France answers American dominance (and a blocked supercomputer export) with a national program - creating CII as a champion alongside the GE-controlled Bull; the 1975 merger into CII-Honeywell-Bull unifies the French industry under one roof." },
    { year: 1970, title: "GCOS arrives with Honeywell", detail: "GE exits computing and its line passes to Honeywell - bringing the GE-600 heritage and GECOS, the OS whose name survives, of all places, as the 'GECOS field' in every Unix /etc/passwd this site's readers have ever edited." },
    { year: 1982, title: "Groupe Bull", detail: "Nationalized under Mitterrand, Bull consolidates the French industry - mainframes (DPS lines), later Zenith Data Systems PCs (1989) - before the long privatization of 1994-97 with NEC, IBM, and Motorola as shareholders along the way." },
    { year: 2005, title: "The HPC pivot", detail: "Tera-10 for the French atomic-energy agency is Europe's most powerful system at delivery - Bull reinvents itself as the continent's supercomputer house: NovaScale, bullx, and the BullSequana line." },
    { year: 2014, title: "Into Atos - and to exascale", detail: "Atos acquires Bull (~EUR 620 million); the brand resurfaces under Eviden (2023) on BullSequana machines - including the XH3000 that powers JUPITER at Julich, inaugurated in 2025 as Europe's first exascale supercomputer. The champion's mission, completed under a new flag.", sourceNote: "Deal and JUPITER milestones per the public record." },
  ],
  products: [
    { name: "Gamma series", what: "Europe's commercially successful early electronic calculators and computers - Bull's declaration of independence." },
    { name: "GCOS mainframes (DPS lines)", what: "The Honeywell-heritage operating system and machines that ran French and European institutions for decades." },
    { name: "BullSequana supercomputers", what: "The modern line - bullx to BullSequana XH3000 - culminating in Europe's first exascale system." },
  ],
  innovations: [
    { title: "Early multiprocessing (Gamma 60)", detail: "Parallel execution units and simultaneous program streams in 1960 - the architecture textbooks cite as decades ahead of its market." },
    { title: "The national-champion playbook", detail: "Bull is the definitive case: what state backing can preserve (capability, sovereignty) and what it cannot (market timing) - a policy lesson every technology-sovereignty debate still cites." },
  ],
  markets: [
    "The lineage lives inside Atos/Eviden: European HPC, defense-grade systems, and the exascale era - the punch-card challenger of 1931 now building the continent's biggest machines.",
  ],
  analyst: [
    "Ninety years of surviving IBM, GE, Honeywell, nationalization, and privatization to end up building Europe's first exascale computer - persistence as a business model, and the /etc/passwd Easter egg is free.",
  ],
};
