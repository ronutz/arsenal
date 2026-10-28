// ============================================================================
// src/lib/share/cases/f5-irules-string-extract.ts
// ----------------------------------------------------------------------------
// Share cases of the findstr, substr and getfield explainer: the string as
// #input=, the command, and the command's fields by name; an unknown command
// or a field of another command makes the share malformed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_STRING_EXTRACT_SHARE, type StringExtractShareState } from "../../tools/f5-irules-string-extract/share"; // the spec and its state

/** The cases. */
export const IRULES_STRING_EXTRACT_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<StringExtractShareState, StringExtractShareState>>({ // typed, so the cases check as one list
  spec: IRULES_STRING_EXTRACT_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "findstr-query", state: { command: "findstr", input: "/login.php?user=abcdefg&lang=en", args: ["user=", "5", "&"] }, params: { input: "/login.php?user=abcdefg&lang=en", command: "findstr", search: "user=", skip: "5", terminator: "&" }, restored: { command: "findstr", input: "/login.php?user=abcdefg&lang=en", args: ["user=", "5", "&"] } }, // the page's Example: "=", "&" and "?" travel
    { id: "getfield", state: { command: "getfield", input: "a:b:c", args: [":", "2"] }, params: { input: "a:b:c", command: "getfield", separator: ":", field: "2" }, restored: { command: "getfield", input: "a:b:c", args: [":", "2"] } }, // getfield's fields
    { id: "substr-skip-only", state: { command: "substr", input: "abcdef", args: ["2", ""] }, params: { input: "abcdef", command: "substr", skip: "2" }, restored: { command: "substr", input: "abcdef", args: ["2", ""] } }, // the optional terminator left out
  ],
  arrive: [ // decode only
    { id: "command-absent", values: { input: "x=1", search: "x=" }, restored: { command: "findstr", input: "x=1", args: ["x=", "", ""] } }, // findstr, the page's first command
  ],
  empty: [ // nothing to share
    { id: "cleared", state: { command: "findstr", input: "", args: ["", "", ""] } }, // after Clear
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-command", values: { command: "strstr", input: "abc" } }, // not one of the three
    { id: "field-of-another-command", values: { command: "getfield", input: "a:b", search: "a" } }, // search belongs to findstr
    { id: "command-alone", values: { command: "substr" } }, // nothing to fill
  ],
}));
