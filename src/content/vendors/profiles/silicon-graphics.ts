// ============================================================================
// SILICON GRAPHICS - the geometry of Hollywood. Knowledge-based, dates
// well-documented (2026-07-16): founded 1982 by Jim Clark (Stanford; the
// Geometry Engine) with Abbey Silverstone and others; IRIS workstations;
// MIPS acquired 1992; Jurassic Park 1993 makes the brand a movie star; Clark
// leaves 1994 to co-found Netscape; Cray Research acquired 1996 (sold 2000);
// OpenGL (1992) opens the IRIS GL heritage; decline through the 2000s,
// Chapter 11 in 2006 and again 2009, assets to Rackable Systems (renamed
// SGI); Hewlett Packard Enterprise acquires SGI for ~$275M, completed
// November 2016. Legacy: OpenGL, the graphics-pipeline model itself.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const siliconGraphicsProfile: VendorProfile = {
  slug: "silicon-graphics",
  foundings: [
    {
      company: "Silicon Graphics (SGI)",
      year: 1982,
      place: "Mountain View, California",
      founders: ["Jim Clark"],
      story:
        "Jim Clark left Stanford with the Geometry Engine - hardware that did the mathematics of 3D perspective at silicon speed - and founded Silicon Graphics to sell computers that could see. Through the 1980s and 1990s SGI's machines were the exotic sports cars of computing: IRIX on MIPS, purple cases, and price tags to match, rendering everything from fighter-jet simulators to the dinosaurs of Jurassic Park. Clark himself left in 1994 to co-found Netscape; the company he built taught the industry graphics, then watched commodity PCs learn the lesson too well.",
    },
  ],
  timeline: [
    { year: 1982, title: "The Geometry Engine", detail: "Clark's Stanford work becomes a company: dedicated silicon for 3D transformation, the ancestor of every GPU pipeline since." },
    { year: 1992, title: "MIPS, and OpenGL", detail: "SGI acquires MIPS Computer Systems to own its processor line - and opens its IRIS GL heritage as OpenGL, the cross-platform graphics API that outlives everything else in this story." },
    { year: 1993, title: "Hollywood's computer", detail: "Jurassic Park's dinosaurs render on SGI machines and the brand becomes shorthand for movie magic - Industrial Light & Magic, and later the effects industry entire, standardize on the purple boxes." },
    { year: 1996, title: "Buying Cray", detail: "SGI acquires Cray Research, briefly uniting Hollywood graphics with supercomputing royalty; the fit never quite works and Cray is sold on in 2000." },
    { year: 2006, title: "The long fall", detail: "Commodity PCs with consumer GPUs - running OpenGL, SGI's own gift - have eaten the workstation market; Chapter 11 arrives in 2006 and again in 2009, when Rackable Systems buys the assets and takes the name." },
    { year: 2016, title: "The name lands at HPE", detail: "Hewlett Packard Enterprise completes the ~$275 million acquisition of SGI in November 2016, folding its high-performance computing line into HPE's - the final flag over a storied name.", sourceNote: "HPE announcement/close per the deal record." },
  ],
  products: [
    { name: "IRIS and Onyx workstations", what: "The graphics supercomputers of the film, science, and defense worlds - IRIX on MIPS at the high-water mark of proprietary Unix." },
    { name: "OpenGL", what: "The open graphics API distilled from IRIS GL in 1992 - SGI's most durable product, and it was free." },
    { name: "Origin and Altix servers", what: "The NUMA high-performance computing line whose lineage HPE acquired." },
  ],
  innovations: [
    { title: "The hardware graphics pipeline", detail: "The Geometry Engine's transform-and-render model is the conceptual ancestor of the modern GPU - the architecture NVIDIA and the games industry industrialized." },
    { title: "Opening the crown jewels", detail: "OpenGL standardized 3D graphics across the industry - and, in perfect tragedy, armed the commodity hardware that unmade SGI's business." },
  ],
  markets: [
    "SGI survives as an HPE product heritage and as an aesthetic memory; its real market share lives on in every GPU pipeline and every OpenGL descendant running today.",
  ],
  analyst: [
    "The definitive vendor of the visualization-workstation category for as long as the category existed - a textbook case, studied ever since, of a pioneer commoditized by its own standard.",
  ],
};
