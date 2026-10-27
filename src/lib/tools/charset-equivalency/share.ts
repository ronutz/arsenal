// ============================================================================
// src/lib/tools/charset-equivalency/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the charset converter and mojibake fixer
// (posture "input"): a link carries the mode the reader is in, its box as
// typed and the mode's own choices, so the receiving page shows the same
// report. One box per mode, and the box's name says the mode:
//   Text to bytes   text, with charset, policy (what happens to characters
//                   the charset cannot hold), bom (1 or 0) and style (the byte
//                   notation);
//   Bytes to text   bytes, with format, charset ("auto" or a charset) and
//                   sniff (whether a byte order mark decides, 1 or 0);
//   Fix mojibake    garbled.
// A choice at the page's default is left out of the link and restored as the
// default on arrival (Text to bytes: utf-8, replace, no BOM, hex; Bytes to
// text: auto, auto, BOM honoured).
//
// The names are not "input". This page reads #input= with usePrefill, whose
// apply picks the mode from the look of the value (mojibake pairs, bytes or
// text), and a text such as "cafe" reads as two hex bytes: a share through
// #input= would open some texts in the wrong mode. A share of its own
// (useShareArrival, with names usePrefill never reads) opens exactly the
// sender's mode, and #input= keeps working exactly as before.
//
// Arrival: the mode is set, its box fills as a paste would and its choices
// are set; the page computes. Two boxes at once, a choice of another mode, or
// a value the page does not offer makes the whole share malformed: ignored.
// ============================================================================

import { BYTE_STYLES, CHARSETS, type ByteFormat, type ByteStyle, type CharsetId, type Unencodable } from "./compute"; // the offered values
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The input formats the page offers for bytes (its format select). */
const FORMATS: readonly ByteFormat[] = ["auto", "hex", "escaped", "percent", "base64"]; // as the page lists them
/** The policies the page offers for characters a charset cannot hold (its policy select). */
const POLICIES: readonly Unencodable[] = ["replace", "html", "strict"]; // as the page lists them

/** The state: one mode and its box and choices. */
export type CharsetShareState =
  | { mode: "encode"; text: string; charset: CharsetId; policy: Unencodable; bom: boolean; style: ByteStyle } // Text to bytes
  | { mode: "decode"; bytes: string; format: ByteFormat; charset: CharsetId | "auto"; sniff: boolean } // Bytes to text
  | { mode: "repair"; garbled: string }; // Fix mojibake

/** The names each mode may carry. */
const MODE_NAMES = { encode: ["text", "charset", "policy", "bom", "style"], decode: ["bytes", "format", "charset", "sniff"], repair: ["garbled"] } as const; // per mode

/** A switch: "1" or "0", or the default when absent; null when it is anything else. */
function readSwitch(v: string | null | undefined, dflt: boolean): boolean | null {
  if (v === null || v === undefined) return dflt; // absent: the default
  return v === "1" ? true : v === "0" ? false : null; // the two forms, or malformed
} // readSwitch

/** The spec. */
export const CHARSET_EQUIVALENCY_SHARE: ShareSpec<CharsetShareState> = Object.freeze({
  tool: "charset-equivalency", // the slug
  posture: "input", // the box as typed
  carriesKey: "share.carries", // tools.charset-equivalency.share.carries (it names the mode)
  names: ["text", "bytes", "garbled", "charset", "policy", "bom", "style", "format", "sniff"], // names usePrefill never reads
  /** The mode's box with the choices that differ from the defaults. */
  encode(s: CharsetShareState): ShareEncoding {
    if (s.mode === "encode") { // Text to bytes
      if (s.text === "") return { ok: false, reason: "empty" } as const; // nothing typed
      const params: Record<string, string> = { text: s.text }; // the text as typed
      if (s.charset !== "utf-8") params.charset = s.charset; // another charset
      if (s.policy !== "replace") params.policy = s.policy; // another policy
      if (s.bom) params.bom = "1"; // a byte order mark
      if (s.style !== "hex") params.style = s.style; // another notation
      return { ok: true, params } as const; // the values
    } // encode
    if (s.mode === "decode") { // Bytes to text
      if (s.bytes.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed
      const params: Record<string, string> = { bytes: s.bytes }; // the bytes as typed
      if (s.format !== "auto") params.format = s.format; // a named format
      if (s.charset !== "auto") params.charset = s.charset; // a chosen charset
      if (!s.sniff) params.sniff = "0"; // the BOM does not decide
      return { ok: true, params } as const; // the values
    } // decode
    if (s.garbled === "") return { ok: false, reason: "empty" } as const; // nothing typed
    return { ok: true, params: { garbled: s.garbled } } as const; // Fix mojibake: the text alone
  },
  /** Exactly one box, only its mode's choices, each one the page offers. */
  decode(v: Readonly<Record<string, string | null>>): CharsetShareState | null {
    const boxes = (["text", "bytes", "garbled"] as const).filter((n) => !!v[n]); // the boxes present (a link never carries an empty value)
    if (boxes.length !== 1) return null; // none, or two modes at once: malformed
    const mode = boxes[0] === "text" ? "encode" : boxes[0] === "bytes" ? "decode" : "repair"; // the box names the mode
    const allowed: readonly string[] = MODE_NAMES[mode]; // the names this mode may carry
    if (Object.keys(v).some((n) => !!v[n] && !allowed.includes(n))) return null; // a choice of another mode: malformed
    if (mode === "encode") { // Text to bytes
      const charset = (v.charset ?? "utf-8") as CharsetId; // absent: UTF-8
      const policy = (v.policy ?? "replace") as Unencodable; // absent: replace
      const style = (v.style ?? "hex") as ByteStyle; // absent: hex
      const bom = readSwitch(v.bom, false); // absent: no BOM
      if (!CHARSETS.includes(charset) || !POLICIES.includes(policy) || !BYTE_STYLES.includes(style) || bom === null) return null; // not offered: malformed
      return { mode, text: v.text as string, charset, policy, bom, style }; // the state
    } // encode
    if (mode === "decode") { // Bytes to text
      const format = (v.format ?? "auto") as ByteFormat; // absent: detect
      const charset = (v.charset ?? "auto") as CharsetId | "auto"; // absent: detect
      const sniff = readSwitch(v.sniff, true); // absent: the BOM decides
      if (!FORMATS.includes(format) || (charset !== "auto" && !CHARSETS.includes(charset)) || sniff === null) return null; // not offered: malformed
      return { mode, bytes: v.bytes as string, format, charset, sniff }; // the state
    } // decode
    return { mode, garbled: v.garbled as string }; // Fix mojibake
  },
});
