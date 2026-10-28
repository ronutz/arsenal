// ============================================================================
// src/lib/tools/f5-bigip-license-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP licence explainer (posture
// "derived", raised on 2026-10-27 from the inventory's "input-caution"): the
// manifest says a licence's keys and signatures "must never land in a
// shareable URL of any kind". A link carries a copy: shareableLicense() in
// compute.ts masks the registration key and every add-on key (wherever they
// stand, comments included), and the Dossier, Authorization,
// license_manager_key and pool_license_information values, keeping each
// value's shape (capitals and digits to X, small letters to x), so the
// receiving page reads the same licence with the keys shown masked (pinned by
// the tool's own share vectors). Dates, modules, features, constraints, the
// platform and the serial number stay as pasted.
//
// Arrival: the copy fills the box as a paste would, and the page reads it.
// Any non-empty text is accepted, exactly as a paste is.
// ============================================================================

import { shareableLicense } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface LicenseShareState {
  /** The licence text. */
  input: string;
}

/** The spec. */
export const LICENSE_SHARE: ShareSpec<LicenseShareState> = Object.freeze({
  tool: "f5-bigip-license-explainer", // the slug
  posture: "derived", // the copy with every key and signature masked
  carriesKey: "share.carries", // tools.f5-bigip-license-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, when the box holds something. */
  encode(s: LicenseShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    return { ok: true, params: { input: shareableLicense(s.input).text } } as const; // the copy, never the paste
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): LicenseShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
