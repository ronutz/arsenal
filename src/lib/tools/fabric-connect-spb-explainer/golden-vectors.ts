// ============================================================================
// GOLDEN VECTORS for the Fabric Connect / SPB explainer.
//
// The checkable behaviours: the 24-bit I-SID range, the even/odd distribution
// across the two backbone VLANs, the nickname format, and the BEB/BCB
// distinction. Each is verifiable against IEEE 802.1aq and Extreme's own
// configuration guides.
// ============================================================================

import { explainSpb } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "fabric-connect-spb-explainer/2026-08-13";

export interface SpbVector {
  name: string;
  input: Parameters<typeof explainSpb>[0];
  expect: {
    factValue?: [string, string];
    factContains?: [string, string];
    warns?: boolean;
    throws?: boolean;
    noteContains?: string;
  };
}

export const SPB_VECTORS: readonly SpbVector[] = Object.freeze([
  {
    name: "*** an EVEN I-SID rides the secondary B-VLAN ***",
    input: { isid: 20010 },
    expect: { factValue: ["Carried on B-VLAN", "4052"] },
  },
  {
    name: "*** an ODD I-SID rides the primary ***",
    input: { isid: 20011 },
    expect: { factValue: ["Carried on B-VLAN", "4051"] },
  },
  {
    name: "a custom B-VLAN pair is honoured",
    input: { isid: 20010, primaryBvlan: 100, secondaryBvlan: 200 },
    expect: { factValue: ["Carried on B-VLAN", "200"] },
  },
  {
    name: "an I-SID above the 24-bit range is refused",
    input: { isid: 16777216 },
    expect: { throws: true },
  },
  {
    name: "zero is not a valid I-SID",
    input: { isid: 0 },
    expect: { throws: true },
  },
  {
    name: "an L2VSN is explained as a VLAN binding",
    input: { isid: 20010, service: "l2vsn" },
    expect: { factContains: ["Service type", "edge VLAN"] },
  },
  {
    name: "an L3VSN is explained as a VRF binding",
    input: { isid: 20011, service: "l3vsn" },
    expect: { factContains: ["Service type", "VRF"] },
  },
  {
    name: "a malformed nickname warns",
    input: { isid: 20010, nickname: "1.0.1" },
    expect: { warns: true },
  },
  {
    name: "a well-formed nickname is accepted",
    input: { isid: 20010, nickname: "1.00.01" },
    expect: { factValue: ["SPB nickname", "1.00.01"] },
  },
  {
    name: "a BCB is told it holds no service configuration",
    input: { isid: 20010, role: "bcb" },
    expect: { factContains: ["Role", "never sees a customer MAC"] },
  },
  {
    name: "the B-VLAN is always explained as not-a-VLAN",
    input: { isid: 20010 },
    expect: { factContains: ["Backbone VLANs", "does not flood"] },
  },
  {
    name: "edge-only provisioning is always stated",
    input: { isid: 20010 },
    expect: { noteContains: "at the edge only" },
  },
  {
    name: "identical B-VLANs warn",
    input: { isid: 20010, primaryBvlan: 4051, secondaryBvlan: 4051 },
    expect: { warns: true },
  },
  {
    name: "an empty request throws",
    input: {},
    expect: { throws: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of SPB_VECTORS) {
    let r;
    try {
      r = explainSpb(v.input);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.factValue) {
      const hit = r.facts.find((x) => x.label === e.factValue![0]);
      if (!hit) f.push(`${v.name}: no fact "${e.factValue[0]}"`);
      else if (hit.value !== e.factValue[1]) f.push(`${v.name}: ${e.factValue[0]} = ${hit.value} != ${e.factValue[1]}`);
    }
    if (e.factContains) {
      const hit = r.facts.find((x) => x.label === e.factContains![0]);
      if (!hit) f.push(`${v.name}: no fact "${e.factContains[0]}"`);
      else if (!hit.explain.includes(e.factContains[1])) f.push(`${v.name}: ${e.factContains[0]} explanation lacks "${e.factContains[1]}"`);
    }
    if (e.warns && r.warnings.length === 0) f.push(`${v.name}: expected a warning`);
    if (e.noteContains && !r.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
  }
  return f;
}
