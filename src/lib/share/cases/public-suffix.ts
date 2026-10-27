// ============================================================================
// src/lib/share/cases/public-suffix.ts
// ----------------------------------------------------------------------------
// Share cases of the registered domain (eTLD+1) tool: the host name goes as
// typed, alone.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PUBLIC_SUFFIX_SHARE } from "../../tools/public-suffix/share"; // the spec

/** The cases. */
export const PUBLIC_SUFFIX_SHARE_CASES = defineShareCases(Object.freeze({
  spec: PUBLIC_SUFFIX_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: "www.blog.example.co.uk" }, params: { input: "www.blog.example.co.uk" }, restored: { input: "www.blog.example.co.uk" } }, // the page's Example
    { id: "private-section", state: { input: "user.github.io" }, params: { input: "user.github.io" }, restored: { input: "user.github.io" } }, // a PRIVATE-section rule
    { id: "idn", state: { input: "café.example.com.br" }, params: { input: "café.example.com.br" }, restored: { input: "café.example.com.br" } }, // a non-ASCII label travels percent-encoded
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank field
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " " } }, // only a space
  ],
}));
