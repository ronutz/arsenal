// ============================================================================
// /roles/levels - grades, the Y moment, and where these roles are found.
//
// A grade is orthogonal to a role, so it gets its own page rather than being
// multiplied into the roster. Every role in the corpus exists at all four of
// these, and the same four exist across all eight groups on the path.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import { GRADES, Y_MOMENT, PERVASIVENESS, ROLES } from "@/lib/roles";

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

  return (
    <main className="page">
      <section className="section">
        <div className="container section-narrow">
          <p className="eyebrow">
            <Link href={`/${locale}/roles`}>{t("eyebrow")}</Link>
          </p>
          <h1 className="page-title">{t("levels.title")}</h1>
          <p className="page-lede">{t("levels.lede")}</p>
          <p className="dig-record-explain">{t("levels.whatChanges")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container section-narrow">
          <h2 className="section-title">{t("levels.gradesHeading")}</h2>
          <ol className="dig-records">
            {GRADES.map((g) => (
              <li key={g.id} className="dig-record">
                <code className="mono">{g.names.join(" · ")}</code>
                <dl className="dig-kv">
                  <dt>{t("levels.question")}</dt><dd>{g.question}</dd>
                  <dt>{t("levels.supervision")}</dt><dd>{g.supervision}</dd>
                  <dt>{t("levels.beyond")}</dt><dd>{g.beyondOwnWork}</dd>
                </dl>
              </li>
            ))}
          </ol>
          {/* The naming asymmetry is the reason `pleno` appears first in the
              middle grade's list of names: it is the word that states the thing
              directly rather than by subtraction. */}
          <p className="dig-record-explain">{t("levels.plenoNote")}</p>
        </div>
      </section>

      <section className="section" id="y-moment">
        <div className="container section-narrow">
          <h2 className="section-title">{t("levels.yHeading")}</h2>
          <p className="section-lede">{Y_MOMENT.whatItIs}</p>
          <div className="dig-result">
            <section className="dig-section">
              <h3 className="dig-section-title">{t("levels.yManagement")}</h3>
              <ul className="dig-notes">{Y_MOMENT.managementArm.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </section>
            <section className="dig-section">
              <h3 className="dig-section-title">{t("levels.yTechnical")}</h3>
              <ul className="dig-notes">{Y_MOMENT.technicalArm.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </section>
            <section className="dig-section">
              <h3 className="dig-section-title">{t("levels.yHonest")}</h3>
              <p className="dig-record-explain">{Y_MOMENT.theHonestPart}</p>
            </section>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container section-narrow">
          <h2 className="section-title">{t("levels.whereHeading")}</h2>
          <p className="section-lede">{PERVASIVENESS.claim}</p>
          <p className="dig-record-explain">{PERVASIVENESS.consequence}</p>
          <p className="mono">
            <Link href={`/${locale}/roles`}>{t("levels.backToRoles", { count: ROLES.length })}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
