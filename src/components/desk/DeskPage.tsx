"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskPage.tsx
// ----------------------------------------------------------------------------
// THE READER'S OWN PAGE, "MY DESK" (PRIME 12/11/2026 12:42; PLAN-personal-
// desk-20261112, phases 1 and 2). The widgets of the stored layout, in the
// reader's order (src/lib/desk/store.ts, defaultLayout for a new desk): one
// column on a phone, sizes honoured on a wide screen, the same stored layout
// for every screen. Phase 3 adds an edit mode on top of this; the layout's
// shape (an ordered list of widgets with an id, a type, a size and their own
// settings, and a revision) is already the one it edits.
//
// Every state of the storage is said in words: the desk being read; the
// browser refusing storage (it lasts only while the page is open); the desk
// cleared while the page was open; what was stored being unreadable (offered
// as a file before anything overwrites it); parts repaired; whether the
// browser agreed to keep the site's storage; the site index not loading. A
// transfer link (/my-desk#desk=...) is read here and offered to merge or to use
// instead, with an Undo. When this browser syncs, the page syncs on arrival.
//
// PORTABLE STORAGE (PRIME 12/11/2026 13:38). Two more links arrive here:
//   /my-desk#pair=<code>: the pairing link (or QR code) another browser shows in
//     Settings. The code leaves the address at once; the page asks "Use the
//     same desk and settings here?" and, on yes, joins the encrypted sync
//     (src/lib/desk/sync.ts, joinWithCode), which merges what this browser
//     holds into the stored copy and takes the other browser's settings.
//   /my-desk#profile=<data>: the whole portable profile carried after the "#",
//     made in Settings without the server; offered to add or to use instead,
//     with an Undo.
// While this browser syncs, one line says when it last synced ("Synced 14:02",
// this browser's clock) with a Sync now button (DeskSyncLine, loaded lazily).
//
// ARRANGING (phase 3, PLAN sections 3.5 and 3.9). "Arrange this page" opens the
// editor (DeskLayoutEditor, loaded when first opened): add, remove, move and
// resize widgets by buttons and keys, never by dragging alone, with Undo for
// every change and "Done" as the only way out, after which focus returns to
// the button that opened it. The page draws the widget types the catalogue
// knows (src/lib/desk/layout.ts); a type written by a newer page is kept in the
// layout and not drawn.
//
// PRIVACY AND SETTINGS (the site owner, 12/11/2026 15:27): the widget's
// "Empty my desk" is answered here, at the page's level, with an Undo that
// stays after the widget has gone with the emptied layout (focus moves to it).
// The counting switch's words are the Settings page's own, given by the route.
// ============================================================================

// React's state, effects and refs.
import { useEffect, useRef, useState } from "react";
// A component loaded only when drawn.
import dynamic from "next/dynamic";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk's state, verbs and shapes.
import {
  clearDesk, followRedirects, getDeskState, mergeIntoDesk, pruneWidgetNotes, recordVisit, refreshLivePaths, replaceDesk, resetLayout, restoreDesk,
  updateSettings, type DeskData, type DeskSynced, type DeskWidget,
} from "@/lib/desk/store";
// The widget types this page draws.
import { DESK_WIDGET_TYPES } from "@/lib/desk/layout";
// The desk in a component.
import { useDesk } from "@/lib/desk/useDesk";
// The automatic sync, loaded only when this browser syncs.
import { useAutoSync } from "@/lib/desk/autoSync";
// The index.
import { useSiteIndex } from "@/lib/desk/siteIndex";
// Transfer links and files.
import { downloadText, readPairFragment, readProfileFragment, readTransferFragment } from "@/lib/desk/transfer";
// A profile from a link: merged in, or used instead, with an Undo.
import { mergeProfileIn, profileCounts, replaceProfileWith, restoreProfile, type Profile, type ProfileSnapshot } from "@/lib/desk/portable";
// The code's canonical form, to know a link for the code this browser already uses.
import { normalizeCode } from "@/lib/desk/crypto";
// The sync's outcomes (the type only: the client itself is loaded when needed).
import type { SyncPhase } from "@/lib/desk/sync";
// The widgets.
import DeskPaths from "./DeskPaths";
import { ContinueWidget, FavouritesWidget, PuzzlesWidget, RecentWidget, SearchWidget } from "./DeskWidgets";
// New for you (phase 3).
import DeskNews from "./DeskNews";
// Notes (phase 4).
import DeskNotes from "./DeskNotes";
// The exam countdown (phase 4).
import DeskCountdown from "./DeskCountdown";
// A quick tool (phase 4); each tool's engine is loaded only when the widget shows it.
import DeskQuickTool from "./DeskQuickTool";
// The reading streak and milestones.
import DeskStreak from "./DeskStreak";
// Privacy and settings: the controls a reader most often needs, as on Settings.
import DeskPrivacy from "./DeskPrivacy";
// The counting switch's words (the Settings page's own, given by the route).
import type { InterestToggleLabels } from "@/components/InterestToggle";

/** The sync's line, loaded only for a browser that syncs (it brings the sync client with it). */
const DeskSyncLine = dynamic(() => import("./DeskSyncLine"), { ssr: false });

/** The layout editor, loaded the first time the reader opens it. */
const DeskLayoutEditor = dynamic(() => import("./DeskLayoutEditor"), { ssr: false });

/** The message key (under deskData.phase) of a failed join. */
const JOIN_PHASE: Partial<Record<SyncPhase, string>> = {
  unavailable: "unavailable",
  offline: "offline",
  "too-large": "tooLarge",
  "rate-limited": "rateLimited",
  "not-found": "notFound",
  "bad-code": "badCode",
  unreadable: "unreadable",
  unsupported: "unsupported",
  error: "error",
};

/** A desk carried by a transfer link, waiting for the reader's choice. */
interface Incoming {
  /** What it carries. */
  data: DeskSynced;
}

/**
 * The page's body.
 *
 * @param props the counting switch's words, for the Privacy and settings widget
 * @returns the status lines and the widgets
 */
export default function DeskPage(props: { interestLabels?: InterestToggleLabels }) {
  // The words.
  const t = useTranslations("desk");
  // The sync's outcomes, in the words Settings uses.
  const tp = useTranslations("deskData.phase");
  // The page's language.
  const locale = useLocale();
  // The desk.
  const { data, status, ready, repairs, damagedText } = useDesk();
  // Changes made here reach the sync when this browser syncs.
  useAutoSync();
  // The site index, loaded once the desk has been read.
  const { index, failed } = useSiteIndex(locale, ready);
  // Whether the browser keeps the site's storage (asked without prompting: navigator.storage.persisted()).
  const [persisted, setPersisted] = useState<boolean | null>(null);
  // A desk from a transfer link.
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  // The desk as it was before a transfer, for its Undo.
  const [before, setBefore] = useState<DeskData | null>(null);
  // A pairing code from a pairing link, waiting for the reader's yes.
  const [pair, setPair] = useState<string | null>(null);
  // The pairing: being joined, or its failure in words.
  const [pairState, setPairState] = useState<{ working: boolean; failed: string }>({ working: false, failed: "" });
  // A profile from a profile link, waiting for the reader's choice.
  const [profileIn, setProfileIn] = useState<Profile | null>(null);
  // The portable keys as they were before a profile link was used, for its Undo.
  const [beforeProfile, setBeforeProfile] = useState<ProfileSnapshot | null>(null);
  // A link that could not be read, in words.
  const [badLink, setBadLink] = useState(false);
  // Whether this browser synced while the page was open (the line stays to say a copy was deleted elsewhere).
  const [syncSeen, setSyncSeen] = useState(false);
  // Whether the layout is being arranged.
  const [editing, setEditing] = useState(false);
  // The line said after arranging ends.
  const [layoutSaid, setLayoutSaid] = useState("");
  // The button that opens the editor, where focus returns on Done.
  const arrangeBtn = useRef<HTMLButtonElement>(null);
  // Whether focus should return to that button after the editor closes.
  const returnFocus = useRef(false);
  // The desk as it was before "Empty my desk" (from the Privacy and settings widget), for its Undo.
  const [emptied, setEmptied] = useState<DeskData | null>(null);
  // That Undo, given focus once the widget that asked has gone.
  const emptiedUndo = useRef<HTMLButtonElement>(null);
  // Focus on the Undo after emptying.
  useEffect(() => { if (emptied) emptiedUndo.current?.focus(); }, [emptied]);

  // After Done: focus back on the button that opened the editor.
  useEffect(() => {
    // Only right after closing.
    if (editing || !returnFocus.current) return;
    // Once.
    returnFocus.current = false;
    // Back where the reader started.
    arrangeBtn.current?.focus();
  }, [editing]);

  // On arrival: the visit recorded, the storage's standing read, a transfer link read, and a sync when this browser syncs.
  useEffect(() => {
    // Not yet read.
    if (!ready) return;
    // The visit (bookkeeping only).
    recordVisit();
    // Whether the browser keeps the storage (no prompt: this only reads the answer).
    if (typeof navigator !== "undefined" && navigator.storage && typeof navigator.storage.persisted === "function") {
      // Read.
      navigator.storage.persisted().then(setPersisted, () => setPersisted(null));
    }
    // The address's fragment.
    const hash = window.location.hash;
    // A transfer link.
    if (hash.startsWith("#desk=")) {
      // Read and repaired.
      void readTransferFragment(hash).then((d) => setIncoming(d ? { data: d } : null));
    }
    // A pairing link: the code taken out of the address at once, then the question.
    if (hash.startsWith("#pair=")) {
      // The code, when the link is whole.
      const code = readPairFragment(hash);
      // Out of the address (and of this history entry).
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      // Asked, or said to be incomplete.
      if (code) setPair(code); else setBadLink(true);
    }
    // A profile link.
    if (hash.startsWith("#profile=")) {
      // Read: offered, or said to be unreadable.
      void readProfileFragment(hash).then((p) => { if (p) setProfileIn(p); else { setBadLink(true); window.history.replaceState(null, "", window.location.pathname + window.location.search); } });
    }
    // A sync on arrival, when this browser syncs (the client is loaded only then).
    if (data.sync) void import("@/lib/desk/sync").then((m) => { m.startAutoSync(); void m.syncNow(); }).catch(() => undefined);
    // Once per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // The index in: renamed items followed, live paths brought up to date.
  useEffect(() => {
    // Not yet.
    if (!index) return;
    // Renames and merges.
    followRedirects(index.redirects);
    // Live paths.
    refreshLivePaths((id) => index.byId.get(id)?.m);
  }, [index]);

  // Once this browser syncs on this page, the sync's line stays (to say so if the copy is deleted elsewhere).
  useEffect(() => { if (data.sync) setSyncSeen(true); }, [data.sync]);

  /** Drop the transfer link from the address, so a reload does not offer it again. */
  const clearHash = () => {
    // The address without its fragment, in place.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    // Closed.
    setIncoming(null);
    // Closed.
    setProfileIn(null);
  };

  /** Join the sync with the pairing link's code (the reader said yes). */
  const joinPair = async () => {
    // Nothing to join.
    if (!pair) return;
    // Working.
    setPairState({ working: true, failed: "" });
    // The sync client, loaded now.
    try {
      // Loaded.
      const m = await import("@/lib/desk/sync");
      // Joined.
      const r = await m.joinWithCode(pair);
      // Its key in words, when it failed.
      const key = JOIN_PHASE[r.phase];
      // Failed: said, and the question stays.
      if (key) { setPairState({ working: false, failed: tp(key) }); return; }
      // Joined: the automatic sync started, the question closed.
      m.startAutoSync();
      setPair(null);
      setPairState({ working: false, failed: "" });
    } catch {
      // The client could not load.
      setPairState({ working: false, failed: tp("offline") });
    }
  };

  // Whether the pairing link is for the code this browser already uses.
  const samePair = pair !== null && data.sync !== null && normalizeCode(pair) === data.sync.code;
  // What a profile link holds.
  const profileHolds = profileIn ? profileCounts(profileIn) : null;

  // An empty desk shows examples.
  const empty = Object.keys(data.saved).length === 0 && Object.keys(data.read).length === 0 && data.paths.length === 0;
  // The widgets this page draws, in the reader's order (types it does not know are kept in the layout, not drawn).
  const widgets = data.layout.widgets.filter((w) => DESK_WIDGET_TYPES.includes(w.type));

  /**
   * One widget's content.
   *
   * @param w the widget
   * @returns the content
   */
  const content = (w: DeskWidget) => {
    // By type.
    switch (w.type) {
      case "continue": return <ContinueWidget data={data} index={index} />;
      case "news": return <DeskNews data={data} index={index} />;
      case "paths": return <DeskPaths data={data} index={index} empty={empty} />;
      case "favourites": return <FavouritesWidget data={data} index={index} empty={empty} />;
      case "recent": return <RecentWidget data={data} index={index} />;
      case "puzzles": return <PuzzlesWidget index={index} />;
      case "search": return <SearchWidget />;
      case "notes": return <DeskNotes data={data} widgetId={w.id} />;
      case "countdown": return <DeskCountdown data={data} widget={w} index={index} />;
      case "quicktool": return <DeskQuickTool data={data} widget={w} index={index} />;
      case "streak": return <DeskStreak data={data} index={index} />;
      case "privacy": return <DeskPrivacy data={data} interestLabels={props.interestLabels} onEmpty={() => setEmptied(clearDesk())} />;
      default: return null;
    }
  };

  // The page's body.
  return (
    <div className={`desk${data.settings.density === "compact" ? " desk--compact" : ""}`}>
      {/* The storage's standing, in words. */}
      <div className="desk-statuses" role="status">
        {!ready && <p className="desk-muted">{t("status.loading")}</p>}
        {status === "unavailable" && <p className="desk-alert"><span aria-hidden="true">{"⚠"}</span> {t("status.unavailable")}</p>}
        {status === "cleared" && <p className="desk-alert"><span aria-hidden="true">{"⚠"}</span> {t("status.cleared")} <Link href="/settings#desk" className="desk-link">{t("status.toSettings")}</Link></p>}
        {damagedText !== null && (
          <p className="desk-alert">
            <span aria-hidden="true">{"⚠"}</span> {t("status.damaged")}{" "}
            <button type="button" className="desk-btn" onClick={() => downloadText("ronutz-desk-damaged.txt", damagedText, "text/plain")}>{t("status.damagedSave")}</button>
          </p>
        )}
        {repairs > 0 && damagedText === null && <p className="desk-note">{t("status.repaired", { count: repairs })}</p>}
        {ready && status === "ok" && !empty && persisted === false && !data.sync && (
          <p className="desk-note">{t("status.notPersisted")} <Link href="/settings#desk" className="desk-link">{t("status.toSettings")}</Link></p>
        )}
        {ready && persisted === true && <p className="desk-muted"><span aria-hidden="true">{"✓"}</span> {t("status.persisted")}</p>}
        {failed && <p className="desk-alert"><span aria-hidden="true">{"⚠"}</span> {t("status.indexError")}</p>}
        {badLink && <p className="desk-alert"><span aria-hidden="true">{"⚠"}</span> {t("pair.bad")}</p>}
      </div>
      {/* While this browser syncs: when it last synced, and Sync now. */}
      {ready && (data.sync || syncSeen) && <DeskSyncLine />}
      {/* A pairing link: the question, before anything is sent. */}
      {pair && (
        <div className="desk-incoming" role="group" aria-labelledby="desk-pair-title">
          <p className="desk-label" id="desk-pair-title">{samePair ? t("pair.same") : t("pair.title")}</p>
          {!samePair && <p>{t("pair.body")}</p>}
          {!samePair && data.sync && <p className="desk-note">{t("pair.switch")}</p>}
          {pairState.failed && <p className="desk-alert" role="status">{pairState.failed}</p>}
          <div className="desk-controls-row">
            {!samePair && <button type="button" className="desk-btn" disabled={pairState.working || !ready} onClick={() => void joinPair()}>{pairState.working ? tp("working") : t("pair.join")}</button>}
            <button type="button" className="desk-btn desk-btn--quiet" onClick={() => { setPair(null); setPairState({ working: false, failed: "" }); }}>{samePair ? t("pair.close") : t("pair.notNow")}</button>
          </div>
        </div>
      )}
      {/* A profile link: what it holds, and the reader's choice. */}
      {profileIn && profileHolds && (
        <div className="desk-incoming" role="group" aria-labelledby="desk-profile-title">
          <p className="desk-label" id="desk-profile-title">{t("profile.title")}</p>
          <p>{t("profile.body", profileHolds)}</p>
          <div className="desk-controls-row">
            <button type="button" className="desk-btn" onClick={() => { setBeforeProfile(mergeProfileIn(profileIn)); clearHash(); }}>{t("incoming.merge")}</button>
            <button type="button" className="desk-btn" onClick={() => { setBeforeProfile(replaceProfileWith(profileIn)); clearHash(); }}>{t("incoming.replace")}</button>
            <button type="button" className="desk-btn desk-btn--quiet" onClick={clearHash}>{t("incoming.ignore")}</button>
          </div>
        </div>
      )}
      {beforeProfile && (
        <p className="desk-status" role="status">
          {t("profile.done")}{" "}
          <button type="button" className="desk-btn" onClick={() => { restoreProfile(beforeProfile); setBeforeProfile(null); }}>{t("undo")}</button>
        </p>
      )}
      {/* A desk from a transfer link: what it holds, and the reader's choice. */}
      {incoming && (
        <div className="desk-incoming" role="group" aria-label={t("incoming.title")}>
          <p className="desk-label">{t("incoming.title")}</p>
          <p>{t("incoming.body", { saved: Object.keys(incoming.data.saved).length, read: Object.keys(incoming.data.read).length, paths: incoming.data.paths.length })}</p>
          <div className="desk-controls-row">
            <button type="button" className="desk-btn" onClick={() => { setBefore(mergeIntoDesk(incoming.data)); clearHash(); }}>{t("incoming.merge")}</button>
            <button type="button" className="desk-btn" onClick={() => { setBefore(replaceDesk(incoming.data)); clearHash(); }}>{t("incoming.replace")}</button>
            <button type="button" className="desk-btn desk-btn--quiet" onClick={clearHash}>{t("incoming.ignore")}</button>
          </div>
        </div>
      )}
      {before && (
        <p className="desk-status" role="status">
          {t("incoming.done")}{" "}
          <button type="button" className="desk-btn" onClick={() => { restoreDesk(before); setBefore(null); }}>{t("undo")}</button>
        </p>
      )}
      {/* The desk emptied from the Privacy and settings widget: said, with its Undo (the desk as it was, layout too). */}
      {emptied && (
        <p className="desk-status" role="status">
          <span className="desk-sign" aria-hidden="true">{"✓"}</span> {t("privacy.emptied")}{" "}
          <button ref={emptiedUndo} type="button" className="desk-btn" onClick={() => { restoreDesk(emptied); setEmptied(null); }}>{t("undo")}</button>
        </p>
      )}
      {/* The page's controls: arranging, and density, the one setting kept here. */}
      <div className="desk-toolbar">
        {!editing && (
          <button
            ref={arrangeBtn}
            type="button"
            className="desk-btn"
            disabled={!ready}
            onClick={() => {
              // The editor opens; the last "kept" line goes.
              setLayoutSaid("");
              // Opened.
              setEditing(true);
            }}
          >
            <span className="desk-sign" aria-hidden="true">{"✎"}</span> {t("edit.start")}
          </button>
        )}
        <span className="desk-label" id="desk-density-label">{t("density.label")}</span>
        <span className="desk-seg" role="group" aria-labelledby="desk-density-label">
          <button type="button" className="desk-seg-btn" aria-pressed={data.settings.density === "comfortable"} onClick={() => updateSettings({ density: "comfortable" })}>{t("density.comfortable")}</button>
          <button type="button" className="desk-seg-btn" aria-pressed={data.settings.density === "compact"} onClick={() => updateSettings({ density: "compact" })}>{t("density.compact")}</button>
        </span>
      </div>
      {/* After arranging: the layout is kept (it was kept at every change). */}
      <p className="desk-status desk-edit-kept" role="status">{layoutSaid}</p>
      {/* Arranging: the editor in place of the widgets, until Done. */}
      {editing ? (
        <DeskLayoutEditor
          widgets={data.layout.widgets}
          onDone={() => {
            // The notes of notes widgets no longer on the page are emptied now (Undo could bring them back until Done).
            pruneWidgetNotes(new Set(getDeskState().data.layout.widgets.map((x) => x.id)));
            // Focus goes back to the opener once the editor has gone.
            returnFocus.current = true;
            // Said.
            setLayoutSaid(t("edit.finished"));
            // Closed.
            setEditing(false);
          }}
        />
      ) : /* The widgets, in the reader's order: one column on a phone, sizes on a wide screen. */
      widgets.length === 0 ? (
        <p className="desk-empty">
          {t("layout.empty")} <button type="button" className="desk-btn" onClick={resetLayout}>{t("layout.reset")}</button>
        </p>
      ) : (
        <div className="desk-grid">
          {widgets.map((w) => (
            <section key={w.id} className={`desk-w desk-w--${w.size} desk-w--${w.type}`} aria-labelledby={`desk-w-${w.id}`}>
              <h2 className="desk-w-title" id={`desk-w-${w.id}`}>{t(`widgets.${w.type}`)}</h2>
              {ready ? content(w) : <p className="desk-muted">{t("status.loading")}</p>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
