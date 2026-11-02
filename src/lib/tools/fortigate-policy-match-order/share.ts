// ============================================================================
// src/lib/tools/fortigate-policy-match-order/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiGate policy match-order explainer
// (posture "input-caution", raised from "input" on 2026-11-01). The page
// takes an ordered policy list, one policy per line (id | srcintf | dstintf
// | srcaddr | dstaddr | service | action), and an optional packet line: the
// interfaces, address objects and services of a firewall's policy, the same
// kind of input as the policy lookup explainer, whose manifest says "a
// policy list carries internal interface names, object names and topology"
// (and the PAN-OS rulebase tool took input-caution on the same ground, wave
// 1A). A link carries both fields as typed (input = the policies, packet =
// the packet line, left out when empty), with a caution line. Before a link
// is offered, both fields go through the FortiOS check
// (../fortios-cli-config-explainer/fortios-secrets.ts): a credential blocks
// the link (code "secret"; the popover names the field and line), and a
// value whose name only looks like a secret is named in a caution line.
//
// Arrival: both fields fill as typed and the page reads them (nothing is
// contacted); a packet the link does not carry leaves the field empty. Any
// non-blank policy list without a credential is accepted, as a paste is.
// ============================================================================

import { checkFortiosText, isSendableFortiosBox } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check
import { blockedBySecret, firstSharePlace, type ShareSecretFinding, type SharePlace } from "../../share/text-secrets"; // the shared check's places
import { MAX_SHARE_CHARS } from "../../share/format"; // the link bound
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the two fields. */
export interface PolicyMatchShareState {
  /** The policy list, one policy per line, as typed. */
  input: string;
  /** The packet line, as typed (empty when none). */
  packet: string;
} // PolicyMatchShareState

/** What the check found in both fields, each finding tagged with its field ("input" or "packet"). */
export interface PolicyMatchShareCheck {
  /** Credentials, policies first. */
  secrets: (ShareSecretFinding & { field: string })[];
  /** Values whose name looks like a secret, policies first. */
  maybe: (ShareSecretFinding & { field: string })[];
} // PolicyMatchShareCheck

/**
 * Whether the page has a reading to share: it reads every non-blank line of the list as a policy.
 * @param s the fields
 * @returns true when the list holds anything
 */
export function policyMatchHasReading(s: PolicyMatchShareState): boolean {
  return s.input.trim() !== ""; // at least one policy line
} // policyMatchHasReading

/**
 * Check both fields (the page calls this once per change, for the button and its popover).
 * @param s the fields
 * @returns the findings of both fields; nothing when together they are over the link bound (no link can carry them)
 */
export function checkPolicyMatch(s: PolicyMatchShareState): PolicyMatchShareCheck {
  if (s.input.length + s.packet.length > MAX_SHARE_CHARS) return { secrets: [], maybe: [] }; // no link can carry them: not read
  const a = checkFortiosText(s.input); // the policies
  const b = checkFortiosText(s.packet); // the packet line
  const tag = (field: string) => (f: ShareSecretFinding) => ({ ...f, field }); // a finding with its field
  return { secrets: [...a.secrets.map(tag("input")), ...b.secrets.map(tag("packet"))], maybe: [...a.maybe.map(tag("input")), ...b.maybe.map(tag("packet"))] }; // both
} // checkPolicyMatch

/**
 * The first secret-looking name, for the caution line.
 * @param c the check
 * @returns its place, or null
 */
export function policyMatchMaybe(c: PolicyMatchShareCheck): SharePlace | null {
  return firstSharePlace(c.maybe); // field, line, label, more
} // policyMatchMaybe

/**
 * Encode from what the page already computed.
 * @param s the fields
 * @param c the check on both fields, or null while there is no reading
 * @returns the fields, nothing, or blocked (code "secret", with the field, line, label and how many more)
 */
export function encodePolicyMatch(s: PolicyMatchShareState, c: PolicyMatchShareCheck | null): ShareEncoding {
  if (!c) return { ok: false, reason: "empty" }; // nothing to share
  return blockedBySecret(c.secrets) ?? { ok: true, params: { input: s.input, packet: s.packet } }; // blocked, or both fields (an empty packet is left out of the link)
} // encodePolicyMatch

/** The spec. */
export const FORTIGATE_POLICY_MATCH_SHARE: ShareSpec<PolicyMatchShareState> = Object.freeze({
  tool: "fortigate-policy-match-order", // the slug
  posture: "input-caution", // both fields as typed, with a caution line, after the FortiOS check
  carriesKey: "share.carries", // tools.fortigate-policy-match-order.share.carries
  names: ["input", "packet"], // the policies, then the packet line
  /** The fields, nothing, or blocked. */
  encode(s: PolicyMatchShareState): ShareEncoding {
    return encodePolicyMatch(s, policyMatchHasReading(s) ? checkPolicyMatch(s) : null); // read, checked, encoded
  },
  /** A non-blank policy list and a packet line, neither holding a credential; an absent packet is an empty field. */
  decode(v: Readonly<Record<string, string | null>>): PolicyMatchShareState | null {
    if (!isSendableFortiosBox(v.input)) return null; // no list, or a list this encoder would never send
    const packet = v.packet ?? ""; // absent: empty
    if (packet !== "" && checkFortiosText(packet).secrets.length > 0) return null; // a packet line holding a credential: never sent
    return { input: v.input, packet }; // both fields
  },
});
