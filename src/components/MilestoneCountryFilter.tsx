"use client";

// ============================================================================
// MILESTONE COUNTRY FILTER (PRIME 2026-08-13)
//
// The same control as the vendor timeline's country row, against different
// data. It is a SEPARATE component rather than a prop on TimelineFilter for
// one reason: that component carries the redu / career / teach modes, which
// have no meaning for a milestone. Reusing it would have meant passing an
// empty mode set and shipping three dead branches into this page.
//
// WHAT IS SHARED IS THE CSS. Every class name here is the vendor filter's, so
// the two rows are the same control to look at and to use - which is what
// PRIME asked for - without either page importing the other's logic.
//
// THE ONE REAL DIFFERENCE: a milestone has MANY countries. The vendor cards
// carry `data-country`, singular, because a company has one origin. A card here
// carries `data-countries`, a space-separated list, and matching is
// INTERSECTION: a card shows if ANY of its countries is picked. The
// transatlantic cable appears under both GB and US, which is correct - it is
// one event that happened in two places.
// ============================================================================

import { useEffect, useState } from "react";
import CountryFlag from "@/components/CountryFlag";

export default function MilestoneCountryFilter({
  labels,
  countries,
}: {
  labels: { show: string; all: string; countryLabel: string };
  /** ISO code, display name and count, computed by the server from the same
   *  array the cards render their flags from, so a chip cannot claim a number
   *  the timeline then contradicts. */
  countries: { code: string; label: string; n: number }[];
}) {
  /** EMPTY MEANS NO CONSTRAINT, not "show nothing" - the behaviour a reader
   *  expects from a row of untoggled chips, and the same rule as the vendor
   *  filter so the two do not surprise anyone who has used the other. */
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-milestone-entry]"),
    );
    let visible = 0;
    for (const el of items) {
      /* The list is read from the DOM rather than re-derived, so the chip and
         the card can never disagree about what a milestone belongs to. */
      const mine = (el.dataset.countries ?? "").split(" ").filter(Boolean);
      const ok = picked.size === 0 || mine.some((c) => picked.has(c));
      el.style.display = ok ? "" : "none";
      if (ok) visible += 1;
    }
    setShown(visible);
    setTotal(items.length);
  }, [picked]);

  const toggle = (code: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  if (countries.length === 0) return null;

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
        aria-label={labels.countryLabel}
      >
        {countries.map((c) => (
          <button
            key={c.code}
            type="button"
            className={`timeline-filter-country${picked.has(c.code) ? " is-active" : ""}`}
            onClick={() => toggle(c.code)}
            aria-pressed={picked.has(c.code)}
            title={c.label}
          >
            <CountryFlag code={c.code as never} />
            <span className="mono">{c.code}</span>
            <span className="timeline-filter-count mono">{c.n}</span>
          </button>
        ))}
      </div>

      {shown !== null && total !== null && shown !== total && (
        <p className="timeline-filter-status mono">
          {shown} / {total}
        </p>
      )}
    </div>
  );
}
