// ============================================================================
// src/lib/tools/netskope-steering-decision-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Netskope steering decision explainer
// (posture "input-caution", as the inventory gives it; the manifest's
// "review": "specs may name internal hosts/apps"). A link carries the spec as
// typed, once the page has a decision, with a caution line: a flow and its
// exceptions name hosts, apps and domains (Netskope's steering profile page,
// read 2026-11-01, has exceptions for traffic with "personal or private
// content" and user groups synchronised from the identity provider). The
// ledger reads every line, so nothing is cut out; the site's check
// (src/lib/share/text-secrets.ts) reads the spec first: a credential blocks
// the link and names its line, a secret-looking name with a value is named in
// the caution line instead (2026-11-01, wave 4B). The grammar is strict and
// short (40 lines), so this is a guard more than a likely case.
//
// Arrival: the box fills as a paste would and the page explains it. Any
// non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { run } from "./compute"; // the page's own explainer (it throws a line-anchored error on a malformed spec)
import { encodeCheckedBox, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface SteeringDecisionShareState {
  /** The box as typed. */
  input: string;
}

/**
 * Whether the page shows a decision for a box (the spec parses).
 * @param input the box
 * @returns true when the page shows a verdict and its ledger
 */
export function steeringHasDecision(input: string): boolean {
  if (input.trim() === "") return false; // nothing typed
  try { run(input.trim()); return true; } catch { return false; } // an error shows instead
} // steeringHasDecision

/**
 * Encode from what the page already computed (whether it shows a decision, and the check's report).
 * @param s the state
 * @param decided true when the page shows a decision
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeSteeringDecisionShare(s: SteeringDecisionShareState, decided: boolean, report: ShareSecretReport): ShareEncoding {
  if (!decided) return { ok: false, reason: "empty" }; // no decision: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as typed
} // encodeSteeringDecisionShare

/** The spec. */
export const STEERING_DECISION_SHARE: ShareSpec<SteeringDecisionShareState> = Object.freeze({
  tool: "netskope-steering-decision-explainer", // the slug
  posture: "input-caution", // the spec as typed, with a caution line, after the check
  carriesKey: "share.carries", // tools.netskope-steering-decision-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec explains and checks the box itself). */
  encode(s: SteeringDecisionShareState): ShareEncoding {
    const decided = steeringHasDecision(s.input); // the page's decision
    return encodeSteeringDecisionShare(s, decided, decided ? findShareSecrets(s.input) : { secrets: [], maybe: [], skipped: false }); // explained, checked, encoded
  },
  /** Any non-blank text: the page explains it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): SteeringDecisionShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
