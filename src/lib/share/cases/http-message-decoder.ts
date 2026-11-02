// ============================================================================
// src/lib/share/cases/http-message-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the HTTP message decoder: the message goes as a copy with
// every credential replaced, cookie values and the body's secrets filled with
// their lengths kept; the tool's own share vectors pin the copy and that the
// receiving page reads the same message. A message still holding a secret no
// rule can name gets no link.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { MESSAGE_DECODER_SHARE, type MessageDecoderShareState } from "../../tools/http-message-decoder/share"; // the spec and its state
import { SHARE_VECTORS } from "../../tools/http-message-decoder/golden-vectors"; // the tool's own share vectors

/** The cases. */
export const MESSAGE_DECODER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<MessageDecoderShareState, MessageDecoderShareState>>({ // typed, so the cases check as one list
  spec: MESSAGE_DECODER_SHARE, // the spec
  accept: SHARE_VECTORS.filter((v) => v.expect !== null).map((v) => ({ id: v.id, state: { input: v.input }, params: { input: v.expect! }, restored: { input: v.expect! }, mustNotContain: v.secrets })), // each copy, never a credential
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // after Clear
  ],
  blocked: SHARE_VECTORS.filter((v) => v.residual !== undefined).map((v) => ({ id: v.id, state: { input: v.input }, code: "secret" })), // a secret no rule can name
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "  " } }, // blanks only
  ],
}));
