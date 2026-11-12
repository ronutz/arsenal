// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/layout.ts
// ----------------------------------------------------------------------------
// ARRANGING "MY DESK" (PLAN-personal-desk-20261112, sections 3.5, 3.6 and 3.9;
// PRIME 12/11/2026 12:42, "the fullest extent").
//
// The page's layout is an ordered list of widgets, each with a size (small,
// medium, wide) and its own small settings (src/lib/desk/store.ts, DeskLayout).
// The grid flows by itself, so a phone shows one column in the reader's order
// and a wide screen honours the sizes: one stored layout serves every screen.
// This file is the one place that says which widgets exist (the catalogue),
// what the starter layouts hold, and how a layout changes (add, remove, move,
// resize). Every change returns a new list and never edits the one it was
// given, so the page can keep the lists it replaced and undo any change.
// Pure: no window, no storage, no network; the guard runs it as it stands.
// ============================================================================

// The layout's shapes, its limits and the random id maker.
import { DESK_LIMITS, newId, type DeskWidget, type WidgetSize, WIDGET_SIZES } from "./store";

/** One kind of widget the page can draw. */
export interface WidgetSpec {
  /** Its type, stored in the layout. */
  type: string;
  /** The size it takes when added. */
  size: WidgetSize;
  /** Whether the page may hold more than one (notes, a countdown, a quick tool, a comparison). */
  multi: boolean;
}

/**
 * Every widget the page draws, in the order the "Add a widget" list offers them: where was I first, then what the
 * reader keeps, then the tools of the day. A type stored in a layout but missing here (written by a newer page) is
 * kept in the layout and not drawn.
 */
export const WIDGET_CATALOGUE: readonly WidgetSpec[] = [
  // Where was I: the next item of the path in progress and the last pages opened.
  { type: "continue", size: "wide", multi: false },
  // What changed for this reader since the last visit (src/lib/desk/news.ts).
  { type: "news", size: "wide", multi: false },
  // The reader's paths with their progress.
  { type: "paths", size: "wide", multi: false },
  // Saved items; tools as launch tiles.
  { type: "favourites", size: "medium", multi: false },
  // The latest read marks, with "updated since you read it".
  { type: "recent", size: "medium", multi: false },
  // The daily puzzles, from the games' own record.
  { type: "puzzles", size: "small", multi: false },
  // A search field.
  { type: "search", size: "small", multi: false },
  // A few lines of the reader's own (phase 4), as many as the reader wants.
  { type: "notes", size: "medium", multi: true },
  // The days left until an exam the reader names (phase 4), one per exam.
  { type: "countdown", size: "small", multi: true },
  // A small tool usable on the desk (phase 4): its engine loaded only when shown (src/lib/desk/quickTools.ts).
  { type: "quicktool", size: "medium", multi: true },
  // The reading streak and milestones (the site owner, 12/11/2026 15:22).
  { type: "streak", size: "small", multi: false },
  // Privacy and settings (the site owner, 12/11/2026 15:27): counting, sync, merging, read marks, emptying; links.
  { type: "privacy", size: "medium", multi: false },
];

/** The types the page draws today. */
export const DESK_WIDGET_TYPES: readonly string[] = WIDGET_CATALOGUE.map((s) => s.type);

/**
 * The catalogue's entry for a type.
 *
 * @param type a widget's type
 * @returns its entry, or undefined for a type this page does not draw
 */
export function widgetSpec(type: string): WidgetSpec | undefined {
  // Looked up by type.
  return WIDGET_CATALOGUE.find((s) => s.type === type);
}

/** The starter layouts, by id: a first page that is not empty, for three ways of using the site. */
export const STARTER_IDS = ["study", "oncall", "browse"] as const;

/** One starter's id. */
export type StarterId = (typeof STARTER_IDS)[number];

/** Each starter's widgets as types and sizes (ids are given when a starter is applied). */
const STARTERS: Record<StarterId, readonly { type: string; size: WidgetSize }[]> = {
  // (Rows that fill the twelve columns of a wide screen: wide alone, two medium, or three small.)
  // Studying for a certification: where was I and what changed, the paths, the exam's countdown, the reading streak
  // and a search field, notes beside what was read, what was saved beside privacy and settings.
  study: [
    { type: "continue", size: "wide" },
    { type: "news", size: "wide" },
    { type: "paths", size: "wide" },
    { type: "countdown", size: "small" },
    { type: "streak", size: "small" },
    { type: "search", size: "small" },
    { type: "notes", size: "medium" },
    { type: "recent", size: "medium" },
    { type: "favourites", size: "medium" },
    { type: "privacy", size: "medium" },
  ],
  // On call: a search field beside privacy and settings, a quick tool beside the saved tools, notes beside the last
  // pages opened.
  oncall: [
    { type: "search", size: "medium" },
    { type: "privacy", size: "medium" },
    { type: "quicktool", size: "medium" },
    { type: "favourites", size: "medium" },
    { type: "notes", size: "medium" },
    { type: "continue", size: "medium" },
  ],
  // Just browsing: where was I and what changed, the saved items and what was read, the day's puzzles, the reading
  // streak, privacy and settings, and a search field.
  browse: [
    { type: "continue", size: "wide" },
    { type: "news", size: "wide" },
    { type: "favourites", size: "medium" },
    { type: "recent", size: "medium" },
    { type: "puzzles", size: "small" },
    { type: "streak", size: "small" },
    { type: "privacy", size: "small" },
    { type: "search", size: "wide" },
  ],
};

/**
 * A fresh id for a new widget of a type: the type itself for a widget the page holds once, the type and a short
 * random part for one it may hold several of.
 *
 * @param type the widget's type
 * @param taken the ids already on the page
 * @returns an id that is not taken (the store's form: lower case, at most 32 characters)
 */
export function newWidgetId(type: string, taken: ReadonlySet<string>): string {
  // A widget held once is named after its type.
  if (!widgetSpec(type)?.multi && !taken.has(type)) return type;
  // Otherwise the type and six random characters, tried until free (a clash is one in two billion).
  for (;;) {
    // The type cut so the whole id fits in 32 characters.
    const id = `${type.slice(0, 24)}-${newId().slice(0, 6)}`;
    // Free: used.
    if (!taken.has(id)) return id;
  }
}

/**
 * A starter layout's widgets, ready to store.
 *
 * @param id the starter
 * @returns the widgets, each with a fresh id and empty settings
 */
export function starterWidgets(id: StarterId): DeskWidget[] {
  // The ids given so far.
  const taken = new Set<string>();
  // Each entry of the starter, drawn by this page only.
  return STARTERS[id].filter((w) => widgetSpec(w.type)).map((w) => {
    // A fresh id.
    const wid = newWidgetId(w.type, taken);
    // Taken.
    taken.add(wid);
    // The widget.
    return { id: wid, type: w.type, size: w.size, settings: {} };
  });
}

/**
 * Whether a widget of a type can be added to a list: the type is drawn, the page is under its limit, and a widget
 * held once is not already there.
 *
 * @param list the widgets
 * @param type the type to add
 * @returns true when it can be added
 */
export function canAddWidget(list: readonly DeskWidget[], type: string): boolean {
  // The type's entry.
  const spec = widgetSpec(type);
  // Unknown, at the limit, or a single widget already there.
  return !!spec && list.length < DESK_LIMITS.widgets && (spec.multi || !list.some((w) => w.type === type));
}

/**
 * Add a widget at the end of the list.
 *
 * @param list the widgets
 * @param type its type
 * @param settings its first settings
 * @returns the new list and the new widget's id, or null when it cannot be added
 */
export function addWidget(list: readonly DeskWidget[], type: string, settings: DeskWidget["settings"] = {}): { list: DeskWidget[]; id: string } | null {
  // Refused when it cannot be added.
  if (!canAddWidget(list, type)) return null;
  // A free id.
  const id = newWidgetId(type, new Set(list.map((w) => w.id)));
  // Its catalogue size.
  const size = (widgetSpec(type) as WidgetSpec).size;
  // Appended.
  return { list: [...list.map((w) => ({ ...w })), { id, type, size, settings: { ...settings } }], id };
}

/**
 * Remove a widget.
 *
 * @param list the widgets
 * @param id the widget
 * @returns the new list and the place it had, or null when it is not there
 */
export function removeWidget(list: readonly DeskWidget[], id: string): { list: DeskWidget[]; index: number } | null {
  // Its place.
  const index = list.findIndex((w) => w.id === id);
  // Not there.
  if (index < 0) return null;
  // Everything else.
  return { list: list.filter((w) => w.id !== id).map((w) => ({ ...w })), index };
}

/**
 * Move a widget to a place in the list.
 *
 * @param list the widgets
 * @param id the widget
 * @param to its new place (clamped to the list)
 * @returns the new list, or null when the widget is not there or would not move
 */
export function moveWidget(list: readonly DeskWidget[], id: string, to: number): DeskWidget[] | null {
  // Its place now.
  const from = list.findIndex((w) => w.id === id);
  // The place it goes, inside the list.
  const dest = Math.max(0, Math.min(list.length - 1, to));
  // Not there, or already in place.
  if (from < 0 || dest === from) return null;
  // A copy.
  const next = list.map((w) => ({ ...w }));
  // Taken out.
  const [w] = next.splice(from, 1);
  // Put back at its new place.
  next.splice(dest, 0, w);
  // The new order.
  return next;
}

/**
 * Change a widget's size.
 *
 * @param list the widgets
 * @param id the widget
 * @param size its new size
 * @returns the new list, or null when the widget is not there or already has that size
 */
export function resizeWidget(list: readonly DeskWidget[], id: string, size: WidgetSize): DeskWidget[] | null {
  // The widget.
  const w = list.find((x) => x.id === id);
  // Not there, or unchanged.
  if (!w || w.size === size) return null;
  // The same list with the new size.
  return list.map((x) => (x.id === id ? { ...x, size } : { ...x }));
}

/**
 * The next size up or down from a widget's size.
 *
 * @param size the size now
 * @param step +1 larger, -1 smaller
 * @returns the neighbouring size, or the same at either end
 */
export function stepSize(size: WidgetSize, step: 1 | -1): WidgetSize {
  // Its place among the sizes.
  const i = WIDGET_SIZES.indexOf(size);
  // One step, kept inside the list.
  return WIDGET_SIZES[Math.max(0, Math.min(WIDGET_SIZES.length - 1, i + step))];
}

/**
 * Change one widget's own settings (a countdown's date, a quick tool's choice).
 *
 * @param list the widgets
 * @param id the widget
 * @param patch the settings to set (a value of null removes it)
 * @returns the new list, or null when the widget is not there or nothing changes
 */
export function setWidgetSettingsIn(list: readonly DeskWidget[], id: string, patch: Record<string, DeskWidget["settings"][string] | null>): DeskWidget[] | null {
  // The widget.
  const w = list.find((x) => x.id === id);
  // Not there.
  if (!w) return null;
  // Its settings with the patch applied.
  const settings = { ...w.settings };
  // Each change.
  for (const [k, v] of Object.entries(patch)) {
    // Null removes.
    if (v === null) delete settings[k];
    // Otherwise set.
    else settings[k] = v;
  }
  // Unchanged.
  if (JSON.stringify(settings) === JSON.stringify(w.settings)) return null;
  // The same list with the new settings.
  return list.map((x) => (x.id === id ? { ...x, settings } : { ...x }));
}
