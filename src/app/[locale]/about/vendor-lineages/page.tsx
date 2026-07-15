// ============================================================================
// src/app/[locale]/about/vendor-lineages/page.tsx
// ----------------------------------------------------------------------------
// VENDOR LINEAGES HUB - the canonical home for corporate-genealogy timelines of
// the networking and security vendors. Launches with F5 as the flagship (the
// most acquisition-heavy story, and directly tied to the BIG-IP modules Rodolfo
// teaches); more vendors are added over time, each verified before it ships.
//
// The verified facts live in per-vendor data modules under src/content/lineages
// so this hub and the autobiographical /about/vendors pages can draw on one
// source of truth rather than duplicating acquisition facts.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import AcquisitionTimeline from "@/components/AcquisitionTimeline";
import { f5Lineage } from "@/content/lineages/f5";

export default async function VendorLineagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("lineages");
  const tNav = await getTranslations("nav");

  const labels = {
    founded: t("founded"),
    acquisitions: t("acquisitions"),
    became: t("became"),
    sources: t("sources"),
    asOf: t("asOf"),
    nameChanges: t("nameChanges"),
  };

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="lineage-hero">
            <div className="container lineage-container">
              <Link href="/about" className="article-back">
                ← {t("back")}
              </Link>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              <p className="lineage-intro">{t("intro")}</p>
            </div>
          </section>

          {/* F5 flagship */}
          <section className="section" id="f5">
            <div className="container lineage-container">
              <div className="lineage-vendor-head">
                <h2 className="lineage-vendor-name">{f5Lineage.name}</h2>
                <p className="lineage-vendor-tagline">{f5Lineage.tagline}</p>
              </div>
              <AcquisitionTimeline lineage={f5Lineage} labels={labels} />
            </div>
          </section>

          {/* More-soon note */}
          <section className="section">
            <div className="container lineage-container">
              <p className="lineage-more">{t("moreSoon")}</p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
