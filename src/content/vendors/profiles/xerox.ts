// ============================================================================
// XEROX - the company that fumbled the future. Knowledge-based + verified
// (2026-07-16): Haloid founded 1906, Rochester NY; Chester Carlson's
// electrophotography (1938 patent) licensed 1947; Xerox 914 (1959) - one of
// the most successful products ever; renamed Xerox 1961; PARC opens 1970:
// Alto (1973), Ethernet (Metcalfe & Boggs, 1973 memo), laser printing
// (Starkweather), Smalltalk/GUI; Apple's famous 1979 visit; Metcalfe leaves
// to found 3Com 1979; VERIFIED via SEC 8-K/10-K: Lexmark acquisition
// COMPLETED July 1, 2025, $1.5B including assumed liabilities, from
// Ninestar/PAG; Steve Bandrowczak CEO. Ethernet's birthplace = this page's
// reason to exist on a networking site.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const xeroxProfile: VendorProfile = {
  slug: "xerox",
  foundings: [
    {
      company: "Xerox (founded as The Haloid Company)",
      year: 1906,
      place: "Rochester, New York",
      founders: ["Joseph C. Wilson (Haloid); Chester Carlson (xerography)"],
      story:
        "Xerox is two stories wearing one name. The first: a Rochester photographic-paper maker bets everything on Chester Carlson's strange dry-copying invention - rejected by IBM, GE, and RCA - and the 914 copier of 1959 becomes one of the most profitable products in industrial history. The second story is why this page exists on a networking site: in 1970 the copier fortune funded the Palo Alto Research Center, where in three miraculous years researchers invented the personal computer as we know it, laser printing, the graphical interface - and, in Bob Metcalfe and David Boggs's 1973 work, Ethernet itself. Xerox commercialized almost none of it.",
    },
  ],
  timeline: [
    { year: 1938, title: "Xerography", detail: "Chester Carlson makes the first electrophotographic copy in Astoria, Queens; Haloid licenses the orphan invention in 1947 and gives the process its Greek-rooted name: dry writing." },
    { year: 1959, title: "The 914", detail: "The first plain-paper office copier ships and rewires office work itself; the company renames to Xerox in 1961 and becomes a verb." },
    { year: 1970, title: "PARC opens", detail: "The Palo Alto Research Center assembles the best computer scientists money can find and gives them room; the Alto, laser printing, Smalltalk, and the modern GUI follow within five years." },
    { year: 1973, title: "Ethernet is born", detail: "Bob Metcalfe's memo describes a broadcast network for the Alto - built with David Boggs, named for the luminiferous ether. Metcalfe leaves in 1979 to found 3Com and commercialize it; DEC, Intel, and Xerox publish the DIX standard in 1980. Every wire on this site descends from that memo." },
    { year: 1979, title: "The famous visit", detail: "Apple's team tours PARC and sees the GUI future Xerox headquarters could not; the phrase 'fumbling the future' enters the industry's vocabulary as its most-studied cautionary tale." },
    { year: 2025, title: "Lexmark", detail: "July 1, 2025: Xerox completes the $1.5 billion acquisition of Lexmark from Ninestar and PAG - two print icons combined, top-five in every major print segment, under CEO Steve Bandrowczak.", sourceNote: "Xerox 8-K and 10-K, July 2025 close." },
  ],
  products: [
    { name: "Production and office print", what: "The copier-descended core: printers, MFPs, and managed print services - now including the Lexmark A4 line." },
    { name: "Xerox IT Solutions", what: "The ITsavvy-built services arm - the diversification beyond the page." },
    { name: "The PARC legacy", what: "Not a product Xerox sells: Ethernet, laser printing, and the GUI - the industry's operating substrate, given away." },
  ],
  innovations: [
    { title: "Ethernet", detail: "Invented at PARC in 1973, standardized as DIX in 1980, and now the default word for a network port on earth - the single most consequential invention on any page in this section." },
    { title: "The modern office, twice", detail: "The 914 defined the paper office; PARC defined the digital one. No other company invented both eras - or profited so unevenly from them." },
  ],
  markets: [
    "Xerox today is a focused print and workplace-services company, enlarged by Lexmark to over 200,000 clients in 170+ countries - while its research legacy underwrites, without royalties, essentially the entire networking industry.",
  ],
  analyst: [
    "A century-long fixture of the print evaluations - and, in every business school on earth, the canonical case study in inventing the future and letting it walk out the door.",
  ],
};
