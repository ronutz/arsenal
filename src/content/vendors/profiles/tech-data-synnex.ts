// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Grokipedia (Tech Data): Raymund founded the company "initially marketing
//     data processing supplies for mini and mainframe computers DIRECTLY TO END
//     USERS"; at merger it operated in more than 100 countries with about
//     15,000 employees and revenue exceeding $30B, 90th on the Fortune 500
//   - Wikipedia (Synnex): 2019 revenue $23.757B with **240,000 EMPLOYEES** -
//     against Tech Data's ~14,000-15,000 on higher revenue, the difference
//     being the business process outsourcing operation
//   - Alfawiki / HandWiki: Apollo's acquisition announced November 2019 and
//     COMPLETED 30 JUNE 2020; the SYNNEX transaction announced 22 MARCH 2021 -
//     under nine months later - and completed 1 September 2021; the combination
//     surpassed Ingram Micro as the largest IT distributor
//   - PortersFiveForce: Tech Data bootstrapped with $5,000 (founding date given
//     variously as April and November 1974; the body uses 19 November, which is
//     the date in the incorporation record)
//
// *** BODY READ AFTER DRAFTING, AND IT IS OUTSTANDING. It has the $10,000 sale
// in the tagline and explains why the detail matters, SYNNEX as Compac
// Microelectronics with MiTAC and the Concentrix spin-out, the Apollo sequence
// with the 55/45 split, THE CIRCLE closing four of the five distributors by
// ownership, and the scale argument for broadline distribution.
//
// THIS PROFILE DOES NOT RESTATE THE CIRCLE. Three facts are added. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const techDataSynnexProfile: VendorProfile = {
  slug: "tech-data-synnex",
  foundings: [],
  timeline: [
    {
      year: 1974,
      title: "It did not begin as a distributor",
      detail:
        "The original business marketed data processing supplies directly to the organisations that used them. Selling to end users is precisely what a distributor does not do - ScanSource elsewhere on this timeline was founded on refusing it - so the company that became one of the two largest wholesalers in the world spent its first decade as the thing wholesalers exist to avoid being.",
    },
    {
      year: 2019,
      title: "Two hundred and forty thousand people",
      detail:
        "SYNNEX employed roughly 240,000 against Tech Data's 15,000, on lower revenue. The gap is the entire story of what SYNNEX had become: a distribution business with a vast outsourcing operation attached, where the second employed sixteen people for every one the first did. Merging them meant separating them first.",
    },
    {
      year: 2021,
      title: "Nine months",
      detail:
        "Apollo completed its purchase on 30 June 2020 and announced the SYNNEX transaction on 22 March 2021 - under nine months of ownership before agreeing the deal that would combine it. Private equity is often described as patient capital; this was not that, and the speed says the buyer had seen the combination before it bought the first half.",
    },
  ],
  products: [
    { name: "Broadline product distribution", what: "Endpoint devices, data centre hardware, networking, software and consumer electronics from thousands of manufacturers, sold to resellers, integrators and retailers." },
    { name: "Advanced solutions", what: "Data centre, security, cloud and analytics sold with technical pre-sales attached - the higher-margin end, where a distributor has to be able to design as well as ship." },
    { name: "Cloud marketplace and subscription management", what: "Provisioning and billing for the software a reseller no longer takes delivery of. The category that is slowly replacing the one the company was built on." },
    { name: "Financing and credit", what: "Terms extended to partners against inventory the distributor already owns. Both halves of this company were built on it, and it remains the reason most resellers can trade at all." },
  ],
  innovations: [
    {
      title: "Becoming a wholesaler on purpose",
      detail:
        "Moving from selling to end users to selling only through resellers means giving up the customers you have in exchange for customers you must recruit. Very few companies make that trade voluntarily, and it is the decision the entry above credits to the second generation.",
    },
    {
      title: "Two businesses that shared a name and not much else",
      detail:
        "Distribution turns enormous revenue on thin margins with few people; business process outsourcing turns modest revenue on labour. Holding both meant reporting a company whose employee count made no sense against its revenue, and the eventual separation of the outsourcing arm was less a strategic pivot than an admission that the two had never belonged in one set of accounts.",
    },
    {
      title: "Scale as the entire defence",
      detail:
        "In broadline distribution the largest player buys better, finances cheaper and is harder for a manufacturer to bypass. There is no other durable advantage, which is why the industry consolidates relentlessly and why a merger that produced the largest distributor was the obvious move rather than a bold one.",
    },
  ],
  markets: [
    "Resellers, integrators, managed service providers and retailers in more than a hundred countries, at roughly $58B of annual revenue. The end customer is every organisation that buys technology through anybody, which is most of them.",
    "Its principal competitor is Ingram Micro, and the two now sit close enough in size that the ranking depends on the year. Below them the specialists compete on depth in categories the broadline houses reach later.",
  ],
  analyst: [
    "Distribution is judged on working capital efficiency, vendor authorisations and geographic coverage. At this scale the assessments are effectively a duopoly comparison, with everything else in the category an order of magnitude smaller.",
    "The founding detail deserves the last word for a reason beyond its charm. A business sold within a family for ten thousand dollars became, fifty years later, the largest of its kind in the world - and it did so by abandoning its original customers, changing what it sold twice, merging with a company that had begun in contract assembly, and being owned in the interim by a private equity firm that held it for nine months. Almost nothing about the company that Edward Raymund sold survives in the one that exists, except the name and the fact that it moves other people's products.",
  ],
};
