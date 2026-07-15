// ============================================================================
// src/app/[locale]/about/vendors/partner/[slug]/page.tsx
// ----------------------------------------------------------------------------
// PARTNER / OTHER-VENDOR PAGE - a data-driven page for the non-career vendors
// linked from the Vendors index (Red Education training partners Rodolfo does
// not personally teach, and corporate-lineage entries for other vendors).
//
// Content comes from src/content/vendors/partners.ts, where every fact is
// verified. The "redu" group renders a clear disclaimer (Rodolfo does not
// deliver this vendor's training) plus Red Education's verified award record;
// nothing here implies he is authorized for these vendors.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { getPartnerVendor, partnerVendorSlugs } from "@/content/vendors/partners";
import { routing } from "@/i18n/routing";
import VendorProfileSections from "@/components/VendorProfileSections";
import type { VendorProfile } from "@/content/vendors/profile-types";
import { hpeJuniperArubaProfile } from "@/content/vendors/profiles/hpe-juniper-aruba";
import { brocadeBroadcomProfile } from "@/content/vendors/profiles/brocade-broadcom";
import { mcafeeFireeyeTrellixProfile } from "@/content/vendors/profiles/mcafee-fireeye-trellix";
import { mikrotikProfile } from "@/content/vendors/profiles/mikrotik";
import { radwareProfile } from "@/content/vendors/profiles/radware";
import { impervaThalesProfile } from "@/content/vendors/profiles/imperva-thales";
import { versaProfile } from "@/content/vendors/profiles/versa";
import { nortelBayProfile } from "@/content/vendors/profiles/nortel-bay";
import { madgeProfile } from "@/content/vendors/profiles/madge";

// Rich profiles, keyed by slug. Vendors without a profile render the simple layout.
const PROFILES: Record<string, VendorProfile> = {
  [hpeJuniperArubaProfile.slug]: hpeJuniperArubaProfile,
  [brocadeBroadcomProfile.slug]: brocadeBroadcomProfile,
  [mcafeeFireeyeTrellixProfile.slug]: mcafeeFireeyeTrellixProfile,
  [mikrotikProfile.slug]: mikrotikProfile,
  [radwareProfile.slug]: radwareProfile,
  [impervaThalesProfile.slug]: impervaThalesProfile,
  [versaProfile.slug]: versaProfile,
  [nortelBayProfile.slug]: nortelBayProfile,
  [madgeProfile.slug]: madgeProfile,
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    partnerVendorSlugs.map((slug) => ({ locale, slug })),
  );
}

export default async function PartnerVendorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const vendor = getPartnerVendor(slug);
  if (!vendor) notFound();

  const t = await getTranslations("vendors");
  const tp = await getTranslations("partnerVendors");
  const tNav = await getTranslations("nav");

  const isRedu = vendor.group === "redu";

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="vendor-hero">
            <div className="container vendor-container">
              <Link href="/about/vendors" className="article-back">
                ← {t("backToVendors")}
              </Link>
              <p className="vendor-years mono">
                {isRedu ? tp("reduEyebrow") : tp("otherEyebrow")}
              </p>
              <h1 className="vendor-name">{vendor.name}</h1>
              <p className="vendor-tagline">{vendor.tagline}</p>
            </div>
          </section>

          <section className="section">
            <div className="container vendor-container">
              <p className="era-intro">{vendor.intro}</p>
            </div>
          </section>

          {/* Accuracy note (other group): no training association. */}
          {!isRedu && vendor.note && (
            <section className="section">
              <div className="container vendor-container">
                <aside className="partner-disclaimer">
                  <span className="partner-disclaimer-tag mono">{tp("disclaimerTag")}</span>
                  <p className="partner-disclaimer-text">{vendor.note}</p>
                </aside>
              </div>
            </section>
          )}

          {/* Disclaimer (redu group): Rodolfo does not teach this vendor. */}
          {isRedu && (
            <section className="section">
              <div className="container vendor-container">
                <aside className="partner-disclaimer">
                  <span className="partner-disclaimer-tag mono">{tp("disclaimerTag")}</span>
                  <p className="partner-disclaimer-text">{tp("disclaimerText", { vendor: vendor.name })}</p>
                </aside>
              </div>
            </section>
          )}

          {/* Body */}
          <section className="section era-body-section">
            <div className="container vendor-container">
              <div className="partner-body">
                {vendor.body.map((p, i) => (
                  <p className="partner-body-p" key={i}>{p}</p>
                ))}
              </div>
            </div>
          </section>

          {/* Rich profile: foundings, timeline, products, innovations, markets, analysts */}
          {PROFILES[slug] && (
            <section className="section">
              <div className="container vendor-container">
                <VendorProfileSections
                  profile={PROFILES[slug]}
                  labels={{
                    founding: tp("foundingTitle"),
                    founders: tp("foundersLabel"),
                    timeline: tp("timelineTitle"),
                    products: tp("productsTitle"),
                    innovations: tp("innovationsTitle"),
                    markets: tp("marketsTitle"),
                    analyst: tp("analystTitle"),
                  }}
                />
              </div>
            </section>
          )}

          {/* Awards (redu group) */}
          {vendor.awards && vendor.awards.length > 0 && (
            <section className="section">
              <div className="container vendor-container">
                <h2 className="partner-awards-title">{tp("awardsTitle")}</h2>
                <ul className="partner-awards-list">
                  {vendor.awards.map((a) => (
                    <li className="partner-award" key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* External link */}
          {vendor.externalUrl && (
            <section className="section">
              <div className="container vendor-container">
                <a
                  href={vendor.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  {vendor.externalLabel ?? vendor.externalUrl} ↗
                </a>
              </div>
            </section>
          )}

          {/* Sources */}
          {vendor.sources && vendor.sources.length > 0 && (
            <section className="section">
              <div className="container vendor-container">
                <div className="partner-sources">
                  <span className="partner-sources-label mono">{tp("sourcesLabel")}</span>
                  <ul className="partner-sources-list">
                    {vendor.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="partner-source-link">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
