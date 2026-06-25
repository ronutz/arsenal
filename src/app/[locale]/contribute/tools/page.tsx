// ============================================================================
// src/app/[locale]/contribute/tools/page.tsx
// ----------------------------------------------------------------------------
// CONTRIBUTE A TOOL PAGE.
//
// Where someone with a tool that fits the toolbox can propose it. It explains
// the real engine model (a {manifest, run, vectors} triple), the principles a
// tool must hold to (deterministic, local, golden-vector-checked, sourced,
// permissively licensed), and routes proposals through the existing email
// channel (ObfuscatedEmail + the contact config), the same way the translations
// contribute page does. Reuses the contribute-* styles since it is the same
// visual family. Statically generated; English-first (the 'contributeTools'
// namespace lives only in en.json, so every locale falls back to it).
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ObfuscatedEmail from "@/components/ObfuscatedEmail";
import { contactEmail } from "@/config/contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contributeTools" });
  return { title: t("title") };
}

export default async function ContributeToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contributeTools");
  const tNav = await getTranslations("nav");

  // Split the address so ObfuscatedEmail assembles it at runtime (anti-harvest).
  const [emailUser, emailDomain] = contactEmail().split("@");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container contribute-container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="contribute-title">{t("title")}</h1>
            <p className="contribute-lede">{t("lede")}</p>

            <div className="contribute-block">
              <h2 className="contribute-h2">{t("shapeTitle")}</h2>
              <p className="contribute-body">{t("shapeBody")}</p>
            </div>

            <div className="contribute-block">
              <h2 className="contribute-h2">{t("principlesTitle")}</h2>
              <p className="contribute-body">{t("principlesBody")}</p>
            </div>

            <div className="contribute-block">
              <h2 className="contribute-h2">{t("proposeTitle")}</h2>
              <p className="contribute-body">{t("proposeBody")}</p>
              <div className="contribute-email">
                <ObfuscatedEmail
                  label={t("emailLabel")}
                  user={emailUser}
                  domain={emailDomain}
                />
              </div>
            </div>

            <a
              href={`/${locale}/tools`}
              className="btn btn-secondary contribute-back"
            >
              {t("backToTools")} →
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
