// ============================================================================
// src/lib/tools/change-window-runbook-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the change window runbook builder. Posture "input-caution" (the inventory's, kept):
// the manifest keeps shareSafetyDefault "fragment" ("change context is sensitive"), and the notes can name the change
// ticket, the hosts and the back-out owner, a person.
//
// The tool is a form with nothing to paste, so the link carries named values only (ROLLOUT 11.3), every field of
// the form (the shape is the family's, src/lib/fieldcraft/share.ts):
//   changetype, environment, blastradius, reversible, window, preset
//                          the six choices, by stable id, always
//   safeguards             the ticked safeguards, in the form's order
//   summary, changedetail, backoutowner
//                          the three notes, as typed, when not empty
//   remaining, rollback, verify
//                          the rollback time budget's three fields, as typed (the page says
//                          when they do not add up to a budget, as for typing)
// Not carried: the step ticks. They are the reader's own progress on the page (the Markdown export carries them),
// and they are keyed to the engine's output, so a link holding them would break the day an item is renamed.
//
// The notes go through the site's text secrets check before a link is offered: a credential by its format means
// no link, naming the note; a secret-looking name adds a caution line. Arrival: the form is set, the ticks are
// cleared, and the page computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, decodeForm, encodeChecked, formNames, formParams, noteFields, type FormShape, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link shape
import { validateInput, type RunbookInput } from "./compute"; // the engine's own closed-enum gate
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The notes as the page holds them (as typed). */
export interface RunbookShareNotes {
  /** The summary. */
  summary: string;
  /** The change in detail. */
  changeDetail: string;
  /** Who owns the back-out (a person). */
  backoutOwner: string;
}

/** The rollback time budget's three fields, as typed (whole minutes when they parse). */
export interface RunbookShareBudget {
  /** The minutes left in the window. */
  remaining: string;
  /** The minutes a rollback takes. */
  rollback: string;
  /** The minutes verification takes. */
  verify: string;
}

/** What the link carries and an arrival restores. */
export interface RunbookShareState {
  /** The form's choices and lists (the engine's input without notes or budget). */
  input: Omit<RunbookInput, "notes" | "timeBudget">;
  /** The notes, as typed. */
  notes: RunbookShareNotes;
  /** The time budget, as typed. */
  budget: RunbookShareBudget;
}

/** The form's shape: the options mirror the page's selects and the engine's own table. */
export const RUNBOOK_SHAPE: FormShape = Object.freeze({
  choices: [
    { name: "changetype", key: "changeType", options: ["config-change", "software-upgrade", "cert-rotation", "network-change", "scale-capacity", "failover-maintenance", "emergency-fix"], start: "config-change" }, // the kind of change
    { name: "environment", key: "environment", options: ["production-critical", "production-standard", "staging", "dr-site"], start: "staging" }, // where it runs
    { name: "blastradius", key: "blastRadius", options: ["single-device", "one-service", "one-site", "shared-infra", "everyone"], start: "single-device" }, // how far it reaches
    { name: "reversible", key: "reversibility", options: ["easy-rollback", "config-backup-only", "hard-to-reverse", "one-way-door"], start: "easy-rollback" }, // how it can be reversed
    { name: "window", key: "window", options: ["business-hours", "after-hours", "maintenance-window", "emergency-now"], start: "maintenance-window" }, // when it happens
    { name: "preset", key: "preset", options: ["generic", "load-balancer", "dns", "tls-pki", "firewall"], start: "generic" }, // the vendor-neutral flavour
  ],
  lists: [
    { name: "safeguards", key: "safeguards", options: ["change-approved", "backup-taken", "rollback-tested", "peer-review", "monitoring-ready", "comms-sent", "maintenance-notice"], absent: [] }, // the safeguards in place
  ],
  notes: [
    { name: "summary", key: "summary" }, // the summary
    { name: "changedetail", key: "changeDetail" }, // the change in detail
    { name: "backoutowner", key: "backoutOwner" }, // who owns the back-out (a person)
    { name: "remaining", key: "remaining", check: false }, // the minutes left in the window (a number: not searched for secrets)
    { name: "rollback", key: "rollback", check: false }, // the minutes a rollback takes (a number: not searched for secrets)
    { name: "verify", key: "verify", check: false }, // the minutes verification takes (a number: not searched for secrets)
  ],
});

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its note's link name
 */
export function checkRunbookNotes(s: RunbookShareState): NotesCheck {
  return checkNotes(noteFields(RUNBOOK_SHAPE, s.notes)); // the free-text notes
} // checkRunbookNotes

/**
 * The encoding of a state whose result is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeRunbookShare(s: RunbookShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(formParams(RUNBOOK_SHAPE, s.input, { ...s.notes, ...s.budget }), check); // checked
} // encodeRunbookShare

/** The spec. */
export const RUNBOOK_SHARE: ShareSpec<RunbookShareState> = Object.freeze({
  tool: "change-window-runbook-builder", // the slug
  posture: "input-caution", // the inventory's, kept (see the header)
  carriesKey: "share.carries", // tools.change-window-runbook-builder.share.carries
  names: formNames(RUNBOOK_SHAPE), // a form: no "input"
  /** Every choice, the lists and the notes, or blocked on a credential in a note. */
  encode(s: RunbookShareState): ShareEncoding {
    return encodeRunbookShare(s, checkRunbookNotes(s)); // checked, then encoded
  },
  /** The form, strictly: an id the page does not offer, a list out of order, or a line break makes it malformed. */
  decode(v: Readonly<Record<string, string | null>>): RunbookShareState | null {
    const d = decodeForm(RUNBOOK_SHAPE, v); // the shape's rules
    if (!d) return null; // malformed
    try { validateInput(d.input); } catch { return null; } // and the engine's own gate
    return { input: d.input as unknown as RunbookShareState["input"], notes: { summary: d.notes.summary, changeDetail: d.notes.changeDetail, backoutOwner: d.notes.backoutOwner }, budget: { remaining: d.notes.remaining, rollback: d.notes.rollback, verify: d.notes.verify } }; // the state
  },
});
