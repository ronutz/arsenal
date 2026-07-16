// ============================================================================
// RAND CORPORATION - where packet switching was imagined. Knowledge-based,
// dates well-documented (2026-07-16): Project RAND under Douglas Aircraft
// 1946 (first report: satellite feasibility, May 1946); independent
// nonprofit May 14, 1948, Santa Monica. JOHNNIAC 1953; systems analysis;
// game theory (the prisoner's dilemma formalized at RAND, 1950; Nash a
// summer consultant); Dantzig's linear programming; the Delphi method; the
// RAND tablet 1964; JOSS time-sharing 1963; Newell-Shaw-Simon early AI.
// Paul Baran joins 1959; the eleven-volume "On Distributed Communications"
// series published August 1964 - distributed networks, message blocks,
// hot-potato routing, the survivability argument AT&T dismissed. Donald
// Davies (NPL) reached packet switching independently and named it; the
// ARPANET's designers drew on both. RAND remains an active policy institute.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const randProfile: VendorProfile = {
  slug: "rand",
  foundings: [
    {
      company: "RAND Corporation",
      year: 1948,
      place: "Santa Monica, California",
      founders: ["Spun from Project RAND (Douglas Aircraft / US Air Force, 1946)"],
      story:
        "Project RAND began in 1946 inside Douglas Aircraft to keep wartime operations research alive - its very first report studied the feasibility of an artificial satellite, eleven years before Sputnik. Incorporated as an independent nonprofit in May 1948, RAND became the archetype of the think tank: mathematicians, economists, and engineers paid to think decades ahead. One of them, an engineer named Paul Baran, spent the early 1960s asking how a communications network could survive losing most of itself - and answered with the idea the internet is made of.",
    },
  ],
  timeline: [
    { year: 1950, title: "Game theory's workshop", detail: "Flood and Dresher formalize the exercise Tucker soon names the prisoner's dilemma; Nash consults over the summers; Dantzig's linear programming matures here - RAND builds the mathematical toolkit postwar decision-making runs on." },
    { year: 1953, title: "JOHNNIAC", detail: "RAND builds its own von Neumann-architecture computer and names it for him - one of the machines on which systems analysis, early AI experiments (Newell, Shaw, and Simon's work), and the JOSS time-sharing system are hammered out." },
    { year: 1964, title: "On Distributed Communications", detail: "August 1964: Baran's eleven-volume series lays it out - break messages into blocks, route each independently through a redundant mesh, let nodes forward 'hot potato' style, and the network survives damage that kills any centralized design. AT&T reviewed the idea and declined to build it.", sourceNote: "RAND memoranda RM-3420-PR and companions, publicly available from RAND." },
    { year: 1965, title: "Two inventors, one idea", detail: "Donald Davies at the UK's National Physical Laboratory reaches the same design independently and gives it the name that sticks: packet switching. The ARPANET's planners draw on both lineages - the rare invention with two honest parents." },
    { year: 1969, title: "Into the ARPANET", detail: "The first ARPANET nodes light up carrying the design philosophy Baran's reports argued for: no center to kill, intelligence at the edges, packets finding their own way - the argument this site's routing tools still assume." },
    { year: 2020, title: "Still thinking ahead", detail: "RAND continues as a policy research institution - defense, health, education - its networking chapter closed but canonical: the conceptual root of everything these pages measure." },
  ],
  products: [
    { name: "On Distributed Communications (1964)", what: "The report series that specified survivable, message-block, store-and-forward networking - packet switching's American birth certificate." },
    { name: "JOHNNIAC and JOSS", what: "RAND's own computer and its pioneering time-sharing system - the workbench of early systems analysis and AI." },
    { name: "The Delphi method and systems analysis", what: "Decision-making machinery exported to governments and industries worldwide - RAND's other lasting products are methods." },
  ],
  innovations: [
    { title: "Packet switching, argued from survivability", detail: "Baran did not optimize for efficiency; he optimized for surviving attack - and the resulting architecture (distributed, redundant, edge-intelligent) proved superior for everything else too." },
    { title: "The think tank itself", detail: "RAND invented the institutional form: interdisciplinary, long-horizon, publicly published - the reason an aerospace-funded nonprofit could seed the internet's core idea." },
  ],
  markets: [
    "RAND never sold networking products - its market is ideas, and this one shipped everywhere: every router, every datagram, every mesh on these pages implements a 1964 memorandum.",
  ],
  analyst: [
    "Included among the pioneers on merit no vendor matches: the deepest ancestor. When this site's tools reason about paths, routes, and resilience, they are speaking Baran's language.",
  ],
};
