// ============================================================================
// src/lib/tools/fortios-config-diff-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiOS config diff explainer (posture
// "derived", raised from "input" on 2026-11-01; the manifest already said "a
// configuration carries ... sometimes credentials, so a shared link must
// never carry the input"). The box holds two configurations; either can hold
// a pre-shared key, a password, an SNMP community or an ENC value (the rules
// and their sources are in ../fortios-cli-config-explainer/fortios-secrets.ts).
// A link carries a COPY of the box with each such value replaced by a
// numbered mark: equal values share a number and different values do not, so
// a setting whose secret changed is still reported as changed ("psksecret:
// ENC [redacted-1] -> ENC [redacted-2]"), and one whose secret did not change
// is still not reported. Every other line, the separator and the labels stay
// as pasted. A value that runs past its line (a PEM key in quotes) blocks the
// link, as does any credential the site's check still finds in the copy. No
// reveal switch (see the CLI explainer's spec).
//
// Arrival: the copy fills the box as a paste would and the page compares the
// two sides. Any non-blank text with nothing left to replace is accepted.
// ============================================================================

import { run, type DiffResult } from "./compute"; // the page's own diff (throws only on oversized input)
import { encodeFortiosCopy, fortiosShareCopy, isFortiosCopy } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS copy and check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box with both configurations (the paste when encoding, the copy on arrival). */
export interface FortiosDiffShareState {
  /** The box as pasted. */
  input: string;
} // FortiosDiffShareState

/**
 * Whether the page has a comparison to share: two sides found and compared (a real comparison always carries its
 * standing note; a box without two sides carries only a warning).
 * @param r the page's result, or null
 * @returns true when there is a comparison
 */
export function fortiosDiffHasReading(r: DiffResult | null): boolean {
  return !!r && r.mode === "diff" && r.notes.length > 0; // compared
} // fortiosDiffHasReading

/**
 * The page's result without throwing (an oversized box is refused with a message).
 * @param input the box
 * @returns the result, or null
 */
function reading(input: string): DiffResult | null {
  try { return run(input).result; } catch { return null; } // no result
} // reading

/** The spec. */
export const FORTIOS_CONFIG_DIFF_SHARE: ShareSpec<FortiosDiffShareState> = Object.freeze({
  tool: "fortios-config-diff-explainer", // the slug
  posture: "derived", // a copy with every FortiOS secret value replaced by a numbered mark, never the paste
  carriesKey: "share.carries", // tools.fortios-config-diff-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec compares and copies the box itself). */
  encode(s: FortiosDiffShareState): ShareEncoding {
    return encodeFortiosCopy(fortiosDiffHasReading(reading(s.input)) ? fortiosShareCopy(s.input) : null); // compared, copied, checked, encoded
  },
  /** Any non-blank text with nothing left to replace: the page compares it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): FortiosDiffShareState | null {
    return v.input && v.input.trim() !== "" && isFortiosCopy(v.input) ? { input: v.input } : null; // a copy, or nothing
  },
});
