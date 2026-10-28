// ============================================================================
// src/lib/tools/f5-eth-trailer-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 Ethernet trailer decoder (posture
// "input", with two blocked cases): a link carries the trailer text as pasted
// (the Wireshark view, or the trailer's header bytes alone), but never what
// this page refuses to decode.
//   - "tls-secrets": the page found a TLS provider section, or the text names
//     a secret or a keylog entry. Wireshark's f5ethtrailer fields (display
//     filter reference, read 2026-10-27) include f5ethtrailer.tls.master_secret,
//     the client and server traffic secrets and f5ethtrailer.tls.keylog: the
//     keys to the capture's own TLS sessions. Removing them would change what
//     the page says (it warns about that section), so there is no link at all.
//   - "raw-bytes": pasted bytes (the page's hex reading) that hold more than
//     the trailer's header (magic, length and version, 8 bytes in Wireshark's
//     field list). The page reads only that header; the rest can be the
//     packet's own data or the trailer's provider sections, TLS secrets
//     included, which it never reads, so no link carries them.
// The hex test here repeats the engine's own (the same normalisation and the
// same ratio), so it applies exactly when the page reads the paste as bytes.
//
// Arrival: the text fills the box as a paste would, and the page decodes it.
// Any non-empty text is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The magic that opens an F5 Ethernet trailer, as the engine searches for it. */
const MAGIC = "f5deb0f5"; // 0xf5deb0f5
/** Hex digits in the header the page reads: the magic (4 bytes), the length (2) and the version (2). */
const HEADER_HEX = 16; // 8 bytes

/** Words that name a TLS secret or a keylog entry in a pasted dissector view. */
const RE_SECRET_WORDS = /secret|keylog/i; // two literals: linear

/** The state to encode: the box, and whether the page found a TLS provider section in it. */
export interface TrailerShareState {
  /** The text as pasted. */
  input: string;
  /** The page's result.tlsProviderPresent. */
  tls: boolean;
}

/** The state an arrival restores: the box. */
export interface TrailerArrival {
  /** The text for the box. */
  input: string;
}

/**
 * Whether the page reads this paste as bytes and the bytes hold more than the trailer's header.
 * @param input the text as pasted
 * @returns true when a link would carry bytes the page never reads
 */
export function holdsUnreadBytes(input: string): boolean {
  const raw = input.trim(); // as the engine trims it
  const hex = raw.replace(/0x/gi, "").replace(/[^0-9a-fA-F]/g, "").toLowerCase(); // the engine's normalisation
  const looksHex = hex.length >= 16 && hex.length / raw.replace(/\s/g, "").length > 0.6; // the engine's test
  if (!looksHex) return false; // read as text, not bytes
  return !(hex.startsWith(MAGIC) && hex.length <= HEADER_HEX); // anything but the header alone
} // holdsUnreadBytes

/** The spec. */
export const ETH_TRAILER_SHARE: ShareSpec<TrailerShareState, TrailerArrival> = Object.freeze({
  tool: "f5-eth-trailer-decoder", // the slug
  posture: "input", // the text as pasted; blocked for secrets and unread bytes
  carriesKey: "share.carries", // tools.f5-eth-trailer-decoder.share.carries
  names: ["input"], // #input=
  /** The text, unless it holds TLS secrets or bytes the page does not read. */
  encode(s: TrailerShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    if (s.tls || RE_SECRET_WORDS.test(s.input)) return { ok: false, reason: "blocked", code: "tls-secrets" } as const; // session keys: no link
    if (holdsUnreadBytes(s.input)) return { ok: false, reason: "blocked", code: "raw-bytes" } as const; // packet data or provider sections: no link
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): TrailerArrival | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
