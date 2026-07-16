// ============================================================================
// src/lib/tools/flow-path-reasoner/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS (D-86 §3.1). For each structured input, assert
// (a) exactly which rules fire, in registry order, (b) the exact ranked
// failure-domain list with score and signal band, (c) the exact warning set,
// and (d) - FPR-specific - the exact forward HOP SEQUENCE (the canonical
// chain is itself an output surface, so its construction is pinned).
// Expectations PINNED FROM ENGINE EXECUTION (tsx harness, 2026-07-16), the
// cluster's honest convention: the vectors freeze today's behavior so any
// drift in rules, weights, chain construction, or warnings breaks the build.
// ============================================================================

import { run, runFromJson, FprError, type FprInput } from "./compute";
import type { SignalStrength } from "@/lib/fieldcraft/schema";

export const GOLDEN_VECTOR_SET_ID = "flow-path-reasoner/2026-07-16";

interface SnapshotVector {
  id: string;
  description: string;
  input: FprInput;
  expect: {
    firedRuleIds: string[];
    domains: { id: string; score: number; signal: SignalStrength }[];
    warningIds: string[];
    hops: string[];
  };
}

interface RejectVector {
  id: string;
  description: string;
  /** Raw JSON string fed to runFromJson (the API-parity gate). */
  json: string;
  expectCode: "empty" | "format";
}

export const FPR_SNAPSHOT_VECTORS: readonly SnapshotVector[] = [
  {
    id: "lb-snat-reencrypt",
    description: "Load balancer with SNAT and re-encryption: identity visibility and the TLS segment split lead.",
    input: { archetype: "load-balancer", resolution: "private-dns", intermediaries: "none", transformation: "snat", tls: "terminate-reencrypt", auth: "none", returnPath: "known-symmetric", preset: "load-balancer" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-TR-SNAT", "R-TLS-REENC", "R-ENF-UNKNOWN"],
      domains: [{ id: "FD-IDENTITY-VISIBILITY", score: 30, signal: "moderate" }, { id: "FD-TLS-SEGMENT", score: 30, signal: "moderate" }, { id: "FD-SILENT-MIDDLEBOX", score: 20, signal: "weak" }],
      warningIds: ["W-TOPOLOGY-SENSITIVE", "W-ENF-UNKNOWN"],
      hops: ["N-CLIENT", "N-LOAD-BALANCER", "N-SERVER"],
    },
  },
  {
    id: "federated-app-proxy",
    description: "Identity-federated app behind a proxy: the identity side-flow dominates the ranking.",
    input: { archetype: "identity-federated", resolution: "public-dns", intermediaries: "proxy-waf", transformation: "proxy-source", tls: "terminate-once", auth: "redirect-idp", returnPath: "known-symmetric", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-ARCH-FED", "R-TR-PROXYSRC", "R-TLS-ONCE", "R-AUTH-IDP", "R-ENF-UNKNOWN"],
      domains: [{ id: "FD-IDENTITY-SIDEFLOW", score: 55, signal: "moderate" }, { id: "FD-IDENTITY-VISIBILITY", score: 25, signal: "weak" }, { id: "FD-TLS-SEGMENT", score: 20, signal: "weak" }, { id: "FD-SILENT-MIDDLEBOX", score: 20, signal: "weak" }, { id: "FD-TWO-SESSION", score: 15, signal: "weak" }],
      warningIds: ["W-TOPOLOGY-SENSITIVE", "W-ENF-UNKNOWN"],
      hops: ["N-CLIENT", "N-PROXY", "N-SERVER"],
    },
  },
  {
    id: "vpn-known-asymmetric",
    description: "Site-to-site VPN with a known-asymmetric return: the gateway pair renders; selectors lead.",
    input: { archetype: "site-to-site-vpn", resolution: "private-dns", intermediaries: "none", transformation: "none", tls: "end-to-end", auth: "none", returnPath: "known-asymmetric", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-ARCH-VPN", "R-TLS-E2E", "R-ENF-UNKNOWN"],
      domains: [{ id: "FD-TUNNEL-SELECTORS", score: 30, signal: "moderate" }, { id: "FD-SILENT-MIDDLEBOX", score: 20, signal: "weak" }],
      warningIds: ["W-TOPOLOGY-SENSITIVE", "W-ENF-UNKNOWN"],
      hops: ["N-CLIENT", "N-VPN-A", "N-VPN-B", "N-SERVER"],
    },
  },
  {
    id: "split-horizon-direct",
    description: "Direct path on split-horizon DNS: the resolution divergence is the story.",
    input: { archetype: "direct", resolution: "split-horizon", intermediaries: "none", transformation: "none", tls: "end-to-end", auth: "local", returnPath: "known-symmetric", preset: "dns" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-RES-SPLIT", "R-TLS-E2E"],
      domains: [{ id: "FD-RESOLUTION-SPLIT", score: 35, signal: "moderate" }],
      warningIds: ["W-TOPOLOGY-SENSITIVE"],
      hops: ["N-CLIENT", "N-SERVER"],
    },
  },
  {
    id: "everything-unknown",
    description: "Every dimension unknown: the warning storm, the explicit unknowns list, and FD-UNKNOWN-PATH strong on top.",
    input: { archetype: "unknown-mixed", resolution: "unknown", intermediaries: "unknown", transformation: "unknown", tls: "unknown", auth: "unknown", returnPath: "unknown", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-RES-UNKNOWN", "R-ARCH-UNKNOWN", "R-TR-UNKNOWN", "R-TLS-UNKNOWN", "R-AUTH-UNKNOWN", "R-RET-UNKNOWN", "R-ENF-UNKNOWN"],
      domains: [{ id: "FD-UNKNOWN-PATH", score: 80, signal: "strong" }, { id: "FD-STATEFUL-ASYM", score: 25, signal: "weak" }, { id: "FD-SILENT-MIDDLEBOX", score: 20, signal: "weak" }],
      warningIds: ["W-TOPOLOGY-SENSITIVE", "W-RES-UNKNOWN", "W-PATH-UNKNOWN", "W-TR-UNKNOWN", "W-TLS-UNKNOWN", "W-AUTH-UNKNOWN", "W-RET-UNKNOWN", "W-ENF-UNKNOWN"],
      hops: ["N-CLIENT", "N-UNKNOWN-1", "N-SERVER"],
    },
  },
  {
    id: "sse-agent-multiexit",
    description: "Outbound SSE with an agent and multiple exits: two sessions, return policy, and TLS segments share the front.",
    input: { archetype: "outbound-sse", resolution: "public-dns", intermediaries: "none", transformation: "proxy-source", tls: "terminate-reencrypt", auth: "agent-connector", returnPath: "multiple-exits", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-ARCH-PROXY", "R-TR-PROXYSRC", "R-TLS-REENC", "R-AUTH-AGENT", "R-RET-POLICY", "R-ENF-UNKNOWN"],
      domains: [{ id: "FD-TWO-SESSION", score: 40, signal: "moderate" }, { id: "FD-RETURN-POLICY", score: 30, signal: "moderate" }, { id: "FD-TLS-SEGMENT", score: 30, signal: "moderate" }, { id: "FD-IDENTITY-VISIBILITY", score: 25, signal: "weak" }, { id: "FD-CONNECTOR", score: 25, signal: "weak" }, { id: "FD-SILENT-MIDDLEBOX", score: 20, signal: "weak" }],
      warningIds: ["W-TOPOLOGY-SENSITIVE", "W-ENF-UNKNOWN"],
      hops: ["N-CLIENT", "N-SSE-EDGE", "N-SERVER"],
    },
  },
  {
    id: "published-fw-dnat",
    description: "Published app behind a firewall with DNAT declaring terminate-once: the TLS story and the path story disagree, and the model says so.",
    input: { archetype: "internet-published", resolution: "public-dns", intermediaries: "none", transformation: "dnat", tls: "terminate-once", auth: "none", returnPath: "known-symmetric", preset: "firewall" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-TR-DNAT", "R-TLS-ONCE", "R-ENF-UNKNOWN"],
      domains: [{ id: "FD-TLS-SEGMENT", score: 20, signal: "weak" }, { id: "FD-SILENT-MIDDLEBOX", score: 20, signal: "weak" }],
      warningIds: ["W-TLS-NODES", "W-TOPOLOGY-SENSITIVE", "W-ENF-UNKNOWN"],
      hops: ["N-CLIENT", "N-FIREWALL", "N-SERVER"],
    },
  },
  {
    id: "east-west-sd-plain",
    description: "East-west over service discovery in plaintext: the registry is part of the path.",
    input: { archetype: "east-west", resolution: "service-discovery", intermediaries: "none", transformation: "none", tls: "plaintext", auth: "none", returnPath: "known-symmetric", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-RES-SD", "R-TLS-PLAIN"],
      domains: [{ id: "FD-REGISTRY", score: 30, signal: "moderate" }],
      warningIds: ["W-TOPOLOGY-SENSITIVE"],
      hops: ["N-CLIENT", "N-SERVER"],
    },
  },
  {
    id: "proxy-dense-multi",
    description: "Dense proxied path - multiple middleboxes, both rewrites, multi-TLS, IdP, policy-routed returns: order-assumed fires and four domains tie at moderate.",
    input: { archetype: "proxy-waf", resolution: "private-dns", intermediaries: "multiple", transformation: "both", tls: "multiple-terminations", auth: "redirect-idp", returnPath: "policy-routed", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-MODEL", "R-ARCH-PROXY", "R-TR-SNAT", "R-TR-DNAT", "R-TLS-REENC", "R-AUTH-IDP", "R-RET-POLICY", "R-ENF-UNKNOWN", "R-ORDER-ASSUMED"],
      domains: [{ id: "FD-RETURN-POLICY", score: 30, signal: "moderate" }, { id: "FD-IDENTITY-SIDEFLOW", score: 30, signal: "moderate" }, { id: "FD-IDENTITY-VISIBILITY", score: 30, signal: "moderate" }, { id: "FD-TLS-SEGMENT", score: 30, signal: "moderate" }, { id: "FD-TWO-SESSION", score: 25, signal: "weak" }, { id: "FD-SILENT-MIDDLEBOX", score: 20, signal: "weak" }],
      warningIds: ["W-TLS-NODES", "W-TOPOLOGY-SENSITIVE", "W-ENF-UNKNOWN", "W-ORDER-ASSUMED"],
      hops: ["N-CLIENT", "N-FIREWALL", "N-PROXY", "N-UNKNOWN-3", "N-SERVER"],
    },
  },
];

export const FPR_REJECT_VECTORS: readonly RejectVector[] = [
  { id: "reject-empty", description: "Empty object rejects with the 'empty' code.", json: "{}", expectCode: "empty" },
  { id: "reject-not-json", description: "Non-JSON input rejects with the 'format' code.", json: "map my network", expectCode: "format" },
  { id: "reject-missing-field", description: "A missing enum field rejects with the 'format' code.", json: JSON.stringify({ archetype: "direct", resolution: "public-dns", intermediaries: "none", transformation: "none", tls: "end-to-end", auth: "none", preset: "generic" }), expectCode: "format" },
  { id: "reject-bad-enum", description: "An out-of-enum value rejects with the 'format' code.", json: JSON.stringify({ archetype: "direct", resolution: "public-dns", intermediaries: "none", transformation: "none", tls: "end-to-end", auth: "none", returnPath: "hopefully-symmetric", preset: "generic" }), expectCode: "format" },
];

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  for (const v of FPR_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const firedOk = JSON.stringify(r.firedRules.map((f) => f.id)) === JSON.stringify(v.expect.firedRuleIds);
      const domOk =
        r.domains.length === v.expect.domains.length &&
        r.domains.every((d, i) => d.id === v.expect.domains[i].id && d.score === v.expect.domains[i].score && d.signal === v.expect.domains[i].signal);
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      const hops = r.nodes.filter((n) => !["resolver", "idp"].includes(n.kind)).map((n) => n.id);
      const hopOk = JSON.stringify(hops) === JSON.stringify(v.expect.hops);
      if (!firedOk || !domOk || !warnOk || !hopOk) {
        failures.push(
          `${v.id}: fired=${firedOk} domains=${domOk} warn=${warnOk} hops=${hopOk} (got fired=${JSON.stringify(r.firedRules.map((f) => f.id))} domains=${JSON.stringify(r.domains.map((d) => [d.id, d.score, d.signal]))} warn=${JSON.stringify(r.warnings.map((w) => w.id))} hops=${JSON.stringify(hops)})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of FPR_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof FprError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = FPR_SNAPSHOT_VECTORS.length + FPR_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
