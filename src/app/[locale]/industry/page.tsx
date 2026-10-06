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
import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import HubSearch from "@/components/HubSearch";
import SiteFooter from "@/components/SiteFooter";
import ScrollToTop from "@/components/ScrollToTop";
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
// Wave I of Round 1 (2026-10-06): the entrances before the chronology (E9), the Brazilian entrance (E14), the
// era navigator (E13), the featured rabbit holes and "Surprise me" (E16), People under Industry (G3) and the
// link to how the research is done (E18).
import { INDUSTRY_ERAS } from "@/content/vendors/eras";
import SurpriseMe from "@/components/SurpriseMe";
import { GLOSSARY } from "@/content/glossary/glossary";
import { MILESTONES } from "@/content/milestones/milestones";
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
  const tp = await getTranslations("partnerVendors");
  /* `backToTop` lives in the tools namespace and is shared by every long page
     that carries this control - Tools, Learn and the vendor hubs. Reading it
     from there rather than copying the string into a second namespace keeps one
     translation for one control, which is what check-message-parity is for. */
  const tTools = await getTranslations("tools"); // partner cards + section headings
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
    /** The company `founded` belongs to, where that is not this card's own
     *  subject. Carried through so the timeline cannot show a bare year that
     *  implies the wrong company was founded then (PRIME 2026-10-02). Career
     *  chapters never set it. */
    foundedCompany?: string;
    /** Where this card's story starts, when earlier than its own subject's
     *  founding. Drives the timeline position (PRIME 2026-10-02) and is shown
     *  on the card, so the reader can see why a 1986 company sits at 1886. */
    storyBegins?: { year: number; company: string };
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
    isCurrent: boolean;
    isWorksWith: boolean;
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
    /** E9's lineage cut: the record carries typed acquisitions, an ending or a story that begins before the
     *  company; the data-lineage attribute the filter reads. */
    hasLineage: boolean;
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
      foundedCompany: v.foundedCompany,
      storyBegins: v.storyBegins,
      ended: v.ended,
      // Company histories live under /industry (PRIME 2026-07-29); the career
      // chapters below keep /industry/chapters, because those are a different kind
      // of page about a different subject.
      href: `/industry/${v.slug}`,
      tags: v.tags ?? [],
      hasLineage: Boolean((v.acquisitions?.length ?? 0) > 0 || v.ended || v.storyBegins),
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
      /* Present tense, and rendered differently: see VendorRelationship. */
      isCurrent: v.relationships?.includes("works-inside") ?? false,
      /* Active relationship NOW, and deliberately not the same claim as
         `authorized-instructor`: seven vendors are worked with, four are
         taught. See VendorRelationship. */
      isWorksWith: v.relationships?.includes("works-with") ?? false,
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
    isCurrent:
      partnerVendors.find((p) => p.slug === v.slug)?.relationships?.includes("works-inside") ??
      false,
    isWorksWith:
      partnerVendors.find((p) => p.slug === v.slug)?.relationships?.includes("works-with") ??
      false,
    isDirect:
      partnerVendors
        .find((p) => p.slug === v.slug)
        ?.relationships?.includes("worked-with-directly") ?? false,
    hasLineage: false,
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
    // TIMELINE POSITION (PRIME 2026-10-02): a card sits where its STORY starts,
    // not where its own subject was founded, so unisys stays at 1886 (Burroughs)
    // while its card correctly states 1986. storyStart() is the single
    // definition; three other call sites read the same one.
    (a, b) =>
      ((a.storyBegins?.year ?? a.founded) ?? 9999) -
        ((b.storyBegins?.year ?? b.founded) ?? 9999) || a.name.localeCompare(b.name),
  );

  // THE ENTRANCES' FIGURES (E9, E14, G3; 2026-10-06), counted from the same list the timeline renders.
  const storyYear = (v: TimelineEntry) => v.storyBegins?.year ?? v.founded ?? 9999;
  const nAll = lineageTimeline.length;
  const nLineage = lineageTimeline.filter((v) => v.hasLineage).length;
  const nBrazil = lineageTimeline.filter((v) => VENDOR_ORIGINS[v.slug] === "BR").length;
  const nMine = lineageTimeline.filter((v) => v.isInside || v.isDirect || v.isCurrent || v.isWorksWith).length;
  const nPeople = GLOSSARY.filter((e) => e.person).length;
  // The eras with their anchors resolved to the milestones' titles and links, so a pressed era shows where it opens.
  const eras = INDUSTRY_ERAS.map((e) => ({
    key: e.key,
    label: ti(`eras.${e.key}.title`),
    from: e.from,
    to: e.to,
    anchors: e.anchors
      .map((slug) => MILESTONES.find((m) => m.slug === slug))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => ({ title: `${m.year}: ${m.title}`, href: `/${locale}/industry/milestones/#${m.slug}` })),
  }));

  // THE FEATURED RABBIT HOLES (E16), chosen by the data rather than by taste: the longest typed acquisition
  // chain; the company whose record ends inside another with the densest lineage prose; and the Brazilian
  // record with the densest lineage prose. Counted here at build time from partners.ts, so the three doors
  // move when the data does. Lineage prose is counted by the verbs of ownership change in the body.
  const lineageVerbs = /\b(acquired|acquisition|renamed|spun off|spin-off|merged|merger|bought|sold to|divested)\b/gi;
  const density = (slug: string) => {
    const pv = partnerVendors.find((p) => p.slug === slug);
    const text = [pv?.intro ?? "", ...(pv?.body ?? [])].join(" ");
    return (text.match(lineageVerbs) ?? []).length;
  };
  const chainLength = (slug: string) => partnerVendors.find((p) => p.slug === slug)?.acquisitions?.length ?? 0;
  const longestChain = [...lineageTimeline].sort((a, b) => chainLength(b.slug) - chainLength(a.slug) || density(b.slug) - density(a.slug))[0];
  const endedDensest = [...lineageTimeline].filter((v) => v.ended && v.slug !== longestChain?.slug).sort((a, b) => density(b.slug) - density(a.slug))[0];
  const brazilDensest = [...lineageTimeline].filter((v) => VENDOR_ORIGINS[v.slug] === "BR" && v.slug !== longestChain?.slug && v.slug !== endedDensest?.slug).sort((a, b) => density(b.slug) - density(a.slug))[0];
  const doors = [
    longestChain ? { key: "chain", entry: longestChain, figure: chainLength(longestChain.slug) } : null,
    endedDensest ? { key: "ended", entry: endedDensest, figure: endedDensest.ended?.year ?? 0 } : null,
    brazilDensest ? { key: "brazil", entry: brazilDensest, figure: storyYear(brazilDensest) } : null,
  ].filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
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
            <p className="page-hero-lede">
              {ti("lede")}
            </p>
            {/* The scoped search field (wave 0, 2026-10-05; SCOUT E10): opens the one dialog inside the Explore world. */}
            <div style={{ marginBottom: "2.5rem" }}>
              <HubSearch scope="explore" label={ti("hubSearch.label")} placeholder={ti("hubSearch.placeholder")} examplesLabel={ti("hubSearch.examples")} examples={["Cabletron", "Bay Networks", "Juniper", "Netscreen", "Wellfleet", "3Com"]} />
            </div>

            {/* FIVE ENTRANCES BEFORE THE CHRONOLOGY (E9, SCOUT, adopted 2026-10-06), the Brazilian one among them
                (E14) and People beside them (G3): each is a filtered view of the timeline below WITH AN ADDRESS
                (the filter reads ?mode=, ?country= and ?era= after mount), or a page of its own. Then "Browse all",
                the three doors the data chose (E16) with "Surprise me", and the line that says how the research
                is done (E18). Counts from the list the timeline renders. */}
            <section className="industry-entrances" aria-labelledby="industry-entrances-title">
              <h2 className="section-title hub-h2" id="industry-entrances-title">{ti("entrances.title")}</h2>
              <p className="hub-lede">{ti("entrances.lede", { count: nAll })}</p>
              <ul className="industry-entrance-grid">
                <li>
                  <a href="#hub-search-explore" className="industry-entrance">
                    <span className="industry-entrance-title">{ti("entrances.company.title")}</span>
                    <span className="industry-entrance-lede">{ti("entrances.company.lede")}</span>
                  </a>
                </li>
                <li>
                  <a href={`/${locale}/industry/?mode=lineage#timeline`} className="industry-entrance">
                    <span className="industry-entrance-title">{ti("entrances.lineage.title")}</span>
                    <span className="industry-entrance-lede">{ti("entrances.lineage.lede", { count: nLineage })}</span>
                  </a>
                </li>
                <li>
                  <a href="#eras" className="industry-entrance">
                    <span className="industry-entrance-title">{ti("entrances.era.title")}</span>
                    <span className="industry-entrance-lede">{ti("entrances.era.lede", { count: INDUSTRY_ERAS.length })}</span>
                  </a>
                </li>
                <li>
                  <a href={`/${locale}/industry/?country=BR#timeline`} className="industry-entrance industry-entrance--brazil">
                    <span className="industry-entrance-title">{ti("entrances.brazil.title")}</span>
                    <span className="industry-entrance-lede">{ti("entrances.brazil.lede", { count: nBrazil })}</span>
                  </a>
                </li>
                <li>
                  <a href={`/${locale}/industry/?mode=career#timeline`} className="industry-entrance">
                    <span className="industry-entrance-title">{ti("entrances.mine.title")}</span>
                    <span className="industry-entrance-lede">{ti("entrances.mine.lede", { count: nMine })}</span>
                  </a>
                </li>
                <li>
                  <Link href="/people" className="industry-entrance">
                    <span className="industry-entrance-title">{ti("entrances.people.title")}</span>
                    <span className="industry-entrance-lede">{ti("entrances.people.lede", { count: nPeople })}</span>
                  </Link>
                </li>
              </ul>
              <p className="industry-entrance-all">
                <a href="#timeline" className="industry-entrance-all-link">{ti("entrances.browseAll", { count: nAll })} &#8594;</a>
                <Link href="/industry/method" className="industry-entrance-method">{ti("entrances.method")} &#8594;</Link>
              </p>
              {/* THE DOORS THE DATA CHOSE (E16) and a random one. */}
              {doors.length > 0 && (
                <div className="industry-doors">
                  <h3 className="industry-doors-title">{ti("doors.title")}</h3>
                  <ul className="industry-door-list">
                    {doors.map((d) => (
                      <li key={d.key}>
                        <Link href={d.entry.href} className="industry-door">
                          <span className="industry-door-kicker">{ti(`doors.${d.key}`, { n: d.figure })}</span>
                          <span className="industry-door-name">{d.entry.name.split(/\s[-\u2013\u2014]\s/)[0]}</span>
                          <span className="industry-door-lede">{d.entry.tagline}</span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <SurpriseMe slugs={lineageTimeline.map((v) => v.slug)} locale={locale} label={ti("doors.surprise")} hint={ti("doors.surpriseHint", { count: nAll })} />
                    </li>
                  </ul>
                </div>
              )}
            </section>

            {/* TWO PATHS THROUGH THE RECORD (2026-10-05; SCOUT E15 and G10, wave I's cheapest pieces). Two quiet
                cards, not a strip: "The chapters I lived" as an editorial path to /industry/chapters (the record
                read from the inside, chronological, a different thing from the author-credibility strip PRIME moved
                to the home page on 2026-08-06, which argued about the author rather than the industry), and "Where
                the industry learns" as a specialised path to /industry/learning (whose portal card PRIME moved to
                /learn on 2026-09-11; this is a path inside the record, not the advertisement that left). Counts
                computed from the registries. If PRIME would rather not re-link either from here, these two cards
                are the whole change. */}
            <div className="learn-portal-grid learn-portal-grid-wide" style={{ marginBottom: "2.5rem" }}>
              <Link href="/industry/chapters" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9679;</span>
                <p className="learn-portal-title">
                  {ti("paths.chaptersTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{ti("paths.chaptersLede", { count: CAREER_VENDORS.length })}</p>
              </Link>
              <Link href="/industry/learning" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-success)" } as CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {ti("paths.learningTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{ti("paths.learningLede", { count: partnerVendors.filter((v) => (v.tags as readonly string[]).includes("training")).length })}</p>
              </Link>
            </div>

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
            {/* MOVED AND RESTYLED 2026-08-11 (PRIME). It sat inside the <ol>,
                pressed against the filters. It is now above the section
                divider, with its own spacing, and carries `industry-antecedent`
                - a DIFFERENT accent from everything below it, because what it
                links to precedes every company on this page rather than sitting
                beside them. */}
            <p className="industry-antecedent">
              <Link className="page-jump-link" href="/industry/milestones">
                {tTags("milestonesLink")} <span aria-hidden="true">&#8594;</span>
              </Link>
            </p>
            {/* The learning-institutions link moved to /learn as a portal card
                (PRIME 2026-09-11). /industry/learning still exists and is still
                reachable; it is simply advertised from the page about learning
                rather than from the page about vendors. */}

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
                lineage: tp("filterLineage"),
                countryLabel: tp("filterCountryLabel"),
                eraLabel: ti("eras.label"),
                eraAnchors: ti("eras.anchors"),
                /* Passed with the {n} placeholder intact: only the browser knows the count it measured, and
                   the message is a plain template rather than ICU so the client can fill it without a
                   formatter (ICU parity still holds: the key has no plural, just a number). */
                eraUndated: ti("eras.undated", { n: "{n}" }),
              }}
              eras={eras}
              /* Counts computed from the same map the cards render, so a chip
                 cannot claim a number the timeline then contradicts. */
              countries={Object.entries(
                lineageTimeline.reduce<Record<string, number>>((acc, v) => {
                  const c = VENDOR_ORIGINS[v.slug];
                  if (c) acc[c] = (acc[c] ?? 0) + 1;
                  return acc;
                }, {}),
              )
                .map(([code, n]) => ({ code, n, label: countryLabel(code as never) }))
                /* ALPHABETICAL BY ISO CODE (PRIME 2026-08-11). Was count
                   descending, which put the US and Brazil first and made the
                   row an implicit ranking - a reader looking for one country
                   had to scan rather than jump. The CODE is what the button
                   displays, so sorting by anything else (the full name, the
                   count) would leave the visible labels out of order. */
                .sort((x, y) => x.code.localeCompare(y.code))}
            />

            <ol className="vendor-timeline" id="timeline">
              {/* Filter chips. These lead to tag-filtered views of the same
                  data, which is how the distributor and reseller pages PRIME
                  asked for are built - as views rather than as lists somebody
                  maintains. Counts are computed, so a chip cannot claim a
                  number the page then contradicts. */}
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
                  data-career={v.isInside || v.isDirect || v.isCurrent || v.isWorksWith ? "1" : "0"}
                  data-relationship={v.isCurrent ? "current" : v.isWorksWith ? "workswith" : v.isInside ? "inside" : v.isDirect ? "alongside" : undefined}
                  /* Space-separated so the client filter can match without
                     parsing JSON in the DOM. */
                  data-tags={(v.tags ?? []).join(" ")}
                  data-teach={v.isInstructor ? "1" : "0"}
                  /* The country filter reads this rather than re-deriving
                     it, so the chip and the card can never disagree. */
                  data-country={VENDOR_ORIGINS[v.slug] ?? ""}
                  /* The story year the gutter shows, for the era navigator; the lineage flag for its cut. A record
                     with no dated start (Sisco, whose founding year the sources do not give) carries no
                     data-year at all, so the navigator counts it as undated rather than placing it in an era
                     it cannot assert (the method page's rule on uncertain dates). */
                  data-year={storyYear(v) === 9999 ? undefined : storyYear(v)}
                  data-lineage={v.hasLineage ? "1" : "0"}
                >
                  {/* The gutter marks the card's POSITION, which is where its
                      story starts - otherwise a card sorted at 1886 would be
                      labelled 1986 in the margin beside it. The card itself
                      states its own subject's founding, below. */}
                  <span className="vendor-timeline-year mono" aria-hidden="true">
                    {v.storyBegins?.year ?? v.founded}
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
                      {/* WHOSE YEAR IS THIS (PRIME 2026-10-02): on a card that
                          covers several companies, or whose subject was renamed
                          from an earlier one, the year belongs to a company the
                          card is not named for. Saying so beside the year is the
                          whole point of the ruling: a bare "1895" on "Nortel &
                          Bay Networks" tells the reader something false. */}
                      {/* WHERE THE STORY STARTS (PRIME 2026-10-02): this card
                          sorts at an earlier year than it states, so it names the
                          predecessor that year belongs to. Without this the
                          timeline position would be unexplained. */}
                      {v.storyBegins && (
                        <span className="vendor-card-founded-company">
                          <span className="vendor-card-founded-company-label">
                            {tp("storyBeginsLabel")}
                          </span>
                          {`${v.storyBegins.year}, ${v.storyBegins.company}`}
                        </span>
                      )}
                      {v.foundedCompany && (
                        <span className="vendor-card-founded-company">
                          <span className="vendor-card-founded-company-label">
                            {tp("foundedCompanyLabel")}
                          </span>
                          {v.foundedCompany}
                        </span>
                      )}
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
                      {/* linked={false}: this pill sits INSIDE the card's <a>. A link inside a link is invalid
                          HTML; the browser breaks the outer anchor around it, the DOM no longer matches what
                          React rendered, and every /industry load logged React #418 (confirmed live 2026-10-05
                          14:24, fixed here). The brand keeps its mark; the card is the link. */}
                      {v.isRedu && (
                        <span className="vendor-partner-pill"><ReduBrand linked={false}>{tp("reduPill")}</ReduBrand></span>
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
                      {/* CURRENT EMPLOYER (PRIME 2026-08-11): red rather than
                          cyan, present tense, and the card border follows it.
                          Red is this site's own brand colour for Red Education
                          and is used nowhere else on the timeline, so the one
                          company he works at now is the one card that carries
                          it. */}
                      {v.isCurrent && (
                        <span className="vendor-career-pill vendor-career-pill--current">
                          {tp("worksPill")}
                        </span>
                      )}
                      {/* ACTIVE RELATIONSHIP (PRIME 2026-08-11): green, present
                          tense, and separate from the instructor pill beside
                          it. A reader seeing WORKS WITH on Ping Identity and
                          nothing else learns exactly the right thing - there is
                          a relationship and there is no teaching claim. */}
                      {v.isWorksWith && (
                        <span className="vendor-career-pill vendor-career-pill--workswith">
                          {tp("worksWithPill")}
                        </span>
                      )}
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

      {/* BACK TO TOP (PRIME 2026-08-11), the same component Tools, Learn and the
          vendor hubs use, with the same translated label - so the control a
          reader learns on one long page is the control they find on this one. */}
      <ScrollToTop label={tTools("backToTop")} />
    </>
  );
}
