// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/MorePuzzlesSlot.tsx
// ----------------------------------------------------------------------------
// THE SLOT FOR "SOLVE THE OTHER PUZZLES" (PRIME 05/11/2026: "At the end of the
// page of each puzzle, add a call-out ... right after the results section").
// The call-out itself is a server component (MorePuzzles.tsx), so the other
// games' names come from the server and no message namespace has to be shipped
// to the client. The game page renders it and hands it to this provider; the
// frame every game sits in (GameShell) reads it with useMorePuzzles() and
// places it right after the result, so no game has to pass it along.
// "Play next" (PRIME 09/11/2026 23:04) travels the same way: the page renders
// NextPuzzle.tsx and hands it over as `next`; GameShell puts it first among the
// result's actions (useNextPuzzle()).
// Since every game page wraps its game in this provider, it also puts the
// game's error boundary around it (GameErrorBoundary.tsx, PRIME 11/11/2026
// 23:53): a game that fails while drawing says so in its own place, instead of
// blanking the page with Next's bare "Application error".
// ============================================================================

"use client";

// The context and its hook.
import { createContext, useContext, type ReactNode } from "react";
// The boundary that catches a game failing while it draws.
import GameErrorBoundary from "./games/GameErrorBoundary";

/** The call-out to place after the result, or null on a page that has none. */
const MorePuzzlesContext = createContext<ReactNode>(null);
/** The "Play next" button to place among the result's actions, or null on a page that has none. */
const NextPuzzleContext = createContext<ReactNode>(null);

/**
 * Hands the call-out to the game's frame.
 *
 * @param props the call-out and the "Play next" button (both rendered on the server) and the game
 * @returns the game, with the call-out and the button available to its frame, inside its error boundary
 */
export function MorePuzzlesProvider(props: { more: ReactNode; next?: ReactNode; children: ReactNode }) {
  // The call-out and the button, for every frame inside.
  return (
    <MorePuzzlesContext.Provider value={props.more}>
      <NextPuzzleContext.Provider value={props.next ?? null}>
        {/* The game, inside the boundary that shows a failure in its place. */}
        <GameErrorBoundary>{props.children}</GameErrorBoundary>
      </NextPuzzleContext.Provider>
    </MorePuzzlesContext.Provider>
  );
}

/**
 * The call-out handed to this game's frame, if any.
 *
 * @returns the call-out, or null
 */
export function useMorePuzzles(): ReactNode {
  // Read from the nearest provider.
  return useContext(MorePuzzlesContext);
}

/**
 * The "Play next" button handed to this game's frame, if any.
 *
 * @returns the button, or null
 */
export function useNextPuzzle(): ReactNode {
  // Read from the nearest provider.
  return useContext(NextPuzzleContext);
}
