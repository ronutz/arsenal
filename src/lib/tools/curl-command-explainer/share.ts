// ============================================================================
// src/lib/tools/curl-command-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the curl command explainer (posture "derived",
// raised on 2026-10-27 from the inventory's "input-caution"): a curl command
// pasted while debugging an API nearly always holds a credential (the page's
// own Example sends "Authorization: Bearer ..."), and the page shows header
// values, cookies and, in the Python translation, a -u password in clear. A
// caution line would hand them on in most shares, and replacing each value
// leaves the explanation and the translations as they were, so a link carries
// the copy shareableCurl() in compute.ts makes: every password, token,
// credential and cookie value replaced by REDACTED, in place (quotes and
// line continuations kept). The tool's own share vectors pin the copy and
// that the receiving page reads the same request.
//
// Blocked (code "secret"): when a key or token is left that no rule can name
// (a JWT in a URL path, a private key in a body), the copy is not offered;
// the popover names its line, and the reader puts a placeholder in its place.
//
// Arrival: the copy fills the box as a paste would, and the page explains it;
// nothing is sent or run. Any non-blank text is accepted, as a paste is.
// ============================================================================

import { shareableCurl, type ShareableCurl } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (as pasted when encoding, the copy on arrival). */
export interface CurlExplainerShareState {
  /** The command. */
  input: string;
}

/**
 * Encode from a copy the page already made (it computes one for the button and the count line).
 * @param s the state
 * @param copy shareableCurl's result for s.input, or null to make it here
 * @returns the copy, nothing, or blocked
 */
export function encodeCurlExplainer(s: CurlExplainerShareState, copy: ShareableCurl | null): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  const c = copy ?? shareableCurl(s.input); // the copy
  if (c.residual) return { ok: false, reason: "blocked", code: "secret", values: { line: c.residual.line, label: c.residual.label } }; // a secret no rule can name: no link
  return { ok: true, params: { input: c.text } }; // the copy, never the paste
} // encodeCurlExplainer

/** The spec. */
export const CURL_EXPLAINER_SHARE: ShareSpec<CurlExplainerShareState> = Object.freeze({
  tool: "curl-command-explainer", // the slug
  posture: "derived", // the copy with every credential replaced
  carriesKey: "share.carries", // tools.curl-command-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked. */
  encode(s: CurlExplainerShareState): ShareEncoding {
    return encodeCurlExplainer(s, null); // made here
  },
  /** Any non-blank text: the page explains it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): CurlExplainerShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
