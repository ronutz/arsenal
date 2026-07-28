// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/checkpoint-policy-layer-evaluator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the Check Point ordered-layer evaluator. They pin the semantics
// described in Check Point's own CCSA/CCSE exam prep guides and the layer
// documentation:
//
//   * ORDERED LAYERS ARE AN AND - accept means proceed to the next layer, and
//     the connection is allowed only when the LAST ordered layer accepts;
//   * a drop in ANY layer ends evaluation, so an early permit cannot override
//     a later drop;
//   * within a layer, first match wins;
//   * no match falls to the implicit cleanup rule, which drops and LOGS
//     NOTHING (flagged `silent`);
//   * an INLINE layer is gated by its parent rule: non-matching traffic skips
//     the sub-policy entirely, and matching traffic that hits nothing inside
//     falls to the SUB-POLICY's own cleanup;
//   * policy findings: missing explicit cleanup rule, cleanup with no track,
//     rules with track none, pairwise shadowing.
//
// Plus the helpful-error paths, because a parse error that does not say which
// line is wrong is a parse error that wastes someone's afternoon.
// ============================================================================

import { evaluatePolicy, type CpReport } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "checkpoint-policy-layer-evaluator-golden-v1";

export interface CpVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectVerdict?: "allowed" | "dropped";
  /** Outcome of the step at this index in the trace. */
  expectStepOutcomeAt?: { index: number; outcome: string };
  /** The step at this index must be flagged as logging nothing. */
  expectSilentAt?: number;
  expectFindingIncludes?: string;
  expectFindingCount?: number;
}

const TWO_LAYERS = `layer Network ordered
1 | permit internal | accept | src=10.0.0.0/8
2 | cleanup | drop |
layer Application ordered
1 | https only | accept | svc=443
2 | cleanup | drop |`;

export const CP_VECTORS: CpVector[] = [
  // ---- The central lesson: layers are an AND ----
  {
    id: "and-not-or-blocked",
    description:
      "Accepted by the network layer, matched by nothing in the application layer: DROPPED. This is the whole point - accept in one layer is not permission.",
    input: `${TWO_LAYERS}\ntest src=10.1.1.5 dst=93.184.216.34 svc=80`,
    expectOk: true,
    expectVerdict: "dropped",
    expectStepOutcomeAt: { index: 0, outcome: "proceed" },
  },
  {
    id: "and-not-or-allowed",
    description:
      "Same connection on 443: accepted by both layers, so allowed. Only the LAST layer's accept means allowed.",
    input: `${TWO_LAYERS}\ntest src=10.1.1.5 dst=93.184.216.34 svc=443`,
    expectOk: true,
    expectVerdict: "allowed",
    expectStepOutcomeAt: { index: 1, outcome: "allowed" },
  },
  {
    id: "early-permit-cannot-override-later-drop",
    description:
      "A permissive first layer cannot rescue traffic a later layer drops. The exception belongs in the layer that would otherwise deny.",
    input: `layer A ordered
1 | allow all | accept |
layer B ordered
1 | block that host | drop | dst=93.184.216.34
2 | cleanup | drop |
test src=10.1.1.5 dst=93.184.216.34 svc=443`,
    expectOk: true,
    expectVerdict: "dropped",
  },

  // ---- The implicit cleanup, and its silence ----
  {
    id: "implicit-cleanup-is-silent",
    description:
      "Nothing matched, so the implicit cleanup rule dropped it - and logged nothing. The step is flagged silent, which is the fact that costs people hours.",
    input: `layer Network ordered
1 | ssh only | accept | svc=22
test src=10.1.1.5 dst=8.8.8.8 svc=443`,
    expectOk: true,
    expectVerdict: "dropped",
    expectSilentAt: 0,
    expectFindingIncludes: "no explicit cleanup rule",
  },
  {
    id: "explicit-drop-with-no-track-is-also-silent",
    description:
      "An explicit drop with track none is just as invisible as the implicit one. The tool says so rather than showing a tidy drop.",
    input: `layer Network ordered
1 | quiet drop | drop | dst=8.8.8.8 nolog
2 | cleanup | drop |
test src=10.1.1.5 dst=8.8.8.8 svc=443`,
    expectOk: true,
    expectVerdict: "dropped",
    expectSilentAt: 0,
  },

  // ---- First match within a layer ----
  {
    id: "first-match-wins-within-a-layer",
    description:
      "A broad accept above a specific drop means the drop never runs - ordinary first-match behaviour, and the shadowing finding names it.",
    input: `layer Network ordered
1 | allow all | accept |
2 | block host | drop | dst=8.8.8.8
3 | cleanup | drop |
layer App ordered
1 | permit | accept |
test src=10.1.1.5 dst=8.8.8.8 svc=443`,
    expectOk: true,
    expectVerdict: "allowed",
    expectFindingIncludes: "unreachable",
  },

  // ---- Inline layers ----
  {
    id: "inline-parent-is-a-gate-not-a-decision",
    description:
      "Traffic that does not match the parent rule skips the sub-policy entirely - it is never evaluated against the rules inside.",
    input: `layer Network ordered
1 | dmz traffic | inline:DMZ | dst=192.168.50.0/24
2 | everything else | accept |
layer DMZ inline
1 | web only | accept | svc=443
2 | cleanup | drop |
test src=10.1.1.5 dst=8.8.8.8 svc=22`,
    expectOk: true,
    expectVerdict: "allowed",
  },
  {
    id: "inline-entered-then-dropped-by-its-own-cleanup",
    description:
      "Matching the parent enters the sub-policy; matching nothing inside falls to the SUB-POLICY's cleanup, not the parent layer's.",
    input: `layer Network ordered
1 | dmz traffic | inline:DMZ | dst=192.168.50.0/24
2 | everything else | accept |
layer DMZ inline
1 | web only | accept | svc=443
2 | cleanup | drop |
test src=10.1.1.5 dst=192.168.50.10 svc=22`,
    expectOk: true,
    expectVerdict: "dropped",
    expectStepOutcomeAt: { index: 0, outcome: "entered-inline" },
  },

  // ---- Policy findings ----
  {
    id: "cleanup-with-no-track-defeats-its-purpose",
    description:
      "A cleanup rule exists to make the implicit drop visible. One with track none is decoration.",
    input: `layer Network ordered
1 | permit | accept | svc=443
2 | cleanup | drop | nolog
test src=10.1.1.5 dst=8.8.8.8 svc=443`,
    expectOk: true,
    expectFindingIncludes: "defeats its only purpose",
  },

  // ---- Helpful errors ----
  {
    id: "error-rule-before-any-layer",
    description: "A rule outside a layer is a mistake worth naming precisely.",
    input: `1 | orphan | accept |
test src=10.0.0.1 dst=8.8.8.8 svc=443`,
    expectOk: false,
    expectErrorIncludes: 'must follow a "layer" line',
  },
  {
    id: "error-missing-test",
    description: "A policy with nothing to evaluate is not an evaluation.",
    input: `layer Network ordered
1 | permit | accept |`,
    expectOk: false,
    expectErrorIncludes: "no \"test\" line",
  },
  {
    id: "error-inline-points-nowhere",
    description: "A rule gating a layer that does not exist is caught by name.",
    input: `layer Network ordered
1 | gate | inline:Missing | dst=any
test src=10.0.0.1 dst=8.8.8.8 svc=443`,
    expectOk: false,
    expectErrorIncludes: "undefined layer",
  },
  {
    id: "error-bad-address",
    description: "A malformed address says so, rather than silently matching nothing.",
    input: `layer Network ordered
1 | permit | accept | src=10.0.0.999
test src=10.0.0.1 dst=8.8.8.8 svc=443`,
    expectOk: false,
    expectErrorIncludes: "octet above 255",
  },
];

/** Run every vector. Returns failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of CP_VECTORS) {
    let report: CpReport | null = null;
    let error: string | null = null;
    try {
      report = evaluatePolicy(v.input);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    if (v.expectOk === false) {
      if (!error) {
        failures.push(`${v.id}: expected an error, got a result`);
      } else if (v.expectErrorIncludes && !error.includes(v.expectErrorIncludes)) {
        failures.push(`${v.id}: error "${error}" does not mention "${v.expectErrorIncludes}"`);
      }
      continue;
    }

    if (error) {
      failures.push(`${v.id}: unexpected error "${error}"`);
      continue;
    }
    if (!report) {
      failures.push(`${v.id}: no report`);
      continue;
    }
    if (v.expectVerdict && report.verdict !== v.expectVerdict) {
      failures.push(`${v.id}: verdict ${report.verdict}, expected ${v.expectVerdict}`);
    }
    if (v.expectStepOutcomeAt) {
      const step = report.steps[v.expectStepOutcomeAt.index];
      if (!step || step.outcome !== v.expectStepOutcomeAt.outcome) {
        failures.push(
          `${v.id}: step ${v.expectStepOutcomeAt.index} outcome ${step?.outcome ?? "missing"}, expected ${v.expectStepOutcomeAt.outcome}`,
        );
      }
    }
    if (v.expectSilentAt !== undefined) {
      const step = report.steps[v.expectSilentAt];
      if (!step?.silent) failures.push(`${v.id}: step ${v.expectSilentAt} should be flagged silent`);
    }
    if (v.expectFindingIncludes) {
      const hit = report.findings.some((f) => f.message.includes(v.expectFindingIncludes!));
      if (!hit) failures.push(`${v.id}: no finding mentioning "${v.expectFindingIncludes}"`);
    }
    if (v.expectFindingCount !== undefined && report.findings.length !== v.expectFindingCount) {
      failures.push(`${v.id}: ${report.findings.length} findings, expected ${v.expectFindingCount}`);
    }
  }
  return failures;
}
