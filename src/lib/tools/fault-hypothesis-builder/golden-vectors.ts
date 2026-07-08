// ============================================================================
// src/lib/tools/fault-hypothesis-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS - the advisory-verification ruling (D-86 §3.1)
// made concrete for the whole Operations & Fieldcraft cluster:
//
//   Classic golden vectors assert known-correct OUTPUTS; an advisory tool has
//   no "correct" hypothesis set to assert. The engine is nonetheless fully
//   deterministic, so what gets pinned is the FIRING: for each structured
//   input, assert (a) exactly which rules fire, in registry order, (b) the
//   exact ranked hypothesis order with score and signal band, and (c) the
//   exact warning set. Any drift in rules, weights, ranking, or warnings
//   breaks the build - which is the entire point.
//
// The D-49 manifest carries `verificationModel: "rule-firing-snapshot"`.
// Tools without the field keep classic golden-vector semantics.
// ============================================================================

import { run, runFromJson, FhbError, type FhbInput } from "./compute";
import type { SignalStrength } from "@/lib/fieldcraft/schema";

export const GOLDEN_VECTOR_SET_ID = "fault-hypothesis-builder/2026-07-08";

interface SnapshotVector {
  id: string;
  description: string;
  input: FhbInput;
  expect: {
    firedRuleIds: string[];
    ranked: { id: string; score: number; signal: SignalStrength }[];
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

export const FHB_SNAPSHOT_VECTORS: SnapshotVector[] = [
  {
    id: "deploy-5xx-regression",
    description:
      "Errors for some users since a deploy, 5xx observed, TCP fine: change-regression leads (tie with app-backend broken by first-fire), partial-backend third. The D-83 Example scenario.",
    input: {
      symptom: "errors-for-some",
      scope: "some-users",
      changed: ["software-deploy"],
      timing: "since-change",
      clues: ["http-5xx", "tcp-connects-but-app-errors"],
      preset: "load-balancer",
    },
    expect: {
      firedRuleIds: ["R-CHG-ALIGN", "R-CHG-DEPLOY-5XX", "R-PARTIAL-INTERMIT", "R-PARTIAL-5XX", "R-APP-TCPOK", "R-APP-5XX"],
      ranked: [
        { id: "H-CHANGE-REGRESSION", score: 60, signal: "strong" },
        { id: "H-APP-BACKEND", score: 60, signal: "strong" },
        { id: "H-PARTIAL-BACKEND", score: 50, signal: "moderate" },
      ],
      warningIds: [],
    },
  },
  {
    id: "works-by-ip",
    description: "Works by IP, not by name, nothing (known) changed: resolution path leads; the 'nothing changed' claim is warned about.",
    input: {
      symptom: "errors-for-some",
      scope: "some-users",
      changed: ["nothing-known"],
      timing: "constant",
      clues: ["works-by-ip-not-name"],
      preset: "dns",
    },
    expect: {
      firedRuleIds: ["R-DNS-BYNAME", "R-PARTIAL-INTERMIT"],
      ranked: [
        { id: "H-DNS-RESOLUTION", score: 45, signal: "moderate" },
        { id: "H-PARTIAL-BACKEND", score: 35, signal: "moderate" },
      ],
      warningIds: ["W-NOCHANGE"],
    },
  },
  {
    id: "silent-cert-expiry",
    description: "Everyone down, TLS errors, 'nothing changed': the silent-expiry pattern reinforces TLS/PKI ahead of shared-dependency.",
    input: {
      symptom: "total-outage",
      scope: "everyone",
      changed: ["nothing-known"],
      timing: "constant",
      clues: ["tls-errors"],
      preset: "tls-pki",
    },
    expect: {
      firedRuleIds: ["R-TLS-ERRORS", "R-TLS-SILENT-EXPIRY", "R-SCOPE-EVERYONE"],
      ranked: [
        { id: "H-TLS-PKI", score: 50, signal: "moderate" },
        { id: "H-SHARED-DEPENDENCY", score: 40, signal: "moderate" },
      ],
      warningIds: ["W-NOCHANGE"],
    },
  },
  {
    id: "mtu-after-network-change",
    description: "One site slow on large transfers since a network change: path-MTU strong, the change itself second, site-shared and provider trailing.",
    input: {
      symptom: "slow",
      scope: "one-site",
      changed: ["network-change"],
      timing: "since-change",
      clues: ["slow-only-large-transfers", "timeouts"],
      preset: "generic",
    },
    expect: {
      firedRuleIds: ["R-CHG-ALIGN", "R-MTU-LARGE", "R-MTU-NETCHANGE", "R-SCOPE-SITE", "R-PROVIDER-TIMEOUTS-SITE"],
      ranked: [
        { id: "H-PATH-MTU", score: 60, signal: "strong" },
        { id: "H-CHANGE-REGRESSION", score: 45, signal: "moderate" },
        { id: "H-SHARED-DEPENDENCY", score: 25, signal: "weak" },
        { id: "H-EXTERNAL-PROVIDER", score: 15, signal: "weak" },
      ],
      warningIds: [],
    },
  },
  {
    id: "one-user-sparse",
    description: "One user, no clues given: client-local is the only domain, and BOTH input warnings fire (nothing-known + sparse clues).",
    input: {
      symptom: "intermittent",
      scope: "one-user",
      changed: ["nothing-known"],
      timing: "intermittent-random",
      clues: [],
      preset: "generic",
    },
    expect: {
      firedRuleIds: ["R-SCOPE-ONEUSER"],
      ranked: [{ id: "H-CLIENT-LOCAL", score: 30, signal: "moderate" }],
      warningIds: ["W-NOCHANGE", "W-SPARSE-CLUES"],
    },
  },
  {
    id: "new-service-provisioning",
    description: "A brand-new service unreachable: provisioning walk leads decisively; the config change on record stays a weak secondary.",
    input: {
      symptom: "cannot-reach-new-service",
      scope: "one-app",
      changed: ["config-change"],
      timing: "constant",
      clues: ["timeouts"],
      preset: "load-balancer",
    },
    expect: {
      firedRuleIds: ["R-CHG-PRESENT", "R-NEWSVC"],
      ranked: [
        { id: "H-PROVISIONING-GAP", score: 50, signal: "moderate" },
        { id: "H-CHANGE-REGRESSION", score: 20, signal: "weak" },
      ],
      warningIds: [],
    },
  },
  {
    id: "auth-after-provider-maintenance",
    description: "Auth failures since provider maintenance: the provider's own record outranks the identity chain (their change, not ours to diff).",
    input: {
      symptom: "auth-failures",
      scope: "everyone",
      changed: ["provider-maintenance"],
      timing: "since-change",
      clues: ["http-4xx-auth"],
      preset: "generic",
    },
    expect: {
      firedRuleIds: ["R-AUTH-SYMPTOM", "R-PROVIDER-MAINT", "R-EXT-ALIGN"],
      ranked: [
        { id: "H-EXTERNAL-PROVIDER", score: 50, signal: "moderate" },
        { id: "H-IDENTITY-CHAIN", score: 40, signal: "moderate" },
      ],
      warningIds: [],
    },
  },
  {
    id: "asymmetric-after-change",
    description: "Intermittent for some users since a network change, one path works and the other does not: change leads, asymmetry second, partial-backend third.",
    input: {
      symptom: "intermittent",
      scope: "some-users",
      changed: ["network-change"],
      timing: "since-change",
      clues: ["one-path-works-other-not"],
      preset: "generic",
    },
    expect: {
      firedRuleIds: ["R-CHG-ALIGN", "R-ASYM-PATH", "R-PARTIAL-INTERMIT"],
      ranked: [
        { id: "H-CHANGE-REGRESSION", score: 45, signal: "moderate" },
        { id: "H-ASYMMETRIC-PATH", score: 40, signal: "moderate" },
        { id: "H-PARTIAL-BACKEND", score: 35, signal: "moderate" },
      ],
      warningIds: [],
    },
  },
];

export const FHB_REJECT_VECTORS: RejectVector[] = [
  { id: "empty", description: "empty API input", json: "   ", expectCode: "empty" },
  { id: "not-json", description: "non-JSON API input", json: "{not json", expectCode: "format" },
  { id: "missing-field", description: "a required enum field absent", json: '{"scope":"everyone","changed":["nothing-known"],"timing":"constant","clues":[],"preset":"generic"}', expectCode: "format" },
  { id: "empty-changed", description: "changed[] must carry at least nothing-known", json: '{"symptom":"slow","scope":"everyone","changed":[],"timing":"constant","clues":[],"preset":"generic"}', expectCode: "format" },
  { id: "bad-enum", description: "an out-of-vocabulary value is a format error, never a guess", json: '{"symptom":"weird","scope":"everyone","changed":["nothing-known"],"timing":"constant","clues":[],"preset":"generic"}', expectCode: "format" },
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

  for (const v of FHB_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const firedOk = JSON.stringify(r.firedRuleIds) === JSON.stringify(v.expect.firedRuleIds);
      const rankedOk =
        r.hypotheses.length === v.expect.ranked.length &&
        r.hypotheses.every(
          (h, i) =>
            h.id === v.expect.ranked[i].id &&
            h.score === v.expect.ranked[i].score &&
            h.signal === v.expect.ranked[i].signal,
        );
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      if (!firedOk || !rankedOk || !warnOk) {
        failures.push(
          `${v.id}: fired=${firedOk} ranked=${rankedOk} warn=${warnOk} (got fired=${JSON.stringify(r.firedRuleIds)} ranked=${JSON.stringify(r.hypotheses.map((h) => [h.id, h.score, h.signal]))} warn=${JSON.stringify(r.warnings.map((w) => w.id))})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of FHB_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof FhbError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = FHB_SNAPSHOT_VECTORS.length + FHB_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
