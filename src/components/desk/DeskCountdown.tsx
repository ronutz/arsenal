"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskCountdown.tsx
// ----------------------------------------------------------------------------
// THE EXAM COUNTDOWN WIDGET (PLAN-personal-desk-20261112, section 3.6: "Exam
// countdown (a date the reader types, kept locally)"). The reader types an
// exam's name and picks its date; the widget says how many days are left
// ("23 days to go", "Today", "2 days ago"), counted in the reader's own
// calendar days, never times. The name and the date are this widget's own
// settings in the desk's layout (src/lib/desk/store.ts), kept in this browser
// and, like the rest of the layout, inside the encrypted copy when the reader
// syncs; the widget says so in words. The name field suggests the site's
// certification guides (from the site index) and accepts any text. The page
// may hold several countdowns, one per exam.
//
// EXAM PACE (second improvement pass, 16/11/2026): a countdown may name one of
// the reader's paths. It then says how many of the path's items are left and
// the pace that finishes them by the exam (items left over days left, as a
// day and, from two weeks out, as a week): plain arithmetic, no verdict.
// ============================================================================

// React's state, ids and the node type (the pace's link).
import { useId, useState, type ReactNode } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// The desk's layout write, today and the day check.
import { isDay, setLayoutWidgets, today, type DeskData, type DeskWidget } from "@/lib/desk/store";
// A widget's own settings.
import { setWidgetSettingsIn } from "@/lib/desk/layout";
// The index, for the guides' names.
import type { SiteIndex } from "@/lib/desk/siteIndex";
// A path's name as the desk shows it.
import { titleOf } from "./DeskItemRow";
// The language's tag for Intl (the exam's day, and the pace's numbers).
import { intlLocale } from "@/i18n/locales";

/** The longest exam name kept. */
const NAME_MAX = 80;

/**
 * Whole days from one day to another (both YYYY-MM-DD), counted at noon UTC so no time zone moves them.
 *
 * @param from the first day
 * @param to the second day
 * @returns to minus from, in days
 */
export function daysBetween(from: string, to: string): number {
  // Both at noon UTC, their difference in days.
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

/**
 * A day in full, with its weekday, in the page's language ("Wednesday, 9 December 2026"), from noon UTC so no zone
 * moves it.
 *
 * @param day YYYY-MM-DD
 * @param locale the page's language
 * @returns the words
 */
export function longDay(day: string, locale: string): string {
  // The language's long date with the weekday.
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

/**
 * The widget.
 *
 * @param props the desk, the widget and the index
 * @returns the widget's content
 */
export default function DeskCountdown(props: { data: DeskData; widget: DeskWidget; index: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The page's language, for the date.
  const locale = useLocale();
  // Ids for the fields.
  const uid = useId();
  // The stored name and date.
  const name = typeof props.widget.settings.exam === "string" ? props.widget.settings.exam : "";
  // The stored date, when well formed.
  const date = typeof props.widget.settings.date === "string" && isDay(props.widget.settings.date) ? props.widget.settings.date : "";
  // The stored path's id, when one is named.
  const pathId = typeof props.widget.settings.path === "string" ? props.widget.settings.path : "";
  // Whether the form is open (always, until a date is set).
  const [editing, setEditing] = useState(false);
  // The fields while editing.
  const [draft, setDraft] = useState({ exam: name, date, path: pathId });
  /**
   * A path's name as shown on the desk: what the reader typed, or its collection's title, or "Untitled path".
   *
   * @param p the path
   * @returns the name
   */
  const nameOfPath = (p: DeskData["paths"][number]) => p.name || (p.from ? titleOf(props.index, p.from.id) : null) || t("paths.untitled");
  // A missing date, said in words.
  const [bad, setBad] = useState(false);

  /** Keep the name and the date in the widget's settings. */
  const save = () => {
    // A date is needed.
    if (!isDay(draft.date)) { setBad(true); return; }
    // The new layout, or nothing when unchanged.
    const next = setWidgetSettingsIn(props.data.layout.widgets, props.widget.id, { exam: draft.exam.trim().slice(0, NAME_MAX), date: draft.date, path: draft.path || null });
    // Written.
    if (next) setLayoutWidgets(next);
    // Closed.
    setEditing(false);
    // No warning.
    setBad(false);
  };

  // The form: when no date is set yet, or when changing.
  if (!date || editing) {
    // The guides' names as suggestions, once the index is in.
    const guides = props.index ? props.index.items.filter((it) => it.k === "guide").map((it) => it.t) : [];
    // The form.
    return (
      <form
        className="desk-countdown-form"
        onSubmit={(e) => {
          // Not a page load.
          e.preventDefault();
          // Kept.
          save();
        }}
      >
        {!date && <p className="desk-empty">{t("countdown.empty")}</p>}
        <label className="desk-picker-label" htmlFor={`${uid}-exam`}>{t("countdown.name")}</label>
        <input id={`${uid}-exam`} className="desk-input" type="text" list={`${uid}-guides`} maxLength={NAME_MAX} value={draft.exam} placeholder={t("countdown.namePlaceholder")} onChange={(e) => setDraft({ ...draft, exam: e.target.value })} />
        <datalist id={`${uid}-guides`}>
          {guides.map((g) => <option key={g} value={g} />)}
        </datalist>
        <label className="desk-picker-label" htmlFor={`${uid}-date`}>{t("countdown.date")}</label>
        <input id={`${uid}-date`} className="desk-input" type="date" value={draft.date} aria-invalid={bad} aria-describedby={bad ? `${uid}-bad` : undefined} onChange={(e) => { setDraft({ ...draft, date: e.target.value }); setBad(false); }} />
        {bad && <p className="desk-alert" id={`${uid}-bad`} role="status"><span aria-hidden="true">{"⚠"}</span> {t("countdown.badDate")}</p>}
        {/* One of the reader's paths to finish by then (only when there are paths). */}
        {props.data.paths.length > 0 && (
          <>
            <label className="desk-picker-label" htmlFor={`${uid}-path`}>{t("countdown.path")}</label>
            <select id={`${uid}-path`} className="desk-input" value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })}>
              <option value="">{t("countdown.pathNone")}</option>
              {props.data.paths.map((p) => <option key={p.id} value={p.id}>{nameOfPath(p)}</option>)}
            </select>
          </>
        )}
        <div className="desk-controls-row">
          <button type="submit" className="desk-btn">{t("countdown.save")}</button>
          {date && <button type="button" className="desk-btn desk-btn--quiet" onClick={() => { setEditing(false); setBad(false); }}>{t("countdown.cancel")}</button>}
        </div>
        <p className="desk-muted">{t("countdown.kept")}</p>
      </form>
    );
  }

  // The days left (negative once it has passed).
  const left = daysBetween(today(), date);
  // The named path, when it still exists.
  const path = pathId ? props.data.paths.find((p) => p.id === pathId) ?? null : null;
  // Its items not yet read.
  const itemsLeft = path ? path.items.filter((i) => !(i in props.data.read)).length : 0;
  // Numbers with at most one decimal, in the page's language.
  const nf = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 });
  // Whether the paths widget is on the page (the path's name then links to it).
  const pathsShown = props.data.layout.widgets.some((w) => w.type === "paths");
  /**
   * The path's name, linked to the path in My paths when that widget is on the page.
   *
   * @param chunks the name, as the message places it
   * @returns the name or the link
   */
  const link = (chunks: ReactNode) => (pathsShown && path ? <a className="desk-link" href={`#path=${path.id}`}>{chunks}</a> : <strong>{chunks}</strong>);
  // The countdown.
  return (
    <div className="desk-countdown">
      <p className="desk-countdown-exam">{name || t("countdown.unnamed")}</p>
      <p className="desk-countdown-days">
        {left === 0 ? t("countdown.today") : left > 0 ? t("countdown.days", { count: left }) : t("countdown.ago", { count: -left })}
      </p>
      {/* Two weeks or more: the same time in weeks and days, the way an exam's preparation is planned (increment E). */}
      {left >= 14 && <p className="desk-countdown-weeks">{t("countdown.weeks", { weeks: Math.floor(left / 7), days: left % 7 })}</p>}
      {/* The day with its weekday, in the page's language ("On Wednesday, 9 December 2026"). */}
      <p className="desk-muted">{t("countdown.on", { date: longDay(date, locale) })}</p>
      {/* The pace: the path's items left, and what finishes them by the exam (only while the exam is ahead). */}
      {path && (
        <div className="desk-countdown-pace">
          <p className="desk-countdown-left">{t.rich("countdown.left", { count: itemsLeft, path: nameOfPath(path), link })}</p>
          {itemsLeft > 0 && left > 0 && (
            <p className="desk-muted">
              {left >= 14
                ? t("countdown.paceWeek", { perDay: nf.format(itemsLeft / left), perWeek: nf.format((itemsLeft / left) * 7) })
                : t("countdown.pace", { perDay: nf.format(itemsLeft / left) })}
            </p>
          )}
        </div>
      )}
      <p className="desk-widget-action">
        <button type="button" className="desk-btn desk-btn--quiet" onClick={() => { setDraft({ exam: name, date, path: path ? path.id : "" }); setEditing(true); }}>{t("countdown.change")}</button>
      </p>
    </div>
  );
}
