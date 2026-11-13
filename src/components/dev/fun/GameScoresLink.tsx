// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/GameScoresLink.tsx
// ----------------------------------------------------------------------------
// THE WAY FROM A GAME TO ITS SCOREBOARD (PRIME 12/11/2026: "make the reverse
// link as well, so players can quickly get to the scoreboard from the
// pastime's page"). A server component placed in each board game's page head,
// right under the introduction, where a player looks before playing: one pill
// link to /dev/fun/scores/<id>. The scoreboard page carries the opposite link
// ("Play <game>"). A game that is not on the board renders nothing, so the
// link can never point at a page that does not exist.
// ============================================================================

// The page's strings, on the server (nothing is shipped to the browser).
import { getTranslations } from "next-intl/server";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The games on the board: only they have a scoreboard page.
import { boardGame } from "@/lib/fun/board-rules";

/**
 * The link to one game's full scoreboard.
 *
 * @param props the game's id on the board
 * @returns the link, or nothing for a game that is not on the board
 */
export default async function GameScoresLink({ game }: { game: string }) {
  // Not on the board: no scoreboard page, so no link.
  if (!boardGame(game)) return null;
  // The shelf's strings: the game's name and the link's label.
  const t = await getTranslations("devFun");
  // The pill link, in the same style as the shelf's own scores call-out.
  return (
    <p className="fg-scores-cta">
      {/* The game's own scoreboard page, in the page's language. */}
      <Link href={`/dev/fun/scores/${game}`} className="fg-scores-cta-link">
        {t("scores.gameScoreboard", { game: t(`games.${game}.cardName`) })}
      </Link>
    </p>
  );
}
