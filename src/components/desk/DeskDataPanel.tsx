"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskDataPanel.tsx
// ----------------------------------------------------------------------------
// MY DESK ON THE SETTINGS PAGE (PRIME 12/11/2026 12:42, "a section in
// Settings"; 13:38, "Portable storage": the reader's storage portable across
// browsers). Everything about where the reader's things are kept and how they
// follow the reader to another browser, in one place:
//
//   USE THIS ON ANOTHER BROWSER, three ways:
//   1. pairing by QR code or link: this browser shows a QR code (the in-house
//      encoder, src/lib/desk/qr.ts) and a link /<locale>/my-desk/#pair=<code>; the
//      other browser opens it and joins the encrypted sync;
//   2. the sync code typed by hand, in groups of four;
//   3. without the server: the whole portable profile in a file, or in a link
//      that holds it after the "#" (for small profiles; past that, the file).
//   While syncing: "Synced 14:02" (this browser's clock, never sent), Sync now,
//   sync after each change, include notes (off by default), Stop syncing this
//   browser (the data stays), Delete the copy on the server; every outcome in
//   words, a 503 as "not available right now", a conflict as merged changes,
//   a copy deleted from another browser as such.
//   READING: whether reaching the end of an article marks it read.
//   EMPTYING the desk, with an Undo.
// ============================================================================

// React's state, refs and effects.
import { useEffect, useRef, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk.
import { clearDesk, restoreDesk, updateSettings, type DeskData } from "@/lib/desk/store";
// The desk in a component.
import { useDesk } from "@/lib/desk/useDesk";
// Files and links.
import { downloadProfile, makeProfileLink, pairLink, parseProfileFile, PROFILE_LINK_MAX } from "@/lib/desk/transfer";
// The profile: merged in or used instead, with an Undo.
import { mergeProfileIn, profileCounts, replaceProfileWith, restoreProfile, type Profile, type ProfileSnapshot } from "@/lib/desk/portable";
// The sync.
import { createSyncCode, deleteServerCopy, forgetThisDevice, joinWithCode, lastSyncedAt, setSyncChoice, startAutoSync, syncNow, useSyncStatus, SYNC_MAX_BYTES, type SyncPhase } from "@/lib/desk/sync";
// The code's display form, and whether this browser can encrypt.
import { canSync, formatCode } from "@/lib/desk/crypto";
// The settings' change times: the reader's choice to keep this browser's value instead (the site owner, 12/11/2026 14:42).
import { setKeepThisBrowser, timesOn } from "@/lib/desk/settingTimes";
// The pairing QR code.
import DeskQr from "./DeskQr";
// The time of the last sync, in the reader's clock.
import { formatTime } from "./DeskSyncLine";

/** The message key of each sync phase. */
const PHASE_KEY: Record<SyncPhase, string> = {
  idle: "",
  working: "phase.working",
  done: "phase.done",
  merged: "phase.merged",
  unavailable: "phase.unavailable",
  offline: "phase.offline",
  "too-large": "phase.tooLarge",
  "rate-limited": "phase.rateLimited",
  "not-found": "phase.notFound",
  "bad-code": "phase.badCode",
  unreadable: "phase.unreadable",
  unsupported: "phase.unsupported",
  deleted: "phase.deleted",
  "deleted-elsewhere": "phase.deletedElsewhere",
  error: "phase.error",
};

/**
 * The panel.
 *
 * @returns the desk's data controls
 */
export default function DeskDataPanel() {
  // The words.
  const t = useTranslations("deskData");
  // The page's language.
  const locale = useLocale();
  // The desk.
  const { data, ready } = useDesk();
  // The sync's status.
  const sync = useSyncStatus();
  // A profile opened from a file, waiting for the reader's choice.
  const [incoming, setIncoming] = useState<Profile | null>(null);
  // The portable keys before an import, for its Undo.
  const [beforeProfile, setBeforeProfile] = useState<ProfileSnapshot | null>(null);
  // The desk before a clear, for its Undo.
  const [beforeDesk, setBeforeDesk] = useState<DeskData | null>(null);
  // What happened, in words.
  const [msg, setMsg] = useState("");
  // The profile link, once made, or its length when too long.
  const [link, setLink] = useState<{ link: string | null; length: number } | null>(null);
  // Whether notes go in the link.
  const [linkNotes, setLinkNotes] = useState(false);
  // Copied feedback.
  const [copied, setCopied] = useState<"" | "link" | "code" | "pair">("");
  // Whether the pairing code is shown.
  const [pairing, setPairing] = useState(false);
  // Whether the stored code is shown.
  const [showCode, setShowCode] = useState(false);
  // The code being typed.
  const [typed, setTyped] = useState("");
  // Whether the code field is open.
  const [entering, setEntering] = useState(false);
  // The two-step delete of the server copy.
  const [confirmDelete, setConfirmDelete] = useState(false);
  // When this browser last synced (read after mount, and after each sync).
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  // The hidden file input.
  const fileRef = useRef<HTMLInputElement>(null);
  // The page's origin (read after mount, for the links).
  const [origin, setOrigin] = useState("");
  // Whether this browser keeps its own value when a setting changed in both (read after mount; off by default).
  const [keepHere, setKeepHere] = useState(false);
  // Read once mounted (the choice lives in this browser's storage).
  useEffect(() => { setKeepHere(!timesOn()); }, []);

  // After mount: the origin, the last sync's time, and the automatic sync when this browser syncs.
  useEffect(() => {
    // The origin.
    setOrigin(window.location.origin);
    // The time.
    setSyncedAt(lastSyncedAt());
    // Started (and a sync on arrival when the last one is old).
    if (data.sync) startAutoSync();
    // Once the desk is read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  // The time follows each sync.
  useEffect(() => { if (sync.phase === "done" || sync.phase === "merged") setSyncedAt(lastSyncedAt()); }, [sync]);

  /**
   * Copy a text and say so.
   *
   * @param text the text
   * @param which what was copied
   */
  const copy = (text: string, which: "link" | "code" | "pair") => {
    // The clipboard may refuse.
    navigator.clipboard?.writeText(text).then(() => { setCopied(which); window.setTimeout(() => setCopied(""), 2000); }, () => undefined);
  };

  /**
   * Read an opened file.
   *
   * @param f the file
   */
  const onFile = async (f: File) => {
    // Its text, parsed: a profile, or an older desk file.
    const p = parseProfileFile(await f.text());
    // Neither.
    if (!p) { setMsg(t("importBad")); setIncoming(null); return; }
    // Offered.
    setIncoming(p);
    // No old message.
    setMsg("");
  };

  /** Show the pairing code, making a sync code first when this browser has none. */
  const showPairing = async () => {
    // A code first.
    if (!data.sync) { try { await createSyncCode(); } catch { return; } }
    // Shown.
    setPairing(true);
  };

  // The sync phase's sentence.
  const phaseText = sync.phase === "too-large"
    ? t("phase.tooLarge", { kb: Math.ceil((sync.bytes ?? 0) / 1024), max: Math.floor(SYNC_MAX_BYTES / 1024) })
    : PHASE_KEY[sync.phase] ? t(PHASE_KEY[sync.phase]) : "";
  // The pairing link, once there is a code.
  const pair = data.sync && origin ? pairLink(origin, locale, data.sync.code) : "";
  // Counts of an incoming profile.
  const counts = incoming ? profileCounts(incoming) : null;

  // The panel.
  return (
    <div className="desk-data">
      {/* ---- Use this on another browser ---- */}
      <h3 className="desk-h3" id="desk-sync">{t("anotherTitle")}</h3>
      <p className="colophon-body">{t("anotherBody")}</p>
      {!canSync() && ready && <p className="desk-alert">{t("phase.unsupported")}</p>}

      {/* 1. Pairing by QR code or link. */}
      <h4 className="desk-h4">{t("pairTitle")}</h4>
      <p className="desk-note">{t("pairBody")}</p>
      {!pairing || !pair ? (
        <button type="button" className="desk-btn" disabled={!ready} onClick={() => void showPairing()}>{t("pairShow")}</button>
      ) : (
        <div className="desk-pair">
          <DeskQr text={pair} label={t("pairQrLabel")} />
          <div className="desk-pair-side">
            <p className="desk-alert">{t("pairWarn")}</p>
            <label className="desk-picker-label" htmlFor="desk-pair-field">{t("pairLinkLabel")}</label>
            <input id="desk-pair-field" className="desk-input desk-input--wide mono" type="text" readOnly value={pair} onFocus={(e) => e.currentTarget.select()} />
            <div className="desk-controls-row">
              <button type="button" className="desk-btn" onClick={() => copy(pair, "pair")}>{copied === "pair" ? t("copied") : t("copyLink")}</button>
              <button type="button" className="desk-btn desk-btn--quiet" onClick={() => setPairing(false)}>{t("pairHide")}</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. The code typed by hand. */}
      <h4 className="desk-h4">{t("typedTitle")}</h4>
      <p className="desk-note">{t("typedBody")}</p>
      {data.sync === null ? (
        <div>
          <button type="button" className="desk-btn" aria-expanded={entering} onClick={() => setEntering((v) => !v)}>{t("syncEnter")}</button>
          {entering && (
            <form
              className="desk-inline-form"
              onSubmit={(e) => {
                // Not a page load.
                e.preventDefault();
                // Tried.
                void joinWithCode(typed);
              }}
            >
              <label className="desk-picker-label" htmlFor="desk-code-field">{t("syncCodeLabel")}</label>
              <input id="desk-code-field" className="desk-input desk-input--wide mono" type="text" autoComplete="off" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" />
              <button type="submit" className="desk-btn">{t("syncUse")}</button>
              {sync.phase === "not-found" && <button type="button" className="desk-btn" onClick={() => void joinWithCode(typed, true)}>{t("syncStartNew")}</button>}
            </form>
          )}
        </div>
      ) : (
        <div className="desk-controls-row">
          <button type="button" className="desk-btn" aria-pressed={showCode} onClick={() => setShowCode((v) => !v)}>{showCode ? t("syncHide") : t("syncShow")}</button>
          {showCode && <span className="desk-code mono">{formatCode(data.sync.code)}</span>}
          {showCode && <button type="button" className="desk-btn" onClick={() => copy(data.sync?.code ?? "", "code")}>{copied === "code" ? t("copied") : t("syncCopy")}</button>}
        </div>
      )}

      {/* While syncing: when, the choices, and the ways out. */}
      {data.sync !== null && (
        <div className="desk-sync-box">
          <p className="desk-note">
            <span aria-hidden="true">{"✓"}</span> {t("syncOn")} {syncedAt ? t("syncedAt", { time: formatTime(syncedAt, locale) }) : t("syncNever")}
            {sync.bytes ? <> {t("syncSize", { kb: Math.ceil(sync.bytes / 1024), max: Math.floor(SYNC_MAX_BYTES / 1024) })}</> : null}
          </p>
          <div className="desk-controls-row">
            <button type="button" className="desk-btn" disabled={sync.phase === "working"} onClick={() => void syncNow()}>{t("syncNow")}</button>
            <label className="desk-check">
              <input type="checkbox" checked={data.sync.auto} onChange={(e) => setSyncChoice({ auto: e.target.checked })} /> {t("syncAuto")}
            </label>
            <label className="desk-check">
              <input type="checkbox" checked={data.sync.includeNotes} onChange={(e) => setSyncChoice({ includeNotes: e.target.checked })} /> {t("syncNotes")}
            </label>
          </div>
          <div className="desk-controls-row">
            <button type="button" className="desk-btn desk-btn--quiet" onClick={() => { forgetThisDevice(); setPairing(false); setShowCode(false); setSyncedAt(null); }}>{t("syncForget")}</button>
            {confirmDelete ? (
              <>
                <button type="button" className="desk-btn desk-btn--danger" onClick={() => { void deleteServerCopy(); setConfirmDelete(false); setPairing(false); setSyncedAt(null); }}>{t("syncDeleteNow")}</button>
                <button type="button" className="desk-btn desk-btn--quiet" onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
              </>
            ) : (
              <button type="button" className="desk-btn desk-btn--quiet" onClick={() => setConfirmDelete(true)}>{t("syncDelete")}</button>
            )}
          </div>
          <p className="desk-muted">{confirmDelete ? t("syncDeleteNote") : t("syncForgetNote")}</p>
        </div>
      )}
      {/* The sync's outcome, in words; settings that arrived apply on the next page. */}
      {phaseText && <p className={sync.phase === "done" || sync.phase === "merged" || sync.phase === "working" || sync.phase === "deleted" ? "desk-note" : "desk-alert"} role="status">{phaseText}{sync.settings ? ` ${t("settingsLater")}` : ""}</p>}

      {/* When a setting changed in two browsers: the latest change wins by default (times recorded); or this browser's
          value, recording no times. What the default stores, and where, is said in words. */}
      <h4 className="desk-h4">{t("timesTitle")}</h4>
      <p className="desk-note">{t("timesBody")}</p>
      <label className="desk-check">
        <input
          type="checkbox"
          checked={keepHere}
          onChange={(e) => {
            // Kept, and the stored times deleted when turned on.
            setKeepThisBrowser(e.target.checked);
            // Shown.
            setKeepHere(e.target.checked);
          }}
        />{" "}
        {t("timesKeep")}
      </label>
      <p className="desk-muted">{t("timesKeepNote")}</p>

      {/* 3. Without the server: a file, or a link. */}
      <h4 className="desk-h4">{t("serverlessTitle")}</h4>
      <p className="desk-note">{t("serverlessBody")}</p>
      <p className="desk-label">{t("fileTitle")}</p>
      <p className="desk-note">{t("fileBody")}</p>
      <div className="desk-controls-row">
        <button type="button" className="desk-btn" disabled={!ready} onClick={() => downloadProfile()}>{t("export")}</button>
        <button type="button" className="desk-btn" onClick={() => fileRef.current?.click()}>{t("import")}</button>
        <input
          ref={fileRef}
          className="desk-visually-hidden"
          type="file"
          accept="application/json,.json"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            // The chosen file.
            const f = e.target.files?.[0];
            // Read.
            if (f) void onFile(f);
            // The same file can be chosen again.
            e.target.value = "";
          }}
        />
      </div>
      {/* A profile waiting for the reader's choice. */}
      {incoming && counts && (
        <div className="desk-incoming" role="group" aria-label={t("importTitle")}>
          <p>{t("importAsk", counts)}</p>
          <div className="desk-controls-row">
            <button type="button" className="desk-btn" onClick={() => { setBeforeProfile(mergeProfileIn(incoming)); setIncoming(null); setMsg(t("imported")); }}>{t("merge")}</button>
            <button type="button" className="desk-btn" onClick={() => { setBeforeProfile(replaceProfileWith(incoming)); setIncoming(null); setMsg(t("imported")); }}>{t("replace")}</button>
            <button type="button" className="desk-btn desk-btn--quiet" onClick={() => setIncoming(null)}>{t("cancel")}</button>
          </div>
        </div>
      )}
      <p className="desk-label">{t("linkTitle")}</p>
      <p className="desk-note">{t("linkBody")}</p>
      <div className="desk-controls-row">
        <label className="desk-check">
          <input type="checkbox" checked={linkNotes} onChange={(e) => { setLinkNotes(e.target.checked); setLink(null); }} /> {t("includeNotes")}
        </label>
        <button type="button" className="desk-btn" disabled={!ready} onClick={() => void makeProfileLink(window.location.origin, locale, linkNotes).then(setLink)}>{t("linkMake")}</button>
      </div>
      {link && link.link && (
        <div className="desk-controls-row">
          <label className="desk-visually-hidden" htmlFor="desk-link-field">{t("linkTitle")}</label>
          <input id="desk-link-field" className="desk-input desk-input--wide mono" type="text" readOnly value={link.link} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="desk-btn" onClick={() => copy(link.link ?? "", "link")}>{copied === "link" ? t("copied") : t("copyLink")}</button>
        </div>
      )}
      {link && !link.link && <p className="desk-alert" role="status">{t("linkTooLong", { kb: Math.ceil(link.length / 1024), max: Math.floor(PROFILE_LINK_MAX / 1024) })}</p>}

      {/* Reading. */}
      <h3 className="desk-h3">{t("readingTitle")}</h3>
      <label className="desk-check">
        <input type="checkbox" checked={data.settings.autoRead} disabled={!ready} onChange={(e) => updateSettings({ autoRead: e.target.checked })} /> {t("autoRead")}
      </label>

      {/* Emptying, with an Undo. */}
      <h3 className="desk-h3">{t("clearTitle")}</h3>
      <div className="desk-controls-row">
        <button type="button" className="desk-btn desk-btn--quiet" disabled={!ready} onClick={() => { setBeforeDesk(clearDesk()); setBeforeProfile(null); setMsg(t("cleared")); }}>{t("clear")}</button>
        <Link href="/my-desk" className="desk-link">{t("open")} <span aria-hidden="true">{"→"}</span></Link>
      </div>
      {/* What happened, with an Undo for an import or a clear. */}
      {msg && (
        <p className="desk-status" role="status">
          {msg}{" "}
          {(beforeProfile || beforeDesk) && (
            <button
              type="button"
              className="desk-btn"
              onClick={() => {
                // The import undone, or the clear.
                if (beforeProfile) restoreProfile(beforeProfile);
                else if (beforeDesk) restoreDesk(beforeDesk);
                // Cleared.
                setBeforeProfile(null);
                setBeforeDesk(null);
                setMsg("");
              }}
            >
              {t("undo")}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
