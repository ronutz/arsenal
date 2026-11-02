// ============================================================================
// src/lib/tools/packet-capture-plan-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the packet capture plan builder. Posture "input-caution" (the inventory's, kept):
// the manifest keeps shareSafetyDefault "fragment" ("incident/topology context is sensitive"), and the labels note
// is where endpoint names and addresses go.
//
// The tool is a form with nothing to paste, so the link carries named values only (ROLLOUT 11.3), every field of
// the form (the shape is the family's, src/lib/fieldcraft/share.ts):
//   archetype, symptom, trafficclass, intermediary, transform, access, timebehavior, preset
//                          the eight choices, by stable id, always
//   labels, reference, notes
//                          the three notes, as typed, when not empty
// Not carried: the checklist ticks. They are the reader's own progress on the page (the Markdown export carries them),
// and they are keyed to the engine's output, so a link holding them would break the day an item is renamed.
//
// The notes go through the site's text secrets check before a link is offered: a credential by its format means
// no link, naming the note; a secret-looking name adds a caution line. Arrival: the form is set, the ticks are
// cleared, and the page computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, decodeForm, encodeChecked, formNames, formParams, noteFields, type FormShape, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link shape
import { validateInput, type PcpbInput } from "./compute"; // the engine's own closed-enum gate
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The notes as the page holds them (as typed). */
export interface CapturePlanShareNotes {
  /** The endpoint labels (names and addresses). */
  labels: string;
  /** The incident or maintenance reference. */
  reference: string;
  /** The free notes. */
  notes: string;
}

/** What the link carries and an arrival restores. */
export interface CapturePlanShareState {
  /** The form's choices and lists (the engine's input without notes). */
  input: Omit<PcpbInput, "notes">;
  /** The notes, as typed. */
  notes: CapturePlanShareNotes;
}

/** The form's shape: the options mirror the page's selects and the engine's own table. */
export const CAPTURE_PLAN_SHAPE: FormShape = Object.freeze({
  choices: [
    { name: "archetype", key: "archetype", options: ["direct", "load-balancer", "firewall-nat", "proxy-waf", "site-to-site-vpn", "outbound-sse", "east-west", "unknown-mixed"], start: "direct" }, // the path's shape
    { name: "symptom", key: "symptom", options: ["timeout", "reset", "tls-failure", "http-error", "packet-loss", "intermittent-latency", "one-way", "connect-failure"], start: "timeout" }, // what is seen
    { name: "trafficclass", key: "trafficClass", options: ["tcp", "udp", "icmp", "dns", "tls", "http", "mixed"], start: "tcp" }, // the traffic
    { name: "intermediary", key: "intermediaries", options: ["none", "firewall", "nat-snat", "load-balancer", "proxy-waf", "vpn-gateway", "multiple", "unknown"], start: "none" }, // what sits in the path
    { name: "transform", key: "transformation", options: ["none", "address-translation", "tls-termination", "protocol-proxying", "auth-redirect", "multiple", "unknown"], start: "none" }, // what changes the packets
    { name: "access", key: "access", options: ["client-only", "server-only", "one-intermediary", "both-endpoints", "endpoint-plus-intermediary", "multiple-points", "unknown"], start: "both-endpoints" }, // where a capture can run
    { name: "timebehavior", key: "timeBehavior", options: ["constant", "intermittent", "change-related", "load-related", "client-specific", "location-specific", "unknown"], start: "constant" }, // when it happens
    { name: "preset", key: "preset", options: ["generic", "load-balancer", "dns", "tls-pki", "firewall"], start: "generic" }, // the vendor-neutral flavour
  ],
  lists: [], // no checkbox group
  notes: [
    { name: "labels", key: "labels" }, // the endpoint labels (names and addresses)
    { name: "reference", key: "reference" }, // the incident or maintenance reference
    { name: "notes", key: "notes" }, // the free notes
  ],
});

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its note's link name
 */
export function checkCapturePlanNotes(s: CapturePlanShareState): NotesCheck {
  return checkNotes(noteFields(CAPTURE_PLAN_SHAPE, s.notes)); // the free-text notes
} // checkCapturePlanNotes

/**
 * The encoding of a state whose result is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeCapturePlanShare(s: CapturePlanShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(formParams(CAPTURE_PLAN_SHAPE, s.input, s.notes), check); // checked
} // encodeCapturePlanShare

/** The spec. */
export const CAPTURE_PLAN_SHARE: ShareSpec<CapturePlanShareState> = Object.freeze({
  tool: "packet-capture-plan-builder", // the slug
  posture: "input-caution", // the inventory's, kept (see the header)
  carriesKey: "share.carries", // tools.packet-capture-plan-builder.share.carries
  names: formNames(CAPTURE_PLAN_SHAPE), // a form: no "input"
  /** Every choice, the lists and the notes, or blocked on a credential in a note. */
  encode(s: CapturePlanShareState): ShareEncoding {
    return encodeCapturePlanShare(s, checkCapturePlanNotes(s)); // checked, then encoded
  },
  /** The form, strictly: an id the page does not offer, a list out of order, or a line break makes it malformed. */
  decode(v: Readonly<Record<string, string | null>>): CapturePlanShareState | null {
    const d = decodeForm(CAPTURE_PLAN_SHAPE, v); // the shape's rules
    if (!d) return null; // malformed
    try { validateInput(d.input); } catch { return null; } // and the engine's own gate
    return { input: d.input as unknown as CapturePlanShareState["input"], notes: d.notes as unknown as CapturePlanShareNotes }; // the state
  },
});
