"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskPrivacy.tsx
// ----------------------------------------------------------------------------
// THE "PRIVACY AND SETTINGS" WIDGET (the site owner, 12/11/2026 15:27: "a
// widget to allow access to privacy controls and a link to the page with all
// the user preferences"). The controls a reader most often needs, on the desk,
// each one the same control or the same function the Settings page uses, so
// nothing here decides anything of its own:
//   - counting your use: the Settings page's own switch (InterestToggle, the
//     one key ronutz:interest:v1, the same rules: a browser's Global Privacy
//     Control or Do Not Track still wins, and the line under it says so);
//   - the sync: when this browser syncs, the desk's sync line (when it last
//     synced, Sync now), "Include notes" and "Stop syncing this browser" (the
//     sync client's setSyncChoice and forgetThisDevice, loaded only when used);
//     when it does not, that in words and the way to start on Settings;
//   - when a setting changed in two browsers: the latest change wins, or this
//     browser keeps its value (src/lib/desk/settingTimes.ts, as on Settings);
//   - automatic read marks at the end of an article, on or off;
//   - "Empty my desk", asked in the widget itself (never a browser dialog),
//     emptied by the store's clearDesk; the page then says so with an Undo
//     (the widget itself goes with the layout it was part of).
// And two links: every setting of the desk (/settings#desk) and what the
// Privacy page says about the desk and the sync (/privacy#desk).
// Every state is said in words and a sign, never by colour alone.
// ============================================================================

// React's state, effects, refs and ids.
import { useEffect, useId, useRef, useState } from "react";
// A component loaded only when drawn.
import dynamic from "next/dynamic";
// The page's strings.
import { useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk's settings verb and shape.
import { updateSettings, type DeskData } from "@/lib/desk/store";
// The settings' change times: the reader's choice to keep this browser's value instead (as on Settings).
import { setKeepThisBrowser, timesOn } from "@/lib/desk/settingTimes";
// The counting switch, exactly as on the Settings page, and the shape of its words.
import InterestToggle, { type InterestToggleLabels } from "@/components/InterestToggle";

/** The sync's line (when it last synced, Sync now), loaded only for a browser that syncs. */
const DeskSyncLine = dynamic(() => import("./DeskSyncLine"), { ssr: false });

/**
 * The widget.
 *
 * @param props the desk; the counting switch's words (the Settings page's own, given by the page); what emptying does
 * @returns the widget's content
 */
export default function DeskPrivacy(props: { data: DeskData; interestLabels?: InterestToggleLabels; onEmpty: () => void }) {
  // The words.
  const t = useTranslations("desk");
  // Ids for the groups' names.
  const uid = useId();
  // Whether this browser keeps its own value when a setting changed in both (read after mount; off by default).
  const [keepHere, setKeepHere] = useState(false);
  // Read once mounted (the choice lives in this browser's storage).
  useEffect(() => { setKeepHere(!timesOn()); }, []);
  // Whether "Empty my desk" is being asked.
  const [asking, setAsking] = useState(false);
  // The safe answer, focused when the question opens.
  const keepBtn = useRef<HTMLButtonElement>(null);
  // Focus on "Keep it" when asked.
  useEffect(() => { if (asking) keepBtn.current?.focus(); }, [asking]);
  // Said after "Stop syncing this browser".
  const [stopped, setStopped] = useState(false);
  // The sync settings, or null when this browser does not sync.
  const sync = props.data.sync;

  /** Stop syncing this browser, as on Settings: the code forgotten here, the desk kept. */
  const stopSyncing = () => {
    // The sync client, loaded now; its own function.
    void import("@/lib/desk/sync").then((m) => { m.forgetThisDevice(); setStopped(true); }, () => undefined);
  };

  /**
   * Whether notes travel with the sync, as on Settings.
   *
   * @param on the choice
   */
  const includeNotes = (on: boolean) => {
    // The sync client's own function.
    void import("@/lib/desk/sync").then((m) => m.setSyncChoice({ includeNotes: on }), () => undefined);
  };

  /**
   * The merge rule for settings changed in two browsers, as on Settings.
   *
   * @param keep true: this browser keeps its value; false: the latest change wins
   */
  const chooseMerge = (keep: boolean) => {
    // Kept (turning it on deletes the stored change times).
    setKeepThisBrowser(keep);
    // Shown.
    setKeepHere(keep);
  };

  // The widget.
  return (
    <div className="desk-privacy">
      {/* Counting your use: the Settings page's own switch and its line of what is true now. */}
      {props.interestLabels && (
        <div className="desk-privacy-part">
          <p className="desk-label">{t("privacy.counting")}</p>
          <InterestToggle labels={props.interestLabels} />
        </div>
      )}

      {/* The sync: its line and choices while this browser syncs; otherwise that, and the way to start. */}
      <div className="desk-privacy-part">
        <p className="desk-label">{t("privacy.sync")}</p>
        {sync ? (
          <>
            <DeskSyncLine />
            <label className="desk-check">
              <input type="checkbox" checked={sync.includeNotes} onChange={(e) => includeNotes(e.target.checked)} /> {t("privacy.notes")}
            </label>
            <div className="desk-controls-row">
              <button type="button" className="desk-btn desk-btn--quiet" onClick={stopSyncing}>{t("privacy.syncStop")}</button>
            </div>
          </>
        ) : (
          <p className="desk-note">
            <span className="desk-sign" aria-hidden="true">{"○"}</span> {t("privacy.syncOff")}{" "}
            <Link href="/settings#desk-sync" className="desk-link">{t("privacy.syncStart")}</Link>
          </p>
        )}
        {stopped && !sync && <p className="desk-status" role="status">{t("privacy.syncStopped")}</p>}
      </div>

      {/* A setting changed in two browsers: which value stays. */}
      <div className="desk-privacy-part">
        <fieldset className="desk-adopt-mode">
          <legend className="desk-label">{t("privacy.merge")}</legend>
          <label className="desk-check">
            <input type="radio" name={`${uid}-merge`} checked={!keepHere} onChange={() => chooseMerge(false)} /> {t("privacy.mergeLatest")}
          </label>
          <label className="desk-check">
            <input type="radio" name={`${uid}-merge`} checked={keepHere} onChange={() => chooseMerge(true)} /> {t("privacy.mergeKeep")}
          </label>
        </fieldset>
      </div>

      {/* Reading: the automatic read mark at an article's end. */}
      <div className="desk-privacy-part">
        <label className="desk-check">
          <input type="checkbox" checked={props.data.settings.autoRead} onChange={(e) => updateSettings({ autoRead: e.target.checked })} /> {t("privacy.autoRead")}
        </label>
      </div>

      {/* Emptying: asked here, in words, with the safe answer focused; the page offers the Undo afterwards. */}
      <div className="desk-privacy-part">
        {asking ? (
          <div className="desk-incoming" role="group" aria-labelledby={`${uid}-empty-q`}>
            <p id={`${uid}-empty-q`}><span className="desk-sign" aria-hidden="true">{"⚠"}</span> {t("privacy.emptyAsk")}</p>
            <div className="desk-controls-row">
              <button type="button" className="desk-btn desk-btn--danger" onClick={() => { setAsking(false); props.onEmpty(); }}>{t("privacy.emptyYes")}</button>
              <button ref={keepBtn} type="button" className="desk-btn desk-btn--quiet" onClick={() => setAsking(false)}>{t("privacy.emptyNo")}</button>
            </div>
          </div>
        ) : (
          <button type="button" className="desk-btn desk-btn--quiet" onClick={() => setAsking(true)}>{t("privacy.empty")}</button>
        )}
      </div>

      {/* Everything else: the desk's section of Settings, and what the Privacy page says about the desk and the sync. */}
      <p className="desk-widget-action desk-privacy-links">
        <Link href="/settings#desk" className="desk-link">{t("privacy.allSettings")}</Link>
        <Link href="/privacy#desk" className="desk-link">{t("privacy.privacyPage")}</Link>
      </p>
    </div>
  );
}
