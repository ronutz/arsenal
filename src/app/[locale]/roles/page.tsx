// ============================================================================
// /roles - THE ROLES, the section index.
//
// Grouped by the path a product takes: made, moved, sold, deployed, run,
// supported, defended, taught. The order is a fact about the industry, which
// is what lets the roster grow without a curator deciding where things go.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import { ROLE_GROUPS, rolesInGroup, ROLES, provenanceCounts } from "@/lib/roles";
import RoleGroupFilter from "@/components/RoleGroupFilter";

import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import type { CSSProperties } from "react";
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
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const counts = provenanceCounts();

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
      <section className="section">
        <div className="container section-narrow">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[{ label: tNav("home"), href: "/" }, { label: t("eyebrow") }]}
            />
          <p className="hero-eyebrow">{t("eyebrow")}</p>
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-lede">{t("lede")}</p>

          {/* THE PROVENANCE COUNTER (PRIME 2026-08-16).
              Previously a bare mono paragraph pressed against the lede. It is
              the claim the section makes about its own authority, so it gets
              the chip row the rest of the site uses for counts, and the space
              to be read as a separate statement.
              `alongside` is HIDDEN AT ZERO: a counter reading "0 worked
              alongside" advertises an absence nobody asked about. */}
          <p className="family-chip-row">
            <span className="family-chip mono">
              {t("provenanceHeld", { held: counts.held })}
            </span>
            {counts.alongside > 0 && (
              <span className="family-chip mono">
                {t("provenanceAlongside", { alongside: counts.alongside })}
              </span>
            )}
            <span className="family-chip mono">
              {t("provenanceDocumented", { documented: counts.documented })}
            </span>
          </p>

          {/* THE THREE DOORS OUT, AS ONE ROW (PRIME 2026-08-16).
              They were three bare <p> wrappers, so three bordered pills stacked
              down the page with paragraph margins between them and one of them
              running the full width of its line. The class was right and the
              GROUPING was missing, which reads as unformatted because nothing
              says these three belong together. */}
          <p className="page-jump-row">
            <Link className="page-jump-link" href="/roles/levels">
              {t("levels.title")} <span aria-hidden="true">&#8594;</span>
            </Link>
            <Link className="page-jump-link" href="/practice">
              {t("practiceLink")} <span aria-hidden="true">&#8594;</span>
            </Link>
            <Link className="page-jump-link" href="/learn/the-path-a-product-takes">
              {t("overviewLink")} <span aria-hidden="true">&#8594;</span>
            </Link>
          </p>

          <RoleGroupFilter
            labels={{
              show: t("filterShow"),
              all: t("filterAll"),
              groupLabel: t("filterGroupLabel"),
            }}
            groups={ROLE_GROUPS.filter((g) => rolesInGroup(g).length > 0).map((g) => ({
              id: g,
              label: t(`groups.${g}.title`),
              n: rolesInGroup(g).length,
            }))}
          />
        </div>
      </section>

      {ROLE_GROUPS.map((group) => {
        const roles = rolesInGroup(group);
        if (roles.length === 0) return null;
        return (
          <section className="section" key={group} id={group} data-role-group={group}>
            <div className="container section-narrow">
              <h2 className="learn-card-title">{t(`groups.${group}.title`)}</h2>
              <p className="practice-part-card-note">{t(`groups.${group}.lede`)}</p>
              <ul className="learn-grid">
                {roles.map((r) => (
                  <li key={r.slug} className="learn-grid-item" data-role-entry>
                    {/* HELD ROLES CARRY THE AMBER EDGE (PRIME 2026-08-16), the same colour
                        as their provenance pill and the same mechanism the vendor
                        and reading-path cards already use: --note-accent drives
                        the left border and a tint of the background. Nothing new
                        is invented; the card simply says at a glance which of
                        these PRIME has done. */}
                    <Link
                      href={`/roles/${r.slug}`}
                      className="learn-card"
                      style={
                        r.provenance.kind === "held"
                          ? ({ "--note-accent": "var(--accent-amber)" } as CSSProperties)
                          : undefined
                      }
                    >
                      <h3 className="learn-card-title">{r.title}</h3>
                      <p className="learn-card-summary">{r.whatItIs.split(". ")[0]}.</p>
                      <span className="family-chip-row">
                        <span
                          className="family-chip mono"
                          style={
                            {
                              "--chip-color":
                                r.provenance.kind === "held"
                                  ? "var(--accent-amber)"
                                  : r.provenance.kind === "alongside"
                                    ? "var(--accent-cyan)"
                                    : "var(--color-muted)",
                            } as React.CSSProperties
                          }
                        >
                          <span className="family-chip-dot" aria-hidden />
                          {t(`provenance.${r.provenance.kind}`)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

        </article>
      </main>

      <SiteFooter />
    </>
  );
}
