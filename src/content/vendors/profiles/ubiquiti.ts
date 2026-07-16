// ============================================================================
// UBIQUITI - enterprise features at prosumer prices. Knowledge-based, dates
// well-documented (2026-07-16): founded 2005 by Robert Pera (ex-Apple
// Wi-Fi engineer); airMAX long-range fixed wireless arms the WISP world;
// UniFi (2011+) brings the controller model to prosumer/SMB networks; IPO
// October 2011; famously minimal sales/marketing, community-driven,
// R&D-centric model with Pera holding a large majority. Incidents on the
// public record, kept factual: the 2015 disclosure of a ~$46.7M
// business-email-compromise fraud; the 2020-21 insider data-extortion case
// (a then-employee, convicted and sentenced in 2023). The disruption
// thesis: hardware near cost, software the differentiator, the community
// the sales force.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const ubiquitiProfile: VendorProfile = {
  slug: "ubiquiti",
  foundings: [
    {
      company: "Ubiquiti",
      year: 2005,
      place: "San Jose, California",
      founders: ["Robert Pera"],
      story:
        "Robert Pera left Apple's Wi-Fi group convinced that radio performance the big vendors reserved for enterprise price tags could ship at a fraction of the cost - and that the unserved buyers were everywhere: wireless ISPs bridging valleys, integrators wiring small businesses, enthusiasts who read datasheets for fun. airMAX armed the world's WISPs; UniFi brought controller-managed networks to anyone with two hundred dollars and a browser. Almost no sales force, marketing by community - a model the industry said couldn't work, run by a founder-majority company that made it work anyway.",
    },
  ],
  timeline: [
    { year: 2007, title: "airMAX and the WISP world", detail: "Long-range 802.11-based fixed wireless at radical price points - the product line that connected the places the carriers skipped, and built Ubiquiti's first devoted community." },
    { year: 2011, title: "UniFi - and the IPO", detail: "The UniFi line debuts the thesis in full: capable access points managed by free controller software, no per-AP licensing - and the company goes public the same year, still spending almost nothing on sales." },
    { year: 2015, title: "The $46.7 million lesson", detail: "Ubiquiti discloses a business-email-compromise fraud: attackers impersonating executives walked ~$46.7 million out through finance workflows. It becomes the canonical BEC case study - process, not firewalls, as the breached layer.", sourceNote: "Per the company's own SEC disclosure, 2015." },
    { year: 2021, title: "The insider case", detail: "A data-extortion incident is revealed to have been an inside job: a then-employee stole data, posed as an anonymous attacker, and demanded ransom; he was convicted and sentenced in 2023. For a security-minded audience, the uncomfortable pairing with 2015 stands: the hardest threats came from mail and from within.", sourceNote: "Per the DOJ prosecution record, sentencing 2023." },
    { year: 2022, title: "The prosumer default", detail: "UniFi's ecosystem - gateways, switches, cameras, door access - becomes the default answer for small networks and a rising share of serious ones; the community forums remain the sales force." },
  ],
  products: [
    { name: "UniFi", what: "Controller-managed APs, switching, gateways, and cameras - enterprise-style management without per-device licensing." },
    { name: "airMAX / airFiber", what: "The long-range fixed-wireless lines that arm WISPs worldwide." },
    { name: "EdgeMAX", what: "The routing line (EdgeRouter heritage) that put serious packet forwarding at hobbyist prices." },
  ],
  innovations: [
    { title: "The business-model disruption", detail: "Hardware near cost, software free, community as marketing - Ubiquiti proved a networking vendor could scale on product-led growth alone, and reset price expectations for a whole tier of the market." },
    { title: "Management as the product", detail: "UniFi's single-pane controller for sub-enterprise networks anticipated the cloud-managed model the big vendors later sold upmarket - licensing excluded." },
  ],
  markets: [
    "Ubiquiti dominates prosumer and SMB networking and the WISP equipment world - the contemporary proof that distribution models, not just silicon, are where networking competition happens.",
  ],
  analyst: [
    "Included among the contemporaries for the model as much as the gear - and, kept factual, its two incidents are teaching material this site's security readers should know cold: BEC beats firewalls, and insiders beat perimeter thinking.",
  ],
};
