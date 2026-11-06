// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/incident-commander/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/incident-commander (PRIME 03/11/2026). Incident Commander: an idle game about keeping a service up.
// A server page: the head (crumb, title, pitch, introduction) is rendered
// here; the game is a client component inside GameShell, given only the
// strings it needs (the shell's and its own) through MessageSlice.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// The share card and the one description for the meta, og and twitter fields (05/11/2026).
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
import IncidentCommander from "@/components/dev/fun/games/IncidentCommander";
// "Solve the other puzzles" (PRIME 05/11/2026): the call-out, rendered here, and the slot that hands it to the frame.
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
  const t = await getTranslations({ locale, namespace: "devFun.games.incident-commander" });
  // Title and description.
  // The game's own share card (PRIME 05/11/2026: "make the graphics meaningful, related to each game"), drawn by
  // scripts/og-games.mts, with the page's description in the meta, og and twitter fields alike.
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("game", "incident-commander", locale, t("title")), "dev/fun/incident-commander") };
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
  const t = await getTranslations("devFun.games.incident-commander");
  // The page.
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
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.incident-commander"]}>
              {/* "Solve the other puzzles", placed by the game's frame right after its result (PRIME 05/11/2026). */}
              <MorePuzzlesProvider more={<MorePuzzles current="incident-commander" />}>
                <IncidentCommander locale={locale} />
              </MorePuzzlesProvider>
            </MessageSlice>
            {/* Where the game comes from: its roots, the sources, more on this site (PRIME 06/11/2026). */}
            <GameOrigins gameId="incident-commander" locale={locale} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
