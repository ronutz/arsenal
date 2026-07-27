// ============================================================================
// src/app/[locale]/[vendor]/vendor-lineage/page.tsx
// ----------------------------------------------------------------------------
// A vendor's corporate lineage: who it bought, what those companies became,
// and what the platform is actually made of.
//
// MOVED HERE 2026-07-27 (PRIME) from /about/vendor-lineages. Two things were
// wrong with the old home. It sat under About, which is the autobiographical
// section, when a lineage is about the VENDOR rather than about Rodolfo. And
// it was written as a hub for every vendor's lineage while containing exactly
// one, so its copy spoke about vendors in general and then showed F5.
//
// Here the page belongs to the vendor whose story it tells, one click from
// that vendor's tools and articles. The route generates itself from the
// LINEAGES registry, so a vendor without researched acquisition history simply
// has no page - rather than an empty one promising more soon.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import AcquisitionTimeline from "@/components/AcquisitionTimeline";
import { lineageFor, LINEAGE_VENDORS } from "@/content/lineages";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";

/** One page per (locale, vendor-with-a-lineage). */
export function generateStaticParams() {
  return LIVE_LOCALE_CODES.flatMap((locale) =>
    LINEAGE_VENDORS.map((vendor) => ({ locale, vendor })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; vendor: string }>;
}) {
  const { locale, vendor } = await params;
  const lineage = lineageFor(vendor);
  if (!lineage) return {};
  const t = await getTranslations({ locale, namespace: "lineages" });
  return {
    title: t("titleFor", { vendor: lineage.name }),
    description: lineage.tagline,
  };
}

export default async function VendorLineagePage({
  params,
}: {
  params: Promise<{ locale: string; vendor: string }>;
}) {
  const { locale, vendor } = await params;
  setRequestLocale(locale);

  const lineage = lineageFor(vendor);
  if (!lineage) notFound();

  const t = await getTranslations("lineages");
  const tNav = await getTranslations("nav");
  const tHub = await getTranslations("vendorHub");

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
          <section className="lineage-hero">
            <div className="container lineage-container">
              {/* Back to the hub this page belongs to, not to About. */}
              <Link href={`/${vendor}`} className="article-back">
                ← {t("backToHub", { vendor: lineage.name })}
              </Link>
              <h1 className="page-hero-title">{t("titleFor", { vendor: lineage.name })}</h1>
              <p className="page-hero-lede">{lineage.tagline}</p>
              <p className="lineage-intro">{t("introFor", { vendor: lineage.name })}</p>
            </div>
          </section>

          <section className="section" id={vendor}>
            <div className="container lineage-container">
              <AcquisitionTimeline lineage={lineage} labels={labels} />
            </div>
          </section>

          <section className="section">
            <div className="container lineage-container">
              <p className="lineage-more">{t("moreSoon")}</p>
              <p style={{ marginTop: "1.25rem" }}>
                <Link className="btn btn-secondary" href={`/${vendor}`}>
                  {tHub("eyebrow")} &#8594;
                </Link>
              </p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
