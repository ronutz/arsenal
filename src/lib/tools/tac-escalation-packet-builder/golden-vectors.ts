// ============================================================================
// src/lib/tools/tac-escalation-packet-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS - the advisory-verification ruling (D-86 §3.1),
// as set by the FHB pilot and reused across the fieldcraft cluster.
//
// For each structured input, assert: the exact fired rule ids (registry
// order), the exact packet section ids (fixed order), the exact to-collect ids
// (first-fire order, already-collected artifacts dropped), the exact readiness
// risk ids, the exact warning ids, and the coarse readiness read. Any drift
// breaks the build. The D-49 manifest carries `verificationModel:
// "rule-firing-snapshot"`.
// ============================================================================

import { run, runFromJson, PacketError, SECTION_ORDER, type PacketInput, type SectionId } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "tac-escalation-packet-builder/2026-07-08";

interface PacketSnapshotVector {
  id: string;
  description: string;
  input: PacketInput;
  expect: {
    firedRuleIds: string[];
    sectionIds: SectionId[];
    toCollectIds: string[];
    riskIds: string[];
    warningIds: string[];
    readiness: "ready" | "nearly" | "gather-first";
  };
}

interface RejectVector {
  id: string;
  description: string;
  json: string;
  expectCode: "empty" | "format";
}

export const PACKET_SNAPSHOT_VECTORS: PacketSnapshotVector[] = [
  {
    id: "lb-sev1-nothing",
    description:
      "A load balancer Sev 1 (down), reproducible, nothing collected, nothing tried. The D-83 Example: the full to-collect checklist, the thin-packet and no-problem/no-impact/no-diagnostic readiness notes, the nothing-tried and Sev1-no-impact cautions, gather-first.",
    input: { vendor: "load-balancer", severity: "sev1-down", reproducibility: "reproducible", collected: [], tried: ["nothing-yet"] },
    expect: {
      firedRuleIds: ["R-BASE-CORE", "R-NO-PROBLEM", "R-NO-IMPACT", "R-DIAG-BUNDLE", "R-NO-DIAG", "R-REPRODUCIBLE", "R-HIGH-SEV", "R-SEV1-THIN"],
      sectionIds: ["problem", "severity-impact", "environment", "timeline", "tried", "attached", "to-collect", "ask"],
      toCollectIds: ["TC-PROBLEM", "TC-ERROR", "TC-TIMELINE", "TC-IMPACT", "TC-VERSIONS", "TC-DIAG-BUNDLE", "TC-CONFIG", "TC-REPRO", "TC-TOPOLOGY", "TC-PCAP"],
      riskIds: ["RK-NO-PROBLEM", "RK-NO-IMPACT", "RK-NO-DIAG", "RK-SEV1-THIN"],
      warningIds: ["W-NOTHING-TRIED", "W-SEV1-NO-IMPACT"],
      readiness: "gather-first",
    },
  },
  {
    id: "firewall-sev2-partial",
    description:
      "A firewall Sev 2 (degraded), intermittent, with problem/error/impact collected and restart+config-review tried. Exercises the intermittent capture-staging path, the no-diagnostic note, and a nearly-ready read (medium risks only).",
    input: { vendor: "firewall", severity: "sev2-degraded", reproducibility: "intermittent", collected: ["problem-statement", "exact-error", "business-impact"], tried: ["restart", "config-review"] },
    expect: {
      firedRuleIds: ["R-BASE-CORE", "R-DIAG-BUNDLE", "R-NO-DIAG", "R-INTERMITTENT", "R-HIGH-SEV"],
      sectionIds: ["problem", "severity-impact", "environment", "timeline", "tried", "attached", "to-collect", "ask"],
      toCollectIds: ["TC-TIMELINE", "TC-VERSIONS", "TC-DIAG-BUNDLE", "TC-CONFIG", "TC-PCAP", "TC-LOGS", "TC-TOPOLOGY"],
      riskIds: ["RK-NO-DIAG", "RK-NO-REPRO-CAP"],
      warningIds: [],
      readiness: "nearly",
    },
  },
  {
    id: "dns-sev3-ready",
    description:
      "A DNS Sev 3 (question), happened once, well prepared (problem/error/timeline/impact/diagnostic/logs collected). Exercises the DNS-vendor logs item (already satisfied by collected logs), the happened-once path, and a ready read with a short checklist.",
    input: { vendor: "dns", severity: "sev3-question", reproducibility: "happened-once", collected: ["problem-statement", "exact-error", "timeline", "business-impact", "diagnostic-bundle", "logs"], tried: ["kb-search", "config-review"] },
    expect: {
      firedRuleIds: ["R-BASE-CORE", "R-DIAG-BUNDLE", "R-HAPPENED-ONCE", "R-DNS-VENDOR"],
      sectionIds: ["problem", "severity-impact", "environment", "timeline", "tried", "attached", "to-collect", "ask"],
      toCollectIds: ["TC-VERSIONS", "TC-CONFIG"],
      riskIds: [],
      warningIds: [],
      readiness: "ready",
    },
  },
  {
    id: "tls-sev1-thin",
    description:
      "A TLS/PKI Sev 1 (down), reproducible, only the problem statement collected, rollback tried. Exercises the TLS-vendor handshake-capture item, the Sev1-thin gate, and the Sev1-no-impact caution with a gather-first read.",
    input: { vendor: "tls-pki", severity: "sev1-down", reproducibility: "reproducible", collected: ["problem-statement"], tried: ["rollback"] },
    expect: {
      firedRuleIds: ["R-BASE-CORE", "R-NO-IMPACT", "R-DIAG-BUNDLE", "R-NO-DIAG", "R-REPRODUCIBLE", "R-HIGH-SEV", "R-SEV1-THIN", "R-TLS-VENDOR"],
      sectionIds: ["problem", "severity-impact", "environment", "timeline", "tried", "attached", "to-collect", "ask"],
      toCollectIds: ["TC-ERROR", "TC-TIMELINE", "TC-IMPACT", "TC-VERSIONS", "TC-DIAG-BUNDLE", "TC-CONFIG", "TC-REPRO", "TC-TOPOLOGY", "TC-PCAP"],
      riskIds: ["RK-NO-IMPACT", "RK-NO-DIAG", "RK-SEV1-THIN"],
      warningIds: ["W-SEV1-NO-IMPACT"],
      readiness: "gather-first",
    },
  },
  {
    id: "generic-sev4-workaround",
    description:
      "A generic Sev 4 (informational), happened once, well collected, workaround in place. Exercises the workaround caution and a ready read on a low-urgency case.",
    input: { vendor: "generic", severity: "sev4-info", reproducibility: "happened-once", collected: ["problem-statement", "exact-error", "business-impact", "diagnostic-bundle"], tried: ["workaround-applied"] },
    expect: {
      firedRuleIds: ["R-BASE-CORE", "R-DIAG-BUNDLE", "R-HAPPENED-ONCE"],
      sectionIds: ["problem", "severity-impact", "environment", "timeline", "tried", "attached", "to-collect", "ask"],
      toCollectIds: ["TC-TIMELINE", "TC-VERSIONS", "TC-CONFIG", "TC-LOGS"],
      riskIds: [],
      warningIds: ["W-WORKAROUND-NOTE"],
      readiness: "ready",
    },
  },
  {
    id: "routing-sev2-complete",
    description:
      "A routing/switching Sev 2 (degraded), reproducible, nearly everything collected. The near-complete path: only versions remain to collect, no risks, a ready read - the shape of a well-prepared escalation.",
    input: { vendor: "routing-switching", severity: "sev2-degraded", reproducibility: "reproducible", collected: ["problem-statement", "exact-error", "timeline", "topology", "business-impact", "diagnostic-bundle", "config-backup", "packet-capture", "repro-steps"], tried: ["config-review", "failover"] },
    expect: {
      firedRuleIds: ["R-BASE-CORE", "R-DIAG-BUNDLE", "R-REPRODUCIBLE", "R-HIGH-SEV"],
      sectionIds: ["problem", "severity-impact", "environment", "timeline", "tried", "attached", "to-collect", "ask"],
      toCollectIds: ["TC-VERSIONS"],
      riskIds: [],
      warningIds: [],
      readiness: "ready",
    },
  },
];

export const PACKET_REJECT_VECTORS: RejectVector[] = [
  { id: "empty", description: "empty API input", json: "   ", expectCode: "empty" },
  { id: "not-json", description: "non-JSON API input", json: "{not json", expectCode: "format" },
  { id: "missing-field", description: "a required enum field absent", json: '{"severity":"sev1-down","reproducibility":"reproducible","collected":[],"tried":[]}', expectCode: "format" },
  { id: "bad-vendor", description: "an out-of-vocabulary vendor is a format error", json: '{"vendor":"acme-corp","severity":"sev1-down","reproducibility":"reproducible","collected":[],"tried":[]}', expectCode: "format" },
  { id: "bad-collected", description: "an out-of-vocabulary collected value is a format error", json: '{"vendor":"generic","severity":"sev1-down","reproducibility":"reproducible","collected":["magic-wand"],"tried":[]}', expectCode: "format" },
  { id: "collected-not-array", description: "collected must be an array", json: '{"vendor":"generic","severity":"sev1-down","reproducibility":"reproducible","collected":"logs","tried":[]}', expectCode: "format" },
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

  for (const v of PACKET_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const firedOk = JSON.stringify(r.firedRuleIds) === JSON.stringify(v.expect.firedRuleIds);
      const gotSections = r.sections.map((s) => s.section);
      const sectionOk = JSON.stringify(gotSections) === JSON.stringify(v.expect.sectionIds);
      const collectOk = JSON.stringify(r.toCollect.map((t) => t.id)) === JSON.stringify(v.expect.toCollectIds);
      const riskOk = JSON.stringify(r.risks.map((x) => x.id)) === JSON.stringify(v.expect.riskIds);
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      const readyOk = r.readiness === v.expect.readiness;
      // Sanity: sections are exactly SECTION_ORDER, in order.
      const orderOk = JSON.stringify(gotSections) === JSON.stringify(SECTION_ORDER);
      // Language-discipline sanity: no to-collect item duplicates something the
      // input already marked collected (the checklist is the GAP, not a dump).
      if (!firedOk || !sectionOk || !collectOk || !riskOk || !warnOk || !readyOk || !orderOk) {
        failures.push(
          `${v.id}: fired=${firedOk} sections=${sectionOk} collect=${collectOk} risk=${riskOk} warn=${warnOk} ready=${readyOk} order=${orderOk} (got fired=${JSON.stringify(r.firedRuleIds)} collect=${JSON.stringify(r.toCollect.map((t) => t.id))} risk=${JSON.stringify(r.risks.map((x) => x.id))} warn=${JSON.stringify(r.warnings.map((w) => w.id))} ready=${r.readiness})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of PACKET_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof PacketError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = PACKET_SNAPSHOT_VECTORS.length + PACKET_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
