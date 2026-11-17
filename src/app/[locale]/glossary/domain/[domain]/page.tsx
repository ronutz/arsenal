// ============================================================================
// src/app/[locale]/glossary/domain/[domain]/page.tsx
// ----------------------------------------------------------------------------
// One browsable page per glossary DOMAIN: /glossary/domain/crypto and so on.
//
// WHY (PRIME, 2026-09-14, "findability needs improvements").
//
// The measurement that prompted it: /tools ships a 441 KB index organised into
// fifteen named categories. /glossary ships a THREE MEGABYTE index organised by
// nothing but first letter - A101, B79, C157. A reader who does not already
// know the word they want has no way in.
//
// The data to fix that was already there and unused. Every one of the 1,703
// entries carries `domains`, and every domain already has a translated label.
// The index even has a client-side domain filter - but you must download three
// megabytes before you can use it, and the result has no URL, so it cannot be
// linked, shared, bookmarked or indexed.
//
// These pages are the missing half: the same grouping, addressable. An article
// about certificates can now point at the cryptography glossary specifically
// rather than at 1,703 terms and an apology.
//
// SCOPE: generated for every LIVE locale, matching the glossary index rather
// than the term pages. Index pages are advertised everywhere; only the term
// detail pages are limited to the authored locales (2026-09-10 decision), and
// a link into those simply redirects for the rest.
//
// 2026-11-16 (PRIME 04:27, splitting the glossary page): the page lists its entries as full cards (name, kind,
// disputed mark, definition), the same cards the letter pages show, in letter sections with a sticky jump bar; the
// filter narrows them by kind, by a domain they also carry ("also in") and by text; "neighbouring domains" names the
// domains that share the most entries with this one; and the foot of the page leads to every domain, kind and letter.
// ============================================================================

// The page's own social card (12/11/2026: it shipped the generic one), named the way scripts/gen-og.mts draws it.
import { ogImages } from "@/lib/og";
// One description for the meta, og and twitter fields, merged into the card.
import { withDescription } from "@/lib/metaDescription";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import ScrollToTop from "@/components/ScrollToTop";
// My desk's saved and read labels on the cards.
import DeskListMarks from "@/components/desk/DeskListMarks";
import GlossaryFilter from "@/components/glossary/GlossaryFilter";
import { GlossaryInPageAz, GlossaryRows, GlossaryWaysIn } from "@/components/glossary/GlossaryBrowse";
import { intlLocale, LIVE_LOCALE_CODES } from "@/i18n/locales";
import { getGlossaryDomains, getGlossaryKinds, type GlossaryDomain } from "@/content/glossary/glossary";
import { entriesForDomain, groupByLetter, relatedDomains } from "@/lib/glossaryBrowse";

export const dynamicParams = false;

export function generateStaticParams() {
  const domains = getGlossaryDomains();
  return LIVE_LOCALE_CODES.flatMap((locale) =>
    domains.map((domain) => ({ locale, domain }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; domain: string }>;
}): Promise<Metadata> {
  const { locale, domain } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  const label = t(`domains.${domain}`);
  const count = entriesForDomain(domain).length;
  const title = capitalise(t("domainPageTitle", { domain: label }), locale); // "Networking terms", not "networking terms"
  return {
    title,
    // The Glossary card (12/11/2026: the page shipped the generic one), with the description in the meta, og and twitter fields.
    ...withDescription(t("domainPageDescription", { domain: label, count }), ogImages("page", "glossary", locale, title), `glossary/domain/${domain}`),
  };
}

/**
 * A title with its first letter in capitals, in the page's language. The domain labels are written to sit inside a
 * sentence ("networking"), so an English title that opens with one ("{domain} terms") would start in lower case.
 *
 * @param s the title
 * @param locale the page's locale
 * @returns the title, first letter up
 */
function capitalise(s: string, locale: string): string {
  return s.charAt(0).toLocaleUpperCase(intlLocale(locale)) + s.slice(1); // first letter up, the rest as written
}

export default async function GlossaryDomainPage({
  params,
}: {
  params: Promise<{ locale: string; domain: string }>;
}) {
  const { locale, domain } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("glossary");
  const tNav = await getTranslations("nav"); // the breadcrumb's name and Home
  const tDesk = await getTranslations("deskItem"); // the desk's marks

  const label = t(`domains.${domain}`);
  const entries = entriesForDomain(domain); // this domain's entries, A to Z
  const groups = groupByLetter(entries); // in letter sections
  const neighbours = relatedDomains(domain); // the domains sharing entries with this one, most shared first
  const kinds = getGlossaryKinds().filter((k) => entries.some((e) => e.kind === k)); // the kinds present here

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { href: "/glossary", label: t("title") },
                { label },
              ]}
            />
            <h1 className="page-hero-title">
              {capitalise(t("domainPageTitle", { domain: label }), locale)}
            </h1>
            <p className="page-hero-lede">
              {t("domainPageDescription", { domain: label, count: entries.length })}
            </p>

            {/* The domains this one overlaps with most, as links: the next place a reader of this domain is likely to go. */}
            {neighbours.length > 0 && (
              <nav className="gloss-neighbours" aria-label={t("browse.neighboursTitle")}>
                <h2 className="glossary-domain-rail-title">{t("browse.neighboursTitle")}</h2>
                <ul className="glossary-domain-rail">
                  {neighbours.slice(0, 6).map((n) => (
                    <li key={n.domain}>
                      <Link href={`/glossary/domain/${n.domain}`} className="glossary-domain-chip">
                        {t(`domains.${n.domain}` as `domains.${GlossaryDomain}`)}{" "}
                        <span className="glossary-chip-count">{t("browse.sharedCount", { count: n.shared })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* The filter: by kind, by a domain these entries also carry, and by text. */}
            <div id="glossary-filter">
              <GlossaryFilter
                domains={neighbours.map((n) => ({ key: n.domain, label: t(`domains.${n.domain}` as `domains.${GlossaryDomain}`) }))}
                kinds={kinds.map((k) => ({ key: k, label: t(`kinds.${k}`) }))}
                domainLegend={t("browse.alsoInLegend")}
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

            {/* Jump to a letter of this domain, then the cards in letter sections. */}
            <GlossaryInPageAz groups={groups} />
            <GlossaryRows groups={groups} headings />
          </div>
        </section>

        {/* Every domain, every kind and the A to Z, this domain marked: the page is a junction, not a cul-de-sac. */}
        <GlossaryWaysIn currentDomain={domain} />
      </main>
      <SiteFooter />
      <ScrollToTop label={t("browse.backToTop")} />
      {/* My desk: "★ Saved", "✓ Read" or "✓ Done" on the cards of items the reader keeps, placed after paint. */}
      <DeskListMarks selector=".gloss-entry" labels={{ saved: tDesk("saved"), read: tDesk("readOn"), done: tDesk("doneOn") }} />
    </>
  );
}
