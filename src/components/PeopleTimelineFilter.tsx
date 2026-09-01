"use client";

// ============================================================================
// PeopleTimelineFilter — strand chips that hide and show entries in the
// timeline (PRIME, 2026-09-01).
//
// Same reasoning as the credentials status filter: the timeline is server
// rendered inside a static export, and each entry already carries its strand in
// a data attribute. Toggling `hidden` on rows that are present costs nothing
// and leaves the page complete without JavaScript, which is the state it ships
// in. Re-rendering the list on the client would mean shipping every person
// twice - once as HTML, once as JSON - to hide some of them.
//
// A decade heading whose entries all disappear is hidden too, because an empty
// decade on a timeline reads as a gap in history rather than a filter result.
//
// Labels arrive as props, so this component needs no message namespace.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

export default function PeopleTimelineFilter({
  fields,
  allLabel,
  regionLabel,
}: {
  fields: { key: string; label: string; count: number }[];
  allLabel: string;
  regionLabel: string;
}) {
  const [active, setActive] = useState<Set<string>>(new Set(fields.map((f) => f.key)));
  const mounted = useRef(false);

  const apply = useCallback((next: Set<string>) => {
    const root = document.querySelector<HTMLElement>("[data-people-timeline]");
    if (!root) return;

    for (const item of Array.from(root.querySelectorAll<HTMLElement>(".people-item"))) {
      const field = item.dataset.field ?? "";
      item.hidden = !next.has(field);
    }
    for (const era of Array.from(root.querySelectorAll<HTMLElement>(".people-era"))) {
      const anyVisible = Array.from(era.querySelectorAll<HTMLElement>(".people-item")).some(
        (i) => !i.hidden,
      );
      era.hidden = !anyVisible;
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    apply(active);
  }, [active, apply]);

  const toggle = (key: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      // Everything off shows nothing and offers no way back that reads as
      // obvious, so an empty selection resets to all.
      return next.size === 0 ? new Set(fields.map((f) => f.key)) : next;
    });

  const allOn = active.size === fields.length;

  return (
    <div className="people-filter" role="group" aria-label={regionLabel}>
      <button
        type="button"
        className="people-chip people-chip--all"
        aria-pressed={allOn}
        onClick={() => setActive(new Set(fields.map((f) => f.key)))}
      >
        {allLabel}
      </button>
      {fields.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`people-chip people-chip--${f.key}`}
          aria-pressed={active.has(f.key)}
          onClick={() => toggle(f.key)}
        >
          {f.label} <span className="people-chip-count">{f.count}</span>
        </button>
      ))}
    </div>
  );
}
