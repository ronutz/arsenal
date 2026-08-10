// ============================================================================
// src/app/[locale]/industry/page.tsx
// ----------------------------------------------------------------------------
// THE INDUSTRY HUB (PRIME directive 2026-07-15) - the discoverable, top-level
// front door to the deep-research vendor histories: eight career pages
// (/industry/chapters/<slug>), the Red Education training partners, and the wider
// industry lineage pages (/industry/chapters/<slug>).
//
// Rationale: the research previously surfaced only through the About section
// index (/industry/chapters), which visitors did not find. This hub gives it a
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
import ReduBrand from "@/components/ReduBrand";
import { partnerVendors } from "@/content/vendors/partners";
import { TAG_ROUTES, vendorsByTag } from "@/content/vendors/partners";
import { CAREER_VENDORS } from "@/content/vendors/career";
// Country of origin per entry, and the flag computed from the ISO code rather
// than stored (PRIME 2026-08-06). See origins.ts for what "origin" means here:
// where the company was FOUNDED, not where it is domiciled or who owns it now.
import { VENDOR_ORIGINS, countryLabel } from "@/content/vendors/origins";
import CountryFlag from "@/components/CountryFlag";

import TimelineFilter from "@/components/TimelineFilter";
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

  const t = await getTranslations("vendors");
  const tTags = await getTranslations({ locale, namespace: "industryTags" }); // career card copy (name/years/tagline)
  const tSources = await getTranslations({ locale, namespace: "sources" }); // reference works link
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
    /** Red Education is a partner of this vendor.
     *  SOURCE CHANGED 2026-08-02: this used to be derived from the `group`
     *  field being "redu", which was a PROXY and therefore wrong at the edges -
     *  the partner list and the group membership had drifted apart, and the
     *  timeline was showing whichever the group happened to say. It now reads
     *  the explicit `relationships` declaration, so the pill states a fact
     *  somebody wrote down rather than one inferred from a category. */
    /** Category keys from the entry's own tags, for the category pills. */
    tags: readonly string[];
    isRedu: boolean;
    /** PRIME is an authorised instructor for this vendor.
     *  A PUBLIC CLAIM ABOUT AUTHORISATION. Four vendors only, and it must never
     *  be inferred from partnership, certification or a delivered course. */
    isInstructor: boolean;
    /** A chapter this career was lived inside.
     *  These two are INDEPENDENT, not alternatives: nine companies are both,
     *  and modelling them as one category meant only one pill could ever
     *  show (PRIME 2026-07-28). */
    // TWO SEPARATE CLAIMS (2026-08-05, PRIME). Employment and partnership are
    // different relationships and were being rendered as one pill.
    isInside: boolean;
    isDirect: boolean;
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
      // chapters below keep /industry/chapters, because those are a different kind
      // of page about a different subject.
      href: `/industry/${v.slug}`,
      tags: v.tags ?? [],
      isRedu: v.relationships?.includes("red-education-partner") ?? false,
      isInstructor: v.relationships?.includes("authorized-instructor") ?? false,
      // FIXED 2026-08-04 (PRIME spotted it on one card; it affected all
      // sixteen). This was hardcoded `false`, which killed the career chip
      // site-wide on 2026-07-29 when the dedup landed: that change made the
      // career branch always empty - correctly, since every career vendor now
      // has a partner entry - so EVERY card comes from this branch, and this
      // branch never asked whether the company had a career chapter.
      //
      // The dedup removed duplicate cards and took the chip with them. Nobody
      // noticed for a week, because a missing chip looks like a company you
      // simply did not work at.
      //
      // CHANGED 2026-08-05 (PRIME): no longer inferred from careerChapter.
      // Having a career chapter says a company is part of the record; it does
      // not say he was employed there. Eleven of the sixteen were partners,
      // resellers or vendors he worked with from a distributor - and five of
      // those should carry no working claim at all. The pill now reads the
      // declared relationship.
      isInside: v.relationships?.includes("worked-inside") ?? false,
      isDirect: v.relationships?.includes("worked-with-directly") ?? false,
    }));

  // CAREER VENDORS WITHOUT AN INDUSTRY ENTRY ARE SKIPPED (2026-08-02).
  // This timeline is company histories, and every card links to one. When the
  // combined FireEye/McAfee/Ixia entry was dissolved, its career vendor stayed
  // in the career list - and this branch happily rendered a card pointing at a
  // company page that no longer existed. A 404 reachable from the timeline,
  // introduced by a deletion that was otherwise correct.
  //
  // The chapter itself is NOT orphaned: the two entries that inherited its
  // subject matter both link to it, which is where a reader should meet it.
  const fromCareer: TimelineEntry[] = CAREER_VENDORS.filter((v) =>
    partnerVendors.some((p) => p.slug === v.slug),
  ).map((v) => ({
    slug: v.slug,
    name: t(`${v.key}.name`),
    tagline: t(`${v.key}.tagline`),
    founded: v.founded,
    // Career vendors read their category tags from the matching industry entry,
    // so a company shows the same pills wherever it is rendered from.
    tags: partnerVendors.find((p) => p.slug === v.slug)?.tags ?? [],
    href: `/industry/${v.slug}`,
    // SINGLE SOURCE (2026-08-02): both branches read the same `relationships`
    // declaration. This one used to consult its own hardcoded list, so the
    // timeline could say one thing for a company reached as a partner and
    // another for the same company reached as a career chapter. Two lists
    // describing one fact is exactly how they drifted apart.
    isRedu:
      partnerVendors.find((p) => p.slug === v.slug)?.relationships?.includes(
        "red-education-partner",
      ) ?? false,
    isInstructor:
      partnerVendors.find((p) => p.slug === v.slug)?.relationships?.includes(
        "authorized-instructor",
      ) ?? false,
    isInside:
      partnerVendors.find((p) => p.slug === v.slug)?.relationships?.includes("worked-inside") ??
      false,
    isDirect:
      partnerVendors
        .find((p) => p.slug === v.slug)
        ?.relationships?.includes("worked-with-directly") ?? false,
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

            {/* The career chip strip MOVED TO THE HOMEPAGE (PRIME 2026-08-06),
                where it now sits inside the credibility section, between the
                "not sold" claim and the link to /about. The reasoning is that
                the strip is an argument about the AUTHOR rather than about the
                industry: it belongs where a first-time reader is deciding
                whether to trust the site, not partway down a lineage index they
                reached deliberately. This page keeps the timeline, which is the
                thing it is actually for; the career chapters remain reachable
                from the homepage strip, from /industry/chapters, and from the
                "Rodolfo's chapter" markers on the individual vendor pages. */}


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
              <p className="vendor-divider-note">
                <ReduBrand>{tp("timelineSectionNote")}</ReduBrand>
              </p>
            </div>
            {/* FILTERS (PRIME 2026-08-06). Three cuts through one list:
                who Red Education partners with, which chapters were lived
                from inside, and which platforms are actually taught. That
                last is FOUR - F5, Fortinet, Netskope, Extreme - and
                deliberately not six: Ping Identity and Zscaler are Red
                Education partners this site works alongside, and carry no
                authorized-instructor claim. */}
            <TimelineFilter
              labels={{
                show: tp("filterLabel"),
                all: tp("filterAll"),
                redu: tp("filterRedu"),
                career: tp("filterCareer"),
                teach: tp("filterTeach"),
                count: tp("filterCount", { shown: "{shown}", total: "{total}" }),
                categoryLabel: tTags("filterCategoryLabel"),
                categoryAll: tTags("filterCategoryAll"),
                categoryNone: tTags("filterCategoryNone"),
              }}
              /* Categories come from the SAME source the tag routes use, so the
                 in-page filter and /industry/<tag> can never disagree about
                 which categories exist or how many entries each holds. */
              categories={Object.values(TAG_ROUTES)
                .map((tag) => ({
                  tag,
                  label: tTags(`${tag}.short`),
                  n: vendorsByTag(tag).length,
                }))
                .filter((c) => c.n > 0)}
            />
            {/* KEY FOR THE TWO CAREER MARKERS (PRIME 2026-08-10). The pills
                and card borders now distinguish a company he was employed by
                from one he worked alongside, and a colour with no key is a
                colour a reader has to guess at. Placed above the list rather
                than below it, because the distinction is needed while reading
                the cards and not after. */}
            <p className="section-body">{ti("careerNote")}</p>

            <ol className="vendor-timeline">
              {/* Filter chips. These lead to tag-filtered views of the same
                  data, which is how the distributor and reseller pages PRIME
                  asked for are built - as views rather than as lists somebody
                  maintains. Counts are computed, so a chip cannot claim a
                  number the page then contradicts. */}
              {/* The milestones page is the other half of this story - the
                  physics the companies were built on. Linked first, before the
                  tag filters, because it is a different KIND of thing rather
                  than another filter. */}
              <p className="ztc-notes">
                <Link className="page-jump-link" href="/industry/milestones">
                  {tTags("milestonesLink")} <span aria-hidden="true">&#8594;</span>
                </Link>
              </p>


              <div className="industry-tag-chips">
                {Object.entries(TAG_ROUTES).map(([route, tag]) => {
                  const n = vendorsByTag(tag).length;
                  if (n === 0) return null;
                  return (
                    <Link className="industry-tag-chip" href={`/industry/${route}`} key={route}>
                      {tTags(`${tag}.short`)}
                      <span className="industry-tag-chip-n mono">{n}</span>
                    </Link>
                  );
                })}
              </div>

              {lineageTimeline.map((v) => (
                <li
                  key={v.slug}
                  className="vendor-timeline-item"
                  data-vendor-entry
                  data-redu={v.isRedu ? "1" : "0"}
                  data-career={v.isInside || v.isDirect ? "1" : "0"}
                  data-relationship={
                    v.isInside ? "inside" : v.isDirect ? "alongside" : undefined
                  }
                  /* Space-separated so the client filter can match without
                     parsing JSON in the DOM. */
                  data-tags={(v.tags ?? []).join(" ")}
                  data-teach={v.isInstructor ? "1" : "0"}
                >
                  <span className="vendor-timeline-year mono" aria-hidden="true">
                    {v.founded}
                  </span>
                  <Link href={v.href} className="vendor-card">
                    {/* METADATA LINE (PRIME 2026-08-06): years first, a spaced
                        separator, then the origin labelled and carrying an
                        inline SVG flag.

                        THE FLAG IS SVG, NOT EMOJI. Windows ships no country
                        flag glyphs, so emoji rendered as the bare regional
                        indicator letters for most of this site's desktop
                        readers. See CountryFlag.tsx for why inline rather than
                        files or a sprite CDN.

                        The code and name stay beside the flag rather than
                        being replaced by it: at 18x12 a flag is recognisable
                        to somebody who already knows it and meaningless to
                        everybody else, so the text carries the information and
                        the flag carries the glance. */}
                    <span className="vendor-card-years mono">
                      {v.ended
                        ? tp("timelineSpan", { from: v.founded, to: v.ended.year })
                        : tp("timelineSince", { from: v.founded })}
                      {VENDOR_ORIGINS[v.slug] && (
                        <span className="vendor-card-origin">
                          <span className="vendor-card-origin-label">
                            {tp("originLabel")}
                          </span>
                          <CountryFlag code={VENDOR_ORIGINS[v.slug]} />
                          {countryLabel(VENDOR_ORIGINS[v.slug])}
                        </span>
                      )}
                    </span>
                    <span className="vendor-card-name">
                      {v.name}
                      {v.isRedu && (
                        <span className="vendor-partner-pill"><ReduBrand>{tp("reduPill")}</ReduBrand></span>
                      )}
                      {v.isInstructor && (
                        <span className="vendor-instructor-pill">{tp("instructorPill")}</span>
                      )}
                      {/* TWO RELATIONSHIPS, TWO COLOURS (PRIME 2026-08-10).
                          These carried the same class and therefore the same
                          colour, so a reader could not tell a company he was
                          EMPLOYED BY from one he worked alongside - a
                          distinction the data has always held and the page
                          never showed. Inside keeps the cyan accent; alongside
                          takes a cooler, quieter blue, and the card border
                          follows the pill so the difference survives a glance
                          at the grid. */}
                      {v.isInside && (
                        <span className="vendor-career-pill vendor-career-pill--inside">
                          {tp("careerPill")}
                        </span>
                      )}
                      {v.isDirect && (
                        <span className="vendor-career-pill vendor-career-pill--alongside">
                          {tp("workedWithPill")}
                        </span>
                      )}
                    </span>
                    {/* CATEGORY PILLS. These come from the entry's own `tags`,
                        which already carried the eight-category vocabulary -
                        vendor, services, training, standards, reseller,
                        distributor, carrier, datacentre - so this is a
                        presentation change rather than new data. Entries carry
                        more than one where they genuinely span categories, and
                        the labels are translated rather than showing the raw
                        tag key. */}
                    {v.tags.length > 0 && (
                      <span className="vendor-card-cats">
                        {v.tags.map((tag) => (
                          <span key={tag} className="vendor-cat-pill">
                            {tp(`cat.${tag}`)}
                          </span>
                        ))}
                      </span>
                    )}
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
