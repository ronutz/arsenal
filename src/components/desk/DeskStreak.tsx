"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskStreak.tsx
// ----------------------------------------------------------------------------
// THE READING STREAK WIDGET (the site owner, 12/11/2026 15:22: "Reading
// streaks and milestones, all local and portable"). From the desk's reading
// record (src/lib/desk/store.ts, DeskReading: days only, never times):
//   - the days read in a row, counting today or, before today's first read,
//     yesterday (a run is not over until a whole day has passed without one);
//   - the longest run, a reading calendar (increment E: as many whole weeks
//     as the widget has room for, from 8 to 53, weeks as columns, today
//     ringed; it replaced a strip of the last fourteen days), the days read
//     among those shown, and the number of items read;
//   - the milestones reached, with their days, and the next one to reach.
// A milestone reached is celebrated once, quietly: one line in words with a
// sign, which fades in only when the reader has not asked for reduced motion.
// No sound, no notification, no nagging; when a run ends nothing says so: the
// widget says that every day of reading counts, and a rest day is just a day
// (its sign is an empty ring, its word "rest"). "A series completed" is told
// here, where the site index says what each series holds.
// ============================================================================

// React's state, effects, memo and refs.
import { useEffect, useMemo, useRef, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// The desk's record, its runs and milestones.
import {
  deskMilestones, longestRun, noteMilestones, runEndingAt, takeUnseenMilestones, today, MILESTONES,
  type DeskData, type MilestoneId,
} from "@/lib/desk/store";
// Identifiers.
import { COLLECTION_KINDS, type ItemId } from "@/lib/desk/ids";
// The index.
import type { SiteIndex } from "@/lib/desk/siteIndex";
// Dates in the page's language.
import { formatDay } from "./DeskItemRow";
// The language's tag for Intl (month and weekday names).
import { intlLocale } from "@/i18n/locales";
// The reading calendar's weeks and the week's first day (pure, checked by check-desk-store).
import { readingCalendar, thisWeek, weekStartOf, type CalendarDay } from "@/lib/desk/calendar";

/** The calendar's weeks before the widget's width is known, and the fewest and most it shows. */
const WEEKS_FIRST = 12;
/** The fewest weeks. */
const WEEKS_MIN = 8;
/** The most: a year (the record keeps 400 days). */
const WEEKS_MAX = 53;
/** One week's column in CSS pixels: a 12 px day and a 3 px gap (kept equal to the stylesheet's --desk-cal-cell and gap). */
const WEEK_PX = 15;
/** The weekday names' column and its gap, in CSS pixels. */
const LABEL_PX = 36;


/**
 * The milestones celebrated during this page view: taken once from the desk (and marked shown there), kept here so a
 * widget drawn again on the same page (a remount) still shows the line; the next page view does not.
 */
let celebratedHere: MilestoneId[] = [];

/** The read-count milestones and their thresholds, for "the next one". */
const COUNT_STEPS: readonly [MilestoneId, number][] = [["read10", 10], ["read50", 50], ["read100", 100]];

/**
 * A day some number of days before another (noon UTC, so no zone moves it).
 *
 * @param day the starting day
 * @param n how many days back
 * @returns the earlier day
 */
function back(day: string, n: number): string {
  // Shifted and cut to YYYY-MM-DD.
  return new Date(Date.parse(`${day}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Whether the index has a series, training series or reading path every member of which is read.
 *
 * @param index the site index
 * @param read the read marks
 * @returns true when one is complete
 */
export function anySeriesComplete(index: SiteIndex, read: Record<string, string>): boolean {
  // A collection of at least two items, all marked read.
  return index.items.some((it) => COLLECTION_KINDS.includes(it.k) && (it.m?.length ?? 0) >= 2 && (it.m as ItemId[]).every((m) => m in read));
}

/**
 * The widget.
 *
 * @param props the desk and the index
 * @returns the widget's content
 */
export default function DeskStreak(props: { data: DeskData; index: SiteIndex | null }) {
  // The words of the page and of the milestones.
  const t = useTranslations("desk");
  // The milestones' names (shared with the item pages' controls, under deskItem.milestones).
  const ti = useTranslations("deskItem");
  // One milestone's name.
  const tm = (id: MilestoneId) => ti(`milestones.${id}`);
  // The page's language, for dates.
  const locale = useLocale();
  // The milestones being celebrated now (this page view's).
  const [celebrate, setCelebrate] = useState<MilestoneId[]>(() => celebratedHere);
  // The record.
  const r = props.data.reading;
  // The calendar's frame, measured for how many weeks fit.
  const calRef = useRef<HTMLDivElement>(null);
  // The weeks shown.
  const [weeks, setWeeks] = useState(WEEKS_FIRST);
  // Measured once drawn and whenever the widget's width changes (a phone turned, the layout arranged).
  useEffect(() => {
    // The frame.
    const el = calRef.current;
    // Not drawn, or no observer in this browser (the first count stays).
    if (!el || typeof ResizeObserver === "undefined") return;
    // Weeks for a width.
    const fit = (w: number) => Math.max(WEEKS_MIN, Math.min(WEEKS_MAX, Math.floor((w - LABEL_PX) / WEEK_PX)));
    // Watched.
    const ro = new ResizeObserver((entries) => {
      // The frame's width.
      const w = entries[0]?.contentRect.width ?? 0;
      // Set only when it changes (no loop: the frame's width does not depend on the calendar).
      if (w > 0) setWeeks((cur) => (fit(w) === cur ? cur : fit(w)));
    });
    // Started.
    ro.observe(el);
    // Stopped.
    return () => ro.disconnect();
  }, []);

  // Milestones the desk reached (a path finished by adding a read item, an older desk's counts) and, once the index
  // is in, a series completed; then the ones not yet celebrated, shown once.
  useEffect(() => {
    // The desk's own.
    const ids: MilestoneId[] = deskMilestones(props.data);
    // A series completed.
    if (props.index && anySeriesComplete(props.index, props.data.read)) ids.push("series1");
    // Recorded.
    noteMilestones(ids);
    // The ones to celebrate, taken (marked shown) at once.
    const fresh = takeUnseenMilestones();
    // Kept for this page view.
    if (fresh.length > 0) celebratedHere = [...celebratedHere, ...fresh.filter((x) => !celebratedHere.includes(x))];
    // Shown.
    setCelebrate(celebratedHere);
    // Run when the index arrives and when the read marks change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.index, props.data.read]);

  // The figures.
  const figures = useMemo(() => {
    // Today and the days as a set.
    const day = today();
    // The set.
    const set = new Set(r.days);
    // The run: ending today, or yesterday before today's first read.
    const current = set.has(day) ? runEndingAt(set, day) : runEndingAt(set, back(day, 1));
    // The longest.
    const longest = Math.max(r.best, longestRun(r.days));
    // The calendar, weeks as columns, oldest first.
    const calendar = readingCalendar(r.days, day, weeks, weekStartOf(locale));
    // The days it shows (up to today) and the reading days among them.
    const shown = calendar.flat().filter((x): x is NonNullable<CalendarDay> => x !== null);
    // Items read.
    const items = Object.keys(props.data.read).length;
    // The next count milestone.
    const next = COUNT_STEPS.find(([id]) => !r.marks[id]);
    // The current week so far (follow-up to increment E: a count that only grows during the week).
    const week = thisWeek(r.days, props.data.read, day, weekStartOf(locale));
    // All of it.
    return { current, longest, calendar, shownDays: shown.length, shownRead: shown.filter((x) => x.on).length, items, next, week };
  }, [r, props.data.read, weeks, locale]);

  // Month names over the columns where a month begins (at least three columns apart, so two never touch), and the
  // names of Monday, Wednesday and Friday in the margin (the other rows stay blank, as on a wall calendar's margin).
  const labels = useMemo(() => {
    // Short month names.
    const month = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", timeZone: "UTC" });
    // Short weekday names (narrow ones repeat: T and T, S and S).
    const wd = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", timeZone: "UTC" });
    // The month of a column's first day.
    const monthOf = (col: CalendarDay[]) => (col[0] ? col[0].d.slice(0, 7) : "");
    // The columns' labels.
    const months: string[] = [];
    // The column of the last label.
    let last = -3;
    // Each column.
    figures.calendar.forEach((col, c) => {
      // A month begins here (or the calendar does, when the next month is not about to).
      const begins = c === 0 ? figures.calendar.slice(1, 3).every((x) => monthOf(x) === monthOf(col)) : monthOf(col) !== monthOf(figures.calendar[c - 1]);
      // Labelled when it begins a month and the last label is three columns back.
      if (begins && col[0] && c - last >= 3) { months.push(month.format(new Date(`${col[0].d}T12:00:00Z`))); last = c; } else months.push("");
    });
    // The weekday names of Monday, Wednesday and Friday, whichever rows they fall on (from the first, full, column).
    const weekdays = (figures.calendar[0] ?? []).map((x) => (x && [1, 3, 5].includes(new Date(`${x.d}T12:00:00Z`).getUTCDay()) ? wd.format(new Date(`${x.d}T12:00:00Z`)) : ""));
    // Both.
    return { months, weekdays };
  }, [figures.calendar, locale]);

  // The milestones reached, in the page's order.
  const reached = MILESTONES.filter((id) => r.marks[id]);
  // The widget.
  return (
    <div className="desk-streak">
      {/* A milestone reached: one line, once, in words with a sign. */}
      {celebrate.length > 0 && (
        <p className="desk-celebrate" role="status">
          <span className="desk-sign" aria-hidden="true">{"✦"}</span> {t("streak.celebrate", { names: celebrate.map((id) => tm(id)).join(", ") })}
        </p>
      )}
      {/* The run, or the words that keep a rest from reading as a failure. */}
      <p className="desk-streak-now">{figures.current > 0 ? t("streak.current", { count: figures.current }) : t("streak.none")}</p>
      <p className="desk-muted">{t("streak.longest", { count: figures.longest })}</p>
      {/* The reading calendar: a filled square for a reading day, an outlined one for a rest day, today ringed; the
          sentence under it carries the same in words (the squares are hidden from assistive technology). */}
      <div className="desk-cal-frame" ref={calRef}>
        <div className="desk-cal" aria-hidden="true" style={{ gridTemplateColumns: `auto repeat(${figures.calendar.length}, var(--desk-cal-cell))` }}>
          {/* The month names' row, over the columns. */}
          <span className="desk-cal-corner" />
          {labels.months.map((m, c) => <span key={`m${c}`} className="desk-cal-month" style={{ gridColumn: c + 2, gridRow: 1 }}>{m}</span>)}
          {/* The weekday names' column. */}
          {labels.weekdays.map((w, i) => <span key={`w${i}`} className="desk-cal-wd" style={{ gridColumn: 1, gridRow: i + 2 }}>{w}</span>)}
          {/* The days. */}
          {figures.calendar.map((col, c) =>
            col.map((x, i) =>
              x ? (
                <span
                  key={x.d}
                  className={`desk-cal-day${x.on ? " desk-cal-day--on" : ""}${x.today ? " desk-cal-day--today" : ""}`}
                  style={{ gridColumn: c + 2, gridRow: i + 2 }}
                  title={`${formatDay(x.d, locale)}: ${x.on ? t("streak.read") : t("streak.rest")}`}
                />
              ) : null,
            ),
          )}
        </div>
        {/* The key: what a filled and an outlined square mean. */}
        <p className="desk-cal-key" aria-hidden="true">
          <span className="desk-cal-day desk-cal-day--on" /> {t("streak.read")} <span className="desk-cal-day" /> {t("streak.rest")}
        </p>
      </div>
      {/* This week so far: reading days and items, in words (never a comparison with an earlier week). */}
      <p className="desk-streak-week">{t("streak.thisWeek", { days: figures.week.days, items: figures.week.items })}</p>
      <p className="desk-muted">{t("streak.recent", { count: figures.shownRead, days: figures.shownDays })} {t("streak.items", { count: figures.items })}</p>
      {/* Milestones: those reached with their days, and the next count to reach. */}
      {(reached.length > 0 || figures.next) && (
        <div className="desk-streak-marks">
          <p className="desk-label">{t("streak.milestones")}</p>
          <ul className="desk-list">
            {reached.map((id) => (
              <li key={id} className="desk-row">
                <span className="desk-chip desk-chip--done"><span aria-hidden="true">{"✦"}</span> {tm(id)}</span>
                <span className="desk-muted mono">{formatDay(r.marks[id]?.d ?? today(), locale)}</span>
              </li>
            ))}
            {figures.next && (
              <li className="desk-row">
                <span className="desk-chip"><span aria-hidden="true">{"○"}</span> {t("streak.next", { name: tm(figures.next[0]) })}</span>
                <span className="desk-muted">{t("streak.toGo", { count: Math.max(0, figures.next[1] - figures.items) })}</span>
                {/* How far along, as a bar on the same scale as the paths' (the words beside it carry it). */}
                <span className="desk-bar desk-streak-next-bar" aria-hidden="true">
                  <span className="desk-bar-fill" style={{ width: `${Math.min(100, Math.round((figures.items / figures.next[1]) * 100))}%` }} />
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
      <p className="desk-muted">{t("streak.kept")}</p>
    </div>
  );
}
