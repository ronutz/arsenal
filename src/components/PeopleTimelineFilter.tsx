"use client";

// ============================================================================
// src/components/PeopleTimelineFilter.tsx
// ----------------------------------------------------------------------------
// Client-side filter for the people timeline: 138 names across seven fields
// and a dozen decades, rendered statically, narrowed here in the DOM.
//
// REBUILT 2026-09-06 (PRIME). The previous version had one bug and three
// usability faults, and they compounded: the bug meant filtering did nothing
// visible, and the faults meant that even when it worked the reader could not
// tell that it had.
//
//   The bug:      `item.hidden = true` was overruled by `.people-item
//                 { display: grid }`. Fixed by a global `[hidden]` rule in
//                 components.css, which is where the fix belongs - every
//                 component that sets a display value can hit this.
//
//   Fault 1:      no feedback. Nothing said "showing 34 of 138". Now the bar
//                 reports the count live, and says so when nothing matches.
//   Fault 2:      no way to find a person. With 138 entries, scrolling to one
//                 name is the main task and it was unsupported. Now there is a
//                 name search, matched with accents folded so "Nutzmann" finds
//                 "Nützmann".
//   Fault 3:      the selection model was inverted. Every chip started "on"
//                 and clicking turned one OFF, which is the opposite of what a
//                 chip row means everywhere else. Now "All" is the resting
//                 state and clicking a field selects it; several can be
//                 selected; All resets.
//
// The filter stays DOM-based rather than re-rendering the list, because the
// list is server-rendered for the static export and the decade headings must
// hide with their entries. An empty decade on a timeline reads as a gap in
// history, not as a filter result.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Accent-insensitive, case-insensitive comparison key. */
function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function PeopleTimelineFilter({
  fields,
  total,
  allLabel,
  regionLabel,
  searchLabel,
  searchPlaceholder,
  showingLabel,
  clearLabel,
  noneLabel,
}: {
  fields: { key: string; label: string; count: number }[];
  total: number;
  allLabel: string;
  regionLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  /** Contains {shown} and {total} placeholders, substituted here. */
  showingLabel: string;
  clearLabel: string;
  noneLabel: string;
}) {
  // Empty set = "All". This is the resting state, and it is what a reader
  // expects a chip row to mean before they have touched it.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(total);
  const inputRef = useRef<HTMLInputElement>(null);

  const apply = useCallback(() => {
    const root = document.querySelector<HTMLElement>("[data-people-timeline]");
    if (!root) return;
    const q = fold(query.trim());
    let visible = 0;
    for (const item of Array.from(root.querySelectorAll<HTMLElement>(".people-item"))) {
      const field = item.dataset.field ?? "";
      const name = fold(item.dataset.name ?? "");
      const fieldOk = selected.size === 0 || selected.has(field);
      const nameOk = q === "" || name.includes(q);
      const on = fieldOk && nameOk;
      item.hidden = !on;
      if (on) visible += 1;
    }
    for (const era of Array.from(root.querySelectorAll<HTMLElement>(".people-era"))) {
      const anyVisible = Array.from(era.querySelectorAll<HTMLElement>(".people-item")).some(
        (i) => !i.hidden
      );
      era.hidden = !anyVisible;
    }
    setShown(visible);
  }, [selected, query]);

  useEffect(() => {
    apply();
  }, [apply]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const reset = () => {
    setSelected(new Set());
    setQuery("");
    inputRef.current?.focus();
  };

  const isFiltered = selected.size > 0 || query.trim() !== "";
  const allOn = selected.size === 0;
  const status = useMemo(
    () => showingLabel.replace("{shown}", String(shown)).replace("{total}", String(total)),
    [showingLabel, shown, total]
  );

  return (
    <div className="people-filter" role="group" aria-label={regionLabel}>
      <div className="people-filter-row">
        <label className="people-search">
          <span className="people-search-label">{searchLabel}</span>
          <input
            ref={inputRef}
            type="search"
            className="people-search-input"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") reset();
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {/* aria-live so a screen reader hears the count change without the
            filter stealing focus from the chip that was just pressed. */}
        <p className="people-filter-status" aria-live="polite">
          {shown === 0 ? noneLabel : status}
        </p>
      </div>

      <div className="people-filter-row people-filter-chips">
        <button
          type="button"
          className="people-chip people-chip--all"
          aria-pressed={allOn}
          onClick={reset}
        >
          {allLabel}
        </button>
        {fields.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`people-chip people-chip--${f.key}`}
            aria-pressed={selected.has(f.key)}
            onClick={() => toggle(f.key)}
          >
            {f.label} <span className="people-chip-count">{f.count}</span>
          </button>
        ))}
        {isFiltered && (
          <button type="button" className="people-chip people-chip--clear" onClick={reset}>
            {clearLabel}
          </button>
        )}
      </div>
    </div>
  );
}
