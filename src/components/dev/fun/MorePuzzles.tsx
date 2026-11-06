// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/MorePuzzles.tsx
// ----------------------------------------------------------------------------
// "SOLVE THE OTHER PUZZLES" (PRIME 05/11/2026), the call-out under a game's
// result: every other daily game, by its shelf name, each a link to today's
// puzzle, with a tick once this browser has solved today's (a dot when it was
// played and not solved, so the mark is not colour alone; the words are there
// for a screen reader), and a link back to the whole shelf. A server component:
// the names come from the pack here, the marks from a small client island
// (ShelfMark) that reads the games' one storage key after mount, so the static
// HTML and the first render agree. The page hands it to MorePuzzlesProvider;
// GameShell places it right after the result.
// ============================================================================

// The page's strings, on the server.
import { getTranslations } from "next-intl/server";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The shelf's games, in shelf order.
import { FUN_GAME_GROUPS } from "@/config/funGames";
// The tick for a game solved today.
import { ShelfMark } from "./ShelfStatus";

/**
 * The call-out: the other daily games, today's puzzle of each.
 *
 * @param props the game on this page (left out of the list)
 * @returns the call-out
 */
export default async function MorePuzzles({ current }: { current: string }) {
  // The shelf's strings.
  const t = await getTranslations("devFun");
  // Every daily game but this one, in shelf order.
  const others = FUN_GAME_GROUPS.flatMap((g) => g.games).filter((g) => g.daily && g.id !== current);
  // The call-out.
  return (
    <nav className="fg-more" aria-labelledby="fg-more-title">
      <h2 id="fg-more-title" className="fg-more-title">{t("more.title")}</h2>
      <ul className="fg-more-list">
        {others.map((g) => (
          <li key={g.id}>
            <Link href={`/dev/fun/${g.id}`} className="fg-more-link">
              {/* The game's name on the shelf. */}
              <span>{t(`games.${g.id}.cardName`)}</span>
              {/* A tick once today's is solved, a dot once it was played; nothing before. */}
              <ShelfMark gameId={g.id} solved={t("shelfSolved")} played={t("shelfPlayed")} />
            </Link>
          </li>
        ))}
      </ul>
      {/* The whole shelf, toys included. */}
      <p className="fg-more-all">
        <Link href="/dev/fun" className="fg-more-all-link">
          {t("more.all")}
        </Link>
      </p>
    </nav>
  );
}
