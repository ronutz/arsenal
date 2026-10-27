// ============================================================================
// src/lib/tools/base64/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Base64, Base32, Hex and Percent codec
// (posture "input-caution"): a link carries the box as typed, with the
// direction, the codec and the number of layers that give the output on
// screen. The tool is a sensitiveArtifact: an encoded string often hides a
// credential (HTTP Basic is base64 of user:password, RFC 7617 section 2), so
// the popover adds one caution line of its own before the standard warning.
// A derived form would defeat the tool (the text IS the result), so the
// reader decides, warned.
//
// The names: "text", "direction", "codec" and "layers", not "input". This
// page reads #input= with usePrefill (a value handed over fills the box), and
// a share that restores the box with its three choices needs an arrival of
// its own (useShareArrival); with "input" among its names both hooks would
// read the same value (ROLLOUT.md section 5). So the share uses names
// usePrefill never reads, and #input= keeps working exactly as before.
// A choice at its default (encode, base64, one layer) is left out of the link
// and restored as the default on arrival.
//
// Arrival: the choices are set and the text fills the box as a paste would;
// the page computes. An unknown direction or codec, or layers outside 1 to 3
// (the page's three buttons), makes the whole share malformed: ignored.
// ============================================================================

import { CODECS, type Codec } from "./compute"; // the offered codecs
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box and the three choices. */
export interface Base64ShareState {
  /** The box as typed. */
  text: string;
  /** Encode or decode. */
  direction: "encode" | "decode";
  /** The codec. */
  codec: Codec;
  /** How many times the codec is applied (1 to 3). */
  layers: number;
}

/** The defaults: what the page starts with, left out of a link. */
const DEFAULTS = { direction: "encode", codec: "base64", layers: 1 } as const; // the page's initial state

/** The spec. */
export const BASE64_SHARE: ShareSpec<Base64ShareState> = Object.freeze({
  tool: "base64", // the slug
  posture: "input-caution", // the text as typed, with the tool's caution line
  carriesKey: "share.carries", // tools.base64.share.carries
  names: ["text", "direction", "codec", "layers"], // names usePrefill never reads
  /** The text with the choices that differ from the defaults. */
  encode(s: Base64ShareState): ShareEncoding {
    if (s.text === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    const params: Record<string, string> = { text: s.text }; // the text, as typed (white space is data when encoding)
    if (s.direction !== DEFAULTS.direction) params.direction = s.direction; // decode
    if (s.codec !== DEFAULTS.codec) params.codec = s.codec; // another codec
    if (s.layers !== DEFAULTS.layers) params.layers = String(s.layers); // two or three layers
    return { ok: true, params } as const; // the values
  },
  /** The text and three valid choices (absent ones take the defaults). */
  decode(v: Readonly<Record<string, string | null>>): Base64ShareState | null {
    if (!v.text) return null; // nothing to fill
    const d = v.direction ?? DEFAULTS.direction; // absent: encode
    const direction: Base64ShareState["direction"] | null = d === "encode" || d === "decode" ? d : null; // the two offered
    if (direction === null) return null; // unknown: malformed
    const codec = (v.codec ?? DEFAULTS.codec) as Codec; // absent: base64
    if (!CODECS.includes(codec)) return null; // not an offered codec: malformed
    const layers = v.layers ?? String(DEFAULTS.layers); // absent: one layer
    if (layers !== "1" && layers !== "2" && layers !== "3") return null; // the page offers 1 to 3
    return { text: v.text, direction, codec, layers: Number(layers) }; // the state to fill
  },
});
