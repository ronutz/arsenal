// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/spanning-tree/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/spanning-tree: Spanning Tree (PRIME 03/11/2026), a daily IEEE 802.1D puzzle: find the root bridge, the root ports, the designated ports and the ports that block.
// A server component: the page head from the pack, then the game, a client
// component that receives only its own strings and the shell's
// (MessageSlice). The board renders a neutral state until the browser knows
// the day, so the static HTML and the first render agree.
// ============================================================================

// The page metadata type.
import type { Metadata } from "next";
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
import SpanningTree from "@/components/dev/fun/games/SpanningTree";

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
  const t = await getTranslations({ locale, namespace: "devFun.games.spanning-tree" });
  // Title and description.
  return { title: t("metaTitle"), description: t("metaDescription") };
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
  const t = await getTranslations("devFun.games.spanning-tree");
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
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.spanning-tree"]}>
              <SpanningTree locale={locale} />
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
