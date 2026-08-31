// ============================================================================
// /roles/levels - grades, the Y moment, and where these roles are found.
//
// A grade is orthogonal to a role, so it gets its own page rather than being
// multiplied into the roster. Every role in the corpus exists at all four of
// these, and the same four exist across all eight groups on the path.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import { GRADES, Y_MOMENT, PERVASIVENESS, ROLES } from "@/lib/roles";

import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
export function generateStaticParams() {
  return LIVE_LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "roles" });
  return { title: t("levels.title"), description: t("levels.metaDescription") };
}

export default async function LevelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "roles" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
      <section className="section">
        <div className="container article-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("eyebrow"), href: "/roles" },
                { label: t("levels.title") },
              ]}
            />
          <p className="hero-eyebrow">
            <Link href="/roles">{t("eyebrow")}</Link>
          </p>
          <h1 className="page-hero-title">{t("levels.title")}</h1>
          <p className="page-hero-lede">{t("levels.lede")}</p>
          <p className="section-body">{t("levels.whatChanges")}</p>
        </div>
      </section>

      <section className="section section-accent">
        <div className="container article-container">
          <h2 className="section-title">{t("levels.gradesHeading")}</h2>
          <ol className="learn-grid">
            {GRADES.map((g) => (
              <li key={g.id} className="learn-grid-item">
                <code className="mono">{g.names.join(" · ")}</code>
                <dl className="article-related-list">
                  <dt className="article-related-link-title">{t("levels.question")}</dt><dd className="article-related-link-summary">{g.question}</dd>
                  <dt className="article-related-link-title">{t("levels.supervision")}</dt><dd className="article-related-link-summary">{g.supervision}</dd>
                  <dt className="article-related-link-title">{t("levels.beyond")}</dt><dd className="article-related-link-summary">{g.beyondOwnWork}</dd>
                </dl>
              </li>
            ))}
          </ol>
          {/* The naming asymmetry is the reason `pleno` appears first in the
              middle grade's list of names: it is the word that states the thing
              directly rather than by subtraction. */}
          <p className="section-body">{t("levels.plenoNote")}</p>
        </div>
      </section>

      <section className="section" id="y-moment">
        <div className="container article-container">
          <h2 className="section-title">{t("levels.yHeading")}</h2>
          <p className="article-summary">{Y_MOMENT.whatItIs}</p>
          <div className="article-body">
            <section className="article-related">
              <h3 className="article-related-title">{t("levels.yManagement")}</h3>
              <ul className="article-related-list">{Y_MOMENT.managementArm.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </section>
            <section className="article-related">
              <h3 className="article-related-title">{t("levels.yTechnical")}</h3>
              <ul className="article-related-list">{Y_MOMENT.technicalArm.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </section>
            <section className="article-related">
              <h3 className="article-related-title">{t("levels.yHonest")}</h3>
              <p className="section-body">{Y_MOMENT.theHonestPart}</p>
            </section>
          </div>
        </div>
      </section>

      <section className="section section-accent">
        <div className="container article-container">
          <h2 className="section-title">{t("levels.whereHeading")}</h2>
          <p className="article-summary">{PERVASIVENESS.claim}</p>
          <p className="section-body">{PERVASIVENESS.consequence}</p>
          {/* The way back was a bare <Link> in `article-back`, which renders
              as body text — PRIME: "does not look like a link at all". It now
              uses the jump-link pill, the same control the roles index uses. */}
          <p className="page-jump-row">
            <Link href="/roles" className="page-jump-link">
              {t("levels.backToRoles", { count: ROLES.length })}{" "}
              <span aria-hidden="true">&#8594;</span>
            </Link>
          </p>
        </div>
      </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
