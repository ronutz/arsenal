// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/config/funGames.ts
// ----------------------------------------------------------------------------
// THE /dev/fun GAMES, LISTED ONCE (PRIME 03/11/2026 02:28). The shelf
// (src/app/[locale]/dev/fun/page.tsx) draws its game cards from this list, the
// machine-readable index (scripts/gen-machine-legible.mts) counts it, and the
// guard (scripts/check-fun-games.mts) holds every entry to a page, a registered
// engine and its card strings in en and pt-BR, and every game page to an entry.
// The id is the page's slug under /dev/fun/ and the engine's folder name.
// ============================================================================

/** One game on the shelf. */
export interface FunGame {
  /** The slug under /dev/fun/, the engine folder and the message namespace devFun.games.<id>. */
  readonly id: string;
  /** Whether the game has a daily puzzle or run, the same for everyone on a UTC day (the card carries the DAILY badge). */
  readonly daily: boolean;
}

/** A group of games on the shelf, with its heading key under devFun.gameGroups. */
export interface FunGameGroup {
  /** The heading's key: devFun.gameGroups.<key>. */
  readonly key: "daily" | "arcade";
  /** The games, in shelf order. */
  readonly games: readonly FunGame[];
}

/** The shelf, in order: the daily puzzles first, then the games played for as long as one likes. */
export const FUN_GAME_GROUPS: readonly FunGameGroup[] = [
  {
    // The daily puzzles: one a day, a streak, a share card.
    key: "daily",
    games: [
      // Name the network prefix in six tries (the subnet as a guessing game).
      { id: "prefix-of-the-day", daily: true },
      // Five clues, one IT term: the fewer clues, the better.
      { id: "five-clues", daily: true },
      // One access point per row, column and floor zone, none touching (a placement logic puzzle).
      { id: "access-points", daily: true },
      // Fill the grid with 0 and 1, balanced, no three alike in a row, with = and x hints.
      { id: "bit-balance", daily: true },
      // One path through every cell, the numbered checkpoints in order.
      { id: "patch-path", daily: true },
      // Elect the root bridge and block the right ports so no loop is left.
      { id: "spanning-tree", daily: true },
      // Find the attacker in the day's log, its first malicious line and the line where it got in.
      { id: "log-detective", daily: true },
      // Fifteen links and senders a day: phishing or legitimate, and the tell explained.
      { id: "phish-or-legit", daily: true },
    ],
  },
  {
    // Arcade, levels and idle: played as long as one likes (four of them also have a daily run).
    key: "arcade",
    games: [
      // Bugs pop up for a moment; squash them, spare the features (60 seconds, a daily round and practice).
      { id: "whack-a-bug", daily: true },
      // Slide prefixes on a board: sibling blocks merge into the block above them (a daily challenge and free play).
      { id: "aggregate", daily: true },
      // Build an access list from cards, in the right order, and send traffic through it (20 levels and a daily level).
      { id: "first-match", daily: true },
      // Get out of the editor (and other terminal traps) with the right keystrokes (13 levels and a daily escape, PRIME 03/11/2026).
      { id: "exit-the-editor", daily: true },
      // An idle game: keep a service up, buy capacity, answer incidents, review deploys (it runs while you are away).
      { id: "incident-commander", daily: false },
    ],
  },
];

/** Every game, flattened, in shelf order. */
export const FUN_GAMES: readonly FunGame[] = FUN_GAME_GROUPS.flatMap((g) => g.games);
