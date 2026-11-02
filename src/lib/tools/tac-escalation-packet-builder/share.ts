// ============================================================================
// src/lib/tools/tac-escalation-packet-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the TAC escalation packet builder. Posture "input-caution", raised on 2026-11-01 from the inventory's "input":
// the manifest keeps shareSafetyDefault "fragment", and the notes are the case itself: the problem summary and the
// environment (shown in the packet on the page) name products, versions, hosts and customers, and the case reference
// is a vendor ticket number.
//
// The tool is a form with nothing to paste, so the link carries named values only (ROLLOUT 11.3), every field of
// the form (the shape is the family's, src/lib/fieldcraft/share.ts):
//   vendor, severity, repro
//                          the three choices, by stable id, always
//   collected, tried       the ticked items, in the form's order
//   summary, environment, caseref
//                          the three notes, as typed, when not empty
// Not carried: the to-collect ticks. They are the reader's own progress on the page (the Markdown export carries them),
// and they are keyed to the engine's output, so a link holding them would break the day an item is renamed.
//
// The notes go through the site's text secrets check before a link is offered: a credential by its format means
// no link, naming the note; a secret-looking name adds a caution line. Arrival: the form is set, the ticks are
// cleared, and the page computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, decodeForm, encodeChecked, formNames, formParams, noteFields, type FormShape, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link shape
import { validateInput, type PacketInput } from "./compute"; // the engine's own closed-enum gate
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The notes as the page holds them (as typed). */
export interface TacPacketShareNotes {
  /** The problem summary (shown in the packet). */
  problemSummary: string;
  /** The environment (shown in the packet). */
  environment: string;
  /** The vendor case reference. */
  caseReference: string;
}

/** What the link carries and an arrival restores. */
export interface TacPacketShareState {
  /** The form's choices and lists (the engine's input without notes). */
  input: Omit<PacketInput, "notes">;
  /** The notes, as typed. */
  notes: TacPacketShareNotes;
}

/** The form's shape: the options mirror the page's selects and the engine's own table. */
export const TAC_PACKET_SHAPE: FormShape = Object.freeze({
  choices: [
    { name: "vendor", key: "vendor", options: ["load-balancer", "firewall", "dns", "routing-switching", "tls-pki", "endpoint-security", "generic"], start: "generic" }, // the vendor domain
    { name: "severity", key: "severity", options: ["sev1-down", "sev2-degraded", "sev3-question", "sev4-info"], start: "sev3-question" }, // the severity
    { name: "repro", key: "reproducibility", options: ["reproducible", "intermittent", "happened-once"], start: "reproducible" }, // how it reproduces
  ],
  lists: [
    { name: "collected", key: "collected", options: ["problem-statement", "exact-error", "timeline", "topology", "config-backup", "diagnostic-bundle", "packet-capture", "logs", "repro-steps", "business-impact"], absent: [] }, // what is already collected
    { name: "tried", key: "tried", options: ["nothing-yet", "restart", "rollback", "config-review", "failover", "workaround-applied", "kb-search"], absent: [], exclusive: "nothing-yet" }, // what was tried (nothing-yet stands alone)
  ],
  notes: [
    { name: "summary", key: "problemSummary" }, // the problem summary (shown in the packet)
    { name: "environment", key: "environment" }, // the environment (shown in the packet)
    { name: "caseref", key: "caseReference" }, // the vendor case reference
  ],
});

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its note's link name
 */
export function checkTacPacketNotes(s: TacPacketShareState): NotesCheck {
  return checkNotes(noteFields(TAC_PACKET_SHAPE, s.notes)); // the free-text notes
} // checkTacPacketNotes

/**
 * The encoding of a state whose result is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeTacPacketShare(s: TacPacketShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(formParams(TAC_PACKET_SHAPE, s.input, s.notes), check); // checked
} // encodeTacPacketShare

/** The spec. */
export const TAC_PACKET_SHARE: ShareSpec<TacPacketShareState> = Object.freeze({
  tool: "tac-escalation-packet-builder", // the slug
  posture: "input-caution", // raised from input (see the header)
  carriesKey: "share.carries", // tools.tac-escalation-packet-builder.share.carries
  names: formNames(TAC_PACKET_SHAPE), // a form: no "input"
  /** Every choice, the lists and the notes, or blocked on a credential in a note. */
  encode(s: TacPacketShareState): ShareEncoding {
    return encodeTacPacketShare(s, checkTacPacketNotes(s)); // checked, then encoded
  },
  /** The form, strictly: an id the page does not offer, a list out of order, or a line break makes it malformed. */
  decode(v: Readonly<Record<string, string | null>>): TacPacketShareState | null {
    const d = decodeForm(TAC_PACKET_SHAPE, v); // the shape's rules
    if (!d) return null; // malformed
    try { validateInput(d.input); } catch { return null; } // and the engine's own gate
    return { input: d.input as unknown as TacPacketShareState["input"], notes: d.notes as unknown as TacPacketShareNotes }; // the state
  },
});
