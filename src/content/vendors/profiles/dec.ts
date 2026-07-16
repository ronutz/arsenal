// ============================================================================
// DEC - Digital Equipment Corporation, the minicomputer king. Knowledge-based,
// dates well-documented (2026-07-16): founded 1957 by Ken Olsen and Harlan
// Anderson with $70K of ARD venture money (one of VC's founding deals), in a
// Maynard, MA woolen mill; PDP-8 (1965) the first mass minicomputer; PDP-11
// (1970) the most influential mini ever; VAX/VMS 1977; co-authors the DIX
// Ethernet standard with Intel and Xerox 1980; Alpha 1992; AltaVista 1995;
// decline through the early 90s; Compaq acquires DEC for ~$9.6B, completed
// June 1998 - then the largest computer-industry deal - and Compaq itself
// merges into HP in 2002. Legacy: Dave Cutler's VMS team -> Windows NT.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const decProfile: VendorProfile = {
  slug: "dec",
  foundings: [
    {
      company: "Digital Equipment Corporation",
      year: 1957,
      place: "Maynard, Massachusetts",
      founders: ["Ken Olsen", "Harlan Anderson"],
      story:
        "Ken Olsen and Harlan Anderson took $70,000 from Georges Doriot's American Research and Development - one of venture capital's founding investments - and set up in a Civil War era woolen mill to build computers people could actually touch. The PDP line took computing out of the mainframe glass house: the PDP-8 put a computer in the department, the PDP-11 put one in the lab, the factory, and the phone switch, and VAX/VMS built an empire on compatibility. DEC at its peak was the world's second-largest computer company, and the New England anchor of an entire industry.",
    },
  ],
  timeline: [
    { year: 1957, title: "The mill in Maynard", detail: "Founded on ARD venture money in a woolen mill - modules first, then the PDP-1, on which a certain MIT hack named Spacewar! becomes one of the first video games." },
    { year: 1965, title: "PDP-8: the minicomputer", detail: "The first mass-produced minicomputer at $18,000 creates a category: computing a department can buy without asking the board." },
    { year: 1970, title: "PDP-11", detail: "Arguably the most influential computer architecture ever shipped - the machine Unix and C grew up on, embedded everywhere from factories to telephone exchanges for decades." },
    { year: 1977, title: "VAX/VMS", detail: "The 32-bit empire: one architecture from desktop to datacenter, clustered before clustering was a word, with DECnet wiring it together - the proprietary networking world Ethernet would both serve and unseat." },
    { year: 1980, title: "The DIX standard", detail: "DEC co-authors the Ethernet specification with Intel and Xerox - the pragmatic act that made PARC's invention an industry standard and, eventually, the only wire that matters." },
    { year: 1998, title: "Compaq, then HP", detail: "After the Alpha gamble and the AltaVista curiosity could not reverse the decline, Compaq completes the ~$9.6 billion acquisition in June 1998 - then the largest deal in computer history - and carries DEC into HP in 2002. Dave Cutler's VMS team had already carried its ideas to Microsoft as Windows NT.", sourceNote: "Deal record; the VMS-to-NT lineage is extensively documented." },
  ],
  products: [
    { name: "PDP-8 and PDP-11", what: "The minicomputers that created departmental computing - and the native soil of Unix and C." },
    { name: "VAX/VMS", what: "The 32-bit architecture-and-OS empire, clustered and networked, that defined enterprise computing between the mainframe and the PC." },
    { name: "Alpha", what: "The 64-bit RISC swan song: for years the fastest processor on earth, a decade ahead of its market." },
  ],
  innovations: [
    { title: "The minicomputer category", detail: "DEC invented computing at department scale - the step between IBM's glass house and the PC on every desk - and dominated it for twenty years." },
    { title: "Ethernet's co-signature", detail: "The DIX standard is why Ethernet won: DEC's enterprise weight behind PARC's idea turned a lab network into the world's cabling." },
  ],
  markets: [
    "DEC's markets dissolved into the PC and server world it declined to take seriously; its DNA persists in Windows NT's architecture, in Ethernet's ubiquity, and in the engineering diaspora of New England computing.",
  ],
  analyst: [
    "For two decades the counterweight to IBM in every evaluation that mattered - and afterward, the canonical study in a great engineering company missing a platform shift it had itself made possible.",
  ],
};
