"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/IntelDashboard.tsx
// ----------------------------------------------------------------------------
// THE OPERATOR'S INTELLIGENCE DASHBOARD (PRIME 12/11/2026 02:16 and 02:35):
// one page that answers "which parts of the site get the most interest, and so
// deserve the next round of work?".
//
// WHAT IT READS. Only this site's own Worker, under /api/stats/ (worker/stats.ts
// and worker/intel.ts). Nothing is fetched from anywhere else, and no library
// is loaded: every chart is a few SVG elements drawn here with the site's own
// colour tokens, so it follows whichever of the site's themes is on.
//   pulse      per-day pages read by people and interest counts, this window
//              and the equal stretch before it
//   interest   the interest counts per kind and item
//   paths      every page people were served in the window
//   history    the daily totals kept in the database (trends beyond the
//              store's three months, movers, before and after a date)
//                                                         (operator's key)
//   searches   the words of searches that found nothing   (operator's key)
//   rollup     which days are added up, and adding days up (operator's key)
//
// TWO KINDS OF NUMBER, NEVER MIXED UP. Pages read are counted at the server for
// every reader. Uses, rounds, reads to the end, shares, searches and saves to
// My desk are the interest counts, sent only by readers who said yes. So a rate such as "uses
// per page read" is a floor, good for comparing one item with another and not
// a share of all readers; the page says so where the rates are.
//
// THE OPERATOR'S KEY is typed into a field, kept for the browser session only
// (sessionStorage) and sent in a header, never in an address. Without it the
// page still shows every public figure; the search words, the daily totals
// (trends, movers, before and after) and the adding-up need it.
//
// FORM (dataviz method): the form first, colour last. Headline figures are
// tiles with a thin sparkline scaled from zero; sections are small multiples in
// one hue; everything with more than a handful of rows is a sortable table with
// a magnitude bar, because a ranked list is what the question asks for. No
// categorical palette is used (the site has 26 themes), no second axis, and a
// change is always written with its sign and words, never by colour alone.
// The page is English only, like the Console it belongs to.
// ============================================================================

// React's state, effects, memoised values and callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// The kinds' fixed words and the slug pattern, shared with the Worker.
import { INTEREST_SLUG } from "@/lib/interest/shape";

// ---- Shapes ------------------------------------------------------------------

/** The windows offered, in days. */
const WINDOW_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;
/** One of the windows. */
type Win = keyof typeof WINDOW_DAYS;
/** The windows in the order they are shown. */
const WINDOWS = Object.keys(WINDOW_DAYS) as Win[];
/** Where the operator's key is kept for the browser session. */
const KEY_STORE = "ronutz:intel:key";
/** How many rows a table shows before "Show all". */
const ROWS_SHOWN = 12;
/** The date the glossary's content sweep began, the default for the before-and-after comparison. */
const SWEEP_START = "2026-11-11";

/** The state of one read: waiting, answered, nothing there yet, refused for want of the key, or failed. */
type Load<T> = { state: "loading" } | { state: "ok"; data: T } | { state: "none"; reason: string } | { state: "locked" } | { state: "error"; status: number };
/** The "pulse" answer. */
interface Pulse { days: number; span: number; views: Array<{ day: string; views: number }>; events: Array<{ day: string; kind: string; n: number }> }
/** One row of the "interest" answer. */
interface InterestRow { kind: string; section: string; item: string; detail: string; n: number }
/** The "interest" answer. */
interface Interest { rows: InterestRow[]; kinds: Array<{ kind: string; views: number }>; cut: boolean }
/** The "paths" answer. */
interface Paths { rows: Array<{ path: string; views: number | string }>; cut: boolean }
/** The "history" answers used here. */
interface HistSections { rows: Array<{ day: string; section: string; views: number }> }
interface HistMovers { rows: Array<{ path: string; section: string; cur: number; prev: number }> }
interface HistSplit { days: number; from: string; to: string; rows: Array<{ path: string; prev: number; cur: number }> }
/** The whole-site figures per day (the scoreboard's fun_rounds and fun_browsers among them, 12/11/2026). */
interface HistTotals { from: string; to: string; rows: Array<{ day: string; metric: string; value: number }> }
/** The "searches" answer. */
interface Searches { rows: Array<{ term: string; locale: string; n: number }> }
/** The "rollup" report. */
interface Rolled { to: string; rolled: Array<{ day: string; value: number }> }

/** A table's column. */
interface Col {
  /** The row field it shows. */
  key: string;
  /** Its heading. */
  label: string;
  /** Whether it is a number (right-aligned, sortable by value). */
  num?: boolean;
  /** Whether its values are rates between 0 and 1, shown as percentages. */
  rate?: boolean;
}
/** A table's row: text and numbers by column key. */
type TableRow = Record<string, string | number>;

// ---- Small helpers -------------------------------------------------------------

/** A whole number as the English page writes it. */
const num = (n: number) => Math.round(n).toLocaleString("en-GB");
/** A rate between 0 and 1 as a percentage with one decimal below ten. */
const pct = (r: number) => `${(r * 100).toFixed(r < 0.1 ? 1 : 0)}%`;
/** A day (YYYY-MM-DD) as "10 Nov". */
const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
/** The UTC day `offset` days from today, as YYYY-MM-DD. */
const dayFromToday = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

/**
 * Ask the Worker for one route.
 *
 * @param path the route and its query, after /api/stats/
 * @param key the operator's key, sent only when the route needs it
 * @param method GET, or POST for the adding-up
 * @returns the read's state
 */
async function ask<T>(path: string, key = "", method: "GET" | "POST" = "GET"): Promise<Load<T>> {
  try {
    // The request: same origin, the key in a header when there is one.
    const res = await fetch(`/api/stats/${path}`, { method, headers: key ? { "x-stats-key": key } : undefined });
    // Refused for want of the key.
    if (res.status === 401) return { state: "locked" };
    // Nothing there yet: not configured, or (reason "no_tables") the daily totals' tables do not exist.
    if (res.status === 503) {
      // The reason, when the answer gives one.
      const body = (await res.json().catch(() => null)) as { reason?: unknown } | null;
      return { state: "none", reason: typeof body?.reason === "string" ? body.reason : "" };
    }
    // Any other refusal.
    if (!res.ok) return { state: "error", status: res.status };
    // Answered.
    return { state: "ok", data: (await res.json()) as T };
  } catch {
    // The request never completed.
    return { state: "error", status: 0 };
  }
}

/**
 * The item a served address is the own page of, and its section: "/en/tools/cidr/" is the tool cidr. A page beneath
 * an item (a tool's documentation) is not the item's own page. Mirrors pageItem in src/lib/interest/shape.ts, stricter.
 *
 * @param path the address as the counting store holds it
 * @returns the section and the item, or null
 */
function ownPage(path: string): { section: string; item: string } | null {
  // The parts after the language.
  const [a, b, c, d] = path.split("/").filter(Boolean).slice(1);
  // A tool, an article, a glossary entry: exactly two parts.
  if ((a === "tools" || a === "learn" || a === "glossary") && b && !c && INTEREST_SLUG.test(b)) return { section: a, item: b };
  // A puzzle or a toy under /dev/fun/: exactly three parts.
  if (a === "dev" && b === "fun" && c && !d && INTEREST_SLUG.test(c)) return { section: "fun", item: c };
  // An arcade game: exactly two parts.
  if (a === "arcade" && b && !c && INTEREST_SLUG.test(b)) return { section: "fun", item: b };
  // Anything else is not an item's own page.
  return null;
}

/**
 * The section of a served address, as the daily totals name it (worker/rollup.ts, sectionOf).
 *
 * @param path the address
 * @returns the section's name
 */
function sectionOfPath(path: string): string {
  // The parts after the language.
  const rest = path.split("/").filter(Boolean).slice(1);
  // A language's front page.
  if (rest.length === 0) return "home";
  // The puzzles and the arcade are one section.
  if ((rest[0] === "dev" && rest[1] === "fun") || rest[0] === "arcade") return "fun";
  // Everything else by its first part.
  return rest[0];
}

/**
 * A change between two totals, in words: its sign, its size, and what it is measured against.
 *
 * @param cur the figure now
 * @param prev the figure before, or null when there is none to compare with
 * @param against what the earlier figure covers ("the 30 days before")
 * @returns the direction (for the glyph) and the sentence
 */
function change(cur: number, prev: number | null, against: string): { dir: "up" | "down" | "flat" | "none"; text: string } {
  // Nothing to compare with.
  if (prev === null) return { dir: "none", text: "no earlier stretch to compare" };
  // Nothing before, something now.
  if (prev === 0) return cur === 0 ? { dir: "flat", text: `none, as in ${against}` } : { dir: "up", text: `new: none in ${against}` };
  // The relative change.
  const r = (cur - prev) / prev;
  // Within a per cent either way reads as level.
  if (Math.abs(r) < 0.01) return { dir: "flat", text: `level with ${against}` };
  // Up or down, with its sign.
  return { dir: r > 0 ? "up" : "down", text: `${r > 0 ? "+" : "-"}${pct(Math.abs(r))} on ${against}` };
}

// ---- Pieces --------------------------------------------------------------------

/**
 * A thin line of daily values scaled from zero, with a point that follows the pointer.
 *
 * @param props the values oldest first, a label for assistive technology, and a callback told which day is pointed at
 * @returns the drawing
 */
function Spark(props: { values: number[]; label: string; onPick?: (i: number | null) => void }) {
  // The drawing's own units: wide and short.
  const W = 180;
  const H = 40;
  const PAD = 5;
  // The day pointed at, if any.
  const [at, setAt] = useState<number | null>(null);
  // The tallest value (at least one, so an all-zero line sits on the baseline).
  const top = Math.max(1, ...props.values);
  // Where a day sits across, and a value up.
  const x = (i: number) => (props.values.length <= 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (props.values.length - 1));
  const y = (v: number) => H - PAD - (v / top) * (H - 2 * PAD);
  // The line's points.
  const points = props.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  // Follow the pointer: the nearest day.
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    // Where the pointer is across the drawing, 0 to 1.
    const box = e.currentTarget.getBoundingClientRect();
    const rel = box.width > 0 ? (e.clientX - box.left) / box.width : 0;
    // The nearest day, within the list.
    const i = Math.min(props.values.length - 1, Math.max(0, Math.round(rel * (props.values.length - 1))));
    // Shown here, and told to the tile.
    setAt(i);
    props.onPick?.(i);
  };
  // Leave: nothing pointed at.
  const leave = () => { setAt(null); props.onPick?.(null); };
  // The day whose point is drawn: the one pointed at, or the newest.
  const mark = at ?? props.values.length - 1;
  // Nothing to draw.
  if (props.values.length === 0) return null;
  return (
    <svg className="intel-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={props.label} onPointerMove={move} onPointerDown={move} onPointerLeave={leave}>
      {/* The zero line the values rise from. */}
      <line className="intel-spark-base" x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} />
      {/* The day pointed at. */}
      {at !== null && <line className="intel-spark-cross" x1={x(at)} y1={PAD - 2} x2={x(at)} y2={H - PAD} />}
      {/* The values. */}
      <polyline className="intel-spark-line" points={points} />
      {/* The marked day's point, ringed in the surface colour so it reads over the line. */}
      <circle className="intel-spark-dot" cx={x(mark)} cy={y(props.values[mark] ?? 0)} r={4} />
    </svg>
  );
}

/**
 * A headline figure: its name, the window's total, its change on the stretch before, and its days as a line.
 *
 * @param props the name, the days, the daily values now and before, what "before" covers, and an optional extra line
 * @returns the tile
 */
function Tile(props: { name: string; days: string[]; cur: number[]; prev: number[] | null; against: string; extra?: string; consent?: boolean }) {
  // The day pointed at on the line.
  const [at, setAt] = useState<number | null>(null);
  // The totals.
  const total = props.cur.reduce((a, b) => a + b, 0);
  const before = props.prev ? props.prev.reduce((a, b) => a + b, 0) : null;
  // The change, in words.
  const delta = change(total, before, props.against);
  return (
    <div className="intel-tile">
      <p className="intel-tile-name">{props.name}</p>
      <p className="intel-tile-value">{num(total)}</p>
      {/* While a day is pointed at, its own figure; otherwise the change on the stretch before. */}
      <p className="intel-tile-delta" data-dir={at === null ? delta.dir : "none"}>
        {at === null ? delta.text : `${dayLabel(props.days[at] ?? "")}: ${num(props.cur[at] ?? 0)}`}
      </p>
      <Spark values={props.cur} label={`${props.name}, per day`} onPick={setAt} />
      {/* An extra line: a share, or what the figure rests on. */}
      {props.extra ? <p className="intel-tile-extra">{props.extra}</p> : null}
      {props.consent ? <p className="intel-tile-extra">From readers who said yes.</p> : null}
    </div>
  );
}

/**
 * A ranked table: sortable by any column, a bar under each row's name scaled to the column sorted by, and "Show all".
 *
 * @param props the table's id, columns, rows, the column to sort by at first, and what to say when there are no rows
 * @returns the table
 */
function RankTable(props: { id: string; cols: Col[]; rows: TableRow[]; sort: string; empty: string }) {
  // The column sorted by, and the direction.
  const [by, setBy] = useState(props.sort);
  const [down, setDown] = useState(true);
  // Whether every row is shown.
  const [open, setOpen] = useState(false);
  // The rows in order.
  const sorted = useMemo(() => {
    // Numbers by value, text by alphabet.
    const cmp = (a: TableRow, b: TableRow) => {
      const va = a[by];
      const vb = b[by];
      return typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    };
    // The chosen direction.
    return [...props.rows].sort((a, b) => (down ? -cmp(a, b) : cmp(a, b)));
  }, [props.rows, by, down]);
  // Nothing to list.
  if (props.rows.length === 0) return <p className="intel-empty">{props.empty}</p>;
  // The largest value of the sorted column, for the bars (when it is a number).
  const top = Math.max(0, ...sorted.map((r) => (typeof r[by] === "number" ? (r[by] as number) : 0)));
  // The rows shown.
  const shown = open ? sorted : sorted.slice(0, ROWS_SHOWN);
  // Sort by a column: the same column again turns the order round.
  const pick = (key: string) => { if (key === by) setDown(!down); else { setBy(key); setDown(true); } };
  return (
    <div className="intel-table-wrap" id={props.id}>
      <table className="intel-table">
        <thead>
          <tr>
            {props.cols.map((c) => (
              <th key={c.key} className={c.num ? "intel-num" : undefined} aria-sort={by === c.key ? (down ? "descending" : "ascending") : "none"}>
                <button type="button" className="intel-sort" onClick={() => pick(c.key)}>
                  {c.label}
                  {/* The direction, as a sign beside the heading sorted by. */}
                  <span aria-hidden="true">{by === c.key ? (down ? " ↓" : " ↑") : ""}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={`${String(r[props.cols[0].key])}-${i}`}>
              {props.cols.map((c, ci) => (
                <td key={c.key} className={c.num ? "intel-num" : "intel-name"}>
                  {/* A number, a rate, or the row's name. */}
                  {typeof r[c.key] === "number" ? (c.rate ? pct(r[c.key] as number) : num(r[c.key] as number)) : String(r[c.key] ?? "")}
                  {/* The bar under the name: the sorted column's value against the largest. */}
                  {ci === 0 && top > 0 && typeof r[by] === "number" ? (
                    <span className="intel-bar" aria-hidden="true" style={{ width: `${Math.max(1, Math.round(((r[by] as number) / top) * 100))}%` }} />
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* More rows than are shown. */}
      {sorted.length > ROWS_SHOWN ? (
        <button type="button" className="intel-more" aria-expanded={open} aria-controls={props.id} onClick={() => setOpen(!open)}>
          {open ? "Show fewer" : `Show all ${num(sorted.length)}`}
        </button>
      ) : null}
    </div>
  );
}

/**
 * What a read's state says when it has no rows to show.
 *
 * @param load the read
 * @param none what to say when there is nothing there yet
 * @returns the sentence, or null when the read answered
 */
function stateLine(load: Load<unknown>, none: string): string | null {
  // Answered: the caller shows the rows.
  if (load.state === "ok") return null;
  // Still waiting.
  if (load.state === "loading") return "Loading.";
  // The daily totals' tables are missing from the database: say what to do, whatever the caller's sentence.
  if (load.state === "none" && load.reason === "no_tables") return "The daily totals' tables are not in the database yet: apply migrations/0002_daily_rollups.sql to it.";
  // Nothing there yet.
  if (load.state === "none") return none;
  // Needs the key.
  if (load.state === "locked") return "This needs the operator key: type it in the field at the top.";
  // Failed, with the status when there is one.
  return load.status ? `The server answered ${load.status}. Try again in a minute.` : "The request did not complete. Check the connection and try again.";
}

// ---- The dashboard ----------------------------------------------------------------

/**
 * The dashboard.
 *
 * @returns the page's body
 */
export default function IntelDashboard() {
  // The window.
  const [win, setWin] = useState<Win>("30d");
  // The operator's key: what is typed, and what is in use.
  const [typed, setTyped] = useState("");
  const [key, setKey] = useState("");
  // The reads.
  const [pulse, setPulse] = useState<Load<Pulse>>({ state: "loading" });
  const [interest, setInterest] = useState<Load<Interest>>({ state: "loading" });
  const [paths, setPaths] = useState<Load<Paths>>({ state: "loading" });
  const [sections, setSections] = useState<Load<HistSections>>({ state: "locked" });
  const [movers, setMovers] = useState<Load<HistMovers>>({ state: "locked" });
  const [searches, setSearches] = useState<Load<Searches>>({ state: "locked" });
  const [rolled, setRolled] = useState<Load<Rolled>>({ state: "locked" });
  // The whole-site figures per day, for the scoreboard's rounds and browsers (12/11/2026).
  const [funTotals, setFunTotals] = useState<Load<HistTotals>>({ state: "locked" });
  // The before-and-after comparison: its section, its date, and its answer.
  const [splitSection, setSplitSection] = useState("glossary");
  const [splitCut, setSplitCut] = useState(SWEEP_START);
  const [split, setSplit] = useState<Load<HistSplit> | null>(null);
  // The adding-up in progress: what it says.
  const [backfill, setBackfill] = useState("");

  // The window's length.
  const days = WINDOW_DAYS[win];

  // The key kept for this browser session, read once.
  useEffect(() => {
    try {
      // The stored key, if any.
      const stored = window.sessionStorage.getItem(KEY_STORE) ?? "";
      // In the field and in use.
      setTyped(stored);
      setKey(stored);
    } catch {
      /* no session storage: the key lives in this page only */
    }
  }, []);

  // The public reads, again whenever the window changes.
  useEffect(() => {
    // A later window makes this one's answers stale.
    let stale = false;
    // Waiting.
    setPulse({ state: "loading" });
    setInterest({ state: "loading" });
    setPaths({ state: "loading" });
    // Asked together, each shown as it arrives.
    void ask<Pulse>(`pulse?window=${win}`).then((r) => { if (!stale) setPulse(r); });
    void ask<Interest>(`interest?window=${win}`).then((r) => { if (!stale) setInterest(r); });
    void ask<Paths>(`paths?window=${win}`).then((r) => { if (!stale) setPaths(r); });
    // Left behind.
    return () => { stale = true; };
  }, [win]);

  // The reads that need the key, again whenever the key or the window changes.
  useEffect(() => {
    // No key: all four stay locked.
    if (!key) { setSearches({ state: "locked" }); setRolled({ state: "locked" }); setSections({ state: "locked" }); setMovers({ state: "locked" }); setFunTotals({ state: "locked" }); return; }
    // A later key or window makes these answers stale.
    let stale = false;
    // Waiting.
    setSearches({ state: "loading" });
    setRolled({ state: "loading" });
    setSections({ state: "loading" });
    setMovers({ state: "loading" });
    setFunTotals({ state: "loading" });
    // Asked.
    void ask<Searches>(`searches?window=${win}`, key).then((r) => { if (!stale) setSearches(r); });
    void ask<Rolled>("rollup", key).then((r) => { if (!stale) setRolled(r); });
    // The daily totals: twice the window, so each section has the stretch before to compare with.
    void ask<HistSections>(`history?series=sections&days=${days * 2}`, key).then((r) => { if (!stale) setSections(r); });
    void ask<HistMovers>(`history?series=movers&days=${days}`, key).then((r) => { if (!stale) setMovers(r); });
    // The whole-site figures of the window's full days, for the scoreboard's rounds and browsers.
    void ask<HistTotals>(`history?series=totals&days=${days}`, key).then((r) => { if (!stale) setFunTotals(r); });
    // Left behind.
    return () => { stale = true; };
  }, [key, win, days]);

  // Use the typed key: kept for the session, then the locked reads run.
  const applyKey = useCallback(() => {
    // Without surrounding spaces.
    const k = typed.trim();
    try {
      // Kept, or forgotten when the field was emptied.
      if (k) window.sessionStorage.setItem(KEY_STORE, k); else window.sessionStorage.removeItem(KEY_STORE);
    } catch {
      /* no session storage: the key lives in this page only */
    }
    // In use.
    setKey(k);
  }, [typed]);

  // ---- The window's days, and the stretch before ------------------------------------
  // The days of the window, oldest first, ending today (UTC, as the store's day buckets are).
  const curDays = useMemo(() => Array.from({ length: days }, (_, i) => dayFromToday(i - (days - 1))), [days]);
  // The equal stretch before it; none when the store's three months do not reach that far back.
  const prevDays = useMemo(() => (days * 2 <= 90 ? Array.from({ length: days }, (_, i) => dayFromToday(i - (days * 2 - 1))) : null), [days]);
  // What "before" covers, in words.
  const against = `the ${days} days before`;

  // One series' daily values over a list of days.
  const series = useCallback((name: string, list: string[] | null): number[] | null => {
    // No list, no values.
    if (!list || pulse.state !== "ok") return list ? list.map(() => 0) : null;
    // The series' value per day.
    const perDay = new Map<string, number>();
    if (name === "views") for (const r of pulse.data.views) perDay.set(r.day, (perDay.get(r.day) ?? 0) + r.views);
    else for (const r of pulse.data.events) if (r.kind === name || (name === "search" && r.kind.startsWith("search:"))) perDay.set(r.day, (perDay.get(r.day) ?? 0) + r.n);
    // In the list's order.
    return list.map((d) => perDay.get(d) ?? 0);
  }, [pulse]);

  // ---- Per item: pages read (everyone) beside the interest counts (readers who said yes) --
  const items = useMemo(() => {
    // Per section and item: pages read, uses, shares, rounds started, finished, won, reads to the end, saves to My desk.
    const map = new Map<string, { section: string; item: string; views: number; uses: number; shares: number; starts: number; ends: number; won: number; reads: number; saves: number }>();
    // The entry for a section and item, made on first sight.
    const entry = (section: string, item: string) => {
      const k = `${section}/${item}`;
      let e = map.get(k);
      if (!e) { e = { section, item, views: 0, uses: 0, shares: 0, starts: 0, ends: 0, won: 0, reads: 0, saves: 0 }; map.set(k, e); }
      return e;
    };
    // Pages read, every language added together.
    if (paths.state === "ok") for (const r of paths.data.rows) { const own = ownPage(String(r.path)); if (own) entry(own.section, own.item).views += Number(r.views ?? 0); }
    // The interest counts.
    if (interest.state === "ok") for (const r of interest.data.rows) {
      // Searches and followed links belong to no item's page.
      if (r.kind === "search" || r.kind === "out_red" || r.section === "site") continue;
      const e = entry(r.section, r.item);
      if (r.kind === "tool_use") e.uses += r.n;
      else if (r.kind === "share") e.shares += r.n;
      else if (r.kind === "game_start") e.starts += r.n;
      else if (r.kind === "game_end") { e.ends += r.n; if (r.detail === "won") e.won += r.n; }
      else if (r.kind === "read_end") e.reads += r.n;
      // Saved to My desk (12/11/2026): the strongest sign of interest an item can get.
      else if (r.kind === "save") e.saves += r.n;
    }
    return [...map.values()];
  }, [paths, interest]);

  // The tools' table.
  const toolRows: TableRow[] = useMemo(() => items.filter((e) => e.section === "tools").map((e) => ({
    item: e.item, views: e.views, uses: e.uses, rate: e.views > 0 ? Math.min(1, e.uses / e.views) : 0, shares: e.shares, saves: e.saves,
  })), [items]);
  // The games' table.
  const gameRows: TableRow[] = useMemo(() => items.filter((e) => e.section === "fun").map((e) => ({
    item: e.item, views: e.views, starts: e.starts, ends: e.ends, won: e.ends > 0 ? e.won / e.ends : 0, shares: e.shares, saves: e.saves,
  })), [items]);
  // The reading table: articles and glossary entries.
  const readRows: TableRow[] = useMemo(() => items.filter((e) => e.section === "learn" || e.section === "glossary").map((e) => ({
    item: `${e.section}/${e.item}`, views: e.views, reads: e.reads, rate: e.views > 0 ? Math.min(1, e.reads / e.views) : 0, shares: e.shares, saves: e.saves,
  })), [items]);

  // ---- Sections: the window's pages read per section, with the daily totals' trend when there is one ----
  const sectionCards = useMemo(() => {
    // The window's total per section, from the live list of pages read.
    const totals = new Map<string, number>();
    if (paths.state === "ok") for (const r of paths.data.rows) { const s = sectionOfPath(String(r.path)); totals.set(s, (totals.get(s) ?? 0) + Number(r.views ?? 0)); }
    // All sections together, for each one's share.
    const all = [...totals.values()].reduce((a, b) => a + b, 0);
    // Per section and day, from the daily totals (twice the window).
    const perDay = new Map<string, Map<string, number>>();
    if (sections.state === "ok") for (const r of sections.data.rows) {
      if (!perDay.has(r.section)) perDay.set(r.section, new Map());
      perDay.get(r.section)!.set(r.day, Number(r.views ?? 0));
    }
    // The days the daily totals cover: the window's full days (yesterday back), and the stretch before.
    const cur = Array.from({ length: days }, (_, i) => dayFromToday(i - days));
    const prev = Array.from({ length: days }, (_, i) => dayFromToday(i - days * 2));
    // The ten most read sections; the rest are one line.
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const cards = ranked.slice(0, 10).map(([name, views]) => {
      // The section's days, when the daily totals have any.
      const dayMap = perDay.get(name);
      const line = dayMap ? cur.map((d) => dayMap.get(d) ?? 0) : null;
      const before = dayMap ? prev.reduce((a, d) => a + (dayMap.get(d) ?? 0), 0) : null;
      // Only compare when the stretch before was added up at all.
      const hasBefore = dayMap ? prev.some((d) => dayMap.has(d)) : false;
      return { name, views, share: all > 0 ? views / all : 0, line, delta: line ? change(line.reduce((a, b) => a + b, 0), hasBefore ? before : null, against) : null };
    });
    return { cards, rest: ranked.slice(10).reduce((a, [, v]) => a + v, 0), all };
  }, [paths, sections, days, against]);

  // ---- Searches -------------------------------------------------------------------
  const searchTotals = useMemo(() => {
    // Found something, found nothing.
    let hit = 0;
    let empty = 0;
    if (interest.state === "ok") for (const r of interest.data.rows) if (r.kind === "search") { if (r.item === "empty") empty += r.n; else hit += r.n; }
    return { hit, empty, all: hit + empty };
  }, [interest]);

  // ---- Movers: pages whose reading rose or fell most ---------------------------------
  const moverRows = useMemo(() => {
    // Nothing yet.
    if (movers.state !== "ok") return { up: [] as TableRow[], down: [] as TableRow[] };
    // Each page with its change.
    const rows = movers.data.rows.map((r) => ({ path: r.path, cur: Number(r.cur), prev: Number(r.prev), diff: Number(r.cur) - Number(r.prev) }));
    // The ones that rose, and the ones that fell (their fall as a positive number, so the bars read the same way).
    return {
      up: rows.filter((r) => r.diff > 0).map((r) => ({ path: r.path, prev: r.prev, cur: r.cur, diff: r.diff })),
      down: rows.filter((r) => r.diff < 0).map((r) => ({ path: r.path, prev: r.prev, cur: r.cur, diff: -r.diff })),
    };
  }, [movers]);

  // Compare a section before and after a date.
  const runSplit = useCallback(() => {
    // Waiting.
    setSplit({ state: "loading" });
    // Fourteen days each side at most (fewer when fewer have passed since the date).
    void ask<HistSplit>(`history?series=split&section=${encodeURIComponent(splitSection)}&cut=${encodeURIComponent(splitCut)}&days=14`, key).then(setSplit);
  }, [splitSection, splitCut, key]);

  // Add up the store's three months, fourteen days a call, newest first.
  const runBackfill = useCallback(async () => {
    // Seven calls of fourteen days cover 98 days, more than the store keeps.
    for (let skip = 0; skip < 98; skip += 14) {
      // Where it is.
      setBackfill(`Adding up days ${skip + 1} to ${skip + 14} back from yesterday.`);
      // One call.
      const r = await ask<{ done: unknown[] }>(`rollup?days=14&skip=${skip}`, key, "POST");
      // Stopped at the first refusal, said plainly.
      if (r.state !== "ok") { setBackfill(stateLine(r, "The database is not bound to the Worker, so there is nowhere to keep daily totals.") ?? "Stopped."); return; }
    }
    // Done: the report and the trends read again.
    setBackfill("Done. The trends below now reach as far back as the store does.");
    void ask<Rolled>("rollup", key).then(setRolled);
    void ask<HistSections>(`history?series=sections&days=${days * 2}`, key).then(setSections);
    void ask<HistMovers>(`history?series=movers&days=${days}`, key).then(setMovers);
    void ask<HistTotals>(`history?series=totals&days=${days}`, key).then(setFunTotals);
  }, [key, days]);

  // Whether any interest count exists in the window.
  const anyInterest = interest.state === "ok" && interest.data.kinds.length > 0;
  // The daily totals' sentence when there are none.
  const NO_TOTALS = "No daily totals yet. They begin with the first nightly adding-up after this version is live; the operator key and the button under Data health can add up the last three months at once.";

  return (
    <div className="intel">
      {/* The controls: the window, and the operator's key. */}
      <div className="intel-controls">
        <div className="stats-controls" role="group" aria-label="Window">
          {WINDOWS.map((w) => (
            <button key={w} type="button" className={`stats-window${w === win ? " stats-window--on" : ""}`} aria-pressed={w === win} onClick={() => setWin(w)}>
              {`Last ${WINDOW_DAYS[w]} days`}
            </button>
          ))}
        </div>
        <form className="intel-key" onSubmit={(e) => { e.preventDefault(); applyKey(); }}>
          <label className="intel-key-label" htmlFor="intel-key">Operator key</label>
          <input id="intel-key" className="intel-key-input" type="password" autoComplete="off" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} />
          <button type="submit" className="intel-key-btn">{key && key === typed.trim() ? "In use" : "Use key"}</button>
        </form>
      </div>

      {/* The headline figures. */}
      <section className="intel-block" aria-labelledby="intel-h-pulse">
        <h2 id="intel-h-pulse" className="intel-h2">The window at a glance</h2>
        {stateLine(pulse, "The counting store is not configured for this environment.") ? (
          <p className="intel-empty">{stateLine(pulse, "The counting store is not configured for this environment.")}</p>
        ) : (
          <>
            <div className="intel-tiles">
              <Tile name="Pages read by people" days={curDays} cur={series("views", curDays) ?? []} prev={series("views", prevDays)} against={against} extra="Counted at the server, for every reader." />
              <Tile name="Tools worked with" days={curDays} cur={series("tool_use", curDays) ?? []} prev={series("tool_use", prevDays)} against={against} consent />
              <Tile name="Rounds started" days={curDays} cur={series("game_start", curDays) ?? []} prev={series("game_start", prevDays)} against={against} consent />
              <Tile name="Read to the end" days={curDays} cur={series("read_end", curDays) ?? []} prev={series("read_end", prevDays)} against={against} consent />
              <Tile name="Searches" days={curDays} cur={series("search", curDays) ?? []} prev={series("search", prevDays)} against={against}
                extra={searchTotals.all > 0 ? `${pct(searchTotals.empty / searchTotals.all)} found nothing. From readers who said yes.` : "From readers who said yes."} />
              <Tile name="Shares" days={curDays} cur={series("share", curDays) ?? []} prev={series("share", prevDays)} against={against} consent />
              <Tile name="Links followed to Red Education" days={curDays} cur={series("out_red", curDays) ?? []} prev={series("out_red", prevDays)} against={against} consent />
              {/* Items saved to My desk (12/11/2026), counted once per save. */}
              <Tile name="Saved to My desk" days={curDays} cur={series("save", curDays) ?? []} prev={series("save", prevDays)} against={against} consent />
            </div>
            {!anyInterest && interest.state === "ok" ? (
              <p className="intel-note">No interest counts in this window yet. They begin when readers answer yes to the site&apos;s question, so the seven tiles after the first stay at zero until then.</p>
            ) : null}
            {/* The same days as a table. */}
            <details className="intel-details">
              <summary>Daily figures as a table</summary>
              <RankTable id="intel-t-days" sort="day" empty="No days."
                cols={[{ key: "day", label: "Day" }, { key: "views", label: "Pages read", num: true }, { key: "tool_use", label: "Tools", num: true }, { key: "game_start", label: "Rounds", num: true }, { key: "read_end", label: "Read to end", num: true }, { key: "search", label: "Searches", num: true }, { key: "share", label: "Shares", num: true }, { key: "out_red", label: "Red Education", num: true }, { key: "save", label: "Saves", num: true }]}
                rows={curDays.map((d, i) => ({ day: d, views: series("views", curDays)?.[i] ?? 0, tool_use: series("tool_use", curDays)?.[i] ?? 0, game_start: series("game_start", curDays)?.[i] ?? 0, read_end: series("read_end", curDays)?.[i] ?? 0, search: series("search", curDays)?.[i] ?? 0, share: series("share", curDays)?.[i] ?? 0, out_red: series("out_red", curDays)?.[i] ?? 0, save: series("save", curDays)?.[i] ?? 0 }))} />
            </details>
          </>
        )}
      </section>

      {/* Where reading goes. */}
      <section className="intel-block" aria-labelledby="intel-h-sections">
        <h2 id="intel-h-sections" className="intel-h2">Where reading goes</h2>
        <p className="intel-note">Pages read by people in the window, per section, every language together. The line and the change come from the daily totals, cover full days only, and need the operator key.</p>
        {stateLine(paths, "The counting store is not configured for this environment.") ? (
          <p className="intel-empty">{stateLine(paths, "The counting store is not configured for this environment.")}</p>
        ) : (
          <>
            <div className="intel-sections">
              {sectionCards.cards.map((c) => (
                <div key={c.name} className="intel-sec">
                  <p className="intel-sec-name">/{c.name === "home" ? "" : c.name}</p>
                  <p className="intel-sec-value">{num(c.views)} <span className="intel-sec-share">{pct(c.share)}</span></p>
                  {/* The share as a bar: one hue, the same scale for every section. */}
                  <span className="intel-share" aria-hidden="true"><span className="intel-share-fill" style={{ width: `${Math.max(1, Math.round(c.share * 100))}%` }} /></span>
                  {c.line ? <Spark values={c.line} label={`/${c.name}, pages read per day`} /> : null}
                  {c.delta ? <p className="intel-tile-delta" data-dir={c.delta.dir}>{c.delta.text}</p> : null}
                </div>
              ))}
            </div>
            {sectionCards.rest > 0 ? <p className="intel-note">Every other section together: {num(sectionCards.rest)} ({pct(sectionCards.all > 0 ? sectionCards.rest / sectionCards.all : 0)}).</p> : null}
            {sections.state !== "ok" ? <p className="intel-note">{stateLine(sections, NO_TOTALS)}</p> : null}
          </>
        )}
      </section>

      {/* Per item. */}
      <section className="intel-block" aria-labelledby="intel-h-items">
        <h2 id="intel-h-items" className="intel-h2">What is used, item by item</h2>
        <p className="intel-note">Pages read count every reader; uses, rounds, reads to the end, shares and saves to My desk come only from readers who said yes. A rate here is therefore a floor: use it to compare one item with another, not as a share of all readers.</p>
        {interest.state === "ok" && interest.data.cut ? <p className="intel-note">The list of interest counts reached its row limit, so the least used items are missing from these tables.</p> : null}
        <div className="intel-grid">
          <div className="intel-panel">
            <h3 className="intel-h3">Tools</h3>
            <RankTable id="intel-t-tools" sort="uses" empty={stateLine(paths, "Nothing counted yet.") ?? "No tool page was read in this window."}
              cols={[{ key: "item", label: "Tool" }, { key: "views", label: "Pages read", num: true }, { key: "uses", label: "Worked with", num: true }, { key: "rate", label: "Use rate", num: true, rate: true }, { key: "shares", label: "Shares", num: true }, { key: "saves", label: "Saved", num: true }]}
              rows={toolRows} />
          </div>
          <div className="intel-panel">
            <h3 className="intel-h3">Puzzles and games</h3>
            <RankTable id="intel-t-games" sort="starts" empty={stateLine(paths, "Nothing counted yet.") ?? "No game page was read in this window."}
              cols={[{ key: "item", label: "Game" }, { key: "views", label: "Pages read", num: true }, { key: "starts", label: "Started", num: true }, { key: "ends", label: "Finished", num: true }, { key: "won", label: "Won", num: true, rate: true }, { key: "shares", label: "Shares", num: true }, { key: "saves", label: "Saved", num: true }]}
              rows={gameRows} />
          </div>
          <div className="intel-panel intel-panel--wide">
            <h3 className="intel-h3">Articles and glossary entries</h3>
            <RankTable id="intel-t-reads" sort="views" empty={stateLine(paths, "Nothing counted yet.") ?? "No article or entry was read in this window."}
              cols={[{ key: "item", label: "Item" }, { key: "views", label: "Pages read", num: true }, { key: "reads", label: "Read to the end", num: true }, { key: "rate", label: "Read-through", num: true, rate: true }, { key: "shares", label: "Shares", num: true }, { key: "saves", label: "Saved", num: true }]}
              rows={readRows} />
          </div>
        </div>
      </section>

      {/* Searches. */}
      <section className="intel-block" aria-labelledby="intel-h-search">
        <h2 id="intel-h-search" className="intel-h2">What readers looked for and did not find</h2>
        <p className="intel-note">
          {searchTotals.all > 0
            ? `${num(searchTotals.all)} searches counted in the window: ${num(searchTotals.hit)} found something, ${num(searchTotals.empty)} found nothing (${pct(searchTotals.empty / searchTotals.all)}).`
            : "No searches counted in this window yet."}
          {" "}The words below are those of searches that found nothing, kept only when they were a few plain words. They are a list of what to write next, and they are never published.
        </p>
        {stateLine(searches, "The counting store is not configured for this environment.") ? (
          <p className="intel-empty">{stateLine(searches, "The counting store is not configured for this environment.")}</p>
        ) : (
          <RankTable id="intel-t-words" sort="n" empty="No words kept in this window."
            cols={[{ key: "term", label: "Words" }, { key: "locale", label: "Language" }, { key: "n", label: "Times", num: true }]}
            rows={searches.state === "ok" ? searches.data.rows.map((r) => ({ term: r.term, locale: r.locale, n: r.n })) : []} />
        )}
      </section>

      {/* Movers. */}
      <section className="intel-block" aria-labelledby="intel-h-movers">
        <h2 id="intel-h-movers" className="intel-h2">What moved</h2>
        <p className="intel-note">Pages whose reading changed most between the last {days} full days and the {days} before, from the daily totals.</p>
        {stateLine(movers, NO_TOTALS) ? (
          <p className="intel-empty">{stateLine(movers, NO_TOTALS)}</p>
        ) : (
          <div className="intel-grid">
            <div className="intel-panel">
              <h3 className="intel-h3">Rose most</h3>
              <RankTable id="intel-t-up" sort="diff" empty="Nothing rose."
                cols={[{ key: "path", label: "Page" }, { key: "prev", label: "Before", num: true }, { key: "cur", label: "Now", num: true }, { key: "diff", label: "Gain", num: true }]}
                rows={moverRows.up} />
            </div>
            <div className="intel-panel">
              <h3 className="intel-h3">Fell most</h3>
              <RankTable id="intel-t-down" sort="diff" empty="Nothing fell."
                cols={[{ key: "path", label: "Page" }, { key: "prev", label: "Before", num: true }, { key: "cur", label: "Now", num: true }, { key: "diff", label: "Loss", num: true }]}
                rows={moverRows.down} />
            </div>
          </div>
        )}
      </section>

      {/* Before and after a date. */}
      <section className="intel-block" aria-labelledby="intel-h-split">
        <h2 id="intel-h-split" className="intel-h2">Before and after a change</h2>
        <p className="intel-note">Did a round of work change what is read? Pick a section and the day the work went live: the same number of full days on each side are compared, fourteen at most.</p>
        <form className="intel-split" onSubmit={(e) => { e.preventDefault(); runSplit(); }}>
          <label className="intel-key-label" htmlFor="intel-split-section">Section</label>
          <select id="intel-split-section" className="intel-key-input" value={splitSection} onChange={(e) => setSplitSection(e.target.value)}>
            {["glossary", "learn", "tools", "fun", "people", "home"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="intel-key-label" htmlFor="intel-split-cut">Live from</label>
          <input id="intel-split-cut" className="intel-key-input" type="date" value={splitCut} max={dayFromToday(0)} onChange={(e) => setSplitCut(e.target.value)} />
          <button type="submit" className="intel-key-btn">Compare</button>
        </form>
        {split === null ? null : stateLine(split, NO_TOTALS) ? (
          <p className="intel-empty">{stateLine(split, NO_TOTALS)}</p>
        ) : split.state === "ok" && split.data.days === 0 ? (
          <p className="intel-empty">No full day has passed since that date yet. Come back tomorrow.</p>
        ) : split.state === "ok" ? (
          <>
            <p className="intel-note">
              {`${split.data.days} full days each side (${dayLabel(split.data.from)} to ${dayLabel(split.data.to)}): `}
              {`${num(split.data.rows.reduce((a, r) => a + Number(r.prev), 0))} pages read before, ${num(split.data.rows.reduce((a, r) => a + Number(r.cur), 0))} after. `}
              {change(split.data.rows.reduce((a, r) => a + Number(r.cur), 0), split.data.rows.reduce((a, r) => a + Number(r.prev), 0), "the days before").text}.
            </p>
            <RankTable id="intel-t-split" sort="diff" empty="No page of that section was read on those days."
              cols={[{ key: "path", label: "Page" }, { key: "prev", label: "Before", num: true }, { key: "cur", label: "After", num: true }, { key: "diff", label: "Change", num: true }]}
              rows={split.data.rows.map((r) => ({ path: r.path, prev: Number(r.prev), cur: Number(r.cur), diff: Number(r.cur) - Number(r.prev) }))} />
          </>
        ) : null}
      </section>

      {/* The scoreboard per day: rounds published and the browsers that published them (12/11/2026). */}
      <section className="intel-block" aria-labelledby="intel-h-board">
        <h2 id="intel-h-board" className="intel-h2">The scoreboard per day</h2>
        <p className="intel-note">Rounds published to the /dev/fun scoreboard each puzzle day, and unique browsers: how many browsers published at least one round that day. Each browser counts once a day; it is not a count of people (a phone and a laptop count as two, and a private window or cleared site data counts again). From the daily totals, so full days only; a day before a figure began shows no data.</p>
        {stateLine(funTotals, "The database is not bound to the Worker, so there is nowhere to keep daily totals.") ? (
          <p className="intel-empty">{stateLine(funTotals, "The database is not bound to the Worker, so there is nowhere to keep daily totals.")}</p>
        ) : funTotals.state === "ok" ? (
          <RankTable id="intel-t-board" sort="day" empty={NO_TOTALS}
            cols={[{ key: "day", label: "Day" }, { key: "rounds", label: "Rounds", num: true }, { key: "browsers", label: "Unique browsers", num: true }, { key: "per", label: "Rounds per browser", num: true }]}
            rows={(() => {
              // Each day's two figures, by name.
              const byDay = new Map<string, { rounds?: number; browsers?: number }>();
              for (const r of funTotals.data.rows) {
                // Only the scoreboard's two.
                if (r.metric !== "fun_rounds" && r.metric !== "fun_browsers") continue;
                // The day's entry, made on first sight, with the figure set.
                const e = byDay.get(r.day) ?? {};
                if (r.metric === "fun_rounds") e.rounds = Number(r.value); else e.browsers = Number(r.value);
                byDay.set(r.day, e);
              }
              // A row per day; a figure the day does not have reads "no data", never zero.
              return [...byDay.entries()].map(([day, e]) => ({
                day,
                rounds: e.rounds ?? "no data",
                browsers: e.browsers ?? "no data",
                // Up to two decimals, as text (the table's numbers are whole), when both figures are there and some browser published.
                per: e.rounds !== undefined && e.browsers ? (e.rounds / e.browsers).toLocaleString("en-GB", { maximumFractionDigits: 2 }) : "no data",
              }));
            })()} />
        ) : null}
      </section>

      {/* Data health. */}
      <section className="intel-block" aria-labelledby="intel-h-health">
        <h2 id="intel-h-health" className="intel-h2">Data health</h2>
        <p className="intel-note">The counting store keeps three months. Once a night the Worker adds the previous day up into the site&apos;s database, where the totals are kept for 760 days; that is what the trends, the movers and the comparison above read.</p>
        {stateLine(rolled, "The database is not bound to the Worker, so there is nowhere to keep daily totals.") ? (
          <p className="intel-empty">{stateLine(rolled, "The database is not bound to the Worker, so there is nowhere to keep daily totals.")}</p>
        ) : rolled.state === "ok" ? (
          <>
            <p className="intel-note">
              {rolled.data.rolled.length > 0
                ? `${rolled.data.rolled.length} of the last 90 days are added up, from ${dayLabel(rolled.data.rolled[0].day)} to ${dayLabel(rolled.data.rolled[rolled.data.rolled.length - 1].day)}. The newest full day is ${dayLabel(rolled.data.to)}.`
                : `No day is added up yet. The newest full day is ${dayLabel(rolled.data.to)}.`}
            </p>
            <button type="button" className="intel-key-btn" onClick={() => void runBackfill()}>Add up the last three months now</button>
            {/* What the adding-up is doing, announced as it changes. */}
            <p className="intel-note" role="status" aria-live="polite">{backfill}</p>
          </>
        ) : null}
      </section>
    </div>
  );
}
