// ============================================================================
// src/app/[locale]/glossary/page.tsx
// ----------------------------------------------------------------------------
// THE GLOSSARY HUB — the way into the field's terms, acronyms, expressions, jargon, and lore.
//
// Until 2026-11-16 this page WAS the glossary: every entry in one filterable A to Z list, 2,061 entries and about four
// megabytes in Portuguese, the heaviest page of the site and the split the audit of 2026-10-15 (F07) left open. PRIME
// 16/11/2026 04:27: "split the Glossary page into theme-based or subject-based or whatever you think is best for
// splitting it and implementing good discoverability across them". The entries now live on three kinds of page:
//   - one page per LETTER (/glossary/letter/<a..z|0-9>), the complete partition: every entry on exactly one;
//   - one page per DOMAIN (/glossary/domain/<d>), the subjects, which overlap;
//   - one page per KIND (/glossary/kind/<k>), lore, expressions, jargon, acronyms, terms;
// each with the same cards and filter (src/components/glossary/GlossaryBrowse.tsx) and a foot that leads to all the
// others. This hub carries no entry list. It offers, in order:
//   1. "Find a term": a name lookup over all 2,061 entries from a small index fetched on first use (GlossaryFinder,
//      public/glossary-index.json), with the site's full-text search one button away;
//   2. the five entrances of G4 (SCOUT, adopted 2026-10-05);
//   3. the A to Z as tiles, each letter with its count;
//   4. the domains as cards, each with its count and its key terms (the entries the rest of the glossary points at
//      most often);
//   5. the kinds and the people, with their counts;
//   6. "commonly mistold", the entries flagged disputed;
//   7. "recently checked", the entries whose sources were read most recently.
// An old link to a letter section (/glossary#gloss-C) is forwarded to that letter's page (GlossaryHashForward).
//
// Data split (per glossary-design-spec-v1): language-neutral structure comes from the registry; every label from the
// `glossary` i18n namespace (en + native pt-BR, English fallback for the other locales).
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { intlLocale } from "@/i18n/locales";
import {
  getAllGlossaryEntries,
  getGlossaryDomains,
  getGlossaryKinds,
} from "@/content/glossary/glossary";
import { entriesForDomain, keyTermsForDomain, recentlyChecked } from "@/lib/glossaryBrowse";
import { Link } from "@/i18n/navigation";
import { DefinedTermSetSchema } from "@/components/GlossarySchema";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ScrollToTop from "@/components/ScrollToTop";
import GlossaryFinder from "@/components/glossary/GlossaryFinder";
import GlossaryHashForward from "@/components/glossary/GlossaryHashForward";
import { GlossaryLetterRail } from "@/components/glossary/GlossaryBrowse";
import type { CSSProperties } from "react";

/** How many key terms each domain card names. */
const KEY_TERMS = 4;
/** How many entries "recently checked" lists. */
const RECENT = 12;

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

  const t = await getTranslations("glossary");
  const tPeople = await getTranslations("people"); // the people page's name

  const entries = getAllGlossaryEntries(); // A-Z by headword
  const domains = getGlossaryDomains(); // canonical order
  const kinds = getGlossaryKinds(); // precedence order
  // A label as a card heading: the domain labels are written to sit inside a sentence ("networking terms"), so a card
  // that opens with one capitalises its first letter in the page's language.
  const asHeading = (s: string) => s.charAt(0).toLocaleUpperCase(intlLocale(locale)) + s.slice(1); // first letter up
  // The day an entry was checked, in the reader's language.
  const fmtDay = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" }); // "16 Nov 2026"

  // G4 (SCOUT, adopted 2026-10-05): the counts behind the five entrances. "Commonly mistold" is the set of
  // entries flagged disputed, each of which carries its correction in its own context (glossary.ts, lore
  // accuracy); the jargon entrance counts the jargon, the acronyms and the expressions together, the three
  // kinds that need decoding rather than defining.
  const mistold = entries.filter((e) => e.disputed);
  const jargonCount = entries.filter((e) => e.kind === "jargon" || e.kind === "acronym" || e.kind === "expression").length;
  const loreCount = entries.filter((e) => e.kind === "lore").length;
  const people = entries.filter((e) => e.person).length; // the entries about individuals (/people)
  const recent = recentlyChecked(RECENT); // the latest checked entries

  return (
    <>
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

            {/* 1. FIND A TERM: a name lookup over every entry, from a small index fetched on first use; the site's
                full-text search, narrowed to the glossary, is one button away. */}
            <div id="glossary-finder">
              <GlossaryFinder
                indexUrl="/glossary-index.json"
                kindLabels={Object.fromEntries(kinds.map((k) => [k, t(`kinds.${k}`)]))}
                label={t("browse.finderLabel")}
                placeholder={t("browse.finderPlaceholder")}
                hint={t("browse.finderHint")}
                loadingLabel={t("browse.finderLoading")}
                errorLabel={t("browse.finderError")}
                countTemplate={t("browse.finderCount", { shown: "%SHOWN%", total: "%TOTAL%" })}
                noneLabel={t("browse.finderNone")}
                aliasLabel={t("aliasesLabel")}
                fullTextLabel={t("browse.finderFullText")}
                sectionLabel={t("title")}
              />
            </div>

            {/* 2. FIVE ENTRANCES (G4, SCOUT, adopted 2026-10-05): what makes this glossary different, foregrounded.
                I need a definition goes to the finder; decode the jargon to the jargon kind page (acronyms and
                expressions sit beside it in the kind rail); industry lore to the lore kind page; commonly mistold
                to the section below, the entries flagged disputed with their corrections; browse a domain to the
                domain cards. */}
            <div className="learn-portal-grid learn-portal-grid-wide gloss-entrances">
              <a href="#glossary-finder" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
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

            {/* 3. THE A TO Z: one page per letter, the complete list of entries across them. */}
            <section className="gloss-hub-part" id="glossary-az" aria-labelledby="gloss-az-title">
              <h2 className="gloss-hub-title" id="gloss-az-title">{t("browse.azTitle")}</h2>
              <p className="gloss-hub-lede">{t("browse.azLede", { count: entries.length })}</p>
              <GlossaryLetterRail tiles />
            </section>

            {/* 4. THE DOMAINS: each with its count and its key terms, the entries the rest of the glossary points at
                most often, so a reader sees what a domain holds before opening it. */}
            <section className="gloss-hub-part" id="glossary-domains" aria-labelledby="gloss-domains-title">
              <h2 className="gloss-hub-title" id="gloss-domains-title">{t("browseByDomain")}</h2>
              <p className="gloss-hub-lede">{t("browse.domainsLede", { count: domains.length })}</p>
              <ul className="gloss-domain-cards">
                {domains.map((d) => (
                  <li key={d} className="gloss-domain-card">
                    <h3 className="gloss-domain-card-title">
                      <Link href={`/glossary/domain/${d}`}>{asHeading(t(`domains.${d}`))}</Link>
                    </h3>
                    <p className="gloss-domain-card-count">{t("resultsCount", { count: entriesForDomain(d).length })}</p>
                    {/* The key terms, as links straight to their entries. */}
                    <p className="gloss-domain-card-terms">
                      <span className="gloss-domain-card-terms-label">{t("browse.keyTermsLabel")}</span>{" "}
                      {keyTermsForDomain(d, KEY_TERMS).map((e, i) => (
                        <span key={e.slug}>
                          {i > 0 ? ", " : ""}
                          <Link href={`/glossary/${e.slug}`}>{e.headword}</Link>
                        </span>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* 5. THE KINDS AND THE PEOPLE, with their counts. */}
            <nav className="gloss-hub-part" id="glossary-kinds" aria-labelledby="gloss-kinds-title">
              <h2 className="gloss-hub-title gloss-hub-title--spaced" id="gloss-kinds-title">{t("browseByKind")}</h2>
              <ul className="glossary-domain-rail">
                {kinds.map((k) => (
                  <li key={k}>
                    <Link href={`/glossary/kind/${k}`} className="glossary-domain-chip">
                      {t(`kinds.${k}`)} <span className="glossary-chip-count">{entries.filter((e) => e.kind === k).length}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/people" className="glossary-domain-chip">
                    {tPeople("title")} <span className="glossary-chip-count">{people}</span>
                  </Link>
                </li>
              </ul>
            </nav>

            {/* 6. COMMONLY MISTOLD (G4): the entries flagged disputed, A to Z, each linking to the entry whose context
                carries the correction. The flag is data; this list cannot drift from it. */}
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

            {/* 7. RECENTLY CHECKED: the entries whose sources were read most recently, newest first. */}
            {recent.length > 0 && (
              <section className="gloss-hub-part" id="glossary-recent" aria-labelledby="gloss-recent-title">
                <h2 className="gloss-hub-title" id="gloss-recent-title">{t("browse.recentTitle")}</h2>
                <p className="gloss-hub-lede">{t("browse.recentLede")}</p>
                <ul className="gloss-recent-list">
                  {recent.map(({ entry, day }) => (
                    // data-kind gives the badge its kind's colour (the --gloss-kind-hue rules in components.css).
                    <li key={entry.slug} className="gloss-recent-item" data-kind={entry.kind}>
                      <Link href={`/glossary/${entry.slug}`} className="gloss-recent-link">{entry.headword}</Link>
                      <span className={`gloss-kind-badge gloss-kind-${entry.kind}`}>{t(`kinds.${entry.kind}`)}</span>
                      <time className="gloss-recent-day" dateTime={day}>{fmtDay.format(new Date(`${day}T12:00:00Z`))}</time>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
      <ScrollToTop label={t("browse.backToTop")} />
      {/* An old link to a letter section of the single A to Z page lands on that letter's own page. */}
      <GlossaryHashForward />
    </>
  );
}
