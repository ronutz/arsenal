// ============================================================================
// src/lib/tools/url-inspector/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the URL inspector (posture "derived", raised on
// 2026-10-27 from the inventory's "input"): the manifest's own comment says
// "a URL may carry credentials or tokens" (shareSafetyDefault "fragment",
// which ROLLOUT section 2 maps to at least "input-caution"), and the page
// shows the whole URL in its anatomy strip, password included. A link
// carries the copy shareableUrl() in compute.ts makes: the userinfo's password
// (RFC 3986 section 3.2.1) and every secret query or fragment parameter
// (access_token, code, X-Amz-Signature, sig, key ...) replaced by REDACTED.
// The tool's own share vectors pin the copy and that the receiving page reads
// the same parts.
//
// Blocked (code "secret"): when a key or token is left that no rule can name
// (a JWT in the path), the popover says so.
//
// Arrival: this page already reads #input= with usePrefill (the handoff of
// src/lib/handoff.ts), and keeps it exactly as it was: the link IS that
// handoff, so no second arrival hook is added (ROLLOUT section 5). Encode
// gives what usePrefill's apply takes (the copy); decode mirrors what
// readHandoff accepts (any non-empty value), for the central harness.
// ============================================================================

import { shareableUrl, type ShareableUrl } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the field (as typed when encoding, the copy on arrival). */
export interface UrlInspectorShareState {
  /** The URL. */
  input: string;
}

/**
 * Encode from a copy the page already made (it computes one for the button and the count line).
 * @param s the state
 * @param copy shareableUrl's result for s.input, or null to make it here
 * @returns the copy, nothing, or blocked
 */
export function encodeUrlInspector(s: UrlInspectorShareState, copy: ShareableUrl | null): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing typed: the button is disabled
  const c = copy ?? shareableUrl(s.input); // the copy
  if (c.residual) return { ok: false, reason: "blocked", code: "secret", values: { line: c.residual.line, label: c.residual.label } }; // a secret no rule can name: no link
  return { ok: true, params: { input: c.text } }; // the copy, never the URL as typed
} // encodeUrlInspector

/** The spec. */
export const URL_INSPECTOR_SHARE: ShareSpec<UrlInspectorShareState> = Object.freeze({
  tool: "url-inspector", // the slug
  posture: "derived", // the copy with the password and secret parameters replaced
  carriesKey: "share.carries", // tools.url-inspector.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The copy, nothing, or blocked. */
  encode(s: UrlInspectorShareState): ShareEncoding {
    return encodeUrlInspector(s, null); // made here
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill. */
  decode(v: Readonly<Record<string, string | null>>): UrlInspectorShareState | null {
    return v.input ? { input: v.input } : null; // the value, or nothing
  },
});
