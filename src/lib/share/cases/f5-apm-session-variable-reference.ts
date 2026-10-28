// ============================================================================
// src/lib/share/cases/f5-apm-session-variable-reference.ts
// ----------------------------------------------------------------------------
// Share cases of the APM session-variable reference: the box goes as typed
// (posture input).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { APM_SESSION_VARIABLE_SHARE, type ApmSessionVariableShareState } from "../../tools/f5-apm-session-variable-reference/share"; // the spec
import { SVAR_VECTORS } from "../../tools/f5-apm-session-variable-reference/golden-vectors"; // the tool's own vectors

/**
 * A golden vector's input, byte for byte.
 * @param id the vector's id
 * @returns its input (empty when the id is missing, which fails the accept case)
 */
const pick = (id: string): string => SVAR_VECTORS.find((v) => v.id === id)?.input ?? ""; // pinned there

/** The cases. */
export const APM_SESSION_VARIABLE_SHARE_CASES = defineShareCases<ApmSessionVariableShareState, ApmSessionVariableShareState>({
  spec: APM_SESSION_VARIABLE_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: pick("mcget-secure-mismatch") }, params: { input: pick("mcget-secure-mismatch") }, restored: { input: pick("mcget-secure-mismatch") } }, // the Example (golden vector mcget-secure-mismatch): brackets, braces and a variable name, never a value
    { id: "expression", state: { input: pick("mcget-parse") }, params: { input: pick("mcget-parse") }, restored: { input: pick("mcget-parse") } }, // "[", "]", "==", spaces
    { id: "embedding", state: { input: "%{session.otp.assigned.val}" }, params: { input: "%{session.otp.assigned.val}" }, restored: { input: "%{session.otp.assigned.val}" } }, // "%" and braces
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "\n " } }, // only white space
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "  " } }, // only white space
  ],
});
