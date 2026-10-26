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
//
// RECENT + SHOW OLDER (PRIME 2026-10-26). The page used to render every entry
// since the site began (pt-BR 3,004,130 bytes on 2026-10-26). It now shows the
// last RECENT_DAYS days in full, or the newest RECENT_MAX_ENTRIES entries when
// the window holds more (whichever is fewer; the page says which, how many and
// since when), counted back from the BUILD day (todayIso(),
// the same day the retirement notices use, never the reader's clock), and
// below them one closed <details> per earlier month: the month and its entry
// count in the <summary>, its days inside (each a link to that day on the
// month page) and a link to the month page, /changelog/<yyyy-mm>, where every
// entry of the month is read in full. <details> works without JavaScript; the
// weight comes off because the older entries' text is no longer on this page
// at all (a closed <details> is still downloaded). See src/lib/changelogView.ts.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ChangelogTimeline from "@/components/ChangelogTimeline";
import { CHANGELOG } from "@/content/changelog/changelog";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { RECENT_DAYS, RECENT_MAX_ENTRIES, dayAnchor, formatDay, formatMonth, formatMonthStart, splitRecent } from "@/lib/changelogView";

// Localized <title>. (The description stays English: it is a meta tag, not
// visible page copy.) Meta description translated per the 2026-07-03 full i18n pass.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The route's locale.
  const { locale } = await params;
  // The changelog's wording in that locale.
  const t = await getTranslations({ locale, namespace: "changelog" });
  // Title and description.
  return {
    title: t("eyebrow"),
    description: t("metaDescription"),
  };
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  // The route's locale, registered for the server components below.
  const { locale } = await params;
  setRequestLocale(locale);
  // The changelog's wording.
  const t = await getTranslations("changelog");
  // The navigation's wording, for the "Colophon" button.
  const tNav = await getTranslations("nav");
  // The category pages' wording, for the "All tools" button (in all 16 packs).
  const tCat = await getTranslations("category");

  // The live tool count for the lede.
  const toolCount = CATALOGUE.filter((x) => x.status === "live").length;

  // The split on the build day: the recent entries in full, the rest as months, and what to say about it.
  const { recent, shown, since, capped, older } = splitRecent(CHANGELOG);

  return (
    <>
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

          {/* The recent days, every entry in full. */}
          <section className="section" aria-labelledby="changelog-recent">
            <div className="container colophon-container">
              {/* "The last 30 days", or "The newest 150 entries" when the cap decided where the page stops. */}
              <h2 className="section-title" id="changelog-recent">
                {capped ? t("recentHeadingCapped", { max: RECENT_MAX_ENTRIES }) : t("recentHeading", { days: RECENT_DAYS })}
              </h2>
              {recent.length > 0 && since ? (
                <>
                  {/* How many entries are shown, since which day, and the rule that chose them. */}
                  <p className="page-hero-lede">
                    {t("recentScope", { count: shown, since: formatDay(since, locale), days: RECENT_DAYS, max: RECENT_MAX_ENTRIES })}
                  </p>
                  {/* Day headings sit under this section's <h2>, so they are <h3>. */}
                  <ChangelogTimeline days={recent} locale={locale} dayLevel={3} />
                </>
              ) : (
                // A quiet month: say so, and point at the months below.
                <p className="page-hero-lede">{t("recentEmpty", { days: RECENT_DAYS })}</p>
              )}
            </div>
          </section>

          {/* The earlier months, one closed fold each; their entries are read on the month pages. */}
          {older.length > 0 && (
            <section className="section" aria-labelledby="changelog-older">
              <div className="container colophon-container">
                <h2 className="section-title" id="changelog-older">{t("olderHeading")}</h2>
                <p className="page-hero-lede">{t("olderNote")}</p>
                {/* The disclosure idiom of the Practice index (practice-part-*), reused: closed by default, no script. */}
                <nav className="practice-part-nav" aria-labelledby="changelog-older">
                  {older.map((m) => (
                    <details className="practice-part-details" key={m.month}>
                      {/* The month and how many of its entries this fold covers. */}
                      <summary className="practice-part-summary">
                        <span className="practice-part-card-title">{formatMonthStart(m.month, locale)}</span>
                        <span className="practice-part-card-count mono">{t("entryCount", { count: m.count })}</span>
                      </summary>
                      {/* The month page, where every entry of the month is read in full. */}
                      <p className="practice-part-card-note">
                        <Link href={`/changelog/${m.month}`}>{t("monthOpen", { month: formatMonth(m.month, locale) })}</Link>
                      </p>
                      {/* Each day, a link to that day on the month page, with its entry count. */}
                      <ol className="practice-part-list">
                        {m.days.map((d) => (
                          <li key={d.day}>
                            <Link href={`/changelog/${m.month}#${dayAnchor(d.day)}`}>
                              <time dateTime={d.day}>{formatDay(d.day, locale)}</time>
                            </Link>{" "}
                            <span className="practice-part-card-count mono">{t("entryCount", { count: d.entries.length })}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  ))}
                </nav>
              </div>
            </section>
          )}

          {/* Closing */}
          <section className="section">
            <div className="container colophon-container">
              <div className="changelog-actions">
                {/* Labels from the packs (they were hard-coded English): the nav's "Colophon" and the tools' "All tools". */}
                <Link href="/colophon" className="btn btn-secondary">
                  {tNav("colophon")} →
                </Link>
                <Link href="/tools" className="btn btn-secondary">
                  {tCat("backToTools")} →
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
