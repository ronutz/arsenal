// ============================================================================
// src/lib/tools/zscaler-firewall-rule-order-simulator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the ZIA firewall rule-order simulator. They pin the documented
// semantics (live-verified 2026-07-21): ascending-order evaluation with stop
// at first match; disabled rules skipped but keeping their place; the
// undeletable Default rule blocking by default (deny-by-default out of the
// box) with an editable action; the Any-means-ignored criteria convention;
// pairwise shadowing (exact duplicate, any-over-specific, port-range
// containment) and its documented non-findings (different protocol is NOT a
// shadow); and the helpful-error paths (duplicate order, bad action, bad
// CIDR, bad port).
// ============================================================================

import { run, type SimResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "zscaler-firewall-rule-order-simulator-golden-v1";

export interface FwVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectVerdictSource?: "rule" | "default";
  expectVerdictOrder?: number;
  expectVerdictAction?: string;
  expectTraceOutcomeAt?: { index: number; outcome: "skipped-disabled" | "no-match" | "match" };
  expectFailedOnAt?: { index: number; failedOn: "proto" | "port" | "dest" | "src" };
  expectShadowCount?: number;
  expectShadowedOrder?: number;
  expectShadowedBy?: number;
  expectFirstRuleOrder?: number;
  expectNoteIncludes?: string;
}

export const FW_VECTORS: FwVector[] = [
  {
    id: "first-match-stops",
    description: "Two rules both match; the lower order wins and evaluation stops.",
    input: [
      "10 | allow-web | allow | proto=tcp port=443",
      "20 | block-web | block | proto=tcp port=443",
      "flow: proto=tcp port=443 dest=203.0.113.7",
    ].join("\n"),
    expectOk: true,
    expectVerdictSource: "rule",
    expectVerdictOrder: 10,
    expectVerdictAction: "allow",
    expectShadowCount: 1,
    expectShadowedOrder: 20,
    expectShadowedBy: 10,
  },
  {
    id: "ascending-sort",
    description: "Input order is irrelevant; rules evaluate ascending (20 pasted before 5).",
    input: [
      "20 | later | block | proto=tcp",
      "5 | earlier | allow | proto=tcp",
      "flow: proto=tcp port=80",
    ].join("\n"),
    expectOk: true,
    expectFirstRuleOrder: 5,
    expectVerdictOrder: 5,
    expectVerdictAction: "allow",
  },
  {
    id: "disabled-keeps-place",
    description: "A disabled rule is skipped (keeping its slot); the next rule matches.",
    input: [
      "10 | off-for-now | block | proto=tcp port=443 disabled",
      "20 | live | allow | proto=tcp port=443",
      "flow: proto=tcp port=443",
    ].join("\n"),
    expectOk: true,
    expectTraceOutcomeAt: { index: 0, outcome: "skipped-disabled" },
    expectVerdictOrder: 20,
    expectVerdictAction: "allow",
  },
  {
    id: "default-blocks",
    description: "No rule matches; the Default rule blocks (the documented out-of-the-box disposition).",
    input: ["10 | web-only | allow | proto=tcp port=443", "flow: proto=udp port=53"].join("\n"),
    expectOk: true,
    expectVerdictSource: "default",
    expectVerdictAction: "block",
    expectNoteIncludes: "deny-by-default",
  },
  {
    id: "default-editable",
    description: "default: allow overrides the simulated Default action (super-admin edit).",
    input: ["default: allow", "10 | web-only | allow | proto=tcp port=443", "flow: proto=udp port=53"].join("\n"),
    expectOk: true,
    expectVerdictSource: "default",
    expectVerdictAction: "allow",
  },
  {
    id: "block-icmp-action",
    description: "The block-with-notification action flavor is carried through to the verdict.",
    input: ["10 | polite-block | block-icmp | proto=udp port=53", "flow: proto=udp port=53"].join("\n"),
    expectOk: true,
    expectVerdictAction: "block-icmp",
  },
  {
    id: "any-means-ignored",
    description: "A rule with only a port criterion matches any source, any destination.",
    input: ["10 | just-port | allow | port=8443", "flow: proto=tcp port=8443 dest=198.51.100.9 src=10.1.2.3"].join("\n"),
    expectOk: true,
    expectVerdictOrder: 10,
  },
  {
    id: "failed-on-teaching",
    description: "The trace names the first failing criterion (dest here).",
    input: [
      "10 | narrow | allow | proto=tcp port=443 dest=203.0.113.0/24",
      "flow: proto=tcp port=443 dest=198.51.100.9",
    ].join("\n"),
    expectOk: true,
    expectFailedOnAt: { index: 0, failedOn: "dest" },
    expectVerdictSource: "default",
  },
  {
    id: "shadow-any-over-specific",
    description: "A broad early allow (Any dest) shadows a later specific block - the classic disease.",
    input: [
      "10 | allow-all-443 | allow | proto=tcp port=443",
      "20 | block-bad-subnet | block | proto=tcp port=443 dest=203.0.113.0/24",
    ].join("\n"),
    expectOk: true,
    expectShadowCount: 1,
    expectShadowedOrder: 20,
    expectShadowedBy: 10,
  },
  {
    id: "no-shadow-different-proto",
    description: "Different protocol is NOT a shadow: udp/53 is not covered by tcp/any.",
    input: ["10 | tcp-all | allow | proto=tcp", "20 | dns-udp | block | proto=udp port=53"].join("\n"),
    expectOk: true,
    expectShadowCount: 0,
  },
  {
    id: "shadow-port-range-containment",
    description: "8000-8100 covers 8080: the narrower later rule can never fire.",
    input: [
      "10 | wide-range | allow | proto=tcp port=8000-8100",
      "20 | one-port | block | proto=tcp port=8080",
    ].join("\n"),
    expectOk: true,
    expectShadowCount: 1,
    expectShadowedOrder: 20,
  },
  {
    id: "error-duplicate-order",
    description: "Duplicate rule order is a helpful error - each rule holds a unique position.",
    input: ["10 | a | allow | proto=tcp", "10 | b | block | proto=udp"].join("\n"),
    expectOk: false,
    expectErrorIncludes: "already used",
  },
  {
    id: "error-bad-action",
    description: "An unknown action names the allowed verb set.",
    input: "10 | oops | permit | proto=tcp",
    expectOk: false,
    expectErrorIncludes: "must be allow, block, or block-icmp",
  },
  {
    id: "error-bad-cidr",
    description: "A malformed destination is caught with the offending text.",
    input: "10 | bad | allow | dest=203.0.113.999/24",
    expectOk: false,
    expectErrorIncludes: "octet above 255",
  },
];

/** Run every vector; return human-readable failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of FW_VECTORS) {
    const fail = (msg: string) => failures.push(`[${v.id}] ${msg}`);
    let r: SimResult | undefined;
    let err: string | undefined;
    try {
      r = run(v.input);
    } catch (e) {
      err = e instanceof Error ? e.message : String(e);
    }
    const ok = err === undefined;
    if (v.expectOk !== undefined && ok !== v.expectOk) {
      fail(`ok ${ok} != ${v.expectOk}${err ? ` (${err})` : ""}`);
      continue;
    }
    if (!ok) {
      if (v.expectErrorIncludes && !(err ?? "").includes(v.expectErrorIncludes))
        fail(`error "${err}" missing "${v.expectErrorIncludes}"`);
      continue;
    }
    const res = r!;
    if (v.expectFirstRuleOrder !== undefined && res.rules[0]?.order !== v.expectFirstRuleOrder)
      fail(`first rule ${res.rules[0]?.order} != ${v.expectFirstRuleOrder}`);
    if (v.expectVerdictSource && res.verdict?.source !== v.expectVerdictSource)
      fail(`verdict source ${res.verdict?.source} != ${v.expectVerdictSource}`);
    if (v.expectVerdictOrder !== undefined && res.verdict?.order !== v.expectVerdictOrder)
      fail(`verdict order ${res.verdict?.order} != ${v.expectVerdictOrder}`);
    if (v.expectVerdictAction && res.verdict?.action !== v.expectVerdictAction)
      fail(`verdict action ${res.verdict?.action} != ${v.expectVerdictAction}`);
    if (v.expectTraceOutcomeAt) {
      const row = res.trace?.[v.expectTraceOutcomeAt.index];
      if (row?.outcome !== v.expectTraceOutcomeAt.outcome)
        fail(`trace[${v.expectTraceOutcomeAt.index}] ${row?.outcome} != ${v.expectTraceOutcomeAt.outcome}`);
    }
    if (v.expectFailedOnAt) {
      const row = res.trace?.[v.expectFailedOnAt.index];
      if (row?.failedOn !== v.expectFailedOnAt.failedOn)
        fail(`trace[${v.expectFailedOnAt.index}].failedOn ${row?.failedOn} != ${v.expectFailedOnAt.failedOn}`);
    }
    if (v.expectShadowCount !== undefined && res.shadows.length !== v.expectShadowCount)
      fail(`shadows ${res.shadows.length} != ${v.expectShadowCount}`);
    if (v.expectShadowedOrder !== undefined && !res.shadows.some((s) => s.shadowed.order === v.expectShadowedOrder))
      fail(`no shadow finding for order ${v.expectShadowedOrder}`);
    if (v.expectShadowedBy !== undefined && !res.shadows.some((s) => s.by.order === v.expectShadowedBy))
      fail(`no shadow finding BY order ${v.expectShadowedBy}`);
    if (v.expectNoteIncludes && !res.notes.some((n) => n.includes(v.expectNoteIncludes!)))
      fail(`no note containing "${v.expectNoteIncludes}"`);
  }
  return failures;
}
