// ============================================================================
// src/lib/tools/cvss-vector-decoder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the CVSS vector decoder (posture "input"; the
// manifest: "a CVSS vector is a public severity descriptor; it carries no
// secrets or PII"). A link carries the vector as typed, once the page has
// decoded it (a vector it refuses, or one of a version it does not score, has
// no reading to share).
//
// Arrival: the vector fills the box as a paste would and the page decodes it.
// Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { parseCvssVector, type CvssParse } from "./compute"; // the page's own decoder
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface CvssShareState {
  /** The vector as typed. */
  input: string;
}

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param p the page's reading
 * @returns the vector, or nothing
 */
export function encodeCvssShare(s: CvssShareState, p: CvssParse): ShareEncoding {
  if (s.input.trim() === "" || !p.recognized) return { ok: false, reason: "empty" }; // no reading: nothing to share
  return { ok: true, params: { input: s.input } }; // the vector as typed
} // encodeCvssShare

/** The spec. */
export const CVSS_SHARE: ShareSpec<CvssShareState> = Object.freeze({
  tool: "cvss-vector-decoder", // the slug
  posture: "input", // a public severity descriptor
  carriesKey: "share.carries", // tools.cvss-vector-decoder.share.carries
  names: ["input"], // #input=
  /** The vector, or nothing (the spec decodes it itself). */
  encode(s: CvssShareState): ShareEncoding {
    return encodeCvssShare(s, parseCvssVector(s.input)); // decoded, then encoded
  },
  /** Any non-blank text: the page decodes it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): CvssShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
