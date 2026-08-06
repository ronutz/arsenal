// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - NeoFeed (12 June 2025): Almaviva agreed to buy TIVIT from Apax, and
//     ***TAKODA - THE SPIN-OFF OF TIVIT'S DATA CENTRE OPERATION - WAS EXCLUDED
//     FROM THE DEAL and is separately for sale***; TIVIT turned R$2.1 billion in
//     2024 per its chief executive; 2023 official figures showed a profit of
//     R$5.7 million reversing a R$47.2 million loss the year before; NeoFeed
//     states Apax paid US$1 billion in 2010, where Exame reports R$874 million -
//     a discrepancy recorded rather than resolved
//   - Exame (June 2025): Almaviva was founded in Rome, operates in 13 countries,
//     and ***BRAZIL IS ALREADY ITS LARGEST OPERATION OUTSIDE ITALY*** - 37,000
//     employees and R$1.7 billion of revenue there in 2023
//   - pt.wikipedia (TIVIT): Telefutura's FIRST CLIENT WAS iG, the free-internet
//     provider then growing faster than it had planned for; by the end of the
//     first year 95% of revenue came from a single sector, which is what
//     prompted the diversification
//
// *** BODY READ AFTER DRAFTING, AND IT IS EXCEPTIONAL. It has the tennis
// player and the nightclub, Optiglobe and Proceda WITH their acquisition dates,
// the 2004-versus-2005 brand-date discrepancy handled openly, the founding
// scale and client list, THE 2009 LISTING IN FULL - R$15 a share, over R$660M,
// two abandoned earlier attempts, and the observation that it was the only IT
// services company on the Brazilian exchange - the Apax premium over a R$1.47B
// market capitalisation, Synapsis, and the STEFANINI COMPARISON as "opposite
// constructions of the same thing".
//
// Research missed the listing entirely. What follows are three things the body
// sets up but does not close. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const tivitProfile: VendorProfile = {
  slug: "tivit",
  foundings: [],
  timeline: [
    {
      year: 1999,
      title: "One client, and then the problem with one client",
      detail:
        "Telefutura's first customer was iG, the free internet provider, which was growing faster than it had planned to and needed people to answer telephones. By the end of the first year around ninety-five per cent of revenue came from a single sector - which is the position every young services company reaches and the one that decides whether it becomes a business or a supplier.",
    },
    {
      year: 2025,
      title: "Sold without the data centres",
      detail:
        "Takoda, the spin-off holding the data centre operation, was excluded from the Almaviva transaction and put up for sale separately. A company assembled in 2005 around Optiglobe - a data centre business - changed hands twenty years later with the data centres carved out of the deal. What the buyer wanted was the services layer that had been built on top of them.",
    },
    {
      year: 2025,
      title: "Not an entry, a doubling down",
      detail:
        "The acquirer was already there. Almaviva's Brazilian operation was its largest outside Italy before the deal - some thirty-seven thousand people and R$1.7 billion of revenue - so this is a foreign group that had already made its bet on the country and was increasing it, rather than one arriving.",
    },
  ],
  products: [
    { name: "Cloud and infrastructure management", what: "Running the platforms rather than owning the buildings, which is the distinction the Takoda separation made structural." },
    { name: "Cybersecurity", what: "A distinct business unit, and the fastest-growing part of the portfolio in recent years - the same demand curve every services firm in this region has ridden." },
    { name: "SAP and application services", what: "Implementing and running the enterprise systems Brazilian corporations depend on, which is unglamorous, sticky and the reason customers stay a decade." },
    { name: "Business process outsourcing", what: "The Telefutura inheritance: running processes on a client's behalf, still present in the portfolio two decades after it was the whole company." },
  ],
  innovations: [
    {
      title: "Assembled to a specification",
      detail:
        "Most companies discover what they are. This one was designed: a holding company decided the market wanted a single supplier for everything technical, checked which of its own assets could be combined into that, and merged them. It is corporate strategy executed as a founding, and it produced a company that had scale before it had a history.",
    },
    {
      title: "Selling the layer rather than the floor",
      detail:
        "Separating the data centres from the services and selling them apart is a statement about where the value sits. Buildings full of racks are an asset with a known price and a capital cost; the practices running on them are harder to value and harder to replace. The market answered that question by buying one and leaving the other on the shelf.",
    },
    {
      title: "Private equity as the vehicle for regional expansion",
      detail:
        "The entry above notes that the regional expansion arrived with private equity attached. That is the trade: capital and acquisition discipline in exchange for a clock. Fifteen years under one owner is long for that model, and the several abandoned attempts to sell suggest the exit was harder to find than the entry was.",
    },
  ],
  markets: [
    "Large Brazilian and Latin American enterprises - financial services above all, plus industry, retail and public sector - across ten countries, at around R$2.1 billion of revenue.",
    "It competes with Stefanini and the other regional services firms, with the global integrators, and increasingly with the cloud providers themselves, whose managed offerings remove work that used to be outsourced.",
  ],
  analyst: [
    "The financial picture reported around the sale is worth stating plainly: revenue of roughly R$2.1 billion in 2024, and a 2023 profit of R$5.7 million that reversed a R$47.2 million loss the year before. Those are thin margins on substantial revenue, which is the ordinary condition of labour-based services and the reason consolidation keeps happening.",
    "The purchase price was not disclosed, and the 2010 figure is itself reported two ways - R$874 million in one account and a billion dollars in another. Where a company has changed hands three times and the numbers do not reconcile across sources, the honest position is to report the range and note that nobody outside the transactions can settle it.",
  ],
};
