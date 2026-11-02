// ============================================================================
// src/lib/tools/fault-hypothesis-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the fault hypothesis builder. Posture "input-caution" (the inventory's, kept):
// the manifest keeps shareSafetyDefault "fragment" ("incident context is sensitive"), and the notes can name the
// affected service, its users and what was already tried on which host.
//
// The tool is a form with nothing to paste, so the link carries named values only (ROLLOUT 11.3), every field of
// the form (the shape is the family's, src/lib/fieldcraft/share.ts):
//   symptom, scope, timing, preset
//                          the four choices, by stable id, always
//   changed, clues         the ticked changes and clues, in the form's order
//   summary, impact, alreadytried
//                          the three notes, as typed, when not empty
// Not carried: the evidence ticks. They are the reader's own progress on the page (the Markdown export carries them),
// and they are keyed to the engine's output, so a link holding them would break the day an item is renamed.
//
// The notes go through the site's text secrets check before a link is offered: a credential by its format means
// no link, naming the note; a secret-looking name adds a caution line. Arrival: the form is set, the ticks are
// cleared, and the page computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, decodeForm, encodeChecked, formNames, formParams, noteFields, type FormShape, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link shape
import { validateInput, type FhbInput } from "./compute"; // the engine's own closed-enum gate
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The notes as the page holds them (as typed). */
export interface FhbShareNotes {
  /** The summary. */
  summary: string;
  /** The impact. */
  impact: string;
  /** What was already tried. */
  alreadyTried: string;
}

/** What the link carries and an arrival restores. */
export interface FhbShareState {
  /** The form's choices and lists (the engine's input without notes). */
  input: Omit<FhbInput, "notes">;
  /** The notes, as typed. */
  notes: FhbShareNotes;
}

/** The form's shape: the options mirror the page's selects and the engine's own table. */
export const FHB_SHAPE: FormShape = Object.freeze({
  choices: [
    { name: "symptom", key: "symptom", options: ["total-outage", "intermittent", "slow", "errors-for-some", "auth-failures", "cannot-reach-new-service"], start: "intermittent" }, // what is seen
    { name: "scope", key: "scope", options: ["one-user", "some-users", "one-site", "one-app", "everyone"], start: "some-users" }, // who is affected
    { name: "timing", key: "timing", options: ["constant", "intermittent-random", "time-of-day", "since-change"], start: "constant" }, // when it happens
    { name: "preset", key: "preset", options: ["generic", "load-balancer", "dns", "tls-pki"], start: "generic" }, // the vendor-neutral flavour
  ],
  lists: [
    { name: "changed", key: "changed", options: ["nothing-known", "config-change", "software-deploy", "network-change", "cert-or-key", "capacity-growth", "provider-maintenance"], absent: ["nothing-known"], exclusive: "nothing-known" }, // what changed (never empty: nothing-known stands alone)
    { name: "clues", key: "clues", options: ["dns-fails", "works-by-ip-not-name", "tls-errors", "tcp-connects-but-app-errors", "timeouts", "slow-only-large-transfers", "one-path-works-other-not", "http-5xx", "http-4xx-auth"], absent: [] }, // the clues seen
  ],
  notes: [
    { name: "summary", key: "summary" }, // the summary
    { name: "impact", key: "impact" }, // the impact
    { name: "alreadytried", key: "alreadyTried" }, // what was already tried
  ],
});

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its note's link name
 */
export function checkFhbNotes(s: FhbShareState): NotesCheck {
  return checkNotes(noteFields(FHB_SHAPE, s.notes)); // the free-text notes
} // checkFhbNotes

/**
 * The encoding of a state whose result is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeFhbShare(s: FhbShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(formParams(FHB_SHAPE, s.input, s.notes), check); // checked
} // encodeFhbShare

/** The spec. */
export const FHB_SHARE: ShareSpec<FhbShareState> = Object.freeze({
  tool: "fault-hypothesis-builder", // the slug
  posture: "input-caution", // the inventory's, kept (see the header)
  carriesKey: "share.carries", // tools.fault-hypothesis-builder.share.carries
  names: formNames(FHB_SHAPE), // a form: no "input"
  /** Every choice, the lists and the notes, or blocked on a credential in a note. */
  encode(s: FhbShareState): ShareEncoding {
    return encodeFhbShare(s, checkFhbNotes(s)); // checked, then encoded
  },
  /** The form, strictly: an id the page does not offer, a list out of order, or a line break makes it malformed. */
  decode(v: Readonly<Record<string, string | null>>): FhbShareState | null {
    const d = decodeForm(FHB_SHAPE, v); // the shape's rules
    if (!d) return null; // malformed
    try { validateInput(d.input); } catch { return null; } // and the engine's own gate
    return { input: d.input as unknown as FhbShareState["input"], notes: d.notes as unknown as FhbShareNotes }; // the state
  },
});
