// ============================================================================
// src/app/[locale]/about/page.tsx
// ----------------------------------------------------------------------------
// THE ABOUT / INSTRUCTOR PAGE — the authority centerpiece.
//
// SOURCING & EVIDENCE-GATING (per canon guardrails):
//   Every factual claim here traces to a verified project-knowledge source
//   (the CVs, the LinkedIn Profile.pdf, the Professional Experience timeline,
//   the F5/Extreme/Fortinet/Netskope certificates). The dev-only GAP flag that
//   marked unsubstantiated copy left on 2026-10-07 with its last use, the
//   platforms section the About Run Review folded into What I do now.
//
//   Guardrails actively applied (NOT copied from the older CVs, which violate
//   them): "Rodolfo Nützmann" never "Rod"; "since 1996" not "30+ years"; FOUR
//   pillars only (F5, Fortinet, Extreme Networks, Netskope) — Palo Alto / Ping
//   excluded; only Red Education named as a company; em-dash-free; no cadence
//   claims; credential-forward, no overclaiming. Testimonials are NOT included
//   here (they are verbatim-only and belong in their own reviewed component).
//
// All visible copy is localized via getTranslations (English base + fallback).
// This is a server component (static).
//
// THE ORDER (About Run Review, PRIME 2026-10-07 19:40, a12 with a08 declined):
// the name, the job line, the identity and the availability line; What I do
// now; Where it started; Why ronutz exists; How I work; the quote and the
// count; The path here (kept: PRIME declined a08); The History with the door to
// the career record; Inspect the record; Get in touch; Practicalities.
// ============================================================================

import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
// MARKS (PRIME 2026-10-04): the era-matched vendor wordmarks beside the platform cards and the timeline entries.
import VendorMark from "@/components/VendorMark";
import SiteFooter from "@/components/SiteFooter";
import { TESTIMONIALS } from "@/content/testimonials/data";
// E31 (SCOUT Round 1, wave A): the evidence block names its counts, every one computed from the registry it links
// to, never typed: the career chapters, the credentials, the endorsements, the courses, the posts, the sites.
import { CAREER_VENDORS } from "@/content/vendors/career";
import { CREDENTIAL_COUNT } from "@/content/certifications/data";
import { PLATFORMS, COURSE_COUNT } from "@/content/training/courses";
import { getAllPosts } from "@/lib/blog";
import { OLD_SITE_CLONES } from "@/content/about/old-sites";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const alt = "Rodolfo Nützmann";
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  //
  // The TITLE is separate from the card's alt text, and until 2026-08-16 this
  // page set only the card - so it inherited the site-wide default title, along
  // with nine other index pages. Ten of the most important pages on the site
  // shared one <title>, which is the single strongest on-page signal there is.
  return { title: t("metaTitle"), ...ogImages("page", "about", locale, alt) };
}

/** The three era chapters, now living under /about. */
const ERAS = [
  { slug: "pre-1996", key: "pre1996" },
  { slug: "1996-2020", key: "era19962020" },
  { slug: "2020-present", key: "era2020present" },
] as const;

/* --- FACT MARKS (PRIME 2026-09-09) ---
   Each fact card carries a small schematic mark drawn from that card's own
   content: two stacked documents for two citizenships, a stamp impression for
   travel permits, four speech strokes for four languages. (There were six cards
   under the hero until the About Run Review, 2026-10-07; the three that stayed
   are the Practicalities that close the page, and the crosshair, the meridian
   and the decision fork left with the cards they drew.)

   Deliberately line work rather than icon-set glyphs: this is an instructor's
   site and the visual vernacular is the diagram, not the pictogram.

   They are drawn with `currentColor` and inherit opacity from CSS rather than
   carrying their own colours, so they follow every curated theme (Obsidian,
   Daylight, Phosphor, Amber, Synthwave, Onyx HC) instead of hardcoding cyan and
   disappearing on the light ones.

   Decorative only: the card already states the fact in text, in sixteen
   locales, so the mark is aria-hidden and adds nothing for a screen reader. */
const FACT_MARKS: Record<string, React.ReactNode> = {
  // Citizenships - two documents, one behind the other. Two, not one, because
  // the fact is that there are two and they are separate.
  citizenships: (
    <>
      <rect x="8" y="10" width="26" height="36" rx="3" />
      <rect x="20" y="16" width="26" height="36" rx="3" />
      <path d="M26 26h14M26 33h14M26 40h9" />
    </>
  ),
  // Travel permits - a stamp impression: the border of the die and the
  // diagonal band it leaves. The fact is about admissibility, and this is what
  // admissibility looks like in a passport.
  permits: (
    <>
      <rect x="7" y="13" width="42" height="30" rx="4" />
      <path d="M12 38 44 18" />
      <path d="M14 24h12M30 34h12" />
    </>
  ),
  // Languages - four speech strokes at four sizes, one per language, ordered
  // the way the card orders them: native first, then fluent, then the two in
  // progress. The count is the content.
  languages: (
    <>
      <path d="M6 14h28v18H16l-8 7v-7H6Z" />
      <path d="M22 22h28v16H36l-7 6v-6h-7" />
      <path d="M14 44h10M30 48h8" />
    </>
  ),
};

/**
 * One decorative schematic mark for a fact card.
 *
 * @param name - key into FACT_MARKS; must match one of the three cards.
 */
function FactMark({ name }: { name: keyof typeof FACT_MARKS }) {
  return (
    <svg
      className="about-fact-mark"
      viewBox="0 0 56 56"
      aria-hidden="true"
      focusable="false"
    >
      {FACT_MARKS[name]}
    </svg>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  // The colophon's five principles, by key (E25): one source of truth for "How I work".
  const tColophon = await getTranslations("colophon_page");
  // The era caption the marks carry in their alt text (same string the career chapters print).
  const tMarks = await getTranslations("partnerVendors");
  const era = (e: string) => tMarks("markEra", { era: e });
  // "since {year}" in the page's language, for the marks still in use.
  const since = (y: number) => tMarks("markSince", { year: y });
  // Marks are dated: a current platform card shows the mark of this year, a timeline entry the mark of its first year.
  const thisYear = new Date().getFullYear();
  // The era copy keeps its own namespace: the strings did not move, only the
  // pages that render them.
  const tHistory = await getTranslations("history");
  const tNav = await getTranslations("nav");

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      {/* about-tight: section padding reduced to a third of the site
          default (PRIME 2026-08-06). Scoped to this page rather than changed
          on .section globally, because the instruction was about /about and a
          global change would have re-spaced every page on the site. */}
      <main id="main" className="about-tight">
        {/* --- HERO (About Run Review, PRIME 2026-10-07 19:40) ---
             The name, the job line (a01: the footer's words since 06/10), the identity sentence (a02: PRIME's own
             words) and one availability line (a04). The opening paragraph that used to follow the identity is gone
             (a03): the three eras further down tell the thirty years it summarised. The six fact cards that sat under
             the hero are gone from here too (a04): the three that are logistics (citizenships, travel permits,
             languages) close the page as Practicalities (a05), and what "Teaches" and "Offers" said is in What I do
             now. */}
        <section className="about-hero">
          <div className="container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">Rodolfo Nützmann</h1>
            <p className="about-role">{t("role")}</p>
            {/* E19 (SCOUT Round 1, wave A, 2026-10-05), worded by PRIME in the review (a02). */}
            <p className="about-identity">{t("identity")}</p>
            {/* a04: where he is, the two working languages, and that the work reaches anywhere. */}
            <p className="about-availability mono">{t("availability")}</p>
          </div>
        </section>

        {/* --- WHAT I DO NOW, WHERE IT STARTED, WHY RONUTZ EXISTS, HOW I WORK, THE QUOTE (wave A, 2026-10-05;
             About Run Review, 2026-10-07) ---
             E24: four lines, Build ronutz / Teach / Advise / Speak, each a door. Since the review, Teach carries the
             one line the platform cards used to fill (a06) and the door to how the courses are taught, and Advise the
             door to what the advisory covers (a07): the sections "The platforms, taught in depth", "How I teach" and
             "How I advise" are folded into these two lines. Speak names the facilitated sessions again (a11), which
             Speaking has carried since (s1). E22: the origin story opens the narrative. E21: why the site exists.
             E25: "How I work" reuses the colophon's five principles by their message keys. a10: the one broad quote,
             with the count of the endorsements it comes from, closes the block. */}
        <section className="section about-now-section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("doing.title")}</h2>
            <ul className="about-now-list">
              {(["build", "teach", "advise", "speak"] as const).map((k) => (
                <li key={k} className="about-now-item">
                  <Link href={k === "build" ? "/changelog" : k === "teach" ? "/training" : k === "advise" ? "/advisory" : "/speaking"} className="about-now-verb">{t(`doing.${k}.verb`)}</Link>
                  <span className="about-now-what">
                    {t(`doing.${k}.what`)}
                    {/* a06, a07: the four platforms in one line, and the door to how the courses are taught. */}
                    {k === "teach" && (
                      <span className="about-now-more">
                        {t("doing.teach.platforms")}{" "}
                        <Link href="/training">{t("approach.link")} <span aria-hidden="true">&#8594;</span></Link>
                      </span>
                    )}
                    {/* a07: the door to what the advisory covers. */}
                    {k === "advise" && (
                      <span className="about-now-more">
                        <Link href="/advisory">{t("advise.link")} <span aria-hidden="true">&#8594;</span></Link>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="section-title" style={{ marginTop: "3rem" }}>{t("origins.title")}</h2>
            <p className="section-body">{t("origins.body")}</p>

            <h2 className="section-title" style={{ marginTop: "3rem" }}>{t("why.title")}</h2>
            <p className="section-body">{t("why.body")}</p>

            <h2 className="section-title" style={{ marginTop: "3rem" }}>{t("how.title")}</h2>
            <p className="section-body">{t("how.body")}</p>
            <ul className="about-principles">
              {(["p1", "p2", "p3", "p4", "p5"] as const).map((pk) => (
                <li key={pk} className="about-principle">{tColophon(`${pk}Title`)}</li>
              ))}
            </ul>
            <p className="section-body"><Link href="/colophon">{t("how.link")} <span aria-hidden="true">&#8594;</span></Link></p>

            {/* THE QUOTE AND THE COUNT (a10). The featured endorsement (PRIME 2026-09-06) is rendered from the verbatim
                catalogue by record id, never as a copied string, so the site's one-source rule for testimonials holds.
                It sat beside "How I advise"; with that section folded it closes this block, and the line under it says
                how many endorsements it was chosen from, counted from the same catalogue, and opens them all. */}
            {(() => {
              const q = TESTIMONIALS.find((x) => x.id === "75");
              if (!q) return null;
              return (
                <figure className="about-featured-quote">
                  <blockquote className="about-featured-quote-text">
                    {q.text.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </blockquote>
                  <figcaption className="about-featured-quote-meta">
                    <span className="about-featured-quote-author">{q.author}</span>
                    {q.title ? <span className="about-featured-quote-title">{q.title}</span> : null}
                    <span className="about-featured-quote-source">
                      {q.source} &middot; {q.date}
                    </span>
                  </figcaption>
                </figure>
              );
            })()}
            <p className="about-quote-count mono">
              <Link href="/endorsements">{t("quoteCount", { count: TESTIMONIALS.length })} <span aria-hidden="true">&#8594;</span></Link>
            </p>
          </div>
        </section>

        {/* --- RECOGNITION: REMOVED, NOT MOVED (PRIME 2026-08-06) ---
             The instruction was to move the F5 DevCentral MVP section to the
             F5 training and F5 career pages, and to evaluate what those pages
             already said. They already say it, in both cases with more context
             than this section had:

               /industry/chapters/f5, section "The instructor's chair and
               DevCentral" - "F5's DevCentral community named Rodolfo an MVP
               three consecutive years, 2022 through 2024", sitting beside the
               instructor authorization and the twelve courses.

               /training, section "Recognized, certified, and current" - "F5
               DevCentral MVP for three consecutive years, in 2022, 2023, and
               2024", sitting beside the certifications and the delivery
               regions.

             It is also in the F5 vendor profile timeline and in the
             certifications data as a formal award record. Moving this section
             would have produced a FOURTH statement of the same fact. So it is
             deleted here rather than relocated, and the about page loses a
             claim it was making twice on the same site. */}

        {/* --- WHERE IT STARTED + THE PATH (PRIME 2026-08-06) ---
             One section, not two. "Where it started" moved up to sit directly
             above "The path here" with NO separator between them, because they
             are one continuous account: the origin and then the route from it.
             Two <section> wrappers would have drawn a divider between a
             sentence and its own continuation.

             They share a single container for that reason. The origin keeps an
             h2 because it now opens the account; the path follows it as a
             second h2 within the same block, which is correct - these are two
             headings of equal weight in one narrative, not a heading and a
             subheading. */}
        <section className="section">
          <div className="container section-narrow">
            {/* "Where it started" MOVED UP (E22, 2026-10-05): it now opens the page's narrative, right after what
                he does now, instead of sitting as a preface to the timeline. */}
            <h2 className="section-title">{t("path.title")}</h2>
            <p className="section-body" style={{ marginBottom: "2rem" }}>
              {t("path.intro")}
            </p>

            <ol className="about-timeline">
              <li className="about-era">
                <span className="about-era-years mono">1996 – 2000</span>
                {/* Cisco beside Cabletron (PRIME, 2026-10-04 21:25): Cabletron
                    sold Cisco's routing under its own name, Cisco IOS and the
                    2500/4000/4500 routing technology integrated across the
                    MMAC hub line (Cisco press release, 27 March 1995, read
                    2026-10-04), and the text says what that meant for the job. */}
                <span className="mark-row"><VendorMark vendor="cabletron" year={1996} eraLabel={era} since={since} compact /><VendorMark vendor="cisco" year={1996} eraLabel={era} since={since} compact /></span>
                <span className="about-era-where">Cabletron Systems · São Paulo</span>
                <span className="about-era-what">{t("path.cabletron")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2000 – 2002</span>
                <VendorMark vendor="riverstone" year={2000} eraLabel={era} since={since} compact />
                <span className="about-era-where">Riverstone Networks · Santa Clara, California</span>
                <span className="about-era-what">{t("path.riverstone")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2003 – 2004</span>
                <VendorMark vendor="cisco" year={2003} eraLabel={era} since={since} compact />
                <span className="about-era-where">Cisco Systems · Brasília</span>
                <span className="about-era-what">{t("path.cisco")}</span>
              </li>
              {/* ADDED 2026-10-04 (PRIME: "there is an entry missing: IronPort
                  2004 - 2005"). From the career record: channel development and
                  pre-sales technical consulting for IronPort's Brazilian operation
                  in late 2004, continued through 2005 with a Cisco and IronPort
                  reseller; the C-Series e-mail security appliances. */}
              <li className="about-era">
                <span className="about-era-years mono">2004 – 2005</span>
                <VendorMark vendor="ironport" year={2004} eraLabel={era} since={since} compact />
                <span className="about-era-where">IronPort Systems · São Paulo</span>
                <span className="about-era-what">{t("path.ironport")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2005 – 2007</span>
                <VendorMark vendor="enterasys" year={2005} eraLabel={era} since={since} compact />
                <span className="about-era-where">Enterasys Networks · São Paulo</span>
                <span className="about-era-what">{t("path.enterasys")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2009 – 2010</span>
                {/* NetScreen beside Juniper (PRIME, 2026-10-04 21:25). The
                    ScreenOS firewalls this role supported kept the NetScreen name
                    after the 2004 acquisition, but no NetScreen mark was issued
                    after it: the only mark that identifies the line is the
                    company's last one, so it is looked up at 2004, its final
                    year, and its caption says so. A deliberate, declared
                    exception to the era rule, for the one product line whose
                    name outlived its mark. */}
                <span className="mark-row"><VendorMark vendor="juniper" year={2009} eraLabel={era} since={since} compact /><VendorMark vendor="netscreen" year={2004} eraLabel={era} since={since} compact /></span>
                <span className="about-era-where">Juniper Networks · São Paulo</span>
                <span className="about-era-what">{t("path.juniper")}</span>
              </li>
              {/* ADDED 2026-08-05 (PRIME). The record jumped from 2010 to 2015
                  with no entry for the four years in between, which read as a
                  gap rather than as what it was: implementation work through
                  resellers and direct engagements. Supplied first-hand. */}
              <li className="about-era">
                <span className="about-era-years mono">2011 – 2014</span>
                {/* The marks of the equipment named in the text, as of 2011; NetScreen at
                    2004, its last year, for the reason given on the entry above. */}
                <span className="mark-row"><VendorMark vendor="juniper" year={2011} eraLabel={era} since={since} compact /><VendorMark vendor="netscreen" year={2004} eraLabel={era} since={since} compact /><VendorMark vendor="cisco" year={2011} eraLabel={era} since={since} compact /><VendorMark vendor="paloalto" year={2011} eraLabel={era} since={since} compact /><VendorMark vendor="extreme" year={2011} eraLabel={era} since={since} compact /></span>
                <span className="about-era-where">Implementation · via CYLK, TDec and direct engagements</span>
                <span className="about-era-what">{t("path.implementation")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2015 – 2019</span>
                {/* The marks of the vendors the text names (PRIME, 2026-10-04:
                    "a few logos missing: IXIA, FireEye, McAfee, Pulse Secure,
                    VMware"), each as of 2015. Keysight is named in the text but
                    holds no mark here. */}
                <span className="mark-row"><VendorMark vendor="f5" year={2015} eraLabel={era} since={since} compact /><VendorMark vendor="ixia" year={2015} eraLabel={era} since={since} compact /><VendorMark vendor="fireeye" year={2015} eraLabel={era} since={since} compact /><VendorMark vendor="mcafee" year={2015} eraLabel={era} since={since} compact /><VendorMark vendor="pulse" year={2015} eraLabel={era} since={since} compact /><VendorMark vendor="vmware" year={2015} eraLabel={era} since={since} compact /></span>
                <span className="about-era-where">F5 Networks · Westcon / TD SYNNEX, Network1 / ScanSource</span>
                <span className="about-era-what">{t("path.f5channel")}</span>
              </li>
              {/* CYLK, 2020 to 2022 (PRIME, 2026-10-05 22:32: "add the logos and mentions regarding
                  CYLK in 2020 which were F5, Palo Alto Networks, Fortinet, Tenable, CyberArk, Corvil").
                  The marks as of 2020 for five of the six: F5's 2013 mark, Palo Alto Networks' 2020 mark,
                  Fortinet's, and, since 2026-10-06 (PRIME: "fetch a CyberArk mark", "fetch and use Tenable's
                  logo mark"), the Tenable and CyberArk marks the two vendors' own sites carried in 2020,
                  pulled at PRIME's instruction with their provenance in marks.ts; and Corvil's own mark at its
                  last year, 2019 (PRIME, 06:18: "Fetch Corvil's logo mark"), because Corvil's site had folded
                  into Pico's by 2020 while the name on the work and on the CCA was still Corvil, the same
                  reasoning as NetScreen's 2004 mark on the 2009 row. All six named companies now carry a mark.
                  The years are the CV's: thirty-six months, 2020 to 2022. */}
              <li className="about-era">
                <span className="about-era-years mono">2020 – 2022</span>
                <span className="mark-row"><VendorMark vendor="f5" year={2020} eraLabel={era} since={since} compact /><VendorMark vendor="paloalto" year={2020} eraLabel={era} since={since} compact /><VendorMark vendor="fortinet" year={2020} eraLabel={era} since={since} compact /><VendorMark vendor="tenable" year={2020} eraLabel={era} since={since} compact /><VendorMark vendor="cyberark" year={2020} eraLabel={era} since={since} compact /><VendorMark vendor="corvil" year={2019} eraLabel={era} since={since} compact /></span>
                <span className="about-era-where">Pre-sales and consulting · via CYLK</span>
                <span className="about-era-what">{t("path.cylk2020")}</span>
              </li>
              <li className="about-era about-era--current">
                <span className="about-era-years mono">2020 – {t("path.present")}</span>
                {/* The current Red Education mark only (PRIME, 2026-10-05 02:36: "the 2020-present entry doesn't
                    need two logos"); the 2020 mark stays in the registry and on the /red-education profile, where
                    the history of the mark is told. */}
                <span className="mark-row"><VendorMark vendor="rededucation" year={thisYear} eraLabel={era} since={since} compact /></span>
                <span className="about-era-where">Red Education</span>
                <span className="about-era-what">{t("path.rededucation")}</span>
                {/* CURRENTLY TEACHING (PRIME, 2026-10-04): the four platforms
                    whose authorized courses are delivered today, as marks, under
                    a label. The list is the same four the credentials page
                    states in words; the marks identify, they do not certify. */}
                <span className="about-era-teaching">
                  <span className="about-era-teaching-label">{t("path.teachingNow")}</span>
                  <span className="mark-row about-era-teaching-marks"><VendorMark vendor="f5" year={thisYear} eraLabel={era} since={since} compact /><VendorMark vendor="fortinet" year={thisYear} eraLabel={era} since={since} compact /><VendorMark vendor="extreme" year={thisYear} eraLabel={era} since={since} compact /><VendorMark vendor="netskope" year={thisYear} eraLabel={era} since={since} compact /></span>
                </span>
                {/* PREPARING TO TEACH (PRIME, 2026-10-06 04:58: "after the section 'Currently teaching:' add
                    'Preparing to teach:' followed by the current logos of vendors Check Point, Zscaler, Ping
                    Identity, Palo Alto Networks' Idira (CyberArk)"; 05:34: "Use both Idira and CyberArk marks";
                    05:44: "add the ForgeRock logo after the Ping Identity one"). Check Point, Zscaler and Ping
                    Identity as PRIME verified them; ForgeRock's mark as of its last year (2023, when Ping
                    Identity folded the brand into its own, which is why it follows Ping here); Idira's current
                    wordmark and CyberArk's final one (2023 to 2026), both pulled from the vendors' own pages at
                    PRIME's instruction, provenance in marks.ts. The row is the one forward-looking statement the
                    site makes about these platforms; it states preparation and nothing about authorization in
                    either direction. It supersedes, for this row only, the 2026-09-04 ruling recorded in
                    scripts/check-authorization-claims.mjs, which records the change. */}
                <span className="about-era-teaching about-era-teaching--preparing">
                  <span className="about-era-teaching-label">{t("path.preparing")}</span>
                  <span className="mark-row about-era-teaching-marks"><VendorMark vendor="checkpoint" year={thisYear} eraLabel={era} since={since} compact /><VendorMark vendor="zscaler" year={thisYear} eraLabel={era} since={since} compact /><VendorMark vendor="ping" year={thisYear} eraLabel={era} since={since} compact /><VendorMark vendor="forgerock" year={2023} eraLabel={era} since={since} compact /><VendorMark vendor="idira" year={thisYear} eraLabel={era} since={since} compact /><VendorMark vendor="cyberark" year={2026} eraLabel={era} since={since} compact /></span>
                </span>
              </li>
            </ol>

            {/* --- THE HISTORY (moved here from /industry/history, PRIME
                 2026-08-06) ---
                 The index page is deleted and its contents live here, which
                 removes a page that existed only to introduce three others.
                 The three era pages moved with it, to /about/<slug>.

                 Rendered with the ORIGINAL history-era-* classes rather than
                 restyled: PRIME asked for the cards "just like" the page they
                 came from, and the stylesheet already held every class they
                 need. */}
            <h2 className="section-title" style={{ marginTop: "3rem" }}>
              {t("historySectionTitle")}
            </h2>
            <p className="section-body">{tHistory("indexLede")}</p>

            <ol className="history-eras">
              {ERAS.map((era, i) => (
                <li key={era.slug}>
                  <Link href={`/about/${era.slug}`} className="history-era-card">
                    <span className="history-era-num mono">
                      {tHistory("eraLabel")} {i + 1}
                    </span>
                    <span className="history-era-years mono">
                      {tHistory(`${era.key}.years`)}
                    </span>
                    <span className="history-era-title">
                      {tHistory(`${era.key}.title`)}
                    </span>
                    <span className="history-era-subtitle">
                      {tHistory(`${era.key}.subtitle`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            {/* THE DOOR TO THE CAREER RECORD (About Run Review a12, PRIME 2026-10-07): the three eras end on the place
                where every chapter of the record is told vendor by vendor. */}
            <p className="section-body about-history-door">
              <Link href="/industry/chapters">{t("credibility.recordTitle")} <span aria-hidden="true">&#8594;</span></Link>
            </p>

            {/* Four cards where three buttons used to be (PRIME 2026-07-27).
                Certifications and endorsements moved down from the top of the
                page to join them: they are where a reader goes AFTER the career
                timeline, not before it. The vendor-lineage link is gone - it
                belongs on the vendor hubs, which is where it now lives. */}
            {/* E31 (2026-10-05): the cards get the heading SCOUT asked for, "Inspect the record", a lede saying
                what the block is for, and a count on each card, so the page states what can be checked and how
                much of it there is. Counts are computed above from the same registries the cards link to. */}
            <h2 className="section-title" style={{ marginTop: "3rem" }}>{t("credibility.inspectTitle")}</h2>
            <p className="section-body">{t("credibility.inspectBody")}</p>
            <div className="learn-portal-grid" style={{ marginTop: "2rem" }}>
              {/* RESTYLED into the learn-portal idiom (PRIME 2026-08-06), which
                  is the vocabulary the homepage, Learn and Training already use
                  for "where to go next". Four cards where there were four, one
                  of them replaced: the history card is gone because the history
                  is now a section above, and Courses takes its place because a
                  reader who has just read a career record is the most likely
                  person on this site to want the catalogue. */}
              <Link
                href="/industry/chapters"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9679;</span>
                <p className="learn-portal-title">
                  {t("credibility.recordTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.recordDesc")}</p>
                <p className="about-evidence-count mono">{t("credibility.recordCount", { count: CAREER_VENDORS.length })}</p>
              </Link>
              <Link
                href="/about/credentials"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#10003;</span>
                <p className="learn-portal-title">
                  {t("credibility.certsTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.certsDesc")}</p>
                <p className="about-evidence-count mono">{t("credibility.certsCount", { count: CREDENTIAL_COUNT })}</p>
              </Link>
              <Link
                href="/endorsements"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-success)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#8220;&#8221;</span>
                <p className="learn-portal-title">
                  {t("credibility.endorsementsTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.endorsementsDesc")}</p>
                <p className="about-evidence-count mono">{t("credibility.endorsementsCount", { count: TESTIMONIALS.length })}</p>
              </Link>
              <Link
                href="/training#catalog"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-danger)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">
                  {t("credibility.coursesTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.coursesDesc")}</p>
                <p className="about-evidence-count mono">{t("credibility.coursesCount", { count: COURSE_COUNT, vendors: PLATFORMS.length })}</p>
              </Link>
              {/* BLOG (PRIME 2026-08-06), moved out of the footer where it was
                  one link among fifteen. On this page it sits beside the other
                  things somebody reads after the career record. */}
              <Link
                href="/blog"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-warning)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9671;</span>
                <p className="learn-portal-title">
                  {t("credibility.blogTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.blogDesc")}</p>
                <p className="about-evidence-count mono">{t("credibility.blogCount", { count: getAllPosts(locale).length })}</p>
              </Link>
              {/* ADDED 2026-10-03 (PRIME): the earlier sites. What the Internet
                  Archive kept of nutzmann.net (2004) and ntz.com.br (2013),
                  catalogued with a link to every capture. A reader who has just
                  read the career record is the one who will want to see it. */}
              <Link
                href="/about/earlier-sites"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#8984;</span>
                <p className="learn-portal-title">
                  {t("credibility.sitesTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.sitesDesc")}</p>
                <p className="about-evidence-count mono">{t("credibility.sitesCount", { count: OLD_SITE_CLONES.length })}</p>
              </Link>
              {/* G15 (SCOUT Round 1): About links the colophon, "How the site is built". The colophon itself is
                  untouched; this is the one link SCOUT asked for, in the block where a reader checks things. */}
              <Link
                href="/colophon"
                className="learn-portal-card"
                style={{ "--note-accent": "var(--color-success)" } as CSSProperties}
              >
                <span className="learn-portal-ornament" aria-hidden>&#9881;</span>
                <p className="learn-portal-title">
                  {t("credibility.colophonTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{t("credibility.colophonDesc")}</p>
              </Link>
            </div>
          </div>
        </section>

        {/* --- CTA --- */}
        <section className="section">
          <div className="container section-narrow about-cta">
            {/* CTA REPLACED (PRIME 2026-08-06): "Start with the concepts" sent
                a reader who had just finished a biography off to Learn and
                Tools, which are one click away in the nav and were never what
                this page was building toward. A page about a person ends by
                letting you contact the person. */}
            <h2 className="section-title">{t("cta.title")}</h2>
            <p className="section-body" style={{ marginBottom: "1.5rem" }}>
              {t("cta.body")}
            </p>
            {/* THREE ROUTES (PRIME 2026-10-04, from the Speaking discussion): a
                reader who has just read the biography is usually buying the
                person for one of three purposes, so the three doors are named
                before the contact button rather than left implied by the
                sentence above. */}
            <ul className="about-routes">
              {([1, 2, 3] as const).map((n) => (
                <li key={n} className="about-route">
                  <span className="about-route-q">{t(`cta.route${n}Q`)}</span>
                  <Link href={n === 1 ? "/training" : n === 2 ? "/advisory" : "/speaking"} className="about-route-link">
                    {t(`cta.route${n}Label`)} <span aria-hidden="true">&#8594;</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hero-cta">
              <Link href="/contact" className="btn btn-primary">
                {t("cta.contactButton")}
              </Link>
              <Link href="/stats" className="btn btn-secondary">
                {t("cta.statsButton")}
              </Link>
            </div>
          </div>
        </section>

        {/* --- PRACTICALITIES (About Run Review a05, PRIME 2026-10-07) ---
             The three facts a reader who has to book or travel needs, and nobody else: citizenships, travel permits,
             the full list of languages. They led the page as hero cards until the review; here they close it, after
             the way to get in touch, where an organiser or a training buyer looks for them. Same cards, same marks,
             same message keys (now.*), so nothing needed retranslating. Citizenships and travel permits stay two
             facts: one is status, the other the practical ability to appear somewhere next month. */}
        <section className="section about-practical-section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("practical.title")}</h2>
            <ul className="about-facts">
              <li className="about-fact">
                <FactMark name="citizenships" />
                <span className="about-fact-label">{t("now.citizenshipsLabel")}</span>
                <span className="about-fact-value">{t("now.citizenshipsValue")}</span>
              </li>
              <li className="about-fact">
                <FactMark name="permits" />
                <span className="about-fact-label">{t("now.permitsLabel")}</span>
                <span className="about-fact-value">{t("now.permitsValue")}</span>
              </li>
              <li className="about-fact">
                <FactMark name="languages" />
                <span className="about-fact-label">{t("now.languagesLabel")}</span>
                <span className="about-fact-value">{t("now.languagesValue")}</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
