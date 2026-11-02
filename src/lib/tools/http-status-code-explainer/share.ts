// ============================================================================
// src/lib/tools/http-status-code-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the HTTP status code explainer (posture "input",
// the inventory's: shareSafetyDefault "open"). A link carries the box as
// typed: status codes and families ("301 302 307 502 503 504", "5xx"), which
// name nothing about the reader. The explanation is a lookup in the registry
// table, so the same text gives the same cards on the receiving page.
//
// Arrival: the text fills the box as typing would, and the page explains it;
// nothing is sent. Any non-blank text is accepted, as typing is (text that
// holds no code gets the page's own message).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box. */
export interface HttpStatusShareState {
  /** The codes and families as typed. */
  input: string;
}

/** The spec. */
export const HTTP_STATUS_SHARE: ShareSpec<HttpStatusShareState> = Object.freeze({
  tool: "http-status-code-explainer", // the slug
  posture: "input", // the box as typed
  carriesKey: "share.carries", // tools.http-status-code-explainer.share.carries
  names: ["input"], // #input=
  /** The box, or nothing while it is blank. */
  encode(s: HttpStatusShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } }; // as typed
  },
  /** Any non-blank text: the page reads it as typing. */
  decode(v: Readonly<Record<string, string | null>>): HttpStatusShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
