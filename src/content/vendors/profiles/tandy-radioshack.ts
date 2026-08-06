// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - company-histories.com (RadioShack Corporation): by 1984 RadioShack's
//     19% market share had fallen below 9%, and critics attributed it to
//     Charles Tandy's policy of limiting the chain to PRIVATE LABEL items,
//     preferably made by Tandy's own divisions - as software poured out for
//     Apple and IBM-compatible machines, fewer users would limit themselves to
//     software written only for the TRS-80
//   - Texas State Historical Association: the private-label doctrine as an
//     explicit strategy to eliminate middlemen; "Tandy manufactured everything
//     from wire to microchips"; thirty-four manufacturing plants, twenty-eight
//     in the United States; Charles Tandy died unexpectedly in 1978; Pier 1
//     Imports was spun out of Tandy in 1968
//   - Startup Stumbles and Wikipedia: RadioShack bought for $300,000 from a
//     nearly bankrupt nine-store Boston chain (1962 in some sources, 1963 in
//     others); Tandy cut stock items from 40,000 to 2,500, required a 25%
//     deposit and then eliminated credit; profitable within two years at
//     around $20M of sales
//
// *** BODY READ AFTER DRAFTING. The body has the TRS-80's origin, the 3,000
// units matching the store count, Leininger's rejected 50,000 estimate, the
// 1977 Trinity comparison, and the argument that Tandy beat Apple on REACH and
// lost when reach commoditised. That argument is right. This profile adds the
// SECOND cause, which compounds it. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const tandyProfile: VendorProfile = {
  slug: "tandy-radioshack",
  foundings: [
    {
      company: "Hinckley-Tandy Leather",
      year: 1919,
      place: "Fort Worth, Texas",
      founders: ["Norton Hinckley", "Dave L. Tandy"],
      story:
        "A leather supply business, whose most profitable idea turned out to be craft kits sold to scouts and campers. That is the pattern the whole company runs on: find people who already make things, and sell them the parts.",
    },
  ],
  timeline: [
    {
      year: 1963,
      title: "A bankrupt chain for $300,000",
      detail:
        "RadioShack was nine stores and a mail-order business in Boston, close to failing. The turnaround was brutal and fast: stock lines cut from around forty thousand to twenty-five hundred, a deposit required on credit sales and then credit abolished entirely. It was profitable inside two years.",
      sourceNote: "Sources give 1962 and 1963 for the purchase; both appear in reputable accounts.",
    },
    {
      year: 1978,
      title: "Charles Tandy dies",
      detail: "Unexpectedly, the year after the TRS-80 launched and before anyone knew whether the computer business would work.",
    },
    {
      year: 1984,
      title: "Nineteen per cent to under nine",
      detail:
        "Market share in personal computers roughly halved in a few years, and the reason given at the time was not price or performance. It was that the machines only ran software written for them.",
    },
  ],
  products: [
    { name: "The TRS-80 line", what: "The Model I and its successors, sold through the shops rather than through dealers, and for several years the most widely sold personal computers in the world." },
    { name: "Everything else in the shop", what: "Components, cables, batteries, kits and the parts nobody else stocked - the business that made the chain worth having and outlasted the computers by two decades." },
    { name: "Thirty-four factories", what: "Tandy made its own products: wire through to microchips, in plants it owned. The retailer was a manufacturer, which is what made the margins work and what eventually cost it the computer market." },
  ],
  innovations: [
    {
      title: "Selling parts to people who make things",
      detail:
        "Leather kits for scouts, then components for radio hobbyists, then computers for people who wanted to program them. The customer was always somebody building something, and the shop was always the place they went for the piece they were missing.",
    },
    {
      title: "Own the whole chain",
      detail:
        "Private label wherever possible, manufactured in-house wherever possible, sold only through your own shops. It is a coherent doctrine, it rescued a failing retailer, and it produced margins nobody else in consumer electronics could match.",
    },
    {
      title: "And then the doctrine inverted",
      detail:
        "The same policy applied to computers meant software written for a TRS-80 ran on a TRS-80. While Apple and the IBM-compatible world accumulated third-party applications from anybody who cared to write one, this platform accumulated what its owner commissioned. Nineteen per cent of the market became under nine, and the cause was the strategy that had saved the company twenty years earlier. Vertical integration is a position on how much of the world you want working for you, and the answer changes when the world is writing software.",
    },
  ],
  markets: [
    "Hobbyists, small businesses, schools and households - the customers who wanted a computer without knowing a dealer, in a country where the nearest RadioShack was a short drive from almost anybody. That reach is the entire commercial story.",
    "Its competitors in computing were Apple, Commodore and eventually the IBM-compatible manufacturers; its competitors in retail were nobody in particular, until the electronics superstores arrived and then the internet did.",
  ],
  analyst: [
    "The computing position ended in 1993 and the retail one deteriorated over the two decades that followed. What is worth assessing is the model rather than the outcome.",
    "Two lessons sit in the same company and they contradict each other only if you ignore the dates. Vertical integration and exclusive distribution rescued a bankrupt retailer in 1963 and destroyed a market-leading computer business by 1984, and the difference is what the product was. Selling somebody a resistor, it does not matter who made it. Selling somebody a computer, what matters is what other people have written for it - and a company that manufactures everything itself has no way to want that.",
  ],
};
