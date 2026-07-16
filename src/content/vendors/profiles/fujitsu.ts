// ============================================================================
// FUJITSU - Japan's computing standard-bearer. Knowledge-based, dates
// well-documented (2026-07-16): Fuji Tsushinki Seizo (Fuji Communications
// Equipment) spun from Fuji Electric June 1935 (Fuji Electric itself a 1923
// Furukawa-Siemens joint venture - the Siemens page cross-links); FACOM 100
// relay computer 1954; mainframe decades; Amdahl relationship from 1972
// (investment) to full acquisition 1997 - the IBM plug-compatible wars; ICL
// (UK) majority 1990, full 1998; FENICS network services; Fujitsu Network
// Communications (optical, North America); K computer #1 TOP500 June 2011;
// Fugaku (with RIKEN, A64FX ARM CPU) #1 June 2020-Nov 2021; Japan's largest
// IT services company; Takahito Tokita CEO since 2019 (through the
// knowledge cutoff). Networking + services + HPC in one 90-year arc.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const fujitsuProfile: VendorProfile = {
  slug: "fujitsu",
  foundings: [
    {
      company: "Fujitsu (Fuji Tsushinki Seizo)",
      year: 1935,
      place: "Kawasaki, Japan",
      founders: ["Spun from Fuji Electric (the 1923 Furukawa-Siemens venture)"],
      story:
        "Fujitsu's bloodline runs through this section's oldest company: it was spun in 1935 from Fuji Electric, itself a 1923 joint venture between Furukawa and Siemens - telephone equipment first, then, with the 1954 FACOM 100 relay computer, Japan's computing vanguard. For ninety years Fujitsu has fought at every summit: IBM-compatible mainframes through Amdahl, European scale through ICL, national infrastructure through FENICS and its optical lines, and the top of the TOP500 twice, with K and then the ARM-powered Fugaku.",
    },
  ],
  timeline: [
    { year: 1954, title: "FACOM 100", detail: "A relay-based computer built when transistors were exotic - Japan's computing industry effectively begins here, inside a telephone-equipment company." },
    { year: 1972, title: "The Amdahl alliance", detail: "Fujitsu invests in Gene Amdahl's plug-compatible venture - IBM's own 360 architect selling IBM-compatible mainframes with Fujitsu technology; full acquisition follows in 1997, the compatible wars' longest partnership." },
    { year: 1990, title: "ICL", detail: "Fujitsu takes majority control of Britain's ICL (full ownership 1998) - a Japanese giant acquiring a European national champion, remade over the decade into Fujitsu's services arm for Europe." },
    { year: 2011, title: "K: number one", detail: "June 2011: the K computer, built with RIKEN, tops the TOP500 - over 10 petaflops of SPARC64, Japan's return to the supercomputing summit." },
    { year: 2020, title: "Fugaku", detail: "June 2020: Fugaku takes #1 on ARM - Fujitsu's own A64FX processor - and holds it for four lists; the machine that proved ARM at the summit, foreshadowing the architecture's datacenter decade.", sourceNote: "TOP500 records, 2020-2021." },
    { year: 2019, title: "The services era", detail: "Takahito Tokita takes the helm of what is now Japan's largest IT services company - Uvance as the transformation banner, with the network and HPC lines continuing beneath it (leadership current through this page's knowledge cutoff)." },
  ],
  products: [
    { name: "Services and Uvance", what: "Japan's largest IT services business - consulting, integration, and managed services at national scale." },
    { name: "Fujitsu Network Communications", what: "The optical-transport line wiring carrier backbones, particularly across North America and the Pacific." },
    { name: "PRIMERGY, and the HPC line", what: "x86 servers plus the supercomputing crown jewels - SPARC64 heritage to the A64FX of Fugaku." },
  ],
  innovations: [
    { title: "The plug-compatible war", detail: "Through Amdahl, Fujitsu proved IBM's own architecture could be built better for less - competition that disciplined mainframe pricing for a generation." },
    { title: "ARM at the summit", detail: "Fugaku's A64FX made ARM a first-class HPC architecture - the proof point the hyperscale ARM wave cites." },
  ],
  markets: [
    "Fujitsu leads Japanese IT services, supplies optical networks across the Pacific rim, and remains a supercomputing first power - the Siemens-descended telephone company that became a national champion.",
  ],
  analyst: [
    "A permanent presence in the services and infrastructure evaluations of Japan and Europe - and, twice, the literal number one on the list supercomputing measures itself by.",
  ],
};
