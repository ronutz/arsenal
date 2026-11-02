// ============================================================================
// src/lib/share/cases/curl-command-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the curl command explainer: the command goes as a copy with
// every credential replaced by REDACTED (the tool's own share vectors pin the
// copy and that the receiving page reads the same request); a command still
// holding a secret no rule can name gets no link.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { CURL_EXPLAINER_SHARE, type CurlExplainerShareState } from "../../tools/curl-command-explainer/share"; // the spec and its state
import { SHARE_VECTORS } from "../../tools/curl-command-explainer/golden-vectors"; // the tool's own share vectors

/** The cases. */
export const CURL_EXPLAINER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<CurlExplainerShareState, CurlExplainerShareState>>({ // typed, so the cases check as one list
  spec: CURL_EXPLAINER_SHARE, // the spec
  accept: SHARE_VECTORS.filter((v) => v.expect !== null).map((v) => ({ id: v.name, state: { input: v.input }, params: { input: v.expect! }, restored: { input: v.expect! }, mustNotContain: v.secrets })), // each copy, never a credential
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // an empty box
    { id: "blank", state: { input: " \n " } }, // blanks only
  ],
  blocked: SHARE_VECTORS.filter((v) => v.residual !== undefined).map((v) => ({ id: v.name, state: { input: v.input }, code: "secret" })), // a secret no rule can name
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "   " } }, // blanks only
  ],
}));
