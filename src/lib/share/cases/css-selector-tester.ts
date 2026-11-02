// ============================================================================
// src/lib/share/cases/css-selector-tester.ts
// ----------------------------------------------------------------------------
// Share cases of the CSS selector tester: both boxes go as typed (`input` the
// HTML, `selectors` the selectors, an empty one left out); a value secret by
// its format in either box gets no link.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { CSS_SELECTOR_SHARE, type CssSelectorShareState } from "../../tools/css-selector-tester/share"; // the spec and its state
import { VECTORS } from "../../tools/css-selector-tester/golden-vectors"; // the page's Example is a vector

/** The page's Example (CssSelectorTesterTool's EXAMPLE_ID). */
const EXAMPLE = VECTORS.find((v) => v.id === "menu-basics")!.input; // verbatim

/** A JWS whose protected header is {"alg":"HS256"} (RFC 7515 section 7.1's compact form). */
const JWS = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl"; // header.payload.signature

/** The cases. */
export const CSS_SELECTOR_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<CssSelectorShareState, CssSelectorShareState>>({ // typed, so the cases check as one list
  spec: CSS_SELECTOR_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE.html, selectors: EXAMPLE.selectors }, params: { input: EXAMPLE.html, selectors: EXAMPLE.selectors }, restored: { input: EXAMPLE.html, selectors: EXAMPLE.selectors } }, // the page's Example
    { id: "selectors-only", state: { input: "", selectors: "p:empty\n:not(p)" }, params: { selectors: "p:empty\n:not(p)" }, restored: { input: "", selectors: "p:empty\n:not(p)" } }, // the HTML box empty: left out of the link
    { id: "html-only", state: { input: "<ul><li>a</li></ul>", selectors: "" }, params: { input: "<ul><li>a</li></ul>" }, restored: { input: "<ul><li>a</li></ul>", selectors: "" } }, // the selectors box empty
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "", selectors: "" } }, // after Clear
    { id: "blank", state: { input: " ", selectors: "\n" } }, // blanks only
  ],
  blocked: [ // a value secret by its format: no link
    { id: "url-password-in-html", state: { input: `<a href="https://admin:hunter2@intranet.example/">x</a>`, selectors: "a" }, code: "secret" }, // RFC 3986 3.2.1
    { id: "jws-in-selectors", state: { input: "<div></div>", selectors: `[data-token="${JWS}"]` }, code: "secret" }, // RFC 7515 7.1
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "absent", values: { input: null, selectors: null } }, // nothing
    { id: "blank", values: { input: " ", selectors: "  " } }, // blanks only
  ],
}));
