// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/arp-and-switch-tables/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the ARP and switch tables lab (set 2026-10-26a). Each
// case is worked by hand from the rules in compute.ts. The four marked
// "checked" were also run in the original interactive model on 2026-10-26 and
// agree on the outcome (the port numbers differ: this lab keeps B on port 2
// and puts the stale entry on port 3). Reject vectors pin the stable error
// code. verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on drift.
// ============================================================================

import { ArpSwitchError, compute, type ArpSwitchErrorCode, type ArpSwitchInput, type EventCode, type Outcome } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "arp-and-switch-tables/2026-10-26a";

/** What a case expects. */
interface Expect {
  /** The events, in order. */
  events: EventCode[];
  /** How it ends. */
  outcome: Outcome;
  /** The port the data frame left by, or null. */
  sentToPort: number | null;
  /** The switch's final port for the next hop, or null. */
  fdbNextHop: number | null;
}

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: ArpSwitchInput;
  /** What must match. */
  expect: Expect;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: ArpSwitchInput;
  /** The code the refusal must carry. */
  code: ArpSwitchErrorCode;
}

/** The accept cases. */
export const ARP_SWITCH_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: off-subnet, cold cache, the router answers, empty table; the reply teaches the switch, the frame goes to port 4.
  { id: "gateway-cold", input: { target: "gateway", arpCached: false, answers: true, fdb: "none" }, expect: { events: ["arp-request", "learn-a", "flood-broadcast", "arp-reply", "learn-next-hop", "reply-forwarded", "arp-cached", "data-sent", "forward-known"], outcome: "delivered", sentToPort: 4, fdbNextHop: 4 } },
  // Checked: same subnet, warm cache, correct entry; straight to B's port.
  { id: "peer-warm-correct", input: { target: "peer", arpCached: true, answers: true, fdb: "correct" }, expect: { events: ["data-sent", "learn-a", "forward-known"], outcome: "delivered", sentToPort: 2, fdbNextHop: 2 } },
  // Checked: cold cache and no answer; no mapping, nothing sent.
  { id: "no-answer", input: { target: "peer", arpCached: false, answers: false, fdb: "none" }, expect: { events: ["arp-request", "learn-a", "flood-broadcast", "arp-silent"], outcome: "no-mapping", sentToPort: null, fdbNextHop: null } },
  // Checked (the Example): warm cache, stale entry; the frame goes to port 3, where B no longer is.
  { id: "stale-entry", input: { target: "peer", arpCached: true, answers: true, fdb: "stale" }, expect: { events: ["data-sent", "learn-a", "forward-stale"], outcome: "misdelivered", sentToPort: 3, fdbNextHop: 3 } },
  // A cold cache cures the stale entry: B's ARP reply is learned on port 2.
  { id: "stale-cured-by-arp", input: { target: "peer", arpCached: false, answers: true, fdb: "stale" }, expect: { events: ["arp-request", "learn-a", "flood-broadcast", "arp-reply", "learn-next-hop", "reply-forwarded", "arp-cached", "data-sent", "forward-known"], outcome: "delivered", sentToPort: 2, fdbNextHop: 2 } },
  // Warm cache, empty table: the first data frame is flooded.
  { id: "warm-unknown", input: { target: "peer", arpCached: true, answers: true, fdb: "none" }, expect: { events: ["data-sent", "learn-a", "flood-unknown"], outcome: "delivered-flooded", sentToPort: null, fdbNextHop: null } },
  // The router with a stale entry and a warm cache: the frame goes to port 3, not 4.
  { id: "gateway-stale", input: { target: "gateway", arpCached: true, answers: true, fdb: "stale" }, expect: { events: ["data-sent", "learn-a", "forward-stale"], outcome: "misdelivered", sentToPort: 3, fdbNextHop: 3 } },
]);

/** The reject cases. */
export const ARP_SWITCH_REJECTS: readonly RejectVector[] = Object.freeze([
  // A table state the select cannot produce.
  { id: "bad-choice", input: { target: "peer", arpCached: true, answers: true, fdb: "full" as unknown as "none" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare.
  for (const v of ARP_SWITCH_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // The events, in order.
    if (got.events.join() !== v.expect.events.join()) failures.push(`${v.id}: events ${got.events.join()}, expected ${v.expect.events.join()}`);
    // The outcome.
    if (got.outcome !== v.expect.outcome) failures.push(`${v.id}: outcome ${got.outcome}, expected ${v.expect.outcome}`);
    // The port the frame left by.
    if (got.sentToPort !== v.expect.sentToPort) failures.push(`${v.id}: sent to ${String(got.sentToPort)}, expected ${String(v.expect.sentToPort)}`);
    // The switch's final entry for the next hop.
    if (got.fdbNextHop !== v.expect.fdbNextHop) failures.push(`${v.id}: table says ${String(got.fdbNextHop)}, expected ${String(v.expect.fdbNextHop)}`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of ARP_SWITCH_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof ArpSwitchError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = ARP_SWITCH_VECTORS.length + ARP_SWITCH_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
