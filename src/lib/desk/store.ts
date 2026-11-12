// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/store.ts
// ----------------------------------------------------------------------------
// WHAT "MY DESK" KEEPS, AND WHERE (PRIME 12/11/2026 12:42: "yes on the most
// functionally rich and user convenient options"; PLAN-personal-desk-20261112,
// sections 2, 3 and 4).
//
// ONE KEY IN THIS BROWSER: localStorage "ronutz:desk:v1", the same way the
// theme, the games' record and the "continue" trail are kept. Nothing here
// sends anything anywhere; the optional encrypted sync (src/lib/desk/sync.ts)
// is the only thing that ever leaves the browser, and only after the reader
// makes a sync code. The one count a save sends, track("save", ...), goes
// through the existing interest counts and only under the reader's existing
// yes (src/lib/interest/client.ts).
//
// WHAT IS KEPT. Identifiers only ("learn:acme-protocol"), never titles; days
// (YYYY-MM-DD, the reader's own calendar day), never times. Saved items and read
// marks, each with the day it was made; the days things were removed
// (tombstones, so a merge with another device's copy knows a removal from a
// never-had); the reader's paths (an id, a name the reader typed, the items in
// order, a revision number, and where it was adopted from, live or frozen); the
// settings and the page's layout, each with a revision number; notes (phase 4,
// excluded from sync unless the reader asks); the sync settings (the code, kept
// here and never sent); and a little bookkeeping (when the desk was started,
// whether persistent storage was asked for, the day of the last visit).
//
// HOW IT BEHAVES. Validated on every load and repaired rather than thrown away:
// a malformed entry is dropped, a missing part is filled with its default, and
// a stored text that cannot be read at all is kept in memory so the page can
// offer it as a file before anything overwrites it. A change in one tab reaches
// the others through the storage event. The first save asks the browser, once,
// to keep the site's storage (navigator.storage.persist()). Limits keep it
// small: 20 paths of 300 items, 1,000 saved items, 3,000 read marks.
//
// THE API (for the page, the controls, the sync client and the second builder):
// getDeskState / subscribeDesk / useDesk (src/lib/desk/useDesk.ts) to read;
// the verbs below to change; mergeDesks, syncedPart and repairDesk for sync,
// import and the guards.
// ============================================================================

// The identifiers: their kinds, their check, and the interest section of a kind.
import { COLLECTION_KINDS, isItemId, interestSectionOf, splitItemId, type ItemId } from "./ids";
// The one function that sends a count, only after the reader's yes.
import { track } from "@/lib/interest/client";

/** The one key the desk lives under. Versioned: a future shape migrates forward from this one. */
export const DESK_KEY = "ronutz:desk:v1";

/** The format version this code writes. */
export const DESK_FORMAT = 1;

/** The limits that keep the desk small enough to store, sync and draw quickly. */
export const DESK_LIMITS = {
  /** Paths a reader can keep. */
  paths: 20,
  /** Items in one path. */
  pathItems: 300,
  /** Saved items. */
  saved: 1000,
  /** Read marks. */
  read: 3000,
  /** Characters in a path's name. */
  nameLength: 80,
  /** Widgets on the page. */
  widgets: 24,
  /** Notes kept. */
  notes: 50,
  /** Characters in one note. */
  noteLength: 4000,
  /** Days a removal is remembered for merging with another device's copy. */
  tombDays: 120,
} as const;

/** A calendar day, YYYY-MM-DD. */
export type Day = string;

/** The shape of a day. */
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether a value is a day in the YYYY-MM-DD form.
 *
 * @param v anything
 * @returns true for a well-formed day
 */
export function isDay(v: unknown): v is Day {
  // A string of the right shape.
  return typeof v === "string" && DAY_RE.test(v);
}

/**
 * Today, as the reader's own calendar day (YYYY-MM-DD in local time): a day, never a time.
 *
 * @returns today's date
 */
export function today(): Day {
  // The local date's three parts.
  const d = new Date();
  // Zero-padded and joined.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * A day some number of days before another.
 *
 * @param day the starting day
 * @param n how many days back
 * @returns the earlier day
 */
function daysBefore(day: Day, n: number): Day {
  // Noon UTC, so no time zone moves the date.
  const t = Date.parse(`${day}T12:00:00Z`) - n * 86_400_000;
  // Back to YYYY-MM-DD.
  return new Date(t).toISOString().slice(0, 10);
}

/** The three sizes a widget can take; a phone ignores them and shows one column. */
export const WIDGET_SIZES = ["small", "medium", "wide"] as const;

/** One of the sizes. */
export type WidgetSize = (typeof WIDGET_SIZES)[number];

/** A widget's type: a short lower-case name. Unknown types are kept (a newer page may know them) and not drawn. */
const WIDGET_TYPE_RE = /^[a-z][a-z0-9-]{0,31}$/;

/** A widget's id: unique on the page. */
const WIDGET_ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;

/** The first set of widget types (phases 1 and 2); the page draws every type of the catalogue in src/lib/desk/layout.ts. */
export const FIRST_WIDGET_TYPES = ["continue", "paths", "favourites", "recent", "puzzles", "search"] as const;

/** One value of a widget's own settings. */
export type WidgetSettingValue = string | number | boolean;

/** One widget: an id, a type, a size, and its own small settings (an exam's date, a tool's id, ...). */
export interface DeskWidget {
  /** Unique on the page. */
  id: string;
  /** What it shows. */
  type: string;
  /** How much room it asks for on a wide screen. */
  size: WidgetSize;
  /** Its own settings, plain values only. */
  settings: Record<string, WidgetSettingValue>;
}

/** The page's layout: an ordered list of widgets, and a revision number for merging. */
export interface DeskLayout {
  /** Raised by every change, so a merge takes the newer layout whole. */
  rev: number;
  /** The widgets, in the reader's order. */
  widgets: DeskWidget[];
}

/** Where a path came from: a series, a training series or a reading path, followed live or copied once. */
export interface PathSource {
  /** The collection's identifier. */
  id: ItemId;
  /** live: follows the collection as it grows; frozen: a copy the reader owns and edits. */
  mode: "live" | "frozen";
}

/** One of the reader's paths. */
export interface DeskPath {
  /** A random id, unique in this desk. */
  id: string;
  /** The name the reader typed; empty for an adopted path, which shows its collection's title. */
  name: string;
  /** The items, in the reader's order. */
  items: ItemId[];
  /** Raised by every change, so a merge takes the newer copy of the path. */
  rev: number;
  /** Where it was adopted from, or null for a path the reader made. */
  from: PathSource | null;
  /** The day it was made. */
  day: Day;
}

/** The reader's settings for the desk. */
export interface DeskSettings {
  /** Raised by every change, for merging. */
  rev: number;
  /** Comfortable or compact: one setting for the whole page. */
  density: "comfortable" | "compact";
  /** Whether reaching the end of an article or an entry marks it read (with a one-tap undo). */
  autoRead: boolean;
}

/** One note (phase 4): free text the reader typed, kept here and synced only when the reader asks. */
export interface DeskNote {
  /** The text. */
  text: string;
  /** The day it was last changed. */
  day: Day;
  /** Raised by every change, for merging. */
  rev: number;
}

/** The sync settings. Kept in this browser only: never synced, never exported, never in a transfer link. */
export interface DeskSync {
  /** The sync code, 32 characters without separators (src/lib/desk/crypto.ts). */
  code: string;
  /** The version of the server's copy this browser last saw (0: none yet). */
  version: number;
  /** Whether a change is synced on its own, a few seconds later. */
  auto: boolean;
  /** Whether notes travel with the sync. Off unless the reader ticks it. */
  includeNotes: boolean;
  /** The day of the last successful sync, or null. */
  lastDay: Day | null;
}

/** The milestones a reader can reach (the site owner, 12/11/2026 15:22), in the order the page lists them. */
export const MILESTONES = ["read10", "path1", "week", "read50", "series1", "read100"] as const;

/** One milestone's id. */
export type MilestoneId = (typeof MILESTONES)[number];

/** How many days of reading are remembered (a little over a year: enough for any run the page shows). */
export const READING_DAYS_KEPT = 400;

/**
 * The reader's reading record (the site owner, 12/11/2026 15:22: "Reading streaks and milestones, all local and
 * portable"): the days on which something was marked read, the longest run, and the milestones reached. Days only,
 * never times; kept in this browser with the rest of the desk, and travelling with it (sync, file, link).
 */
export interface DeskReading {
  /** The days on which at least one item was marked read, oldest first, the last 400 at most. */
  days: Day[];
  /** The longest run of consecutive reading days reached (kept when old days drop out of the list). */
  best: number;
  /** Milestones reached: the day each was reached, and whether its one-time celebration has been shown. */
  marks: Partial<Record<MilestoneId, { d: Day; s: boolean }>>;
}

/** Bookkeeping that stays in this browser. */
export interface DeskMeta {
  /** The day the desk was first written. */
  created: Day;
  /** Whether persistent storage has been asked for (once, at the first save). */
  persistAsked: boolean;
  /** What the browser answered: true kept, false not promised, null not asked or not supported. */
  persisted: boolean | null;
  /** The day of the latest visit to the desk page. */
  lastVisit: Day | null;
  /** The day of the visit before it ("what changed since the last visit"). */
  prevVisit: Day | null;
}

/** Removals remembered for merging: the day an item was unsaved or unmarked, and a deleted path's last revision. */
export interface DeskTombs {
  /** Unsaved items, by the day they were removed. */
  saved: Record<string, Day>;
  /** Read marks taken off, by the day they were removed. */
  read: Record<string, Day>;
  /** Deleted paths, by the revision the deletion counts as (the path's last revision plus one). */
  paths: Record<string, number>;
}

/** The whole desk as stored. */
export interface DeskData {
  /** The format version. */
  v: 1;
  /** Saved items (favourites), in the order saved, with the day each was saved. */
  saved: Record<string, Day>;
  /** Read marks, with the day each was made. */
  read: Record<string, Day>;
  /** Removals, for merging. */
  tomb: DeskTombs;
  /** The reader's paths, in the reader's order. */
  paths: DeskPath[];
  /** The settings. */
  settings: DeskSettings;
  /** The layout. */
  layout: DeskLayout;
  /** Notes, by id. */
  notes: Record<string, DeskNote>;
  /** The reading record: days read, the longest run, milestones. */
  reading: DeskReading;
  /** The sync settings, or null when this browser does not sync. */
  sync: DeskSync | null;
  /** Bookkeeping. */
  meta: DeskMeta;
}

/** The part of the desk that syncs, exports and travels in a transfer link (no sync code, no bookkeeping). */
export interface DeskSynced {
  /** The format version. */
  v: 1;
  /** Saved items. */
  saved: Record<string, Day>;
  /** Read marks. */
  read: Record<string, Day>;
  /** Removals. */
  tomb: DeskTombs;
  /** Paths. */
  paths: DeskPath[];
  /** Settings. */
  settings: DeskSettings;
  /** Layout. */
  layout: DeskLayout;
  /** Notes, present only when they travel. */
  notes?: Record<string, DeskNote>;
  /** The reading record (absent in a copy made before it existed). */
  reading?: DeskReading;
}

/**
 * The first layout: the first set of widgets, in the plan's order (where was I and what is new, then the paths, the
 * favourites, what was read, the day's puzzles, and a search field).
 *
 * @returns a fresh layout at revision 0
 */
export function defaultLayout(): DeskLayout {
  // Revision 0: any layout the reader arranges beats it in a merge.
  return {
    rev: 0,
    widgets: [
      // Where was I: the path in progress and the last pages opened.
      { id: "continue", type: "continue", size: "wide", settings: {} },
      // What changed since the last visit (phase 3: the first row answers "where was I?" and "what is new?").
      { id: "news", type: "news", size: "wide", settings: {} },
      // The reader's paths with their progress.
      { id: "paths", type: "paths", size: "wide", settings: {} },
      // Saved items, tools as launch tiles.
      { id: "favourites", type: "favourites", size: "medium", settings: {} },
      // Recently read, with "updated since you read it".
      { id: "recent", type: "recent", size: "medium", settings: {} },
      // Today's puzzles, from the games' own record.
      { id: "puzzles", type: "puzzles", size: "small", settings: {} },
      // A search field.
      { id: "search", type: "search", size: "small", settings: {} },
    ],
  };
}

/**
 * An empty desk.
 *
 * @param day the day it is made
 * @returns a desk with nothing saved
 */
export function emptyDesk(day: Day = today()): DeskData {
  // Every part at its default.
  return {
    v: 1,
    saved: {},
    read: {},
    tomb: { saved: {}, read: {}, paths: {} },
    paths: [],
    settings: { rev: 0, density: "comfortable", autoRead: true },
    layout: defaultLayout(),
    notes: {},
    reading: { days: [], best: 0, marks: {} },
    sync: null,
    meta: { created: day, persistAsked: false, persisted: null, lastVisit: null, prevVisit: null },
  };
}

// ---------------------------------------------------------------------------
// Validation and repair: whatever was stored, a desk comes back.
// ---------------------------------------------------------------------------

/**
 * Whether a value is a plain object (not null, not an array).
 *
 * @param v anything
 * @returns true for a plain object
 */
function isObj(v: unknown): v is Record<string, unknown> {
  // Objects that are not arrays.
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * A non-negative whole number, or a fallback.
 *
 * @param v anything
 * @param fallback what to use otherwise
 * @returns the number
 */
function nat(v: unknown, fallback = 0): number {
  // Finite, whole, not negative.
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : fallback;
}

/** A path's id: short, random, lower case. */
const PATH_ID_RE = /^[a-z0-9]{4,24}$/;

/**
 * A fresh random id for a path or a note.
 *
 * @returns ten base-36 characters
 */
export function newId(): string {
  // Random bytes from the browser's generator where there is one.
  const bytes = new Uint8Array(10);
  // The cryptographic generator (every supported browser has it); Math.random only where it is missing.
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
  // A fallback for an environment without it (a test runner): not secret, only unique enough.
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  // Each byte to one base-36 character.
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

/**
 * Keep a map of identifier to day: well-formed identifiers only, a day for each (today for a value that is not one),
 * at most `max` entries (the newest kept).
 *
 * @param raw the stored value
 * @param max how many to keep
 * @param day today
 * @param count a counter of repairs
 * @returns the cleaned map, in its stored order
 */
function cleanMarks(raw: unknown, max: number, day: Day, count: { n: number }): Record<string, Day> {
  // Nothing usable: an empty map (a repair, unless it was simply absent).
  if (!isObj(raw)) {
    // Absent is normal for an older shape; anything else was damaged.
    if (raw !== undefined) count.n += 1;
    // Empty.
    return {};
  }
  // The entries kept, in order.
  const out: [string, Day][] = [];
  // Each stored entry.
  for (const [k, v] of Object.entries(raw)) {
    // Not an identifier: dropped.
    if (!isItemId(k)) { count.n += 1; continue; }
    // A day, or today for a value that says "yes" some other way.
    if (isDay(v)) out.push([k, v]);
    else if (v) { out.push([k, day]); count.n += 1; }
    else count.n += 1;
  }
  // Over the limit: the oldest dropped (stable sort by day keeps the stored order within a day).
  if (out.length > max) {
    // Newest first.
    const sorted = [...out].sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0)).slice(0, max);
    // Kept as a set.
    const keep = new Set(sorted.map(([k]) => k));
    // Counted.
    count.n += out.length - max;
    // In the stored order.
    return Object.fromEntries(out.filter(([k]) => keep.has(k)));
  }
  // As stored.
  return Object.fromEntries(out);
}

/**
 * Keep the removals: identifier to day for saved and read, path id to revision for paths; drop any older than the
 * limit (both devices will have synced long before).
 *
 * @param raw the stored value
 * @param day today
 * @param count a counter of repairs
 * @returns the cleaned removals
 */
function cleanTombs(raw: unknown, day: Day, count: { n: number }): DeskTombs {
  // The oldest day remembered.
  const oldest = daysBefore(day, DESK_LIMITS.tombDays);
  // The stored object, or nothing.
  const t = isObj(raw) ? raw : {};
  // A damaged value is a repair.
  if (raw !== undefined && !isObj(raw)) count.n += 1;
  // Day maps: well-formed, recent.
  const days = (m: unknown): Record<string, Day> =>
    Object.fromEntries(Object.entries(isObj(m) ? m : {}).filter(([k, v]) => isItemId(k) && isDay(v) && v >= oldest)) as Record<string, Day>;
  // Path removals: an id and a revision.
  const paths = Object.fromEntries(Object.entries(isObj(t.paths) ? t.paths : {}).filter(([k, v]) => PATH_ID_RE.test(k) && nat(v, -1) >= 0)) as Record<string, number>;
  // The three maps.
  return { saved: days(t.saved), read: days(t.read), paths };
}

/**
 * Keep the paths: each with an id, a name, unique well-formed items within the limit, a revision, a source and a day.
 *
 * @param raw the stored value
 * @param day today
 * @param count a counter of repairs
 * @returns the cleaned paths
 */
function cleanPaths(raw: unknown, day: Day, count: { n: number }): DeskPath[] {
  // Not a list: none (a repair unless absent).
  if (!Array.isArray(raw)) {
    // Absent is normal.
    if (raw !== undefined) count.n += 1;
    // None.
    return [];
  }
  // Ids seen so far, so a duplicate gets a new one.
  const ids = new Set<string>();
  // The cleaned paths.
  const out: DeskPath[] = [];
  // Each stored path.
  for (const p of raw) {
    // Not an object: dropped.
    if (!isObj(p)) { count.n += 1; continue; }
    // Its id, or a new one when missing, malformed or already taken.
    let id = typeof p.id === "string" && PATH_ID_RE.test(p.id) && !ids.has(p.id) ? p.id : "";
    // Replaced.
    if (!id) { id = newId(); count.n += 1; }
    // Taken.
    ids.add(id);
    // The name, as text, trimmed to the limit.
    const name = typeof p.name === "string" ? p.name.slice(0, DESK_LIMITS.nameLength) : "";
    // The items: identifiers only, each once, within the limit.
    const items: ItemId[] = [];
    // Each stored item.
    for (const it of Array.isArray(p.items) ? p.items : []) {
      // Kept when well formed, new to this path and within the limit.
      if (isItemId(it) && !items.includes(it) && items.length < DESK_LIMITS.pathItems) items.push(it);
      else count.n += 1;
    }
    // The source: a collection and a mode, or none.
    const f = isObj(p.from) ? p.from : null;
    // Valid only for a collection identifier and a known mode.
    const from: PathSource | null =
      f && isItemId(f.id) && COLLECTION_KINDS.includes(splitItemId(f.id).kind) && (f.mode === "live" || f.mode === "frozen")
        ? { id: f.id, mode: f.mode }
        : null;
    // A source that was there but did not pass is a repair.
    if (p.from != null && from === null) count.n += 1;
    // The path.
    out.push({ id, name, items, rev: nat(p.rev), from, day: isDay(p.day) ? p.day : day });
    // At the limit: the rest dropped.
    if (out.length >= DESK_LIMITS.paths) {
      // Counted.
      count.n += Math.max(0, raw.length - out.length);
      // Stopped.
      break;
    }
  }
  // The paths kept.
  return out;
}

/**
 * Keep the layout: a revision and the well-formed widgets, each id once, within the limit.
 *
 * @param raw the stored value
 * @param count a counter of repairs
 * @returns the cleaned layout (the first layout when nothing usable was stored)
 */
function cleanLayout(raw: unknown, count: { n: number }): DeskLayout {
  // Nothing usable: the first layout.
  if (!isObj(raw) || !Array.isArray(raw.widgets)) {
    // Absent is normal.
    if (raw !== undefined) count.n += 1;
    // The default.
    return defaultLayout();
  }
  // Ids seen.
  const ids = new Set<string>();
  // The widgets kept.
  const widgets: DeskWidget[] = [];
  // Each stored widget.
  for (const w of raw.widgets) {
    // An object with an id and a type of the right shapes, its id new.
    if (!isObj(w) || typeof w.id !== "string" || !WIDGET_ID_RE.test(w.id) || ids.has(w.id) || typeof w.type !== "string" || !WIDGET_TYPE_RE.test(w.type)) {
      // Dropped.
      count.n += 1;
      // Next.
      continue;
    }
    // Taken.
    ids.add(w.id);
    // Its settings: plain values only (short text, finite numbers, booleans).
    const settings: Record<string, WidgetSettingValue> = {};
    // Each stored setting.
    for (const [k, v] of Object.entries(isObj(w.settings) ? w.settings : {})) {
      // A short key and a plain value.
      if (/^[a-zA-Z][a-zA-Z0-9]{0,31}$/.test(k) && ((typeof v === "string" && v.length <= 200) || (typeof v === "number" && Number.isFinite(v)) || typeof v === "boolean")) settings[k] = v;
      else count.n += 1;
    }
    // The size, or medium for one that is not known.
    const size = (WIDGET_SIZES as readonly string[]).includes(w.size as string) ? (w.size as WidgetSize) : "medium";
    // A changed size is a repair.
    if (size !== w.size) count.n += 1;
    // Kept.
    widgets.push({ id: w.id, type: w.type, size, settings });
    // At the limit.
    if (widgets.length >= DESK_LIMITS.widgets) break;
  }
  // The layout.
  return { rev: nat(raw.rev), widgets };
}

/**
 * Keep the notes: text within the limit, a day and a revision each, at most the limit.
 *
 * @param raw the stored value
 * @param day today
 * @param count a counter of repairs
 * @returns the cleaned notes
 */
function cleanNotes(raw: unknown, day: Day, count: { n: number }): Record<string, DeskNote> {
  // Nothing stored.
  if (!isObj(raw)) {
    // Absent is normal.
    if (raw !== undefined) count.n += 1;
    // None.
    return {};
  }
  // The notes kept.
  const out: Record<string, DeskNote> = {};
  // The oldest day an emptied note is remembered (its emptying has reached every browser long before).
  const oldest = daysBefore(day, DESK_LIMITS.tombDays);
  // Each stored note.
  for (const [k, v] of Object.entries(raw)) {
    // A short id and an object with text.
    if (!/^[a-z0-9:-]{1,120}$/.test(k) || !isObj(v) || typeof v.text !== "string") { count.n += 1; continue; }
    // An emptied note past the limit: forgotten (not a repair).
    if (v.text === "" && isDay(v.day) && v.day < oldest) continue;
    // Kept, trimmed to the limit.
    out[k] = { text: v.text.slice(0, DESK_LIMITS.noteLength), day: isDay(v.day) ? v.day : day, rev: nat(v.rev) };
    // At the limit.
    if (Object.keys(out).length >= DESK_LIMITS.notes) break;
  }
  // The notes.
  return out;
}

/**
 * The length of the run of consecutive days ending on a day.
 *
 * @param set the reading days
 * @param day the last day of the run
 * @returns how many days in a row end there (0 when that day is not a reading day)
 */
export function runEndingAt(set: ReadonlySet<Day>, day: Day): number {
  // The count.
  let n = 0;
  // Back one day at a time while the day was a reading day.
  for (let d = day; set.has(d); d = daysBefore(d, 1)) n += 1;
  // The run.
  return n;
}

/**
 * The longest run of consecutive days in a list of days.
 *
 * @param days the reading days, in any order
 * @returns the longest run
 */
export function longestRun(days: readonly Day[]): number {
  // As a set.
  const set = new Set(days);
  // The longest so far.
  let best = 0;
  // Each day that starts a run (the day before it was not a reading day).
  for (const d of set) {
    // Not a start: counted from its run's start.
    if (set.has(daysBefore(d, 1))) continue;
    // The run's length, counted forwards.
    let n = 0;
    // Forwards while it lasts.
    for (let x = d; set.has(x); x = daysBefore(x, -1)) n += 1;
    // Kept when longer.
    best = Math.max(best, n);
  }
  // The longest.
  return best;
}

/**
 * Keep the reading record: well-formed unique days, sorted, the last 400; the longest run at least the list's own;
 * known milestones with a day. A desk written before the record existed is given one from its read marks' days.
 *
 * @param raw the stored value
 * @param read the desk's read marks (the seed for an older desk)
 * @param count a counter of repairs
 * @returns the cleaned record
 */
function cleanReading(raw: unknown, read: Record<string, Day>, count: { n: number }): DeskReading {
  // Absent: an older desk, seeded from the days of its read marks (not a repair).
  if (raw === undefined) {
    // The days its marks carry.
    const days = [...new Set(Object.values(read))].sort().slice(-READING_DAYS_KEPT);
    // The record.
    return { days, best: longestRun(days), marks: {} };
  }
  // The days every read mark held now carries: each is a day on which something was read, whatever the record says
  // (a desk imported from a file or merged from an older copy can carry marks the record never saw).
  const markDays = Object.values(read);
  // Not an object: a record from the marks alone, and a repair.
  if (!isObj(raw)) { count.n += 1; const seed = [...new Set(markDays)].sort().slice(-READING_DAYS_KEPT); return { days: seed, best: longestRun(seed), marks: {} }; }
  // The days: well formed, each once, with the marks' own days, oldest first, the last 400.
  const days = [...new Set([...(Array.isArray(raw.days) ? raw.days : []).filter(isDay), ...markDays])].sort().slice(-READING_DAYS_KEPT);
  // The milestones: known ids with a day.
  const marks: DeskReading["marks"] = {};
  // Each stored one.
  for (const [k, v] of Object.entries(isObj(raw.marks) ? raw.marks : {})) {
    // A known id, an object with a day.
    if ((MILESTONES as readonly string[]).includes(k) && isObj(v) && isDay(v.d)) marks[k as MilestoneId] = { d: v.d, s: v.s === true };
    // Anything else is dropped.
    else count.n += 1;
  }
  // The record, the longest run never below the list's own.
  return { days, best: Math.max(nat(raw.best), longestRun(days)), marks };
}

/** A sync code as stored: 32 Crockford base-32 characters (no I, L, O or U). */
const SYNC_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{32}$/;

/**
 * Keep the sync settings, or none.
 *
 * @param raw the stored value
 * @param count a counter of repairs
 * @returns the sync settings or null
 */
function cleanSync(raw: unknown, count: { n: number }): DeskSync | null {
  // Not syncing.
  if (raw === null || raw === undefined) return null;
  // A damaged value: not syncing (the reader can enter the code again).
  if (!isObj(raw) || typeof raw.code !== "string" || !SYNC_CODE_RE.test(raw.code)) { count.n += 1; return null; }
  // Kept.
  return { code: raw.code, version: nat(raw.version), auto: raw.auto !== false, includeNotes: raw.includeNotes === true, lastDay: isDay(raw.lastDay) ? raw.lastDay : null };
}

/**
 * Validate a stored desk and repair what is wrong, rather than throw it away. Also the migration point: a desk
 * written before a field existed gets the field's default.
 *
 * @param raw what was parsed from storage, a file, a link or the sync server
 * @param day today
 * @returns the repaired desk and how many things were repaired
 */
export function repairDesk(raw: unknown, day: Day = today()): { data: DeskData; repairs: number } {
  // The repair counter.
  const count = { n: 0 };
  // Not an object at all: an empty desk.
  if (!isObj(raw)) return { data: emptyDesk(day), repairs: raw == null ? 0 : 1 };
  // A version this code does not know is read as the nearest it knows (version 1), and said to be a repair.
  if (raw.v !== 1) count.n += 1;
  // The settings, field by field.
  const s = isObj(raw.settings) ? raw.settings : {};
  // The bookkeeping, field by field.
  const m = isObj(raw.meta) ? raw.meta : {};
  // The desk, each part cleaned.
  const data: DeskData = {
    v: 1,
    saved: cleanMarks(raw.saved, DESK_LIMITS.saved, day, count),
    read: cleanMarks(raw.read, DESK_LIMITS.read, day, count),
    tomb: cleanTombs(raw.tomb, day, count),
    paths: cleanPaths(raw.paths, day, count),
    settings: {
      rev: nat(s.rev),
      density: s.density === "compact" ? "compact" : "comfortable",
      autoRead: s.autoRead !== false,
    },
    layout: cleanLayout(raw.layout, count),
    notes: cleanNotes(raw.notes, day, count),
    reading: { days: [], best: 0, marks: {} },
    sync: cleanSync(raw.sync, count),
    meta: {
      created: isDay(m.created) ? m.created : day,
      persistAsked: m.persistAsked === true,
      persisted: typeof m.persisted === "boolean" ? m.persisted : null,
      lastVisit: isDay(m.lastVisit) ? m.lastVisit : null,
      prevVisit: isDay(m.prevVisit) ? m.prevVisit : null,
    },
  };
  // The reading record, seeded from the read marks when an older desk has none.
  data.reading = cleanReading(raw.reading, data.read, count);
  // A path deleted and still listed: the live copy wins only with a higher revision.
  data.paths = data.paths.filter((p) => !(p.id in data.tomb.paths) || data.tomb.paths[p.id] <= p.rev);
  // The desk and the count.
  return { data, repairs: count.n };
}

// ---------------------------------------------------------------------------
// Merging two copies (sync conflicts, imports): the rule of the sync contract.
// ---------------------------------------------------------------------------

/**
 * The later of two days (either may be missing).
 *
 * @param a one day or undefined
 * @param b the other or undefined
 * @returns the later, or undefined when both are missing
 */
function laterDay(a: Day | undefined, b: Day | undefined): Day | undefined {
  // One missing: the other.
  if (!a) return b;
  // The other missing: this one.
  if (!b) return a;
  // YYYY-MM-DD sorts as a date.
  return a >= b ? a : b;
}

/**
 * Merge one kind of mark (saved or read): the union, where a removal wins only if its day is later than the latest
 * add on either side.
 *
 * @param aAdd this side's marks
 * @param aTomb this side's removals
 * @param bAdd the other side's marks
 * @param bTomb the other side's removals
 * @returns the merged marks and removals, this side's order first
 */
function mergeMarks(aAdd: Record<string, Day>, aTomb: Record<string, Day>, bAdd: Record<string, Day>, bTomb: Record<string, Day>): { add: Record<string, Day>; tomb: Record<string, Day> } {
  // Every identifier either side knows, this side's order first.
  const keys = [...new Set([...Object.keys(aAdd), ...Object.keys(bAdd), ...Object.keys(aTomb), ...Object.keys(bTomb)])];
  // The merged marks and removals.
  const add: Record<string, Day> = {};
  // Removals that still stand.
  const tomb: Record<string, Day> = {};
  // Each identifier.
  for (const k of keys) {
    // The latest add, and the latest removal.
    const added = laterDay(aAdd[k], bAdd[k]);
    // The latest removal.
    const removed = laterDay(aTomb[k], bTomb[k]);
    // Present unless a removal came on a later day.
    if (added && !(removed && removed > added)) add[k] = added;
    // Otherwise remembered as removed.
    else if (removed) tomb[k] = removed;
  }
  // Both.
  return { add, tomb };
}

/**
 * Merge two copies of the synced part of a desk, by the sync contract: saved and read as unions (a removal wins only
 * when its day is later than the other side's add), paths by id taking the higher revision (a deletion counts as the
 * revision after the path's last), settings and layout whole from the side with the higher revision, notes by id
 * taking the higher revision. On a tie, this side ("a", the local copy) wins.
 *
 * @param a this side
 * @param b the other side
 * @returns the merged synced part
 */
export function mergeDesks(a: DeskSynced, b: DeskSynced): DeskSynced {
  // Saved items.
  const saved = mergeMarks(a.saved, a.tomb.saved, b.saved, b.tomb.saved);
  // Read marks.
  const read = mergeMarks(a.read, a.tomb.read, b.read, b.tomb.read);
  // Path removals: the higher revision of each.
  const pathTombs: Record<string, number> = { ...a.tomb.paths };
  // The other side's.
  for (const [id, rev] of Object.entries(b.tomb.paths)) pathTombs[id] = Math.max(pathTombs[id] ?? 0, rev);
  // The other side's paths by id.
  const bById = new Map(b.paths.map((p) => [p.id, p]));
  // This side's ids.
  const aIds = new Set(a.paths.map((p) => p.id));
  // The merged paths: this side's order, then the other side's new ones.
  const paths: DeskPath[] = [];
  // Each candidate.
  for (const p of [...a.paths, ...b.paths.filter((q) => !aIds.has(q.id))]) {
    // The other side's copy of the same path, if any.
    const other = bById.get(p.id);
    // The higher revision; this side on a tie.
    const best = other && other.rev > p.rev ? other : p;
    // Deleted at a revision at least as high: gone.
    if ((pathTombs[best.id] ?? -1) > best.rev) continue;
    // A live path outlives a stale removal: the removal is forgotten.
    delete pathTombs[best.id];
    // Kept.
    paths.push(best);
  }
  // The reading record: the days of both, the longer best run, every milestone (its earlier day; shown if either showed it).
  const reading = mergeReading(a.reading, b.reading);
  // Notes: only when both sides carry them is there anything to merge; otherwise whichever has them.
  let notes: Record<string, DeskNote> | undefined = a.notes ?? b.notes;
  // Both carry notes.
  if (a.notes && b.notes) {
    // This side's, then the other's where newer.
    notes = { ...a.notes };
    // Each of the other side's notes.
    for (const [id, n] of Object.entries(b.notes)) if (!notes[id] || n.rev > notes[id].rev) notes[id] = n;
  }
  // The merged desk.
  return {
    v: 1,
    saved: saved.add,
    read: read.add,
    tomb: { saved: saved.tomb, read: read.tomb, paths: pathTombs },
    paths: paths.slice(0, DESK_LIMITS.paths),
    settings: b.settings.rev > a.settings.rev ? b.settings : a.settings,
    layout: b.layout.rev > a.layout.rev ? b.layout : a.layout,
    ...(notes ? { notes } : {}),
    ...(reading ? { reading } : {}),
  };
}

/**
 * Merge two reading records: the union of the days (the last 400), the longer best run, every milestone with the
 * earlier day it was reached and "celebrated" when either side celebrated it. Either side may be absent (an older copy).
 *
 * @param a this side's record
 * @param b the other side's
 * @returns the merged record, or undefined when neither side has one
 */
function mergeReading(a: DeskReading | undefined, b: DeskReading | undefined): DeskReading | undefined {
  // One side only, or none.
  if (!a || !b) return a ?? b;
  // The days of both.
  const days = [...new Set([...a.days, ...b.days])].sort().slice(-READING_DAYS_KEPT);
  // Every milestone either side reached.
  const marks: DeskReading["marks"] = { ...b.marks };
  // This side's over them.
  for (const [k, v] of Object.entries(a.marks) as [MilestoneId, { d: Day; s: boolean }][]) {
    // The other side's.
    const o = marks[k];
    // The earlier day; celebrated when either side showed it.
    marks[k] = o ? { d: o.d < v.d ? o.d : v.d, s: o.s || v.s } : v;
  }
  // The record.
  return { days, best: Math.max(a.best, b.best, longestRun(days)), marks };
}

/**
 * The part of a desk that syncs and travels: everything but the sync code and the bookkeeping, and the notes only
 * when asked.
 *
 * @param d the desk
 * @param includeNotes whether the notes go too
 * @returns the synced part
 */
export function syncedPart(d: DeskData, includeNotes: boolean): DeskSynced {
  // The shared parts.
  const out: DeskSynced = { v: 1, saved: d.saved, read: d.read, tomb: d.tomb, paths: d.paths, settings: d.settings, layout: d.layout, reading: d.reading };
  // Notes only on request.
  if (includeNotes) out.notes = d.notes;
  // Done.
  return out;
}

/**
 * Put a synced part back into a desk, keeping this browser's own parts (the sync settings, the bookkeeping, and the
 * notes when the synced part carries none).
 *
 * @param d the desk
 * @param s the synced part
 * @returns the new desk
 */
export function withSynced(d: DeskData, s: DeskSynced): DeskData {
  // Repaired first: a synced part from a file or the server is outside data.
  const fixed = repairDesk({ ...s, sync: d.sync, meta: d.meta, notes: s.notes ?? d.notes, reading: s.reading ?? d.reading }).data;
  // The local parts kept as they were.
  return { ...fixed, sync: d.sync, meta: d.meta };
}

// ---------------------------------------------------------------------------
// The live store: one copy in memory, written through to localStorage.
// ---------------------------------------------------------------------------

/** How the desk's storage stands, said in words on the page. */
export type DeskStatus =
  | "ok" // read and written normally
  | "unavailable" // the browser refuses storage: the desk lasts only while the page is open
  | "cleared" // the desk was cleared while the page was open (another tab, or the browser)
  | "damaged"; // what was stored could not be read at all; it is kept in memory to be saved as a file

/** What a change came from, so the sync client can tell the reader's changes from its own. */
export type DeskOrigin = "user" | "sync" | "tab" | "local";

/** The desk as the page reads it. */
export interface DeskState {
  /** False on the server and before the first read in the browser. */
  ready: boolean;
  /** The desk. */
  data: DeskData;
  /** How the storage stands. */
  status: DeskStatus;
  /** How many things the last load repaired (0 when all was well). */
  repairs: number;
  /** What was stored when it could not be read, kept so the page can offer it as a file; null otherwise. */
  damagedText: string | null;
}

/** The state shown on the server and in the first render (nothing read yet), one object so React sees it as stable. */
const SERVER_STATE: DeskState = { ready: false, data: emptyDesk("2000-01-01"), status: "ok", repairs: 0, damagedText: null };

/** The state in this page, once read. */
let state: DeskState = SERVER_STATE;

/** Whoever listens for changes, with the origin of each. */
const listeners = new Set<(origin: DeskOrigin) => void>();

/** Whether the storage event is being listened for. */
let listening = false;

/**
 * Read the desk from localStorage into memory, repairing as needed.
 *
 * @returns the state read
 */
function readFromStorage(): DeskState {
  // The day, for defaults and repairs.
  const day = today();
  // The stored text.
  let raw: string | null = null;
  // Reading can throw (storage disabled, a private window).
  try {
    // The one key.
    raw = window.localStorage.getItem(DESK_KEY);
  } catch {
    // No storage at all: an empty desk that cannot be kept.
    return { ready: true, data: emptyDesk(day), status: "unavailable", repairs: 0, damagedText: null };
  }
  // Nothing stored yet: a new, empty desk.
  if (raw === null) return { ready: true, data: emptyDesk(day), status: "ok", repairs: 0, damagedText: null };
  // The parsed value.
  let parsed: unknown;
  // Malformed text throws.
  try {
    // As JSON.
    parsed = JSON.parse(raw);
  } catch {
    // Unreadable: kept in memory, offered as a file, and an empty desk until the reader changes something.
    return { ready: true, data: emptyDesk(day), status: "damaged", repairs: 1, damagedText: raw };
  }
  // Repaired, not thrown away.
  const { data, repairs } = repairDesk(parsed, day);
  // Read.
  return { ready: true, data, status: "ok", repairs, damagedText: null };
}

/**
 * Make sure the desk has been read in this page, and that changes in other tabs are followed.
 */
function ensureLoaded(): void {
  // Nothing to read on the server.
  if (typeof window === "undefined") return;
  // Read once.
  if (!state.ready) state = readFromStorage();
  // Listened for once.
  if (listening) return;
  // Listening from now on.
  listening = true;
  // Another tab's change: read again, without writing back.
  window.addEventListener("storage", (e: StorageEvent) => {
    // Only this key, or a clear of the whole storage (key null).
    if (e.key !== null && e.key !== DESK_KEY) return;
    // Removed or cleared: say so on the page.
    if (e.key === null || e.newValue === null) {
      // An empty desk, marked as cleared, with this browser's sync settings forgotten too (they were in the same key).
      state = { ready: true, data: emptyDesk(), status: "cleared", repairs: 0, damagedText: null };
    } else {
      // The other tab's text, repaired.
      let parsed: unknown = null;
      // Malformed text throws.
      try { parsed = JSON.parse(e.newValue); } catch { parsed = null; }
      // A valid desk from the other tab.
      state = { ...state, ready: true, data: repairDesk(parsed).data, status: "ok", repairs: 0 };
    }
    // Everyone told.
    notify("tab");
  });
}

/**
 * Tell every listener that the desk changed.
 *
 * @param origin what the change came from
 */
function notify(origin: DeskOrigin): void {
  // Each listener, isolated: one failing listener must not stop the rest.
  for (const fn of [...listeners]) {
    // Called.
    try { fn(origin); } catch { /* a listener's fault is its own */ }
  }
}

/**
 * The desk as it stands (the server's empty state on the server and before hydration).
 *
 * @returns the state
 */
export function getDeskState(): DeskState {
  // Read on first use in the browser.
  ensureLoaded();
  // The current state object (the same object until something changes, as React's external store expects).
  return state;
}

/**
 * The state used on the server and during hydration.
 *
 * @returns the empty, not-ready state
 */
export function getServerDeskState(): DeskState {
  // One constant object.
  return SERVER_STATE;
}

/**
 * Listen for changes.
 *
 * @param fn called after every change, with what it came from
 * @returns a function that stops listening
 */
export function subscribeDesk(fn: (origin: DeskOrigin) => void): () => void {
  // Read and follow other tabs from the first listener on.
  ensureLoaded();
  // Added.
  listeners.add(fn);
  // The way to stop.
  return () => { listeners.delete(fn); };
}

/**
 * Write a new desk: into memory at once, and through to localStorage when the browser allows.
 *
 * @param next the new desk
 * @param origin what the change came from
 */
export function commitDesk(next: DeskData, origin: DeskOrigin): void {
  // The status after this write: a successful write ends "cleared" and "damaged".
  let status: DeskStatus = "ok";
  // Writing can throw (full, disabled, a private window).
  try {
    // The whole desk as JSON.
    window.localStorage.setItem(DESK_KEY, JSON.stringify(next));
  } catch {
    // Refused: the desk lives in this page only.
    status = "unavailable";
  }
  // The new state; what could not be read stays offered as a file until the page is left.
  state = { ready: true, data: next, status, repairs: 0, damagedText: state.damagedText };
  // Everyone told.
  notify(origin);
}

/**
 * Change the desk through a function on a copy of it. The function returns false to say nothing changed.
 *
 * @param change edits the copy in place; returns false when there is nothing to write
 * @param origin what the change came from
 * @returns whether anything was written
 */
function mutate(change: (d: DeskData) => boolean | void, origin: DeskOrigin = "user"): boolean {
  // Nothing to change outside a browser.
  if (typeof window === "undefined") return false;
  // Read first.
  ensureLoaded();
  // A deep copy, so the state React holds is never edited in place.
  const copy = structuredClone(state.data);
  // The change.
  if (change(copy) === false) return false;
  // Written.
  commitDesk(copy, origin);
  // Changed.
  return true;
}

// ---------------------------------------------------------------------------
// Saved items and read marks.
// ---------------------------------------------------------------------------

/**
 * Whether an item is saved.
 *
 * @param d the desk
 * @param id the item
 * @returns true when saved
 */
export function isSaved(d: DeskData, id: ItemId): boolean {
  // In the map.
  return id in d.saved;
}

/**
 * Whether an item is marked read (or done).
 *
 * @param d the desk
 * @param id the item
 * @returns true when marked
 */
export function isRead(d: DeskData, id: ItemId): boolean {
  // In the map.
  return id in d.read;
}

/** What saving an item did. */
export type SaveResult = "saved" | "already" | "limit";

/**
 * Save an item. Sends the one "save" interest count (only under the reader's yes) and, the first time anything is
 * saved, asks the browser once to keep the site's storage.
 *
 * @param id the item
 * @returns saved, already saved, or the limit reached
 */
export function saveItem(id: ItemId): SaveResult {
  // The outcome, set inside the change.
  let result: SaveResult = "saved";
  // The change.
  mutate((d) => {
    // Already there: nothing to write.
    if (id in d.saved) { result = "already"; return false; }
    // At the limit: refused, in words on the page.
    if (Object.keys(d.saved).length >= DESK_LIMITS.saved) { result = "limit"; return false; }
    // Saved today.
    d.saved[id] = today();
    // Its removal forgotten.
    delete d.tomb.saved[id];
  });
  // Only a real save counts and asks for storage.
  if (result === "saved") {
    // The item's parts.
    const { kind, slug } = splitItemId(id);
    // The one count a save sends (src/lib/interest/client.ts: nothing without the reader's yes).
    track("save", interestSectionOf(kind), slug);
    // Asked once.
    void askPersistOnce();
  }
  // The outcome.
  return result;
}

/**
 * Unsave an item (remembering the day, for merging). Never counted.
 *
 * @param id the item
 * @returns whether it was saved
 */
export function unsaveItem(id: ItemId): boolean {
  // The change.
  return mutate((d) => {
    // Not saved: nothing to do.
    if (!(id in d.saved)) return false;
    // Removed.
    delete d.saved[id];
    // Remembered.
    d.tomb.saved[id] = today();
  });
}

// ---------------------------------------------------------------------------
// The reading record: days read, the longest run, milestones (the site owner, 12/11/2026 15:22).
// ---------------------------------------------------------------------------

/**
 * The milestones the desk alone can tell (every one but "a series completed", which needs the site index).
 *
 * @param d the desk
 * @returns the milestones its state has reached
 */
export function deskMilestones(d: DeskData): MilestoneId[] {
  // The read marks' count.
  const n = Object.keys(d.read).length;
  // The reached ones.
  const out: MilestoneId[] = [];
  // Ten, fifty and a hundred items read.
  if (n >= 10) out.push("read10");
  // Fifty.
  if (n >= 50) out.push("read50");
  // A hundred.
  if (n >= 100) out.push("read100");
  // A week's run of reading days (now or ever).
  if (d.reading.best >= 7) out.push("week");
  // A path with items, every one read.
  if (d.paths.some((p) => p.items.length > 0 && p.items.every((i) => i in d.read))) out.push("path1");
  // Reached.
  return out;
}

/** The read-count milestones and the count each needs. */
const COUNT_MILESTONES: Partial<Record<MilestoneId, number>> = { read10: 10, read50: 50, read100: 100 };

/**
 * The day a milestone the desk has reached was in fact reached, as far as the desk can tell: for a count, the day of
 * the mark that made the count (the marks ordered by day); for a week's run, the seventh day of the first run of seven;
 * otherwise (a path, a series) today, the day it is first seen. Never a day later than today.
 *
 * @param d the desk
 * @param id the milestone
 * @returns its day
 */
export function milestoneDay(d: DeskData, id: MilestoneId): Day {
  // Today, the latest a milestone can be dated.
  const now = today();
  // A count: the n-th mark by day.
  const need = COUNT_MILESTONES[id];
  // Counted.
  if (need !== undefined) {
    // The marks' days, oldest first.
    const days = Object.values(d.read).sort();
    // The day of the mark that made the count, or today when the marks no longer reach it.
    const at = days[need - 1];
    // Never later than today.
    return at && at <= now ? at : now;
  }
  // A week's run: the first day on which seven days in a row had been read.
  if (id === "week") {
    // The reading days as a set.
    const set = new Set(d.reading.days);
    // The first day, oldest first, that ends a run of seven.
    const at = [...d.reading.days].sort().find((x) => runEndingAt(set, x) >= 7);
    // Never later than today.
    return at && at <= now ? at : now;
  }
  // A path or a series: the day it is seen.
  return now;
}

/**
 * Inside a change: record a day as a reading day, raise the longest run, and record the milestones now reached.
 *
 * @param d the desk being changed
 * @param day the day
 */
function noteReadingDay(d: DeskData, day: Day): void {
  // Added once, the list kept sorted and within its size.
  if (!d.reading.days.includes(day)) d.reading.days = [...d.reading.days, day].sort().slice(-READING_DAYS_KEPT);
  // The run ending that day, against the longest.
  d.reading.best = Math.max(d.reading.best, runEndingAt(new Set(d.reading.days), day));
  // Milestones reached by this, each recorded once with the day it was reached.
  for (const id of deskMilestones(d)) if (!d.reading.marks[id]) d.reading.marks[id] = { d: milestoneDay(d, id), s: false };
}

/**
 * Inside a change: after a read mark was taken back, withdraw the milestones reached today that no longer hold (a
 * mark made by mistake and undone must not leave "10 items read" behind with nine read). A milestone reached on an
 * earlier day stays: it was true that day. "A series completed" is left to the desk page, which knows the series.
 *
 * @param d the desk being changed
 */
function withdrawToday(d: DeskData): void {
  // Today.
  const now = today();
  // What the desk holds now.
  const holds = new Set(deskMilestones(d));
  // Each milestone recorded today that no longer holds.
  for (const id of MILESTONES) if (id !== "series1" && d.reading.marks[id]?.d === now && !holds.has(id)) delete d.reading.marks[id];
}

/**
 * Inside a change: forget a reading day when the mark that made it was taken back that same day and no other mark
 * carries the day (an accidental mark and its Undo leave no trace in the streak).
 *
 * @param d the desk being changed
 * @param day the day
 */
function forgetReadingDay(d: DeskData, day: Day): void {
  // Another mark of that day keeps it.
  if (Object.values(d.read).includes(day)) return;
  // Forgotten.
  d.reading.days = d.reading.days.filter((x) => x !== day);
  // While no old day has dropped out, the longest run is the list's own (so an undone day does not lengthen it).
  if (d.reading.days.length < READING_DAYS_KEPT) d.reading.best = longestRun(d.reading.days);
}

/**
 * Record milestones reached (the desk page adds "a series completed", which needs the site index).
 *
 * @param ids the milestones reached
 * @returns the ones that are new
 */
export function noteMilestones(ids: readonly MilestoneId[]): MilestoneId[] {
  // The new ones.
  const fresh: MilestoneId[] = [];
  // The change (the desk's own, so it travels).
  mutate((d) => {
    // Each one not yet recorded.
    for (const id of ids) if (!d.reading.marks[id]) { d.reading.marks[id] = { d: milestoneDay(d, id), s: false }; fresh.push(id); }
    // Written only when something is new.
    return fresh.length > 0;
  }, "local");
  // The new ones.
  return fresh;
}

/**
 * Take the milestones whose one-time celebration has not been shown, and mark them shown.
 *
 * @returns their ids, in the page's order
 */
export function takeUnseenMilestones(): MilestoneId[] {
  // The ones to show.
  const ids = MILESTONES.filter((id) => getDeskState().data.reading.marks[id]?.s === false);
  // Nothing to show.
  if (ids.length === 0) return ids;
  // Marked shown.
  mutate((d) => { for (const id of ids) { const m = d.reading.marks[id]; if (m) m.s = true; } }, "local");
  // Shown now.
  return ids;
}

/**
 * Mark an item read (or done).
 *
 * @param id the item
 * @returns whether the mark is new
 */
export function markRead(id: ItemId): boolean {
  // The change.
  return mutate((d) => {
    // Already marked.
    if (id in d.read) return false;
    // At the limit: the oldest mark makes room (reading never stops being recorded).
    if (Object.keys(d.read).length >= DESK_LIMITS.read) {
      // The oldest by day.
      const oldest = Object.entries(d.read).sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))[0];
      // Dropped without a removal day: it is forgotten, not unread.
      if (oldest) delete d.read[oldest[0]];
    }
    // Marked today.
    d.read[id] = today();
    // Its removal forgotten.
    delete d.tomb.read[id];
    // Today is a reading day; the run and the milestones follow.
    noteReadingDay(d, d.read[id]);
  });
}

/**
 * Take an item's read mark off (remembering the day, for merging).
 *
 * @param id the item
 * @returns whether it was marked
 */
export function markUnread(id: ItemId): boolean {
  // The change.
  return mutate((d) => {
    // Not marked.
    if (!(id in d.read)) return false;
    // The mark's day.
    const was = d.read[id];
    // Removed.
    delete d.read[id];
    // Remembered.
    d.tomb.read[id] = today();
    // A mark made today and taken back today leaves no reading day behind (unless another mark carries it).
    if (was === today()) forgetReadingDay(d, was);
    // A milestone reached today that no longer holds is withdrawn.
    withdrawToday(d);
  });
}

/**
 * Put a read mark back exactly as it was (the undo of "marked as read" and of "mark as unread").
 *
 * @param id the item
 * @param day the day it carried, or null to take it off
 */
export function restoreRead(id: ItemId, day: Day | null): void {
  // The change.
  mutate((d) => {
    // Taking it off.
    if (day === null) {
      // Nothing to take off.
      if (!(id in d.read)) return false;
      // The mark's day.
      const was = d.read[id];
      // Removed, remembered.
      delete d.read[id];
      // The removal's day.
      d.tomb.read[id] = today();
      // The Undo of a mark made today: no reading day left behind (unless another mark carries it).
      if (was === today()) forgetReadingDay(d, was);
      // A milestone reached today that no longer holds is withdrawn.
      withdrawToday(d);
      // Done.
      return;
    }
    // Back with its own day.
    d.read[id] = day;
    // Its removal forgotten.
    delete d.tomb.read[id];
    // Its day a reading day again.
    if (!d.reading.days.includes(day)) d.reading.days = [...d.reading.days, day].sort().slice(-READING_DAYS_KEPT);
  });
}

// ---------------------------------------------------------------------------
// Paths.
// ---------------------------------------------------------------------------

/** What creating or adding to a path did. */
export type PathResult = { ok: true; id: string; added: number; skipped: number; cut: number } | { ok: false; reason: "limit-paths" | "no-path" | "live" };

/**
 * Make a new path.
 *
 * @param name the name the reader typed (empty for an adopted path)
 * @param items its first items
 * @param from where it was adopted from, or null
 * @returns the new path's id, or the reason it could not be made
 */
export function createPath(name: string, items: ItemId[] = [], from: PathSource | null = null): PathResult {
  // The outcome.
  let result: PathResult = { ok: false, reason: "limit-paths" };
  // The change.
  mutate((d) => {
    // At the limit.
    if (d.paths.length >= DESK_LIMITS.paths) return false;
    // A new id.
    const id = newId();
    // The items, each once, within the limit.
    const unique = [...new Set(items.filter((i) => isItemId(i)))];
    // Kept.
    const kept = unique.slice(0, DESK_LIMITS.pathItems);
    // Added at the end of the list.
    d.paths.push({ id, name: name.trim().slice(0, DESK_LIMITS.nameLength), items: kept, rev: 1, from, day: today() });
    // Done.
    result = { ok: true, id, added: kept.length, skipped: items.length - unique.length, cut: unique.length - kept.length };
  });
  // The outcome.
  return result;
}

/**
 * Find a path in a desk.
 *
 * @param d the desk
 * @param id the path's id
 * @returns the path, or undefined
 */
function findPath(d: DeskData, id: string): DeskPath | undefined {
  // By id.
  return d.paths.find((p) => p.id === id);
}

/**
 * Rename a path.
 *
 * @param id the path
 * @param name the new name
 */
export function renamePath(id: string, name: string): void {
  // The change.
  mutate((d) => {
    // The path.
    const p = findPath(d, id);
    // The trimmed name.
    const n = name.trim().slice(0, DESK_LIMITS.nameLength);
    // Missing, or unchanged.
    if (!p || p.name === n) return false;
    // Renamed, revision raised.
    p.name = n;
    // Newer.
    p.rev += 1;
  });
}

/** A deleted path and where it was, for undo. */
export interface DeletedPath {
  /** The path as it was. */
  path: DeskPath;
  /** Its place in the list. */
  index: number;
}

/**
 * Delete a path (with undo: keep what this returns and pass it to restorePath).
 *
 * @param id the path
 * @returns the path and its place, or null when it was not there
 */
export function deletePath(id: string): DeletedPath | null {
  // The outcome.
  let out: DeletedPath | null = null;
  // The change.
  mutate((d) => {
    // Its place.
    const index = d.paths.findIndex((p) => p.id === id);
    // Not there.
    if (index < 0) return false;
    // Kept for undo.
    out = { path: d.paths[index], index };
    // Removed.
    d.paths.splice(index, 1);
    // Remembered at the revision after its last, so a merge cannot bring it back.
    d.tomb.paths[id] = out.path.rev + 1;
  });
  // The deleted path.
  return out;
}

/**
 * Put a deleted path back where it was.
 *
 * @param del what deletePath returned
 */
export function restorePath(del: DeletedPath): void {
  // The change.
  mutate((d) => {
    // Already back, or the limit reached meanwhile.
    if (findPath(d, del.path.id) || d.paths.length >= DESK_LIMITS.paths) return false;
    // A revision above the removal's, so the restored copy wins a merge.
    const rev = Math.max(del.path.rev, d.tomb.paths[del.path.id] ?? 0) + 1;
    // The removal forgotten.
    delete d.tomb.paths[del.path.id];
    // Back in its place.
    d.paths.splice(Math.min(del.index, d.paths.length), 0, { ...del.path, rev });
  });
}

/**
 * Move a path up or down the list.
 *
 * @param id the path
 * @param delta -1 up, +1 down
 */
export function movePath(id: string, delta: -1 | 1): void {
  // The change.
  mutate((d) => {
    // Its place.
    const i = d.paths.findIndex((p) => p.id === id);
    // Where it goes.
    const j = i + delta;
    // Not there, or already at the end it is moving towards.
    if (i < 0 || j < 0 || j >= d.paths.length) return false;
    // Swapped.
    [d.paths[i], d.paths[j]] = [d.paths[j], d.paths[i]];
  });
}

/**
 * Add items to the end of a path. A live path cannot be edited (it follows its collection): make it a copy first.
 *
 * @param id the path
 * @param items the items
 * @returns how many were added, skipped as already there, and cut by the limit; or why nothing was
 */
export function addToPath(id: string, items: ItemId[]): PathResult {
  // The outcome.
  let result: PathResult = { ok: false, reason: "no-path" };
  // The change.
  mutate((d) => {
    // The path.
    const p = findPath(d, id);
    // Not there.
    if (!p) return false;
    // Following its collection: not edited.
    if (p.from?.mode === "live") { result = { ok: false, reason: "live" }; return false; }
    // The new ones, each once.
    const fresh = [...new Set(items)].filter((i) => isItemId(i) && !p.items.includes(i));
    // Room left.
    const room = Math.max(0, DESK_LIMITS.pathItems - p.items.length);
    // What fits.
    const kept = fresh.slice(0, room);
    // Outcome.
    result = { ok: true, id, added: kept.length, skipped: items.length - fresh.length, cut: fresh.length - kept.length };
    // Nothing to add.
    if (kept.length === 0) return false;
    // Added.
    p.items.push(...kept);
    // Newer.
    p.rev += 1;
  });
  // The outcome.
  return result;
}

/**
 * Remove one item from a path (with undo: insertIntoPath with what this returns).
 *
 * @param id the path
 * @param index the item's place
 * @returns the removed item, or null
 */
export function removeFromPath(id: string, index: number): ItemId | null {
  // The outcome.
  let removed: ItemId | null = null;
  // The change.
  mutate((d) => {
    // The path, editable, with something at that place.
    const p = findPath(d, id);
    // Not removable.
    if (!p || p.from?.mode === "live" || index < 0 || index >= p.items.length) return false;
    // Taken out.
    removed = p.items.splice(index, 1)[0];
    // Newer.
    p.rev += 1;
  });
  // The removed item.
  return removed;
}

/**
 * Put an item into a path at a place (the undo of removeFromPath).
 *
 * @param id the path
 * @param index the place
 * @param item the item
 */
export function insertIntoPath(id: string, index: number, item: ItemId): void {
  // The change.
  mutate((d) => {
    // The path, editable, without the item, with room.
    const p = findPath(d, id);
    // Not insertable.
    if (!p || p.from?.mode === "live" || p.items.includes(item) || p.items.length >= DESK_LIMITS.pathItems) return false;
    // In its place.
    p.items.splice(Math.max(0, Math.min(index, p.items.length)), 0, item);
    // Newer.
    p.rev += 1;
  });
}

/**
 * Move an item up or down inside a path.
 *
 * @param id the path
 * @param index the item's place
 * @param delta -1 up, +1 down
 */
export function moveInPath(id: string, index: number, delta: -1 | 1): void {
  // The change.
  mutate((d) => {
    // The path.
    const p = findPath(d, id);
    // Where it goes.
    const j = index + delta;
    // Not movable.
    if (!p || p.from?.mode === "live" || index < 0 || index >= p.items.length || j < 0 || j >= p.items.length) return false;
    // Swapped.
    [p.items[index], p.items[j]] = [p.items[j], p.items[index]];
    // Newer.
    p.rev += 1;
  });
}

/**
 * Turn a live path into the reader's own copy (it stops following its collection and can be edited).
 *
 * @param id the path
 */
export function freezePath(id: string): void {
  // The change.
  mutate((d) => {
    // The path.
    const p = findPath(d, id);
    // Not live.
    if (!p || !p.from || p.from.mode !== "live") return false;
    // Frozen.
    p.from = { id: p.from.id, mode: "frozen" };
    // Newer.
    p.rev += 1;
  });
}

/**
 * Bring live paths up to date with their collections (an article added to a series appears). Derived data: the
 * revision is not raised, so two devices that refresh the same path agree without a conflict.
 *
 * @param membersOf the collection's items as the site index lists them, or undefined when it does not know it
 */
export function refreshLivePaths(membersOf: (collection: ItemId) => ItemId[] | undefined): void {
  // The change.
  mutate((d) => {
    // Whether any path changed.
    let changed = false;
    // Each live path.
    for (const p of d.paths) {
      // Only live ones.
      if (p.from?.mode !== "live") continue;
      // The collection's items now.
      const now = membersOf(p.from.id);
      // Unknown collection, or the same list.
      if (!now || (now.length === p.items.length && now.every((x, i) => x === p.items[i]))) continue;
      // Followed.
      p.items = now.slice(0, DESK_LIMITS.pathItems);
      // Changed.
      changed = true;
    }
    // Written only when something changed.
    return changed;
  }, "local");
}

/**
 * Rewrite identifiers the site has merged or renamed (the Worker's redirect lists, exported to the site index), in
 * saved items, read marks and paths, so the desk follows the site.
 *
 * @param redirects old identifier to new identifier
 */
export function followRedirects(redirects: Record<string, string>): void {
  // Nothing to follow.
  if (Object.keys(redirects).length === 0) return;
  // The change.
  mutate((d) => {
    // Whether anything changed.
    let changed = false;
    // The two maps of marks.
    for (const map of [d.saved, d.read]) {
      // Each old identifier present.
      for (const [from, to] of Object.entries(redirects)) {
        // Not present.
        if (!(from in map) || !isItemId(to)) continue;
        // Moved to the new name, keeping the later day where both exist.
        map[to] = laterDay(map[to], map[from]) as Day;
        // The old name gone.
        delete map[from];
        // Changed.
        changed = true;
      }
    }
    // Each path's items.
    for (const p of d.paths) {
      // Renamed in place, then de-duplicated.
      const next = [...new Set(p.items.map((i) => (isItemId(redirects[i]) ? (redirects[i] as ItemId) : i)))];
      // Unchanged.
      if (next.length === p.items.length && next.every((x, i) => x === p.items[i])) continue;
      // Rewritten.
      p.items = next;
      // Newer.
      p.rev += 1;
      // Changed.
      changed = true;
    }
    // Written only when something changed.
    return changed;
  });
}

/**
 * A path's progress, derived from the read marks (never stored).
 *
 * @param p the path
 * @param read the read marks
 * @returns how many of its items are marked, and how many it has
 */
export function pathProgress(p: Pick<DeskPath, "items">, read: Record<string, Day>): { done: number; total: number } {
  // Counted.
  return { done: p.items.filter((i) => i in read).length, total: p.items.length };
}

/**
 * The path in progress: among paths with something unread, the one most recently read in; its next unread item.
 *
 * @param data the desk
 * @returns the path's index in the list and its next item, or null
 */
export function pathInProgress(data: DeskData): { path: number; next: ItemId } | null {
  // The best so far.
  let best: { path: number; next: ItemId; day: string } | null = null;
  // Each path.
  for (let i = 0; i < data.paths.length; i += 1) {
    // The path.
    const p = data.paths[i];
    // Its first unread item.
    const next = p.items.find((id) => !(id in data.read));
    // All read, or empty.
    if (!next) continue;
    // The latest read mark among its items, or the day it was made.
    const day = p.items.reduce((acc, id) => (data.read[id] && data.read[id] > acc ? data.read[id] : acc), p.day);
    // Later than the best: this one.
    if (best === null || day > best.day) best = { path: i, next, day };
  }
  // The choice.
  return best === null ? null : { path: best.path, next: best.next };
}

// ---------------------------------------------------------------------------
// Settings, layout, notes, visits.
// ---------------------------------------------------------------------------

/**
 * Change settings (the revision is raised, for merging).
 *
 * @param patch the settings to change
 */
export function updateSettings(patch: Partial<Omit<DeskSettings, "rev">>): void {
  // The change.
  mutate((d) => {
    // Unchanged.
    if (Object.entries(patch).every(([k, v]) => d.settings[k as keyof DeskSettings] === v)) return false;
    // Applied, newer.
    d.settings = { ...d.settings, ...patch, rev: d.settings.rev + 1 };
  });
}

/**
 * Replace the layout's widgets (phase 3's edit mode; the revision is raised).
 *
 * @param widgets the new list
 */
export function setLayoutWidgets(widgets: DeskWidget[]): void {
  // The change.
  mutate((d) => {
    // Cleaned like a stored layout.
    const clean = cleanLayout({ rev: d.layout.rev + 1, widgets }, { n: 0 });
    // Applied.
    d.layout = clean;
  });
}

/**
 * Go back to the first layout (the revision is raised, so the reset wins a merge).
 */
export function resetLayout(): void {
  // The change.
  mutate((d) => {
    // The first widgets, newer than the current layout.
    d.layout = { rev: d.layout.rev + 1, widgets: defaultLayout().widgets };
  });
}

/**
 * Write a note (phase 4). An empty text empties it: the entry stays, empty, with a raised revision, so the emptying
 * wins a merge with another browser's copy as a removal does (an emptied note is forgotten after 120 days).
 *
 * @param id the note's id
 * @param text the text
 */
export function setNote(id: string, text: string): void {
  // The change.
  mutate((d) => {
    // The current note.
    const cur = d.notes[id];
    // Emptied: kept empty, newer.
    if (!text) {
      // Nothing to empty.
      if (!cur || cur.text === "") return false;
      // Emptied.
      d.notes[id] = { text: "", day: today(), rev: cur.rev + 1 };
      // Done.
      return;
    }
    // The same text again: nothing to write.
    if (cur && cur.text === text.slice(0, DESK_LIMITS.noteLength)) return false;
    // At the limit for a new note.
    if (!cur && Object.keys(d.notes).length >= DESK_LIMITS.notes) return false;
    // Written, newer.
    d.notes[id] = { text: text.slice(0, DESK_LIMITS.noteLength), day: today(), rev: (cur?.rev ?? 0) + 1 };
  });
}

/**
 * Empty the notes of widgets no longer on the page (the notes widget keeps its text under "widget:<its id>"), when the
 * reader leaves arranging with "Done": until then, Undo brings a removed notes widget back with its text.
 *
 * @param keep the ids of the widgets on the page
 * @returns how many notes were emptied
 */
export function pruneWidgetNotes(keep: ReadonlySet<string>): number {
  // The count.
  let n = 0;
  // The change.
  mutate((d) => {
    // Each widget's note.
    for (const [id, note] of Object.entries(d.notes)) {
      // Another kind of note, a widget still there, or already empty.
      if (!id.startsWith("widget:") || keep.has(id.slice(7)) || note.text === "") continue;
      // Emptied, newer (so the emptying reaches the other browsers).
      d.notes[id] = { text: "", day: today(), rev: note.rev + 1 };
      // Counted.
      n += 1;
    }
    // Written only when something was emptied.
    return n > 0;
  });
  // The count.
  return n;
}

/**
 * Record a visit to the desk page: the previous visit's day is kept for "what changed since the last visit".
 */
export function recordVisit(): void {
  // The change (bookkeeping only: it does not sync).
  mutate((d) => {
    // Today.
    const day = today();
    // Already recorded today.
    if (d.meta.lastVisit === day) return false;
    // The visit before this one.
    d.meta.prevVisit = d.meta.lastVisit;
    // This one.
    d.meta.lastVisit = day;
  }, "local");
}

// ---------------------------------------------------------------------------
// Persistent storage: asked once, at the first save.
// ---------------------------------------------------------------------------

/**
 * Ask the browser, once, to keep this site's storage (navigator.storage.persist()). Browsers decide by their own
 * rules, most without a prompt; the answer is kept so the page can say it.
 */
async function askPersistOnce(): Promise<void> {
  // Already asked.
  if (getDeskState().data.meta.persistAsked) return;
  // Marked as asked first, so two quick saves ask once.
  mutate((d) => { d.meta.persistAsked = true; }, "local");
  // The answer: null where the browser has no such call.
  let granted: boolean | null = null;
  // The call can be missing or throw.
  try {
    // Asked.
    if (typeof navigator !== "undefined" && navigator.storage && typeof navigator.storage.persist === "function") granted = await navigator.storage.persist();
  } catch {
    // No answer.
    granted = null;
  }
  // Kept.
  mutate((d) => { d.meta.persisted = granted; }, "local");
}

// ---------------------------------------------------------------------------
// Whole-desk changes: import, clear, undo.
// ---------------------------------------------------------------------------

/**
 * Replace the synced part of the desk (an import or a transfer link the reader chose to use instead of what is here).
 *
 * @param s the incoming synced part
 * @returns the desk as it was, for undo
 */
export function replaceDesk(s: DeskSynced): DeskData {
  // What was here.
  const before = getDeskState().data;
  // Replaced, keeping this browser's own parts.
  commitDesk(withSynced(before, s), "user");
  // For undo.
  return before;
}

/**
 * Merge an incoming synced part into the desk (an import or a transfer link added to what is here).
 *
 * @param s the incoming synced part
 * @returns the desk as it was, for undo
 */
export function mergeIntoDesk(s: DeskSynced): DeskData {
  // What was here.
  const before = getDeskState().data;
  // Merged by the sync rule, notes included on both sides.
  commitDesk(withSynced(before, mergeDesks(syncedPart(before, true), s)), "user");
  // For undo.
  return before;
}

/**
 * Put a whole desk back (the undo of an import, a merge or a clear).
 *
 * @param d the desk as it was
 */
export function restoreDesk(d: DeskData): void {
  // Written as it was.
  commitDesk(d, "user");
}

/**
 * Empty the desk in this browser (with undo: restoreDesk with what this returns). The sync settings stay, so a
 * cleared desk can be filled again from the server copy.
 *
 * @returns the desk as it was
 */
export function clearDesk(): DeskData {
  // What was here.
  const before = getDeskState().data;
  // An empty desk that remembers its removals (so a sync does not bring everything back) and keeps the sync settings.
  const empty = emptyDesk();
  // Every saved item and read mark becomes a removal of today.
  const day = today();
  // Saved.
  for (const k of Object.keys(before.saved)) empty.tomb.saved[k] = day;
  // Read.
  for (const k of Object.keys(before.read)) empty.tomb.read[k] = day;
  // Paths, at the revision after their last.
  for (const p of before.paths) empty.tomb.paths[p.id] = p.rev + 1;
  // Settings and layout newer than the old ones, so the reset wins too.
  empty.settings.rev = before.settings.rev + 1;
  // Layout too.
  empty.layout.rev = before.layout.rev + 1;
  // Written with this browser's own parts.
  commitDesk({ ...empty, sync: before.sync, meta: before.meta }, "user");
  // For undo.
  return before;
}

/**
 * Change the sync settings (the sync client's own writes; never synced themselves).
 *
 * @param change edits the sync settings, or returns null to forget them
 * @param origin "sync" for the client's bookkeeping, "user" for the reader's choices
 */
export function updateSyncSettings(change: (s: DeskSync | null) => DeskSync | null, origin: DeskOrigin = "sync"): void {
  // The change.
  mutate((d) => {
    // The new settings.
    const next = change(d.sync ? { ...d.sync } : null);
    // Unchanged.
    if (JSON.stringify(next) === JSON.stringify(d.sync)) return false;
    // Applied.
    d.sync = next;
  }, origin);
}

/**
 * Put a merged synced part into the desk after a sync, with the server's new version.
 *
 * @param s the synced part
 * @param version the server's version after the write
 */
export function applySynced(s: DeskSynced, version: number): void {
  // The current desk.
  const cur = getDeskState().data;
  // Whatever the reader changed here while the sync was under way is merged over what was synced, so nothing is lost
  // (the change itself starts the next sync).
  const merged = mergeDesks(syncedPart(cur, s.notes !== undefined), s);
  // The new desk: the synced part in, the sync settings updated.
  const next = withSynced(cur, merged);
  // The sync settings with the new version and day.
  next.sync = cur.sync ? { ...cur.sync, version, lastDay: today() } : null;
  // Written, marked as the sync's own change (so it does not start another sync).
  commitDesk(next, "sync");
}
