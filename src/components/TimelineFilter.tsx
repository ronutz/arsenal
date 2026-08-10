"use client";

// ============================================================================
// src/components/TimelineFilter.tsx
// ----------------------------------------------------------------------------
// Four filters over the industry timeline: everything, Red Education partners,
// the chapters lived from inside, and the platforms authorized to teach.
//
// WHY CLIENT-SIDE RATHER THAN FILTERED ROUTES.
// The site is a static export. Four filtered variants of a 164-entry index
// would be four more pages per locale - 64 pages carrying no content the index
// does not already carry - and every one of them a duplicate that search
// engines have to be told to ignore. Toggling visibility on markup the browser
// already holds costs nothing and adds no URLs.
//
// THE TRADE, STATED: without JavaScript the filters do not appear and every
// entry stays visible. That is the correct failure - the page is a complete
// list, and the filter is an affordance over it rather than the way to reach
// the content. Nothing is unreachable with scripting off.
//
// The counts come from the DOM rather than being passed in, so they cannot
// drift from what is actually rendered.
// ============================================================================

import { useEffect, useState } from "react";

type Mode = "all" | "redu" | "career" | "teach";

export default function TimelineFilter({
  labels,
  categories,
}: {
  labels: {
    show: string;
    all: string;
    redu: string;
    career: string;
    teach: string;
    count: string;
    categoryLabel: string;
    categoryAll: string;
    categoryNone: string;
  };
  /** Category tags with their display names and counts, from the server. */
  categories: { tag: string; label: string; n: number }[];
}) {
  const [mode, setMode] = useState<Mode>("all");
  // MULTI-SELECT (PRIME 2026-08-10). Previously each category was its own
  // route: /industry/vendors, /industry/distributors and so on. Those pages
  // still exist and still work - they are linkable and crawlable, which a
  // client-side control is not - but selecting a category no longer requires
  // LEAVING the timeline.
  //
  // An EMPTY set means "no category filter", i.e. show everything, rather than
  // "show nothing". That is the behaviour a reader expects from an unticked
  // group of checkboxes, and it makes "none" and "all" the same visible result
  // by different routes, which is honest: with no category chosen there is no
  // category constraint to apply.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState({ shown: 0, total: 0 });

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-vendor-entry]"),
    );
    let shown = 0;
    for (const el of items) {
      const modeKeep =
        mode === "all" ||
        (mode === "redu" && el.dataset.redu === "1") ||
        (mode === "career" && el.dataset.career === "1") ||
        (mode === "teach" && el.dataset.teach === "1");
      // Tags are a space-separated list on the element; an entry matches if it
      // carries ANY selected category (union, not intersection - a reader
      // ticking "vendor" and "distributor" wants both, not companies that are
      // somehow both).
      const tags = (el.dataset.tags ?? "").split(" ").filter(Boolean);
      const catKeep =
        selected.size === 0 || tags.some((t) => selected.has(t));
      const keep = modeKeep && catKeep;
      el.hidden = !keep;
      if (keep) shown += 1;
    }
    setCounts({ shown, total: items.length });
  }, [mode, selected]);

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const OPTIONS: { key: Mode; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "redu", label: labels.redu },
    { key: "career", label: labels.career },
    { key: "teach", label: labels.teach },
  ];

  return (
    <div className="timeline-filter">
      <span className="timeline-filter-label mono">{labels.show}</span>
      <div className="timeline-filter-chips" role="group" aria-label={labels.show}>
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            className="timeline-filter-chip"
            aria-pressed={mode === o.key}
            onClick={() => setMode(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {/* CATEGORY MULTI-SELECT. Real checkboxes rather than styled buttons:
          a group of independent on/off choices is exactly what a checkbox is,
          it announces its own state to assistive technology without any aria
          bookkeeping, and it is keyboard-operable for free. */}
      {categories.length > 0 ? (
        <fieldset className="timeline-filter-cats">
          <legend className="timeline-filter-label mono">
            {labels.categoryLabel}
          </legend>
          {categories.map((c) => (
            <label className="timeline-filter-cat" key={c.tag}>
              <input
                type="checkbox"
                checked={selected.has(c.tag)}
                onChange={() => toggle(c.tag)}
              />
              <span>{c.label}</span>
              <span className="timeline-filter-cat-n mono">{c.n}</span>
            </label>
          ))}
          <span className="timeline-filter-cat-actions">
            <button
              type="button"
              className="timeline-filter-chip"
              onClick={() => setSelected(new Set(categories.map((c) => c.tag)))}
            >
              {labels.categoryAll}
            </button>
            <button
              type="button"
              className="timeline-filter-chip"
              onClick={() => setSelected(new Set())}
            >
              {labels.categoryNone}
            </button>
          </span>
        </fieldset>
      ) : null}

      {/* aria-live so a screen reader is told the list changed size, which is
          otherwise a silent event for anybody not watching the cards. */}
      <span className="timeline-filter-count mono" aria-live="polite">
        {labels.count
          .replace("{shown}", String(counts.shown))
          .replace("{total}", String(counts.total))}
      </span>
    </div>
  );
}
