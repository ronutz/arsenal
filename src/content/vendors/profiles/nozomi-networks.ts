// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against:
//   - SiliconANGLE (9 Sept 2025): Mitsubishi Electric acquiring Nozomi for
//     $883M, to close by year end, Nozomi continuing as an independent
//     subsidiary under its own brand
//   - Nozomi press release (29 Jan 2026): acquisition COMPLETED; Leader in the
//     Gartner Magic Quadrant for CPS Protection Platforms and in the Forrester
//     Wave for IoT Security; the only Customers' Choice in Gartner's Voice of
//     the Customer for CPS; 2025 launches of Arc and Vantage IQ; expanded
//     partnerships including Schneider Electric, Hitachi Cyber and Nvidia
//   - Nozomi blog (2026 Gartner Critical Capabilities): highest scores in all
//     FOUR use cases; and its own statement that "many of them including
//     Johnson Controls, Mitsubishi Electric and Schneider Electric are Nozomi
//     investors"
//   - Nozomi product pages: Guardian, Guardian Air, Arc, Vantage, Central
//     Management Console, Smart Polling
//
// PRICE: the body says "about $1B"; the reported figure is $883M. Both are
// given, since the rounding is defensible and the specific number is better.
//
// THE BODY ALREADY ARGUES the passive-discovery constraint, the founders'
// backgrounds, the Capdevielle arrangement, the acquisition and - at length -
// the neutrality question that runs to CompTIA, Kyndryl and Equinix. This
// profile adds the product architecture, the analyst record, and ONE FACT that
// sharpens the body's own argument.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const nozomiProfile: VendorProfile = {
  slug: "nozomi-networks",
  foundings: [
    {
      company: "Nozomi Networks",
      year: 2013,
      place: "Switzerland",
      founders: ["Andrea Carcano", "Moreno Carullo"],
      story:
        "Two people with exactly complementary halves of the problem: one with industrial security engineering at an energy company and published research on SCADA malware, the other with a doctorate in artificial intelligence and a seat on the committee that writes security standards for power system communications. Industrial security needs somebody who understands plants and somebody who understands anomaly detection, and it is unusual to get both in the same room at the start.",
    },
  ],
  timeline: [
    { year: 2013, title: "Founded in Switzerland", detail: "With European operations in Mendrisio and a later headquarters in San Francisco." },
    { year: 2016, title: "A commercial organisation", detail: "Edgard Capdevielle brought in to build the go-to-market while the founders stayed on the product - an arrangement that ran for about a decade." },
    { year: 2024, title: "Guardian Air", detail: "A wireless spectrum sensor, on the observation that a device can talk to a control system without ever appearing on the wired network - and therefore without appearing in any inventory built from wired traffic." },
    { year: 2025, title: "Arc, Vantage IQ, and the offer", detail: "Automated response in operational environments and a private AI assistant, in the same year Mitsubishi Electric offered $883M for the company on 9 September." },
    {
      year: 2026,
      title: "Completed, on 29 January",
      detail:
        "The company continues under its own brand as an independent subsidiary. In the same period it was named a Leader in Gartner's Magic Quadrant for cyber-physical systems protection for the second consecutive year, with the highest scores in all four critical-capability use cases.",
    },
  ],
  products: [
    { name: "Guardian", what: "The passive network sensor, formerly SCADAguardian: it reads the traffic already on the wire, builds the asset inventory from what it hears, learns what normal looks like, and reports deviation. Nothing is sent to the devices." },
    { name: "Guardian Air", what: "A wireless spectrum sensor. A rogue device on a rooftop or in a vehicle never touches the wired network, so a wired-only inventory cannot see it - this listens to the radio instead." },
    { name: "Arc", what: "An endpoint sensor for the machines that can carry one, extending visibility to where network traffic alone cannot reach, and from 2025 automating response in environments where automated response has historically been unthinkable." },
    { name: "Vantage", what: "The cloud console tying network, wireless and endpoint together across sites - a single view for organisations whose plants are in dozens of countries." },
    { name: "Smart Polling", what: "Selective, carefully-shaped active queries for the cases where passive listening genuinely cannot answer the question. The interesting part is how narrowly it is scoped, because the entire product philosophy exists to avoid exactly this." },
    { name: "Asset and Threat Intelligence", what: "Feeds identifying industrial equipment and known vulnerabilities in it - the reference data that turns an observed device into an assessed one." },
  ],
  innovations: [
    {
      title: "Inventory by listening",
      detail:
        "Building an asset register from observed traffic rather than from queries is the founding constraint turned into a technique. It also produces something a scan cannot: not just what exists, but what it normally talks to, which is the baseline everything else depends on.",
    },
    {
      title: "Extending to the spectrum",
      detail:
        "Once the inventory is built from what the network hears, the obvious gap is anything that communicates without joining the network. Listening to the radio closes it, and it is the same architectural logic applied one layer out.",
    },
    {
      title: "Automating response where automation was forbidden",
      detail:
        "Automated containment is routine in enterprise security and has been close to unthinkable in operational technology, because the wrong automated action stops production. Shipping it at all is a claim about confidence in the baseline, and it is the hardest thing in this product category to get right.",
    },
    {
      title: "Predictability as the exploitable property",
      detail:
        "The advantage of industrial networks is that they are boring. A production line does the same thing every day, so a deviation carries information that the same deviation on an office network would not. The whole detection model rests on that, and it is why the technique does not transfer cleanly to IT.",
    },
  ],
  markets: [
    "Critical infrastructure: energy, pharmaceuticals, utilities, manufacturing, transport - the environments where the consequence of a security failure is physical. Its partner list includes Schneider Electric, Hitachi Cyber and Nvidia, and its compliance framing runs through the industrial standards rather than the IT ones.",
    "Its competitors are the other OT security specialists and the large security platforms extending downward into operational environments, and its differentiator is depth in industrial protocols rather than breadth across an enterprise.",
  ],
  analyst: [
    "A Leader in Gartner's Magic Quadrant for CPS protection platforms in both 2025 and 2026, the only vendor named a Customers' Choice in the corresponding Voice of the Customer, and a Leader in Forrester's IoT security assessment. In the 2026 critical capabilities evaluation it took the highest score in all four use cases rather than in one or two, which is the distinction worth noting - it indicates a platform not tuned to a single deployment shape.",
    "One fact belongs beside the ownership question raised above, because it sharpens it. Mitsubishi Electric was not a new arrival: the company's own materials named it, alongside Johnson Controls and Schneider Electric, as an existing investor before the acquisition. The buyer was already on the cap table. Whether that makes the change smaller or the original arrangement larger is exactly the question, and it is not one an announcement can settle.",
  ],
};
