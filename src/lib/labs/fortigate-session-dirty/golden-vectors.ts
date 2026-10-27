// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/fortigate-session-dirty/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the FortiGate session-dirty lab (set 2026-10-26a). Each
// case is worked by hand from the rules in compute.ts (FortiOS 7.6.6 CLI
// Reference for config system settings, config firewall policy and config
// system global; FortiOS 7.6.0 Best Practices, "Policy configuration changes";
// Fortinet Technical Tips 97625, 99259 and 226173; all read 2026-10-26) and
// pinned field by field. They cover every change under the VDOM's check-all
// and check-new (the Example: a policy edited to deny under check-new, the old
// session still flowing), a session that predates check-new (revalidated, as
// the Best Practices page says), the policy-level option under
// check-policy-option, the two undocumented cases (a new deny policy above the
// accepting one under check-policy-option), and the settings that do not apply
// (a policy option under check-all, the opened-before flag outside check-new).
// Reject vectors pin every error code. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, SessionDirtyError, type SessionDirtyErrorCode, type SessionDirtyInput, type SessionDirtyResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "fortigate-session-dirty/2026-10-26a";

/** A case the model must answer exactly so (every field of the result compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: SessionDirtyInput;
  /** The whole expected result. */
  expect: SessionDirtyResult;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings the model must refuse (cast, as the interface could never send them). */
  input: SessionDirtyInput;
  /** The code the refusal must carry. */
  code: SessionDirtyErrorCode;
}

/** Shorthand for an input. */
function inp(global: SessionDirtyInput["global"], policy: SessionDirtyInput["policy"], openedBeforeCheckNew: boolean, change: SessionDirtyInput["change"]): SessionDirtyInput {
  // The four fields in order.
  return { global, policy, openedBeforeCheckNew, change };
}

/** The result of a revalidated session under the VDOM's check-all (or one that predates check-new). */
function globalAll(governing: "global-check-all" | "global-check-new-older", allowed: boolean): SessionDirtyResult {
  // may_dirty, then dirty, then re-evaluated: kept when allowed, dropped otherwise.
  return { governing, policyOptionApplies: false, flagBefore: "may_dirty", flaggedDirty: true, revalidated: true, allowedAfterChange: allowed, outcome: allowed ? "revalidated-continues" : "dropped" };
}

/** The result of a persistent session under the VDOM's check-new. */
function globalNew(allowed: boolean): SessionDirtyResult {
  // persistent, never re-evaluated, keeps flowing.
  return { governing: "global-check-new", policyOptionApplies: false, flagBefore: "persistent", flaggedDirty: false, revalidated: false, allowedAfterChange: allowed, outcome: "unchecked-continues" };
}

/** The result under check-policy-option for a change to the accepting policy itself. */
function perPolicy(policy: "check-all" | "check-new", allowed: boolean): SessionDirtyResult {
  // The policy's own option decides; no document names the flags at this level.
  const reval = policy === "check-all";
  // Assembled.
  return {
    governing: reval ? "policy-check-all" : "policy-check-new",
    policyOptionApplies: true,
    flagBefore: null,
    flaggedDirty: null,
    revalidated: reval,
    allowedAfterChange: allowed,
    outcome: reval ? (allowed ? "revalidated-continues" : "dropped") : "unchecked-continues",
  };
}

/** The undocumented result: check-policy-option and a new deny policy above. */
const UNDOCUMENTED: SessionDirtyResult = { governing: "undocumented", policyOptionApplies: true, flagBefore: null, flaggedDirty: null, revalidated: null, allowedAfterChange: false, outcome: "undocumented" };

/** The accept cases. */
export const SESSION_DIRTY_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: check-all (the default), the policy edited to deny: dirty, re-evaluated, dropped.
  { id: "default-check-all-edit-to-deny", input: DEFAULT_INPUT, expect: globalAll("global-check-all", false) },
  // check-all, the policy's addresses or services narrowed: no longer matches the policy that allowed it, dropped.
  { id: "check-all-narrow-match", input: inp("check-all", "check-all", false, "narrow-match"), expect: globalAll("global-check-all", false) },
  // check-all, a deny policy added above: any policy change marks it dirty; re-evaluated, it meets the deny, dropped.
  { id: "check-all-deny-above", input: inp("check-all", "check-all", false, "deny-above"), expect: globalAll("global-check-all", false) },
  // check-all, a change that still accepts it: dirty, re-evaluated, the flag cleared, it carries on.
  { id: "check-all-still-matches", input: inp("check-all", "check-all", false, "still-matches"), expect: globalAll("global-check-all", true) },
  // The Example: check-new, the policy edited to deny: persistent, never re-evaluated, still flowing.
  { id: "example-check-new-edit-to-deny", input: EXAMPLE_INPUT, expect: globalNew(false) },
  // check-new, narrowed: still flowing.
  { id: "check-new-narrow-match", input: inp("check-new", "check-all", false, "narrow-match"), expect: globalNew(false) },
  // check-new, a deny above: still flowing, though a new session would meet the deny.
  { id: "check-new-deny-above", input: inp("check-new", "check-all", false, "deny-above"), expect: globalNew(false) },
  // check-new, a harmless change: flowing, and a new session is allowed too.
  { id: "check-new-still-matches", input: inp("check-new", "check-all", false, "still-matches"), expect: globalNew(true) },
  // A session opened before check-new was set is not persistent: revalidated and dropped (7.6.0 Best Practices).
  { id: "check-new-older-session-edit-to-deny", input: inp("check-new", "check-all", true, "edit-to-deny"), expect: globalAll("global-check-new-older", false) },
  // The same older session, a deny above: revalidated and dropped.
  { id: "check-new-older-session-deny-above", input: inp("check-new", "check-all", true, "deny-above"), expect: globalAll("global-check-new-older", false) },
  // The same older session, a harmless change: revalidated and kept.
  { id: "check-new-older-session-still-matches", input: inp("check-new", "check-all", true, "still-matches"), expect: globalAll("global-check-new-older", true) },
  // check-policy-option, the policy's own check-all, edited to deny: flushed, re-matched, dropped.
  { id: "policy-option-check-all-edit-to-deny", input: inp("check-policy-option", "check-all", false, "edit-to-deny"), expect: perPolicy("check-all", false) },
  // check-policy-option, the policy's check-all, narrowed: dropped.
  { id: "policy-option-check-all-narrow-match", input: inp("check-policy-option", "check-all", false, "narrow-match"), expect: perPolicy("check-all", false) },
  // check-policy-option, the policy's check-all, a harmless change: re-matched and kept.
  { id: "policy-option-check-all-still-matches", input: inp("check-policy-option", "check-all", false, "still-matches"), expect: perPolicy("check-all", true) },
  // check-policy-option, the policy's check-new, edited to deny: the policy continues to allow it.
  { id: "policy-option-check-new-edit-to-deny", input: inp("check-policy-option", "check-new", false, "edit-to-deny"), expect: perPolicy("check-new", false) },
  // check-policy-option, the policy's check-new, narrowed: still allowed.
  { id: "policy-option-check-new-narrow-match", input: inp("check-policy-option", "check-new", false, "narrow-match"), expect: perPolicy("check-new", false) },
  // check-policy-option, the policy's check-new, a harmless change: still allowed.
  { id: "policy-option-check-new-still-matches", input: inp("check-policy-option", "check-new", false, "still-matches"), expect: perPolicy("check-new", true) },
  // check-policy-option and a NEW deny policy above, policy check-all: no document says whose option governs.
  { id: "policy-option-check-all-deny-above-undocumented", input: inp("check-policy-option", "check-all", false, "deny-above"), expect: UNDOCUMENTED },
  // The same with the accepting policy on check-new: undocumented too.
  { id: "policy-option-check-new-deny-above-undocumented", input: inp("check-policy-option", "check-new", false, "deny-above"), expect: UNDOCUMENTED },
  // A policy-level check-new under the VDOM's check-all does not apply (97625): check-all governs.
  { id: "policy-option-ignored-under-check-all", input: inp("check-all", "check-new", false, "edit-to-deny"), expect: globalAll("global-check-all", false) },
  // The opened-before flag does not apply under check-all.
  { id: "opened-before-ignored-under-check-all", input: inp("check-all", "check-all", true, "edit-to-deny"), expect: globalAll("global-check-all", false) },
  // The opened-before flag does not apply under check-policy-option.
  { id: "opened-before-ignored-under-policy-option", input: inp("check-policy-option", "check-new", true, "edit-to-deny"), expect: perPolicy("check-new", false) },
]);

/** The reject cases, one per code. */
export const SESSION_DIRTY_REJECTS: readonly RejectVector[] = Object.freeze([
  // A global value FortiOS does not have.
  { id: "bad-global", input: inp("check-none" as unknown as "check-all", "check-all", false, "edit-to-deny"), code: "bad-global" },
  // check-policy-option is a global value only, never a policy value.
  { id: "bad-policy", input: inp("check-policy-option", "check-policy-option" as unknown as "check-all", false, "edit-to-deny"), code: "bad-policy" },
  // The opened-before flag must be a boolean.
  { id: "bad-opened", input: { ...DEFAULT_INPUT, openedBeforeCheckNew: "yes" as unknown as boolean }, code: "bad-opened" },
  // A change the lab does not offer.
  { id: "bad-change", input: inp("check-all", "check-all", false, "delete-policy" as unknown as "edit-to-deny"), code: "bad-change" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every field.
  for (const v of SESSION_DIRTY_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof SessionDirtyResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of SESSION_DIRTY_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof SessionDirtyError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = SESSION_DIRTY_VECTORS.length + SESSION_DIRTY_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
