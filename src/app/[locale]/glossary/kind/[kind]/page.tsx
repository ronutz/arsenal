// ============================================================================
// src/app/[locale]/glossary/kind/[kind]/page.tsx
// ----------------------------------------------------------------------------
// One page per glossary KIND: /glossary/kind/lore, /glossary/kind/expression,
// and so on. The second axis, after the domain pages of the same day.
//
// WHY THIS ONE MATTERS MORE THAN IT LOOKS (PRIME, 2026-09-14, "findability
// needs improvements").
//
// The glossary holds 1,703 entries, and 588 of them are NOT definitions:
//
//     lore        343    how the industry remembers things
//     expression  145    what people actually say
//     jargon      100    the words that mark an insider
//
// Until now every one of those sat in the same alphabetical wall as "MTU" and
// "OCSP", indistinguishable from a protocol definition. A reader could only
// find "the industry's folklore" by already knowing which folklore they wanted,
// which is no way to find folklore.
//
// Domains answer "which area is this about". Kinds answer "what SORT of thing
// is this" - and that is the axis on which the most distinctive material in
// this glossary has been invisible.
//
// Same scope rule as the domain pages: every LIVE locale, matching the index
// rather than the term pages.
//
// 2026-11-16 (PRIME 04:27, splitting the glossary page): the page lists its entries as full cards, the same cards the
// letter and domain pages show, in letter sections with a sticky jump bar, with the filter by domain and text, and the
// foot of the page leads to every domain, kind and letter.
// ============================================================================

// The page's own social card (12/11/2026: it shipped the generic one), named the way scripts/gen-og.mts draws it.
import { ogImages } from "@/lib/og";
// One description for the meta, og and twitter fields, merged into the card.
import { withDescription } from "@/lib/metaDescription";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import ScrollToTop from "@/components/ScrollToTop";
// My desk's saved and read labels on the cards.
import DeskListMarks from "@/components/desk/DeskListMarks";
import GlossaryFilter from "@/components/glossary/GlossaryFilter";
import { GlossaryInPageAz, GlossaryRows, GlossaryWaysIn } from "@/components/glossary/GlossaryBrowse";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import {
  getAllGlossaryEntries,
  getGlossaryDomains,
  getGlossaryKinds,
} from "@/content/glossary/glossary";
import { groupByLetter } from "@/lib/glossaryBrowse";

export const dynamicParams = false;

export function generateStaticParams() {
  const kinds = getGlossaryKinds();
  return LIVE_LOCALE_CODES.flatMap((locale) =>
    kinds.map((kind) => ({ locale, kind }))
  );
}

/** One kind's entries, in the registry's A to Z order (the order every other glossary page uses). */
function entriesFor(kind: string) {
  return getAllGlossaryEntries().filter((e) => e.kind === kind); // A to Z already
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}): Promise<Metadata> {
  const { locale, kind } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  const label = t(`kinds.${kind}`);
  return {
    title: t("kindPageTitle", { kind: label }),
    ...withDescription(t("kindPageDescription", { kind: label, count: entriesFor(kind).length }), ogImages("page", "glossary", locale, t("kindPageTitle", { kind: label })), `glossary/kind/${kind}`),
  };
}

export default async function GlossaryKindPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}) {
  const { locale, kind } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("glossary");
  const tNav = await getTranslations("nav"); // the breadcrumb's name and Home
  const tDesk = await getTranslations("deskItem"); // the desk's marks

  const label = t(`kinds.${kind}`);
  const entries = entriesFor(kind); // this kind's entries, A to Z
  const groups = groupByLetter(entries); // in letter sections
  const domains = getGlossaryDomains().filter((d) => entries.some((e) => e.domains.includes(d))); // the domains present here

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[{ label: tNav("home"), href: "/" }, { href: "/glossary", label: t("title") }, { label }]}
            />
            <h1 className="page-hero-title">
              {t("kindPageTitle", { kind: label })}
            </h1>
            <p className="page-hero-lede">
              {t("kindPageDescription", { kind: label, count: entries.length })}
            </p>

            {/* The filter: by domain and by text (the page is one kind, so no kind chips). */}
            <div id="glossary-filter">
              <GlossaryFilter
                domains={domains.map((d) => ({ key: d, label: t(`domains.${d}`) }))}
                kinds={[]}
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

            {/* Jump to a letter of this kind, then the cards in letter sections. */}
            <GlossaryInPageAz groups={groups} />
            <GlossaryRows groups={groups} headings />
          </div>
        </section>

        {/* Every domain, every kind and the A to Z, this kind marked. */}
        <GlossaryWaysIn currentKind={kind} />
      </main>
      <SiteFooter />
      <ScrollToTop label={t("browse.backToTop")} />
      {/* My desk: "★ Saved", "✓ Read" or "✓ Done" on the cards of items the reader keeps, placed after paint. */}
      <DeskListMarks selector=".gloss-entry" labels={{ saved: tDesk("saved"), read: tDesk("readOn"), done: tDesk("doneOn") }} />
    </>
  );
}
