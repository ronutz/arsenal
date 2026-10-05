"use client";

// ============================================================================
// src/components/HubViewSwitch.tsx
// ----------------------------------------------------------------------------
// GUIDED | DIRECTORY (wave L of Round 1, 2026-10-05; SCOUT L11, PRIME's
// decision 6: "the Guided | Directory switch on /learn/ itself", one page, one
// anchor). A hub page carries a guided layer (the ways in, with explanation)
// above its complete directory (the inventory, with its controls). This switch
// toggles between the two readings: Guided shows both, guided first; Directory
// hides the guided layer so the inventory and its controls come first. Same
// island pattern as ViewToggle: the choice is written as data-hub-view on the
// page's <main>, remembered per surface in localStorage, and never changes the
// URL (a hub linked with #directory opens in Directory on arrival). Without
// JavaScript the page is the Guided reading with the directory below, which is
// the complete page.
// ============================================================================

import { useCallback, useEffect, useState } from "react";

/** The two readings of a hub. */
type HubView = "guided" | "directory";

export default function HubViewSwitch({
  targetId,
  storageKey,
  legend,
  guidedLabel,
  directoryLabel,
}: {
  /** DOM id of the element that receives data-hub-view (the page's <main>). */
  targetId: string;
  /** localStorage key for this surface's remembered reading. */
  storageKey: string;
  /** Group label announced to assistive tech and shown before the buttons. */
  legend: string;
  /** Localised label for the guided reading. */
  guidedLabel: string;
  /** Localised label for the directory reading. */
  directoryLabel: string;
}) {
  const [view, setView] = useState<HubView>("guided");

  /** Write the reading to the target element and remember it. */
  const apply = useCallback(
    (next: HubView) => {
      const target = document.getElementById(targetId);
      if (target) {
        // Guided is the no-attribute default, so no-JS and "guided" are identical.
        if (next === "directory") target.setAttribute("data-hub-view", "directory");
        else target.removeAttribute("data-hub-view");
      }
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Storage may be unavailable; the switch still works for the session.
      }
      setView(next);
    },
    [targetId, storageKey],
  );

  // On mount: a #directory link wins, then the remembered reading.
  useEffect(() => {
    if (window.location.hash === "#directory") { apply("directory"); return; }
    try {
      if (window.localStorage.getItem(storageKey) === "directory") apply("directory");
    } catch {
      // Unreadable storage: stay guided.
    }
  }, [storageKey, apply]);

  return (
    <div className="hub-switch" role="group" aria-label={legend}>
      <span className="hub-switch-legend">{legend}</span>
      <button type="button" className={view === "guided" ? "hub-switch-btn hub-switch-btn--on" : "hub-switch-btn"} aria-pressed={view === "guided"} onClick={() => apply("guided")}>
        {guidedLabel}
      </button>
      <button type="button" className={view === "directory" ? "hub-switch-btn hub-switch-btn--on" : "hub-switch-btn"} aria-pressed={view === "directory"} onClick={() => apply("directory")}>
        {directoryLabel}
      </button>
    </div>
  );
}
