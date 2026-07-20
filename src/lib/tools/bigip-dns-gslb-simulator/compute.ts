// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bigip-dns-gslb-simulator/compute.ts
// ----------------------------------------------------------------------------
// Deterministic simulator for BIG-IP DNS (formerly GTM) global server load
// balancing. Pure, offline. "Where are the next N DNS name-resolution requests
// resolved to?" GTM is TWO-TIER: a wide IP first selects a POOL, then the pool
// selects a MEMBER (a virtual server). This tool models both tiers.
//
// Verified 2026-07-19 against F5 techdocs / MyF5 (BIG-IP DNS Load Balancing) and
// the tmsh `gtm pool a` / `gtm wideip a` references:
//   - Tiered GSLB: request -> best available POOL in the wide IP -> best
//     available VIRTUAL SERVER in that pool. (techdocs "Global Server LB".)
//   - Pools are selected in the order listed in the wide IP. (techdocs.)
//   - Wide-IP methods that apply to pool selection: Round Robin, Ratio
//     (weighted per pool), Global Availability (first available in list order),
//     Topology (proximity via topology records). (techdocs; tmsh wideip a.)
//   - Pool methods select a member with the same static set, plus a three-tier
//     Preferred -> Alternate -> Fallback fallthrough. Alternate must be static.
//     (BIG-IP GTM Load Balancing 11.6; tmsh gtm pool a alternate-mode.)
//   - Global Availability: the first available resource in the list; only when
//     it becomes unavailable does the next receive requests. (techdocs.)
//   - Round Robin: circular/sequential, equal over time. (techdocs.)
//   - Ratio: weighted round robin by assigned ratio. (techdocs.)
//   - Topology: highest topology-record score wins; ties within the winning
//     set round-robin. (techdocs "Using Topology Load Balancing".) This tool
//     models topology with an explicit per-resource region + a client region,
//     scoring an exact region match highest, so the decision is deterministic.
//   - Dynamic methods (QoS, completion-rate, RTT, fewest-hops, kbps,
//     packet-rate, VS-score, least-connections, CPU) depend on live big3d
//     metrics, so they are NOT deterministically simulable - the tool says so
//     rather than inventing numbers. (techdocs QoS equation; same honesty rule
//     as the LTM simulator.)
//
// Modeling notes:
//   - A pool/member is "available" when marked up (the tool's `up` flag).
//   - Global Availability at the wide-IP tier sends ALL requests to the first
//     up pool (the rest are pure backups); at the pool tier it sends all to the
//     first up member.
//   - Topology uses a single client region for the whole request batch (one
//     LDNS location), matching how a demo is reasoned about.
// ============================================================================

// -- Methods -----------------------------------------------------------------
export type GslbMethod =
  | "round-robin"
  | "ratio"
  | "global-availability"
  | "topology"
  // dynamic / metric-bound (exposed, not simulable):
  | "qos"
  | "completion-rate"
  | "lowest-round-trip-time"
  | "fewest-hops"
  | "kilobytes-per-second"
  | "packet-rate"
  | "virtual-server-score"
  | "least-connections"
  | "cpu";

export const SIMULABLE_METHODS: GslbMethod[] = ["round-robin", "ratio", "global-availability", "topology"];
export const DYNAMIC_METHODS: GslbMethod[] = ["qos", "completion-rate", "lowest-round-trip-time", "fewest-hops", "kilobytes-per-second", "packet-rate", "virtual-server-score", "least-connections", "cpu"];

// -- Model -------------------------------------------------------------------
export interface Member {
  id: string;        // virtual server label (e.g. "vs-sfo-1")
  ratio: number;     // member ratio (>= 1), used by pool Ratio method
  region: string;    // datacenter region tag (e.g. "na-west"), used by Topology
  up: boolean;       // availability
}

export interface Pool {
  id: string;        // pool label (e.g. "pool-americas")
  ratio: number;     // pool ratio (>= 1), used by wide-IP Ratio method
  region: string;    // pool region tag, used by wide-IP Topology
  up: boolean;       // availability (a pool is up if it can answer)
  method: GslbMethod;   // the pool's PREFERRED member-selection method
  members: Member[];
}

export interface GslbInput {
  poolMethod: GslbMethod;   // the wide IP's pool-selection method
  clientRegion: string;     // the LDNS/client region, for Topology
  requests: number;         // N
  pools: Pool[];
}

export interface MemberResult {
  poolId: string;
  memberId: string;
  region: string;
  count: number;
  pct: number;
  up: boolean;
}

export interface PoolResult {
  poolId: string;
  count: number;         // requests routed to this pool
  pct: number;
  up: boolean;
  memberSimulable: boolean;
  memberReason?: string; // if the pool's own method is dynamic
}

export interface GslbResult {
  ok: boolean;
  error?: string;
  simulable: boolean;        // is the WIDE-IP (pool) method simulable?
  reasonCode?: string;       // wide-IP method reason if not simulable
  poolMethod: GslbMethod;
  clientRegion: string;
  requests: number;
  poolDistribution: PoolResult[];
  memberDistribution: MemberResult[];
  notes: string[];
}

const MAX_POOLS = 30;
const MAX_MEMBERS_PER_POOL = 50;
const MAX_REQUESTS = 100000;

// -- Helpers -----------------------------------------------------------------

/** Weighted round robin: distribute n across weights as evenly + proportionally
 *  as possible, deterministic (largest-remainder on cumulative shares). */
function weightedRoundRobin(weights: number[], n: number): number[] {
  const out = weights.map(() => 0);
  if (weights.length === 0 || n <= 0) return out;
  const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) {
    // fall back to even round robin
    for (let k = 0; k < n; k++) out[k % weights.length]++;
    return out;
  }
  // Largest remainder: floor the ideal shares, then hand out the remainder to
  // the largest fractional parts (ties by index) for a stable result.
  const ideal = weights.map((w) => (Math.max(0, w) / total) * n);
  const floors = ideal.map((x) => Math.floor(x));
  let assigned = floors.reduce((a, b) => a + b, 0);
  const remainders = ideal.map((x, i) => ({ i, frac: x - Math.floor(x) }));
  remainders.sort((a, b) => b.frac - a.frac || a.i - b.i);
  let r = 0;
  while (assigned < n) {
    out[remainders[r % remainders.length].i]++;
    assigned++;
    r++;
  }
  for (let i = 0; i < weights.length; i++) out[i] += floors[i];
  return out;
}

/** Even round robin across a set of indices. */
function evenRoundRobin(count: number, n: number): number[] {
  const out = new Array(count).fill(0);
  for (let k = 0; k < n; k++) out[k % count]++;
  return out;
}

/** Topology score of a resource region vs the client region.
 *  Exact match = 10 (mirrors the techdocs example score), else 0. */
function topologyScore(resourceRegion: string, clientRegion: string): number {
  return resourceRegion && clientRegion && resourceRegion === clientRegion ? 10 : 0;
}

/** Distribute n requests across a set of "up" resources by a static method.
 *  Returns a count per resource index (aligned with `resources`), with only up
 *  resources receiving any. `weightOf`/`regionOf` read from the resource. */
function distributeStatic(
  method: GslbMethod,
  resources: { up: boolean; ratio: number; region: string }[],
  clientRegion: string,
  n: number,
): { counts: number[]; note?: string } {
  const counts = resources.map(() => 0);
  const upIdx = resources.map((_, i) => i).filter((i) => resources[i].up);
  if (upIdx.length === 0 || n <= 0) return { counts, note: upIdx.length === 0 ? "none-up" : undefined };

  switch (method) {
    case "round-robin": {
      const rr = evenRoundRobin(upIdx.length, n);
      upIdx.forEach((i, k) => (counts[i] = rr[k]));
      return { counts };
    }
    case "ratio": {
      const w = upIdx.map((i) => Math.max(1, resources[i].ratio));
      const rr = weightedRoundRobin(w, n);
      upIdx.forEach((i, k) => (counts[i] = rr[k]));
      return { counts };
    }
    case "global-availability": {
      // ALL requests to the first up resource (list order); rest are backups.
      counts[upIdx[0]] = n;
      return { counts, note: "global-availability" };
    }
    case "topology": {
      // Highest topology score wins; ties within the top score round-robin.
      const scores = upIdx.map((i) => topologyScore(resources[i].region, clientRegion));
      const best = Math.max(...scores);
      const winners = upIdx.filter((i, k) => scores[k] === best);
      if (best === 0) {
        // No region match: techdocs behavior falls through; we round-robin
        // across all up resources and flag that no record matched.
        const rr = evenRoundRobin(upIdx.length, n);
        upIdx.forEach((i, k) => (counts[i] = rr[k]));
        return { counts, note: "topology-nomatch" };
      }
      const rr = evenRoundRobin(winners.length, n);
      winners.forEach((i, k) => (counts[i] = rr[k]));
      return { counts, note: "topology-match" };
    }
    default:
      return { counts, note: "dynamic" };
  }
}

// -- Core --------------------------------------------------------------------
export function simulate(input: GslbInput): GslbResult {
  const base: GslbResult = {
    ok: false, simulable: false, poolMethod: input.poolMethod, clientRegion: input.clientRegion ?? "",
    requests: 0, poolDistribution: [], memberDistribution: [], notes: [],
  };

  const pools = Array.isArray(input.pools) ? input.pools : [];
  if (pools.length === 0) return { ...base, error: "Add at least one pool." };
  if (pools.length > MAX_POOLS) return { ...base, error: `Too many pools (max ${MAX_POOLS}).` };
  for (const p of pools) {
    if ((p.members?.length ?? 0) > MAX_MEMBERS_PER_POOL) return { ...base, error: `Pool "${p.id}" has too many members (max ${MAX_MEMBERS_PER_POOL}).` };
  }

  const n = Math.max(0, Math.min(Math.floor(input.requests || 0), MAX_REQUESTS));
  const notes: string[] = [];

  // Wide-IP tier: is the pool-selection method simulable?
  if (DYNAMIC_METHODS.includes(input.poolMethod)) {
    return { ...base, ok: true, simulable: false, reasonCode: input.poolMethod, requests: n };
  }

  // Distribute N requests across pools.
  const poolRes = distributeStatic(
    input.poolMethod,
    pools.map((p) => ({ up: p.up, ratio: p.ratio, region: p.region })),
    input.clientRegion ?? "",
    n,
  );
  if (poolRes.note) notes.push(`pool:${poolRes.note}`);

  const poolDistribution: PoolResult[] = [];
  const memberDistribution: MemberResult[] = [];

  pools.forEach((pool, pi) => {
    const poolCount = poolRes.counts[pi];
    const memberDynamic = DYNAMIC_METHODS.includes(pool.method);
    poolDistribution.push({
      poolId: pool.id,
      count: poolCount,
      pct: n > 0 ? (poolCount / n) * 100 : 0,
      up: pool.up,
      memberSimulable: !memberDynamic,
      memberReason: memberDynamic ? pool.method : undefined,
    });

    // Pool tier: distribute this pool's share across its members.
    const members = pool.members ?? [];
    if (poolCount > 0 && !memberDynamic && members.length > 0) {
      const memRes = distributeStatic(
        pool.method,
        members.map((m) => ({ up: m.up, ratio: m.ratio, region: m.region })),
        input.clientRegion ?? "",
        poolCount,
      );
      members.forEach((m, mi) => {
        memberDistribution.push({
          poolId: pool.id,
          memberId: m.id,
          region: m.region,
          count: memRes.counts[mi],
          pct: n > 0 ? (memRes.counts[mi] / n) * 100 : 0,
          up: m.up,
        });
      });
    } else {
      // Either no traffic to this pool, or its member method is dynamic:
      // still list the members (count 0) so the shape is visible.
      members.forEach((m) => {
        memberDistribution.push({ poolId: pool.id, memberId: m.id, region: m.region, count: 0, pct: 0, up: m.up });
      });
    }
  });

  return {
    ok: true,
    simulable: true,
    poolMethod: input.poolMethod,
    clientRegion: input.clientRegion ?? "",
    requests: n,
    poolDistribution,
    memberDistribution,
    notes,
  };
}

/** D-49 run entrypoint: JSON string of a GslbInput. */
export function run(input: string): GslbResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, simulable: false, poolMethod: "round-robin", clientRegion: "", requests: 0, poolDistribution: [], memberDistribution: [], notes: [], error: "Provide a JSON GslbInput: { poolMethod, clientRegion, requests, pools: [...] }." };
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  const rawPools = Array.isArray(p.pools) ? p.pools : [];
  const pools: Pool[] = rawPools
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((x, i) => {
      const rawMembers = Array.isArray(x.members) ? x.members : [];
      const members: Member[] = rawMembers
        .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
        .map((m, mi) => ({
          id: typeof m.id === "string" ? m.id : `vs-${i + 1}-${mi + 1}`,
          ratio: typeof m.ratio === "number" ? m.ratio : 1,
          region: typeof m.region === "string" ? m.region : "",
          up: typeof m.up === "boolean" ? m.up : true,
        }));
      return {
        id: typeof x.id === "string" ? x.id : `pool-${i + 1}`,
        ratio: typeof x.ratio === "number" ? x.ratio : 1,
        region: typeof x.region === "string" ? x.region : "",
        up: typeof x.up === "boolean" ? x.up : true,
        method: (typeof x.method === "string" ? x.method : "round-robin") as GslbMethod,
        members,
      };
    });
  return simulate({
    poolMethod: (typeof p.poolMethod === "string" ? p.poolMethod : "round-robin") as GslbMethod,
    clientRegion: typeof p.clientRegion === "string" ? p.clientRegion : "",
    requests: typeof p.requests === "number" ? p.requests : 0,
    pools,
  });
}
