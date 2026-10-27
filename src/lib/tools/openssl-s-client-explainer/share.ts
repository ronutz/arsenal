// ============================================================================
// src/lib/tools/openssl-s-client-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the openssl s_client explainer (posture
// "derived", raised from "input-caution" on 2026-10-27): a link carries the
// two boxes with every secret value replaced by "[redacted]"
// (shareableSClient in compute.ts, pinned by the tool's own share vectors):
// each Master-Key and Resumption PSK of the session blocks, and a pass
// phrase, PSK key or SRP password on a command line. A full s_client output
// nearly always holds one of the two session secrets, so a caution line
// alone would hand them on; the copy keeps everything else (hosts, the
// chain, the ticket bytes, which cannot resume a session without its
// secret), so the receiving page reads the same handshake.
//
// The names: "command" and "output", not "input". This page reads #input=
// with usePrefill (the serial console's handoff fills the output box), and a
// share that restores both boxes together needs an arrival of its own
// (useShareArrival); with "input" among its names both hooks would read the
// same value (ROLLOUT.md section 5). So the share uses names usePrefill never
// reads, and #input= keeps working exactly as before.
//
// Arrival: both boxes fill as a paste would (an absent box is emptied), and
// the page explains them. Nothing connects anywhere: the page never does.
// ============================================================================

import { shareableSClient } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape

/** The state: the two boxes (as pasted when encoding, the copy on arrival). */
export interface OpensslSClientShareState {
  /** The command box. */
  command: string;
  /** The output box. */
  output: string;
}

/**
 * Encode the boxes: the copy with every secret replaced, and how many were (for the popover's detail line).
 * @param s the two boxes as pasted
 * @returns the encoding, and the number of values replaced
 */
export function encodeSClientShare(s: OpensslSClientShareState): { encoding: ShareEncoding; redacted: number } {
  if (s.command.trim() === "" && s.output.trim() === "") return { encoding: { ok: false, reason: "empty" }, redacted: 0 }; // nothing pasted
  const copy = shareableSClient(s); // the derived form
  const params: Record<string, string> = {}; // the values, empty boxes left out
  if (copy.command.trim() !== "") params.command = copy.command; // the command box
  if (copy.output.trim() !== "") params.output = copy.output; // the output box
  return { encoding: { ok: true, params }, redacted: copy.redacted }; // the copy, never the paste
} // encodeSClientShare

/** The spec. */
export const OPENSSL_S_CLIENT_SHARE: ShareSpec<OpensslSClientShareState> = Object.freeze({
  tool: "openssl-s-client-explainer", // the slug
  posture: "derived", // the copy with every secret replaced
  carriesKey: "share.carries", // tools.openssl-s-client-explainer.share.carries
  names: ["command", "output"], // #command=...&output=..., names usePrefill never reads
  /** The copy, when either box holds something. */
  encode(s: OpensslSClientShareState): ShareEncoding {
    return encodeSClientShare(s).encoding; // the same function the page calls
  },
  /** Either box or both; an absent box is empty. */
  decode(v: Readonly<Record<string, string | null>>): OpensslSClientShareState | null {
    const command = v.command ?? ""; // absent: empty
    const output = v.output ?? ""; // absent: empty
    if (command.trim() === "" && output.trim() === "") return null; // nothing to fill
    return { command, output }; // the state to fill
  },
});
