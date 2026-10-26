// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/ChangelogTimeline.tsx
// ----------------------------------------------------------------------------
// THE CHANGELOG'S DAYS, IN FULL. Rendered by /changelog for the recent days and
// by /changelog/<yyyy-mm> for a whole month (PRIME 2026-10-26), so an entry
// looks the same wherever it is read. Moved here unchanged in substance from
// the changelog page: kind badge, title in the page's language when the entry
// has one (entryTitle, CC06), the body in English marked lang="en" outside
// the English pages, and one row of links to everything the entry describes.
//
// New: each day carries an id (dayAnchor), so a day can be linked to directly,
// which the main page's month folds do for every earlier day.
//
// Server component: no client state, no script.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { entryTitle, type ChangelogEntry, type ChangelogKind } from "@/content/changelog/changelog";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getAllArticles } from "@/lib/learn";
import { dayAnchor, formatDay, type ChangelogDayGroup } from "@/lib/changelogView";

// slug -> display name, for linking tools referenced by an entry.
const TOOL_NAME = new Map(CATALOGUE.map((t) => [t.slug, t.name]));

/** The days to render, the page's locale, and the heading level of a day (an entry's title sits one below it). */
export default async function ChangelogTimeline({
  days,
  locale,
  dayLevel = 2,
}: {
  days: ChangelogDayGroup[];
  locale: string;
  dayLevel?: 2 | 3;
}) {
  // The day heading: <h2> on a month page (under its <h1>), <h3> on the main page (under "The last 30 days").
  const DayHeading = dayLevel === 2 ? "h2" : "h3";
  // An entry's title, one level below its day.
  const EntryHeading = dayLevel === 2 ? "h3" : "h4";
  // The changelog's own wording (kind labels).
  const t = await getTranslations({ locale, namespace: "changelog" });

  // Kind badge labels, localized (the kinds themselves are a fixed enum).
  const kindLabel: Record<ChangelogKind, string> = {
    launch: t("kindLaunch"),
    tool: t("kindTool"),
    feature: t("kindFeature"),
    i18n: t("kindI18n"),
    content: t("kindContent"),
    infra: t("kindInfra"),
  };

  // slug -> localized title, for linking Learn articles referenced by an entry.
  const articleTitle = new Map(getAllArticles(locale).map((a) => [a.slug, a.title]));

  // Every link an entry points at: its tools, its Learn articles, and any other
  // feature/page, as one "related links" row, so an entry always links to what it describes.
  const entryRefs = (e: ChangelogEntry): { href: string; label: string }[] => [
    // Its tools, by their catalogue names.
    ...(e.tools ?? []).map((slug) => ({ href: `/tools/${slug}`, label: TOOL_NAME.get(slug) ?? slug })),
    // Its Learn articles, by their titles in this locale.
    ...(e.articles ?? []).map((slug) => ({ href: `/learn/${slug}`, label: articleTitle.get(slug) ?? slug })),
    // Any other page it names, with the label written in the entry.
    ...(e.links ?? []).map((l) => ({ href: l.href, label: l.label })),
  ];

  // The days, newest first, as the timeline list the page has always used.
  return (
    <ol className="changelog-timeline">
      {days.map((g) => (
        // The day carries its anchor id, the target of links from the main page's month folds.
        <li className="changelog-day" key={g.day} id={dayAnchor(g.day)}>
          {/* The day, written in the page's language, machine-readable in the <time>. */}
          <DayHeading className="changelog-date">
            <time dateTime={g.day}>{formatDay(g.day, locale)}</time>
          </DayHeading>
          {/* That day's entries. */}
          <ul className="changelog-entries">
            {g.entries.map((e, i) => {
              // The entry's links, computed once.
              const refs = entryRefs(e);
              // The entry's title in this locale, computed once (CC06).
              const title = entryTitle(e, locale);
              // One entry card.
              return (
                <li className="changelog-entry" key={`${g.day}-${i}`}>
                  {/* Kind badge and title. */}
                  <div className="changelog-entry-head">
                    <span className={`changelog-badge changelog-badge--${e.kind}`}>{kindLabel[e.kind]}</span>
                    {/* The title in the page's language when the entry has one, else English marked lang="en" (CC06). */}
                    <EntryHeading className="changelog-entry-title" lang={title.lang}>{title.text}</EntryHeading>
                  </div>
                  {/* The body is kept in English (the file's rule); outside English pages it says so to the browser. */}
                  <p className="changelog-entry-body" lang={locale === "en" ? undefined : "en"}>{e.body}</p>
                  {/* The related links, when there are any. */}
                  {refs.length > 0 && (
                    <p className="changelog-entry-tools">
                      {refs.map((r, j) => (
                        <span key={r.href}>
                          {/* A separator between links, never before the first. */}
                          {j > 0 && <span className="changelog-tool-sep"> · </span>}
                          <Link href={r.href} className="changelog-tool-link">
                            {r.label}
                          </Link>
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
