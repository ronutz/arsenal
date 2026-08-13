// ============================================================================
// GOLDEN VECTORS for the iControl REST stats decoder.
//
// Built from the shapes BIG-IP actually returns: the triple envelope, a URL
// key, a description leaf, a nested member collection, and a 64-bit counter
// split into .high and .low - which is the case most hand-written flatteners
// silently get wrong.
// ============================================================================

import { decodeStats } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "icontrol-rest-stats-decoder/2026-08-13";

const POOL = JSON.stringify({
  kind: "tm:ltm:pool:poolstats",
  entries: {
    "https://localhost/mgmt/tm/ltm/pool/~Common~web_pool/stats": {
      nestedStats: {
        entries: {
          activeMemberCnt: { value: 2 },
          "status.availabilityState": { description: "available" },
          "serverside.bitsIn": { value: 84920312 },
          "serverside.curConns": { value: 7 },
        },
      },
    },
  },
});

const SPLIT64 = JSON.stringify({
  entries: {
    "https://localhost/mgmt/tm/ltm/virtual/~Common~vs_web/stats": {
      nestedStats: {
        entries: {
          "clientside.bitsIn.high": { value: 3 },
          "clientside.bitsIn.low": { value: 1000000 },
        },
      },
    },
  },
});

const MEMBERS = JSON.stringify({
  entries: {
    "https://localhost/mgmt/tm/ltm/pool/~Common~web_pool/members/stats": {
      nestedStats: {
        entries: {
          "https://localhost/mgmt/tm/ltm/pool/~Common~web_pool/members/~Common~10.1.1.10:80/stats": {
            nestedStats: { entries: { "status.availabilityState": { description: "available" }, "serverside.curConns": { value: 3 } } },
          },
          "https://localhost/mgmt/tm/ltm/pool/~Common~web_pool/members/~Common~10.1.1.11:80/stats": {
            nestedStats: { entries: { "status.availabilityState": { description: "offline" }, "serverside.curConns": { value: 0 } } },
          },
        },
      },
    },
  },
});

export interface StatsVector {
  name: string;
  input: string;
  expect: {
    statCount?: number;
    hasKey?: string;
    keyValue?: [string, string | number | boolean];
    objectIs?: string;
    objectCount?: number;
    noteContains?: string;
    throws?: boolean;
  };
}

export const STATS_VECTORS: readonly StatsVector[] = Object.freeze([
  {
    name: "a pool stats blob flattens",
    input: POOL,
    expect: { statCount: 4, hasKey: "serverside.bitsIn", objectIs: "/Common/web_pool" },
  },
  {
    name: "description leaves unwrap too",
    input: POOL,
    expect: { keyValue: ["status.availabilityState", "available"] },
  },
  {
    name: "*** a split 64-bit counter is COMBINED, not reported as halves ***",
    input: SPLIT64,
    expect: { keyValue: ["clientside.bitsIn", String((3n << 32n) + 1000000n)], noteContains: "64-bit counters" },
  },
  {
    name: "nested members become separate objects",
    input: MEMBERS,
    expect: { objectCount: 2, statCount: 4 },
  },
  {
    name: "the rate caveat is always stated",
    input: POOL,
    expect: { noteContains: "not rates" },
  },
  {
    name: "invalid JSON is refused clearly",
    input: "{ not json",
    expect: { throws: true },
  },
  {
    name: "a config response is not a stats response",
    input: JSON.stringify({ kind: "tm:ltm:pool:poolstate", name: "web_pool" }),
    expect: { throws: true },
  },
  {
    name: "empty input throws",
    input: "   ",
    expect: { throws: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of STATS_VECTORS) {
    let d;
    try {
      d = decodeStats(v.input);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.statCount !== undefined && d.stats.length !== e.statCount) f.push(`${v.name}: ${d.stats.length} stats != ${e.statCount}`);
    if (e.hasKey && !d.stats.some((s) => s.key === e.hasKey)) f.push(`${v.name}: no key ${e.hasKey}`);
    if (e.keyValue) {
      const hit = d.stats.find((s) => s.key === e.keyValue![0]);
      if (!hit) f.push(`${v.name}: no key ${e.keyValue[0]}`);
      else if (String(hit.value) !== String(e.keyValue[1])) f.push(`${v.name}: ${e.keyValue[0]} = ${hit.value} != ${e.keyValue[1]}`);
    }
    if (e.objectIs && d.objects[0] !== e.objectIs) f.push(`${v.name}: object ${d.objects[0]} != ${e.objectIs}`);
    if (e.objectCount !== undefined && d.objects.length !== e.objectCount) f.push(`${v.name}: ${d.objects.length} objects != ${e.objectCount}`);
    if (e.noteContains && !d.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
  }
  return f;
}
