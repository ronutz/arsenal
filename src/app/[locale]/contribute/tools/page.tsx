// ============================================================================
// src/app/[locale]/contribute/tools/page.tsx
// ----------------------------------------------------------------------------
// SHARE AN IDEA PAGE.
//
// The open channel for any input that could improve the toolbox: bug reports,
// feature requests for existing tools, ideas for new tools, or a different
// angle on a problem (a clearer explanation, an edge case, a better source).
// It keeps one section of guidance for the specific case of proposing a new
// tool — the {manifest, run, vectors} module shape and the principles a tool
// must hold to (deterministic, local, golden-vector-checked, sourced) - and a
// plain "fits / doesn't fit" test up front so off-topic ideas self-filter. It
// routes everything through the existing email channel (ObfuscatedEmail + the
// contact config), the same way the translations contribute page does. Reuses
// the contribute-* styles since it is the same visual family. Statically
// generated. The 'contributeIdeas' namespace is fully localized across all live
// locales; per the propagation rule, any wording change here must be mirrored
// into every locale pack in the same commit.
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
  const t = await getTranslations({ locale, namespace: "contributeIdeas" });
  return { title: t("title") };
}

export default async function ContributeToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contributeIdeas");
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
              <h2 className="contribute-h2">{t("sendTitle")}</h2>
              <p className="contribute-body">{t("sendBody")}</p>
            </div>

            <div className="contribute-block">
              <h2 className="contribute-h2">{t("toolTitle")}</h2>
              <p className="contribute-body">{t("fitRule")}</p>
              {/* Plain, scannable yes/no so even a distracted or non-technical
                  reader can tell at a glance whether their idea belongs here -
                  the point is to prevent off-topic tool proposals. */}
              <div className="contribute-fit">
                <div className="contribute-fit-row contribute-fit-row--yes">
                  <span className="contribute-fit-mark" aria-hidden="true">✓</span>
                  <p className="contribute-fit-text">
                    <span className="contribute-fit-label">{t("fitYes")}</span> {t("fitYesBody")}
                  </p>
                </div>
                <div className="contribute-fit-row contribute-fit-row--no">
                  <span className="contribute-fit-mark" aria-hidden="true">✗</span>
                  <p className="contribute-fit-text">
                    <span className="contribute-fit-label">{t("fitNo")}</span> {t("fitNoBody")}
                  </p>
                </div>
              </div>
              <p className="contribute-body">{t("fitUnsure")}</p>
              <p className="contribute-body">{t("toolBody")}</p>
              <p className="contribute-body">
                {t("roadmapCheck")}{" "}
                <a href={`/${locale}/roadmap`} className="contribute-inline-link">
                  {t("roadmapLink")}
                </a>
              </p>
            </div>

            <div className="contribute-block">
              <h2 className="contribute-h2">{t("emailTitle")}</h2>
              <p className="contribute-body">{t("emailBody")}</p>
              <div className="contribute-email">
                <ObfuscatedEmail
                  label={t("emailLabel")}
                  user={emailUser}
                  domain={emailDomain}
                />
              </div>
            </div>

            <div className="contribute-block contribute-disclaimer">
              <h2 className="contribute-h2">{t("disclaimerTitle")}</h2>
              <p className="contribute-body">{t("disclaimerBody")}</p>
              <p className="contribute-body">{t("disclaimerBody2")}</p>
              <p className="contribute-body contribute-disclaimer-status">{t("disclaimerStatus")}</p>
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
