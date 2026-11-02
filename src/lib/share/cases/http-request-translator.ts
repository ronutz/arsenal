// ============================================================================
// src/lib/share/cases/http-request-translator.ts
// ----------------------------------------------------------------------------
// Share cases of the HTTP request translator: the request goes as a copy with
// every credential replaced (the body's secrets filled octet for octet); the
// tool's own share vectors pin the copy and that the receiving page reads the
// same request. A request still holding a secret no rule can name gets no link.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { REQUEST_TRANSLATOR_SHARE, type RequestTranslatorShareState } from "../../tools/http-request-translator/share"; // the spec and its state
import { SHARE_VECTORS } from "../../tools/http-request-translator/golden-vectors"; // the tool's own share vectors

/** The cases. */
export const REQUEST_TRANSLATOR_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<RequestTranslatorShareState, RequestTranslatorShareState>>({ // typed, so the cases check as one list
  spec: REQUEST_TRANSLATOR_SHARE, // the spec
  accept: SHARE_VECTORS.filter((v) => v.expect !== null).map((v) => ({ id: v.name, state: { input: v.input }, params: { input: v.expect! }, restored: { input: v.expect! }, mustNotContain: v.secrets })), // each copy, never a credential
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // an empty box
  ],
  blocked: SHARE_VECTORS.filter((v) => v.residual !== undefined).map((v) => ({ id: v.name, state: { input: v.input }, code: "secret" })), // a secret no rule can name
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "\r\n" } }, // a line ending only
  ],
}));
