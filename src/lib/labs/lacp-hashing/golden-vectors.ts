// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/lacp-hashing/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the LACP hashing lab (set 2026-10-26a). The expected
// values were produced by a second, independent implementation of the Linux
// bonding HOWTO's three formulas (written in Python on 2026-10-26, not sharing
// code with compute.ts), and the layer3+4 hash of F1 was also worked by hand:
// ports word 0xC3510369, XOR 0xC000020A (192.0.2.10) XOR 0xC6336414
// (198.51.100.20) = 0xC5626577, fold by 16 = 0xC562A015, fold by 8 =
// 0xC5A7C2B5, shift right 1 = 0x62D3E15A, whose two low bits give member 2 of
// four. Each case is compared as short summary strings, so a drift in any
// flow's member, any load or the worked hash shows. Reject vectors pin the
// stable error codes. verifyVectors() runs them all; scripts/run-golden-vectors
// runs it at prebuild and fails the build on any drift.
// ============================================================================

import { compute, LacpError, type LacpErrorCode, type LacpInput, type LacpResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "lacp-hashing/2026-10-26a";

/** The compared summary of a result. */
interface Summary {
  /** Each running flow's member with every member up ("F1:2 F3:0"). */
  members: string;
  /** Each running flow's member after the failure ("-" when none failed). */
  after: string;
  /** The load on each member, Mb/s, joined by spaces. */
  load: string;
  /** The load after the failure, or "-". */
  loadAfter: string;
  /** The busiest member, or "-". */
  busiest: string;
  /** The first running flow's worked hash, as hexadecimal steps ("-" for a step the policy skips). */
  work: string;
  /** Each running flow's member under layer2, layer2+3 and layer3+4 ("F1:3/2/2"). */
  byPolicy: string;
}

/** A 32-bit value as lower-case hexadecimal, or "-" when the step does not apply. */
function hex(v: number | null): string {
  // Absent steps show as a dash.
  return v === null ? "-" : `0x${v.toString(16)}`;
}

/** Reduce a result to its compared summary. */
export function summarise(r: LacpResult): Summary {
  // Each part.
  return {
    // Where each flow goes.
    members: r.flows.map((f) => `${f.flow.id}:${f.member}`).join(" "),
    // Where each flow goes after the failure.
    after: r.loadAfter === null ? "-" : r.flows.map((f) => `${f.flow.id}:${f.memberAfter}`).join(" "),
    // The loads.
    load: r.load.join(" "),
    // The loads after the failure.
    loadAfter: r.loadAfter === null ? "-" : r.loadAfter.join(" "),
    // The busiest member.
    busiest: r.busiest === null ? "-" : String(r.busiest),
    // The worked hash.
    work: r.work === null ? "-" : [r.work.start, r.work.afterIps, r.work.afterFold, r.work.hash].map(hex).join(" "),
    // The comparison across policies.
    byPolicy: r.flows.map((f) => `${f.flow.id}:${f.byPolicy.layer2}/${f.byPolicy["layer2+3"]}/${f.byPolicy["layer3+4"]}`).join(" "),
  };
}

/** A case the model must answer exactly so (every listed part compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: LacpInput;
  /** The parts of the summary that must match. */
  expect: Partial<Summary>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: LacpInput;
  /** The code the refusal must carry. */
  code: LacpErrorCode;
}

/** Every flow, for the cases that run them all. */
const ALL = ["F1", "F2", "F3", "F4", "F5", "F6"];

/** The accept cases. */
export const LACP_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: layer3+4 spreads four flows over three of four members; F1's hash worked by hand (header comment).
  { id: "default", input: { members: 4, policy: "layer3+4", flows: ["F1", "F3", "F5", "F6"], failed: null }, expect: { members: "F1:2 F3:0 F5:0 F6:3", load: "700 0 900 200", loadAfter: "-", busiest: "2", work: "0xc3510369 0xc5626577 0xc5a7c2b5 0x62d3e15a" } },
  // The Example: layer2+3 gives both backup streams (same MACs, same IPs) the same hash, 0x6355b4e, so member 2 carries 1,800 Mb/s; layer3+4 puts them on 2 and 3.
  { id: "example-same-member", input: { members: 4, policy: "layer2+3", flows: ["F1", "F2", "F3", "F4"], failed: null }, expect: { members: "F1:2 F2:2 F3:3 F4:3", load: "0 0 1800 400", busiest: "2", work: "0x80b 0x6336e15 0x6355b4e 0x6355b4e", byPolicy: "F1:3/2/2 F2:3/2/3 F3:3/3/0 F4:3/3/0" } },
  // layer2, the default policy: every flow to the router shares one MAC pair, so five of six land on member 3; only the LAN filer moves off.
  { id: "layer2-gateway", input: { members: 4, policy: "layer2", flows: ALL, failed: null }, expect: { members: "F1:3 F2:3 F3:3 F4:3 F5:2 F6:3", load: "0 0 400 2400", busiest: "3", work: "0x80b - - 0x80b" } },
  // Member 1 carries nothing, yet its failure moves four flows: the modulo is now 3 and the survivors 0, 2, 3 are renumbered 0, 1, 2.
  { id: "idle-member-fails", input: { members: 4, policy: "layer3+4", flows: ALL, failed: 1 }, expect: { members: "F1:2 F2:3 F3:0 F4:0 F5:0 F6:3", after: "F1:0 F2:3 F3:0 F4:3 F5:3 F6:0", load: "800 0 900 1100", loadAfter: "1400 0 0 1400" } },
  // Member 3 fails: its two flows move, and so does F4, whose member 0 is still up.
  { id: "busy-member-fails", input: { members: 4, policy: "layer3+4", flows: ALL, failed: 3 }, expect: { after: "F1:0 F2:2 F3:0 F4:2 F5:2 F6:0", loadAfter: "1400 0 1400 0" } },
  // Three members, layer2+3, member 2 fails: modulo 2 over members 0 and 1.
  { id: "three-members-fail-two", input: { members: 3, policy: "layer2+3", flows: ALL, failed: 2 }, expect: { members: "F1:0 F2:0 F3:1 F4:2 F5:1 F6:1", after: "F1:0 F2:0 F3:1 F4:1 F5:0 F6:0", load: "1800 900 100", loadAfter: "2400 400 0" } },
  // Two members, layer3+4: the two backup streams split, one per member.
  { id: "two-members-split", input: { members: 2, policy: "layer3+4", flows: ["F1", "F2"], failed: null }, expect: { members: "F1:0 F2:1", load: "900 900", busiest: "0", work: "0xc3510369 0xc5626577 0xc5a7c2b5 0x62d3e15a" } },
  // Eight members with member 0 down: every survivor shifts, and modulo 7 scatters the flows anew.
  { id: "eight-members-fail-zero", input: { members: 8, policy: "layer3+4", flows: ALL, failed: 0 }, expect: { members: "F1:2 F2:3 F3:0 F4:4 F5:0 F6:3", after: "F1:6 F2:2 F3:4 F4:3 F5:2 F6:7", load: "700 0 900 1100 100 0 0 0", loadAfter: "0 0 1300 100 300 0 900 200" } },
  // The two LAN flows under layer2+3: their MAC and IP differences cancel in the XOR, both hashing to 0x808.
  { id: "lan-flows-cancel", input: { members: 4, policy: "layer2+3", flows: ["F5", "F6"], failed: null }, expect: { members: "F5:0 F6:0", work: "0x81e 0x800 0x808 0x808" } },
  // No flow running: nothing to place, nothing to work out.
  { id: "no-flows", input: { members: 4, policy: "layer2", flows: [], failed: 2 }, expect: { members: "", load: "0 0 0 0", loadAfter: "0 0 0 0", busiest: "-", work: "-" } },
]);

/** The reject cases. */
export const LACP_REJECTS: readonly RejectVector[] = Object.freeze([
  // One member is not a bond.
  { id: "bad-members", input: { members: 1, policy: "layer2", flows: ["F1"], failed: null }, code: "bad-members" },
  // A policy the lab does not model.
  { id: "bad-policy", input: { members: 4, policy: "encap3+4" as unknown as "layer2", flows: ["F1"], failed: null }, code: "bad-policy" },
  // A flow the lab does not have.
  { id: "bad-flow", input: { members: 4, policy: "layer2", flows: ["F9"], failed: null }, code: "bad-flow" },
  // A member beyond the bond.
  { id: "bad-failed", input: { members: 4, policy: "layer2", flows: ["F1"], failed: 4 }, code: "bad-failed" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute, summarise and compare every expected part.
  for (const v of LACP_VECTORS) {
    // The model's answer, summarised.
    const got = summarise(compute(v.input));
    // Each expected part in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that part.
      const have = got[k as keyof Summary];
      // A difference is a failure naming the case and the part.
      if (have !== want) failures.push(`${v.id}: ${k} is "${have}", expected "${want}"`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of LACP_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof LacpError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = LACP_VECTORS.length + LACP_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several parts, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
