"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskWidgets.tsx
// ----------------------------------------------------------------------------
// THE DESK'S FIRST WIDGETS (PLAN-personal-desk-20261112, section 3.6, first
// set; the paths widget is DeskPaths.tsx). One job each, one anatomy for all:
// a title (drawn by the page), the content, at most one action.
//
//   Continue          where was I: the next unread item of the path in
//                     progress, and the last pages opened (the existing
//                     "continue" trail, ronutz:recent:v1, read, never written)
//   Favourites        saved items; tools as launch tiles, the rest grouped by
//                     kind; remove with an Undo
//   Recently read     the latest read marks, with "updated since you read it"
//   Today's puzzles   the daily puzzles and whether today's is solved, played
//                     or not yet, read from the games' own record
//                     (ronutz:fun:v1); nothing new is stored
//   Search            a field that opens the site search with the words typed
//
// An empty widget invites rather than sits empty: examples, plainly marked
// "Example", that become the reader's own with one tap.
// ============================================================================

// React's state, effects and refs.
import { useEffect, useMemo, useRef, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk's verbs.
import { pathInProgress, saveItem, unsaveItem, type DeskData } from "@/lib/desk/store";
// Identifiers.
import { ITEM_KINDS, itemHref, splitItemId, type ItemId } from "@/lib/desk/ids";
// The index.
import { lookup, type SiteIndex } from "@/lib/desk/siteIndex";
// One item as the desk shows it, and dates.
import DeskItemRow, { formatDay, titleOf } from "./DeskItemRow";
// A progress line.
import { ProgressLine } from "./DeskPaths";
// The "continue" trail's key and shape.
import { RECENT_KEY, type RecentPage } from "@/components/RecentPagesRecorder";
// The games: which have a daily puzzle.
import { FUN_GAMES } from "@/config/funGames";
// The games' own record (read only), today's UTC day and the live streak.
import { FUN_STORAGE_KEY, liveStreak, loadRecord } from "@/lib/fun/storage";
import { utcDayKey } from "@/lib/fun/daily";

/** Examples shown in an empty Favourites, when the index has them. */
const EXAMPLE_FAVOURITES: readonly ItemId[] = ["tool:cidr", "tool:base64", "tool:x509", "learn:subnetting-basics", "term:bfd"];

// ---------------------------------------------------------------------------
// Continue
// ---------------------------------------------------------------------------

/**
 * Continue: the next item of the path in progress, and the last pages opened.
 *
 * @param props the desk and the index
 * @returns the widget's content
 */
export function ContinueWidget(props: { data: DeskData; index: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The last pages opened, from the existing trail.
  const [recent, setRecent] = useState<RecentPage[]>([]);
  // Read once (the trail is written by every page; this page only reads it).
  useEffect(() => {
    // Storage may refuse.
    try {
      // The stored trail.
      const raw = window.localStorage.getItem(RECENT_KEY);
      // Parsed.
      const list = raw ? (JSON.parse(raw) as RecentPage[]) : [];
      // Well-formed ones, not this page in any language ("/my-desk", "/en/my-desk/", "/pt-BR/my-desk"), the first three.
      setRecent(list.filter((p) => p && typeof p.path === "string" && typeof p.title === "string" && !/^(\/[A-Za-z]{2}(?:-[A-Za-z]{2})?)?\/my-desk\/?$/.test(p.path)).slice(0, 3));
    } catch {
      // No trail.
      setRecent([]);
    }
  }, []);
  // The path in progress.
  const cur = pathInProgress(props.data);
  // That path.
  const path = cur ? props.data.paths[cur.path] : null;
  // Its name.
  const pathName = path ? path.name || (path.from ? titleOf(props.index, path.from.id) : null) || t("paths.untitled") : "";
  // Nothing at all.
  if (!cur && recent.length === 0) return <p className="desk-empty">{t("continue.empty")}</p>;
  // The content.
  return (
    <div className="desk-continue">
      {path && cur && (
        <div className="desk-continue-next">
          <p className="desk-label">{t("continue.next", { path: pathName })}</p>
          <p className="desk-continue-item">
            <DeskItemRow id={cur.next} index={props.index} showKind />
          </p>
          <ProgressLine
            done={path.items.filter((i) => i in props.data.read).length}
            total={path.items.length}
            text={t("progress", { done: path.items.filter((i) => i in props.data.read).length, total: path.items.length })}
          />
        </div>
      )}
      {recent.length > 0 && (
        <div className="desk-continue-recent">
          <p className="desk-label">{t("continue.recent")}</p>
          <ul className="desk-list">
            {recent.map((p) => (
              <li key={p.path}>
                <Link href={p.path} className="desk-item-link">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Favourites
// ---------------------------------------------------------------------------

/**
 * Favourites: tools as launch tiles, everything else grouped by kind, each removable with an Undo.
 *
 * @param props the desk, the index, and whether the desk is still empty (examples shown)
 * @returns the widget's content
 */
export function FavouritesWidget(props: { data: DeskData; index: SiteIndex | null; empty: boolean }) {
  // The words.
  const t = useTranslations("desk");
  // The last removal, for its Undo.
  const [undo, setUndo] = useState<ItemId | null>(null);
  // Saved items, newest first.
  const ids = (Object.keys(props.data.saved) as ItemId[]).reverse();
  // Tools, for the tiles.
  const tools = ids.filter((id) => splitItemId(id).kind === "tool");
  // Everything else, grouped by kind in the kinds' order.
  const groups = ITEM_KINDS.filter((k) => k !== "tool").map((k) => ({ k, ids: ids.filter((id) => splitItemId(id).kind === k) })).filter((g) => g.ids.length > 0);

  /**
   * Remove one, with an Undo.
   *
   * @param id the item
   */
  const remove = (id: ItemId) => {
    // Removed.
    unsaveItem(id);
    // Undo offered.
    setUndo(id);
  };

  // Nothing saved: the invitation, with examples.
  if (ids.length === 0) {
    // The examples the index has.
    const examples = props.index ? EXAMPLE_FAVOURITES.filter((id) => props.index?.byId.has(id)) : [];
    // The invitation.
    return (
      <div className="desk-empty">
        <p>{t("favourites.empty")}</p>
        {props.empty && examples.length > 0 && (
          <ul className="desk-list">
            {examples.map((id) => (
              <li key={id} className="desk-row">
                <span className="desk-chip desk-chip--example">{t("example")}</span>
                <DeskItemRow id={id} index={props.index} showKind />
                <button type="button" className="desk-btn" onClick={() => saveItem(id)}>
                  <span className="desk-sign" aria-hidden="true">{"☆"}</span> {t("favourites.saveExample")}
                </button>
              </li>
            ))}
          </ul>
        )}
        {undo && <UndoLine msg={t("favourites.removed")} label={t("undo")} onUndo={() => { saveItem(undo); setUndo(null); }} />}
      </div>
    );
  }
  // The favourites.
  return (
    <div className="desk-favourites">
      {/* Tools as tiles: one tap opens the tool. */}
      {tools.length > 0 && (
        <>
          <p className="desk-label">{t("kinds.tool")}</p>
          <ul className="desk-tiles">
            {tools.map((id) => {
              // The tool under its current name.
              const found = props.index ? lookup(props.index, id) : null;
              // Gone.
              const gone = props.index !== null && !found;
              // A tile.
              return (
                <li key={id} className="desk-tile">
                  {gone ? (
                    <span className="desk-item-gone"><span aria-hidden="true">{"⊘"}</span> {t("item.gone")}</span>
                  ) : (
                    <Link href={itemHref(found?.id ?? id)} className="desk-tile-link">{found?.item.t ?? splitItemId(id).slug}</Link>
                  )}
                  <button type="button" className="desk-icon-btn" aria-label={t("favourites.remove", { title: found?.item.t ?? splitItemId(id).slug })} onClick={() => remove(id)}>
                    <span aria-hidden="true">{"×"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {/* The other kinds, each under its name. */}
      {groups.map((g) => (
        <div key={g.k} className="desk-fav-group">
          <p className="desk-label">{t(`kinds.${g.k}`)}</p>
          <ul className="desk-list">
            {g.ids.map((id) => (
              <li key={id} className="desk-row">
                <DeskItemRow id={id} index={props.index} readDay={props.data.read[id]} />
                <button type="button" className="desk-icon-btn" aria-label={t("favourites.remove", { title: titleOf(props.index, id) ?? id })} onClick={() => remove(id)}>
                  <span aria-hidden="true">{"×"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {undo && <UndoLine msg={t("favourites.removed")} label={t("undo")} onUndo={() => { saveItem(undo); setUndo(null); }} />}
    </div>
  );
}

/**
 * A line saying what was just done, with its Undo.
 *
 * @param props the sentence, the button's word, and the undo
 * @returns the line
 */
function UndoLine(props: { msg: string; label: string; onUndo: () => void }) {
  // Announced.
  return (
    <p className="desk-status" role="status">
      {props.msg}{" "}
      <button type="button" className="desk-btn" onClick={props.onUndo}>{props.label}</button>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Recently read
// ---------------------------------------------------------------------------

/**
 * Recently read: the latest read marks, newest first, each with its day and "updated since you read it".
 *
 * @param props the desk and the index
 * @returns the widget's content
 */
export function RecentWidget(props: { data: DeskData; index: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The page's language, for dates.
  const locale = useLocale();
  // The marks, newest day first (within a day, the last made first).
  const marks = useMemo(
    () => (Object.entries(props.data.read) as [ItemId, string][]).map((e, i) => ({ id: e[0], day: e[1], i })).sort((a, b) => (a.day === b.day ? b.i - a.i : a.day < b.day ? 1 : -1)).slice(0, 10),
    [props.data.read],
  );
  // None yet.
  if (marks.length === 0) return <p className="desk-empty">{t("recent.empty")}</p>;
  // The list.
  return (
    <ul className="desk-list">
      {marks.map((m) => (
        <li key={m.id} className="desk-row">
          <DeskItemRow id={m.id} index={props.index} readDay={m.day} />
          <span className="desk-muted mono">{formatDay(m.day, locale)}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Today's puzzles
// ---------------------------------------------------------------------------

/** Today's state of one daily puzzle. */
interface PuzzleState {
  /** The game. */
  id: string;
  /** 1 solved, 0 played but not solved, null not played today. */
  result: 1 | 0 | null;
  /** The live streak. */
  streak: number;
}

/**
 * Today's puzzles, from the games' own record (read only).
 *
 * @param props the index (for the games' titles)
 * @returns the widget's content
 */
export function PuzzlesWidget(props: { index: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The states, read after mount.
  const [states, setStates] = useState<PuzzleState[] | null>(null);
  // Read, and read again when a game in another tab writes its record.
  useEffect(() => {
    // Read every daily puzzle's record.
    const read = () => {
      // Today, in UTC (the day the puzzles turn).
      const today = utcDayKey(new Date());
      // Each daily game.
      setStates(
        FUN_GAMES.filter((g) => g.daily).map((g) => {
          // Its record.
          const r = loadRecord(g.id);
          // Today's result.
          const res = r.results?.[today];
          // The state.
          return { id: g.id, result: res === 1 ? 1 : res === 0 ? 0 : null, streak: liveStreak(r, today) };
        }),
      );
    };
    // Now.
    read();
    // Another tab.
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === FUN_STORAGE_KEY) read(); };
    // Listening.
    window.addEventListener("storage", onStorage);
    // Stopped.
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // The list (empty rows keep the space until read).
  return (
    <div>
      <ul className="desk-list desk-puzzles">
        {(states ?? FUN_GAMES.filter((g) => g.daily).map((g) => ({ id: g.id, result: null, streak: 0 }) as PuzzleState)).map((s) => (
          <li key={s.id} className="desk-row">
            <Link href={itemHref(`game:${s.id}` as ItemId)} className="desk-item-link">{titleOf(props.index, `game:${s.id}` as ItemId) ?? s.id}</Link>
            {/* Today's state: a sign and the word. */}
            <span className={`desk-chip${s.result === 1 ? " desk-chip--done" : ""}`}>
              <span aria-hidden="true">{s.result === 1 ? "✓" : s.result === 0 ? "•" : "○"}</span>{" "}
              {s.result === 1 ? t("puzzles.solved") : s.result === 0 ? t("puzzles.played") : t("puzzles.notYet")}
            </span>
            {s.streak > 1 && <span className="desk-muted mono">{t("puzzles.streak", { count: s.streak })}</span>}
          </li>
        ))}
      </ul>
      <p className="desk-widget-action">
        <Link href="/dev/fun" className="desk-link">{t("puzzles.all")} <span aria-hidden="true">{"→"}</span></Link>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * A search field: the words go to the site's own search dialog, which searches in this browser.
 *
 * @returns the widget's content
 */
export function SearchWidget() {
  // The words.
  const t = useTranslations("desk");
  // What was typed.
  const [q, setQ] = useState("");
  // The field, named as the opener so focus returns to it.
  const field = useRef<HTMLInputElement>(null);
  // The form.
  return (
    <form
      className="desk-inline-form"
      role="search"
      onSubmit={(e) => {
        // Not a page load.
        e.preventDefault();
        // The site's search, opened with the words.
        window.dispatchEvent(new CustomEvent("ronutz:open-search", { detail: { query: q, opener: field.current } }));
      }}
    >
      <label className="desk-visually-hidden" htmlFor="desk-search-field">{t("search.label")}</label>
      <input id="desk-search-field" ref={field} className="desk-input" type="search" value={q} placeholder={t("search.placeholder")} onChange={(e) => setQ(e.target.value)} />
      <button type="submit" className="desk-btn">{t("search.go")}</button>
    </form>
  );
}

