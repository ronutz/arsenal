// ============================================================================
// src/lib/tools/health-snapshot-comparator/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS (D-86 §3.1). For each structured input, assert
// (a) exactly which rules fire, in registry order, (b) the exact GATE
// VERDICT - the tool's headline output, pinned so the severity ladder and
// the rollback-decision conversion can never drift silently, (c) the exact
// warning set, and (d) the exact selected DIMENSION SET (the catalog
// selection is itself an output surface). Expectations PINNED FROM ENGINE
// EXECUTION (tsx harness, 2026-07-16), the cluster's honest convention.
// ============================================================================

import { run, runFromJson, HscError, type HscInput } from "./compute";
import type { ValidationGate } from "@/lib/fieldcraft/schema";

export const GOLDEN_VECTOR_SET_ID = "health-snapshot-comparator/2026-07-16";

interface SnapshotVector {
  id: string;
  description: string;
  input: HscInput;
  expect: {
    verdict: ValidationGate["verdict"];
    firedRuleIds: string[];
    warningIds: string[];
    dimensionIds: string[];
  };
}

interface RejectVector {
  id: string;
  description: string;
  /** Raw JSON string fed to runFromJson (the API-parity gate). */
  json: string;
  expectCode: "empty" | "format";
}

export const HSC_SNAPSHOT_VECTORS: readonly SnapshotVector[] = [
  {
    id: "postchange-verified-ha",
    description: "Post-change validation, HA pair, verified both sides, operational window: continue - conditional on the service-tier pairing.",
    input: { context: "post-change-validation", target: "load-balancer", scope: "ha-pair", beforeConfidence: "captured-verified", afterState: "captured-verified", window: "operational", churn: "normal", preset: "load-balancer" },
    expect: {
      verdict: "continue",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-POSTCHANGE", "R-BEFORE-VERIFIED", "R-SCOPE-HA"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-OBJECT-STATUS", "DIM-CONTROL-ADJ", "DIM-HA-SYNC", "DIM-RESOLUTION-ANSWERS", "DIM-CERT-CHAIN", "DIM-SESSION-COUNTS", "DIM-ERROR-COUNTERS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM"],
    },
  },
  {
    id: "weak-memory-baseline",
    description: "A from-memory baseline caps the gate at investigate regardless of the after-capture's quality.",
    input: { context: "post-change-validation", target: "firewall", scope: "single-device", beforeConfidence: "from-memory", afterState: "captured-verified", window: "short", churn: "low", preset: "firewall" },
    expect: {
      verdict: "investigate",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-POSTCHANGE", "R-BEFORE-MEMORY"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE", "W-BASELINE-WEAK"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-OBJECT-STATUS", "DIM-CONTROL-ADJ", "DIM-HA-SYNC", "DIM-SESSION-COUNTS", "DIM-ERROR-COUNTERS", "DIM-POLICY-HITS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM", "DIM-NEIGHBOR-TOPOLOGY"],
    },
  },
  {
    id: "immediate-window",
    description: "Verified captures both sides, but an immediate window: convergence has not spoken - observe.",
    input: { context: "post-change-validation", target: "switch-routing", scope: "single-device", beforeConfidence: "captured-verified", afterState: "captured-verified", window: "immediate", churn: "low", preset: "generic" },
    expect: {
      verdict: "observe",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-POSTCHANGE", "R-BEFORE-VERIFIED", "R-WIN-IMMEDIATE"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE", "W-WIN-IMMEDIATE"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-OBJECT-STATUS", "DIM-CONTROL-ADJ", "DIM-ERROR-COUNTERS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM", "DIM-NEIGHBOR-TOPOLOGY"],
    },
  },
  {
    id: "rollback-decision-weak",
    description: "A rollback decision on weak evidence: any gap keeps the rollback armed - hold-rollback-ready.",
    input: { context: "rollback-decision", target: "load-balancer", scope: "cluster", beforeConfidence: "captured-unverified", afterState: "partial", window: "immediate", churn: "unknown", preset: "load-balancer" },
    expect: {
      verdict: "hold-rollback-ready",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-ROLLBACK", "R-BEFORE-UNVERIFIED", "R-AFTER-PARTIAL", "R-WIN-IMMEDIATE", "R-CHURN-UNKNOWN", "R-SCOPE-CLUSTER"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE", "W-AFTER-INCOMPLETE", "W-WIN-IMMEDIATE", "W-CHURN-UNKNOWN"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-OBJECT-STATUS", "DIM-CONTROL-ADJ", "DIM-HA-SYNC", "DIM-RESOLUTION-ANSWERS", "DIM-CERT-CHAIN", "DIM-SESSION-COUNTS", "DIM-ERROR-COUNTERS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM"],
    },
  },
  {
    id: "no-baseline-postincident",
    description: "Post-incident with no baseline: the honest output is a capture plan - investigate, and recovered is not restored.",
    input: { context: "post-incident-recovery", target: "server-app", scope: "service-population", beforeConfidence: "none", afterState: "captured-verified", window: "operational", churn: "normal", preset: "generic" },
    expect: {
      verdict: "investigate",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-POSTINCIDENT", "R-BEFORE-NONE", "R-SCOPE-POPULATION"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE", "W-BASELINE-WEAK"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-RESOLUTION-ANSWERS", "DIM-CERT-CHAIN", "DIM-AUTH-FLOW", "DIM-ERROR-COUNTERS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM"],
    },
  },
  {
    id: "migration-after-pending",
    description: "Cutover with the after not yet captured under a freeze: observe, capture the new, freeze the old.",
    input: { context: "migration-cutover", target: "dns", scope: "site", beforeConfidence: "captured-verified", afterState: "none-yet", window: "unknown", churn: "none-frozen", preset: "dns" },
    expect: {
      verdict: "observe",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-MIGRATION", "R-BEFORE-VERIFIED", "R-AFTER-NONE", "R-WIN-UNKNOWN", "R-CHURN-FROZEN", "R-SCOPE-POPULATION"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE", "W-AFTER-INCOMPLETE", "W-WIN-UNKNOWN"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-RESOLUTION-ANSWERS", "DIM-ERROR-COUNTERS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM"],
    },
  },
  {
    id: "drift-check-extended",
    description: "A periodic drift check over an extended window with verified captures: continue, attributing drift before charging it anywhere.",
    input: { context: "periodic-drift-check", target: "identity", scope: "single-device", beforeConfidence: "captured-verified", afterState: "captured-verified", window: "extended", churn: "low", preset: "generic" },
    expect: {
      verdict: "continue",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-DRIFT", "R-BEFORE-VERIFIED", "R-WIN-EXTENDED"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-HA-SYNC", "DIM-RESOLUTION-ANSWERS", "DIM-CERT-CHAIN", "DIM-AUTH-FLOW", "DIM-ERROR-COUNTERS", "DIM-POLICY-HITS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM"],
    },
  },
  {
    id: "churn-storm-continue",
    description: "High-churn target with verified captures over an operational window: continue - fast dimensions read as expected drift, not regressions.",
    input: { context: "post-change-validation", target: "proxy-sse", scope: "service-population", beforeConfidence: "captured-verified", afterState: "captured-verified", window: "operational", churn: "high-dynamic", preset: "generic" },
    expect: {
      verdict: "continue",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-POSTCHANGE", "R-BEFORE-VERIFIED", "R-CHURN-HIGH", "R-SCOPE-POPULATION"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-OBJECT-STATUS", "DIM-HA-SYNC", "DIM-CERT-CHAIN", "DIM-AUTH-FLOW", "DIM-SESSION-COUNTS", "DIM-ERROR-COUNTERS", "DIM-POLICY-HITS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM"],
    },
  },
  {
    id: "unknown-storm",
    description: "Everything weak or unknown: the warning storm, the generic dimension fallback, and an investigate gate.",
    input: { context: "unknown", target: "unknown", scope: "unknown", beforeConfidence: "assumed-healthy", afterState: "partial", window: "unknown", churn: "unknown", preset: "generic" },
    expect: {
      verdict: "investigate",
      firedRuleIds: ["R-BASE-DECLARED", "R-SVC-VS-STATE", "R-CTX-UNKNOWN", "R-BEFORE-ASSUMED", "R-AFTER-PARTIAL", "R-WIN-UNKNOWN", "R-CHURN-UNKNOWN", "R-SCOPE-UNKNOWN", "R-TARGET-UNKNOWN"],
      warningIds: ["W-DECLARED-STATES", "W-GREEN-NOT-DONE", "W-CTX-UNKNOWN", "W-BASELINE-WEAK", "W-AFTER-INCOMPLETE", "W-WIN-UNKNOWN", "W-CHURN-UNKNOWN", "W-SCOPE-UNKNOWN", "W-TARGET-UNKNOWN"],
      dimensionIds: ["DIM-CONFIG-STATE", "DIM-SERVICE-PROBE", "DIM-ERROR-COUNTERS", "DIM-LOG-ERRORCLASS", "DIM-CAPACITY-HEADROOM"],
    },
  },
];

export const HSC_REJECT_VECTORS: readonly RejectVector[] = [
  { id: "reject-empty", description: "Empty object rejects with the 'empty' code.", json: "{}", expectCode: "empty" },
  { id: "reject-not-json", description: "Non-JSON input rejects with the 'format' code.", json: "compare my firewalls", expectCode: "format" },
  { id: "reject-missing-field", description: "A missing enum field rejects with the 'format' code.", json: JSON.stringify({ context: "post-change-validation", target: "firewall", scope: "single-device", beforeConfidence: "captured-verified", afterState: "captured-verified", churn: "low", preset: "generic" }), expectCode: "format" },
  { id: "reject-bad-enum", description: "An out-of-enum value rejects with the 'format' code.", json: JSON.stringify({ context: "post-change-validation", target: "firewall", scope: "single-device", beforeConfidence: "pretty-sure", afterState: "captured-verified", window: "short", churn: "low", preset: "generic" }), expectCode: "format" },
];

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  for (const v of HSC_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const verdictOk = r.gate.verdict === v.expect.verdict;
      const firedOk = JSON.stringify(r.firedRules.map((f) => f.id)) === JSON.stringify(v.expect.firedRuleIds);
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      const dimOk = JSON.stringify(r.dimensions.map((d) => d.id)) === JSON.stringify(v.expect.dimensionIds);
      if (!verdictOk || !firedOk || !warnOk || !dimOk) {
        failures.push(
          `${v.id}: verdict=${verdictOk} fired=${firedOk} warn=${warnOk} dims=${dimOk} (got verdict=${r.gate.verdict} fired=${JSON.stringify(r.firedRules.map((f) => f.id))} warn=${JSON.stringify(r.warnings.map((w) => w.id))} dims=${JSON.stringify(r.dimensions.map((d) => d.id))})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of HSC_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof HscError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = HSC_SNAPSHOT_VECTORS.length + HSC_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
