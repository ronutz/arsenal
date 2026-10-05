"use client";

// ============================================================================
// src/components/HomeSurpriseIntent.tsx
// ----------------------------------------------------------------------------
// THE SIXTH INTENT CARD: a door to the "Take me somewhere" column (PRIME,
// 2026-10-05 11:03 and 11:35: keep the column and its form; the card must not
// open a page by itself; the reader chooses). With JavaScript a click asks the
// column for a draw (the "ronutz:surprise" event) and scrolls there, so the
// reader arrives on a destination already named, with the pick and "Draw again"
// in front of them, and the column pulses once to say where the page stopped
// (PRIME 03:10); a second click draws and pulses again. Without JavaScript the
// card is the plain anchor to #surprise.
// Nothing is sent anywhere; the pick is made in the browser and not kept.
// ============================================================================

import { SURPRISE_EVENT } from "@/components/HomeRabbitHole";

export default function HomeSurpriseIntent({ q, label, verb }: {
  /** The question on the card ("I don't know yet. Show me something interesting"). */
  q: string;
  /** The destination label ("Take me somewhere"). */
  label: string;
  /** The verb line ("wander"). */
  verb: string;
}) {
  /** Ask the column for a draw; the column scrolls itself into view and pulses (so a repeat click works too). The first
   *  time, the fragment goes into the address bar as well, so the moment is linkable and a direct visit to #surprise
   *  gets the :target pulse. Never on a repeat: rewriting history under the Next.js router makes it re-sync the
   *  address bar to its own URL and drop the fragment (seen 2026-10-05 in the Playwright check). */
  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent(SURPRISE_EVENT));
    if (window.location.hash !== "#surprise") window.location.hash = "surprise";
  };

  return (
    <a href="#surprise" className="intent-link" onClick={open}>
      <span className="intent-q">{q}</span>
      <span className="intent-label">{label} <span aria-hidden="true">&#8594;</span></span>
      <span className="intent-verb mono">{verb}</span>
    </a>
  );
}
