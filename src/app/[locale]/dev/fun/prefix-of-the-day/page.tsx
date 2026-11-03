// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/prefix-of-the-day/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/prefix-of-the-day: THE DAILY SUBNETTING PUZZLE (PRIME 03/11/2026,
// the shelf's flagship daily). A server page: the head (crumb, title, pitch,
// introduction) is static; the board is a client component that reads the day
// after mount (src/components/dev/fun/games/PrefixOfTheDay.tsx). Outside the
// /tools framework like everything under /dev/fun; its engine is checked
// before every build (scripts/check-fun-games.mts).
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// Server-side strings and the static locale.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site chrome.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// Only the namespaces the board needs travel to the browser.
import MessageSlice from "@/components/MessageSlice";
// The crumb back to the shelf.
import { Link } from "@/i18n/navigation";
// The board.
import PrefixOfTheDay from "@/components/dev/fun/games/PrefixOfTheDay";

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
  const t = await getTranslations({ locale, namespace: "devFun.games.prefix-of-the-day" });
  // Title and description.
  return { title: t("metaTitle"), description: t("metaDescription") };
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
  const t = await getTranslations("devFun.games.prefix-of-the-day");
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
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.prefix-of-the-day"]}>
              <PrefixOfTheDay locale={locale} />
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
