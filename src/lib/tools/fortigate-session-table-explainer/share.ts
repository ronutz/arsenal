// ============================================================================
// src/lib/tools/fortigate-session-table-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiGate session table explainer
// (posture "input-caution", raised from "input" on 2026-11-01: the manifest
// says "Session output carries internal addresses, ports and topology").
// "diagnose sys session list" output names the addresses, ports, NAT
// translations and policy of each flow, and can name an authenticated user,
// so a link carries it as pasted with a caution line. Before a link is
// offered, the box goes through the FortiOS check
// (../fortios-cli-config-explainer/fortios-secrets.ts), in case a
// configuration with credentials was pasted with the sessions: a credential
// blocks the link (code "secret"; the popover names its line); a value whose
// name only looks like a secret is named in a caution line.
//
// Arrival: the box fills as a paste would and the page reads it (nothing is
// contacted). Any non-blank text without a credential is accepted, exactly
// as a paste is; one holding a credential is a link this encoder never
// builds, and is ignored.
// ============================================================================

import { run, type SessionResult } from "./compute"; // the page's own reading (throws only on oversized input)
import { checkFortiosText, encodeFortiosBox, isSendableFortiosBox } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface SessionShareState {
  /** The box as pasted. */
  input: string;
} // SessionShareState

/**
 * Whether the page has a reading to share: at least one session read.
 * @param r the page's result, or null while there is none
 * @returns true when there is something to share
 */
export function sessionTableExplainerHasReading(r: SessionResult | null): boolean {
  return !!r && r.mode === "decode" && r.sessions.length > 0; // the page's reading
} // sessionTableExplainerHasReading

/**
 * The page's result without throwing (an oversized box is refused with a message).
 * @param input the box
 * @returns the result, or null
 */
function reading(input: string): SessionResult | null {
  try { return input.trim() === "" ? null : run(input).result; } catch { return null; } // no result
} // reading

/** The spec. */
export const FORTIGATE_SESSION_TABLE_SHARE: ShareSpec<SessionShareState> = Object.freeze({
  tool: "fortigate-session-table-explainer", // the slug
  posture: "input-caution", // the box as pasted, with a caution line of the tool's own, after the FortiOS check
  carriesKey: "share.carries", // tools.fortigate-session-table-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: SessionShareState): ShareEncoding {
    return encodeFortiosBox(s.input, sessionTableExplainerHasReading(reading(s.input)) ? checkFortiosText(s.input) : null); // read, checked, encoded
  },
  /** Any non-blank text without a credential: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): SessionShareState | null {
    return isSendableFortiosBox(v.input) ? { input: v.input } : null; // the text, or nothing
  },
});
