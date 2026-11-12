"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskNews.tsx
// ----------------------------------------------------------------------------
// THE "NEW FOR YOU" WIDGET (PLAN-personal-desk-20261112, sections 3.7 and 3.9).
// What changed for this reader, worked out in the browser from the site
// index's dates and the desk (src/lib/desk/news.ts): pages read and changed
// since; new or revised parts of the series and reading paths the reader
// follows; new or changed tools in the families the reader keeps a tool from.
// The line at the top says which day it counts from (the previous visit, or
// the last thirty days on the first). Every row says its state in words and a
// sign (↻ updated, ✦ new or revised), never by colour alone. Nothing is sent.
// ============================================================================

// React's memo.
import { useMemo } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// The desk's shapes and today.
import { today, type DeskData } from "@/lib/desk/store";
// The comparison.
import { newsFor, NEWS_FIRST_WINDOW_DAYS, type NewsGroup, type NewsRow } from "@/lib/desk/news";
// The index.
import type { SiteIndex } from "@/lib/desk/siteIndex";
// One item as the desk shows it, dates, titles.
import DeskItemRow, { formatDay, titleOf } from "./DeskItemRow";

/**
 * The widget.
 *
 * @param props the desk and the index
 * @returns the widget's content
 */
export default function DeskNews(props: { data: DeskData; index: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The tool families' names.
  const tf = useTranslations("tools.categories");
  // The page's language, for dates.
  const locale = useLocale();
  // The comparison, once the index is in.
  const news = useMemo(() => (props.index ? newsFor(props.data, props.index, today()) : null), [props.data, props.index]);
  // Before the index: the row keeps its place.
  if (!news) return <p className="desk-muted">{t("status.loading")}</p>;
  // Whether there is anything at all.
  const any = news.updated.rows.length + news.follow.rows.length + news.family.rows.length > 0;

  /**
   * One group: its heading, its rows, and how many more.
   *
   * @param key the group's key (for the heading)
   * @param g the group
   * @param row how one row's extra words are drawn
   * @returns the group, or nothing when empty
   */
  const section = (key: "updated" | "follow" | "family", g: NewsGroup, row: (r: NewsRow) => React.ReactNode) =>
    g.rows.length === 0 ? null : (
      <div className="desk-news-group">
        <p className="desk-label">{t(`news.${key}`)}</p>
        <ul className="desk-list">
          {g.rows.map((r) => (
            <li key={r.id} className="desk-row">
              {row(r)}
              <span className="desk-muted mono">{formatDay(r.day, locale)}</span>
            </li>
          ))}
        </ul>
        {g.more > 0 && <p className="desk-muted">{t("news.more", { count: g.more })}</p>}
      </div>
    );

  // The widget.
  return (
    <div className="desk-news">
      {/* The day it counts from. */}
      <p className="desk-muted">
        {news.basis === "visit" ? t("news.sinceVisit", { date: formatDay(news.since, locale) }) : t("news.sinceWindow", { days: NEWS_FIRST_WINDOW_DAYS })}
      </p>
      {/* Nothing: what to do so this fills, or that nothing changed. */}
      {!any && <p className="desk-empty">{news.following || Object.keys(props.data.read).length > 0 ? t("news.nothing") : t("news.howTo")}</p>}
      {/* Read and changed since: the row's own chip says "Updated since you read it". */}
      {section("updated", news.updated, (r) => <DeskItemRow id={r.id} index={props.index} readDay={r.readDay} showKind />)}
      {/* New or revised in what the reader follows. */}
      {section("follow", news.follow, (r) => (
        <DeskItemRow id={r.id} index={props.index} showKind>
          <span className="desk-chip desk-chip--new"><span aria-hidden="true">{"✦"}</span> {t("news.newOrRevised")}</span>
          {r.from && <span className="desk-muted">{t("news.inName", { name: titleOf(props.index, r.from) ?? "" })}</span>}
        </DeskItemRow>
      ))}
      {/* New or changed in the tool families the reader keeps. */}
      {section("family", news.family, (r) => (
        <DeskItemRow id={r.id} index={props.index}>
          <span className="desk-chip desk-chip--new"><span aria-hidden="true">{"✦"}</span> {t("news.newOrChanged")}</span>
          {r.family && <span className="desk-muted">{t("news.inName", { name: tf(r.family) })}</span>}
        </DeskItemRow>
      ))}
    </div>
  );
}
