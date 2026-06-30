// ============================================================================
// src/app/[locale]/api/page.tsx
// ----------------------------------------------------------------------------
// THE API DOCS PAGE.
//
// Documents the tools API: a short, honest intro (privacy stance + the
// same-engine guarantee + the spec), then the on-brand reference renderer
// (ApiReference, a client component that fetches /openapi.json and themes with
// the rest of the site). The page itself is statically generated; the reference
// hydrates on the client.
//
// The page chrome (eyebrow, title, lede, section copy) is localized via the
// 'api' namespace in every live locale pack. The OpenAPI document and the
// interactive reference it drives are English by convention.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ApiExplorer from "@/components/ApiExplorer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "api" });
  return { title: t("title") };
}

export default async function ApiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("api");
  const tNav = await getTranslations("nav");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container api-page">
            <h1 className="api-title">{t("title")}</h1>
            <p className="api-lede">{t("lede")}</p>

            <div className="api-block">
              <h2 className="api-h2">{t("privacyTitle")}</h2>
              <p className="api-body">{t("privacyBody")}</p>
            </div>

            <div className="api-block">
              <h2 className="api-h2">{t("engineTitle")}</h2>
              <p className="api-body">{t("engineBody")}</p>
            </div>

            <div className="api-block">
              <h2 className="api-h2">{t("specTitle")}</h2>
              <p className="api-body">{t("specBody")}</p>
              <p>
                <a className="api-download" href="/openapi.yaml" download="openapi.yaml">
                  {t("downloadSpec")}
                </a>
              </p>
            </div>

            <h2 className="api-h2 api-reference-heading">{t("referenceTitle")}</h2>
            <ApiExplorer />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
