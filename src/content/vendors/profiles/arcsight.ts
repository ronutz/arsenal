// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - OpenText Community "Celebrating 20 Years of ArcSight": incorporated in
//     Delaware 3 May 2000 as Wahoo Technologies, renamed March 2001; first
//     product around 2002; listed as a VISIONARY in Gartner's 2003 IT Security
//     Management Magic Quadrant, "where there were no leaders at that time";
//     IPO 14 February 2008 as ARST
//   - Alchetron: May 2013 marked the TENTH consecutive year in the SIEM Magic
//     Quadrant leaders' section
//   - Kleiner Perkins: the only Silicon Valley company listed on NASDAQ in 2008;
//     Tom Reilly recruited as chief executive that year; the high-end strategy
//     aimed at retail and financial services; Walmart among the early customers
//   - Wikipedia and Grokipedia: Alex Daly founding CEO, previously chief
//     executive of Cygnus Solutions which Red Hat acquired; HP at $43.50 a
//     share completing 22 October 2010; the HPE, Micro Focus and OpenText chain
//
// *** BODY READ AFTER DRAFTING. It already has the Wahoo name, the ESM
// architecture, the Splunk contrast, In-Q-Tel among the investors, the
// financials and the four-owner chain. NOT in the body: the 2003 quadrant with
// no leaders, the decade of leadership that followed, and the 2008 listing
// being the only one from Silicon Valley that year. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const arcsightProfile: VendorProfile = {
  slug: "arcsight",
  foundings: [
    {
      company: "ArcSight",
      year: 2000,
      place: "Cupertino, California",
      founders: [],
      story:
        "Alex Daly, the founding chief executive, arrived having run Cygnus Solutions - the company that commercialised GNU tooling and was bought by Red Hat. That is a relevant background for the problem: Cygnus sold support and integration around software everybody already had, and the security event problem is also one of making other people's output useful.",
      sourceNote:
        "Founder attributions vary widely across sources and are not reconciled here; Daly's prior role is the one detail consistently reported.",
    },
  ],
  timeline: [
    {
      year: 2003,
      title: "A visionary in a quadrant with no leaders",
      detail:
        "Gartner placed it as a visionary in its IT security management assessment that year - in which nobody at all was placed as a leader. The category was too new for anyone to have led it, which is the clearest possible statement of how early this was.",
    },
    {
      year: 2008,
      title: "The only one",
      detail:
        "It listed on NASDAQ on 14 February, the only Silicon Valley company to do so that year, in the middle of the financial crisis. Tom Reilly became chief executive the same year.",
    },
    {
      year: 2013,
      title: "Ten years a leader",
      detail:
        "By May it had been in the leaders' section of the SIEM Magic Quadrant for ten consecutive years - a decade at the top of a category it had been called visionary for inventing.",
    },
  ],
  products: [
    { name: "ESM", what: "The Enterprise Security Manager: normalise every event into one schema, then run correlation rules across the combined stream. The normalisation is the unglamorous half and the reason the correlation is possible at all." },
    { name: "Connectors", what: "The parsers for each source device, and the actual moat. Supporting hundreds of products' log formats is years of tedious work that a competitor must repeat in full, and it is why incumbency in this category is durable." },
    { name: "Logger", what: "Long-term storage of the raw events for compliance and investigation, sold alongside the correlation engine because auditors and analysts want different things from the same data." },
    { name: "Threat detection and SOAR", what: "Later additions including automated response, some of it acquired - the same consolidation every vendor in this market has made." },
  ],
  innovations: [
    {
      title: "Normalising before analysing",
      detail:
        "Deciding that every event from every device would be translated into one schema before anything looked at it is the architectural commitment the product rests on. It is expensive, it must be maintained for every device that ever changes its log format, and it is what allows a rule to reason about a firewall and a directory server in the same sentence.",
    },
    {
      title: "Connector coverage as the real product",
      detail:
        "The correlation engine is the thing customers buy and the connector library is the thing that keeps them. Any competitor can write a rules engine; nobody wants to re-parse four hundred devices. It is a moat made entirely of work nobody enjoys.",
    },
    {
      title: "Creating a category from the buyer's side",
      detail:
        "Being called a visionary in a quadrant with no leaders is what genuine category creation looks like on an analyst's chart: the buyers had the problem, the analysts had the segment, and nobody had yet built something they were willing to call finished.",
    },
    {
      title: "Selling to the organisations with the worst problem first",
      detail:
        "The strategy was high-end accounts in retail and financial services - the sectors with the most regulatory obligation and the most to lose. Starting where the pain is greatest funds the engineering, and it also sets the product's shape permanently: this was never going to be software a small company could run.",
    },
  ],
  markets: [
    "Large enterprises and government, with a bias toward regulated sectors from the beginning. It reported over a thousand customers before the HP acquisition, and its installed base is the reason the product has survived three subsequent changes of owner.",
    "Its competitors were the other early SIEM vendors and, structurally, the opposite architecture - which this timeline records at Splunk. Later entrants including the cloud-native platforms compete on cost of ingestion, which is the axis a normalise-everything design is least comfortable on.",
  ],
  analyst: [
    "Ten consecutive years in the leaders' section of the SIEM Magic Quadrant is among the longest runs in any security category, and it covers exactly the period between the category's invention and its commoditisation.",
    "The current position is harder to state, because what is assessed now is a product line inside a large software portfolio rather than a company. That is the honest end of this entry: the technology is still sold, still deployed and still maintained, and there has been nobody whose primary business it is since 2010.",
  ],
};
