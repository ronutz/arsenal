// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/arcade/ttl/page.tsx
// ----------------------------------------------------------------------------
// /arcade/ttl (PRIME 08/11/2026, the arcade's first wave). TTL: steer a packet
// through routers that each take one off its Time to Live, and reach the host
// before zero; traceroute as a game. A server page: the head (crumb, title,
// pitch, introduction) is rendered here; the game is a client component inside
// GameShell, given only the strings it needs (the shell's and its own) through
// MessageSlice; "Where it comes from" closes the page.
// Moved from /dev/fun/ttl on 08/11/2026 (PRIME 23:14, "Yes move them"); the old address answers with a
// permanent redirect (public/_redirects), so links and shared results keep working.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// The share card and the one description for the meta, og and twitter fields.
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
// Server-side strings and the locale of the request.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site's header and footer.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// The nested provider that hands the client only its strings.
import MessageSlice from "@/components/MessageSlice";
// The game's roots, at the foot of the page.
import GameOrigins from "@/components/dev/fun/GameOrigins";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The game.
import Ttl from "@/components/dev/fun/games/Ttl";
// "Solve the other puzzles": the call-out, rendered here, and the slot that hands it to the frame.
import MorePuzzles from "@/components/dev/fun/MorePuzzles";
import { MorePuzzlesProvider } from "@/components/dev/fun/MorePuzzlesSlot";

/**
 * The page's title and description.
 *
 * @param props the route's parameters
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The locale.
  const { locale } = await params;
  // The game's strings.
  const t = await getTranslations({ locale, namespace: "devFun.games.ttl" });
  // Title and description, with the game's own share card (drawn by scripts/og-games.mts).
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("game", "ttl", locale, t("title")), "arcade/ttl") };
}

/**
 * The page.
 *
 * @param props the route's parameters
 * @returns the page
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  // The locale.
  const { locale } = await params;
  // Static rendering for this locale.
  setRequestLocale(locale);
  // The game's strings.
  const t = await getTranslations("devFun.games.ttl");
  // The page.
  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container fg-page">
            <div className="fg-head">
              {/* The crumb leads to the arcade hub that lists this game (08/11/2026). */}
              <p className="fg-crumb mono">
                <Link href="/arcade" className="fg-crumb-link">
                  /arcade
                </Link>
              </p>
              <h1 className="article-title">{t("title")}</h1>
              <p className="fg-tagline">{t("tagline")}</p>
              <p className="fg-intro">{t("intro")}</p>
            </div>
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.ttl"]}>
              {/* "Solve the other puzzles", placed by the game's frame right after its result. */}
              <MorePuzzlesProvider more={<MorePuzzles current="ttl" />}>
                <Ttl locale={locale} />
              </MorePuzzlesProvider>
            </MessageSlice>
            {/* Where the game comes from: the standards and the program it rests on, with their sources. */}
            <GameOrigins gameId="ttl" locale={locale} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
