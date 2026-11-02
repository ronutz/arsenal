// ============================================================================
// src/lib/tools/json-yaml-convert/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the JSON <-> YAML converter (posture
// "input-caution", raised from "input" on 2026-11-01: the manifest says
// "configuration often embeds secrets"). A link carries the box as pasted, the
// direction and the indent (always written, as a form carries every field),
// once the page has an answer, a conversion or a parse error.
//
// The box goes as pasted: the converted text is the reading, every value
// included. Before a link is offered the JSON and YAML secrets check
// (../json-formatter/share-secrets.ts: the shared check, with the five members
// a standard defines as credentials promoted) reads the box: a credential
// blocks the link, and the popover names its line; a value whose name only
// looks like a secret is named in the caution line instead.
//
// Arrival: the text fills the box and the choices are set as the reader would
// set them, and the page converts it. Any non-blank text is accepted, as a
// paste is; an unknown choice makes the whole share malformed.
// ============================================================================

import { checkStructuredText } from "../json-formatter/share-secrets"; // the JSON and YAML secrets check
import { encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the shared encoding of a checked box
import type { Direction, IndentWidth } from "./compute"; // the choices
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box and the two choices. */
export interface JsonYamlShareState {
  /** The source as pasted. */
  input: string;
  /** Which way to convert. */
  direction: Direction;
  /** The indent of the output. */
  indent: IndentWidth;
}

/**
 * Encode from the check's report (the page computes it once for the button and the caution line).
 * @param s the state
 * @param report the check's report on the box
 * @returns the box and the choices, nothing, or blocked
 */
export function encodeJsonYamlShare(s: JsonYamlShareState, report: ShareSecretReport): ShareEncoding {
  const enc = encodeCheckedBox(s.input, report); // empty, blocked, or the box as pasted
  if (!enc.ok) return enc; // nothing to share, or blocked
  return { ok: true, params: { input: s.input, direction: s.direction, indent: String(s.indent) } }; // with both choices
} // encodeJsonYamlShare

/** The spec. */
export const JSON_YAML_SHARE: ShareSpec<JsonYamlShareState> = Object.freeze({
  tool: "json-yaml-convert", // the slug
  posture: "input-caution", // the box as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.json-yaml-convert.share.carries
  names: ["input", "direction", "indent"], // the source first
  /** The box and the choices, nothing, or blocked (the spec checks the box itself). */
  encode(s: JsonYamlShareState): ShareEncoding {
    return encodeJsonYamlShare(s, checkStructuredText(s.input)); // checked, encoded
  },
  /** Any non-blank text and two known choices. */
  decode(v: Readonly<Record<string, string | null>>): JsonYamlShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing to convert
    if (v.direction !== "json-to-yaml" && v.direction !== "yaml-to-json") return null; // an unknown direction
    if (v.indent !== "2" && v.indent !== "4") return null; // an unknown indent
    return { input: v.input, direction: v.direction, indent: v.indent === "4" ? 4 : 2 }; // the state
  },
});
