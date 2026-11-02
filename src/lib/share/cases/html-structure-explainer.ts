// ============================================================================
// src/lib/share/cases/html-structure-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the HTML structure & DOM explainer: the HTML goes as pasted;
// a page holding a value secret by its format (a password in a URL, a JWS, a
// PEM private key) gets no link. A value that only has a secret-looking name
// still gets one (the caution line names it on the page).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { HTML_STRUCTURE_SHARE, type HtmlStructureShareState } from "../../tools/html-structure-explainer/share"; // the spec and its state
import { VECTORS } from "../../tools/html-structure-explainer/golden-vectors"; // the page's Example is a vector

/** The page's Example (HtmlStructureExplainerTool's EXAMPLE_ID). */
const EXAMPLE = VECTORS.find((v) => v.id === "table-foster-parenting")!.input.html; // verbatim

/** A page whose script has a secret-looking member name, but no value secret by its format. */
const MAYBE = `<!DOCTYPE html>\n<html lang="en"><body>\n<a href="/search?q=a&amp;page=2#top">next</a>\n<script>window.config = {"apiToken": "abc123def456"};</script>\n</body></html>`; // a maybe-secret

/** A JWS whose protected header is {"alg":"HS256"} (RFC 7515 section 7.1's compact form). */
const JWS = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl"; // header.payload.signature

/** The cases. */
export const HTML_STRUCTURE_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<HtmlStructureShareState, HtmlStructureShareState>>({ // typed, so the cases check as one list
  spec: HTML_STRUCTURE_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the page's Example
    { id: "maybe-secret", state: { input: MAYBE }, params: { input: MAYBE }, restored: { input: MAYBE } }, // a secret-looking name: the link is offered
    { id: "crlf", state: { input: "<p>one</p>\r\n<p>two</p>" }, params: { input: "<p>one</p>\r\n<p>two</p>" }, restored: { input: "<p>one</p>\r\n<p>two</p>" } }, // line endings kept
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // after Clear
  ],
  blocked: [ // a value secret by its format: no link
    { id: "url-password", state: { input: `<p><a href="https://admin:hunter2@intranet.example/status">status</a></p>` }, code: "secret" }, // RFC 3986 3.2.1
    { id: "jws-in-script", state: { input: `<script>const session = "${JWS}";</script>` }, code: "secret" }, // RFC 7515 7.1
    { id: "pem-private-key", state: { input: "<pre>-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\n-----END PRIVATE KEY-----</pre>" }, code: "secret" }, // RFC 7468 sections 10 and 11
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
