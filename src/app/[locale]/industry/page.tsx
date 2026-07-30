// ============================================================================
// src/app/[locale]/industry/page.tsx
// ----------------------------------------------------------------------------
// THE INDUSTRY HUB (PRIME directive 2026-07-15) - the discoverable, top-level
// front door to the deep-research vendor histories: eight career pages
// (/about/vendors/<slug>), the Red Education training partners, and the wider
// industry lineage pages (/about/vendors/<slug>).
//
// Rationale: the research previously surfaced only through the About section
// index (/about/vendors), which visitors did not find. This hub gives it a
// primary-nav home. The individual profile pages stay at their existing URLs;
// this page only links. The About index remains as the About-side entrance.
//
// ROUTING. "industry" is a static segment under [locale]; it is not a vendor
// key (f5/fortinet/netskope/extreme/zscaler/ping), so the namespace guard in
// scripts/check-vendor-namespace.mjs is satisfied. Statically generated per
// locale via the [locale] layout, like the other static pages.
//
// I18N. Card copy reuses the existing "vendors" (career cards) and
// "partnerVendors" (partner cards + section headings) namespaces, so the two
// indexes can never drift. Only the hero strings are new, under "industry"
// (authored en + pt-BR natively; other locales fall back per key).
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { partnerVendors } from "@/content/vendors/partners";
import { CAREER_VENDORS, REDU_CAREER_PARTNERS } from "@/content/vendors/career";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ti = await getTranslations({ locale, namespace: "industry" });
  return {
    title: ti("metaTitle"),
    description: ti("metaDescription"),
  };
}

export default async function IndustryHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vendors"); // career card copy (name/years/tagline)
  const tp = await getTranslations("partnerVendors"); // partner cards + section headings
  const ti = await getTranslations("industry"); // hub hero (new)
  const tNav = await getTranslations("nav");

  // One chronological list: the old "other" and "contemporary" groups merged
  // and sorted by founding year. Cards without a year sort last rather than
  // being dropped, so a missing year is visible instead of silent.
  // All three groups share one timeline (PRIME 2026-07-28). The Red Education
  // partners used to sit in a section of their own, which split the industry
  // into "companies whose training we deliver" and "everyone else" - a fact
  // about this site's commercial relationships, not about the industry. They
  // are marked with a pill instead, so the relationship is still visible
  // without carving the chronology in half to show it.
  // One timeline, built from BOTH sources so the chronology is complete
  // (PRIME 2026-07-27). Until now it drew only from the partner list, so the
  // fifteen companies this career ran through - Cabletron, Cisco, Juniper and
  // the rest - were absent from the industry's own chronology while having
  // chapters elsewhere on the site. A timeline of the industry that omits the
  // companies the author worked inside is not a timeline of the industry.
  //
  // The two sources carry different shapes, so they are normalised here rather
  // than in the markup: partner vendors bring their own name and tagline,
  // career vendors take theirs from the vendor i18n namespace.
  type TimelineEntry = {
    slug: string;
    name: string;
    tagline: string;
    founded?: number;
    /** Set only where the company stopped existing independently. Career
     *  chapters do not carry one - none of those companies has ended. */
    ended?: { year: number; note: string };
    href: string;
    /** Red Education delivers this vendor's authorized training. */
    isRedu: boolean;
    /** A chapter this career was lived inside.
     *  These two are INDEPENDENT, not alternatives: nine companies are both,
     *  and modelling them as one category meant only one pill could ever
     *  show (PRIME 2026-07-28). */
    isCareer: boolean;
  };

  const fromPartners: TimelineEntry[] = partnerVendors
    .filter(
      (v) => v.group === "other" || v.group === "contemporary" || v.group === "redu",
    )
    .map((v) => ({
      slug: v.slug,
      name: v.name,
      tagline: v.tagline,
      founded: v.founded,
      ended: v.ended,
      // Company histories live under /industry (PRIME 2026-07-29); the career
      // chapters below keep /about/vendors, because those are a different kind
      // of page about a different subject.
      href: `/industry/${v.slug}`,
      isRedu: v.group === "redu",
      isCareer: false,
    }));

  const fromCareer: TimelineEntry[] = CAREER_VENDORS.map((v) => ({
    slug: v.slug,
    name: t(`${v.key}.name`),
    tagline: t(`${v.key}.tagline`),
    founded: v.founded,
    href: `/industry/${v.slug}`,
    isRedu: REDU_CAREER_PARTNERS.includes(v.slug as (typeof REDU_CAREER_PARTNERS)[number]),
    isCareer: true,
  }));

  // DEDUPLICATED 2026-07-29. Step 4 converted all fifteen career vendors into
  // partnerVendors entries so their histories render from the shared route -
  // which means every one of them is now in BOTH lists, and merging the two
  // put each on the timeline twice. Combined with the career chips above, the
  // built page showed fifteen companies three times each.
  //
  // The partner entry is the better source: it carries the founding year, the
  // end year where there is one, the structured acquisitions, and a
  // careerChapter field with the years and a link back. So a career entry is
  // only included when no partner entry exists for that slug - which today is
  // none of them, and the filter is kept because the next vendor added to
  // CAREER_VENDORS should appear until its history is written.
  const partnerSlugs = new Set(fromPartners.map((v) => v.slug));
  const careerOnly = fromCareer.filter((v) => !partnerSlugs.has(v.slug));
  const lineageTimeline: TimelineEntry[] = [...fromPartners, ...careerOnly].sort(
    (a, b) => (a.founded ?? 9999) - (b.founded ?? 9999) || a.name.localeCompare(b.name),
  );

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: tNav("industry") },
              ]}
            />

            {/* Hero: mirrors the vendor-hub hero treatment. */}
            <p className="hero-eyebrow">{ti("eyebrow")}</p>
            <h1 className="page-hero-title">{ti("title")}</h1>
            <p className="page-hero-lede" style={{ marginBottom: "2.5rem" }}>
              {ti("lede")}
            </p>

            {/* Career vendors (worked with, 1996-2020, chronological). */}
            {/* Career vendors as a compact chronological CHIP STRIP (Option B,
                PRIME-ratified 2026-07-16): the encyclopedia keeps the partners
                and pioneers as full cards; the personal record renders as slim
                chips linking to the career pages, whose timelines carry the
                "Rodolfo's chapter" markers. Full telling: /about/vendors. */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{ti("careerStripTitle")}</h2>
              <p className="vendor-divider-note">{ti("careerStripNote")}</p>
            </div>
            <ul className="career-strip">
              {CAREER_VENDORS.map((v) => (
                <li key={v.slug}>
                  {/* Career chips point at the CAREER CHAPTERS, per the note
                      above. They were repointed to /industry during the step-2
                      move, when the career pages briefly lived there; step 3
                      put them back at /about/vendors, so these follow. */}
                  <Link href={`/about/vendors/${v.slug}`} className="career-chip">
                    <span className="career-chip-name">{t(`${v.key}.name`)}</span>
                    <span className="career-chip-years mono">{t(`${v.key}.years`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="vendor-index-pointer">
              <Link href="/about/vendors" className="btn btn-secondary">
                {ti("careerStripLink")}
              </Link>
            </p>


            {/* ---- The lineage timeline (PRIME 2026-07-27) ----
                 This replaced two sections, "the contemporaries - still writing
                 their chapters" and "other vendors - lineages of the pioneers".
                 The split did not survive contact with the facts: several
                 vendors filed under "other" are demonstrably still trading, so
                 the two labels described the same thing twice and forced a
                 judgement call on every new card.

                 Ordering by founding year removes the judgement entirely. A
                 founding year is a fact, it is already in each profile's own
                 sourced timeline, and it puts the story in the order it
                 happened - which is what a lineage page is for. Cards carry an
                 end marker only where the company stopped existing
                 independently; its absence correctly reads as "still here". */}
            <div className="vendor-divider">
              <h2 className="vendor-divider-title">{tp("timelineSectionTitle")}</h2>
              <p className="vendor-divider-note">{tp("timelineSectionNote")}</p>
            </div>
            <ol className="vendor-timeline">
              {lineageTimeline.map((v) => (
                <li key={v.slug} className="vendor-timeline-item">
                  <span className="vendor-timeline-year mono" aria-hidden="true">
                    {v.founded}
                  </span>
                  <Link href={v.href} className="vendor-card">
                    <span className="vendor-card-years mono">
                      {v.ended
                        ? tp("timelineSpan", { from: v.founded, to: v.ended.year })
                        : tp("timelineSince", { from: v.founded })}
                    </span>
                    <span className="vendor-card-name">
                      {v.name}
                      {v.isRedu && (
                        <span className="vendor-partner-pill">{tp("reduPill")}</span>
                      )}
                      {v.isCareer && (
                        <span className="vendor-career-pill">{tp("careerPill")}</span>
                      )}
                    </span>
                    <span className="vendor-card-tagline">{v.tagline}</span>
                    {v.ended && <span className="vendor-card-end">{v.ended.note}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
