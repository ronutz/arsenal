// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/stp-root-election/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the spanning tree lab (set 2026-10-26a). Each case is
// worked by hand from the four decisions in compute.ts. The three marked
// "checked" reproduce, role for role, the cases run in the original
// interactive model on 2026-10-26 (default priorities; link A-B failed; D as
// root); the costs differ, because this lab uses the article's short-scale
// costs (1 Gb/s = 4) where the original used 10, but on equal-speed links the
// roles do not depend on the unit. The tie-break rule was also checked
// exhaustively on 2026-10-26: over all 120 combinations of the three controls,
// choosing the lowest interface number gives the same root port as choosing
// the neighbour with the lower bridge ID. Reject vectors pin the stable error
// code. verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on drift.
// ============================================================================

import { compute, StpError, type LinkId, type Role, type StpErrorCode, type StpInput, type SwitchName } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "stp-root-election/2026-10-26a";

/** What a case expects. */
interface Expect {
  /** The root bridge. */
  root: SwitchName;
  /** Root path costs, A to D. */
  costs: [number, number, number, number];
  /** Root ports' neighbours, A to D (null for the root). */
  via: [SwitchName | null, SwitchName | null, SwitchName | null, SwitchName | null];
  /** The roles at both ends of each link, as "first/second". */
  roles: Record<LinkId, `${Role}/${Role}`>;
  /** How many links block. */
  blocked: number;
}

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: StpInput;
  /** What must match. */
  expect: Expect;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: StpInput;
  /** The code the refusal must carry. */
  code: StpErrorCode;
}

/** The accept cases. */
export const STP_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: default priorities; A (lowest MAC) is root; D ties between B and C and takes port 1, towards B; B-C blocks at C, C-D at D.
  { id: "default-root-a", input: { root: "default", speedBD: "1G", failed: "none" }, expect: { root: "A", costs: [0, 4, 4, 8], via: [null, "A", "A", "B"], roles: { "A-B": "designated/root", "A-C": "designated/root", "B-C": "designated/alternate", "B-D": "designated/root", "C-D": "designated/alternate" }, blocked: 2 } },
  // Checked: link A-B failed; B and D both reach the root through C; B-D blocks at D.
  { id: "a-b-failed", input: { root: "default", speedBD: "1G", failed: "A-B" }, expect: { root: "A", costs: [0, 8, 4, 8], via: [null, "C", "A", "C"], roles: { "A-B": "down/down", "A-C": "designated/root", "B-C": "root/designated", "B-D": "designated/alternate", "C-D": "designated/root" }, blocked: 1 } },
  // Checked: D at 4096 is root; A ties and takes port 1, towards B; A-C blocks at A, B-C at C.
  { id: "root-d", input: { root: "D", speedBD: "1G", failed: "none" }, expect: { root: "D", costs: [8, 4, 4, 0], via: ["B", "D", "D", null], roles: { "A-B": "root/designated", "A-C": "alternate/designated", "B-C": "designated/alternate", "B-D": "root/designated", "C-D": "root/designated" }, blocked: 2 } },
  // B at 4096: every other switch is one link away; A-C blocks at C, C-D at D.
  { id: "root-b", input: { root: "B", speedBD: "1G", failed: "none" }, expect: { root: "B", costs: [4, 0, 4, 4], via: ["B", null, "B", "B"], roles: { "A-B": "root/designated", "A-C": "designated/alternate", "B-C": "designated/root", "B-D": "designated/root", "C-D": "designated/alternate" }, blocked: 2 } },
  // B-D at 10 Gb/s (cost 2): D's path through B costs 6, no tie.
  { id: "fast-b-d", input: { root: "default", speedBD: "10G", failed: "none" }, expect: { root: "A", costs: [0, 4, 4, 6], via: [null, "A", "A", "B"], roles: { "A-B": "designated/root", "A-C": "designated/root", "B-C": "designated/alternate", "B-D": "designated/root", "C-D": "designated/alternate" }, blocked: 2 } },
  // B-D at 100 Mb/s (cost 19): D goes through C, and B-D blocks at D.
  { id: "slow-b-d", input: { root: "default", speedBD: "100M", failed: "none" }, expect: { root: "A", costs: [0, 4, 4, 8], via: [null, "A", "A", "C"], roles: { "A-B": "designated/root", "A-C": "designated/root", "B-C": "designated/alternate", "B-D": "designated/alternate", "C-D": "designated/root" }, blocked: 2 } },
  // B-D failed: D through C; only B-C blocks.
  { id: "b-d-failed", input: { root: "default", speedBD: "1G", failed: "B-D" }, expect: { root: "A", costs: [0, 4, 4, 8], via: [null, "A", "A", "C"], roles: { "A-B": "designated/root", "A-C": "designated/root", "B-C": "designated/alternate", "B-D": "down/down", "C-D": "designated/root" }, blocked: 1 } },
]);

/** The reject cases. */
export const STP_REJECTS: readonly RejectVector[] = Object.freeze([
  // A root the select cannot produce.
  { id: "bad-choice", input: { root: "E" as unknown as "A", speedBD: "1G", failed: "none" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare.
  for (const v of STP_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // The root.
    if (got.root !== v.expect.root) failures.push(`${v.id}: root ${got.root}, expected ${v.expect.root}`);
    // Costs and root ports, switch by switch.
    got.switches.forEach((s, i) => {
      // The cost.
      if (s.cost !== v.expect.costs[i]) failures.push(`${v.id}: ${s.name} cost ${s.cost}, expected ${v.expect.costs[i]}`);
      // The root port's neighbour.
      if (s.rootVia !== v.expect.via[i]) failures.push(`${v.id}: ${s.name} via ${String(s.rootVia)}, expected ${String(v.expect.via[i])}`);
    });
    // Roles, link by link.
    for (const l of got.links) {
      // As "first/second".
      const pair = `${l.roleA}/${l.roleB}`;
      // Compared with the expectation.
      if (pair !== v.expect.roles[l.id]) failures.push(`${v.id}: ${l.id} ${pair}, expected ${v.expect.roles[l.id]}`);
    }
    // The count of blocking links.
    if (got.blocked !== v.expect.blocked) failures.push(`${v.id}: blocked ${got.blocked}, expected ${v.expect.blocked}`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of STP_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof StpError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = STP_VECTORS.length + STP_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
