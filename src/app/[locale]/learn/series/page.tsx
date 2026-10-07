// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/learn/series/page.tsx
// ----------------------------------------------------------------------------
// THE LEARN SERIES INDEX (milestone LS-0 of the student level-up, 2026-10-06;
// grouped by subject in LS-1a the same day, when the sweep took it from one
// series to forty; in two halves in LS-1b, when the vendor families joined).
//
// Every series in the registry (src/content/learn/series.ts), under the group
// it names (SERIES_GROUPS, in that order). The groups fall in two halves: the
// subjects first, then the vendors whose platforms have series of their own
// (SERIES_VENDOR_GROUPS), each half with its heading and one sentence on what it
// holds, and its row of chips at the top that jump to its groups. Each series:
// its name and lede, how many of its parts are written and how many are still
// to come, the way in (its opener), and its parts in order behind the browser's
// own disclosure, written ones linked, planned ones named. Each series carries
// its id as an anchor, so an article's rail can link "all the series" straight
// to the one it belongs to. Server-rendered for every locale; titles from the
// articles' frontmatter in the page's language. No script.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ogImages } from "@/lib/og";
import { getArticle } from "@/lib/learn";
import { LEARN_SERIES, SERIES_GROUPS, SERIES_VENDOR_GROUPS, seriesArticles } from "@/content/learn/series";

/** The index's title and description, from the namespace. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learnSeries" });
  return { title: t("indexTitle"), description: t("indexLede"), ...ogImages("page", "learn", locale, t("indexTitle")) };
}

export default async function LearnSeriesIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("learnSeries");
  const tNav = await getTranslations("nav");

  // Each series with its parts resolved in this locale.
  const series = LEARN_SERIES.map((s) => {
    const opener = getArticle(s.opener, locale);
    const parts = s.parts.map((p, i) =>
      "slug" in p
        ? { n: i + 1, title: getArticle(p.slug, locale)?.title ?? p.slug, href: `/learn/${p.slug}` }
        : { n: i + 1, title: t(`items.${s.id}.planned.${p.planned}`), href: null as string | null },
    );
    return {
      id: s.id,
      group: s.group,
      title: t(`items.${s.id}.title`),
      lede: t(`items.${s.id}.lede`),
      opener: opener ? { title: opener.title, href: `/learn/${s.opener}` } : null,
      parts,
      written: parts.filter((p) => p.href).length,
    };
  });
  // The groups in the registry's order, each with its series; a group with none is left out.
  const groups = SERIES_GROUPS.map((g) => ({ g, label: t(`groups.${g}`), items: series.filter((s) => s.group === g) })).filter(
    (x) => x.items.length > 0,
  );
  // The two halves: the subjects, then the vendors; a half with no group is left out.
  const vendor = (g: string) => (SERIES_VENDOR_GROUPS as readonly string[]).includes(g);
  const halves = [
    { key: "subjects", title: t("bySubject"), lede: t("bySubjectLede"), groups: groups.filter((x) => !vendor(x.g)) },
    { key: "vendors", title: t("byVendor"), lede: t("byVendorLede"), groups: groups.filter((x) => vendor(x.g)) },
  ].filter((h) => h.groups.length > 0);
  // How many subjects and vendors the numbers line names.
  const subjects = groups.filter((x) => !vendor(x.g)).length;
  const vendors = groups.length - subjects;
  // The distinct written articles across every series (an article in two series counts once).
  const articles = new Set(LEARN_SERIES.flatMap((s) => seriesArticles(s))).size;

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[{ label: tNav("home"), href: "/" }, { label: tNav("learn"), href: "/learn" }, { label: t("indexTitle") }]}
            />
            <h1 className="page-hero-title">{t("indexTitle")}</h1>
            <p className="page-hero-lede">{t("indexLede")}</p>
            <p className="series-index-stats mono">{t("indexStats", { series: series.length, subjects, vendors, articles })}</p>
            {/* One row of chips per half, named, each chip jumping to its group's section. */}
            {halves.map((h) => (
              <div key={h.key} className="series-index-jump">
                <span className="series-index-jump-label mono">{h.title}</span>
                <ul className="series-index-groups">
                  {h.groups.map(({ g, label, items }) => (
                    <li key={g}>
                      <a href={`#group-${g}`}>
                        {label} <span className="mono">{items.length}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {/* The halves: a heading and a sentence, then each group with its heading and its cards. */}
            {halves.map((h) => (
              <section key={h.key} id={`half-${h.key}`} className="series-part" aria-labelledby={`half-${h.key}-title`}>
                <h2 id={`half-${h.key}-title`} className="series-part-title">
                  {h.title}
                </h2>
                <p className="series-part-lede">{h.lede}</p>
                {h.groups.map(({ g, label, items }) => (
                  <section key={g} id={`group-${g}`} className="series-group" aria-labelledby={`group-${g}-title`}>
                    <h3 id={`group-${g}-title`} className="series-group-title">
                      {label} <span className="series-group-count mono">{t("groupCount", { count: items.length })}</span>
                    </h3>
                    <ul className="series-index">
                      {items.map((s) => (
                        <li key={s.id} id={s.id} className="series-card">
                          <h4 className="series-card-title">{s.title}</h4>
                          <p className="series-card-lede">{s.lede}</p>
                          <p className="series-card-count mono">{t("count", { written: s.written, total: s.parts.length })}</p>
                          {s.opener && (
                            <p className="series-card-opener">
                              <Link href={s.opener.href} className="series-card-start">
                                <span className="series-card-start-label">{t("startHere")}</span>
                                <span className="series-card-start-title">{s.opener.title}</span>
                              </Link>
                            </p>
                          )}
                          {/* The parts, in order, behind the browser's own disclosure. */}
                          <details className="series-card-parts">
                            <summary className="series-card-parts-summary">{t("parts")}</summary>
                            <ol className="series-rail-list series-card-list">
                              {s.parts.map((p) => (
                                <li key={p.n} className={`series-rail-item${p.href ? "" : " is-planned"}`}>
                                  <span className="series-rail-n mono">{p.n}</span>{" "}
                                  {p.href ? <Link href={p.href}>{p.title}</Link> : <span>{p.title}</span>}
                                  {!p.href && <span className="series-rail-planned"> · {t("planned")}</span>}
                                </li>
                              ))}
                            </ol>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </section>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
