// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04.
//
// *** THE TWO US ACTIONS ARE DISTINCT AND ARE SEPARATED HERE. ***
//   - 13 September 2017: DHS Binding Operational Directive removing Kaspersky
//     products from FEDERAL AGENCY systems (already in the entry above)
//   - 20 June 2024: US Commerce Department prohibited sales to US PERSONS
//     generally. New sales stopped after 20 July 2024; signature and software
//     updates were cut off after 29 September 2024.
// The second ended the US commercial business entirely and is a materially
// different event from the first.
//
// THE BODY ALREADY ARGUES Eugene Kaspersky's route into the field, Natalya
// Kaspersky's role, the CIH break, the research record, the 2017 action, the
// company's denials, and the jurisdiction point. This adds structure and the
// 2024 dates, and does NOT re-argue the attribution question.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const kasperskyProfile: VendorProfile = {
  slug: "kaspersky",
  foundings: [
    {
      company: "Kaspersky Lab",
      year: 1997,
      place: "Moscow, Russia",
      founders: ["Eugene Kaspersky", "Natalya Kaspersky", "Alexey De-Monderik", "Vadim Bogdanov"],
      story:
        "Four people left a company called KAMI to keep developing an antivirus toolkit that had been a side project. Natalya Kaspersky had taken over its distribution in 1994 and ran the business side for the company's first fifteen years, which is regularly left out of accounts that treat it as one man's company.",
    },
  ],
  timeline: [
    { year: 1997, title: "Founded in Moscow", detail: "By four people, around an antivirus engine that already existed." },
    { year: 1998, title: "CIH", detail: "A virus that overwrote the BIOS and could leave a machine unable to start. Handling it well established the company's reputation outside Russia." },
    { year: 2010, title: "Stuxnet analysis", detail: "The beginning of a decade of research on state-built malware - Flame, Duqu, Red October and others - published in detail regardless of who was implicated." },
    {
      year: 2017,
      title: "United States federal agencies",
      detail:
        "On 13 September the Department of Homeland Security directed federal agencies to remove the products. The scope was government systems.",
    },
    {
      year: 2024,
      title: "The commercial ban",
      detail:
        "On 20 June the Commerce Department prohibited sales to United States persons generally. New sales stopped after 20 July, and signature and software updates were cut off after 29 September - which ends a security product's usefulness far more completely than a sales ban does, since an antivirus engine without updates degrades from the day it stops.",
      sourceNote: "Dates per the Commerce Department determination as reported across trade coverage; the effect on updates is what distinguishes this from the 2017 action.",
    },
  ],
  products: [
    { name: "Endpoint and consumer antivirus", what: "The original business, still the largest, sold to consumers and enterprises across the markets where it remains available." },
    { name: "Kaspersky EDR and XDR", what: "Detection and response built on the same engine, following the same category shift every endpoint vendor has made." },
    { name: "Threat intelligence and research reporting", what: "Published analysis of targeted campaigns, and the output most often cited by people who disagree with the company on everything else." },
    { name: "Industrial control system security", what: "A distinct product line for operational technology, and an area where its research has been substantive." },
    { name: "KasperskyOS", what: "A microkernel operating system built for embedded and industrial use on the argument that securing a general-purpose OS after the fact is the wrong starting point." },
  ],
  innovations: [
    { title: "Publishing on state malware regardless of origin", detail: "Its teams documented campaigns attributed to several governments, and the technical work is rarely disputed even by its critics. Research that embarrasses somebody powerful is the kind whose independence is hardest to sustain." },
    { title: "Building an operating system rather than defending one", detail: "A microkernel designed so that unauthorised operations are structurally impossible rather than detected is an unusual bet for an antivirus company, and the reasoning - that retrofitting security onto a general-purpose system has limits - is sound whatever one concludes about the vendor." },
    { title: "Transparency centres and code review", detail: "Relocating data processing to Switzerland and offering source code inspection are the responses available to a vendor whose problem is trust rather than capability. Whether they can resolve a jurisdictional concern is precisely the open question." },
  ],
  markets: [
    "Consumer and enterprise security across Europe, Asia, Latin America, Africa and the Middle East. The United States market is closed to it; several other governments have imposed narrower restrictions on public-sector use.",
    "Its commercial position is now shaped less by product competition than by where it is permitted to sell, which is an unusual constraint for a software company and the reason the entry above treats jurisdiction as part of a threat model rather than as politics.",
  ],
  analyst: [
    "Independent detection testing has placed its engine at or near the top of the field consistently over two decades, and that record is not seriously contested.",
    "Formal analyst coverage in Western markets has become complicated by the restrictions rather than by the assessments, which is a distinction worth keeping: a product can be excluded from a market for reasons that have nothing to do with how well it works.",
  ],
};
