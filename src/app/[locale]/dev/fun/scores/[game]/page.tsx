// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/scores/[game]/page.tsx
// ----------------------------------------------------------------------------
// ONE GAME'S FULL SCOREBOARD (PRIME 09/11/2026 21:41: the scores page becomes a
// dashboard "from where the complete individual stats scoreboard for each item
// can be accessed"). One static page per game on the board, in every language:
// today's players, the share who solved, the average and median, the histogram,
// the top ten with initials and countries, the countries, and the last 7 and 30
// days with each window's best round; Spanning Tree keeps its two levels as two
// tabs (#spanning-tree:hard opens the second). The board itself is the same
// client component the scores page used before (ScoresBoard, narrowed with
// `only`), reading the public endpoints after the page loads.
//
// Its share card is the game's own (the card its game page already carries), so
// no drawing is added to scripts/og-games.mts.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// A 404 for an id that is not on the board.
import { notFound } from "next/navigation";
// The share card and the one description for the meta, og and twitter fields.
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
// Server-side strings and the static locale.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The live locales, for the static parameters.
import { routing } from "@/i18n/routing";
// The site chrome.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// Only the namespace the board needs travels to the browser.
import MessageSlice from "@/components/MessageSlice";
// The crumbs back to the shelf and the dashboard.
import { Link } from "@/i18n/navigation";
// The board.
import ScoresBoard from "@/components/dev/fun/ScoresBoard";
// The games on the board.
import { BOARD_GAMES, boardGame } from "@/lib/fun/board-rules";

/**
 * One page per locale and game on the board.
 *
 * @returns the static parameters
 */
export function generateStaticParams() {
  // Every live locale times every board game.
  return routing.locales.flatMap((locale) => BOARD_GAMES.map((g) => ({ locale, game: g.id })));
}

/**
 * The page's title and description, in the page's language.
 *
 * @param props the route parameters
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; game: string }> }): Promise<Metadata> {
  // The locale and the game.
  const { locale, game } = await params;
  // Not a board game: no metadata (the page answers 404).
  if (!boardGame(game)) return {};
  // The page's strings, and the shelf's for the game's name.
  const t = await getTranslations({ locale, namespace: "devFun.scores" });
  const tf = await getTranslations({ locale, namespace: "devFun" });
  // The game's name.
  const name = tf(`games.${game}.cardName`);
  // Title and description, with the game's own share card.
  return { title: t("gameMetaTitle", { game: name }), ...withDescription(t("gameMetaDescription", { game: name }), ogImages("game", game, locale, t("gameTitle", { game: name })), `dev/fun/scores/${game}`) };
}

/**
 * The page.
 *
 * @param props the route parameters
 * @returns the page
 */
export default async function Page({ params }: { params: Promise<{ locale: string; game: string }> }) {
  // The locale and the game.
  const { locale, game } = await params;
  // Only games on the board have a page.
  if (!boardGame(game)) notFound();
  // Static rendering for that locale.
  setRequestLocale(locale);
  // The page's strings.
  const t = await getTranslations("devFun.scores");
  // The shelf's strings, for the games' names.
  const tf = await getTranslations("devFun");
  // Each board game's name on the shelf (the board names its tabs with them).
  const names = Object.fromEntries(BOARD_GAMES.map((g) => [g.id, tf(`games.${g.id}.cardName`)]));
  // Spanning Tree's two levels.
  const levels = { easy: tf("games.spanning-tree.easy"), hard: tf("games.spanning-tree.hard") };
  // Head, then the board inside its message slice.
  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container fg-page">
            <div className="fg-head">
              {/* The way back: the shelf, then the dashboard of every game. */}
              <p className="fg-crumb mono">
                <Link href="/dev/fun" className="fg-crumb-link">
                  /dev/fun
                </Link>
                {" / "}
                <Link href="/dev/fun/scores" className="fg-crumb-link">
                  {t("crumb")}
                </Link>
              </p>
              <h1 className="article-title">{t("gameTitle", { game: names[game] })}</h1>
              <p className="fg-intro">{t("intro")}</p>
            </div>
            <MessageSlice namespaces={["devFun.scores"]}>
              <ScoresBoard names={names} levels={levels} only={game} />
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
