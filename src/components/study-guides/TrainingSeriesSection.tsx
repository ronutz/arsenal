// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/study-guides/TrainingSeriesSection.tsx
// ----------------------------------------------------------------------------
// THE TRAINING SERIES on /study-guides (milestone NF-1 of the student level-up,
// 2026-10-06; PLAN-nf1-netfun-i-20261006). Rendered first on the page: a
// student arrives for this.
//
// GROUPED AND COLLAPSIBLE since row 61 (PRIME 2026-10-07 08:41: "as we expect to
// have many, please allow collapsing of individual items (NetFun I, NetFun I[I])
// and of the sections (NetFun, SecFun, ...)"):
//   - one disclosure per curriculum (TRAINING_CURRICULA: NetFun, SecFun,
//     SRE-Fun, AppFun, DevFun), open by default, shown only once a series of it
//     exists;
//   - inside it, one card per series (src/content/study-guides/training-series.ts)
//     whose head always shows: the short name as a badge with the level, the
//     title (a link to the series' own page, row 58), the size, and "Start the
//     series" (the series' page, which starts the series and opens its first
//     part). The rest, the lede, what a student will be able to do at the end,
//     the prerequisites and the modules in order (each outcome, the parts behind
//     their own disclosure, the tools or why none fits yet), sits behind the
//     card's disclosure, closed by default;
//   - Expand all and Collapse all over the whole section, the reading paths'
//     buttons (DetailsToggleAll, a small client island).
// Server-rendered: every word stays in the document, crawlable and findable,
// whether a disclosure is open or not, and the disclosures work without script.
// ============================================================================

import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getArticle } from "@/lib/learn";
import { categoryColor } from "@/config/categoryColors";
import { tools as toolRegistry } from "@/config/tools";
import { TRAINING_SERIES, TRAINING_CURRICULA, trainingArticles } from "@/content/study-guides/training-series";
import DetailsToggleAll from "@/components/DetailsToggleAll";

export default async function TrainingSeriesSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "studyGuidesIndex" });
  const tTools = await getTranslations({ locale, namespace: "tools" });

  // Each series with its parts resolved in this locale: titles from the articles' frontmatter, planned names from the packs.
  const series = TRAINING_SERIES.map((s) => {
    const key = `training.items.${s.id}`;
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
        .map((id) => toolRegistry.find((tl) => tl.id === id))
        .filter((tl): tl is NonNullable<typeof tl> => Boolean(tl))
        .map((tl) => ({ id: tl.id, href: tl.href, name: tTools(`${tl.id}.name`) })),
    }));
    const written = trainingArticles(s);
    const planned = s.modules.reduce((n, m) => n + m.parts.filter((p) => "planned" in p).length, 0);
    return {
      id: s.id,
      curriculum: s.curriculum,
      color: categoryColor(s.category),
      short: t(`${key}.short`),
      level: s.level,
      title: t(`${key}.title`),
      lede: t(`${key}.lede`),
      outcome: t(`${key}.outcome`),
      // Prerequisites by their short names, in the order the registry lists them.
      prerequisites: s.prerequisites.map((id) => t(`training.items.${id}.short`)),
      modules,
      written: written.length,
      planned,
      first: written[0] ?? null,
    };
  });
  // The curricula that have a series, in the curriculum plan's order, each with its series in the registry's order.
  const curricula = TRAINING_CURRICULA.map((c) => ({
    id: c,
    name: t(`training.curricula.${c}.name`),
    title: t(`training.curricula.${c}.title`),
    series: series.filter((s) => s.curriculum === c),
  })).filter((c) => c.series.length > 0);

  return (
    <section className="section" id="training-series">
      <div className="container certs-container">
        <div className="certs-group-head">
          <h2 className="certs-group-title">{t("training.title")}</h2>
        </div>
        <p className="certs-group-intro">{t("training.lede")}</p>
        {/* Expand all, collapse all: every curriculum and every card of the section. */}
        <DetailsToggleAll containerId="training-series" expandLabel={t("expandAll")} collapseLabel={t("collapseAll")} />
        {curricula.map((c) => (
          <details key={c.id} id={`curriculum-${c.id}`} className="training-curriculum" open>
            <summary className="training-curriculum-summary">
              <span className="training-curriculum-name mono">{c.name}</span>{" "}
              <span className="training-curriculum-title">{c.title}</span>{" "}
              <span className="training-curriculum-count mono">{t("training.curriculumCount", { count: c.series.length })}</span>
            </summary>
            <ul className="training-series-list">
              {c.series.map((s) => (
                <li key={s.id} id={s.id} className="training-card" style={{ "--note-accent": s.color } as CSSProperties}>
                  {/* The head, always shown: the badge, the title, the size, the way in. */}
                  <p className="training-badge mono">
                    <span className="training-badge-name">{s.short}</span>
                    <span className="training-badge-level">{t("training.level", { level: s.level })}</span>
                  </p>
                  <h3 className="training-card-title">
                    <Link href={`/study-guides/${s.id}`}>{s.title}</Link>
                  </h3>
                  <p className="training-card-meta mono">
                    {t("training.counts", { modules: s.modules.length, written: s.written })}
                    {s.planned > 0 && <> · {t("training.plannedCount", { count: s.planned })}</>}
                  </p>
                  {s.first && (
                    <p className="training-start">
                      <Link href={`/study-guides/${s.id}`} className="training-start-link">
                        {t("training.start")} &#8594;
                      </Link>
                    </p>
                  )}
                  {/* The rest, behind the card's own disclosure: the lede, the outcome, the prerequisites, the modules. */}
                  <details className="training-card-more">
                    <summary className="training-card-more-summary">{t("training.more")}</summary>
                    <p className="training-card-lede">{s.lede}</p>
                    <p className="training-outcome">
                      <strong>{t("training.outcomeLabel")}</strong> {s.outcome}
                    </p>
                    <p className="training-card-meta">
                      {s.prerequisites.length ? t("training.prerequisites", { list: s.prerequisites.join(", ") }) : t("training.noPrerequisites")}
                    </p>
                    {/* The modules, in order: each outcome, its parts behind the disclosure, its tools after them. */}
                    <ol className="training-modules">
                      {s.modules.map((m) => (
                        <li key={m.id} className="training-module">
                          <h4 className="training-module-title">
                            <span className="training-module-n mono">{t("training.module", { n: m.n })}</span> {m.title}{" "}
                            <span className="training-module-count mono">{t("training.moduleCount", { count: m.parts.length })}</span>
                          </h4>
                          <p className="training-module-outcome">{m.outcome}</p>
                          <details className="training-module-parts">
                            <summary className="training-module-parts-summary">{t("training.parts")}</summary>
                            <ol className="series-rail-list training-module-list">
                              {m.parts.map((p) => (
                                <li key={p.n} className={`series-rail-item${p.href ? "" : " is-planned"}`}>
                                  <span className="series-rail-n mono">{p.n}</span>{" "}
                                  {p.href ? <Link href={p.href}>{p.title}</Link> : <span>{p.title}</span>}
                                  {!p.href && <span className="series-rail-planned"> · {t("training.planned")}</span>}
                                </li>
                              ))}
                            </ol>
                          </details>
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
                  </details>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
