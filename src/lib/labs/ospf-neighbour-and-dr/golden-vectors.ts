// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ospf-neighbour-and-dr/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the OSPF neighbour and DR lab (set 2026-10-26a). Each case
// was worked by hand from RFC 2328 (sections 7.3, 7.4, 9.4, 10.4, 10.5 and
// 10.6, read on 2026-10-26) before the model was run, and compared field by
// field: the final DR and BDR, every router's role, every pair's state, the
// counts, the stage account and the router the non-pre-emption note names.
// Among them: the five-router segment of the article (seven adjacencies, three
// pairs at 2-Way), the late high-priority router that stays a DROther, the DR's
// failure that hands the role to the BDR, a Router ID tie read as numbers
// (10.0.0.10 above 10.0.0.9), a Hello mismatch that leaves a lone self-elected
// DR, and an MTU mismatch that only touches would-be adjacencies. Reject
// vectors pin every stable error code. verifyVectors() runs them all;
// scripts/run-golden-vectors.mts runs it at prebuild.
// ============================================================================

import { compute, OspfError, ROUTER_NAMES, type OspfErrorCode, type OspfInput, type OspfResult, type OspfRouterInput } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "ospf-neighbour-and-dr/2026-10-26a";

/** The result reduced to comparable text and numbers. */
interface Summary {
  /** The DR's name, or "none". */
  dr: string;
  /** The BDR's name, or "none". */
  bdr: string;
  /** "R1:role R2:role ...". */
  roles: string;
  /** "R1-R2:state ...". */
  pairs: string;
  /** Full pairs. */
  full: number;
  /** 2-Way pairs. */
  twoWay: number;
  /** Stuck pairs. */
  stuck: number;
  /** Pairs that never meet. */
  noNeighbour: number;
  /** The router named by the non-pre-emption note, or "none". */
  top: string;
  /** The stages, one token each: up<order>[joined]{isolated}>DR/BDR, or fail[R]>DR/BDR; "!R3" marks an outranking joiner. */
  stages: string;
}

/** A row index as its name, or "none". */
function nm(i: number | null): string {
  // Null is spelled out.
  return i === null ? "none" : ROUTER_NAMES[i];
}

/** Reduce a result to its summary. */
function summarise(r: OspfResult): Summary {
  // Every field in its comparable form.
  return {
    dr: nm(r.dr),
    bdr: nm(r.bdr),
    roles: r.routers.map((x) => `${x.name}:${x.role}`).join(" "),
    pairs: r.pairs.map((p) => `${nm(p.a)}-${nm(p.b)}:${p.state}`).join(" "),
    full: r.full,
    twoWay: r.twoWay,
    stuck: r.stuck,
    noNeighbour: r.noNeighbour,
    top: nm(r.topNotDr),
    stages: r.stages
      .map((s) =>
        s.kind === "fail"
          ? `fail[${nm(s.failed)}]>${nm(s.drAfter)}/${nm(s.bdrAfter)}`
          : `up${s.order}[${s.joined.map(nm).join(",")}]{${s.isolated.map(nm).join(",")}}>${nm(s.drAfter)}/${nm(s.bdrAfter)}${s.outranked.map((o) => `!${nm(o)}`).join("")}`,
      )
      .join(" "),
  };
}

/** Five router rows from [priority, Router ID, order] triples (missing rows filled, unused). */
function rows(...r: [string, string, number][]): OspfRouterInput[] {
  // The given rows, then fillers up to five.
  const out = r.map(([priority, routerId, order]) => ({ priority, routerId, order }));
  // Fillers carry distinct IDs from a range no case uses, so they never clash.
  while (out.length < 5) out.push({ priority: "1", routerId: `198.51.100.${200 + out.length}`, order: 1 });
  // Five rows.
  return out;
}

/** An input with defaults for the switches. */
function inp(count: number, routers: OspfRouterInput[], extra: Partial<OspfInput> = {}): OspfInput {
  // No mismatch, no failure, unless the case says so.
  return { count, routers, mismatch: "none", odd: 0, drFails: false, ...extra };
}

/** The article's four-router LAN shape: R3 priority 10, R4 priority 0. */
const BASE = rows(["1", "192.0.2.1", 1], ["1", "192.0.2.2", 1], ["10", "192.0.2.3", 1], ["0", "192.0.2.4", 1]);
/** The same with R3 coming up second. */
const LATE = rows(["1", "192.0.2.1", 1], ["1", "192.0.2.2", 1], ["10", "192.0.2.3", 2], ["0", "192.0.2.4", 1]);

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: OspfInput;
  /** The summary fields that must match. */
  expect: Partial<Summary>;
}

/** A case the model must refuse. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range. */
  input: OspfInput;
  /** The code the refusal must carry. */
  code: OspfErrorCode;
  /** The row the refusal must name (-1: not about a row). */
  row: number;
}

/** The accept cases. */
export const OSPF_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: together, R3 (10) is DR, R2 beats R1 on Router ID for BDR, R4 (0) never stands; only R1-R4 stops at 2-Way.
  { id: "together", input: inp(4, BASE), expect: { dr: "R3", bdr: "R2", roles: "R1:drother R2:bdr R3:dr R4:ineligible", pairs: "R1-R2:full R1-R3:full R1-R4:two-way R2-R3:full R2-R4:full R3-R4:full", full: 5, twoWay: 1, top: "none", stages: "up1[R1,R2,R3,R4]{}>R3/R2" } },
  // The Example: R3 comes up second, accepts DR R2 and BDR R1, and stays a DROther; R3-R4 is the 2-Way pair.
  { id: "late-high-priority", input: inp(4, LATE), expect: { dr: "R2", bdr: "R1", roles: "R1:bdr R2:dr R3:drother R4:ineligible", pairs: "R1-R2:full R1-R3:full R1-R4:full R2-R3:full R2-R4:full R3-R4:two-way", full: 5, twoWay: 1, top: "R3", stages: "up1[R1,R2,R4]{}>R2/R1 up2[R3]{}>R2/R1!R3" } },
  // The Example, then DR R2 fails: BDR R1 becomes DR and only then is R3 chosen as BDR, not DR.
  { id: "late-then-dr-fails", input: inp(4, LATE, { drFails: true }), expect: { dr: "R1", bdr: "R3", roles: "R1:dr R2:down R3:bdr R4:ineligible", pairs: "R1-R3:full R1-R4:full R3-R4:full", full: 3, twoWay: 0, top: "R3", stages: "up1[R1,R2,R4]{}>R2/R1 up2[R3]{}>R2/R1!R3 fail[R2]>R1/R3" } },
  // Five eligible routers together: one DR, one BDR, three DROthers; 7 adjacencies and 3 pairs at 2-Way, as the article counts.
  { id: "five-together", input: inp(5, rows(["1", "192.0.2.1", 1], ["1", "192.0.2.2", 1], ["1", "192.0.2.3", 1], ["1", "192.0.2.4", 1], ["1", "192.0.2.5", 1])), expect: { dr: "R5", bdr: "R4", full: 7, twoWay: 3, pairs: "R1-R2:two-way R1-R3:two-way R1-R4:full R1-R5:full R2-R3:two-way R2-R4:full R2-R5:full R3-R4:full R3-R5:full R4-R5:full" } },
  // Equal priorities: the Router ID decides as a number, so 10.0.0.10 outranks 10.0.0.9 (a text comparison would not).
  { id: "router-id-numeric", input: inp(3, rows(["1", "10.0.0.9", 1], ["1", "10.0.0.10", 1], ["1", "10.0.0.2", 1])), expect: { dr: "R2", bdr: "R1", roles: "R1:bdr R2:dr R3:drother" } },
  // One at a time with rising priorities: the first is DR for good, the second fills the empty BDR seat; the DR's failure promotes it and the top router only reaches BDR.
  { id: "one-at-a-time", input: inp(5, rows(["10", "192.0.2.1", 1], ["20", "192.0.2.2", 2], ["30", "192.0.2.3", 3], ["40", "192.0.2.4", 4], ["50", "192.0.2.5", 5]), { drFails: true }), expect: { dr: "R2", bdr: "R5", roles: "R1:down R2:dr R3:drother R4:drother R5:bdr", top: "R5", stages: "up1[R1]{}>R1/none up2[R2]{}>R1/R2!R2 up3[R3]{}>R1/R2!R3 up4[R4]{}>R1/R2!R4 up5[R5]{}>R1/R2!R5 fail[R1]>R2/R5" } },
  // A lone eligible router first is DR with no BDR; a later router fills the BDR seat (BackupSeen: a DR declared, no BDR).
  { id: "fill-empty-bdr", input: inp(3, rows(["5", "10.0.0.1", 1], ["0", "10.0.0.2", 1], ["1", "10.0.0.3", 2])), expect: { dr: "R1", bdr: "R3", roles: "R1:dr R2:ineligible R3:bdr", full: 3, stages: "up1[R1,R2]{}>R1/none up2[R3]{}>R1/R3" } },
  // Every priority 0: no DR, no BDR, no adjacency on the segment; every pair stops at 2-Way.
  { id: "all-ineligible", input: inp(3, rows(["0", "192.0.2.1", 1], ["0", "192.0.2.2", 1], ["0", "192.0.2.3", 1])), expect: { dr: "none", bdr: "none", roles: "R1:ineligible R2:ineligible R3:ineligible", full: 0, twoWay: 3 } },
  // A HelloInterval mismatch on R3: its Hellos are dropped, it hears no one and elects itself; the others elect R2 and R1.
  { id: "hello-mismatch-would-be-dr", input: inp(4, BASE, { mismatch: "hello", odd: 2 }), expect: { dr: "R2", bdr: "R1", roles: "R1:bdr R2:dr R3:isolated-dr R4:ineligible", pairs: "R1-R2:full R1-R3:no-neighbour R1-R4:full R2-R3:no-neighbour R2-R4:full R3-R4:no-neighbour", noNeighbour: 3, stages: "up1[R1,R2,R4]{R3}>R2/R1" } },
  // An E-bit mismatch on R4, priority 0: no neighbours and, ineligible, not even a DR of its own.
  { id: "ebit-mismatch-ineligible", input: inp(4, BASE, { mismatch: "ebit", odd: 3 }), expect: { dr: "R3", bdr: "R2", roles: "R1:drother R2:bdr R3:dr R4:isolated-ineligible", full: 3, twoWay: 0, noNeighbour: 3 } },
  // An Area ID mismatch on the DROther R1 removes only R1.
  { id: "area-mismatch-drother", input: inp(4, BASE, { mismatch: "area", odd: 0 }), expect: { dr: "R3", bdr: "R2", roles: "R1:isolated-dr R2:bdr R3:dr R4:ineligible", full: 3, noNeighbour: 3 } },
  // An MTU mismatch on the DROther R1: its two would-be adjacencies stick in ExStart or Exchange; its 2-Way with R4 is untouched.
  { id: "mtu-on-drother", input: inp(4, BASE, { mismatch: "mtu", odd: 0 }), expect: { dr: "R3", bdr: "R2", pairs: "R1-R2:stuck R1-R3:stuck R1-R4:two-way R2-R3:full R2-R4:full R3-R4:full", full: 3, twoWay: 1, stuck: 2 } },
  // An MTU mismatch on the DR R3: the election stands (MTU is not in the Hello), and all three of its adjacencies stick.
  { id: "mtu-on-dr", input: inp(4, BASE, { mismatch: "mtu", odd: 2 }), expect: { dr: "R3", bdr: "R2", pairs: "R1-R2:full R1-R3:stuck R1-R4:two-way R2-R3:stuck R2-R4:full R3-R4:stuck", full: 2, stuck: 3 } },
]);

/** The reject cases. */
export const OSPF_REJECTS: readonly RejectVector[] = Object.freeze([
  // Priority is an 8-bit unsigned integer: 256 is out.
  { id: "priority-256", input: inp(3, rows(["256", "192.0.2.1", 1], ["1", "192.0.2.2", 1], ["1", "192.0.2.3", 1])), code: "bad-priority", row: 0 },
  // A negative priority is not a priority.
  { id: "priority-negative", input: inp(3, rows(["1", "192.0.2.1", 1], ["-1", "192.0.2.2", 1], ["1", "192.0.2.3", 1])), code: "bad-priority", row: 1 },
  // A Router ID must be four octets.
  { id: "router-id-short", input: inp(3, rows(["1", "192.0.2.1", 1], ["1", "192.0.2", 1], ["1", "192.0.2.3", 1])), code: "bad-router-id", row: 1 },
  // 0.0.0.0 is refused as a Router ID.
  { id: "router-id-zero", input: inp(3, rows(["1", "192.0.2.1", 1], ["1", "192.0.2.2", 1], ["1", "0.0.0.0", 1])), code: "bad-router-id", row: 2 },
  // Two routers with one Router ID.
  { id: "router-id-duplicate", input: inp(3, rows(["1", "192.0.2.1", 1], ["1", "192.0.2.2", 1], ["1", "192.0.2.1", 1])), code: "duplicate-router-id", row: 2 },
  // A router count the control cannot send.
  { id: "count-six", input: inp(6, rows(["1", "192.0.2.1", 1], ["1", "192.0.2.2", 1], ["1", "192.0.2.3", 1])), code: "bad-choice", row: -1 },
  // A mismatch on a router not in play.
  { id: "odd-out-of-range", input: inp(3, BASE, { mismatch: "mtu", odd: 4 }), code: "bad-choice", row: -1 },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute, summarise and compare every expected field.
  for (const v of OSPF_VECTORS) {
    // The model's answer, summarised.
    const got = summarise(compute(v.input));
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof Summary];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code and row.
  for (const r of OSPF_REJECTS) {
    // The code and row it threw with, or null when it did not throw.
    let got: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code and a row; anything else is reported as such.
      got = e instanceof OspfError ? `${e.code}@${e.row}` : `unexpected ${String(e)}`;
    }
    // Wrong code, wrong row or no refusal is a failure.
    if (got !== `${r.code}@${r.row}`) failures.push(`${r.id}: refused with ${String(got)}, expected ${r.code}@${r.row}`);
  }
  // The report in the shape the runner reads.
  const total = OSPF_VECTORS.length + OSPF_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
