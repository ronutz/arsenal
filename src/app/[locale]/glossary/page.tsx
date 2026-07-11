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
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ScrollToTop from "@/components/ScrollToTop";
import GlossaryFilter from "@/components/glossary/GlossaryFilter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { ...ogImages("page", "glossary", locale, alt) };
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

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("tagline")}</p>
            <p className="gloss-hero-count">{t("totalCount", { count: entries.length })}</p>

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
