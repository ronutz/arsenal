// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/dhcp-lease-states/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the DHCP lease lab (set 2026-10-26a). Each case is worked
// by hand from RFC 2131's timers (T1 = 0.5 and T2 = 0.875 of the lease, the
// 60-second retransmission floor) and the broadcast rule. The five marked
// "checked" were also run in the original interactive model on 2026-10-26 and
// agree outcome for outcome; the two marked "article" reproduce the waits the
// article prints for its eight-day lease (36 h in RENEWING, 12 h in REBINDING).
// Reject vectors pin the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, DhcpLeaseError, type DhcpLeaseErrorCode, type DhcpLeaseInput, type DhcpLeaseResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "dhcp-lease-states/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: DhcpLeaseInput;
  /** The fields of the result that must match. */
  expect: Partial<DhcpLeaseResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: DhcpLeaseInput;
  /** The code the refusal must carry. */
  code: DhcpLeaseErrorCode;
}

/** The accept cases. */
export const DHCP_LEASE_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: 60 % into an 8-hour lease, server on another subnet with no relay; the unicast renewal is routed and answered.
  { id: "renew-unicast-no-relay", input: { lease: 28800, elapsedPct: 60, start: "holding", server: "remote-no-relay", answers: true }, expect: { t1: 14400, t2: 25200, elapsed: 17280, stateNow: "RENEWING", message: "request-unicast", reaches: true, outcome: "renewed", stateAfter: "BOUND", addressUsable: true } },
  // Checked: 90 %, no relay; the REBINDING broadcast never leaves the subnet, the address stays usable until expiry.
  { id: "rebind-no-relay", input: { lease: 28800, elapsedPct: 90, start: "holding", server: "remote-no-relay", answers: true }, expect: { stateNow: "REBINDING", message: "request-broadcast", reaches: false, outcome: "waiting-rebinding", failReason: "no-relay", stateAfter: "REBINDING", addressUsable: true, nextRetry: 1440, untilNext: 2880 } },
  // Checked: 100 %, no relay; the lease expired, the client stopped and its DHCPDISCOVER reaches nobody.
  { id: "expired-no-relay", input: { lease: 28800, elapsedPct: 100, start: "holding", server: "remote-no-relay", answers: true }, expect: { stateNow: "EXPIRED", expired: true, message: "discover", reaches: false, outcome: "no-offer", failReason: "no-relay", stateAfter: "SELECTING", addressUsable: false } },
  // Checked: exactly at T2 with a relay but a silent server; REBINDING waits half the time left to expiry.
  { id: "rebind-relay-silent", input: { lease: 28800, elapsedPct: 87.5, start: "holding", server: "remote-relay", answers: false }, expect: { elapsed: 25200, stateNow: "REBINDING", reaches: true, viaRelay: true, outcome: "waiting-rebinding", failReason: "server-silent", addressUsable: true, nextRetry: 1800, untilNext: 3600 } },
  // Checked: a new client with a relay agent gets its first lease.
  { id: "first-lease-relay", input: { lease: 28800, elapsedPct: 0, start: "no-lease", server: "remote-relay", answers: true }, expect: { stateNow: "INIT", message: "discover", reaches: true, viaRelay: true, outcome: "leased", stateAfter: "BOUND", addressUsable: true } },
  // A new client with no relay agent: the broadcast stays on its subnet and no offer comes.
  { id: "first-lease-no-relay", input: { lease: 28800, elapsedPct: 0, start: "no-lease", server: "remote-no-relay", answers: true }, expect: { outcome: "no-offer", failReason: "no-relay", stateAfter: "SELECTING", addressUsable: false } },
  // Before T1 the client is BOUND and quiet, with T1 still ahead.
  { id: "bound-before-t1", input: { lease: 28800, elapsedPct: 40, start: "holding", server: "same-subnet", answers: true }, expect: { stateNow: "BOUND", message: "none", outcome: "bound-quiet", untilNext: 2880 } },
  // Exactly at T1 the client is RENEWING (the timer has expired).
  { id: "at-t1", input: { lease: 28800, elapsedPct: 50, start: "holding", server: "same-subnet", answers: true }, expect: { elapsed: 14400, stateNow: "RENEWING", outcome: "renewed" } },
  // Just before expiry, the wait hits the 60-second floor.
  { id: "retry-floor", input: { lease: 28800, elapsedPct: 99.9, start: "holding", server: "same-subnet", answers: false }, expect: { stateNow: "REBINDING", outcome: "waiting-rebinding", failReason: "server-silent", nextRetry: 60 } },
  // Article: the eight-day lease at T1 with no server waits 36 hours (129 600 s) in RENEWING.
  { id: "article-renewing-36h", input: { lease: 691200, elapsedPct: 50, start: "holding", server: "same-subnet", answers: false }, expect: { t1: 345600, t2: 604800, stateNow: "RENEWING", outcome: "waiting-renewing", nextRetry: 129600 } },
  // Article: the eight-day lease at T2 with no server waits 12 hours (43 200 s) in REBINDING.
  { id: "article-rebinding-12h", input: { lease: 691200, elapsedPct: 87.5, start: "holding", server: "same-subnet", answers: false }, expect: { stateNow: "REBINDING", outcome: "waiting-rebinding", nextRetry: 43200 } },
  // A relay carries the REBINDING broadcast to a server that answers.
  { id: "rebind-relay-answered", input: { lease: 691200, elapsedPct: 95, start: "holding", server: "remote-relay", answers: true }, expect: { stateNow: "REBINDING", viaRelay: true, outcome: "rebound", stateAfter: "BOUND" } },
  // An expired client on the server's own subnet gets a new lease straight away.
  { id: "expired-same-subnet", input: { lease: 691200, elapsedPct: 120, start: "holding", server: "same-subnet", answers: true }, expect: { expired: true, outcome: "leased", stateAfter: "BOUND", addressUsable: true } },
]);

/** The reject cases. */
export const DHCP_LEASE_REJECTS: readonly RejectVector[] = Object.freeze([
  // A lease shorter than the lab's floor.
  { id: "bad-lease", input: { lease: 30, elapsedPct: 50, start: "holding", server: "same-subnet", answers: true }, code: "bad-lease" },
  // An elapsed share beyond the lab's range.
  { id: "bad-elapsed", input: { lease: 28800, elapsedPct: 200, start: "holding", server: "same-subnet", answers: true }, code: "bad-elapsed" },
  // A server place the select cannot produce.
  { id: "bad-choice", input: { lease: 28800, elapsedPct: 50, start: "holding", server: "elsewhere" as unknown as "same-subnet", answers: true }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of DHCP_LEASE_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof DhcpLeaseResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of DHCP_LEASE_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof DhcpLeaseError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = DHCP_LEASE_VECTORS.length + DHCP_LEASE_REJECTS.length;
  // Passed is everything that did not fail (floored at zero, as one case can fail on several fields).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
