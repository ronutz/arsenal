// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/log-detective/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/log-detective: LOG DETECTIVE (PRIME 03/11/2026), a daily incident hidden in a synthetic web or SSH log, found in three questions.
// A server component: the head (crumb, title, pitch, introduction) is static;
// the game itself is a client component inside a MessageSlice carrying the
// shell's strings and the game's own (devFun.games.log-detective).
// ============================================================================

// The metadata type.
import type { Metadata } from "next";
// The share card and the one description for the meta, og and twitter fields (05/11/2026).
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
// Server-side strings and the request's locale.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site's header.
import Header from "@/components/Header";
// The site's footer.
import SiteFooter from "@/components/SiteFooter";
// The client-message slice for the game's strings.
import MessageSlice from "@/components/MessageSlice";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The game.
import LogDetective from "@/components/dev/fun/games/LogDetective";
// "Solve the other puzzles" (PRIME 05/11/2026): the call-out, rendered here, and the slot that hands it to the frame.
import MorePuzzles from "@/components/dev/fun/MorePuzzles";
import { MorePuzzlesProvider } from "@/components/dev/fun/MorePuzzlesSlot";

/**
 * The page's title and description, from the game's strings.
 *
 * @param props the route's params
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The locale.
  const { locale } = await params;
  // The game's strings.
  const t = await getTranslations({ locale, namespace: "devFun.games.log-detective" });
  // Title and description.
  // The game's own share card (PRIME 05/11/2026: "make the graphics meaningful, related to each game"), drawn by
  // scripts/og-games.mts, with the page's description in the meta, og and twitter fields alike.
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("game", "log-detective", locale, t("title")), "dev/fun/log-detective") };
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
  const t = await getTranslations("devFun.games.log-detective");
  // Header, the game's column, footer.
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
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.log-detective"]}>
              {/* "Solve the other puzzles", placed by the game's frame right after its result (PRIME 05/11/2026). */}
              <MorePuzzlesProvider more={<MorePuzzles current="log-detective" />}>
                <LogDetective locale={locale} />
              </MorePuzzlesProvider>
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
