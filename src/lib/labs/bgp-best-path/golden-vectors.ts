// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/bgp-best-path/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BGP best-path lab (set 2026-10-26a). Each case was
// worked by hand from RFC 4271 section 9.1, RFC 4456 section 9, RFC 5004
// section 3 and Cisco documents 13753 and 13759 (all read on 2026-10-26)
// before the model was run, and compared on the best path, the deciding step,
// the steps applied and every path's fate. Five reproduce the article's FRR
// lab table (AS_PATH, LOCAL_PREF, MED, the own-AS drop, and the peer-address
// tie-break FRR 8.4.4 resolved as the RFC says). Others pin the traps: an
// absent MED counting as 0, MED never compared across neighbouring ASes, eBGP
// before IGP cost, BGP Identifiers compared as numbers, the ORIGINATOR_ID and
// CLUSTER_LIST of reflection, RFC 5004's conditions and Cisco's WEIGHT and
// oldest-path steps. Reject vectors pin every stable error code.
// verifyVectors() runs them all; scripts/run-golden-vectors.mts runs it at
// prebuild.
// ============================================================================

import { BgpError, compute, path, type BgpErrorCode, type BgpInput, type BgpResult, type PathInput, type Previous, type Profile } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "bgp-best-path/2026-10-26a";

/** The result reduced to comparable text. */
interface Summary {
  /** The best path, or "none". */
  best: string;
  /** The deciding step, or "none". */
  by: string;
  /** The steps applied, by id, in order. */
  steps: string;
  /** "A:best B:removed@c C:excluded@exclude". */
  fates: string;
  /** The keep step's outcome and favoured path, or "none". */
  keep: string;
}

/** Reduce a result to its summary. */
function summarise(r: BgpResult): Summary {
  // The keep step, if one ran.
  const k = r.steps.find((s) => s.id === "keep")?.keep;
  // Every field in its comparable form.
  return {
    best: r.best ?? "none",
    by: r.decidedBy ?? "none",
    steps: r.steps.map((s) => s.id).join(" "),
    fates: r.outcomes.map((o) => `${o.path}:${o.status}${o.step ? `@${o.step}` : ""}`).join(" "),
    keep: k ? `${k.outcome}${k.favoured ? `:${k.favoured}` : ""}` : "none",
  };
}

/** A spare fourth path, never in play unless a case says so. */
const SPARE = path("ibgp", "64499", "", "198.51.100.250", "198.51.100.250");

/** An input from a profile, the previous path and two to four paths. */
function inp(profile: Profile, previous: Previous, ...paths: PathInput[]): BgpInput {
  // The paths in play, padded to four with distinct spares.
  const padded = [...paths];
  // Spares get distinct peer addresses so they never clash.
  while (padded.length < 4) padded.push({ ...SPARE, peer: `198.51.100.${240 + padded.length}`, bgpId: `198.51.100.${240 + padded.length}` });
  // The input.
  return { profile, count: paths.length, previous, paths: padded };
}

/** The article's A1, A2 and B1 (OBS's eBGP peers). */
const A1 = (rest: Partial<PathInput> = {}) => path("ebgp", "64497 64499", "", "192.0.2.2", "192.0.2.2", rest);
/** A2, the second link into AS 64497. */
const A2 = (rest: Partial<PathInput> = {}) => path("ebgp", "64497 64499", "", "192.0.2.6", "192.0.2.6", rest);
/** B1, in AS 64498, one AS longer. */
const B1 = (rest: Partial<PathInput> = {}) => path("ebgp", "64498 64500 64499", "", "192.0.2.10", "192.0.2.10", rest);

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: BgpInput;
  /** The summary fields that must match. */
  expect: Partial<Summary>;
}

/** A case the model must refuse. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range. */
  input: BgpInput;
  /** The code the refusal must carry. */
  code: BgpErrorCode;
  /** The path the refusal must name (-1: not about a path). */
  path: number;
}

/** The accept cases. */
export const BGP_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: C is one AS longer (step a); within AS 64497, B's MED 10 beats A's 50 (step c), FRR's "best (MED)".
  { id: "default-med", input: inp("rfc", "none", A1({ med: "50" }), A2({ med: "10" }), B1()), expect: { best: "B", by: "c", steps: "exclude pref a b c", fates: "A:removed@c B:best C:removed@a" } },
  // The Example: C's MED 0 (iBGP, from AS 64497) removes A at c; MED is never compared with AS 64498, so B (MED 200) survives and wins at d.
  { id: "example-med-then-ebgp", input: inp("rfc", "none", path("ebgp", "64497 64499", "10", "192.0.2.2", "192.0.2.2"), path("ebgp", "64498 64499", "200", "192.0.2.10", "192.0.2.10"), path("ibgp", "64497 64499", "0", "192.0.2.66", "192.0.2.66", { igpCost: "10" })), expect: { best: "B", by: "d", steps: "exclude pref a b c d", fates: "A:removed@c B:best C:removed@d" } },
  // The article's 198.51.100.0/24: the shorter AS_PATH wins at step a, FRR's "best (AS Path)".
  { id: "article-as-path", input: inp("rfc", "none", A1(), B1()), expect: { best: "A", by: "a", fates: "A:best B:removed@a" } },
  // The article's 203.0.113.0/24: LOCAL_PREF 200 on B1's longer path wins in phase 1, FRR's "best (Local Pref)".
  { id: "article-local-pref", input: inp("rfc", "none", A1(), B1({ localPref: "200" })), expect: { best: "B", by: "pref", steps: "exclude pref" } },
  // The article's 192.0.2.64/26: OBS's own AS in the path excludes it; with nothing else offered, there is no best path.
  { id: "article-own-as", input: inp("rfc", "none", path("ebgp", "64498 64496 64499", "", "192.0.2.10", "192.0.2.10"), path("ebgp", "64497 64499", "", "192.0.2.2", "192.0.2.2", { resolvable: false })), expect: { best: "none", by: "none", fates: "A:excluded@exclude B:excluded@exclude" } },
  // The article's second run: identical paths from two peers sharing BGP Identifier 192.0.2.77; the lower peer address wins at g (as FRR 8.4.4 did).
  { id: "article-peer-address", input: inp("rfc", "none", A2({ bgpId: "192.0.2.77" }), A1({ bgpId: "192.0.2.77" })), expect: { best: "B", by: "g", steps: "exclude pref a b c d e f cluster g", fates: "A:removed@g B:best" } },
  // Only one path survives the exclusions: it is best without a tie-break.
  { id: "only-eligible", input: inp("rfc", "none", A1({ resolvable: false }), B1()), expect: { best: "B", by: "exclude", steps: "exclude" } },
  // LOCAL_PREF comes before AS_PATH length: the longer path with the higher preference wins.
  { id: "pref-before-length", input: inp("rfc", "none", A1({ localPref: "100" }), B1({ localPref: "150" })), expect: { best: "B", by: "pref" } },
  // ORIGIN: IGP beats INCOMPLETE at step b.
  { id: "origin", input: inp("rfc", "none", A1({ origin: "incomplete" }), A2({ origin: "igp" })), expect: { best: "B", by: "b" } },
  // An absent MED counts as 0, the lowest value, and beats MED 5 from the same AS.
  { id: "missing-med-is-zero", input: inp("rfc", "none", A1(), A2({ med: "5" })), expect: { best: "A", by: "c" } },
  // MED is not compared across neighbouring ASes: MED 0 from 64497 does not remove MED 900 from 64498; the BGP Identifier decides.
  { id: "med-other-as", input: inp("rfc", "none", path("ebgp", "64497 64499", "0", "192.0.2.20", "192.0.2.20"), path("ebgp", "64498 64499", "900", "192.0.2.3", "192.0.2.3")), expect: { best: "B", by: "f", fates: "A:removed@f B:best" } },
  // Two routes originated inside the AS (empty AS_PATH, local AS as neighbour) compare MED with each other.
  { id: "internal-origin-med", input: inp("rfc", "none", path("ibgp", "", "50", "192.0.2.66", "192.0.2.66"), path("ibgp", "", "10", "192.0.2.67", "192.0.2.67")), expect: { best: "B", by: "c" } },
  // eBGP before IGP cost: the iBGP path's lower cost does not matter once an eBGP path is present.
  { id: "ebgp-before-cost", input: inp("rfc", "none", A1({ igpCost: "50" }), path("ibgp", "64498 64499", "", "192.0.2.66", "192.0.2.66", { igpCost: "1" })), expect: { best: "A", by: "d" } },
  // Two iBGP paths: the lower IGP cost to the NEXT_HOP wins at e.
  { id: "igp-cost", input: inp("rfc", "none", path("ibgp", "64497 64499", "", "192.0.2.66", "192.0.2.66", { igpCost: "20" }), path("ibgp", "64498 64499", "", "192.0.2.67", "192.0.2.67", { igpCost: "10" })), expect: { best: "B", by: "e" } },
  // BGP Identifiers compare as numbers: 192.0.2.9 is lower than 192.0.2.10.
  { id: "identifier-numeric", input: inp("rfc", "none", path("ebgp", "64497 64499", "", "192.0.2.10", "198.51.100.1"), path("ebgp", "64498 64499", "", "192.0.2.9", "198.51.100.2")), expect: { best: "B", by: "f" } },
  // Reflection: both reflected paths carry ORIGINATOR_ID 192.0.2.80, lower than C's identifier; the shorter CLUSTER_LIST then decides.
  { id: "reflection-originator-cluster", input: inp("rfc", "none", path("ibgp-rr", "64497 64499", "", "192.0.2.70", "192.0.2.70", { originatorId: "192.0.2.80", clusterLength: "2" }), path("ibgp-rr", "64497 64499", "", "192.0.2.71", "192.0.2.71", { originatorId: "192.0.2.80", clusterLength: "1" }), path("ibgp", "64497 64499", "", "192.0.2.90", "192.0.2.90")), expect: { best: "B", by: "cluster", fates: "A:removed@cluster B:best C:removed@f" } },
  // RFC 5004: B, selected before, is external and still in contention at f; f would pick A (lower identifier), so B is kept.
  { id: "rfc5004-applied", input: inp("rfc5004", "B", A1(), path("ebgp", "64498 64499", "", "192.0.2.10", "192.0.2.10")), expect: { best: "B", by: "keep", keep: "applied:B", fates: "A:removed@keep B:best" } },
  // RFC 5004 without a path selected before: the plain steps decide.
  { id: "rfc5004-no-previous", input: inp("rfc5004", "none", A1(), path("ebgp", "64498 64499", "", "192.0.2.10", "192.0.2.10")), expect: { best: "A", by: "f", keep: "no-previous" } },
  // RFC 5004 when the existing path already lost (at a): not in contention.
  { id: "rfc5004-not-in-contention", input: inp("rfc5004", "B", A1(), B1(), A2()), expect: { best: "A", by: "f", keep: "not-in-contention:B" } },
  // RFC 5004 when the existing path would win anyway.
  { id: "rfc5004-wins-anyway", input: inp("rfc5004", "A", A1(), path("ebgp", "64498 64499", "", "192.0.2.10", "192.0.2.10")), expect: { best: "A", by: "f", keep: "wins-anyway:A" } },
  // RFC 5004 is not applied between paths with the same BGP Identifier (parallel sessions): g decides.
  { id: "rfc5004-same-id", input: inp("rfc5004", "B", A1({ bgpId: "192.0.2.77" }), A2({ bgpId: "192.0.2.77" })), expect: { best: "A", by: "g", keep: "same-id:B" } },
  // RFC 5004 needs external paths: two iBGP paths go on to f.
  { id: "rfc5004-internal", input: inp("rfc5004", "B", path("ibgp", "64497 64499", "", "192.0.2.66", "192.0.2.66"), path("ibgp", "64498 64499", "", "192.0.2.67", "192.0.2.67")), expect: { best: "A", by: "f", keep: "not-external:B" } },
  // Cisco: WEIGHT comes first, ahead of LOCAL_PREF and AS_PATH.
  { id: "cisco-weight", input: inp("cisco", "none", A1(), B1({ weight: "100" }), path("ibgp", "64497 64499", "", "192.0.2.66", "192.0.2.66", { localPref: "200" })), expect: { best: "B", by: "weight", steps: "exclude weight" } },
  // Cisco: equal WEIGHT, so LOCAL_PREF decides as in the RFC.
  { id: "cisco-pref", input: inp("cisco", "none", A1(), B1({ localPref: "200" })), expect: { best: "B", by: "pref", steps: "exclude weight pref" } },
  // Cisco step 10: C, the current best and so the oldest, is kept against two newer external paths with lower router IDs.
  { id: "cisco-oldest", input: inp("cisco", "C", A1(), path("ebgp", "64498 64499", "", "192.0.2.10", "192.0.2.10"), path("ebgp", "64500 64499", "", "192.0.2.30", "192.0.2.30")), expect: { best: "C", by: "keep", keep: "applied:C" } },
  // Cisco step 10 with no current best path: skipped, the router ID decides.
  { id: "cisco-no-current-best", input: inp("cisco", "none", A1(), path("ebgp", "64498 64499", "", "192.0.2.10", "192.0.2.10")), expect: { best: "A", by: "f", keep: "no-previous" } },
  // Cisco step 10 when the current best already lost: the oldest left is the first in letter order.
  { id: "cisco-oldest-remaining", input: inp("cisco", "A", B1(), path("ebgp", "64497 64499", "", "192.0.2.40", "192.0.2.40"), path("ebgp", "64501 64499", "", "192.0.2.30", "192.0.2.30"), A1({ localPref: "50" })), expect: { best: "B", by: "keep", keep: "applied:B" } },
  // Cisco step 10 is skipped when the router IDs are the same: the neighbour address decides.
  { id: "cisco-same-router-id", input: inp("cisco", "B", A1({ bgpId: "192.0.2.77" }), A2({ bgpId: "192.0.2.77" })), expect: { best: "A", by: "g", keep: "same-id:B" } },
  // Cisco step 10 needs external paths.
  { id: "cisco-internal", input: inp("cisco", "B", path("ibgp", "64497 64499", "", "192.0.2.66", "192.0.2.66"), path("ibgp", "64498 64499", "", "192.0.2.67", "192.0.2.67")), expect: { best: "A", by: "f", keep: "not-external" } },
]);

/** The reject cases. */
export const BGP_REJECTS: readonly RejectVector[] = Object.freeze([
  // A profile the control cannot send.
  { id: "bad-profile", input: { ...inp("rfc", "none", A1(), B1()), profile: "juniper" as unknown as Profile }, code: "bad-choice", path: -1 },
  // A previous path that is not in play.
  { id: "previous-not-in-play", input: inp("rfc5004", "D", A1(), B1()), code: "bad-choice", path: -1 },
  // LOCAL_PREF above four octets.
  { id: "local-pref-overflow", input: inp("rfc", "none", A1({ localPref: "4294967296" }), B1()), code: "bad-local-pref", path: 0 },
  // AS 0 never appears in a path.
  { id: "as-path-zero", input: inp("rfc", "none", A1(), path("ebgp", "64498 0", "", "192.0.2.10", "192.0.2.10")), code: "bad-as-path", path: 1 },
  // Something other than AS numbers.
  { id: "as-path-text", input: inp("rfc", "none", path("ebgp", "64497 {64499}", "", "192.0.2.2", "192.0.2.2"), B1()), code: "bad-as-path", path: 0 },
  // An eBGP path is never empty.
  { id: "ebgp-empty", input: inp("rfc", "none", path("ebgp", "", "", "192.0.2.2", "192.0.2.2"), B1()), code: "ebgp-empty-path", path: 0 },
  // A negative MED.
  { id: "med-negative", input: inp("rfc", "none", A1({ med: "-1" }), B1()), code: "bad-med", path: 0 },
  // An empty IGP cost.
  { id: "cost-empty", input: inp("rfc", "none", A1(), B1({ igpCost: "" })), code: "bad-cost", path: 1 },
  // BGP Identifier 0.0.0.0 (it must be non-zero).
  { id: "id-zero", input: inp("rfc", "none", A1({ bgpId: "0.0.0.0" }), B1()), code: "bad-id", path: 0 },
  // A peer address with three octets.
  { id: "peer-short", input: inp("rfc", "none", A1(), B1({ peer: "192.0.2" })), code: "bad-peer", path: 1 },
  // A reflected path without an ORIGINATOR_ID.
  { id: "originator-missing", input: inp("rfc", "none", A1(), path("ibgp-rr", "64497 64499", "", "192.0.2.70", "192.0.2.70", { originatorId: "" })), code: "bad-originator", path: 1 },
  // Two paths from one peer address.
  { id: "duplicate-peer", input: inp("rfc", "none", A1(), A2({ peer: "192.0.2.2" })), code: "duplicate-peer", path: 1 },
  // The Cisco profile and an iBGP path carrying the local AS: undocumented, refused.
  { id: "cisco-own-as-ibgp", input: inp("cisco", "none", A1(), path("ibgp", "64497 64496 64499", "", "192.0.2.66", "192.0.2.66")), code: "cisco-own-as-ibgp", path: 1 },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute, summarise and compare every expected field.
  for (const v of BGP_VECTORS) {
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
  // Each reject case: it must throw with the right code and path.
  for (const r of BGP_REJECTS) {
    // The code and path it threw with, or null when it did not throw.
    let got: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code and a path; anything else is reported as such.
      got = e instanceof BgpError ? `${e.code}@${e.path}` : `unexpected ${String(e)}`;
    }
    // Wrong code, wrong path or no refusal is a failure.
    if (got !== `${r.code}@${r.path}`) failures.push(`${r.id}: refused with ${String(got)}, expected ${r.code}@${r.path}`);
  }
  // The report in the shape the runner reads.
  const total = BGP_VECTORS.length + BGP_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
