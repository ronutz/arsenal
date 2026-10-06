// ============================================================================
// src/app/[locale]/glossary/page.tsx
// ----------------------------------------------------------------------------
// THE GLOSSARY INDEX — the field's terms, acronyms, expressions, jargon, and
// lore in one filterable A-Z list. Structural sibling of the Learn index, but
// the axes differ: the glossary filters by DOMAIN + KIND + free text (see
// GlossaryFilter), not by the tools/Learn category taxonomy, and it is one flat
// alphabetical list rather than category sections.
//
// Data split (per glossary-design-spec-v1): language-neutral structure comes
// from the registry (getAllGlossaryEntries, sorted A-Z by headword); the def
// gloss and every label come from the `glossary` i18n namespace (en + native
// pt-BR, English fallback for the other locales). Each row carries data-*
// attributes the client filter reads (domains, kind, and a lowercased search
// blob of headword + aliases + expansion).
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import {
  getAllGlossaryEntries,
  getGlossaryDomains,
  getGlossaryKinds,
} from "@/content/glossary/glossary";
import { Link } from "@/i18n/navigation";
import { DefinedTermSetSchema } from "@/components/GlossarySchema";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ScrollToTop from "@/components/ScrollToTop";
import GlossaryFilter from "@/components/glossary/GlossaryFilter";
import type { CSSProperties } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { title: t("title"), ...ogImages("page", "glossary", locale, alt) };
}

export default async function GlossaryIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations("nav");
  const t = await getTranslations("glossary");

  const entries = getAllGlossaryEntries(); // A-Z by headword
  const domains = getGlossaryDomains(); // canonical order
  const kinds = getGlossaryKinds(); // precedence order

  // Group entries by their first alphanumeric character (A-Z, then "#").
  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const first = e.headword.replace(/[^\p{L}\p{N}]/u, "").charAt(0).toUpperCase();
    const bucket = /[A-Z]/.test(first) ? first : "#";
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket)!.push(e);
  }
  // Bucket order: A-Z first, then "#".
  const bucketKeys = [...groups.keys()].sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  // The lowercased text blob each row is searched against.
  const searchBlob = (e: (typeof entries)[number]) =>
    [e.headword, e.expansion ?? "", ...(e.aliases ?? [])]
      .join(" ")
      .toLowerCase();

  // A-Z rail (the signature navigation device for a 151-term list): the full
  // alphabet, with each letter either a jump link (bucket present) or a dimmed
  // marker (bucket empty). "#" is appended only when non-alphabetic headwords
  // exist. The client filter later dims letters whose bucket has no visible row.
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const railLetters = [...ALPHABET, ...(groups.has("#") ? ["#"] : [])];
  const present = new Set(bucketKeys);
  // G4 (SCOUT, adopted 2026-10-05): the counts behind the five entrances. "Commonly mistold" is the set of
  // entries flagged disputed, each of which carries its correction in its own context (glossary.ts, lore
  // accuracy); the jargon entrance counts the jargon, the acronyms and the expressions together, the three
  // kinds that need decoding rather than defining.
  const mistold = entries.filter((e) => e.disputed);
  const jargonCount = entries.filter((e) => e.kind === "jargon" || e.kind === "acronym" || e.kind === "expression").length;
  const loreCount = entries.filter((e) => e.kind === "lore").length;

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <DefinedTermSetSchema
              locale={locale}
              name={t("title")}
              description={t("tagline")}
            />
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("tagline")}</p>
            <p className="gloss-hero-count">{t("totalCount", { count: entries.length })}</p>
            {/* FIVE ENTRANCES (G4, SCOUT, adopted 2026-10-05): what makes this glossary different, foregrounded.
                I need a definition goes to the filter's own search field; decode the jargon to the jargon kind
                page (acronyms and expressions sit beside it in the kind rail); industry lore to the lore kind
                page; commonly mistold to the section below, the entries flagged disputed with their
                corrections; browse a domain to the domain rail. The A to Z follows, as it always has. */}
            <div className="learn-portal-grid learn-portal-grid-wide gloss-entrances">
              <a href="#glossary-filter" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9679;</span>
                <p className="learn-portal-title">{t("entrances.defineTitle")} <span className="learn-portal-arrow">&#8594;</span></p>
                <p className="learn-portal-lede">{t("entrances.defineLede", { count: entries.length })}</p>
              </a>
              <Link href="/glossary/kind/jargon" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">{t("entrances.jargonTitle")} <span className="learn-portal-arrow">&#8594;</span></p>
                <p className="learn-portal-lede">{t("entrances.jargonLede", { count: jargonCount })}</p>
              </Link>
              <Link href="/glossary/kind/lore" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-success)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">{t("entrances.loreTitle")} <span className="learn-portal-arrow">&#8594;</span></p>
                <p className="learn-portal-lede">{t("entrances.loreLede", { count: loreCount })}</p>
              </Link>
              <a href="#mistold" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-danger)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9651;</span>
                <p className="learn-portal-title">{t("entrances.mistoldTitle")} <span className="learn-portal-arrow">&#8594;</span></p>
                <p className="learn-portal-lede">{t("entrances.mistoldLede", { count: mistold.length })}</p>
              </a>
              <a href="#glossary-domains" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-info)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9733;</span>
                <p className="learn-portal-title">{t("entrances.domainTitle")} <span className="learn-portal-arrow">&#8594;</span></p>
                <p className="learn-portal-lede">{t("entrances.domainLede", { count: domains.length })}</p>
              </a>
            </div>
            {/* COMMONLY MISTOLD (G4): the entries flagged disputed, A to Z, each with its first context sentence,
                which is where the correction lives. The flag is data; this list cannot drift from it. */}
            <section className="gloss-mistold" id="mistold" aria-labelledby="gloss-mistold-title">
              <h2 className="glossary-domain-rail-title" id="gloss-mistold-title">{t("entrances.mistoldSection")}</h2>
              <p className="gloss-mistold-lede">{t("entrances.mistoldSectionLede", { count: mistold.length })}</p>
              <ul className="gloss-mistold-list">
                {mistold.map((e) => (
                  <li key={e.slug} className="gloss-mistold-item">
                    <Link href={`/glossary/${e.slug}`} className="gloss-mistold-link">{e.headword}</Link>
                    <span className="gloss-mistold-kind mono">{t(`kinds.${e.kind}`)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Addressable domain pages, above the client filter. The filter
                needs the whole three-megabyte page downloaded before it can
                narrow anything, and its result has no URL - so it cannot be
                linked, shared or indexed. These links can. (PRIME 2026-09-14,
                "findability needs improvements".) */}
            <nav className="glossary-domain-rail-wrap" id="glossary-domains" aria-label={t("browseByDomain")}>
              <h2 className="glossary-domain-rail-title">{t("browseByDomain")}</h2>
              <ul className="glossary-domain-rail">
                {domains.map((d) => (
                  <li key={d}>
                    <Link
                      href={`/glossary/domain/${d}`}
                      className="glossary-domain-chip"
                    >
                      {t(`domains.${d}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="glossary-domain-rail-wrap" aria-label={t("browseByKind")}>
              <h2 className="glossary-domain-rail-title">{t("browseByKind")}</h2>
              <ul className="glossary-domain-rail">
                {kinds.map((k) => (
                  <li key={k}>
                    <Link href={`/glossary/kind/${k}`} className="glossary-domain-chip">
                      {t(`kinds.${k}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div id="glossary-filter">
            <GlossaryFilter
              domains={domains.map((d) => ({ key: d, label: t(`domains.${d}`) }))}
              kinds={kinds.map((k) => ({ key: k, label: t(`kinds.${k}`) }))}
              domainLegend={t("filterDomainLegend")}
              kindLegend={t("filterKindLegend")}
              allDomainsLabel={t("allDomains")}
              allKindsLabel={t("allKinds")}
              searchPlaceholder={t("searchPlaceholder")}
              searchAriaLabel={t("searchPlaceholder")}
              clearLabel={t("clearFilters")}
              countTemplate={t("resultsCount", { count: 0 }).replace(/\d+/, "{count}")}
              noResultsLabel={t("noResults")}
            />
            </div>

            {/* A-Z jump rail (signature). Present letters jump to their bucket;
                empty letters are dimmed. The client filter dims letters whose
                bucket has no visible row after filtering. */}
            <nav className="gloss-az" aria-label={t("azNavLabel")}>
              {railLetters.map((L) =>
                present.has(L) ? (
                  <a
                    key={L}
                    href={`#gloss-${L === "#" ? "hash" : L}`}
                    className="gloss-az-link"
                    data-gloss-az={L}
                  >
                    {L}
                  </a>
                ) : (
                  <span
                    key={L}
                    className="gloss-az-link is-empty"
                    data-gloss-az={L}
                    aria-hidden="true"
                  >
                    {L}
                  </span>
                ),
              )}
            </nav>

            {/* One block per alphabetical bucket. */}
            <div className="gloss-list">
              {bucketKeys.map((bucket) => (
                <section
                  className="gloss-group"
                  key={bucket}
                  id={`gloss-${bucket === "#" ? "hash" : bucket}`}
                  data-glossary-group
                  data-letter={bucket}
                >
                  <h2 className="gloss-group-letter">
                    <span aria-hidden="true">{bucket}</span>
                    <span className="gloss-group-count">{groups.get(bucket)!.length}</span>
                  </h2>
                  <ul className="gloss-entries">
                    {groups.get(bucket)!.map((e) => (
                      <li
                        key={e.slug}
                        className="gloss-entry"
                        data-glossary-row
                        data-slug={e.slug}
                        data-domains={e.domains.join(" ")}
                        data-kind={e.kind}
                        data-search={searchBlob(e)}
                      >
                        <Link href={`/glossary/${e.slug}`} className="gloss-entry-link">
                          <span className="gloss-entry-head">
                            <span className="gloss-entry-headword">{e.headword}</span>
                            <span className={`gloss-kind-badge gloss-kind-${e.kind}`}>
                              {t(`kinds.${e.kind}`)}
                            </span>
                            {e.disputed && (
                              <span
                                className="gloss-disputed-badge"
                                title={t("disputedLabel")}
                              >
                                {t("disputedLabel")}
                              </span>
                            )}
                          </span>
                          <span className="gloss-entry-def">
                            {t(`entries.${e.slug}.def`)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <ScrollToTop label={t("backToIndex")} />
    </>
  );
}
