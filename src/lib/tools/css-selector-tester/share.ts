// ============================================================================
// src/lib/tools/css-selector-tester/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the CSS selector tester (posture
// "input-caution", the inventory's: the manifest's shareSafetyDefault is
// "review"). A link carries both boxes as typed: `input` is the HTML (the
// text a reader pastes), `selectors` the selectors, each left out when empty.
// The matches depend on every character of both, so nothing can be replaced
// without changing the reading. Pasted HTML can still hold a credential, so
// before a link is offered the markup secrets check (src/lib/tools/
// html-structure-explainer/markup-secrets.ts, the site's secrets check reused
// as is) reads both boxes: a value secret by its format blocks the link (code
// "secret", the popover names the box and the line); a value whose name only
// looks like a secret is named in the caution line. Which selector's matches
// are highlighted is a view choice and is not carried.
//
// Arrival: both boxes are replaced (the page opens on an Example; an absent
// one is emptied), as a paste would fill them, and the page matches them;
// nothing is executed, fetched or rendered. Any text is accepted, as a paste
// is, as long as one box holds something.
// ============================================================================

import { MAX_SHARE_CHARS } from "../../share/format"; // the bound a link may carry
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { findMarkupSecrets, type MarkupSecretReport } from "../html-structure-explainer/markup-secrets"; // the markup secrets check

/** The state: the two boxes. */
export interface CssSelectorShareState {
  /** The HTML. */
  input: string;
  /** The selectors, one per line. */
  selectors: string;
}

/** The secrets reports of both boxes. */
export interface CssSelectorShareSecrets {
  /** The HTML's. */
  html: MarkupSecretReport;
  /** The selectors'. */
  selectors: MarkupSecretReport;
}

/**
 * The secrets reports a share needs, or null when no link could carry the boxes anyway (empty, or over the bound).
 * @param s the state
 * @returns the reports, or null
 */
export function cssSelectorShareSecrets(s: CssSelectorShareState): CssSelectorShareSecrets | null {
  if (s.input.trim() === "" && s.selectors.trim() === "") return null; // nothing to share
  if (s.input.length + s.selectors.length > MAX_SHARE_CHARS) return null; // no link could carry it
  return { html: findMarkupSecrets(s.input), selectors: findMarkupSecrets(s.selectors) }; // both boxes
} // cssSelectorShareSecrets

/**
 * Encode from reports the page already made (it computes them for the button and the caution line).
 * @param s the state
 * @param reports the markup secrets check's reports, or null (nothing typed, or over the bound)
 * @returns the boxes, nothing, or blocked
 */
export function encodeCssSelector(s: CssSelectorShareState, reports: CssSelectorShareSecrets | null): ShareEncoding {
  if (s.input.trim() === "" && s.selectors.trim() === "") return { ok: false, reason: "empty" }; // nothing typed: the button is disabled
  const inHtml = reports?.html.secret ?? null; // the first secret in the HTML
  const inSelectors = reports?.selectors.secret ?? null; // the first in the selectors
  const block = inHtml ?? inSelectors; // the HTML's first, then the selectors'
  if (block) return { ok: false, reason: "blocked", code: "secret", values: { field: inHtml ? "html" : "selectors", line: block.line, label: block.label, more: block.more + (inHtml && inSelectors ? 1 + inSelectors.more : 0) } }; // no link
  const params: Record<string, string> = {}; // the boxes that hold something
  if (s.input !== "") params.input = s.input; // the HTML as typed
  if (s.selectors !== "") params.selectors = s.selectors; // the selectors as typed
  return { ok: true, params }; // an empty box is left out of the link
} // encodeCssSelector

/** The spec. */
export const CSS_SELECTOR_SHARE: ShareSpec<CssSelectorShareState> = Object.freeze({
  tool: "css-selector-tester", // the slug
  posture: "input-caution", // both boxes as typed, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.css-selector-tester.share.carries
  names: ["input", "selectors"], // the HTML first (#input=), then the selectors
  /** The boxes, nothing, or blocked (the spec checks them itself). */
  encode(s: CssSelectorShareState): ShareEncoding {
    return encodeCssSelector(s, cssSelectorShareSecrets(s)); // checked, then encoded
  },
  /** Any text, as long as one box holds something; an absent box arrives empty. */
  decode(v: Readonly<Record<string, string | null>>): CssSelectorShareState | null {
    const input = v.input ?? ""; // the HTML, or empty
    const selectors = v.selectors ?? ""; // the selectors, or empty
    return input.trim() === "" && selectors.trim() === "" ? null : { input, selectors }; // something, or nothing
  },
});
