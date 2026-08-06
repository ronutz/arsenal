// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - EBSCO Research Starters: in 1998 Brin and Page tried to sell PageRank to
//     AltaVista for $1 million, intending to resume their studies, AND THE
//     OFFER WAS REJECTED BECAUSE ALTAVISTA'S PARENT, DIGITAL EQUIPMENT
//     CORPORATION, "WAS NOT RECEPTIVE TO OUTSIDE TECHNOLOGY"
//   - Acquired Briefing: in spring 1997 they had already approached Excite,
//     Infoseek and Lycos and been rejected "due to misaligned incentives";
//     BackRub was coded in Java by Page and later in Python by Scott Hassan;
//     google.com was handling 10,000 queries a day and straining Stanford's
//     network; the seed round was ~$1M at a $10M post-money valuation from
//     Bechtolsheim, David Cheriton, Ram Shriram and Jeff Bezos
//   - Grokipedia (History of Google): prototype development was funded by the
//     National Science Foundation's Digital Libraries Initiative; the PageRank
//     patent was filed on 1 September 1998; AdWords launched 2000 and AdSense
//     2003 on auction-based keyword targeting; Google Search holds about 90% of
//     global search as of 2025
//   - Market Realist and businessmodelcanvastemplate: the garage belonged to
//     Susan Wojcicki, later chief executive of YouTube; Bechtolsheim's $100,000
//     cheque was written to an entity that did not yet legally exist
//
// *** BODY READ AFTER DRAFTING. The body has BackRub, the link-as-vote
// insight, the keyword-stuffing contrast, the $1M AltaVista attempt, the
// incorporation dates, the funding, the bare homepage (with the lovely note
// that neither founder was much of an HTML author), and the RankDex/Robin
// Li/Baidu footnote. What it does NOT have is WHY AltaVista refused, or that
// THREE OTHERS HAD ALREADY REFUSED. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const googleSearchProfile: VendorProfile = {
  slug: "google-search",
  foundings: [],
  timeline: [
    {
      year: 1997,
      title: "Three rejections before the famous one",
      detail:
        "In the spring they approached Excite, Infoseek and Lycos with the technology and were turned down by all three, reportedly because the incentives did not align: a search engine selling advertising against page views has no obvious reason to want visitors to find what they came for and leave.",
    },
    {
      year: 1998,
      title: "And the fourth, with a stated reason",
      detail:
        "The offer to AltaVista at a million dollars was refused because its parent, Digital Equipment Corporation, was not receptive to technology developed outside it. Four companies in the search business were offered the thing that would end their industry, and the last of them declined it on a point of principle about where ideas should come from.",
    },
    {
      year: 1998,
      title: "A cheque to a company that did not exist",
      detail:
        "Andy Bechtolsheim's $100,000 was written to an entity that had not yet been incorporated. The patent on PageRank was filed on 1 September; the company was incorporated on the 4th. By then the service was handling ten thousand queries a day and straining Stanford's network.",
    },
    { year: 2000, title: "AdWords, and the auction", detail: "Advertising sold by auction against keywords rather than by negotiated placement - which is the invention that paid for everything, and a larger commercial idea than the ranking algorithm it sits on." },
  ],
  products: [
    { name: "The index and the ranking", what: "The original product, still the core one, and now built on hundreds of signals of which the original link analysis is only the oldest." },
    { name: "AdWords and AdSense", what: "The auction that monetises the query, and its extension onto other people's pages. The search engine is the funnel; this is the business." },
    { name: "The clean page", what: "Worth listing as a product decision rather than a design one. Everything a competitor added to its front page took attention away from the box, and the box was the entire proposition." },
  ],
  innovations: [
    {
      title: "Measuring what the author cannot control",
      detail:
        "Keyword frequency is written by the person who wants to rank. Inbound links are written by everybody else. Moving the signal from the page to the network around it is the whole idea, and every ranking system since has been an argument about which uncontrollable signals to use next.",
    },
    {
      title: "Publicly funded, privately enormous",
      detail:
        "The prototype was developed with support from a National Science Foundation programme on digital libraries. Public research money produced the ranking work behind one of the most valuable companies ever built, which is worth stating plainly whenever the question of who should fund basic research comes up.",
    },
    {
      title: "Selling attention by auction",
      detail:
        "Before AdWords, advertising was negotiated: a salesperson, a rate card, a placement. Running an auction for each query set the price automatically, scaled without salespeople, and let the smallest advertiser buy the same inventory as the largest. The ranking made the audience; the auction is what turned it into money.",
    },
    {
      title: "Refusing the portal",
      detail:
        "Every competitor concluded that a search engine was a doorway and that the doorway should be decorated. This one concluded that a search engine is a place people want to leave quickly, and built for that. The bare page was partly, as the entry above notes, a lack of interest in writing HTML - but it was the correct answer for the wrong reason, which happens more often than the histories admit.",
    },
  ],
  markets: [
    "General web search, at roughly 90% of the global market as of 2025 - a share that has been challenged in courts rather than in the market, and whose durability is now a legal question as much as a technical one.",
    "Its competitors are the other general engines, the regional ones that hold their own markets, and increasingly the assistants and answer engines that remove the click the whole business model depends on.",
  ],
  analyst: [
    "There is no meaningful competitive assessment to offer of a service with nine tenths of a market. The assessments that matter are regulatory, and they are ongoing in several jurisdictions.",
    "The observation this timeline is better placed to make is about the four refusals. Excite, Infoseek, Lycos and AltaVista each had the chance to buy the ranking method that displaced them, and each had a reason not to that made sense from inside. Incumbents rarely fail to see a technology; they see it and correctly identify that adopting it would damage something they already have.",
  ],
};
