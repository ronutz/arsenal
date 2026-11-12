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
//   - the longest run, the last fourteen days as read or rest, and the number
//     of items read;
//   - the milestones reached, with their days, and the next one to reach.
// A milestone reached is celebrated once, quietly: one line in words with a
// sign, which fades in only when the reader has not asked for reduced motion.
// No sound, no notification, no nagging; when a run ends nothing says so: the
// widget says that every day of reading counts, and a rest day is just a day
// (its sign is an empty ring, its word "rest"). "A series completed" is told
// here, where the site index says what each series holds.
// ============================================================================

// React's state, effects and memo.
import { useEffect, useMemo, useState } from "react";
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

/** How many recent days the strip shows. */
const STRIP_DAYS = 14;

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
    // The strip, oldest first.
    const strip = Array.from({ length: STRIP_DAYS }, (_, i) => back(day, STRIP_DAYS - 1 - i)).map((d) => ({ d, on: set.has(d) }));
    // Items read.
    const items = Object.keys(props.data.read).length;
    // The next count milestone.
    const next = COUNT_STEPS.find(([id]) => !r.marks[id]);
    // All of it.
    return { current, longest, strip, items, next };
  }, [r, props.data.read]);

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
      {/* The last fourteen days: a filled dot for a reading day, a ring for a rest day; the words carry it. */}
      <p className="desk-streak-strip" aria-hidden="true">
        {figures.strip.map((x) => (
          <span key={x.d} className={`desk-streak-day${x.on ? " desk-streak-day--on" : ""}`} title={`${formatDay(x.d, locale)}: ${x.on ? t("streak.read") : t("streak.rest")}`}>{x.on ? "●" : "○"}</span>
        ))}
      </p>
      <p className="desk-muted">{t("streak.recent", { count: figures.strip.filter((x) => x.on).length, days: STRIP_DAYS })} {t("streak.items", { count: figures.items })}</p>
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
              </li>
            )}
          </ul>
        </div>
      )}
      <p className="desk-muted">{t("streak.kept")}</p>
    </div>
  );
}
