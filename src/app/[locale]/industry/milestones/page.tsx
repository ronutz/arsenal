// ============================================================================
// src/app/[locale]/industry/milestones/page.tsx
// ----------------------------------------------------------------------------
// THE MILESTONES PAGE — the physics and engineering the company timeline sits
// on top of.
//
// A LITERAL ROUTE, deliberately. Next.js resolves a static segment before the
// dynamic `[slug]` beside it, so `/industry/milestones` reaches this page and
// never the company handler. That is also why `milestones` must never become a
// company slug - the company would be unreachable and nothing would report it.
//
// Grouped by STRAND rather than shown as one chronological list, because the
// interesting reading is following one thread - electricity from Volta to
// Hertz - rather than jumping between physics and storage by date.
// ============================================================================

import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { routing } from "@/i18n/routing";
import {
  MILESTONE_STRANDS,
  milestonesByStrand,
  milestonesChronological,
} from "@/content/milestones/milestones";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "milestones" });
  return { title: t("title"), description: t("intro") };
}

export default async function MilestonesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "milestones" });

  const all = milestonesChronological();

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container vendor-container">
            <Breadcrumbs
              items={[
                { label: t("breadcrumbHome"), href: "/" },
                { label: t("breadcrumbIndustry"), href: "/industry" },
                { label: t("breadcrumbHere") },
              ]}
            />
            <p className="hero-eyebrow mono">{t("eyebrow")}</p>
            <h1 className="article-title">{t("title")}</h1>
            <p className="era-intro">{t("intro")}</p>
            <p className="ztc-notes">{t("test")}</p>
            <p className="ztc-notes mono">
              {t("count", { count: all.length, from: all[0].year, to: all[all.length - 1].year })}
            </p>

            {MILESTONE_STRANDS.map((strand) => {
              const items = milestonesByStrand(strand);
              if (items.length === 0) return null;
              return (
                <section className="section" key={strand}>
                  <h2 className="section-title">{t(`strands.${strand}.name`)}</h2>
                  <p className="partner-body-p">{t(`strands.${strand}.blurb`)}</p>

                  <div className="lineage-timeline">
                    {items.map((m) => (
                      <div className="lineage-deal" key={m.slug} id={m.slug}>
                        <p className="lineage-deal-top mono">
                          {m.year}
                          {m.who ? ` · ${m.who}` : ""}
                        </p>
                        <h3 className="lineage-deal-name">{m.title}</h3>
                        <p className="lineage-deal-what">{m.what}</p>
                        {/* The `why` is the reason the entry exists. An entry
                            that only says what happened belongs in an
                            encyclopaedia, and there is a good one already. */}
                        <p className="partner-body-p">{m.why}</p>
                        {m.dateNote && (
                          <p className="lineage-deal-note">{m.dateNote}</p>
                        )}
                        {m.sources.length > 0 && (
                          <p className="lineage-deal-note mono">
                            {m.sources.map((s) => s.label).join(" · ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            <p className="ztc-notes">
              <Link href="/industry">{t("backToCompanies")}</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
