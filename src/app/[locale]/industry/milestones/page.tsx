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
  const tNav = await getTranslations({ locale, namespace: "nav" });
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
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const all = milestonesChronological();

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        {/* RESTRUCTURED 2026-08-10 (PRIME: "completely unformatted").
            Three things were wrong and none of them was missing CSS:

            1. The page used `article-title` and `era-intro` - the classes for
               MDX article bodies - where every other top-level page uses
               `page-hero-title` and `page-hero-lede`. Right text, wrong scale.
            2. Each strand was a <section className="section"> nested INSIDE the
               hero's own section AND inside its container, so it inherited the
               container width and then applied section padding a second time.
               Sections are siblings here, as they are everywhere else.
            3. The strands had no container of their own, which is why the
               timeline did not line up with the rest of the site. */}
        <section className="section">
          <div className="container section-narrow">
            <Breadcrumbs
              items={[
                { label: t("breadcrumbHome"), href: "/" },
                { label: t("breadcrumbIndustry"), href: "/industry" },
                { label: t("breadcrumbHere") },
              ]}
            />
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("intro")}</p>
            <p className="section-body">{t("test")}</p>
            <p className="ztc-notes mono">
              {t("count", { count: all.length, from: all[0].year, to: all[all.length - 1].year })}
            </p>
          </div>
        </section>

        {MILESTONE_STRANDS.map((strand) => {
          const items = milestonesByStrand(strand);
          if (items.length === 0) return null;
          return (
            <section className="section" key={strand}>
              <div className="container section-narrow">
                <h2 className="section-title">{t(`strands.${strand}.name`)}</h2>
                <p className="section-body">{t(`strands.${strand}.blurb`)}</p>

                <div className="lineage-timeline">
                  {items.map((m) => (
                    <div className="lineage-deal" key={m.slug} id={m.slug}>
                      <p className="lineage-deal-top mono">
                        {m.year}
                        {m.who ? ` \u00b7 ${m.who}` : ""}
                      </p>
                      <h3 className="lineage-deal-name">{m.title}</h3>
                      <p className="lineage-deal-what">{m.what}</p>
                      {/* The `why` is the reason the entry exists. An entry
                          that only says what happened belongs in an
                          encyclopaedia, and there is a good one already. */}
                      <p className="lineage-deal-what">{m.why}</p>
                      {m.dateNote && (
                        <p className="lineage-deal-note">{m.dateNote}</p>
                      )}
                      {m.sources.length > 0 && (
                        <p className="lineage-deal-note mono">
                          {m.sources.map((s) => s.label).join(" \u00b7 ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <section className="section">
          <div className="container section-narrow">
            <Link className="page-jump-link" href="/industry">
              {t("backToCompanies")} <span aria-hidden="true">&#8594;</span>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
