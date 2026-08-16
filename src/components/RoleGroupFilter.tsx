"use client";

// ============================================================================
// ROLE GROUP FILTER (PRIME 2026-08-16)
//
// PRIME asked whether a display filter makes sense here. With thirty-nine roles
// across eight groups it does: a reader arrives wanting the support ladder or
// the selling side, and scrolling past six groups to reach it is the cost of
// having built the roster properly.
//
// IT IS THE SAME CONTROL AS THE MILESTONE AND VENDOR FILTERS, deliberately.
// Every class name below is theirs, so a reader who has used one has used all
// three. What differs is only the data: a role belongs to exactly ONE group —
// that is the whole point of the spine — so matching is membership rather than
// the intersection the milestone filter needs for events with several
// countries.
//
// The counts come from the server, computed from the same array the sections
// render from, so a chip cannot claim a number the page then contradicts.
// ============================================================================

import { useEffect, useState } from "react";

export default function RoleGroupFilter({
  labels,
  groups,
}: {
  labels: { show: string; all: string; groupLabel: string };
  groups: { id: string; label: string; n: number }[];
}) {
  /** EMPTY MEANS NO CONSTRAINT, the same rule as the other two filters. */
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    /* Sections carry the group; roles are counted from the cards inside them,
       so the status line reports POSITIONS rather than headings. */
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-role-group]"),
    );
    let visible = 0;
    let all = 0;
    for (const el of sections) {
      const mine = el.dataset.roleGroup ?? "";
      const ok = picked.size === 0 || picked.has(mine);
      el.style.display = ok ? "" : "none";
      const n = el.querySelectorAll("[data-role-entry]").length;
      all += n;
      if (ok) visible += n;
    }
    setShown(visible);
    setTotal(all);
  }, [picked]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (groups.length === 0) return null;

  return (
    <div className="timeline-filter">
      <div className="timeline-filter-row">
        <span className="timeline-filter-label">{labels.show}</span>
        <button
          type="button"
          className={`timeline-filter-pill${picked.size === 0 ? " is-active" : ""}`}
          onClick={() => setPicked(new Set())}
          aria-pressed={picked.size === 0}
        >
          {labels.all}
          {total !== null && <span className="timeline-filter-count mono"> {total}</span>}
        </button>
      </div>

      <div
        className="timeline-filter-countries"
        role="group"
        aria-label={labels.groupLabel}
      >
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`timeline-filter-country${picked.has(g.id) ? " is-active" : ""}`}
            onClick={() => toggle(g.id)}
            aria-pressed={picked.has(g.id)}
            title={g.label}
          >
            <span>{g.label}</span>
            <span className="timeline-filter-count mono">{g.n}</span>
          </button>
        ))}
      </div>

      {shown !== null && total !== null && shown !== total && (
        <p className="timeline-filter-count mono">
          {shown} / {total}
        </p>
      )}
    </div>
  );
}
