// ============================================================================
// src/app/[locale]/people/page.tsx
// ----------------------------------------------------------------------------
// PEOPLE — the individuals the corpus already carried, gathered in one place
// (PRIME, 2026-09-01).
//
// WHY THIS EXISTS AS A PAGE RATHER THAN A FILTER
// The people were in the glossary all along, and unreachable as a group: Ada
// Lovelace sat between two acronyms, Mudge between two protocols. The glossary
// filter is client-side with no URL parameter, so nothing could link to "the
// people" — there was no address for them.
//
// WHY IT READS FROM A FLAG
// `person: true` is declared on each entry rather than derived. People are
// scattered across glossary kinds (jeff-moss is a term, mafiaboy is lore) and
// the entries that are NOT people look identical: L0pht, Legion of Doom,
// Masters of Deception, Phrack, WarGames and DEF CON all survive any pattern
// loose enough to catch a nineteenth-century mathematician. See the field
// comment in src/content/glossary/glossary.ts.
//
// The page links into the glossary rather than duplicating it, so there is one
// copy of every biography and this stays a way in.
//
// Statically generated per locale.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { GLOSSARY } from "@/content/glossary/glossary";
import PeopleTimelineFilter from "@/components/PeopleTimelineFilter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "people" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("people");
  const tNav = await getTranslations("nav");
  const tGloss = await getTranslations("glossary");

  // A TIMELINE, not an alphabet (PRIME, 2026-09-01). Ordering by year puts
  // Volta next to Ørsted and Kaminsky next to Hutchins, which is the reading
  // an alphabet destroys: these people answer each other across decades.
  const people = GLOSSARY.filter((e) => e.person).sort(
    (a, b) =>
      (a.personYear ?? 9999) - (b.personYear ?? 9999) ||
      a.headword.localeCompare(b.headword),
  );

  // Grouped by decade, so the density of a period is visible at a glance.
  const decadeOf = (year?: number) => (year ? Math.floor(year / 10) * 10 : 0);
  const eras = new Map<number, typeof people>();
  for (const p of people) {
    const d = decadeOf(p.personYear);
    if (!eras.has(d)) eras.set(d, []);
    eras.get(d)!.push(p);
  }

  // Filter chips, in timeline order of first appearance rather than
  // alphabetically, so the legend reads the same way the page does.
  const fieldOrder: string[] = [];
  for (const p of people) {
    if (p.personField && !fieldOrder.includes(p.personField))
      fieldOrder.push(p.personField);
  }
  const fields = fieldOrder.map((key) => ({
    key,
    label: t(`fields.${key}`),
    count: people.filter((p) => p.personField === key).length,
  }));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <article>
          <section className="section">
            <div className="container section-narrow">
              <Breadcrumbs
                ariaLabel={tNav("breadcrumb")}
                items={[
                  { label: tNav("home"), href: "/" },
                  { href: "/learn", label: tNav("learn") },
                  { label: t("title") },
                ]}
              />
              <header className="section">
                <h1 className="page-hero-title">{t("title")}</h1>
                <p className="page-hero-lede">{t("lede")}</p>
                {/* WHAT THE YEAR MEANS, said once in prose (PRIME, 2026-09-30).
                    A bare year above a name reads as a birth year, and for most of
                    this list it is not one: it anchors the work the entry is about.
                    The same meaning is repeated on every year as an accessible
                    label below, because this sentence has scrolled away long before
                    a reader reaches the 1990s. */}
                <p className="people-year-note">{t("yearNote")}</p>
                <p className="people-count">
                  {t("count", { count: people.length })}
                </p>
              </header>

              {/* FIVE ENTRANCES OVER THE FILTERS (G3, SCOUT, adopted 2026-10-06): the pioneers of electricity, the
                  builders of computing, the people who built the internet, security and hacker culture (with the
                  cryptographers), and Brazil, each a filtered view with an address (?field=, read by the filter
                  after mount); then the whole timeline, as it always was. Counts from the same list. */}
              <ul className="people-entrances" aria-label={t("entrancesLabel")}>
                {([
                  { key: "pioneers", fields: ["electricity"] },
                  { key: "computing", fields: ["computing"] },
                  { key: "internet", fields: ["internet"] },
                  { key: "security", fields: ["security", "hacker-culture", "crypto"] },
                  { key: "brazil", fields: ["brazil"] },
                ] as { key: string; fields: string[] }[]).map((en) => {
                  const n = people.filter((p) => p.personField && en.fields.includes(p.personField)).length;
                  if (n === 0) return null;
                  return (
                    <li key={en.key}>
                      <a href={`/${locale}/people/?field=${en.fields.join(",")}#people-timeline`} className="people-entrance">
                        <span className="people-entrance-title">{t(`entrances.${en.key}.title`)}</span>
                        <span className="people-entrance-lede">{t(`entrances.${en.key}.lede`, { count: n })}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              <PeopleTimelineFilter
                fields={fields}
                total={people.length}
                allLabel={t("filterAll")}
                regionLabel={t("filterLabel")}
                searchLabel={t("searchLabel")}
                searchPlaceholder={t("searchPlaceholder")}
                showingLabel={t("showing")}
                clearLabel={t("clear")}
                noneLabel={t("none")}
              />

              <section className="section" data-people-timeline id="people-timeline">
                {Array.from(eras.entries()).map(([decade, group]) => (
                  <div className="people-era" key={decade}>
                    <h2 className="people-decade">{t("decade", { decade })}</h2>
                    <ul className="people-list">
                      {group.map((p) => (
                        <li
                          className="people-item"
                          data-field={p.personField ?? ""}
                          data-name={p.headword}
                          key={p.slug}
                        >
                          {/* The year carries its own label so the meaning travels
                              with the number. Without it a screen reader announces
                              "1831 Michael Faraday", which is exactly the birth-year
                              misreading the note above exists to prevent, with no
                              visual context to correct it. The year is passed as a
                              STRING: an ICU placeholder holding a number can pick up
                              locale grouping, and "1.831" in pt-BR would be a worse
                              defect than the one being fixed. */}
                          <span
                            className="people-year"
                            aria-label={t("yearLabel", { year: String(p.personYear ?? "") })}
                            title={t("yearLabel", { year: String(p.personYear ?? "") })}
                          >
                            {p.personYear}
                          </span>
                          <Link
                            className="people-link"
                            href={`/glossary/${p.slug}`}
                          >
                            {p.headword}
                          </Link>
                          <span className="people-def">
                            {tGloss(`entries.${p.slug}.def`)}
                          </span>
                          {/* The full paragraph, not only the one-liner: PRIME asked
                          for people to read as richly as everything else, and a
                          name plus a sentence is a directory, not a record. */}
                          <span className="people-context">
                            {tGloss(`entries.${p.slug}.context`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            </div>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
