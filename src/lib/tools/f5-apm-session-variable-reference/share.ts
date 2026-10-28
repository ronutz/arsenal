// ============================================================================
// src/lib/tools/f5-apm-session-variable-reference/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the APM session-variable reference (posture
// "input"): a link carries the box as typed (a variable name, a branch-rule
// expression, a %{...} embedding, a family, or "variables"), after the "#",
// and nothing else. The tool reads names of variables, never their values:
// session.logon.last.password is a name here, and the page explains what
// reading it returns.
//
// Arrival (useShareArrival in the component): the text fills the box as a
// paste would and the page reads it. Nothing is sent anywhere. Any non-blank
// text is accepted, exactly as a paste is: text the tool cannot read gets the
// page's own message.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state a share carries: the box as typed. */
export interface ApmSessionVariableShareState {
  /** The paste. */
  input: string;
}

/** The spec. */
export const APM_SESSION_VARIABLE_SHARE: ShareSpec<ApmSessionVariableShareState> = Object.freeze({
  tool: "f5-apm-session-variable-reference", // the slug
  posture: "input", // the paste as typed, with the standard warning
  carriesKey: "share.carries", // tools.f5-apm-session-variable-reference.share.carries
  names: ["input"], // #input=
  /** The paste, or nothing while the box is blank. */
  encode(state: ApmSessionVariableShareState): ShareEncoding {
    if (state.input.trim() === "") return { ok: false, reason: "empty" }; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } }; // the one value
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>): ApmSessionVariableShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
