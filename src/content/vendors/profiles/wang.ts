// ============================================================================
// WANG LABORATORIES - the office before the PC. Knowledge-based, dates
// well-documented (2026-07-16): founded 1951, Boston, by Dr. An Wang
// (Shanghai-born, Harvard PhD; magnetic-core memory work with Way-Dong Woo;
// core patents later sold to IBM ~$500K 1956); LOCI/300-series calculators
// (1960s); Wang 2200 minicomputer 1973; WPS word processing 1976 -> OIS -
// owned the office WP category (secretaries listed "Wang" as a skill); VS
// minicomputer line 1977; Massachusetts Miracle icon (Wang Towers, Wang
// Center); Fred Wang succession fails (resigns 1989, Dr. Wang dies 1990);
// Chapter 11 August 1992; reemerges as services (Wang Global), acquired by
// Getronics 1999. The dedicated-machine era's king, unmade by the PC.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const wangProfile: VendorProfile = {
  slug: "wang",
  foundings: [
    {
      company: "Wang Laboratories",
      year: 1951,
      place: "Boston, Massachusetts",
      founders: ["Dr. An Wang"],
      story:
        "An Wang arrived from Shanghai, earned a Harvard doctorate, co-invented the magnetic-core memory write mechanism - and sold the patents to IBM to fund a company of his own. Wang Laboratories climbed three ladders in succession: desktop calculators, minicomputers, and then the product that made it a verb in every office of the late 1970s - dedicated word processing. At its peak, 'Wang' was a skill on résumés and a tower on the Lowell skyline; within fifteen years the general-purpose PC had erased the category entirely.",
    },
  ],
  timeline: [
    { year: 1956, title: "The IBM patent sale", detail: "Wang sells his core-memory patents to IBM for around $500,000 - the seed capital, and a lifelong wariness of the giant, that fund everything after.", sourceNote: "Amount as commonly recorded (~$500K)." },
    { year: 1965, title: "LOCI and the calculator years", detail: "Wang's desktop calculators - logarithmic tricks doing multiplication a decade before cheap chips - make the company's first fortune and its engineering name." },
    { year: 1976, title: "WPS: the office changes", detail: "The Wang Word Processing System puts editing on a screen with a secretary-friendly interface; offices buy them by the floor, and Wang owns the category it effectively created." },
    { year: 1977, title: "The VS line", detail: "The VS minicomputers extend Wang into general data processing - IBM-fighting machines with famously loyal customers - and carry the company to Fortune-500 scale and Massachusetts Miracle stardom." },
    { year: 1989, title: "Succession fails", detail: "Fred Wang, installed by his father, resigns as losses mount; Dr. Wang, already ill, dies in 1990 - the founder-succession failure that business schools still teach alongside the product one." },
    { year: 1992, title: "Chapter 11", detail: "August 1992: the PC running cheap word-processing software has dissolved the dedicated category; Wang files for bankruptcy, reemerging as a services firm that Getronics acquires in 1999 - the towers outlast the empire." },
  ],
  products: [
    { name: "Wang WPS / OIS", what: "The dedicated word-processing systems that defined office automation before the PC." },
    { name: "Wang VS", what: "The minicomputer line with the office-integration story - and some of the era's most devoted users." },
    { name: "Wang calculators", what: "The LOCI and 300-series desktop machines that built the company's first act." },
  ],
  innovations: [
    { title: "The screen-based office", detail: "Wang put document editing on a display with an operator-first interface - the office software experience, invented as an appliance." },
    { title: "Category creation, category risk", detail: "Wang's rise and fall is the canonical lesson that owning a category is not owning the platform beneath it - the PC absorbed the function and the fortune." },
  ],
  markets: [
    "Wang's markets were absorbed whole by the PC; its legacy is the office-automation paradigm itself, and an immigrant-founder story that remains one of American technology's greatest.",
  ],
  analyst: [
    "For a decade the vendor every office-automation evaluation started from - then the era's clearest demonstration that dedicated hardware loses to general-purpose platforms.",
  ],
};
