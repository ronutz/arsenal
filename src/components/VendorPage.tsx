// ============================================================================
// src/components/VendorPage.tsx
// ----------------------------------------------------------------------------
// REUSABLE HISTORICAL-VENDOR PAGE — shared presentation for the five vendor
// pages (Cabletron+Enterasys, NetScreen+Juniper, Riverstone, Cisco, Palo Alto).
//
// Each vendor page passes its translation key, its body section keys, an
// optional "special note" key (used by Cisco for the IronPort note), and the
// next vendor for navigation. The structure: breadcrumb, hero (name + years +
// tagline), intro, body sections, optional special note, a certifications strip,
// and a next-vendor link.
//
// These are PAST relationships. Nothing here implies current vendor
// authorization. Server component (static), all copy from the "vendors"
// namespace.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TechIcon, { type TechIconName } from "@/components/TechIcons";
import LineageDiagram, { type LineageStage } from "@/components/LineageDiagram";

export interface VendorPageProps {
  /** Translation key for this vendor, e.g. "cabletron". */
  vendorKey: string;
  /** Ordered body section keys (e.g. ["s1", "s2"]). */
  sections: string[];
  /** Optional special-note key pair (e.g. "ironport") rendered after sections. */
  specialNote?: string;
  /** The next vendor's slug + key, or null if last. */
  next: { slug: string; key: string } | null;
  /** Original technology icons shown in the hero (visual identity). */
  icons?: TechIconName[];
  /** Optional corporate-genealogy diagram config + heading keys. */
  lineage?: { stages: LineageStage[]; titleKey: string; descKey: string };
}

export default async function VendorPage({
  vendorKey,
  sections,
  specialNote,
  next,
  icons,
  lineage,
}: VendorPageProps) {
  const t = await getTranslations("vendors");
  const tNav = await getTranslations("nav");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="vendor-hero">
            <div className="container vendor-container">
              <Link href="/about/vendors" className="article-back">
                ← {t("backToVendors")}
              </Link>
              <p className="vendor-years mono">{t(`${vendorKey}.years`)}</p>
              <h1 className="vendor-name">{t(`${vendorKey}.name`)}</h1>
              <p className="vendor-tagline">{t(`${vendorKey}.tagline`)}</p>

              {/* Original technology iconography (visual identity, no vendor branding) */}
              {icons && icons.length > 0 && (
                <div className="vendor-icons" aria-hidden="true">
                  {icons.map((ic) => (
                    <span className="vendor-icon" key={ic}>
                      <TechIcon name={ic} size={26} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Intro */}
          <section className="section">
            <div className="container vendor-container">
              <p className="era-intro">{t(`${vendorKey}.intro`)}</p>
            </div>
          </section>

          {/* Optional corporate-genealogy diagram (original graphic) */}
          {lineage && (
            <section className="section vendor-lineage-section">
              <div className="container vendor-container">
                <h2 className="vendor-lineage-heading">{t(lineage.titleKey)}</h2>
                <div className="vendor-lineage-frame">
                  <LineageDiagram
                    title={t(lineage.titleKey)}
                    desc={t(lineage.descKey)}
                    stages={lineage.stages}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Body sections */}
          <section className="section era-body-section">
            <div className="container vendor-container">
              <div className="era-sections">
                {sections.map((s, i) => (
                  <div className="era-section" key={s}>
                    <span className="era-section-num mono">{String(i + 1).padStart(2, "0")}</span>
                    <div className="era-section-content">
                      <h2 className="era-section-title">{t(`${vendorKey}.${s}Title`)}</h2>
                      <p className="era-section-body">{t(`${vendorKey}.${s}Body`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Optional special note (e.g. the IronPort note on Cisco) */}
          {specialNote && (
            <section className="section">
              <div className="container vendor-container">
                <aside className="vendor-note">
                  <h2 className="vendor-note-title">{t(`${vendorKey}.${specialNote}Title`)}</h2>
                  <p className="vendor-note-body">{t(`${vendorKey}.${specialNote}Body`)}</p>
                </aside>
              </div>
            </section>
          )}

          {/* Certifications strip */}
          <section className="section vendor-certs-section">
            <div className="container vendor-container">
              <h2 className="vendor-certs-label">{tNav("certifications")}</h2>
              <p className="vendor-certs">{t(`${vendorKey}.certs`)}</p>
            </div>
          </section>

          {/* Next vendor */}
          {next && (
            <section className="section">
              <div className="container vendor-container">
                <Link href={`/about/vendors/${next.slug}`} className="era-next">
                  <span className="era-next-label">{t("readNext")}</span>
                  <span className="era-next-title">{t(`${next.key}.name`)} →</span>
                </Link>
              </div>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
