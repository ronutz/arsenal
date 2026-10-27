// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ospf-neighbour-and-dr/compute.ts
// ----------------------------------------------------------------------------
// THE OSPF NEIGHBOUR AND DR LAB'S MODEL (2026-10-26), the interactive companion
// of the article "OSPF: the map, the math, and area 0". Three to five routers,
// R1 to R5, share one broadcast segment (an Ethernet LAN) in one area. The
// reader gives each router its Router Priority, its Router ID and its place in
// the order in which the routers come up; can configure one Hello or MTU
// parameter differently on one router; and can make the elected DR fail once
// every router is up. The model says, stage by stage, who becomes DR and BDR,
// then which pairs of routers become adjacent (Full) and which stop at 2-Way.
//
// The rules, with their sources (RFC 2328, read again on 2026-10-26, and the
// article's own sentences with those sections):
//   1. Hello checks (sections 8.2 and 10.5): the Area ID, the AuType (per
//      interface, as verified erratum 3734 corrects section 8.2), the Network
//      Mask (on a broadcast network), HelloInterval, RouterDeadInterval and the
//      E-bit must match, or the Hello is dropped. The lab's router with such a
//      mismatch differs from all the others, so it never becomes anyone's
//      neighbour: it hears no one, and, as the only eligible router it knows,
//      it "will select itself as Designated Router and there will be no Backup
//      Designated Router" (section 9.4), unseen by the others.
//   2. Coming up (sections 9.1 to 9.3): an eligible router's interface waits
//      (state Waiting) until its Wait Timer, RouterDeadInterval long, fires or a
//      Hello shows a BDR, or a DR with no BDR (event BackupSeen). The lab takes
//      routers that share a place in the order to come up within one Wait Timer
//      of each other, so they elect together; each later place joins a segment
//      whose election has already settled, and whose DR and BDR its Hellos
//      already declare.
//   3. The election (section 9.4; appendix C.3 for priority and Router ID):
//      routers with priority 0 are ineligible. The BDR is the eligible router
//      with the highest priority, then the highest Router ID, among those
//      DECLARING themselves BDR (not DR), or among all not declaring DR when no
//      one declares BDR; the DR is the highest of those declaring DR, or the new
//      BDR when no one does; a router newly made DR or BDR repeats the steps.
//      So a declared DR and BDR keep their roles when a higher-priority router
//      joins (section 7.3: the newcomer "accepts that Designated Router,
//      regardless of its Router Priority"). The lab runs the calculation once
//      for the segment, as every router reaches the same answer from the same
//      Hellos.
//   4. A failed DR (sections 7.4 and 9.4): the BDR becomes DR, and only then is
//      a new BDR chosen from the routers that are left.
//   5. Adjacency (section 10.4): on a broadcast network a pair of neighbours
//      becomes adjacent (Full) when either of them is the DR or the BDR; any
//      other pair stops at 2-Way.
//   6. Interface MTU (section 10.6): a Database Description packet announcing
//      an MTU larger than the receiving interface accepts is rejected, so a
//      pair that tries to become adjacent across an MTU mismatch is stuck in
//      ExStart or Exchange; two DROthers never exchange DD packets ("used only
//      for the purpose of bringing up adjacencies"), so their 2-Way is
//      untouched.
// Router IDs must be unique (the article, citing FRRouting); the model refuses
// duplicates. What the model leaves out (the lab's scope note): timers and the
// time each step takes, NBMA and point-to-point networks, the network-LSA and
// flooding, a router that comes back after failing, several mismatches at once,
// authentication keys (only the type is compared) and vendor behaviour that
// departs from RFC 2328.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The most routers the lab offers. */
export const MAX_ROUTERS = 5;
/** The fewest routers the lab offers. */
export const MIN_ROUTERS = 3;
/** The routers' names, in table order. */
export const ROUTER_NAMES = ["R1", "R2", "R3", "R4", "R5"] as const;

/** A parameter configured differently on one router, or none. */
export type Mismatch = "none" | "area" | "auth" | "mask" | "hello" | "dead" | "ebit" | "mtu";
/** Every value the mismatch control can take. */
export const MISMATCHES: readonly Mismatch[] = ["none", "area", "auth", "mask", "hello", "dead", "ebit", "mtu"];
/** The mismatches that make Hellos be dropped (every one but the MTU). */
export const HELLO_MISMATCHES: readonly Mismatch[] = ["area", "auth", "mask", "hello", "dead", "ebit"];

/** One router as the reader sets it: text fields as typed, the order from a select. */
export interface OspfRouterInput {
  /** Router Priority, as typed (0 to 255). */
  priority: string;
  /** Router ID, as typed (dotted quad). */
  routerId: string;
  /** Its place in the order of coming up: 1 is first; equal places come up together. */
  order: number;
}

/** The reader's settings. */
export interface OspfInput {
  /** How many routers are on the segment (3 to 5); the first `count` rows are used. */
  count: number;
  /** All five rows; rows beyond `count` are ignored. */
  routers: OspfRouterInput[];
  /** The parameter configured differently on one router, or "none". */
  mismatch: Mismatch;
  /** Which router (0-based) carries the mismatch; ignored when there is none. */
  odd: number;
  /** True when the DR fails once every router is up. */
  drFails: boolean;
}

/** A router's final role. */
export type Role = "dr" | "bdr" | "drother" | "ineligible" | "isolated-dr" | "isolated-ineligible" | "down";

/** One stage of the account, in time order. */
export interface Stage {
  /** "up": routers come up; "fail": the DR fails. */
  kind: "up" | "fail";
  /** The place in the order (stages of kind "up"), else 0. */
  order: number;
  /** The routers (0-based) that join the segment's election in this stage. */
  joined: number[];
  /** The routers (0-based) that come up in this stage with a Hello mismatch, alone. */
  isolated: number[];
  /** The segment's DR before this stage, or null. */
  drBefore: number | null;
  /** The segment's BDR before this stage, or null. */
  bdrBefore: number | null;
  /** The segment's DR after this stage, or null. */
  drAfter: number | null;
  /** The segment's BDR after this stage, or null. */
  bdrAfter: number | null;
  /** Joiners that outrank the DR they had to accept (the election is not pre-emptive). */
  outranked: number[];
  /** The router that failed (stage "fail"), else null. */
  failed: number | null;
}

/** What two routers end up as. */
export type PairState = "full" | "two-way" | "stuck" | "no-neighbour";

/** One pair of routers that are both up at the end. */
export interface Pair {
  /** The lower-numbered router (0-based). */
  a: number;
  /** The higher-numbered router (0-based). */
  b: number;
  /** Their state. */
  state: PairState;
}

/** One router in the result. */
export interface RouterResult {
  /** Its name, R1 to R5. */
  name: string;
  /** Its priority. */
  priority: number;
  /** Its Router ID, normalised (no leading zeros). */
  routerId: string;
  /** Its place in the order. */
  order: number;
  /** Its final role. */
  role: Role;
}

/** The model's answer. */
export interface OspfResult {
  /** The routers in play, in table order. */
  routers: RouterResult[];
  /** The account, stage by stage. */
  stages: Stage[];
  /** The segment's DR at the end, or null. */
  dr: number | null;
  /** The segment's BDR at the end, or null. */
  bdr: number | null;
  /** Every pair of routers still up, in table order. */
  pairs: Pair[];
  /** How many pairs are Full. */
  full: number;
  /** How many pairs stop at 2-Way. */
  twoWay: number;
  /** How many pairs are stuck in ExStart or Exchange. */
  stuck: number;
  /** How many pairs never become neighbours. */
  noNeighbour: number;
  /** The eligible router still up that ranks highest (priority, then Router ID) but is not DR, or null. */
  topNotDr: number | null;
}

/** The stable codes an invalid input is refused with. */
export type OspfErrorCode = "bad-choice" | "bad-priority" | "bad-router-id" | "duplicate-router-id";

/** An invalid input, refused with a stable code and the row it concerns. */
export class OspfError extends Error {
  /** The stable code. */
  readonly code: OspfErrorCode;
  /** The row (0-based) the refusal concerns, or -1 when it is not about one row. */
  readonly row: number;
  /** Build the refusal with its code, its row and an English message for logs. */
  constructor(code: OspfErrorCode, row: number, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
    // The row, so the interface can mark the right input.
    this.row = row;
  }
}

/** A dotted-quad IPv4 address as a 32-bit number, or null if it is not one. */
export function dottedToNumber(text: string): number | null {
  // Four decimal parts, each one to three digits.
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text.trim());
  // Not the shape of an address.
  if (!m) return null;
  // The four octets.
  const parts = m.slice(1).map(Number);
  // Each octet must be 0 to 255.
  if (parts.some((p) => p > 255)) return null;
  // Combine without bitwise operators, which would turn the result negative.
  return parts.reduce((n, p) => n * 256 + p, 0);
}

/** A 32-bit number written back as a dotted quad. */
function numberToDotted(n: number): string {
  // The four octets, most significant first.
  return [Math.floor(n / 16777216) % 256, Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].join(".");
}

/** One router after parsing. */
interface Parsed {
  /** Its row (0-based). */
  i: number;
  /** Its priority. */
  priority: number;
  /** Its Router ID as a number. */
  rid: number;
  /** Its place in the order. */
  order: number;
}

/** Rank two routers for the election: higher priority first, then higher Router ID (section 9.4). */
function outranks(x: Parsed, y: Parsed): boolean {
  // Priority decides; on a tie, the Router ID.
  return x.priority > y.priority || (x.priority === y.priority && x.rid > y.rid);
}

/** The best-ranked router of a list, or null when it is empty. */
function best(list: Parsed[]): Parsed | null {
  // Keep the router that outranks every other.
  return list.reduce<Parsed | null>((top, r) => (top === null || outranks(r, top) ? r : top), null);
}

/**
 * The election of RFC 2328, section 9.4, run once for the segment.
 * `eligible` are the routers up with priority above 0; `declaredDr` and `declaredBdr` are the
 * roles the segment's Hellos already declare (null for none). Returns the settled DR and BDR.
 */
function elect(eligible: Parsed[], declaredDr: number | null, declaredBdr: number | null): { dr: number | null; bdr: number | null } {
  // The declarations, as the calculation goes on.
  let dDr = declaredDr;
  // A declared BDR that is also the declared DR does not count as declaring BDR.
  let dBdr = declaredBdr !== null && declaredBdr !== declaredDr ? declaredBdr : null;
  // Steps 2 and 3, repeated (step 4) until nothing changes; three rounds always suffice for one segment-wide view.
  for (let round = 0; round < 6; round++) {
    // The routers declaring DR, among those still eligible and up.
    const declaringDr = eligible.filter((r) => r.i === dDr);
    // Step 2: the BDR candidates are the routers not declaring DR.
    const candidates = eligible.filter((r) => r.i !== dDr);
    // Those among them declaring BDR take precedence.
    const declaringBdr = candidates.filter((r) => r.i === dBdr);
    // The new BDR: the best declaring BDR, else the best candidate.
    const bdr = best(declaringBdr.length ? declaringBdr : candidates);
    // Step 3: the new DR is the best declaring DR, else the new BDR.
    const dr = declaringDr.length ? best(declaringDr) : bdr;
    // The answer as row numbers.
    const drI = dr ? dr.i : null;
    // The BDR, unless it is the same router as the DR (that router then declares DR only, step 4).
    const bdrI = bdr && bdr.i !== drI ? bdr.i : null;
    // Settled: the same as the declarations the round started from.
    if (drI === dDr && bdrI === dBdr) return { dr: drI, bdr: bdrI };
    // Step 4: the routers now declare their new roles, and the steps run again.
    dDr = drI;
    // The BDR declaration follows.
    dBdr = bdrI;
  }
  // Never reached for one segment-wide view; returned for completeness.
  return { dr: dDr, bdr: dBdr };
}

/** Run the segment from the first router up to the last, then the DR's failure if asked. */
export function compute(input: OspfInput): OspfResult {
  // The router count must be one the control offers.
  if (!Number.isInteger(input.count) || input.count < MIN_ROUTERS || input.count > MAX_ROUTERS) throw new OspfError("bad-choice", -1, "router count out of range");
  // Five rows are always sent.
  if (!Array.isArray(input.routers) || input.routers.length < input.count) throw new OspfError("bad-choice", -1, "missing router rows");
  // The mismatch must be one the control offers.
  if (!MISMATCHES.includes(input.mismatch)) throw new OspfError("bad-choice", -1, "unknown mismatch");
  // The odd router must be one of the routers in play when a mismatch is set.
  if (input.mismatch !== "none" && (!Number.isInteger(input.odd) || input.odd < 0 || input.odd >= input.count)) throw new OspfError("bad-choice", -1, "mismatch on a router not in play");
  // The failure switch is a boolean.
  if (typeof input.drFails !== "boolean") throw new OspfError("bad-choice", -1, "drFails must be a boolean");

  // Parse each router in play.
  const parsed: Parsed[] = [];
  // Row by row.
  for (let i = 0; i < input.count; i++) {
    // The row as typed.
    const row = input.routers[i];
    // Priority: a whole number from 0 to 255, an 8-bit unsigned integer (appendix C.3).
    const pText = String(row.priority ?? "").trim();
    // Digits only, up to three.
    if (!/^\d{1,3}$/.test(pText) || Number(pText) > 255) throw new OspfError("bad-priority", i, `router ${i + 1}: priority must be 0 to 255`);
    // The Router ID as a number.
    const rid = dottedToNumber(String(row.routerId ?? ""));
    // A dotted quad, and not 0.0.0.0.
    if (rid === null || rid === 0) throw new OspfError("bad-router-id", i, `router ${i + 1}: Router ID must be a dotted quad other than 0.0.0.0`);
    // The order comes from a select: 1 to 5.
    if (!Number.isInteger(row.order) || row.order < 1 || row.order > MAX_ROUTERS) throw new OspfError("bad-choice", i, `router ${i + 1}: order out of range`);
    // A Router ID already used on the segment is refused.
    const dup = parsed.find((p) => p.rid === rid);
    // Unique Router IDs only (the article: duplicates break OSPF).
    if (dup) throw new OspfError("duplicate-router-id", i, `router ${i + 1}: Router ID already used by router ${dup.i + 1}`);
    // Keep the parsed row.
    parsed.push({ i, priority: Number(pText), rid, order: row.order });
  }

  // The router whose Hellos everyone drops, or -1.
  const isolatedRow = HELLO_MISMATCHES.includes(input.mismatch) ? input.odd : -1;
  // The router whose interface MTU differs, or -1.
  const mtuRow = input.mismatch === "mtu" ? input.odd : -1;
  // The distinct places in the order, earliest first.
  const places = [...new Set(parsed.map((p) => p.order))].sort((x, y) => x - y);

  // The segment as it grows: the routers up and taking part, the DR and the BDR.
  const up: Parsed[] = [];
  // The segment's DR (row), or null.
  let dr: number | null = null;
  // The segment's BDR (row), or null.
  let bdr: number | null = null;
  // The account.
  const stages: Stage[] = [];

  // Each place in the order is one stage.
  for (const place of places) {
    // The routers coming up now.
    const now = parsed.filter((p) => p.order === place);
    // Those that join the segment's Hello exchange.
    const joined = now.filter((p) => p.i !== isolatedRow);
    // Those whose Hellos are dropped.
    const isolated = now.filter((p) => p.i === isolatedRow);
    // The roles before.
    const drBefore = dr;
    // The BDR before.
    const bdrBefore = bdr;
    // The joiners take part from now on.
    up.push(...joined);
    // The election over every eligible router up, from the roles already declared.
    const res = elect(up.filter((p) => p.priority > 0), dr, bdr);
    // The new roles.
    dr = res.dr;
    // The new BDR.
    bdr = res.bdr;
    // The DR they found, if one was already declared.
    const sitting = drBefore === null ? null : parsed[drBefore];
    // Joiners that outrank that DR yet did not take its place.
    const outranked = sitting ? joined.filter((p) => p.priority > 0 && outranks(p, sitting) && dr !== p.i).map((p) => p.i) : [];
    // Record the stage.
    stages.push({ kind: "up", order: place, joined: joined.map((p) => p.i), isolated: isolated.map((p) => p.i), drBefore, bdrBefore, drAfter: dr, bdrAfter: bdr, outranked, failed: null });
  }

  // The router that failed, or null.
  let failed: number | null = null;
  // The DR fails once every router is up, if asked and if there is a DR.
  if (input.drFails && dr !== null) {
    // The roles before.
    const drBefore = dr;
    // The BDR before.
    const bdrBefore = bdr;
    // The DR leaves the segment.
    failed = dr;
    // Remove it from the routers up.
    up.splice(up.findIndex((p) => p.i === failed), 1);
    // Nobody declares DR any more; the BDR still declares BDR (section 9.4's orderly transition).
    const res = elect(up.filter((p) => p.priority > 0), null, bdr);
    // The new roles.
    dr = res.dr;
    // The new BDR.
    bdr = res.bdr;
    // Record the stage.
    stages.push({ kind: "fail", order: 0, joined: [], isolated: [], drBefore, bdrBefore, drAfter: dr, bdrAfter: bdr, outranked: [], failed });
  }

  /** A router's final role. */
  const roleOf = (p: Parsed): Role => {
    // The failed DR is down.
    if (p.i === failed) return "down";
    // The router nobody hears runs its own election, alone.
    if (p.i === isolatedRow) return p.priority > 0 ? "isolated-dr" : "isolated-ineligible";
    // The segment's DR.
    if (p.i === dr) return "dr";
    // The segment's BDR.
    if (p.i === bdr) return "bdr";
    // Everyone else is a DROther, eligible or not.
    return p.priority > 0 ? "drother" : "ineligible";
  };

  // Every pair of routers still up, in table order.
  const pairs: Pair[] = [];
  // The first router of the pair.
  for (const x of parsed) {
    // The second, after it in the table.
    for (const y of parsed) {
      // Each pair once, and never with the failed router.
      if (y.i <= x.i || x.i === failed || y.i === failed) continue;
      // A pair with the isolated router never becomes neighbours.
      if (x.i === isolatedRow || y.i === isolatedRow) {
        // Hellos dropped one way and the other.
        pairs.push({ a: x.i, b: y.i, state: "no-neighbour" });
        // Next pair.
        continue;
      }
      // Section 10.4: adjacent when either end is the DR or the BDR.
      const adjacent = [dr, bdr].includes(x.i) || [dr, bdr].includes(y.i);
      // An adjacency across an MTU mismatch never gets past the Database Description exchange.
      const state: PairState = !adjacent ? "two-way" : x.i === mtuRow || y.i === mtuRow ? "stuck" : "full";
      // Record the pair.
      pairs.push({ a: x.i, b: y.i, state });
    }
  }

  // The eligible routers still taking part in the segment's election.
  const contenders = parsed.filter((p) => p.priority > 0 && p.i !== failed && p.i !== isolatedRow);
  // The highest-ranked of them.
  const top = best(contenders);

  // The full answer.
  return {
    // The routers with their final roles.
    routers: parsed.map((p) => ({ name: ROUTER_NAMES[p.i], priority: p.priority, routerId: numberToDotted(p.rid), order: p.order, role: roleOf(p) })),
    // The account.
    stages,
    // The final DR.
    dr,
    // The final BDR.
    bdr,
    // The pairs.
    pairs,
    // The counts.
    full: pairs.filter((p) => p.state === "full").length,
    // Pairs at 2-Way.
    twoWay: pairs.filter((p) => p.state === "two-way").length,
    // Pairs stuck in ExStart or Exchange.
    stuck: pairs.filter((p) => p.state === "stuck").length,
    // Pairs that never meet.
    noNeighbour: pairs.filter((p) => p.state === "no-neighbour").length,
    // The top-ranked router that is not DR, for the non-pre-emption note.
    topNotDr: top && top.i !== dr ? top.i : null,
  };
}

/** One router row, for the two fixed states below. */
function row(priority: string, routerId: string, order: number): OspfRouterInput {
  // A plain object, in the input's shape.
  return { priority, routerId, order };
}

/** The opening state: four routers up together; R3, priority 10, is DR, R2 wins BDR on Router ID, R4 (priority 0) never stands. */
export const DEFAULT_INPUT: OspfInput = {
  count: 4,
  routers: [row("1", "192.0.2.1", 1), row("1", "192.0.2.2", 1), row("10", "192.0.2.3", 1), row("0", "192.0.2.4", 1), row("1", "192.0.2.5", 1)],
  mismatch: "none",
  odd: 0,
  drFails: false,
};

/** The Example: the same routers, but R3 comes up last and, priority 10 notwithstanding, stays a DROther. */
export const EXAMPLE_INPUT: OspfInput = {
  count: 4,
  routers: [row("1", "192.0.2.1", 1), row("1", "192.0.2.2", 1), row("10", "192.0.2.3", 2), row("0", "192.0.2.4", 1), row("1", "192.0.2.5", 1)],
  mismatch: "none",
  odd: 0,
  drFails: false,
};
