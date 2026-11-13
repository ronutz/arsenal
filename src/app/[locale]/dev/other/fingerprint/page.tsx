// ============================================================================
// src/app/[locale]/dev/other/fingerprint/page.tsx
// ----------------------------------------------------------------------------
// SELF-FINGERPRINT INSPECTOR page. Green env wrapper, the room's notice, the
// inspector island (environment-as-input; output differs per visitor, so no
// golden vectors apply), and an inline about tying it to the privacy thesis.
// ============================================================================
// The page's own social card (12/11/2026: it shipped the generic one), named the way scripts/gen-og.mts draws it.
import { ogImages } from "@/lib/og";
// One description for the meta, og and twitter fields, merged into the card.
import { withDescription } from "@/lib/metaDescription";
import type { Metadata } from "next";
import MessageSlice from "@/components/MessageSlice";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import DevOtherFingerprintTool from "@/components/DevOtherFingerprintTool";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOther" });
  return { title: t("fingerprint.metaTitle"), ...withDescription(t("fingerprint.metaDescription"), ogImages("page", "dev-other", locale, t("fingerprint.metaTitle")), "dev/other/fingerprint") }; // the page's card (12/11/2026: it shipped the generic one)
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
            <MessageSlice namespaces={["devOther.fingerprint"]}><DevOtherFingerprintTool /></MessageSlice>
            {/* The closing section reads from the left, in line with the panels above (01/11/2026; it was the centred page
                head's class, as on the red room pages). */}
            <div className="devfun-about">
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
