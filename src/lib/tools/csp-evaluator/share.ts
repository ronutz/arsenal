// ============================================================================
// src/lib/tools/csp-evaluator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the CSP evaluator (posture "input-caution"; the
// manifest: "a policy is public by nature, but a nonce in it belongs to one
// response"). A link carries the box as pasted (a header value, header lines,
// a <meta> element, or several), once the page has read at least one policy,
// with a caution line: CSP Level 3 (W3C, read 2026-10-27), section 7.1, has
// the server "generate a unique value each time it transmits a policy", so a
// nonce in a shared policy should be one already spent, and a policy can
// also name internal hosts and report endpoints.
// The page reads every line of the box as a policy, so a whole response
// pasted here would go with its other headers: before a link is offered, the
// family's secrets check reads the box (src/lib/share/text-secrets.ts): a Cookie or
// Set-Cookie line with a value, an Authorization line, a JWT or a password in
// a URL blocks the link (code "secret"; the popover names the line), and a
// secret-looking name=value (a token in a report endpoint's query) is named
// in the caution line instead.
//
// Arrival: the box fills as a paste would and the page reads it (no fetch).
// Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { run, type CspResult } from "./compute"; // the page's own reading (run refuses oversized input by throwing)
import { encodeCheckedBox, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the family's secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface CspShareState {
  /** The box as pasted. */
  input: string;
}

/**
 * Whether the page has a reading to share: at least one policy read (an oversized box is refused with a message).
 * @param r the page's reading, or null when there is none
 * @returns true when there is a policy to share
 */
export function cspHasReading(r: CspResult | null | undefined): boolean {
  return !!r && r.count > 0; // at least one policy
} // cspHasReading

/**
 * Encode from what the page already computed (its reading and the check's report).
 * @param s the state
 * @param r the page's reading (null or undefined while there is none)
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeCspShare(s: CspShareState, r: CspResult | null | undefined, report: ShareSecretReport): ShareEncoding {
  if (!cspHasReading(r)) return { ok: false, reason: "empty" }; // no policy read: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as pasted
} // encodeCspShare

/** The spec. */
export const CSP_SHARE: ShareSpec<CspShareState> = Object.freeze({
  tool: "csp-evaluator", // the slug
  posture: "input-caution", // the box as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.csp-evaluator.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: CspShareState): ShareEncoding {
    let r: CspResult | null = null; // the reading
    try { r = s.input.trim() === "" ? null : run({ policy: s.input }); } catch { r = null; } // oversized: the page shows its message
    return encodeCspShare(s, r, cspHasReading(r) ? findShareSecrets(s.input) : { secrets: [], maybe: [], skipped: false }); // read, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): CspShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
