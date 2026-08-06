// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - gtia.org/about-us: ABCD was formed in 1982 by hardware and software
//     vendors to encourage collaboration with the people who bought from them;
//     as the industry grew there was increased need for qualified tech support
//     "however, that type of training just did not exist"; COMPAQ COMPUTER
//     PARTNERED WITH ABCD to develop a certification for tech support
//     professionals, released as A+ in 1993. (The trade association side now
//     operates as GTIA, which is why this history sits on gtia.org.)
//   - HiTech Institute: ABCD was created by representatives of FIVE
//     microcomputer dealerships
//   - Wikipedia: all CompTIA certifications EXPIRE THREE YEARS after
//     obtainment, and reissuance requires REPURCHASE AND RETESTING; the entity
//     is now described as a for-profit trade association owned by H.I.G.
//     Capital and Thoma Bravo; headquarters Downers Grove, Illinois
//
// *** BODY READ AFTER DRAFTING, AND IT IS EXCEPTIONAL. It has neutrality as
// the founding condition, the A+ logic, the Cisco contrast (including the four
// vendors whose training the site's author delivers), the CTT+ retirement on
// 31 October 2023, the 2024 acquisition and split, the practitioner objection
// quoted, an explicit refusal to resolve it, and Thoma Bravo recurring across
// four entries.
//
// It raises the private-equity question without explaining WHAT MAKES A
// CERTIFICATION BODY A PRIVATE EQUITY ASSET. That is what this adds. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const comptiaProfile: VendorProfile = {
  slug: "comptia",
  foundings: [],
  timeline: [
    {
      year: 1982,
      title: "Five dealerships",
      detail:
        "The association was formed by representatives of five microcomputer dealerships, to encourage collaboration between the manufacturers and the people selling their products. A group that small setting out to write standards for an industry is either presumptuous or early, and it turned out to be early.",
    },
    {
      year: 1993,
      title: "A vendor helped build the vendor-neutral standard",
      detail:
        "The dealers' problem was that customers needed people who could install and repair what had been sold to them, and that training did not exist. Compaq Computer partnered with the association to develop a certification for support technicians, and A+ was the result. The first credential that belonged to no manufacturer was co-developed with one - which is less contradictory than it looks, since a manufacturer selling through dealers needs those dealers to have competent staff more than it needs another badge of its own.",
    },
  ],
  products: [
    { name: "A+", what: "Support fundamentals, and for three decades the first certification a very large number of technicians ever held. Its significance is that it describes a job rather than a product line." },
    { name: "Network+ and Security+", what: "The same logic applied upward. Security+ in particular became a hiring filter in United States government contracting, which gave a vendor-neutral credential something close to regulatory force." },
    { name: "The research programme", what: "Dozens of industry studies a year, which is the part of a trade association's output that nobody buys and everybody quotes." },
    { name: "Creating IT Futures", what: "The philanthropic arm, training and certifying people entering the industry from outside it - low-income adults and returning service personnel. Worth listing among the products because for the people it reaches it is the product." },
  ],
  innovations: [
    {
      title: "Neutrality as a consequence, not a stance",
      detail:
        "Five dealers each selling several manufacturers' equipment need one technician who can work on all of it. Neutrality was not adopted as a principle; it fell out of who was in the room. That is the strongest kind of neutrality to have, because it does not depend on anybody continuing to believe in it - and it is precisely what changes when the room changes.",
    },
    {
      title: "The three-year expiry, which is the business model",
      detail:
        "Certifications lapse three years after they are earned, and renewal means paying again and, absent continuing education credits, sitting the exam again. That converts a one-time purchase into a subscription held by millions of people who need it to stay employed. It is defensible on the merits - the material genuinely dates - and it is also, precisely, what makes a certification body an attractive asset to a financial buyer. The question the entry above leaves open has a commercial shape as well as an ethical one.",
    },
    {
      title: "The harder authoring problem",
      detail:
        "Writing objectives against one supplier's implementation is a documentation exercise; writing them against a task performed on equipment from a dozen suppliers is not. The neutral credential costs more to maintain, dates faster, and requires somebody to keep deciding what the job now consists of - which is the work that is easiest to quietly stop doing.",
    },
  ],
  markets: [
    "Individuals entering and progressing through technology support, networking and security roles, in more than a hundred and twenty countries, with several million certifications awarded. The buyer is usually the candidate or their employer's training budget rather than a procurement department, which is a different commercial relationship from almost everything else on this timeline.",
    "The trade-association side of the organisation now continues separately as GTIA, serving the channel businesses the original ABCD was formed for. The certification business and the membership body that created it are, since 2025, no longer the same organisation.",
  ],
  analyst: [
    "Its certifications are accredited to international standards and referenced in United States federal workforce requirements, which is a stronger form of external validation than analyst coverage and harder to lose.",
    "The measure that will settle the open question is narrower than the debate around it, and it is already observable: renewal economics. If continuing-education pathways widen and renewal stays cheap, the mission argument held. If renewal becomes the primary revenue line and the pathways narrow, the objection was correct. That is checkable annually by anybody holding the credential, which is a better test than any assurance.",
  ],
};
