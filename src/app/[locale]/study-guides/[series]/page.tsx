// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/study-guides/[series]/page.tsx
// ----------------------------------------------------------------------------
// A TRAINING SERIES' OWN PAGE: WHERE "START THE SERIES" LEADS (row 58, PRIME
// 2026-10-07 06:52: "We need to make sure that ALL 'Start the series' are
// INDEED a STRONG start to the series."). Until then the card's link opened the
// series' first article directly, a dense page with nothing about the series
// on it. This page is the start: the series' level, title and lede; what a
// student will be able to do at its end and what to have read before it; how
// the series works; one main button, "Begin: part 1, <title>"; then the whole
// map, module by module, every part listed (written ones linked, planned ones
// named), each module's outcome and tools; and the levels before and after it.
// Every part's article carries the series around it from there (TrainingRail).
// One page per series per locale, generated from the registry; no script.
// ============================================================================

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ogImages } from "@/lib/og";
import { getArticle } from "@/lib/learn";
import { categoryColor } from "@/config/categoryColors";
import { tools as toolRegistry } from "@/config/tools";
import { TRAINING_SERIES } from "@/content/study-guides/training-series";
import { trainingStops, nextLevel, getTrainingSeries } from "@/lib/trainingPlaces";

/** Every training series in every locale. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => TRAINING_SERIES.map((s) => ({ locale, series: s.id })));
}

/** The series' title and lede; the social card is the study guides' own. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; series: string }> }): Promise<Metadata> {
  const { locale, series: id } = await params;
  if (!getTrainingSeries(id)) return {};
  const t = await getTranslations({ locale, namespace: "studyGuidesIndex" });
  const title = t(`training.items.${id}.title`);
  return {
    title: t("training.startPage.metaTitle", { title }),
    description: t(`training.items.${id}.lede`),
    ...ogImages("page", "study-guides", locale, title),
  };
}

export default async function TrainingSeriesPage({ params }: { params: Promise<{ locale: string; series: string }> }) {
  const { locale, series: id } = await params;
  setRequestLocale(locale);
  const s = getTrainingSeries(id);
  if (!s) notFound();
  const t = await getTranslations("studyGuidesIndex");
  const tNav = await getTranslations("nav");
  const tTools = await getTranslations("tools");
  const key = `training.items.${s.id}`;
  const short = t(`${key}.short`);
  const title = t(`${key}.title`);
  // The way in: the series' first written part.
  const stops = trainingStops(s);
  const first = stops[0] ?? null;
  const firstTitle = first ? getArticle(first.slug, locale)?.title ?? first.slug : null;
  const planned = s.modules.reduce((n, m) => n + m.parts.filter((p) => "planned" in p).length, 0);
  // The levels around this one: the prerequisites, and the series that names this one as its prerequisite.
  const before = s.prerequisites.map((p) => ({ id: p, short: t(`training.items.${p}.short`) }));
  const after = nextLevel(s);
  // The modules, every part resolved in this locale.
  const modules = s.modules.map((m, i) => ({
    id: m.id,
    n: i + 1,
    title: t(`${key}.modules.${m.id}.title`),
    outcome: t(`${key}.modules.${m.id}.outcome`),
    parts: m.parts.map((p, j) =>
      "slug" in p
        ? { n: j + 1, title: getArticle(p.slug, locale)?.title ?? p.slug, href: `/learn/${p.slug}` as string | null }
        : { n: j + 1, title: t(`${key}.planned.${p.planned}`), href: null },
    ),
    tools: m.tools
      .map((tid) => toolRegistry.find((tl) => tl.id === tid))
      .filter((tl): tl is NonNullable<typeof tl> => Boolean(tl))
      .map((tl) => ({ id: tl.id, href: tl.href, name: tTools(`${tl.id}.name`) })),
  }));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <section className="section training-start-page" style={{ "--note-accent": categoryColor(s.category) } as CSSProperties}>
          <div className="container certs-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("title"), href: "/study-guides" },
                { label: short },
              ]}
            />
            <p className="hero-eyebrow">{t("training.startPage.eyebrow", { short, level: s.level })}</p>
            <h1 className="page-hero-title">{title}</h1>
            <p className="page-hero-lede">{t(`${key}.lede`)}</p>

            {/* The start: the outcome, what to read first, the size, and the one button that begins. */}
            <div className="training-start-box">
              <p className="training-outcome">
                <strong>{t("training.outcomeLabel")}</strong> {t(`${key}.outcome`)}
              </p>
              <p className="training-card-meta">
                {before.length
                  ? t.rich("training.startPage.before", {
                      series: before.map((b) => b.short).join(", "),
                      link: (c) => <Link href={`/study-guides/${before[0].id}`}>{c}</Link>,
                    })
                  : t("training.noPrerequisites")}
              </p>
              <p className="training-card-meta mono">
                {t("training.counts", { modules: s.modules.length, written: stops.length })}
                {planned > 0 && <> · {t("training.plannedCount", { count: planned })}</>}
              </p>
              {first && firstTitle && (
                <p className="training-start-cta">
                  <Link href={`/learn/${first.slug}`} className="btn btn-primary training-begin">
                    {t("training.startPage.begin", { title: firstTitle })} &#8594;
                  </Link>
                </p>
              )}
            </div>

            {/* How the series works, in four lines. */}
            <h2 className="certs-group-title training-start-h2">{t("training.startPage.howTitle")}</h2>
            <ol className="training-start-how">
              <li>{t("training.startPage.how1")}</li>
              <li>{t("training.startPage.how2")}</li>
              <li>{t("training.startPage.how3")}</li>
              <li>{t("training.startPage.how4")}</li>
            </ol>

            {/* The map: every module, its outcome, every part, its tools. */}
            <h2 className="certs-group-title training-start-h2">{t("training.startPage.mapTitle")}</h2>
            <ol className="training-modules training-start-map">
              {modules.map((m) => (
                <li key={m.id} className="training-module">
                  <h3 className="training-module-title">
                    <span className="training-module-n mono">{t("training.module", { n: m.n })}</span> {m.title}{" "}
                    <span className="training-module-count mono">{t("training.moduleCount", { count: m.parts.length })}</span>
                  </h3>
                  <p className="training-module-outcome">{m.outcome}</p>
                  <ol className="series-rail-list training-module-list">
                    {m.parts.map((p) => (
                      <li key={p.n} className={`series-rail-item${p.href ? "" : " is-planned"}`}>
                        <span className="series-rail-n mono">{p.n}</span>{" "}
                        {p.href ? <Link href={p.href}>{p.title}</Link> : <span>{p.title}</span>}
                        {!p.href && <span className="series-rail-planned"> · {t("training.planned")}</span>}
                      </li>
                    ))}
                  </ol>
                  <p className="training-module-tools">
                    {m.tools.length ? (
                      <>
                        <strong>{t("practiceLabel")}:</strong>{" "}
                        {m.tools.map((tl, i) => (
                          <span key={tl.id}>
                            {i > 0 && " · "}
                            <Link href={tl.href} className="certguide-resource-link">
                              {tl.name}
                            </Link>
                          </span>
                        ))}
                      </>
                    ) : (
                      t("training.toolless")
                    )}
                  </p>
                </li>
              ))}
            </ol>

            {/* The next level, when there is one. */}
            {after && (
              <p className="training-start-after">
                {t.rich("training.startPage.after", {
                  series: t(`training.items.${after.id}.short`),
                  link: (c) => <Link href={`/study-guides/${after.id}`}>{c}</Link>,
                })}
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
