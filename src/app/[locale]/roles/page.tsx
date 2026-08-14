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
    <main className="page">
      <section className="section">
        <div className="container section-narrow">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-lede">{t("lede")}</p>
          {/* The provenance summary sits at the top because it is the claim the
              whole section makes about itself. Counted from the data, so the
              sentence and the corpus cannot disagree. */}
          <p className="dig-record-explain mono">
            {t("provenanceSummary", { held: counts.held, alongside: counts.alongside, documented: counts.documented })}
          </p>
        </div>
      </section>

      {ROLE_GROUPS.map((group) => {
        const roles = rolesInGroup(group);
        if (roles.length === 0) return null;
        return (
          <section className="section" key={group} id={group}>
            <div className="container section-narrow">
              <h2 className="section-title">{t(`groups.${group}.title`)}</h2>
              <p className="section-lede">{t(`groups.${group}.lede`)}</p>
              <ul className="dig-records">
                {roles.map((r) => (
                  <li key={r.slug} className="dig-record">
                    <Link href={`/${locale}/roles/${r.slug}`} className="lineage-deal-name">
                      {r.title}
                    </Link>
                    <span className="dig-record-type">{t(`provenance.${r.provenance.kind}`)}</span>
                    <p className="dig-record-explain">{r.whatItIs.split(". ")[0]}.</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section className="section">
        <div className="container section-narrow">
          <p className="dig-record-explain">{t("countNote", { count: ROLES.length })}</p>
        </div>
      </section>
    </main>
  );
}
