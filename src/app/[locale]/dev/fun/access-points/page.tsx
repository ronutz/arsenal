// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/access-points/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/access-points: ACCESS POINTS, the daily floor-plan puzzle: one wireless access point per row, column and zone, none touching.
// A new puzzle every UTC day, the same for everyone, built in the browser from
// the day's seed (src/lib/fun/games/access-points/engine.ts, proven unique for 400
// days by scripts/check-fun-games.mts). Like everything under /dev/fun it sits
// outside the /tools framework. Server component: the head and the strings;
// the board is the client component AccessPoints, inside GameShell.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// Server-side strings and the locale for static rendering.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site header.
import Header from "@/components/Header";
// The site footer.
import SiteFooter from "@/components/SiteFooter";
// The message slice the client components read.
import MessageSlice from "@/components/MessageSlice";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The game.
import AccessPoints from "@/components/dev/fun/games/AccessPoints";

/**
 * The page's title and description, in the page's locale.
 *
 * @param props the route params
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The locale.
  const { locale } = await params;
  // The game's strings.
  const t = await getTranslations({ locale, namespace: "devFun.games.access-points" });
  // Title and description.
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * The page: crumb, title, pitch, introduction, and the game.
 *
 * @param props the route params
 * @returns the page
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  // The locale.
  const { locale } = await params;
  // Static rendering for this locale.
  setRequestLocale(locale);
  // The game's strings.
  const t = await getTranslations("devFun.games.access-points");
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
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.access-points"]}>
              <AccessPoints locale={locale} />
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
