// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/snat-port-budget/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the SNAT port budget lab (set 2026-10-26a). The four
// cases marked "checked" were run in the original interactive model on
// 2026-10-26 and compared figure for figure: 2 x 1,024 = 2,048 against 2,000
// is 97.7 %; 3 x 1,000 = 3,000 against 4,500 is 150 %; no SNAT and no return
// route through the BIG-IP leaves the member seeing the client's address with a
// reply that bypasses the BIG-IP; zero translation addresses is refused. The
// rest are worked by hand from the three rules in compute.ts. verifyVectors()
// runs them all; scripts/run-golden-vectors runs it at prebuild and fails the
// build on any drift.
// ============================================================================

import { compute, SnatError, type ReturnPath, type SnatErrorCode, type SnatInput, type SnatMode, type SnatResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "snat-port-budget/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: SnatInput;
  /** The fields of the result that must match. */
  expect: Partial<SnatResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range. */
  input: SnatInput;
  /** The code the refusal must carry. */
  code: SnatErrorCode;
}

/** The accept cases. */
export const SNAT_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: two addresses at 1,024 ports give 2,048 towards one member; a peak of 2,000 uses 97.65625 % and fits.
  { id: "checked-2x1024-2000", input: { mode: "snat", returnPath: "bypass", addresses: 2, portsPerAddress: 1024, demand: 2000 }, expect: { memberSees: "translation", replyThroughBigip: true, budget: 2048, share: 0.9765625, spare: 48, shortfall: 0, outcome: "fits" } },
  // Checked: three addresses at 1,000 ports give 3,000; a peak of 4,500 is 150 %, 1,500 connections short.
  { id: "checked-3x1000-4500", input: { mode: "snat", returnPath: "bypass", addresses: 3, portsPerAddress: 1000, demand: 4500 }, expect: { budget: 3000, share: 1.5, spare: 0, shortfall: 1500, outcome: "exceeds" } },
  // Checked: without SNAT and with the member's route bypassing the BIG-IP, the member sees the client and the reply goes around.
  { id: "checked-none-bypass", input: { mode: "none", returnPath: "bypass", addresses: 0, portsPerAddress: 0, demand: 0 }, expect: { memberSees: "client", replyThroughBigip: false, budget: null, share: null, spare: null, shortfall: null, outcome: "reply-bypasses" } },
  // Without SNAT but with the member routing back through the BIG-IP, the client's address survives and the path is symmetric.
  { id: "none-through", input: { mode: "none", returnPath: "through", addresses: 2, portsPerAddress: 1024, demand: 2000 }, expect: { memberSees: "client", replyThroughBigip: true, budget: null, outcome: "no-snat-ok" } },
  // Exactly full: every port in use at the peak, nothing spare and nobody short.
  { id: "exactly-full", input: { mode: "snat", returnPath: "through", addresses: 1, portsPerAddress: 1000, demand: 1000 }, expect: { budget: 1000, share: 1, spare: 0, shortfall: 0, outcome: "full" } },
  // A quiet member: no connections at the peak uses none of the budget.
  { id: "zero-demand", input: { mode: "snat", returnPath: "bypass", addresses: 1, portsPerAddress: 65535, demand: 0 }, expect: { budget: 65535, share: 0, spare: 65535, shortfall: 0, outcome: "fits" } },
  // More addresses, same demand: adding a fourth address turns 4,500 against 3,000 into 4,500 against 4,000, still short by 500.
  { id: "four-addresses", input: { mode: "snat", returnPath: "bypass", addresses: 4, portsPerAddress: 1000, demand: 4500 }, expect: { budget: 4000, share: 1.125, shortfall: 500, outcome: "exceeds" } },
]);

/** The reject cases. */
export const SNAT_REJECTS: readonly RejectVector[] = Object.freeze([
  // Checked: SNAT with zero translation addresses is refused.
  { id: "checked-zero-addresses", input: { mode: "snat", returnPath: "bypass", addresses: 0, portsPerAddress: 1024, demand: 2000 }, code: "bad-addresses" },
  // A port count beyond the 16-bit port space.
  { id: "too-many-ports", input: { mode: "snat", returnPath: "bypass", addresses: 1, portsPerAddress: 65536, demand: 10 }, code: "bad-ports" },
  // A negative peak.
  { id: "negative-demand", input: { mode: "snat", returnPath: "bypass", addresses: 1, portsPerAddress: 1000, demand: -1 }, code: "bad-demand" },
  // A mode the control cannot produce.
  { id: "bad-mode", input: { mode: "nat" as unknown as SnatMode, returnPath: "through", addresses: 1, portsPerAddress: 1000, demand: 1 }, code: "bad-mode" },
  // A return path the control cannot produce.
  { id: "bad-return", input: { mode: "none", returnPath: "sideways" as unknown as ReturnPath, addresses: 1, portsPerAddress: 1000, demand: 1 }, code: "bad-mode" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of SNAT_VECTORS) {
    // The model's answer, or the refusal it should not have made.
    let got: SnatResult;
    // Run it.
    try {
      // Should not throw.
      got = compute(v.input);
    } catch (e) {
      // An unexpected refusal fails the case.
      failures.push(`${v.id}: refused with ${e instanceof SnatError ? e.code : String(e)}`);
      // Nothing to compare.
      continue;
    }
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof SnatResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of SNAT_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof SnatError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = SNAT_VECTORS.length + SNAT_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
