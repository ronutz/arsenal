// ============================================================================
// UNISYS - computing's oldest bloodlines. Knowledge-based, dates
// well-documented (2026-07-16): formed Nov 1986 by Burroughs's ~$4.8B
// acquisition of Sperry (name from an employee contest - United Information
// Systems). Trunk 1: Burroughs, founded 1886 by William Seward Burroughs
// (adding machines) - large-systems architecture (B5000 1961: stack machine,
// ALGOL, virtual memory concepts). Trunk 2: Sperry -> UNIVAC: Eckert-Mauchly
// Computer Corp (ENIAC's engineers) -> Remington Rand 1950 -> UNIVAC I 1951
// (first US commercial computer; CBS 1952 election call) -> Sperry Rand
// 1955. Post-merger: mainframes -> ClearPath (both architectures on common
// hardware), services pivot, 2200/A-Series heritage still running.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const unisysProfile: VendorProfile = {
  slug: "unisys",
  foundings: [
    {
      company: "Unisys (Burroughs + Sperry merger)",
      year: 1986,
      place: "Blue Bell, Pennsylvania",
      founders: ["W. Michael Blumenthal (merger architect); lineages of W.S. Burroughs, and Eckert & Mauchly"],
      story:
        "Unisys is where computing's two oldest commercial bloodlines converge. One trunk begins in 1886 with William Seward Burroughs's adding machine - office calculation as an industry - and grows into the audacious B5000 of 1961, a stack-architecture, ALGOL-native machine decades ahead of fashion. The other runs through ENIAC itself: J. Presper Eckert and John Mauchly's company built UNIVAC I, America's first commercial computer, which famously called the 1952 election for Eisenhower on CBS while the pollsters said otherwise. Burroughs's 1986 acquisition of Sperry - the name came from an employee contest - fused the trunks into Unisys.",
    },
  ],
  timeline: [
    { year: 1886, title: "The adding machine", detail: "William Seward Burroughs patents his printing adding machine in St. Louis - the oldest corporate bloodline on any page of this section, a century before the merger that carries it forward." },
    { year: 1951, title: "UNIVAC I", detail: "Eckert and Mauchly's machine, delivered to the Census Bureau under Remington Rand, is the first commercial computer built in the United States - and in 1952 it predicts Eisenhower's landslide on live television when humans would not believe it." },
    { year: 1961, title: "The B5000 heresy", detail: "Burroughs ships a stack machine designed for ALGOL with descriptor-based memory protection - ideas the industry spends the next three decades rediscovering; its descendants still run in ClearPath MCP." },
    { year: 1986, title: "The merger", detail: "Burroughs completes the roughly $4.8 billion acquisition of Sperry; 'Unisys' emerges from an employee naming contest - briefly the industry's second-largest computer company, squarely in IBM's shadow." },
    { year: 1996, title: "ClearPath: two architectures, one line", detail: "The 2200 (Sperry) and A-Series/MCP (Burroughs) heritages converge on common hardware as ClearPath - a masterclass in carrying irreplaceable installed bases forward, eventually onto x86." },
    { year: 2020, title: "The services company", detail: "Decades of pivoting complete: Unisys today is digital-workplace, cloud, and enterprise-computing services, with ClearPath Forward still faithfully running the airline, banking, and government workloads that never got to fail." },
  ],
  products: [
    { name: "ClearPath Forward", what: "The continuation of both mainframe bloodlines - MCP and OS 2200 - on modern fabric, still in production where downtime is unthinkable." },
    { name: "UNIVAC heritage systems", what: "The 1100/2200 line: five decades of compatible evolution from vacuum tubes to virtual machines." },
    { name: "Digital workplace and cloud services", what: "The modern revenue core: service desks, cloud migration, and enterprise security services." },
  ],
  innovations: [
    { title: "The commercial computer itself", detail: "UNIVAC I created the market - the idea that a business, not a laboratory, would buy a computer starts in this bloodline." },
    { title: "Architecture ahead of its century", detail: "The B5000's stack discipline, hardware typing, and virtual-memory thinking prefigured half of modern systems design - heresy in 1961, orthodoxy now." },
  ],
  markets: [
    "Unisys sells enterprise services and ClearPath continuity worldwide - a quieter company whose two bloodlines, 1886 and ENIAC, make it the deepest lineage in this entire section.",
  ],
  analyst: [
    "For decades the perennial number two the mainframe evaluations set against IBM; today assessed as a focused services firm with a uniquely irreplaceable installed base.",
  ],
};
