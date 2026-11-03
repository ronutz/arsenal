// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/ShelfStatus.tsx
// ----------------------------------------------------------------------------
// THE /dev/fun SHELF'S MEMORY OF TODAY (PRIME 03/11/2026, "Yes on all your
// suggested ideas": "solved today" and the streak on each daily card, and a
// line counting today's daily games). Two small client islands on a server
// page: they read the games' one storage key (src/lib/fun/storage.ts) after
// mount, so the static HTML and the first render agree, and show nothing for a
// game this browser has never played. The strings arrive as props from the
// server page, so no message namespace has to be shipped to the client.
// ============================================================================

"use client";

// React's state and effects.
import { useEffect, useState } from "react";
// Today's UTC day, read after mount.
import { useToday } from "@/lib/fun/hooks";
// The records and the live streak.
import { liveStreak, loadRecord } from "@/lib/fun/storage";

/** What one card shows: solved or played today, and the streak; null when there is nothing to say. */
interface CardState {
  /** "solved": won today's daily; "played": finished it without winning; null: not today. */
  today: "solved" | "played" | null;
  /** The live streak (0 hides it). */
  streak: number;
}

/**
 * The state of one game for today.
 *
 * @param gameId the game's id
 * @param day today's UTC day
 * @returns what its card shows
 */
function stateOf(gameId: string, day: string): CardState {
  // The stored record (defaults when none).
  const r = loadRecord(gameId);
  // Won today, played today, or neither.
  const today = r.lastWinDay === day ? "solved" : r.lastDailyDay === day ? "played" : null;
  // The streak as it stands today.
  return { today, streak: liveStreak(r, day) };
}

/**
 * The chips on one daily game's card: "Solved today" or "Played today", and the streak.
 *
 * @param props the game's id and the two labels (the streak label takes the number in place of {n})
 * @returns the chips, or nothing before mount and for a game not played lately
 */
export function ShelfCardStatus(props: { gameId: string; solved: string; played: string; streak: string }) {
  // Today, after mount.
  const day = useToday();
  // The card's state, once read.
  const [state, setState] = useState<CardState | null>(null);
  // Read the record when the day is known.
  useEffect(() => {
    // Not before mount.
    if (!day) return;
    // Read once.
    setState(stateOf(props.gameId, day));
  }, [day, props.gameId]);
  // Nothing to say yet, or nothing at all.
  if (!state || (!state.today && state.streak === 0)) return null;
  // The chips.
  return (
    <span className="devfun-status">
      {/* Solved or played today. */}
      {state.today && (
        <span className={`devfun-status-chip mono${state.today === "solved" ? " devfun-status-done" : ""}`}>
          {state.today === "solved" ? props.solved : props.played}
        </span>
      )}
      {/* The live streak. */}
      {state.streak > 0 && <span className="devfun-status-chip mono">{props.streak.replace("{n}", String(state.streak))}</span>}
    </span>
  );
}

/**
 * The line over the games: how many of the daily games this browser has played today.
 *
 * @param props the daily games' ids and the line's text (with {done} and {total} in place of the numbers)
 * @returns the line, or nothing before mount and before the first daily game of the day
 */
export function ShelfToday(props: { gameIds: readonly string[]; label: string }) {
  // Today, after mount.
  const day = useToday();
  // How many were played today.
  const [done, setDone] = useState<number | null>(null);
  // Count when the day is known.
  useEffect(() => {
    // Not before mount.
    if (!day) return;
    // Each daily game played today counts once.
    setDone(props.gameIds.filter((id) => stateOf(id, day).today !== null).length);
  }, [day, props.gameIds]);
  // Nothing before mount or before the first game of the day.
  if (done === null || done === 0) return null;
  // The line, read politely when it appears.
  return (
    <p className="devfun-today mono" role="status">
      {props.label.replace("{done}", String(done)).replace("{total}", String(props.gameIds.length))}
    </p>
  );
}
