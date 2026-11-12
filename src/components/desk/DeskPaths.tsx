"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskPaths.tsx
// ----------------------------------------------------------------------------
// MY PATHS (PLAN-personal-desk-20261112, phase 2, sections 3.3 and 3.9): the
// reader's own reading paths on the desk page.
//
// Each path shows its progress as "7 of 12 read" with a single-hue bar on the
// same scale for every path, so two paths compare by eye (never a gauge, no
// traffic-light colours), and how many of its items changed after they were
// read. Opening a path shows its items in order, each with its read mark as a
// button, "Updated since you read it" where the index says so, and "No longer
// on the site" for an item that is gone. The reader can create a path, rename
// it, move it and its items up and down with buttons (never by dragging: WCAG
// 2.2, 2.5.7), remove an item or delete the path with an Undo, add an item or
// a whole series through the picker, and adopt a series, a training series or
// a reading path, either following it (new parts appear; the list cannot be
// edited until it is made the reader's own copy) or as a copy from the start.
// Limits are said in words: 20 paths, 300 items each.
// ============================================================================

// React's state and ids.
import { useEffect, useId, useMemo, useState } from "react";
// The page's strings.
import { useTranslations } from "next-intl";
// The desk's verbs and limits.
import {
  addToPath, createPath, deletePath, freezePath, insertIntoPath, markRead, markUnread, moveInPath, movePath, pathProgress,
  removeFromPath, renamePath, restorePath, DESK_LIMITS, type DeletedPath, type DeskData, type DeskPath,
} from "@/lib/desk/store";
// Identifiers.
import { COLLECTION_KINDS, type ItemId, type ItemKind } from "@/lib/desk/ids";
// The index.
import { lookup, updatedSince, type SiteIndex } from "@/lib/desk/siteIndex";
// One item as the desk shows it.
import DeskItemRow, { titleOf } from "./DeskItemRow";
// The add picker.
import DeskItemPicker from "./DeskItemPicker";

/** An undoable change: what to say, and how to undo it. */
interface Undo {
  /** The sentence. */
  msg: string;
  /** The undo. */
  run: () => void;
}

/** The collections suggested as examples on an empty desk, when the index has them. */
const EXAMPLE_COLLECTIONS: readonly ItemId[] = ["training:netfun-1", "series:traffic-diversion"];

/**
 * A progress line: words, then a bar in one hue on the same scale for every path.
 *
 * @param props done, total and the words
 * @returns the line
 */
export function ProgressLine(props: { done: number; total: number; text: string }) {
  // Percentage, rounded.
  const pct = props.total ? Math.round((props.done / props.total) * 100) : 0;
  // Words first, then the bar (hidden from assistive technology: the words carry it).
  return (
    <span className="desk-progress">
      <span className="desk-progress-text mono">{props.text}</span>
      <span className="desk-bar" aria-hidden="true">
        <span className="desk-bar-fill" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

/**
 * The paths widget.
 *
 * @param props the desk, the index, and whether the desk is still empty (examples shown)
 * @returns the widget's content
 */
export default function DeskPaths(props: { data: DeskData; index: SiteIndex | null; empty: boolean }) {
  // The words.
  const t = useTranslations("desk");
  // The open path's id.
  const [open, setOpen] = useState<string | null>(null);
  // The new path's name.
  const [name, setName] = useState("");
  // What just happened, with its undo when there is one.
  const [undo, setUndo] = useState<Undo | null>(null);
  // A message without undo (a limit, a refusal).
  const [msg, setMsg] = useState("");
  // The adoption picker's choice.
  const [adoptId, setAdoptId] = useState<string>("");
  // Live or a copy.
  const [adoptMode, setAdoptMode] = useState<"live" | "frozen">("live");
  // Ids for labels.
  const uid = useId();
  // The paths.
  const { paths, read } = props.data;

  // A link to one path (/desk#path=<id>, from "Continue this path" on an item page): that path opened, brought into
  // view and given focus, once, when the widget first appears.
  useEffect(() => {
    // The id in the address, in the store's form.
    const m = /^#path=([a-z0-9]{4,24})$/.exec(window.location.hash);
    // No such link, or no such path on this desk.
    if (!m || !paths.some((p) => p.id === m[1])) return;
    // Opened.
    setOpen(m[1]);
    // After the open path is drawn: shown at the top of the screen, focus on its name.
    window.requestAnimationFrame(() => {
      // Its row.
      const row = document.getElementById(`desk-path-${m[1]}`);
      // Into view.
      row?.scrollIntoView({ block: "start" });
      // Focus on its name, without a second scroll.
      row?.querySelector<HTMLButtonElement>(".desk-path-name")?.focus({ preventScroll: true });
    });
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The collections a reader can adopt, sorted by title (only once the index is in).
  const collections = useMemo(
    () => (props.index ? props.index.items.filter((it) => COLLECTION_KINDS.includes(it.k)).sort((a, b) => a.t.localeCompare(b.t)) : []),
    [props.index],
  );

  /**
   * A path's name as shown: what the reader typed, or its collection's title, or "Untitled path".
   *
   * @param p the path
   * @returns the name
   */
  const nameOf = (p: DeskPath) => p.name || (p.from ? titleOf(props.index, p.from.id) : null) || t("paths.untitled");

  /**
   * The kind's name.
   *
   * @param k the kind
   * @returns its label
   */
  const kindName = (k: ItemKind) => t(`kinds.${k}`);

  /** Make a path from the typed name. */
  const create = () => {
    // Made.
    const r = createPath(name);
    // Said.
    if (!r.ok) { setMsg(t("paths.tooMany", { max: DESK_LIMITS.paths })); return; }
    // Opened, the field emptied.
    setOpen(r.id);
    // Emptied.
    setName("");
    // No message.
    setMsg("");
  };

  /**
   * Adopt a collection as a path.
   *
   * @param id the collection
   * @param mode live or a copy
   */
  const adopt = (id: ItemId, mode: "live" | "frozen") => {
    // Its members from the index.
    const members = props.index?.byId.get(id)?.m ?? [];
    // Made, with an empty name (the collection's title is shown).
    const r = createPath("", members, { id, mode });
    // Said.
    setMsg(r.ok ? t("paths.adopted", { name: titleOf(props.index, id) ?? "" }) : t("paths.tooMany", { max: DESK_LIMITS.paths }));
    // Opened.
    if (r.ok) setOpen(r.id);
  };

  /**
   * Add items to a path and say what happened.
   *
   * @param p the path
   * @param ids the items
   */
  const addItems = (p: DeskPath, ids: ItemId[]) => {
    // Added.
    const r = addToPath(p.id, ids);
    // Said.
    if (!r.ok) setMsg(t("paths.liveNote", { name: nameOf(p) }));
    else if (r.cut > 0) setMsg(t("paths.full", { name: nameOf(p), max: DESK_LIMITS.pathItems }));
    else setMsg(t("paths.addedCount", { count: r.added }));
  };

  /**
   * Delete a path, with undo.
   *
   * @param p the path
   */
  const remove = (p: DeskPath) => {
    // Deleted.
    const del: DeletedPath | null = deletePath(p.id);
    // Not there.
    if (!del) return;
    // Closed.
    setOpen(null);
    // Said, with undo.
    setUndo({ msg: t("paths.deleted", { name: nameOf(p) }), run: () => restorePath(del) });
  };

  // The widget.
  return (
    <div className="desk-paths">
      {/* The paths, or the invitation with examples. */}
      {paths.length === 0 ? (
        <div className="desk-empty">
          <p>{t("paths.empty")}</p>
          {/* Examples, plainly marked as such, each adoptable in one tap. */}
          {props.empty && props.index && (
            <ul className="desk-list">
              {EXAMPLE_COLLECTIONS.filter((id) => props.index?.byId.has(id)).map((id) => (
                <li key={id} className="desk-row">
                  <span className="desk-chip desk-chip--example">{t("example")}</span>
                  <DeskItemRow id={id} index={props.index} showKind />
                  <button type="button" className="desk-btn" onClick={() => adopt(id, "live")}>
                    <span className="desk-sign" aria-hidden="true">+</span> {t("paths.adoptShort")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <ol className="desk-list desk-path-list">
          {paths.map((p, pi) => {
            // Progress, derived from the read marks.
            const prog = pathProgress(p, read);
            // Items changed since read.
            const changed = props.index ? p.items.filter((i) => i in read && updatedSince(lookup(props.index as SiteIndex, i)?.item, read[i])).length : 0;
            // Open.
            const isOpen = open === p.id;
            // Its name.
            const display = nameOf(p);
            // The row and, when open, its editor.
            return (
              <li key={p.id} id={`desk-path-${p.id}`} className="desk-path">
                <div className="desk-path-head">
                  <button type="button" className="desk-path-name" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.id)}>
                    <span className="desk-sign" aria-hidden="true">{isOpen ? "▾" : "▸"}</span> {display}
                  </button>
                  {/* A path that follows its collection says so. */}
                  {p.from?.mode === "live" && (
                    <span className="desk-chip">
                      <span aria-hidden="true">{"⟳"}</span> {t("paths.follows")}
                    </span>
                  )}
                  {changed > 0 && (
                    <span className="desk-chip desk-chip--updated">
                      <span aria-hidden="true">{"↻"}</span> {t("paths.changed", { count: changed })}
                    </span>
                  )}
                  <ProgressLine done={prog.done} total={prog.total} text={t("progress", { done: prog.done, total: prog.total })} />
                  {/* Moving the path itself: buttons, never dragging. */}
                  <span className="desk-path-move">
                    <button type="button" className="desk-icon-btn" disabled={pi === 0} aria-label={t("paths.upPath", { name: display })} onClick={() => movePath(p.id, -1)}>
                      <span aria-hidden="true">{"↑"}</span>
                    </button>
                    <button type="button" className="desk-icon-btn" disabled={pi === paths.length - 1} aria-label={t("paths.downPath", { name: display })} onClick={() => movePath(p.id, 1)}>
                      <span aria-hidden="true">{"↓"}</span>
                    </button>
                  </span>
                </div>
                {isOpen && (
                  <div className="desk-path-body">
                    {/* Rename. */}
                    <form
                      className="desk-inline-form"
                      onSubmit={(e) => {
                        // Not a page load.
                        e.preventDefault();
                        // The field.
                        const f = (e.currentTarget.elements.namedItem("name") as HTMLInputElement | null)?.value ?? "";
                        // Renamed.
                        renamePath(p.id, f);
                        // Said.
                        setMsg(t("paths.renamed"));
                      }}
                    >
                      <label className="desk-picker-label" htmlFor={`${uid}-rn-${p.id}`}>{t("paths.rename")}</label>
                      <input id={`${uid}-rn-${p.id}`} name="name" className="desk-input" type="text" defaultValue={p.name} placeholder={display} maxLength={DESK_LIMITS.nameLength} />
                      <button type="submit" className="desk-btn">{t("paths.renameSave")}</button>
                    </form>
                    {/* A live path: why it cannot be edited, and the way to make it the reader's own. */}
                    {p.from?.mode === "live" && (
                      <p className="desk-note">
                        {t("paths.liveNote", { name: titleOf(props.index, p.from.id) ?? display })}{" "}
                        <button type="button" className="desk-btn" onClick={() => freezePath(p.id)}>{t("paths.freeze")}</button>
                      </p>
                    )}
                    {/* The items. */}
                    {p.items.length === 0 ? (
                      <p className="desk-muted">{t("paths.noItems")}</p>
                    ) : (
                      <ol className="desk-list desk-path-items">
                        {p.items.map((id, i) => {
                          // Read or not.
                          const isRead = id in read;
                          // The row.
                          return (
                            <li key={id} className="desk-row">
                              <span className="desk-row-n mono">{i + 1}</span>
                              {/* The read mark, as a button with its state. */}
                              <button
                                type="button"
                                className="desk-icon-btn"
                                aria-pressed={isRead}
                                aria-label={t("paths.readToggle", { title: titleOf(props.index, id) ?? id })}
                                onClick={() => (isRead ? markUnread(id) : markRead(id))}
                              >
                                <span aria-hidden="true">{isRead ? "✓" : "○"}</span>
                              </button>
                              <DeskItemRow id={id} index={props.index} readDay={read[id]} showKind />
                              {/* Moving and removing: not on a live path. */}
                              {p.from?.mode !== "live" && (
                                <span className="desk-row-actions">
                                  <button type="button" className="desk-icon-btn" disabled={i === 0} aria-label={t("paths.up")} onClick={() => moveInPath(p.id, i, -1)}>
                                    <span aria-hidden="true">{"↑"}</span>
                                  </button>
                                  <button type="button" className="desk-icon-btn" disabled={i === p.items.length - 1} aria-label={t("paths.down")} onClick={() => moveInPath(p.id, i, 1)}>
                                    <span aria-hidden="true">{"↓"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="desk-icon-btn"
                                    aria-label={t("paths.remove")}
                                    onClick={() => {
                                      // Removed.
                                      const gone = removeFromPath(p.id, i);
                                      // Said, with undo.
                                      if (gone) setUndo({ msg: t("paths.removed"), run: () => insertIntoPath(p.id, i, gone) });
                                    }}
                                  >
                                    <span aria-hidden="true">{"×"}</span>
                                  </button>
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                    )}
                    {/* Adding: an item, or a whole series; not on a live path. */}
                    {p.from?.mode !== "live" && (
                      <div className="desk-path-add">
                        <DeskItemPicker
                          index={props.index}
                          present={p.items}
                          onPick={(id) => addItems(p, [id])}
                          labels={{ label: t("paths.addItem"), placeholder: t("picker.placeholder"), none: t("picker.none"), add: t("picker.add"), kind: kindName }}
                        />
                        <DeskItemPicker
                          index={props.index}
                          kinds={COLLECTION_KINDS}
                          onPick={(id) => addItems(p, props.index?.byId.get(id)?.m ?? [])}
                          labels={{ label: t("paths.addSeries"), placeholder: t("picker.seriesPlaceholder"), none: t("picker.none"), add: t("picker.addAll"), kind: kindName }}
                        />
                      </div>
                    )}
                    {/* Delete, with undo. */}
                    <p className="desk-path-foot">
                      <span className="desk-muted mono">{t("paths.count", { count: p.items.length, max: DESK_LIMITS.pathItems })}</span>
                      <button type="button" className="desk-btn desk-btn--quiet" onClick={() => remove(p)}>{t("paths.delete")}</button>
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {/* A new path. */}
      <form
        className="desk-inline-form"
        onSubmit={(e) => {
          // Not a page load.
          e.preventDefault();
          // Made.
          create();
        }}
      >
        <label className="desk-picker-label" htmlFor={`${uid}-new`}>{t("paths.new")}</label>
        <input id={`${uid}-new`} className="desk-input" type="text" value={name} maxLength={DESK_LIMITS.nameLength} placeholder={t("paths.newPlaceholder")} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="desk-btn">{t("paths.create")}</button>
      </form>
      {/* Adopt a series, a training series or a reading path: following it, or as a copy. */}
      <details className="desk-adopt">
        <summary>{t("paths.adopt")}</summary>
        <div className="desk-adopt-body">
          <label className="desk-picker-label" htmlFor={`${uid}-adopt`}>{t("paths.adoptPick")}</label>
          <select id={`${uid}-adopt`} className="desk-input" value={adoptId} onChange={(e) => setAdoptId(e.target.value)} disabled={!props.index}>
            <option value="">{props.index ? t("paths.adoptChoose") : t("status.loading")}</option>
            {collections.map((it) => (
              <option key={`${it.k}:${it.s}`} value={`${it.k}:${it.s}`}>
                {t(`kinds.${it.k}`)}: {it.t} ({it.m?.length ?? 0})
              </option>
            ))}
          </select>
          <fieldset className="desk-adopt-mode">
            <legend className="desk-picker-label">{t("paths.adoptHow")}</legend>
            <label><input type="radio" name={`${uid}-mode`} checked={adoptMode === "live"} onChange={() => setAdoptMode("live")} /> {t("paths.adoptLive")}</label>
            <label><input type="radio" name={`${uid}-mode`} checked={adoptMode === "frozen"} onChange={() => setAdoptMode("frozen")} /> {t("paths.adoptFrozen")}</label>
          </fieldset>
          <button type="button" className="desk-btn" disabled={!adoptId} onClick={() => adoptId && adopt(adoptId as ItemId, adoptMode)}>
            <span className="desk-sign" aria-hidden="true">+</span> {t("paths.adoptDo")}
          </button>
        </div>
      </details>
      {/* What happened: with an Undo when it can be undone. */}
      <div className="desk-status" role="status">
        {undo ? (
          <>
            {undo.msg}{" "}
            <button
              type="button"
              className="desk-btn"
              onClick={() => {
                // Undone.
                undo.run();
                // Cleared.
                setUndo(null);
              }}
            >
              {t("undo")}
            </button>
          </>
        ) : (
          msg
        )}
      </div>
    </div>
  );
}

