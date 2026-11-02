// ============================================================================
// src/lib/share/cases/f5xc-lb-algorithm-chooser.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC load-balancing algorithm chooser (2026-11-01, wave
// 4B): a form; the answers of the branch the recommendation reads go by their
// ids, the dynamic-pool answer once given; an incomplete questionnaire has
// nothing to share; the other branch's answer, an unknown id or a missing
// required answer is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LB_ALGORITHM_SHARE } from "../../tools/f5xc-lb-algorithm-chooser/share"; // the spec
import type { AnswerState } from "../../tools/f5xc-lb-algorithm-chooser/compute"; // the state

/** The cases. */
export const F5XC_LB_ALGORITHM_SHARE_CASES = defineShareCases<AnswerState, AnswerState>({
  spec: LB_ALGORITHM_SHARE, // the spec
  accept: [
    { id: "example", state: { needsPersistence: true, distribution: null, sessionKey: "cookie", dynamicPool: false }, params: { persistence: "1", sessionkey: "cookie", dynamic: "0" }, restored: { needsPersistence: true, distribution: null, sessionKey: "cookie", dynamicPool: false } }, // the page's Example
    { id: "least-loaded-dynamic", state: { needsPersistence: false, distribution: "least-loaded", sessionKey: null, dynamicPool: true }, params: { persistence: "0", distribution: "least-loaded", dynamic: "1" }, restored: { needsPersistence: false, distribution: "least-loaded", sessionKey: null, dynamicPool: true } }, // the other branch
    { id: "dynamic-unanswered", state: { needsPersistence: true, distribution: null, sessionKey: "custom-header", dynamicPool: null }, params: { persistence: "1", sessionkey: "custom-header" }, restored: { needsPersistence: true, distribution: null, sessionKey: "custom-header", dynamicPool: null } }, // complete without Q3: it stays unanswered
    { id: "hidden-answer-dropped", state: { needsPersistence: false, distribution: "random", sessionKey: "source-ip", dynamicPool: false }, params: { persistence: "0", distribution: "random", dynamic: "0" }, restored: { needsPersistence: false, distribution: "random", sessionKey: null, dynamicPool: false } }, // the hidden branch's answer reads nothing and is not written
  ],
  empty: [
    { id: "untouched", state: { needsPersistence: null, distribution: null, sessionKey: null, dynamicPool: null } }, // the page as it opens
    { id: "no-session-key", state: { needsPersistence: true, distribution: null, sessionKey: null, dynamicPool: true } }, // Q2b unanswered
    { id: "no-distribution", state: { needsPersistence: false, distribution: null, sessionKey: null, dynamicPool: null } }, // Q2a unanswered
  ],
  blocked: [],
  reject: [
    { id: "no-persistence", values: { persistence: null, distribution: "even", sessionkey: null, dynamic: "0" } }, // Q1 missing
    { id: "both-branches", values: { persistence: "1", distribution: "even", sessionkey: "cookie", dynamic: "0" } }, // never written
    { id: "unknown-key", values: { persistence: "1", distribution: null, sessionkey: "jwt", dynamic: null } }, // not an id
    { id: "unknown-distribution", values: { persistence: "0", distribution: "weighted", sessionkey: null, dynamic: null } }, // not an id
    { id: "bad-flag", values: { persistence: "yes", distribution: "even", sessionkey: null, dynamic: null } }, // 1 or 0 only
    { id: "bad-dynamic", values: { persistence: "0", distribution: "even", sessionkey: null, dynamic: "2" } }, // 1 or 0 only
  ],
});
