// ============================================================================
// src/components/ToolVendorFilter.tsx
// ----------------------------------------------------------------------------
// BROWSE-BY-VENDOR FILTER (client island). Progressive enhancement over the
// statically rendered /tools grid: with no JavaScript every tool stays visible;
// with JavaScript this renders a row of toggle chips ("All" + one per populated
// vendor family) that filter the grid down to a single vendor.
//
// It enhances server-rendered DOM it does not own, by a small contract:
//   * every tool card <li> has className "tools-grid-item" and a data-vendors
//     attribute (space-separated vendor keys, possibly empty);
//   * every category <section> has id=<category> (already true);
//   * every jump-nav <li> has data-jumpnav=<category>.
// On a filter change it toggles the `hidden` attribute on non-matching cards,
// then hides any category section (and its jump-nav link) left with nothing
// visible. Using `hidden` removes those nodes from the accessibility tree too,
// not just visually.
//
// Client-only state, no data fetching. Labels arrive pre-localized as props, so
// the island needs no i18n context of its own.
// ============================================================================
"use client";

import { useEffect, useState } from "react";

export default function ToolVendorFilter({
  vendors,
  labels,
  allLabel,
  legend,
}: {
  /** Vendor keys to offer as filters, in order (e.g. ["f5"]). */
  vendors: string[];
  /** Pre-localized vendor labels, keyed by vendor key. */
  labels: Record<string, string>;
  /** Label for the "show everything" chip. */
  allLabel: string;
  /** Group label announced to assistive tech. */
  legend: string;
}) {
  // null = no filter (show all); otherwise the active vendor key.
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Show / hide tool cards by vendor membership.
    const cards = document.querySelectorAll<HTMLElement>(".tools-grid-item");
    cards.forEach((card) => {
      const owned = (card.dataset.vendors ?? "").split(/\s+/).filter(Boolean);
      card.hidden = active !== null && !owned.includes(active);
    });
    // Hide category sections (and their jump-nav links) that have nothing left.
    const sections = document.querySelectorAll<HTMLElement>(".category-section");
    sections.forEach((section) => {
      const visible = section.querySelectorAll(".tools-grid-item:not([hidden])").length;
      const empty = active !== null && visible === 0;
      section.hidden = empty;
      const cat = section.id;
      if (cat) {
        const nav = document.querySelector<HTMLElement>(`[data-jumpnav="${cat}"]`);
        if (nav) nav.hidden = empty;
      }
    });
  }, [active]);

  const toggle = (v: string) => setActive((cur) => (cur === v ? null : v));

  return (
    <div className="vendor-filter" role="group" aria-label={legend}>
      <span className="vendor-filter-label">{legend}</span>
      <button
        type="button"
        className="vendor-filter-chip"
        aria-pressed={active === null}
        onClick={() => setActive(null)}
      >
        {allLabel}
      </button>
      {vendors.map((v) => (
        <button
          key={v}
          type="button"
          className="vendor-filter-chip"
          aria-pressed={active === v}
          onClick={() => toggle(v)}
        >
          {labels[v] ?? v}
        </button>
      ))}
    </div>
  );
}
