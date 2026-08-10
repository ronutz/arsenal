// ============================================================================
// src/app/[locale]/industry/sources/page.tsx
// ----------------------------------------------------------------------------
// REFERENCE WORKS INDEX (PRIME 2026-08-10).
//
// The industry corpus is the history of this field; this is where the works it
// leans on are introduced. Placed under /industry/ rather than beside Learn or
// Practice because it is reference material about the same subject the industry
// pages cover, not a lesson.
//
// It holds one entry today. It is still an index rather than a single page,
// because Wave 0 exists precisely so the next work added has somewhere obvious
// to go - and because a page that is a list of one is honest about being a list.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import { SOURCE_WORKS } from "@/content/sources/pelkey";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sources" });
  return { ...ogImages("page", "industry-sources", locale, t("title")) };
}

export default async function SourcesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("sources");
  const tNav = await getTranslations("nav");
  const tIndustry = await getTranslations("industry");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="section">
            <div className="container section-narrow">
              <Breadcrumbs
                ariaLabel={tNav("breadcrumb")}
                items={[
                  { label: tNav("home"), href: "/" },
                  { label: tIndustry("navLabel"), href: "/industry" },
                  { label: t("navLabel") },
                ]}
              />
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <ul className="learn-grid">
                {SOURCE_WORKS.map((w) => (
                  <li key={w.slug} className="learn-grid-item">
                    <Link
                      href={`/industry/sources/${w.slug}`}
                      className="learn-card"
                    >
                      <h2 className="learn-card-title">{w.title}</h2>
                      <p className="vendor-note-body mono">{w.period}</p>
                      <p className="learn-card-summary">{w.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
