// ============================================================================
// /roles - THE ROLES, the section index.
//
// Grouped by the path a product takes: made, moved, sold, deployed, run,
// supported, defended, taught. The order is a fact about the industry, which
// is what lets the roster grow without a curator deciding where things go.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import { ROLE_GROUPS, rolesInGroup, ROLES, provenanceCounts } from "@/lib/roles";

export function generateStaticParams() {
  return LIVE_LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "roles" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function RolesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "roles" });
  const counts = provenanceCounts();

  return (
    <main>
      <section className="section">
        <div className="container section-narrow">
          <p className="hero-eyebrow">{t("eyebrow")}</p>
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-lede">{t("lede")}</p>
          {/* The provenance summary sits at the top because it is the claim the
              whole section makes about itself. Counted from the data, so the
              sentence and the corpus cannot disagree. */}
          <p className="practice-part-card-count mono">
            {t("provenanceSummary", { held: counts.held, alongside: counts.alongside, documented: counts.documented })}
          </p>
          {/* Grades run across every entry below, so the door to them sits with
              the section framing rather than inside any one group. */}
          <p className="mono">
            <Link href={`/${locale}/roles/levels`}>{t("levels.title")}</Link>
          </p>
        </div>
      </section>

      {ROLE_GROUPS.map((group) => {
        const roles = rolesInGroup(group);
        if (roles.length === 0) return null;
        return (
          <section className="section" key={group} id={group}>
            <div className="container section-narrow">
              <h2 className="learn-card-title">{t(`groups.${group}.title`)}</h2>
              <p className="practice-part-card-note">{t(`groups.${group}.lede`)}</p>
              <ul className="learn-grid">
                {roles.map((r) => (
                  <li key={r.slug} className="learn-grid-item">
                    <Link href={`/${locale}/roles/${r.slug}`} className="learn-card">
                      <h3 className="learn-card-title">{r.title}</h3>
                      <p className="learn-card-summary">{r.whatItIs.split(". ")[0]}.</p>
                      <p className="practice-part-card-count mono">
                        {t(`provenance.${r.provenance.kind}`)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section className="section">
        <div className="container section-narrow">
          <p className="learn-card-summary">{t("countNote", { count: ROLES.length })}</p>
        </div>
      </section>
    </main>
  );
}
