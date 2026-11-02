// ============================================================================
// src/lib/tools/fortigate-ha-failover-simulator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiGate FGCP HA election simulator
// (posture "input-caution", raised from "input" on 2026-11-01: the manifest
// says "Serial numbers and hostnames are identifying", and ROLLOUT section 2
// maps such a "fragment" tool to input-caution). The box holds the page's
// directive lines (override:, member: name=..., serial=...), which name units
// and serial numbers, so a link carries it as pasted with a caution line.
// The page reads only those lines, so a "config system ha" block pasted
// beside them would travel too, with its cluster password ("password", type
// password in the FortiOS 7.6.8 CLI reference) or an ENC value: before a
// link is offered, the box goes through the FortiOS check
// (../fortios-cli-config-explainer/fortios-secrets.ts). A credential blocks
// the link (code "secret"; the popover names its line), because replacing a
// value inside a pasted box would change what was sent; a value whose name
// only looks like a secret is named in a caution line instead.
//
// Arrival: the box fills as a paste would and the page reads it (nothing is
// contacted). Any non-blank text without a credential is accepted, exactly
// as a paste is; one holding a credential is a link this encoder never
// builds, and is ignored.
// ============================================================================

import { run, type HaResult } from "./compute"; // the page's own reading (throws only on oversized input)
import { checkFortiosText, encodeFortiosBox, isSendableFortiosBox } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface HaShareState {
  /** The box as pasted. */
  input: string;
} // HaShareState

/**
 * Whether the page has an election to share: two or more members read.
 * @param r the page's result, or null while there is none
 * @returns true when there is something to share
 */
export function haFailoverSimulatorHasReading(r: HaResult | null): boolean {
  return !!r && r.mode === "simulate" && r.members.length >= 2; // the page's reading
} // haFailoverSimulatorHasReading

/**
 * The page's result without throwing (an oversized box is refused with a message).
 * @param input the box
 * @returns the result, or null
 */
function reading(input: string): HaResult | null {
  try { return input.trim() === "" ? null : run(input).result; } catch { return null; } // no result
} // reading

/** The spec. */
export const FORTIGATE_HA_FAILOVER_SHARE: ShareSpec<HaShareState> = Object.freeze({
  tool: "fortigate-ha-failover-simulator", // the slug
  posture: "input-caution", // the box as pasted, with a caution line of the tool's own, after the FortiOS check
  carriesKey: "share.carries", // tools.fortigate-ha-failover-simulator.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: HaShareState): ShareEncoding {
    return encodeFortiosBox(s.input, haFailoverSimulatorHasReading(reading(s.input)) ? checkFortiosText(s.input) : null); // read, checked, encoded
  },
  /** Any non-blank text without a credential: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): HaShareState | null {
    return isSendableFortiosBox(v.input) ? { input: v.input } : null; // the text, or nothing
  },
});
