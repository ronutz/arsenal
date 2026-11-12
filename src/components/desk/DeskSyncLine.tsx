"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskSyncLine.tsx
// ----------------------------------------------------------------------------
// THE SYNC'S ONE LINE ON MY DESK (PRIME 12/11/2026 13:38, "Portable storage":
// "Synced 14:02" and "Sync now" visible in Settings and on the desk). Drawn
// only for a browser that syncs, and loaded only then (the desk page imports
// it lazily), so a reader who never made a code loads no sync client here.
// The time is this browser's clock, to the minute, read from the local-only
// last synced copy (src/lib/desk/portable.ts, Base.at); the server never
// receives it. Every outcome of a sync is said in words, as in Settings.
// ============================================================================

// React's state and effects.
import { useEffect, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The sync.
import { lastSyncedAt, syncNow, useSyncStatus, SYNC_MAX_BYTES, type SyncPhase } from "@/lib/desk/sync";
// The locale's formats.
import { intlLocale } from "@/i18n/locales";

/**
 * A time as hours and minutes in the page's language (the reader's clock).
 *
 * @param at milliseconds since the epoch
 * @param locale the page's language
 * @returns e.g. "14:02"
 */
export function formatTime(at: number, locale: string): string {
  // Hours and minutes, 24-hour.
  return new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(at));
}

/** The message key (under deskData.phase) of each sync phase that the line says in words. */
const LINE_PHASE: Partial<Record<SyncPhase, string>> = {
  working: "working",
  merged: "merged",
  unavailable: "unavailable",
  offline: "offline",
  "too-large": "tooLarge",
  "rate-limited": "rateLimited",
  "not-found": "notFound",
  unreadable: "unreadable",
  unsupported: "unsupported",
  "deleted-elsewhere": "deletedElsewhere",
  error: "error",
};

/** Phases that are not trouble. */
const CALM: readonly SyncPhase[] = ["idle", "working", "done", "merged"];

/**
 * The line.
 *
 * @returns when this browser last synced, the sync's outcome, and Sync now
 */
export default function DeskSyncLine() {
  // The desk's words.
  const t = useTranslations("desk");
  // The sync's outcomes (the same words as in Settings).
  const tp = useTranslations("deskData.phase");
  // The page's language.
  const locale = useLocale();
  // The sync's status.
  const sync = useSyncStatus();
  // When this browser last synced (read after mount, and after each sync).
  const [at, setAt] = useState<number | null>(null);
  // Read again after each sync.
  useEffect(() => { setAt(lastSyncedAt()); }, [sync]);
  // The phase's sentence.
  const key = LINE_PHASE[sync.phase];
  // With its numbers when too large.
  const said = key ? (sync.phase === "too-large" ? tp(key, { kb: Math.ceil((sync.bytes ?? 0) / 1024), max: Math.floor(SYNC_MAX_BYTES / 1024) }) : tp(key)) : "";
  // The line.
  return (
    <p className={CALM.includes(sync.phase) ? "desk-sync-line desk-muted" : "desk-sync-line desk-alert"} role="status">
      <span aria-hidden="true">{CALM.includes(sync.phase) ? "↻" : "⚠"}</span>{" "}
      {sync.phase !== "deleted-elsewhere" && (at ? t("sync.syncedAt", { time: formatTime(at, locale) }) : t("sync.never"))}{" "}
      {said}{" "}
      {sync.phase !== "deleted-elsewhere" && (
        <button type="button" className="desk-btn" disabled={sync.phase === "working"} onClick={() => void syncNow()}>{t("sync.now")}</button>
      )}{" "}
      <Link href="/settings#desk-sync" className="desk-link">{t("sync.settings")}</Link>
    </p>
  );
}
