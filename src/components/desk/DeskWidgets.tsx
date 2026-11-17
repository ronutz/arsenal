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
//   Continue          where was I, the desk's lead: the next unread item of
//                     the path in progress in large type, what comes then,
//                     and the last pages opened with when (the existing
//                     "continue" trail, ronutz:recent:v1, read, never written)
//   Favourites        saved items; tools as launch tiles, the rest grouped by
//                     kind; remove with an Undo
//   Recently read     the latest read marks by day (Today, Yesterday, the
//                     date), with "updated since you read it"
//   Today's puzzles   the day's count, then the daily puzzles in columns,
//                     each solved, played or not yet by its sign and word,
//                     read from the games' own record
//                     (ronutz:fun:v1); nothing new is stored
//   Search            a field that opens the site search with the words typed,
//                     and the four indexes with how many items each holds
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
import { pathInProgress, saveItem, today, unsaveItem, type DeskData } from "@/lib/desk/store";
// Identifiers.
import { ITEM_KINDS, itemHref, splitItemId, type ItemId } from "@/lib/desk/ids";
// The index.
import { lookup, type SiteIndex } from "@/lib/desk/siteIndex";
// One item as the desk shows it, and dates.
import DeskItemRow, { formatDay, titleOf } from "./DeskItemRow";
// The language's tag for Intl (the numbers beside the indexes).
import { intlLocale } from "@/i18n/locales";
// "1 hour ago" for the last pages opened (pure, checked by check-desk-store).
import { openedAgo } from "@/lib/desk/calendar";
// A progress line.
import { ProgressLine } from "./DeskPaths";
// The "continue" trail's key and shape.
import { RECENT_KEY, type RecentPage } from "@/components/RecentPagesRecorder";
// The games: which have a daily puzzle.
import { FUN_GAMES } from "@/config/funGames";
// The games' own record (read only), today's UTC day and the live streak.
import { FUN_STORAGE_KEY, liveStreak, loadRecord } from "@/lib/fun/storage";
import { utcDayKey } from "@/lib/fun/daily";

/** From how many saved items Favourites offers a filter (second improvement pass). */
const FILTER_FROM = 8;

/**
 * Text folded for a forgiving comparison: accents dropped, lower case.
 *
 * @param s the text
 * @returns the folded text
 */
function fold(s: string): string {
  // Decomposed, marks removed, lower case.
  return s.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

/** Examples shown in an empty Favourites, when the index has them. */
const EXAMPLE_FAVOURITES: readonly ItemId[] = ["tool:cidr", "tool:base64", "tool:x509", "learn:subnetting-basics", "term:bfd"];

// ---------------------------------------------------------------------------
// Continue
// ---------------------------------------------------------------------------


/**
 * Continue, the desk's lead (increment E): the next unread item of the path in progress in large type with its path,
 * its progress, the item after it and a link to the path; beside it the last pages opened, each with when.
 *
 * @param props the desk and the index
 * @returns the widget's content
 */
export function ContinueWidget(props: { data: DeskData; index: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The page's language, for "when".
  const locale = useLocale();
  // The last pages opened, from the existing trail, and the moment they were read (for "when").
  const [recent, setRecent] = useState<{ pages: RecentPage[]; now: number }>({ pages: [], now: 0 });
  // Read once (the trail is written by every page; this page only reads it).
  useEffect(() => {
    // Storage may refuse.
    try {
      // The stored trail.
      const raw = window.localStorage.getItem(RECENT_KEY);
      // Parsed.
      const list = raw ? (JSON.parse(raw) as RecentPage[]) : [];
      // Well-formed ones, not this page in any language ("/my-desk", "/en/my-desk/", "/pt-BR/my-desk"), the first three.
      const pages = list.filter((p) => p && typeof p.path === "string" && typeof p.title === "string" && !/^(\/[A-Za-z]{2}(?:-[A-Za-z]{2})?)?\/my-desk\/?$/.test(p.path)).slice(0, 3);
      // Kept with the moment they were read.
      setRecent({ pages, now: Date.now() });
    } catch {
      // No trail.
      setRecent({ pages: [], now: 0 });
    }
  }, []);
  // The path in progress.
  const cur = pathInProgress(props.data);
  // That path.
  const path = cur ? props.data.paths[cur.path] : null;
  // Its name.
  const pathName = path ? path.name || (path.from ? titleOf(props.index, path.from.id) : null) || t("paths.untitled") : "";
  // Read so far in it.
  const done = path ? path.items.filter((i) => i in props.data.read).length : 0;
  // The unread item after the next one, in the path's order (what comes then).
  const then = path && cur ? path.items.slice(path.items.indexOf(cur.next) + 1).find((i) => !(i in props.data.read)) ?? null : null;
  // Whether the paths widget is on the page, for the link to the path.
  const pathsShown = props.data.layout.widgets.some((w) => w.type === "paths");
  // Nothing at all.
  if (!cur && recent.pages.length === 0) return <p className="desk-empty">{t("continue.empty")}</p>;
  // The content.
  return (
    <div className={`desk-continue${path && cur && recent.pages.length > 0 ? "" : " desk-continue--one"}`}>
      {path && cur && (
        <div className="desk-continue-next">
          <p className="desk-label">{t("continue.next", { path: pathName })}</p>
          {/* The next item: the largest line on the desk. */}
          <p className="desk-continue-item">
            <DeskItemRow id={cur.next} index={props.index} showKind />
          </p>
          <ProgressLine done={done} total={path.items.length} text={t("progress", { done, total: path.items.length })} items={path.items} read={props.data.read} next={cur.next} nameOf={(id) => titleOf(props.index, id)} />
          {/* What comes after it, and the whole path in the paths widget. */}
          <p className="desk-continue-foot">
            {then && (
              <span className="desk-continue-then">
                {t("continue.then")} <DeskItemRow id={then} index={props.index} />
              </span>
            )}
            {pathsShown && (
              <a className="desk-link desk-continue-path" href={`#path=${path.id}`}>{t("continue.seePath")}</a>
            )}
          </p>
        </div>
      )}
      {recent.pages.length > 0 && (
        <div className="desk-continue-recent">
          <p className="desk-label">{t("continue.recent")}</p>
          <ul className="desk-list">
            {recent.pages.map((p) => (
              <li key={p.path} className="desk-continue-opened">
                <Link href={p.path} className="desk-item-link">{p.title}</Link>
                {/* When, in words; nothing for a clock ahead of this one. */}
                {typeof p.at === "number" && openedAgo(p.at, recent.now, locale) && (
                  <span className="desk-muted">{openedAgo(p.at, recent.now, locale)}</span>
                )}
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
  // The filter's words (second improvement pass: offered from FILTER_FROM saved items).
  const [q, setQ] = useState("");
  // Saved items, newest first.
  const all = (Object.keys(props.data.saved) as ItemId[]).reverse();
  // Whether the filter is offered.
  const filterable = all.length >= FILTER_FROM;
  // The words, folded for comparison (accents and case ignored).
  const needle = fold(q.trim());
  // The items the filter keeps (all of them when the field is empty).
  const ids = filterable && needle ? all.filter((id) => fold(titleOf(props.index, id) ?? splitItemId(id).slug).includes(needle)) : all;
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
  if (all.length === 0) {
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
      {/* The filter, once there are enough favourites to need one. */}
      {filterable && (
        <div className="desk-fav-filter" role="search">
          <label className="desk-visually-hidden" htmlFor="desk-fav-filter">{t("favourites.filter")}</label>
          <input id="desk-fav-filter" className="desk-input" type="search" value={q} placeholder={t("favourites.filter")} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}
      {/* Nothing matches: said, with the words typed. */}
      {filterable && needle && ids.length === 0 && <p className="desk-empty" role="status">{t("favourites.noMatch", { q: q.trim() })}</p>}
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
  // Today and yesterday, for the days' names.
  const now = today();
  // Yesterday (noon UTC, so no zone moves it).
  const yesterday = new Date(Date.parse(`${now}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  // The marks grouped by day, newest day first (they are already in that order).
  const groups: { day: string; ids: ItemId[] }[] = [];
  // Each mark joins its day's group.
  for (const m of marks) {
    // The last group, when it is this mark's day.
    const g = groups[groups.length - 1];
    // Joined, or a new day.
    if (g && g.day === m.day) g.ids.push(m.id); else groups.push({ day: m.day, ids: [m.id] });
  }
  // The days, each named once (increment E: the full date repeated on every row is said once per day).
  return (
    <div className="desk-recent">
      {groups.map((g) => (
        <div key={g.day} className="desk-recent-day">
          <h3 className="desk-recent-when">{g.day === now ? t("recent.today") : g.day === yesterday ? t("recent.yesterday") : formatDay(g.day, locale)}</h3>
          <ul className="desk-list">
            {g.ids.map((id) => (
              <li key={id} className="desk-row">
                <DeskItemRow id={id} index={props.index} readDay={g.day} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
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
      const utcDay = utcDayKey(new Date());
      // Each daily game.
      setStates(
        FUN_GAMES.filter((g) => g.daily).map((g) => {
          // Its record.
          const r = loadRecord(g.id);
          // Today's result.
          const res = r.results?.[utcDay];
          // The state.
          return { id: g.id, result: res === 1 ? 1 : res === 0 ? 0 : null, streak: liveStreak(r, utcDay) };
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
  // The puzzles: today's states once read, every daily game as not played until then.
  const list = states ?? FUN_GAMES.filter((g) => g.daily).map((g) => ({ id: g.id, result: null, streak: 0 }) as PuzzleState);
  // Played today (solved or not) and solved.
  const played = list.filter((s) => s.result !== null).length;
  // Solved today.
  const solved = list.filter((s) => s.result === 1).length;
  // One line for the day, then the games in two columns, each with its sign (increment E: fifteen rows each saying
  // "Not played yet" made the widget the page's tallest and its words the page's most repeated). The state of each
  // game is in its sign and, for assistive technology and the pointer's tooltip, in its word.
  return (
    <div className="desk-puzzles-w">
      <p className="desk-puzzles-sum">
        {states ? t("puzzles.summary", { played, total: list.length }) : t("status.loading")}
        {states && solved > 0 && <> {t("puzzles.summarySolved", { count: solved })}</>}
      </p>
      <ul className="desk-puzzles">
        {list.map((s) => {
          // The state's word.
          const word = s.result === 1 ? t("puzzles.solved") : s.result === 0 ? t("puzzles.played") : t("puzzles.notYet");
          // One game.
          return (
            <li key={s.id} className={`desk-puzzle${s.result === 1 ? " desk-puzzle--solved" : s.result === 0 ? " desk-puzzle--played" : ""}`} title={word}>
              <span className="desk-puzzle-sign" aria-hidden="true">{s.result === 1 ? "✓" : s.result === 0 ? "•" : "○"}</span>
              <span className="desk-puzzle-text">
                <Link href={itemHref(`game:${s.id}` as ItemId)} className="desk-item-link">{titleOf(props.index, `game:${s.id}` as ItemId) ?? s.id}</Link>
                {/* The state in words, for assistive technology (the sign says it on screen). */}
                <span className="desk-visually-hidden">{`: ${word}`}</span>
                {/* A run of days, under the name. */}
                {s.streak > 1 && <span className="desk-puzzle-streak">{t("puzzles.streak", { count: s.streak })}</span>}
              </span>
            </li>
          );
        })}
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

/** The four indexes offered beside the search field, by the kind of item they list, with their pages. */
const BROWSE: readonly { kind: "tool" | "learn" | "term" | "guide"; href: string }[] = [
  { kind: "tool", href: "/tools" },
  { kind: "learn", href: "/learn" },
  { kind: "term", href: "/glossary" },
  { kind: "guide", href: "/certifications" },
];

/**
 * A search field: the words go to the site's own search dialog, which searches in this browser. Under it, the four
 * indexes with how many items each holds, counted from the site index (increment E: the field alone left the widget
 * an empty box).
 *
 * @param props the index (for the counts), or null before it arrives
 * @returns the widget's content
 */
export function SearchWidget(props: { index?: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The page's language, for the numbers.
  const locale = useLocale();
  // What was typed.
  const [q, setQ] = useState("");
  // The field, named as the opener so focus returns to it.
  const field = useRef<HTMLInputElement>(null);
  // How many items of each kind the site has, once the index is in.
  const counts = useMemo(() => {
    // Nothing before the index.
    if (!props.index) return null;
    // Counted by kind.
    const c: Record<string, number> = {};
    // Each item.
    for (const it of props.index.items) c[it.k] = (c[it.k] ?? 0) + 1;
    // The counts.
    return c;
  }, [props.index]);
  // The numbers in the page's language.
  const nf = new Intl.NumberFormat(intlLocale(locale));
  // The field, then the indexes.
  return (
    <div className="desk-search">
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
      {/* The indexes, each with its count (the count only once the index is in). */}
      <nav className="desk-browse" aria-labelledby="desk-browse-label">
        <p className="desk-label" id="desk-browse-label">{t("search.browse")}</p>
        <ul className="desk-browse-list">
          {BROWSE.map((b) => (
            <li key={b.kind}>
              <Link href={b.href} className="desk-browse-link">
                <span className="desk-browse-name">{t(`kinds.${b.kind}`)}</span>
                {counts && <span className="desk-browse-n">{nf.format(counts[b.kind] ?? 0)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
