// ============================================================================
// src/app/[locale]/about/history/page.tsx
// ----------------------------------------------------------------------------
// THE HISTORY INDEX — the entry point to the three era pages.
//
// Presents the three eras (pre-1996, 1996-2020, 2020-present) as a chronological
// set of cards, each linking to its own rich page. This is the hub of the
// /about/history/ sub-section (canon D-45). Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

// The three eras, in chronological order, with their route slugs.
const ERAS = [
  { slug: "pre-1996", key: "pre1996" },
  { slug: "1996-2020", key: "era19962020" },
  { slug: "2020-present", key: "era2020present" },
] as const;

export default async function HistoryIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("history");
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
            {/* Breadcrumb back to About */}
            <Link href="/about" className="article-back">
              ← {t("backToAbout")}
            </Link>

            <p className="hero-eyebrow">{t("indexTitle")}</p>
            <h1 className="page-hero-title">
              {t("indexLede")}
            </h1>

            {/* Era cards, chronological */}
            <ol className="history-eras">
              {ERAS.map((era, i) => (
                <li key={era.slug}>
                  <Link href={`/about/history/${era.slug}`} className="history-era-card">
                    <span className="history-era-num mono">{String(i + 1).padStart(2, "0")}</span>
                    <span className="history-era-years mono">{t(`${era.key}.years`)}</span>
                    <span className="history-era-title">{t(`${era.key}.title`)}</span>
                    <span className="history-era-subtitle">{t(`${era.key}.subtitle`)}</span>
                    <span className="history-era-cta">{t("readNext")} →</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
