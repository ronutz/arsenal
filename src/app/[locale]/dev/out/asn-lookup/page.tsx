// ============================================================================
// src/app/[locale]/dev/out/asn-lookup/page.tsx
// ----------------------------------------------------------------------------
// ASN LOOKUP - the second /dev/out tool page. Red room wrapper, compact
// environment notice, the explicit-egress client component, and an inline
// sources block (this room's tools live outside the catalogue, so provenance
// renders here rather than through the tool-page map).
// ============================================================================
import type { Metadata } from "next";
import MessageSlice from "@/components/MessageSlice";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import EnvOutNotice from "@/components/EnvOutNotice";
import DevOutAsnLookupTool from "@/components/DevOutAsnLookupTool";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOut" });
  return {
    title: t("asn.metaTitle"),
    description: t("asn.metaDescription"),
  };
}

export default async function AsnLookupPage({
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
                {t("tools.asnLookup.name")}{" "}
                <span className="envout-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("tools.asnLookup.blurb")}</p>
            </div>

            <EnvOutNotice compact />

            <MessageSlice namespaces={["devOut.asn"]}><DevOutAsnLookupTool /></MessageSlice>

            {/* About + provenance, inline (off-catalogue room). */}
            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              <p className="devfun-intro">{t("asn.about1")}</p>
              <p className="devfun-intro">{t("asn.about2")}</p>
              <p className="tools-note">
                {t("asn.sourcesLabel")}: RFC 6793 · RFC 9082 · RFC 9083 · RFC 9224 (IANA
                bootstrap) · IANA Special-Purpose AS Numbers registry (2026-07-08) ·
                data.iana.org/rdap (2026-07-08)
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
