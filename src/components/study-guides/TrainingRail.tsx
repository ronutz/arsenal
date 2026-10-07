// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/study-guides/TrainingRail.tsx
// ----------------------------------------------------------------------------
// THE TRAINING SERIES AROUND A LEARN ARTICLE (row 58, PRIME 2026-10-07 06:52:
// "Start the series" led to "a text-dense page, and that's it. There's no flow,
// nothing indicating in the target page that it is part of a series, and there
// is no navigation pertaining to the series."). Two placements, one component:
//   - "top", under the article's summary: the series' badge and level, "Module 1
//     of 4, <title> · part 1 of 7", a bar of how far into the series' written
//     parts this one is, the way to the series page and to the next part, and
//     the module's parts behind the browser's own disclosure;
//   - "bottom", right after the article's body and before anything that leads
//     elsewhere: the next part as the main button (planned parts skipped), the
//     end of a module announced with the next module named and the module's
//     tools to practise on, the end of the series with the next level, and the
//     previous part and the series page.
// Server component, no script: titles from the articles' frontmatter in the
// page's locale, words from studyGuidesIndex.training. An article in no
// training series renders nothing.
// ============================================================================

import type { CSSProperties, ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getArticle } from "@/lib/learn";
import { categoryColor } from "@/config/categoryColors";
import { tools as toolRegistry } from "@/config/tools";
import { trainingPlaces, nextLevel, type TrainingPlace } from "@/lib/trainingPlaces";

export default async function TrainingRail({ slug, locale, placement }: {
  /** The article on the page. */
  slug: string;
  /** The page's locale (titles and words in its language). */
  locale: string;
  /** Under the summary, or right after the body. */
  placement: "top" | "bottom";
}) {
  // One block per training series that lists the article; none, nothing.
  const places = trainingPlaces(slug);
  if (!places.length) return null;
  return (
    <>
      {places.map((place) => (
        <TrainingBlock key={place.series.id} slug={slug} locale={locale} placement={placement} place={place} />
      ))}
    </>
  );
}

/** One series' block, at the top or at the bottom of the article. */
async function TrainingBlock({ slug, locale, placement, place }: { slug: string; locale: string; placement: "top" | "bottom"; place: TrainingPlace }) {
  const t = await getTranslations({ locale, namespace: "studyGuidesIndex" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const { series } = place;
  // The series' words and its accent, the module the article is in, and where the series page is.
  const key = `training.items.${series.id}`;
  const short = t(`${key}.short`);
  const mod = series.modules[place.module];
  const moduleTitle = t(`${key}.modules.${mod.id}.title`);
  const seriesHref = `/study-guides/${series.id}`;
  const style = { "--note-accent": categoryColor(series.category) } as CSSProperties;
  // An article's title in this locale, its address when the frontmatter is missing.
  const titleOf = (s: string) => getArticle(s, locale)?.title ?? s;
  // Bold text inside a rich message.
  const strong = (c: ReactNode) => <strong>{c}</strong>;

  if (placement === "top") {
    // The module's parts: written ones linked, the current one marked, planned ones named.
    const parts = mod.parts.map((p, i) =>
      "slug" in p
        ? { n: i + 1, title: titleOf(p.slug), href: `/learn/${p.slug}` as string | null, current: p.slug === slug }
        : { n: i + 1, title: t(`${key}.planned.${p.planned}`), href: null, current: false },
    );
    return (
      <nav className="training-rail" style={style} aria-label={t("training.rail.label", { series: short })}>
        {/* Where the article sits: the series, its level, the module and the part. */}
        <p className="training-rail-where">
          <span className="training-rail-badge mono">
            {short} · {t("training.level", { level: series.level })}
          </span>{" "}
          {t.rich("training.rail.position", { module: place.module + 1, modules: place.modules, title: moduleTitle, part: place.part, parts: place.moduleParts, strong })}
        </p>
        {/* How far into the series' written parts this one is. */}
        <div className="training-rail-progress" role="img" aria-label={t("training.rail.progress", { n: place.index, total: place.total })}>
          <span className="training-rail-progress-fill" style={{ width: `${(place.index / place.total) * 100}%` }} />
        </div>
        {/* The series page, and the next part. */}
        <p className="training-rail-links">
          <Link href={seriesHref} className="training-rail-map">
            {t("training.rail.map")}
          </Link>
          {place.next && (
            <>
              {" · "}
              <Link href={`/learn/${place.next.slug}`} className="training-rail-next">
                {t("training.rail.next", { title: titleOf(place.next.slug) })} &rarr;
              </Link>
            </>
          )}
        </p>
        {/* The module's parts, behind the browser's own disclosure. */}
        <details className="training-rail-parts">
          <summary className="training-rail-parts-summary">{t("training.rail.parts", { n: place.module + 1 })}</summary>
          <ol className="series-rail-list">
            {parts.map((e) => (
              <li key={e.n} className={`series-rail-item${e.current ? " is-current" : ""}${e.href ? "" : " is-planned"}`}>
                <span className="series-rail-n mono">{e.n}</span>{" "}
                {e.href && !e.current ? <Link href={e.href}>{e.title}</Link> : <span aria-current={e.current ? "page" : undefined}>{e.title}</span>}
                {!e.href && <span className="series-rail-planned"> · {t("training.planned")}</span>}
              </li>
            ))}
          </ol>
        </details>
      </nav>
    );
  }

  // The bottom: what comes next, first.
  const next = place.next;
  // The module ends here when the next written part is in another module, or there is none.
  const moduleEnds = !next || next.module !== place.module;
  const nextModule = next && next.module !== place.module ? series.modules[next.module] : null;
  // At the end of a module, its tools to practise on (the registry's live tools only).
  const tools = moduleEnds
    ? mod.tools
        .map((id) => toolRegistry.find((tl) => tl.id === id))
        .filter((tl): tl is NonNullable<typeof tl> => Boolean(tl))
        .map((tl) => ({ id: tl.id, href: tl.href, name: tTools(`${tl.id}.name`) }))
    : [];
  // At the end of the series, the series that follows it.
  const following = next ? null : nextLevel(series);
  return (
    <nav className="training-next" style={style} aria-label={t("training.next.label", { series: short })}>
      <p className="training-next-kicker mono">
        {short} · {t("training.module", { n: place.module + 1 })} · {t("training.rail.partOf", { part: place.part, parts: place.moduleParts })}
      </p>
      {/* The end of a module, announced, with the next module named. */}
      {nextModule && next && (
        <p className="training-next-module">
          {t.rich("training.next.moduleDone", { n: place.module + 1, next: next.module + 1, title: t(`${key}.modules.${nextModule.id}.title`), strong })}
        </p>
      )}
      {/* The module's tools, at its end. */}
      {tools.length > 0 && (
        <p className="training-next-tools">
          <strong>{t("training.next.practise")}</strong>{" "}
          {tools.map((tl, i) => (
            <span key={tl.id}>
              {i > 0 && " · "}
              <Link href={tl.href} className="certguide-resource-link">
                {tl.name}
              </Link>
            </span>
          ))}
        </p>
      )}
      {/* The main way on: the next part; at the end of the series, the next level. */}
      {next ? (
        <Link href={`/learn/${next.slug}`} className="training-next-main">
          <span className="training-next-dir">{t("training.next.next", { module: next.module + 1, part: next.part })}</span>
          <span className="training-next-title">{titleOf(next.slug)}</span>
        </Link>
      ) : (
        <p className="training-next-end">
          {t("training.next.seriesEnd", { series: short })}
          {following && (
            <>
              {" "}
              {t.rich("training.next.nextLevel", {
                series: t(`training.items.${following.id}.short`),
                link: (c) => <Link href={`/study-guides/${following.id}`}>{c}</Link>,
              })}
            </>
          )}
        </p>
      )}
      {/* The way back: the previous part, and the series page. */}
      <p className="training-next-row">
        {place.prev && (
          <Link href={`/learn/${place.prev.slug}`} className="training-next-prev">
            &larr; {t("training.next.previous", { title: titleOf(place.prev.slug) })}
          </Link>
        )}
        <Link href={seriesHref} className="training-next-map">
          {t("training.rail.map")}
        </Link>
      </p>
    </nav>
  );
}
