// ============================================================================
// INTEL & AMD - Fairchild's children: the x86 rivalry. Knowledge-based,
// dates well-documented (2026-07-16): Intel founded Jul 18, 1968 (Noyce +
// Moore, ex-Fairchild; Grove the first hire); 1103 DRAM 1970; 4004 Nov 1971
// (Faggin/Hoff/Mazor, with Busicom's Shima); 8080 1974; 8086 1978; IBM PC
// picks the 8088 in 1981; Moore's Law 1965 (revised 1975); memory exit 1985;
// Intel Inside 1991; Pentium 1993 (FDIV 1994, ~$475M charge); Itanium
// detour; Core 2006. AMD founded May 1, 1969 (Jerry Sanders + seven, also
// Fairchild); 1982 second-source agreement (IBM's dual-source demand);
// Am386 1991 after the legal war; NexGen 1996 -> K6; Athlon 1999, first
// x86 to 1 GHz Mar 2000; Opteron/Athlon 64 2003 define AMD64 - the 64-bit
// x86 Intel then adopts; ATI 2006 (~$5.4B); GlobalFoundries spin 2009;
// Lisa Su 2014; Zen/Ryzen/EPYC 2017; Xilinx completed Feb 2022 (~$49B).
// The Shockley -> Fairchild -> Intel/AMD arc cross-links the Bell Labs page.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const intelAmdProfile: VendorProfile = {
  slug: "intel-amd",
  foundings: [
    {
      company: "Intel",
      year: 1968,
      place: "Mountain View, California",
      founders: ["Robert Noyce", "Gordon Moore"],
      story:
        "Two of Fairchild Semiconductor's founders - Noyce, co-inventor of the integrated circuit, and Moore, whose 1965 observation about transistor counts became the industry's metronome - left to build Integrated Electronics, with Andy Grove as the first hire. Intel meant memory first (the 1103 DRAM), but a 1971 calculator contract produced the 4004, the first commercial microprocessor, and the company spent the next half-century as the reference implementation of Moore's Law.",
    },
    {
      company: "Advanced Micro Devices",
      year: 1969,
      place: "Sunnyvale, California",
      founders: ["Jerry Sanders", "and seven Fairchild colleagues"],
      story:
        "One year after Noyce and Moore, Fairchild's flamboyant sales chief Jerry Sanders founded AMD a few blocks away - famously with the venture money coming harder ('Noyce raised his in an afternoon; it took me a million years to raise a million dollars'). AMD built its first decades as the industry's second source - the licensed alternative big buyers demanded - and its later ones as the rival that repeatedly kept the x86 duopoly honest.",
    },
  ],
  timeline: [
    { year: 1971, title: "The 4004", detail: "November 1971: Faggin, Hoff, and Mazor (with Busicom's Shima) ship the first commercial microprocessor - 2,300 transistors doing what a calculator board did. The general-purpose processor as a PRODUCT starts here." },
    { year: 1981, title: "IBM picks x86 - twice-sourced", detail: "The IBM PC chooses Intel's 8088, and IBM's dual-source policy makes AMD an official x86 manufacturer via the 1982 technology-exchange agreement - the contract whose unwinding fuels a decade of litigation and the Am386's clean-room triumph in 1991." },
    { year: 1985, title: "Intel exits memory", detail: "Grove and Moore's famous thought experiment - 'if the board fired us, what would the new CEOs do?' - takes Intel out of the DRAM business it invented and all-in on microprocessors, the strategic pivot business schools still teach." },
    { year: 2000, title: "The gigahertz race", detail: "March 2000: AMD's Athlon crosses 1 GHz days before Intel - the challenger setting the pace for the first time, on Dirk Meyer's K7, a warning shot for what 2003 would bring." },
    { year: 2003, title: "AMD64 - the challenger writes the ISA", detail: "Opteron and Athlon 64 ship a 64-bit extension of x86 while Intel bets on Itanium. The market chooses compatibility; Intel adopts AMD's instruction set. The 64-bit x86 the entire world runs was defined by the second source - the rivalry's defining irony.", sourceNote: "Intel's adoption shipped as EM64T in 2004, later 'Intel 64'." },
    { year: 2017, title: "Zen", detail: "Under Lisa Su, AMD's Zen architecture lands as Ryzen and EPYC - the comeback from the Bulldozer years that re-opens the server market and drags the whole duopoly's roadmap forward, again." },
    { year: 2022, title: "Two different giants", detail: "AMD completes the ~$49 billion Xilinx acquisition, becoming a CPU+GPU+FPGA house; Intel doubles down on manufacturing itself with its foundry strategy - the rivals now competing on different axes of the same law of physics.", sourceNote: "Deal value per the public record at closing." },
  ],
  products: [
    { name: "Intel x86 line (8086 to Core and Xeon)", what: "The processor family that defined personal and server computing - the default silicon of every enterprise this site's readers run." },
    { name: "AMD Athlon, Opteron, Ryzen, EPYC", what: "The challenger line - and with AMD64, the authorship of the 64-bit instruction set both companies now ship." },
    { name: "Moore's Law", what: "Not a product but the industry's planning document: the 1965 observation that set the cadence every network device's price-performance curve rides on." },
  ],
  innovations: [
    { title: "The microprocessor as a commodity", detail: "Intel turned the CPU from a cabinet into a component - the precondition for every appliance, firewall, and load balancer on these pages being 'a computer wearing a costume'." },
    { title: "The second source that became the author", detail: "AMD's arc from licensed copyist to ISA author (AMD64) is the industry's best case study in how a duopoly's junior partner keeps the whole platform honest - and occasionally steers it." },
  ],
  markets: [
    "The duopoly endures: Intel and AMD between them still supply the processors under nearly every server, desktop, and network appliance - now with the GPU era testing whether x86's center holds.",
  ],
  analyst: [
    "One entry, deliberately: neither company's story parses without the other - the pricing, the litigation, the leapfrogging, and the strange fact that the challenger wrote the instruction set the incumbent ships.",
    "The Fairchild lineage matters: Shockley left Bell Labs, the eight left Shockley, Noyce and Sanders left Fairchild - the industry's genealogy runs through resignations.",
  ],
};
