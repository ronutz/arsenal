// ============================================================================
// src/content/vendors/profiles/capgemini.ts
// ----------------------------------------------------------------------------
// WHY THIS ENTRY GOT A PROFILE AND MOST OF THE DEPTH QUEUE DID NOT.
//
// The depth queue (anvil_lib.depth_queue) held 27 entries on 2026-09-27: a
// short body and no profile file. Twenty-two of them are small Brazilian
// channel companies whose entire public record is a CNPJ registration and a
// company website, which supports a founding story at most, and the Parxtech
// profile already stands as the demonstrator for that case.
//
// Capgemini is the opposite case. It is a listed French multinational with
// press releases carrying figures, a documented chain of renames, and a
// Brazilian acquisition reported with a stake, a price and an enterprise
// value. The evidence supports a founding story AND a dated timeline, so the
// page gets both and nothing else.
//
// VERIFICATION MANIFEST - every fact below was read on 2026-09-27:
//   - Founding: Grenoble, 1967, as Sogeti. Kampf's own record states he and
//     THREE COLLEAGUES founded it, which is a different claim from the usual
//     "founded by Serge Kampf". Recorded with the nuance, in sourceNote.
//   - Renames: Sogeti -> CAP Gemini Sogeti (1975, after acquiring CAP, the
//     Centre d'Analyse et de Programmation, and Gemini Computer Systems) ->
//     Cap Gemini (1996) -> Capgemini SE (2017).
//   - Brazil, announced 2 September 2010: 55% of CPM Braxis for BRL 517
//     million (EUR 233 million), on an enterprise value put at BRL 970 million
//     (EUR 437 million), composed of a BRL 287 million capital increase and a
//     BRL 230 million buyback from existing shareholders. CPM Braxis was
//     guiding to around BRL 1 billion (EUR 450 million) of 2010 revenue with
//     more than 5,500 staff.
//   - The remaining 45% was NOT bought at closing. Capgemini held call options
//     and the selling shareholders held matching puts, exercisable only
//     between the third and fifth anniversary of closing at fair market value
//     at the time. CPM Braxis was consolidated immediately and the estimated
//     value of the 45% carried as a balance-sheet liability.
//   - Closing was announced in October 2010.
//   - By June 2012 the business traded as CPM Braxis Capgemini, with more than
//     6,500 people and over 200 customers in Brazil.
//
// WHAT IS DELIBERATELY ABSENT. No event records the 45% actually changing
// hands, because no source located says it did. Searching for it returned only
// the 2010 announcement again. The option's terms are a fact; its exercise is
// not, and a timeline that quietly rounded "held options" up to "took full
// ownership" would be inventing the most interesting part. No products, no
// innovations, no analyst section: this entry exists on this site for an
// acquisition, not for a product line.
// ============================================================================

import type { VendorProfile } from "../profile-types";

export const capgeminiProfile: VendorProfile = {
  slug: "capgemini",

  foundings: [
    {
      company: "Sogeti",
      year: 1967,
      place: "Grenoble, France",
      founders: ["Serge Kampf"],
      story:
        "Capgemini began in Grenoble in 1967 as Sogeti, the Société pour la Gestion de l'Entreprise et le Traitement de l'Information, founded by Serge Kampf the same year he left Groupe Bull. The name is worth reading literally, because it states the original business plainly: enterprise management and the processing of information, in that order. This was a firm selling the handling of a client's data as a service at a time when the computer doing the handling still belonged to somebody else, and the order of those two nouns is the whole services industry in miniature.",
      sourceNote:
        "Grenoble and 1967 are consistently recorded. The founder count is not: the account of Kampf's own career states that he and three colleagues founded Sogeti, while the company is usually described as founded by Kampf alone. The three are not named in the sources read, so they are not named here.",
    },
  ],

  timeline: [
    {
      year: 1975,
      title: "Two acquisitions become the name",
      detail:
        "Sogeti acquired the Centre d'Analyse et de Programmation and Gemini Computer Systems, and took the composite name CAP Gemini Sogeti. A firm that names itself after what it bought is telling you how it intends to grow, and the next fifty years did not contradict it.",
    },
    {
      year: 1996,
      title: "Cap Gemini",
      detail:
        "The Sogeti element came off the corporate name, leaving Cap Gemini. The original 1967 name survived as a subsidiary brand rather than disappearing, which is the usual fate of a founding name inside a group that has outgrown it.",
    },
    {
      year: 2010,
      title: "Fifty-five percent of CPM Braxis, and an option on the rest",
      detail:
        "On 2 September 2010 Capgemini announced it was taking 55% of the Brazilian IT services firm CPM Braxis for BRL 517 million, about EUR 233 million, on an enterprise value put at BRL 970 million, about EUR 437 million. The money went in two directions at once: a BRL 287 million capital increase into the company and a BRL 230 million buyback of shares from existing holders. CPM Braxis was guiding to roughly BRL 1 billion of 2010 revenue with more than 5,500 people. Closing was announced in October.",
      sourceNote:
        "Figures from Capgemini's own announcement and closing releases as carried by MarketScreener. The announcement expected closing in early October; the closing release was published on 13 October 2010 and states an October closing date, so the month is certain and the day is not restated here.",
    },
    {
      year: 2010,
      title: "The forty-five percent that stayed where it was",
      detail:
        "Majority is not ownership, and the structure said so. Capgemini held call options over the remaining 45% and the selling shareholders held matching puts, and neither side could act on them until the third anniversary of closing, with a five-year outer limit and a price set at fair market value whenever they were exercised. CPM Braxis was consolidated into Capgemini's accounts immediately, with the estimated value of that 45% sitting on the balance sheet as a liability. For at least three years the Brazilian business was fully consolidated and not fully owned, and the price of the rest was unknown by design.",
      sourceNote:
        "The option terms and the balance-sheet treatment are from Capgemini's closing announcement. No source located records the options being exercised, so no event here says they were.",
    },
    {
      year: 2012,
      title: "CPM Braxis Capgemini, and the banks",
      detail:
        "By June 2012 the business was trading under the joined name CPM Braxis Capgemini, with more than 6,500 people and over 200 customers in Brazil, and it announced Caixa Econômica Federal as a preferred-supplier client alongside an existing relationship with Bradesco. Two of the country's largest banks in one sentence is the answer to why a French group paid for a Brazilian services firm rather than building one: the contracts were the asset, and contracts of that size are not started from nothing by a newcomer.",
    },
    {
      year: 2017,
      title: "Capgemini SE",
      detail:
        "The group became Capgemini SE, adopting the European company form. Fifty years after Grenoble, the surviving element of the name is the half that came from an acquisition.",
    },
  ],

  // products, innovations, markets, analyst: deliberately absent. This entry
  // exists on this site for what Capgemini bought in Brazil, and the record
  // read supports the corporate chain and that transaction, nothing more.
};
