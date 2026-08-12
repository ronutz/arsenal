// ============================================================================
// src/lib/tools/f5os-restconf-path-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the F5OS RESTCONF path explainer.
//
// Each vector states an expectation that a reader could check by hand against
// the F5OS documentation. They exist so that a later change to the engine
// which quietly alters a decode fails loudly instead.
//
// The vectors deliberately include the awkward cases - a bare path, a full URL
// on 8888, the 1.8+ /api form on 443, an unknown module, a keyed list, a
// nested key, and an RPC - because those are where a path explainer is
// actually useful and where it is most likely to be wrong.
// ============================================================================

import { decodeF5osPath } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5os-restconf-path-explainer/2026-08-12";

export interface F5osVector {
  name: string;
  input: string;
  /** What must be true of the decode. Kept small and checkable by eye. */
  expect: {
    root?: "restconf" | "api" | "unknown";
    rootResource?: string;
    port?: string;
    segmentCount?: number;
    firstModule?: string;
    hasListKey?: string;
    unknownModule?: string;
    noteContains?: string;
    warns?: boolean;
  };
}

export const F5OS_VECTORS: readonly F5osVector[] = Object.freeze([
  {
    name: "system AAA, bare path",
    input: "/restconf/data/openconfig-system:system/aaa",
    expect: { root: "restconf", rootResource: "data", segmentCount: 2, firstModule: "openconfig-system" },
  },
  {
    name: "tenant running-state with a list key",
    input: "/restconf/data/f5-tenants:tenants/tenant=tenant1/config/running-state",
    expect: { root: "restconf", rootResource: "data", firstModule: "f5-tenants", hasListKey: "tenant1", segmentCount: 4 },
  },
  {
    name: "full URL on the original 8888 listener",
    input: "https://velos.example.net:8888/restconf/data/openconfig-interfaces:interfaces",
    expect: { root: "restconf", port: "8888", firstModule: "openconfig-interfaces", noteContains: "8888" },
  },
  {
    name: "the F5OS 1.8+ /api form on 443",
    input: "https://r5900.example.net:443/api/data/f5-system-slot:slots",
    expect: { root: "api", port: "443", firstModule: "f5-system-slot" },
  },
  {
    name: "an RPC rather than a datastore node",
    input: "/restconf/operations/f5-utils-file-transfer:file-export",
    expect: { root: "restconf", rootResource: "operations", noteContains: "RPC" },
  },
  {
    name: "unknown module is reported, not invented",
    input: "/restconf/data/f5-not-a-real-module:things/thing=1",
    expect: { root: "restconf", unknownModule: "f5-not-a-real-module", hasListKey: "1" },
  },
  {
    name: "query string is set aside, not decoded as a node",
    input: "/restconf/data/openconfig-system:system?depth=3&content=config",
    expect: { root: "restconf", segmentCount: 1, noteContains: "query string" },
  },
  {
    name: "a path that is not an F5OS API path warns",
    input: "/mgmt/tm/ltm/virtual",
    expect: { root: "unknown", warns: true },
  },
  {
    name: "keyed interface with a dotted name",
    input: "/restconf/data/openconfig-interfaces:interfaces/interface=1.0/state/counters",
    expect: { firstModule: "openconfig-interfaces", hasListKey: "1.0", segmentCount: 4 },
  },
  {
    name: "vlan membership",
    input: "/restconf/data/openconfig-vlan:vlans/vlan=100/config",
    expect: { firstModule: "openconfig-vlan", hasListKey: "100", segmentCount: 3 },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of F5OS_VECTORS) {
    let d;
    try {
      d = decodeF5osPath(v.input);
    } catch (e) {
      failures.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.root && d.root !== e.root) failures.push(`${v.name}: root ${d.root} != ${e.root}`);
    if (e.rootResource && d.rootResource !== e.rootResource) failures.push(`${v.name}: rootResource ${d.rootResource} != ${e.rootResource}`);
    if (e.port && d.port !== e.port) failures.push(`${v.name}: port ${d.port} != ${e.port}`);
    if (e.segmentCount !== undefined && d.segments.length !== e.segmentCount) failures.push(`${v.name}: ${d.segments.length} segments != ${e.segmentCount}`);
    if (e.firstModule && d.modules[0]?.module !== e.firstModule && d.segments.find((s) => s.module)?.module !== e.firstModule) failures.push(`${v.name}: first module != ${e.firstModule}`);
    if (e.hasListKey && !d.segments.some((s) => s.keyValue === e.hasListKey)) failures.push(`${v.name}: no list key ${e.hasListKey}`);
    if (e.unknownModule && !d.unknownModules.includes(e.unknownModule)) failures.push(`${v.name}: ${e.unknownModule} not reported unknown`);
    if (e.noteContains && !d.notes.some((n) => n.toLowerCase().includes(e.noteContains!.toLowerCase()))) failures.push(`${v.name}: no note containing "${e.noteContains}"`);
    if (e.warns && d.warnings.length === 0) failures.push(`${v.name}: expected a warning`);
  }
  return failures;
}
