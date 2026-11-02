// ============================================================================
// src/lib/tools/http-message-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the HTTP message decoder (posture "derived",
// raised on 2026-10-27 from the inventory's "input-caution"): the manifest
// says a message "routinely carries a cookie or a token" (shareSafetyDefault
// "review"), and while the page masks them in its panels, its code view shows
// the message as pasted. A link carries the copy shareableMessage() in
// compute.ts makes: credentials replaced (Basic keeps its user-id, a JWT its
// header), every cookie value filled with "*" with its length kept,
// secret-named fields and the target's secret parameters replaced, and the
// body's secret members and parameters filled octet for octet, so the framing
// reads the same. The tool's own share vectors pin the copy and that the
// receiving page reads the same message (pin()'s fields, less masked values).
//
// Blocked (code "secret"): when a key or token is left that no rule can name
// (a private key in a body), the popover names its line.
//
// Arrival: the copy replaces the box (the page opens on an Example) as a
// paste would, and the page decodes it; nothing is sent or replayed. Any
// non-blank text is accepted, as a paste is.
// ============================================================================

import { shareableMessage, type ShareableMessage } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (as pasted when encoding, the copy on arrival). */
export interface MessageDecoderShareState {
  /** The raw message. */
  input: string;
}

/**
 * Encode from a copy the page already made (it computes one for the button and the count line).
 * @param s the state
 * @param copy shareableMessage's result for s.input, or null to make it here
 * @returns the copy, nothing, or blocked
 */
export function encodeMessageDecoder(s: MessageDecoderShareState, copy: ShareableMessage | null): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  const c = copy ?? shareableMessage(s.input); // the copy
  if (c.residual) return { ok: false, reason: "blocked", code: "secret", values: { line: c.residual.line, label: c.residual.label } }; // a secret no rule can name: no link
  return { ok: true, params: { input: c.text } }; // the copy, never the paste
} // encodeMessageDecoder

/** The spec. */
export const MESSAGE_DECODER_SHARE: ShareSpec<MessageDecoderShareState> = Object.freeze({
  tool: "http-message-decoder", // the slug
  posture: "derived", // the copy with every credential replaced
  carriesKey: "share.carries", // tools.http-message-decoder.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked. */
  encode(s: MessageDecoderShareState): ShareEncoding {
    return encodeMessageDecoder(s, null); // made here
  },
  /** Any non-blank text: the page decodes it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): MessageDecoderShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
