// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/MorePuzzles.tsx
// ----------------------------------------------------------------------------
// "SOLVE THE OTHER PUZZLES" (PRIME 05/11/2026), the call-out under a game's
// result: every other daily game, by its shelf name, each a link to today's
// puzzle, with a tick once this browser has solved today's (a dot when it was
// played and not solved, so the mark is not colour alone; the words are there
// for a screen reader), and links back to the shelf and to the arcade. A server component:
// the names come from the pack here, the marks from a small client island
// (ShelfMark) that reads the games' one storage key after mount, so the static
// HTML and the first render agree. The page hands it to MorePuzzlesProvider;
// GameShell places it right after the result. Each pill carries its game's
// drawing in the game's accent (GameGlyph; PRIME 08/11/2026).
// ============================================================================

// The page's strings, on the server.
import { getTranslations } from "next-intl/server";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The shelf's games, in shelf order, and each one's page (/arcade/<id> or /dev/fun/<id>, 08/11/2026).
import { FUN_GAME_GROUPS, funPagePath } from "@/config/funGames";
// The tick for a game solved today.
import { ShelfMark } from "./ShelfStatus";
// Each game's small drawing, on its pill (PRIME 08/11/2026).
import GameGlyph from "./GameGlyph";

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
            <Link href={funPagePath(g.id)} className={`fg-more-link fg-glyph--${g.id}`}>
              {/* The game's drawing, in its accent, so the pills tell apart at a glance. */}
              <GameGlyph id={g.id} className="fg-glyph-pill" />
              {/* The game's name on the shelf. */}
              <span>{t(`games.${g.id}.cardName`)}</span>
              {/* A tick once today's is solved, a dot once it was played; nothing before. */}
              <ShelfMark gameId={g.id} solved={t("shelfSolved")} played={t("shelfPlayed")} />
            </Link>
          </li>
        ))}
      </ul>
      {/* The shelf (the daily puzzles and the toys) and the arcade, whose games moved to /arcade on 08/11/2026. */}
      <p className="fg-more-all">
        <Link href="/dev/fun" className="fg-more-all-link">
          {t("more.all")}
        </Link>
        {/* A dot between the two links, to the eye only; the no-break space keeps it on the first link's line when the
            pair wraps on a phone. */}
        <span aria-hidden="true">{"\u00a0· "}</span>
        <Link href="/arcade" className="fg-more-all-link">
          {t("more.arcade")}
        </Link>
      </p>
    </nav>
  );
}
