// ============================================================================
// src/app/[locale]/dev/other/web-serial-console/page.tsx
// ----------------------------------------------------------------------------
// WEBSERIAL CONSOLE page. Slug renamed serial-console -> web-serial-console
// (PRIME 2026-07-16: the address should match the tool's name); a static
// client-redirect stub remains at the old path. Green env wrapper, the room's notice, the live
// serial console island (hardware-permission API + live session, no golden
// vectors), and an inline about with the Chromium-only / permission caveats.
// ============================================================================
import type { Metadata } from "next";
import MessageSlice from "@/components/MessageSlice";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import DevOtherWebSerialTool from "@/components/DevOtherWebSerialTool";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOther" });
  return { title: t("webserial.metaTitle"), description: t("webserial.metaDescription") };
}

export default async function SerialConsolePage({ params }: { params: Promise<{ locale: string }> }) {
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
                {t("webserial.name")} <span className="envother-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("webserial.blurb")}</p>
            </div>
            <div className="envother-notice">
              <p className="envother-notice-title mono">{t("notice.title")}</p>
              <p className="envother-notice-text">{t("webserial.why")}</p>
            </div>
            <MessageSlice namespaces={["devOther.webserial"]}><DevOtherWebSerialTool /></MessageSlice>
            <div className="devfun-head" style={{ marginTop: "2rem" }}>
              <p className="devfun-intro">{t("webserial.about1")}</p>
              <p className="devfun-intro">{t("webserial.about2")}</p>
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
