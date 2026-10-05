// ============================================================================
// src/app/[locale]/industry/chapters/page.tsx
// ----------------------------------------------------------------------------
// THE CAREER RECORD (Option B, PRIME-ratified 2026-07-16) — the PERSONAL
// axis of the vendor content: the fourteen career chapters, chronological,
// autobiographical. The encyclopedia axis (Red Education partners + pioneer
// lineages, full cards) lives at /industry; this page carries one compact
// pointer there instead of duplicating those grids. Card copy stays
// single-sourced in the "vendors" namespace. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// Career pages registry - single source shared with the /industry hub
// (extracted 2026-07-15; see src/content/vendors/career.ts).
import { CAREER_VENDORS as VENDORS } from "@/content/vendors/career";
// The marks on the cards (PRIME, 2026-10-05 02:37: "add the respective logos to each vendor in all cards"):
// the compact era-matched mark of every company a chapter covers, the same nominative use the chapter
// pages make, matched to the year the chapter opens so the mark is the one that was official then.
import VendorMark from "@/components/VendorMark";
import { marksForVendor } from "@/content/vendors/marks";
// The clients named in the résumés, grouped by sector on this page (PRIME, 2026-10-05 02:43 and 02:52).
import { CLIENT_ENGAGEMENTS, CLIENT_SECTORS, CLIENT_SOURCES, CLIENT_COUNT, type ClientEngagement } from "@/content/vendors/clients";
// NOTE (PRIME, 2026-07-29): this index lists CAREER CHAPTERS ONLY - the
// companies worked inside directly. It is autobiography, not a company
// directory. Company histories belong on the /industry side, and an earlier
// change that listed all ~90 profiles here was reverted for exactly that
// reason: it turned a career record into a catalogue.

/**
 * PAGE TITLE (2026-09-26). This route shipped with NO generateMetadata export
 * at all, so it inherited the site-wide default <title> from [locale]/layout.tsx
 * and shared one identical string with thirteen other pages. That is the exact
 * fault check-page-titles was written for on 2026-08-16; the fix that day
 * reached the index routes and never came back for these.
 *
 * Title only, deliberately: ogImages() would point at public/og/page/chapters-<locale>.png,
 * and this slug is not in gen-og's STATIC_PAGES list, so the card does not exist
 * and check-og would fail on a manifest entry with nothing behind it. The page
 * keeps the default social card until the slug is added to that list.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vendors" });
  return { title: t("indexTitle") };
}

export default async function VendorsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vendors");
  const tNav = await getTranslations("nav");
  // The era caption helpers the marks need (hidden on compact marks, kept for the alt text).
  const tMarks = await getTranslations("partnerVendors");
  const era = (e: string) => tMarks("markEra", { era: e });
  const since = (y: number) => tMarks("markSince", { year: y });
  /** The year a chapter opens, read from its own years line ("1996 – 2007" → 1996); the current year when none. */
  const openingYear = (years: string): number => {
    const m = /\d{4}/.exec(years);
    return m ? Number(m[0]) : new Date().getFullYear();
  };
  /** The year to ask a company's mark registry for, so that EVERY company a chapter covers shows a mark: the
   *  opening year when a mark was in force then, else the end of the nearest earlier mark (NetScreen's, closed
   *  2004, on the 2009 chapter), else the start of the earliest mark (Enterasys, 2000, on the 1996 chapter). */
  const markYear = (vendor: string, year: number): number => {
    const marks = marksForVendor(vendor);
    if (marks.some((m) => m.from <= year && (m.to === null || year <= m.to))) return year;
    const earlier = marks.filter((m) => m.to !== null && (m.to as number) < year);
    if (earlier.length) return Math.max(...earlier.map((m) => m.to as number));
    return marks.length ? marks[0].from : year;
  };
  // The slug → i18n key map of the chapters, for the sector list's context labels.
  const keyOf = new Map(VENDORS.map((v) => [v.slug, v.key] as const));
  /** The context label of one engagement: the chapter's own name, or the independent practice. */
  const contextLabel = (e: ClientEngagement) => ("chapter" in e.context ? t(`${keyOf.get(e.context.chapter) ?? e.context.chapter}.name`) : t("clients.independent"));
  // The names grouped by sector, each name once, carrying every engagement it appears in (chronological).
  const bySector = CLIENT_SECTORS.map((sector) => {
    const names = new Map<string, ClientEngagement[]>();
    for (const e of CLIENT_ENGAGEMENTS) if (e.sector === sector) names.set(e.name, [...(names.get(e.name) ?? []), e]);
    return { sector, names: [...names.entries()].sort((a, b) => a[0].localeCompare(b[0], locale)) };
  }).filter((g) => g.names.length > 0).sort((a, b) => b.names.length - a.names.length);


  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <Link href="/about" className="article-back">
              ← {t("backToAbout")}
            </Link>

            {/* Title/lede in their proper places (PRIME 2026-07-17: the
                lede had been rendered inside the h1 at heading scale -
                a paragraph in h1 clothing. Reading comfort over spectacle.) */}
            <h1 className="page-hero-title">{t("indexTitle")}</h1>
            <p className="page-hero-lede" style={{ marginBottom: "2.5rem" }}>
              {t("indexLede")}
            </p>

            {/* Career vendors (worked with) */}
            <ul className="vendor-grid">
              {VENDORS.map((v) => (
                <li key={v.slug}>
                  <Link href={`/industry/chapters/${v.slug}`} className="vendor-card">
                    {/* Every company the chapter covers, in the order it meets them (markVendors), else the chapter's own key. */}
                    <span className="mark-row vendor-card-marks">
                      {(v.markVendors ?? [v.key]).map((mv) => (
                        <VendorMark key={mv} vendor={mv} year={markYear(mv, openingYear(t(`${v.key}.years`)))} eraLabel={era} since={since} compact />
                      ))}
                    </span>
                    <span className="vendor-card-years mono">{t(`${v.key}.years`)}</span>
                    <span className="vendor-card-name">{t(`${v.key}.name`)}</span>
                    <span className="vendor-card-tagline">{t(`${v.key}.tagline`)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* INDUSTRIES AND CLIENTS (PRIME, 2026-10-05): the organisations the résumés name, by sector, each with
                the chapter it belongs to, the years and the capacity; names only, no logos. The data and its
                provenance live in src/content/vendors/clients.ts; the notes are authored in both locales. */}
            <section className="clients-section" id="clients">
              <h2 className="section-title">{t("clients.title")}</h2>
              <p className="section-body">{t("clients.lede", { count: CLIENT_COUNT })}</p>
              <div className="clients-sectors">
                {bySector.map((g) => (
                  <div className="clients-sector" key={g.sector}>
                    <h3 className="clients-sector-title">{t(`clients.sector.${g.sector}`)} <span className="clients-sector-count mono">{g.names.length}</span></h3>
                    <ul className="clients-list">
                      {g.names.map(([name, items]) => (
                        <li className="clients-item" key={name}>
                          <span className="clients-name">{name}</span>
                          <span className="clients-ctx">
                            {items.map((e, i) => (
                              <span className="clients-ctx-item" key={i}>
                                {"chapter" in e.context ? <Link href={`/industry/chapters/${e.context.chapter}`}>{contextLabel(e)}</Link> : contextLabel(e)}
                                {" "}<span className="mono">{e.to ? t("clients.years", { from: String(e.from), to: String(e.to) }) : String(e.from)}</span>, {t(`clients.capacity.${e.capacity}`)}
                                {e.via ? `, ${t("clients.via", { via: e.via })}` : ""}
                                {e.noteKey ? <span className="clients-note"> {t(`clients.notes.${e.noteKey}`)}</span> : null}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="clients-sources">{t("clients.sourcesLine", { list: CLIENT_SOURCES.map((id) => t(`clients.sources.${id}`)).join("; ") })}</p>
            </section>

            {/* Divider: Red Education training partners */}
            {/* Compact pointer to the encyclopedia axis (Option B): the partner and
                pioneer lineages render as FULL cards on /industry only. */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{t("industryPointerTitle")}</h2>
              <p className="vendor-divider-note">{t("industryPointerBody")}</p>
            </div>
            <p className="vendor-index-pointer">
              <Link href="/industry" className="btn btn-secondary">
                {t("industryPointerLink")}
              </Link>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
