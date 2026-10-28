// ============================================================================
// src/lib/share/cases/f5-irules-style-checker.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules style checker: the box goes as pasted; an iRule
// with a key or credential written out gets no link (the iRule secrets check,
// pinned rule by rule in the command/context explainer's cases).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_STYLE_CHECKER_SHARE, type IrulesStyleCheckerShareState } from "../../tools/f5-irules-style-checker/share"; // the spec and its state
import { VECTORS } from "../../tools/f5-irules-style-checker/golden-vectors"; // the tool's own vectors

/** The page's Example (the "messy" vector, which the page opens on). */
const MESSY = VECTORS.find((v) => v.id === "messy")!.input.irule; // pinned there

/** The cases. */
export const IRULES_STYLE_CHECKER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<IrulesStyleCheckerShareState, IrulesStyleCheckerShareState>>({ // typed, so the cases check as one list
  spec: IRULES_STYLE_CHECKER_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "messy", state: { input: MESSY }, params: { input: MESSY }, restored: { input: MESSY } }, // the page's Example, tabs and all
    { id: "tabs-and-trailing-blanks", state: { input: "when HTTP_REQUEST {\n\tpool web_pool  \n}\n" }, params: { input: "when HTTP_REQUEST {\n\tpool web_pool  \n}\n" }, restored: { input: "when HTTP_REQUEST {\n\tpool web_pool  \n}\n" } }, // what the checker reads travels exactly
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "\n" } }, // a blank box
  ],
  blocked: [ // a key or credential written out: no link
    { id: "crypto-sign-variable", state: { input: `when HTTP_REQUEST {\n    set secret_key "foobar1234"\n    set data [HTTP::uri]\n    set signed_data [CRYPTO::sign -alg hmac-sha1 -key $secret_key $data]\n}` }, code: "secret" }, // CRYPTO::sign's own example
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
