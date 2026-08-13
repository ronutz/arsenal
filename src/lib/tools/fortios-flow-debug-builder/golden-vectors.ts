// ============================================================================
// GOLDEN VECTORS for the FortiOS debug flow builder.
//
// A builder is verified by what it EMITS. Each vector asserts something an
// engineer could check against FortiOS documentation: that the filter precedes
// the trace, that the trace precedes enable, that cleanup is always present,
// and that a protocol name becomes the number FortiOS wants.
// ============================================================================

import { buildFlowDebug, planToText } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "fortios-flow-debug-builder/2026-08-13";

export interface FlowVector {
  name: string;
  input: Parameters<typeof buildFlowDebug>[0];
  expect: {
    contains?: string[];
    /** These must appear in this relative order in the setup block. */
    order?: string[];
    warns?: boolean;
    noteContains?: string;
  };
}

export const FLOW_VECTORS: readonly FlowVector[] = Object.freeze([
  {
    name: "address only, defaults to 100 packets",
    input: { addr: "10.1.1.5" },
    expect: {
      contains: ["diagnose debug flow filter addr 10.1.1.5", "diagnose debug flow trace start 100"],
      order: ["filter addr", "trace start", "diagnose debug enable"],
    },
  },
  {
    name: "protocol NAME becomes the number",
    input: { addr: "10.1.1.5", proto: "tcp" },
    expect: { contains: ["diagnose debug flow filter proto 6"] },
  },
  {
    name: "udp too",
    input: { daddr: "8.8.8.8", proto: "udp", dport: "53" },
    expect: { contains: ["diagnose debug flow filter proto 17", "diagnose debug flow filter dport 53"] },
  },
  {
    name: "the filter is printed back for checking",
    input: { addr: "192.0.2.1" },
    expect: { contains: ["diagnose debug flow filter\n"] },
  },
  {
    name: "cleanup is always emitted",
    input: { addr: "192.0.2.1" },
    expect: { contains: ["diagnose debug flow trace stop", "diagnose debug disable", "diagnose debug reset"] },
  },
  {
    name: "iprope is opt-in",
    input: { addr: "192.0.2.1", iprope: true },
    expect: { contains: ["diagnose debug flow show iprope enable"] },
  },
  {
    name: "timestamps are opt-in",
    input: { addr: "192.0.2.1", timestamp: true },
    expect: { contains: ["diagnose debug console timestamp enable"] },
  },
  {
    name: "a large count warns",
    input: { addr: "192.0.2.1", count: 5000 },
    expect: { warns: true },
  },
  {
    name: "vdom is entered before filtering",
    input: { addr: "192.0.2.1", vdom: "customer-a" },
    expect: { order: ["edit customer-a", "filter addr"] },
  },
  {
    name: "the offload caveat is always stated",
    input: { addr: "192.0.2.1" },
    expect: { noteContains: "offloaded to hardware" },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of FLOW_VECTORS) {
    let plan;
    try { plan = buildFlowDebug(v.input); }
    catch (e) { f.push(`${v.name}: threw ${(e as Error).message}`); continue; }
    const text = planToText(plan);
    for (const c of v.expect.contains ?? []) {
      if (!text.includes(c.replace(/\\n/g, "\n"))) f.push(`${v.name}: missing "${c}"`);
    }
    if (v.expect.order) {
      let last = -1;
      for (const o of v.expect.order) {
        const i = text.indexOf(o);
        if (i < 0) { f.push(`${v.name}: order token "${o}" absent`); break; }
        if (i < last) { f.push(`${v.name}: "${o}" out of order`); break; }
        last = i;
      }
    }
    if (v.expect.warns && plan.warnings.length === 0) f.push(`${v.name}: expected a warning`);
    if (v.expect.noteContains && !plan.notes.some((n) => n.includes(v.expect.noteContains!))) {
      f.push(`${v.name}: no note containing "${v.expect.noteContains}"`);
    }
  }
  // An empty filter MUST be refused.
  try { buildFlowDebug({}); f.push("empty filter: should have thrown"); } catch { /* expected */ }
  return f;
}
