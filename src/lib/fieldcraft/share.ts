// ============================================================================
// src/lib/fieldcraft/share.ts
// ----------------------------------------------------------------------------
// "SHARE RESULTS" FOR THE OPERATIONS & FIELDCRAFT FORMS (2026-11-01). The
// eight fieldcraft tools are forms: closed-enum choices, a few checkbox lists
// and short free-text notes that flow only into the export (and, for two of
// them, into the packet or timeline the page shows). Their links share one
// shape, so the shape lives here, beside the family's schema and Markdown
// writer, and each tool's share.ts declares only its own fields:
//
//   choices  one select each, by its stable id; every choice always goes (a
//            link keeps its meaning if the page's starting choice changes),
//            and a choice a link lacks takes the page's starting value;
//   lists    a checkbox group, as its ids joined by "," in the form's own
//            order; an empty group carries nothing, and a group a link lacks
//            is that group's "absent" value (empty, or the one value a group
//            that may not be empty falls back to);
//   notes    the free-text fields, as typed, each left out when empty.
//
// No link name is "input": there is nothing to paste (ROLLOUT 11.3).
//
// THE NOTES CHECK. The notes are where internal topology, host names, people,
// customers and ticket numbers go, so every one of these tools carries a
// caution line. Before a link is offered the notes also go through the site's
// text secrets check (src/lib/share/text-secrets.ts, reused as is): a value
// that is a credential by its format (a PEM private key, Authorization
// credentials, an AWS access key ID, a JWS or JWE, a password in a URL, a
// FortiOS ENC value, a Cookie line) means no link, and the popover names the
// note; a value whose name only looks like a secret adds a caution line naming
// it, and the link is still offered (ANVIL's decisions of 01/11/2026: a box
// sent as written blocks on a definite credential rather than replacing it).
//
// Pure functions only, never throwing, every scan bounded by the link bound.
// ============================================================================

import { blockedBySecret, findShareSecretsIn, type ShareSecretFinding } from "../share/text-secrets"; // the site's text secrets check, reused as is
import type { ShareEncoding } from "../share/spec"; // what a spec's encode returns
import type { ShareParams } from "../share/format"; // the values of a link

/** One select of a form: its link name, its key in the tool's input, the ids it offers and its starting id. */
export interface FormChoice {
  /** The link name (SHARE_NAME_RE: a lowercase letter, then up to eleven lowercase letters or digits). */
  readonly name: string;
  /** The key in the tool's input object. */
  readonly key: string;
  /** The ids the select offers, in the page's order. */
  readonly options: readonly string[];
  /** The page's starting id (what an absent value becomes). */
  readonly start: string;
}

/** One checkbox group of a form. */
export interface FormList {
  /** The link name. */
  readonly name: string;
  /** The key in the tool's input object. */
  readonly key: string;
  /** The ids the group offers, in the form's canonical order (the order the page keeps them in). */
  readonly options: readonly string[];
  /** What an absent value becomes: [] for a group that may be empty, the fallback for one that may not. */
  readonly absent: readonly string[];
  /** An id that excludes every other one ("nothing-known", "nothing-yet"), if the group has one. */
  readonly exclusive?: string;
}

/** One free-text note of a form. */
export interface FormNote {
  /** The link name. */
  readonly name: string;
  /** The key in the tool's notes object. */
  readonly key: string;
  /** False for a text field that holds a number (a time budget), which the secrets check skips. */
  readonly check?: boolean;
}

/** A fieldcraft form's shape: what its link carries. */
export interface FormShape {
  /** The selects. */
  readonly choices: readonly FormChoice[];
  /** The checkbox groups. */
  readonly lists: readonly FormList[];
  /** The notes. */
  readonly notes: readonly FormNote[];
}

/** What the notes check found: credentials (no link) and secret-looking names (a caution line), each with its note. */
export interface NotesCheck {
  /** Values that are credentials by their format. */
  readonly secrets: readonly (ShareSecretFinding & { field: string })[];
  /** Values whose name looks like a secret. */
  readonly maybe: readonly (ShareSecretFinding & { field: string })[];
}

/**
 * Every link name of a form, in the order its link writes them.
 * @param shape the form's shape
 * @returns the names (choices, then lists, then notes)
 */
export function formNames(shape: FormShape): string[] {
  return [...shape.choices.map((c) => c.name), ...shape.lists.map((l) => l.name), ...shape.notes.map((n) => n.name)]; // all of them
} // formNames

/**
 * Check a form's notes for credentials and secret-looking names.
 * @param fields each note as [the name the popover reports, the text as typed]; empty ones are skipped
 * @returns the findings (none when the notes together are over the link bound: no link can carry them anyway)
 */
export function checkNotes(fields: readonly (readonly [string, string])[]): NotesCheck {
  const r = findShareSecretsIn(fields.filter(([, text]) => text !== "")); // the site's check, field by field
  return { secrets: r.secrets, maybe: r.maybe }; // over the bound: both empty, and the button says the link is too long
} // checkNotes

/**
 * The notes of a form as the check's fields, in the form's order.
 * @param shape the form's shape
 * @param notes the tool's notes object, as typed
 * @returns [link name, text] for each note
 */
export function noteFields(shape: FormShape, notes: object): [string, string][] {
  const byKey = notes as Readonly<Record<string, string | undefined>>; // read by key
  return shape.notes.filter((n) => n.check !== false).map((n) => [n.name, byKey[n.key] ?? ""]); // every free-text note, empty ones included (the check skips them)
} // noteFields

/**
 * A form's link values: every choice, every non-empty list, every non-empty note.
 * @param shape the form's shape
 * @param input the tool's input object (choices and lists by key)
 * @param notes the tool's notes object, as typed
 * @returns the values (empty ones are left out by the link builder too)
 */
export function formParams(shape: FormShape, input: object, notes: object): Record<string, string> {
  const inp = input as Readonly<Record<string, unknown>>; // read by key
  const txt = notes as Readonly<Record<string, string | undefined>>; // read by key
  const out: Record<string, string> = {}; // the values
  for (const c of shape.choices) out[c.name] = String(inp[c.key] ?? c.start); // every choice, by id
  for (const l of shape.lists) { // each group
    const have = new Set((inp[l.key] as readonly string[] | undefined) ?? []); // what is ticked
    const ids = l.options.filter((o) => have.has(o)); // in the form's order
    if (ids.length > 0) out[l.name] = ids.join(","); // a group with nothing ticked carries nothing
  } // lists
  for (const n of shape.notes) { const t = txt[n.key] ?? ""; if (t !== "") out[n.name] = t; } // each note, as typed
  return out; // done
} // formParams

/**
 * The encoding of a form whose result exists: no link while a note holds a credential, the values otherwise.
 * @param params the form's values (formParams)
 * @param check the notes check (the page runs it once, for the button and the caution line)
 * @returns blocked with code "secret" (field, line, label, more), or the values
 */
export function encodeChecked(params: ShareParams, check: NotesCheck): ShareEncoding {
  return blockedBySecret(check.secrets) ?? { ok: true, params }; // blocked, or the link
} // encodeChecked

/**
 * Read one select's value: absent takes the starting id, an id the select does not offer is malformed.
 * @param value the link's value, or null
 * @param c the select
 * @returns the id, or null when malformed
 */
export function readChoice(value: string | null | undefined, c: FormChoice): string | null {
  const v = value ?? c.start; // absent: the starting id
  return c.options.includes(v) ? v : null; // offered, or malformed
} // readChoice

/**
 * Read one checkbox group's value: ids joined by ",", each offered, none twice, in the form's order, the exclusive id
 * alone; absent is the group's absent value.
 * @param value the link's value, or null
 * @param l the group
 * @returns the ids in the form's order, or null when malformed
 */
export function readList(value: string | null | undefined, l: FormList): string[] | null {
  if (value === null || value === undefined) return [...l.absent]; // absent
  const ids = value.split(","); // the ids
  if (ids.some((id) => !l.options.includes(id))) return null; // one the group does not offer (an empty piece included)
  if (new Set(ids).size !== ids.length) return null; // one twice
  const ordered = l.options.filter((o) => ids.includes(o)); // the form's order
  if (ordered.join(",") !== value) return null; // the encoder writes the form's order only
  if (l.exclusive && ids.includes(l.exclusive) && ids.length > 1) return null; // the exclusive id with others: the page never builds that
  return ordered; // the group
} // readList

/**
 * Read one note: as typed, absent is empty; a line break is malformed (a one-line field cannot hold one).
 * @param value the link's value, or null
 * @returns the text, or null when malformed
 */
export function readNote(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return ""; // absent: empty
  return /[\r\n]/.test(value) ? null : value; // one line, as typed
} // readNote

/**
 * Read a whole form from a link's values.
 * @param shape the form's shape
 * @param v the link's values by name
 * @returns the input object (choices and lists by key) and the notes object (by key), or null when anything is malformed
 */
export function decodeForm(shape: FormShape, v: Readonly<Record<string, string | null>>): { input: Record<string, string | string[]>; notes: Record<string, string> } | null {
  const input: Record<string, string | string[]> = {}; // choices and lists
  for (const c of shape.choices) { const id = readChoice(v[c.name], c); if (id === null) return null; input[c.key] = id; } // each select
  for (const l of shape.lists) { const ids = readList(v[l.name], l); if (ids === null) return null; input[l.key] = ids; } // each group
  const notes: Record<string, string> = {}; // the notes
  for (const n of shape.notes) { const text = readNote(v[n.name]); if (text === null) return null; notes[n.key] = text; } // each note
  return { input, notes }; // the form
} // decodeForm
