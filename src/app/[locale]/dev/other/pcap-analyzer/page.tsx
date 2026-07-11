// ============================================================================
// src/app/[locale]/dev/other/pcap-analyzer/page.tsx
// ----------------------------------------------------------------------------
// PCAP ANALYZER — the green room's anchor-tenant page. Green env wrapper, the
// room's compact notice, the file-drop dissector island, and an inline about
// with the honest depth statement (v1 = L2-L4; deeper payload parsing later).
// ============================================================================
import type { Metadata } from "next";
import MessageSlice from "@/components/MessageSlice";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import DevOtherPcapTool from "@/components/DevOtherPcapTool";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOther" });
  return {
    title: t("pcap.metaTitle"),
    description: t("pcap.metaDescription"),
  };
}

export default async function PcapAnalyzerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("devOther");

  return (
    <div className="env-other">
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <h1 className="devfun-title">
                {t("pcap.name")} <span className="envother-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("pcap.blurb")}</p>
            </div>

            <div className="envother-notice">
              <p className="envother-notice-title mono">{t("notice.title")}</p>
              <p className="envother-notice-text">{t("pcap.why")}</p>
            </div>

            <MessageSlice namespaces={["devOther.pcap"]}><DevOtherPcapTool /></MessageSlice>

            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              <p className="devfun-intro">{t("pcap.about1")}</p>
              <p className="devfun-intro">{t("pcap.about2")}</p>
              <p className="tools-note">
                <Link href="/dev/other" className="devother-door-link">
                  {t("backToOther")}
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
