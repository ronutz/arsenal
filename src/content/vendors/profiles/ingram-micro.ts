// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Orange County Business Journal (Oct 2024): the 1996 IPO raised about
//     $392M at a market capitalisation near $3.5B, with THE INGRAM FAMILY
//     RETAINING AROUND 75% OF VOTING STOCK; Ingram Industries STILL EXISTS as
//     the 222nd largest private company in America at roughly $2.7B of annual
//     sales, running river barges and supplying Apple with electronic books;
//     Orrin Henry Ingram was born in 1830
//   - Encyclopedia.com / FundingUniverse: the merged company was expected to
//     reach about $1B of revenue in 1989 with a 35% SHARE of the US market;
//     Micro D's chief executive Chip Lacy became chairman and chief executive
//     of the combined business
//   - Wikipedia: the company has repositioned from traditional distribution to
//     a platform business centred on its Xvantage B2B digital experience
//     platform
//
// *** BODY READ AFTER DRAFTING, AND IT IS EXCEPTIONAL. It has the two
// schoolteachers, the THREE-ENTRY teaching pattern (Stefanini, HCL, here) with
// the observation that distribution and instruction share a discipline, the
// full merger detail, the ScanSource specialist-versus-broadline contrast
// INCLUDING the inventory- and capital-intensive point from the filings, the
// HNA and Platinum carousel with the earn-out, and Ingram Industries' 1830s
// lumber and shipping roots.
//
// Research adds narrower things, and this manifest says so plainly. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const ingramMicroProfile: VendorProfile = {
  slug: "ingram-micro",
  foundings: [],
  timeline: [
    {
      year: 1989,
      title: "A third of the market on day one",
      detail:
        "The merged company was expected to hold about 35% of United States microcomputer distribution immediately. Combining the leading retail-channel distributor with the leading reseller-channel one did not create a competitor; it created the default, and everything the business has done since has been an argument about how to keep that position while the products underneath it changed.",
    },
    {
      year: 1996,
      title: "Public, but not really",
      detail:
        "The listing raised around $392M at a market capitalisation near $3.5B - and the family retained roughly three quarters of the voting stock. That structure is why the company could later be sold whole to a single buyer without a fight: it had been publicly traded and privately controlled at the same time for twenty years.",
    },
  ],
  products: [
    { name: "Broadline distribution", what: "Hardware, software and cloud from thousands of manufacturers, warehoused, financed and shipped to resellers. The catalogue breadth is the product, and the working capital behind it is the barrier to entry." },
    { name: "Credit and financing", what: "The service nobody outside the channel notices and every reseller depends on. A distributor extends terms that let a small integrator take an order larger than its bank balance, which is a lending business wearing a logistics business's clothes." },
    { name: "Cloud marketplace", what: "Reselling subscriptions rather than boxes - the transition the whole industry has been managing, and the one that removes the inventory from a business whose defining characteristic was inventory." },
    { name: "Xvantage", what: "The platform the company now describes itself around: ordering, quoting and management as software rather than as phone calls to a rep. It is an attempt to stop being a warehouse with a website and become the interface itself." },
  ],
  innovations: [
    {
      title: "Buying the other half of the channel",
      detail:
        "Two distributors serving different customer types are not really competitors, which is why the merger produced complementary reach rather than overlap. Recognising that before your rivals do is how consolidation creates something rather than merely subtracting a competitor.",
    },
    {
      title: "Publicly listed, privately controlled",
      detail:
        "Retaining a supermajority of votes through a public listing gives a family the capital markets without the governance. It is legal, common in family businesses and rarely discussed, and it determines what can happen to a company far more than its share price does.",
    },
    {
      title: "Trying to escape the warehouse",
      detail:
        "Cloud subscriptions and a digital platform are the same bet made twice: that the value can be moved from holding stock to being the system through which transactions happen. Whether a distributor can complete that move is the open question of the whole category, because the capital intensity the entry above describes is also the moat.",
    },
  ],
  markets: [
    "Resellers, managed service providers and integrators, in around two hundred countries. The customer is not the organisation that uses the technology but the one that sells and installs it - which is why almost nobody outside the channel can name the largest company in it.",
    "Its competitors are the other broadline distributors and, at the edges, the specialists and the manufacturers selling direct. Direct sales have been predicted to end distribution for forty years and have not, because a manufacturer that sells direct also has to finance, warehouse and support tens of thousands of small resellers.",
  ],
  analyst: [
    "The measures that matter here are working capital efficiency and share of vendor programmes rather than growth. A distributor is assessed on how little cash it ties up per dollar moved, which is an unglamorous ratio that decides the whole business.",
    "One fact belongs in the present tense rather than the past. Ingram Industries did not wind down after selling its computer business: it remains among the two hundred and fifty largest private companies in America, at roughly $2.7B of sales, and among its current lines is supplying electronic books to Apple. The barges are still running. Whatever conclusion is drawn about the technology distributor, the family that built it treated the whole thing as one line of business among several and is still trading on that basis.",
  ],
};
