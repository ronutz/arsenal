// ============================================================================
// src/lib/tools/meta-og-jsonld-inspector/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the meta, Open Graph & JSON-LD inspector
// (posture "input-caution", the inventory's: the manifest's shareSafetyDefault
// is "review", "a pasted head may carry anything"). A link carries the page or
// head as pasted: every finding rests on its elements and their values, so
// nothing can be replaced without changing the reading. A head can still
// carry a credential (a token in an inline script or a link's address), so
// before a link is offered the markup secrets check (src/lib/tools/
// html-structure-explainer/markup-secrets.ts, the site's secrets check reused
// as is) reads it: a value secret by its format blocks the link (code
// "secret", the popover names its line); a value whose name only looks like a
// secret is named in the caution line.
//
// Arrival: the text replaces the box (the page opens on an Example) as a
// paste would, and the page reads it; nothing is executed, fetched or
// rendered, as for a paste. Any non-blank text is accepted, as a paste is.
// ============================================================================

import { MAX_SHARE_CHARS } from "../../share/format"; // the bound a link may carry
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { findMarkupSecrets, type MarkupSecretReport } from "../html-structure-explainer/markup-secrets"; // the markup secrets check

/** The state: the page or head (as pasted when encoding, the link's text on arrival). */
export interface MetaOgJsonldShareState {
  /** The HTML. */
  input: string;
}

/**
 * The secrets report a share needs, or null when no link could carry the text anyway (over the bound).
 * @param input the HTML
 * @returns the report, or null
 */
export function metaOgJsonldShareSecrets(input: string): MarkupSecretReport | null {
  return input.trim() === "" || input.length > MAX_SHARE_CHARS ? null : findMarkupSecrets(input); // only what a link could carry is read
} // metaOgJsonldShareSecrets

/**
 * Encode from a report the page already made (it computes one for the button and the caution line).
 * @param s the state
 * @param report the markup secrets check's report, or null (nothing typed, or over the bound)
 * @returns the HTML, nothing, or blocked
 */
export function encodeMetaOgJsonld(s: MetaOgJsonldShareState, report: MarkupSecretReport | null): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  const block = report?.secret; // the first value secret by its format
  if (block) return { ok: false, reason: "blocked", code: "secret", values: { line: block.line, label: block.label, more: block.more } }; // no link
  return { ok: true, params: { input: s.input } }; // the HTML as pasted (over the bound, the button says so)
} // encodeMetaOgJsonld

/** The spec. */
export const META_OG_JSONLD_SHARE: ShareSpec<MetaOgJsonldShareState> = Object.freeze({
  tool: "meta-og-jsonld-inspector", // the slug
  posture: "input-caution", // the HTML as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.meta-og-jsonld-inspector.share.carries
  names: ["input"], // #input=
  /** The HTML, nothing, or blocked (the spec checks the text itself). */
  encode(s: MetaOgJsonldShareState): ShareEncoding {
    return encodeMetaOgJsonld(s, metaOgJsonldShareSecrets(s.input)); // checked, then encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): MetaOgJsonldShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
