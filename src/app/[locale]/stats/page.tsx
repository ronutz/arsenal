// ============================================================================
// src/app/[locale]/stats/page.tsx
// ----------------------------------------------------------------------------
// STATS — the site's own aggregate request counts, published.
//
// The counting is described in full on the Privacy page; this is where the
// result is shown. Publishing it is a deliberate choice: a site that keeps
// counts and does not show them is asking to be taken on trust, and the whole
// argument here is that trust should not be necessary.
//
// The panels are client-fetched from /api/stats/* (same Worker, same origin,
// no third party). Referrers are aggregated to the host by the endpoint, so
// full referring URLs never reach this page - see worker/stats.ts.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import StatsPanels from "@/components/StatsPanels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stats_page" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("stats_page");

  // Resolved server-side and handed to the leaf client component, so the
  // client bundle carries these strings and not the whole message pack.
  const strings: Record<string, string> = {
    windowLabel: t("windowLabel"),
    window_24h: t("window_24h"),
    window_7d: t("window_7d"),
    window_30d: t("window_30d"),
    window_90d: t("window_90d"),
    loading: t("loading"),
    unconfigured: t("unconfigured"),
    error: t("error"),
    noData: t("noData"),
    sampledNote: t("sampledNote"),
    referrerNote: t("referrerNote"),
    panelPages: t("panelPages"),
    panelClients: t("panelClients"),
    panelReferrers: t("panelReferrers"),
    panelCountries: t("panelCountries"),
    panelLocales: t("panelLocales"),
    col_path: t("col_path"),
    col_client: t("col_client"),
    col_host: t("col_host"),
    col_country: t("col_country"),
    col_locale: t("col_locale"),
    col_views: t("col_views"),
  };

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container section-narrow">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("lede")}</p>
            <p className="section-body">
              {t("whatIsCounted")}{" "}
              <Link href="/privacy">{t("privacyLink")}</Link>.
            </p>
          </div>
        </section>

        <section className="section section-accent">
          <div className="container">
            <StatsPanels strings={strings} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
