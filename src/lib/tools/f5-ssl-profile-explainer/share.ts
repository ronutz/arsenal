// ============================================================================
// src/lib/tools/f5-ssl-profile-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 SSL profile explainer (posture
// "derived", raised from "input" on 2026-10-27): a link carries the profile
// as pasted with the value of every pass-phrase setting (passphrase,
// proxy-ca-passphrase) replaced by "[redacted]" (shareableProfile in
// compute.ts, pinned by the tool's own share vectors). The explainer never
// shows those values either, so the receiving page reads the same profile.
// Names, partitions, file objects and host names stay as pasted.
//
// Arrival: the copy fills the box as a paste would, and the page explains it.
// Any non-empty text is accepted, exactly as a paste is.
// ============================================================================

import { shareableProfile } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface F5SslProfileShareState {
  /** The profile text. */
  input: string;
}

/** The spec. */
export const F5_SSL_PROFILE_SHARE: ShareSpec<F5SslProfileShareState> = Object.freeze({
  tool: "f5-ssl-profile-explainer", // the slug
  posture: "derived", // the copy with every pass phrase replaced
  carriesKey: "share.carries", // tools.f5-ssl-profile-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, when the box holds something. */
  encode(s: F5SslProfileShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    return { ok: true, params: { input: shareableProfile(s.input).text } } as const; // the copy, never the paste
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): F5SslProfileShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
