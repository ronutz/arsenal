// ============================================================================
// src/app/[locale]/contribute/page.tsx
// ----------------------------------------------------------------------------
// CONTRIBUTE TRANSLATIONS PAGE.
//
// Where a reader who spots a bad machine translation can help fix it. It is the
// target of the machine-translation notice bar (see MachineTranslationNotice).
// Three things, localized into every live locale:
//   1. A plain explanation that non-English packs are machine-made drafts.
//   2. Download links for each language pack. The packs are copied to
//      public/locales/<code>.json at build time by scripts/copy-locales.mjs
//      (wired as the npm `prebuild` step), so /locales/<code>.json is a real,
//      downloadable static file. English is marked as the reference.
//   3. An email channel (reusing ObfuscatedEmail + the contact config) to send
//      the edited file back.
//
// The download list is derived from LIVE_LOCALES, so it always matches exactly
// the locales that actually have a translated pack. Statically generated.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ObfuscatedEmail from "@/components/ObfuscatedEmail";
import { LIVE_LOCALES, DEFAULT_LOCALE } from "@/i18n/locales";
import { contactEmail } from "@/config/contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contribute" });
  return { title: t("title") };
}

export default async function ContributePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contribute");
  const tNav = await getTranslations("nav");

  // Split the email so ObfuscatedEmail assembles it at runtime (anti-harvest).
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

            {/* How it works */}
            <div className="contribute-block">
              <h2 className="contribute-h2">{t("howTitle")}</h2>
              <p className="contribute-body">{t("howBody")}</p>
            </div>

            {/* Downloadable packs, one per live locale */}
            <div className="contribute-block">
              <h2 className="contribute-h2">{t("downloadHeading")}</h2>
              <ul className="contribute-packs">
                {LIVE_LOCALES.map((l) => (
                  <li key={l.code}>
                    <a
                      className="contribute-pack"
                      href={`/locales/${l.code}.json`}
                      download={`${l.code}.json`}
                    >
                      <span className="contribute-pack-name">{l.nativeName}</span>
                      <span className="contribute-pack-meta">
                        <span className="contribute-pack-code mono">{l.code}.json</span>
                        {l.code === DEFAULT_LOCALE && (
                          <span className="contribute-pack-ref">{t("referenceTag")}</span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Send it back */}
            <div className="contribute-block">
              <h2 className="contribute-h2">{t("emailHeading")}</h2>
              <div className="contribute-email">
                <ObfuscatedEmail label={emailUser ? "Email" : "Email"} user={emailUser} domain={emailDomain} />
              </div>
            </div>

            <a href={`/${locale}`} className="btn btn-secondary contribute-back">
              {t("backHome")} →
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
