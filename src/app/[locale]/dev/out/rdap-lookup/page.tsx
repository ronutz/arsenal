// ============================================================================
// src/app/[locale]/dev/out/rdap-lookup/page.tsx
// ----------------------------------------------------------------------------
// RDAP LOOKUP - the first /dev/out tool page. Red room wrapper, compact
// environment notice, the explicit-egress client component, and an inline
// sources block (this room's tools live outside the catalogue, so provenance
// renders here rather than through the tool-page map).
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import EnvOutNotice from "@/components/EnvOutNotice";
import DevOutRdapTool from "@/components/DevOutRdapTool";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOut" });
  return {
    title: t("rdap.metaTitle"),
    description: t("rdap.metaDescription"),
  };
}

export default async function RdapLookupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("devOut");

  return (
    <div className="env-out">
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <h1 className="devfun-title">
                {t("tools.rdapLookup.name")}{" "}
                <span className="envout-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("tools.rdapLookup.blurb")}</p>
            </div>

            <EnvOutNotice compact />

            <DevOutRdapTool />

            {/* About + provenance, inline (off-catalogue room). */}
            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              <p className="devfun-intro">{t("rdap.about1")}</p>
              <p className="devfun-intro">{t("rdap.about2")}</p>
              <p className="tools-note">
                {t("rdap.sourcesLabel")}: RFC 7480 · RFC 9082 · RFC 9083 · RFC 9224 (IANA
                bootstrap) · data.iana.org/rdap (2026-07-08)
              </p>
              <p className="tools-note">
                <Link href="/dev/out" className="devout-door-link">
                  {t("backToOut")}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
