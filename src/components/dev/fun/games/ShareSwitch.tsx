// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/ShareSwitch.tsx
// ----------------------------------------------------------------------------
// "SHARE MY RESULTS ON THE PUBLIC BOARD" (PRIME's decisions of 08/11/2026):
// on by default, kept in this browser (the games' one storage key, through
// src/lib/fun/board.ts), shown in every daily game's frame and on the scores
// page. A native checkbox with the switch role, so a keyboard, a screen reader
// and a touch screen all reach it; the label is the whole 44 px target. It
// takes its words from the page that shows it, so it reads no message
// namespace of its own.
// ============================================================================

"use client";

// React's state and effects.
import { useEffect, useState } from "react";
// The switch's value and the page-wide change signal.
import { setShare, shareOn, subscribeBoard } from "@/lib/fun/board";

/**
 * The sharing switch.
 *
 * @param props the label, and an optional line under it
 * @returns the switch
 */
export default function ShareSwitch(props: { label: string; note?: string }) {
  // On by default, as the board is; the browser's own value is read after mount.
  const [on, setOn] = useState(true);
  // After mount: the stored value, and every later change made elsewhere on the page.
  useEffect(() => {
    // Read now.
    setOn(shareOn());
    // And followed.
    return subscribeBoard(() => setOn(shareOn()));
  }, []);
  // The switch.
  return (
    <span className="fg-share-wrap">
      <label className="fg-share">
        {/* The control itself: a checkbox announced as a switch, visually replaced by the track beside it. */}
        <input type="checkbox" role="switch" className="fg-share-input" checked={on} onChange={(e) => setShare(e.target.checked)} />
        {/* The track and its thumb, drawn for sighted players only. */}
        <span className={`fg-share-track${on ? " fg-share-track-on" : ""}`} aria-hidden="true">
          <span className="fg-share-thumb" />
        </span>
        {/* The words. */}
        <span className="fg-share-label">{props.label}</span>
      </label>
      {/* An optional line under it. */}
      {props.note && <span className="fg-small fg-muted fg-share-note">{props.note}</span>}
    </span>
  );
}
