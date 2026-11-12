"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskItemControls.tsx
// ----------------------------------------------------------------------------
// SAVE, MARK AS READ, ADD TO PATH: the desk's controls on every item page
// (tools, Learn articles, glossary entries, games), beside the page's Share
// (PRIME 12/11/2026 12:42; PLAN-personal-desk-20261112, sections 3.2 to 3.4).
//
// - Save keeps the item among the reader's favourites; the first save asks the
//   browser, once, to keep the site's storage, and sends the one "save" interest
//   count, only under the reader's existing yes (src/lib/desk/store.ts).
// - Mark as read (Mark as done for a tool or a game) sets or clears the mark by
//   hand. On an article or an entry, reaching its end (the data-interest-end
//   mark) after twenty seconds on the page sets it, with a one-tap Undo; the
//   reader can turn that off on the Settings page.
// - Add to path opens the shared panel (DeskAddMenu).
// - "Kept in this browser" is said here, at the point of use, with a link to
//   My desk; when the browser refuses storage, the controls say that this lasts
//   only while the page is open.
// - The keyboard: the site's shortcut layer (src/config/shortcuts.ts) sends
//   "save" and "read" commands; the page's main controls answer them, and every
//   change made by a key is confirmed in words with an Undo.
// Every state is said in words and a sign (a star, a tick), never by colour
// alone. Nothing here sends anything except through the store's one count.
// A milestone reached by a read mark made here (10 items read, a path
// finished, a week's run: the site owner, 12/11/2026 15:22) is said once, in
// the same quiet confirmation, in words with a sign; no sound, no animation
// when the reader asked for reduced motion.
// ============================================================================

// React's state, refs, effects and callbacks.
import { useCallback, useEffect, useRef, useState } from "react";
// The page's strings.
import { useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk's verbs.
import { markRead, markUnread, restoreRead, saveItem, unsaveItem, getDeskState, takeUnseenMilestones } from "@/lib/desk/store";
// The desk in a component.
import { useDesk } from "@/lib/desk/useDesk";
// The automatic sync, loaded only when this browser syncs.
import { useAutoSync } from "@/lib/desk/autoSync";
// Identifiers and the kinds whose mark reads "done".
import { DONE_KINDS, splitItemId, type ItemId } from "@/lib/desk/ids";
// The shared "Add to a path" panel and its words.
import DeskAddMenu from "./DeskAddMenu";
import { menuLabels } from "./menuLabels";

/** The window event the shortcut layer sends: detail "save" or "read". */
export const DESK_COMMAND_EVENT = "ronutz:desk-command";

/** How long a page must have been open before reaching its end counts as reading it (as the interest counts). */
const MIN_READ_MS = 20000;

/** How long the confirmation stays before it goes by itself. */
const TOAST_MS = 12000;

/** A confirmation: what happened, and how to undo it. */
interface Toast {
  /** The sentence. */
  msg: string;
  /** The undo, when there is one. */
  undo?: () => void;
  /** A milestone reached, in words, said with the confirmation. */
  milestone?: string;
}

/**
 * The controls.
 *
 * @param props the item; whether reaching the page's end marks it read; whether this is the page's main item (keys)
 * @returns the row of controls
 */
export default function DeskItemControls(props: { item: ItemId; endRead?: boolean; primary?: boolean }) {
  // The words.
  const t = useTranslations("deskItem");
  // The desk.
  const { data, status, ready } = useDesk();
  // Changes made here reach the sync when this browser syncs.
  useAutoSync();
  // Whether the panel is open.
  const [menu, setMenu] = useState(false);
  // The confirmation shown, if any.
  const [toast, setToast] = useState<Toast | null>(null);
  // A message for the save limit.
  const [note, setNote] = useState("");
  // The toast's timer.
  const timer = useRef<number | null>(null);
  // The Add to path button, to give focus back when the panel closes.
  const addBtn = useRef<HTMLButtonElement>(null);
  // The row, to close the panel on a click outside it.
  const root = useRef<HTMLDivElement>(null);
  // The item's kind decides "read" or "done".
  const done = DONE_KINDS.includes(splitItemId(props.item).kind);
  // Saved and read, as stored.
  const saved = props.item in data.saved;
  // Read.
  const read = props.item in data.read;

  /**
   * Show a confirmation for a while.
   *
   * @param next the confirmation
   */
  const show = useCallback((next: Toast) => {
    // A previous one's timer cleared.
    if (timer.current !== null) window.clearTimeout(timer.current);
    // Shown.
    setToast(next);
    // Gone by itself later (the same change can always be made again with the buttons).
    timer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  // The timer cleared when the page is left.
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  /**
   * The milestones a read mark just reached, taken (so each is celebrated once) and named.
   *
   * @returns the sentence, or undefined when none
   */
  const milestoneLine = useCallback((): string | undefined => {
    // Taken and marked shown.
    const ids = takeUnseenMilestones();
    // Named, in the page's language.
    return ids.length > 0 ? t("milestoneToast", { names: ids.map((id) => t(`milestones.${id}`)).join(", ") }) : undefined;
  }, [t]);

  /** Save or unsave, and say so when it came from a key. */
  const toggleSave = useCallback((fromKey: boolean) => {
    // The current state, read at the moment of the action.
    const was = props.item in getDeskState().data.saved;
    // Unsave.
    if (was) {
      // Removed.
      unsaveItem(props.item);
      // Said, with undo.
      if (fromKey) show({ msg: t("keyUnsaved"), undo: () => saveItem(props.item) });
      // Done.
      return;
    }
    // Save.
    const r = saveItem(props.item);
    // The limit.
    if (r === "limit") { setNote(t("menu.limitSaved")); if (fromKey) show({ msg: t("menu.limitSaved") }); return; }
    // Said, with undo, when it came from a key.
    if (fromKey) show({ msg: t("keySaved"), undo: () => unsaveItem(props.item) });
  }, [props.item, show, t]);

  /** Mark or unmark, and say so when it came from a key. */
  const toggleRead = useCallback((fromKey: boolean) => {
    // The mark's day, read at the moment of the action (kept for undo).
    const day = getDeskState().data.read[props.item];
    // Unmark.
    if (day) {
      // Taken off.
      markUnread(props.item);
      // Said, with undo that puts the same day back.
      if (fromKey) show({ msg: done ? t("keyUndone") : t("keyUnread"), undo: () => restoreRead(props.item, day) });
      // Done.
      return;
    }
    // Marked.
    markRead(props.item);
    // A milestone it reached, said once.
    const milestone = milestoneLine();
    // Said, with undo (and the milestone), when it came from a key or reached a milestone.
    if (fromKey || milestone) show({ msg: done ? t("keyDone") : t("keyRead"), undo: () => restoreRead(props.item, null), milestone });
  }, [props.item, done, show, t, milestoneLine]);

  // The keyboard: the shortcut layer's commands, answered by the page's main controls only.
  useEffect(() => {
    // Not the page's main item.
    if (props.primary === false) return;
    // One command.
    const onCommand = (e: Event) => {
      // Which.
      const what = (e as CustomEvent<string>).detail;
      // Save or read.
      if (what === "save") toggleSave(true);
      else if (what === "read") toggleRead(true);
    };
    // Listening.
    window.addEventListener(DESK_COMMAND_EVENT, onCommand);
    // Stopped.
    return () => window.removeEventListener(DESK_COMMAND_EVENT, onCommand);
  }, [props.primary, toggleSave, toggleRead]);

  // Reaching the end of an article or an entry marks it read, once per page view, with an Undo.
  const autoRead = ready && props.endRead === true && data.settings.autoRead;
  // The page view's start.
  const start = useRef(0);
  // Set once.
  useEffect(() => { start.current = performance.now(); }, []);
  // Watching the end mark.
  useEffect(() => {
    // Off, or no observer in this browser.
    if (!autoRead || typeof IntersectionObserver === "undefined") return;
    // The page's end mark.
    const end = document.querySelector("[data-interest-end]");
    // None on this page.
    if (!end) return;
    // The pending timer.
    let wait: number | null = null;
    // Watched once.
    const io = new IntersectionObserver((entries) => {
      // Only when it comes into view.
      if (!entries.some((x) => x.isIntersecting)) return;
      // Watched no more.
      io.disconnect();
      // After twenty seconds on the page at least.
      const ms = Math.max(0, MIN_READ_MS - (performance.now() - start.current));
      // Then, if the reader is still here, looking, and it is not marked yet: marked, with an Undo.
      wait = window.setTimeout(() => {
        // Left, hidden, or already marked.
        if (!end.isConnected || document.visibilityState !== "visible" || props.item in getDeskState().data.read) return;
        // Marked.
        if (markRead(props.item)) show({ msg: t("autoRead"), undo: () => restoreRead(props.item, null), milestone: milestoneLine() });
      }, ms);
    });
    // Observed.
    io.observe(end);
    // Stopped when the page is left.
    return () => { io.disconnect(); if (wait !== null) window.clearTimeout(wait); };
  }, [autoRead, props.item, show, t, milestoneLine]);

  // A click outside the row closes the panel.
  useEffect(() => {
    // Only while open.
    if (!menu) return;
    // Outside.
    const onDown = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setMenu(false); };
    // Listening.
    document.addEventListener("mousedown", onDown);
    // Stopped.
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu]);

  // The row.
  return (
    <div className="desk-controls" ref={root} data-pagefind-ignore>
      <div className="desk-controls-row">
        {/* Save: a star, empty or filled, and the word. */}
        <button type="button" className="desk-btn" aria-pressed={saved} onClick={() => toggleSave(false)}>
          <span className="desk-sign" aria-hidden="true">{saved ? "★" : "☆"}</span> {saved ? t("saved") : t("save")}
        </button>
        {/* Read (or done): a ring, empty or ticked, and the word. */}
        <button type="button" className="desk-btn" aria-pressed={read} onClick={() => toggleRead(false)}>
          <span className="desk-sign" aria-hidden="true">{read ? "✓" : "○"}</span> {read ? (done ? t("doneOn") : t("readOn")) : done ? t("done") : t("read")}
        </button>
        {/* Add to path: opens the panel. */}
        <span className="desk-menu-wrap">
          <button ref={addBtn} type="button" className="desk-btn" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
            <span className="desk-sign" aria-hidden="true">+</span> {t("path")}
          </button>
          {menu && (
            <DeskAddMenu
              id={props.item}
              labels={menuLabels((k, v) => t(`menu.${k}`, v))}
              onClose={() => { setMenu(false); addBtn.current?.focus(); }}
            />
          )}
        </span>
      </div>
      {/* Where this is kept, at the point of use; or, when the browser refuses storage, how long it lasts. */}
      <p className="desk-controls-note">
        {status === "unavailable" ? t("storageOff") : t("kept")} · <Link href="/desk" className="desk-link">{t("open")}</Link>
        {note && <> · <span role="status">{note}</span></>}
      </p>
      {/* The confirmation of a change made by a key or by reaching the end, with its Undo. */}
      {toast && (
        <div className="desk-toast" role="status">
          <span className="desk-toast-msg">
            {toast.msg}
            {/* A milestone: its own line, a sign and the words. */}
            {toast.milestone && <span className="desk-toast-milestone"><span aria-hidden="true">{"✦"}</span> {toast.milestone}</span>}
          </span>
          {toast.undo && (
            <button
              type="button"
              className="desk-btn"
              onClick={() => {
                // Undone.
                toast.undo?.();
                // Closed.
                setToast(null);
              }}
            >
              {t("undo")}
            </button>
          )}
          <button type="button" className="desk-toast-close" aria-label={t("dismiss")} onClick={() => setToast(null)}>
            <span aria-hidden="true">{"×"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
