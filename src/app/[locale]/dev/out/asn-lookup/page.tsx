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
            <div className="devfun-about">
              {/* The closing section reads from the left, in line with the panels above, under a heading as on the DoH
                  page (01/11/2026, PRIME: "The red room pages have a formatting issue in the last section in regards to
                  the other previous sections": it was the centred page head's class, so it ran as centred paragraphs). */}
              <h2 className="jwt-panel-title">{t("aboutTitle")}</h2>
              <p className="devfun-intro">{t("asn.about1")}</p>
              <p className="devfun-intro">{t("asn.about2")}</p>
              <details className="tcl-details">
                {/* The sources, folded as on the DoH page: each read on the date given. */}
                <summary>{t("asn.sourcesLabel")}</summary>
                <p className="tools-note">
                {/* RFC 5396 (asplain, asdot, asdot+) added 2026-10-19 with dotted input. */}
                RFC 5396 (asplain, asdot, asdot+; 2026-10-19) · RFC 6793 ·
                RFC 9082 · RFC 9083 · RFC 9224 (IANA bootstrap) · IANA Special-Purpose AS Numbers
                registry (2026-07-08) · data.iana.org/rdap (2026-07-08)
                </p>
              </details>
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
