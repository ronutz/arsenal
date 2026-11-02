// ============================================================================
// src/lib/share/cases/http-methods-comparison.ts
// ----------------------------------------------------------------------------
// Share cases of the HTTP methods comparison: the line goes as typed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { HTTP_METHODS_SHARE, type HttpMethodsShareState } from "../../tools/http-methods-comparison/share"; // the spec and its state

/** The cases. */
export const HTTP_METHODS_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<HttpMethodsShareState, HttpMethodsShareState>>({ // typed, so the cases check as one list
  spec: HTTP_METHODS_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "get vs query" }, params: { input: "get vs query" }, restored: { input: "get vs query" } }, // the page's Example
    { id: "commas", state: { input: "get,post,put" }, params: { input: "get,post,put" }, restored: { input: "get,post,put" } }, // three, comma-separated
    { id: "spaces-kept", state: { input: "  PATCH  " }, params: { input: "  PATCH  " }, restored: { input: "  PATCH  " } }, // as typed, blanks included
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // an empty field
    { id: "blank", state: { input: "   " } }, // blanks only
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "   " } }, // blanks only
  ],
}));
