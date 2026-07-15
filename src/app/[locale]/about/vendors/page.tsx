// ============================================================================
// src/app/[locale]/about/vendors/page.tsx
// ----------------------------------------------------------------------------
// THE VENDORS INDEX — entry point to the historical vendor pages.
//
// Lists the vendors in rough chronological order as cards. These are PAST
// Cisco, Palo Alto) in rough chronological order as cards. These are PAST
// relationships; the lede makes clear the platforms taught today live under
// Training. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { partnerVendors } from "@/content/vendors/partners";
// Career pages registry - single source shared with the /industry hub
// (extracted 2026-07-15; see src/content/vendors/career.ts).
import { CAREER_VENDORS as VENDORS, REDU_CAREER_PARTNERS } from "@/content/vendors/career";

export default async function VendorsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vendors");
  const tp = await getTranslations("partnerVendors");
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
            <Link href="/about" className="article-back">
              ← {t("backToAbout")}
            </Link>

            <p className="hero-eyebrow">{t("indexTitle")}</p>
            <h1 className="page-hero-title">
              {t("indexLede")}
            </h1>

            {/* Career vendors (worked with) */}
            <ul className="vendor-grid">
              {VENDORS.map((v) => (
                <li key={v.slug}>
                  <Link href={`/about/vendors/${v.slug}`} className="vendor-card">
                    <span className="vendor-card-years mono">{t(`${v.key}.years`)}</span>
                    <span className="vendor-card-name">{t(`${v.key}.name`)}</span>
                    <span className="vendor-card-tagline">{t(`${v.key}.tagline`)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Divider: Red Education training partners */}
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
              {/* Cisco and Palo Alto Networks are verified Red Education
                  partners whose pages exist as career pages - the established
                  Group B list includes them here (PRIME 2026-07-15). */}
              {REDU_CAREER_PARTNERS.map((v) => (
                <li key={v.slug}>
                  <Link href={`/about/vendors/${v.slug}`} className="vendor-card">
                    <span className="vendor-card-years mono">{tp("reduCardTag")}</span>
                    <span className="vendor-card-name">{t(`${v.key}.name`)}</span>
                    <span className="vendor-card-tagline">{t(`${v.key}.tagline`)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Divider: Other vendors (corporate lineages, no training association) */}
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
