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
// ============================================================================

// React's state and ids.
import { useId, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// The desk's layout write, today and the day check.
import { isDay, setLayoutWidgets, today, type DeskData, type DeskWidget } from "@/lib/desk/store";
// A widget's own settings.
import { setWidgetSettingsIn } from "@/lib/desk/layout";
// The index, for the guides' names.
import type { SiteIndex } from "@/lib/desk/siteIndex";
// Dates in the page's language.
import { formatDay } from "./DeskItemRow";

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
  // Whether the form is open (always, until a date is set).
  const [editing, setEditing] = useState(false);
  // The fields while editing.
  const [draft, setDraft] = useState({ exam: name, date });
  // A missing date, said in words.
  const [bad, setBad] = useState(false);

  /** Keep the name and the date in the widget's settings. */
  const save = () => {
    // A date is needed.
    if (!isDay(draft.date)) { setBad(true); return; }
    // The new layout, or nothing when unchanged.
    const next = setWidgetSettingsIn(props.data.layout.widgets, props.widget.id, { exam: draft.exam.trim().slice(0, NAME_MAX), date: draft.date });
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
  // The countdown.
  return (
    <div className="desk-countdown">
      <p className="desk-countdown-exam">{name || t("countdown.unnamed")}</p>
      <p className="desk-countdown-days">
        {left === 0 ? t("countdown.today") : left > 0 ? t("countdown.days", { count: left }) : t("countdown.ago", { count: -left })}
      </p>
      <p className="desk-muted">{t("countdown.on", { date: formatDay(date, locale) })}</p>
      <p className="desk-widget-action">
        <button type="button" className="desk-btn desk-btn--quiet" onClick={() => { setDraft({ exam: name, date }); setEditing(true); }}>{t("countdown.change")}</button>
      </p>
    </div>
  );
}
