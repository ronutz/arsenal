// ============================================================================
// src/lib/tools/http-methods-comparison/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the HTTP methods comparison (posture "input",
// the inventory's: shareSafetyDefault "param"). A link carries the line as
// typed: one to four method names ("get vs query"), which name nothing about
// the reader. The comparison is a lookup in the registry table, so the same
// line gives the same panels on the receiving page.
//
// Arrival: the line fills the field as typing would, and the page compares;
// nothing is sent. Any non-blank text is accepted, as typing is (an unknown
// method gets the page's own message).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the field. */
export interface HttpMethodsShareState {
  /** The method names as typed. */
  input: string;
}

/** The spec. */
export const HTTP_METHODS_SHARE: ShareSpec<HttpMethodsShareState> = Object.freeze({
  tool: "http-methods-comparison", // the slug
  posture: "input", // the line as typed
  carriesKey: "share.carries", // tools.http-methods-comparison.share.carries
  names: ["input"], // #input=
  /** The line, or nothing while it is blank. */
  encode(s: HttpMethodsShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } }; // as typed
  },
  /** Any non-blank text: the page reads it as typing. */
  decode(v: Readonly<Record<string, string | null>>): HttpMethodsShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the line, or nothing
  },
});
