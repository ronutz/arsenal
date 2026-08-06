// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - yourtechstory.com (twice, consistent): the company "has a stance against
//     doing business with government agencies and ISPs that restrict the
//     Internet", and has nonetheless been criticised for a "perceived
//     relationship to repression of freedom of speech and the transmission of
//     knowledge"; in 2009 the Yemeni government was found to be using its
//     products to track public internet usage and block applications
//   - Grokipedia: the Vista purchase at $24.75 a share was a 29% premium over
//     recent trading; Forcepoint reports over 12,000 customers across more than
//     20 industries
//   - safelogic: of Raytheon's $1.9B, some $600M took the form of an
//     intercompany loan to the joint venture
//   - altss: Raytheon contributed SureView insider-threat capability and the
//     federal clearances Websense lacked; the installed base is concentrated in
//     financial services, US federal civilian agencies and regulated industries
//   - Wikipedia: 1,800 employees (2025); revenue $658M (2019)
//
// *** BODY READ AFTER DRAFTING, AND IT IS EXCEPTIONAL. It already explains the
// filtering mechanism precisely, states the censorware criticism honestly
// ("that is not a bug that gets fixed; it is the failure mode of the entire
// approach"), names the employer-versus-state distinction AND concedes that
// "the same product served both, and it usually does", and observes that the
// defence-contractor period bought CLEARANCE rather than technology.
//
// What research adds is a DOCUMENTED INSTANCE of the abuse the body describes
// abstractly, plus the awkward fact that the company had a policy against
// exactly it. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const forcepointProfile: VendorProfile = {
  slug: "websense-forcepoint",
  foundings: [],
  timeline: [
    {
      year: 2009,
      title: "Yemen",
      detail:
        "The Yemeni government was found to be using the company's products to monitor public internet use and block applications. The company states a policy against selling to governments and providers that restrict the internet, which makes the case sharper rather than softer: a stated position did not prevent the deployment, because filtering technology reaches its end user through distributors, resellers and integrators, and a policy at the top of that chain is a document rather than a control.",
      sourceNote:
        "Reported in secondary sources rather than in company filings or regulatory findings.",
    },
    {
      year: 2013,
      title: "A 29% premium to go private",
      detail: "Vista paid well above the recent trading price - which is what a private equity buyer offers when it thinks a public company is being valued on the wrong metric.",
    },
    {
      year: 2015,
      title: "Six hundred million of it was a loan",
      detail:
        "Part of Raytheon's $1.9B took the form of an intercompany loan into the joint venture rather than a purchase of equity. That structure matters: it is a defence contractor keeping optionality about how deeply it wanted to own a commercial software business, and six years later it exercised that option by selling.",
    },
  ],
  products: [
    { name: "Web security", what: "The original filter, still the recognisable product: classify the destination, apply the policy, enforce in the path." },
    { name: "Data loss prevention", what: "Inspecting what leaves rather than what is reached, which arrived by acquisition and became the more defensible business as web filtering commoditised." },
    { name: "SureView and insider risk", what: "The Raytheon contribution: watching what authorised users do, on the reasoning that the person with legitimate access is the harder problem. It is also the capability closest to surveillance, and the company's own positioning as human-centric security is a way of describing it." },
    { name: "Next-generation firewall", what: "The Stonesoft line, bought from Intel, having previously been McAfee's - a product that has now belonged to four companies without changing much." },
    { name: "Cross-domain and government solutions", what: "Guarded transfer between classified networks of different levels, sold to defence and intelligence customers. This is the part that required the ownership the entry above describes." },
  ],
  innovations: [
    {
      title: "A policy is not a control",
      detail:
        "The company's stated refusal to sell to censoring governments is genuine and did not stop its products being used that way. Software of this kind reaches its operator through channels, and an intention held at the manufacturer does not travel down them. Any vendor whose product can restrict what people read has this problem, and stating a policy is the least effective of the available responses - though it is also the only one that costs nothing.",
    },
    {
      title: "Moving from what you reach to what you send",
      detail:
        "Web filtering asks where a user is going. Data loss prevention asks what is leaving. The second question survived the commoditisation of the first, because a classification of destinations can be bought from anybody while an understanding of a specific organisation's data cannot.",
    },
    {
      title: "Buying clearance",
      detail:
        "The observation the entry above makes is worth restating in product terms: cross-domain solutions and classified deployments are not sold by companies without cleared personnel and facilities. The defence contractor did not add much technology, and it added the only thing that opens that market.",
    },
  ],
  markets: [
    "Enterprises in regulated industries, financial services and government - reported at over twelve thousand customers across more than twenty sectors, with revenue around $658M in 2019 and roughly 1,800 staff by 2025. The installed base is concentrated where data protection is a compliance requirement rather than a discretionary purchase, which is the most durable kind of security demand.",
    "It competes with the secure web gateway vendors, the data protection specialists, and the platform suites that now bundle both - a market where the original product is a feature of somebody else's platform, which is why the company's centre of gravity moved.",
  ],
  analyst: [
    "Assessments place it among the established vendors in data protection and secure web gateway rather than at the front, and the coverage reflects a company whose product line has been assembled from four decades of purchases.",
    "The durable point is the one the entry above ends on. A commercial filtering product acquired federal clearance by acquisition, sold cross-domain solutions on the strength of it, and was then sold on to a financial owner with no such standing. The capability stayed; what moved was who was permitted to sell it, which is a reminder that in parts of this industry the licence is the asset.",
  ],
};
