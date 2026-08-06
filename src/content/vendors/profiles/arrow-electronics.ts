// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - arrow.com/company/overview/history and companieshistory.com: by the 1940s
//     Arrow sold new radios from RCA, GE and Philco alongside surplus parts
//     retailed over the counter from a PARTS DEPARTMENT AT THE BACK OF THE
//     STORE; the first manufacturers to franchise Arrow were RCA and Cornell
//     Dubilier; the business was INCORPORATED AS ARROW ELECTRONICS, INC. IN
//     1946; in the early 1950s, with more franchises and a small field sales
//     organisation, it began selling parts to INDUSTRIAL customers
//   - Same sources: under Kaufman the company completed over fifty acquisitions
//     of electronics distributors, including Ducommun (Kierulff), LEX
//     (SCHWEBER), Zeus, Anthem, Bell and Wyle in the United States, Spoerle in
//     Germany, Silverstar in Italy and CAL in Hong Kong and China
//
// *** BODY READ AFTER DRAFTING. IT OWNS THE FIRE COMPLETELY AND HANDLES IT WITH
// THE RESTRAINT IT REQUIRES - the date, the thirteen dead, Waddell surviving
// because of a stock split, Lynn Glenn's words, the recovery, and a closing
// paragraph on what an organisation is that is among the best writing on this
// site. THIS PROFILE DOES NOT RE-NARRATE ANY OF IT.
//
// It also has Radio Row, Goldberg, the neighbours, the 1968 purchase, the lead
// reclamation business, Cramer in 1979, Kierulff's economics and the comparison
// with the other distributors.
//
// What is added: the fifteen years between the shop and the distributor, and
// what became of one of the neighbours. ***
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const arrowProfile: VendorProfile = {
  slug: "arrow-electronics",
  foundings: [],
  timeline: [
    {
      year: 1946,
      title: "Incorporated under the name it still uses",
      detail:
        "Eleven years after the shop opened. By then it was selling new radios from RCA, General Electric and Philco at the front, and surplus parts over the counter from a department at the back - and the parts department was the part with a future.",
    },
    {
      year: 1950,
      title: "The pivot that actually made it a distributor",
      detail:
        "In the early fifties, with franchises from manufacturers and a small field sales team, it began selling components to industrial customers rather than to hobbyists walking in off the street. That is the change from shop to distributor, and it happened roughly fifteen years before the purchase that is usually treated as the company's beginning.",
    },
    {
      year: 1991,
      title: "One neighbour buys another",
      detail:
        "Among the fifty-odd distributors acquired during the consolidation was Schweber Electronics, through its parent Lex. Two shops on the same Manhattan street in the 1930s, and one of them eventually bought the other - which is the tidiest possible ending to the Radio Row story and took about fifty-five years to arrive.",
      sourceNote: "Schweber appears in the company's own list of acquisitions as Lex (Schweber); the precise year of that transaction is not stated in the sources consulted.",
    },
  ],
  products: [
    { name: "Electronic components", what: "Semiconductors, passives and interconnect sold to the manufacturers who build things - the original business, still the larger one, and one where the customer is a design engineer rather than a purchasing department." },
    { name: "Enterprise computing solutions", what: "Servers, storage, software and cloud sold through resellers and integrators. A different customer, a different sales motion, and the reason this appears on a timeline about networks at all." },
    { name: "Design and engineering services", what: "Helping customers choose and integrate components before they buy them, which is what distinguishes a components distributor from a warehouse: the specification happens in the distributor's office." },
    { name: "Global logistics and supply chain", what: "The unglamorous half - forecasting, buffering shortages, managing end-of-life parts. In semiconductors this is not a service around the product; during a shortage it IS the product." },
  ],
  innovations: [
    {
      title: "Selling to the engineer before the purchase order exists",
      detail:
        "A components distributor that helps design a board is present at the moment the parts are chosen, which is months or years before anything is bought and long before a price is negotiated. That position is worth more than any discount, and it is why this business could never be reduced to logistics.",
    },
    {
      title: "Consolidation as an operating method",
      detail:
        "Over fifty acquisitions across the United States, Germany, Italy and China, run on a consistent principle: keep the customer relationships and the franchises, close the duplicated infrastructure. The entry above gives the arithmetic of one such deal, and it applied broadly - which is what turns a series of purchases into a strategy rather than a spending habit.",
    },
    {
      title: "Two businesses that share almost nothing",
      detail:
        "Components and enterprise computing sit in one company and have different customers, different margins, different cycles and different competitors. Holding both is defensible as diversification and questionable as focus, and the argument has been running inside the industry for thirty years without resolving.",
    },
  ],
  markets: [
    "Original equipment manufacturers, contract manufacturers and design engineers on the components side; resellers, integrators and managed service providers on the enterprise side. The company sits in the Fortune 500 and serves customers in most industrialised countries.",
    "It competes with Avnet in components - a neighbour from the same street in the 1930s and still its principal rival ninety years later - and with the broadline technology distributors on the enterprise side.",
  ],
  analyst: [
    "Component distribution is judged on franchise breadth, design-win registration and inventory turns, and the enterprise business on vendor authorisations and partner reach. They are separate assessments of the same company, which is itself the observation.",
    "The rivalry with Avnet is worth noting for how old it is. Two businesses founded within a few doors of each other during the Depression are still, ninety years later, the two largest electronics component distributors in the world and still measured against one another. Very little else in this industry has been stable enough to sustain a rivalry that long.",
  ],
};
