// ============================================================================
// src/lib/tools/change-window-runbook-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS - the advisory-verification ruling (D-86 §3.1),
// as set by the Fault Hypothesis Builder pilot and reused here:
//
//   An advisory tool has no single "correct" runbook to assert. The engine is
//   nonetheless fully deterministic, so what gets pinned is the FIRING: for
//   each structured input, assert (a) exactly which rules fire, in registry
//   order, (b) the exact ordered step ids per phase (phases in PHASE_ORDER),
//   (c) the exact risk-factor ids, and (d) the exact readiness-warning ids.
//   Any drift in rules, steps, phase assignment, risks, or warnings breaks the
//   build - which is the entire point.
//
// The D-49 manifest carries `verificationModel: "rule-firing-snapshot"`.
// ============================================================================

import { run, runFromJson, RunbookError, PHASE_ORDER, type RunbookInput, type PhaseId } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "change-window-runbook-builder/2026-07-08";

interface RunbookSnapshotVector {
  id: string;
  description: string;
  input: RunbookInput;
  expect: {
    firedRuleIds: string[];
    /** Ordered step ids per phase (only phases with steps appear). */
    phases: { phase: PhaseId; stepIds: string[] }[];
    riskIds: string[];
    warningIds: string[];
  };
}

interface RejectVector {
  id: string;
  description: string;
  /** Raw JSON string fed to runFromJson (the API-parity gate). */
  json: string;
  expectCode: "empty" | "format";
}

export const RUNBOOK_SNAPSHOT_VECTORS: RunbookSnapshotVector[] = [
  {
    id: "prod-cert-rotation",
    description:
      "Business-critical certificate rotation on shared infra, maintenance window, backup-only reversibility, backup not yet taken. The D-83 Example scenario: cert-specific staging/install/verify steps, prod bridge, and readiness warnings for the missing backup, untested rollback, and monitoring.",
    input: {
      changeType: "cert-rotation",
      environment: "production-critical",
      blastRadius: "shared-infra",
      reversibility: "config-backup-only",
      window: "maintenance-window",
      safeguards: ["change-approved", "peer-review"],
      preset: "tls-pki",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-BACKUP-STEP", "R-NO-BACKUP-WARN", "R-ROLLBACK-UNTESTED", "R-PROD-CRITICAL", "R-SHARED-INFRA", "R-MAINT-WINDOW", "R-COMMS-NOTIFY", "R-CERT-ROTATION"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-BACKUP", "S-PF-BLAST", "S-PF-MAINT-WINDOW", "S-PF-CERT-STAGE"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-BRIDGE", "S-AP-FREEZE", "S-AP-NOTIFY"] },
        { phase: "execution", stepIds: ["S-EX-APPLY", "S-EX-SEQUENCE", "S-EX-CERT-INSTALL"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH", "S-VF-FUNCTIONAL"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-STEPS", "S-RB-TESTED"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE", "S-CO-SAVE"] },
      ],
      riskIds: ["RK-NO-BACKUP", "RK-ROLLBACK-UNTESTED", "RK-PROD-CRITICAL", "RK-SHARED-INFRA", "RK-CERT-OUTAGE"],
      warningIds: ["W-NO-BACKUP", "W-NO-ROLLBACK-TEST", "W-NO-MONITORING"],
    },
  },
  {
    id: "lb-software-upgrade-ready",
    description:
      "Load-balancer software upgrade, after-hours, easy rollback, every safeguard marked ready. The well-prepared path: HA-aware one-node-first execution, no risks, no warnings.",
    input: {
      changeType: "software-upgrade",
      environment: "production-standard",
      blastRadius: "one-service",
      reversibility: "easy-rollback",
      window: "after-hours",
      safeguards: ["change-approved", "backup-taken", "rollback-tested", "monitoring-ready", "comms-sent"],
      preset: "load-balancer",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-BACKUP-STEP", "R-MAINT-WINDOW", "R-SOFTWARE-UPGRADE", "R-LB-HA-AWARE"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-BACKUP", "S-PF-MAINT-WINDOW", "S-PF-HA"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-FREEZE"] },
        { phase: "execution", stepIds: ["S-EX-APPLY", "S-EX-ONE-NODE-FIRST"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH", "S-VF-FUNCTIONAL"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-STEPS"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE", "S-CO-SAVE"] },
      ],
      riskIds: [],
      warningIds: [],
    },
  },
  {
    id: "emergency-prod-hard",
    description:
      "Emergency fix, business-critical, blast radius everyone, hard to reverse, no safeguards marked. The heaviest path: emergency note, broad-blast and hard-reverse risks, and the full readiness-warning set except approval (emergency exempts the approval warning).",
    input: {
      changeType: "emergency-fix",
      environment: "production-critical",
      blastRadius: "everyone",
      reversibility: "hard-to-reverse",
      window: "emergency-now",
      safeguards: [],
      preset: "generic",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-BACKUP-STEP", "R-NO-BACKUP-WARN", "R-HARD-REVERSE", "R-ROLLBACK-UNTESTED", "R-PROD-CRITICAL", "R-BROAD-BLAST", "R-EMERGENCY-NOW", "R-COMMS-NOTIFY"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-BACKUP", "S-PF-BLAST", "S-PF-EMERGENCY-NOTE"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-BRIDGE", "S-AP-NOTIFY"] },
        { phase: "execution", stepIds: ["S-EX-APPLY"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-STEPS", "S-RB-TESTED"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE", "S-CO-SAVE"] },
      ],
      riskIds: ["RK-NO-BACKUP", "RK-HARD-REVERSE", "RK-ROLLBACK-UNTESTED", "RK-PROD-CRITICAL", "RK-BROAD-BLAST", "RK-EMERGENCY"],
      warningIds: ["W-NO-BACKUP", "W-NO-ROLLBACK-TEST", "W-NO-MONITORING"],
    },
  },
  {
    id: "dns-change-maint",
    description:
      "DNS network change (dns preset), maintenance window, backup-only reverse, rollback not tested. Exercises the DNS-change rule: TTL-propagation execution step, multi-vantage verification, and the TTL risk.",
    input: {
      changeType: "network-change",
      environment: "production-standard",
      blastRadius: "one-service",
      reversibility: "config-backup-only",
      window: "maintenance-window",
      safeguards: ["change-approved", "backup-taken", "comms-sent", "monitoring-ready"],
      preset: "dns",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-BACKUP-STEP", "R-ROLLBACK-UNTESTED", "R-MAINT-WINDOW", "R-DNS-CHANGE"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-BACKUP", "S-PF-MAINT-WINDOW"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-FREEZE"] },
        { phase: "execution", stepIds: ["S-EX-APPLY", "S-EX-DNS-TTL"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH", "S-VF-FUNCTIONAL"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-STEPS", "S-RB-TESTED"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE", "S-CO-SAVE"] },
      ],
      riskIds: ["RK-ROLLBACK-UNTESTED", "RK-DNS-TTL"],
      warningIds: ["W-NO-ROLLBACK-TEST"],
    },
  },
  {
    id: "oneway-prod-migration",
    description:
      "One-way-door config change in production, maintenance window, well-prepared. The irreversible path: the backup step is suppressed (nothing to restore to), the rollback phase carries the prevention step instead of back-out, and the one-way production warning fires.",
    input: {
      changeType: "config-change",
      environment: "production-standard",
      blastRadius: "one-service",
      reversibility: "one-way-door",
      window: "maintenance-window",
      safeguards: ["change-approved", "backup-taken", "monitoring-ready", "comms-sent"],
      preset: "generic",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-ONEWAY", "R-MAINT-WINDOW"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-MAINT-WINDOW"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-FREEZE"] },
        { phase: "execution", stepIds: ["S-EX-APPLY"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-ONEWAY"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE"] },
      ],
      riskIds: ["RK-ONEWAY"],
      warningIds: ["W-ONEWAY-PROD"],
    },
  },
  {
    id: "firewall-business-hours",
    description:
      "Firewall config change over a whole site during business hours, well-prepared but broad. Exercises the firewall preset (diff-and-verify), the broad-blast and business-hours risks, and the comms-notify step.",
    input: {
      changeType: "config-change",
      environment: "production-standard",
      blastRadius: "one-site",
      reversibility: "config-backup-only",
      window: "business-hours",
      safeguards: ["change-approved", "backup-taken", "rollback-tested", "monitoring-ready"],
      preset: "firewall",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-BACKUP-STEP", "R-BROAD-BLAST", "R-BUSINESS-HOURS", "R-COMMS-NOTIFY", "R-FIREWALL-DIFF"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-BACKUP", "S-PF-BLAST"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-NOTIFY"] },
        { phase: "execution", stepIds: ["S-EX-APPLY", "S-EX-SEQUENCE"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH", "S-VF-FUNCTIONAL"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-STEPS"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE", "S-CO-SAVE"] },
      ],
      riskIds: ["RK-BROAD-BLAST", "RK-BUSINESS-HOURS"],
      warningIds: [],
    },
  },
  {
    id: "failover-maint-lb",
    description:
      "Failover / maintenance change on a single load-balancer device, after-hours, well-prepared. Exercises the failover rule: HA confirmation, connection drain before the change, and restore-to-service after.",
    input: {
      changeType: "failover-maintenance",
      environment: "production-standard",
      blastRadius: "single-device",
      reversibility: "easy-rollback",
      window: "after-hours",
      safeguards: ["change-approved", "backup-taken", "rollback-tested", "monitoring-ready", "comms-sent"],
      preset: "load-balancer",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-BACKUP-STEP", "R-MAINT-WINDOW", "R-FAILOVER-MAINT"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-BACKUP", "S-PF-MAINT-WINDOW", "S-PF-HA"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-FREEZE"] },
        { phase: "execution", stepIds: ["S-EX-APPLY", "S-EX-DRAIN"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH", "S-VF-RESTORE-STATE"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-STEPS"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE", "S-CO-SAVE"] },
      ],
      riskIds: [],
      warningIds: [],
    },
  },
  {
    id: "staging-config-light",
    description:
      "Ordinary config change in staging during business hours, every safeguard ready. The lightest path: base spine plus backup plus the business-hours pair, one business-hours risk, no readiness warnings.",
    input: {
      changeType: "config-change",
      environment: "staging",
      blastRadius: "single-device",
      reversibility: "easy-rollback",
      window: "business-hours",
      safeguards: ["change-approved", "backup-taken", "rollback-tested", "monitoring-ready", "comms-sent"],
      preset: "generic",
    },
    expect: {
      firedRuleIds: ["R-BASE-SPINE", "R-BACKUP-STEP", "R-BUSINESS-HOURS"],
      phases: [
        { phase: "preflight", stepIds: ["S-PF-SCOPE", "S-PF-BASELINE", "S-PF-BACKUP"] },
        { phase: "approvals", stepIds: ["S-AP-APPROVAL", "S-AP-NOTIFY"] },
        { phase: "execution", stepIds: ["S-EX-APPLY", "S-EX-SEQUENCE"] },
        { phase: "verification", stepIds: ["S-VF-REPEAT-BASELINE", "S-VF-WATCH"] },
        { phase: "rollback", stepIds: ["S-RB-TRIGGER", "S-RB-STEPS"] },
        { phase: "closeout", stepIds: ["S-CO-CONFIRM", "S-CO-CLOSE", "S-CO-SAVE"] },
      ],
      riskIds: ["RK-BUSINESS-HOURS"],
      warningIds: [],
    },
  },
];

export const RUNBOOK_REJECT_VECTORS: RejectVector[] = [
  { id: "empty", description: "empty API input", json: "   ", expectCode: "empty" },
  { id: "not-json", description: "non-JSON API input", json: "{not json", expectCode: "format" },
  { id: "missing-field", description: "a required enum field absent", json: '{"environment":"staging","blastRadius":"single-device","reversibility":"easy-rollback","window":"business-hours","safeguards":[],"preset":"generic"}', expectCode: "format" },
  { id: "bad-enum", description: "an out-of-vocabulary value is a format error, never a guess", json: '{"changeType":"reboot-everything","environment":"staging","blastRadius":"single-device","reversibility":"easy-rollback","window":"business-hours","safeguards":[],"preset":"generic"}', expectCode: "format" },
  { id: "bad-safeguard", description: "an out-of-vocabulary safeguard is a format error", json: '{"changeType":"config-change","environment":"staging","blastRadius":"single-device","reversibility":"easy-rollback","window":"business-hours","safeguards":["crossed-fingers"],"preset":"generic"}', expectCode: "format" },
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

  for (const v of RUNBOOK_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const firedOk = JSON.stringify(r.firedRuleIds) === JSON.stringify(v.expect.firedRuleIds);
      // Phase-by-phase step id comparison, in PHASE_ORDER.
      const gotPhases = r.phases.map((p) => ({ phase: p.phase, stepIds: p.steps.map((s) => s.id) }));
      const phasesOk = JSON.stringify(gotPhases) === JSON.stringify(v.expect.phases);
      const riskOk = JSON.stringify(r.risks.map((x) => x.id)) === JSON.stringify(v.expect.riskIds);
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      // Sanity: emitted phases are a subsequence of PHASE_ORDER.
      const orderOk = gotPhases.every((p, i, arr) => i === 0 || PHASE_ORDER.indexOf(p.phase) > PHASE_ORDER.indexOf(arr[i - 1].phase));
      if (!firedOk || !phasesOk || !riskOk || !warnOk || !orderOk) {
        failures.push(
          `${v.id}: fired=${firedOk} phases=${phasesOk} risk=${riskOk} warn=${warnOk} order=${orderOk} (got fired=${JSON.stringify(r.firedRuleIds)} phases=${JSON.stringify(gotPhases)} risks=${JSON.stringify(r.risks.map((x) => x.id))} warn=${JSON.stringify(r.warnings.map((w) => w.id))})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of RUNBOOK_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof RunbookError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = RUNBOOK_SNAPSHOT_VECTORS.length + RUNBOOK_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
