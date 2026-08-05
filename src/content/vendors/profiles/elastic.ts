// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-04 against: fiscal 2025 revenue
// above $1.4B with Elastic Cloud the majority of new bookings; OpenSearch
// past 300 million cumulative downloads by end-2023; AWS transferring
// OpenSearch governance to the Linux Foundation in September 2024 (OpenSearch
// Foundation); a Linux Foundation survey finding 46% of users run it managed;
// Elastic's own benchmarks claiming 40-140% advantages against an independent
// Trail of Bits benchmark (March 2025) finding OpenSearch faster on mixed
// workloads.
//
// THE BODY ALREADY ARGUES the licence change, the three accounts of why, the
// fork, the community reaction, the AGPLv3 reversal, and the tie to Tenable
// and Rapid7 on open source. This profile adds what happened AFTER - what each
// side built, the governance handoff, and the contested benchmarks.
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const elasticProfile: VendorProfile = {
  slug: "elastic",
  foundings: [
    {
      company: "Compass, then Elasticsearch",
      year: 2004,
      place: "Amsterdam, Netherlands",
      founders: ["Shay Banon"],
      story:
        "Banon wrote a search library called Compass, then rebuilt the idea on Apache Lucene as a distributed search engine with an HTTP interface. The account he has told is that the first version was written so his wife could search recipes - which is the kind of origin that sounds invented and is documented well enough to keep.",
      sourceNote: "The recipe-search origin is Banon's own repeated account; it is recorded as his telling rather than as independently established.",
    },
    {
      company: "Elastic",
      year: 2012,
      place: "Amsterdam and Mountain View",
      founders: ["Shay Banon", "Steven Schuurman", "Uri Boness", "Simon Willnauer"],
      story:
        "Formed around a project that had already been adopted widely, which set the commercial problem the company spent the next decade on: how to make money from software everybody already had for free.",
    },
  ],
  timeline: [
    { year: 2010, title: "Elasticsearch released", detail: "Distributed search on Lucene, under Apache 2.0, with an interface simple enough that adoption did not require a sales conversation." },
    { year: 2012, title: "Company founded", detail: "Around a project already in wide use." },
    { year: 2015, title: "The ELK stack", detail: "Elasticsearch, Logstash and Kibana became the default way to handle logs for a generation of engineers, largely without anybody paying for it." },
    { year: 2018, title: "NYSE listing", detail: "Listed as ESTC." },
    { year: 2021, title: "The licence change, and the fork", detail: "In January, release 7.11 moved off Apache 2.0. In April, AWS forked 7.10.2 as OpenSearch under Apache 2.0, and renamed its managed service accordingly." },
    {
      year: 2024,
      title: "Two reversals in one year",
      detail:
        "In September Elastic added AGPLv3, an approved open-source licence, alongside the others. In the same month AWS transferred OpenSearch governance to the Linux Foundation. Each side gave away the thing the other had accused it of hoarding - one restored an open licence, the other gave up control of the fork.",
      sourceNote: "Both events are September 2024; the symmetry is noted, no causal link between them is claimed.",
    },
    { year: 2025, title: "Scale", detail: "Fiscal 2025 revenue above $1.4B, with cloud the majority of new bookings - the transition the licence fight was ultimately about." },
  ],
  products: [
    { name: "Elasticsearch", what: "The distributed search and analytics engine, still built on Lucene, still the thing everything else attaches to." },
    { name: "Kibana", what: "The visualisation and exploration layer, and the part of the stack with the clearest lead over the fork after five years of separate development." },
    { name: "Elastic Cloud", what: "Managed service across the major cloud providers in more than forty regions - including on AWS, which is worth noting given the history." },
    { name: "Observability and Security", what: "Application performance monitoring, logs and metrics on one side; SIEM and endpoint on the other. Both are the same engine pointed at different questions, which is the argument for the platform." },
    { name: "ES|QL", what: "A piped query language added in 2025, aimed at analytical work that the original query interface handled awkwardly. The fork answered with its own piped language, which is a fair picture of how the two now develop." },
    { name: "ESRE, ELSER and BBQ", what: "The retrieval and vector work: a sparse retrieval model that runs in the cluster without external inference hardware, and quantisation compressing vectors roughly sixteenfold with little reported recall loss. This is where the company placed its bet for the retrieval-augmented generation era." },
  ],
  innovations: [
    { title: "Search as infrastructure rather than a feature", detail: "An HTTP interface over a hard distributed-systems problem meant developers could adopt it in an afternoon without a database team. That accessibility built the install base - and made the install base impossible to charge for." },
    { title: "Running the model inside the cluster", detail: "A retrieval model that needs no external inference service removes the operational and cost barrier that keeps most organisations from using semantic search at all. The design decision is about deployment, not accuracy." },
    { title: "Compressing vectors rather than buying memory", detail: "Quantising vectors to a fraction of their size makes vector search affordable at volumes where the memory bill otherwise decides the architecture. It is the unglamorous engineering that determines whether a capability is usable in production." },
    { title: "Triple licensing as a settlement", detail: "Holding a proprietary licence, a source-available one and an approved open-source one simultaneously is an odd position, and it is what a company looks like when it has to satisfy the cloud provider problem and the community at the same time." },
  ],
  markets: [
    "Log analytics remains the largest use, alongside enterprise search, observability and security. The customer is any organisation with more data than it can grep, which is now most of them.",
    "Its principal competitor is a fork of its own code, now under independent governance and with hundreds of millions of downloads. Benchmarks between the two are contested and should be read with that in mind: the vendor's own figures claim large advantages, an independent 2025 benchmark found the fork faster on mixed workloads, and the honest answer is that the result depends on the workload.",
  ],
  analyst: [
    "Assessed as a leader in search and increasingly in observability, with the vector and retrieval work its clearest current differentiator.",
    "The lasting outcome of the licence episode is a market with two engines instead of one, both under credible governance, and a company that reached $1.4B in revenue anyway. Whether the licence change caused the growth or merely coincided with the cloud transition is not separable from the public record.",
  ],
};
