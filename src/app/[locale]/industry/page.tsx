// ============================================================================
// src/app/[locale]/industry/page.tsx
// ----------------------------------------------------------------------------
// THE INDUSTRY HUB (PRIME directive 2026-07-15) - the discoverable, top-level
// front door to the deep-research vendor histories: eight career pages
// (/about/vendors/<slug>), the Red Education training partners, and the wider
// industry lineage pages (/about/vendors/partner/<slug>).
//
// Rationale: the research previously surfaced only through the About section
// index (/about/vendors), which visitors did not find. This hub gives it a
// primary-nav home. The individual profile pages stay at their existing URLs;
// this page only links. The About index remains as the About-side entrance.
//
// ROUTING. "industry" is a static segment under [locale]; it is not a vendor
// key (f5/fortinet/netskope/extreme/zscaler/ping), so the namespace guard in
// scripts/check-vendor-namespace.mjs is satisfied. Statically generated per
// locale via the [locale] layout, like the other static pages.
//
// I18N. Card copy reuses the existing "vendors" (career cards) and
// "partnerVendors" (partner cards + section headings) namespaces, so the two
// indexes can never drift. Only the hero strings are new, under "industry"
// (authored en + pt-BR natively; other locales fall back per key).
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { partnerVendors } from "@/content/vendors/partners";
import { CAREER_VENDORS } from "@/content/vendors/career";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ti = await getTranslations({ locale, namespace: "industry" });
  return {
    title: ti("metaTitle"),
    description: ti("metaDescription"),
  };
}

export default async function IndustryHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vendors"); // career card copy (name/years/tagline)
  const tp = await getTranslations("partnerVendors"); // partner cards + section headings
  const ti = await getTranslations("industry"); // hub hero (new)
  const tNav = await getTranslations("nav");

  const reduPartners = partnerVendors.filter((v) => v.group === "redu");
  const otherVendors = partnerVendors.filter((v) => v.group === "other");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: tNav("industry") },
              ]}
            />

            {/* Hero: mirrors the vendor-hub hero treatment. */}
            <p className="hero-eyebrow">{ti("eyebrow")}</p>
            <h1 className="page-hero-title">{ti("title")}</h1>
            <p className="page-hero-lede" style={{ marginBottom: "2.5rem" }}>
              {ti("lede")}
            </p>

            {/* Career vendors (worked with, 1996-2020, chronological). */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{ti("careerTitle")}</h2>
              <p className="vendor-divider-note">{ti("careerNote")}</p>
            </div>
            <ul className="vendor-grid">
              {CAREER_VENDORS.map((v) => (
                <li key={v.slug}>
                  <Link href={`/about/vendors/${v.slug}`} className="vendor-card">
                    <span className="vendor-card-years mono">{t(`${v.key}.years`)}</span>
                    <span className="vendor-card-name">{t(`${v.key}.name`)}</span>
                    <span className="vendor-card-tagline">{t(`${v.key}.tagline`)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Red Education training partners. */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{tp("reduSectionTitle")}</h2>
              <p className="vendor-divider-note">{tp("reduSectionNote")}</p>
            </div>
            <ul className="vendor-grid">
              {reduPartners.map((v) => (
                <li key={v.slug}>
                  <Link href={`/about/vendors/partner/${v.slug}`} className="vendor-card">
                    <span className="vendor-card-years mono">{tp("reduCardTag")}</span>
                    <span className="vendor-card-name">{v.name}</span>
                    <span className="vendor-card-tagline">{v.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* The wider industry (corporate lineages, no training association). */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{tp("otherSectionTitle")}</h2>
              <p className="vendor-divider-note">{tp("otherSectionNote")}</p>
            </div>
            <ul className="vendor-grid">
              {otherVendors.map((v) => (
                <li key={v.slug}>
                  <Link href={`/about/vendors/partner/${v.slug}`} className="vendor-card">
                    <span className="vendor-card-years mono">{tp("otherCardTag")}</span>
                    <span className="vendor-card-name">{v.name}</span>
                    <span className="vendor-card-tagline">{v.tagline}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
