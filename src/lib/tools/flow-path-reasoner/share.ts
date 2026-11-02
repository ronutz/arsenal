// ============================================================================
// src/lib/tools/flow-path-reasoner/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the flow path reasoner. Posture "input-caution" (the inventory's, kept):
// the manifest keeps shareSafetyDefault "fragment" ("topology context is sensitive"; the engine's own warning says an
// export reveals topology), and the node labels note is where host and device names go.
//
// The tool is a form with nothing to paste, so the link carries named values only (ROLLOUT 11.3), every field of
// the form (the shape is the family's, src/lib/fieldcraft/share.ts):
//   archetype, resolution, intermediary, transform, tls, auth, returnpath, preset
//                          the eight choices, by stable id, always
//   title, nodelabels, notes
//                          the three notes, as typed, when not empty
// Not carried: the checklist ticks. They are the reader's own progress on the page (the Markdown export carries them),
// and they are keyed to the engine's output, so a link holding them would break the day an item is renamed.
//
// The notes go through the site's text secrets check before a link is offered: a credential by its format means
// no link, naming the note; a secret-looking name adds a caution line. Arrival: the form is set, the ticks are
// cleared, and the page computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, decodeForm, encodeChecked, formNames, formParams, noteFields, type FormShape, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link shape
import { validateInput, type FprInput } from "./compute"; // the engine's own closed-enum gate
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The notes as the page holds them (as typed). */
export interface FlowPathShareNotes {
  /** The map's title. */
  title: string;
  /** The node labels (host and device names). */
  nodeLabels: string;
  /** The free notes. */
  notes: string;
}

/** What the link carries and an arrival restores. */
export interface FlowPathShareState {
  /** The form's choices and lists (the engine's input without notes). */
  input: Omit<FprInput, "notes">;
  /** The notes, as typed. */
  notes: FlowPathShareNotes;
}

/** The form's shape: the options mirror the page's selects and the engine's own table. */
export const FLOW_PATH_SHAPE: FormShape = Object.freeze({
  choices: [
    { name: "archetype", key: "archetype", options: ["direct", "internet-published", "load-balancer", "proxy-waf", "site-to-site-vpn", "outbound-sse", "identity-federated", "east-west", "unknown-mixed"], start: "direct" }, // the path's shape
    { name: "resolution", key: "resolution", options: ["public-dns", "private-dns", "split-horizon", "hosts-static", "service-discovery", "multiple", "unknown"], start: "public-dns" }, // how the name resolves
    { name: "intermediary", key: "intermediaries", options: ["none", "firewall", "load-balancer", "proxy-waf", "vpn", "sse-casb", "multiple", "unknown"], start: "none" }, // what sits in the path
    { name: "transform", key: "transformation", options: ["none", "dnat", "snat", "both", "proxy-source", "multiple", "unknown"], start: "none" }, // how addresses change
    { name: "tls", key: "tls", options: ["end-to-end", "terminate-once", "terminate-reencrypt", "multiple-terminations", "plaintext", "unknown"], start: "end-to-end" }, // where TLS ends
    { name: "auth", key: "auth", options: ["none", "local", "redirect-idp", "agent-connector", "multiple", "unknown"], start: "none" }, // how the user authenticates
    { name: "returnpath", key: "returnPath", options: ["known-symmetric", "known-asymmetric", "policy-routed", "multiple-exits", "unknown"], start: "known-symmetric" }, // how replies return
    { name: "preset", key: "preset", options: ["generic", "load-balancer", "dns", "tls-pki", "firewall"], start: "generic" }, // the vendor-neutral flavour
  ],
  lists: [], // no checkbox group
  notes: [
    { name: "title", key: "title" }, // the map's title
    { name: "nodelabels", key: "nodeLabels" }, // the node labels (host and device names)
    { name: "notes", key: "notes" }, // the free notes
  ],
});

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its note's link name
 */
export function checkFlowPathNotes(s: FlowPathShareState): NotesCheck {
  return checkNotes(noteFields(FLOW_PATH_SHAPE, s.notes)); // the free-text notes
} // checkFlowPathNotes

/**
 * The encoding of a state whose result is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeFlowPathShare(s: FlowPathShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(formParams(FLOW_PATH_SHAPE, s.input, s.notes), check); // checked
} // encodeFlowPathShare

/** The spec. */
export const FLOW_PATH_SHARE: ShareSpec<FlowPathShareState> = Object.freeze({
  tool: "flow-path-reasoner", // the slug
  posture: "input-caution", // the inventory's, kept (see the header)
  carriesKey: "share.carries", // tools.flow-path-reasoner.share.carries
  names: formNames(FLOW_PATH_SHAPE), // a form: no "input"
  /** Every choice, the lists and the notes, or blocked on a credential in a note. */
  encode(s: FlowPathShareState): ShareEncoding {
    return encodeFlowPathShare(s, checkFlowPathNotes(s)); // checked, then encoded
  },
  /** The form, strictly: an id the page does not offer, a list out of order, or a line break makes it malformed. */
  decode(v: Readonly<Record<string, string | null>>): FlowPathShareState | null {
    const d = decodeForm(FLOW_PATH_SHAPE, v); // the shape's rules
    if (!d) return null; // malformed
    try { validateInput(d.input); } catch { return null; } // and the engine's own gate
    return { input: d.input as unknown as FlowPathShareState["input"], notes: d.notes as unknown as FlowPathShareNotes }; // the state
  },
});
