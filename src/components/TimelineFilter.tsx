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

import CountryFlag from "@/components/CountryFlag";

type Mode = "all" | "redu" | "career" | "teach";

export default function TimelineFilter({
  labels,
  countries,
}: {
  labels: {
    show: string;
    all: string;
    redu: string;
    career: string;
    teach: string;
    countryLabel: string;
  };
  /** ISO code, display name and count, computed by the server from the same
   *  map the cards render their flags from. */
  countries: { code: string; label: string; n: number }[];
}) {
  // MULTI-SELECT ON BOTH AXES (PRIME 2026-08-11): "all need to be flexible and
  // be part of uni- or multi-selections". An EMPTY set means NO CONSTRAINT on
  // that axis rather than "show nothing", which is what a reader expects from a
  // group of untoggled chips - and it makes the two axes compose without any
  // special case: modes UNION within themselves, countries UNION within
  // themselves, and the two INTERSECT with each other. A reader picking
  // "My chapters" and two flags wants his chapters in those two countries.
  const [modes, setModes] = useState<Set<Mode>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());

  /* SHOWN / TOTAL (PRIME 2026-08-11). Counted here rather than computed on the
     server, because the server knows the totals and only the browser knows what
     the current selection leaves visible. Both numbers come from the SAME pass
     that does the hiding, so the counter cannot disagree with the timeline it
     describes - a count derived separately would eventually drift from it. */
  const [shown, setShown] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  /* Per-mode totals, measured from the rendered cards for the same reason: the
     pills then state how many entries each cut actually contains rather than a
     number maintained by hand somewhere else. */
  const [modeTotals, setModeTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-vendor-entry]"),
    );
    let visible = 0;
    for (const el of items) {
      const modeKeep =
        modes.size === 0 ||
        (modes.has("redu") && el.dataset.redu === "1") ||
        (modes.has("career") && el.dataset.career === "1") ||
        (modes.has("teach") && el.dataset.teach === "1");
      const countryKeep =
        picked.size === 0 || picked.has(el.dataset.country ?? "");
      const keep = modeKeep && countryKeep;
      el.hidden = !keep;
      if (keep) visible += 1;
    }
    setShown(visible);
    setTotal(items.length);
    setModeTotals({
      redu: items.filter((el) => el.dataset.redu === "1").length,
      career: items.filter((el) => el.dataset.career === "1").length,
      teach: items.filter((el) => el.dataset.teach === "1").length,
    });
  }, [modes, picked]);

  function toggleIn<T>(set: Set<T>, v: T): Set<T> {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  }

  // "Everything" is not a fourth state - it is the empty selection, so it is
  // rendered as its own chip that clears rather than as a mode that competes.
  const OPTIONS: { key: Exclude<Mode, "all">; label: string }[] = [
    { key: "redu", label: labels.redu },
    { key: "career", label: labels.career },
    { key: "teach", label: labels.teach },
  ];

  return (
    <div className="timeline-filter">
      <span className="timeline-filter-label mono">{labels.show}</span>
      <div className="timeline-filter-chips" role="group" aria-label={labels.show}>
        {/* "Everything" clears both axes. It is aria-pressed when nothing is
            selected, which is true rather than decorative: no constraint IS
            everything. */}
        <button
          type="button"
          className="timeline-filter-chip"
          aria-pressed={modes.size === 0 && picked.size === 0}
          onClick={() => {
            setModes(new Set());
            setPicked(new Set());
          }}
        >
          {labels.all}
          {total !== null && <span className="timeline-filter-chip-n">{total}</span>}
        </button>
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            className="timeline-filter-chip"
            aria-pressed={modes.has(o.key)}
            onClick={() => setModes((prev) => toggleIn(prev, o.key))}
          >
            {o.label}
            {modeTotals[o.key] !== undefined && (
              <span className="timeline-filter-chip-n">{modeTotals[o.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* SHOWN / TOTAL (PRIME 2026-08-11). Rendered only once counted, so the
          bar never shows a placeholder or a wrong number during hydration -
          `null` until the first pass, then the real figures.

          `aria-live="polite"` because this is the only feedback a screen-reader
          user gets that a toggle did anything: the cards themselves just become
          hidden, silently. It announces after the change rather than
          interrupting, which is what polite means and is right for a number
          that updates on every click. */}
      <output className="timeline-filter-count mono" aria-live="polite">
        {shown !== null && total !== null && shown !== total
          ? `${shown} / ${total}`
          : total !== null
            ? `${total}`
            : ""}
      </output>

      {/* COUNTRY TOGGLES (PRIME 2026-08-11): "toggable country flag + country
          code. Do not use checkboxes, the item itself should change state and
          show current state."

          So each country is one button carrying the flag, the ISO code and the
          count, and it IS the control - `aria-pressed` announces the state to
          assistive technology and `[aria-pressed="true"]` styles it, so the
          visible state and the announced state are the same fact rather than
          two things kept in step. The full country name is the accessible name,
          because a two-letter code is not one. */}
      {countries.length > 0 ? (
        <div
          className="timeline-filter-countries"
          role="group"
          aria-label={labels.countryLabel}
        >
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              className="timeline-filter-country"
              aria-pressed={picked.has(c.code)}
              aria-label={`${c.label} (${c.n})`}
              onClick={() => setPicked((prev) => toggleIn(prev, c.code))}
            >
              <CountryFlag code={c.code as never} />
              <span className="timeline-filter-country-code mono" aria-hidden="true">
                {c.code}
              </span>
              <span className="timeline-filter-country-n mono" aria-hidden="true">
                {c.n}
              </span>
            </button>
          ))}
        </div>
      ) : null}

    </div>
  );
}
