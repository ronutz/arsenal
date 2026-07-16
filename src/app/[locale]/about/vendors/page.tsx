// ============================================================================
// src/app/[locale]/about/vendors/page.tsx
// ----------------------------------------------------------------------------
// THE CAREER RECORD (Option B, PRIME-ratified 2026-07-16) — the PERSONAL
// axis of the vendor content: the fourteen career chapters, chronological,
// autobiographical. The encyclopedia axis (Red Education partners + pioneer
// lineages, full cards) lives at /industry; this page carries one compact
// pointer there instead of duplicating those grids. Card copy stays
// single-sourced in the "vendors" namespace. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// Career pages registry - single source shared with the /industry hub
// (extracted 2026-07-15; see src/content/vendors/career.ts).
import { CAREER_VENDORS as VENDORS } from "@/content/vendors/career";

export default async function VendorsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vendors");
  const tNav = await getTranslations("nav");


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
            {/* Compact pointer to the encyclopedia axis (Option B): the partner and
                pioneer lineages render as FULL cards on /industry only. */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{t("industryPointerTitle")}</h2>
              <p className="vendor-divider-note">{t("industryPointerBody")}</p>
            </div>
            <p className="vendor-index-pointer">
              <Link href="/industry" className="btn btn-secondary">
                {t("industryPointerLink")}
              </Link>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
