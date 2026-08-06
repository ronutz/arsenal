// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Wikipedia "Category 1 cable" and "Category 2 cable": ***CAT 1 AND CAT 2
//     ARE NOT TIA/EIA STANDARDS.*** Both are "the de facto name given to Level 1
//     [and Level 2] cables originally defined by Anixter International, the
//     distributor", and "official TIA/EIA-568 standards have only been
//     established for cables of Category 3 ratings or above."
//   - Wikipedia (Anixter): before the Levels programme "customers had no idea
//     whether the cabling system they purchased could support the 10 megabits
//     per second Ethernet they were just starting to implement"
//   - Encyclopedia.com: Alan B. Anixter born Chicago 1920, University of
//     Pennsylvania 1941, WHARTON MBA 1943, then Telmor Engineering and Rhode
//     Island Insulated Wire, which William joined the same year
//   - anixter.com company history: THE BLUE BOOK written 1968, by which point
//     sales exceeded $10M with 700 employees
//   - Patch (Jan 2020): the founding loan came from their mother, ZELDA
//
// *** BODY READ AFTER DRAFTING, AND IT IS OUTSTANDING - the Levels programme,
// the vocabulary argument, the 1995 lab and its neutrality reading, Alan's
// pocket list of acquisitions, the CD&R/WESCO bidding war in full, and a
// closing comparison across all six distributors on this timeline.
//
// NOTE ON METHOD: this entry's BODY WAS WRITTEN EARLIER IN THE SAME SESSION, so
// this is NOT a clean blind run - prior knowledge of the body cannot be
// excluded. Research was still conducted independently first, and it found
// something the body does not have. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const anixterProfile: VendorProfile = {
  slug: "anixter",
  foundings: [],
  timeline: [
    {
      year: 1968,
      title: "The Blue Book",
      detail:
        "A catalogue, written when the company was turning around ten million dollars with seven hundred staff. Publishing a reference document is what a distributor does instead of advertising: the buyer keeps it on the desk, and the company that wrote it becomes the default place to ask. The Levels programme two decades later is the same instinct at a larger scale.",
    },
    {
      year: 1989,
      title: "The problem the specification was written to solve",
      detail:
        "Ethernet at ten megabits per second was arriving in buildings, and a customer buying cable had no way to establish whether what they were installing would carry it. Not a disagreement about quality - no measurement at all. The document exists because somebody had to answer that question in a sales conversation, repeatedly, and eventually wrote the answer down.",
    },
  ],
  products: [
    { name: "Structured cabling", what: "Copper and fibre for inside buildings, plus the connectors, panels and racks around it - the category the company defined the vocabulary for." },
    { name: "Security and video", what: "Surveillance, access control and the cabling behind both, sold to the integrators who install them - a natural extension for a business already selling what runs through the walls." },
    { name: "Electrical wire and cable", what: "The original business, and still large. Most of the products have no software in them at all, which is unusual on this timeline and a reminder of what the physical layer actually consists of." },
    { name: "Fasteners and Class C components", what: "Screws, clips and small parts sold on the same supply chain logic: individually trivial, collectively the reason an assembly line stops." },
  ],
  innovations: [
    {
      title: "Two of the categories were never standards at all",
      detail:
        "The vocabulary point the entry above makes is stronger than it states. The TIA adopted the Levels programme from Level 3 upward, and Categories 1 and 2 were never issued as official standards - they remain the de facto names for Anixter's Level 1 and Level 2 designations. An engineer specifying Cat 1 for a voice run is not using a standard loosely; they are using a distributor's product classification that no standards body ever ratified.",
    },
    {
      title: "Writing the reference rather than buying the advertisement",
      detail:
        "A catalogue in 1968, a performance specification in 1989, a test laboratory in 1995. Each is the same move: produce the document the market needs and become the party everyone consults. It is slower than marketing and it does not expire.",
    },
    {
      title: "Measurement as a commercial act",
      detail:
        "Publishing how products actually perform is only attractive to a seller whose products vary. A manufacturer with the best cable does not want a comparison standard any more than one with the worst does - the first loses its premium and the second loses its sale. Only somebody selling everybody's cable benefits from the comparison existing, which is why it came from the middle of the chain.",
    },
  ],
  markets: [
    "Contractors, integrators, enterprises, utilities and industrial operators - the people who install infrastructure rather than the people who specify applications. Around 130,000 customers and 600,000 products at the point of acquisition.",
    "Its competitors were the other electrical and communications distributors, and its acquirer was one of them. What distinguished it was not price or breadth but the documents it published, which no competitor matched.",
  ],
  analyst: [
    "There is no independent position left to assess; it operates inside a larger distributor. What can be assessed is the durability of what it wrote, and the answer is unusual: the vocabulary has outlasted the company's independence by some margin and shows no sign of being replaced.",
    "The measure worth recording is that a wire distributor from Illinois is quoted daily, worldwide, by people who have never heard of it. Not many companies on this timeline can claim their principal legacy is a word - and fewer still that two of the words in question were never ratified by anybody, and are used anyway.",
  ],
};
