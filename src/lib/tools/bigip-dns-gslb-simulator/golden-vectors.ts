// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// bigip-dns-gslb-simulator / golden-vectors.ts
// ----------------------------------------------------------------------------
// Known-answer vectors. Each expected distribution is hand-derived from the
// documented GTM behavior (techdocs), independent of this engine's code:
//   - Round Robin over N: even, remainder to earliest in sequence.
//   - Ratio: proportional to weights (largest-remainder).
//   - Global Availability: all to the first up resource.
//   - Topology: all to the region-matching resource (score 10).
//   - Dynamic wide-IP method: simulable=false with reasonCode.
// ============================================================================

import { simulate, type GslbInput, type GslbResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "bigip-dns-gslb-simulator-v1";

export interface GslbVector {
  id: string;
  input: GslbInput;
  expect: {
    ok?: boolean;
    simulable?: boolean;
    reasonCode?: string;
    error?: boolean;
    // pool id -> expected request count
    poolCounts?: Record<string, number>;
    // "poolId/memberId" -> expected request count
    memberCounts?: Record<string, number>;
  };
}

const mk = (id: string, ratio: number, region: string, up = true) => ({ id, ratio, region, up });

export const GOLDEN_VECTORS: GslbVector[] = [
  // v1: wide-IP Round Robin across 3 up pools, 9 requests -> 3/3/3.
  //     Each pool round-robins its 2 members -> within each pool the 3 go 2/1.
  {
    id: "v1",
    input: {
      poolMethod: "round-robin", clientRegion: "", requests: 9,
      pools: [
        { id: "p1", ratio: 1, region: "na", up: true, method: "round-robin", members: [mk("a1", 1, "na"), mk("a2", 1, "na")] },
        { id: "p2", ratio: 1, region: "eu", up: true, method: "round-robin", members: [mk("b1", 1, "eu"), mk("b2", 1, "eu")] },
        { id: "p3", ratio: 1, region: "ap", up: true, method: "round-robin", members: [mk("c1", 1, "ap"), mk("c2", 1, "ap")] },
      ],
    },
    expect: { ok: true, simulable: true, poolCounts: { p1: 3, p2: 3, p3: 3 }, memberCounts: { "p1/a1": 2, "p1/a2": 1, "p2/b1": 2, "p2/b2": 1, "p3/c1": 2, "p3/c2": 1 } },
  },
  // v2: wide-IP Ratio 3:1 across 2 pools, 100 requests -> 75/25.
  {
    id: "v2",
    input: {
      poolMethod: "ratio", clientRegion: "", requests: 100,
      pools: [
        { id: "eu", ratio: 3, region: "eu", up: true, method: "round-robin", members: [mk("e1", 1, "eu")] },
        { id: "us", ratio: 1, region: "na", up: true, method: "round-robin", members: [mk("u1", 1, "na")] },
      ],
    },
    expect: { ok: true, simulable: true, poolCounts: { eu: 75, us: 25 }, memberCounts: { "eu/e1": 75, "us/u1": 25 } },
  },
  // v3: Global Availability at the wide IP -> all 50 to the first up pool.
  //     First pool is DOWN, so all go to the second (the next available).
  {
    id: "v3",
    input: {
      poolMethod: "global-availability", clientRegion: "", requests: 50,
      pools: [
        { id: "primary", ratio: 1, region: "na", up: false, method: "round-robin", members: [mk("p1", 1, "na", false)] },
        { id: "secondary", ratio: 1, region: "eu", up: true, method: "round-robin", members: [mk("s1", 1, "eu")] },
      ],
    },
    expect: { ok: true, simulable: true, poolCounts: { primary: 0, secondary: 50 }, memberCounts: { "secondary/s1": 50 } },
  },
  // v4: Topology at the wide IP, client in "eu" -> all to the eu pool (score 10).
  {
    id: "v4",
    input: {
      poolMethod: "topology", clientRegion: "eu", requests: 40,
      pools: [
        { id: "na-pool", ratio: 1, region: "na", up: true, method: "round-robin", members: [mk("n1", 1, "na")] },
        { id: "eu-pool", ratio: 1, region: "eu", up: true, method: "round-robin", members: [mk("x1", 1, "eu"), mk("x2", 1, "eu")] },
      ],
    },
    expect: { ok: true, simulable: true, poolCounts: { "na-pool": 0, "eu-pool": 40 }, memberCounts: { "eu-pool/x1": 20, "eu-pool/x2": 20 } },
  },
  // v5: pool-tier Ratio. Wide IP RR to 1 pool (all 60), member ratio 2:1 -> 40/20.
  {
    id: "v5",
    input: {
      poolMethod: "round-robin", clientRegion: "", requests: 60,
      pools: [
        { id: "only", ratio: 1, region: "na", up: true, method: "ratio", members: [mk("big", 2, "na"), mk("small", 1, "na")] },
      ],
    },
    expect: { ok: true, simulable: true, poolCounts: { only: 60 }, memberCounts: { "only/big": 40, "only/small": 20 } },
  },
  // v6: a down member inside a pool using Round Robin -> only up members share.
  {
    id: "v6",
    input: {
      poolMethod: "round-robin", clientRegion: "", requests: 10,
      pools: [
        { id: "pool", ratio: 1, region: "na", up: true, method: "round-robin", members: [mk("up1", 1, "na", true), mk("down", 1, "na", false), mk("up2", 1, "na", true)] },
      ],
    },
    expect: { ok: true, simulable: true, poolCounts: { pool: 10 }, memberCounts: { "pool/up1": 5, "pool/down": 0, "pool/up2": 5 } },
  },
  // v7: dynamic wide-IP method (QoS) -> not simulable, reasonCode set.
  {
    id: "v7",
    input: {
      poolMethod: "qos", clientRegion: "", requests: 100,
      pools: [{ id: "p", ratio: 1, region: "na", up: true, method: "round-robin", members: [mk("m", 1, "na")] }],
    },
    expect: { ok: true, simulable: false, reasonCode: "qos" },
  },
  // e1: no pools.
  { id: "e1", input: { poolMethod: "round-robin", clientRegion: "", requests: 10, pools: [] }, expect: { error: true } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

function poolCount(r: GslbResult, id: string): number {
  return r.poolDistribution.find((p) => p.poolId === id)?.count ?? -1;
}
function memberCount(r: GslbResult, key: string): number {
  const [pid, mid] = key.split("/");
  return r.memberDistribution.find((m) => m.poolId === pid && m.memberId === mid)?.count ?? -1;
}

export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  for (const v of GOLDEN_VECTORS) {
    const r = simulate(v.input);
    if (v.expect.error) {
      if (r.ok || !r.error) failures.push(`${v.id}: expected an error`);
      continue;
    }
    if (v.expect.ok !== undefined && r.ok !== v.expect.ok) failures.push(`${v.id}: ok ${r.ok} != ${v.expect.ok}`);
    if (v.expect.simulable !== undefined && r.simulable !== v.expect.simulable) failures.push(`${v.id}: simulable ${r.simulable} != ${v.expect.simulable}`);
    if (v.expect.reasonCode !== undefined && r.reasonCode !== v.expect.reasonCode) failures.push(`${v.id}: reasonCode ${r.reasonCode} != ${v.expect.reasonCode}`);
    if (v.expect.poolCounts) {
      for (const [id, want] of Object.entries(v.expect.poolCounts)) {
        const got = poolCount(r, id);
        if (got !== want) failures.push(`${v.id}: pool ${id} ${got} != ${want}`);
      }
    }
    if (v.expect.memberCounts) {
      for (const [key, want] of Object.entries(v.expect.memberCounts)) {
        const got = memberCount(r, key);
        if (got !== want) failures.push(`${v.id}: member ${key} ${got} != ${want}`);
      }
    }
    // conservation: pool counts sum to N (when simulable)
    if (r.simulable && r.ok) {
      const sum = r.poolDistribution.reduce((a, p) => a + p.count, 0);
      if (sum !== r.requests) failures.push(`${v.id}: pool sum ${sum} != N ${r.requests}`);
    }
  }
  return { pass: failures.length === 0, failures };
}
