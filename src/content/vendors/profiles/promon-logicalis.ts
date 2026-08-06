// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - Gazeta Mercantil via InvesteSP (18 March 2008): PromonLogicalis was
//     created with US$120 million of assets and 250 Brazilian employees, with a
//     stated goal of doubling revenue to US$500 million in three years; at the
//     time Datatec turned US$3.3B of which the Logicalis division was US$1B,
//     against Promon S.A.'s R$600 million; and - the tie worth having - THE
//     SUBSIDIARY ***TRÓPICO*** PLANNED TO DOUBLE SALES TO R$200 MILLION THAT
//     YEAR. Trópico is the Brazilian digital switching technology developed at
//     CPqD and transferred to industry; CPqD appears separately on this
//     timeline and names Trópico among its spin-outs.
//   - Promon annual report 2022s: eleven countries, 3,000+ regional staff,
//     1,400 in Brazil, 900+ clients, R$3.5 billion gross revenue, 60% of
//     revenue from clients operating in more than one country in the region,
//     ***89% coverage of regional GDP*** and 98% reach of Latin America's 500
//     largest companies
//   - Promon corporate materials: the name is formed from PROcon and MONtreal,
//     the two founding partners
//
// *** BODY READ AFTER DRAFTING, AND IT IS EXCELLENT - the employee-ownership
// model and the 1975 pension foundation, the Campos do Jordão Charter with the
// observation that a staff-owned firm must write down what it is for, the
// engineering record and client list, the 2008 joint venture, the DATATEC
// THREAD closing with "two opposite theories of who should own a company,
// operating as one business", and Operação Lava Jato handled with the correct
// scoping - engineering business, separate company, check current records.
//
// The Lava Jato handling is better than what was planned here, which had been
// to omit it. Recording that. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const promonLogicalisProfile: VendorProfile = {
  slug: "promon-logicalis",
  foundings: [],
  timeline: [
    {
      year: 1960,
      title: "The name is the two founders",
      detail:
        "PROMON is formed from PROcon and MONtreal - the American and Brazilian partners whose joint venture it was. Both eventually left, and the name kept them. Sixty-five years on, a firm owned by its own staff still trades under a word assembled from two organisations that no longer have any part in it.",
    },
    {
      year: 2008,
      title: "What the joint venture started with",
      detail:
        "One hundred and twenty million dollars of assets and two hundred and fifty Brazilian employees, with a stated aim of doubling revenue to five hundred million within three years. The asymmetry of the partners is worth noting: Datatec turned $3.3B across the group against Promon's roughly $340M, so this was a large multinational combining with a much smaller local firm and putting the local management in charge of the region.",
    },
    {
      year: 2008,
      title: "Trópico, and a thread to CPqD",
      detail:
        "Among the group's subsidiaries at the time was Trópico, the Brazilian digital telephone switching line, planning to double its sales that year. Trópico was developed at CPqD, the state telecommunications research centre that appears separately on this timeline, and transferred to industry to be manufactured - and this is one of the companies that manufactured it. The research centre designed it; a São Paulo engineering firm owned by its own employees built it.",
    },
  ],
  products: [
    { name: "Network and data centre integration", what: "Design, deployment and management of infrastructure for large enterprises and operators across Latin America - the business the joint venture was formed to run." },
    { name: "Managed services", what: "Operating what was built, on contract. The transition every integrator makes, because building is lumpy and operating is not." },
    { name: "Security and cloud practices", what: "Sold alongside the network work to the same customers, which is the natural extension for an integrator already holding the estate." },
    { name: "Promon Engenharia", what: "The wholly-owned engineering business, working in energy, mining, petrochemicals and transport. Not part of the technology joint venture, and the subject of the investigation the entry above describes." },
  ],
  innovations: [
    {
      title: "Reach measured against a continent's economy",
      detail:
        "The group reports covering some 89% of the region's gross domestic product and reaching 98% of Latin America's five hundred largest companies. Those are unusual metrics to publish, and they describe an integrator's actual position better than revenue does: what matters is not how much you sold but how much of the economy you are inside.",
    },
    {
      title: "Local management of a multinational's region",
      detail:
        "A joint venture usually means the larger partner runs it. Here the regional business kept its Brazilian leadership and its own name in the market for years afterwards. For a technology multinational entering Latin America, buying half of an established local firm and leaving it in charge is a slower route than acquisition and a considerably more durable one.",
    },
    {
      title: "Employee ownership meeting shareholder ownership",
      detail:
        "The observation the entry above closes on is worth holding onto in operational terms. A firm whose owners are its staff optimises for continuity, technical standing and the long term, because the shareholders cannot sell to anyone but each other. A listed multinational's subsidiary optimises for the quarter. Running one business on both bases is a genuine test, and it has now lasted well over a decade.",
    },
  ],
  markets: [
    "Large enterprises, telecommunications operators and public bodies across eleven Latin American countries, at around R$3.5 billion of gross revenue with roughly three thousand staff regionally and fourteen hundred in Brazil. Sixty per cent of revenue comes from clients operating in more than one country of the region, which is the whole argument for a regional integrator rather than a national one.",
    "It competes with the global integrators, the operators' own professional services arms, and the local system houses in each market - the last being the ones that understand the country but cannot follow a client across borders.",
  ],
  analyst: [
    "Integrators are assessed on vendor certifications, delivery capacity and the proportion of revenue that recurs rather than on product positions. On the regional measures the group publishes, its coverage is close to complete among large enterprises.",
    "The durable question is the one the ownership arrangement raises. Employee shareholders cannot easily exit, which produces patience and also produces a limit: capital for expansion has to come from earnings or from a partner, and the joint venture is itself the answer to that constraint. Whether the model scales beyond a region is untested, and the group has not tried.",
  ],
};
