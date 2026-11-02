// ============================================================================
// src/lib/tools/hash-preimage-finder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the hash preimage finder (posture
// "input-caution", raised from "input" on 2026-10-27). A link carries the
// search the sender set up: the hash as typed (trimmed, as the page reads it),
// the alphabet and the maximum length. It never carries what a search found,
// and it never starts a search.
//
// Why a caution although the manifest says "A hash digest is not itself a
// secret": this page exists to show that a fast, unsalted hash of a weak input
// is the input, recovered in seconds. Whoever opens the link can press Start
// and get the same answer the sender got. A hash of a test value is the
// lesson; a hash of a real password is the password. The caution says so.
//
// Arrival: the three fields fill, any search in progress stops, and the page
// waits for Start search (the search is the compute-heavy step the reader
// must choose; ROLLOUT section 8: never run anything on arrival). A hash whose
// algorithm the page cannot tell from its length, an alphabet the page does
// not offer, or a length outside 1 to that alphabet's ceiling makes the whole
// link malformed: ignored, and stripped from the address either way.
// ============================================================================

import { CHARSETS, detectAlgorithm, type CharsetId } from "./compute"; // the engine's alphabets and its algorithm detection
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** What the page encodes and an arrival restores: the search as set up. */
export interface PreimageShareState {
  /** The target hash, trimmed (as the page reads it). */
  hash: string;
  /** The alphabet. */
  charset: CharsetId;
  /** The maximum length the search runs to (already within the alphabet's ceiling). */
  length: number;
}

/** A length in decimal: one or two digits, no sign, no leading zero. */
const LENGTH_RE = /^[1-9][0-9]?$/; // anchored: linear

/**
 * Whether a value names one of the page's alphabets.
 * @param v the value
 * @returns true for an offered alphabet id
 */
function isCharset(v: string): v is CharsetId {
  return Object.prototype.hasOwnProperty.call(CHARSETS, v); // own keys only, never "constructor"
} // isCharset

/** The spec. */
export const PREIMAGE_SHARE: ShareSpec<PreimageShareState> = Object.freeze({
  tool: "hash-preimage-finder", // the slug
  posture: "input-caution", // the search as set up, with a caution: the link is enough to repeat it
  carriesKey: "share.carries", // tools.hash-preimage-finder.share.carries
  names: ["input", "charset", "length"], // #input=<hash>&charset=digits&length=6
  /** The hash, the alphabet and the length, once the page recognises the hash. */
  encode(s: PreimageShareState): ShareEncoding {
    const hash = s.hash.trim(); // as the page reads it
    if (hash === "" || detectAlgorithm(hash) === null) return { ok: false, reason: "empty" } as const; // not a hash the page can search for
    if (!isCharset(s.charset) || !Number.isInteger(s.length) || s.length < 1 || s.length > CHARSETS[s.charset].maxLength) return { ok: false, reason: "empty" } as const; // defensive: the page never holds these
    return { ok: true, params: { input: hash, charset: s.charset, length: String(s.length) } } as const; // the search as set up
  },
  /** A hash the page recognises, an offered alphabet and a length within its ceiling. */
  decode(v: Readonly<Record<string, string | null>>): PreimageShareState | null {
    const hash = v.input; // the hash
    if (!hash || hash !== hash.trim() || detectAlgorithm(hash) === null) return null; // not one the page can search for
    const charset = v.charset; // the alphabet
    if (!charset || !isCharset(charset)) return null; // required, from the chips
    const length = v.length; // the length
    if (!length || !LENGTH_RE.test(length)) return null; // a small whole number
    const n = Number(length); // its value
    if (n > CHARSETS[charset].maxLength) return null; // over the alphabet's ceiling
    return { hash, charset, length: n }; // the state to fill
  },
});
