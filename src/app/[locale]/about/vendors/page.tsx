// ============================================================================
// src/app/[locale]/about/vendors/page.tsx
// ----------------------------------------------------------------------------
// THE VENDORS INDEX — entry point to the five historical vendor pages.
//
// Lists the grouped vendors (Cabletron+Enterasys, NetScreen+Juniper, Riverstone,
// Cisco, Palo Alto) in rough chronological order as cards. These are PAST
// relationships; the lede makes clear the platforms taught today live under
// Training. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

// The five vendor pages, in chronological order of first engagement.
const VENDORS = [
  { slug: "cabletron-enterasys", key: "cabletron" },
  { slug: "riverstone", key: "riverstone" },
  { slug: "cisco", key: "cisco" },
  { slug: "netscreen-juniper", key: "juniper" },
  { slug: "palo-alto", key: "paloalto" },
] as const;

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
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
