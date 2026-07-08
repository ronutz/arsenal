// ============================================================================
// src/app/[locale]/dev/other/subnet-drill/page.tsx
// ----------------------------------------------------------------------------
// SUBNETTING DRILL TRAINER — the first /dev/other (green room) tool page.
// Green env wrapper, the room's compact notice reused, the trainer island,
// and an inline "about" (this room's tools live outside the catalogue, so the
// short provenance renders here rather than through the tool-page map).
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import DevOtherSubnetDrillTool from "@/components/DevOtherSubnetDrillTool";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOther" });
  return {
    title: t("subnetDrill.metaTitle"),
    description: t("subnetDrill.metaDescription"),
  };
}

export default async function SubnetDrillPage({
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
                {t("subnetDrill.name")}{" "}
                <span className="envother-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("subnetDrill.blurb")}</p>
            </div>

            {/* The room's short notice (compact form): what "other" means here. */}
            <div className="envother-notice">
              <p className="envother-notice-title mono">{t("notice.title")}</p>
              <p className="envother-notice-text">{t("subnetDrill.why")}</p>
            </div>

            <DevOtherSubnetDrillTool />

            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              <p className="devfun-intro">{t("subnetDrill.about1")}</p>
              <p className="devfun-intro">{t("subnetDrill.about2")}</p>
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
