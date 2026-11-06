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
// ============================================================================

"use client";

// The context and its hook.
import { createContext, useContext, type ReactNode } from "react";

/** The call-out to place after the result, or null on a page that has none. */
const MorePuzzlesContext = createContext<ReactNode>(null);

/**
 * Hands the call-out to the game's frame.
 *
 * @param props the call-out (rendered on the server) and the game
 * @returns the game, with the call-out available to its frame
 */
export function MorePuzzlesProvider(props: { more: ReactNode; children: ReactNode }) {
  // The call-out, for every frame inside.
  return <MorePuzzlesContext.Provider value={props.more}>{props.children}</MorePuzzlesContext.Provider>;
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
