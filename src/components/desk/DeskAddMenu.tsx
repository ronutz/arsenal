"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskAddMenu.tsx
// ----------------------------------------------------------------------------
// "ADD TO A PATH" (PLAN-personal-desk-20261112, sections 3.3 and 3.4): the one
// small panel that puts an item on the reader's desk, opened from an item's
// own page (DeskItemControls) and from a result in the site search ("Add
// to..."). It lists the reader's paths with a button each, makes a new path
// with the item in it, and, from search, saves or unsaves the item too. Every
// outcome is said in words in a status line (added, already there, a path
// full, too many paths, a path that follows its series). It says where this
// is kept, "Kept in this browser", at the point of use, and links My desk.
//
// The strings come in as props (the page's own namespace on item pages, the
// global deskItem.menu slice in the search dialog), so this component reads no
// namespace of its own. Escape closes it and gives focus back to its opener.
// ============================================================================

// React's state, refs and effects.
import { useEffect, useRef, useState } from "react";
// The locale, for the site index's titles of adopted paths.
import { useLocale } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk: its state and the verbs used here.
import { addToPath, createPath, saveItem, unsaveItem, DESK_LIMITS } from "@/lib/desk/store";
// The desk in a component.
import { useDesk } from "@/lib/desk/useDesk";
// The automatic sync, loaded only when this browser syncs.
import { useAutoSync } from "@/lib/desk/autoSync";
// The site index, for the titles of paths adopted from a series (their stored name is empty).
import { useSiteIndex, lookup } from "@/lib/desk/siteIndex";
// Identifiers.
import type { ItemId } from "@/lib/desk/ids";

/** The menu's words, in the page's language. */
export interface DeskMenuLabels {
  /** The panel's heading ("Add to a path"). */
  title: string;
  /** The save toggle, off. */
  save: string;
  /** The save toggle, on. */
  saved: string;
  /** The heading of the paths list. */
  paths: string;
  /** No paths yet. */
  none: string;
  /** The new path's name field. */
  newName: string;
  /** The create button. */
  create: string;
  /** "Added to {name}." */
  added: string;
  /** "Already in {name}." */
  already: string;
  /** "{name} is full: ..." */
  full: string;
  /** Too many paths. */
  tooMany: string;
  /** "{name} follows its series ..." */
  live: string;
  /** A path with no name. */
  untitled: string;
  /** Close. */
  close: string;
  /** Kept in this browser. */
  kept: string;
  /** Open My desk. */
  open: string;
  /** The saved-items limit reached. */
  limitSaved: string;
}

/**
 * Put a name into a sentence with a {name} placeholder (the labels arrive resolved, with the placeholder kept).
 *
 * @param s the sentence
 * @param name the name
 * @returns the sentence with the name in place
 */
function withName(s: string, name: string): string {
  // Every occurrence.
  return s.split("{name}").join(name);
}

/**
 * The panel.
 *
 * @param props the item, the words, whether to offer Save, and how to close
 * @returns the panel
 */
export default function DeskAddMenu(props: { id: ItemId; labels: DeskMenuLabels; showSave?: boolean; onClose: () => void }) {
  // The words.
  const L = props.labels;
  // The page's language.
  const locale = useLocale();
  // The desk.
  const { data } = useDesk();
  // The index, for adopted paths' titles; loaded when the panel opens and there is such a path.
  const needsIndex = data.paths.some((p) => !p.name && p.from);
  // Loaded only then.
  const { index } = useSiteIndex(locale, needsIndex);
  // Changes made here reach the sync when this browser syncs.
  useAutoSync();
  // The new path's name as typed.
  const [name, setName] = useState("");
  // The last outcome, in words.
  const [msg, setMsg] = useState("");
  // The panel, for focus.
  const panel = useRef<HTMLDivElement>(null);

  // Opened: focus moves into the panel (its first control); Escape closes it.
  useEffect(() => {
    // The first focusable control.
    panel.current?.querySelector<HTMLElement>("button, input")?.focus();
    // Escape closes.
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); props.onClose(); } };
    // Listening on the panel only, so the search dialog's own Escape is not doubled.
    const el = panel.current;
    // Attached.
    el?.addEventListener("keydown", onKey);
    // Detached.
    return () => el?.removeEventListener("keydown", onKey);
    // Once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * A path's display name: what the reader typed, its collection's title, or "Untitled path".
   *
   * @param p the path
   * @returns the name
   */
  const pathName = (p: { name: string; from: { id: ItemId } | null }) =>
    p.name || (p.from && index ? lookup(index, p.from.id)?.item.t : "") || L.untitled;

  /**
   * Add the item to a path and say what happened.
   *
   * @param pathId the path
   * @param display its name as shown
   */
  const addTo = (pathId: string, display: string) => {
    // Added.
    const r = addToPath(pathId, [props.id]);
    // Said.
    if (!r.ok) setMsg(withName(r.reason === "live" ? L.live : L.tooMany, display));
    else if (r.added > 0) setMsg(withName(L.added, display));
    else if (r.cut > 0) setMsg(withName(L.full, display));
    else setMsg(withName(L.already, display));
  };

  /** Make a new path with the item in it. */
  const create = () => {
    // The name as typed.
    const n = name.trim();
    // Made.
    const r = createPath(n, [props.id]);
    // Said.
    if (!r.ok) setMsg(L.tooMany);
    else { setMsg(withName(L.added, n || L.untitled)); setName(""); }
  };

  // Whether the item is saved.
  const saved = props.id in data.saved;

  // The panel.
  return (
    <div ref={panel} className="desk-menu" role="group" aria-label={L.title}>
      {/* From search: save or unsave, the first choice. */}
      {props.showSave && (
        <button
          type="button"
          className="desk-btn"
          aria-pressed={saved}
          onClick={() => {
            // Toggled.
            if (saved) unsaveItem(props.id);
            else if (saveItem(props.id) === "limit") setMsg(L.limitSaved);
          }}
        >
          <span className="desk-sign" aria-hidden="true">{saved ? "★" : "☆"}</span> {saved ? L.saved : L.save}
        </button>
      )}
      <p className="desk-menu-title">{L.title}</p>
      {/* The reader's paths, a button each; a path that already has the item says so. */}
      {data.paths.length === 0 ? (
        <p className="desk-menu-none">{L.none}</p>
      ) : (
        <ul className="desk-menu-list">
          {data.paths.map((p) => {
            // Its name as shown.
            const display = pathName(p);
            // Already holds the item.
            const has = p.items.includes(props.id);
            // The button.
            return (
              <li key={p.id}>
                <button type="button" className="desk-menu-path" onClick={() => addTo(p.id, display)} aria-pressed={has}>
                  <span className="desk-sign" aria-hidden="true">{has ? "✓" : "+"}</span>
                  <span className="desk-menu-path-name">{display}</span>
                  <span className="desk-menu-path-count mono">{p.items.length}/{DESK_LIMITS.pathItems}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {/* A new path, named by the reader, with the item in it. */}
      <form
        className="desk-menu-new"
        onSubmit={(e) => {
          // Not a page load.
          e.preventDefault();
          // Made.
          create();
        }}
      >
        <label className="desk-menu-new-label">
          <span className="desk-visually-hidden">{L.newName}</span>
          <input
            className="desk-input"
            type="text"
            value={name}
            maxLength={DESK_LIMITS.nameLength}
            placeholder={L.newName}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button type="submit" className="desk-btn">{L.create}</button>
      </form>
      {/* What happened, announced. */}
      <p className="desk-menu-status" role="status">{msg}</p>
      {/* Where this is kept, at the point of use, and the way to the page. */}
      <p className="desk-menu-foot">
        <span>{L.kept}</span> · <Link href="/desk" className="desk-link">{L.open}</Link>
        <button type="button" className="desk-menu-close" onClick={props.onClose}>{L.close}</button>
      </p>
    </div>
  );
}
