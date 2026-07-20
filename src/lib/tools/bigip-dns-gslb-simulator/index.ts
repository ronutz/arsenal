// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bigip-dns-gslb-simulator/index.ts — engine surface + manifest.
// ============================================================================

export { simulate, run, SIMULABLE_METHODS, DYNAMIC_METHODS } from "./compute";
export type { GslbMethod, Member, Pool, GslbInput, MemberResult, PoolResult, GslbResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { GslbVector, VerifyReport } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "bigip-dns-gslb-simulator",
  sources: [
    { id: "gslb-concepts", label: "F5 — Global Server Load Balancing (BIG-IP DNS)", type: "reference", url: "https://techdocs.f5.com/en-us/bigip-15-0-0/big-ip-dns-load-balancing/global-server-load-balancing.html", access_date: "2026-07-19", scope: "tiered GSLB: pool then virtual server; static vs dynamic methods", status: "active" },
    { id: "gslb-lb", label: "F5 — About load balancing and resource availability", type: "reference", url: "https://techdocs.f5.com/kb/en-us/products/big-ip-dns/manuals/product/big-ip-dns-load-balancing-14-0-0/02.html", access_date: "2026-07-19", scope: "wide-IP pool ordering; Round Robin, Ratio, Global Availability, Topology, QoS", status: "active" },
    { id: "gslb-topology", label: "F5 — Using Topology Load Balancing to Distribute DNS Requests", type: "reference", url: "https://techdocs.f5.com/en-us/bigip-15-0-0/big-ip-dns-load-balancing/using-topology-load-balancing-to-distribute-dns-requests-to-specific-resources.html", access_date: "2026-07-19", scope: "topology-record scoring; ties round-robin within the winning score", status: "active" },
    { id: "tmsh-gtm-pool", label: "F5 Cloud Docs — tmsh gtm pool a (alternate/fallback modes)", type: "spec", url: "https://clouddocs.f5.com/cli/tmsh-reference/v15/modules/gtm/gtm_pool_a.html", access_date: "2026-07-19", scope: "the full method set and the three-tier preferred/alternate/fallback model", status: "active" },
  ],
});
