// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/first-match/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/first-match: First Match (PRIME 03/11/2026), an access-list ordering game: pick Cisco IOS entries, order them, and send a wave of packets through the site's own first-match evaluator.
// A server component: the page head from the pack, then the game, a client
// component that receives only its own strings and the shell's
// (MessageSlice). The board renders a neutral state until the browser knows
// the day, so the static HTML and the first render agree.
// ============================================================================

// The page metadata type.
import type { Metadata } from "next";
// The share card and the one description for the meta, og and twitter fields (05/11/2026).
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
// Server-side strings and the request locale.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site header.
import Header from "@/components/Header";
// The site footer.
import SiteFooter from "@/components/SiteFooter";
// The nested provider that hands the game its strings.
import MessageSlice from "@/components/MessageSlice";
// The locale-aware link.
import { Link } from "@/i18n/navigation";
// The game.
import FirstMatch from "@/components/dev/fun/games/FirstMatch";
// "Solve the other puzzles" (PRIME 05/11/2026): the call-out, rendered here, and the slot that hands it to the frame.
import MorePuzzles from "@/components/dev/fun/MorePuzzles";
import { MorePuzzlesProvider } from "@/components/dev/fun/MorePuzzlesSlot";

/**
 * The page's title and description.
 *
 * @param props the route's params
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The locale.
  const { locale } = await params;
  // The game's strings.
  const t = await getTranslations({ locale, namespace: "devFun.games.first-match" });
  // Title and description.
  // The game's own share card (PRIME 05/11/2026: "make the graphics meaningful, related to each game"), drawn by
  // scripts/og-games.mts, with the page's description in the meta, og and twitter fields alike.
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("game", "first-match", locale, t("title")), "dev/fun/first-match") };
}

/**
 * The page.
 *
 * @param props the route's params
 * @returns the page
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  // The locale.
  const { locale } = await params;
  // Static rendering for this locale.
  setRequestLocale(locale);
  // The game's strings.
  const t = await getTranslations("devFun.games.first-match");
  // The page: head, game, footer.
  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container fg-page">
            <div className="fg-head">
              <p className="fg-crumb mono"><Link href="/dev/fun" className="fg-crumb-link">/dev/fun</Link></p>
              <h1 className="article-title">{t("title")}</h1>
              <p className="fg-tagline">{t("tagline")}</p>
              <p className="fg-intro">{t("intro")}</p>
            </div>
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.first-match"]}>
              {/* "Solve the other puzzles", placed by the game's frame right after its result (PRIME 05/11/2026). */}
              <MorePuzzlesProvider more={<MorePuzzles current="first-match" />}>
                <FirstMatch locale={locale} />
              </MorePuzzlesProvider>
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
