// ============================================================================
// src/components/ViewToggle.tsx
// ----------------------------------------------------------------------------
// CARDS / LIST VIEW TOGGLE (client island) — the THIRD navigation utility on
// the category-grouped index pages (/tools and /learn), joining the jump-nav
// (scrolls) and the CategoryFilter (shows/hides). This one changes DENSITY:
//
//   * Cards (default): the existing responsive card grid.
//   * List: the same DOM re-flowed by CSS into compact catalogue-style rows —
//     name, one-line summary, chips — for fast scanning of a long index.
//
// ONE DOM, TWO LAYOUTS. The island does not render the lists and does not own
// them; it only sets `data-view="list"` on the page's <main> (reached by DOM
// id, same contract style as CategoryFilter's sectionId). Every visual change
// lives in CSS under `main[data-view="list"]`, so the server-rendered markup,
// SEO surface, and the other two utilities are untouched, and the two filters
// COMPOSE freely with this toggle (hidden sections stay hidden in either view).
//
// PROGRESSIVE ENHANCEMENT: with no JavaScript the attribute is never set and
// the page stays on cards — nothing is lost. The choice persists per surface
// in localStorage (a real-site PWA convenience; distinct keys for /tools and
// /learn so each index remembers its own preference). The attribute is applied
// in an effect, never during render, so server HTML and first client render
// always agree (no hydration mismatch); a stored "list" preference re-applies
// one paint after load, the standard stored-preference island trade-off.
//
// Labels arrive pre-localized as props (resolved server-side by each page), so
// the island needs no i18n context of its own — same pattern as CategoryFilter.
// ============================================================================
"use client";

import { useCallback, useEffect, useState } from "react";

/** The two densities the index pages offer. */
type IndexView = "cards" | "list";

export default function ViewToggle({
  targetId,
  storageKey,
  legend,
  cardsLabel,
  listLabel,
}: {
  /** DOM id of the element that receives data-view (the page's <main>). */
  targetId: string;
  /** localStorage key for this surface's remembered preference. */
  storageKey: string;
  /** Group label announced to assistive tech and shown before the buttons. */
  legend: string;
  /** Localized label for the cards (grid) view button. */
  cardsLabel: string;
  /** Localized label for the list (rows) view button. */
  listLabel: string;
}) {
  const [view, setView] = useState<IndexView>("cards");

  /** Write the current view to the target element + persist the preference. */
  const apply = useCallback(
    (next: IndexView) => {
      const target = document.getElementById(targetId);
      if (target) {
        // Cards is the no-attribute default so no-JS and "cards" are identical.
        if (next === "list") target.setAttribute("data-view", "list");
        else target.removeAttribute("data-view");
      }
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Storage may be unavailable (private mode / quota); the toggle still
        // works for the session, it just will not be remembered.
      }
      setView(next);
    },
    [targetId, storageKey],
  );

  // On mount, restore this surface's remembered preference (if any).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "list") apply("list");
    } catch {
      // Unreadable storage → stay on the cards default.
    }
  }, [storageKey, apply]);

  return (
    <div className="viewtoggle" role="group" aria-label={legend}>
      <span className="viewtoggle-legend">{legend}</span>
      <button
        type="button"
        className={view === "cards" ? "viewtoggle-btn viewtoggle-btn--on" : "viewtoggle-btn"}
        aria-pressed={view === "cards"}
        onClick={() => apply("cards")}
      >
        {cardsLabel}
      </button>
      <button
        type="button"
        className={view === "list" ? "viewtoggle-btn viewtoggle-btn--on" : "viewtoggle-btn"}
        aria-pressed={view === "list"}
        onClick={() => apply("list")}
      >
        {listLabel}
      </button>
    </div>
  );
}
