// ============================================================================
// src/lib/tools/packet-capture-plan-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// RULE-FIRING SNAPSHOT VECTORS (the D-86 §3.1 cluster ruling). For each
// structured input, assert (a) exactly which rules fire, in registry order,
// (b) the exact ranked capture-point list with score and signal band, (c) the
// exact warning set, and (d) - PCPB-specific - the exact phase-1 point set
// (the "minimum viable capture set" is a first-class output surface here).
// Expectations were PINNED FROM ENGINE EXECUTION at authoring time (tsx
// harness, 2026-07-16), the pilot's honest convention: the vectors freeze
// today's behavior so any drift in rules, weights, ranking, phases, or
// warnings breaks the build.
// ============================================================================

import { run, runFromJson, PcpbError, type PcpbInput } from "./compute";
import type { SignalStrength } from "@/lib/fieldcraft/schema";

export const GOLDEN_VECTOR_SET_ID = "packet-capture-plan-builder/2026-07-16";

interface SnapshotVector {
  id: string;
  description: string;
  input: PcpbInput;
  expect: {
    firedRuleIds: string[];
    ranked: { id: string; score: number; signal: SignalStrength }[];
    warningIds: string[];
    phase1: string[];
  };
}

interface RejectVector {
  id: string;
  description: string;
  /** Raw JSON string fed to runFromJson (the API-parity gate). */
  json: string;
  expectCode: "empty" | "format";
}

export const PCPB_SNAPSHOT_VECTORS: readonly SnapshotVector[] = [
  {
    id: "lb-timeout-classic",
    description: "Load-balanced timeout: both sides of the balancer are the minimum viable set. (D-83 Example vector.)",
    input: { archetype: "load-balancer", symptom: "timeout", trafficClass: "tcp", intermediaries: "none", transformation: "none", access: "both-endpoints", timeBehavior: "constant", preset: "load-balancer" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-LB", "R-SY-TIMEOUT"],
      ranked: [
        { id: "P-LB-FRONT", score: 30, signal: "moderate" },
        { id: "P-LB-BACK", score: 30, signal: "moderate" },
        { id: "P-CLIENT", score: 20, signal: "weak" },
        { id: "P-SERVER", score: 20, signal: "weak" },
      ],
      warningIds: [],
      phase1: ["P-LB-FRONT", "P-LB-BACK"],
    },
  },
  {
    id: "tls-fail-at-proxy",
    description: "TLS failure at a terminating proxy: two sessions, two captures; transport-vs-payload warning fires.",
    input: { archetype: "proxy-waf", symptom: "tls-failure", trafficClass: "tls", intermediaries: "none", transformation: "tls-termination", access: "endpoint-plus-intermediary", timeBehavior: "constant", preset: "tls-pki" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-PROXY", "R-TR-TLS", "R-SY-TLSFAIL", "R-TC-SENSITIVE"],
      ranked: [
        { id: "P-PROXY-FRONT", score: 25, signal: "weak" },
        { id: "P-PROXY-BACK", score: 25, signal: "weak" },
        { id: "P-CLIENT", score: 15, signal: "weak" },
      ],
      warningIds: ["W-TLS-CLAIMS", "W-SENSITIVE"],
      phase1: ["P-PROXY-FRONT", "P-PROXY-BACK"],
    },
  },
  {
    id: "oneway-after-vpn-change",
    description: "One-way traffic over a site-to-site VPN after a change: inner side leads; before/after pairing demanded.",
    input: { archetype: "site-to-site-vpn", symptom: "one-way", trafficClass: "udp", intermediaries: "none", transformation: "none", access: "multiple-points", timeBehavior: "change-related", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-VPN", "R-SY-ONEWAY", "R-TM-CHANGE"],
      ranked: [
        { id: "P-VPN-INNER", score: 30, signal: "moderate" },
        { id: "P-VPN-OUTER", score: 20, signal: "weak" },
        { id: "P-CLIENT", score: 15, signal: "weak" },
        { id: "P-SERVER", score: 15, signal: "weak" },
      ],
      warningIds: [],
      phase1: ["P-VPN-INNER", "P-VPN-OUTER"],
    },
  },
  {
    id: "dns-connect-failure",
    description: "Connect failure on a DNS-class flow: the resolver leg outranks everything.",
    input: { archetype: "direct", symptom: "connect-failure", trafficClass: "dns", intermediaries: "none", transformation: "none", access: "both-endpoints", timeBehavior: "constant", preset: "dns" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-DIRECT", "R-SY-CONNFAIL", "R-TC-DNS"],
      ranked: [
        { id: "P-RESOLVER", score: 40, signal: "moderate" },
        { id: "P-CLIENT", score: 30, signal: "moderate" },
        { id: "P-SERVER", score: 20, signal: "weak" },
      ],
      warningIds: [],
      phase1: ["P-RESOLVER", "P-CLIENT"],
    },
  },
  {
    id: "unknown-path-low-confidence",
    description: "Everything unknown, one-sided access, intermittent: the warning-storm vector - the plan refuses false confidence.",
    input: { archetype: "unknown-mixed", symptom: "timeout", trafficClass: "mixed", intermediaries: "unknown", transformation: "unknown", access: "client-only", timeBehavior: "intermittent", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-UNKNOWN", "R-INT-UNKNOWN", "R-SY-TIMEOUT", "R-TC-SENSITIVE", "R-TC-MIXED", "R-AC-SINGLE", "R-TM-SYNC"],
      ranked: [
        { id: "P-CLIENT", score: 20, signal: "weak" },
        { id: "P-SERVER", score: 20, signal: "weak" },
      ],
      warningIds: ["W-PATH-UNKNOWN", "W-INT-UNKNOWN", "W-SENSITIVE", "W-SINGLE-POINT", "W-SYNC"],
      phase1: ["P-CLIENT", "P-SERVER"],
    },
  },
  {
    id: "east-west-loss-under-load",
    description: "East-west packet loss under load: endpoints plus a mirror as arbiter; sync discipline fires.",
    input: { archetype: "east-west", symptom: "packet-loss", trafficClass: "tcp", intermediaries: "none", transformation: "none", access: "multiple-points", timeBehavior: "load-related", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-EW", "R-SY-LOSS", "R-TM-SYNC"],
      ranked: [
        { id: "P-CLIENT", score: 30, signal: "moderate" },
        { id: "P-SERVER", score: 30, signal: "moderate" },
        { id: "P-MIRROR", score: 20, signal: "weak" },
      ],
      warningIds: ["W-SYNC"],
      phase1: ["P-CLIENT", "P-SERVER"],
    },
  },
  {
    id: "client-specific-http-behind-fw",
    description: "Client-specific HTTP errors behind a firewall: the enforcement pair leads; differential client capture attached.",
    input: { archetype: "firewall-nat", symptom: "http-error", trafficClass: "http", intermediaries: "firewall", transformation: "none", access: "endpoint-plus-intermediary", timeBehavior: "client-specific", preset: "firewall" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-FWNAT", "R-INT-FW", "R-SY-HTTPERR", "R-TC-SENSITIVE", "R-TM-CLIENT"],
      ranked: [
        { id: "P-FW-OUT", score: 35, signal: "moderate" },
        { id: "P-FW-IN", score: 35, signal: "moderate" },
        { id: "P-CLIENT", score: 15, signal: "weak" },
        { id: "P-SERVER", score: 10, signal: "weak" },
      ],
      warningIds: ["W-SENSITIVE"],
      phase1: ["P-FW-OUT", "P-FW-IN"],
    },
  },
  {
    id: "sse-intermittent-latency",
    description: "Intermittent latency through an SSE tunnel: client and egress split the question; TLS and sync cautions fire.",
    input: { archetype: "outbound-sse", symptom: "intermittent-latency", trafficClass: "tls", intermediaries: "none", transformation: "tls-termination", access: "both-endpoints", timeBehavior: "intermittent", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-SSE", "R-TR-TLS", "R-SY-LATENCY", "R-TC-SENSITIVE", "R-TM-SYNC"],
      ranked: [
        { id: "P-CLIENT", score: 35, signal: "moderate" },
        { id: "P-EGRESS", score: 25, signal: "weak" },
        { id: "P-SERVER", score: 10, signal: "weak" },
      ],
      warningIds: ["W-TLS-CLAIMS", "W-SENSITIVE", "W-SYNC"],
      phase1: ["P-CLIENT", "P-EGRESS"],
    },
  },
  {
    id: "auth-redirect-connect-failure",
    description: "Connect failure with an auth redirect in play: the identity side-flow enters the plan and its matrix candidate.",
    input: { archetype: "proxy-waf", symptom: "connect-failure", trafficClass: "tls", intermediaries: "none", transformation: "auth-redirect", access: "both-endpoints", timeBehavior: "constant", preset: "generic" },
    expect: {
      firedRuleIds: ["R-BASE-AUTHZ", "R-ARCH-PROXY", "R-TR-AUTHRED", "R-SY-CONNFAIL", "R-TC-SENSITIVE"],
      ranked: [
        { id: "P-RESOLVER", score: 25, signal: "weak" },
        { id: "P-PROXY-FRONT", score: 25, signal: "weak" },
        { id: "P-PROXY-BACK", score: 25, signal: "weak" },
        { id: "P-CLIENT", score: 20, signal: "weak" },
      ],
      warningIds: ["W-SENSITIVE"],
      phase1: ["P-RESOLVER", "P-PROXY-FRONT"],
    },
  },
];

export const PCPB_REJECT_VECTORS: readonly RejectVector[] = [
  { id: "reject-empty", description: "Empty object rejects with the 'empty' code.", json: "{}", expectCode: "empty" },
  { id: "reject-not-json", description: "Non-JSON input rejects with the 'format' code.", json: "capture everything please", expectCode: "format" },
  { id: "reject-missing-field", description: "A missing enum field rejects with the 'format' code.", json: JSON.stringify({ archetype: "direct", trafficClass: "tcp", intermediaries: "none", transformation: "none", access: "both-endpoints", timeBehavior: "constant", preset: "generic" }), expectCode: "format" },
  { id: "reject-bad-enum", description: "An out-of-enum value rejects with the 'format' code.", json: JSON.stringify({ archetype: "direct", symptom: "vibes", trafficClass: "tcp", intermediaries: "none", transformation: "none", access: "both-endpoints", timeBehavior: "constant", preset: "generic" }), expectCode: "format" },
];

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  for (const v of PCPB_SNAPSHOT_VECTORS) {
    try {
      const r = run(v.input);
      const firedOk = JSON.stringify(r.firedRules.map((f) => f.id)) === JSON.stringify(v.expect.firedRuleIds);
      const rankedOk =
        r.points.length === v.expect.ranked.length &&
        r.points.every(
          (p, i) => p.id === v.expect.ranked[i].id && p.score === v.expect.ranked[i].score && p.signal === v.expect.ranked[i].signal,
        );
      const warnOk = JSON.stringify(r.warnings.map((w) => w.id)) === JSON.stringify(v.expect.warningIds);
      const phaseOk = JSON.stringify(r.phases[0].pointIds) === JSON.stringify(v.expect.phase1);
      if (!firedOk || !rankedOk || !warnOk || !phaseOk) {
        failures.push(
          `${v.id}: fired=${firedOk} ranked=${rankedOk} warn=${warnOk} phase=${phaseOk} (got fired=${JSON.stringify(r.firedRules.map((f) => f.id))} ranked=${JSON.stringify(r.points.map((p) => [p.id, p.score, p.signal]))} warn=${JSON.stringify(r.warnings.map((w) => w.id))} phase1=${JSON.stringify(r.phases[0].pointIds)})`,
        );
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of PCPB_REJECT_VECTORS) {
    try {
      runFromJson(v.json);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof PcpbError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }

  const total = PCPB_SNAPSHOT_VECTORS.length + PCPB_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
