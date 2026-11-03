// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/whack-a-bug/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/whack-a-bug (PRIME 03/11/2026). Whack-a-Bug: sixty seconds of bugs to squash and features to leave alone.
// A server page: the head (crumb, title, pitch, introduction) is rendered
// here; the game is a client component inside GameShell, given only the
// strings it needs (the shell's and its own) through MessageSlice.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// Server-side strings and the locale of the request.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site's header and footer.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// The nested provider that hands the client only its strings.
import MessageSlice from "@/components/MessageSlice";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The game.
import WhackABug from "@/components/dev/fun/games/WhackABug";

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
  const t = await getTranslations({ locale, namespace: "devFun.games.whack-a-bug" });
  // Title and description.
  return { title: t("metaTitle"), description: t("metaDescription") };
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
  const t = await getTranslations("devFun.games.whack-a-bug");
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
            <MessageSlice namespaces={["devFun.games.common", "devFun.games.whack-a-bug"]}>
              <WhackABug locale={locale} />
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
