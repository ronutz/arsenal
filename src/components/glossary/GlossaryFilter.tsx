// ============================================================================
// src/components/glossary/GlossaryFilter.tsx
// ----------------------------------------------------------------------------
// THE GLOSSARY FILTER (client island) — narrows the single A-Z entry list by
// three intersecting controls: domain, kind, and a free-text search.
//
// Unlike the CategoryFilter used on /tools and /learn (which shows/hides whole
// category SECTIONS by DOM id), the glossary is ONE flat alphabetical list, so
// this island filters individual ENTRY ROWS. Every row the page renders carries:
//   * data-slug        — stable id
//   * data-domains     — space-joined domain keys
//   * data-kind        — the single kind key
//   * data-search      — lowercased headword + aliases + expansion, for text match
//
// PROGRESSIVE ENHANCEMENT: the page is fully server-rendered and every row is
// visible with no JavaScript. This island only ever ADDS a `.gloss-hidden`
// class (display:none) to rows that fail the current filter; with JS off,
// nothing is hidden and the full glossary reads normally. Labels arrive
// pre-localized as props (resolved server-side), so the island needs no i18n
// context of its own — same pattern as CategoryFilter / ToolVendorFilter.
//
// The result count and the empty-state line are updated live so a fully
// filtered page never looks broken.
// ============================================================================
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A selectable option (domain or kind): stable key + localized label. */
export interface GlossaryFilterOption {
  key: string;
  label: string;
}

export default function GlossaryFilter({
  domains,
  kinds,
  domainLegend,
  kindLegend,
  allDomainsLabel,
  allKindsLabel,
  searchPlaceholder,
  searchAriaLabel,
  clearLabel,
  countTemplate,
  noResultsLabel,
}: {
  domains: GlossaryFilterOption[];
  kinds: GlossaryFilterOption[];
  domainLegend: string;
  kindLegend: string;
  allDomainsLabel: string;
  allKindsLabel: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  clearLabel: string;
  /** ICU-free template: contains "{count}" which we replace with the number. */
  countTemplate: string;
  noResultsLabel: string;
}) {
  // Single-select domain and kind ("" = all); free-text query.
  const [domain, setDomain] = useState<string>("");
  const [kind, setKind] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [visible, setVisible] = useState<number | null>(null);

  // The list container is the previous sibling section that owns the rows; we
  // find rows by the shared class rather than coupling to a specific parent.
  const liveRef = useRef<HTMLParagraphElement | null>(null);

  const apply = useCallback(() => {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>("[data-glossary-row]"),
    );
    const q = query.trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      const rowDomains = (row.dataset.domains ?? "").split(" ");
      const rowKind = row.dataset.kind ?? "";
      const haystack = row.dataset.search ?? "";
      const okDomain = !domain || rowDomains.includes(domain);
      const okKind = !kind || rowKind === kind;
      const okText = !q || haystack.includes(q);
      const show = okDomain && okKind && okText;
      row.classList.toggle("gloss-hidden", !show);
      if (show) shown++;
    }
    // Hide any alphabetical group heading whose rows are now all hidden, and
    // dim the matching A-Z rail letter so the rail reflects the active filter.
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>("[data-glossary-group]"),
    );
    for (const g of groups) {
      const anyVisible = g.querySelectorAll(
        "[data-glossary-row]:not(.gloss-hidden)",
      ).length;
      g.classList.toggle("gloss-hidden", anyVisible === 0);
      // Reflect on the rail: the letter jumps only when its bucket has content.
      const letter = g.dataset.letter;
      if (letter) {
        const railItem = document.querySelector<HTMLElement>(
          `[data-gloss-az="${letter}"]`,
        );
        railItem?.classList.toggle("is-empty", anyVisible === 0);
      }
    }
    // Reveal the empty-state line only when nothing matches.
    const empty = document.querySelector<HTMLElement>("[data-glossary-empty]");
    if (empty) empty.classList.toggle("is-visible", shown === 0);
    setVisible(shown);
  }, [domain, kind, query]);

  // Re-run whenever a control changes (and once on mount to set the count).
  useEffect(() => {
    apply();
  }, [apply]);

  // Scroll-spy: mark the rail letter for whichever bucket is nearest the top of
  // the viewport, so the A-Z rail shows where you are as you scroll. Passive,
  // observer-based, cleaned up on unmount; no motion, so reduced-motion-safe.
  useEffect(() => {
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>("[data-glossary-group]"),
    );
    if (groups.length === 0 || typeof IntersectionObserver === "undefined") return;
    const setCurrent = (letter: string | null) => {
      document
        .querySelectorAll<HTMLElement>("[data-gloss-az]")
        .forEach((el) =>
          el.classList.toggle("is-current", el.dataset.glossAz === letter),
        );
    };
    const visibleLetters = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const letter = (en.target as HTMLElement).dataset.letter ?? "";
          if (en.isIntersecting) visibleLetters.add(letter);
          else visibleLetters.delete(letter);
        }
        // The topmost bucket currently intersecting wins.
        const first = groups.find((g) => visibleLetters.has(g.dataset.letter ?? ""));
        setCurrent(first?.dataset.letter ?? null);
      },
      // A band near the top: a bucket is "current" while its top sits in the
      // upper third of the viewport.
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );
    groups.forEach((g) => io.observe(g));
    return () => io.disconnect();
  }, []);

  const clear = useCallback(() => {
    setDomain("");
    setKind("");
    setQuery("");
  }, []);

  const anyActive = domain !== "" || kind !== "" || query.trim() !== "";
  const countLabel =
    visible === null ? "" : countTemplate.replace("{count}", String(visible));

  return (
    <div className="gloss-filter">
      {/* Free-text search */}
      <div className="gloss-search-row">
        <input
          type="search"
          className="gloss-search-input"
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Kind chips (single-select, precedence order) */}
      <fieldset className="gloss-chipset">
        <legend className="gloss-chipset-legend">{kindLegend}</legend>
        <button
          type="button"
          className={`gloss-chip${kind === "" ? " is-active" : ""}`}
          aria-pressed={kind === ""}
          onClick={() => setKind("")}
        >
          {allKindsLabel}
        </button>
        {kinds.map((k) => (
          <button
            key={k.key}
            type="button"
            data-kind={k.key}
            className={`gloss-chip gloss-chip-kind-${k.key}${kind === k.key ? " is-active" : ""}`}
            aria-pressed={kind === k.key}
            onClick={() => setKind(kind === k.key ? "" : k.key)}
          >
            <span className="gloss-chip-swatch" aria-hidden="true" />
            {k.label}
          </button>
        ))}
      </fieldset>

      {/* Domain chips (single-select, canonical order) */}
      <fieldset className="gloss-chipset">
        <legend className="gloss-chipset-legend">{domainLegend}</legend>
        <button
          type="button"
          className={`gloss-chip${domain === "" ? " is-active" : ""}`}
          aria-pressed={domain === ""}
          onClick={() => setDomain("")}
        >
          {allDomainsLabel}
        </button>
        {domains.map((d) => (
          <button
            key={d.key}
            type="button"
            className={`gloss-chip${domain === d.key ? " is-active" : ""}`}
            aria-pressed={domain === d.key}
            onClick={() => setDomain(domain === d.key ? "" : d.key)}
          >
            {d.label}
          </button>
        ))}
      </fieldset>

      {/* Live count + clear */}
      <p className="gloss-filter-status" ref={liveRef} aria-live="polite">
        <span className="gloss-count">{countLabel}</span>
        {anyActive && (
          <button type="button" className="gloss-clear" onClick={clear}>
            {clearLabel}
          </button>
        )}
      </p>

      {/* Empty state (revealed by CSS when the list has no visible rows). */}
      <p className="gloss-empty" data-glossary-empty>
        {noResultsLabel}
      </p>
    </div>
  );
}
