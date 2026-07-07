// ============================================================================
// src/app/[locale]/dev-fun/boss-screens/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — BOSS-SCREENS VIEWER. A gallery of every boss-key screen, so you can
// browse them by name + thumbnail + blurb and open any one fullscreen (the same
// overlay the boss key summons, with left/right arrow browsing). The grid and
// the overlay are a client island (BossScreensViewer); this server component
// resolves the localized names and blurbs, keyed by screen id, from the shared
// boss-screen metadata (BOSS_SCREEN_META). Statically generated per locale.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import BossScreensViewer from "@/components/dev-fun/BossScreensViewer";
import { BOSS_SCREEN_META, BOSS_GROUPS } from "@/components/dev-fun/boss-screens";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bossScreens" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
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
  };

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <p className="bingo-devfun mono">
                <Link href="/dev-fun" className="bingo-devfun-link" title={t("backTitle")}>/dev/fun</Link>
              </p>
              <h1 className="devfun-title">{t("title")}</h1>
              <p className="devfun-tagline">{t("tagline")}</p>
              <p className="devfun-intro">{t("intro")}</p>
            </div>

            <BossScreensViewer labels={labels} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
