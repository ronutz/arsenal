// ============================================================================
// src/lib/tools/f5-gslb-decision-flow/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the GSLB decision-flow explainer. They pin: the 19-token pool
// catalogue and the 5-token wide-IP catalogue, tmsh chain defaults
// (round-robin / round-robin / return-to-dns), the fallback-ignores-
// availability statement, the alternate-tier grammar, the fallback-ip wiring
// checks, the dynamic-ratio scope, the Global Availability pairing rule, and
// the manual's topology-at-both-tiers warning. Sources: tmsh gtm pool a,
// tmsh gtm wideip a, the BIG-IP DNS Load Balancing manual.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-gslb-decision-flow-golden-v1";

export interface GslbVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "config" | "method" | "catalog";
  expectCatalogCount?: number;
  expectWideipMethodCount?: number;
  expectMethodToken?: string;
  expectAlternateAllowed?: boolean;
  expectPoolCount?: number;
  expectWideipCount?: number;
  expectChain?: { pool: number; tiers: [string, string, string] };
  expectDefaultedFallback?: { pool: number; value: boolean };
  expectPoolObsIncludes?: { pool: number; text: string };
  expectWideipObsIncludes?: { wideip: number; text: string };
  expectWideipMode?: { wideip: number; token: string };
}

export const GSLB_VECTORS: GslbVector[] = [
  {
    id: "catalog-counts",
    description: "The methods keyword lists 19 pool-tier and 5 wide-IP-tier entries",
    input: "methods",
    expectOk: true,
    expectMode: "catalog",
    expectCatalogCount: 19,
    expectWideipMethodCount: 5,
  },
  {
    id: "method-qos-alias",
    description: "GUI-style alias QoS resolves to quality-of-service; not admitted as alternate",
    input: "QoS",
    expectOk: true,
    expectMode: "method",
    expectMethodToken: "quality-of-service",
    expectAlternateAllowed: false,
  },
  {
    id: "method-packet-rate-alternate",
    description: "packet-rate is measured yet grammar-admitted as alternate (server-side statistic)",
    input: "packet-rate",
    expectOk: true,
    expectMode: "method",
    expectMethodToken: "packet-rate",
    expectAlternateAllowed: true,
  },
  {
    id: "method-rtt-alias",
    description: "rtt resolves to lowest-round-trip-time",
    input: "rtt",
    expectOk: true,
    expectMethodToken: "lowest-round-trip-time",
    expectAlternateAllowed: false,
  },
  {
    id: "chain-defaults",
    description: "A bare pool resolves the documented default chain round-robin/round-robin/return-to-dns",
    input: "gtm pool a bare_pool { }",
    expectOk: true,
    expectMode: "config",
    expectPoolCount: 1,
    expectChain: { pool: 0, tiers: ["round-robin", "round-robin", "return-to-dns"] },
    expectDefaultedFallback: { pool: 0, value: true },
  },
  {
    id: "default-fallback-callout",
    description: "The absent fallback-mode triggers the return-to-dns default callout",
    input: "gtm pool a bare_pool { }",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "documented default applies: return-to-dns" },
  },
  {
    id: "fallback-ignores-availability",
    description: "A resolved non-none fallback always states the ignores-availability property",
    input: "gtm pool a p { fallback-mode round-robin }",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "ignores the availability status" },
  },
  {
    id: "fallback-ip-unset",
    description: "Fallback IP method with the :: default flags the empty disaster-recovery answer",
    input: "gtm pool a p {\n    fallback-mode fallback-ip\n    fallback-ip ::\n}",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "disaster-recovery answer is empty" },
  },
  {
    id: "fallback-ip-orphaned",
    description: "A configured fallback-ip that no tier uses is flagged as never returned",
    input: "gtm pool a p {\n    load-balancing-mode topology\n    fallback-mode none\n    fallback-ip 2001:db8::1\n}",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "never returned" },
  },
  {
    id: "alternate-grammar-violation",
    description: "A path-metric method as alternate-mode is called out with the admitted token list",
    input: "gtm pool a p { alternate-mode lowest-round-trip-time }",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "outside the tmsh grammar for the alternate tier" },
  },
  {
    id: "preferred-none-violation",
    description: "none as the preferred mode is outside the preferred grammar",
    input: "gtm pool a p { load-balancing-mode none }",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "does not admit \"none\"" },
  },
  {
    id: "dynamic-ratio-out-of-scope",
    description: "dynamic-ratio enabled under round-robin has no documented effect",
    input: "gtm pool a p { dynamic-ratio enabled }",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "no documented effect" },
  },
  {
    id: "dynamic-ratio-in-scope",
    description: "dynamic-ratio under lowest-round-trip-time explains proportional serving",
    input: "gtm pool a p {\n    load-balancing-mode lowest-round-trip-time\n    dynamic-ratio enabled\n}",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "twice as often" },
  },
  {
    id: "qos-zeroed",
    description: "QoS with every coefficient zeroed has nothing to weigh",
    input: "gtm pool a p {\n    load-balancing-mode quality-of-service\n    qos-rtt 0\n    qos-lcs 0\n    qos-hit-ratio 0\n    qos-kilobytes-second 0\n    qos-packet-rate 0\n}",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "nothing to weigh" },
  },
  {
    id: "ratios-unused",
    description: "Member ratio weights without a Ratio tier never apply",
    input: "gtm pool a p { members { s1:vs1 { ratio 4 } s2:vs2 { } } }",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "weights never apply" },
  },
  {
    id: "ga-pairing-rule",
    description: "Global Availability with a non-none fallback states the manual's pairing rule",
    input: "gtm pool a p { load-balancing-mode global-availability }",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "only when the Fallback method is None" },
  },
  {
    id: "wideip-default-and-single-pool",
    description: "A wide IP without pool-lb-mode defaults to round-robin; a single pool notes the scoping",
    input: "gtm wideip a app.example.com { pools { pool_one { } } }",
    expectOk: true,
    expectWideipCount: 1,
    expectWideipMode: { wideip: 0, token: "round-robin" },
    expectWideipObsIncludes: { wideip: 0, text: "relevant only when multiple pools" },
  },
  {
    id: "wideip-ratio-without-weights",
    description: "pool-lb-mode ratio with no pool ratio values has no proportion to follow",
    input: "gtm wideip a app.example.com {\n    pool-lb-mode ratio\n    pools {\n        p1 { }\n        p2 { }\n    }\n}",
    expectOk: true,
    expectWideipObsIncludes: { wideip: 0, text: "no proportion to follow" },
  },
  {
    id: "topology-both-tiers-warning",
    description: "Topology at wide IP and pool with a non-none pool fallback raises the manual's BIND warning",
    input:
      "gtm wideip a app.example.com {\n    pool-lb-mode topology\n    pools {\n        p1 { }\n        p2 { }\n    }\n}\ngtm pool a p1 {\n    load-balancing-mode topology\n}",
    expectOk: true,
    expectPoolObsIncludes: { pool: 0, text: "set each pool's Fallback to None" },
  },
  {
    id: "error-empty",
    description: "Empty input asks for stanzas, a method, or the catalogue keyword",
    input: "   ",
    expectOk: false,
    expectErrorIncludes: "methods",
  },
  {
    id: "error-unknown-method",
    description: "An unknown single token names itself in the error",
    input: "fastest-server",
    expectOk: false,
    expectErrorIncludes: "not a documented GTM load-balancing method",
  },
  {
    id: "error-no-gtm-objects",
    description: "tmsh input without gtm wideip/pool stanzas explains what to paste",
    input: "ltm pool web { }",
    expectOk: false,
    expectErrorIncludes: "No gtm wideip or gtm pool stanzas",
  },
];

/** Run every vector; return human-readable failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of GSLB_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) {
        failures.push(`${v.id}: expected an error, got ok`);
        continue;
      }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode} != ${v.expectMode}`);
      if (v.expectCatalogCount !== undefined && (r.catalog?.length ?? -1) !== v.expectCatalogCount)
        failures.push(`${v.id}: catalog ${r.catalog?.length} != ${v.expectCatalogCount}`);
      if (v.expectWideipMethodCount !== undefined && (r.wideipMethods?.length ?? -1) !== v.expectWideipMethodCount)
        failures.push(`${v.id}: wideipMethods ${r.wideipMethods?.length} != ${v.expectWideipMethodCount}`);
      if (v.expectMethodToken && r.method?.token !== v.expectMethodToken)
        failures.push(`${v.id}: method ${r.method?.token} != ${v.expectMethodToken}`);
      if (v.expectAlternateAllowed !== undefined && r.method?.allowedIn.alternate !== v.expectAlternateAllowed)
        failures.push(`${v.id}: alternate-allowed ${r.method?.allowedIn.alternate} != ${v.expectAlternateAllowed}`);
      if (v.expectPoolCount !== undefined && (r.pools?.length ?? -1) !== v.expectPoolCount)
        failures.push(`${v.id}: pools ${r.pools?.length} != ${v.expectPoolCount}`);
      if (v.expectWideipCount !== undefined && (r.wideips?.length ?? -1) !== v.expectWideipCount)
        failures.push(`${v.id}: wideips ${r.wideips?.length} != ${v.expectWideipCount}`);
      if (v.expectChain) {
        const got = r.pools?.[v.expectChain.pool]?.chain.map((c) => c.token);
        if (!got || got.join("|") !== v.expectChain.tiers.join("|"))
          failures.push(`${v.id}: chain ${got?.join("|")} != ${v.expectChain.tiers.join("|")}`);
      }
      if (v.expectDefaultedFallback) {
        const got = r.pools?.[v.expectDefaultedFallback.pool]?.chain[2]?.defaulted;
        if (got !== v.expectDefaultedFallback.value) failures.push(`${v.id}: fallback defaulted ${got}`);
      }
      if (v.expectPoolObsIncludes) {
        const obs = r.pools?.[v.expectPoolObsIncludes.pool]?.observations ?? [];
        if (!obs.some((o) => o.includes(v.expectPoolObsIncludes!.text)))
          failures.push(`${v.id}: pool obs missing "${v.expectPoolObsIncludes.text}"`);
      }
      if (v.expectWideipObsIncludes) {
        const obs = r.wideips?.[v.expectWideipObsIncludes.wideip]?.observations ?? [];
        if (!obs.some((o) => o.includes(v.expectWideipObsIncludes!.text)))
          failures.push(`${v.id}: wideip obs missing "${v.expectWideipObsIncludes.text}"`);
      }
      if (v.expectWideipMode) {
        const got = r.wideips?.[v.expectWideipMode.wideip]?.poolLbMode;
        if (got !== v.expectWideipMode.token) failures.push(`${v.id}: wideip mode ${got} != ${v.expectWideipMode.token}`);
      }
    } catch (e) {
      if (v.expectOk !== false) {
        failures.push(`${v.id}: unexpected error ${(e as Error).message}`);
        continue;
      }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes))
        failures.push(`${v.id}: error missing "${v.expectErrorIncludes}": ${(e as Error).message}`);
    }
  }
  return failures;
}
