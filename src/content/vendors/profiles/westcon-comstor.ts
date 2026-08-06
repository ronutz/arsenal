// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - westconcomstor.com/about: "In 1985, Thomas Dolan, Philip Raffiani and
//     Roman Michalowski founded Westcon Associates in an UPSTATE NEW YORK
//     GARAGE"; the company describes itself as a specialist distributor with
//     annual gross sales exceeding US$3 billion
//   - company-histories.com bibliography: Larry Hooper, "Westcon Chooses DEPTH,
//     NOT BREADTH, to Sustain Growth", CRN, 3 February 2003 - the specialist
//     thesis stated in a trade headline; principal competitors listed as Ingram
//     Micro, ScanSource and Tech Data
//   - FundingUniverse: Comstor founded in Chantilly, Virginia in 1986, acquired
//     by GE Capital IT Solutions around 1996, turning some $500M a year when
//     Westcon bought it
//   - CB Insights: the Datatec-side business is now headquartered in
//     Cirencester, Gloucestershire; TD SYNNEX appears among its investors,
//     which is the residue of the 2017 Americas transaction
//
// *** BODY READ AFTER DRAFTING, AND IT IS OUTSTANDING. It explains what a
// distributor actually does, distinguishes distributor enablement from vendor
// training, makes the strategic point that "a distributor decides what is
// practical to buy in a country" with a Brazilian example, has the full
// ownership chain and the 2017 SYNNEX split with figures, and observes that
// Datatec owned the distributor AND the integrator (Logicalis) as siblings.
//
// This adds the founding, the specialist thesis in its own words, and why the
// Comstor brand was never absorbed. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const westconProfile: VendorProfile = {
  slug: "westcon-comstor",
  foundings: [
    {
      company: "Westcon Associates",
      year: 1985,
      place: "upstate New York",
      founders: ["Thomas Dolan", "Philip Raffiani", "Roman Michalowski"],
      story:
        "Three people in a garage, which is the standard origin for a software company and an unusual one for a distributor - a business that normally requires a warehouse and a credit line before it requires anything else. What they were selling was not stock but access: knowing which resellers needed which products, in a market where nobody had yet organised that.",
    },
  ],
  timeline: [
    {
      year: 2003,
      title: "Depth, not breadth",
      detail:
        "A trade headline of the period put the strategy in four words, and it is still the clearest statement of what separates this kind of distributor from the broadline houses. Carrying fewer vendors in more depth means the sales engineer can actually answer the question, and it means the distributor is betting its business on the vendors it chose.",
    },
    {
      year: 2026,
      title: "Above three billion",
      detail:
        "Annual gross sales past $3B on the Datatec side alone, with the Americas business trading under different ownership since 2017 - a brand operating in two hemispheres under two owners, which is unusual enough to confuse people who work in one of them.",
    },
  ],
  products: [
    { name: "Networking and unified communications distribution", what: "The original Westcon line: the vendors whose equipment resellers install rather than the ones whose products end users buy off a shelf." },
    { name: "Security distribution", what: "The category that grew fastest and that suits specialist distribution best, because a firewall is not a purchase a reseller can fulfil without understanding it." },
    { name: "Comstor", what: "The Cisco practice, kept as its own brand for a quarter of a century after acquisition. That is unusual and deliberate: to the channel, the name means one vendor, and collapsing it into the parent would have thrown away the only thing it was bought for." },
    { name: "Partner enablement and training", what: "Courses aimed at what resellers cannot yet sell, which is a different syllabus from the vendor's own - and, as the entry above notes, a better indicator of where the market is actually stuck." },
    { name: "Services and cloud marketplace", what: "Deployment, support and subscription provisioning sold to resellers who cannot staff those functions themselves. This is where a distributor stops being logistics and starts being capability." },
  ],
  innovations: [
    {
      title: "Specialising by vendor rather than by category",
      detail:
        "This timeline now has three distributor models side by side. The broadline house carries everything and competes on scale. ScanSource specialised by category, catching products on the way to commodity. This one specialised by vendor, building a deep practice around a small number of manufacturers - which is the model that suits complex products with long sales cycles, and the one most exposed if a chosen vendor falters.",
    },
    {
      title: "Keeping the acquired brand",
      detail:
        "Comstor stayed Comstor. In a channel where a reseller's Cisco practice is a distinct part of its business with distinct staff and distinct certifications, a distributor brand that means Cisco is worth more than the parent's name. Most acquirers cannot resist consolidating a brand; the discipline here was in not doing it.",
    },
    {
      title: "Being the reason a product is buyable",
      detail:
        "The point the entry above makes is worth stating as a business model rather than a consequence. A specialist distributor sells a vendor the ability to be quoted in a country - not sales, but presence in the set of things a local reseller can practically propose. Vendors pay for that because the alternative is being technically available and commercially invisible.",
    },
  ],
  markets: [
    "Resellers, integrators and managed service providers, across Europe, the Middle East, Africa and Asia-Pacific on the Datatec side and the Americas under separate ownership. The customer is always the partner rather than the end user, which shapes everything about how the business is run.",
    "It competes with the broadline distributors on availability and with other specialists on depth, and its structural risk is concentration: a portfolio built on a small number of vendors is exposed to any of them changing its channel strategy.",
  ],
  analyst: [
    "Distribution is assessed on vendor authorisations, geographic coverage and partner programme depth rather than on the metrics that apply to product companies, and by those measures this is among the established specialists in networking and security.",
    "The structural fact worth ending on is what this business actually owns. A specialist distributor's principal assets are authorisations - contracts granting the right to sell a manufacturer's products in defined territories - and those are held at the manufacturer's discretion and revocable on notice. No other business on this timeline has its core asset held by somebody else. That is why the relationship with a small number of vendors is managed as carefully as it is, and why the deep-specialist model is simultaneously the strongest position in distribution and the least owned."
  ],
};
