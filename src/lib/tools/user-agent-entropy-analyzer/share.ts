// ============================================================================
// src/lib/tools/user-agent-entropy-analyzer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the User-Agent entropy analyser (posture "input",
// the inventory's, kept, with a blocked case added on 2026-11-01).
//
// A User-Agent string is sent to every server a browser talks to, and names
// a browser, an engine and an operating system, nothing of a person's own; the
// link carries `input`, the box as typed. But the box is a multi-line text area
// and the engine reads any text holding a product/version token, so a whole
// request copied from devtools (with its Cookie line or Authorization header)
// reads as a User-Agent too. Before a link is offered the box goes through the
// site's text secrets check (src/lib/share/text-secrets.ts, reused as is): a
// value that is a credential by its format (Authorization credentials, a
// Cookie line, a JWT, a password in a URL, a PEM private key, an AWS access key
// ID) means no link, and the popover names its line; a value whose name only
// looks like a secret adds a caution line naming it. A User-Agent itself never
// matches either.
// Arrival: the box is filled as a paste would and the page analyses it.
// ============================================================================

import { findShareSecrets, encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the site's text secrets check, reused as is
import { analyzeUa } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores: the box. */
export interface UaShareState {
  /** The User-Agent string, as typed. */
  input: string;
}

/**
 * The secrets check of a box (the page runs it once per change, for the button and the caution line).
 * @param input the box as typed
 * @returns the report
 */
export function checkUaBox(input: string): ShareSecretReport {
  return findShareSecrets(input); // the site's check
} // checkUaBox

/**
 * The encoding of a box.
 * @param input the box as typed
 * @param report its secrets check
 * @returns nothing (blank or no reading), blocked (a credential), or the box
 */
export function encodeUaShare(input: string, report: ShareSecretReport): ShareEncoding {
  try { analyzeUa(input); } catch { return { ok: false, reason: "empty" }; } // no reading: nothing to share
  return encodeCheckedBox(input, report); // blank, blocked, or the box as typed
} // encodeUaShare

/** The spec. */
export const UA_SHARE: ShareSpec<UaShareState> = Object.freeze({
  tool: "user-agent-entropy-analyzer", // the slug
  posture: "input", // the box as typed (a credential in it blocks the link)
  carriesKey: "share.carries", // tools.user-agent-entropy-analyzer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked. */
  encode(s: UaShareState): ShareEncoding {
    return encodeUaShare(s.input, checkUaBox(s.input)); // checked, then encoded
  },
  /** Any non-blank text that holds no credential: the page analyses it as a paste, and says why when it cannot. */
  decode(v: Readonly<Record<string, string | null>>): UaShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing
    return findShareSecrets(v.input).secrets.length === 0 ? { input: v.input } : null; // the encoder never builds one with a credential
  },
});
