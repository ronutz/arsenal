// ============================================================================
// TOSHIBA - the company that gave the world flash. Knowledge-based, dates
// well-documented (2026-07-16): Tanaka Seisakusho 1875 (Hisashige Tanaka);
// Hakunetsusha 1890 -> Tokyo Denki; Shibaura Seisakusho 1904; 1939 merger ->
// Tokyo Shibaura Denki ("Toshiba"; official name 1978). Japan's first
// incandescent lamps; the JW-10 Japanese word processor 1978; the T1100
// laptop 1985. FLASH MEMORY: Fujio Masuoka - NOR invented ~1980 (presented
// IEDM 1984), NAND presented 1987; the name from a colleague's camera-flash
// remark. Toshiba-Kongsberg affair 1987. DVD consortium lead 1995; HD DVD
// concedes to Blu-ray Feb 2008. Westinghouse nuclear acquired 2006 (~$5.4B)
// -> the 2015 accounting scandal (~$1.2B overstated) and Westinghouse's 2017
// Chapter 11 -> memory business sold to the Bain consortium June 2018
// (~$18B) -> renamed Kioxia Oct 2019. Toshiba delisted Dec 2023 (JIP
// take-private, ~$14B).
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const toshibaProfile: VendorProfile = {
  slug: "toshiba",
  foundings: [
    {
      company: "Tanaka Seisakusho (Toshiba's oldest root)",
      year: 1875,
      place: "Tokyo, Japan",
      founders: ["Hisashige Tanaka"],
      story:
        "Hisashige Tanaka - the celebrated inventor nicknamed 'Karakuri Giemon' for his mechanical dolls - opened Japan's first telegraph equipment works in 1875, at age 76. His company's successor (Shibaura Seisakusho) merged in 1939 with Tokyo Denki, heir of the Hakunetsusha lamp works that made Japan's first incandescent bulbs, forming Tokyo Shibaura Denki: Toshiba. A century after the founding, a Toshiba engineer named Fujio Masuoka would invent the memory the entire mobile world stores itself on.",
    },
  ],
  timeline: [
    { year: 1939, title: "Tokyo Shibaura Denki", detail: "The heavy-electric Shibaura works and the Tokyo Denki lamp maker merge; the portmanteau nickname 'Toshiba' becomes the official name in 1978 - by then attached to everything from turbines to televisions." },
    { year: 1978, title: "The JW-10", detail: "Toshiba ships the first Japanese-language word processor - solving kana-to-kanji conversion, a computing problem with no Western equivalent, and opening the office-automation era in Japan." },
    { year: 1985, title: "The T1100", detail: "Widely credited as the first mass-market laptop: floppy-based, battery-powered, IBM-compatible - championed internally against skepticism by Atsutoshi Nishida, who later ran the company. Portable computing's commercial starting gun." },
    { year: 1987, title: "Flash memory", detail: "Fujio Masuoka, having invented NOR flash around 1980 (presented 1984), presents NAND in 1987 - erasable in blocks, dense, cheap. A colleague's remark that erasure felt like a camera's flash names it. Every SSD, phone, and memory card descends from this work.", sourceNote: "Invention chronology per Masuoka's IEDM presentations and the standard histories." },
    { year: 2006, title: "The Westinghouse bet", detail: "Toshiba pays ~$5.4 billion for the Westinghouse nuclear business - the acquisition whose cost overruns detonate a decade later: the 2015 accounting scandal (profits overstated by roughly $1.2 billion), Westinghouse's 2017 Chapter 11, and the forced sale of the crown jewels.", sourceNote: "Figures per the public record." },
    { year: 2018, title: "The memory business departs", detail: "To survive, Toshiba sells its memory unit - Masuoka's legacy - to a Bain-led consortium for ~$18 billion; renamed Kioxia in 2019, it remains one of the world's NAND giants. In 2023 Toshiba itself is taken private and delisted after 74 years - the conglomerate's long unwinding." },
  ],
  products: [
    { name: "NAND flash memory", what: "The invention: block-erasable non-volatile storage - the substrate of SSDs, phones, and every memory card. Continued today by Kioxia." },
    { name: "T-series laptops", what: "From the T1100 onward, the line that made portable PCs a mass market." },
    { name: "1.8-inch hard drives", what: "The tiny drives that made early iPods possible - Toshiba storage in a billion pockets before flash took over (with Toshiba's own invention)." },
  ],
  innovations: [
    { title: "Flash memory (NOR and NAND)", detail: "Masuoka's inventions changed what storage IS: no moving parts, byte-addressable reads, block erasure - the enabling technology of mobile computing, invented by one engineer at one conglomerate." },
    { title: "The mass-market laptop", detail: "The T1100 proved portable, compatible, battery-powered computing could sell - the form factor every field engineer on these pages carries descends from it." },
  ],
  markets: [
    "Post-delisting Toshiba continues in energy, infrastructure, and devices; the memory legacy thrives independently as Kioxia - the invention outliving the inventor's ownership of it.",
  ],
  analyst: [
    "A conglomerate's rise and unwinding bracketing one immortal contribution: if this site had to name the single invention modern field work depends on most quietly, block-erasable flash is on the shortlist.",
  ],
};
