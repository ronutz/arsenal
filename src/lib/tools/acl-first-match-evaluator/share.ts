// ============================================================================
// src/lib/tools/acl-first-match-evaluator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the ACL first-match evaluator (posture
// "input-caution", 02/11/2026). An access list names internal networks, hosts
// and what may reach them (the manifest's shareSafetyDefault is "fragment" for
// that reason), the ground on which the routing table explainer, the PAN-OS
// rulebase tool and the FortiGate policy tool take input-caution
// (ROLLOUT.md section 11.2). A link carries, after the #, the list as pasted
// (`input`) and the packet as typed: `protocol`, `source`, `srcport`,
// `destination`, `dstport` (each left out when empty), `ackrst` ("1" when the
// ACK or RST box is ticked, left out otherwise), and `list` (the list chosen
// when the text holds several; left out for the first). Not carried: nothing
// else is on the page to choose.
//
// The list goes through the site's text secrets check (src/lib/share/
// text-secrets.ts): a value that is a credential by its format (a password in
// a URL, a PEM private key, a JWT ...) in a remark or anywhere else means no
// link, naming its line; the reader replaces it and presses again.
//
// Arrival (useShareArrival in AclFirstMatchEvaluatorTool): the list fills its
// box and each packet field its own as typing would, and the page reads them
// (nothing is contacted). Decode refuses a blank list, a list holding a
// credential, and an ackrst other than "1" or "0"; every other packet value is
// accepted as typed and, when the engine cannot read it, the page shows the
// same message typing it would (the routing table explainer's rule for its
// destination).
// ============================================================================

import { findShareSecrets } from "../../share/text-secrets"; // the site's text secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state a link carries and an arrival restores: the list, the list chosen, and the packet as typed. */
export interface AclShareState {
  /** The pasted configuration. */
  input: string;
  /** The list chosen ("" for the first). */
  list: string;
  /** The packet's protocol as typed. */
  protocol: string;
  /** Its source address. */
  source: string;
  /** Its source port. */
  srcport: string;
  /** Its destination address. */
  destination: string;
  /** Its destination port. */
  dstport: string;
  /** ACK or RST set (TCP). */
  ackrst: boolean;
} // AclShareState

/** The packet fields carried as typed, in link order (state key = link name). */
const FIELDS = ["list", "protocol", "source", "srcport", "destination", "dstport"] as const; // the text fields

/**
 * The encoding: nothing for a blank list, blocked for a credential, else the list and every non-empty field.
 * @param s the state
 * @returns the encoding
 */
export function encodeAclShare(s: AclShareState): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing to share: the button is disabled
  const found = findShareSecrets(s.input).secrets[0]; // a credential by its format
  if (found) return { ok: false, reason: "blocked", code: "secret", values: { line: found.line, label: found.label } }; // no link
  const params: Record<string, string> = { input: s.input }; // the list as pasted
  for (const k of FIELDS) if (s[k].trim() !== "") params[k] = s[k]; // each field as typed, when there is one
  if (s.ackrst) params.ackrst = "1"; // the box, when ticked
  return { ok: true, params }; // the values
} // encodeAclShare

/** The spec. */
export const ACL_FIRST_MATCH_SHARE: ShareSpec<AclShareState> = Object.freeze({
  tool: "acl-first-match-evaluator", // the slug
  posture: "input-caution", // as typed, with the tool's caution line
  carriesKey: "share.carries", // tools.acl-first-match-evaluator.share.carries
  names: ["input", "list", "protocol", "source", "srcport", "destination", "dstport", "ackrst"], // the list first, then the list chosen and the packet
  /** The list and the packet, nothing, or blocked. */
  encode(s: AclShareState): ShareEncoding {
    return encodeAclShare(s); // encoded
  },
  /** A non-blank list with no credential; absent fields are empty; ackrst is "1" or "0". */
  decode(v: Readonly<Record<string, string | null>>): AclShareState | null {
    if (!v.input || v.input.trim() === "") return null; // no list
    if (findShareSecrets(v.input).secrets.length > 0) return null; // the encoder never builds one with a credential
    const ack = v.ackrst ?? "0"; // absent: not ticked
    if (ack !== "1" && ack !== "0") return null; // a value the box cannot hold
    return { input: v.input, list: v.list ?? "", protocol: v.protocol ?? "", source: v.source ?? "", srcport: v.srcport ?? "", destination: v.destination ?? "", dstport: v.dstport ?? "", ackrst: ack === "1" }; // the state
  },
});
