// ============================================================================
// src/lib/tools/html-structure-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the HTML structure & DOM explainer (posture
// "input-caution", the inventory's: the manifest's shareSafetyDefault is
// "review"). A link carries the HTML as pasted: the tree, the parse errors
// and the findings depend on every character of it, so nothing can be
// replaced without changing the reading. A pasted page can still hold a
// credential, so before a link is offered the markup secrets check
// (markup-secrets.ts, the site's secrets check reused as is) reads it:
//   - a value secret by its format (a PEM private key, a JWS or JWE, a
//     password in a URL, Authorization credentials) blocks the link (code
//     "secret"), and the popover names its line;
//   - a value whose name only looks like a secret is named in the caution
//     line instead of the general one.
// The "show attribute values in full" switch is a view choice and is not
// carried.
//
// Arrival: the HTML replaces the box (the page opens on an Example) as a
// paste would, and the page parses it; nothing is executed, fetched or
// rendered, as for a paste. Any non-blank text is accepted, as a paste is.
// ============================================================================

import { MAX_SHARE_CHARS } from "../../share/format"; // the bound a link may carry
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { findMarkupSecrets, type MarkupSecretReport } from "./markup-secrets"; // the markup secrets check

/** The state: the HTML (as pasted when encoding, the link's text on arrival). */
export interface HtmlStructureShareState {
  /** The HTML. */
  input: string;
}

/**
 * The secrets report a share needs, or null when no link could carry the text anyway (over the bound).
 * @param input the HTML
 * @returns the report, or null
 */
export function htmlStructureShareSecrets(input: string): MarkupSecretReport | null {
  return input.trim() === "" || input.length > MAX_SHARE_CHARS ? null : findMarkupSecrets(input); // only what a link could carry is read
} // htmlStructureShareSecrets

/**
 * Encode from a report the page already made (it computes one for the button and the caution line).
 * @param s the state
 * @param report the markup secrets check's report, or null (nothing typed, or over the bound)
 * @returns the HTML, nothing, or blocked
 */
export function encodeHtmlStructure(s: HtmlStructureShareState, report: MarkupSecretReport | null): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  const block = report?.secret; // the first value secret by its format
  if (block) return { ok: false, reason: "blocked", code: "secret", values: { line: block.line, label: block.label, more: block.more } }; // no link
  return { ok: true, params: { input: s.input } }; // the HTML as pasted (over the bound, the button says so)
} // encodeHtmlStructure

/** The spec. */
export const HTML_STRUCTURE_SHARE: ShareSpec<HtmlStructureShareState> = Object.freeze({
  tool: "html-structure-explainer", // the slug
  posture: "input-caution", // the HTML as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.html-structure-explainer.share.carries
  names: ["input"], // #input=
  /** The HTML, nothing, or blocked (the spec checks the text itself). */
  encode(s: HtmlStructureShareState): ShareEncoding {
    return encodeHtmlStructure(s, htmlStructureShareSecrets(s.input)); // checked, then encoded
  },
  /** Any non-blank text: the page parses it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): HtmlStructureShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
