// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - PortersFiveForce and MatrixBCG: the first product was the HCL 8C 8-bit
//     microcomputer, launched 1978
//   - Wikipedia (HCLTech): revenue Rs131,674 crore, about US$14B (2026);
//     Roshni Nadar Malhotra chairperson, C Vijayakumar chief executive; the
//     product list carried today - Notes/Domino, AppScan, Connections,
//     Commerce, BigFix, Unica, Sametime, WebSphere Portal, Ingres, Actian
//   - companieshistory: around 219,000 employees across 60 countries; third
//     largest India-based IT services firm by revenue and market capitalisation;
//     serving 250 of the Fortune 500
//   - Bharatpedia: control runs through Vamasundari (Delhi), owned by Shiv
//     Nadar, which holds the majority of most HCL group companies
//
// *** BODY READ AFTER DRAFTING, AND IT IS COMPREHENSIVE. It has the FERA
// context and IBM's exit, the 250 computers, the barsaati and the calculators,
// the 1978/1983/1988 engineering, NIIT and its reasoning, the naming chain
// through HCL Overseas and HCL Consulting, the 2018/2019 IBM transaction with
// all seven products, THE ARC ITSELF - a company founded because IBM left now
// owning what IBM bought Lotus for - Roshni Nadar Malhotra as the first woman
// to chair a listed Indian IT company, and the founder-roster dispute left
// visible rather than resolved.
//
// RESEARCH FOUND VERY LITTLE THE BODY LACKS, and this manifest says so rather
// than padding. What follows is structure, the model name, current scale, and
// one structural observation the body does not make. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const hclProfile: VendorProfile = {
  slug: "hcl",
  foundings: [],
  timeline: [
    {
      year: 1978,
      title: "The HCL 8C",
      detail:
        "The machine had a name, which is worth recording: not a prototype or a programme but a product, designed and built in a country that had almost no computers to learn from and no supplier willing to sell the parts freely.",
    },
    {
      year: 1991,
      title: "Fifteen years of hardware before the pivot",
      detail:
        "The software services business was spun out after the company had spent a decade and a half building machines. The hardware business is the one that has since faded; the arm created to do something else is what carries the name today. That sequence - founding business superseded by a later one - recurs across this timeline, and it is rarely planned.",
    },
  ],
  products: [
    { name: "IT and engineering services", what: "Application development, infrastructure management and product engineering delivered globally - the bulk of the revenue and the business most people mean by the name." },
    { name: "HCLSoftware", what: "Owned products rather than services: Notes and Domino, AppScan, BigFix, Unica, Commerce, Connections and others, all acquired from IBM. This is the unusual part, discussed below." },
    { name: "Digital and cloud consulting", what: "Migration, data platform and artificial intelligence work sold to the same customers as the services business, at higher rates." },
  ],
  innovations: [
    {
      title: "An Indian services firm that owns products",
      detail:
        "The large Indian technology companies are services businesses: they build and run software other companies own. This one bought a portfolio outright and now maintains, sells and develops it, which means carrying roadmaps, support obligations and the licence revenue of an installed base rather than billing for time. It is a materially different business inside the same company, and it is rare among its peers.",
    },
    {
      title: "Funding the real product with an unrelated one",
      detail:
        "Selling calculators to pay for building computers is a pattern this timeline records more than once - EMC sold office furniture before it sold memory, and Veeam was funded for over a decade by a sideline that outgrew its parent. The common shape is a founder who knows what they want to build and finds something sellable to fund it, which is what venture capital replaced and what its absence requires.",
    },
    {
      title: "Building the workforce as infrastructure",
      detail:
        "The training institute described above was not a product line but a precondition. That framing - people as a supply chain problem rather than a hiring problem - is why the Indian services industry could scale at the rate it did, and it appears again at Stefanini elsewhere on this timeline, arrived at independently.",
    },
  ],
  markets: [
    "Around two hundred and fifty of the Fortune 500 and six hundred and fifty of the Global 2000, served from sixty countries by roughly 219,000 people, at about $14B of annual revenue - the third largest India-based services firm by revenue.",
    "It competes with the other large Indian services firms, with the global consultancies, and - uniquely among its Indian peers - with software vendors, because it now sells products they compete against.",
  ],
  analyst: [
    "Assessed alongside the other large offshore services providers on delivery scale, vertical depth and pricing, with the software portfolio treated as a separate business inside the same reporting entity.",
    "The question worth watching is whether owning the products turns out to have been the right trade. Acquired software carries maintenance obligations to customers who did not choose the new owner, and the portfolio was bought precisely because its previous owner no longer wanted it. Being a good steward of software somebody else gave up on is a specific competence, and the evidence on it accumulates slowly.",
  ],
};
