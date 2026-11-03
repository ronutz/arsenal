// ============================================================================
// src/app/[locale]/dev/fun/boss-screens/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — BOSS-SCREENS VIEWER. A gallery of every boss-key screen, so you can
// browse them by name + thumbnail + blurb and open any one fullscreen (the same
// overlay the boss key summons, with left/right arrow browsing). The grid and
// the overlay are a client island (BossScreensViewer); this server component
// resolves the localized names and blurbs, keyed by screen id, from the shared
// boss-screen metadata (BOSS_SCREEN_META). Statically generated per locale.
//
// THE SHARE LINE AND THE SOCIAL CARD (PRIME 03/11/2026, "Yes on all your
// suggested ideas"): the screen last seen full screen offers its name and year
// to copy (the line's template is resolved here, raw, and filled by the
// viewer). The social card has its words baked into the image, so there is one
// per language, as on the Mega Brain page: the Portuguese card for pt-BR, the
// English one for every other language.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import BossScreensViewer from "@/components/dev/fun/BossScreensViewer";
import { BOSS_SCREEN_META, BOSS_GROUPS } from "@/components/dev/fun/boss-screens";

// The social cards (see the file header): Portuguese for pt-BR, English otherwise. 1200 x 630 PNG in public/.
const OG_IMAGE_PT = "/og-boss-screens-pt-br.png";
const OG_IMAGE_EN = "/og-boss-screens-en.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bossScreens" });
  // The page's title and description, used by the social card's preview as well.
  const title = t("metaTitle");
  const description = t("metaDescription");
  // The card in the page's language: Portuguese for pt-BR, English otherwise.
  const ogImage = locale === "pt-BR" ? OG_IMAGE_PT : OG_IMAGE_EN;
  // Its size and its description for a reader who cannot see it.
  const image = { url: ogImage, width: 1200, height: 630, alt: t("ogAlt") };
  return {
    title,
    description,
    // The preview a link to this page unfolds into, as on the Mega Brain page.
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "ronutz.com",
      url: `https://ronutz.com/${locale}/dev/fun/boss-screens`,
      images: [image],
    },
    // The same card for X and the readers of its card tags.
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BossScreensPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bossScreens");
  const tShortcuts = await getTranslations("shortcuts");
  const tTools = await getTranslations("tools");
  // The /dev/fun shelf's common words: the Copy button's "Copied" and "Copy failed" are the games' own.
  const tCommon = await getTranslations("devFun.games.common");

  // Localized name + blurb per screen id. The i18n keys mirror the screen ids
  // (name.<id> / blurb.<id>); BOSS_SCREEN_META is the id list + English fallback.
  const names: Record<string, string> = {};
  const blurbs: Record<string, string> = {};
  for (const meta of BOSS_SCREEN_META) {
    names[meta.kind] = t(`name.${meta.kind}`);
    blurbs[meta.kind] = t(`blurb.${meta.kind}`);
  }

  // Localized label for each display group (keyed by group id), resolved here
  // so the client viewer stays free of English strings.
  const groupLabels: Record<string, string> = {};
  for (const group of BOSS_GROUPS) {
    groupLabels[group] = t(`groups.${group}`);
  }

  const labels = {
    names,
    blurbs,
    groupLabels,
    jumpTo: t("jumpTo"),
    bossHint: tShortcuts("bossHint"),
    bossDismiss: tShortcuts("bossDismiss"),
    openLabel: t("open"),
    viewLegend: tTools("viewLegend"),
    viewCards: tTools("viewCards"),
    viewList: tTools("viewList"),
    // The share line, raw: {name} and {year} are filled in the browser for the screen last seen.
    shareLine: t.raw("shareLine") as string,
    // The Copy button: "Copy", then the games' "Copied" and "Copy failed".
    share: { copy: tCommon("copy"), copied: tCommon("copied"), copyFailed: tCommon("copyFailed") },
  };

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <p className="bingo-devfun mono">
                <Link href="/dev/fun" className="bingo-devfun-link" title={t("backTitle")}>/dev/fun</Link>
              </p>
              <h1 className="devfun-title">{t("title")}</h1>
              <p className="devfun-tagline">{t("tagline")}</p>
              <p className="devfun-intro">{t("intro")}</p>
            </div>

            {/* The locale writes the page's own address into the share line. */}
            <BossScreensViewer labels={labels} locale={locale} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
