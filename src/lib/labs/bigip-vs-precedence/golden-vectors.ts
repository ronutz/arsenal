// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/bigip-vs-precedence/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BIG-IP virtual server precedence lab (set
// 2026-10-26a). Each case is worked by hand from the rules in compute.ts and
// pinned field by field. Four reproduce K14800's own Example Connection Table
// (MyVS3, MyVS2, MyVS1 and MyVS5, read 2026-10-26), two reproduce K9038's
// examples (192.0.0.0/8:any above 0.0.0.0/0:80; a host destination with a /24
// source above a /24 destination with a host source). The others pin the two
// cases where K14800's rows alone would rank the pair the other way (network
// masks on the destination, then on the source), a tie on destination and
// source that the port breaks, a packet no virtual server matches, a miss on
// the port, and the wildcard catching what nothing else does. Reject vectors
// pin every error code. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, VsPrecedenceError, type VirtualInput, type VsPrecedenceErrorCode, type VsPrecedenceInput, type VsPrecedenceResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "bigip-vs-precedence/2026-10-26a";

/** The fields a case pins, each as a short stable string or value. */
interface Expect {
  /** The winner's index, or null. */
  winner: number | null;
  /** The candidate K14800's rows alone put first, or null. */
  tableWinner: number | null;
  /** Whether those two differ. */
  rowConflict: boolean;
  /** The candidates' indexes, comma-joined. */
  candidates: string;
  /** Every virtual server's K14800 row, comma-joined. */
  rows: string;
  /** Every virtual server's first missed criterion (d, s, p) or "-" for a match, joined. */
  misses: string;
  /** Every virtual server's elimination criterion (d, s, p) or "-", joined. */
  dropped: string;
  /** The steps, as "criterion:entered>kept" joined with " | ". */
  steps: string;
}

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: VsPrecedenceInput;
  /** What it must say. */
  expect: Expect;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings the model must refuse. */
  input: VsPrecedenceInput;
  /** The code the refusal must carry. */
  code: VsPrecedenceErrorCode;
}

/** One letter per criterion, for the compact strings. */
const LETTER = { destination: "d", source: "s", port: "p" } as const;

/** The result in the compact form the vectors pin. */
export function summarise(r: VsPrecedenceResult): Expect {
  // Each field built from the result.
  return {
    winner: r.winner,
    tableWinner: r.tableWinner,
    rowConflict: r.rowConflict,
    candidates: r.candidates.join(","),
    rows: r.virtuals.map((v) => v.row).join(","),
    misses: r.virtuals.map((v) => (v.miss ? LETTER[v.miss] : "-")).join(""),
    dropped: r.virtuals.map((v) => (v.droppedAt ? LETTER[v.droppedAt] : "-")).join(""),
    steps: r.steps.map((s) => `${s.criterion}:${s.entered.join(",")}>${s.kept.join(",")}`).join(" | "),
  };
}

/** A three-virtual input from three [destination, source, port] triples and a packet. */
function three(v: [string, string, string][], src: string, dst: string, port: string): VsPrecedenceInput {
  // The rows as the interface would send them.
  const virtuals: VirtualInput[] = v.map(([destination, source, p]) => ({ destination, source, port: p }));
  // Three in play.
  return { count: virtuals.length, virtuals, packet: { source: src, destination: dst, port } };
}

/** K14800's configuration with another packet. */
function k14800(src: string, dst: string, port: string): VsPrecedenceInput {
  // The Example's virtual servers, this packet.
  return { ...EXAMPLE_INPUT, packet: { source: src, destination: dst, port } };
}

/** The accept cases. */
export const VS_PRECEDENCE_VECTORS: readonly AcceptVector[] = Object.freeze([
  // K14800 connection 1: 192.168.2.1 to 192.168.1.101:80 selects MyVS3, the closest source subnet (/25) among the host destinations.
  {
    id: "k14800-conn1-myvs3",
    input: k14800("192.168.2.1", "192.168.1.101", "80"),
    expect: { winner: 2, tableWinner: 2, rowConflict: false, candidates: "0,1,2,3,4", rows: "5,4,4,15,12", misses: "-----", dropped: "ss-dd", steps: "destination:0,1,2,3,4>0,1,2 | source:0,1,2>2" },
  },
  // K14800 connection 2: 192.168.2.151 is outside MyVS3's /25, so MyVS2's /24 source wins.
  {
    id: "k14800-conn2-myvs2",
    input: k14800("192.168.2.151", "192.168.1.101", "80"),
    expect: { winner: 1, tableWinner: 1, rowConflict: false, candidates: "0,1,3,4", rows: "5,4,4,15,12", misses: "--s--", dropped: "s--dd", steps: "destination:0,1,3,4>0,1 | source:0,1>1" },
  },
  // K14800 connection 3 (the opening state): 192.168.10.1 matches only MyVS1 and MyVS5; the /32 destination wins.
  {
    id: "k14800-conn3-myvs1-default",
    input: DEFAULT_INPUT,
    expect: { winner: 0, tableWinner: 0, rowConflict: false, candidates: "0,4", rows: "5,4,4,15,12", misses: "-sss-", dropped: "----d", steps: "destination:0,4>0" },
  },
  // K14800 connection 4 (the Example): MyVS4 has port 80 and the client's /24, but MyVS5's /24 destination beats the wildcard destination.
  {
    id: "k14800-conn4-myvs5-example",
    input: EXAMPLE_INPUT,
    expect: { winner: 4, tableWinner: 4, rowConflict: false, candidates: "3,4", rows: "5,4,4,15,12", misses: "ddd--", dropped: "---d-", steps: "destination:3,4>4" },
  },
  // K9038: for 192.168.10.1:80, 192.0.0.0/8:any has higher precedence than 0.0.0.0/0:80.
  {
    id: "k9038-network-any-port-beats-wildcard-port-80",
    input: three([["192.0.0.0/8", "*", "*"], ["*", "*", "80"], ["10.0.0.0/8", "*", "443"]], "203.0.113.9", "192.168.10.1", "80"),
    expect: { winner: 0, tableWinner: 0, rowConflict: false, candidates: "0,1", rows: "12,17,11", misses: "--d", dropped: "-d-", steps: "destination:0,1>0" },
  },
  // K9038: destination 192.168.10.1 with source 192.168.20.0/24 beats destination 192.168.10.0/24 with source 192.168.20.1.
  {
    id: "k9038-host-destination-beats-host-source",
    input: three([["192.168.10.1/32", "192.168.20.0/24", "*"], ["192.168.10.0/24", "192.168.20.1/32", "*"], ["*", "*", "*"]], "192.168.20.1", "192.168.10.1", "443"),
    expect: { winner: 0, tableWinner: 0, rowConflict: false, candidates: "0,1,2", rows: "4,8,18", misses: "---", dropped: "-dd", steps: "destination:0,1,2>0" },
  },
  // Two network destinations: by the rows alone 10.0.0.0/8:80 (row 11) sits above 10.10.0.0/16:* (row 12); the narrower destination wins.
  {
    id: "row-conflict-destination-masks",
    input: three([["10.0.0.0/8", "*", "80"], ["10.10.0.0/16", "*", "*"], ["*", "*", "*"]], "203.0.113.5", "10.10.1.1", "80"),
    expect: { winner: 1, tableWinner: 0, rowConflict: true, candidates: "0,1,2", rows: "11,12,18", misses: "---", dropped: "d-d", steps: "destination:0,1,2>1" },
  },
  // Two network sources for one host destination: row 3 (/8 source, port 443) against row 4 (/16 source, any port); the narrower source wins.
  {
    id: "row-conflict-source-masks",
    input: three([["10.1.1.10/32", "10.0.0.0/8", "443"], ["10.1.1.10/32", "10.20.0.0/16", "*"], ["10.1.1.0/24", "*", "*"]], "10.20.3.4", "10.1.1.10", "443"),
    expect: { winner: 1, tableWinner: 0, rowConflict: true, candidates: "0,1,2", rows: "3,4,12", misses: "---", dropped: "s-d", steps: "destination:0,1,2>0,1 | source:0,1>1" },
  },
  // Same host destination, any source on both: the named port beats * (rows 5 and 6); a host written without /32 and * for 0.0.0.0/0.
  {
    id: "port-breaks-the-tie",
    input: three([["10.1.1.10", "*", "443"], ["10.1.1.10/32", "0.0.0.0/0", "*"], ["10.1.1.10/32", "*", "80"]], "198.51.100.7", "10.1.1.10", "443"),
    expect: { winner: 0, tableWinner: 0, rowConflict: false, candidates: "0,1", rows: "5,6,5", misses: "--p", dropped: "-p-", steps: "destination:0,1>0,1 | source:0,1>0,1 | port:0,1>0" },
  },
  // No virtual server matches: nothing to rank.
  {
    id: "no-match",
    input: k14800("172.16.0.1", "10.0.0.1", "80"),
    expect: { winner: null, tableWinner: null, rowConflict: false, candidates: "", rows: "5,4,4,15,12", misses: "dddsd", dropped: "-----", steps: "" },
  },
  // Port 443 to 192.168.1.200: MyVS4 misses on the port, MyVS5 is the only candidate.
  {
    id: "single-candidate-port-miss",
    input: k14800("192.168.2.1", "192.168.1.200", "443"),
    expect: { winner: 4, tableWinner: 4, rowConflict: false, candidates: "4", rows: "5,4,4,15,12", misses: "dddp-", dropped: "-----", steps: "" },
  },
  // The wildcard *:* takes what the others refuse (wrong port, wrong source).
  {
    id: "wildcard-catches-the-rest",
    input: three([["10.1.1.10/32", "*", "443"], ["10.1.1.0/24", "10.9.0.0/16", "*"], ["*", "*", "*"]], "172.16.5.5", "10.1.1.10", "22"),
    expect: { winner: 2, tableWinner: 2, rowConflict: false, candidates: "2", rows: "5,10,18", misses: "ps-", dropped: "---", steps: "" },
  },
]);

/** A valid three-virtual input to break one field of. */
const BASE: VsPrecedenceInput = three([["10.1.1.10/32", "*", "80"], ["10.1.1.0/24", "*", "*"], ["*", "*", "*"]], "198.51.100.7", "10.1.1.10", "80");

/** BASE with one virtual server's field replaced. */
function breakVirtual(i: number, field: keyof VirtualInput, value: string): VsPrecedenceInput {
  // A copy of the rows with one field changed.
  const virtuals = BASE.virtuals.map((v, j) => (j === i ? { ...v, [field]: value } : v));
  // The rest unchanged.
  return { ...BASE, virtuals };
}

/** The reject cases, one per code. */
export const VS_PRECEDENCE_REJECTS: readonly RejectVector[] = Object.freeze([
  // Fewer than three virtual servers.
  { id: "bad-count", input: { ...BASE, count: 2 }, code: "bad-count" },
  // An octet above 255.
  { id: "bad-destination", input: breakVirtual(0, "destination", "300.1.1.1/24"), code: "bad-destination" },
  // A mask above 32.
  { id: "bad-source", input: breakVirtual(1, "source", "10.0.0.0/33"), code: "bad-source" },
  // A network written with host bits set.
  { id: "host-bits", input: breakVirtual(1, "destination", "10.1.1.5/24"), code: "host-bits" },
  // A port above 65535.
  { id: "bad-port", input: breakVirtual(0, "port", "70000"), code: "bad-port" },
  // The same listener twice (a host without /32, the wildcard source spelt two ways).
  { id: "duplicate-virtual", input: { ...BASE, virtuals: [BASE.virtuals[0], BASE.virtuals[1], { destination: "10.1.1.10", source: "0.0.0.0/0", port: "80" }] }, code: "duplicate-virtual" },
  // A packet source that is not an address.
  { id: "bad-packet-source", input: { ...BASE, packet: { ...BASE.packet, source: "192.168.2" } }, code: "bad-packet-source" },
  // A packet destination written as a network.
  { id: "bad-packet-destination", input: { ...BASE, packet: { ...BASE.packet, destination: "10.1.1.0/24" } }, code: "bad-packet-destination" },
  // A packet port of *.
  { id: "bad-packet-port", input: { ...BASE, packet: { ...BASE.packet, port: "*" } }, code: "bad-packet-port" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every pinned field.
  for (const v of VS_PRECEDENCE_VECTORS) {
    // The model's answer, summarised.
    let got: Expect;
    // A refusal here is itself a failure.
    try {
      // Compute.
      got = summarise(compute(v.input));
    } catch (e) {
      // Recorded and moved on.
      failures.push(`${v.id}: refused (${e instanceof VsPrecedenceError ? e.code : String(e)})`);
      // Next case.
      continue;
    }
    // Each pinned field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value.
      const have = got[k as keyof Expect];
      // A difference names the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of VS_PRECEDENCE_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof VsPrecedenceError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = VS_PRECEDENCE_VECTORS.length + VS_PRECEDENCE_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
