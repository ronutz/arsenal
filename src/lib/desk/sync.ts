// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/sync.ts
// ----------------------------------------------------------------------------
// THE DESK'S OPTIONAL ENCRYPTED SYNC, THE BROWSER'S SIDE (PRIME 12/11/2026
// 12:42, option B of PLAN-personal-desk-20261112; the build spec's sync
// contract, which worker/desk.ts follows on the server's side).
//
// NOTHING HAPPENS UNTIL THE READER MAKES OR ENTERS A SYNC CODE. Then, and only
// then, this file talks to the site's own Worker at /api/desk/<id>:
//   GET    the stored copy and its version (404 when there is none);
//   PUT    {data, base}: a new copy, accepted only when `base` is the version
//          stored (409 otherwise, with the stored copy, which this side
//          decrypts, merges and sends again);
//   DELETE the stored copy.
// <id> and the key come from the code in this browser (src/lib/desk/crypto.ts);
// the server receives the id and an encrypted string it cannot read, never the
// code, never the key, never a title or a mark in the clear. Requests carry no
// credentials, so no cookie travels with them.
//
// WHAT TRAVELS: the synced part of the desk (saved items, read marks, the
// removals, paths, settings, layout), and the notes only when the reader ticks
// "include notes". The sync settings and the bookkeeping never do.
//
// MERGING (src/lib/desk/store.ts, mergeDesks): unions for saved and read, a
// removal winning only when it is later; paths by id, the higher revision;
// settings and layout whole from the newer side. A sync always reads the
// stored copy first, merges it in, and writes back only when the result
// differs from what is stored, so two devices converge.
//
// AUTOMATIC SYNC: when the reader leaves "sync after changes" on, a change the
// reader makes is synced a few seconds later (one sync for a burst of changes),
// and once more, at once, when the page is hidden. When the server answers 503
// (its database is not ready) the page says sync is not available right now
// and everything keeps working in this browser.
//
// THE PORTABLE PROFILE (PRIME 12/11/2026 13:38, "Portable storage"). What
// travels is no longer the desk alone but every portable key of the browser
// (src/lib/desk/portable.ts): the desk, the games' record, the trail, the drill
// and the settings. The blob is version 2 (gzip, then AES-GCM; version 1 is
// read and upgraded). Each sync reads the stored copy, merges it three ways
// against the last synced copy this browser keeps (local-only), writes back
// when the result differs from what is stored, and applies the result here.
// It runs after the reader's changes, when a tab regains focus, when a page is
// hidden with something unsynced, and when a page opens long after the last
// sync. A copy deleted from another browser is said in words, and this browser
// stops syncing and keeps its data.
// ============================================================================

// React's hook for a store outside React (the status line on the page).
import { useSyncExternalStore } from "react";
// The code, the keys and the blob.
import { canSync, deriveKeys, isValidCode, newSyncCode, normalizeCode, openProfile, sealProfile, type SyncKeys } from "./crypto";
// The desk: its state, its repair, its change events and the sync settings it keeps.
import { DESK_KEY, getDeskState, repairDesk, subscribeDesk, syncedPart, updateSyncSettings } from "./store";
// The portable profile: what travels, the last synced copy, the three-way merge, and applying the result.
import { applyProfile, clearBase, collectProfile, mergedSettingTimes, mergeProfiles, readBase, stableStringify, writeBase, type Profile } from "./portable";
// The settings' change times: "the latest change wins" (the site owner, 12/11/2026 14:42).
import { adoptSettingTimes, cleanSettingTimes, localSettingTimes, quietly, timesOn, type SettingTimes } from "./settingTimes";

/** The Worker's route. */
const ENDPOINT = "/api/desk/";

/** The largest blob the server accepts, in decoded bytes (the contract's 98,304). */
export const SYNC_MAX_BYTES = 98_304;

/** How long after a change an automatic sync waits, so a burst of changes is one sync. */
const AUTO_DELAY_MS = 4000;

/** How many times a write is retried after a conflict before giving up for now. */
const MAX_CONFLICTS = 3;

/** Where a sync stands, said in words on the page. */
export type SyncPhase =
  | "idle" // nothing has happened in this page yet
  | "working" // a sync is under way
  | "done" // synced, nothing needed merging
  | "merged" // synced, and changes from another device were merged in
  | "unavailable" // the server answered 503: sync is not available right now
  | "offline" // the request did not reach the server
  | "too-large" // the desk is larger than the server keeps
  | "rate-limited" // too many writes to this copy today
  | "not-found" // no copy is stored under the code entered
  | "bad-code" // the code is not a well-formed sync code
  | "unreadable" // the stored copy could not be opened with this code
  | "unsupported" // this browser cannot encrypt (no WebCrypto on this page)
  | "deleted" // the copy on the server was deleted
  | "deleted-elsewhere" // another browser deleted the copy; this one stopped syncing and kept its data
  | "error"; // the server refused for another reason

/** The sync's status: its phase, the size of the last copy sent or read, and whether settings came in. */
export interface SyncStatus {
  /** Where it stands. */
  phase: SyncPhase;
  /** The size of the encrypted copy, in bytes, when known. */
  bytes: number | null;
  /** True when the last sync brought settings that apply on the next page. */
  settings?: boolean;
}

/** The status in this page. */
let status: SyncStatus = { phase: "idle", bytes: null };

/** The constant status for the server render. */
const SERVER_STATUS: SyncStatus = { phase: "idle", bytes: null };

/**
 * When this browser last synced (to the minute, its own clock; never sent), or null.
 *
 * @returns milliseconds since the epoch, or null
 */
export function lastSyncedAt(): number | null {
  // From the last synced copy.
  return readBase()?.at ?? null;
}

/** Whoever listens for status changes. */
const statusListeners = new Set<() => void>();

/**
 * Set the status and tell the listeners.
 *
 * @param next the new status
 */
function setStatus(next: SyncStatus): void {
  // Replaced (a new object, so React re-renders).
  status = next;
  // Told.
  for (const fn of [...statusListeners]) fn();
}

/**
 * The sync's status, kept up to date in a component.
 *
 * @returns the status
 */
export function useSyncStatus(): SyncStatus {
  // Subscribed.
  return useSyncExternalStore(
    (fn) => { statusListeners.add(fn); return () => { statusListeners.delete(fn); }; },
    () => status,
    () => SERVER_STATUS,
  );
}

/** The keys of the last code used, so they are derived once per code. */
let keyCache: { code: string; keys: Promise<SyncKeys> } | null = null;

/**
 * The id and key for a code (derived once and kept for the page's life).
 *
 * @param code a normalized, valid code
 * @returns the keys
 */
function keysFor(code: string): Promise<SyncKeys> {
  // The same code: the same keys.
  if (keyCache && keyCache.code === code) return keyCache.keys;
  // Derived and kept.
  keyCache = { code, keys: deriveKeys(code) };
  // Returned.
  return keyCache.keys;
}

/** What the server's routes answer, read loosely (a body can be missing or not JSON). */
interface ServerReply {
  /** The HTTP status, or 0 when the request did not reach the server. */
  status: number;
  /** The JSON body, or null. */
  body: { version?: unknown; data?: unknown; error?: unknown } | null;
}

/**
 * One request to the desk route: same origin, no credentials, never cached.
 *
 * @param method GET, PUT or DELETE
 * @param id the copy's id
 * @param body the JSON body for a PUT
 * @param keepalive whether the request must survive the page being left
 * @returns the status and the parsed body
 */
async function call(method: "GET" | "PUT" | "DELETE", id: string, body?: unknown, keepalive = false): Promise<ServerReply> {
  // The request can fail before any answer (offline, blocked).
  try {
    // To the site's own Worker, nothing else.
    const res = await fetch(ENDPOINT + id, {
      method,
      credentials: "omit",
      cache: "no-store",
      keepalive,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // The body, when there is one and it is JSON.
    let parsed: ServerReply["body"] = null;
    // A 204 has none; anything else may.
    try { parsed = res.status === 204 ? null : ((await res.json()) as ServerReply["body"]); } catch { parsed = null; }
    // Both.
    return { status: res.status, body: parsed };
  } catch {
    // Not reached.
    return { status: 0, body: null };
  }
}

/**
 * The phase an unsuccessful answer means.
 *
 * @param s the HTTP status (0 when not reached)
 * @returns the phase to show
 */
function failurePhase(s: number): SyncPhase {
  // Not reached.
  if (s === 0) return "offline";
  // The database is not ready.
  if (s === 503) return "unavailable";
  // Larger than the server keeps.
  if (s === 413) return "too-large";
  // Too many writes today.
  if (s === 429) return "rate-limited";
  // Anything else.
  return "error";
}

/**
 * Decrypt a stored copy (either version) into a profile, the desk part repaired like any outside data.
 *
 * @param keys the keys
 * @param data the stored blob
 * @returns the profile and its settings' change times (empty for an older copy), or null when it cannot be opened
 */
async function readRemote(keys: SyncKeys, data: unknown): Promise<{ profile: Profile; times: SettingTimes } | null> {
  // Only a string can be a blob.
  if (typeof data !== "string") return null;
  // Opening fails for a wrong key or an altered copy.
  try {
    // Decrypted (version 1 comes back as a profile holding the desk alone).
    const { keys: profile, times } = await openProfile(keys.key, data);
    // The desk part, repaired, its notes kept only when it carried them.
    const desk = profile[DESK_KEY];
    // Repaired in place.
    if (desk && typeof desk === "object") profile[DESK_KEY] = syncedPart(repairDesk(desk).data, "notes" in (desk as object));
    // The profile, and its times cleaned (setting keys only, whole minutes).
    return { profile, times: cleanSettingTimes(times) };
  } catch {
    // Not openable.
    return null;
  }
}

/** The sync under way, so two calls at once share one. */
let running: Promise<SyncStatus> | null = null;

/** When the last sync started in this page, for the focus trigger's spacing. */
let lastStart = 0;

/**
 * Sync now: read the stored copy, merge it in three ways, and write back when the merge differs from it.
 *
 * @param opts keepalive: send with keepalive (the page is being left)
 * @returns the status after the sync
 */
export function syncNow(opts: { keepalive?: boolean } = {}): Promise<SyncStatus> {
  // One at a time.
  if (running) return running;
  // Noted.
  lastStart = Date.now();
  // Started.
  running = doSync(opts.keepalive === true).finally(() => { running = null; });
  // Shared.
  return running;
}

/**
 * The sync itself.
 *
 * @param keepalive whether the write must survive the page being left
 * @returns the status after it
 */
async function doSync(keepalive: boolean): Promise<SyncStatus> {
  // The desk's sync settings.
  const sync = getDeskState().data.sync;
  // Not syncing: nothing to do.
  if (!sync) return status;
  // A browser that cannot encrypt.
  if (!canSync()) { setStatus({ phase: "unsupported", bytes: null }); return status; }
  // Working.
  setStatus({ phase: "working", bytes: status.bytes });
  // The keys.
  const keys = await keysFor(sync.code);
  // The last synced copy (null on this browser's first sync).
  const base = readBase();
  // The stored copy.
  const got = await call("GET", keys.id);
  // What is stored: none (404), a copy (200), or a failure.
  let remote: Profile | null = null;
  // The stored copy's settings' change times (empty for an older copy without them).
  let remoteTimes: SettingTimes = {};
  // Its version.
  let version = 0;
  // A copy is stored.
  if (got.status === 200) {
    // Its version.
    version = typeof got.body?.version === "number" ? got.body.version : 0;
    // Opened.
    const opened = await readRemote(keys, got.body?.data);
    // Stored but not openable with this code: nothing is overwritten.
    if (!opened) { setStatus({ phase: "unreadable", bytes: null }); return status; }
    // The profile and its times.
    remote = opened.profile;
    // Kept for the merge.
    remoteTimes = opened.times;
  } else if (got.status === 404) {
    // This browser had synced before, and the copy is gone: another browser deleted it. Stop here, keep the data.
    if (sync.version > 0 || base !== null) {
      // The code forgotten here, the base too.
      updateSyncSettings(() => null, "sync");
      // Forgotten.
      clearBase();
      // Said.
      setStatus({ phase: "deleted-elsewhere", bytes: null });
      // Finished.
      return status;
    }
  } else {
    // The server could not answer: said in words, everything keeps working here.
    setStatus({ phase: failurePhase(got.status), bytes: status.bytes }); return status;
  }
  // Write, merging again on each conflict.
  for (let attempt = 0; attempt <= MAX_CONFLICTS; attempt += 1) {
    // Whether notes travel from here.
    const notes = getDeskState().data.sync?.includeNotes === true;
    // This browser's profile now (it may have changed while waiting).
    const local = collectProfile(notes);
    // Whether this browser records settings' change times (the default; not when the reader keeps this browser's value).
    const recording = timesOn();
    // Both sides' times, when recorded here (an opted-out browser merges by the rule without times, and sends none).
    const times = recording ? { local: localSettingTimes(), remote: remoteTimes } : undefined;
    // Merged three ways with the stored copy, if any.
    const merged = remote ? mergeProfiles(base?.keys ?? null, local, remote, notes, times) : local;
    // The times that go with the merged settings.
    const mergedTimes: SettingTimes = times ? mergedSettingTimes(merged, local, remote, times) : {};
    // Whether the stored copy brought anything this browser did not have.
    const brought = remote !== null && stableStringify(merged) !== stableStringify(local);
    // Nothing to write: the stored copy already holds exactly this (and, when times are recorded, the same times).
    if (remote && stableStringify(merged) === stableStringify(remote) && (!times || stableStringify(mergedTimes) === stableStringify(remoteTimes))) {
      // Applied here quietly (the times come with the values), kept as the base.
      const settings = quietly(() => applyProfile(merged, local, notes, version));
      // The settings recorded with their times.
      adoptSettingTimes(merged, mergedTimes);
      // The base.
      writeBase(merged, version);
      // Done.
      setStatus({ phase: brought ? "merged" : "done", bytes: status.bytes, settings });
      // Finished.
      return status;
    }
    // Encrypted (version 2: gzip, then AES-GCM), the times inside when recorded here.
    const sealed = await sealProfile(keys.key, merged, times ? mergedTimes : undefined);
    // Too large for the server: not sent, said in words.
    if (sealed.bytes > SYNC_MAX_BYTES) { setStatus({ phase: "too-large", bytes: sealed.bytes }); return status; }
    // Sent, against the version last seen.
    const put = await call("PUT", keys.id, { data: sealed.data, base: version }, keepalive && sealed.data.length < 60_000);
    // Accepted.
    if (put.status === 200 && typeof put.body?.version === "number") {
      // The new version.
      const newVersion: number = put.body.version;
      // Applied here quietly (the times come with the values).
      const settings = quietly(() => applyProfile(merged, local, notes, newVersion));
      // The settings recorded with their times.
      adoptSettingTimes(merged, mergedTimes);
      // The base.
      writeBase(merged, put.body.version);
      // Done.
      setStatus({ phase: brought ? "merged" : "done", bytes: sealed.bytes, settings });
      // Finished.
      return status;
    }
    // Someone else wrote first: their copy comes back with the answer; merge and try again.
    if (put.status === 409) {
      // Their version.
      version = typeof put.body?.version === "number" ? put.body.version : version;
      // Nothing stored any more (another device deleted the copy between the read and this write): {version: 0,
      // data: ""}. Written again as the first copy, with nothing to merge.
      if (version === 0 && put.body?.data === "") { remote = null; remoteTimes = {}; continue; }
      // Their copy.
      const theirs = await readRemote(keys, put.body?.data);
      // Not openable: stop without overwriting it.
      if (!theirs) { setStatus({ phase: "unreadable", bytes: null }); return status; }
      // Their profile and times.
      remote = theirs.profile;
      // Kept for the next merge.
      remoteTimes = theirs.times;
      // Again.
      continue;
    }
    // Any other answer: said in words.
    setStatus({ phase: failurePhase(put.status), bytes: sealed.bytes });
    // Finished.
    return status;
  }
  // Still conflicting after several tries: the next sync will try again.
  setStatus({ phase: "error", bytes: status.bytes });
  // Finished.
  return status;
}

/**
 * Make a new sync code, keep it in this browser, and store the first copy.
 *
 * @returns the code (normalized), to show to the reader once
 */
export async function createSyncCode(): Promise<string> {
  // A browser that cannot encrypt cannot sync.
  if (!canSync()) { setStatus({ phase: "unsupported", bytes: null }); throw new Error("unsupported"); }
  // A new code.
  const code = newSyncCode();
  // A new copy starts without a last synced copy.
  clearBase();
  // Kept here, syncing after changes, notes not included.
  updateSyncSettings(() => ({ code, version: 0, auto: true, includeNotes: false, lastDay: null }), "user");
  // The first copy.
  await syncNow();
  // For the reader to write down.
  return code;
}

/**
 * Use a code made on another device: check it, find the stored copy, merge it in.
 *
 * @param typed the code as typed or pasted
 * @param startNew store a new copy under this code when none is stored (the reader's explicit choice)
 * @returns the status after the attempt
 */
export async function joinWithCode(typed: string, startNew = false): Promise<SyncStatus> {
  // Canonical form.
  const code = normalizeCode(typed);
  // Not a code.
  if (!isValidCode(code)) { setStatus({ phase: "bad-code", bytes: null }); return status; }
  // A browser that cannot encrypt.
  if (!canSync()) { setStatus({ phase: "unsupported", bytes: null }); return status; }
  // Unless asked to start a new copy, there must be one stored under the code.
  if (!startNew) {
    // The keys.
    const keys = await keysFor(code);
    // Looked up.
    const got = await call("GET", keys.id);
    // None stored.
    if (got.status === 404) { setStatus({ phase: "not-found", bytes: null }); return status; }
    // The server could not answer.
    if (got.status !== 200) { setStatus({ phase: failurePhase(got.status), bytes: null }); return status; }
  }
  // A join is a first sync: no last synced copy, so the reader's settings come from the other side.
  clearBase();
  // Kept here; a sync then merges the stored copy in (or stores the first one).
  updateSyncSettings((s) => ({ code, version: 0, auto: s?.auto ?? true, includeNotes: s?.includeNotes ?? false, lastDay: null }), "user");
  // Synced.
  return syncNow();
}

/**
 * Stop syncing in this browser: the code is forgotten here; the copy on the server stays for other devices.
 */
export function forgetThisDevice(): void {
  // Forgotten, with the last synced copy; everything else stays as it is.
  updateSyncSettings(() => null, "user");
  // The base.
  clearBase();
  // Back to the start.
  setStatus({ phase: "idle", bytes: null });
}

/**
 * Delete the copy on the server, then forget the code in this browser.
 *
 * @returns the status after the attempt
 */
export async function deleteServerCopy(): Promise<SyncStatus> {
  // The code.
  const sync = getDeskState().data.sync;
  // Nothing to delete.
  if (!sync) return status;
  // A browser that cannot derive the id.
  if (!canSync()) { setStatus({ phase: "unsupported", bytes: null }); return status; }
  // Working.
  setStatus({ phase: "working", bytes: null });
  // The id.
  const keys = await keysFor(sync.code);
  // Deleted (204 also when nothing was stored).
  const res = await call("DELETE", keys.id);
  // Not deleted: said in words, the code kept.
  if (res.status !== 204 && res.status !== 200) { setStatus({ phase: failurePhase(res.status), bytes: null }); return status; }
  // Forgotten here, with the last synced copy.
  updateSyncSettings(() => null, "user");
  // The base.
  clearBase();
  // Said.
  setStatus({ phase: "deleted", bytes: null });
  // Finished.
  return status;
}

/**
 * Change one of the reader's sync choices.
 *
 * @param patch auto and/or includeNotes
 */
export function setSyncChoice(patch: { auto?: boolean; includeNotes?: boolean }): void {
  // Applied to the stored settings, when syncing.
  updateSyncSettings((s) => (s ? { ...s, ...patch } : s), "user");
}

/** The pending automatic sync's timer. */
let autoTimer: number | null = null;

/** Whether the automatic sync is listening. */
let autoStarted = false;

/**
 * Schedule an automatic sync a few seconds from now, when this browser syncs and "sync after changes" is on; a burst
 * of changes becomes one sync.
 */
export function scheduleAutoSync(): void {
  // Outside a browser there is nothing to schedule.
  if (typeof window === "undefined") return;
  // The sync settings.
  const sync = getDeskState().data.sync;
  // Not syncing, or not automatically.
  if (!sync || !sync.auto) return;
  // One sync for a burst of changes.
  if (autoTimer !== null) window.clearTimeout(autoTimer);
  // A few seconds later.
  autoTimer = window.setTimeout(() => { autoTimer = null; void syncNow(); }, AUTO_DELAY_MS);
}

/** How long a page waits before a focus or an arrival syncs again, so tab switching does not sync every time. */
const FOCUS_GAP_MS = 30_000;

/** How old the last sync must be for a page's arrival to sync. */
const ARRIVAL_GAP_MS = 60_000;

/**
 * Whether this browser's profile differs from the last synced copy (something unsynced, made here or by a game).
 *
 * @returns true when there is something to send
 */
function unsynced(): boolean {
  // The last synced copy.
  const base = readBase();
  // Never synced: something to send.
  if (!base) return true;
  // Whether notes travel.
  const notes = getDeskState().data.sync?.includeNotes === true;
  // Compared without the desk's notes when they do not travel.
  const strip = (p: Profile) => ({ ...p, [DESK_KEY]: notes ? p[DESK_KEY] : { ...((p[DESK_KEY] as object) ?? {}), notes: undefined } });
  // Different.
  return stableStringify(strip(collectProfile(notes))) !== stableStringify(strip(base.keys));
}

/**
 * Start the automatic sync in this page: a change the reader makes is synced a few seconds later when "sync after
 * changes" is on; a tab regaining focus syncs (at most every 30 seconds); a page being hidden with something unsynced
 * (a game's result, a setting, a pending change) syncs at once; and a page opened a minute or more after the last
 * sync syncs on arrival. Safe to call more than once.
 */
export function startAutoSync(): void {
  // Once per page.
  if (autoStarted || typeof window === "undefined") return;
  // Started.
  autoStarted = true;
  // The reader's own changes (not the sync's, another tab's, or bookkeeping) schedule a sync.
  subscribeDesk((origin) => { if (origin === "user") scheduleAutoSync(); });
  // Whether automatic sync is on now.
  const on = () => getDeskState().data.sync?.auto === true;
  // Focus: the other browser may have changed something.
  const onFocus = () => { if (on() && Date.now() - lastStart > FOCUS_GAP_MS) void syncNow(); };
  // Listening.
  window.addEventListener("focus", onFocus);
  // The page shown again, or hidden.
  document.addEventListener("visibilitychange", () => {
    // Shown: as a focus.
    if (document.visibilityState === "visible") { onFocus(); return; }
    // Hidden with a pending sync, or with something unsynced: sent now, surviving the page being left.
    if (!on()) return;
    // A pending one cancelled and sent now.
    if (autoTimer !== null) { window.clearTimeout(autoTimer); autoTimer = null; void syncNow({ keepalive: true }); return; }
    // Something unsynced (a game's result, a setting changed on this page).
    if (unsynced()) void syncNow({ keepalive: true });
  });
  // On arrival, when the last sync is a minute old or more.
  const at = lastSyncedAt();
  // Synced now.
  if (on() && (at === null || Date.now() - at >= ARRIVAL_GAP_MS)) void syncNow();
}
