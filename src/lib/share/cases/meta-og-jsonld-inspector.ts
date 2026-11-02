// ============================================================================
// src/lib/share/cases/meta-og-jsonld-inspector.ts
// ----------------------------------------------------------------------------
// Share cases of the meta, Open Graph & JSON-LD inspector: the head goes as
// pasted; one holding a value secret by its format gets no link.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { META_OG_JSONLD_SHARE, type MetaOgJsonldShareState } from "../../tools/meta-og-jsonld-inspector/share"; // the spec and its state
import { VECTORS } from "../../tools/meta-og-jsonld-inspector/golden-vectors"; // the page's Example is a vector

/** The page's Example (MetaOgJsonldInspectorTool's EXAMPLE_ID). */
const EXAMPLE = VECTORS.find((v) => v.id === "full-marks")!.input.html; // verbatim

/** A head with a CSRF meta and a query in a link: nothing secret by its format. */
const HEAD = `<head>\n<meta name="csrf-param" content="authenticity_token">\n<link rel="preload" href="/app.js?v=3&amp;lang=en" as="script">\n<title>App</title>\n</head>`; // as pasted

/** A JWS whose protected header is {"alg":"HS256"} (RFC 7515 section 7.1's compact form). */
const JWS = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl"; // header.payload.signature

/** The cases. */
export const META_OG_JSONLD_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<MetaOgJsonldShareState, MetaOgJsonldShareState>>({ // typed, so the cases check as one list
  spec: META_OG_JSONLD_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the page's Example
    { id: "head-only", state: { input: HEAD }, params: { input: HEAD }, restored: { input: HEAD } }, // "&", "?", "=" in a value
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // after Clear
  ],
  blocked: [ // a value secret by its format: no link
    { id: "jws-in-meta", state: { input: `<head><meta name="api-token" content="${JWS}"></head>` }, code: "secret" }, // RFC 7515 7.1
    { id: "url-password", state: { input: `<head><link rel="canonical" href="https://editor:s3cret@cms.example/page"></head>` }, code: "secret" }, // RFC 3986 3.2.1
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
