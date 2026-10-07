// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/SeriesRail.tsx
// ----------------------------------------------------------------------------
// THE SERIES RAIL ON A LEARN ARTICLE (milestone LS-0, 2026-10-06; the series
// standard of PROGRAMME-student-levelup-learn-series-and-study-guides-20261006).
//
// Two placements, one component:
//   - "top", under the article's summary: where this article sits ("Part 3 of
//     11 in <series>", or "Opens the series <series>"), and the series'
//     contents behind a native disclosure (<details>), every part numbered,
//     the written ones linked, the planned ones named and marked "In
//     preparation", the current one marked;
//   - "bottom", after the body: the previous and the next WRITTEN article in the
//     series (a planned part is skipped, never linked), and the way back to the
//     opener and to all the series.
// An article in more than one series gets one block per series, its own series
// (the one it opens) first. Server component: the titles come from the
// articles' frontmatter in the page's locale, the series' words from the
// "learnSeries" namespace. No script: the disclosure is the browser's own.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getArticle } from "@/lib/learn";
import { seriesPlaces, type SeriesPlace } from "@/content/learn/series";

export default async function SeriesRail({ slug, locale, placement }: {
  /** The article on the page. */
  slug: string;
  /** The page's locale (titles in its language). */
  locale: string;
  /** Under the summary, or after the body. */
  placement: "top" | "bottom";
}) {
  // One block per series the article opens or belongs to.
  const places = seriesPlaces(slug);
  if (!places.length) return null;
  // Each block is an async server component of its own, keyed by its series.
  return (
    <>
      {places.map((place) => (
        <RailBlock key={place.series.id} slug={slug} locale={locale} placement={placement} place={place} />
      ))}
    </>
  );
}

/** One series' block of the rail, at the top or at the bottom of the article. */
async function RailBlock({ slug, locale, placement, place }: { slug: string; locale: string; placement: "top" | "bottom"; place: SeriesPlace }) {
  const { series, position } = place;
  const t = await getTranslations({ locale, namespace: "learnSeries" });
  const name = t(`items.${series.id}.title`);
  const total = series.parts.length;
  // Every entry of the contents: its number, its title, its link when it is written, and whether it is this article.
  const entries = series.parts.map((p, i) => {
    if ("slug" in p) {
      const a = getArticle(p.slug, locale);
      return { n: i + 1, title: a?.title ?? p.slug, href: `/learn/${p.slug}`, current: p.slug === slug };
    }
    return { n: i + 1, title: t(`items.${series.id}.planned.${p.planned}`), href: null as string | null, current: false };
  });
  const opener = getArticle(series.opener, locale);
  // The written articles in reading order (the opener first), and the one after this article: the top shows it too,
  // so an opener reached by "Start here" leads on at once (row 58, 2026-10-07), not only at the end of the page.
  const writtenTop = [{ slug: series.opener, n: 0 }, ...series.parts.flatMap((p, i) => ("slug" in p ? [{ slug: p.slug, n: i + 1 }] : []))];
  const hereTop = writtenTop.findIndex((w) => w.slug === slug);
  const nextTop = hereTop >= 0 && hereTop < writtenTop.length - 1 ? writtenTop[hereTop + 1] : null;

  if (placement === "top") {
    return (
      <nav key={series.id} className="series-rail" aria-label={t("railLabel", { series: name })}>
        <p className="series-rail-where">
          <span className="series-rail-kicker mono">{t("kicker")}</span>{" "}
          {position === 0 ? (
            t.rich("opens", { series: name, strong: (c) => <strong>{c}</strong> })
          ) : (
            <>
              {t.rich("partOf", { n: position, total, series: name, strong: (c) => <strong>{c}</strong> })}{" "}
              {opener && (
                <Link href={`/learn/${series.opener}`} className="series-rail-opener">
                  {t("toOpener")}
                </Link>
              )}
            </>
          )}
        </p>
        {nextTop && (
          <p className="series-rail-next">
            <Link href={`/learn/${nextTop.slug}`}>
              {t("topNext", { n: nextTop.n, title: getArticle(nextTop.slug, locale)?.title ?? nextTop.slug })} &rarr;
            </Link>
          </p>
        )}
        <details className="series-rail-contents">
          <summary className="series-rail-summary">{t("contents", { total })}</summary>
          <ol className="series-rail-list">
            {entries.map((e) => (
              <li key={e.n} className={`series-rail-item${e.current ? " is-current" : ""}${e.href ? "" : " is-planned"}`}>
                <span className="series-rail-n mono">{e.n}</span>{" "}
                {e.href && !e.current ? (
                  <Link href={e.href}>{e.title}</Link>
                ) : (
                  <span aria-current={e.current ? "page" : undefined}>{e.title}</span>
                )}
                {!e.href && <span className="series-rail-planned"> · {t("planned")}</span>}
              </li>
            ))}
          </ol>
        </details>
      </nav>
    );
  }

  // The bottom: the neighbouring WRITTEN articles (the opener counts as the start of the series).
  const written = [{ slug: series.opener, n: 0 }, ...series.parts.flatMap((p, i) => ("slug" in p ? [{ slug: p.slug, n: i + 1 }] : []))];
  const here = written.findIndex((w) => w.slug === slug);
  const prev = here > 0 ? written[here - 1] : null;
  const next = here >= 0 && here < written.length - 1 ? written[here + 1] : null;
  const titleOf = (s: string) => getArticle(s, locale)?.title ?? s;
  return (
    <nav key={series.id} className="series-next" aria-label={t("railLabel", { series: name })}>
      <p className="series-next-kicker mono">{name}</p>
      <div className="series-next-row">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="series-next-link series-next-link--prev">
            <span className="series-next-dir">{prev.n === 0 ? t("backToOpener") : t("previous", { n: prev.n })}</span>
            <span className="series-next-title">{titleOf(prev.slug)}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="series-next-link series-next-link--next">
            <span className="series-next-dir">{t("next", { n: next.n })}</span>
            <span className="series-next-title">{titleOf(next.slug)}</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
      <p className="series-next-all">
        <Link href={`/learn/series#${series.id}`}>{t("allSeries")} &rarr;</Link>
      </p>
    </nav>
  );
}
