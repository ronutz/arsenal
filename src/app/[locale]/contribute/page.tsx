// ============================================================================
// src/app/[locale]/contribute/page.tsx
// ----------------------------------------------------------------------------
// HELP IMPROVE RONUTZ (G18, SCOUT, adopted 2026-10-05): the page opens with the
// five ways a reader can contribute, each a card to its route (report an error;
// suggest a tool; suggest a source or a correction; improve a translation;
// contribute code), and the translations section that was the whole page keeps
// its place below, anchored as #translations.
//
// THE TRANSLATIONS SECTION, as it was:
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
import { Link } from "@/i18n/navigation";
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
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container contribute-container">
            <p className="hero-eyebrow">{t("hubEyebrow")}</p>
            <h1 className="page-hero-title">{t("hubTitle")}</h1>
            <p className="page-hero-lede">{t("hubLede")}</p>

            {/* The five routes (G18). Internal routes through the i18n Link; the repository is the one
                external destination; the translations route stays on this page. */}
            <ul className="contribute-routes">
              {([
                { id: "error", href: "/contact?intent=other#contact-form", plain: true },
                { id: "tool", href: "/contribute/tools" },
                { id: "source", href: "/contact#correction", plain: true },
                { id: "translation", href: "#translations", plain: true },
                { id: "code", href: "https://github.com/ronutz/arsenal", external: true },
              ] as { id: string; href: string; plain?: boolean; external?: boolean }[]).map((r) => {
                const inner = (
                  <>
                    <span className="contribute-route-title">{t(`routes.${r.id}.title`)}</span>
                    <span className="contribute-route-desc">{t(`routes.${r.id}.desc`)}</span>
                    <span className="contribute-route-cta">{t(`routes.${r.id}.cta`)} →</span>
                  </>
                );
                return (
                  <li key={r.id}>
                    {r.external ? (
                      <a className="contribute-route" href={r.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                    ) : r.plain ? (
                      // A hash or a query must reach the destination as written, so these are plain anchors
                      // with the locale prefixed by hand; a bare hash stays on this page.
                      <a className="contribute-route" href={r.href.startsWith("#") ? r.href : `/${locale}${r.href}`}>{inner}</a>
                    ) : (
                      <Link className="contribute-route" href={r.href}>{inner}</Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* The translations section, as it was, now one route among five. */}
            <h2 className="contribute-h2 contribute-section-title" id="translations">{t("title")}</h2>
            <p className="contribute-body">{t("lede")}</p>

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
