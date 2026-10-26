// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/rib-to-fib/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the RIB-to-FIB lab (set 2026-10-26a). Each case is worked
// by hand: install per prefix (resolution, then metric within OSPF, then
// distance), then the longest installed match. The three accept cases and the
// reject case marked "checked" were also run in the original interactive model
// on 2026-10-26 and agree on the winning route or the refusal; the original's equal-distance case (a static route at 110
// against OSPF) is replaced by the 1 and 250 cases, because the article does
// not document a tie-break between sources. Reject vectors pin the stable
// error codes. verifyVectors() runs them all; scripts/run-golden-vectors runs
// it at prebuild and fails the build on drift.
// ============================================================================

import { compute, RibToFibError, type Candidate, type RibToFibErrorCode, type RibToFibInput, type Status, type Verdict } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "rib-to-fib/2026-10-26a";

/** What a case expects. */
interface Expect {
  /** The winning route, or null. */
  winner: Candidate["id"] | null;
  /** What happens to the packet. */
  verdict: Verdict;
  /** The fate of named candidates. */
  status?: Partial<Record<Candidate["id"], Status>>;
}

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: RibToFibInput;
  /** What must match. */
  expect: Expect;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: RibToFibInput;
  /** The code the refusal must carry. */
  code: RibToFibErrorCode;
}

/** Every route switched on, the static at distance 1 and resolving. */
const ALL: Omit<RibToFibInput, "destination"> = { defaultRoute: true, ospf: true, staticRoute: "ad1", staticResolves: true, bgp25: true, discard26: true };

/** The accept cases. */
export const RIB_TO_FIB_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: the opening state; 203.0.113.150 follows the BGP /25 although BGP's distance is 200.
  { id: "default-bgp-25", input: { destination: "203.0.113.150", defaultRoute: true, ospf: true, staticRoute: "none", staticResolves: true, bgp25: true, discard26: false }, expect: { winner: "bgp-25", verdict: "forward", status: { "ospf-20": "installed", "ospf-40": "lost-metric" } } },
  // Checked: with the discard /26, 203.0.113.200 is dropped there, the longest match.
  { id: "discard-26-wins", input: { destination: "203.0.113.200", ...ALL }, expect: { winner: "discard-26", verdict: "discard" } },
  // Checked: no /25, the static's next hop unresolved; OSPF's cost-20 path carries 203.0.113.150.
  { id: "unresolved-static", input: { destination: "203.0.113.150", defaultRoute: true, ospf: true, staticRoute: "ad1", staticResolves: false, bgp25: false, discard26: false }, expect: { winner: "ospf-20", verdict: "forward", status: { "static-24": "unresolved", "ospf-40": "lost-metric" } } },
  // A destination outside every specific prefix matches only the default route.
  { id: "default-only", input: { destination: "198.51.100.7", ...ALL }, expect: { winner: "default", verdict: "forward" } },
  // A resolving static at distance 1 beats OSPF's 110 for the same /24.
  { id: "static-beats-ospf", input: { destination: "203.0.113.10", ...ALL }, expect: { winner: "static-24", verdict: "forward", status: { "static-24": "installed", "ospf-20": "lost-distance", "ospf-40": "lost-metric" } } },
  // A floating static at 250 stays out while OSPF offers the /24.
  { id: "floating-stays-out", input: { destination: "203.0.113.10", defaultRoute: true, ospf: true, staticRoute: "ad250", staticResolves: true, bgp25: true, discard26: false }, expect: { winner: "ospf-20", verdict: "forward", status: { "static-24": "lost-distance" } } },
  // The Example: OSPF has lost the /24, so the floating static is installed.
  { id: "floating-takes-over", input: { destination: "203.0.113.10", defaultRoute: true, ospf: false, staticRoute: "ad250", staticResolves: true, bgp25: true, discard26: false }, expect: { winner: "static-24", verdict: "forward", status: { "static-24": "installed" } } },
  // Nothing matches and there is no default: dropped with an ICMP unreachable.
  { id: "no-route", input: { destination: "203.0.113.10", defaultRoute: false, ospf: false, staticRoute: "none", staticResolves: true, bgp25: false, discard26: false }, expect: { winner: null, verdict: "no-route" } },
  // The /25 does not cover the lower half: 203.0.113.100 follows the /24.
  { id: "lower-half", input: { destination: "203.0.113.100", defaultRoute: true, ospf: true, staticRoute: "none", staticResolves: true, bgp25: true, discard26: true }, expect: { winner: "ospf-20", verdict: "forward" } },
  // With every route on, 203.0.113.191 is just below the /26 and follows the /25.
  { id: "edge-below-26", input: { destination: "203.0.113.191", ...ALL }, expect: { winner: "bgp-25", verdict: "forward" } },
]);

/** The reject cases. */
export const RIB_TO_FIB_REJECTS: readonly RejectVector[] = Object.freeze([
  // Checked: an octet above 255.
  { id: "bad-destination", input: { destination: "203.0.113.300", ...ALL }, code: "bad-destination" },
  // A static setting the select cannot produce.
  { id: "bad-choice", input: { destination: "203.0.113.10", ...ALL, staticRoute: "ad110" as unknown as "ad1" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare.
  for (const v of RIB_TO_FIB_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // The winner.
    if (got.winner !== v.expect.winner) failures.push(`${v.id}: winner is ${String(got.winner)}, expected ${String(v.expect.winner)}`);
    // The verdict.
    if (got.verdict !== v.expect.verdict) failures.push(`${v.id}: verdict is ${got.verdict}, expected ${v.expect.verdict}`);
    // Each named candidate's fate.
    for (const [id, want] of Object.entries(v.expect.status ?? {})) {
      // The candidate, if offered.
      const c = got.candidates.find((x) => x.id === id);
      // Missing or different is a failure.
      if (!c || c.status !== want) failures.push(`${v.id}: ${id} is ${c ? c.status : "absent"}, expected ${want}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of RIB_TO_FIB_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof RibToFibError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = RIB_TO_FIB_VECTORS.length + RIB_TO_FIB_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
