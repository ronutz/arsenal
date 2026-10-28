// ============================================================================
// src/lib/share/cases/f5-irules-expression-lab.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules expression lab: the expression as #input=, the set
// commands, the mode and (in iRules mode) the sample request where it differs
// from the page's own; a key or credential written out in any field gets no
// link (code "secret").
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_EXPRESSION_LAB_SHARE, type ExpressionLabShareState } from "../../tools/f5-irules-expression-lab/share"; // the spec and its state
import { DEFAULT_SAMPLE } from "../../tools/f5-irules-expression-lab/compute"; // the page's sample request

/** The sample request the page starts with. */
const S = { uri: DEFAULT_SAMPLE.uri, host: DEFAULT_SAMPLE.host }; // "/login.php?user=abc", "www.example.com"

/** The cases. */
export const IRULES_EXPRESSION_LAB_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<ExpressionLabShareState, ExpressionLabShareState>>({ // typed, so the cases check as one list
  spec: IRULES_EXPRESSION_LAB_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "octal-equality", state: { input: "$x == $y", setup: "set x 012; set y 10", mode: "tcl", ...S }, params: { input: "$x == $y", setup: "set x 012; set y 10" }, restored: { input: "$x == $y", setup: "set x 012; set y 10", mode: "tcl", ...S } }, // the page's Example: plain Tcl is not carried
    { id: "irules-host", state: { input: "[HTTP::host] ends_with \".corp.example\" && [HTTP::uri] starts_with \"/a\"", setup: "", mode: "irules", uri: DEFAULT_SAMPLE.uri, host: "app.corp.example" }, params: { input: "[HTTP::host] ends_with \".corp.example\" && [HTTP::uri] starts_with \"/a\"", mode: "irules", host: "app.corp.example" }, restored: { input: "[HTTP::host] ends_with \".corp.example\" && [HTTP::uri] starts_with \"/a\"", setup: "", mode: "irules", uri: DEFAULT_SAMPLE.uri, host: "app.corp.example" } }, // only the changed sample field; "&" and quotes travel
    { id: "tcl-mode-sample-ignored", state: { input: "1+1", setup: "", mode: "tcl", uri: "/changed", host: "changed.example" }, params: { input: "1+1" }, restored: { input: "1+1", setup: "", mode: "tcl", ...S } }, // plain Tcl reads no sample: not carried
  ],
  arrive: [ // decode only
    { id: "irules-defaults", values: { input: "[HTTP::uri] contains \"login\"", mode: "irules" }, restored: { input: "[HTTP::uri] contains \"login\"", setup: "", mode: "irules", ...S } }, // the page's sample request
  ],
  empty: [ // nothing to share
    { id: "no-expression", state: { input: " ", setup: "set x 1", mode: "tcl", ...S } }, // nothing evaluated
  ],
  blocked: [ // a key or credential written out: no link
    { id: "jwt-in-setup", state: { input: "[string length $token] > 0", setup: "set token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl", mode: "tcl", ...S }, code: "secret" }, // a JWS in the set commands
    { id: "aes-key-in-expression", state: { input: "[string length \"AES 128 e467128783ea04aba33aded4e6e457a5\"] > 0", setup: "", mode: "tcl", ...S }, code: "secret" }, // AES::encrypt's own example key
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "no-expression", values: { input: null, setup: "set x 1" } }, // nothing to evaluate
    { id: "blank-expression", values: { input: "   " } }, // only blanks
    { id: "unknown-mode", values: { input: "1", mode: "tcl86" } }, // not a mode the page offers
    { id: "sample-in-tcl-mode", values: { input: "1", host: "a.example" } }, // plain Tcl reads no sample
  ],
}));
