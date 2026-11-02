// ============================================================================
// src/lib/tools/f5xc-api-path-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC API path explainer (posture
// "input-caution", as the inventory gives it: the manifest's "manual"). A
// link carries the OpenAPI file as pasted, once the page lists at least one
// operation, with a caution line: a file names the API's paths, servers and
// schemes, and its examples can hold real values. The page reads every path,
// operation and parameter, so nothing can be cut out without changing the
// reading: a value that is a credential blocks the link instead (the site's
// check, src/lib/share/text-secrets.ts, with the F5 XC findings of
// f5xc-object-linter/xc-share-secrets.ts: a private key, an Authorization
// value, a JWT, a password in a server URL, a SecretType secret), and a
// secret-looking name with a value (an example's "apiKey") is named in the
// caution line instead (2026-11-01, wave 4B).
//
// Arrival: the box fills as a paste would and the page reads it. Any
// non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { explainSpec, type SpecView } from "./compute"; // the page's own reading
import { encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check: the encoding of a checked box
import { checkXcBox } from "../f5xc-object-linter/xc-share-secrets"; // the site's check with the F5 XC findings
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface ApiPathShareState {
  /** The box as pasted. */
  input: string;
}

/**
 * Encode from what the page already computed (its reading and the check's report).
 * @param s the state
 * @param r the page's reading, or null while the box is blank
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeApiPathShare(s: ApiPathShareState, r: SpecView | null, report: ShareSecretReport): ShareEncoding {
  if (!r || !r.recognized) return { ok: false, reason: "empty" }; // no operation listed: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as pasted
} // encodeApiPathShare

/** The spec. */
export const API_PATH_SHARE: ShareSpec<ApiPathShareState> = Object.freeze({
  tool: "f5xc-api-path-explainer", // the slug
  posture: "input-caution", // the file as pasted, with a caution line, after the check
  carriesKey: "share.carries", // tools.f5xc-api-path-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: ApiPathShareState): ShareEncoding {
    const r = s.input.trim() === "" ? null : explainSpec(s.input); // the reading
    return encodeApiPathShare(s, r, r && r.recognized ? checkXcBox(s.input) : { secrets: [], maybe: [], skipped: false }); // read, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): ApiPathShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
