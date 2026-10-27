// ============================================================================
// src/lib/tools/letsencrypt-rate-limits/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Let's Encrypt rate-limit planner (posture
// "input"): a link carries the host names as typed, one per line. They are
// the names meant for certificates, which Let's Encrypt logs publicly once
// issued; the manifest already records that host names are not secrets here.
//
// Arrival: the names fill the box as a paste would, and the page plans them.
// Any non-empty text is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the names box. */
export interface LetsEncryptRateLimitsShareState {
  /** The host names as typed. */
  input: string;
}

/** The spec. */
export const LETSENCRYPT_RATE_LIMITS_SHARE: ShareSpec<LetsEncryptRateLimitsShareState> = Object.freeze({
  tool: "letsencrypt-rate-limits", // the slug
  posture: "input", // the names as typed
  carriesKey: "share.carries", // tools.letsencrypt-rate-limits.share.carries
  names: ["input"], // #input=
  /** The names, when the box holds something. */
  encode(s: LetsEncryptRateLimitsShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): LetsEncryptRateLimitsShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the names, or nothing
  },
});
