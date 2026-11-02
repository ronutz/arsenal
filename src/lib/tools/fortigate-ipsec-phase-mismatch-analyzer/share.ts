// ============================================================================
// src/lib/tools/fortigate-ipsec-phase-mismatch-analyzer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiGate IPsec phase mismatch analyzer
// (posture "input-caution", raised from "input" on 2026-11-01: the manifest
// says "Peer names and subnets describe topology"). The box holds the page's
// directive lines (peer:, phase1:, phase2:), which name both peers and their
// protected subnets, so a link carries it as pasted with a caution line. The
// page reads no pre-shared key, but a reader describing a tunnel may write
// one (psksecret=... on a phase1 line) or paste a phase1-interface block
// beside the directives (set psksecret ..., type password-3 in the FortiOS
// 7.6.8 CLI reference): before a link is offered, the box goes through the
// FortiOS check (../fortios-cli-config-explainer/fortios-secrets.ts). A
// credential blocks the link (code "secret"; the popover names its line); a
// value whose name only looks like a secret is named in a caution line.
//
// Arrival: the box fills as a paste would and the page reads it (nothing is
// contacted). Any non-blank text without a credential is accepted, exactly
// as a paste is; one holding a credential is a link this encoder never
// builds, and is ignored.
// ============================================================================

import { run, type IpsecResult } from "./compute"; // the page's own reading (throws only on oversized input)
import { checkFortiosText, encodeFortiosBox, isSendableFortiosBox } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface IpsecShareState {
  /** The box as pasted. */
  input: string;
} // IpsecShareState

/**
 * Whether the page has a comparison to share: two peers read.
 * @param r the page's result, or null while there is none
 * @returns true when there is something to share
 */
export function ipsecPhaseMismatchAnalyzerHasReading(r: IpsecResult | null): boolean {
  return !!r && r.mode === "analyze" && r.peers.length >= 2; // the page's reading
} // ipsecPhaseMismatchAnalyzerHasReading

/**
 * The page's result without throwing (an oversized box is refused with a message).
 * @param input the box
 * @returns the result, or null
 */
function reading(input: string): IpsecResult | null {
  try { return input.trim() === "" ? null : run(input).result; } catch { return null; } // no result
} // reading

/** The spec. */
export const FORTIGATE_IPSEC_PHASE_SHARE: ShareSpec<IpsecShareState> = Object.freeze({
  tool: "fortigate-ipsec-phase-mismatch-analyzer", // the slug
  posture: "input-caution", // the box as pasted, with a caution line of the tool's own, after the FortiOS check
  carriesKey: "share.carries", // tools.fortigate-ipsec-phase-mismatch-analyzer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: IpsecShareState): ShareEncoding {
    return encodeFortiosBox(s.input, ipsecPhaseMismatchAnalyzerHasReading(reading(s.input)) ? checkFortiosText(s.input) : null); // read, checked, encoded
  },
  /** Any non-blank text without a credential: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): IpsecShareState | null {
    return isSendableFortiosBox(v.input) ? { input: v.input } : null; // the text, or nothing
  },
});
