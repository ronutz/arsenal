// ============================================================================
// src/lib/tools/bigip-ltm-lb-simulator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: each simulable method with a hand-verifiable distribution,
// priority-group activation, a dynamic (non-simulable) method, and negatives.
// ============================================================================

import { simulate, run, type Member, type SimResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "bigip-ltm-lb-simulator/2026-07-11";

const m = (id: string, opts: Partial<Member> = {}): Member => ({ id, node: opts.node ?? id, ratio: opts.ratio ?? 1, nodeRatio: opts.nodeRatio ?? 1, priority: opts.priority ?? 0, persistence: opts.persistence ?? 0 });
const c = (r: SimResult, id: string) => r.distribution.find((d) => d.id === id)?.count;

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  // Round Robin: 3 members, N=9 -> even
  const rr = simulate({ members: [m("A"), m("B"), m("C")], method: "round-robin", minActiveMembers: 0, requests: 9 });
  ok("rr-even", c(rr, "A") === 3 && c(rr, "B") === 3 && c(rr, "C") === 3, JSON.stringify(rr.distribution));

  // Ratio (member) 3:2:1:1, N=7 (one full cycle = sum of ratios) -> exactly 3,2,1,1
  const rm = simulate({ members: [m("A", { ratio: 3 }), m("B", { ratio: 2 }), m("C", { ratio: 1 }), m("D", { ratio: 1 })], method: "ratio-member", minActiveMembers: 0, requests: 7 });
  ok("ratio-member", c(rm, "A") === 3 && c(rm, "B") === 2 && c(rm, "C") === 1 && c(rm, "D") === 1, JSON.stringify(rm.distribution));

  // Ratio (node) 3:1 with 2 members on node1, N=8 -> node1=6 (A3,B3), node2=2 (C2)
  const rn = simulate({ members: [m("A", { node: "n1", nodeRatio: 3 }), m("B", { node: "n1", nodeRatio: 3 }), m("C", { node: "n2", nodeRatio: 1 })], method: "ratio-node", minActiveMembers: 0, requests: 8 });
  ok("ratio-node", c(rn, "A") === 3 && c(rn, "B") === 3 && c(rn, "C") === 2, JSON.stringify(rn.distribution));

  // Least Connections (member) fresh, N=9 -> even
  const lc = simulate({ members: [m("A"), m("B"), m("C")], method: "least-conn-member", minActiveMembers: 0, requests: 9 });
  ok("least-conn-even", c(lc, "A") === 3 && c(lc, "B") === 3 && c(lc, "C") === 3, JSON.stringify(lc.distribution));
  ok("least-conn-note", lc.notes.includes("lc-fresh"), JSON.stringify(lc.notes));

  // Weighted Least Connections member, ratio 3:1, N=8 -> proportional (A6, B2)
  const wlc = simulate({ members: [m("A", { ratio: 3 }), m("B", { ratio: 1 })], method: "weighted-least-conn-member", minActiveMembers: 0, requests: 8 });
  ok("weighted-lc", c(wlc, "A") === 6 && c(wlc, "B") === 2, JSON.stringify(wlc.distribution));

  // Least Sessions: persistence [4,0,2], N=6 -> [0,4,2] (fills emptiest to balance)
  const ls = simulate({ members: [m("A", { persistence: 4 }), m("B", { persistence: 0 }), m("C", { persistence: 2 })], method: "least-sessions", minActiveMembers: 0, requests: 6 });
  ok("least-sessions", c(ls, "A") === 0 && c(ls, "B") === 4 && c(ls, "C") === 2, JSON.stringify(ls.distribution));
  ok("least-sessions-note", ls.notes.includes("cookie-fallback"), JSON.stringify(ls.notes));

  // Priority groups: A,B prio1; C prio0; threshold 2 -> active {A,B}, C standby
  const pg = simulate({ members: [m("A", { priority: 1 }), m("B", { priority: 1 }), m("C", { priority: 0 })], method: "round-robin", minActiveMembers: 2, requests: 4 });
  ok("pg-active", pg.activeIds.join(",") === "A,B" && pg.standbyIds.join(",") === "C", JSON.stringify([pg.activeIds, pg.standbyIds]));
  ok("pg-counts", c(pg, "A") === 2 && c(pg, "B") === 2 && c(pg, "C") === 0, JSON.stringify(pg.distribution));
  ok("pg-standby-note", pg.notes.includes("standby"), JSON.stringify(pg.notes));

  // Priority groups: threshold 3 forces the low group to activate -> all active
  const pg2 = simulate({ members: [m("A", { priority: 1 }), m("B", { priority: 1 }), m("C", { priority: 0 })], method: "round-robin", minActiveMembers: 3, requests: 3 });
  ok("pg-activate-low", pg2.activeIds.length === 3 && pg2.standbyIds.length === 0, JSON.stringify(pg2.activeIds));

  // Dynamic method: not simulable
  const dyn = simulate({ members: [m("A")], method: "observed", minActiveMembers: 0, requests: 10 });
  ok("dynamic-not-simulable", dyn.ok === true && dyn.simulable === false && dyn.reasonCode === "observed", JSON.stringify(dyn));

  // run() JSON + negatives
  const rj = run(JSON.stringify({ members: [{ id: "A" }, { id: "B" }], method: "round-robin", minActiveMembers: 0, requests: 4 }));
  ok("run-json", c(rj, "A") === 2 && c(rj, "B") === 2, JSON.stringify(rj.distribution));
  ok("no-members", simulate({ members: [], method: "round-robin", minActiveMembers: 0, requests: 4 }).ok === false, "empty members not rejected");
  ok("run-bad-json", run("{nope").ok === false, "bad json not rejected");
  ok("clamp", simulate({ members: [m("A")], method: "round-robin", minActiveMembers: 0, requests: 999999 }).requests === 100000, "N not clamped");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "rr-even", "ratio-member", "ratio-node", "least-conn-even", "least-conn-note", "weighted-lc", "least-sessions", "least-sessions-note",
  "pg-active", "pg-counts", "pg-standby-note", "pg-activate-low", "dynamic-not-simulable", "run-json", "no-members", "run-bad-json", "clamp",
];
