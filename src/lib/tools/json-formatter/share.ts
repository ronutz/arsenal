// ============================================================================
// src/lib/tools/json-formatter/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the JSON formatter & validator (posture
// "input-caution", raised from "input" on 2026-11-01: the manifest says "JSON
// often embeds secrets (an F5 AS3 declaration embeds passwords)"). A link
// carries the box as pasted and the three choices (mode, indent, sort: always
// written, as a form carries every field), once the page has a verdict, valid
// or not: a parse error with its line, column and pointer is a reading worth
// sending too.
//
// The box goes as pasted: the formatted text is the reading, every value
// included, so nothing can be replaced without changing it. Before a link is
// offered the JSON and YAML secrets check (./share-secrets.ts: the shared
// check, with the five members a standard defines as credentials promoted)
// reads the box: a credential blocks the link, and the popover names its line;
// a value whose name only looks like a secret ("password", "apiKey") is named
// in the caution line instead.
//
// Arrival: the text fills the box and the choices are set as the reader would
// set them, and the page formats it. Any non-blank text is accepted, as a
// paste is; an unknown choice makes the whole share malformed.
// ============================================================================

import { checkStructuredText } from "./share-secrets"; // the JSON and YAML secrets check
import { encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the shared encoding of a checked box
import type { IndentStyle } from "./compute"; // the indent choices
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box and the three choices. */
export interface JsonFormatterShareState {
  /** The JSON as pasted. */
  input: string;
  /** Pretty-print or minify. */
  mode: "pretty" | "minify";
  /** The indent (read when pretty-printing). */
  indent: IndentStyle;
  /** Sort keys. */
  sortKeys: boolean;
}

/** The indent choices, by their text in the link. */
const INDENTS: Readonly<Record<string, IndentStyle>> = Object.freeze({ "2": 2, "3": 3, "4": 4, tab: "tab" }); // the page's select

/**
 * Encode from the check's report (the page computes it once for the button and the caution line).
 * @param s the state
 * @param report the check's report on the box
 * @returns the box and the choices, nothing, or blocked
 */
export function encodeJsonFormatterShare(s: JsonFormatterShareState, report: ShareSecretReport): ShareEncoding {
  const enc = encodeCheckedBox(s.input, report); // empty, blocked, or the box as pasted
  if (!enc.ok) return enc; // nothing to share, or blocked
  return { ok: true, params: { input: s.input, mode: s.mode, indent: String(s.indent), sort: s.sortKeys ? "1" : "0" } }; // with every choice
} // encodeJsonFormatterShare

/** The spec. */
export const JSON_FORMATTER_SHARE: ShareSpec<JsonFormatterShareState> = Object.freeze({
  tool: "json-formatter", // the slug
  posture: "input-caution", // the box as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.json-formatter.share.carries
  names: ["input", "mode", "indent", "sort"], // the JSON first
  /** The box and the choices, nothing, or blocked (the spec checks the box itself). */
  encode(s: JsonFormatterShareState): ShareEncoding {
    return encodeJsonFormatterShare(s, checkStructuredText(s.input)); // checked, encoded
  },
  /** Any non-blank text and three known choices. */
  decode(v: Readonly<Record<string, string | null>>): JsonFormatterShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing to format
    if (v.mode !== "pretty" && v.mode !== "minify") return null; // an unknown mode
    const indent = v.indent !== null && Object.prototype.hasOwnProperty.call(INDENTS, v.indent) ? INDENTS[v.indent] : null; // a known indent (own keys only)
    if (indent === null || (v.sort !== "1" && v.sort !== "0")) return null; // an unknown indent or sort value
    return { input: v.input, mode: v.mode, indent, sortKeys: v.sort === "1" }; // the state
  },
});
