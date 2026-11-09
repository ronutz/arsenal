// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/radius-packet-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the RADIUS packet decoder (posture "derived",
// raised on 2026-11-08b from "input-caution" with a block; the manifest's
// shareSafetyDefault stays "fragment"). A link carries, after the "#", a copy
// of the packet that shareableCopy() in compute.ts makes: the value octets of
// every attribute that hides a credential, or that would let a reader test
// guesses of the shared secret or a password offline, are replaced by zero
// octets of the same length, and so are the Authenticator when it is an MD5
// with the shared secret and any octets after the Length, so the structure
// still decodes (the rules and their RFCs are in compute.ts and the docs).
// The copy is written as hex, 16 octets a line, with "redacted=1"; the box
// goes as typed (no "redacted") when nothing in it needs zeroing or it is one
// of the RFCs' published examples, whose octets and secret the RFC prints.
// "mode=attributes" goes when the page reads attributes without the header.
// There is no reveal switch: a link never carries the hidden octets. The
// caution line says what a copy still shows: user names, NAS and client
// addresses, MAC addresses and session identifiers of a private network.
//
// Before 2026-11-08b a packet holding User-Password and the other hidden
// attributes got no link at all (code "secret"); that block is gone.
//
// Arrival (useShareArrival in RadiusPacketDecoderTool): the text fills the box
// as a paste would, the mode is set, and redacted=1 tells the page to mark the
// zeroed fields "redacted in this link" while the box holds that text. Any
// non-blank text within the bound is accepted and left to the engine, which
// refuses malformed hex with its own message exactly as a paste would be.
// ============================================================================

import { shareableCopy, MAX_INPUT, type DecodeMode, type ShareableCopy } from "./compute"; // the derived form, the bound and the mode
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state a share is made from: the box as typed, and the mode. */
export interface RadiusShareState {
  /** The text in the box. */
  input: string;
  /** Packet or attributes only. */
  mode: DecodeMode;
}

/** The state an arriving link restores: the text, the mode, and whether it is a zeroed copy. */
export interface RadiusShareArrival extends RadiusShareState {
  /** True when the link carried a copy with zeroed fields (redacted=1). */
  redacted: boolean;
}

/**
 * Encode from the copy the page already made (it computes one for the button and the popover's count line).
 * @param s the state
 * @param copy shareableCopy()'s result for the state, or null while the box is blank or refused
 * @returns the values, or nothing
 */
export function encodeRadiusShare(s: RadiusShareState, copy: ShareableCopy | null): ShareEncoding {
  if (!copy || s.input.trim() === "") return { ok: false, reason: "empty" }; // no reading: nothing to share
  const params: Record<string, string> = { input: copy.text }; // the copy, or the box as typed when nothing needs zeroing
  if (s.mode === "attributes") params.mode = "attributes"; // the mode, when not the default
  if (!copy.asTyped) params.redacted = "1"; // the arriving page marks the zeroed fields
  return { ok: true, params }; // the values
} // encodeRadiusShare

/** The spec. */
export const RADIUS_SHARE: ShareSpec<RadiusShareState, RadiusShareArrival> = Object.freeze({
  tool: "radius-packet-decoder", // the slug
  posture: "derived", // a copy with the hidden octets zeroed, never the hidden octets
  carriesKey: "share.carries", // tools.radius-packet-decoder.share.carries
  names: ["input", "mode", "redacted"], // #input=...&mode=attributes&redacted=1
  /** The copy, made by the engine itself. */
  encode(s: RadiusShareState): ShareEncoding {
    return encodeRadiusShare(s, shareableCopy({ input: s.input, mode: s.mode })); // made here
  },
  /** Any non-blank text within the bound, a known mode, and redacted absent or 1: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): RadiusShareArrival | null {
    const input = v.input; // the arriving text
    if (!input || input.trim() === "" || input.length > MAX_INPUT) return null; // nothing to fill, or over the bound
    const mode = v.mode ?? "packet"; // absent: a packet
    if (mode !== "packet" && mode !== "attributes") return null; // an unknown mode makes the whole share malformed
    const redacted = v.redacted ?? null; // absent: the box as typed
    if (redacted !== null && redacted !== "1") return null; // any other value is malformed
    return { input, mode, redacted: redacted === "1" }; // as carried
  },
});
