// ============================================================================
// src/app/[locale]/support/page.tsx
// ----------------------------------------------------------------------------
// SUPPORT PAGE — hosts the TipJar.
//
// noindex (canon: "noindex-until-threshold"), so it is not surfaced in search
// until that is intentionally changed. When the TipJar feature is off or no
// provider is configured, the TipJar renders nothing and this page shows a quiet
// placeholder rather than an empty shell. Statically generated per locale.
// ============================================================================

// The page's own social card (12/11/2026: it shipped the generic one), named the way scripts/gen-og.mts draws it.
import { ogImages } from "@/lib/og";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TipJar, { type TipJarCopy } from "@/components/TipJar";
import { isEnabled } from "@/config/features";
import { hasActiveTipProviders } from "@/config/tipJar";

/**
 * PAGE TITLE (2026-09-26). Shipped with no generateMetadata export, so it
 * inherited the site-wide default <title> and shared one string with thirteen
 * other pages. Since 12/11/2026 "support" is in gen-og's PACK_PAGES list, so the
 * page also names its own titled card instead of the generic one.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "support" });
  // robots moved in here from a static `metadata` export on 2026-09-27: Next.js
  // refuses a file that exports both, so the noindex directive this page has
  // always carried has to travel with the title rather than sit beside it.
  return { title: t("title"), robots: { index: false, follow: false }, ...ogImages("page", "support", locale, t("title")) }; // the page's card (12/11/2026: it shipped the generic one)
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("support");

  const tipJarCopy: TipJarCopy = {
    heading: t("tipHeading"),
    blurb: t("tipBlurb"),
    zeroCommission: t("zeroCommission"),
  };

  // Is the TipJar actually going to show anything?
  const tipJarLive = isEnabled("tipJar") && hasActiveTipProviders();

  return (
    <>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container support-container">
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("lede")}</p>

            {tipJarLive ? (
              <TipJar copy={tipJarCopy} />
            ) : (
              <p className="support-placeholder">{t("placeholder")}</p>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
