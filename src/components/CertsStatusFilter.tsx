"use client";

// ============================================================================
// CertsStatusFilter — CURRENT / HISTORICAL as toggles over the full record.
//
// The two pills already existed on /about/credentials as a legend: they told
// the reader which colour meant what and did nothing else. PRIME asked for them
// to filter (31/08/2026), sitting above the vendor pills and rendered slightly
// larger, with their colours unchanged.
//
// WHY IT FILTERS THE DOM RATHER THAN THE DATA
// The record is server-rendered inside a static export, and the rows already
// carry the only fact the filter needs: `data-current="true"` on a current
// item, absent on a historical one. Lifting the whole record into a client
// component to re-render it would ship the entire dataset to the browser twice
// - once as HTML, once as JSON - to hide some rows. Toggling `hidden` on rows
// that are already there costs nothing and leaves the page complete for anyone
// without JavaScript, which is the state it renders in.
//
// Labels arrive as props rather than through useTranslations so this component
// needs no message namespace on the client.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "current" | "historical";

export default function CertsStatusFilter({
  currentLabel,
  historicalLabel,
  regionLabel,
}: {
  currentLabel: string;
  historicalLabel: string;
  regionLabel: string;
}) {
  // Both on is the initial state, and it is also the state the page renders in
  // before this component mounts, so nothing moves on load.
  const [active, setActive] = useState<Record<Status, boolean>>({
    current: true,
    historical: true,
  });
  const mounted = useRef(false);

  const apply = useCallback((next: Record<Status, boolean>) => {
    const root = document.querySelector<HTMLElement>("[data-certs-record]");
    if (!root) return;

    for (const item of Array.from(root.querySelectorAll<HTMLElement>(".certs-hist-item"))) {
      const isCurrent = item.dataset.current === "true";
      const show = isCurrent ? next.current : next.historical;
      item.hidden = !show;
    }

    // A vendor whose every row is hidden should not leave a bare heading behind,
    // and its jump link should not scroll to nothing.
    for (const group of Array.from(root.querySelectorAll<HTMLElement>(".certs-vendor-group"))) {
      const anyVisible = Array.from(
        group.querySelectorAll<HTMLElement>(".certs-hist-item"),
      ).some((i) => !i.hidden);
      group.hidden = !anyVisible;
      const jump = document.querySelector<HTMLElement>(
        `.certs-vendor-jump[href="#${CSS.escape(group.id)}"]`,
      );
      if (jump) jump.hidden = !anyVisible;
    }

    // Sub-sections (era groups, the training block) can empty out on their own
    // while the vendor still has visible rows elsewhere.
    for (const sub of Array.from(
      root.querySelectorAll<HTMLElement>(".certs-era, .certs-training"),
    )) {
      const anyVisible = Array.from(
        sub.querySelectorAll<HTMLElement>(".certs-hist-item"),
      ).some((i) => !i.hidden);
      sub.hidden = !anyVisible;
    }
  }, []);

  useEffect(() => {
    // Skip the first run: the server-rendered state already shows everything.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    apply(active);
  }, [active, apply]);

  const toggle = (which: Status) => {
    setActive((prev) => {
      const next = { ...prev, [which]: !prev[which] };
      // Never allow both off: an empty record is not a filter state anyone
      // wants, and the pills would give no clue how to recover from it.
      if (!next.current && !next.historical) {
        return { current: which === "current", historical: which === "historical" };
      }
      return next;
    });
  };

  return (
    <div className="certs-status-filter" role="group" aria-label={regionLabel}>
      <button
        type="button"
        className="certs-status-toggle certs-status-toggle--current"
        aria-pressed={active.current}
        onClick={() => toggle("current")}
      >
        {currentLabel}
      </button>
      <button
        type="button"
        className="certs-status-toggle certs-status-toggle--past"
        aria-pressed={active.historical}
        onClick={() => toggle("historical")}
      >
        {historicalLabel}
      </button>
    </div>
  );
}
