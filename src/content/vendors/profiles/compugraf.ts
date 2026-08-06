// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - 99jobs company page: partnerships named as ***Check Point, F5,
//     Forescout, Citrix, AlgoSec and OneTrust***, among others; more than 300
//     active clients nationally
//   - LinkedIn company page: four decades in market, 100% Brazilian, 150+
//     certified staff, 500+ companies served over twenty years; Avenida
//     Angélica 2346, Consolação, São Paulo
//   - Econodata / Serasa CNPJ records: Compugraf Serviços Ltda registered
//     06/04/1982; Compugraf Telecom 23/09/1998; Compugraf Segurança Digital
//     02/06/2010; Compugraf Segurança da Informação 11/05/2021 - a group of
//     several legal entities rather than one company; ISO 9001 certified
//
// *** RESEARCH WAS THIN, AND THIS MANIFEST SAYS SO. This is a privately held
// mid-sized Brazilian firm with almost no published history: no filings, no
// press archive, no founder interviews located. What exists is corporate
// registry data, a LinkedIn description and a jobs page. Nothing here should be
// read as a researched account comparable to the listed companies on this
// timeline.
//
// BODY READ AFTER DRAFTING. It is short and it already has everything research
// produced: the name etymology, THE FOSSIL-NAME PATTERN stated better than
// planned here, the shape of the security business, the scale figures, and THE
// 2024 RENAME TO CG ONE including the observation that it keeps the initials
// while abandoning the word.
//
// The one thing it does not say is what the company actually sells. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const compugrafProfile: VendorProfile = {
  slug: "compugraf",
  foundings: [],
  timeline: [
    {
      year: 1982,
      title: "A group, not a company",
      detail:
        "The original registration dates from April, and several further legal entities followed - a telecommunications arm in 1998, a digital security company in 2010, an information security company in 2021. That structure is ordinary in Brazil and worth understanding: a customer contracting with one of these names is contracting with one company inside a group, not with the forty-year-old business the brand refers to.",
    },
  ],
  products: [
    { name: "Perimeter and network security", what: "Firewall, segmentation and access control, built on Check Point and Forescout - the traditional core of an integrator's practice, and the part with the longest customer relationships." },
    { name: "Application delivery and security", what: "F5, for load balancing and application-layer protection. This is the practice that requires the most specialist knowledge to sell and the most to support, which is why relatively few integrators carry it well." },
    { name: "Policy and change management", what: "AlgoSec, for managing firewall rule sets across an estate. A product that exists because large organisations accumulate thousands of rules nobody remembers the reason for - which is the actual condition of most networks." },
    { name: "Privacy and governance", what: "OneTrust, for data protection compliance. The addition that dates the portfolio: Brazil's general data protection law made privacy a purchasing decision rather than a legal opinion, and integrators added practices accordingly." },
  ],
  innovations: [
    {
      title: "The partner list is the strategy",
      detail:
        "An integrator has no products of its own, so its vendor roster is the most honest description of what it does. This one reads as perimeter, application delivery and compliance rather than endpoint, detection or cloud-native - a practice built around protecting the boundary and the application, for organisations with substantial estates and regulators to answer to. Reading a partner list this way tells you more than any positioning statement.",
    },
    {
      title: "Staying local when the multinationals arrived",
      detail:
        "The Brazilian market has been served since the 1990s by global integrators and by the vendors' own channels. A firm of this size remaining independent and describing itself as wholly Brazilian is a position rather than an accident - the argument being that a customer wanting somebody who answers the telephone in the same time zone, under the same contract law, will pay for it.",
    },
  ],
  markets: [
    "Large Brazilian organisations in industry, financial services and energy, reported at more than three hundred active clients and over five hundred served across two decades, with around 150 staff.",
    "It competes with the global integrators operating in Brazil, with the distributors' own service arms, and with the vendors selling direct - the last being the standing risk in this business, since every partner is also a potential competitor.",
  ],
  analyst: [
    "No analyst coverage exists for a private firm of this size, and no financial statements are public. What can be verified is longevity, an ISO 9001 certification, and a vendor roster that requires the certifications those vendors demand.",
    "The observation worth recording is about the category rather than the company. A forty-year-old independent integrator is an increasingly unusual object: the economics push toward consolidation into the distributors and the global services firms, and this timeline records several that took that route. Remaining independent at this scale means either a defensible specialism or an owner who does not want to sell, and from outside the two look identical.",
  ],
};
