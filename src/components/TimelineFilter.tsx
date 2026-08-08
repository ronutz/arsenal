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
}: {
  labels: { show: string; all: string; redu: string; career: string; teach: string; count: string };
}) {
  const [mode, setMode] = useState<Mode>("all");
  const [counts, setCounts] = useState({ shown: 0, total: 0 });

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-vendor-entry]"),
    );
    let shown = 0;
    for (const el of items) {
      const keep =
        mode === "all" ||
        (mode === "redu" && el.dataset.redu === "1") ||
        (mode === "career" && el.dataset.career === "1") ||
        (mode === "teach" && el.dataset.teach === "1");
      el.hidden = !keep;
      if (keep) shown += 1;
    }
    setCounts({ shown, total: items.length });
  }, [mode]);

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
