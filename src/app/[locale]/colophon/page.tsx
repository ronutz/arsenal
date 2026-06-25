// ============================================================================
// src/app/[locale]/colophon/page.tsx
// ----------------------------------------------------------------------------
// COLOPHON — "How this was built".
//
// A characterful page documenting CONCORD (the one-human / three-AI process),
// the seats (PRIME, ANVIL, SCOUT, PRISM), the build principles, and the stack.
// Pairs with the "Built by Rodolfo Nützmann with CONCORD" footer (now linked
// here). All facts accurate; tone distinctive but honest. Statically generated.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TRANSLATED_LOCALE_COUNT } from "@/i18n/locales";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export default async function ColophonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("colophon_page");
  const tNav = await getTranslations("nav");

  // The four seats, rendered as a set.
  const seats = [
    { key: "rolePrime", accent: true },
    { key: "roleAnvil", accent: false },
    { key: "roleScout", accent: false },
    { key: "rolePrism", accent: false },
  ];

  // The build principles.
  const principles = ["p1", "p2", "p3", "p4"];

  // The stack rows.
  const stack = [
    ["stackFramework", "stackFrameworkV"],
    ["stackI18n", "stackI18nV"],
    ["stackDesign", "stackDesignV"],
    ["stackType", "stackTypeV"],
    ["stackEngine", "stackEngineV"],
    ["stackSearch", "stackSearchV"],
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

          {/* CONCORD */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("concordTitle")}</h2>
              <p className="colophon-body">{t("concordBody1")}</p>
              <p className="colophon-body">{t("concordBody2")}</p>
            </div>
          </section>

          {/* The seats */}
          <section className="section colophon-seats-section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("rolesTitle")}</h2>
              <ul className="colophon-seats">
                {seats.map((s) => (
                  <li
                    key={s.key}
                    className={"colophon-seat" + (s.accent ? " colophon-seat--prime" : "")}
                  >
                    <div className="colophon-seat-head">
                      <span className="colophon-seat-name mono">{t(s.key)}</span>
                      <span className="colophon-seat-who">{t(`${s.key}Who`)}</span>
                    </div>
                    <p className="colophon-seat-body">{t(`${s.key}Body`)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Principles */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("principlesTitle")}</h2>
              <p className="colophon-body">{t("principlesBody")}</p>
              <div className="colophon-principles">
                {principles.map((p) => (
                  <div className="colophon-principle" key={p}>
                    <h3 className="colophon-principle-title">{t(`${p}Title`)}</h3>
                    <p className="colophon-principle-body">{t(`${p}Body`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* The stack */}
          <section className="section colophon-stack-section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("stackTitle")}</h2>
              <p className="colophon-body">{t("stackBody")}</p>
              <dl className="colophon-stack">
                {stack.map(([label, value]) => (
                  <div className="colophon-stack-row" key={label}>
                    <dt className="colophon-stack-label">{t(label)}</dt>
                    <dd className="colophon-stack-value">
                      {value === "stackI18nV"
                        ? t(value, { count: TRANSLATED_LOCALE_COUNT })
                        : t(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Closing */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("closingTitle")}</h2>
              <p className="colophon-body">{t("closingBody")}</p>
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
