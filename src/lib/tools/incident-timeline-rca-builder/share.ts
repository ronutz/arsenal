// ============================================================================
// src/lib/tools/incident-timeline-rca-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the incident timeline & RCA builder. Posture
// "input-caution" (the inventory's, kept): the manifest keeps
// shareSafetyDefault "fragment" ("incident detail is sensitive"), and the event
// notes and the summary can name hosts, customers, the people on the bridge and
// the incident ticket.
//
// The tool is a form with nothing to paste, so the link carries named values
// only (ROLLOUT 11.3), every field of the form:
//   events     the timeline, one line per event in the order of the rows:
//              kind TAB order [TAB note [TAB reported TAB offset TAB uncertainty]]
//              (the kind by stable id, the order in decimal as the page holds it,
//              the note and the three clock fields as typed; trailing empty fields
//              are left out). A one-line field cannot hold a line break; a tab typed
//              into a note or a clock field travels as a space, the only change a
//              link makes (wave 2C's simulators did the same).
//   factors    the observed contributing-factor domains, in the page's order
//   confirmed  those of them the reader marked confirmed (a subset of factors:
//              confirmation is the reader's act, D-86 section 3.2, and the link
//              carries it exactly; the engine never adds one)
//   summary, followups   the two notes, as typed, when not empty
// The event ids are the page's own counters and are not carried: an arrival
// numbers the rows again (e1, e2, ...) and keeps their order.
//
// The notes (the event notes, the summary, the follow-ups) go through the site's
// text secrets check before a link is offered (src/lib/fieldcraft/share.ts): a
// credential by its format means no link, naming the note; a secret-looking
// name adds a caution line. Arrival: the timeline, clock fields, factors and
// notes are set and the scaffold computes as on a change; nothing is fetched.
// ============================================================================

import { checkNotes, encodeChecked, readList, readNote, type FormList, type NotesCheck } from "../../fieldcraft/share"; // the fieldcraft link helpers
import { validateInput, type EventKind, type FactorDomain } from "./compute"; // the engine's own gate and its ids
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** One timeline row as the page holds it. */
export interface RcaShareEvent {
  /** The event's kind. */
  kind: EventKind;
  /** Its order (any finite number; the engine sorts by it). */
  order: number;
  /** Its note, as typed ("" when none). */
  note: string;
  /** The clock fields, as typed ("" when blank). */
  clock: { reported: string; offset: string; uncertainty: string };
}

/** What the link carries and an arrival restores. */
export interface RcaShareState {
  /** The timeline rows, in the page's order. */
  events: RcaShareEvent[];
  /** The observed factor domains, each with whether the reader marked it confirmed, in the page's order. */
  factors: { domain: FactorDomain; confirmed: boolean }[];
  /** The two notes, as typed. */
  notes: { summary: string; followups: string };
}

/** The event kinds the rows offer, in the page's order. */
export const RCA_EVENT_KINDS: readonly EventKind[] = Object.freeze(["change-made", "symptom-began", "alert-fired", "detected", "investigation-step", "escalated", "mitigated", "resolved", "other"] as EventKind[]); // the select's options
/** The factor domains, in the page's (and the engine's registry) order. */
export const RCA_FACTOR_DOMAINS: readonly FactorDomain[] = Object.freeze(["recent-change", "capacity-saturation", "dependency-failure", "configuration-error", "expired-credential", "human-process-gap", "monitoring-gap", "external-provider", "unknown-still"] as FactorDomain[]); // the checkbox group
/** The factors group, in the family's list shape. */
const FACTORS_LIST: FormList = Object.freeze({ name: "factors", key: "factors", options: RCA_FACTOR_DOMAINS, absent: [] }); // may be empty
/** The confirmed group: the same ids. */
const CONFIRMED_LIST: FormList = Object.freeze({ name: "confirmed", key: "confirmed", options: RCA_FACTOR_DOMAINS, absent: [] }); // may be empty

/**
 * A field as it travels inside a timeline line: a tab becomes a space (the separator), nothing else changes.
 * @param s the text as typed
 * @returns the text for the line
 */
function cell(s: string): string {
  return s.replace(/\t/g, " "); // a typed tab travels as a space
} // cell

/**
 * One timeline row as a line of the link.
 * @param e the row
 * @returns kind, order and, when present, the note and the clock fields, tab-separated, trailing empty fields left out
 */
function eventLine(e: RcaShareEvent): string {
  const parts = [e.kind, String(e.order), cell(e.note), cell(e.clock.reported), cell(e.clock.offset), cell(e.clock.uncertainty)]; // every field
  while (parts.length > 2 && parts[parts.length - 1] === "") parts.pop(); // trailing empty fields carry nothing
  return parts.join("\t"); // the line
} // eventLine

/**
 * The notes check of a state (the page runs it once per change, for the button and the caution line).
 * @param s the state
 * @returns credentials and secret-looking names, each with its field: "event:<row number>", "summary" or "followups"
 */
export function checkRcaNotes(s: RcaShareState): NotesCheck {
  const fields: [string, string][] = s.events.map((e, i) => [`event:${i + 1}`, e.note]); // each event's note, by its row
  fields.push(["summary", s.notes.summary], ["followups", s.notes.followups]); // and the two notes
  return checkNotes(fields); // the site's check
} // checkRcaNotes

/**
 * The link values of a state.
 * @param s the state
 * @returns events, factors, confirmed and the notes (empty ones left out)
 */
export function rcaParams(s: RcaShareState): Record<string, string> {
  const observed = new Set(s.factors.map((f) => f.domain)); // ticked as observed
  const confirmed = new Set(s.factors.filter((f) => f.confirmed).map((f) => f.domain)); // ticked as confirmed
  const all: Record<string, string> = {
    events: s.events.map(eventLine).join("\n"), // one line per row
    factors: RCA_FACTOR_DOMAINS.filter((d) => observed.has(d)).join(","), // in the page's order
    confirmed: RCA_FACTOR_DOMAINS.filter((d) => confirmed.has(d)).join(","), // a subset of them
    summary: s.notes.summary, // as typed
    followups: s.notes.followups, // as typed
  }; // every value
  return Object.fromEntries(Object.entries(all).filter(([, x]) => x !== "")); // an empty one carries nothing
} // rcaParams

/**
 * The encoding of a state whose scaffold is shown.
 * @param s the state
 * @param check its notes check
 * @returns the values, or blocked when a note holds a credential
 */
export function encodeRcaShare(s: RcaShareState, check: NotesCheck): ShareEncoding {
  return encodeChecked(rcaParams(s), check); // checked
} // encodeRcaShare

/**
 * Read the timeline value.
 * @param value the link's events value
 * @returns the rows, or null when any line is malformed (an unknown kind, an order that is not the page's decimal form)
 */
function readEvents(value: string | null | undefined): RcaShareEvent[] | null {
  if (value === null || value === undefined) return null; // the timeline is required: the page always has at least one row
  const out: RcaShareEvent[] = []; // the rows
  for (const line of value.split("\n")) { // each row
    const f = line.split("\t"); // its fields
    if (f.length < 2 || f.length > 6) return null; // kind and order, then up to four more fields
    if (f.length > 2 && f[f.length - 1] === "") return null; // the encoder leaves trailing empty fields out
    if (!(RCA_EVENT_KINDS as readonly string[]).includes(f[0])) return null; // a kind the select offers
    const order = Number(f[1]); // the order
    if (f[1] === "" || !Number.isFinite(order) || String(order) !== f[1]) return null; // the decimal form the page writes
    if (f.some((x) => x.includes("\r"))) return null; // no stray line ends
    out.push({ kind: f[0] as EventKind, order, note: f[2] ?? "", clock: { reported: f[3] ?? "", offset: f[4] ?? "", uncertainty: f[5] ?? "" } }); // the row
  } // rows
  return out; // at least one
} // readEvents

/** The spec. */
export const RCA_SHARE: ShareSpec<RcaShareState> = Object.freeze({
  tool: "incident-timeline-rca-builder", // the slug
  posture: "input-caution", // the inventory's, kept (see the header)
  carriesKey: "share.carries", // tools.incident-timeline-rca-builder.share.carries
  names: ["events", "factors", "confirmed", "summary", "followups"], // a form: no "input"
  /** The timeline, factors and notes, or blocked on a credential in a note. */
  encode(s: RcaShareState): ShareEncoding {
    return encodeRcaShare(s, checkRcaNotes(s)); // checked, then encoded
  },
  /** The form, strictly: a malformed row, an unknown domain, a confirmation of an unobserved factor, a line break in a note. */
  decode(v: Readonly<Record<string, string | null>>): RcaShareState | null {
    const events = readEvents(v.events); // the timeline
    if (!events) return null; // malformed or absent
    const factors = readList(v.factors, FACTORS_LIST); // observed
    const confirmed = readList(v.confirmed, CONFIRMED_LIST); // confirmed
    if (!factors || !confirmed) return null; // malformed
    if (confirmed.some((d) => !factors.includes(d))) return null; // a confirmation needs an observation: the page never builds one without
    const summary = readNote(v.summary); // the summary
    const followups = readNote(v.followups); // the follow-ups
    if (summary === null || followups === null) return null; // a line break
    const state: RcaShareState = { events, factors: factors.map((d) => ({ domain: d as FactorDomain, confirmed: confirmed.includes(d) })), notes: { summary, followups } }; // the state
    try { validateInput({ events: events.map((e, i) => ({ id: `e${i + 1}`, kind: e.kind, order: e.order })), factors: state.factors }); } catch { return null; } // and the engine's own gate
    return state; // done
  },
});
