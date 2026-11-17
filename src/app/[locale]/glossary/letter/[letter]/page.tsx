// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/glossary/letter/[letter]/page.tsx
// ----------------------------------------------------------------------------
// ONE PAGE PER LETTER: /glossary/letter/a to /glossary/letter/z, and /glossary/letter/0-9 for the names that start
// with a digit or a symbol (PRIME 16/11/2026 04:27, splitting the glossary page).
//
// The letter is the glossary's complete partition: every entry files under exactly one letter (src/lib/glossaryBrowse
// letterOf), so these pages together hold the whole A to Z that /glossary used to carry on one four-megabyte page,
// each with its own share (7 to 214 entries on this day). A page keeps everything the old list had for its letter:
// the cards with their definitions, the kind and disputed marks, the desk's marks, and the filter by kind, domain and
// text, now narrowing one letter instead of the whole glossary. The A to Z rail leads to every other letter, and the
// foot of the page to every domain and kind.
//
// Generated for every LIVE locale, like the hub, the domain pages and the kind pages: an index page is cheap and its
// navigation must not send a reader into another language. The entries a card opens are the authored-only detail
// pages; the site's Link sends a locale without them to English directly.
// ============================================================================

import { ogImages } from "@/lib/og";
import { withDescription } from "@/lib/metaDescription";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import ScrollToTop from "@/components/ScrollToTop";
// My desk's saved and read labels on the cards.
import DeskListMarks from "@/components/desk/DeskListMarks";
import GlossaryFilter from "@/components/glossary/GlossaryFilter";
// At phone width, the rail's line scrolled to this page's letter.
import GlossaryRailFocus from "@/components/glossary/GlossaryRailFocus";
import { GlossaryLetterRail, GlossaryRows, GlossaryWaysIn } from "@/components/glossary/GlossaryBrowse";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import { getGlossaryDomains, getGlossaryKinds } from "@/content/glossary/glossary";
import { bucketOfSlug, entriesForLetter, getGlossaryLetters, OTHER_BUCKET } from "@/lib/glossaryBrowse";

// Only the letters generated below exist; any other segment is a 404.
export const dynamicParams = false;

/** Every live locale times every letter that has entries. */
export function generateStaticParams() {
  const letters = getGlossaryLetters().filter((l) => l.count > 0); // a letter with no entry gets no page
  return LIVE_LOCALE_CODES.flatMap((locale) => letters.map((l) => ({ locale, letter: l.slug }))); // every pair
}

/**
 * The letter as words: the letter itself, or "numbers and symbols" for the "#" bucket.
 *
 * @param bucket "A" to "Z", or "#"
 * @param t the glossary namespace
 * @returns the label
 */
function letterLabel(bucket: string, t: (key: string) => string): string {
  return bucket === OTHER_BUCKET ? t("browse.otherLetter") : bucket; // the digits' bucket has a name
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; letter: string }> }): Promise<Metadata> {
  const { locale, letter } = await params; // the route
  const bucket = bucketOfSlug(letter); // the letter it names
  if (!bucket) return {}; // not a letter: the page 404s
  const t = await getTranslations({ locale, namespace: "glossary" }); // labels
  const label = letterLabel(bucket, t); // the letter as words
  const title = t("browse.letterPageTitle", { letter: label }); // "Glossary: C"
  const description = t(bucket === OTHER_BUCKET ? "browse.otherPageDescription" : "browse.letterPageDescription", { letter: label, count: entriesForLetter(bucket).length }); // the count and the letter
  // The glossary's social card, with the description in the meta, og and twitter fields.
  return { title, ...withDescription(description, ogImages("page", "glossary", locale, title), `glossary/letter/${letter}`) };
}

export default async function GlossaryLetterPage({ params }: { params: Promise<{ locale: string; letter: string }> }) {
  const { locale, letter } = await params; // the route
  setRequestLocale(locale); // static rendering in this locale
  const bucket = bucketOfSlug(letter); // the letter it names
  if (!bucket) notFound(); // not a letter
  const t = await getTranslations("glossary"); // labels
  const tNav = await getTranslations("nav"); // the breadcrumb's name and Home
  const tDesk = await getTranslations("deskItem"); // the desk's marks

  const entries = entriesForLetter(bucket); // this letter's entries, A to Z
  if (entries.length === 0) notFound(); // never generated, but never rendered empty either
  const label = letterLabel(bucket, t); // the letter as words
  // The domains and kinds present on this page: the filter offers only chips that can match something here.
  const domains = getGlossaryDomains().filter((d) => entries.some((e) => e.domains.includes(d))); // present domains
  const kinds = getGlossaryKinds().filter((k) => entries.some((e) => e.kind === k)); // present kinds
  // The letters before and after, skipping any letter without entries, for the previous and next links.
  const letters = getGlossaryLetters().filter((l) => l.count > 0); // the letters that have pages
  const i = letters.findIndex((l) => l.bucket === bucket); // this one's place
  const prev = letters[i - 1]; // the one before, if any
  const next = letters[i + 1]; // the one after, if any

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs ariaLabel={tNav("breadcrumb")} items={[{ label: tNav("home"), href: "/" }, { label: t("title"), href: "/glossary" }, { label }]} />
            <h1 className="page-hero-title">{t("browse.letterPageTitle", { letter: label })}</h1>
            <p className="page-hero-lede">
              {t(bucket === OTHER_BUCKET ? "browse.otherPageDescription" : "browse.letterPageDescription", { letter: label, count: entries.length })}
            </p>
            {/* The whole A to Z, this letter marked: every other letter is one click away. */}
            <GlossaryLetterRail current={bucket} />
            <GlossaryRailFocus />

            {/* The filter, now over this letter's entries only. */}
            <div id="glossary-filter">
              <GlossaryFilter
                domains={domains.map((d) => ({ key: d, label: t(`domains.${d}`) }))}
                kinds={kinds.map((k) => ({ key: k, label: t(`kinds.${k}`) }))}
                domainLegend={t("filterDomainLegend")}
                kindLegend={t("filterKindLegend")}
                allDomainsLabel={t("allDomains")}
                allKindsLabel={t("allKinds")}
                searchPlaceholder={t("browse.pageSearchPlaceholder")}
                searchAriaLabel={t("browse.pageSearchPlaceholder")}
                clearLabel={t("clearFilters")}
                countTemplate={t("resultsCount", { count: 0 }).replace(/\d+/, "{count}")}
                noResultsLabel={t("noResults")}
              />
            </div>

            {/* The cards: one section, no heading (the page's title is the letter). */}
            <GlossaryRows groups={[[bucket, entries]]} headings={false} />

            {/* The neighbouring letters, in reading order. */}
            <nav className="gloss-letter-pager" aria-label={t("browse.pagerLabel")}>
              {prev ? (
                <Link href={`/glossary/letter/${prev.slug}`} className="gloss-letter-pager-link" rel="prev">
                  {t("browse.prevLetter", { letter: letterLabel(prev.bucket, t) })}
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/glossary/letter/${next.slug}`} className="gloss-letter-pager-link gloss-letter-pager-next" rel="next">
                  {t("browse.nextLetter", { letter: letterLabel(next.bucket, t) })}
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </div>
        </section>
        {/* Every domain, every kind and the A to Z: the way to any other part of the glossary. */}
        <GlossaryWaysIn currentLetter={bucket} />
      </main>
      <SiteFooter />
      <ScrollToTop label={t("browse.backToTop")} />
      {/* My desk: "★ Saved", "✓ Read" or "✓ Done" on the cards of items the reader keeps, placed after paint. */}
      <DeskListMarks selector=".gloss-entry" labels={{ saved: tDesk("saved"), read: tDesk("readOn"), done: tDesk("doneOn") }} />
    </>
  );
}
