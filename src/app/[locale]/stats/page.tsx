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
import { LIVE_LOCALES } from "@/i18n/locales";
import { COUNTRY_NAMES } from "@/content/vendors/origins";

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
    pagesNote: t("pagesNote"),
    clientsNote: t("clientsNote"),
    countriesNote: t("countriesNote"),
    localesNote: t("localesNote"),
    panelDevices: t("panelDevices"),
    devicesNote: t("devicesNote"),
    col_device: t("col_device"),
    device_mobile: t("device_mobile"),
    device_desktop: t("device_desktop"),
    device_other: t("device_other"),
    groupSearch: t("groupSearch"),
    groupAi: t("groupAi"),
    groupSocial: t("groupSocial"),
    groupOtherSites: t("groupOtherSites"),
    groupOther: t("groupOther"),
    panelAiShare: t("panelAiShare"),
    aiShareNote: t("aiShareNote"),
    panelSections: t("panelSections"),
    sectionsNote: t("sectionsNote"),
    col_section: t("col_section"),
    panelTail: t("panelTail"),
    tailNote: t("tailNote"),
    tailCounts: t("tailCounts"),
    tailLeast: t("tailLeast"),
    tail_1: t("tail_1"),
    tail_2: t("tail_2"),
    tail_3: t("tail_3"),
    panelCoverage: t("panelCoverage"),
    coverageNote: t("coverageNote"),
    col_measure: t("col_measure"),
    coverageDistinct: t("coverageDistinct"),
    coverageRequests: t("coverageRequests"),
    coveragePer: t("coveragePer"),
    panelHour: t("panelHour"),
    hourNote: t("hourNote"),
    col_hour: t("col_hour"),
    panelWeekday: t("panelWeekday"),
    weekdayNote: t("weekdayNote"),
    col_weekday: t("col_weekday"),
    wd_0: t("wd_0"),
    wd_1: t("wd_1"),
    wd_2: t("wd_2"),
    wd_3: t("wd_3"),
    wd_4: t("wd_4"),
    wd_5: t("wd_5"),
    wd_6: t("wd_6"),
    panelTimeline: t("panelTimeline"),
    timelineNote: t("timelineNote"),
    col_day: t("col_day"),
    panelSources: t("panelSources"),
    sourceNote: t("sourceNote"),
    col_source: t("col_source"),
  };

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container section-narrow">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="section-body">
              {t("whatIsCounted")}{" "}
              <Link href="/privacy">{t("privacyLink")}</Link>.
            </p>
          </div>
        </section>

        <section className="section section-accent">
          <div className="container">
            <StatsPanels
              strings={strings}
              localeNames={Object.fromEntries(LIVE_LOCALES.map((l) => [l.code, l.nativeName]))}
              countryNames={COUNTRY_NAMES}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
