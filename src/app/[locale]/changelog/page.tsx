// ============================================================================
// src/app/[locale]/changelog/page.tsx
// ----------------------------------------------------------------------------
// CHANGELOG - a dated record of major changes to the site: new tools, new Learn
// articles, and significant features. Linked from the colophon.
//
// LOCALIZED like every other page: the chrome (eyebrow, title, lede, kind
// labels, and dates) comes from the i18n system and the page renders at all
// locale paths. The ENTRY prose lives in the changelog data module and is
// English-fallback (same treatment as the Learn articles, D-57) until the
// post-queue translation campaign - so machine-draft locales show it under the
// standard machine-translation banner rather than us hand-maintaining 55+
// growing dev-log entries across every language.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { CHANGELOG, type ChangelogEntry, type ChangelogKind } from "@/content/changelog/changelog";
import { CATALOGUE } from "@/content/catalogue/catalogue";

// Localized <title>. (The description stays English: it is a meta tag, not
// visible page copy.) Meta description translated per the 2026-07-03 full i18n pass.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog" });
  return {
    title: t("eyebrow"),
    description: t("metaDescription"),
  };
}

// Format an ISO date in the ACTIVE locale - month name, day/month ordering, and
// separators all localize via Intl. We build a LOCAL date (not UTC) so the
// displayed day never slips by one across timezones.
function formatDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

// slug -> display name, for linking tools referenced by an entry.
const TOOL_NAME = new Map(CATALOGUE.map((t) => [t.slug, t.name]));

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");
  const t = await getTranslations("changelog");

  // Kind badge labels, localized (the kinds themselves are a fixed enum).
  const kindLabel: Record<ChangelogKind, string> = {
    launch: t("kindLaunch"),
    tool: t("kindTool"),
    feature: t("kindFeature"),
    i18n: t("kindI18n"),
    content: t("kindContent"),
    infra: t("kindInfra"),
  };

  // Sort newest-first by date then time, then group by date.
  const sorted = [...CHANGELOG].sort((a, b) => (b.date + (b.time ?? "")).localeCompare(a.date + (a.time ?? "")));
  const groups: { date: string; entries: ChangelogEntry[] }[] = [];
  for (const e of sorted) {
    let g = groups.find((x) => x.date === e.date);
    if (!g) {
      g = { date: e.date, entries: [] };
      groups.push(g);
    }
    g.entries.push(e);
  }

  const toolCount = CATALOGUE.filter((t) => t.status === "live").length;

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="colophon-hero">
            <div className="container colophon-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede", { count: toolCount })}</p>
              {/* Where things are GOING lives on the roadmap; this page is
                  where they LANDED. One line up front makes the split clear. */}
              <p className="page-hero-lede changelog-roadmap-note">
                {t.rich("roadmapNote", {
                  roadmap: (chunks) => (
                    <Link href="/roadmap" className="footer-contribute-link">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </section>

          {/* Timeline */}
          <section className="section">
            <div className="container colophon-container">
              <ol className="changelog-timeline">
                {groups.map((g) => (
                  <li className="changelog-day" key={g.date}>
                    <h2 className="changelog-date">
                      <time dateTime={g.date}>{formatDate(g.date, locale)}</time>
                    </h2>
                    <ul className="changelog-entries">
                      {g.entries.map((e, i) => (
                        <li className="changelog-entry" key={`${g.date}-${i}`}>
                          <div className="changelog-entry-head">
                            <span className={`changelog-badge changelog-badge--${e.kind}`}>{kindLabel[e.kind]}</span>
                            <h3 className="changelog-entry-title">{e.title}</h3>
                          </div>
                          <p className="changelog-entry-body">{e.body}</p>
                          {e.tools && e.tools.length > 0 && (
                            <p className="changelog-entry-tools">
                              {e.tools.map((slug, j) => (
                                <span key={slug}>
                                  {j > 0 && <span className="changelog-tool-sep"> · </span>}
                                  <Link href={`/tools/${slug}`} className="changelog-tool-link">
                                    {TOOL_NAME.get(slug) ?? slug}
                                  </Link>
                                </span>
                              ))}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Closing */}
          <section className="section">
            <div className="container colophon-container">
              <div className="changelog-actions">
                <Link href="/colophon" className="btn btn-secondary">
                  Colophon →
                </Link>
                <Link href="/tools" className="btn btn-secondary">
                  All tools →
                </Link>
              </div>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
