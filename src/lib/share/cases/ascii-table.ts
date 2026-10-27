// ============================================================================
// src/lib/share/cases/ascii-table.ts
// ----------------------------------------------------------------------------
// Share cases of the ASCII table explorer: the look-up value goes as typed,
// as the #input= handoff usePrefill already reads (and the Unicode
// inspector's links use).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ASCII_TABLE_SHARE, type AsciiTableShareState } from "../../tools/ascii-table/share"; // the spec

/** The cases. */
export const ASCII_TABLE_SHARE_CASES = defineShareCases<AsciiTableShareState, AsciiTableShareState>({
  spec: ASCII_TABLE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "&tilde;" }, params: { input: "&tilde;" }, restored: { input: "&tilde;" } }, // the Example (vector lookup-tilde): "&" and ";" survive
    { id: "column-row", state: { input: "4/11" }, params: { input: "4/11" }, restored: { input: "4/11" } }, // RFC 20's notation
    { id: "space", state: { input: " " }, params: { input: " " }, restored: { input: " " } }, // a single space is SP
    { id: "plus", state: { input: "+" }, params: { input: "+" }, restored: { input: "+" } }, // "+" must not read as a space
    { id: "percent-form", state: { input: "%41" }, params: { input: "%41" }, restored: { input: "%41" } }, // text that looks percent-encoded stays text
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no value
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
