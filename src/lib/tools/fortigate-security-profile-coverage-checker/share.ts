// ============================================================================
// src/lib/tools/fortigate-security-profile-coverage-checker/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiGate security profile coverage
// checker (posture "input", as the inventory has it: the manifest's default
// is "full", and the box holds the page's directive lines, traffic:, ssl:,
// mode:, policy: and profiles:, which name profile kinds, not a network).
// A link carries the box as pasted. Before a link is offered, the box still
// goes through the FortiOS check
// (../fortios-cli-config-explainer/fortios-secrets.ts), in case a
// configuration was pasted beside the directives: a credential blocks the
// link (code "secret"; the popover names its line), and a value whose name
// only looks like a secret is named in one line of the popover.
//
// Arrival: the box fills as a paste would and the page reads it (nothing is
// contacted). Any non-blank text without a credential is accepted, exactly
// as a paste is; one holding a credential is a link this encoder never
// builds, and is ignored.
// ============================================================================

import { run, type CoverageResult } from "./compute"; // the page's own reading (throws only on oversized input)
import { checkFortiosText, encodeFortiosBox, isSendableFortiosBox } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface CoverageShareState {
  /** The box as pasted. */
  input: string;
} // CoverageShareState

/**
 * Whether the page has a check to share: at least one profile listed.
 * @param r the page's result, or null while there is none
 * @returns true when there is something to share
 */
export function securityProfileCoverageCheckerHasReading(r: CoverageResult | null): boolean {
  return !!r && r.mode === "check" && r.attached.length > 0; // the page's reading
} // securityProfileCoverageCheckerHasReading

/**
 * The page's result without throwing (an oversized box is refused with a message).
 * @param input the box
 * @returns the result, or null
 */
function reading(input: string): CoverageResult | null {
  try { return input.trim() === "" ? null : run(input).result; } catch { return null; } // no result
} // reading

/** The spec. */
export const FORTIGATE_PROFILE_COVERAGE_SHARE: ShareSpec<CoverageShareState> = Object.freeze({
  tool: "fortigate-security-profile-coverage-checker", // the slug
  posture: "input", // the box as pasted, with the standard warning, after the FortiOS check
  carriesKey: "share.carries", // tools.fortigate-security-profile-coverage-checker.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: CoverageShareState): ShareEncoding {
    return encodeFortiosBox(s.input, securityProfileCoverageCheckerHasReading(reading(s.input)) ? checkFortiosText(s.input) : null); // read, checked, encoded
  },
  /** Any non-blank text without a credential: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): CoverageShareState | null {
    return isSendableFortiosBox(v.input) ? { input: v.input } : null; // the text, or nothing
  },
});
