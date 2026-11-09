// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/scores/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/scores: THE GAMES' SCORES AND STATISTICS (PRIME 08/11/2026: "a
// scoreboard for the games ... streamlined with the games, as well as an
// experience on itself for those wanting to see more about scores and game
// stats"). A static shell: the head is rendered here in every language, and
// the board itself (src/components/dev/fun/ScoresBoard.tsx) reads the public
// endpoints in the browser after the page loads, so the static export needs
// nothing from the database. Linked near the top of the /dev/fun shelf and
// under every daily game's "Today's board". It mounts no game, so it is not a
// shelf entry (scripts/check-fun-games.mts).
//
// Its share card is the shelf's (the mosaic of the games, drawn by
// scripts/og-games.mts): the page is the shelf's own scoreboard, and a card of
// its own would need a drawing in og-games.mts, a line in gen-og.mts's game
// loop and one in check-og.mjs's list.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// The share card and the one description for the meta, og and twitter fields.
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
// Server-side strings and the static locale.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site chrome.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// Only the namespace the board needs travels to the browser.
import MessageSlice from "@/components/MessageSlice";
// The crumb back to the shelf.
import { Link } from "@/i18n/navigation";
// The board.
import ScoresBoard from "@/components/dev/fun/ScoresBoard";
// The games on the board, for their names.
import { BOARD_GAMES } from "@/lib/fun/board-rules";

/**
 * The page's title and description, in the page's language.
 *
 * @param props the route parameters
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The locale of this export.
  const { locale } = await params;
  // The page's strings.
  const t = await getTranslations({ locale, namespace: "devFun.scores" });
  // Title and description, with the shelf's share card.
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("game", "shelf", locale, t("title")), "dev/fun/scores") };
}

/**
 * The page.
 *
 * @param props the route parameters
 * @returns the page
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  // The locale of this export.
  const { locale } = await params;
  // Static rendering for that locale.
  setRequestLocale(locale);
  // The page's strings.
  const t = await getTranslations("devFun.scores");
  // The shelf's strings, for the games' names.
  const tf = await getTranslations("devFun");
  // Each board game's name on the shelf.
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
              <p className="fg-crumb mono">
                <Link href="/dev/fun" className="fg-crumb-link">
                  /dev/fun
                </Link>
              </p>
              <h1 className="article-title">{t("title")}</h1>
              <p className="fg-tagline">{t("tagline")}</p>
              <p className="fg-intro">{t("intro")}</p>
            </div>
            <MessageSlice namespaces={["devFun.scores"]}>
              <ScoresBoard names={names} levels={levels} />
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
