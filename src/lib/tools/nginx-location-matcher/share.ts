// ============================================================================
// src/lib/tools/nginx-location-matcher/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the NGINX location matcher (posture "input",
// as the inventory gives it: the manifest's "fragment", whose comment names
// nothing identifying). A link carries the box as typed (location lines, a
// `variable` line or two, and the `request` line), once the page has a walk.
// The grammar takes nothing else, so no other directive can ride along; but a
// request line can carry a query string and a `variable` line a value (a
// cookie's, a header's), so the site's check (src/lib/share/text-secrets.ts)
// reads the box first: a credential (a JWT, an Authorization value, a key)
// blocks the link and names its line, and a secret-looking name with a value
// (a `token=` argument) is named in a popover line (2026-11-01, wave 4B).
//
// Arrival: the box fills as a paste would and the page walks it (nothing is
// fetched or resolved). Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { matchLocation } from "./compute"; // the page's own matcher (it throws on a malformed line)
import { encodeCheckedBox, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface LocationShareState {
  /** The box as typed. */
  input: string;
}

/**
 * Whether the page shows a walk for a box (it parses, and has a request line).
 * @param input the box
 * @returns true when the page shows a winner and its walk
 */
export function locationHasWalk(input: string): boolean {
  if (input.trim() === "") return false; // nothing typed
  try { matchLocation(input.trim()); return true; } catch { return false; } // a parse error shows instead
} // locationHasWalk

/**
 * Encode from what the page already computed (whether it shows a walk, and the check's report).
 * @param s the state
 * @param walked true when the page shows a walk
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeLocationShare(s: LocationShareState, walked: boolean, report: ShareSecretReport): ShareEncoding {
  if (!walked) return { ok: false, reason: "empty" }; // no walk: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as typed
} // encodeLocationShare

/** The spec. */
export const LOCATION_SHARE: ShareSpec<LocationShareState> = Object.freeze({
  tool: "nginx-location-matcher", // the slug
  posture: "input", // the box as typed, after the check
  carriesKey: "share.carries", // tools.nginx-location-matcher.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec walks and checks the box itself). */
  encode(s: LocationShareState): ShareEncoding {
    const walked = locationHasWalk(s.input); // the page's walk
    return encodeLocationShare(s, walked, walked ? findShareSecrets(s.input) : { secrets: [], maybe: [], skipped: false }); // walked, checked, encoded
  },
  /** Any non-blank text: the page walks it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): LocationShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
