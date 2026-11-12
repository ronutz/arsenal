// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/pathNext.ts
// ----------------------------------------------------------------------------
// "CONTINUE THIS PATH" (the site owner, 12/11/2026 15:22): for the item a page
// shows, the reader's paths that hold it and, for each, where the reader goes
// next. Pure: it reads the desk it is given (src/lib/desk/store.ts) and
// nothing else, so the item pages (src/components/desk/DeskPathNext.tsx) and
// the guard (scripts/check-desk-store.mts) run the same rule.
//
// The rule, in the path's own order:
//   - "next": the first unread item after this one, or, when every item after
//     it is read, the first unread item before it (never this page itself);
//   - "last": nothing else is left unread, only this page;
//   - "finished": every item of the path is read (or done).
// The progress is the desk's own ("7 of 12 read", pathProgress), so the page
// and the desk never disagree.
// ============================================================================

// The desk's shapes and its progress count.
import { pathProgress, type DeskData, type DeskPath } from "./store";
// Identifiers.
import type { ItemId } from "./ids";

/** Where one path stands for the page's item. */
export type PathNextState =
  // Another item is unread: this one comes next.
  | { state: "next"; next: ItemId }
  // Only the page's own item is left.
  | { state: "last" }
  // Every item is read.
  | { state: "finished" };

/** One path that holds the page's item, with its progress and what comes next. */
export type PathNext = PathNextState & {
  /** The path. */
  path: DeskPath;
  /** Items read (or done). */
  done: number;
  /** Items in the path. */
  total: number;
};

/**
 * Where a path stands for an item it holds.
 *
 * @param p the path's items
 * @param item the page's item
 * @param read the read marks
 * @returns the state, or null when the path does not hold the item
 */
export function nextInPath(p: Pick<DeskPath, "items">, item: ItemId, read: Readonly<Record<string, string>>): PathNextState | null {
  // The item's place in the path.
  const at = p.items.indexOf(item);
  // Not in this path.
  if (at < 0) return null;
  // Unread, and not the page's own item.
  const open = (id: ItemId) => id !== item && !(id in read);
  // The first open item after this one, then from the start.
  const next = p.items.slice(at + 1).find(open) ?? p.items.slice(0, at).find(open);
  // Something else to read.
  if (next) return { state: "next", next };
  // Nothing else: this page is the last one left, or the path is finished.
  return item in read ? { state: "finished" } : { state: "last" };
}

/**
 * The reader's paths that hold an item, in the reader's order, each with its progress and what comes next.
 *
 * @param data the desk
 * @param item the page's item
 * @returns the paths holding it (none when it is in no path)
 */
export function pathsHolding(data: Pick<DeskData, "paths" | "read">, item: ItemId): PathNext[] {
  // The answers.
  const out: PathNext[] = [];
  // Each path, in the reader's order.
  for (const path of data.paths) {
    // Where it stands, if it holds the item.
    const st = nextInPath(path, item, data.read);
    // Not in it.
    if (!st) continue;
    // Its progress, counted as the desk counts it.
    const { done, total } = pathProgress(path, data.read);
    // Kept.
    out.push({ ...st, path, done, total });
  }
  // The paths.
  return out;
}
