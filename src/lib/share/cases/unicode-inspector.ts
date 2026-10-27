// ============================================================================
// src/lib/share/cases/unicode-inspector.ts
// ----------------------------------------------------------------------------
// Share cases of the Unicode inspector: each mode's box goes as typed with
// its own choices (defaults left out); the hidden characters the inspector
// exists to reveal (bidirectional controls, zero-width characters,
// combining marks) survive the link exactly.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { UNICODE_INSPECTOR_SHARE, type UnicodeShareState } from "../../tools/unicode-inspector/share"; // the spec
import { DEFAULT_CLEAN } from "../../tools/unicode-inspector/compute"; // the cleaning defaults

/** The Example of Inspect a text (vector inspect-trojan-source): RLO, LRI and PDI controls. */
const TROJAN = 'if access_level != "user‮ ⁦// Check if admin⁩ ⁦" {'; // the Trojan Source pattern

/** The cases. */
export const UNICODE_INSPECTOR_SHARE_CASES = defineShareCases<UnicodeShareState, UnicodeShareState>({
  spec: UNICODE_INSPECTOR_SHARE, // the spec
  accept: [
    { id: "inspect-example", state: { mode: "inspect", text: TROJAN, clean: { ...DEFAULT_CLEAN }, escape: "json" }, params: { text: TROJAN }, restored: { mode: "inspect", text: TROJAN, clean: { ...DEFAULT_CLEAN }, escape: "json" } }, // the controls survive
    { id: "inspect-choices", state: { mode: "inspect", text: "Hi there​!", clean: { removeInvisible: false, asciiSpaces: true, asciiPunctuation: false, foldLookalikes: true }, escape: "python" }, params: { text: "Hi there​!", invisible: "0", punct: "0", fold: "1", escape: "python" }, restored: { mode: "inspect", text: "Hi there​!", clean: { removeInvisible: false, asciiSpaces: true, asciiPunctuation: false, foldLookalikes: true }, escape: "python" } }, // a zero-width space, three switches changed
    { id: "codepoint", state: { mode: "codepoint", cp: "U+202E" }, params: { cp: "U+202E" }, restored: { mode: "codepoint", cp: "U+202E" } }, // "+" must not read as a space
    { id: "search", state: { mode: "search", query: "zero width" }, params: { query: "zero width" }, restored: { mode: "search", query: "zero width" } }, // the search Example
    { id: "normalise-compare", state: { mode: "normalise", norm: "café", compare: "café" }, params: { norm: "café", compare: "café" }, restored: { mode: "normalise", norm: "café", compare: "café" } }, // precomposed against decomposed, kept apart
    { id: "normalise-alone", state: { mode: "normalise", norm: "é", compare: "" }, params: { norm: "é" }, restored: { mode: "normalise", norm: "é", compare: "" } }, // a combining mark alone
  ],
  arrive: [
    { id: "inspect-defaults", values: { text: "x", cp: null, query: null, norm: null, compare: null, invisible: null, spaces: null, punct: null, fold: null, escape: null }, restored: { mode: "inspect", text: "x", clean: { ...DEFAULT_CLEAN }, escape: "json" } }, // absent choices take the defaults
  ],
  empty: [
    { id: "inspect-nothing", state: { mode: "inspect", text: "", clean: { ...DEFAULT_CLEAN }, escape: "json" } }, // no text
    { id: "codepoint-blank", state: { mode: "codepoint", cp: " " } }, // no code point
    { id: "search-blank", state: { mode: "search", query: "" } }, // no words
    { id: "normalise-only-compare", state: { mode: "normalise", norm: "", compare: "abc" } }, // the second text alone
  ],
  reject: [
    { id: "two-boxes", values: { text: "a", cp: "U+0041" } }, // two modes at once
    { id: "compare-alone", values: { compare: "abc" } }, // the second text without the first
    { id: "switch-in-search", values: { query: "space", fold: "1" } }, // a choice of another mode
    { id: "bad-switch", values: { text: "a", invisible: "true" } }, // a switch is 1 or 0
    { id: "unknown-escape", values: { text: "a", escape: "rust" } }, // not offered
    { id: "codepoint-too-long", values: { cp: "U+".padEnd(201, "0") } }, // longer than the field holds
    { id: "query-too-long", values: { query: "a".repeat(121) } }, // longer than the field holds
  ],
});
