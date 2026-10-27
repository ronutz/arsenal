// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/nat-pat-table/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the NAT/PAT table lab (set 2026-10-26a). Each table is
// worked by hand from the rules in compute.ts. The opening case reproduces the
// article's worked table row for row (10.0.0.10:51234 keeps 51234, 10.0.0.2's
// 51234 becomes 51235, 10.0.0.10:51235 becomes 51236). The filtering cases
// follow RFC 4787 section 5's three definitions, read on 2026-10-26: the
// server's own address and port pass every filter, the server from another
// port passes endpoint-independent and address-dependent filtering only, a
// host never contacted passes endpoint-independent filtering only. The pooling
// cases follow RFC 4787 sections 4.1 and 4.2.1 (a second address keeps a port
// that collides on the first) and RFC 7857 section 4 (a host whose paired
// address is full is refused although the other address has a port free).
// Reject vectors pin the stable codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, NatError, pickPort, type FlowKind, type NatErrorCode, type NatInput } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "nat-pat-table/2026-10-26a";

/** A whole-table case: each flow's outside endpoint ("none" when dropped) and kind, and the three filter verdicts. */
interface TableVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: NatInput;
  /** Each flow as "outside kind", e.g. "203.0.113.1:51234 preserved". */
  flows: readonly string[];
  /** The verdicts under EIF, ADF and APDF, as "eif,adf,apdf" with 1 for admitted and 0 for dropped. */
  verdicts: string;
  /** The verdict under the reader's own filtering. */
  admitted: boolean;
}

/** A port-choice case: used ports, inside port, range, expected port. */
type PortVector = readonly [readonly number[], number, number, number, number | null];

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range. */
  input: NatInput;
  /** The code the refusal must carry. */
  code: NatErrorCode;
}

/** A flow's row as the vectors write it. */
function row(outside: { addr: string; port: number } | null, kind: FlowKind): string {
  // The outside endpoint or "none", then the kind.
  return `${outside ? `${outside.addr}:${outside.port}` : "none"} ${kind}`;
}

/** The whole-table cases. */
export const NAT_TABLES: readonly TableVector[] = Object.freeze([
  // The opening case: the article's table, flow 4 reusing flow 1's mapping (EIM); the server's reply passes ADF.
  {
    id: "default-article-table",
    input: { addresses: 1, first: 1024, last: 65535, mapping: "eim", filtering: "adf", inbound: "server" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.1:51235 changed", "203.0.113.1:51236 changed", "203.0.113.1:51234 reused", "203.0.113.1:51237 changed"],
    verdicts: "1,1,1",
    admitted: true,
  },
  // The Example: a host nobody inside contacted gets in under EIF and nowhere else.
  {
    id: "example-stranger-eif",
    input: { addresses: 1, first: 1024, last: 65535, mapping: "eim", filtering: "eif", inbound: "stranger" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.1:51235 changed", "203.0.113.1:51236 changed", "203.0.113.1:51234 reused", "203.0.113.1:51237 changed"],
    verdicts: "1,0,0",
    admitted: true,
  },
  // The same packet under ADF: dropped.
  {
    id: "stranger-adf",
    input: { addresses: 1, first: 1024, last: 65535, mapping: "eim", filtering: "adf", inbound: "stranger" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.1:51235 changed", "203.0.113.1:51236 changed", "203.0.113.1:51234 reused", "203.0.113.1:51237 changed"],
    verdicts: "1,0,0",
    admitted: false,
  },
  // The server from another port: ADF lets it in, APDF does not; ADM gives flow 4 a mapping of its own.
  {
    id: "server-other-port-adm-apdf",
    input: { addresses: 1, first: 1024, last: 65535, mapping: "adm", filtering: "apdf", inbound: "server-other-port" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.1:51235 changed", "203.0.113.1:51236 changed", "203.0.113.1:51237 changed", "203.0.113.1:51238 changed"],
    verdicts: "1,1,0",
    admitted: false,
  },
  // A second public address keeps every inside port: 10.0.0.2 gets 51234 on 203.0.113.2.
  {
    id: "two-addresses-preserve",
    input: { addresses: 2, first: 1024, last: 65535, mapping: "eim", filtering: "adf", inbound: "server" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.2:51234 preserved-other-address", "203.0.113.1:51235 preserved", "203.0.113.1:51234 reused", "203.0.113.1:51236 preserved"],
    verdicts: "1,1,1",
    admitted: true,
  },
  // Three ports, one address, EIM: the third host finds the range full.
  {
    id: "three-ports-eim-exhausted",
    input: { addresses: 1, first: 51234, last: 51236, mapping: "eim", filtering: "adf", inbound: "server" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.1:51235 changed", "203.0.113.1:51236 changed", "203.0.113.1:51234 reused", "none dropped-exhausted"],
    verdicts: "1,1,1",
    admitted: true,
  },
  // Three ports, one address, ADM: flow 4 needs a mapping of its own too, and is refused as well.
  {
    id: "three-ports-adm-exhausted",
    input: { addresses: 1, first: 51234, last: 51236, mapping: "adm", filtering: "adf", inbound: "server" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.1:51235 changed", "203.0.113.1:51236 changed", "none dropped-exhausted", "none dropped-exhausted"],
    verdicts: "1,1,1",
    admitted: true,
  },
  // Two ports on each of two addresses, ADM: 10.0.0.10's paired address is full, so flow 4 is refused although 203.0.113.2 has a port free.
  {
    id: "paired-address-full",
    input: { addresses: 2, first: 51234, last: 51235, mapping: "adm", filtering: "adf", inbound: "server" },
    flows: ["203.0.113.1:51234 preserved", "203.0.113.2:51234 preserved-other-address", "203.0.113.1:51235 preserved", "none dropped-paired", "203.0.113.2:51235 changed"],
    verdicts: "1,1,1",
    admitted: true,
  },
  // A range that excludes the inside ports: nothing is preserved, the scan starts at the range's first port.
  {
    id: "range-excludes-inside-ports",
    input: { addresses: 1, first: 60000, last: 60002, mapping: "eim", filtering: "apdf", inbound: "server" },
    flows: ["203.0.113.1:60000 changed", "203.0.113.1:60001 changed", "203.0.113.1:60002 changed", "203.0.113.1:60000 reused", "none dropped-exhausted"],
    verdicts: "1,1,1",
    admitted: true,
  },
  // A range of one port: the first flow takes it, flow 4 reuses it (EIM), every other flow is refused; a stranger passes EIF only.
  {
    id: "single-port-range",
    input: { addresses: 1, first: 51236, last: 51236, mapping: "eim", filtering: "eif", inbound: "stranger" },
    flows: ["203.0.113.1:51236 changed", "none dropped-exhausted", "none dropped-exhausted", "203.0.113.1:51236 reused", "none dropped-exhausted"],
    verdicts: "1,0,0",
    admitted: true,
  },
]);

/** The port choice: preserved when free, else next free upward, wrapping; null when full. */
export const PORT_VECTORS: readonly PortVector[] = Object.freeze([
  // Free: kept.
  [[], 51234, 1024, 65535, 51234],
  // Taken: the next one up.
  [[51234], 51234, 1024, 65535, 51235],
  // Taken and the next too: two up.
  [[51234, 51235], 51234, 1024, 65535, 51236],
  // At the top of the range: wraps to the first port.
  [[51236], 51236, 51234, 51236, 51234],
  // Below the range: starts at the first port.
  [[], 40000, 51234, 51236, 51234],
  // Full: none.
  [[51234, 51235, 51236], 51234, 51234, 51236, null],
] as const);

/** The reject cases. */
export const NAT_REJECTS: readonly RejectVector[] = Object.freeze([
  // A port below 1024.
  { id: "bad-port-low", input: { addresses: 1, first: 1023, last: 65535, mapping: "eim", filtering: "adf", inbound: "server" }, code: "bad-port" },
  // A port above 65535.
  { id: "bad-port-high", input: { addresses: 1, first: 1024, last: 65536, mapping: "eim", filtering: "adf", inbound: "server" }, code: "bad-port" },
  // A fractional port.
  { id: "bad-port-fraction", input: { addresses: 1, first: 1024.5, last: 65535, mapping: "eim", filtering: "adf", inbound: "server" }, code: "bad-port" },
  // A range running backwards.
  { id: "bad-range", input: { addresses: 1, first: 60000, last: 50000, mapping: "eim", filtering: "adf", inbound: "server" }, code: "bad-range" },
  // Three public addresses.
  { id: "bad-choice-addresses", input: { addresses: 3, first: 1024, last: 65535, mapping: "eim", filtering: "adf", inbound: "server" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // The tables.
  for (const v of NAT_TABLES) {
    // The model's answer.
    const r = compute(v.input);
    // Each flow, in order.
    const got = r.flows.map((f) => row(f.outside, f.kind));
    // Compared row by row.
    v.flows.forEach((want, i) => {
      // A mismatch names the flow.
      if (got[i] !== want) failures.push(`${v.id} flow ${i + 1}: ${String(got[i])}, expected ${want}`);
    });
    // The three verdicts.
    const verdicts = r.verdicts.map((x) => (x.admitted ? "1" : "0")).join(",");
    // Compared.
    if (verdicts !== v.verdicts) failures.push(`${v.id}: verdicts ${verdicts}, expected ${v.verdicts}`);
    // The reader's own.
    if (r.admitted !== v.admitted) failures.push(`${v.id}: admitted ${r.admitted}, expected ${v.admitted}`);
  }
  // The port choices.
  for (const [usedPorts, inside, first, last, want] of PORT_VECTORS) {
    // The lab's choice.
    const got = pickPort(new Set(usedPorts), inside, first, last);
    // Compared.
    if (got !== want) failures.push(`pickPort ${inside} in ${first}-${last} with [${usedPorts.join(",")}]: ${String(got)}, expected ${String(want)}`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of NAT_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof NatError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = NAT_TABLES.length + PORT_VECTORS.length + NAT_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
