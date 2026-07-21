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
import MessageSlice from "@/components/MessageSlice";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ApiExplorer from "@/components/ApiExplorer";
import { isApiProcessingEnabled } from "@/config/apiSurface";

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
  const processingOn = isApiProcessingEnabled();

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
            <span
              className="api-state-badge"
              data-processing={processingOn ? "on" : "off"}
            >
              <span className="api-state-dot" aria-hidden="true" />
              {processingOn ? t("stateBadgeOn") : t("stateBadgeOff")}
            </span>
            <p className="api-lede">{t("lede")}</p>

            {/* Served-state section: OFF explains why the API is not served; ON
                explains it is served locally. Driven by the single switch. */}
            <div className="api-block api-block--notice" data-processing={processingOn ? "on" : "off"}>
              <h2 className="api-h2">{processingOn ? t("servedOnTitle") : t("servedTitle")}</h2>
              <p className="api-body">{processingOn ? t("servedOnBody") : t("servedBody")}</p>
            </div>

            {/* Self-hosting walkthrough (PRIME 2026-07-21): the concrete
                journey from source to served endpoints - download, flip
                API_PROCESSING in src/config/apiSurface.ts, build, deploy,
                call. Sits directly after the served-state notice because it
                answers the question that notice raises. */}
            <div className="api-block">
              <h2 className="api-h2">{t("selfHostTitle")}</h2>
              <p className="api-body">{t("selfHostBody")}</p>
              <p className="api-body">{t("selfHostBody2")}</p>
            </div>

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
            <MessageSlice namespaces={["api"]}><ApiExplorer /></MessageSlice>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
