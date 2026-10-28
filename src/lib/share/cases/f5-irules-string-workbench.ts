// ============================================================================
// src/lib/share/cases/f5-irules-string-workbench.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules string workbench: the subcommand and its fields go
// by name (no "input": the worked-on field changes with the subcommand); an
// unknown subcommand, a field of another subcommand or a misplaced -nocase
// makes the share malformed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_STRING_WORKBENCH_SHARE, type StringWorkbenchShareState } from "../../tools/f5-irules-string-workbench/share"; // the spec and its state

/** The cases. */
export const IRULES_STRING_WORKBENCH_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<StringWorkbenchShareState, StringWorkbenchShareState>>({ // typed, so the cases check as one list
  spec: IRULES_STRING_WORKBENCH_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "range-path", state: { op: "range", values: ["/login.php?user=abc", "0", "9"], nocase: false }, params: { op: "range", string: "/login.php?user=abc", first: "0", last: "9" }, restored: { op: "range", values: ["/login.php?user=abc", "0", "9"], nocase: false } }, // the page's Example
    { id: "map-nocase", state: { op: "map", values: ["{&amp;} & {&lt;} <", "a &amp; b &LT; c"], nocase: true }, params: { op: "map", mapping: "{&amp;} & {&lt;} <", string: "a &amp; b &LT; c", nocase: "1" }, restored: { op: "map", values: ["{&amp;} & {&lt;} <", "a &amp; b &LT; c"], nocase: true } }, // braces, "&" and "<" travel; -nocase carried
    { id: "first-start-index", state: { op: "first", values: ["/", "/a/b/c", "end-2"], nocase: true }, params: { op: "first", needle: "/", haystack: "/a/b/c", startindex: "end-2" }, restored: { op: "first", values: ["/", "/a/b/c", "end-2"], nocase: false } }, // -nocase ticked where first takes none: not carried
    { id: "trailing-optional-empty", state: { op: "tolower", values: ["ABC", "", ""], nocase: false }, params: { op: "tolower", string: "ABC" }, restored: { op: "tolower", values: ["ABC", "", ""], nocase: false } }, // empty optional fields left out
    { id: "replace-new-string", state: { op: "replace", values: ["abcdef", "1", "2", "XY"], nocase: false }, params: { op: "replace", string: "abcdef", first: "1", last: "2", newstring: "XY" }, restored: { op: "replace", values: ["abcdef", "1", "2", "XY"], nocase: false } }, // newString by its lower-cased name
  ],
  arrive: [ // decode only
    { id: "nocase-zero", values: { op: "equal", string1: "a", string2: "A", nocase: "0" }, restored: { op: "equal", values: ["a", "A"], nocase: false } }, // 0 is off
    { id: "middle-field-absent", values: { op: "range", string: "abc", last: "1" }, restored: { op: "range", values: ["abc", "", "1"], nocase: false } }, // an absent field is empty
  ],
  empty: [ // nothing to share
    { id: "cleared", state: { op: "range", values: ["", "", ""], nocase: false } }, // after Clear
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-op", values: { op: "reverse", string: "abc" } }, // not a subcommand the page offers (8.5 added string reverse)
    { id: "op-absent", values: { string: "abc" } }, // no subcommand
    { id: "field-of-another-op", values: { op: "range", string: "abc", needle: "b" } }, // needle belongs to first and last
    { id: "nocase-on-range", values: { op: "range", string: "abc", first: "0", last: "1", nocase: "1" } }, // range takes no -nocase
    { id: "nocase-word", values: { op: "match", pattern: "a*", string: "abc", nocase: "yes" } }, // not 1 or 0
    { id: "op-alone", values: { op: "length" } }, // nothing to fill
    { id: "prototype-name", values: { op: "constructor", string: "abc" } }, // not an own subcommand
  ],
}));
