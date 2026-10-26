// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/dns-two-caches/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the two-caches lab (set 2026-10-26a). Each case is worked
// by hand from the rules in compute.ts (a hit while age < TTL, a fresh fetch
// with the full TTL, SERVFAIL or a 30-second stale answer when the authority
// is gone). The four marked "checked" were also run in the original
// interactive model on 2026-10-26 and agree answer for answer. Reject vectors
// pin the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, DnsTwoCachesError, type Answer, type DnsTwoCachesErrorCode, type DnsTwoCachesInput, type Source } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "dns-two-caches/2026-10-26a";

/** What a case expects of the authority and each resolver. */
interface Expect {
  /** The authority's answer, or null when it is down. */
  authority: Answer | null;
  /** Resolver A: answer, TTL and source. */
  a: [Answer, number | null, Source];
  /** Resolver B: answer, TTL and source. */
  b: [Answer, number | null, Source];
}

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: DnsTwoCachesInput;
  /** The answers that must match. */
  expect: Expect;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: DnsTwoCachesInput;
  /** The code the refusal must carry. */
  code: DnsTwoCachesErrorCode;
}

/** The accept cases. */
export const DNS_TWO_CACHES_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: TTL 120, asked at 100; both caches still hold the old address, 20 and 40 seconds left.
  { id: "both-cached", input: { ttl: 120, now: 100, change: "change", authorityUp: true, serveStale: false }, expect: { authority: "192.0.2.20", a: ["192.0.2.10", 20, "cache"], b: ["192.0.2.10", 40, "cache"] } },
  // Checked: authority down at 70 with TTL 60; A has expired and fails, B still answers from cache.
  { id: "authority-down", input: { ttl: 60, now: 70, change: "change", authorityUp: false, serveStale: false }, expect: { authority: null, a: ["SERVFAIL", null, "failed"], b: ["192.0.2.10", 10, "cache"] } },
  // Checked: the name is created at 30; at 45 with TTL 30, A fetches the new address and B still denies it for 5 s.
  { id: "create-negative-cache", input: { ttl: 30, now: 45, change: "create", authorityUp: true, serveStale: false }, expect: { authority: "192.0.2.20", a: ["192.0.2.20", 30, "fetched"], b: ["NXDOMAIN", 5, "cache"] } },
  // Checked: the opening state; A fetched the new address with the full TTL, B holds the old one for 10 s more.
  { id: "default-split", input: { ttl: 60, now: 70, change: "change", authorityUp: true, serveStale: false }, expect: { authority: "192.0.2.20", a: ["192.0.2.20", 60, "fetched"], b: ["192.0.2.10", 10, "cache"] } },
  // Serve-stale: A answers with the expired address and a 30-second TTL instead of failing.
  { id: "serve-stale", input: { ttl: 60, now: 70, change: "change", authorityUp: false, serveStale: true }, expect: { authority: null, a: ["192.0.2.10", 30, "stale"], b: ["192.0.2.10", 10, "cache"] } },
  // A short TTL expires before the change: A fetches again at 25 and still gets the old address.
  { id: "refetch-before-change", input: { ttl: 10, now: 25, change: "change", authorityUp: true, serveStale: false }, expect: { authority: "192.0.2.10", a: ["192.0.2.10", 10, "fetched"], b: ["192.0.2.10", 5, "cache"] } },
  // The name is removed: A fetches the denial, B still gives the old address.
  { id: "remove", input: { ttl: 60, now: 70, change: "remove", authorityUp: true, serveStale: false }, expect: { authority: "NXDOMAIN", a: ["NXDOMAIN", 60, "fetched"], b: ["192.0.2.10", 10, "cache"] } },
  // Exactly at the TTL the entry has expired (a hit needs age < TTL).
  { id: "age-equals-ttl", input: { ttl: 50, now: 50, change: "change", authorityUp: true, serveStale: false }, expect: { authority: "192.0.2.20", a: ["192.0.2.20", 50, "fetched"], b: ["192.0.2.10", 20, "cache"] } },
  // Long after the change both have fetched the new address.
  { id: "both-fresh", input: { ttl: 300, now: 400, change: "change", authorityUp: true, serveStale: false }, expect: { authority: "192.0.2.20", a: ["192.0.2.20", 300, "fetched"], b: ["192.0.2.20", 300, "fetched"] } },
]);

/** The reject cases. */
export const DNS_TWO_CACHES_REJECTS: readonly RejectVector[] = Object.freeze([
  // A TTL of zero.
  { id: "bad-ttl", input: { ttl: 0, now: 70, change: "change", authorityUp: true, serveStale: false }, code: "bad-ttl" },
  // A moment before resolver B cached the name.
  { id: "bad-now", input: { ttl: 60, now: 10, change: "change", authorityUp: true, serveStale: false }, code: "bad-now" },
  // A change the select cannot produce.
  { id: "bad-choice", input: { ttl: 60, now: 70, change: "rename" as unknown as "change", authorityUp: true, serveStale: false }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare.
  for (const v of DNS_TWO_CACHES_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // The authority.
    if (got.authority !== v.expect.authority) failures.push(`${v.id}: authority is ${String(got.authority)}, expected ${String(v.expect.authority)}`);
    // Each resolver against its expectation.
    for (const [i, want] of [v.expect.a, v.expect.b].entries()) {
      // The reply.
      const rep = got.resolvers[i];
      // Answer, TTL and source, compared together.
      if (rep.answer !== want[0] || rep.ttl !== want[1] || rep.source !== want[2]) failures.push(`${v.id}: resolver ${rep.name} gave ${rep.answer}/${String(rep.ttl)}/${rep.source}, expected ${want.join("/")}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of DNS_TWO_CACHES_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof DnsTwoCachesError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = DNS_TWO_CACHES_VECTORS.length + DNS_TWO_CACHES_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
