"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/InterestToggle.tsx
// ----------------------------------------------------------------------------
// THE INTEREST COUNTS' SWITCH ON THE SETTINGS PAGE (PRIME 12/11/2026 02:35).
//
// The question in InterestRuntime is asked once; this is where the answer can
// be changed at any time, in either direction. One switch ("Count my use"),
// one line under it saying what is true right now, and a link to the privacy
// page's account of what is counted.
//
// The line tells the truth about sending, not about the stored value: when the
// browser sends Global Privacy Control or Do Not Track, nothing is sent
// whatever the switch says, so the line says that instead of "On". The switch
// stays usable in that case, so a reader can still record a no (or a yes that
// takes effect if they later turn the browser's signal off).
//
// The value lives in src/lib/interest/client.ts (one localStorage key). The
// switch follows changes made elsewhere on the page (the question answered
// while this page is open) and in other tabs. Before the stored value has been
// read, the switch shows off: the server cannot know the answer, and off is
// what "nothing chosen" means.
// ============================================================================

// React's state and effects.
import { useEffect, useState } from "react";
// The link to the privacy page, in the page's language.
import { Link } from "@/i18n/navigation";
// The choice and the browser's own "do not count me" signals.
import { INTEREST_EVENT, browserSaysNo, readInterestChoice, writeInterestChoice } from "@/lib/interest/client";

/** The switch's strings, in the page's language. */
export interface InterestToggleLabels {
  /** The switch's name. */
  toggle: string;
  /** The line shown when counts are being sent. */
  on: string;
  /** The line shown when nothing is sent. */
  off: string;
  /** The line shown when the browser itself says no. */
  browserNo: string;
  /** The link to the privacy page's section. */
  more: string;
}

/**
 * The switch, its status line, and the link to what is counted.
 *
 * @param props the strings
 * @returns the control
 */
export default function InterestToggle(props: { labels: InterestToggleLabels }) {
  // Whether the stored answer is yes (false until read after mount).
  const [on, setOn] = useState(false);
  // Whether the browser itself says no (read after mount: the server has no browser).
  const [refused, setRefused] = useState(false);

  // The stored answer and the browser's signal, read once after mount and followed when the answer changes.
  useEffect(() => {
    // Read both.
    const sync = () => { setOn(readInterestChoice() === "yes"); setRefused(browserSaysNo()); };
    // Now.
    sync();
    // A change made in another tab: only this feature's key (or a cleared store).
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key.startsWith("ronutz:interest")) sync(); };
    // Listening: the question answered on this page, and other tabs.
    window.addEventListener(INTEREST_EVENT, sync);
    window.addEventListener("storage", onStorage);
    // Stopped.
    return () => { window.removeEventListener(INTEREST_EVENT, sync); window.removeEventListener("storage", onStorage); };
  }, []);

  // Flip the answer: kept in this browser, and the rest of the page told.
  const flip = () => {
    // The other answer.
    const next = !on;
    // Shown at once.
    setOn(next);
    // Kept (this also closes the question if it is open).
    writeInterestChoice(next ? "yes" : "no");
  };

  // What is true right now: the browser's no wins over a stored yes.
  const status = refused ? props.labels.browserNo : on ? props.labels.on : props.labels.off;

  // The control: the same frame, switch and knob as the Reading section's control.
  return (
    <div className="gloss-hint-toggle">
      <div className="gloss-hint-toggle-copy">
        {/* The status line is announced when it changes. */}
        <span className="gloss-hint-toggle-label" role="status" aria-live="polite">
          {status}
        </span>
        <Link href="/privacy#interest" className="gloss-hint-toggle-desc interest-toggle-more">
          {props.labels.more}
        </Link>
      </div>
      {/* The switch; its lit state shows what is sent, so a browser-level no leaves it unlit even with a stored yes. */}
      <button
        type="button"
        id="interest-toggle"
        role="switch"
        aria-checked={on}
        className="gloss-hint-toggle-switch"
        data-on={on && !refused}
        onClick={flip}
      >
        <span className="gloss-hint-toggle-knob" aria-hidden="true" />
        {props.labels.toggle}
      </button>
    </div>
  );
}
