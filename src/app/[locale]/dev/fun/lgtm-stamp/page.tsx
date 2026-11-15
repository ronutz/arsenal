// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/lgtm-stamp/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/lgtm-stamp — THE LGTM STAMP (queue 5d extra (a), PRIME 14/11/2026
// 22:09: "Also Add The optional extras behind the page"). The reader pastes a
// diff or a configuration; simple local checks read every line and a stamp
// comes down, "LGTM" only when they found nothing. The opposite of the rubber
// stamp the LGTM music video is about (its page: /dev/fun/lgtm).
//
// The checks are src/lib/fun/lgtm/stamp.ts (pure, deterministic, golden
// examples in its self-test); the toy is src/components/dev/fun/LgtmStamp.tsx.
// Nothing is sent or stored. The words live in devFun.lgtmStamp.
// ============================================================================

import type { Metadata } from "next";
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import MessageSlice from "@/components/MessageSlice";
import { Link } from "@/i18n/navigation";
import LgtmStamp from "@/components/dev/fun/LgtmStamp";

/**
 * The page's title and description, in the page's language, with its social card.
 *
 * @param props the route parameters
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The page's language.
  const { locale } = await params;
  // Its words.
  const t = await getTranslations({ locale, namespace: "devFun.lgtmStamp" });
  // Title, description and the card drawn by scripts/gen-og.mts (PACK_PAGES, slug "dev-fun-lgtm-stamp").
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("page", "dev-fun-lgtm-stamp", locale, t("title")), "dev/fun/lgtm-stamp") };
}

/**
 * The page.
 *
 * @param props the route parameters
 * @returns the page
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  // The page's language.
  const { locale } = await params;
  // Static rendering in that language.
  setRequestLocale(locale);
  // Its words.
  const t = await getTranslations("devFun.lgtmStamp");
  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container fg-page lgtm-page">
            {/* The heading: back to the shelf, the title, what the toy does. */}
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
            {/* The toy, with its own words. */}
            <MessageSlice namespaces={["devFun.lgtmStamp"]}>
              <LgtmStamp />
            </MessageSlice>
            {/* Back to the homage. */}
            <p className="lgtm-prose">
              <Link href="/dev/fun/lgtm">{t("homeLink")}</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
