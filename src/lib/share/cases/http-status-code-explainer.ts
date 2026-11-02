// ============================================================================
// src/lib/share/cases/http-status-code-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the HTTP status code explainer: the box goes as typed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { HTTP_STATUS_SHARE, type HttpStatusShareState } from "../../tools/http-status-code-explainer/share"; // the spec and its state

/** The cases. */
export const HTTP_STATUS_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<HttpStatusShareState, HttpStatusShareState>>({ // typed, so the cases check as one list
  spec: HTTP_STATUS_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "301 302 307 502 503 504" }, params: { input: "301 302 307 502 503 504" }, restored: { input: "301 302 307 502 503 504" } }, // the page's Example
    { id: "family", state: { input: "5xx" }, params: { input: "5xx" }, restored: { input: "5xx" } }, // a family
    { id: "lines", state: { input: "418\n429" }, params: { input: "418\n429" }, restored: { input: "418\n429" } }, // one per line
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // an empty box
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " \n " } }, // blanks only
  ],
}));
