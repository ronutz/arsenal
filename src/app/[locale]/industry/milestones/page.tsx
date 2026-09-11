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
import { externalRel } from "@/config/redEducation";
import { routing } from "@/i18n/routing";
import {
  MILESTONE_STRANDS,
  milestonesByStrand,
  milestonesChronological,
} from "@/content/milestones/milestones";
import { countryLabel } from "@/content/vendors/origins";
import CountryFlag from "@/components/CountryFlag";
import MilestoneCountryFilter from "@/components/MilestoneCountryFilter";

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

        {/* COUNTRY FILTER (PRIME 2026-08-13). Counts computed here, from the
            same array the cards render, so a chip cannot claim a number the
            timeline then contradicts - the rule the vendor timeline already
            follows.

            ALPHABETICAL BY ISO CODE, matching /industry: the code is what the
            button displays, so ordering by count would leave the visible labels
            out of order and turn the row into an implicit ranking. */}
        <section className="section section-accent">
          <div className="container section-narrow">
            <MilestoneCountryFilter
              labels={{
                show: t("filter.show"),
                all: t("filter.all"),
                countryLabel: t("filter.countryLabel"),
              }}
              countries={Object.entries(
                milestonesChronological().reduce<Record<string, number>>((acc, m) => {
                  for (const c of m.countries ?? []) acc[c] = (acc[c] ?? 0) + 1;
                  return acc;
                }, {}),
              )
                .map(([code, n]) => ({ code, n, label: countryLabel(code as never) }))
                .sort((a, b) => a.code.localeCompare(b.code))}
            />
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
                    /* CORRECTED 2026-08-11 (PRIME: "STILL unformatted and
                       looking very badly" - and he was right).

                       My 2026-08-10 fix repaired the PAGE structure and never
                       looked at the COMPONENT. `.lineage-deal` is a two-column
                       grid, `grid-template-columns: 4.5rem 1fr`, with a spine
                       drawn at `left: 4.5rem`. It expects EXACTLY TWO children:
                       a rail and a card.

                       This page was passing SIX flat siblings, so the browser
                       laid them into the grid alternately - title into a 4.5rem
                       column, prose into the next, and so on down the page. The
                       classes all existed, which is what I checked last time;
                       I never checked what they DO. */
                    <div
                      className="lineage-deal"
                      key={m.slug}
                      id={m.slug}
                      /* SPACE-SEPARATED, and PLURAL. A milestone can belong to
                         more than one country - the transatlantic cable had two
                         ends, Telstar had ground stations in three - so the
                         filter matches against a LIST rather than a value. The
                         vendor timeline's `data-country` is singular because a
                         company has one origin; an event does not. */
                      data-milestone-entry=""
                      data-countries={(m.countries ?? []).join(" ")}
                    >
                      <div className="lineage-deal-rail">
                        <span className="lineage-deal-dot" />
                        <span className="lineage-deal-year mono">{m.year}</span>
                      </div>
                      <div className="lineage-deal-card">
                        <div className="lineage-deal-top">
                          <span className="lineage-deal-name">{m.title}</span>
                          {m.who ? <span className="type-badge">{m.who}</span> : null}
                          {/* WHERE THE WORK WAS DONE (PRIME 2026-08-13).
                              Multiple flags where the work genuinely spans
                              countries, in the order the data lists them.

                              SVG rather than emoji, for the reason recorded on
                              the vendor timeline: Windows ships no country flag
                              glyphs, so emoji degrade to bare regional
                              indicator letters for most desktop readers.

                              The country NAME is the title attribute rather
                              than visible text. On a vendor card the name sits
                              beside the flag because there is one of them and a
                              metadata line to carry it; here there can be
                              three, and three spelled-out names would crowd the
                              title they belong to. */}
                          {(m.countries ?? []).length > 0 && (
                            <span className="milestone-flags">
                              {(m.countries ?? []).map((c) => (
                                <span key={c} className="milestone-flag" title={countryLabel(c as never)}>
                                  <CountryFlag code={c as never} />
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        <p className="lineage-deal-what">{m.what}</p>
                        {/* The `why` is the reason the entry exists. An entry
                            that only says what happened belongs in an
                            encyclopaedia, and there is a good one already. */}
                        <p className="lineage-deal-what">{m.why}</p>
                        {m.dateNote && (
                          <p className="lineage-deal-note">{m.dateNote}</p>
                        )}
                        {/* SOURCES AS LINKS (PRIME 2026-08-11). The `url` on a
                            milestone source is OPTIONAL and most of these
                            citations are to primary literature from before the
                            web - Volta's 1800 letter, Maxwell's 1865 paper -
                            which have no canonical address. So this renders a
                            link ONLY where a url exists and plain text
                            otherwise, rather than inventing a destination or
                            leaving every citation unlinked. Same convention as
                            the vendor pages: new tab, and `externalRel` for the
                            rel attribute. */}
                        {m.sources.length > 0 && (
                          <p className="lineage-deal-note mono">
                            {m.sources.map((s, i) => (
                              <span key={s.label}>
                                {i > 0 && " \u00b7 "}
                                {s.url ? (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel={externalRel(s.url)}
                                    className="partner-source-link"
                                  >
                                    {s.label}
                                  </a>
                                ) : (
                                  s.label
                                )}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
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
