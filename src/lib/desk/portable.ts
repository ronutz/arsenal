// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/portable.ts
// ----------------------------------------------------------------------------
// THE READER'S PORTABLE PROFILE (PRIME 12/11/2026 13:38: "allow the user
// storage to be shared among different browsers so they become portable").
//
// ONE REGISTRY of every key the site keeps in the browser, in two lists:
//   PORTABLE_KEYS   what belongs to the reader and travels with the sync, a
//                   profile file or a profile link, each with its merge rule;
//   LOCAL_ONLY_KEYS what stays with the browser it was made in, each with the
//                   reason (a consent, a session, the sync's own bookkeeping).
// scripts/check-desk-store.mts reads every storage key the code writes and
// fails the build when one is in neither list, so a new key has to be placed.
//
// THREE-WAY MERGE. Each browser keeps, local-only, the last synced copy
// (BASE_KEY). On a sync, a key changed only here goes up, a key changed only
// on the other side comes down, and a key changed on both sides is merged by
// its rule:
//   desk     the desk's own merge (src/lib/desk/store.ts, mergeDesks);
//   fun      the games: daily results united, counters added up from the
//            last synced copy, the longer streak, the better best score (the
//            direction read from how both moved), the board's choices and
//            sent rounds left with the browser that made them;
//   recent   the trail: united, newest first, six at most;
//   drill    the subnet drill: the best streak the higher, totals added up;
//   setting  a plain value (theme, language, shortcuts, a page's view): the
//            latest change wins (the site owner, 12/11/2026 14:42), by the
//            minute each browser recorded for it (src/lib/desk/settingTimes.ts,
//            sent only inside the encrypted copy); when either side has no
//            time for it (an older copy, a value from before times were kept,
//            or a browser where the reader chose "Keep this browser's value"),
//            the change made in the browser that is syncing wins, because it is
//            the one in use, and on a browser's first sync the other side's
//            wins, so a newly paired browser takes the reader's settings.
// A change beats a deletion; two equal values are simply kept. Notes travel
// only when the reader ticks "include notes".
// ============================================================================

// The desk's store: its key, its state, its merge and its parts.
import { DESK_KEY, applySynced, getDeskState, mergeDesks, repairDesk, replaceDesk, restoreDesk, syncedPart, type DeskData, type DeskSynced } from "./store";

// The registry (PORTABLE_KEYS, LOCAL_ONLY_KEYS and their matching), kept in a file of its own so the settings' change
// watch can read it on every page without the store; re-exported here, where the sync and the guard read it.
import { portableRule, type MergeRule } from "./registry";
export { keyMatches, LOCAL_ONLY_KEYS, PORTABLE_KEYS, portableRule, type LocalOnlyKey, type MergeRule, type PortableKey } from "./registry";
// The settings' change times, for "the latest change wins".
import type { SettingTimes } from "./settingTimes";

/** The last synced copy, local-only. */
export const BASE_KEY = "ronutz:portable:base";

/** A profile: portable key to value (parsed JSON for the structured keys, the stored string for a setting). */
export type Profile = Record<string, unknown>;

/**
 * JSON with the object keys sorted, so two equal values compare equal whatever order they were written in.
 *
 * @param v any value
 * @returns its canonical text
 */
export function stableStringify(v: unknown): string {
  // Arrays in order.
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  // Objects by sorted key, undefined members left out (as JSON does).
  if (v && typeof v === "object") return `{${Object.keys(v as object).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
  // Everything else as JSON (undefined as its own word, never a JSON value).
  return v === undefined ? "undefined" : JSON.stringify(v);
}

/**
 * Whether two values are the same.
 *
 * @param a one
 * @param b the other
 * @returns true when equal
 */
function same(a: unknown, b: unknown): boolean {
  // Canonical texts compared.
  return stableStringify(a) === stableStringify(b);
}

/**
 * Read this browser's portable profile.
 *
 * @param includeNotes whether the desk's notes go with it
 * @returns the profile
 */
export function collectProfile(includeNotes: boolean): Profile {
  // The profile.
  const out: Profile = {};
  // The desk, always (from the store, which has repaired it).
  out[DESK_KEY] = syncedPart(getDeskState().data, includeNotes);
  // Every other key in storage.
  let ls: Storage | null = null;
  // Storage can refuse.
  try { ls = window.localStorage; } catch { ls = null; }
  // None: the desk alone.
  if (!ls) return out;
  // Each stored key.
  for (let i = 0; i < ls.length; i += 1) {
    // Its name.
    const key = ls.key(i);
    // Not portable, or the desk (already in).
    if (!key || key === DESK_KEY) continue;
    // Its rule.
    const rule = portableRule(key);
    // Not portable.
    if (!rule) continue;
    // The stored text.
    const raw = ls.getItem(key);
    // Gone meanwhile.
    if (raw === null) continue;
    // A setting travels as its string.
    if (rule === "setting") { out[key] = raw; continue; }
    // A structured key travels parsed; an unreadable one stays behind.
    try {
      // Parsed.
      const v = JSON.parse(raw) as Record<string, unknown>;
      // The games' public board choices and sent rounds stay with this browser.
      if (rule === "fun" && v && typeof v === "object") { const { board: _board, ...rest } = v; void _board; out[key] = rest; } else out[key] = v;
    } catch {
      // Left out.
    }
  }
  // The profile.
  return out;
}

/** The last synced copy, as kept in this browser. */
export interface Base {
  /** The server's version of that copy. */
  version: number;
  /** When it was synced, to the minute, in this browser's clock (shown as "Synced 14:02"; never sent). */
  at: number;
  /** The keys. */
  keys: Profile;
}

/**
 * The last synced copy, or null when this browser has never synced.
 *
 * @returns the base or null
 */
export function readBase(): Base | null {
  // Storage can refuse, the text can be malformed.
  try {
    // The stored text.
    const raw = window.localStorage.getItem(BASE_KEY);
    // Never synced.
    if (!raw) return null;
    // Parsed.
    const b = JSON.parse(raw) as Partial<Base>;
    // Well formed only.
    return typeof b.version === "number" && typeof b.at === "number" && b.keys && typeof b.keys === "object" ? (b as Base) : null;
  } catch {
    // No base.
    return null;
  }
}

/**
 * Keep the copy just synced.
 *
 * @param keys the profile as stored on the server
 * @param version its version
 */
export function writeBase(keys: Profile, version: number): void {
  // Now, to the minute.
  const at = Math.floor(Date.now() / 60_000) * 60_000;
  // Storage can refuse: the next sync then merges as on a first one.
  try { window.localStorage.setItem(BASE_KEY, JSON.stringify({ version, at, keys })); } catch { /* no base kept */ }
}

/**
 * Forget the last synced copy (stopping sync, or after the server copy was deleted).
 */
export function clearBase(): void {
  // Removed.
  try { window.localStorage.removeItem(BASE_KEY); } catch { /* nothing kept */ }
}

/** One game's record, read loosely. */
type Rec = Record<string, unknown>;

/**
 * A number field, or 0.
 *
 * @param r a record
 * @param k the field
 * @returns the number
 */
const num = (r: Rec | undefined, k: string): number => (typeof r?.[k] === "number" ? (r[k] as number) : 0);

/**
 * The later of two optional days (YYYY-MM-DD) or null.
 *
 * @param a one
 * @param b the other
 * @returns the later
 */
const laterDay = (a: unknown, b: unknown): string | null => {
  // The days that are days.
  const xs = [a, b].filter((x): x is string => typeof x === "string").sort();
  // The last.
  return xs.length ? xs[xs.length - 1] : null;
};

/**
 * Merge one game's record changed on both sides.
 *
 * @param b the last synced copy's (or undefined)
 * @param l this browser's
 * @param r the other side's
 * @returns the merged record
 */
function mergeGame(b: Rec | undefined, l: Rec, r: Rec): Rec {
  // Counters: the last synced value plus both sides' increments.
  const add = (k: string) => num(b, k) + Math.max(0, num(l, k) - num(b, k)) + Math.max(0, num(r, k) - num(b, k));
  // Result maps: united, a solved day staying solved.
  const unite = (k: string) => {
    // Both maps.
    const out: Record<string, number> = { ...((r[k] as Record<string, number>) ?? {}) };
    // This side's over them, the better result kept.
    for (const [d, v] of Object.entries((l[k] as Record<string, number>) ?? {})) out[d] = Math.max(v, out[d] ?? 0);
    // United.
    return out;
  };
  // The best score: whichever side changed it; when both did, the direction they moved in from the last synced value.
  let best: unknown = l.best;
  // Only the other side changed it.
  if (same(l.best, b?.best)) best = r.best;
  // Both changed it, from a known value.
  else if (!same(r.best, b?.best) && typeof l.best === "number" && typeof r.best === "number" && typeof b?.best === "number") best = l.best > b.best ? Math.max(l.best, r.best) : Math.min(l.best, r.best);
  // The side with more rounds keeps its game-specific progress.
  const more = num(r, "played") > num(l, "played") ? r : l;
  // The merged record.
  return {
    ...l,
    played: add("played"),
    dailyPlayed: add("dailyPlayed"),
    wins: add("wins"),
    streak: Math.max(num(l, "streak"), num(r, "streak")),
    bestStreak: Math.max(num(l, "bestStreak"), num(r, "bestStreak")),
    best,
    lastDay: laterDay(l.lastDay, r.lastDay),
    lastWinDay: laterDay(l.lastWinDay, r.lastWinDay),
    lastDailyDay: laterDay(l.lastDailyDay, r.lastDailyDay),
    daily: { ...((r.daily as Rec) ?? {}), ...((l.daily as Rec) ?? {}) },
    earlier: { ...((r.earlier as Rec) ?? {}), ...((l.earlier as Rec) ?? {}) },
    results: unite("results"),
    earlierResults: unite("earlierResults"),
    extra: more.extra ?? l.extra,
  };
}

/** The settings' change times of both sides, when this browser records them. */
export interface MergeTimes {
  /** This browser's. */
  local: SettingTimes;
  /** The other side's (empty for an older copy without times). */
  remote: SettingTimes;
}

/**
 * Merge two values of one key that both sides changed, by the key's rule.
 *
 * @param rule the rule
 * @param base the last synced value (or undefined)
 * @param local this browser's
 * @param remote the other side's
 * @param firstSync whether this browser has never synced before
 * @param lt this browser's change time for the key, when known (settings only)
 * @param rt the other side's change time for the key, when known (settings only)
 * @returns the merged value
 */
function mergeBoth(rule: MergeRule, base: unknown, local: unknown, remote: unknown, firstSync: boolean, lt?: number, rt?: number): unknown {
  // A change beats a deletion.
  if (local === undefined) return remote;
  // The same the other way.
  if (remote === undefined) return local;
  // By rule.
  switch (rule) {
    case "desk": {
      // The desk's own merge, both sides repaired first.
      const l = repairDesk(local).data;
      // The other side.
      const r = repairDesk(remote).data;
      // Merged, notes included where either side carries them.
      return mergeDesks(syncedPart(l, "notes" in (local as object)), syncedPart(r, "notes" in (remote as object)));
    }
    case "fun": {
      // Both records.
      const l = local as { games?: Record<string, Rec> };
      const r = remote as { games?: Record<string, Rec> };
      const b = base as { games?: Record<string, Rec> } | undefined;
      // Every game either side has.
      const games: Record<string, Rec> = {};
      // Each one.
      for (const id of new Set([...Object.keys(l.games ?? {}), ...Object.keys(r.games ?? {})])) {
        // Its records.
        const lg = l.games?.[id];
        const rg = r.games?.[id];
        // One side only, or merged.
        games[id] = !lg ? (rg as Rec) : !rg ? lg : mergeGame(b?.games?.[id], lg, rg);
      }
      // The merged record (version 1, as the games write it).
      return { ...(l as object), v: 1, games };
    }
    case "recent": {
      // Both trails.
      const all = [...((local as { path: string; at: number }[]) ?? []), ...((remote as { path: string; at: number }[]) ?? [])].filter((p) => p && typeof p.path === "string");
      // Newest first, each page once, six at most.
      const seen = new Set<string>();
      // In order.
      return all.sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).filter((p) => (seen.has(p.path) ? false : (seen.add(p.path), true))).slice(0, 6);
    }
    case "drill": {
      // Both records.
      const l = local as Rec;
      const r = remote as Rec;
      const b = (base as Rec | undefined) ?? {};
      // Totals added up from the last synced values; the best streak the higher.
      const add = (k: string) => num(b, k) + Math.max(0, num(l, k) - num(b, k)) + Math.max(0, num(r, k) - num(b, k));
      // Merged.
      return { ...l, bestStreak: Math.max(num(l, "bestStreak"), num(r, "bestStreak")), totalCorrect: add("totalCorrect"), totalAnswered: add("totalAnswered") };
    }
    case "setting":
      // Both times known: the latest change wins (a tie keeps the browser in use).
      if (typeof lt === "number" && typeof rt === "number") return rt > lt ? remote : local;
      // Otherwise the browser in use wins, except on its first sync, when it takes the reader's settings from the other side.
      return firstSync ? remote : local;
  }
}

/**
 * Merge two profiles against the last synced copy: changed on one side, that side; on both, the key's rule.
 *
 * @param base the last synced copy's keys, or null on a first sync
 * @param local this browser's profile
 * @param remote the stored profile
 * @param includeNotes whether this browser sends its notes
 * @param times the settings' change times of both sides, or undefined when this browser records none (the reader chose
 *   "Keep this browser's value"): then a setting changed on both sides keeps this browser's value
 * @returns the merged profile
 */
export function mergeProfiles(base: Profile | null, local: Profile, remote: Profile, includeNotes: boolean, times?: MergeTimes): Profile {
  // The merged profile.
  const out: Profile = {};
  // A first sync has no base.
  const firstSync = base === null;
  // Every key either side, or the base, knows.
  const keys = new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(base ?? {})]);
  // Each key.
  for (const key of keys) {
    // Its rule (a key the registry no longer lists is dropped).
    const rule = portableRule(key);
    // Not portable any more.
    if (!rule) continue;
    // The three values; the desk compared without notes when this browser does not send them.
    const strip = (v: unknown) => (rule === "desk" && !includeNotes && v && typeof v === "object" ? { ...(v as object), notes: undefined } : v);
    // The values.
    const b = base?.[key];
    const l = local[key];
    const r = remote[key];
    // The value kept.
    let v: unknown;
    // Same on both sides.
    if (same(strip(l), strip(r))) v = r;
    // Changed only on the other side (or not at all here).
    else if (!firstSync && same(strip(l), strip(b))) v = r;
    // Changed only here.
    else if (!firstSync && same(strip(r), strip(b))) v = l;
    // Changed on both sides (or a first sync): the rule, with the change times for a setting.
    else v = mergeBoth(rule, b, l, r, firstSync, times?.local[key], times?.remote[key]);
    // The desk keeps the other side's notes when this browser does not send its own.
    if (rule === "desk" && !includeNotes && v && typeof v === "object" && r && typeof r === "object" && "notes" in (r as object)) v = { ...(v as object), notes: (r as DeskSynced).notes };
    // Kept unless deleted.
    if (v !== undefined) out[key] = v;
  }
  // The merged profile.
  return out;
}

/**
 * The change times that go with a merged profile's settings: the time of the side whose value was kept (both sides
 * holding the same value: the later known time).
 *
 * @param merged the merged profile
 * @param local this browser's profile
 * @param remote the other side's profile (null when there was none)
 * @param times both sides' times
 * @returns key to minute, for the settings whose time is known
 */
export function mergedSettingTimes(merged: Profile, local: Profile, remote: Profile | null, times: MergeTimes): SettingTimes {
  // The times.
  const out: SettingTimes = {};
  // Each merged key.
  for (const [k, v] of Object.entries(merged)) {
    // Settings only.
    if (portableRule(k) !== "setting") continue;
    // The candidates: this side's time when its value was kept, the other side's likewise.
    const cands = [same(v, local[k]) ? times.local[k] : undefined, remote && same(v, remote[k]) ? times.remote[k] : undefined].filter((x): x is number => typeof x === "number");
    // The later.
    if (cands.length > 0) out[k] = Math.max(...cands);
  }
  // The times.
  return out;
}

/**
 * Put a merged profile into this browser: the desk through its store, every other portable key into storage, keys
 * the merge deleted removed. The theme and the glossary hints take effect at once; other settings on the next page.
 *
 * @param merged the merged profile
 * @param local this browser's profile before the merge
 * @param includeNotes whether notes travel (when not, this browser's own notes stay as they are)
 * @param version the server's version, or null when applying without a sync (a file or a link)
 * @returns whether any setting changed
 */
export function applyProfile(merged: Profile, local: Profile, includeNotes: boolean, version: number | null): boolean {
  // Whether a setting changed.
  let settingChanged = false;
  // The desk, through the store.
  const desk = merged[DESK_KEY] as DeskSynced | undefined;
  // Applied (without notes when they do not travel), with the sync's version when there is one.
  if (desk) applySynced(includeNotes ? desk : { ...desk, notes: undefined }, version ?? getDeskState().data.sync?.version ?? 0);
  // Storage.
  let ls: Storage | null = null;
  // Storage can refuse.
  try { ls = window.localStorage; } catch { ls = null; }
  // No storage: only the desk in memory.
  if (!ls) return false;
  // Every key either side has.
  for (const key of new Set([...Object.keys(merged), ...Object.keys(local)])) {
    // Not the desk (done above), and portable only.
    const rule = portableRule(key);
    if (!rule || key === DESK_KEY) continue;
    // Unchanged.
    if (same(merged[key], local[key])) continue;
    // Written or removed; storage can refuse.
    try {
      // Removed by the merge.
      if (merged[key] === undefined) ls.removeItem(key);
      // A setting is its string.
      else if (rule === "setting") ls.setItem(key, String(merged[key]));
      // The games keep this browser's board.
      else if (rule === "fun") {
        // The board here.
        let board: unknown;
        // Read loosely.
        try { board = (JSON.parse(ls.getItem(key) ?? "{}") as { board?: unknown }).board; } catch { board = undefined; }
        // Written with it.
        ls.setItem(key, JSON.stringify(board === undefined ? merged[key] : { ...(merged[key] as object), board }));
      }
      // Anything else as JSON.
      else ls.setItem(key, JSON.stringify(merged[key]));
    } catch {
      // Not written.
    }
    // A setting changed.
    if (rule === "setting") settingChanged = true;
    // The theme at once.
    if (key === "ronutz-theme") {
      // The new theme, or the default.
      const t = merged[key];
      // Obsidian is the default (no attribute).
      if (typeof t === "string" && t !== "obsidian") document.documentElement.setAttribute("data-theme", t);
      else document.documentElement.removeAttribute("data-theme");
    }
    // The glossary hints at once.
    if (key === "ronutz-glossary-hints") {
      // The new value.
      const g = merged[key];
      // "off" and "all" are attributes; the default has none.
      if (g === "off" || g === "all") document.documentElement.setAttribute("data-glossary-hints", g);
      else document.documentElement.removeAttribute("data-glossary-hints");
    }
  }
  // Whether a setting changed.
  return settingChanged;
}

// ---------------------------------------------------------------------------
// A profile from outside (a file or a link): merged in, or used instead, with an Undo.
// ---------------------------------------------------------------------------

/** The browser's portable keys as they were, to put back (an Undo). */
export interface ProfileSnapshot {
  /** The desk, whole. */
  desk: DeskData;
  /** Every other portable key's stored text (null: absent). */
  raw: Record<string, string | null>;
}

/**
 * The portable keys as they stand now, for an Undo.
 *
 * @param extraKeys keys an incoming profile will write, so their absence is remembered too
 * @returns the snapshot
 */
export function snapshotProfile(extraKeys: string[] = []): ProfileSnapshot {
  // The stored texts.
  const raw: Record<string, string | null> = {};
  // Storage can refuse.
  try {
    // Every stored portable key but the desk.
    for (let i = 0; i < window.localStorage.length; i += 1) {
      // Its name.
      const k = window.localStorage.key(i);
      // Portable, not the desk.
      if (k && k !== DESK_KEY && portableRule(k)) raw[k] = window.localStorage.getItem(k);
    }
    // The incoming ones that are absent now.
    for (const k of extraKeys) if (k !== DESK_KEY && portableRule(k) && !(k in raw)) raw[k] = null;
  } catch {
    // Nothing more.
  }
  // The snapshot.
  return { desk: getDeskState().data, raw };
}

/**
 * Put a snapshot back.
 *
 * @param s the snapshot
 */
export function restoreProfile(s: ProfileSnapshot): void {
  // The desk.
  restoreDesk(s.desk);
  // Every other key, written or removed as it was.
  try {
    // Each.
    for (const [k, v] of Object.entries(s.raw)) {
      // Absent before.
      if (v === null) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, v);
    }
  } catch {
    // Not written.
  }
}

/**
 * Merge a profile from outside into this browser (its settings win, as on a first sync).
 *
 * @param incoming the profile
 * @returns the snapshot before, for an Undo
 */
export function mergeProfileIn(incoming: Profile): ProfileSnapshot {
  // Kept for the Undo.
  const before = snapshotProfile(Object.keys(incoming));
  // This browser's profile, notes included.
  const local = collectProfile(true);
  // Merged as on a first sync.
  const merged = mergeProfiles(null, local, incoming, true);
  // Applied.
  applyProfile(merged, local, true, null);
  // For the Undo.
  return before;
}

/**
 * Use a profile from outside instead of this browser's portable keys.
 *
 * @param incoming the profile
 * @returns the snapshot before, for an Undo
 */
export function replaceProfileWith(incoming: Profile): ProfileSnapshot {
  // Kept for the Undo.
  const before = snapshotProfile(Object.keys(incoming));
  // The desk replaced.
  const desk = incoming[DESK_KEY];
  // Only a desk-shaped value.
  if (desk && typeof desk === "object") replaceDesk(syncedPart(repairDesk(desk).data, "notes" in (desk as object)));
  // Every other portable key: written as incoming, or removed when incoming has none.
  try {
    // The keys either side has.
    for (const k of new Set([...Object.keys(before.raw), ...Object.keys(incoming)])) {
      // Its rule.
      const rule = portableRule(k);
      // Not portable, or the desk.
      if (!rule || k === DESK_KEY) continue;
      // The incoming value.
      const v = incoming[k];
      // Removed.
      if (v === undefined) window.localStorage.removeItem(k);
      // Written.
      else window.localStorage.setItem(k, rule === "setting" ? String(v) : JSON.stringify(v));
    }
  } catch {
    // Not written.
  }
  // For the Undo.
  return before;
}

/**
 * What a profile holds, for the question asked before using it.
 *
 * @param p the profile
 * @returns its counts: saved items, read marks, paths, and the other portable keys (settings and records)
 */
export function profileCounts(p: Profile): { saved: number; read: number; paths: number; others: number } {
  // The desk part.
  const d = (p[DESK_KEY] ?? {}) as { saved?: object; read?: object; paths?: unknown[] };
  // Counted.
  return {
    // Saved items.
    saved: Object.keys(d.saved ?? {}).length,
    // Read marks.
    read: Object.keys(d.read ?? {}).length,
    // Paths.
    paths: Array.isArray(d.paths) ? d.paths.length : 0,
    // Everything else.
    others: Object.keys(p).filter((k) => k !== DESK_KEY).length,
  };
}
