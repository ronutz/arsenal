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

// Keep the support page out of search indexes for now.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
      <a href="#main" className="skip-link">
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
