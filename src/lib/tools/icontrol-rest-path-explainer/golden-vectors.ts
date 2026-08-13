// ============================================================================
// GOLDEN VECTORS for the iControl REST path explainer.
//
// Each states something checkable by hand against F5 documentation. They cover
// the awkward cases deliberately: a bare collection, a tilde-encoded object, a
// nested folder, a pool member sub-collection, an unqualified name, the shared
// tree, query options, and a path that is not iControl REST at all.
// ============================================================================

import { decodeIControlPath } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "icontrol-rest-path-explainer/2026-08-13";

export interface IControlVector {
  name: string;
  input: string;
  expect: {
    module?: string;
    collection?: string[];
    objectName?: string;
    partition?: string;
    tmsh?: string;
    folders?: string[];
    subCollection?: string;
    optionKeys?: string[];
    noteContains?: string;
    warns?: boolean;
  };
}

export const ICONTROL_VECTORS: readonly IControlVector[] = Object.freeze([
  {
    name: "a whole collection",
    input: "/mgmt/tm/ltm/pool",
    expect: { module: "ltm", collection: ["pool"] },
  },
  {
    name: "tilde-encoded object in Common",
    input: "/mgmt/tm/ltm/pool/~Common~web_pool",
    expect: { module: "ltm", collection: ["pool"], objectName: "web_pool", partition: "Common", tmsh: "/Common/web_pool", noteContains: "tilde" },
  },
  {
    name: "object inside a folder",
    input: "/mgmt/tm/ltm/virtual/~Common~apps~vs_web",
    expect: { module: "ltm", objectName: "vs_web", partition: "Common", folders: ["apps"], tmsh: "/Common/apps/vs_web" },
  },
  {
    name: "pool members sub-collection",
    input: "/mgmt/tm/ltm/pool/~Common~web_pool/members",
    expect: { module: "ltm", objectName: "web_pool", subCollection: "members", noteContains: "expandSubcollections" },
  },
  {
    name: "unqualified name resolves in the caller partition",
    input: "/mgmt/tm/ltm/node/web1.example.net",
    expect: { module: "ltm", objectName: "web1.example.net", noteContains: "current partition" },
  },
  {
    name: "query options are explained",
    input: "/mgmt/tm/ltm/virtual?$select=name,destination&expandSubcollections=true",
    expect: { module: "ltm", optionKeys: ["$select", "expandSubcollections"] },
  },
  {
    name: "the shared worker tree",
    input: "https://bigip.example.net/mgmt/shared/file-transfer/uploads",
    expect: { noteContains: "shared worker" },
  },
  {
    name: "a net module path",
    input: "/mgmt/tm/net/vlan/~Common~internal",
    expect: { module: "net", objectName: "internal", partition: "Common" },
  },
  {
    name: "unrecognised module is reported, not invented",
    input: "/mgmt/tm/notamodule/thing",
    expect: { collection: ["thing"] },
  },
  {
    name: "an F5OS path is not an iControl path",
    input: "/restconf/data/openconfig-system:system",
    expect: { warns: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of ICONTROL_VECTORS) {
    let d;
    try { d = decodeIControlPath(v.input); }
    catch (e) { f.push(`${v.name}: threw ${(e as Error).message}`); continue; }
    const e = v.expect;
    if (e.module && d.module?.module !== e.module) f.push(`${v.name}: module ${d.module?.module} != ${e.module}`);
    if (e.collection && d.collection.join(",") !== e.collection.join(",")) f.push(`${v.name}: collection [${d.collection}] != [${e.collection}]`);
    if (e.objectName && d.object?.name !== e.objectName) f.push(`${v.name}: object ${d.object?.name} != ${e.objectName}`);
    if (e.partition && d.object?.partition !== e.partition) f.push(`${v.name}: partition ${d.object?.partition} != ${e.partition}`);
    if (e.tmsh && d.object?.tmsh !== e.tmsh) f.push(`${v.name}: tmsh ${d.object?.tmsh} != ${e.tmsh}`);
    if (e.folders && (d.object?.folders ?? []).join(",") !== e.folders.join(",")) f.push(`${v.name}: folders != ${e.folders}`);
    if (e.subCollection && d.subCollection !== e.subCollection) f.push(`${v.name}: subCollection ${d.subCollection} != ${e.subCollection}`);
    if (e.optionKeys && e.optionKeys.some((k) => !d.options.some((o) => o.key === k))) f.push(`${v.name}: missing option keys`);
    if (e.noteContains && !d.notes.some((n) => n.toLowerCase().includes(e.noteContains!.toLowerCase()))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
    if (e.warns && d.warnings.length === 0) f.push(`${v.name}: expected a warning`);
  }
  return f;
}
