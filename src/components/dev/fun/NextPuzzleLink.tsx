// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/NextPuzzleLink.tsx
// ----------------------------------------------------------------------------
// The client half of "Play next" (NextPuzzle.tsx): reads this browser's record
// of the games after mount and links to the first daily game after the current
// one, going round the shelf, not finished today; with every one done, to the
// scores dashboard. Before mount it links to the next game on the shelf, so the
// static HTML and the first render agree and the button is there at once.
// ============================================================================

"use client";

// React's state and effects.
import { useEffect, useState } from "react";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// Today's UTC day, after mount.
import { useRealToday } from "@/lib/fun/hooks";
// The records.
import { loadRecord } from "@/lib/fun/storage";

/** One candidate: the game, its page and its button label. */
interface Candidate {
  /** The game's id. */
  id: string;
  /** Its page. */
  href: string;
  /** "Next puzzle: <name>". */
  label: string;
}

/**
 * The button.
 *
 * @param props this game, every daily game in shelf order, and the label for "all done"
 * @returns the link, styled as the result's first button
 */
export default function NextPuzzleLink(props: { current: string; order: Candidate[]; allDone: string }) {
  // Today, after mount.
  const today = useRealToday();
  // The games after this one, going round the shelf (this one left out).
  const at = props.order.findIndex((c) => c.id === props.current);
  const after = [...props.order.slice(at + 1), ...props.order.slice(0, Math.max(0, at))];
  // The choice: the next on the shelf until the record is read; null once every game is done today.
  const [choice, setChoice] = useState<Candidate | null>(after[0] ?? null);
  // Read when the day is known (and again when the result that brought the button changes nothing else).
  useEffect(() => {
    // Not before the day.
    if (!today) return;
    // The first game not finished today.
    setChoice(after.find((c) => loadRecord(c.id).lastDailyDay !== today) ?? null);
    // `after` is derived from the props, which do not change on a page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);
  // Every game done today: the scores.
  if (!choice) {
    return (
      <Link href="/dev/fun/scores" className="fg-button fg-button-next">
        {props.allDone} <span aria-hidden="true">&#8594;</span>
      </Link>
    );
  }
  // The next game.
  return (
    <Link href={choice.href} className={`fg-button fg-button-next fg-glyph--${choice.id}`}>
      {choice.label} <span aria-hidden="true">&#8594;</span>
    </Link>
  );
}
