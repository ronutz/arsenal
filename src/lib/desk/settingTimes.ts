// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/settingTimes.ts
// ----------------------------------------------------------------------------
// "THE LATEST CHANGE WINS" FOR SETTINGS (the site owner, 12/11/2026 14:42).
// A setting (theme, language, glossary hints, shortcuts, an index page's view,
// ...: the "setting" keys of src/lib/desk/registry.ts) changed in two browsers
// between two syncs keeps the value changed last. To know which was last, this
// browser records, for each setting, the minute its value last changed here:
//
//   ronutz:portable:times   {"<key>": {"v": "<value as stored>", "at": <ms>}}
//                           kept in this browser only (local-only in the
//                           registry), and sent only inside the encrypted
//                           sync copy, as {"<key>": <ms>} beside the keys,
//                           which only the reader's own browsers can read.
//                           A time is to the minute; "at": null means the
//                           value was there before times were recorded.
//
// The time is taken when the value is written: a small watch wraps the
// browser's localStorage.setItem and removeItem (calling the browser's own
// first, then noting the change when the key is a setting), so every writer on
// the site is covered without changing it. A look at the stored values (on
// each page and before each sync) catches anything written while no watch ran.
// The sync's own writes are made quietly and take the time they came with.
//
// THE OPTION. "Keep this browser's value when both changed (records no change
// times)", off by default, kept per browser under ronutz:portable:no-times.
// When on, no time is recorded or sent and the stored ones are deleted, and a
// setting changed in both browsers keeps the value of the browser that is
// syncing (the rule before times; a browser syncing for the first time takes
// the other side's). An older sync copy without times merges that way too.
// No network, no server: this file only reads and writes this browser's
// storage.
// ============================================================================

// The registry: which keys are settings.
import { keyMatches, PORTABLE_KEYS } from "./registry";

/** Where this browser keeps its settings' change times (local-only). */
export const TIMES_KEY = "ronutz:portable:times";

/** Where this browser keeps the reader's choice to record no change times (local-only). */
export const NO_TIMES_KEY = "ronutz:portable:no-times";

/** Settings' change times as they travel inside the encrypted copy: key to a minute, in milliseconds since 1970. */
export type SettingTimes = Record<string, number>;

/** One setting's record: the value it was noted with, and the minute it changed (null: before times were kept). */
interface TimeEntry {
  /** The value as stored when noted. */
  v: string;
  /** The minute it changed, or null when unknown. */
  at: number | null;
}

/** How many quiet writes are under way (the sync's own, whose times come with them). */
let quiet = 0;

/** Whether the watch is installed in this page. */
let installed = false;

/**
 * A time to the minute.
 *
 * @param ms milliseconds since 1970
 * @returns the start of that minute
 */
export function minuteOf(ms: number): number {
  // Floored to the minute.
  return Math.floor(ms / 60_000) * 60_000;
}

/**
 * Whether a key is a portable setting (the keys whose change time is recorded).
 *
 * @param key a storage key
 * @returns true for a setting
 */
export function isSettingKey(key: string): boolean {
  // A registry entry with the setting rule that matches.
  return PORTABLE_KEYS.some((p) => p.rule === "setting" && keyMatches(key, p.match));
}

/**
 * This browser's localStorage, or null where it is refused.
 *
 * @returns the storage or null
 */
function store(): Storage | null {
  // Reading it can throw (storage disabled, a sandboxed frame).
  try {
    // Only in a browser.
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Refused.
    return null;
  }
}

/**
 * Whether this browser records change times (the default; off when the reader keeps this browser's value).
 *
 * @returns true when times are recorded
 */
export function timesOn(): boolean {
  // The storage.
  const s = store();
  // None: nothing is recorded.
  if (!s) return false;
  // The choice, read; storage can throw.
  try {
    // Recorded unless the reader chose otherwise.
    return s.getItem(NO_TIMES_KEY) !== "1";
  } catch {
    // Unreadable: nothing recorded.
    return false;
  }
}

/**
 * The stored record, cleaned: well-formed entries of setting keys only.
 *
 * @returns the record (empty when none or unreadable)
 */
function readRecord(): Record<string, TimeEntry> {
  // The storage.
  const s = store();
  // The record.
  const out: Record<string, TimeEntry> = {};
  // Reading and parsing can fail.
  try {
    // The stored text.
    const raw = s?.getItem(TIMES_KEY);
    // Parsed.
    const obj = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    // Each entry.
    for (const [k, e] of Object.entries(obj ?? {})) {
      // The entry's fields.
      const x = e as { v?: unknown; at?: unknown };
      // A setting key, a stored value, and a minute or null.
      if (isSettingKey(k) && x && typeof x.v === "string" && (x.at === null || (typeof x.at === "number" && Number.isFinite(x.at)))) out[k] = { v: x.v, at: x.at as number | null };
    }
  } catch {
    // Unreadable: started again.
  }
  // The record.
  return out;
}

/**
 * Write the record.
 *
 * @param r the record
 */
function writeRecord(r: Record<string, TimeEntry>): void {
  // Storage can refuse: then nothing is recorded, and the merge falls back to the rule without times.
  try { window.localStorage.setItem(TIMES_KEY, JSON.stringify(r)); } catch { /* not recorded */ }
}

/**
 * Note that a setting was written in this browser (called by the watch after the browser's own write).
 *
 * @param key the key
 * @param value the new value, or null when it was removed
 * @param now the time of the write
 */
export function noteSettingWrite(key: string, value: string | null, now: number = Date.now()): void {
  // The sync's own writes, a key that is not a setting, or times off: nothing to note.
  if (quiet > 0 || !isSettingKey(key) || !timesOn()) return;
  // The record.
  const r = readRecord();
  // Removed: its entry goes (a removal is merged by the rule "a change beats a deletion", without times).
  if (value === null) {
    // Nothing to remove.
    if (!(key in r)) return;
    // Removed.
    delete r[key];
  } else {
    // The same value written again is not a change.
    if (r[key]?.v === value) return;
    // Changed now.
    r[key] = { v: value, at: minuteOf(now) };
  }
  // Kept.
  writeRecord(r);
}

/**
 * Bring the record up to date with what is stored: a setting whose value differs from its record changed while no
 * watch ran (it is stamped now); on the very first look, every value present is recorded without a time.
 *
 * @param now the time of the look
 */
export function observeSettings(now: number = Date.now()): void {
  // Times off: nothing to look at.
  if (!timesOn()) return;
  // The storage.
  const s = store();
  // None.
  if (!s) return;
  // Whether a record exists at all (the first look stamps nothing).
  let first = true;
  // Read; storage can throw.
  try { first = s.getItem(TIMES_KEY) === null; } catch { return; }
  // The record.
  const r = readRecord();
  // Whether it changed.
  let changed = first;
  // The settings present now.
  const present = new Set<string>();
  // Walking storage can throw.
  try {
    // Each stored key.
    for (let i = 0; i < s.length; i += 1) {
      // Its name.
      const key = s.key(i);
      // Settings only.
      if (!key || !isSettingKey(key)) continue;
      // Present.
      present.add(key);
      // Its value.
      const v = s.getItem(key);
      // Gone meanwhile.
      if (v === null) continue;
      // Unchanged.
      if (r[key]?.v === v) continue;
      // Changed (or new): now, except on the first look, when the time is unknown.
      r[key] = { v, at: first ? null : minuteOf(now) };
      // Changed.
      changed = true;
    }
  } catch {
    // Stopped where storage refused.
  }
  // Entries of settings no longer stored go.
  for (const k of Object.keys(r)) if (!present.has(k)) { delete r[k]; changed = true; }
  // Written when anything changed.
  if (changed) writeRecord(r);
}

/**
 * The known change times of this browser's settings as they stand now (only values whose time is known).
 *
 * @returns key to minute
 */
export function localSettingTimes(): SettingTimes {
  // Times off: none.
  if (!timesOn()) return {};
  // Up to date first.
  observeSettings();
  // The storage.
  const s = store();
  // The times.
  const out: SettingTimes = {};
  // Each record.
  for (const [k, e] of Object.entries(readRecord())) {
    // Unknown.
    if (e.at === null) continue;
    // Only when the record still describes the stored value.
    let v: string | null = null;
    // Storage can throw.
    try { v = s?.getItem(k) ?? null; } catch { v = null; }
    // Kept.
    if (v === e.v) out[k] = e.at;
  }
  // The times.
  return out;
}

/**
 * Settings' times as they came inside an encrypted copy, cleaned: setting keys only, whole minutes, finite.
 *
 * @param raw the copy's "times" member
 * @returns the times (empty for an older copy without them)
 */
export function cleanSettingTimes(raw: unknown): SettingTimes {
  // The times.
  const out: SettingTimes = {};
  // Not an object: none.
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  // Each entry.
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (isSettingKey(k) && typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = minuteOf(v);
  // The times.
  return out;
}

/**
 * Run the sync's own writes quietly: they are not changes made here, and take the times they came with.
 *
 * @param fn the writes
 * @returns what fn returns
 */
export function quietly<T>(fn: () => T): T {
  // Quiet from here.
  quiet += 1;
  // The writes.
  try {
    // Made.
    return fn();
  } finally {
    // Loud again.
    quiet -= 1;
  }
}

/**
 * After a sync wrote its merged values: record each setting with the time its value came with (unknown when none).
 *
 * @param values the merged profile
 * @param times the merged times
 */
export function adoptSettingTimes(values: Record<string, unknown>, times: SettingTimes): void {
  // Times off: nothing recorded.
  if (!timesOn()) return;
  // The record.
  const r = readRecord();
  // Each merged setting.
  for (const [k, v] of Object.entries(values)) {
    // Settings with a value only.
    if (!isSettingKey(k) || v === undefined || v === null) continue;
    // Its value as stored.
    const sv = String(v);
    // The same value with a known time locally and none incoming keeps the local time.
    const at = typeof times[k] === "number" ? times[k] : r[k]?.v === sv ? r[k].at : null;
    // Recorded.
    r[k] = { v: sv, at };
  }
  // Kept.
  writeRecord(r);
}

/**
 * The reader's choice: keep this browser's value when both changed, and record no change times (on), or the default,
 * the latest change wins (off). Turning it on deletes the stored times at once.
 *
 * @param on whether to keep this browser's value
 */
export function setKeepThisBrowser(on: boolean): void {
  // The storage.
  const s = store();
  // None: nothing to keep.
  if (!s) return;
  // Storage can refuse.
  try {
    // On: the choice kept, the times deleted.
    if (on) { window.localStorage.setItem(NO_TIMES_KEY, "1"); s.removeItem(TIMES_KEY); }
    // Off: the choice forgotten; the values now present are recorded without a time.
    else { s.removeItem(NO_TIMES_KEY); observeSettings(); }
  } catch {
    // Not changed.
  }
}

/**
 * Install the watch once per page: the browser's localStorage writes go through as before, then a setting's change is
 * noted with its minute. Also looks once at what is stored.
 */
export function installSettingWatch(): void {
  // Once, in a browser that has Storage.
  if (installed || typeof window === "undefined" || typeof Storage === "undefined") return;
  // Installed.
  installed = true;
  // The browser's own methods.
  const proto = Storage.prototype;
  // Writing.
  const setItem = proto.setItem;
  // Removing.
  const removeItem = proto.removeItem;
  // Writing: the browser's own first (its errors reach the caller unchanged), then the note.
  proto.setItem = function setItemWatched(this: Storage, key: string, value: string): void {
    // The write itself.
    setItem.call(this, key, value);
    // The note: localStorage only, never the record itself; a failure here never reaches the writer.
    try { if (key !== TIMES_KEY && this === window.localStorage) noteSettingWrite(String(key), String(value)); } catch { /* not noted */ }
  };
  // Removing: the same.
  proto.removeItem = function removeItemWatched(this: Storage, key: string): void {
    // The removal itself.
    removeItem.call(this, key);
    // The note.
    try { if (key !== TIMES_KEY && this === window.localStorage) noteSettingWrite(String(key), null); } catch { /* not noted */ }
  };
  // What is stored now.
  observeSettings();
}
