// ============================================================================
// src/lib/share/cases/charset-equivalency.ts
// ----------------------------------------------------------------------------
// Share cases of the charset converter and mojibake fixer: each mode's box
// goes as typed with its own choices (defaults left out); two boxes at once,
// a choice of another mode or a value the page does not offer makes the
// share malformed. "cafe" in Text to bytes stays text: the reason this tool
// does not share through #input= (usePrefill would read it as two hex bytes).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CHARSET_EQUIVALENCY_SHARE, type CharsetShareState } from "../../tools/charset-equivalency/share"; // the spec

/** The Example of Text to bytes (vector encode-portuguese-utf8). */
const PT = "Requisição bloqueada – café"; // "Requisição bloqueada – café"

/** The cases. */
export const CHARSET_EQUIVALENCY_SHARE_CASES = defineShareCases<CharsetShareState, CharsetShareState>({
  spec: CHARSET_EQUIVALENCY_SHARE, // the spec
  accept: [
    { id: "encode-example", state: { mode: "encode", text: PT, charset: "utf-8", policy: "replace", bom: false, style: "hex" }, params: { text: PT }, restored: { mode: "encode", text: PT, charset: "utf-8", policy: "replace", bom: false, style: "hex" } }, // defaults left out
    { id: "encode-cafe-stays-text", state: { mode: "encode", text: "cafe", charset: "utf-16le", policy: "strict", bom: true, style: "python" }, params: { text: "cafe", charset: "utf-16le", policy: "strict", bom: "1", style: "python" }, restored: { mode: "encode", text: "cafe", charset: "utf-16le", policy: "strict", bom: true, style: "python" } }, // hex-looking text opens as text
    { id: "decode-hexdump", state: { mode: "decode", bytes: "00000000  52 65 71 75  |Requ|\n", format: "auto", charset: "auto", sniff: true }, params: { bytes: "00000000  52 65 71 75  |Requ|\n" }, restored: { mode: "decode", bytes: "00000000  52 65 71 75  |Requ|\n", format: "auto", charset: "auto", sniff: true } }, // a dump with "|" and line break
    { id: "decode-choices", state: { mode: "decode", bytes: "C0 AF E0 80 BF", format: "hex", charset: "utf-8", sniff: false }, params: { bytes: "C0 AF E0 80 BF", format: "hex", charset: "utf-8", sniff: "0" }, restored: { mode: "decode", bytes: "C0 AF E0 80 BF", format: "hex", charset: "utf-8", sniff: false } }, // every choice changed
    { id: "repair", state: { mode: "repair", garbled: "RequisiÃ§Ã£o" }, params: { garbled: "RequisiÃ§Ã£o" }, restored: { mode: "repair", garbled: "RequisiÃ§Ã£o" } }, // mojibake as typed
  ],
  arrive: [
    { id: "encode-defaults", values: { text: "x", bytes: null, garbled: null, charset: null, policy: null, bom: null, style: null, format: null, sniff: null }, restored: { mode: "encode", text: "x", charset: "utf-8", policy: "replace", bom: false, style: "hex" } }, // absent choices take the defaults
    { id: "decode-defaults", values: { text: null, bytes: "41", garbled: null, charset: null, policy: null, bom: null, style: null, format: null, sniff: null }, restored: { mode: "decode", bytes: "41", format: "auto", charset: "auto", sniff: true } }, // absent choices take the defaults
  ],
  empty: [
    { id: "encode-nothing", state: { mode: "encode", text: "", charset: "utf-8", policy: "replace", bom: false, style: "hex" } }, // no text
    { id: "decode-blank", state: { mode: "decode", bytes: "  ", format: "auto", charset: "auto", sniff: true } }, // no bytes
    { id: "repair-nothing", state: { mode: "repair", garbled: "" } }, // no text
  ],
  reject: [
    { id: "two-boxes", values: { text: "a", bytes: "41" } }, // two modes at once
    { id: "no-box", values: { charset: "utf-8" } }, // a choice alone
    { id: "choice-of-another-mode", values: { garbled: "Ã©", charset: "utf-8" } }, // Fix mojibake has no charset
    { id: "decode-with-policy", values: { bytes: "41", policy: "strict" } }, // the policy belongs to Text to bytes
    { id: "unknown-charset", values: { text: "a", charset: "klingon" } }, // not offered
    { id: "auto-when-encoding", values: { text: "a", charset: "auto" } }, // "auto" is for decoding only
    { id: "unknown-format", values: { bytes: "41", format: "octal" } }, // not offered
    { id: "bad-switch", values: { text: "a", bom: "yes" } }, // a switch is 1 or 0
  ],
});
