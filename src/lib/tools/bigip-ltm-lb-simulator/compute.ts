// ============================================================================
// src/lib/tools/bigip-ltm-lb-simulator/compute.ts
// ----------------------------------------------------------------------------
// Deterministic simulator for BIG-IP LTM pool load balancing. Pure, offline.
// "Where are the next N requests load balanced to?" Given pool members (with a
// member ratio, a node + node ratio, a priority group, and existing
// persistence records / sessions), a load-balancing method, the priority-group
// activation threshold, and a request count N, it computes the per-member
// distribution of the next N new connections.
//
// Verified 2026-07-11 against F5's Pools reference (techdocs / MyF5) and the
// documented method definitions:
//   - Priority group activation: the minimum members that must remain
//     available in a group for traffic to stay confined to it (0 = disabled);
//     the next group activates when the active set falls below the threshold.
//   - Round Robin: next available member in sequence.
//   - Ratio (member / node): distribution proportional to the ratio weight.
//   - Least Connections (member / node): fewest active connections; ties round-
//     robin. Weighted Least Connections: weighted by ratio.
//   - Least Sessions: fewest persistence-table records for the member.
//   - Fastest / Observed / Predictive / Dynamic Ratio depend on live runtime
//     metrics (response time, per-second performance), so they are NOT
//     deterministically simulable - the tool says so instead of inventing them.
//
// Modeling note: the simulator takes one "existing load" per member, which
// represents persistence records / active sessions. Static methods ignore it;
// Least Sessions uses it as the starting metric. Least Connections is modeled
// from a fresh connection table (no current-connection input), so it starts
// even - stated openly in the tool.
// ============================================================================

export type Method =
  | "round-robin"
  | "ratio-member"
  | "ratio-node"
  | "least-conn-member"
  | "least-conn-node"
  | "weighted-least-conn-member"
  | "least-sessions"
  | "fastest"
  | "observed"
  | "predictive"
  | "dynamic-ratio";

export const SIMULABLE_METHODS: Method[] = ["round-robin", "ratio-member", "ratio-node", "least-conn-member", "least-conn-node", "weighted-least-conn-member", "least-sessions"];
export const DYNAMIC_METHODS: Method[] = ["fastest", "observed", "predictive", "dynamic-ratio"];

export interface Member {
  id: string;
  node: string;
  ratio: number; // member ratio (>= 1)
  nodeRatio: number; // node ratio (>= 1)
  priority: number; // priority group (higher = higher priority)
  persistence: number; // existing persistence records / sessions (>= 0)
}

export interface SimInput {
  members: Member[];
  method: Method;
  minActiveMembers: number; // priority group activation threshold (0 = disabled)
  requests: number; // N
}

export interface MemberResult {
  id: string;
  node: string;
  count: number;
  pct: number;
  active: boolean;
}

export interface SimResult {
  ok: boolean;
  error?: string;
  simulable: boolean;
  method: Method;
  reasonCode?: string; // for non-simulable methods
  requests: number;
  activeIds: string[];
  standbyIds: string[];
  distribution: MemberResult[];
  notes: string[];
}

const MAX_MEMBERS = 100;
const MAX_REQUESTS = 100000;

function argminIndex(vals: number[]): number {
  let best = 0;
  for (let i = 1; i < vals.length; i++) if (vals[i] < vals[best]) best = i;
  return best;
}
function argmaxIndex(vals: number[]): number {
  let best = 0;
  for (let i = 1; i < vals.length; i++) if (vals[i] > vals[best]) best = i;
  return best;
}

/** Smooth weighted round robin: N picks over items with given weights -> counts. */
function weightedRoundRobin(weights: number[], n: number): number[] {
  const eff = weights.map((w) => (w > 0 ? w : 1));
  const total = eff.reduce((a, b) => a + b, 0);
  const cur = eff.map(() => 0);
  const counts = eff.map(() => 0);
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < eff.length; i++) cur[i] += eff[i];
    const pick = argmaxIndex(cur);
    counts[pick]++;
    cur[pick] -= total;
  }
  return counts;
}

/** Distribute a per-node count evenly (round robin) across that node's members. */
function splitEven(count: number, memberCount: number): number[] {
  const base = Math.floor(count / memberCount);
  const rem = count % memberCount;
  return Array.from({ length: memberCount }, (_, i) => base + (i < rem ? 1 : 0));
}

/** Determine the active (eligible) members via priority group activation. */
function activeSet(members: Member[], threshold: number): Set<number> {
  const idx = members.map((_, i) => i);
  if (threshold <= 0) return new Set(idx); // disabled -> all active
  // group indices by priority, descending
  const byPriority = [...new Set(members.map((m) => m.priority))].sort((a, b) => b - a);
  const active = new Set<number>();
  for (const p of byPriority) {
    for (let i = 0; i < members.length; i++) if (members[i].priority === p) active.add(i);
    if (active.size >= threshold) break;
  }
  return active;
}

export function simulate(input: SimInput): SimResult {
  const base: SimResult = { ok: false, simulable: false, method: input.method, requests: 0, activeIds: [], standbyIds: [], distribution: [], notes: [] };

  const members = Array.isArray(input.members) ? input.members : [];
  if (members.length === 0) return { ...base, error: "Add at least one pool member." };
  if (members.length > MAX_MEMBERS) return { ...base, error: `Too many members (max ${MAX_MEMBERS}).` };

  const n = Math.max(0, Math.min(Math.floor(input.requests || 0), MAX_REQUESTS));
  const notes: string[] = [];

  // dynamic methods: not deterministically simulable
  if (DYNAMIC_METHODS.includes(input.method)) {
    return { ...base, ok: true, simulable: false, reasonCode: input.method, requests: n };
  }

  // priority group activation
  const active = activeSet(members, input.minActiveMembers);
  const activeIdx = members.map((_, i) => i).filter((i) => active.has(i));
  const activeIds = activeIdx.map((i) => members[i].id);
  const standbyIds = members.map((_, i) => i).filter((i) => !active.has(i)).map((i) => members[i].id);
  if (standbyIds.length > 0) notes.push("standby");

  // assign N requests among active members
  const counts = members.map(() => 0);

  const assignWRR = (weightOf: (m: Member) => number) => {
    const w = activeIdx.map((i) => weightOf(members[i]));
    const c = weightedRoundRobin(w, n);
    activeIdx.forEach((i, k) => (counts[i] = c[k]));
  };

  const assignLeastLoad = (startOf: (m: Member) => number, metricOf: (load: number, m: Member) => number) => {
    const load = activeIdx.map((i) => startOf(members[i]));
    for (let k = 0; k < n; k++) {
      const metrics = activeIdx.map((_, k2) => metricOf(load[k2], members[activeIdx[k2]]));
      const pick = argminIndex(metrics);
      load[pick]++;
      counts[activeIdx[pick]]++;
    }
  };

  switch (input.method) {
    case "round-robin": {
      for (let k = 0; k < n; k++) counts[activeIdx[k % activeIdx.length]]++;
      break;
    }
    case "ratio-member": {
      assignWRR((m) => m.ratio);
      break;
    }
    case "ratio-node": {
      // WRR over distinct active nodes by node ratio, then even split within node
      const nodes = [...new Set(activeIdx.map((i) => members[i].node))];
      const nodeWeights = nodes.map((nd) => {
        const first = activeIdx.map((i) => members[i]).find((m) => m.node === nd);
        return first ? first.nodeRatio : 1;
      });
      const nodeCounts = weightedRoundRobin(nodeWeights, n);
      nodes.forEach((nd, ni) => {
        const memIdx = activeIdx.filter((i) => members[i].node === nd);
        const split = splitEven(nodeCounts[ni], memIdx.length);
        memIdx.forEach((i, mi) => (counts[i] = split[mi]));
      });
      break;
    }
    case "least-conn-member": {
      // fresh connection table (no current-connection input) -> starts even
      assignLeastLoad(() => 0, (load) => load);
      notes.push("lc-fresh");
      break;
    }
    case "least-conn-node": {
      // node-level least connections from a fresh table, even split within node
      const nodes = [...new Set(activeIdx.map((i) => members[i].node))];
      const nodeLoad = nodes.map(() => 0);
      const nodeCounts = nodes.map(() => 0);
      for (let k = 0; k < n; k++) {
        const pick = argminIndex(nodeLoad);
        nodeLoad[pick]++;
        nodeCounts[pick]++;
      }
      nodes.forEach((nd, ni) => {
        const memIdx = activeIdx.filter((i) => members[i].node === nd);
        const split = splitEven(nodeCounts[ni], memIdx.length);
        memIdx.forEach((i, mi) => (counts[i] = split[mi]));
      });
      notes.push("lc-fresh");
      break;
    }
    case "weighted-least-conn-member": {
      // connections/ratio from a fresh table -> proportional to ratio
      assignLeastLoad(() => 0, (load, m) => load / (m.ratio > 0 ? m.ratio : 1));
      notes.push("lc-fresh");
      break;
    }
    case "least-sessions": {
      // starting metric = existing persistence records
      assignLeastLoad((m) => Math.max(0, m.persistence), (load) => load);
      notes.push("cookie-fallback");
      break;
    }
    default:
      return { ...base, error: "Unknown load-balancing method." };
  }

  const distribution: MemberResult[] = members.map((m, i) => ({
    id: m.id,
    node: m.node,
    count: counts[i],
    pct: n > 0 ? (counts[i] / n) * 100 : 0,
    active: active.has(i),
  }));

  return { ok: true, simulable: true, method: input.method, requests: n, activeIds, standbyIds, distribution, notes };
}

/** D-49 run entrypoint: JSON string of a SimInput. */
export function run(input: string): SimResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, simulable: false, method: "round-robin", requests: 0, activeIds: [], standbyIds: [], distribution: [], notes: [], error: "Provide a JSON SimInput: { members: [...], method, minActiveMembers, requests }." };
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  const rawMembers = Array.isArray(p.members) ? p.members : [];
  const members: Member[] = rawMembers
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((x, i) => ({
      id: typeof x.id === "string" ? x.id : `member-${i + 1}`,
      node: typeof x.node === "string" ? x.node : `node-${i + 1}`,
      ratio: typeof x.ratio === "number" ? x.ratio : 1,
      nodeRatio: typeof x.nodeRatio === "number" ? x.nodeRatio : 1,
      priority: typeof x.priority === "number" ? x.priority : 0,
      persistence: typeof x.persistence === "number" ? x.persistence : 0,
    }));
  return simulate({
    members,
    method: (typeof p.method === "string" ? p.method : "round-robin") as Method,
    minActiveMembers: typeof p.minActiveMembers === "number" ? p.minActiveMembers : 0,
    requests: typeof p.requests === "number" ? p.requests : 0,
  });
}
