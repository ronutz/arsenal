// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/request-through-layers/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the request-through-layers lab (set 2026-10-26a). Each
// case is worked by hand from the rules in compute.ts. The two marked
// "checked" were also run in the original interactive model on 2026-10-26 and
// agree on connections, sessions, addresses and TTLs. Reject vectors pin the
// stable error code. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, LayersError, type LayersErrorCode, type LayersInput, type LayersResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "request-through-layers/2026-10-26a";

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: LayersInput;
  /** The summary fields that must match. */
  expect: Pick<LayersResult, "tcpConnections" | "tlsSessions" | "serverSeesClient" | "ttlLowered">;
  /** Each hop as "ethSource>ethDestination ipSource>ipDestination ttl tcp tls". */
  hops: string[];
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: LayersInput;
  /** The code the refusal must carry. */
  code: LayersErrorCode;
}

/** The accept cases. */
export const LAYERS_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: same LAN; one connection, one session, TTL 64.
  { id: "lan", input: { path: "lan", backendTls: true }, expect: { tcpConnections: 1, tlsSessions: 1, serverSeesClient: true, ttlLowered: false }, hops: ["client>server 192.0.2.10>192.0.2.20 64 1 client-server"] },
  // Through a router: new MAC addresses, the same IP addresses, TTL 63 on the second link.
  { id: "routed", input: { path: "routed", backendTls: true }, expect: { tcpConnections: 1, tlsSessions: 1, serverSeesClient: true, ttlLowered: true }, hops: ["client>router-a 192.0.2.10>198.51.100.20 64 1 client-server", "router-b>server 192.0.2.10>198.51.100.20 63 1 client-server"] },
  // Checked: a proxy that re-encrypts; two connections, two sessions, the server sees 198.51.100.100.
  { id: "proxy-tls", input: { path: "proxy", backendTls: true }, expect: { tcpConnections: 2, tlsSessions: 2, serverSeesClient: false, ttlLowered: false }, hops: ["client>proxy-a 192.0.2.10>192.0.2.100 64 1 client-proxy", "proxy-b>server 198.51.100.100>198.51.100.20 64 2 proxy-server"] },
  // A proxy that does not re-encrypt: two connections, one session.
  { id: "proxy-plain", input: { path: "proxy", backendTls: false }, expect: { tcpConnections: 2, tlsSessions: 1, serverSeesClient: false, ttlLowered: false }, hops: ["client>proxy-a 192.0.2.10>192.0.2.100 64 1 client-proxy", "proxy-b>server 198.51.100.100>198.51.100.20 64 2 none"] },
]);

/** The reject cases. */
export const LAYERS_REJECTS: readonly RejectVector[] = Object.freeze([
  // A path the select cannot produce.
  { id: "bad-choice", input: { path: "tunnel" as unknown as "lan", backendTls: true }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare.
  for (const v of LAYERS_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each summary field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof LayersResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // The hops, each as one line.
    const hops = got.hops.map((h) => `${h.ethSource}>${h.ethDestination} ${h.ipSource}>${h.ipDestination} ${h.ttl} ${h.tcp} ${h.tls}`);
    // Compared in order.
    if (hops.join("|") !== v.hops.join("|")) failures.push(`${v.id}: hops ${hops.join(" | ")}, expected ${v.hops.join(" | ")}`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of LAYERS_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof LayersError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = LAYERS_VECTORS.length + LAYERS_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
