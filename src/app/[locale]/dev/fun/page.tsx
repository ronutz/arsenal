// ============================================================================
// src/app/[locale]/dev/fun/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — THE INDEX of the not-serious shelf (PRIME 04/07/2026). The toys
// themselves (Mega Brain, Meeting Bingo) live one level down; this page is the
// front door they never had: linked from the quiet end of the site footer's
// machine line and from the bottom of the colophon.
//
// Deliberately OUTSIDE the /tools framework, like everything under /dev/fun:
// no catalogue entries, no golden vectors. Renders in every locale; copy is
// authored in the i18n catalogs for en + pt-BR, with the other locales served
// by the English per-key fallback until translated (the standard path).
//
// The toy list is a hand-kept constant: /dev/fun earns a new entry only when
// something ships, and each entry is two catalog keys plus an href. When a
// third toy lands, add it here and to the devFun.toys catalog namespace.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
// The games on the shelf, listed once.
import { FUN_GAME_GROUPS } from "@/config/funGames";

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
  { key: "importanceMeter", href: "/dev/fun/importance-meter", badged: false, enOnly: true },
] as const;

// The games (PRIME 03/11/2026: "I want all of them, including the two smaller ideas", with ideas from LinkedIn's
// daily games, and a whack-a-bug). The list lives in src/config/funGames.ts, where the guard
// (scripts/check-fun-games.mts) holds each entry to its page under /dev/fun/<id>, its strings under devFun.games.<id>
// (cardName and cardBlurb for this shelf) and its engine's self-test, run before every build.
// `daily` marks a game with a puzzle that changes at 00:00 UTC, the same for everyone.
const GAME_GROUPS = FUN_GAME_GROUPS;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devFun" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
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

            {/* The games, by group: the daily puzzles first, then the ones you play for as long as you like. */}
            <h2 className="devfun-section-title">{t("gamesTitle")}</h2>
            <p className="devfun-section-intro">{t("gamesIntro")}</p>
            {GAME_GROUPS.map((group) => (
              <div key={group.key} className="devfun-group">
                <h3 className="devfun-group-title">{t(`gameGroups.${group.key}`)}</h3>
                <div className="devfun-list devfun-games-list">
                  {group.games.map((game) => (
                    <Link key={game.id} href={`/dev/fun/${game.id}`} className="devfun-card">
                      <span className="devfun-card-top">
                        <span className="devfun-card-name">{t(`games.${game.id}.cardName`)}</span>
                        {game.daily && <span className="devfun-badge mono">{t("dailyBadge")}</span>}
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
            <h2 className="devfun-section-title">{t("toysTitle")}</h2>
            <div className="devfun-list">
              {TOYS.map((toy) => (
                <Link
                  key={toy.key}
                  href={toy.href}
                  // enOnly cards cross to the English page from every locale.
                  locale={"enOnly" in toy && toy.enOnly ? "en" : undefined}
                  className="devfun-card"
                >
                  <span className="devfun-card-top">
                    <span className="devfun-card-name">{t(`toys.${toy.key}.name`)}</span>
                    {toy.badged && (
                      <span className="devfun-badge mono">{t(`toys.${toy.key}.badge`)}</span>
                    )}
                    <span className="devfun-card-arrow" aria-hidden="true">
                      &#8594;
                    </span>
                  </span>
                  <span className="devfun-card-desc">{t(`toys.${toy.key}.desc`)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
