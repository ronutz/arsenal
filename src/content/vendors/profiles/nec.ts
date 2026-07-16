// ============================================================================
// NEC - Japan's first joint venture. Knowledge-based, dates well-documented
// (2026-07-16): Nippon Electric Company founded July 17, 1899, Tokyo, by
// Kunihiko Iwadare with Western Electric capital - Japan's FIRST joint
// venture with foreign investment; telephone equipment; NEAX digital
// switching (1970s-) worldwide; satellites/space from the 1970s; PC-8001
// 1979 -> PC-9801 1982: the PC-98 line dominates Japan's PC market (majority
// share into the mid-90s, a parallel PC universe); Koji Kobayashi's "C&C"
// (Computers & Communications) vision, INTELCOM 1977; world's largest
// semiconductor maker late 1980s (NEC Electronics -> Renesas merger 2010);
// SX vector supercomputers -> Earth Simulator #1 2002-2004; submarine cable
// systems (one of the global big three); today: NeoFace biometrics, 5G
// open-RAN, digital government. Takayuki Morita CEO since 2021 (through
// the knowledge cutoff).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const necProfile: VendorProfile = {
  slug: "nec",
  foundings: [
    {
      company: "NEC (Nippon Electric Company)",
      year: 1899,
      place: "Tokyo, Japan",
      founders: ["Kunihiko Iwadare (with Western Electric capital)"],
      story:
        "NEC was Japan's first joint venture with foreign capital: Kunihiko Iwadare partnered with Western Electric in 1899 to build telephone equipment, and the company grew into the country's communications backbone - and then some. NEAX exchanges switched calls on every continent, its satellites and submarine cables carried them between continents, its PC-98 computers were Japan's PC market for fifteen years, and Koji Kobayashi's 1977 'C&C' - Computers and Communications, converging - named the future this entire industry became.",
    },
  ],
  timeline: [
    { year: 1899, title: "The first joint venture", detail: "July 17, 1899: Iwadare and Western Electric found Nippon Electric - foreign capital, Japanese enterprise, telephone equipment - a founding structure as historic as the products." },
    { year: 1977, title: "C&C", detail: "Chairman Koji Kobayashi articulates Computers and Communications as one converging destiny at INTELCOM 77 - the clearest early statement of the convergence that defines this site's whole subject." },
    { year: 1982, title: "PC-98: a parallel universe", detail: "The PC-9801 begins the line that owns Japan's personal-computer market - majority share for over a decade, its own software ecosystem, a PC world that ran parallel to the IBM-compatible one until Windows unified them." },
    { year: 1988, title: "Semiconductor summit", detail: "NEC reigns as the world's largest chipmaker in the late 1980s - the peak of Japan's semiconductor era; the lineage later merges into Renesas (2010) as the industry reorders." },
    { year: 2002, title: "Earth Simulator", detail: "NEC's SX vector architecture powers the Earth Simulator to #1 on the TOP500 - by a stunning margin - holding the crown from 2002 to 2004 and jolting a generation of HPC policy.", sourceNote: "TOP500 records, 2002-2004." },
    { year: 2021, title: "Biometrics, cables, open RAN", detail: "Under Takayuki Morita (CEO since 2021, current through this page's knowledge cutoff), NEC leads in face recognition (NeoFace's benchmark record), remains one of the world's big three submarine-cable builders, and pushes open-RAN 5G - the C&C vision, a half-century on." },
  ],
  products: [
    { name: "NEAX switching, and submarine systems", what: "The exchanges that switched the world's calls, and the cable systems - one of three global suppliers - that carry them under the oceans." },
    { name: "PC-98 series", what: "Japan's dominant PC platform for fifteen years - a complete parallel ecosystem of hardware and software." },
    { name: "NeoFace and digital government", what: "The biometrics line that tops accuracy benchmarks, anchoring NEC's public-infrastructure business today." },
  ],
  innovations: [
    { title: "Naming convergence", detail: "Kobayashi's C&C put computers and communications on one road map in 1977 - the thesis networking spent the next half-century proving." },
    { title: "Vector supercomputing's last crown", detail: "The Earth Simulator's dominance was the vector architecture's finest hour - and the wake-up call that reshaped American HPC investment." },
  ],
  markets: [
    "NEC serves carriers, governments, and enterprises worldwide - submarine cables, biometrics, 5G, and Japan's digital infrastructure - the 1899 joint venture still building the connective tissue.",
  ],
  analyst: [
    "A fixture of the switching, cable, and now biometrics evaluations for decades - and the company whose founding vision statement the whole converged industry ended up living inside.",
  ],
};
