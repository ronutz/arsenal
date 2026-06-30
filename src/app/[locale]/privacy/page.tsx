// ============================================================================
// src/app/[locale]/privacy/page.tsx
// ----------------------------------------------------------------------------
// PRIVACY NOTICE — an accurate, plain-language account of what the site does
// and does not do with visitor data.
//
// Written to match the site's actual behaviour (verified in code), not to make
// blanket claims: no cookies, no analytics, no trackers; tools run in-browser;
// the contact form opens the visitor's own mail client (no server POST); the
// only data that is touched is a device-local theme setting and the standard
// Cloudflare connection logs (incl. IP) inherent to hosting any site. Covers the
// disclosure essentials common to the GDPR and Brazil's LGPD (controller +
// contact, what is/ isn't processed, legal bases, international processing, data
// subject rights, children, changes). Statically generated; reuses the colophon
// CSS classes so no new styling is required. Linked from the shared footer.
//
// This is a good-faith factual disclosure, not legal advice or a certification
// of compliance; the controller should review it and may seek qualified counsel.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { contactEmail } from "@/config/contact";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("privacy_page");
  const tNav = await getTranslations("nav");

  // The contact address must never reach the served HTML or the locale JSON in
  // harvestable form. The privacy copy carries an {email} placeholder instead of
  // the literal address; we fill it here with a "user [at] domain" form (no "@",
  // no mailto:), matching the obfuscation the Contact page uses pre-hydration.
  const [emailUser, emailDomain] = contactEmail().split("@");
  const obfuscatedEmail = `${emailUser} [at] ${emailDomain}`;

  // The "short version" points, rendered as a set of lead paragraphs.
  const short = ["short1", "short2", "short3", "short4"];

  // The body sections: each is a heading key + a body key.
  const sections = [
    ["controllerTitle", "controllerBody"],
    ["noTrackTitle", "noTrackBody"],
    ["browserTitle", "browserBody"],
    ["hostingTitle", "hostingBody"],
    ["toolsTitle", "toolsBody"],
    ["contactTitle", "contactBody"],
    ["intlTitle", "intlBody"],
    ["childrenTitle", "childrenBody"],
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
              <h1 className="colophon-title">{t("title")}</h1>
              <p className="colophon-lede">{t("lede")}</p>
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
                <p className="colophon-body">{t(bodyKey, { email: obfuscatedEmail })}</p>
              </div>
            </section>
          ))}

          {/* Rights (one body plus two jurisdiction-specific notes) */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("rightsTitle")}</h2>
              <p className="colophon-body">{t("rightsBody", { email: obfuscatedEmail })}</p>
              <p className="colophon-body">{t("rightsGdpr")}</p>
              <p className="colophon-body">{t("rightsLgpd")}</p>
            </div>
          </section>

          {/* Changes + last-updated + back link */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("changesTitle")}</h2>
              <p className="colophon-body">{t("changesBody")}</p>
              <p className="colophon-body mono">{t("updated")}</p>
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
