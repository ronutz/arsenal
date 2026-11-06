// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/aggregate/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/aggregate: THE ROUTE-SUMMARISATION SLIDING GAME (PRIME 03/11/2026).
// A server page: the head (crumb, title, pitch, introduction) is static; the
// board is a client component that reads the day after mount
// (src/components/dev/fun/games/Aggregate.tsx). Outside the
// /tools framework like everything under /dev/fun; its engine is checked
// before every build (scripts/check-fun-games.mts).
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// The share card and the one description for the meta, og and twitter fields (05/11/2026).
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
// Server-side strings and the static locale.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site chrome.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// Only the namespaces the board needs travel to the browser.
import MessageSlice from "@/components/MessageSlice";
// The game's roots, at the foot of the page.
import GameOrigins from "@/components/dev/fun/GameOrigins";
// The crumb back to the shelf.
import { Link } from "@/i18n/navigation";
// The board.
import Aggregate from "@/components/dev/fun/games/Aggregate";
// "Solve the other puzzles" (PRIME 05/11/2026): the call-out, rendered here, and the slot that hands it to the frame.
import MorePuzzles from "@/components/dev/fun/MorePuzzles";
import { MorePuzzlesProvider } from "@/components/dev/fun/MorePuzzlesSlot";

/**
 * The page's title and description, in the page's language.
 *
 * @param props the route parameters
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The locale of this export.
  const { locale } = await params;
  // The game's strings.
  const t = await getTranslations({ locale, namespace: "devFun.games.aggregate" });
  // Title and description.
  // The game's own share card (PRIME 05/11/2026: "make the graphics meaningful, related to each game"), drawn by
  // scripts/og-games.mts, with the page's description in the meta, og and twitter fields alike.
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("game", "aggregate", locale, t("title")), "dev/fun/aggregate") };
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
  // The game's strings.
  const t = await getTranslations("devFun.games.aggregate");
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
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.aggregate"]}>
              {/* "Solve the other puzzles", placed by the game's frame right after its result (PRIME 05/11/2026). */}
              <MorePuzzlesProvider more={<MorePuzzles current="aggregate" />}>
                <Aggregate locale={locale} />
              </MorePuzzlesProvider>
            </MessageSlice>
            {/* Where the game comes from: its roots, the sources, more on this site (PRIME 06/11/2026). */}
            <GameOrigins gameId="aggregate" locale={locale} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
