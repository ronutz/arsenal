// ============================================================================
// src/app/[locale]/disclaimer/page.tsx
// ----------------------------------------------------------------------------
// DISCLAIMER AND LIMITATION OF LIABILITY — the plain-language "use at your own
// risk" page PRIME requested (2026-07-06).
//
// What it must make unmistakable, to the visitor and, as far as a good-faith
// notice can, to the law:
//   - everything on the site (tools, results, articles, docs) is provided AS
//     IS, with no warranty of any kind and no guarantee of correctness;
//   - it is all built from publicly available information and can be wrong;
//   - use is at the visitor's own risk and judgement; verify before acting;
//   - no liability for damages or losses of any kind, to the maximum extent
//     permitted by law;
//   - security is best-effort: no responsibility for breaches or incidents
//     that might impact site users or users of the open-source code
//     maintained at github.com/ronutz (whose Apache 2.0 license carries its
//     own warranty disclaimer and liability limitation).
//
// Structure, CSS classes, and i18n pattern deliberately mirror the privacy
// page (colophon classes, hero + short version + titled body sections), so no
// new styling is needed. Statically generated for all locales; copy authored
// natively in EN + pt-BR, other locales fall back per-key to English. Linked
// from the shared footer next to License and Privacy.
//
// This is a good-faith notice drafted in plain language, not legal advice;
// the site owner may have qualified counsel review it.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export default async function DisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("disclaimer_page");
  const tNav = await getTranslations("nav");

  // The "short version" points, rendered as a set of lead paragraphs.
  const short = ["short1", "short2", "short3"];

  // The body sections: each is a heading key + a body key. Order tells the
  // story: no warranty -> why (public info) -> not advice -> no liability ->
  // security posture -> the open-source code -> things change.
  const sections = [
    ["asIsTitle", "asIsBody"],
    ["accuracyTitle", "accuracyBody"],
    ["adviceTitle", "adviceBody"],
    ["liabilityTitle", "liabilityBody"],
    ["securityTitle", "securityBody"],
    ["goodFaithTitle", "goodFaithBody"],
    ["takedownTitle", "takedownBody"],
    ["openSourceTitle", "openSourceBody"],
    ["changesTitle", "changesBody"],
  ];

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="colophon-hero">
            <div className="container colophon-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* The short version */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("shortTitle")}</h2>
              {short.map((k, i) => (
                <p
                  key={k}
                  className={i === 0 ? "colophon-lead" : "colophon-body"}
                >
                  {t(k)}
                </p>
              ))}
            </div>
          </section>

          {/* Body sections */}
          {sections.map(([titleKey, bodyKey]) => (
            <section className="section" key={titleKey}>
              <div className="container colophon-container">
                <h2 className="colophon-h2">{t(titleKey)}</h2>
                <p className="colophon-body">{t(bodyKey)}</p>
              </div>
            </section>
          ))}

          {/* Closing: acceptance + back home */}
          <section className="section">
            <div className="container colophon-container">
              <p className="colophon-body">{t("acceptBody")}</p>
              <Link href="/" className="btn btn-secondary colophon-back">
                {t("backHome")} →
              </Link>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

/** Localized metadata, same shape as the site's other static pages. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "disclaimer_page" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
