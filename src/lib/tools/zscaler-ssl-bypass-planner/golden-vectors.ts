// ============================================================================
// src/lib/tools/zscaler-ssl-bypass-planner/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the SSL bypass planner. They pin the decision tree (pinned+agent
// -> ZCC bypass with defense-in-depth note; pinned+no-agent -> policy Do Not
// Inspect; regulated -> policy Do Not Inspect; default -> Inspect), the
// blind-spot ledger on every bypass, the backstop checklist appearing exactly
// when at least one asset is uninspected, the ordering-doctrine note, and the
// helpful-error paths (field count, bad tokens, duplicate asset, empty input).
// ============================================================================

import { run, type PlanResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "zscaler-ssl-bypass-planner-golden-v1";

export interface SslPlanVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectVerdictFor?: { name: string; verdict: "inspect" | "dni-policy" | "zcc-bypass" };
  expectRationaleIncludes?: { name: string; text: string };
  expectBlindSpotsFor?: { name: string; present: boolean };
  expectBackstops?: boolean;
  expectNoteIncludes?: string;
  expectCounts?: { inspect?: number; dni?: number; zcc?: number };
}

export const SSL_PLAN_VECTORS: SslPlanVector[] = [
  {
    id: "pinned-agent-zcc",
    description: "Pinned app on an agent-controlled path -> ZCC bypass, with the defense-in-depth pairing note.",
    input: "crm-desktop-app | pinned | general | agent",
    expectOk: true,
    expectVerdictFor: { name: "crm-desktop-app", verdict: "zcc-bypass" },
    expectRationaleIncludes: { name: "crm-desktop-app", text: "never enters the tunnel" },
    expectBlindSpotsFor: { name: "crm-desktop-app", present: true },
    expectBackstops: true,
  },
  {
    id: "pinned-no-agent-dni",
    description: "Pinned app with no agent on the path -> the exemption lives at the Edge as Do Not Inspect.",
    input: "iot-updater | pinned | general | no-agent",
    expectOk: true,
    expectVerdictFor: { name: "iot-updater", verdict: "dni-policy" },
    expectRationaleIncludes: { name: "iot-updater", text: "exemption lives at the Edge" },
  },
  {
    id: "regulated-dni",
    description: "Governance category -> policy Do Not Inspect with the backstops-strict rationale.",
    input: "patient-portal | clean | regulated | agent",
    expectOk: true,
    expectVerdictFor: { name: "patient-portal", verdict: "dni-policy" },
    expectRationaleIncludes: { name: "patient-portal", text: "wrapper is now the whole defense" },
  },
  {
    id: "default-inspect",
    description: "No pinning, no mandate -> Inspect, feeding the content engines.",
    input: "general-saas | clean | general | agent",
    expectOk: true,
    expectVerdictFor: { name: "general-saas", verdict: "inspect" },
    expectBlindSpotsFor: { name: "general-saas", present: false },
    expectBackstops: false,
  },
  {
    id: "pinning-beats-regulated",
    description: "Pinned AND regulated on an agent path: pinning decides the mechanism (ZCC bypass).",
    input: "bank-thick-client | pinned | regulated | agent",
    expectOk: true,
    expectVerdictFor: { name: "bank-thick-client", verdict: "zcc-bypass" },
  },
  {
    id: "backstops-only-with-bypass",
    description: "All-inspect plan: no backstop checklist, and the everything-inspects note appears.",
    input: ["app-a | clean | general | agent", "app-b | clean | general | no-agent"].join("\n"),
    expectOk: true,
    expectBackstops: false,
    expectNoteIncludes: "no bypass ledger",
    expectCounts: { inspect: 2, dni: 0, zcc: 0 },
  },
  {
    id: "ordering-note-with-bypass",
    description: "Any bypass brings the ascending-order, carve-outs-above-body doctrine note.",
    input: ["app-a | clean | general | agent", "sealed | clean | regulated | agent"].join("\n"),
    expectOk: true,
    expectBackstops: true,
    expectNoteIncludes: "ascending order",
    expectCounts: { inspect: 1, dni: 1, zcc: 0 },
  },
  {
    id: "mixed-counts",
    description: "One of each verdict, counted correctly.",
    input: [
      "pinned-app | pinned | general | agent",
      "sealed-category | clean | regulated | no-agent",
      "everything-else | clean | general | agent",
    ].join("\n"),
    expectOk: true,
    expectCounts: { inspect: 1, dni: 1, zcc: 1 },
  },
  {
    id: "error-field-count",
    description: "Wrong field count is a helpful error naming the expected shape.",
    input: "just-a-name | pinned",
    expectOk: false,
    expectErrorIncludes: "expected 4 fields",
  },
  {
    id: "error-bad-pin-token",
    description: "A bad pinning token names the allowed values.",
    input: "app | maybe | general | agent",
    expectOk: false,
    expectErrorIncludes: '"pinned" or "clean"',
  },
  {
    id: "error-duplicate",
    description: "The same asset twice is a helpful error.",
    input: ["app | clean | general | agent", "APP | pinned | general | agent"].join("\n"),
    expectOk: false,
    expectErrorIncludes: "appears twice",
  },
  {
    id: "error-empty",
    description: "Comment-only input asks for at least one asset line.",
    input: "# nothing here",
    expectOk: false,
    expectErrorIncludes: "at least one asset line",
  },
];

/** Run every vector; return human-readable failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of SSL_PLAN_VECTORS) {
    const fail = (msg: string) => failures.push(`[${v.id}] ${msg}`);
    let r: PlanResult | undefined;
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
    if (v.expectVerdictFor) {
      const row = res.rows.find((x) => x.name === v.expectVerdictFor!.name);
      if (row?.verdict !== v.expectVerdictFor.verdict)
        fail(`verdict for ${v.expectVerdictFor.name}: ${row?.verdict} != ${v.expectVerdictFor.verdict}`);
    }
    if (v.expectRationaleIncludes) {
      const row = res.rows.find((x) => x.name === v.expectRationaleIncludes!.name);
      if (!row?.rationale.some((s) => s.includes(v.expectRationaleIncludes!.text)))
        fail(`rationale for ${v.expectRationaleIncludes.name} missing "${v.expectRationaleIncludes.text}"`);
    }
    if (v.expectBlindSpotsFor) {
      const row = res.rows.find((x) => x.name === v.expectBlindSpotsFor!.name);
      const present = (row?.blindSpots.length ?? 0) > 0;
      if (present !== v.expectBlindSpotsFor.present)
        fail(`blindSpots presence for ${v.expectBlindSpotsFor.name}: ${present} != ${v.expectBlindSpotsFor.present}`);
    }
    if (v.expectBackstops !== undefined && res.backstops.length > 0 !== v.expectBackstops)
      fail(`backstops presence ${res.backstops.length > 0} != ${v.expectBackstops}`);
    if (v.expectNoteIncludes && !res.notes.some((n) => n.includes(v.expectNoteIncludes!)))
      fail(`no note containing "${v.expectNoteIncludes}"`);
    if (v.expectCounts) {
      const { inspect, dni, zcc } = v.expectCounts;
      if (inspect !== undefined && res.counts.inspect !== inspect) fail(`inspect ${res.counts.inspect} != ${inspect}`);
      if (dni !== undefined && res.counts["dni-policy"] !== dni) fail(`dni ${res.counts["dni-policy"]} != ${dni}`);
      if (zcc !== undefined && res.counts["zcc-bypass"] !== zcc) fail(`zcc ${res.counts["zcc-bypass"]} != ${zcc}`);
    }
  }
  return failures;
}
