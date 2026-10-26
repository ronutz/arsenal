// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/changelog/[month]/page.tsx
// ----------------------------------------------------------------------------
// ONE MONTH OF THE CHANGELOG, IN FULL (PRIME 2026-10-26: "recent + show older").
//
// /changelog shows only the last RECENT_DAYS days in full; every earlier entry
// is read here, on the page of its month, /changelog/<yyyy-mm>. A page is built
// for EVERY month that has an entry, the current one included, so an address
// given out today keeps working when the month later leaves the recent window.
// Each day carries an id ("day-YYYY-MM-DD") that the main page's month folds
// link to. Same rendering as the main page (ChangelogTimeline): titles in the
// page's language where the entry has one, bodies in English marked lang="en".
//
// Static: the months come from the changelog data at build time; any other
// segment is not generated (dynamicParams = false) and 404s.
// ============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ChangelogTimeline from "@/components/ChangelogTimeline";
import { CHANGELOG } from "@/content/changelog/changelog";
import { routing } from "@/i18n/routing";
import { MONTH_RE, allMonths, formatMonth, formatMonthStart } from "@/lib/changelogView";

// Only the months the data holds are pages; nothing else is rendered on demand.
export const dynamicParams = false;

// Every month with an entry, newest first, computed once per build.
const MONTHS = allMonths(CHANGELOG);

// One page per (locale, month), in every live locale like the main changelog page.
export function generateStaticParams() {
  // The cross product of the live locales and the months.
  return routing.locales.flatMap((locale) => MONTHS.map((m) => ({ locale, month: m.month })));
}

/** The month record for a URL segment, or undefined for anything that is not one. */
function findMonth(month: string) {
  // A segment that is not shaped like a month never matches.
  if (!MONTH_RE.test(month)) return undefined;
  // The month, if the data has entries in it.
  return MONTHS.find((m) => m.month === month);
}

// The month's own title and description, in the page's language.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; month: string }>;
}): Promise<Metadata> {
  // The route parameters.
  const { locale, month } = await params;
  // An unknown month gets no metadata (the page itself 404s).
  if (!findMonth(month)) return {};
  // The changelog's wording in that locale.
  const t = await getTranslations({ locale, namespace: "changelog" });
  // "Changelog: July 2026" ("Changelog: julho de 2026") and one sentence on what the page holds.
  return {
    title: t("monthMetaTitle", { month: formatMonth(month, locale) }),
    description: t("monthMetaDescription", { month: formatMonth(month, locale) }),
  };
}

export default async function ChangelogMonthPage({
  params,
}: {
  params: Promise<{ locale: string; month: string }>;
}) {
  // The route parameters, the locale registered for the server components below.
  const { locale, month } = await params;
  setRequestLocale(locale);
  // The month's days, or a 404 for a month with no entries.
  const m = findMonth(month);
  if (!m) notFound();
  // The changelog's wording.
  const t = await getTranslations("changelog");

  // The neighbouring months for the navigation (MONTHS is newest first).
  const i = MONTHS.findIndex((x) => x.month === m.month);
  // The next month later in time, if any.
  const later = i > 0 ? MONTHS[i - 1] : undefined;
  // The next month earlier in time, if any.
  const earlier = i < MONTHS.length - 1 ? MONTHS[i + 1] : undefined;

  return (
    <>
      <Header />

      <main id="main">
        <article>
          {/* Hero: the month and what is on its page. */}
          <section className="colophon-hero">
            <div className="container colophon-container">
              <p className="hero-eyebrow">
                <Link href="/changelog" className="footer-contribute-link">{t("eyebrow")}</Link>
              </p>
              <h1 className="page-hero-title">{formatMonthStart(m.month, locale)}</h1>
              <p className="page-hero-lede">{t("monthLede", { month: formatMonth(m.month, locale), count: m.count })}</p>
            </div>
          </section>

          {/* Every entry of the month, in full; day headings under the <h1> are <h2>. */}
          <section className="section">
            <div className="container colophon-container">
              <ChangelogTimeline days={m.days} locale={locale} dayLevel={2} />
            </div>
          </section>

          {/* Between months, and back to the recent changes. */}
          <section className="section">
            <div className="container colophon-container">
              <nav className="changelog-actions" aria-label={t("monthNavLabel")}>
                {/* The month after this one, when there is one. */}
                {later && (
                  <Link href={`/changelog/${later.month}`} className="btn btn-secondary">
                    {t("monthLater", { month: formatMonth(later.month, locale) })}
                  </Link>
                )}
                {/* The month before this one, when there is one. */}
                {earlier && (
                  <Link href={`/changelog/${earlier.month}`} className="btn btn-secondary">
                    {t("monthEarlier", { month: formatMonth(earlier.month, locale) })}
                  </Link>
                )}
                {/* The main page with the recent changes. */}
                <Link href="/changelog" className="btn btn-secondary">
                  {t("monthBack")}
                </Link>
              </nav>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
