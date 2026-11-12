"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskRuntime.tsx
// ----------------------------------------------------------------------------
// THE SYNC ON EVERY PAGE, ONLY FOR A READER WHO SYNCS (PRIME 12/11/2026 13:38,
// "Portable storage": "both browsers sync automatically after changes and when
// a tab regains focus"). Mounted once in the locale layout; renders nothing.
// After the page has loaded it reads one thing, whether this browser holds a
// sync code in ronutz:desk:v1, and only then loads the sync client
// (src/lib/desk/sync.ts) and starts it: a page of a reader who never made a
// code loads nothing more and sends nothing. The text is looked at, not parsed,
// so a page without sync pays one storage read.
//
// SETTINGS' CHANGE TIMES (the site owner, 12/11/2026 14:42, "the latest change
// wins"): on every page it also installs the small watch that notes the minute
// a setting (theme, language, shortcuts, ...) changes in this browser
// (src/lib/desk/settingTimes.ts, a few hundred bytes with the registry), so a
// later sync can tell which of two browsers changed a setting last. Nothing is
// sent by it; the reader can turn it off in Settings.
// ============================================================================

// React's effect.
import { useEffect } from "react";
// The settings' change watch.
import { installSettingWatch } from "@/lib/desk/settingTimes";

/** The desk's key (src/lib/desk/store.ts, DESK_KEY), read here without importing the store. */
const DESK_KEY = "ronutz:desk:v1";

/**
 * The runtime.
 *
 * @returns nothing
 */
export default function DeskRuntime() {
  // Once, after the page has loaded.
  useEffect(() => {
    // The settings' change watch, on every page (it records nothing when the reader chose to keep this browser's value).
    installSettingWatch();
    // The stored desk's text.
    let raw: string | null = null;
    // Storage can refuse.
    try { raw = window.localStorage.getItem(DESK_KEY); } catch { raw = null; }
    // No sync code in it: nothing to load.
    if (!raw || !raw.includes('"sync":{"code":"')) return;
    // The sync client, loaded and started (a failure leaves the page as it is).
    void import("@/lib/desk/sync").then((m) => m.startAutoSync()).catch(() => undefined);
  }, []);
  // Nothing to draw.
  return null;
}
