// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - FundingUniverse / Encyclopedia.com: ScanSource "was known as THE ONLY
//     AutoID and POS distributor that did not sell to end users"; Gates/FA
//     Distributing provided logistical support for the joint venture, and Steve
//     Owings was one of its former chief executives, having also led Argent
//     Technologies
//   - PortersFiveForce: founded 18 December 1992 in Greenville
//   - Umbrex company profile: INTELISYS acquired in 2016, bringing a
//     recurring-revenue, ADVISOR-LED telecom and cloud services model; Channel
//     Advisors added 2021; as of fiscal 2024 the two reporting segments are
//     Specialty Technology Solutions and Intelisys & Advisory, the latter
//     BROKERING connectivity, cloud, unified communications and contact centre
//     services through an agent-advisor model
//   - Upstate Business Journal: Baur on the 1994 listing - it "allowed us to
//     have the capital we needed to grow rapidly, and at the same time stay in
//     Greenville, South Carolina"
//   - Market summaries: free cash flow of $363.1M in a recent year despite
//     lower sales, with growth in the high-margin Intelisys recurring revenue
//
// *** BODY READ AFTER DRAFTING. It has the transitional-products thesis, the
// channel-size arbitrage (hundreds of barcode resellers against hundreds of
// thousands of computer resellers - the best statement of what a distributor
// sells anywhere on this site), the channel-only policy, the portfolio
// widening, and the Westcon pairing.
//
// IT DOES NOT MENTION INTELISYS, which is one of the company's two reporting
// segments and the thing that answers a question the Ingram Micro entry leaves
// open. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const scansourceProfile: VendorProfile = {
  slug: "scansource",
  foundings: [],
  timeline: [
    {
      year: 1992,
      title: "Launched with a broadline distributor behind it",
      detail:
        "Founded on 18 December. The logistics were provided by Gates/FA Distributing, of which Owings had been a chief executive - so a specialist distributor began operating with an established broadline operation's warehousing behind it. Starting a niche business inside somebody else's infrastructure is how a small team gets to compete on knowledge rather than on capital.",
    },
    {
      year: 1994,
      title: "Public, and staying put",
      detail:
        "The listing, in the founder's own account, provided the capital to grow quickly and simultaneously to remain in Greenville. Distribution is a business where the head office does not need to be near anything in particular, and choosing not to move is a decision most companies of this size do not get to make twice.",
    },
    {
      year: 2016,
      title: "Intelisys, and the exit from inventory",
      detail:
        "The acquisition brought an agent and advisor model: brokering connectivity, cloud, unified communications and contact centre services for commission rather than buying and reselling them. It has since become one of the company's two reporting segments, and it carries no stock at all.",
    },
  ],
  products: [
    { name: "Specialty Technology Solutions", what: "The original business, broadened: data capture, point of sale, payments, physical security, networking and collaboration hardware, sold only through partners." },
    { name: "Intelisys and Advisory", what: "Services brokered rather than resold, on recurring commission. A different business wearing the same company's name, and the higher-margin of the two." },
    { name: "Configuration and financing", what: "Devices staged, imaged and shipped ready to install, on terms the reseller could not obtain alone. In specialty hardware this is often the actual reason a partner uses a distributor rather than buying direct." },
  ],
  innovations: [
    {
      title: "Unique in refusing direct sales, not merely unusual",
      detail:
        "The policy the entry above describes was not one option among several at the time. Contemporary accounts record this as the only distributor in its categories that did not also sell to end users. A commitment that everybody makes is a marketing position; one that only you make is a structural choice, and it is why resellers would show it their customer lists.",
    },
    {
      title: "Answering the question the broadline houses are still asking",
      detail:
        "Distribution's defining problem is that it ties up capital in stock. The escape route usually proposed is a platform or a cloud marketplace, bolted onto the existing business. This company took a different route: it bought a business that had never held inventory and ran it as a separate segment. Whether that generalises is doubtful - the margin structures are wholly different - but it is the clearest example on this timeline of a distributor actually completing the transition rather than announcing it.",
    },
    {
      title: "Following the resellers rather than the products",
      detail:
        "The expansion from scanners into telephony, security and payments looks like category drift and was not. Each move followed the same partners into what they were being asked to install next. A distributor that expands by product category is guessing; one that expands by watching its existing customers is being told.",
    },
  ],
  markets: [
    "Value-added resellers, integrators and managed service providers in North America and Brazil, at around $3B of sales, with technology advisors as a distinct and growing customer type that did not exist when the company was founded.",
    "It competes with the broadline distributors when a category matures and with other specialists before that happens - which is the whole content of the transitional-products thesis the entry above describes.",
  ],
  analyst: [
    "The measure worth watching is the split between the two segments. Hardware distribution is high revenue and thin margin; the advisory business is small revenue and high margin, and recurring. A company reporting strong cash generation in a year of lower sales is showing the effect of that mix rather than of the volume.",
    "The strategic read is that this is a distributor with a hedge against its own industry. If specialty hardware distribution continues to compress, the segment that brokers services rather than stocking goods is not exposed to the same compression. Very few companies on this timeline own a business that profits from the decline of their original one.",
  ],
};
