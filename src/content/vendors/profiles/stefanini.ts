// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Fecomercio SP: with foreign corporations ENTERING the Brazilian market
//     during the 1990s, Stefanini chose to internationalise RATHER THAN compete
//     for the same domestic market; the first international subsidiary opened
//     in Argentina in 1996; multinational clients supported the company when it
//     opened facilities abroad; greenfield investment continued until the 2009
//     financial crisis, when currency and asset devaluation made ACQUISITION
//     the cheaper route, TechTeam and CXI being the most important; around 40%
//     of revenue from outside Brazil
//   - Exame (2012): TechTeam, headquartered in Michigan with 2,300 staff and
//     subsidiaries in 16 countries, won against seven competing bidders; the
//     Colombian Informática & Tecnología followed; ranked 17th among the most
//     internationalised Brazilian companies at that point
//   - Brazil Journal (2025): more than 40 acquisitions since founding, 13 of
//     them in the previous four years
//   - Grokipedia: 97% client retention and an average client relationship of
//     11.9 years
//
// *** BODY READ AFTER DRAFTING. The body has the founding in a bedroom at 26,
// the geology-to-Bradesco route, the 38 square metres, the teaching insight,
// the scale figures, the unleveraged acquisition strategy and the HCL pairing.
// It says the company went abroad. It does not say WHY, or HOW the method
// changed. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const stefaniniProfile: VendorProfile = {
  slug: "stefanini",
  foundings: [],
  timeline: [
    {
      year: 1996,
      title: "Buenos Aires, and the reason for it",
      detail:
        "The first office outside Brazil. The trigger was not ambition abroad but pressure at home: through the 1990s the large international services firms arrived in Brazil, and rather than fight them for the same domestic accounts the company went to compete in theirs. Going abroad was a defensive move that turned into the strategy.",
    },
    {
      year: 2009,
      title: "The method changes, the direction does not",
      detail:
        "Until the financial crisis, expansion had meant opening offices and building operations from nothing. The crisis devalued currencies and assets to the point where buying an established firm cost less than building one, and the company switched. TechTeam - Michigan, 2,300 staff, subsidiaries in sixteen countries - was won against seven other bidders.",
    },
    { year: 2025, title: "Forty-odd acquisitions on", detail: "More than forty purchases since founding, thirteen of them in four years, against a stated target of R$2B more by 2027." },
  ],
  products: [
    { name: "Application development and maintenance", what: "The original consulting business: building and running software for organisations that would rather not employ the people who do it." },
    { name: "IT outsourcing and service desk", what: "The volume business, and the one that made the international footprint necessary - supporting a multinational client means supporting it wherever it operates." },
    { name: "Digital and data services", what: "Cloud migration, analytics and automation, much of it acquired rather than built, including specialist practices around individual cloud providers." },
    { name: "Vertical platforms", what: "Banking and financial software sold as products rather than as project work - the attempt every services firm makes to earn something other than by the hour." },
  ],
  innovations: [
    {
      title: "Internationalising away from competition rather than toward opportunity",
      detail:
        "The usual account of a company going abroad involves demand it wants to reach. This one went abroad because the competition had come to it. That is a different calculation and a harder one, since the firms it followed home were larger, better known and operating in markets where nobody had heard of it.",
    },
    {
      title: "Travelling on your customers' passports",
      detail:
        "Opening in a new country is easier when an existing client already operates there and wants the same supplier. The multinationals it served in Brazil provided both the initial reason to be present and the first revenue on arrival, which is the only cheap way a mid-sized firm enters a foreign market.",
    },
    {
      title: "Building until buying got cheap",
      detail:
        "Greenfield expansion until 2009 and acquisition afterwards is a company reading currency markets correctly. A devaluation makes foreign assets cheap for whoever holds a different currency, and the same crisis that closed opportunities for others opened this one - which is why the acquisition strategy dates from a downturn rather than from a boom.",
    },
    {
      title: "Retention as the actual metric",
      detail:
        "Around 97% client retention with an average relationship approaching twelve years is the number that matters in this business. Services firms do not usually lose contracts to better proposals; they lose them by disappointing somebody slowly. A retention figure is a claim about not doing that, sustained over a decade.",
    },
  ],
  markets: [
    "Financial services above all in Brazil and Latin America, and automotive and manufacturing in the rest of the world - two different centres of gravity in one company, reflecting where each region's work came from.",
    "It competes with the global systems integrators and the Indian services majors, on a footprint that is genuinely worldwide but a scale that is not. Roughly 40% of revenue now comes from outside Brazil.",
  ],
  analyst: [
    "Its distinguishing characteristic is easy to state and hard to achieve: it is a technology services multinational headquartered in a country that mostly receives them. Rankings of internationalised Brazilian firms have placed it near the top for years, having placed it seventeenth in 2011.",
    "The trajectory to watch is whether a company built on labour arbitrage and client relationships can hold those relationships as the work itself becomes more automated. Twelve-year average relationships are an asset in a stable market and a liability in one where the service being bought changes underneath the contract.",
  ],
};
