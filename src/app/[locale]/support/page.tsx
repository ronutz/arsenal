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
 * other pages. Title only: this slug is not in gen-og's STATIC_PAGES, so
 * ogImages() would name a card that does not exist and check-og would fail.
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
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("support");
  const tNav = await getTranslations("nav");

  const tipJarCopy: TipJarCopy = {
    heading: t("tipHeading"),
    blurb: t("tipBlurb"),
    zeroCommission: t("zeroCommission"),
  };

  // Is the TipJar actually going to show anything?
  const tipJarLive = isEnabled("tipJar") && hasActiveTipProviders();

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
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
