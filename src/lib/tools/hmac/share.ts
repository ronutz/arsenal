// ============================================================================
// src/lib/tools/hmac/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the HMAC tool (posture "derived", raised from
// "input-caution" on 2026-10-27). An HMAC key is a key: RFC 2104 section 3
// asks for keys "chosen at random" and "periodically refreshed", and anyone
// holding it can compute a valid MAC for any message. So a link carries the
// message as typed and the algorithm, and never the key: the reader of the
// link types the key they share with the sender and gets the same MAC. The
// MAC itself is not carried either: beside the message it would let anyone
// test guesses of a weak key offline, and the reader's page computes it.
//
// One exception: the key "Jefe" goes too. It is the published test key of
// RFC 4231's test case 2 (and RFC 2202's), which the page's Example uses, so a
// link built from the Example opens on the same MAC.
//
// Arrival: the message and the algorithm fill the page; the key box takes the
// published key when one arrives and otherwise keeps what the reader typed
// (on a fresh page it is empty, and the page says the key never travels).
// The MAC is computed with Web Crypto in the browser, as for a paste. An
// algorithm the page does not offer, or a key that is not the published one,
// makes the whole link malformed: ignored, and stripped either way.
// ============================================================================

import { HMAC_ALGORITHMS, type HmacAlgorithm } from "./compute"; // the engine's choices
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** RFC 4231 test case 2's key (also RFC 2202's): the only key a link may carry. */
export const HMAC_PUBLISHED_KEY = "Jefe"; // 4a656665, printed in the RFCs; the page's Example

/** The algorithm a link leaves out (the page's default). */
const DEFAULT_ALGORITHM: HmacAlgorithm = "SHA-256"; // HMAC_ALGORITHMS[0]

/** What the page encodes: its three fields, and whether it shows a MAC. */
export interface HmacShareInput {
  /** The message as typed. */
  message: string;
  /** The key as typed (carried only when it is the published test key). */
  key: string;
  /** The algorithm. */
  algorithm: HmacAlgorithm;
  /** True when the page shows a MAC (both fields filled). */
  hasResult: boolean;
}

/** What an arrival restores. */
export interface HmacShareState {
  /** The message. */
  message: string;
  /** The algorithm. */
  algorithm: HmacAlgorithm;
  /** The published test key, or null when the link carried no key (the box keeps its value). */
  key: string | null;
}

/** The spec. */
export const HMAC_SHARE: ShareSpec<HmacShareInput, HmacShareState> = Object.freeze({
  tool: "hmac", // the slug
  posture: "derived", // the message and the algorithm, never the key (but RFC 4231's test key)
  carriesKey: "share.carries", // tools.hmac.share.carries
  names: ["input", "algorithm", "key"], // #input=<message>&algorithm=SHA-512&key=Jefe
  /** The message, the algorithm when not the default, and the published key. */
  encode(s: HmacShareInput): ShareEncoding {
    if (!s.hasResult || s.message === "") return { ok: false, reason: "empty" } as const; // no MAC: nothing to share
    const p: Record<string, string> = { input: s.message }; // the message as typed
    if (s.algorithm !== DEFAULT_ALGORITHM) p.algorithm = s.algorithm; // the default is left out
    if (s.key === HMAC_PUBLISHED_KEY) p.key = s.key; // only the RFC's test key
    return { ok: true, params: p } as const; // the values
  },
  /** A message, an offered algorithm, and no key but the published one. */
  decode(v: Readonly<Record<string, string | null>>): HmacShareState | null {
    const message = v.input; // the message
    if (!message) return null; // required
    const algorithm = v.algorithm === null || v.algorithm === undefined ? DEFAULT_ALGORITHM : HMAC_ALGORITHMS.find((a) => a === v.algorithm); // absent: the default
    if (algorithm === undefined) return null; // not offered
    const key = v.key ?? null; // a key, if any
    if (key !== null && key !== HMAC_PUBLISHED_KEY) return null; // a real key never opens
    return { message, algorithm, key }; // the state to fill
  },
});
