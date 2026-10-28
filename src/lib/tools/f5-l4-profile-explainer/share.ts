// ============================================================================
// src/lib/tools/f5-l4-profile-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the LTM L4 protocol profile explainer (posture
// "input"): a link carries the field as typed: a profile name ("fastl4") or
// "profiles", which name nothing of the reader's network.
//
// Arrival: the name fills the field as typing would, and the page explains
// it. Any non-empty text is accepted, exactly as typing is: a name the engine
// does not know shows the page's own error message.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box. */
export interface L4ProfileShareState {
  /** The text as typed or pasted. */
  input: string;
}

/** The spec. */
export const L4_PROFILE_SHARE: ShareSpec<L4ProfileShareState> = Object.freeze({
  tool: "f5-l4-profile-explainer", // the slug
  posture: "input", // the text as typed
  carriesKey: "share.carries", // tools.f5-l4-profile-explainer.share.carries
  names: ["input"], // #input=
  /** The text, when it holds something. */
  encode(s: L4ProfileShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): L4ProfileShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
