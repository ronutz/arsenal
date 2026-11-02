// ============================================================================
// src/lib/tools/f5xc-lb-algorithm-chooser/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC load-balancing algorithm chooser
// (posture "input", as the inventory gives it: the manifest's "param"). A
// form with nothing to paste (ROLLOUT 11.3): a link carries the answers the
// recommendation reads, by their stable ids, once the questionnaire is
// complete (2026-11-01, wave 4B). Answers name no system or person.
//
// Names: `persistence` (1 or 0); then `distribution` (even, least-loaded,
// random) when it is 0, or `sessionkey` (source-ip, cookie, custom-header,
// per-route) when it is 1; and `dynamic` (1 or 0) once answered (the page
// recommends without it, reading an unanswered question as "no", and an
// arrival leaves it unanswered as it was). The answer the page hides on the
// other branch is never written (it reads nothing), and a link that carries
// it, an unknown id or a missing required answer is malformed (a stale link
// never opens a wrong recommendation).
//
// Arrival: the answers are set as if clicked; the recommendation follows.
// ============================================================================

import { recommend, type AnswerState, type Distribution, type SessionKey } from "./compute"; // the page's own recommender
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The distributions, by their stable ids (as the page offers them). */
export const LB_DISTRIBUTIONS: readonly Distribution[] = Object.freeze(["even", "least-loaded", "random"]); // Q2a
/** The session keys, by their stable ids (as the page offers them). */
export const LB_SESSION_KEYS: readonly SessionKey[] = Object.freeze(["source-ip", "cookie", "custom-header", "per-route"]); // Q2b

/**
 * A yes/no answer from its link value.
 * @param v "1", "0" or anything else
 * @returns true, false, or null when malformed
 */
function flag(v: string | null): boolean | null {
  return v === "1" ? true : v === "0" ? false : null; // the two values only
} // flag

/** The spec. */
export const LB_ALGORITHM_SHARE: ShareSpec<AnswerState> = Object.freeze({
  tool: "f5xc-lb-algorithm-chooser", // the slug
  posture: "input", // choices only
  carriesKey: "share.carries", // tools.f5xc-lb-algorithm-chooser.share.carries
  names: ["persistence", "distribution", "sessionkey", "dynamic"], // a form: no input
  /** The answers on the branch the recommendation reads, once it is complete. */
  encode(a: AnswerState): ShareEncoding {
    if (!recommend(a).complete) return { ok: false, reason: "empty" }; // no recommendation yet: the button is disabled
    const params: Record<string, string> = { persistence: a.needsPersistence ? "1" : "0" }; // Q1
    if (a.needsPersistence) params.sessionkey = a.sessionKey as string; else params.distribution = a.distribution as string; // the answer that branch reads
    if (a.dynamicPool !== null) params.dynamic = a.dynamicPool ? "1" : "0"; // Q3, once answered
    return { ok: true, params }; // every answer given
  },
  /** Every answer of one branch, by a known id; nothing of the other branch. */
  decode(v: Readonly<Record<string, string | null>>): AnswerState | null {
    const persistence = flag(v.persistence); // Q1
    const dynamic = v.dynamic === null || v.dynamic === undefined ? null : flag(v.dynamic); // Q3: absent is unanswered
    if (persistence === null) return null; // a missing or unknown answer
    if (v.dynamic !== null && v.dynamic !== undefined && dynamic === null) return null; // an unknown value
    if (persistence) { // Q2b
      if (v.distribution !== null && v.distribution !== undefined) return null; // the other branch's answer: never written
      if (!v.sessionkey || !(LB_SESSION_KEYS as readonly string[]).includes(v.sessionkey)) return null; // missing or unknown
      return { needsPersistence: true, distribution: null, sessionKey: v.sessionkey as SessionKey, dynamicPool: dynamic }; // the state
    } // Q2b
    if (v.sessionkey !== null && v.sessionkey !== undefined) return null; // the other branch's answer: never written
    if (!v.distribution || !(LB_DISTRIBUTIONS as readonly string[]).includes(v.distribution)) return null; // missing or unknown
    return { needsPersistence: false, distribution: v.distribution as Distribution, sessionKey: null, dynamicPool: dynamic }; // Q2a
  },
});
