// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/lacp-hash-and-state-reader/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the LACP member link and state reader (posture
// "input-caution", the manifest's shareSafetyDefault "fragment": in link mode
// the MAC and IP addresses and the ports can name hosts on a private network,
// so the popover adds the tool's caution line there; state values name
// nothing). A form with nothing to paste (ROLLOUT 11.3): the link carries named
// values only, after the "#", the fields of the mode shown as typed:
//   always      mode (link or state)
//   link        policy, order (little or big), members, and only the fields
//               the policy reads: srcmac and dstmac (layer2, layer2+3),
//               srcmac (vlan+srcmac), srcip and dstip (all but vlan+srcmac),
//               protocol, srcport and dstport (layer3+4), vlan and priority
//               when typed (vlan+srcmac); spread and count when a spread is on
//   state       format (octet, snmp, extreme, arista or huawei), actor,
//               partner when typed; in Huawei's format with a pasted
//               display eth-trunk output, display (the output, its lines
//               kept) and port when chosen, instead of actor and partner
// A link exists once the page shows a reading; an input the engine refuses has
// none. Fields the policy does not read, and the other mode's, are not carried.
// A pasted display eth-trunk output names the switches' system IDs (MAC
// addresses) and interfaces, so the popover adds a caution there too.
//
// Arrival (useShareArrival in LacpHashAndStateReaderTool): the mode and the
// mode's fields are set as typing would set them (a field the link does not
// carry keeps its value, and a missing spread turns the spread off), and the
// page computes. An unknown mode, policy, order, protocol, format or spread
// field, a field of the other mode or one the policy does not read, a missing
// required field, a count without a spread (or a spread without a count), a
// display or port outside Huawei's format, a display beside an actor or a
// partner, a port without a display, or a value over two lines (display
// excepted: it is a pasted output) makes the whole share malformed. Field text is
// otherwise left to the engine, which refuses a bad MAC, address, port or state
// with its own message, exactly as typing would.
// ============================================================================

import { run, POLICIES, type LacpRequest, type LinkPolicy, type ByteOrder, type SpreadField, type StateFormat } from "./compute"; // the page's own engine, to know whether there is a reading
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The link-mode form. */
export interface LinkForm {
  /** The mode. */
  mode: "link";
  /** The policy. */
  policy: LinkPolicy;
  /** The byte order. */
  byteOrder: ByteOrder;
  /** The member count as typed. */
  members: string;
  /** The source MAC as typed. */
  srcMac: string;
  /** The destination MAC as typed. */
  dstMac: string;
  /** The source address as typed. */
  srcIp: string;
  /** The destination address as typed. */
  dstIp: string;
  /** TCP or UDP. */
  protocol: "tcp" | "udp";
  /** The source port as typed. */
  srcPort: string;
  /** The destination port as typed. */
  dstPort: string;
  /** The VLAN ID as typed ("" untagged). */
  vlan: string;
  /** The priority as typed ("" for 0). */
  priority: string;
  /** The field a spread varies, or "" for no spread. */
  spreadField: SpreadField | "";
  /** The spread's flow count as typed. */
  spreadCount: string;
}

/** The state-mode form. */
export interface StateForm {
  /** The mode. */
  mode: "state";
  /** How the values are written. */
  format: StateFormat;
  /** The actor's value as typed. */
  actor: string;
  /** The partner's value as typed ("" when none). */
  partner: string;
  /** Huawei's format only: a pasted display eth-trunk output ("" when none). */
  display: string;
  /** Huawei's format only: the member of the pasted output read in detail ("" for the first). */
  port: string;
}

/**
 * Whether a state form reads a pasted display eth-trunk output (Huawei's format with an output pasted).
 * @param s the state form
 * @returns true when the output, not the typed values, is read
 */
export function readsDisplay(s: StateForm): boolean {
  return s.format === "huawei" && s.display.trim() !== ""; // the output is read only in Huawei's format
} // readsDisplay

/** The state an arrival restores and the page encodes. */
export type LacpShareState = LinkForm | StateForm; // one per mode

/** Each policy's carried fields, as link names, beyond policy, order and members. */
const POLICY_NAMES: Readonly<Record<LinkPolicy, readonly string[]>> = Object.freeze({
  "layer2": ["srcmac", "dstmac", "srcip", "dstip"], // the MACs and the family's addresses
  "layer2+3": ["srcmac", "dstmac", "srcip", "dstip"], // the MACs and the addresses
  "layer3+4": ["srcip", "dstip", "protocol", "srcport", "dstport"], // the addresses and the ports
  "vlan+srcmac": ["srcmac", "vlan", "priority"], // the source MAC and the tag
}); // by policy

/** The fields each policy requires in a link (vlan and priority are optional). */
const REQUIRED: Readonly<Record<LinkPolicy, readonly string[]>> = Object.freeze({
  "layer2": ["srcmac", "dstmac", "srcip", "dstip"], // all four
  "layer2+3": ["srcmac", "dstmac", "srcip", "dstip"], // all four
  "layer3+4": ["srcip", "dstip", "srcport", "dstport"], // protocol defaults to tcp
  "vlan+srcmac": ["srcmac"], // untagged when no vlan
}); // by policy

/** The fields a spread may vary for each policy (the engine's own rule, as link values). */
const SPREADABLE: Readonly<Record<LinkPolicy, readonly SpreadField[]>> = Object.freeze({
  "layer2": ["srcMac", "dstMac"], // the MACs
  "layer2+3": ["srcMac", "dstMac", "srcIp", "dstIp"], // MACs and addresses
  "layer3+4": ["srcPort", "dstPort", "srcIp", "dstIp"], // ports and addresses
  "vlan+srcmac": ["srcMac", "vlan"], // the source MAC and the tag
}); // by policy

/** Every link-mode name, and every state-mode name. */
const LINK_NAMES = ["policy", "order", "members", "srcmac", "dstmac", "srcip", "dstip", "protocol", "srcport", "dstport", "vlan", "priority", "spread", "count"] as const; // link
const STATE_NAMES = ["format", "actor", "partner", "display", "port"] as const; // state

/**
 * The engine request for a state, as the page builds it.
 * @param s the state
 * @returns the request
 */
export function requestOf(s: LacpShareState): LacpRequest {
  if (s.mode === "state") return readsDisplay(s) ? { mode: "state", format: s.format, display: s.display, port: s.port } : { mode: "state", format: s.format, actor: s.actor, partner: s.partner }; // state: the pasted output, or the typed values
  return {
    mode: "link", policy: s.policy, byteOrder: s.byteOrder, members: s.members, // the bond
    srcMac: s.srcMac, dstMac: s.dstMac, srcIp: s.srcIp, dstIp: s.dstIp, // addresses
    protocol: s.protocol, srcPort: s.srcPort, dstPort: s.dstPort, vlan: s.vlan, priority: s.priority, // ports and tag
    spread: s.spreadField === "" ? null : { field: s.spreadField, count: s.spreadCount }, // the spread, when on
  }; // link
} // requestOf

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param computed whether the page has a reading (false while blank or refused)
 * @returns the mode's fields, or nothing
 */
export function encodeLacpShare(s: LacpShareState, computed: boolean): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (s.mode === "state") { // state
    if (readsDisplay(s)) { // Huawei's pasted output, instead of the typed values
      const params: Record<string, string> = { mode: "state", format: "huawei", display: s.display }; // the output, its lines kept
      if (s.port.trim() !== "") params.port = s.port; // the member chosen, when one is
      return { ok: true, params }; // the values
    } // display
    const params: Record<string, string> = { mode: "state", format: s.format, actor: s.actor }; // always
    if (s.partner.trim() !== "") params.partner = s.partner; // when typed
    return { ok: true, params }; // the values
  } // state
  const params: Record<string, string> = { mode: "link", policy: s.policy, order: s.byteOrder, members: s.members }; // always
  const value: Record<string, string> = { srcmac: s.srcMac, dstmac: s.dstMac, srcip: s.srcIp, dstip: s.dstIp, protocol: s.protocol, srcport: s.srcPort, dstport: s.dstPort, vlan: s.vlan, priority: s.priority }; // by link name
  for (const n of POLICY_NAMES[s.policy]) if (value[n].trim() !== "") params[n] = value[n]; // only what the policy reads, when typed
  if (s.spreadField !== "") { params.spread = s.spreadField; params.count = s.spreadCount; } // the spread, when on
  return { ok: true, params }; // the values
} // encodeLacpShare

/** The spec. */
export const LACP_SHARE: ShareSpec<LacpShareState> = Object.freeze({
  tool: "lacp-hash-and-state-reader", // the slug
  posture: "input-caution", // link mode's addresses and ports can name a private network
  carriesKey: "share.carries", // tools.lacp-hash-and-state-reader.share.carries
  names: ["mode", ...LINK_NAMES, ...STATE_NAMES], // a form: no input (11.3)
  /** The mode's fields, or nothing (the spec asks the engine itself whether there is a reading). */
  encode(s: LacpShareState): ShareEncoding {
    let computed = false; // whether the engine reads the fields
    try { computed = !!run(requestOf(s)); } catch { computed = false; } // the engine throws on what it refuses
    return encodeLacpShare(s, computed); // encoded
  },
  /** The mode's fields, strictly: enumerations from the page's own choices, required fields present, one line each. */
  decode(v: Readonly<Record<string, string | null>>): LacpShareState | null {
    const has = (n: string): boolean => v[n] !== null && v[n] !== undefined; // carried
    const text = (n: string): string => v[n] ?? ""; // as carried, "" when absent
    const filled = (n: string): boolean => has(n) && text(n).trim() !== ""; // present and not blank
    if ([...LINK_NAMES, ...STATE_NAMES].some((n) => n !== "display" && /[\r\n]/.test(text(n)))) return null; // one line each (a pasted output keeps its lines)
    if (v.mode === "state") { // state
      if (LINK_NAMES.some(has)) return null; // a field of the other mode
      const format = v.format ?? "octet"; // octet when absent
      if (format !== "octet" && format !== "snmp" && format !== "extreme" && format !== "arista" && format !== "huawei") return null; // an unknown format
      if (filled("display")) { // a pasted display eth-trunk output
        if (format !== "huawei" || has("actor") || has("partner")) return null; // Huawei's format only, and no typed values beside it
        return { mode: "state", format, actor: "", partner: "", display: text("display"), port: text("port") }; // the output, and the member chosen
      } // display
      if (has("display") || has("port")) return null; // a blank output, or a port without one
      if (!filled("actor")) return null; // the actor is required
      return { mode: "state", format, actor: text("actor"), partner: text("partner"), display: "", port: "" }; // the state
    } // state
    if (v.mode !== "link") return null; // an unknown or missing mode
    if (STATE_NAMES.some(has)) return null; // a field of the other mode
    const policy = (v.policy ?? "layer2") as LinkPolicy; // the driver's default when absent
    if (!POLICIES.includes(policy)) return null; // an unknown policy
    const order = v.order ?? "little"; // little-endian when absent
    if (order !== "little" && order !== "big") return null; // an unknown byte order
    if (!filled("members")) return null; // the member count is required
    const allowed = POLICY_NAMES[policy]; // the fields this policy reads
    if (["srcmac", "dstmac", "srcip", "dstip", "protocol", "srcport", "dstport", "vlan", "priority"].some((n) => has(n) && !allowed.includes(n))) return null; // a field the policy does not read
    if (!REQUIRED[policy].every(filled)) return null; // a required field is missing
    const protocol = v.protocol ?? "tcp"; // TCP when absent
    if (protocol !== "tcp" && protocol !== "udp") return null; // an unknown protocol
    if (has("spread") !== has("count")) return null; // a spread needs its count, and the other way round
    const spreadField = (v.spread ?? "") as SpreadField | ""; // the field varied, or none
    if (spreadField !== "" && !SPREADABLE[policy].includes(spreadField)) return null; // a field the hash ignores, or unknown
    return {
      mode: "link", policy, byteOrder: order, members: text("members"), // the bond
      srcMac: text("srcmac"), dstMac: text("dstmac"), srcIp: text("srcip"), dstIp: text("dstip"), // addresses
      protocol, srcPort: text("srcport"), dstPort: text("dstport"), vlan: text("vlan"), priority: text("priority"), // ports and tag
      spreadField, spreadCount: text("count"), // the spread
    }; // the state
  },
});

/** The fields an arrival sets in link mode (the others keep their values, as section 5 of the rollout asks). */
export function carriedLinkFields(policy: LinkPolicy): readonly string[] {
  return POLICY_NAMES[policy]; // the link names the policy carries
} // carriedLinkFields
