// ============================================================================
// src/lib/tools/f5-apm-sso-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the APM SSO method explainer (posture "input"):
// a link carries the method name as typed ("kerberos", "ntlmv2", "methods"),
// after the "#", and nothing else.
//
// Weighed for secrets (WAVE2 brief: "APM SSO configuration (credentials)"):
// this tool takes no configuration at all. run() accepts only a name from its
// curated table of eight methods, or "methods", and refuses anything else with
// a message. encode gives a link only for text run() accepts, and decode
// accepts only the same, so neither an SSO object, nor a credential, nor any
// other text can travel in a link of this tool.
//
// Arrival (useShareArrival in the component): the name fills the box as typing
// would, and the page shows its card. Nothing is sent anywhere.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { run } from "./compute"; // the tool's own reader: the method table

/** The state a share carries: the method name as typed. */
export interface ApmSsoShareState {
  /** The name. */
  input: string;
}

/**
 * Whether the tool reads this text (a method in its table, or "methods").
 * @param text the box
 * @returns true when run() accepts it
 */
function readable(text: string): boolean {
  try {
    run(text); // throws for anything outside the table
    return true; // a method, or the catalogue
  } catch {
    return false; // not one the tool knows
  } // try
} // readable

/** The spec. */
export const APM_SSO_SHARE: ShareSpec<ApmSsoShareState> = Object.freeze({
  tool: "f5-apm-sso-explainer", // the slug
  posture: "input", // the name as typed, with the standard warning
  carriesKey: "share.carries", // tools.f5-apm-sso-explainer.share.carries
  names: ["input"], // #input=
  /** The name, once the tool reads it. */
  encode(state: ApmSsoShareState): ShareEncoding {
    if (state.input.trim() === "" || !readable(state.input)) return { ok: false, reason: "empty" }; // nothing the tool reads: the button is disabled
    return { ok: true, params: { input: state.input } }; // the one value
  },
  /** Only a name the tool reads: anything else is malformed, and ignored. */
  decode(values: Readonly<Record<string, string | null>>): ApmSsoShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" && readable(v) ? { input: v } : null; // a method, or nothing
  },
});
