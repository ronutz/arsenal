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

type Mode = "all" | "redu" | "career" | "teach" | "lineage";

/** One era of the navigator (E13): key, label and the closed year range it covers. */
export interface EraChip {
  key: string;
  label: string;
  from: number;
  to: number;
  /** The milestones the era is named from (eras.ts anchors), resolved by the page: title and the link to the
   *  milestone on /industry/milestones, shown under the chips while the era is pressed. */
  anchors?: { title: string; href: string }[];
}

/** The query parameters the entrances use to preset this filter (E9, E13, E14; 2026-10-06). */
const PRESET_MODES: readonly Mode[] = ["redu", "career", "teach", "lineage"];

export default function TimelineFilter({
  labels,
  countries,
  eras = [],
}: {
  labels: {
    show: string;
    all: string;
    redu: string;
    career: string;
    teach: string;
    /** The lineage cut (E9, 2026-10-06): records that carry typed lineage, acquisitions, an ending or a story
     *  that begins before the company. */
    lineage: string;
    countryLabel: string;
    /** The era navigator's group label (E13). */
    eraLabel?: string;
    /** The line before a pressed era's anchors ("Opened by"). */
    eraAnchors?: string;
    /** The note under the eras for records with no dated start, with {n} already interpolated by the server
     *  page for the count it knows; the client shows it only when its own count agrees it is above zero. */
    eraUndated?: string;
  };
  /** ISO code, display name and count, computed by the server from the same
   *  map the cards render their flags from. */
  countries: { code: string; label: string; n: number }[];
  /** The eras (E13), in order; empty hides the navigator. The counts are measured from the cards' data-year. */
  eras?: EraChip[];
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
  /* THE ERA AXIS (E13, 2026-10-06): one era at a time, or none. A third axis that intersects the other two, so
     "my chapters, in Brazil, in the 1990s" is three clicks. One at a time because eras are contiguous and a
     reader wanting two adjacent ones wants the range, which the navigator does not offer; the chronology below
     is always the whole range. */
  const [era, setEra] = useState<string | null>(null);
  /* Per-era totals, measured from the cards like the mode totals. */
  const [eraTotals, setEraTotals] = useState<Record<string, number>>({});
  /* Records with no data-year at all: no dated start in the sources, so no era can be asserted for them.
     Counted so the navigator can say why its counts do not add up to the chronology. */
  const [eraUndated, setEraUndated] = useState(0);

  /* PRESETS FROM THE URL (E9, E13, E14; 2026-10-06). The entrances above the timeline link here as
     /industry/?mode=career, ?country=BR, ?era=the-web-and-the-firewall (any combination, comma-separated
     lists allowed), so an entrance is a filtered view with an address, which the chips alone never had. Read
     once after mount, so the server render and the first client render agree; unknown values are ignored. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wantModes = (q.get("mode") ?? "").split(",").filter((m): m is Mode => (PRESET_MODES as readonly string[]).includes(m));
    const wantCountries = (q.get("country") ?? "").split(",").map((c) => c.toUpperCase()).filter((c) => countries.some((k) => k.code === c));
    const wantEra = q.get("era");
    if (wantModes.length) setModes(new Set(wantModes));
    if (wantCountries.length) setPicked(new Set(wantCountries));
    if (wantEra && eras.some((e) => e.key === wantEra)) setEra(wantEra);
  }, [countries, eras]);

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
        (modes.has("teach") && el.dataset.teach === "1") ||
        (modes.has("lineage") && el.dataset.lineage === "1");
      const countryKeep =
        picked.size === 0 || picked.has(el.dataset.country ?? "");
      // The era reads the card's story year (data-year), the same year the gutter shows.
      const y = Number(el.dataset.year ?? "");
      const current = era ? eras.find((e) => e.key === era) : undefined;
      const eraKeep = !current || (Number.isFinite(y) && y >= current.from && y <= current.to);
      const keep = modeKeep && countryKeep && eraKeep;
      el.hidden = !keep;
      if (keep) visible += 1;
    }
    setShown(visible);
    setTotal(items.length);
    setModeTotals({
      redu: items.filter((el) => el.dataset.redu === "1").length,
      career: items.filter((el) => el.dataset.career === "1").length,
      teach: items.filter((el) => el.dataset.teach === "1").length,
      lineage: items.filter((el) => el.dataset.lineage === "1").length,
    });
    const et: Record<string, number> = {};
    for (const e of eras) et[e.key] = items.filter((el) => { const yy = Number(el.dataset.year ?? ""); return Number.isFinite(yy) && yy >= e.from && yy <= e.to; }).length;
    setEraTotals(et);
    // A card without the attribute, with an empty one, or with one that is not a number, is undated.
    setEraUndated(items.filter((el) => { const y = el.dataset.year; return y === undefined || y === "" || !Number.isFinite(Number(y)); }).length);
  }, [modes, picked, era, eras]);

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
    { key: "lineage", label: labels.lineage },
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
          aria-pressed={modes.size === 0 && picked.size === 0 && era === null}
          onClick={() => {
            setModes(new Set());
            setPicked(new Set());
            setEra(null);
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
      {/* THE ERA NAVIGATOR (E13, SCOUT, adopted 2026-10-06): one chip per era, each with its count of stories
          that begin inside it, one era at a time; the chip's accessible name carries the years. The eras and
          their anchors are src/content/vendors/eras.ts, named from the site's own sourced milestones. */}
      {eras.length > 0 ? (
        <div className="timeline-filter-eras" role="group" aria-label={labels.eraLabel ?? ""} id="eras">
          {eras.map((e) => (
            <button
              key={e.key}
              type="button"
              className="timeline-filter-era"
              aria-pressed={era === e.key}
              aria-label={`${e.label} (${e.from} – ${e.to})`}
              onClick={() => setEra((prev) => (prev === e.key ? null : e.key))}
            >
              <span className="timeline-filter-era-years mono" aria-hidden="true">{e.from}–{e.to}</span>
              <span className="timeline-filter-era-label">{e.label}</span>
              {eraTotals[e.key] !== undefined && <span className="timeline-filter-chip-n">{eraTotals[e.key]}</span>}
            </button>
          ))}
          {/* The pressed era's anchors: the sourced milestones it opens at, one click away. */}
          {era && (eras.find((e) => e.key === era)?.anchors?.length ?? 0) > 0 && (
            <p className="timeline-filter-era-anchors">
              {labels.eraAnchors ?? ""}{" "}
              {eras.find((e) => e.key === era)!.anchors!.map((a, i) => (
                <span key={a.href}>
                  {i > 0 && " · "}
                  <a href={a.href} className="timeline-filter-era-anchor">{a.title}</a>
                </span>
              ))}
            </p>
          )}
          {/* The records no era can hold: a dated start is what places a story, and where the sources give
              none the record is counted here rather than smoothed into a decade (the method page's rule). */}
          {eraUndated > 0 && labels.eraUndated && (
            <p className="timeline-filter-era-undated mono">{labels.eraUndated.replace("{n}", String(eraUndated))}</p>
          )}
        </div>
      ) : null}

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
