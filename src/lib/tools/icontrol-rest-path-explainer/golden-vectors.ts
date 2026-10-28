// ============================================================================
// GOLDEN VECTORS for the iControl REST path explainer.
//
// Each states something checkable by hand against F5 documentation. They cover
// the awkward cases deliberately: a bare collection, a tilde-encoded object, a
// nested folder, a pool member sub-collection, an unqualified name, the shared
// tree, query options, and a path that is not iControl REST at all.
//
// Share vectors (2026-10-27) pin the copy a Share results link carries
// (shareablePath): the token of /mgmt/shared/authz/tokens/<token> masked with
// its shape kept, a userinfo password and the credentials of an X-F5-Auth-Token
// or Authorization header replaced, and the receiving page reading the same.
// ============================================================================

import { decodeIControlPath, shareablePath, type IControlDecode } from "./compute";

// 2026-10-27: share vectors added (SHARE_VECTORS, the copy a Share results link carries), so the set id moved from
// "icontrol-rest-path-explainer/2026-08-13" (scripts/api-sync.json records it; the re-check is in the wave's notes).
export const GOLDEN_VECTOR_SET_ID = "icontrol-rest-path-explainer/2026-10-27";

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

/** One share vector: the path as typed, the copy a link carries, the count, and what must never travel. */
export interface IControlShareVector {
  name: string;
  note: string;
  input: string;
  expect: string;
  redacted: number;
  secrets: readonly string[];
}

/**
 * The copy of the userinfo vector's URL. A constant, not a field value: scripts/check-citation-fields reads a field
 * that holds an http URL as a citation for the liveness audit, and this is an expected output, never a citation.
 */
const USERINFO_COPY = "https://admin:[redacted]@bigip.example.net/mgmt/tm/ltm/pool/~Common~web_pool?expandSubcollections=true"; // the password replaced

/** The share vectors (2026-10-27). */
export const SHARE_VECTORS: readonly IControlShareVector[] = Object.freeze([
  {
    name: "share-token-path",
    note: "F5's token extension call: the token in the path is masked, shape kept, and still read as the object",
    input: "/mgmt/shared/authz/tokens/4RS3SNHZG2G5OCRGO5JKL5NLGH",
    expect: "/mgmt/shared/authz/tokens/0XX0XXXXX0X0XXXXX0XXX0XXXX",
    redacted: 1,
    secrets: ["4RS3SNHZG2G5OCRGO5JKL5NLGH"],
  },
  {
    name: "share-userinfo-password",
    note: "RFC 3986 section 3.2.1: the password after the userinfo's first colon goes; the user and the host stay",
    input: "https://admin:Adm1n-Pa55@bigip.example.net/mgmt/tm/ltm/pool/~Common~web_pool?expandSubcollections=true",
    expect: USERINFO_COPY,
    redacted: 1,
    secrets: ["Adm1n-Pa55"],
  },
  {
    name: "share-headers",
    note: "An X-F5-Auth-Token header and a Basic Authorization header pasted with the path",
    input: "X-F5-Auth-Token: JWLFQ5YNLL5CL4EBOVFI2PKY7Z\nAuthorization: Basic YWRtaW46YWRtaW4=\n/mgmt/tm/sys/version",
    expect: "X-F5-Auth-Token: [redacted]\nAuthorization: [redacted]\n/mgmt/tm/sys/version",
    redacted: 2,
    secrets: ["JWLFQ5YNLL5CL4EBOVFI2PKY7Z", "YWRtaW46YWRtaW4="],
  },
  {
    name: "share-nothing-to-replace",
    note: "The Example path carries no credential: the copy is the path",
    input: "/mgmt/tm/ltm/pool/~Common~apps~web_pool/members?expandSubcollections=true",
    expect: "/mgmt/tm/ltm/pool/~Common~apps~web_pool/members?expandSubcollections=true",
    redacted: 0,
    secrets: [],
  },
]);

/** What the receiving page reads, without the values the copy masks: the parts, their kinds, the notes and warnings. */
function readingShape(d: IControlDecode): string {
  return JSON.stringify([d.isMgmt, d.root, d.module?.module, d.unknownModule, d.collection, !!d.object, d.object?.partition, d.object?.folders, d.subCollection, !!d.subObject, d.options.map((o) => o.key), d.notes, d.warnings]); // compact
} // readingShape

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
  // The share vectors: the copy, the count, no secret, the same reading on the receiving page, and a stable copy.
  for (const v of SHARE_VECTORS) {
    const out = shareablePath(v.input); // the copy
    if (out.text !== v.expect) f.push(`${v.name}: copy ${JSON.stringify(out.text)}`); // byte for byte
    if (out.redacted !== v.redacted) f.push(`${v.name}: redacted ${out.redacted} != ${v.redacted}`); // the count
    for (const secret of v.secrets) if (out.text.includes(secret)) f.push(`${v.name}: the copy contains ${JSON.stringify(secret)}`); // never travels
    try { if (readingShape(decodeIControlPath(v.input)) !== readingShape(decodeIControlPath(out.text))) f.push(`${v.name}: the copy reads differently`); } catch (e) { f.push(`${v.name}: threw ${(e as Error).message}`); } // the same parts and notes
    const again = shareablePath(out.text); // the copy of the copy
    if (again.text !== out.text || again.redacted !== 0) f.push(`${v.name}: the copy of the copy differs`); // stable
  }
  return f;
}
