// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/arcade/page.tsx
// ----------------------------------------------------------------------------
// /arcade — THE ARCADE (PRIME 08/11/2026: "How about we create a dedicated
// ronutz.com/arcade section and develop a few (or maybe way more than a few)
// games honoring well-established and successful formulas ...?"; his answer to
// the plan, "Both": teaching games here, pure homages on a separate site later).
//
// The hub lists the shelf's "arcade" group from src/config/funGames.ts, so a game
// added there appears here (since PRIME's 22:52 of 08/11/2026, "Games should be
// only in one place", /dev/fun lists only the daily puzzles and one card that
// leads here). Each game's page is /arcade/<id> since PRIME's 23:14 ("Yes move
// them"); it was /dev/fun/<id> before, and those addresses answer with a
// permanent redirect. The scoreboard keys rounds by game id, not by address, so
// it, the daily state and the guard (scripts/check-fun-games.mts) are unchanged.
// The cards are the shelf's own markup and classes (devfun-card, fg-card-art,
// GameGlyph, ShelfCardStatus), so the two pages look like one shelf.
//
// Deliberately OUTSIDE the /tools framework, like /dev/fun: no catalogue entry,
// no golden vectors. Copy in en and pt-BR (namespace "arcade"); the other
// locales fall back to English per key. The share card is the shelf's mosaic.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
// The share card and the one description for the meta, og and twitter fields.
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
// The shelf's groups, listed once, and each game's page.
import { FUN_GAME_GROUPS, funPagePath } from "@/config/funGames";
// Each game's small drawing, on its card.
import GameGlyph from "@/components/dev/fun/GameGlyph";
// Today's state on the daily cards and the line over the games (client islands).
import { ShelfCardStatus, ShelfToday } from "@/components/dev/fun/ShelfStatus";

/** The arcade's games: the shelf's "arcade" group, in shelf order. */
const ARCADE_GAMES = FUN_GAME_GROUPS.find((g) => g.key === "arcade")?.games ?? [];
/** The arcade games with a daily run, for the "today" line. */
const DAILY_IDS = ARCADE_GAMES.filter((g) => g.daily).map((g) => g.id);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "arcade" });
  // The shelf's share card (a mosaic of the games, scripts/og-games.mts), with the page's own description.
  return {
    title: t("metaTitle"),
    ...withDescription(t("metaDescription"), ogImages("game", "shelf", locale, t("title")), "arcade"),
  };
}

export default async function ArcadePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // The arcade's own strings, and the shelf's (card names and blurbs, badges, today's line, the scoreboard link).
  const t = await getTranslations("arcade");
  const f = await getTranslations("devFun");

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <h1 className="devfun-title">{t("title")}</h1>
              <p className="devfun-tagline">{t("tagline")}</p>
              <p className="devfun-intro">{t("intro")}</p>
            </div>

            {/* The games' public scoreboard: today's boards, the top tens, the countries, the totals. */}
            <p className="fg-scores-cta">
              <Link href="/dev/fun/scores" className="fg-scores-cta-link">
                {f("scoresLink")}
              </Link>
            </p>

            {/* The arcade games, as cards. */}
            <h2 id="games" className="devfun-section-title">{t("gamesTitle")}</h2>
            {/* How many daily runs this browser has played today (shown once there is at least one). */}
            <ShelfToday gameIds={DAILY_IDS} label={f.raw("shelfToday") as string} />
            <div className="devfun-list devfun-games-list">
              {ARCADE_GAMES.map((game) => (
                <Link key={game.id} href={funPagePath(game.id)} className={`devfun-card fg-card-art fg-glyph--${game.id}`}>
                  <span className="devfun-card-top">
                    {/* The game's drawing on its tinted tile; the card's accent comes from the same class. */}
                    <span className="fg-card-tile" aria-hidden="true">
                      <GameGlyph id={game.id} className="fg-glyph-card" />
                    </span>
                    <span className="devfun-card-name">{f(`games.${game.id}.cardName`)}</span>
                    {game.daily && <span className="devfun-badge mono">{f("dailyBadge")}</span>}
                    {/* Played today, and the streak, from this browser's record. */}
                    {game.daily && (
                      <ShelfCardStatus gameId={game.id} solved={f("shelfSolved")} played={f("shelfPlayed")} streak={f.raw("shelfStreak") as string} />
                    )}
                    <span className="devfun-card-arrow" aria-hidden="true">
                      &#8594;
                    </span>
                  </span>
                  <span className="devfun-card-desc">{f(`games.${game.id}.cardBlurb`)}</span>
                </Link>
              ))}
            </div>

            {/* The rest of the shelf: the daily puzzles and the toys. */}
            {/* arcade-shelf-link: the same text style as a section intro, with room above the last row of cards. */}
            <p className="devfun-section-intro arcade-shelf-link">
              <Link href="/dev/fun">{t("shelfLink")}</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
