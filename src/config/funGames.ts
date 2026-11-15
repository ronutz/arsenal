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
// The id is the page's slug and the engine's folder name. The group decides the
// section: the arcade group's pages live under /arcade/<id> (PRIME 08/11/2026
// 23:14, "Yes move them"), every other game under /dev/fun/<id>; funPagePath()
// below is the one place that says so.
// ============================================================================

/** One game on the shelf. */
export interface FunGame {
  /** The page's slug (under /arcade/ or /dev/fun/, by group), the engine folder and the message namespace devFun.games.<id>. */
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
    // Arcade, levels and idle: played as long as one likes (seven of them also have a daily run).
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
      // Falling headers: steer each into its layer and set its field so every header names the next (a daily run and practice, 08/11/2026).
      { id: "packet-stack", daily: true },
      // Steer a packet through routers that each take one off its TTL, and reach the host before zero (twelve packets, a daily run and practice).
      { id: "ttl", daily: true },
      // Permit or deny connections at the firewall desk against a policy that tightens each round, then the audit (a daily shift and practice, PRIME 08/11/2026).
      { id: "rule-inspector", daily: true },
      // An idle game: keep a service up, buy capacity, answer incidents, review deploys (it runs while you are away).
      { id: "incident-commander", daily: false },
    ],
  },
];

/** Every game, flattened, in shelf order. */
export const FUN_GAMES: readonly FunGame[] = FUN_GAME_GROUPS.flatMap((g) => g.games);

/** One toy on the /dev/fun shelf (a page under /dev/fun with no puzzle or engine). */
export interface FunToy {
  /** The card's message key: devFun.toys.<key> (its name and blurb). */
  readonly key: string;
  /** The toy's page below the locale. */
  readonly href: string;
  /** Whether the card shows the one language its content exists in (none does now). */
  readonly badged: boolean;
  /** The page is generated in English alone, so every locale's card links the English page. */
  readonly enOnly?: boolean;
}

// The toys, in shipping order (moved here from the shelf page on 11/11/2026 so the home page can count them; PRIME 21:20,
// a counter for the puzzles, games and toys under "Currently serving"). `badged` marks a toy whose content exists in a
// single language and shows that language on its card. None does now: the Mega Brain, once Portuguese only, reads fully
// in English as well (PRIME 03/11/2026: "fully translate the card and the actual page for Mega Brain").
export const FUN_TOYS: readonly FunToy[] = [
  { key: "megaBrain", href: "/dev/fun/mega-brain", badged: false }, // the Mega Brain
  { key: "meetingBingo", href: "/dev/fun/meeting-bingo", badged: false }, // meeting bingo
  { key: "bossScreens", href: "/dev/fun/boss-screens", badged: false }, // the boss screens
  { key: "catDistribution", href: "/dev/fun/cat-distribution", badged: false }, // the cat distribution
  // Added 2026-07-30 (PRIME): an inconspicuous card, last on the shelf. It was built unlisted and stays modest here on
  // purpose - the copy does not say what it measures, so it still rewards the person who opens it. enOnly (R-18 audit
  // fix, 2026-08-27): the meter generates for en alone by design, so every locale's card links the EN page explicitly - a
  // link to a route that exists, instead of a locale-prefixed path that was never built. Outside English its card says so
  // with an "EN" badge (review R4-10).
  { key: "importanceMeter", href: "/dev/fun/importance-meter", badged: false, enOnly: true },
  // The LGTM homage and its stamp toy (queue 5d; PRIME 12/11/2026 21:24, 14/11/2026 18:19 and 22:09): the music video
  // behind a click, the site's own way to yes, an original tune in four eras of game sound, and a stamp that reads
  // before it approves. Both in every live language.
  { key: "lgtm", href: "/dev/fun/lgtm", badged: false }, // the LGTM homage
  { key: "lgtmStamp", href: "/dev/fun/lgtm-stamp", badged: false }, // the LGTM stamp
];

/** The puzzles, games and toys together: the home page's fourth figure (PRIME 11/11/2026 21:20). Derived, never typed. */
export const FUN_SHELF_COUNT: number = FUN_GAMES.length + FUN_TOYS.length;

/** The arcade group's ids, read once for the two address helpers below. */
const ARCADE_IDS: ReadonlySet<string> = new Set(FUN_GAME_GROUPS.find((g) => g.key === "arcade")?.games.map((g) => g.id) ?? []);

/**
 * The section a game's or toy's page lives under. The arcade games moved to /arcade on 08/11/2026 (PRIME 23:14, "Yes
 * move them"; the old addresses answer with a permanent redirect in public/_redirects); the daily puzzles and the toys
 * stay under /dev/fun.
 *
 * @param id a game's id, or a toy's slug
 * @returns "/arcade" for an arcade game, "/dev/fun" for anything else
 */
export function funSection(id: string): "/arcade" | "/dev/fun" {
  // Membership of the arcade group decides it.
  return ARCADE_IDS.has(id) ? "/arcade" : "/dev/fun";
}

/**
 * A game's or toy's page below the locale, without the trailing slash: "/arcade/ttl", "/dev/fun/five-clues",
 * "/dev/fun/meeting-bingo". Links, share cards, the scoreboard's play link, the share-card drawing and the guard all
 * build the address here, so a game that changes group changes address in one place.
 *
 * @param id a game's id, or a toy's slug
 * @returns the path, for a locale-aware Link or after "/<locale>"
 */
export function funPagePath(id: string): string {
  // The section, then the slug.
  return `${funSection(id)}/${id}`;
}
