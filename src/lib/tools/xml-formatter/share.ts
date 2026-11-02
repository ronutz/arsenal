// ============================================================================
// src/lib/tools/xml-formatter/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the XML formatter & validator (posture
// "input-caution", the inventory's: the manifest says "XML often carries
// tokens, assertions, internal host names and personal data"). A link carries
// the document as pasted and the three choices (mode, indent, comments: always
// written, as a form carries every field), once the page has a verdict,
// well-formed or not: a failing line with its code is a reading worth sending.
//
// The document goes as pasted: the formatted text is the reading. Before a
// link is offered the XML decoder's secrets check reads it (src/lib/tools/
// xml-decoder/share.ts, checkXmlText: the shared check, plus a WS-Security
// UsernameToken Password and a signed or encrypted SAML assertion as
// credentials, and secret-looking element and attribute names as maybe), so
// the two XML tools judge a document the same way: a credential blocks the
// link and the popover names its line; a secret-looking name is named in the
// caution line instead. The page's own Example, an unsigned SAML-like
// Response, holds none and goes.
//
// Arrival: the text fills the box and the choices are set as the reader would
// set them, and the page checks and formats it, locally (no entity is
// expanded, nothing is fetched). Any non-blank text is accepted, as a paste
// is; an unknown choice makes the whole share malformed.
// ============================================================================

import { checkXmlText } from "../xml-decoder/share"; // the XML secrets check, shared with the XML decoder
import { encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the shared encoding of a checked box
import type { IndentStyle } from "./compute"; // the indent choices
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box and the three choices. */
export interface XmlFormatterShareState {
  /** The document as pasted. */
  input: string;
  /** Pretty-print or minify. */
  mode: "pretty" | "minify";
  /** The indent (read when pretty-printing). */
  indent: IndentStyle;
  /** Keep or drop comments. */
  comments: "keep" | "drop";
}

/**
 * Encode from the check's report (the page computes it once for the button and the caution line).
 * @param s the state
 * @param report the check's report on the box
 * @returns the box and the choices, nothing, or blocked
 */
export function encodeXmlFormatterShare(s: XmlFormatterShareState, report: ShareSecretReport): ShareEncoding {
  const enc = encodeCheckedBox(s.input, report); // empty, blocked, or the box as pasted
  if (!enc.ok) return enc; // nothing to share, or blocked
  return { ok: true, params: { input: s.input, mode: s.mode, indent: String(s.indent), comments: s.comments } }; // with every choice
} // encodeXmlFormatterShare

/** The spec. */
export const XML_FORMATTER_SHARE: ShareSpec<XmlFormatterShareState> = Object.freeze({
  tool: "xml-formatter", // the slug
  posture: "input-caution", // the document as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.xml-formatter.share.carries
  names: ["input", "mode", "indent", "comments"], // the document first
  /** The box and the choices, nothing, or blocked (the spec checks the box itself). */
  encode(s: XmlFormatterShareState): ShareEncoding {
    return encodeXmlFormatterShare(s, s.input.trim() === "" ? { secrets: [], maybe: [], skipped: false } : checkXmlText(s.input)); // checked, encoded
  },
  /** Any non-blank text and three known choices. */
  decode(v: Readonly<Record<string, string | null>>): XmlFormatterShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing to format
    if (v.mode !== "pretty" && v.mode !== "minify") return null; // an unknown mode
    if (v.indent !== "2" && v.indent !== "4" && v.indent !== "tab") return null; // an unknown indent
    if (v.comments !== "keep" && v.comments !== "drop") return null; // an unknown comments choice
    return { input: v.input, mode: v.mode, indent: v.indent === "tab" ? "tab" : v.indent === "4" ? 4 : 2, comments: v.comments }; // the state
  },
});
