// ============================================================================
// src/lib/tools/change-blast-radius-mapper/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the change blast-radius mapper. Posture
// "input-caution", raised on 2026-11-01 from the inventory's "input": the
// manifest keeps shareSafetyDefault "fragment", and the two notes are free text
// that can name the target host, the customer or the change ticket (ROLLOUT
// 11.2: input that names infrastructure gets a caution line).
//
// The tool is a form with nothing to paste, so the link carries named values
// only (ROLLOUT 11.3), every field of the form (src/lib/fieldcraft/share.ts):
//   target, colocation, trafficpath, dependents, redundancy, userreach, preset
//                          the seven choices, by stable id, always
//   summary, targetdetail  the two notes, as typed, when not empty
// Not carried: the containment ticks. They are the reader's own progress on the
// page (the Markdown export carries them), and they are keyed to the engine's
// output, so a link holding them would break the day a measure is renamed.
//
// The notes go through the site's text secrets check before a link is offered:
// a credential by its format means no link, naming the note; a secret-looking
// name adds a caution line. Arrival: the choices and notes are set, the ticks
// cleared, and the map computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, decodeForm, encodeChecked, formNames, formParams, noteFields, type FormShape, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link shape
import { validateInput, type BlastInput } from "./compute"; // the engine's own closed-enum gate
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The notes as the page holds them (as typed). */
export interface BlastShareNotes {
  /** One-line summary of the change. */
  summary: string;
  /** The target in detail (a host, a VIP, a certificate's name). */
  targetDetail: string;
}

/** What the link carries and an arrival restores: the form's choices and the notes. */
export interface BlastShareState {
  /** The seven choices (the engine's input without notes). */
  input: Omit<BlastInput, "notes">;
  /** The notes, as typed. */
  notes: BlastShareNotes;
}

/** The form's shape: the options mirror the page's selects and the engine's VALID table. */
export const BLAST_SHAPE: FormShape = Object.freeze({
  choices: [
    { name: "target", key: "target", options: ["single-server", "network-device", "load-balancer", "dns-record", "certificate", "firewall-policy", "shared-platform", "database"], start: "single-server" }, // what is changed
    { name: "colocation", key: "colocation", options: ["dedicated", "some-shared", "heavily-shared"], start: "dedicated" }, // shared hardware
    { name: "trafficpath", key: "trafficPath", options: ["in-path", "control-plane", "out-of-band"], start: "out-of-band" }, // in the live path
    { name: "dependents", key: "dependents", options: ["none-known", "a-few", "many", "everything"], start: "none-known" }, // downstream dependents
    { name: "redundancy", key: "redundancy", options: ["ha-pair-healthy", "ha-pair-degraded", "cluster", "standalone"], start: "ha-pair-healthy" }, // a peer to carry load
    { name: "userreach", key: "userReach", options: ["internal-team", "one-app", "one-site", "customer-facing", "everyone"], start: "internal-team" }, // who sits behind it
    { name: "preset", key: "preset", options: ["generic", "load-balancer", "dns", "tls-pki", "firewall"], start: "generic" }, // the vendor-neutral flavour
  ],
  lists: [], // no checkbox group
  notes: [
    { name: "summary", key: "summary" }, // the summary note
    { name: "targetdetail", key: "targetDetail" }, // the target detail note
  ],
});

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its note's link name
 */
export function checkBlastNotes(s: BlastShareState): NotesCheck {
  return checkNotes(noteFields(BLAST_SHAPE, s.notes)); // the two notes
} // checkBlastNotes

/**
 * The encoding of a state whose map is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeBlastShare(s: BlastShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(formParams(BLAST_SHAPE, s.input, s.notes), check); // checked
} // encodeBlastShare

/** The spec. */
export const BLAST_SHARE: ShareSpec<BlastShareState> = Object.freeze({
  tool: "change-blast-radius-mapper", // the slug
  posture: "input-caution", // raised from input (see the header)
  carriesKey: "share.carries", // tools.change-blast-radius-mapper.share.carries
  names: formNames(BLAST_SHAPE), // a form: no "input"
  /** Every choice and the notes, or blocked on a credential in a note. */
  encode(s: BlastShareState): ShareEncoding {
    return encodeBlastShare(s, checkBlastNotes(s)); // checked, then encoded
  },
  /** The form, strictly: an id the page does not offer, or a note with a line break, makes the link malformed. */
  decode(v: Readonly<Record<string, string | null>>): BlastShareState | null {
    const d = decodeForm(BLAST_SHAPE, v); // the shape's rules
    if (!d) return null; // malformed
    try { validateInput(d.input); } catch { return null; } // and the engine's own gate
    return { input: d.input as unknown as BlastShareState["input"], notes: d.notes as unknown as BlastShareNotes }; // the state
  },
});
