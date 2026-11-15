// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/lgtm/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun/lgtm — THE LGTM HOMAGE (queue 5d; PRIME 12/11/2026 21:24 asked,
// 14/11/2026 18:19 decided: "The LGTM piece can receive prose citing Opus 5.5
// and about the site. Make it humorous witty and on theme with the lgtm music
// video lyrics"). A toy on the /dev/fun shelf, in four parts:
//   1. the music video "LGTM (Looks Good to Me)" by Degenerative Pixels
//      (YouTube 3TNpOD6bov8), behind a click-to-load facade: nothing is asked
//      of YouTube until the reader presses play (VideoFacade, the Privacy
//      page's video section, and this path's frame-src in public/_headers);
//   2. original prose on how this site gets to yes, the song's theme turned
//      inside out. Original jokes only: the lyrics are never quoted or closely
//      paraphrased (copyright), and the theme comes from the video page and
//      its description (concord research/lgtm/THEME.md, read 14/11/2026).
//      Naming the model that writes the site is allowed on this page alone
//      (PRIME 14/11/2026 18:19);
//   3. an original tune in four eras of game sound (LgtmTune; PRIME
//      15/11/2026 05:14 and 05:34), synthesized live by the browser;
//   4. a link to the stamp toy next door (/dev/fun/lgtm-stamp).
// The words live in the devFun.lgtm namespace of every live language.
// ============================================================================

import type { Metadata } from "next";
import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import MessageSlice from "@/components/MessageSlice";
import { Link } from "@/i18n/navigation";
import VideoFacade from "@/components/dev/fun/VideoFacade";
import LgtmTune from "@/components/dev/fun/LgtmTune";

/** The video's YouTube ID (oEmbed read 12/11/2026; the video page and description read 14/11/2026). */
const VIDEO_ID = "3TNpOD6bov8";

/** The video's page on YouTube, for the credit's link (the watch page, not the embed). */
const VIDEO_PAGE = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

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
  const t = await getTranslations({ locale, namespace: "devFun.lgtm" });
  // Title, description and the card drawn by scripts/gen-og.mts (PACK_PAGES, slug "dev-fun-lgtm").
  return { title: t("metaTitle"), ...withDescription(t("metaDescription"), ogImages("page", "dev-fun-lgtm", locale, t("title")), "dev/fun/lgtm") };
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
  const t = await getTranslations("devFun.lgtm");
  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container fg-page lgtm-page">
            {/* The heading: back to the shelf, the title, what the page is. */}
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

            {/* 1. The video, behind its facade, with the credit. */}
            <section className="lgtm-part" aria-labelledby="lgtm-video">
              <h2 id="lgtm-video" className="lgtm-part-title">
                {t("videoTitle")}
              </h2>
              <VideoFacade videoId={VIDEO_ID} title={t("videoFrameTitle")} playLabel={t("videoPlay")} note={t("videoNote")} />
              <p className="lgtm-prose">
                {t.rich("videoCredit", {
                  // The video's own page on YouTube, in a new tab.
                  link: (chunks) => (
                    <a href={VIDEO_PAGE} target="_blank" rel="noopener noreferrer">
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </section>

            {/* 2. How this site says LGTM: original prose, the song's theme inside out. */}
            <section className="lgtm-part" aria-labelledby="lgtm-site">
              <h2 id="lgtm-site" className="lgtm-part-title">
                {t("siteTitle")}
              </h2>
              <p className="lgtm-prose">{t("site1")}</p>
              <p className="lgtm-prose">{t("site2")}</p>
              <p className="lgtm-prose">{t("site3")}</p>
            </section>

            {/* 3. The tune, in four eras. */}
            <section className="lgtm-part" aria-labelledby="lgtm-tune">
              <h2 id="lgtm-tune" className="lgtm-part-title">
                {t("tuneTitle")}
              </h2>
              <p className="lgtm-prose">{t("tuneIntro")}</p>
              <MessageSlice namespaces={["devFun.lgtm"]}>
                <LgtmTune />
              </MessageSlice>
            </section>

            {/* 4. The stamp toy next door. */}
            <section className="lgtm-part" aria-labelledby="lgtm-stamp">
              <h2 id="lgtm-stamp" className="lgtm-part-title">
                {t("stampTitle")}
              </h2>
              <p className="lgtm-prose">
                {t.rich("stampIntro", {
                  // The toy's page, in this language.
                  link: (chunks) => <Link href="/dev/fun/lgtm-stamp">{chunks}</Link>,
                })}
              </p>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
