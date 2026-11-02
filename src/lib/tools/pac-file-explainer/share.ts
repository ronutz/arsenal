// ============================================================================
// src/lib/tools/pac-file-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the PAC file explainer (posture
// "input-caution", raised on 2026-11-01 from the inventory's "input": the
// manifest's own comment says "A PAC can carry internal hostnames / a tenant
// id", and Netskope's Cloud Explicit Proxy page, read 2026-11-01, has the
// file return "PROXY eproxy-<Tenant Name>:8081"). A link carries the file as
// pasted, once the page reads it (an empty box shows the reference, which is
// not a result), with a caution line. The page reads every directive and
// helper call, so nothing is cut out; the site's check
// (src/lib/share/text-secrets.ts) reads the file first: a credential (a
// password in a URL, an Authorization value, a JWT, a key) blocks the link
// and names its line, and a secret-looking name with a value (a variable
// called token) is named in the caution line instead (wave 4B).
//
// Arrival: the box fills as a paste would and the page reads it (never
// evaluated). Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { run } from "./compute"; // the page's own reader (it throws on oversized input)
import { encodeCheckedBox, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface PacShareState {
  /** The box as pasted. */
  input: string;
}

/**
 * Whether the page shows a reading of a file (not the reference, not an error).
 * @param input the box
 * @returns true when the file was read
 */
export function pacHasReading(input: string): boolean {
  try { return run(input).result.mode === "parse"; } catch { return false; } // the reference or an error otherwise
} // pacHasReading

/**
 * Encode from what the page already computed (whether it read a file, and the check's report).
 * @param s the state
 * @param read true when the page read a file
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodePacShare(s: PacShareState, read: boolean, report: ShareSecretReport): ShareEncoding {
  if (!read) return { ok: false, reason: "empty" }; // the reference, or an error: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as pasted
} // encodePacShare

/** The spec. */
export const PAC_SHARE: ShareSpec<PacShareState> = Object.freeze({
  tool: "pac-file-explainer", // the slug
  posture: "input-caution", // the file as pasted, with a caution line, after the check
  carriesKey: "share.carries", // tools.pac-file-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: PacShareState): ShareEncoding {
    const read = pacHasReading(s.input); // the page's reading
    return encodePacShare(s, read, read ? findShareSecrets(s.input) : { secrets: [], maybe: [], skipped: false }); // read, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): PacShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
