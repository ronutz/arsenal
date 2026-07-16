// ============================================================================
// MOTOROLA - the radio century. Knowledge-based, dates well-documented
// (2026-07-16): Galvin Manufacturing founded Sept 25, 1928, Chicago (Paul V.
// Galvin + brother Joseph); "Motorola" car radio brand 1930 (motor +
// Victrola; company renamed 1947); WWII SCR-536 Handie-Talkie + SCR-300
// backpack; Apollo 11 1969 - the lunar voice/data went through Motorola
// transponders; DynaTAC: Martin Cooper's first handheld cellular call April
// 3, 1973; commercial DynaTAC 8000X 1983 ($3,995); 68000 CPU family 1979;
// Six Sigma born at Motorola 1986; StarTAC 1996; Iridium 1998 (bankrupt
// 1999); RAZR 2004; split Jan 4, 2011 into Motorola Solutions + Motorola
// Mobility; Google buys Mobility May 2012 ($12.5B, patents), sells to
// Lenovo Oct 2014 (~$2.91B). Solutions today: mission-critical public-safety
// networks and land-mobile radio - genuinely networking-adjacent.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const motorolaProfile: VendorProfile = {
  slug: "motorola",
  foundings: [
    {
      company: "Motorola (founded as Galvin Manufacturing)",
      year: 1928,
      place: "Chicago, Illinois",
      founders: ["Paul V. Galvin", "Joseph Galvin"],
      story:
        "The Galvin brothers started with battery eliminators and bet the company on putting radio in the automobile - 'Motorola,' motor plus Victrola, was the product name before it was the company. For the next eighty years Motorola put radio wherever radio had never been: on soldiers' backs, in police cars, on the Moon in 1969, and, with Martin Cooper's 1973 DynaTAC call, in the human hand. Few companies invented as many wireless firsts; few unwound as publicly.",
    },
  ],
  timeline: [
    { year: 1940, title: "The Handie-Talkie war", detail: "The SCR-536 handheld and SCR-300 backpack radios go to war with Allied infantry - portable two-way radio is born as a Motorola product line, the lineage Motorola Solutions still leads." },
    { year: 1969, title: "Voices from the Moon", detail: "Apollo 11's communications ride Motorola-built transponders - 'one small step' reaches Earth through the company's radios, the ultimate range test." },
    { year: 1973, title: "The first handheld cell call", detail: "April 3, 1973: Martin Cooper stands on a New York sidewalk and calls his rival at Bell Labs from the DynaTAC prototype; the commercial 8000X follows in 1983 at $3,995 - the handset industry begins here." },
    { year: 1979, title: "The 68000", detail: "Motorola's 68000 processor family powers the Macintosh, Amiga, Atari ST, and Sun's first workstations - the other great CPU dynasty of the personal-computing dawn." },
    { year: 1998, title: "Iridium falls to earth", detail: "The 66-satellite global phone constellation launches - engineering triumph, market miss; bankruptcy follows within a year, the era's most instructive lesson in solving yesterday's problem magnificently." },
    { year: 2011, title: "The split, Google, Lenovo", detail: "January 4, 2011: Motorola splits into Solutions (public-safety and enterprise radio) and Mobility. Google buys Mobility in May 2012 for $12.5 billion - substantially for the patent estate - and sells it to Lenovo in October 2014 for ~$2.91 billion. Solutions carries the radio century forward.", sourceNote: "Split and deal values per the public record." },
  ],
  products: [
    { name: "Land-mobile radio (APX, TETRA)", what: "The mission-critical two-way radio franchise - police, fire, and utilities worldwide, Solutions' core to this day." },
    { name: "DynaTAC to RAZR", what: "The handset dynasty: first handheld call, first flip icon, and the 2004 RAZR's design phenomenon." },
    { name: "68000 processor family", what: "The CPU line that powered a generation of workstations and beloved home computers." },
  ],
  innovations: [
    { title: "Cellular in the hand", detail: "Cooper's DynaTAC call created the handset category itself - every phone since is a footnote to a Manhattan sidewalk in 1973." },
    { title: "Six Sigma", detail: "Born at Motorola in 1986: the quality methodology that became global management orthodoxy - an invention of process, exported to every industry." },
  ],
  markets: [
    "Motorola Solutions leads mission-critical communications - land-mobile radio, public-safety networks, command-center software - while the Mobility lineage continues at Lenovo; the radio century split, both halves alive.",
  ],
  analyst: [
    "The permanent reference in two-way radio and, for the handset's first two decades, the vendor the mobile evaluations measured everyone against - until the smartphone rewrote the category away from it.",
  ],
};
