// ============================================================================
// src/lib/tools/http-request-translator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the HTTP request translator (posture "derived",
// raised on 2026-10-27 from the inventory's "input-caution"): a captured
// request routinely carries an Authorization header or a session cookie (the
// manifest says so, and the page's own Example sends a Bearer token), and the
// page shows every header value in clear and in five translations. A link
// carries the copy shareableRequest() in compute.ts makes: credentials,
// cookie values, secret-named fields and the target's secret parameters
// replaced by REDACTED, and the body's secret members and parameters filled
// with "*" octet for octet, so a Content-Length that matched still matches.
// The tool's own share vectors pin the copy and that the receiving page reads
// the same request.
//
// Blocked (code "secret"): when a key or token is left that no rule can name
// (a JWT pasted as a plain-text body), the popover names its line.
//
// Arrival: the copy fills the box as a paste would, and the page translates
// it; nothing is sent. Any non-blank text is accepted, as a paste is.
// ============================================================================

import { shareableRequest, type ShareableRequest } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (as pasted when encoding, the copy on arrival). */
export interface RequestTranslatorShareState {
  /** The raw request. */
  input: string;
}

/**
 * Encode from a copy the page already made (it computes one for the button and the count line).
 * @param s the state
 * @param copy shareableRequest's result for s.input, or null to make it here
 * @returns the copy, nothing, or blocked
 */
export function encodeRequestTranslator(s: RequestTranslatorShareState, copy: ShareableRequest | null): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  const c = copy ?? shareableRequest(s.input); // the copy
  if (c.residual) return { ok: false, reason: "blocked", code: "secret", values: { line: c.residual.line, label: c.residual.label } }; // a secret no rule can name: no link
  return { ok: true, params: { input: c.text } }; // the copy, never the paste
} // encodeRequestTranslator

/** The spec. */
export const REQUEST_TRANSLATOR_SHARE: ShareSpec<RequestTranslatorShareState> = Object.freeze({
  tool: "http-request-translator", // the slug
  posture: "derived", // the copy with every credential replaced
  carriesKey: "share.carries", // tools.http-request-translator.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked. */
  encode(s: RequestTranslatorShareState): ShareEncoding {
    return encodeRequestTranslator(s, null); // made here
  },
  /** Any non-blank text: the page translates it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): RequestTranslatorShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
