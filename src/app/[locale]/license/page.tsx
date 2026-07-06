// ============================================================================
// src/app/[locale]/license/page.tsx
// ----------------------------------------------------------------------------
// LICENSE — the licensing terms for ronutz.com.
//
// Two parts: the project itself is open source — its code under the Apache
// License 2.0 and its written content under CC BY 4.0, both requiring
// attribution — and a third-party section credits the open-source software the
// site is built on, under each component's own license (the required
// attribution; the full notices live in the repo's NOTICE file). Linked from
// the footer's "License". Reuses the colophon's layout classes. Statically
// generated; localized across all live locales.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import LicenseBadges from "@/components/LicenseBadges";

export default async function LicensePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("license_page");
  const tNav = await getTranslations("nav");
  const tBadges = await getTranslations("licenseBadges");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="colophon-hero">
            <div className="container colophon-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              <LicenseBadges
                variant="page"
                labels={{
                  groupAria: tBadges("groupAria"),
                  openSource: tBadges("openSource"),
                  codeLicense: tBadges("codeLicense"),
                  contentLicense: tBadges("contentLicense"),
                  caption: tBadges("caption"),
                }}
              />
            </div>
          </section>

          {/* The website — proprietary */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("closedHeading")}</h2>
              <p className="colophon-body">{t("closedBody")}</p>
            </div>
          </section>

          {/* Third-party software — required attribution */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("thirdHeading")}</h2>
              <p className="colophon-body">{t("thirdBody")}</p>
            </div>
          </section>

          {/* Source code — the public repository */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("sourceHeading")}</h2>
              <p className="colophon-body">{t("sourceBody")}</p>
              <p>
                <a
                  className="api-download"
                  href="https://github.com/nutzmann/arsenal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("sourceLink")} →
                </a>
              </p>
            </div>
          </section>

          {/* Contact + back */}
          <section className="section">
            <div className="container colophon-container">
              <p className="colophon-body">
                {t.rich("contact", {
                  a: (chunks) => (
                    <Link href="/contact" className="license-contact-link">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
              <Link href="/" className="btn btn-secondary colophon-back">
                {t("backHome")} →
              </Link>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
