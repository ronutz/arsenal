"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskNotes.tsx
// ----------------------------------------------------------------------------
// THE NOTES WIDGET (PLAN-personal-desk-20261112, section 3.6, "Notes (free
// text, local, and therefore excluded from any sync by default)"). A few lines
// of the reader's own, as many notes widgets as the reader adds, each keeping
// its text in the desk under "widget:<the widget's id>" (src/lib/desk/store.ts,
// setNote). Kept in this browser; a note goes to the reader's other browsers
// only when "Include notes" is ticked in Settings (inside the encrypted copy),
// and the widget says which of the two is the case, in words, beside the box.
// The text is kept as it is typed (a short pause, or leaving the box, writes
// it); a change from another tab shows when the box is not being typed in.
// Emptying the box empties the note. A desk keeps 50 notes of 4,000
// characters; the count is shown, and a note refused at the limit says so.
// ============================================================================

// React's state, refs, ids and effects.
import { useEffect, useId, useRef, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// The desk's verbs and limits.
import { getDeskState, setNote, DESK_LIMITS, type DeskData } from "@/lib/desk/store";

/** How long after the last keystroke the note is written. */
const WRITE_DELAY_MS = 600;

/**
 * The id of a notes widget's note.
 *
 * @param widgetId the widget's id
 * @returns the note's id in the desk
 */
export function widgetNoteId(widgetId: string): string {
  // The widget's id under a fixed prefix (the store's note ids allow lower case, digits, ":" and "-").
  return `widget:${widgetId}`;
}

/**
 * The widget.
 *
 * @param props the desk and the widget's id
 * @returns the widget's content
 */
export default function DeskNotes(props: { data: DeskData; widgetId: string }) {
  // The words.
  const t = useTranslations("desk");
  // The page's language, for the count.
  const locale = useLocale();
  // The field's id.
  const uid = useId();
  // The note's id.
  const noteId = widgetNoteId(props.widgetId);
  // The stored text.
  const stored = props.data.notes[noteId]?.text ?? "";
  // What is in the box.
  const [text, setText] = useState(stored);
  // Whether the box is being typed in (a change from another tab waits until it is not).
  const [focused, setFocused] = useState(false);
  // A refusal at the limit, in words.
  const [full, setFull] = useState(false);
  // The pending write.
  const timer = useRef<number | null>(null);
  // The latest text typed, for a write still pending when the widget goes.
  const latest = useRef(stored);

  // A change made elsewhere (another tab, a sync) shows when the reader is not typing.
  useEffect(() => { if (!focused && timer.current === null) setText(stored); }, [stored, focused]);

  // A pending write is made when the widget goes (the page is left, or arranging begins).
  useEffect(() => () => {
    // Nothing pending.
    if (timer.current === null) return;
    // The timer stopped.
    window.clearTimeout(timer.current);
    // No longer pending.
    timer.current = null;
    // Written now.
    setNote(noteId, latest.current);
  }, [noteId]);

  /**
   * Write the text now.
   *
   * @param value the text
   */
  const write = (value: string) => {
    // No longer pending.
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
    // Written (empty empties the note).
    setNote(noteId, value);
    // Refused at the limit: a new note that did not get in.
    setFull(value !== "" && !(noteId in getDeskState().data.notes));
  };

  // Whether notes travel with this browser's sync.
  const travels = props.data.sync?.includeNotes === true;
  // The count, in the page's language.
  const fmt = new Intl.NumberFormat(locale);
  // The widget.
  return (
    <div className="desk-notes">
      <label className="desk-visually-hidden" htmlFor={`${uid}-note`}>{t("notes.label")}</label>
      <textarea
        id={`${uid}-note`}
        className="desk-input desk-notes-box"
        rows={5}
        value={text}
        maxLength={DESK_LIMITS.noteLength}
        placeholder={t("notes.placeholder")}
        aria-describedby={`${uid}-kept ${uid}-count`}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); write(text); }}
        onChange={(e) => {
          // The new text.
          const v = e.target.value;
          // Shown.
          setText(v);
          // Remembered for a write on leaving.
          latest.current = v;
          // Written after a short pause.
          if (timer.current !== null) window.clearTimeout(timer.current);
          // The pause.
          timer.current = window.setTimeout(() => write(v), WRITE_DELAY_MS);
        }}
      />
      <p className="desk-notes-foot">
        <span className="desk-muted" id={`${uid}-kept`}>
          <span aria-hidden="true">{travels ? "⇄" : "⌂"}</span> {travels ? t("notes.synced") : t("notes.kept")}
        </span>
        <span className="desk-muted mono" id={`${uid}-count`}>{t("notes.count", { count: fmt.format(text.length), max: fmt.format(DESK_LIMITS.noteLength) })}</span>
      </p>
      {full && <p className="desk-alert" role="status"><span aria-hidden="true">{"⚠"}</span> {t("notes.full", { max: DESK_LIMITS.notes })}</p>}
    </div>
  );
}
