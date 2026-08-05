// ============================================================================
// SPLIT FROM a10-kemp.ts on 2026-08-05 (PRIME). The Kemp half of the original,
// unchanged in substance.
// ============================================================================
import type { VendorProfile } from "@/content/vendors/profile-types";

export const kempProfile: VendorProfile = {
  slug: "kemp",
  foundings: [
    {
      company: "Kemp Technologies",
      year: 2000,
      place: "New York, United States",
      founders: [],
      story:
        "Kemp attacked the load-balancing market from below. While the leaders sold six-figure chassis to people with change-control boards, LoadMaster sold for the price of a server to the administrator who just needed Exchange to stay up - and Kemp leaned into exactly that buyer, publishing Microsoft-workload deployment guides so specific they became the documentation of record. An early, wholehearted move to virtual appliances widened the wedge: when the hypervisor became the data centre, Kemp was already there, priced for the mid-market the giants kept forgetting.",
      sourceNote: "Peter Melerud is named among its founding technologists; a complete founder list is not established here.",
    },
  ],
  timeline: [
    { year: 2000, title: "Founded in New York", detail: "Into a market where an application delivery controller meant a six-figure chassis and a procurement process." },
    { year: 2008, title: "LoadMaster goes virtual early", detail: "Virtual editions shipped while much of the industry still equated an ADC with sheet metal - a bet on the hypervisor that paid compounding dividends as data centres virtualised." },
    { year: 2021, title: "Progress Software acquires Kemp", detail: "Approximately $258M - the affordable-ADC pioneer becoming the application-experience arm of a software house, with LoadMaster continuing under new ownership.", sourceNote: "Approximately $258M, announced September 2021 and closed November 2021, per Progress Software's public statements." },
  ],
  products: [
    { name: "LoadMaster", what: "The affordable ADC in hardware, virtual and cloud forms - load balancing sized and priced for the workloads most organisations actually run rather than the largest ones." },
    { name: "Microsoft workload templates", what: "Deployment guides and preconfigured templates for Exchange, SharePoint and the rest, specific enough that they became the documentation practitioners reached for - including practitioners who had bought somebody else's load balancer." },
  ],
  innovations: [
    { title: "The virtual-first ADC", detail: "Shipping virtual appliances early reframed the ADC as software with optional hardware - the framing the whole market, leaders included, eventually adopted. Being early to that was worth more than any feature." },
    { title: "Pricing for the administrator, not the committee", detail: "Selling at the price of a server put the purchase below the threshold that triggers a procurement process, which changes who the customer is. The buyer is the person with the problem rather than the person with the budget authority, and that is a different product even when the technology is similar." },
    { title: "Documentation as the sales channel", detail: "Publishing deployment guides specific enough to be authoritative brought in customers who arrived already knowing how the product worked. It is a slow method and difficult to copy, because it requires being genuinely useful before anybody has paid." },
  ],
  markets: [
    "Mid-market organisations and Microsoft workload environments, and since 2021 inside Progress Software's portfolio. The customer is the one the enterprise vendors priced out rather than the one they competed for.",
    "Its counterpart from the other direction is A10, which attacked the same category from above on throughput and appears separately on this timeline. Between them they are the reason application delivery is a market rather than a monopoly.",
  ],
  analyst: [
    "Assessed historically as the value leader in application delivery, with the virtual-first move recognised in retrospect as having anticipated where the whole category went.",
    "Its position now is that of a component within a larger software portfolio rather than an independent challenger, which is the common ending for a company whose distinguishing asset was price discipline.",
  ],
};
