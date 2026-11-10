// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/NextPuzzle.tsx
// ----------------------------------------------------------------------------
// "PLAY NEXT" (PRIME 09/11/2026 23:04: "quickly visible button 'play next
// game/puzzle of the day' on each game (and puzzle) right after finishing").
// A server component: every daily game's name and label come from the pack
// here, in shelf order, so no message namespace has to be shipped to the
// client. The client island (NextPuzzleLink) picks, after mount, the first
// daily game after this one, going round the shelf, that this browser has not
// finished today; when every one is done, the button leads to the scores
// dashboard instead. The page hands it to MorePuzzlesProvider as `next`, and
// GameShell puts it first among the result's actions.
// ============================================================================

// The page's strings, on the server.
import { getTranslations } from "next-intl/server";
// The shelf's games in shelf order, and each one's page.
import { FUN_GAME_GROUPS, funPagePath } from "@/config/funGames";
// The island that chooses.
import NextPuzzleLink from "./NextPuzzleLink";

/**
 * The button's candidates and labels.
 *
 * @param props the game on this page
 * @returns the island, with every daily game's label and page
 */
export default async function NextPuzzle({ current }: { current: string }) {
  // The shelf's strings.
  const t = await getTranslations("devFun");
  // Every daily game, in shelf order, with its page and its button label.
  const order = FUN_GAME_GROUPS.flatMap((g) => g.games)
    .filter((g) => g.daily)
    .map((g) => ({ id: g.id, href: funPagePath(g.id), label: t("more.next", { name: t(`games.${g.id}.cardName`) }) }));
  // The island.
  return <NextPuzzleLink current={current} order={order} allDone={t("more.allDone")} />;
}
