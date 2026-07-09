// ============================================================================
// src/lib/tools/change-blast-radius-mapper/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS - the advisory-verification ruling (D-86 §3.1),
// as set by the FHB pilot and reused across the fieldcraft cluster.
//
// For each structured input, assert: the exact fired rule ids (registry
// order), the exact populated tiers (tier id + ordered item ids), the exact
// risk ids, the exact containment ids, the exact warning ids, and the coarse
// radius band. Any drift breaks the build. The D-49 manifest carries
// `verificationModel: "rule-firing-snapshot"`.
// ============================================================================

import { run, runFromJson, BlastError, TIER_ORDER, type BlastInput, type TierId } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "change-blast-radius-mapper/2026-07-08";

interface BlastSnapshotVector {
  id: string;
  description: string;
  input: BlastInput;
  expect: {
    firedRuleIds: string[];
    tiers: { tier: TierId; itemIds: string[] }[];
    riskIds: string[];
    containmentIds: string[];
    warningIds: string[];
    radiusBand: "contained" | "moderate" | "wide";
  };
}

interface RejectVector {
  id: string;
  description: string;
  json: string;
  expectCode: "empty" | "format";
}

export const BLAST_SNAPSHOT_VECTORS: BlastSnapshotVector[] = [
  {
    id: "cert-shared-inpath-everyone",
    description:
      "A certificate on a heavily-shared, in-path load balancer with an HA pair, many dependents, reaching everyone. The D-83 Example: all four tiers populated, the every-TLS-client downstream item, wide radius, the shared-everyone caution.",
    input: { target: "certificate", colocation: "heavily-shared", trafficPath: "in-path", dependents: "many", redundancy: "ha-pair-healthy", userReach: "everyone", preset: "tls-pki" },
    expect: {
      firedRuleIds: ["R-BASE-TARGET", "R-IN-PATH", "R-HEAVILY-SHARED", "R-HA-PAIR", "R-MANY-DEPENDS", "R-EVERYONE", "R-CERT-TARGET"],
      tiers: [
        { tier: "target", itemIds: ["I-TGT-DIRECT", "I-TGT-CONFIG-STATE", "I-TGT-SESSIONS"] },
        { tier: "colocated", itemIds: ["I-CO-SAME-DEVICE", "I-CO-SHARED-CPU", "I-CO-SAME-PLATFORM", "I-CO-HA-PEER"] },
        { tier: "downstream", itemIds: ["I-DS-EVERY-FLOW", "I-DS-DEPENDENTS", "I-DS-TRANSITIVE", "I-DS-EVERY-TLS-CLIENT"] },
        { tier: "human", itemIds: ["I-HU-USERS", "I-HU-EVERYONE", "I-HU-ONCALL"] },
      ],
      riskIds: ["RK-IN-PATH", "RK-HEAVILY-SHARED", "RK-MANY-DEPENDENTS", "RK-EVERYONE", "RK-TLS-ALL-CLIENTS"],
      containmentIds: ["C-DRAIN", "C-ISOLATE-NEIGHBOURS", "C-FAILOVER-FIRST", "C-ONE-NODE", "C-COMMS", "C-MAINT-WINDOW", "C-STAGE-VERIFY-CERT"],
      warningIds: ["W-SHARED-EVERYONE"],
      radiusBand: "wide",
    },
  },
  {
    id: "dedicated-standalone-narrow",
    description:
      "A dedicated standalone server, out-of-band, a few dependents, one app. Narrow reach but standalone: the no-redundancy risk drives a wide band even though the tiers are small - the honest reading that any interruption is total.",
    input: { target: "single-server", colocation: "dedicated", trafficPath: "out-of-band", dependents: "a-few", redundancy: "standalone", userReach: "one-app", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-TARGET", "R-STANDALONE", "R-FEW-DEPENDS", "R-USERS-NARROW"],
      tiers: [
        { tier: "target", itemIds: ["I-TGT-DIRECT", "I-TGT-CONFIG-STATE"] },
        { tier: "downstream", itemIds: ["I-DS-DEPENDENTS"] },
        { tier: "human", itemIds: ["I-HU-USERS"] },
      ],
      riskIds: ["RK-NO-REDUNDANCY"],
      containmentIds: ["C-MAINT-WINDOW", "C-COMMS"],
      warningIds: [],
      radiusBand: "wide",
    },
  },
  {
    id: "dns-many-customer",
    description:
      "A DNS record change on a clustered target, control-plane, many dependents, customer-facing. Exercises the DNS cached-answers item and TTL-linger risk, the customer tier, and a moderate band (no high-severity factor).",
    input: { target: "dns-record", colocation: "dedicated", trafficPath: "control-plane", dependents: "many", redundancy: "cluster", userReach: "customer-facing", preset: "dns" },
    expect: {
      firedRuleIds: ["R-BASE-TARGET", "R-HA-PAIR", "R-MANY-DEPENDS", "R-CUSTOMER", "R-DNS-TARGET"],
      tiers: [
        { tier: "target", itemIds: ["I-TGT-DIRECT", "I-TGT-CONFIG-STATE"] },
        { tier: "colocated", itemIds: ["I-CO-HA-PEER"] },
        { tier: "downstream", itemIds: ["I-DS-DEPENDENTS", "I-DS-TRANSITIVE", "I-DS-CACHED-ANSWERS"] },
        { tier: "human", itemIds: ["I-HU-USERS", "I-HU-CUSTOMER"] },
      ],
      riskIds: ["RK-MANY-DEPENDENTS", "RK-CUSTOMER-FACING", "RK-DNS-TTL-LINGER"],
      containmentIds: ["C-FAILOVER-FIRST", "C-ONE-NODE", "C-COMMS", "C-LOWER-TTL"],
      warningIds: [],
      radiusBand: "moderate",
    },
  },
  {
    id: "lb-inpath-everything-degraded",
    description:
      "A load balancer in-path, some shared, everything depends on it, HA peer degraded, reaching everyone. Near-max blast: exercises both the degraded-peer and max-blast cautions, restore-redundancy containment, and a wide band.",
    input: { target: "load-balancer", colocation: "some-shared", trafficPath: "in-path", dependents: "everything", redundancy: "ha-pair-degraded", userReach: "everyone", preset: "load-balancer" },
    expect: {
      firedRuleIds: ["R-BASE-TARGET", "R-IN-PATH", "R-SOME-SHARED", "R-HA-DEGRADED", "R-EVERYTHING-DEPENDS", "R-EVERYONE"],
      tiers: [
        { tier: "target", itemIds: ["I-TGT-DIRECT", "I-TGT-CONFIG-STATE", "I-TGT-SESSIONS"] },
        { tier: "colocated", itemIds: ["I-CO-SAME-DEVICE", "I-CO-HA-PEER"] },
        { tier: "downstream", itemIds: ["I-DS-EVERY-FLOW", "I-DS-DEPENDENTS", "I-DS-TRANSITIVE"] },
        { tier: "human", itemIds: ["I-HU-USERS", "I-HU-EVERYONE", "I-HU-ONCALL"] },
      ],
      riskIds: ["RK-IN-PATH", "RK-SOME-SHARED", "RK-HA-DEGRADED", "RK-EVERYTHING-DEPENDS", "RK-EVERYONE"],
      containmentIds: ["C-DRAIN", "C-ISOLATE-NEIGHBOURS", "C-RESTORE-REDUNDANCY", "C-ONE-NODE", "C-COMMS", "C-MAINT-WINDOW"],
      warningIds: ["W-DEGRADED-PEER", "W-MAX-BLAST"],
      radiusBand: "wide",
    },
  },
  {
    id: "firewall-minimal",
    description:
      "A firewall policy change, dedicated, control-plane, no known dependents, internal team, healthy HA. The contained path: only target/colocated/human tiers, no risks, a contained band.",
    input: { target: "firewall-policy", colocation: "dedicated", trafficPath: "control-plane", dependents: "none-known", redundancy: "ha-pair-healthy", userReach: "internal-team", preset: "firewall" },
    expect: {
      firedRuleIds: ["R-BASE-TARGET", "R-HA-PAIR", "R-USERS-NARROW"],
      tiers: [
        { tier: "target", itemIds: ["I-TGT-DIRECT", "I-TGT-CONFIG-STATE"] },
        { tier: "colocated", itemIds: ["I-CO-HA-PEER"] },
        { tier: "human", itemIds: ["I-HU-USERS"] },
      ],
      riskIds: [],
      containmentIds: ["C-FAILOVER-FIRST", "C-ONE-NODE"],
      warningIds: [],
      radiusBand: "contained",
    },
  },
  {
    id: "platform-worst-case",
    description:
      "A shared platform, in-path, everything depends, standalone, everyone. The worst case: heavily-shared plus no redundancy plus max dependents plus everyone, exercising the max-blast and shared-everyone cautions together.",
    input: { target: "shared-platform", colocation: "heavily-shared", trafficPath: "in-path", dependents: "everything", redundancy: "standalone", userReach: "everyone", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-TARGET", "R-IN-PATH", "R-HEAVILY-SHARED", "R-STANDALONE", "R-EVERYTHING-DEPENDS", "R-EVERYONE"],
      tiers: [
        { tier: "target", itemIds: ["I-TGT-DIRECT", "I-TGT-CONFIG-STATE", "I-TGT-SESSIONS"] },
        { tier: "colocated", itemIds: ["I-CO-SAME-DEVICE", "I-CO-SHARED-CPU", "I-CO-SAME-PLATFORM"] },
        { tier: "downstream", itemIds: ["I-DS-EVERY-FLOW", "I-DS-DEPENDENTS", "I-DS-TRANSITIVE"] },
        { tier: "human", itemIds: ["I-HU-USERS", "I-HU-EVERYONE", "I-HU-ONCALL"] },
      ],
      riskIds: ["RK-IN-PATH", "RK-HEAVILY-SHARED", "RK-NO-REDUNDANCY", "RK-EVERYTHING-DEPENDS", "RK-EVERYONE"],
      containmentIds: ["C-DRAIN", "C-ISOLATE-NEIGHBOURS", "C-MAINT-WINDOW", "C-ONE-NODE", "C-COMMS"],
      warningIds: ["W-MAX-BLAST", "W-SHARED-EVERYONE"],
      radiusBand: "wide",
    },
  },
];

export const BLAST_REJECT_VECTORS: RejectVector[] = [
  { id: "empty", description: "empty API input", json: "   ", expectCode: "empty" },
  { id: "not-json", description: "non-JSON API input", json: "{not json", expectCode: "format" },
  { id: "missing-field", description: "a required enum field absent", json: '{"colocation":"dedicated","trafficPath":"in-path","dependents":"a-few","redundancy":"standalone","userReach":"one-app","preset":"generic"}', expectCode: "format" },
  { id: "bad-target", description: "an out-of-vocabulary target is a format error", json: '{"target":"quantum-toaster","colocation":"dedicated","trafficPath":"in-path","dependents":"a-few","redundancy":"standalone","userReach":"one-app","preset":"generic"}', expectCode: "format" },
  { id: "bad-reach", description: "an out-of-vocabulary user reach is a format error", json: '{"target":"single-server","colocation":"dedicated","trafficPath":"in-path","dependents":"a-few","redundancy":"standalone","userReach":"the-moon","preset":"generic"}', expectCode: "format" },
];

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

/** Run every snapshot + reject vector; used by the standalone check and CI. */
export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  for (const v of BLAST_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const firedOk = JSON.stringify(r.firedRuleIds) === JSON.stringify(v.expect.firedRuleIds);
      const gotTiers = r.tiers.map((t) => ({ tier: t.tier, itemIds: t.items.map((i) => i.id) }));
      const tiersOk = JSON.stringify(gotTiers) === JSON.stringify(v.expect.tiers);
      const riskOk = JSON.stringify(r.risks.map((x) => x.id)) === JSON.stringify(v.expect.riskIds);
      const containOk = JSON.stringify(r.containment.map((c) => c.id)) === JSON.stringify(v.expect.containmentIds);
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      const bandOk = r.radiusBand === v.expect.radiusBand;
      // Sanity: emitted tiers are a subsequence of TIER_ORDER.
      const orderOk = gotTiers.every((t, i, arr) => i === 0 || TIER_ORDER.indexOf(t.tier) > TIER_ORDER.indexOf(arr[i - 1].tier));
      if (!firedOk || !tiersOk || !riskOk || !containOk || !warnOk || !bandOk || !orderOk) {
        failures.push(
          `${v.id}: fired=${firedOk} tiers=${tiersOk} risk=${riskOk} contain=${containOk} warn=${warnOk} band=${bandOk} order=${orderOk} (got fired=${JSON.stringify(r.firedRuleIds)} tiers=${JSON.stringify(gotTiers)} risk=${JSON.stringify(r.risks.map((x) => x.id))} contain=${JSON.stringify(r.containment.map((c) => c.id))} warn=${JSON.stringify(r.warnings.map((w) => w.id))} band=${r.radiusBand})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of BLAST_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof BlastError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = BLAST_SNAPSHOT_VECTORS.length + BLAST_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
