// ============================================================================
// src/content/vendors/profiles/nava.ts
// ----------------------------------------------------------------------------
// WHY THIS ONE EARNED A TIMELINE, AND WHY IT ALSO CORRECTS THE ENTRY.
//
// Nava publishes a year-by-year history on its own site. That retires the
// entry's standing sourceNote, which recorded the 1996 founding year as resting
// on "a single directory listing" because "Nava publishes a substantial about
// page that does not state a founding year". It does now, and it states rather
// more than the year.
//
// *** IT ALSO CONTRADICTS THE ENTRY'S FRAMING, AND THE CONTRADICTION IS THE
// USEFUL PART. *** The entry is titled "three companies that became one name"
// and describes Nava as "the result of merging business units that started as
// separate companies: Unicom ... and FlexVision". Nava's own timeline says
// something different: the company was FOUNDED as Unicom in 1996, and it
// CREATED FlexVision in 2009. On that account FlexVision was never a separate
// company that merged in; it was a division the founder's company spun up
// thirteen years later, and the 2018 event is a consolidation of its own group
// under a new name rather than a merger of independents.
//
// Both readings have sources. The "merger of FlexVision and Unicom" wording is
// on a third-party company listing the entry already cites, and Nava does
// operate across more than one CNPJ (Nava Software Ltda, Nava Servicos e
// Outsourcing S.A.), which is how a group of internally created units ends up
// looking like a merger of separate firms from the registry side. The
// discrepancy is preserved below in sourceNote rather than resolved, per the
// standard in profile-types.ts.
//
// *** RULED BY PRIME, 2026-09-27: the entry is NOT renamed. *** "Unicom /
// FlexVision are known as Nava now." The naming question is settled and this
// header no longer asks it. What stays is the dated fact underneath it, because
// that is a matter of record rather than of naming: Nava's own history places
// FlexVision as CREATED in 2009 by the company founded as Unicom in 1996.
//
// VERIFICATION MANIFEST - nava.com.br/en/who-we-are/ read 2026-09-27, full
// timeline transcribed: 1996 founded as Unicom (infrastructure, data centre,
// connectivity); 2005 IT and business monitoring; 2009 FlexVision created;
// 2012 Application Services; 2016 Data and Cloud Services; 2018 group
// consolidated under the name Nava, plus intelligent automation, digital BPO
// and IoT; 2019 Advanced Analytics and DigitalOPS; 2020 new growth cycle,
// financial services and payments; 2021 cybersecurity; 2022 Digital Strategy
// and Lean Strategy; 2023 AI applied to the business; 2024 Crescera Capital
// joins as partner; 2025 GH Brandtech acquired, M&A journey begins; 2026
// Ventura ERM acquired for cybersecurity, CS Global IT acquired for cloud.
// Around 2,000 specialists, described as three decades of experience.
//
// NO PERSONAL EVENT. The entry carries relationships: ["worked-with-directly"]
// and nothing here dates it. Not invented.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const navaProfile: VendorProfile = {
  slug: "nava",

  foundings: [
    {
      company: "Unicom",
      year: 1996,
      place: "Brazil",
      founders: [],
      story:
        "What is now Nava was founded in 1996 as Unicom, working in infrastructure, data centres and connectivity. That is the unglamorous end of the market and it is also the durable one: a company that starts by running the floor of somebody else's data centre accumulates access to how the estate actually behaves, which is the asset every later move on this timeline is built from. No founder names are published on the company's own history, and none are supplied here.",
      sourceNote:
        "The 1996 year and the original name are stated on Nava's own history page, which replaces the directory listing the entry previously had to rely on. Headquarters are recorded in a third-party directory as Barueri, Sao Paulo; the company's own page does not print a city, so none is asserted here.",
    },
  ],

  timeline: [
    {
      year: 2009,
      title: "FlexVision, created rather than acquired",
      detail:
        "The company created FlexVision, dedicated to developing and supporting IT platforms and to infrastructure operations. An infrastructure business building its own software arm is the supply side answering a change in what buyers wanted: one accountable party for a system that spans both, instead of an integrator for the hardware and a software house for everything above it.",
      sourceNote:
        "Nava's own timeline places FlexVision as created in 2009. A third-party company listing describes Nava as the result of a merger of FlexVision and Unicom, which reads as two independent firms joining. The two accounts are not compatible and both are recorded. The registry view may explain the difference: the group operates across more than one legal entity, and separately registered units look like separate companies from outside.",
    },
    {
      year: 2012,
      title: "Application Services",
      detail:
        "Applications were strengthened as a line of their own, which is the point at which a company that runs platforms starts being paid for what runs on them.",
    },
    {
      year: 2016,
      title: "Data and cloud",
      detail:
        "Data and cloud services were added to the offering, twenty years after a founding built on owning the machines. The sequence is the industry's in miniature: a business whose first asset was infrastructure had to learn to sell the thing that makes infrastructure invisible.",
    },
    {
      year: 2018,
      title: "One name over the group",
      detail:
        "The group was consolidated under the name Nava, and intelligent automation, digital BPO and IoT came in with it. Consolidating a brand is usually treated as marketing; for a company whose units had grown up separately it is the moment the sales conversation changes from several suppliers with a shared owner to one supplier with several capabilities.",
    },
    {
      year: 2019,
      title: "Advanced Analytics and DigitalOPS",
      detail:
        "Analytics and a digital operations practice were created, the first lines on this timeline that presuppose the data work of 2016 rather than the infrastructure work of 1996.",
    },
    {
      year: 2020,
      title: "Financial services and payments",
      detail:
        "A new growth cycle opened with dedicated financial services and payments practices. Payments is the sector where the infrastructure inheritance pays off most directly, because availability there is not a service level but the product.",
    },
    {
      year: 2021,
      title: "Cybersecurity",
      detail:
        "Security operations were expanded into a cybersecurity offering. Note the order on this timeline: security arrives twenty-five years after infrastructure and two years after analytics, which is a fair account of how Brazilian enterprise service companies actually sequenced it.",
    },
    {
      year: 2024,
      title: "Crescera Capital comes in",
      detail:
        "Crescera Capital joined as a partner. Outside capital is what turns a sequence of internally created practices into an acquisition programme, and the next two years are that programme.",
    },
    {
      year: 2025,
      title: "The first acquisition",
      detail:
        "GH Brandtech was acquired, taking the company into creative innovation, and Nava describes this as the start of its mergers and acquisitions journey. Twenty-nine years of building lines internally, then a bought one.",
    },
    {
      year: 2026,
      title: "Two more, both filling in the stack",
      detail:
        "Ventura ERM was acquired to complete a cybersecurity portfolio and CS Global IT to complete a cloud one. Both are the same move: buying the finished version of a line the company had already started building itself, which is what capital is for.",
    },
  ],

  // products, innovations, markets, analyst: absent. A services company's
  // practice lines are not a product line, and nothing read establishes analyst
  // standing.
};
