// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/bgp-best-path/compute.ts
// ----------------------------------------------------------------------------
// THE BGP BEST-PATH LAB'S MODEL (2026-10-26), the interactive companion of the
// article "BGP: how the internet decides where traffic goes". One router in
// AS 64496 holds two to four candidate paths, A to D, for one prefix. The
// reader edits each path's attributes and how it was learned, and picks a
// decision profile; the model applies the steps in order, removes paths step
// by step, and stops as soon as one path remains, naming the step that decided.
//
// Profile "rfc": RFC 4271, section 9.1 (read again on 2026-10-26), with route
// reflection's changes from RFC 4456, section 9:
//   0. A path whose NEXT_HOP is not resolvable is excluded, and so is a path
//      whose AS_PATH contains the local AS, 64496 (section 9.1.2).
//   1. Phase 1: the highest degree of preference. For a path from an internal
//      peer it is LOCAL_PREF; for one from an external peer it is computed by
//      import policy and becomes its LOCAL_PREF inside the AS (section 9.1.1),
//      so the lab takes the LOCAL_PREF field as the degree of preference.
//   Then the tie-breaks of section 9.1.2.2, "applied in the order specified",
//   until one route remains:
//   a. the fewest AS numbers in AS_PATH;
//   b. the lowest ORIGIN (IGP 0, EGP 1, INCOMPLETE 2);
//   c. the lowest MULTI_EXIT_DISC, compared only between routes from the same
//      neighbouring AS, read from the AS_PATH (its first AS; the local AS for a
//      route an internal peer originated, that is an empty AS_PATH); a route
//      without MED counts as the lowest value, 0;
//   d. eBGP-learned routes, if there are any;
//   e. the lowest interior cost to the NEXT_HOP;
//   f. the lowest BGP Identifier, compared as a four-octet unsigned integer
//      (RFC 6286, section 2.1); a reflected route's ORIGINATOR_ID stands in
//      for it (RFC 4456, section 9);
//   RFC 4456's inserted step: the shortest CLUSTER_LIST (0 when absent);
//   g. the lowest peer address.
// Profile "rfc5004": the same, plus RFC 5004, section 3 (Proposed Standard,
// optional per speaker): when the path selected before this run is external
// and is still in consideration at step f, and the steps from f on would
// choose another external path, the router keeps the existing path; not when
// both come from the same BGP Identifier.
// Profile "cisco" (vendor): Cisco's "Select BGP Best-path Algorithm" (document
// 13753, updated 28 April 2026, read on 2026-10-26): highest WEIGHT, a value
// local to the router; highest LOCAL_PREF; the RFC's AS_PATH, origin, MED
// (with "bgp deterministic-med", which groups paths by neighbouring AS before
// comparing MED: Cisco document 13759, updated 30 July 2026) and eBGP-over-
// iBGP steps; lowest IGP metric to the next hop; then, when both paths are
// external, the one received first, skipped when there is no current best path
// or when the router IDs are the same; the lowest router ID (the ORIGINATOR_ID
// for a reflected path); the shortest cluster list; the lowest neighbour
// address. Cisco documents the exclusion of an unreachable NEXT_HOP and of an
// eBGP path carrying the local AS. The lab takes the path selected before this
// run to have arrived first, and the others to have arrived in the order A, B,
// C, D.
//
// What the model leaves out (the lab's scope note): Cisco's step 3, paths the
// router originated itself, and its multipath step; always-compare-med and
// other knobs; confederations; AS_SET (deprecated by RFC 9774); import policy
// itself, including RFC 8212's rule that an eBGP route with no import policy
// is not eligible; several paths from one peer (add-path); other vendors'
// orders. Each step is applied to all remaining paths at once, where Cisco
// compares paths in pairs; with deterministic MED this gives the same answer
// except in rare cases involving step 10 and paths that share a router ID.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The lab router's own AS (documentation range, RFC 5398; the article's OBS). */
export const LOCAL_AS = 64496;
/** The largest four-octet unsigned value (LOCAL_PREF, MED, AS numbers, costs). */
export const MAX_U32 = 4294967295;

/** The decision profile. */
export type Profile = "rfc" | "rfc5004" | "cisco";
/** Every value the profile control can take. */
export const PROFILES: readonly Profile[] = ["rfc", "rfc5004", "cisco"];
/** How a path was learned. */
export type Learned = "ebgp" | "ibgp" | "ibgp-rr";
/** Every value the learned-from control can take. */
export const LEARNED: readonly Learned[] = ["ebgp", "ibgp", "ibgp-rr"];
/** The ORIGIN attribute. */
export type Origin = "igp" | "egp" | "incomplete";
/** Every ORIGIN, lowest (most preferred) first. */
export const ORIGINS: readonly Origin[] = ["igp", "egp", "incomplete"];
/** The paths' letters, in the order the lab lists them. */
export const LETTERS = ["A", "B", "C", "D"] as const;
/** One path's letter. */
export type Letter = (typeof LETTERS)[number];
/** The path selected before this run, or none. */
export type Previous = "none" | Letter;
/** The WEIGHT values the Cisco profile offers (a select: Cisco's range is not modelled). */
export const WEIGHTS: readonly string[] = ["0", "100", "200"];
/** The CLUSTER_LIST lengths the lab offers for a reflected path. */
export const CLUSTER_LENGTHS: readonly string[] = ["1", "2", "3"];
/** The most AS numbers an AS_PATH may hold in the lab. */
export const MAX_PATH_LENGTH = 20;

/** One candidate path as the reader sets it: typed fields as text. */
export interface PathInput {
  /** eBGP peer, iBGP peer, or iBGP peer reflecting the route. */
  learned: Learned;
  /** True when the NEXT_HOP resolves through the routing table. */
  resolvable: boolean;
  /** Cisco WEIGHT, from a select (used by the Cisco profile only). */
  weight: string;
  /** LOCAL_PREF (the degree of preference), as typed. */
  localPref: string;
  /** AS_PATH, AS numbers separated by spaces, as typed. */
  asPath: string;
  /** ORIGIN. */
  origin: Origin;
  /** MULTI_EXIT_DISC, as typed; empty means the attribute is absent. */
  med: string;
  /** Interior (IGP) cost to the NEXT_HOP, as typed. */
  igpCost: string;
  /** The advertising peer's BGP Identifier, as typed. */
  bgpId: string;
  /** The peer's address, as typed. */
  peer: string;
  /** ORIGINATOR_ID of a reflected path, as typed (ignored otherwise). */
  originatorId: string;
  /** CLUSTER_LIST length of a reflected path, from a select (ignored otherwise). */
  clusterLength: string;
}

/** The reader's settings. */
export interface BgpInput {
  /** The decision profile. */
  profile: Profile;
  /** How many paths are in play (2 to 4): the first `count` of `paths`. */
  count: number;
  /** The path selected before this run, or "none" (used by "rfc5004" and "cisco"). */
  previous: Previous;
  /** Four paths; those beyond `count` are ignored. */
  paths: PathInput[];
}

/** The steps, by id. */
export type StepId = "exclude" | "weight" | "pref" | "a" | "b" | "c" | "d" | "e" | "keep" | "f" | "cluster" | "g";

/** One path's value at one step. */
export interface StepValue {
  /** The path. */
  path: Letter;
  /** The value compared (a number, or text such as an address or "ebgp"). */
  value: number | string | null;
  /** Step f: true when the value is the ORIGINATOR_ID. */
  originator?: boolean;
}

/** One neighbouring AS's paths at step c. */
export interface MedGroup {
  /** The neighbouring AS. */
  as: number;
  /** Its paths and their MED (null: absent, counted as 0). */
  members: { path: Letter; med: number | null }[];
}

/** What the keep-the-existing-path step did. */
export type KeepOutcome = "applied" | "no-previous" | "not-in-contention" | "not-external" | "wins-anyway" | "same-id";

/** One step of the decision. */
export interface Step {
  /** Which step. */
  id: StepId;
  /** The paths in consideration when the step began. */
  considered: Letter[];
  /** The paths it removed. */
  removed: Letter[];
  /** Each considered path's value (empty for "exclude", "c" and "keep"). */
  values: StepValue[];
  /** Step c: the neighbouring-AS groups. */
  groups?: MedGroup[];
  /** Step "exclude": the excluded paths and why. */
  excluded?: { path: Letter; reason: "unresolvable" | "own-as" }[];
  /** Step "keep": the path the rule favours, what happened, and the path the later steps would choose. */
  keep?: { favoured: Letter | null; outcome: KeepOutcome; wouldBe: Letter | null };
}

/** One path's fate. */
export interface PathOutcome {
  /** The path. */
  path: Letter;
  /** Best, removed at a step, or excluded before phase 2. */
  status: "best" | "removed" | "excluded";
  /** The step that removed it (or "exclude"), null for the best path. */
  step: StepId | null;
  /** Its neighbouring AS (the first AS of its AS_PATH, or the local AS when empty). */
  neighbourAs: number;
  /** Its MED, or null when absent. */
  med: number | null;
}

/** The model's answer. */
export interface BgpResult {
  /** The steps applied, in order, up to the one that left one path. */
  steps: Step[];
  /** The best path, or null when every path was excluded. */
  best: Letter | null;
  /** The step that left one path ("exclude" when only one was eligible), or null. */
  decidedBy: StepId | null;
  /** Every path in play and its fate. */
  outcomes: PathOutcome[];
}

/** The stable codes an invalid input is refused with. */
export type BgpErrorCode =
  | "bad-choice"
  | "bad-local-pref"
  | "bad-as-path"
  | "ebgp-empty-path"
  | "bad-med"
  | "bad-cost"
  | "bad-id"
  | "bad-peer"
  | "bad-originator"
  | "duplicate-peer"
  | "cisco-own-as-ibgp";

/** An invalid input, refused with a stable code and the path it concerns. */
export class BgpError extends Error {
  /** The stable code. */
  readonly code: BgpErrorCode;
  /** The path (0-based) the refusal concerns, or -1. */
  readonly path: number;
  /** Build the refusal with its code, its path and an English message for logs. */
  constructor(code: BgpErrorCode, path: number, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
    // The path, so the interface can point at it.
    this.path = path;
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

/** A whole number from 0 to 2^32 - 1 typed as text, or null. */
function u32(text: string): number | null {
  // Digits only, at most ten of them (ReDoS-safe: a bounded, linear pattern).
  const s = text.trim();
  // Anything else is not a value.
  if (!/^\d{1,10}$/.test(s)) return null;
  // The value.
  const n = Number(s);
  // Within four octets.
  return n <= MAX_U32 ? n : null;
}

/** One path after parsing. */
interface Parsed {
  /** Its index (0-based). */
  i: number;
  /** Its letter. */
  letter: Letter;
  /** How it was learned. */
  learned: Learned;
  /** NEXT_HOP resolvable. */
  resolvable: boolean;
  /** WEIGHT (Cisco). */
  weight: number;
  /** LOCAL_PREF. */
  localPref: number;
  /** AS_PATH. */
  asPath: number[];
  /** ORIGIN as 0, 1 or 2. */
  origin: number;
  /** MED, or null when absent. */
  med: number | null;
  /** IGP cost to the NEXT_HOP. */
  igpCost: number;
  /** BGP Identifier of the advertising peer. */
  bgpId: number;
  /** Peer address. */
  peer: number;
  /** ORIGINATOR_ID, or null when not reflected. */
  originatorId: number | null;
  /** CLUSTER_LIST length (0 when not reflected). */
  clusterLength: number;
}

/** The neighbouring AS of a path: the first AS of its AS_PATH, or the local AS for an empty one (RFC 4271, 9.1.2.2 c). */
function neighbourAs(p: Parsed): number {
  // An empty AS_PATH: the route was originated inside the local AS.
  return p.asPath.length ? p.asPath[0] : LOCAL_AS;
}

/** The identifier step f compares: the ORIGINATOR_ID when present, the BGP Identifier otherwise (RFC 4456, 9). */
function stepFId(p: Parsed): number {
  // A reflected route carries the originator's identifier.
  return p.originatorId ?? p.bgpId;
}

/** Keep the paths with the extreme value of a key; return [kept, removed]. */
function keepExtreme(list: Parsed[], key: (p: Parsed) => number, highest: boolean): [Parsed[], Parsed[]] {
  // The values.
  const vals = list.map(key);
  // The winning value.
  const target = highest ? Math.max(...vals) : Math.min(...vals);
  // Those with it stay, the others go.
  return [list.filter((p) => key(p) === target), list.filter((p) => key(p) !== target)];
}

/** Steps f, the cluster step and g on a set: the path they would choose (used by the RFC 5004 check). */
function tailWinner(list: Parsed[]): Parsed {
  // f: lowest identifier.
  const [afterF] = keepExtreme(list, stepFId, false);
  // RFC 4456: shortest CLUSTER_LIST.
  const [afterCl] = keepExtreme(afterF, (p) => p.clusterLength, false);
  // g: lowest peer address (unique, so one remains).
  return keepExtreme(afterCl, (p) => p.peer, false)[0][0];
}

/** Validate and parse every path in play. */
function parse(input: BgpInput): Parsed[] {
  // The profile, the count and the previous path come from selects.
  if (!PROFILES.includes(input.profile)) throw new BgpError("bad-choice", -1, "unknown profile");
  // Two to four paths.
  if (!Number.isInteger(input.count) || input.count < 2 || input.count > 4 || !Array.isArray(input.paths) || input.paths.length < input.count) throw new BgpError("bad-choice", -1, "path count out of range");
  // The previous path is none or one of the paths in play.
  if (input.previous !== "none" && !LETTERS.slice(0, input.count).includes(input.previous as Letter)) throw new BgpError("bad-choice", -1, "previous path not in play");
  // The parsed paths.
  const out: Parsed[] = [];
  // Each path in play.
  for (let i = 0; i < input.count; i++) {
    // As typed.
    const p = input.paths[i];
    // Selects: learned, origin, weight, resolvable.
    if (!LEARNED.includes(p.learned) || !ORIGINS.includes(p.origin) || !WEIGHTS.includes(p.weight) || typeof p.resolvable !== "boolean") throw new BgpError("bad-choice", i, "unknown select value");
    // LOCAL_PREF: four octets.
    const localPref = u32(String(p.localPref ?? ""));
    // Refused when not a whole number in range.
    if (localPref === null) throw new BgpError("bad-local-pref", i, "LOCAL_PREF must be 0 to 4294967295");
    // AS_PATH: AS numbers separated by spaces.
    const tokens = String(p.asPath ?? "").trim().split(/\s+/).filter((s) => s.length > 0);
    // Each a four-octet AS number other than 0 (RFC 7607: AS 0 never appears in a path).
    const asPath = tokens.map(u32);
    // Too long, or a token that is not a valid AS number.
    if (tokens.length > MAX_PATH_LENGTH || asPath.some((n) => n === null || n === 0)) throw new BgpError("bad-as-path", i, "AS_PATH must be AS numbers 1 to 4294967295 separated by spaces");
    // An eBGP peer always puts its own AS in front (RFC 4271, 5.1.2), so an eBGP path is never empty.
    if (p.learned === "ebgp" && asPath.length === 0) throw new BgpError("ebgp-empty-path", i, "an eBGP path carries at least the neighbour's AS");
    // MED: empty for absent, else four octets.
    const medText = String(p.med ?? "").trim();
    // Parse when present.
    const med = medText === "" ? null : u32(medText);
    // Present but not a value.
    if (medText !== "" && med === null) throw new BgpError("bad-med", i, "MED must be empty or 0 to 4294967295");
    // IGP cost.
    const igpCost = u32(String(p.igpCost ?? ""));
    // Refused when not a whole number in range.
    if (igpCost === null) throw new BgpError("bad-cost", i, "IGP cost must be 0 to 4294967295");
    // BGP Identifier: a non-zero four-octet value (RFC 6286, 2.1), written as a dotted quad.
    const bgpId = dottedToNumber(String(p.bgpId ?? ""));
    // Refused when missing or zero.
    if (bgpId === null || bgpId === 0) throw new BgpError("bad-id", i, "BGP Identifier must be a non-zero dotted quad");
    // Peer address.
    const peer = dottedToNumber(String(p.peer ?? ""));
    // Refused when missing or zero.
    if (peer === null || peer === 0) throw new BgpError("bad-peer", i, "peer address must be a dotted quad other than 0.0.0.0");
    // Reflected paths carry ORIGINATOR_ID and a CLUSTER_LIST.
    const reflected = p.learned === "ibgp-rr";
    // ORIGINATOR_ID, when reflected.
    const originatorId = reflected ? dottedToNumber(String(p.originatorId ?? "")) : null;
    // Refused when reflected and missing or zero.
    if (reflected && (originatorId === null || originatorId === 0)) throw new BgpError("bad-originator", i, "ORIGINATOR_ID must be a non-zero dotted quad");
    // CLUSTER_LIST length, when reflected.
    if (reflected && !CLUSTER_LENGTHS.includes(p.clusterLength)) throw new BgpError("bad-choice", i, "unknown CLUSTER_LIST length");
    // A second path from the same peer address.
    const dup = out.find((q) => q.peer === peer);
    // Each path comes from its own peer.
    if (dup) throw new BgpError("duplicate-peer", i, `peer address already used by path ${dup.letter}`);
    // Cisco documents the local-AS exclusion for eBGP paths only; the lab does not guess at an iBGP one.
    if (input.profile === "cisco" && p.learned !== "ebgp" && asPath.includes(LOCAL_AS)) throw new BgpError("cisco-own-as-ibgp", i, "Cisco's document covers the local AS in eBGP paths only");
    // Keep the parsed path.
    out.push({
      i,
      letter: LETTERS[i],
      learned: p.learned,
      resolvable: p.resolvable,
      weight: Number(p.weight),
      localPref,
      asPath: asPath as number[],
      origin: ORIGINS.indexOf(p.origin),
      med,
      igpCost,
      bgpId,
      peer,
      originatorId,
      clusterLength: reflected ? Number(p.clusterLength) : 0,
    });
  }
  // Every path in play, parsed.
  return out;
}

/** Run the decision for the profile chosen. */
export function compute(input: BgpInput): BgpResult {
  // Validate and parse.
  const paths = parse(input);
  // The steps applied so far.
  const steps: Step[] = [];
  // Each path's fate, filled as paths go.
  const fate = new Map<Letter, { status: PathOutcome["status"]; step: StepId | null }>();
  /** The letters of a list. */
  const letters = (list: Parsed[]): Letter[] => list.map((p) => p.letter);

  // Step 0: exclusions before phase 2.
  const excluded: { path: Letter; reason: "unresolvable" | "own-as" }[] = [];
  // Each path in play.
  for (const p of paths) {
    // An unresolvable NEXT_HOP excludes the path (RFC 4271, 9.1.2; Cisco 13753).
    if (!p.resolvable) excluded.push({ path: p.letter, reason: "unresolvable" });
    // The local AS in the AS_PATH is a loop (RFC 4271, 9.1.2; Cisco 13753 for eBGP paths).
    else if (p.asPath.includes(LOCAL_AS)) excluded.push({ path: p.letter, reason: "own-as" });
  }
  // The paths left for phase 2.
  let live = paths.filter((p) => !excluded.some((x) => x.path === p.letter));
  // Record the exclusion step.
  steps.push({ id: "exclude", considered: letters(paths), removed: excluded.map((x) => x.path), values: [], excluded });
  // Their fate.
  for (const x of excluded) fate.set(x.path, { status: "excluded", step: "exclude" });

  // The step that left one path.
  let decidedBy: StepId | null = live.length === 1 ? "exclude" : null;

  /** Apply a keep-the-extreme step and record it. */
  const extremeStep = (id: StepId, key: (p: Parsed) => number, highest: boolean, show: (p: Parsed) => number | string | null = key) => {
    // Before the step.
    const considered = letters(live);
    // The values compared.
    const values: StepValue[] = live.map((p) => ({ path: p.letter, value: show(p), originator: id === "f" ? p.originatorId !== null : undefined }));
    // Kept and removed.
    const [kept, removed] = keepExtreme(live, key, highest);
    // Record the step.
    steps.push({ id, considered, removed: letters(removed), values });
    // Their fate.
    for (const p of removed) fate.set(p.letter, { status: "removed", step: id });
    // The new live set.
    live = kept;
  };

  /** Step c: MED within each neighbouring AS (RFC 4271, 9.1.2.2 c; Cisco with deterministic MED). */
  const medStep = () => {
    // Before the step.
    const considered = letters(live);
    // The neighbouring ASes, in the order their first path appears.
    const ases = [...new Set(live.map(neighbourAs))];
    // One group per AS.
    const groups: MedGroup[] = ases.map((as) => ({ as, members: live.filter((p) => neighbourAs(p) === as).map((p) => ({ path: p.letter, med: p.med })) }));
    // A route m goes when a route n from the same neighbouring AS has a lower MED (absent counts as 0).
    const removed = live.filter((m) => live.some((n) => neighbourAs(n) === neighbourAs(m) && (n.med ?? 0) < (m.med ?? 0)));
    // Record the step.
    steps.push({ id: "c", considered, removed: letters(removed), values: [], groups });
    // Their fate.
    for (const p of removed) fate.set(p.letter, { status: "removed", step: "c" });
    // The new live set.
    live = live.filter((p) => !removed.includes(p));
  };

  /** The keep step: RFC 5004 (profile "rfc5004") or Cisco's oldest external path (profile "cisco"). */
  const keepStep = () => {
    // Before the step.
    const considered = letters(live);
    // The path selected before, if any.
    const prev = input.previous === "none" ? null : live.find((p) => p.letter === input.previous) ?? null;
    /** Record a skipped keep step. */
    const skip = (outcome: KeepOutcome, favoured: Letter | null, wouldBe: Letter | null) => steps.push({ id: "keep", considered, removed: [], values: [], keep: { favoured, outcome, wouldBe } });
    // No current best path: the rule has nothing to keep (RFC 5004) or is skipped (Cisco).
    if (input.previous === "none") return skip("no-previous", null, null);
    // Every live path is external here, or none is (step d already ran).
    const external = live.every((p) => p.learned === "ebgp");
    // RFC 5004: the existing best path against the path steps f on would choose.
    if (input.profile === "rfc5004") {
      // The existing path is no longer in consideration.
      if (!prev) return skip("not-in-contention", input.previous as Letter, null);
      // Both paths must be external.
      if (!external) return skip("not-external", prev.letter, null);
      // The path the later steps would choose.
      const w = tailWinner(live);
      // It is the existing path anyway: nothing to keep.
      if (w.letter === prev.letter) return skip("wins-anyway", prev.letter, w.letter);
      // Same BGP Identifier (parallel sessions): the rule is not applied.
      if (w.bgpId === prev.bgpId) return skip("same-id", prev.letter, w.letter);
      // Applied: keep the existing path, remove the others.
      const removed = live.filter((p) => p !== prev);
      // Record it.
      steps.push({ id: "keep", considered, removed: letters(removed), values: [], keep: { favoured: prev.letter, outcome: "applied", wouldBe: w.letter } });
      // Their fate.
      for (const p of removed) fate.set(p.letter, { status: "removed", step: "keep" });
      // Only the existing path remains.
      live = [prev];
      // Done.
      return;
    }
    // Cisco: only when both paths are external.
    if (!external) return skip("not-external", null, null);
    // Arrival order: the path selected before first, then the others in letter order.
    const arrival = [input.previous as Letter, ...LETTERS.filter((l) => l !== input.previous)];
    // The oldest path still in consideration.
    const oldest = arrival.map((l) => live.find((p) => p.letter === l)).find((p) => p !== undefined) as Parsed;
    // Paths from the same router ID as the oldest are not compared on age.
    const kept = live.filter((p) => p === oldest || p.bgpId === oldest.bgpId);
    // Everyone shares the oldest's router ID: the step is skipped.
    if (kept.length === live.length) return skip("same-id", oldest.letter, null);
    // The others lose on age.
    const removed = live.filter((p) => !kept.includes(p));
    // Record it.
    steps.push({ id: "keep", considered, removed: letters(removed), values: [], keep: { favoured: oldest.letter, outcome: "applied", wouldBe: null } });
    // Their fate.
    for (const p of removed) fate.set(p.letter, { status: "removed", step: "keep" });
    // The new live set.
    live = kept;
  };

  // The order of steps for the profile.
  const order: StepId[] =
    input.profile === "cisco"
      ? ["weight", "pref", "a", "b", "c", "d", "e", "keep", "f", "cluster", "g"]
      : input.profile === "rfc5004"
        ? ["pref", "a", "b", "c", "d", "e", "keep", "f", "cluster", "g"]
        : ["pref", "a", "b", "c", "d", "e", "f", "cluster", "g"];

  // Apply them until one path remains ("The algorithm terminates as soon as only one route remains").
  for (const id of order) {
    // Stop when decided, or when nothing is left.
    if (live.length <= 1) break;
    // Each step by its rule.
    if (id === "weight") extremeStep("weight", (p) => p.weight, true);
    else if (id === "pref") extremeStep("pref", (p) => p.localPref, true);
    else if (id === "a") extremeStep("a", (p) => p.asPath.length, false);
    else if (id === "b") extremeStep("b", (p) => p.origin, false);
    else if (id === "c") medStep();
    else if (id === "d") extremeStep("d", (p) => (p.learned === "ebgp" ? 1 : 0), true, (p) => (p.learned === "ebgp" ? "ebgp" : "ibgp"));
    else if (id === "e") extremeStep("e", (p) => p.igpCost, false);
    else if (id === "keep") keepStep();
    else if (id === "f") extremeStep("f", stepFId, false, (p) => numberToDotted(stepFId(p)));
    else if (id === "cluster") extremeStep("cluster", (p) => p.clusterLength, false);
    else extremeStep("g", (p) => p.peer, false, (p) => numberToDotted(p.peer));
    // The step that left one path decides.
    if (live.length === 1 && decidedBy === null) decidedBy = id;
  }

  // The best path, if any.
  const best = live.length === 1 ? live[0].letter : null;
  // Its fate.
  if (best) fate.set(best, { status: "best", step: null });
  // Every path in play with its fate.
  const outcomes: PathOutcome[] = paths.map((p) => ({ path: p.letter, status: fate.get(p.letter)?.status ?? "removed", step: fate.get(p.letter)?.step ?? null, neighbourAs: neighbourAs(p), med: p.med }));
  // The full answer.
  return { steps, best, decidedBy: best ? decidedBy : null, outcomes };
}

/** One path, from its fields (a helper for the fixed states below and the vectors). */
export function path(
  learned: Learned,
  asPath: string,
  med: string,
  bgpId: string,
  peer: string,
  rest: Partial<Omit<PathInput, "learned" | "asPath" | "med" | "bgpId" | "peer">> = {},
): PathInput {
  // Defaults: resolvable, WEIGHT 0, LOCAL_PREF 100, ORIGIN IGP, cost 0, not reflected.
  return { learned, resolvable: true, weight: "0", localPref: "100", asPath, origin: "igp", med, igpCost: "0", bgpId, peer, originatorId: "", clusterLength: "1", ...rest };
}

/** A fourth path for both fixed states, there when the reader raises the count: reflected by a route reflector. */
const PATH_D = path("ibgp-rr", "64498 64499", "", "192.0.2.70", "192.0.2.70", { igpCost: "20", originatorId: "192.0.2.80" });

/** The opening state: the article's 192.0.2.128/25 case plus B1's longer path; A2's MED 10 beats A1's 50 within AS 64497. */
export const DEFAULT_INPUT: BgpInput = {
  profile: "rfc",
  count: 3,
  previous: "none",
  paths: [
    path("ebgp", "64497 64499", "50", "192.0.2.2", "192.0.2.2"),
    path("ebgp", "64497 64499", "10", "192.0.2.6", "192.0.2.6"),
    path("ebgp", "64498 64500 64499", "", "192.0.2.10", "192.0.2.10"),
    PATH_D,
  ],
};

/** The Example: an iBGP path's MED 0 removes A within AS 64497, then loses to B at step d; B wins with the highest MED of all. */
export const EXAMPLE_INPUT: BgpInput = {
  profile: "rfc",
  count: 3,
  previous: "none",
  paths: [
    path("ebgp", "64497 64499", "10", "192.0.2.2", "192.0.2.2"),
    path("ebgp", "64498 64499", "200", "192.0.2.10", "192.0.2.10"),
    path("ibgp", "64497 64499", "0", "192.0.2.66", "192.0.2.66", { igpCost: "10" }),
    PATH_D,
  ],
};
