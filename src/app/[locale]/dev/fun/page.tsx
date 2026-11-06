// ============================================================================
// src/app/[locale]/dev/fun/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — THE INDEX of the not-serious shelf (PRIME 04/07/2026). The games
// (daily puzzles first, then the ones played for as long as you like) and the
// toys (the Mega Brain, Meeting Bingo, the boss-key screens, the Cat
// Distribution System and the Importance Meter) live one level down; this page
// is the front door they never had: linked from the quiet end of the site
// footer's machine line and from the bottom of the colophon.
//
// Deliberately OUTSIDE the /tools framework, like everything under /dev/fun:
// no catalogue entries, no golden vectors. Renders in every locale; copy is
// authored in the i18n catalogs for en + pt-BR, with the other locales served
// by the English per-key fallback until translated (the standard path).
//
// The games are listed once, in src/config/funGames.ts (see GAME_GROUPS below).
// The toy list is a hand-kept constant: /dev/fun earns a new entry only when
// something ships, and each entry is two catalog keys (devFun.toys.<key>.name
// and .desc) plus an href. A toy that exists in English only links the English
// page from every language and shows an "EN" badge outside English (review
// R4-10, 03/11/2026).
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
// The share card and the one description for the meta, og and twitter fields (05/11/2026).
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
// The games on the shelf, listed once.
import { FUN_GAME_GROUPS, FUN_GAMES } from "@/config/funGames";
// Today's state on the daily cards and the line over the games (client islands; PRIME 03/11/2026).
import { ShelfCardStatus, ShelfToday } from "@/components/dev/fun/ShelfStatus";

// The shelf, in shipping order. `badged` marks a toy whose content exists in a
// single language and shows that language on its card. None does now: the Mega
// Brain, once Portuguese only, reads fully in English as well (PRIME 03/11/2026:
// "fully translate the card and the actual page for Mega Brain").
const TOYS = [
  { key: "megaBrain", href: "/dev/fun/mega-brain", badged: false },
  { key: "meetingBingo", href: "/dev/fun/meeting-bingo", badged: false },
  { key: "bossScreens", href: "/dev/fun/boss-screens", badged: false },
  { key: "catDistribution", href: "/dev/fun/cat-distribution", badged: false },
  // Added 2026-07-30 (PRIME): an inconspicuous card, last on the shelf. It was
  // built unlisted and stays modest here on purpose - the copy does not say
  // what it measures, so it still rewards the person who opens it.
  // enOnly (R-18 audit fix, 2026-08-27): the meter generates for en alone by
  // design, so every locale's card links the EN page explicitly — a link to a
  // route that exists, instead of a locale-prefixed path that was never built.
  // Outside English its card says so with an "EN" badge (review R4-10).
  { key: "importanceMeter", href: "/dev/fun/importance-meter", badged: false, enOnly: true },
] as const;

// The games (PRIME 03/11/2026: "I want all of them, including the two smaller ideas", with ideas from LinkedIn's
// daily games, and a whack-a-bug). The list lives in src/config/funGames.ts, where the guard
// (scripts/check-fun-games.mts) holds each entry to its page under /dev/fun/<id>, its strings under devFun.games.<id>
// (cardName and cardBlurb for this shelf) and its engine's self-test, run before every build.
// `daily` marks a game with a puzzle that changes at 00:00 UTC, the same for everyone.
const GAME_GROUPS = FUN_GAME_GROUPS;
// The games with a daily puzzle or run, for the shelf's "today" line.
const DAILY_IDS = FUN_GAMES.filter((g) => g.daily).map((g) => g.id);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devFun" });
  // The shelf's own share card (PRIME 05/11/2026), a mosaic of the games drawn by scripts/og-games.mts, with the
  // page's description in the meta, og and twitter fields alike.
  return {
    title: t("metaTitle"),
    ...withDescription(t("metaDescription"), ogImages("game", "shelf", locale, t("title")), "dev/fun"),
  };
}

export default async function DevFunIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("devFun");

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

            {/* A jump to each section: on a phone the toys start a long way down. */}
            <nav className="devfun-jump" aria-label={t("jumpLabel")}>
              <a href="#games" className="devfun-jump-link">{t("gamesTitle")}</a>
              <a href="#toys" className="devfun-jump-link">{t("toysTitle")}</a>
            </nav>

            {/* The games, by group: the daily puzzles first, then the ones you play for as long as you like. */}
            <h2 id="games" className="devfun-section-title">{t("gamesTitle")}</h2>
            <p className="devfun-section-intro">{t("gamesIntro")}</p>
            {/* How many daily games this browser has played today (shown once there is at least one). */}
            <ShelfToday gameIds={DAILY_IDS} label={t.raw("shelfToday") as string} />
            {GAME_GROUPS.map((group) => (
              <div key={group.key} className="devfun-group">
                <h3 className="devfun-group-title">{t(`gameGroups.${group.key}`)}</h3>
                <div className="devfun-list devfun-games-list">
                  {group.games.map((game) => (
                    <Link key={game.id} href={`/dev/fun/${game.id}`} className="devfun-card">
                      <span className="devfun-card-top">
                        <span className="devfun-card-name">{t(`games.${game.id}.cardName`)}</span>
                        {game.daily && <span className="devfun-badge mono">{t("dailyBadge")}</span>}
                        {/* Solved or played today, and the streak, from this browser's record. */}
                        {game.daily && (
                          <ShelfCardStatus gameId={game.id} solved={t("shelfSolved")} played={t("shelfPlayed")} streak={t.raw("shelfStreak") as string} />
                        )}
                        <span className="devfun-card-arrow" aria-hidden="true">
                          &#8594;
                        </span>
                      </span>
                      <span className="devfun-card-desc">{t(`games.${game.id}.cardBlurb`)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* The toys, as before. */}
            <h2 id="toys" className="devfun-section-title">{t("toysTitle")}</h2>
            <div className="devfun-list">
              {TOYS.map((toy) => {
                // A toy that exists in English only.
                const enOnly = "enOnly" in toy && toy.enOnly;
                // Its card wears the "EN" badge on every other language's shelf (review R4-10).
                const enBadge = enOnly && locale !== "en";
                // The card.
                return (
                  <Link
                    key={toy.key}
                    href={toy.href}
                    // enOnly cards cross to the English page from every locale.
                    locale={enOnly ? "en" : undefined}
                    className="devfun-card"
                  >
                    <span className="devfun-card-top">
                      <span className="devfun-card-name">{t(`toys.${toy.key}.name`)}</span>
                      {toy.badged && (
                        <span className="devfun-badge mono">{t(`toys.${toy.key}.badge`)}</span>
                      )}
                      {/* "EN" to the eye; "In English" to a screen reader, and as the badge's tooltip. */}
                      {enBadge && (
                        <span className="devfun-badge mono" title={t("enOnlyBadgeLabel")}>
                          <span aria-hidden="true">{t("enOnlyBadge")}</span>
                          <span className="sr-only">{t("enOnlyBadgeLabel")}</span>
                        </span>
                      )}
                      <span className="devfun-card-arrow" aria-hidden="true">
                        &#8594;
                      </span>
                    </span>
                    <span className="devfun-card-desc">{t(`toys.${toy.key}.desc`)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
