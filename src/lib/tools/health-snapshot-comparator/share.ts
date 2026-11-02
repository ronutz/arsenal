// ============================================================================
// src/lib/tools/health-snapshot-comparator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the before/after health snapshot comparator. Posture "input-caution" (the inventory's, kept):
// the manifest keeps shareSafetyDefault "fragment" ("change context is sensitive"), and the notes can name the
// change ticket and the devices compared.
//
// The tool is a form with nothing to paste, so the link carries named values only (ROLLOUT 11.3), every field of
// the form (the shape is the family's, src/lib/fieldcraft/share.ts):
//   context, target, scope, before, after, window, churn, preset
//                          the eight choices, by stable id, always
//   title, changeref, notes
//                          the three notes, as typed, when not empty
// Not carried: the checklist ticks. They are the reader's own progress on the page (the Markdown export carries them),
// and they are keyed to the engine's output, so a link holding them would break the day an item is renamed.
//
// The notes go through the site's text secrets check before a link is offered: a credential by its format means
// no link, naming the note; a secret-looking name adds a caution line. Arrival: the form is set, the ticks are
// cleared, and the page computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, decodeForm, encodeChecked, formNames, formParams, noteFields, type FormShape, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link shape
import { validateInput, type HscInput } from "./compute"; // the engine's own closed-enum gate
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The notes as the page holds them (as typed). */
export interface HealthSnapshotShareNotes {
  /** The report's title. */
  title: string;
  /** The change or ticket reference. */
  changeRef: string;
  /** The free notes. */
  notes: string;
}

/** What the link carries and an arrival restores. */
export interface HealthSnapshotShareState {
  /** The form's choices and lists (the engine's input without notes). */
  input: Omit<HscInput, "notes">;
  /** The notes, as typed. */
  notes: HealthSnapshotShareNotes;
}

/** The form's shape: the options mirror the page's selects and the engine's own table. */
export const HEALTH_SNAPSHOT_SHAPE: FormShape = Object.freeze({
  choices: [
    { name: "context", key: "context", options: ["post-change-validation", "post-incident-recovery", "migration-cutover", "periodic-drift-check", "rollback-decision", "unknown"], start: "post-change-validation" }, // why the comparison is made
    { name: "target", key: "target", options: ["firewall", "load-balancer", "dns", "switch-routing", "proxy-sse", "identity", "server-app", "unknown"], start: "firewall" }, // what is compared
    { name: "scope", key: "scope", options: ["single-device", "ha-pair", "cluster", "service-population", "site", "unknown"], start: "single-device" }, // how much of it
    { name: "before", key: "beforeConfidence", options: ["captured-verified", "captured-unverified", "from-memory", "assumed-healthy", "none"], start: "captured-verified" }, // how good the before state is
    { name: "after", key: "afterState", options: ["captured-verified", "captured-unverified", "partial", "none-yet"], start: "captured-verified" }, // how good the after state is
    { name: "window", key: "window", options: ["immediate", "short", "operational", "extended", "unknown"], start: "operational" }, // how long after the change
    { name: "churn", key: "churn", options: ["none-frozen", "low", "normal", "high-dynamic", "unknown"], start: "normal" }, // how much moves on its own
    { name: "preset", key: "preset", options: ["generic", "load-balancer", "dns", "tls-pki", "firewall"], start: "generic" }, // the vendor-neutral flavour
  ],
  lists: [], // no checkbox group
  notes: [
    { name: "title", key: "title" }, // the report's title
    { name: "changeref", key: "changeRef" }, // the change or ticket reference
    { name: "notes", key: "notes" }, // the free notes
  ],
});

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its note's link name
 */
export function checkHealthSnapshotNotes(s: HealthSnapshotShareState): NotesCheck {
  return checkNotes(noteFields(HEALTH_SNAPSHOT_SHAPE, s.notes)); // the free-text notes
} // checkHealthSnapshotNotes

/**
 * The encoding of a state whose result is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeHealthSnapshotShare(s: HealthSnapshotShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(formParams(HEALTH_SNAPSHOT_SHAPE, s.input, s.notes), check); // checked
} // encodeHealthSnapshotShare

/** The spec. */
export const HEALTH_SNAPSHOT_SHARE: ShareSpec<HealthSnapshotShareState> = Object.freeze({
  tool: "health-snapshot-comparator", // the slug
  posture: "input-caution", // the inventory's, kept (see the header)
  carriesKey: "share.carries", // tools.health-snapshot-comparator.share.carries
  names: formNames(HEALTH_SNAPSHOT_SHAPE), // a form: no "input"
  /** Every choice, the lists and the notes, or blocked on a credential in a note. */
  encode(s: HealthSnapshotShareState): ShareEncoding {
    return encodeHealthSnapshotShare(s, checkHealthSnapshotNotes(s)); // checked, then encoded
  },
  /** The form, strictly: an id the page does not offer, a list out of order, or a line break makes it malformed. */
  decode(v: Readonly<Record<string, string | null>>): HealthSnapshotShareState | null {
    const d = decodeForm(HEALTH_SNAPSHOT_SHAPE, v); // the shape's rules
    if (!d) return null; // malformed
    try { validateInput(d.input); } catch { return null; } // and the engine's own gate
    return { input: d.input as unknown as HealthSnapshotShareState["input"], notes: d.notes as unknown as HealthSnapshotShareNotes }; // the state
  },
});
