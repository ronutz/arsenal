"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskLayoutEditor.tsx
// ----------------------------------------------------------------------------
// ARRANGING THE DESK (PLAN-personal-desk-20261112, sections 3.5 and 3.9;
// PRIME 12/11/2026 12:42). Using and arranging are separate modes: outside this
// editor nothing on the page can be moved or lost by accident; inside it every
// change is kept at once and can be undone, and "Done" is the only way out
// (Escape says so rather than leaving).
//
// Each widget shows as a frame with its name, one line on what it does, its
// place, and its controls: Earlier, Later, its size (small, medium, wide) and
// Remove. Nothing depends on dragging (WCAG 2.2, 2.5.7: a single pointer
// without dragging; the W3C's note that a keyboard alone does not meet it), so
// every move is a button, and the same moves are keys on a focused frame:
// arrows earlier or later, Home and End first or last, minus and plus the size,
// Delete to remove, Ctrl+Z (or Cmd+Z) to undo. After a move, focus returns to
// the moved widget's same control (or to its frame when that control is now
// disabled); after a removal, to the widget that took its place. The editor's
// bar stays in view while the page scrolls, with Undo, Done and one line that
// says what just happened (a live region, so a screen reader hears each change
// and the entry into the mode). Widgets are added from a list of what the page
// can show, each with its one line; the three starter layouts replace the page
// whole, and that too can be undone. One stored layout serves every width:
// sizes apply on wider screens, a phone shows one column in this order.
// ============================================================================

// React's state, refs, ids and effects.
import { useEffect, useId, useRef, useState } from "react";
// The page's strings.
import { useTranslations } from "next-intl";
// The layout's one write.
import { getDeskState, setLayoutWidgets, DESK_LIMITS, WIDGET_SIZES, type DeskWidget, type WidgetSize } from "@/lib/desk/store";
// The catalogue, the starters and the pure changes.
import {
  addWidget, canAddWidget, moveWidget, removeWidget, resizeWidget, starterWidgets, stepSize, widgetSpec,
  STARTER_IDS, WIDGET_CATALOGUE, type StarterId,
} from "@/lib/desk/layout";

/** One change that can be undone: the widgets as they were, what was said, and where focus goes back to. */
interface UndoEntry {
  /** The list before the change. */
  widgets: DeskWidget[];
  /** The sentence that described the change. */
  msg: string;
  /** The widget to focus after undoing, when it is still there. */
  focus: string | null;
}

/** Where focus goes after the next render: a widget's control, its frame, or the add list. */
interface FocusTarget {
  /** The widget, or null for the add list. */
  id: string | null;
  /** The control's name ("earlier", "later", "small", ...), or "frame". */
  ctl: string;
}

/** How many changes can be undone in one session of arranging. */
const UNDO_DEPTH = 50;

/**
 * Whether a key event comes from a field the reader types in.
 *
 * @param el the event's target
 * @returns true for an input, a text area, a select or editable content
 */
function isTyping(el: EventTarget | null): boolean {
  // Only elements can be fields.
  if (!(el instanceof HTMLElement)) return false;
  // Fields and editable content.
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/**
 * The editor.
 *
 * @param props the stored widgets, and what happens when the reader presses Done
 * @returns the editor's bar and the widgets' frames
 */
export default function DeskLayoutEditor(props: { widgets: DeskWidget[]; onDone: () => void }) {
  // The words.
  const t = useTranslations("desk");
  // A prefix for the controls' ids, so focus can be put back on them.
  const uid = useId();
  // The changes that can be undone, oldest first.
  const [undo, setUndo] = useState<UndoEntry[]>([]);
  // The line that says what just happened (entering the mode first).
  const [said, setSaid] = useState(() => t("edit.entered"));
  // Where focus goes after the next render.
  const focusNext = useRef<FocusTarget | null>(null);
  // The bar's title, focused when the mode opens so the reader starts at its controls.
  const titleRef = useRef<HTMLHeadingElement>(null);
  // The widgets as stored.
  const list = props.widgets;

  // On opening: focus on the bar's title (the live line announces the mode).
  useEffect(() => { titleRef.current?.focus(); }, []);

  // After each render that follows a change: focus where it was asked to go.
  useEffect(() => {
    // Nothing asked.
    const target = focusNext.current;
    // Nothing to do.
    if (!target) return;
    // Asked once.
    focusNext.current = null;
    // The control, then the frame, then the add list.
    const ctl = target.id ? document.getElementById(`${uid}-${target.id}-${target.ctl}`) : null;
    // A control that can take focus.
    if (ctl instanceof HTMLButtonElement && !ctl.disabled) { ctl.focus(); return; }
    // The widget's frame.
    const frame = target.id ? document.getElementById(`${uid}-${target.id}-frame`) : null;
    // Focused when there.
    if (frame) { frame.focus(); return; }
    // Otherwise the add list.
    document.getElementById(`${uid}-add`)?.focus();
  }, [list, uid]);

  /**
   * A widget's name in the page's language.
   *
   * @param w the widget
   * @returns its name, or the words for a widget this page cannot show
   */
  const nameOf = (w: Pick<DeskWidget, "type">) => (widgetSpec(w.type) ? t(`widgets.${w.type}`) : t("edit.unknown"));

  /**
   * A size's word.
   *
   * @param s the size
   * @returns the word
   */
  const sizeWord = (s: WidgetSize) => t(`edit.sizes.${s}`);

  /**
   * Keep a change: the list written, the old one kept for Undo, the change said, and focus sent where it belongs.
   *
   * @param next the new list
   * @param msg what happened, in words
   * @param focus where focus goes now
   * @param undoFocus the widget to focus if this change is undone
   */
  const apply = (next: DeskWidget[], msg: string, focus: FocusTarget, undoFocus: string | null) => {
    // The old list kept, the oldest dropped past the depth.
    setUndo((u) => [...u.slice(-(UNDO_DEPTH - 1)), { widgets: list.map((w) => ({ ...w, settings: { ...w.settings } })), msg, focus: undoFocus }]);
    // Written (the store raises the layout's revision, so the change wins a sync).
    setLayoutWidgets(next);
    // Said.
    setSaid(msg);
    // Focus after the render.
    focusNext.current = focus;
  };

  /**
   * Move a widget to a place.
   *
   * @param w the widget
   * @param to the new place
   * @param ctl the control that asked, so focus returns to it
   */
  const move = (w: DeskWidget, to: number, ctl: string) => {
    // The new order, or nothing when it would not move.
    const next = moveWidget(list, w.id, to);
    // Not moved.
    if (!next) return;
    // Its new place, counted from one.
    const n = next.findIndex((x) => x.id === w.id) + 1;
    // Kept, said, focused.
    apply(next, t("edit.moved", { name: nameOf(w), n, total: next.length }), { id: w.id, ctl }, w.id);
  };

  /**
   * Change a widget's size.
   *
   * @param w the widget
   * @param size the new size
   * @param ctl the control that asked
   */
  const resize = (w: DeskWidget, size: WidgetSize, ctl: string) => {
    // The new list, or nothing when unchanged.
    const next = resizeWidget(list, w.id, size);
    // Unchanged.
    if (!next) return;
    // Kept, said, focused.
    apply(next, t("edit.resized", { name: nameOf(w), size: sizeWord(size) }), { id: w.id, ctl }, w.id);
  };

  /**
   * Remove a widget; focus goes to the widget that takes its place.
   *
   * @param w the widget
   */
  const remove = (w: DeskWidget) => {
    // The new list and the place it had.
    const r = removeWidget(list, w.id);
    // Not there.
    if (!r) return;
    // The widget now in its place, or the one before it, or none.
    const after = r.list[r.index] ?? r.list[r.index - 1] ?? null;
    // A notes widget with text: its note goes when arranging ends, and the line says so.
    const hasNote = w.type === "notes" && !!getDeskState().data.notes[`widget:${w.id}`]?.text;
    // Kept, said, focused.
    apply(r.list, hasNote ? `${t("edit.removed", { name: nameOf(w) })} ${t("edit.removedNote")}` : t("edit.removed", { name: nameOf(w) }), { id: after?.id ?? null, ctl: "frame" }, w.id);
  };

  /**
   * Add a widget at the end; focus goes to its frame.
   *
   * @param type its type
   */
  const add = (type: string) => {
    // The new list and id, or nothing at the limit.
    const r = addWidget(list, type);
    // Refused.
    if (!r) { setSaid(list.length >= DESK_LIMITS.widgets ? t("edit.full", { max: DESK_LIMITS.widgets }) : t("edit.onPageAlready", { name: nameOf({ type }) })); return; }
    // Kept, said, focused (undoing it sends focus to the add list).
    apply(r.list, t("edit.added", { name: nameOf({ type }) }), { id: r.id, ctl: "frame" }, null);
  };

  /**
   * Replace the page with a starter layout.
   *
   * @param id the starter
   */
  const applyStarter = (id: StarterId) => {
    // The starter's widgets.
    const next = starterWidgets(id);
    // Kept, said; focus on the first widget.
    apply(next, t("edit.starterApplied", { name: t(`starters.${id}.name`) }), { id: next[0]?.id ?? null, ctl: "frame" }, null);
  };

  /** Undo the last change. */
  const undoLast = () => {
    // The last change.
    const last = undo[undo.length - 1];
    // Nothing to undo.
    if (!last) { setSaid(t("edit.nothingToUndo")); return; }
    // Dropped from the list.
    setUndo((u) => u.slice(0, -1));
    // The old list written back.
    setLayoutWidgets(last.widgets);
    // Said.
    setSaid(t("edit.undone", { what: last.msg }));
    // Focus on the widget it concerned, when it is there again.
    focusNext.current = { id: last.focus, ctl: "frame" };
  };

  /**
   * The keys of a focused frame.
   *
   * @param e the key event
   * @param w the frame's widget
   * @param i its place
   */
  const onFrameKey = (e: React.KeyboardEvent<HTMLElement>, w: DeskWidget, i: number) => {
    // Only on the frame itself, not on a control inside it.
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    // The key's action.
    let act: (() => void) | null = null;
    // Earlier.
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") act = () => move(w, i - 1, "frame");
    // Later.
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") act = () => move(w, i + 1, "frame");
    // First.
    else if (e.key === "Home") act = () => move(w, 0, "frame");
    // Last.
    else if (e.key === "End") act = () => move(w, list.length - 1, "frame");
    // Smaller.
    else if (e.key === "-" || e.key === "_") act = () => resize(w, stepSize(w.size, -1), "frame");
    // Larger.
    else if (e.key === "+" || e.key === "=") act = () => resize(w, stepSize(w.size, 1), "frame");
    // Removed.
    else if (e.key === "Delete" || e.key === "Backspace") act = () => remove(w);
    // Not one of the editor's keys: left to the page.
    if (!act) return;
    // The editor's key: not scrolled, not passed on to the site's shortcuts.
    e.preventDefault();
    // Not passed on.
    e.stopPropagation();
    // Done.
    act();
  };

  /**
   * The editor's own keys anywhere inside it: Undo, and Escape saying how to leave.
   *
   * @param e the key event
   */
  const onEditorKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Not while typing in a field.
    if (isTyping(e.target)) return;
    // Ctrl+Z or Cmd+Z: undo.
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
      // Not the browser's own undo.
      e.preventDefault();
      // Undone.
      undoLast();
      // Done.
      return;
    }
    // Escape: Done is the way out, and the line says so.
    if (e.key === "Escape") setSaid(t("edit.escape"));
  };

  // The editor.
  return (
    <div className="desk-edit" onKeyDown={onEditorKey}>
      {/* The bar: what this mode is, Undo, Done, and the line that says each change. Stays in view while scrolling. */}
      <div className="desk-edit-bar" role="region" aria-labelledby={`${uid}-title`}>
        <div className="desk-edit-bar-row">
          <h2 className="desk-edit-title" id={`${uid}-title`} ref={titleRef} tabIndex={-1}>
            <span className="desk-sign" aria-hidden="true">{"✎"}</span> {t("edit.title")}
          </h2>
          <span className="desk-edit-actions">
            <button type="button" className="desk-btn" disabled={undo.length === 0} onClick={undoLast}>
              <span className="desk-sign" aria-hidden="true">{"↶"}</span> {t("edit.undo")}
            </button>
            <button type="button" className="desk-btn desk-btn--primary" onClick={props.onDone}>
              <span className="desk-sign" aria-hidden="true">{"✓"}</span> {t("edit.done")}
            </button>
          </span>
        </div>
        <p className="desk-edit-said" role="status" aria-live="polite">{said}</p>
      </div>
      <p className="desk-note">{t("edit.help")}</p>
      <p className="desk-muted" id={`${uid}-keys`}>{t("edit.keys")}</p>
      {/* The widgets as frames, in the stored order, at their stored sizes. */}
      {list.length === 0 ? (
        <p className="desk-empty">{t("edit.none")}</p>
      ) : (
        <ol className="desk-grid desk-edit-grid">
          {list.map((w, i) => {
            // Its name.
            const name = nameOf(w);
            // Drawn by this page.
            const known = !!widgetSpec(w.type);
            // Its frame.
            return (
              <li
                key={w.id}
                id={`${uid}-${w.id}-frame`}
                className={`desk-w desk-w--${w.size} desk-w--edit`}
                tabIndex={0}
                aria-labelledby={`${uid}-${w.id}-name`}
                aria-describedby={`${uid}-${w.id}-where ${uid}-keys`}
                onKeyDown={(e) => onFrameKey(e, w, i)}
              >
                <p className="desk-w-title" id={`${uid}-${w.id}-name`}>{name}</p>
                <p className="desk-edit-where" id={`${uid}-${w.id}-where`}>
                  <span className="desk-chip mono">{t("edit.position", { n: i + 1, total: list.length })}</span>{" "}
                  <span className="desk-chip">{sizeWord(w.size)}</span>
                </p>
                <p className="desk-muted">{known ? t(`widgetInfo.${w.type}`) : t("edit.unknownInfo")}</p>
                {/* Its controls: buttons for every move, never dragging. */}
                <div className="desk-edit-controls" role="group" aria-label={t("edit.controlsLabel", { name })}>
                  <button type="button" id={`${uid}-${w.id}-earlier`} className="desk-btn" disabled={i === 0} aria-label={t("edit.earlierLabel", { name })} onClick={() => move(w, i - 1, "earlier")}>
                    <span className="desk-sign" aria-hidden="true">{"↑"}</span> {t("edit.earlier")}
                  </button>
                  <button type="button" id={`${uid}-${w.id}-later`} className="desk-btn" disabled={i === list.length - 1} aria-label={t("edit.laterLabel", { name })} onClick={() => move(w, i + 1, "later")}>
                    <span className="desk-sign" aria-hidden="true">{"↓"}</span> {t("edit.later")}
                  </button>
                  {known && (
                    <span className="desk-seg" role="group" aria-label={t("edit.sizeLabel", { name })}>
                      {WIDGET_SIZES.map((s) => (
                        <button key={s} type="button" id={`${uid}-${w.id}-${s}`} className="desk-seg-btn" aria-pressed={w.size === s} onClick={() => resize(w, s, s)}>
                          {sizeWord(s)}
                        </button>
                      ))}
                    </span>
                  )}
                  <button type="button" className="desk-btn desk-btn--quiet" aria-label={t("edit.removeLabel", { name })} onClick={() => remove(w)}>
                    <span className="desk-sign" aria-hidden="true">{"×"}</span> {t("edit.remove")}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {/* Adding: every widget the page can show, each with its line; one held once says it is on the page. */}
      <details className="desk-adopt desk-edit-add">
        <summary id={`${uid}-add`}>{t("edit.add")}</summary>
        <ul className="desk-list desk-edit-catalogue">
          {WIDGET_CATALOGUE.map((s) => {
            // Whether it can be added now.
            const can = canAddWidget(list, s.type);
            // Held once and already on the page.
            const there = !s.multi && list.some((w) => w.type === s.type);
            // One entry.
            return (
              <li key={s.type} className="desk-edit-cat-row">
                <span className="desk-edit-cat-text">
                  <span className="desk-edit-cat-name">{t(`widgets.${s.type}`)}</span>
                  <span className="desk-muted">{t(`widgetInfo.${s.type}`)}</span>
                </span>
                {there ? (
                  <span className="desk-chip"><span aria-hidden="true">{"✓"}</span> {t("edit.onPage")}</span>
                ) : (
                  <button type="button" className="desk-btn" disabled={!can} aria-label={t("edit.addLabel", { name: t(`widgets.${s.type}`) })} onClick={() => add(s.type)}>
                    <span className="desk-sign" aria-hidden="true">+</span> {t("edit.addDo")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {list.length >= DESK_LIMITS.widgets && <p className="desk-note">{t("edit.full", { max: DESK_LIMITS.widgets })}</p>}
      </details>
      {/* The starter layouts: each replaces the page whole; Undo brings the old one back. */}
      <details className="desk-adopt desk-edit-add">
        <summary>{t("edit.starters")}</summary>
        <p className="desk-note">{t("edit.startersNote")}</p>
        <ul className="desk-list desk-edit-catalogue">
          {STARTER_IDS.map((id) => (
            <li key={id} className="desk-edit-cat-row">
              <span className="desk-edit-cat-text">
                <span className="desk-edit-cat-name">{t(`starters.${id}.name`)}</span>
                <span className="desk-muted">{t(`starters.${id}.body`)}</span>
              </span>
              <button type="button" className="desk-btn" aria-label={t("edit.starterUseLabel", { name: t(`starters.${id}.name`) })} onClick={() => applyStarter(id)}>
                {t("edit.starterUse")}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
