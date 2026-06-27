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

  // The CONCORD mechanics, shown as a labeled panel beneath the narrative.
  const mechanics = ["mech1", "mech2", "mech3", "mech4", "mech5", "mech6"];

  // The stack rows.
  const stack = [
    ["stackFramework", "stackFrameworkV"],
    ["stackI18n", "stackI18nV"],
    ["stackDesign", "stackDesignV"],
    ["stackType", "stackTypeV"],
    ["stackEngine", "stackEngineV"],
    ["stackSearch", "stackSearchV"],
  ];

  // Standards section: a lede plus five labeled parts.
  const standards = ["specs", "vectors", "owasp", "redblue", "local"];

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
          <section className="section colophon-concord-section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("concordTitle")}</h2>
              <p className="colophon-lead">{t("concordBody1")}</p>
              <p className="colophon-body">{t("concordBody2")}</p>
              <p className="colophon-body">{t("concordBody3")}</p>
              <blockquote className="colophon-pullquote">
                {t("concordPrincipal")}
              </blockquote>
              <p className="colophon-body">{t("concordBody4")}</p>
              <div className="colophon-mechanics">
                <p className="colophon-mech-title">{t("concordMechTitle")}</p>
                <div className="colophon-mech-grid">
                  {mechanics.map((m) => (
                    <div className="colophon-mech" key={m}>
                      <span className="colophon-mech-label mono">{t(`${m}Label`)}</span>
                      <span className="colophon-mech-gloss">{t(`${m}Gloss`)}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                    <span className="colophon-seat-model mono">{t(`${s.key}Model`)}</span>
                    <p className="colophon-seat-body">{t(`${s.key}Body`)}</p>
                  </li>
                ))}
              </ul>
              <p className="colophon-seats-note">{t("seatsModelNote")}</p>
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

          {/* Standards and frameworks — what the tools are built on: the
              specifications, golden vectors, OWASP, the red/blue posture, and
              the local/deterministic guarantee. */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("standardsTitle")}</h2>
              <p className="colophon-body">{t("standardsLede")}</p>
              <div className="colophon-principles">
                {standards.map((s) => (
                  <div className="colophon-principle" key={s}>
                    <h3 className="colophon-principle-title">{t(`${s}Label`)}</h3>
                    <p className="colophon-principle-body">{t(`${s}Body`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Is this vibe coding? — the honest line between fast surface and
              verified core, answering the question a savvy reader will ask. */}
          <section className="section">
            <div className="container colophon-container">
              <h2 className="colophon-h2">{t("vibeTitle")}</h2>
              <p className="colophon-body">{t("vibeBody1")}</p>
              <p className="colophon-body">{t("vibeBody2")}</p>
              <p className="colophon-body">{t("vibeBody3")}</p>
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
