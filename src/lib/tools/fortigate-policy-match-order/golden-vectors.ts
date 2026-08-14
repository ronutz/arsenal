// ============================================================================
// GOLDEN VECTORS for the FortiGate policy match-order explainer.
//
// Each asserts a documented behaviour: first match wins and evaluation stops,
// a disabled policy is absent rather than denying, an unmatched packet reaches
// the implicit deny, a broader policy above makes a narrower one below
// unreachable, and the VIP rules behave as FortiOS documents them.
// ============================================================================

import { analysePolicies, type Policy, type Packet } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "fortigate-policy-match-order/2026-08-13";

const P = (o: Partial<Policy> & { id: string }): Policy => ({
  srcintf: "any", dstintf: "any", srcaddr: "all", dstaddr: "all",
  service: "ALL", action: "accept", ...o,
});

const PKT: Packet = { srcintf: "port1", dstintf: "port2", src: "web-servers", dst: "all", service: "HTTPS" };

export interface PolicyVector {
  name: string;
  policies: Policy[];
  packet?: Packet;
  expect: {
    winner?: string;
    implicitDeny?: boolean;
    stopsAfter?: number;
    shadowed?: [string, string][];
    warns?: boolean;
    noteContains?: string;
    throws?: boolean;
  };
}

export const POLICY_VECTORS: readonly PolicyVector[] = Object.freeze([
  {
    name: "first match wins and evaluation stops",
    policies: [
      P({ id: "10", srcintf: "port1", dstintf: "port2", srcaddr: "web-servers", service: "HTTPS" }),
      P({ id: "20", srcintf: "port1", dstintf: "port2", srcaddr: "web-servers", service: "HTTPS", action: "deny" }),
    ],
    packet: PKT,
    expect: { winner: "10", stopsAfter: 1 },
  },
  {
    name: "*** THE ID IS NOT THE ORDER: policy 47 above policy 3 wins ***",
    policies: [
      P({ id: "47", srcintf: "port1", dstintf: "port2", srcaddr: "all", service: "ALL", action: "deny" }),
      P({ id: "3", srcintf: "port1", dstintf: "port2", srcaddr: "web-servers", service: "HTTPS" }),
    ],
    packet: PKT,
    expect: { winner: "47" },
  },
  {
    name: "an unmatched packet reaches the implicit deny",
    policies: [P({ id: "10", srcintf: "port3", dstintf: "port4" })],
    packet: PKT,
    expect: { implicitDeny: true, noteContains: "implicit deny" },
  },
  {
    name: "a disabled policy is ABSENT, not a deny",
    policies: [
      P({ id: "10", srcintf: "port1", dstintf: "port2", action: "deny", disabled: true }),
      P({ id: "20", srcintf: "port1", dstintf: "port2" }),
    ],
    packet: PKT,
    expect: { winner: "20" },
  },
  {
    name: "*** a broad policy above makes a narrow one below UNREACHABLE ***",
    policies: [
      P({ id: "10", srcintf: "any", dstintf: "any", srcaddr: "all", dstaddr: "all", service: "ALL" }),
      P({ id: "20", srcintf: "port1", dstintf: "port2", srcaddr: "web-servers", service: "HTTPS" }),
    ],
    expect: { shadowed: [["20", "10"]] },
  },
  {
    name: "a narrow policy above does NOT shadow a broad one below",
    policies: [
      P({ id: "10", srcintf: "port1", dstintf: "port2", srcaddr: "web-servers", service: "HTTPS" }),
      P({ id: "20", srcintf: "any", dstintf: "any" }),
    ],
    expect: { shadowed: [] },
  },
  {
    name: "a VIP policy with no match-vip deny warns",
    policies: [P({ id: "10", srcintf: "port1", dstintf: "port2", vip: true })],
    expect: { warns: true, noteContains: "takes priority" },
  },
  {
    name: "a deny carrying match-vip clears that warning",
    policies: [
      P({ id: "5", srcintf: "port1", dstintf: "port2", srcaddr: "bad-hosts", action: "deny", matchVip: true }),
      P({ id: "10", srcintf: "port1", dstintf: "port2", vip: true }),
    ],
    expect: { warns: false },
  },
  {
    name: "*** an ACCEPT policy cannot carry match-vip ***",
    policies: [P({ id: "10", action: "accept", matchVip: true })],
    expect: { warns: true },
  },
  {
    name: "the ID-is-not-the-order note is always given",
    policies: [P({ id: "10" })],
    expect: { noteContains: "identifier, not a position" },
  },
  {
    name: "the each-direction note is always given",
    policies: [P({ id: "10" })],
    expect: { noteContains: "Each direction needs its own policy" },
  },
  {
    name: "an empty list throws",
    policies: [],
    expect: { throws: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of POLICY_VECTORS) {
    let r;
    try {
      r = analysePolicies(v.policies, v.packet);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.winner && r.winner?.id !== e.winner) f.push(`${v.name}: winner ${r.winner?.id} != ${e.winner}`);
    if (e.implicitDeny !== undefined && r.implicitDeny !== e.implicitDeny) f.push(`${v.name}: implicitDeny ${r.implicitDeny} != ${e.implicitDeny}`);
    if (e.stopsAfter !== undefined && r.steps.length !== e.stopsAfter) f.push(`${v.name}: ${r.steps.length} steps != ${e.stopsAfter} - evaluation did not stop`);
    if (e.shadowed) {
      const got = r.shadowed.map((s) => `${s.policyId}<${s.shadowedBy}`).sort().join(",");
      const want = e.shadowed.map(([a, b]) => `${a}<${b}`).sort().join(",");
      if (got !== want) f.push(`${v.name}: shadowed [${got}] != [${want}]`);
    }
    if (e.warns !== undefined && (r.warnings.length > 0) !== e.warns) f.push(`${v.name}: warnings ${r.warnings.length} but expected warns=${e.warns}`);
    if (e.noteContains && !r.notes.some((n) => n.includes(e.noteContains!)) && !r.warnings.some((n) => n.includes(e.noteContains!))) {
      f.push(`${v.name}: nothing containing "${e.noteContains}"`);
    }
  }
  return f;
}
