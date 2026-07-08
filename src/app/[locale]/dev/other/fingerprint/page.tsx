// ============================================================================
// src/app/[locale]/dev/other/fingerprint/page.tsx
// ----------------------------------------------------------------------------
// SELF-FINGERPRINT INSPECTOR page. Green env wrapper, the room's notice, the
// inspector island (environment-as-input; output differs per visitor, so no
// golden vectors apply), and an inline about tying it to the privacy thesis.
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import DevOtherFingerprintTool from "@/components/DevOtherFingerprintTool";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOther" });
  return { title: t("fingerprint.metaTitle"), description: t("fingerprint.metaDescription") };
}

export default async function FingerprintPage({ params }: { params: Promise<{ locale: string }> }) {
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
                {t("fingerprint.name")} <span className="envother-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("fingerprint.blurb")}</p>
            </div>
            <div className="envother-notice">
              <p className="envother-notice-title mono">{t("notice.title")}</p>
              <p className="envother-notice-text">{t("fingerprint.why")}</p>
            </div>
            <DevOtherFingerprintTool />
            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              <p className="devfun-intro">{t("fingerprint.about1")}</p>
              <p className="devfun-intro">{t("fingerprint.about2")}</p>
              <p className="tools-note">
                <Link href="/dev/other" className="devother-door-link">{t("backToOther")}</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
