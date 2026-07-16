// ============================================================================
// IBM - the century company. Knowledge-based, dates well-documented
// (2026-07-16): CTR formed 1911 (Hollerith's Tabulating Machine Co. among the
// merged firms), renamed International Business Machines 1924 under Thomas
// Watson Sr.; System/360 announced 1964 (the ~$5B bet); antitrust era;
// IBM PC 1981 (the Microsoft/Intel decision); Gerstner turnaround from 1993
// (services pivot); PC business to Lenovo 2005; Watson/Jeopardy 2011; Red
// Hat ~$34B closed July 9, 2019 (cross-link: this section's Red Hat page);
// Kyndryl spun off 2021; Arvind Krishna CEO April 2020 (chairman 2021).
// Networking heritage: SNA, Token Ring (the Madge page's other side).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const ibmProfile: VendorProfile = {
  slug: "ibm",
  foundings: [
    {
      company: "IBM (formed as CTR)",
      year: 1911,
      place: "Endicott, New York",
      founders: ["Charles Flint (merger architect); Thomas J. Watson Sr. (builder)"],
      story:
        "IBM began as a 1911 holding-company merger - scales, time clocks, and Herman Hollerith's census tabulators - that Thomas Watson Sr. forged into International Business Machines by 1924. For most of computing's history IBM simply was the industry: the tabulating monopoly, the mainframe, the disk drive, the relational model, the PC. Every other company in this section defined itself with, against, or inside IBM's shadow - including the Token Ring war told on the Madge page, and the open-source era it finally joined by buying Red Hat.",
    },
  ],
  timeline: [
    { year: 1924, title: "Watson's THINK machine", detail: "CTR becomes IBM under Thomas Watson Sr. - punched-card tabulation as the world's data infrastructure, and a sales culture the industry would imitate for a century." },
    { year: 1964, title: "System/360: the $5 billion bet", detail: "One compatible architecture from small to large - the gamble that created the mainframe world, the software industry that ran on it, and the compatibility concept computing still lives by." },
    { year: 1981, title: "The PC, and the giveaway", detail: "The IBM PC legitimizes personal computing overnight - and its open architecture plus outsourced DOS and processor crown Microsoft and Intel, the most consequential make-versus-buy decision in business history." },
    { year: 1993, title: "Gerstner", detail: "After the largest corporate loss in American history to that date, Lou Gerstner keeps IBM whole and pivots it to services - the elephant learns to dance, and the integrated-solutions model defines its next two decades." },
    { year: 2019, title: "Red Hat: $34 billion", detail: "July 9, 2019: the largest software acquisition to that date closes - IBM buys the open-source standard-bearer for hybrid cloud, the story told from the other side on this section's Red Hat page. Arvind Krishna, the deal's architect, becomes CEO in 2020." },
    { year: 2021, title: "Kyndryl, and the focused IBM", detail: "The managed-infrastructure business spins off as Kyndryl; what remains is hybrid cloud, AI (watsonx), quantum, and the eternal mainframe - the z-series still clearing the world's transactions." },
  ],
  products: [
    { name: "IBM Z and Power", what: "The mainframe and enterprise-systems lineage - System/360's direct descendants, still running the banks." },
    { name: "Red Hat and hybrid cloud", what: "OpenShift and RHEL as the hybrid-cloud platform - the 2019 bet as the current strategy's core." },
    { name: "watsonx and quantum", what: "The AI platform and the quantum program - the research company IBM never stopped being." },
  ],
  innovations: [
    { title: "Compatibility itself", detail: "System/360 invented the idea that software outlives hardware generations - the covenant the entire industry now operates under." },
    { title: "The research engine", detail: "The relational model, DRAM, the disk drive, RISC, FORTRAN, SQL: IBM Research invented more of this industry's foundations than any institution except Bell Labs." },
  ],
  markets: [
    "IBM sells hybrid cloud, AI, and enterprise systems to the world's largest institutions - a focused century-company whose networking past (SNA, Token Ring) and open-source present (Red Hat) both thread through this section.",
  ],
  analyst: [
    "The company the analyst industry was practically invented to cover - a fixture of every enterprise evaluation for as long as evaluations have existed.",
  ],
};
