// ============================================================================
// src/components/CategoryFilter.tsx
// ----------------------------------------------------------------------------
// SHOW / HIDE CATEGORY FILTER (client island) — the SECOND navigation utility
// on the category-grouped index pages (/tools, /learn, and the vendor hubs),
// complementing the existing "jump to" anchor nav.
//
//   * The jump-nav SCROLLS the page to a section.
//   * This filter SHOWS or HIDES whole sections, so a reader can narrow the page
//     to only the families / categories / groups they care about right now.
//
// PROGRESSIVE ENHANCEMENT: like ToolVendorFilter, this layers on top of already
// server-rendered sections it does not own. With no JavaScript every section
// stays visible (nothing is hidden without JS). Every group is shown by default,
// so the page is unchanged until the reader deselects a chip. At least one group
// always stays visible (the last shown chip cannot be turned off), so the page
// can never become empty; an "all" chip restores the default in one click.
//
// CONTRACT (already rendered by the pages for the anchor nav):
//   * each group's section is reachable by a DOM id (group.sectionId);
//   * each group's jump-nav <li> carries data-jumpnav=<group.key>.
// Deselecting a chip adds the `.cat-hidden` class to that section AND its
// jump-nav item, so the two navs stay consistent (a hidden category also leaves
// the jump list, so its scroll link can never point at nothing).
//
// WHY A CLASS, NOT THE `hidden` ATTRIBUTE: the dormant ToolVendorFilter island
// toggles the `hidden` attribute on these same sections. Using an independent
// `.cat-hidden` class (display:none !important) means the two filters COMPOSE
// with OR semantics if both are ever enabled on one page — either wanting a
// section hidden hides it — instead of clobbering each other's `hidden` writes.
//
// Labels arrive pre-localized as props (resolved server-side by each page), so
// the island needs no i18n context of its own — same pattern as ToolVendorFilter.
// ============================================================================
"use client";

import { useCallback, useState } from "react";

export interface CategoryFilterGroup {
  /** data-jumpnav value of the jump-nav <li> (also the chip's stable key). */
  key: string;
  /** DOM id of the section/div to show or hide. */
  sectionId: string;
  /** Localized label shown on the chip. */
  label: string;
  /** Optional category/vendor hue for the chip dot (matches the page's dots). */
  color?: string;
}

export default function CategoryFilter({
  groups,
  legend,
  allLabel,
}: {
  groups: CategoryFilterGroup[];
  /** Group label announced to assistive tech and shown before the chips. */
  legend: string;
  /** Label for the "show everything" reset chip. */
  allLabel: string;
}) {
  // Set of HIDDEN keys; empty = default (all shown), so first paint matches SSR.
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  // Imperatively reflect a hidden-set onto the server-rendered DOM: toggle the
  // `.cat-hidden` class on each group's section and its jump-nav item.
  const applyHidden = useCallback(
    (set: Set<string>) => {
      if (typeof document === "undefined") return;
      for (const g of groups) {
        const off = set.has(g.key);
        const section = document.getElementById(g.sectionId);
        if (section) section.classList.toggle("cat-hidden", off);
        document
          .querySelectorAll(`[data-jumpnav="${g.key}"]`)
          .forEach((el) => el.classList.toggle("cat-hidden", off));
      }
    },
    [groups],
  );

  const toggle = useCallback(
    (key: string) => {
      setHidden((prev) => {
        const willHide = !prev.has(key);
        // Keep at least one group visible: refuse to hide the last shown one.
        if (willHide && prev.size + 1 >= groups.length) return prev;
        const next = new Set(prev);
        if (willHide) next.add(key);
        else next.delete(key);
        applyHidden(next);
        return next;
      });
    },
    [groups, applyHidden],
  );

  const reset = useCallback(() => {
    setHidden(() => {
      const empty = new Set<string>();
      applyHidden(empty);
      return empty;
    });
  }, [applyHidden]);

  // Nothing to filter with a single group.
  if (groups.length < 2) return null;

  return (
    <div className="cat-filter" role="group" aria-label={legend}>
      <span className="cat-filter-label">{legend}</span>
      <button
        type="button"
        className="cat-filter-chip"
        aria-pressed={hidden.size === 0}
        onClick={reset}
      >
        {allLabel}
      </button>
      {groups.map((g) => {
        const shown = !hidden.has(g.key);
        return (
          <button
            key={g.key}
            type="button"
            className="cat-filter-chip"
            aria-pressed={shown}
            onClick={() => toggle(g.key)}
          >
            {g.color ? (
              <span
                className="category-dot"
                style={{ "--chip-color": g.color } as React.CSSProperties}
                aria-hidden="true"
              />
            ) : null}
            {g.label}
          </button>
        );
      })}
    </div>
  );
}
