// ============================================================================
// src/app/[locale]/red-education/page.tsx
// ----------------------------------------------------------------------------
// RED EDUCATION PAGE (SEO-rich profile + homage, PRIME 2026-07-09).
//
// Two jobs at once, per the ratified proposal (red-education-page-proposal-v1):
//   1) an SEO-rich, sourced profile of Red Education, the global Authorized
//      Training Center Rodolfo teaches for, built to rank for high-intent
//      training queries (rich metadata + EducationalOrganization JSON-LD +
//      site-wide internal links in from the footer and the training CTAs);
//   2) a public homage / thank-you from Rodolfo to Red Education.
//
// EVERY FACT on this page was live-verified 2026-07-09 against rededucation.com
// (homepage, /f5-networks/, /fortinet/, the Fortinet ATC award announcement,
// the case study naming Rodolfo), F5's public ATC vendor list (cdn.f5.com),
// Fortinet's learning-center ATC list, and the 2026-05 EINPresswire release:
//   - founded 2005; 100,000+ students trained across 132 countries;
//   - 4.9-star average rating from 5,000+ reviews; 50+ instructors;
//   - classroom / virtual / on-site delivery across five global regions
//     (Americas, Australasia, SAARC, ASEAN, EMEA);
//   - authorized partner incl. F5, Fortinet, Palo Alto Networks, Check Point,
//     Cisco (Red Education's list - distinct from Rodolfo's own four vendors);
//   - best F5 ATC Award 2020/21 (98% customer satisfaction on F5 courses);
//   - Fortinet Training Institute ATC Partner of the Year, APAC (2026 awards);
//   - Red Education's own case study names Rodolfo delivering FortiGate
//     training to 43 engineers at a global IT firm.
// If any of these change, re-verify before editing - never update from memory.
//
// RE-READ 2026-10-06 (milestone (re1), PRIME 16:17 to 16:30): the learner figure
// is now "over 120,000" (the home page: "over 120,000 training seats"; the
// training-resources explainer: "over 120,000 learners since 2005"), and Red
// Education has begun authoring its OWN courses: the FastTrack series (Course
// 01 Open NGFW, "100% Red Education original IP"; Course 02 Network
// Fundamentals for Security Practitioners, "original Red Education
// courseware") and Palo Alto Networks On-Demand, all listed on its own-courses
// home, /rededucation/. The courses and the Understanding Cyber Security
// Career Paths booklet are featured after the booking block; every fact there
// was read that day from the course pages, the three course outlines and both
// booklets, kept in the private canon (canon/reference/rededucation-courses-
// 20261006/). The Cisco explainer answered 404 that day and left the list.
//
// GUARDRAIL: the "Vendor authorizations" section is RED EDUCATION's list; the
// "Rodolfo at Red Education" section is HIS list (F5, Fortinet, Netskope,
// Extreme Networks - all four confirmed by PRIME as delivered through Red
// Education). Never merge the two: instructor claims stay limited to his four.
//
// The TRIBUTE paragraph is a starting draft in Rodolfo's voice, PRIME-approved
// as a draft; he rewrites it in the i18n messages (redEducation.tribute) to
// make it fully his own.
//
// Outbound links: the CTA carries full placement-level attribution so the
// lead is attributed; the case-study deep link keeps the referrer via
// externalRel (their host). Statically generated per locale.
// ============================================================================

import { ogImages } from "@/lib/og";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
// MARK (PRIME 2026-10-04): the company's own wordmark on its profile page.
import VendorMark from "@/components/VendorMark";
import SiteFooter from "@/components/SiteFooter";
import {
  RED_EDUCATION_BASE,
  RED_EDUCATION_ALL_VENDORS,
  redEducationUrl,
  attributeRedEducationUrl,
  externalRel,
} from "@/config/redEducation";

import ReduBrand from "@/components/ReduBrand";
import { Fragment } from "react";
// Red Education's authorized-vendor list (proper nouns, rendered verbatim).
// This is THEIR list; Rodolfo's own vendors are named separately below. Each
// entry optionally links to that vendor's page on this site. Verified 2026-07-14
// against Red Education's own vendor pages and site vendor list. HPE/Aruba/
// Juniper are deliberately ABSENT - Red Education does not deliver those.
const RED_EDUCATION_VENDORS: { name: string; href?: string }[] = [
  // Every pill links to that vendor's page on this site (PRIME 20/07/2026):
  // The vendors PRIME is AUTHORIZED on through Red Education go to their chapter.
  //
  // *** FOUR, NOT SIX (PRIME, 2026-08-16). Ping Identity and Zscaler are IN
  // PROGRESS - he is working towards them and holds neither authorization. An
  // earlier version of this file said six and the explainer list claimed he
  // taught them, which was a false credential claim on his own site. See R-12.
  // Authorized and delivered: F5, Extreme Networks, Fortinet, Netskope. ***
  // pages, the rest to their partner profiles. ForgeRock points to the Ping
  // Identity chapter, which tells the acquisition story.
  { name: "F5", href: "/industry/f5" },
  { name: "Fortinet", href: "/industry/fortinet" },
  { name: "Palo Alto Networks", href: "/industry/palo-alto" },
  { name: "Check Point", href: "/industry/check-point" },
  { name: "Cisco", href: "/industry/cisco" },
  { name: "Nutanix", href: "/industry/nutanix" },
  { name: "Arista", href: "/industry/arista" },
  { name: "Netskope", href: "/industry/netskope" },
  { name: "Extreme Networks", href: "/industry/extreme" },
  { name: "CyberArk", href: "/industry/cyberark" },
  { name: "ForgeRock", href: "/industry/ping-identity" },
  { name: "Ping Identity", href: "/industry/ping-identity" },
  { name: "Zscaler", href: "/industry/zscaler" },
  { name: "AWS", href: "/industry/aws" },
  { name: "Riverbed", href: "/industry/riverbed" },
];

// The public case study on rededucation.com that names Rodolfo (verified
// 2026-07-09). Deep link keeps the referrer via externalRel.
// Red Education's professional-services page (read 2026-10-06), linked from the "Beyond training" block and listed
// among the official sources; the same destination the advisory page's implementation boundary links.
const RED_EDUCATION_PS_URL = "https://www.rededucation.com/professional-services/";
const CASE_STUDY_URL =
  "https://www.rededucation.com/case-studies/high-impact-fortinet-training-at-scale-for-global-it-leader/";

// RED EDUCATION'S OWN COURSES (2026-10-06): the home of its own catalogue (PRIME 16:27: "is it's home") and the three
// course pages (PRIME 16:26), each read that day. The names are the courses' own, proper nouns in every language; the
// rest of each card is the pack's (redEducation.own.courses.<key>).
const RED_EDUCATION_OWN_COURSES_URL = "https://www.rededucation.com/rededucation/";
const OWN_COURSES: { key: string; name: string; url: string }[] = [
  { key: "openNgfw", name: "Open NGFW: Next-Generation Firewall Foundational Training", url: "https://www.rededucation.com/coursesvender/openngfw-next-generation-firewall-training/" },
  { key: "networkFundamentals", name: "Network Fundamentals for Security Practitioners", url: "https://www.rededucation.com/coursesvender/network-fundamentals-for-security-practitioners/" },
  { key: "panOnDemand", name: "Palo Alto Networks On-Demand", url: "https://www.rededucation.com/coursesvender/palo-alto-networks-on-demand/" },
];

// THE CAREER-PATHS BOOKLET (2026-10-06): the flipbook on Red Education's account at its flipbook host, and the
// booklet's page on rededucation.com, which is the one that carries attribution (attributeRedEducationUrl leaves other
// hosts untouched, by design).
const CAREER_BOOKLET_URL = "https://rededucation.aflip.in/98d9bed51f.html";
const CAREER_PAGE_URL = "https://www.rededucation.com/course-explained/cyber-security-career-paths/";
// The booklet's seven streams, with its entry point and its summit, each against the nearest roles in The Roles (slugs
// of src/lib/roles.ts, titles from the roles pack). Read from the booklet's stream map (page 8) and its fourteen role
// profiles (pages 10 to 56); the pairing is this site's reading, and the table says "the nearest roles", no more.
const CAREER_STREAMS: { key: string; roles: string[] }[] = [
  { key: "entry", roles: ["security-operations-analyst"] },
  { key: "governance", roles: ["grc-analyst"] },
  { key: "vulnerability", roles: ["vulnerability-analyst", "penetration-tester"] },
  { key: "operations", roles: ["security-operations-analyst", "security-manager"] },
  { key: "forensics", roles: ["digital-forensics-analyst"] },
  { key: "incident", roles: ["incident-responder"] },
  { key: "threat", roles: ["threat-intelligence-analyst"] },
  { key: "design", roles: ["security-engineer", "security-architect"] },
  { key: "top", roles: ["security-leader"] },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "redEducation" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...ogImages("page", "red-education", locale, t("title")),
  };
}

export default async function RedEducationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("redEducation");
  // The era caption for the mark (same string the career chapters use) and the year to look it up.
  const tMarks = await getTranslations("partnerVendors");
  const era = (e: string) => tMarks("markEra", { era: e });
  // "since {year}" in the page's language ("desde 2025" in Portuguese).
  const since = (y: number) => tMarks("markSince", { year: y });
  const thisYear = new Date().getFullYear();
  const tNav = await getTranslations("nav");
  // The Roles' own titles, for the career-paths table (2026-10-06).
  const tRoles = await getTranslations("roles");

  // The lead-attributed outbound CTA (utm_campaign identifies this page).
  const reduUrl = redEducationUrl({ pageType: "red-education", locale, cta: "main-cta" });

  // EducationalOrganization JSON-LD: this page is ABOUT Red Education (the
  // org is the page's mainEntity; we are not claiming to be them). Facts
  // mirror the verified list in the header comment; the award strings are the
  // two named recognitions.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("metaTitle"),
    description: t("metaDescription"),
    mainEntity: {
      "@type": "EducationalOrganization",
      name: "Red Education",
      url: RED_EDUCATION_ALL_VENDORS,
      foundingDate: "2005",
      description: t("whoBody1"),
      award: [
        "Best F5 ATC Award 2020/21",
        "Fortinet Training Institute ATC Partner of the Year, APAC (2026)",
      ],
    },
  };

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Machine-legible: EducationalOrganization mainEntity. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          {/* Hero. (When PRIME supplies the Red Education logo file with usage
              rights, it drops in here beside the title.) */}
          <section className="redu-hero">
            <div className="container redu-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title"><ReduBrand linked={false}>{t("title")}</ReduBrand></h1>
              <p className="page-hero-lede">{t("lede")}</p>
              {/* The company's mark, dated like every mark on the site (registry: src/content/vendors/marks.ts). */}
              <VendorMark vendor="rededucation" year={thisYear} eraLabel={era} since={since} />

              {/* THE IDENTITY LINE (G7 of Round 1, SCOUT; built 2026-10-06): what this page is, in one sentence,
                  before the figures: the institution behind the author's authorised training and his
                  commercial professional engagements. */}
              <p className="redu-identity">{t("identityLine")}</p>
              {/* SECTION ANCHORS (PRIME 2026-08-16; restructured 2026-10-06, G7). The page is long and now
                  reads in six parts, in the order a reader deciding whether to train here needs them: why
                  Red Education, what it enables, where the author's work fits, the bench, the case evidence,
                  the official sources. The older anchors (who, dna, articles, explainers, culture,
                  authorizations, awards) stay on their sections, so every address somebody linked still
                  lands. */}
              <nav className="redu-links" aria-label={t("jumpLabel")}>
                {[
                  // Red Education's own courses (2026-10-06), first because they are new and they are its own.
                  ["own-courses", "own.jump"],
                  ["why", "part.why.title"],
                  ["enables", "part.enables.title"],
                  ["my-work", "part.mywork.title"],
                  ["bench", "part.bench.title"],
                  ["evidence", "part.evidence.title"],
                  ["sources", "part.sources.title"],
                  ["tribute", "jumpTribute"],
                ].map(([id, key]) => (
                  <a key={id} href={`#${id}`} className="redu-inline-link">
                    {t(key)}
                  </a>
                ))}
              </nav>
            </div>
          </section>
          {/* CTA (top copy): PRIME 2026-07-17 - the booking block also opens the
              page so a visitor can act before reading. Same i18n keys and
              markup as the closing CTA section below; edit both together. */}
          {/* THE FIGURES, ABOVE EVERYTHING ELSE (PRIME 2026-08-16, layout audit).
              The audit found NINE identically-weighted headings and not one
              number presented AS a number: Red Education's scale was buried in
              prose and bullets. These four are their own published facts, on
              the site's EXISTING stats-band idiom - the same component the
              homepage uses, so the page looks like this site rather than like a
              brochure. Read from their footer and about page, 2026-08-16. */}
          <section className="stats-band" aria-label={t("figuresLabel")}>
            <div className="container">
              <p className="stats-headline">{t("figuresHeadline")}</p>
              <div className="stats-band-inner">
                {([
                  // "over 120,000" on rededucation.com, read 2026-10-06 (it was 100,000+ when first read in July).
                  ["120,000+", "figuresLearners"],
                  ["2005", "figuresSince"],
                  ["5", "figuresRegions"],
                  ["15", "figuresVendors"],
                ] as const).map(([value, key], i) => (
                  <Fragment key={key}>
                    {i > 0 && <span className="stat-sep" aria-hidden="true" />}
                    <span className="stat">
                      <span className="stat-value">{value}</span>
                      <span className="stat-label">{t(key)}</span>
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          </section>
          <section id="training" className="section redu-cta-section">
            <div className="container redu-container">
              <h2 className="redu-section-title">{t("ctaTitle")}</h2>
              <p className="redu-body"><ReduBrand linked={false}>{t("ctaBody")}</ReduBrand></p>
              
            </div>
          </section>
          {/* RED EDUCATION'S OWN COURSES (PRIME 2026-10-06, 16:17: "feature the new authorial courses that Red Education is
              starting to offer ... as a high-value-add educational resource coming from the experts trusted by many leading
              technology vendors and innovators"; 16:26 and 16:27 the three course pages and their home; 16:29 the outlines).
              Placed straight after the booking block, ahead of the six parts, because it is new and it is the one thing on
              this page that is Red Education's own curriculum rather than a vendor's. Every fact below was read on 6 October
              2026 from the course pages, the three outlines and the own-courses page (copies kept in the private canon); the
              card summaries are written here, with one short quote of Red Education's own words. The three course links and
              the courses home carry the page's attribution with the programme key "rededucation", so Red Education can tell
              these referrals from the vendor ones. */}
          <section id="own-courses" className="section section-accent">
            <div className="container redu-container">
              <p className="redu-own-eyebrow mono">{t("own.eyebrow")}</p>
              <h2 className="redu-section-title">{t("own.title")}</h2>
              <p className="redu-body"><ReduBrand linked={false}>{t("own.lede")}</ReduBrand></p>
              <ul className="redu-own-list">
                {OWN_COURSES.map((c) => {
                  // The course page, attributed at render with this placement's context.
                  const href = attributeRedEducationUrl(c.url, { vendor: "rededucation", pageType: "red-education", pageSlug: "own-courses", locale, cta: `own-course-${c.key}` });
                  // The label/value pairs, as the pack states them for this course.
                  const facts = t.raw(`own.courses.${c.key}.facts`) as [string, string][];
                  return (
                    <li key={c.key} className="redu-own-card">
                      <p className="redu-own-series mono">{t(`own.courses.${c.key}.series`)}</p>
                      {/* The course's own name, a proper noun in every language. */}
                      <h3 className="redu-own-title">{c.name}</h3>
                      <p className="redu-own-summary">{t(`own.courses.${c.key}.summary`)}</p>
                      <dl className="redu-own-facts">
                        {facts.map(([label, value]) => (
                          <div className="redu-own-fact" key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="redu-own-link">
                        <a href={href} target="_blank" rel={externalRel(c.url)} className="redu-inline-link">
                          {t("own.courseLink")} &#8599;
                        </a>
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="redu-body">{t("own.schedules")}</p>
              <p className="redu-body">
                <a
                  href={attributeRedEducationUrl(RED_EDUCATION_OWN_COURSES_URL, { vendor: "rededucation", pageType: "red-education", pageSlug: "own-courses", locale, cta: "own-courses-home" })}
                  target="_blank"
                  rel={externalRel(RED_EDUCATION_OWN_COURSES_URL)}
                  className="redu-inline-link"
                >
                  {t("own.allCourses")} &#8599;
                </a>
              </p>
              <p className="redu-body">
                {t.rich("own.alongside", {
                  materials: (chunks) => <Link href="/materials/tcpip-concepts-and-ip-routing" className="redu-inline-link">{chunks}</Link>,
                  practice: (chunks) => <Link href="/practice" className="redu-inline-link">{chunks}</Link>,
                })}
              </p>
              <p className="vendor-note-body">{t("own.readOn")}</p>
            </div>
          </section>
          {/* THE CAREER-PATHS BOOKLET (PRIME 2026-10-06, 16:17: "an excellent resource, quite complementary with two sections
              of the site, The Practice but especially The Roles"; 16:30 its PDF). Read in full on 6 October 2026. The table
              lines the booklet's seven streams up with the nearest security roles in The Roles; the role names on the right
              come from The Roles' own pack, so a renamed role renames here. The booklet itself is a flipbook on Red
              Education's account at a flipbook host (rededucation.aflip.in), which is not rededucation.com, so that link
              carries no attribution; the booklet's page on rededucation.com does. */}
          <section id="career-paths" className="section">
            <div className="container redu-container">
              <p className="redu-own-eyebrow mono">{t("career.eyebrow")}</p>
              <h2 className="redu-section-title">{t("career.title")}</h2>
              <p className="redu-body">{t("career.body")}</p>
              <p className="redu-body">
                {t.rich("career.complements", {
                  roles: (chunks) => <Link href="/roles" className="redu-inline-link">{chunks}</Link>,
                  practice: (chunks) => <Link href="/practice" className="redu-inline-link">{chunks}</Link>,
                })}
              </p>
              <div className="redu-career-wrap">
                <table className="redu-career-table">
                  <caption className="sr-only">{t("career.tableCaption")}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t("career.tableStream")}</th>
                      <th scope="col">{t("career.tableRoles")}</th>
                      <th scope="col">{t("career.tableHere")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAREER_STREAMS.map((s) => (
                      <tr key={s.key}>
                        <th scope="row">{t(`career.streams.${s.key}.name`)}</th>
                        <td>{t(`career.streams.${s.key}.roles`)}</td>
                        <td>
                          {s.roles.map((slug, i) => (
                            <Fragment key={slug}>
                              {i > 0 && ", "}
                              <Link href={`/roles/${slug}`} className="redu-inline-link">{tRoles(`entries.${slug}.title`)}</Link>
                            </Fragment>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="redu-own-link">
                <a href={CAREER_BOOKLET_URL} target="_blank" rel={externalRel(CAREER_BOOKLET_URL)} className="redu-inline-link">
                  {t("career.read")} &#8599;
                </a>
                <span className="redu-own-sep" aria-hidden="true">&#183;</span>
                <a
                  href={attributeRedEducationUrl(CAREER_PAGE_URL, { pageType: "red-education", pageSlug: "career-paths", locale, cta: "career-paths" })}
                  target="_blank"
                  rel={externalRel(CAREER_PAGE_URL)}
                  className="redu-inline-link"
                >
                  {t("career.page")} &#8599;
                </a>
              </p>
              <p className="vendor-note-body">{t("career.readOn")}</p>
            </div>
          </section>
          {/* PART 1: why (G7). */}
          <div className="container redu-container redu-part" id="why">
            <p className="redu-part-eyebrow mono">{t("partsLabel", { n: 1 })}</p>
            <h2 className="redu-part-title">{t("part.why.title")}</h2>
            <p className="redu-part-lede"><ReduBrand linked={false}>{t("part.why.lede")}</ReduBrand></p>
          </div>
          {/* Who they are: the verified scale + reach + formats. */}
          <section id="who" className="section">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("whoTitle")}</h3>
              <p className="redu-body"><ReduBrand linked={false}>{t("whoBody1")}</ReduBrand></p>
              <p className="redu-body">{t("whoBody2")}</p>
            </div>
          </section>
          {/* Vision + values: Red Education's own stated vision and five company
              values, transcribed from the company's own materials (supplied by
              PRIME 2026-07-11). Their words, framed clearly as theirs; light
              normalization only (terminal punctuation, "&" -> "and", one
              possessive apostrophe). British "behaviours" kept - it is a
              quotation of an Australian company's own value statement. */}
          <section id="dna" className="section section-accent">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("dnaTitle")}</h3>
              <p className="redu-body"><ReduBrand linked={false}>{t("dnaIntro")}</ReduBrand></p>
              <h4 className="redu-awards-title">{t("visionTitle")}</h4>
              <p className="redu-body">{t("visionBody1")}</p>
              <p className="redu-body">{t("visionBody2")}</p>
              <p className="redu-body">{t("visionBody3")}</p>
              <h4 className="redu-awards-title">{t("valuesTitle")}</h4>
              <ul className="redu-awards">
                {(["v1", "v2", "v3", "v4", "v5"] as const).map((k) => (
                  <li className="redu-award" key={k}>
                    {t(`values.${k}`)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section id="culture" className="section section-accent">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("cultureTitle")}</h3>
              <p className="redu-body">{t("cultureIntro")}</p>
              <ul className="redu-facts">
                {["c1","c2","c3","c4","c5","c6","c7","c8"].map((k) => (
                  <li key={k}>
                    <strong>{t(`culture.${k}.term`)}</strong> {t(`culture.${k}.body`)}
                  </li>
                ))}
              </ul>
              <blockquote className="redu-quote">
                &ldquo;{t("cultureMotto")}&rdquo;
                <span className="redu-quote-attr">&mdash; {t("cultureMottoAttr")}</span>
              </blockquote>
              <p className="redu-body">
                <a
                  href={attributeRedEducationUrl("https://www.rededucation.com/about-us/our-culture/", {
                    pageType: "red-education",
                    pageSlug: "culture",
                    locale,
                    cta: "culture-source",
                  })}
                  target="_blank"
                  rel={externalRel("https://www.rededucation.com/about-us/our-culture/")}
                  className="redu-inline-link"
                >
                  {t("cultureLink")} &#8599;
                </a>
              </p>

            </div>
          </section>
          {/* PART 2: enables (G7). */}
          <div className="container redu-container redu-part" id="enables">
            <p className="redu-part-eyebrow mono">{t("partsLabel", { n: 2 })}</p>
            <h2 className="redu-part-title">{t("part.enables.title")}</h2>
            <p className="redu-part-lede"><ReduBrand linked={false}>{t("part.enables.lede")}</ReduBrand></p>
          </div>
          <section id="authorizations" className="section section-accent">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("authTitle")}</h3>
              <p className="redu-body"><ReduBrand linked={false}>{t("authIntro")}</ReduBrand></p>
              <ul className="redu-vendor-list">
                {RED_EDUCATION_VENDORS.map((v) =>
                  v.href ? (
                    <li key={v.name}>
                      <Link href={v.href} className="redu-vendor-chip redu-vendor-chip--link">
                        {v.name}
                      </Link>
                    </li>
                  ) : (
                    <li className="redu-vendor-chip" key={v.name}>
                      {v.name}
                    </li>
                  ),
                )}
              </ul>
              <h4 id="awards" className="redu-awards-title">{t("awardsTitle")}</h4>
              <ul className="redu-awards">
                <li className="redu-award">{t("awardF5")}</li>
                <li className="redu-award">{t("awardFortinet")}</li>
              </ul>
            </div>
          </section>
          <section id="explainers" className="section">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("explainersTitle")}</h3>
              <p className="redu-body">{t("explainersIntro")}</p>
              <ul className="redu-facts">
                {[
                  { slug: "netskope-training-resources", label: "Netskope", vendor: "netskope", mine: true },
                  { slug: "fortinet-training-resources", label: "Fortinet", vendor: "fortinet", mine: true },
                  { slug: "ping-identity-training-resources", label: "Ping Identity", vendor: "ping", mine: false },
                  { slug: "zscaler-training-resources", label: "Zscaler", vendor: "zscaler", mine: false },
                  // 2026-10-06: Cisco's explainer answered 404 and left Red Education's index; its own-courses
                  // explainer joined it, so the list is still the index's ten.
                  { slug: "red-education-training-resources", label: "Red Education Training", vendor: "rededucation", mine: false },
                  { slug: "check-point-training-resources", label: "Check Point", vendor: "checkpoint", mine: false },
                  { slug: "training-resources-palo-alto", label: "Palo Alto Networks", vendor: "palo-alto", mine: false },
                  { slug: "cyberark-training-resources", label: "CyberArk", vendor: "cyberark", mine: false },
                  { slug: "nutanix-training-resources", label: "Nutanix", vendor: "nutanix", mine: false },
                  { slug: "cyber-security-career-paths", label: "Cyber security career paths", vendor: undefined, mine: false },
                ].map((e) => {
                  const url = `https://www.rededucation.com/course-explained/${e.slug}/`;
                  const href = attributeRedEducationUrl(url, {
                    vendor: e.vendor,
                    pageType: "red-education",
                    pageSlug: "course-explainer",
                    locale,
                    cta: "explainer",
                  });
                  return (
                    <li key={e.slug}>
                      <a href={href} target="_blank" rel={externalRel(url)} className="redu-inline-link">
                        {e.label}
                      </a>
                      {e.mine ? ` ${t("explainersMine")}` : null}
                    </li>
                  );
                })}
              </ul>
              <p className="vendor-note-body">{t("explainersGap")}</p>

              {/* COMPANY CULTURE (PRIME 2026-08-16). Read from
                  /about-us/our-culture/, fetched live and in full - that page
                  is server-rendered, unlike the case-study index.

                  The eight headings are Red Education's; every summary under
                  them is WRITTEN HERE. Their footer carries "Copyright (c) 2026
                  Red Education All Rights Reserved", and attribution is not a
                  licence. One short quote is kept because it is their own motto
                  and says more in nine words than a paraphrase would. */}
            </div>
          </section>
          {/* BEYOND TRAINING (2026-10-06, SCOUT's Round 1 adoption audit, row 18): the professional-services side of
              Red Education, which the advisory page already names as one option after a decision and which this page,
              the institution's own, did not mention. Facts read on 2026-10-06 from rededucation.com/professional-services/
              (the services, who delivers them), written here in this site's words; the boundary sentence says where
              the author's own work ends. One attributed contextual link, the same destination the advisory page uses,
              with this page's own placement in the attribution; the page also joins the official sources below. */}
          <section id="professional-services" className="section section-accent">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("psTitle")}</h3>
              <p className="redu-body"><ReduBrand linked={false}>{t("psBody")}</ReduBrand></p>
              <p className="redu-body">
                {t.rich("psBoundary", {
                  adv: (chunks) => <Link href="/advisory#implementation" className="redu-inline-link">{chunks}</Link>,
                })}
              </p>
              <p className="redu-body">
                <a
                  href={attributeRedEducationUrl(RED_EDUCATION_PS_URL, { pageType: "red-education", locale, cta: "professional-services" })}
                  target="_blank"
                  rel={externalRel(RED_EDUCATION_PS_URL)}
                  className="redu-inline-link"
                >
                  {t("psLink")} &#8599;
                </a>
              </p>
            </div>
          </section>
          {/* PART 3: mywork (G7). */}
          <div className="container redu-container redu-part" id="my-work">
            <p className="redu-part-eyebrow mono">{t("partsLabel", { n: 3 })}</p>
            <h2 className="redu-part-title">{t("part.mywork.title")}</h2>
            <p className="redu-part-lede"><ReduBrand linked={false}>{t("part.mywork.lede")}</ReduBrand></p>
          </div>
          {/* Rodolfo at Red Education: HIS four vendors + verifiable proof. */}
          <section id="instructor" className="section">
            <div className="container redu-container">
              <h3 className="redu-section-title"><ReduBrand linked={false}>{t("rodolfoTitle")}</ReduBrand></h3>
              <p className="redu-body"><ReduBrand linked={false}>{t("rodolfoBody")}</ReduBrand></p>
              <p className="redu-body">
                <ReduBrand linked={false}>{t("caseStudyNote")}</ReduBrand>{" "}
                <a
                  href={attributeRedEducationUrl(CASE_STUDY_URL, { pageType: "red-education", locale, cta: "case-study" })}
                  className="redu-inline-link"
                  target="_blank"
                  rel={externalRel(CASE_STUDY_URL)}
                >
                  {t("caseStudyLink")} ↗
                </a>
              </p>
              <p className="redu-links">
                <Link href="/training" className="redu-inline-link">
                  {t("linkTraining")} →
                </Link>{" "}
                <Link href="/about/credentials" className="redu-inline-link">
                  {t("linkCredentials")} →
                </Link>
              </p>
            </div>
          </section>
          {/* PART 4: bench (G7). */}
          <div className="container redu-container redu-part" id="bench">
            <p className="redu-part-eyebrow mono">{t("partsLabel", { n: 4 })}</p>
            <h2 className="redu-part-title">{t("part.bench.title")}</h2>
            <p className="redu-part-lede"><ReduBrand linked={false}>{t("part.bench.lede")}</ReduBrand></p>
          </div>
          <section id="the-bench" className="section">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("benchTitle")}</h3>
              <p className="redu-body">{t("benchIntro")}</p>
              <ul className="redu-facts">
                <li>{t("benchStat1")}</li>
                <li>{t("benchStat2")}</li>
                <li>{t("benchStat3")}</li>
                <li>{t("benchStat4")}</li>
                <li>{t("benchStat5")}</li>
              </ul>
              <h4 className="redu-awards-title">{t("benchAwardsTitle")}</h4>
              <ul className="redu-awards">
                <li className="redu-award">{t("benchAward1")}</li>
                <li className="redu-award">{t("benchAward2")}</li>
                <li className="redu-award">{t("benchAward3")}</li>
                <li className="redu-award">{t("benchAward4")}</li>
                <li className="redu-award">{t("benchAward5")}</li>
              </ul>
              <p className="redu-body">{t("benchColleague")}</p>

            </div>
          </section>
          {/* PART 5: evidence (G7). */}
          <div className="container redu-container redu-part" id="evidence">
            <p className="redu-part-eyebrow mono">{t("partsLabel", { n: 5 })}</p>
            <h2 className="redu-part-title">{t("part.evidence.title")}</h2>
            <p className="redu-part-lede"><ReduBrand linked={false}>{t("part.evidence.lede")}</ReduBrand></p>
          </div>
          {/* Red Education's vendor authorizations + named recognitions. */}
          <section id="case-studies" className="section">
            <div className="container redu-container">
              {/* --- CASE STUDIES + THE BENCH (PRIME 2026-08-06) ---
                   Red Education publishes selected engagements as case studies
                   and names me in two. The summaries below are WRITTEN HERE,
                   not reproduced: their pages carry "Copyright © Red Education
                   All Rights Reserved", and attribution is not a licence. What
                   is quoted is one sentence of the CLIENT's own words, which is
                   short, attributed, and about the engagement rather than their
                   copy. Both originals are linked prominently.

                   Verified live 2026-08-06 with no-cache headers, after a
                   previous fetch of a different Red Education page returned
                   stale cached content that had in fact been taken down. */}
              <h3 className="redu-section-title">{t("casesTitle")}</h3>
              <p className="redu-body">{t("casesIntro")}</p>

              {/* THE STUDIES AS FULL-WIDTH CARDS (PRIME 2026-08-16). Each one
                  now carries its own title, its summary, its quote where the
                  client gave one, and its own attributed link - instead of
                  titles here and a list of links further down, which asked the
                  reader to reassemble them.

                  Two studies, because two are what has been verified. Red
                  Education's case-study index is drawn by JavaScript and cannot
                  be enumerated by fetching, so a third is known to exist and is
                  not listed until it has been read. */}
              {[
                { key: "case1", vendor: "fortinet", quote: true,
                  url: "https://www.rededucation.com/case-studies/high-impact-fortinet-training-at-scale-for-global-it-leader/" },
                { key: "case2", vendor: "f5", quote: false,
                  url: "https://www.rededucation.com/case-studies/enhancing-f5-big-ip-platform-capabilities-with-irules-training/" },
              ].map((c) => {
                const href = attributeRedEducationUrl(c.url, {
                  vendor: c.vendor,
                  pageType: "red-education",
                  pageSlug: "case-study",
                  locale,
                  cta: "case-study-source",
                });
                return (
                  <article key={c.key} className="redu-case">
                    <h4 className="redu-case-title">{t(`${c.key}Title`)}</h4>
                    <p className="redu-body">{t(`${c.key}Body`)}</p>
                    {c.quote && (
                      <blockquote className="redu-quote">
                        &ldquo;{t(`${c.key}Quote`)}&rdquo;
                        <span className="redu-quote-attr">&mdash; {t(`${c.key}QuoteAttr`)}</span>
                      </blockquote>
                    )}
                    <a href={href} target="_blank" rel={externalRel(href)} className="redu-case-link">
                      {t(`${c.key}Link`)} &#8599;
                    </a>
                  </article>
                );
              })}

              <p className="vendor-note-body">{t("casesRights")}</p>

              {/* THE BENCH. Aggregate figures and externally conferred awards
                  only - no individual bios. Red Education took its instructors
                  page down in 2026, and republishing bios a company has removed
                  is not ours to do. One colleague is named because his award is
                  a matter of public record on Red Education's own site. */}
              {/* ARTICLES (PRIME 2026-08-16). /news/ is CLIENT-RENDERED, like
                  the case-study index and unlike /course-explained/: the fetch
                  returns ONE article with a real href and three more as image
                  alt text with no link.

                  So this section is one article and the index, rather than a
                  list assembled from titles nobody can address. The one that IS
                  addressable happens to be about F5, which is a platform PRIME
                  teaches - useful rather than convenient. */}
            </div>
          </section>
          <section id="articles" className="section section-accent">
            <div className="container redu-container">
              <h3 className="redu-section-title">{t("articlesTitle")}</h3>
              <p className="redu-body">{t("articlesIntro")}</p>
              <article className="redu-case">
                <h4 className="redu-case-title">{t("article1Title")}</h4>
                <p className="redu-body">{t("article1Body")}</p>
                <a
                  href={attributeRedEducationUrl(
                    "https://www.rededucation.com/f5-certification-career-pathways-salary-expectations/",
                    { vendor: "f5", pageType: "red-education", pageSlug: "article", locale, cta: "article" },
                  )}
                  target="_blank"
                  rel={externalRel("https://www.rededucation.com/f5-certification-career-pathways-salary-expectations/")}
                  className="redu-case-link"
                >
                  {t("article1Link")} &#8599;
                </a>
              </article>
              <p className="redu-body">
                <a
                  href={attributeRedEducationUrl("https://www.rededucation.com/news/", {
                    pageType: "red-education",
                    pageSlug: "blog",
                    locale,
                    cta: "blog-index",
                  })}
                  target="_blank"
                  rel={externalRel("https://www.rededucation.com/news/")}
                  className="redu-inline-link"
                >
                  {t("articlesIndexLink")} &#8599;
                </a>
              </p>

              {/* PUBLISHED COURSE EXPLAINERS (PRIME 2026-08-16).
                  Read from /course-explained/, fetched live: unlike the
                  case-study index, that page IS server-rendered and lists its
                  children with real hrefs, so all ten are here.

                  Ordered with the platforms I teach first, because that is the
                  order a reader of THIS page cares about.

                  *** THE MARKER IS A DELIVERY CLAIM (PRIME, 2026-08-16). It was
                  once applied to Ping Identity and Zscaler, which he does not
                  teach; the standing rule is exact: naming a vendor is one
                  thing, claiming to train on it is another, and the delivered
                  count stays at four platforms until PRIME says otherwise. His
                  relationship to those two is characterised nowhere on the site
                  (GUARD 45), bar the one row PRIME ruled on 2026-10-06. *** The titles are Red
                  Education's; the note under each says what it is, not what it
                  says - nobody has read all ten, and a description of unread
                  content would be a guess. */}
            </div>
          </section>
          {/* PART 6: the official sources (G7). Every fact on this page is read from one of these pages on
              the dates the header comment records (9 and 14 July, 6 and 16 August 2026); listing them here
              is the reader's way to check, and the list is drawn from the same config and literals the page
              links elsewhere, so a URL cannot differ between the two. Each outbound link carries the same
              placement attribution as the rest of the page. */}
          <div className="container redu-container redu-part" id="sources">
            <p className="redu-part-eyebrow mono">{t("partsLabel", { n: 6 })}</p>
            <h2 className="redu-part-title">{t("part.sources.title")}</h2>
            <p className="redu-part-lede"><ReduBrand linked={false}>{t("part.sources.lede")}</ReduBrand></p>
          </div>
          <section className="section section-accent">
            <div className="container redu-container">
              <ul className="redu-facts">
                {[
                  { key: "home", url: RED_EDUCATION_BASE },
                  { key: "vendors", url: RED_EDUCATION_ALL_VENDORS },
                  { key: "f5", url: "https://www.rededucation.com/f5-networks/", vendor: "f5" },
                  { key: "fortinet", url: "https://www.rededucation.com/fortinet/", vendor: "fortinet" },
                  { key: "extreme", url: "https://www.rededucation.com/extreme-networks/", vendor: "extreme" },
                  { key: "netskope", url: "https://www.rededucation.com/netskope-training/", vendor: "netskope" },
                  { key: "culture", url: "https://www.rededucation.com/about-us/our-culture/" },
                  { key: "explainers", url: "https://www.rededucation.com/course-explained/" },
                  { key: "news", url: "https://www.rededucation.com/news/" },
                  { key: "professionalServices", url: RED_EDUCATION_PS_URL },
                  // Red Education's own courses (2026-10-06): the catalogue the featured section is read from.
                  { key: "ownCourses", url: RED_EDUCATION_OWN_COURSES_URL, vendor: "rededucation" },
                  { key: "case1", url: "https://www.rededucation.com/case-studies/high-impact-fortinet-training-at-scale-for-global-it-leader/", vendor: "fortinet" },
                  { key: "case2", url: "https://www.rededucation.com/case-studies/enhancing-f5-big-ip-platform-capabilities-with-irules-training/", vendor: "f5" },
                ].map((src) => {
                  const href = attributeRedEducationUrl(src.url, {
                    vendor: src.vendor,
                    pageType: "red-education",
                    pageSlug: "official-source",
                    locale,
                    cta: "official-source",
                  });
                  return (
                    <li key={src.key}>
                      <a href={href} target="_blank" rel={externalRel(src.url)} className="redu-inline-link">
                        {t(`sources.${src.key}`)}
                      </a>{" "}
                      <span className="redu-source-url mono">{src.url.replace("https://www.", "")}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="vendor-note-body">{t("sourcesNote")}</p>
            </div>
          </section>
          {/* The tribute (Rodolfo's voice; draft, PRIME rewrites in i18n). */}
          <section id="tribute" className="section section-accent">
            <div className="container redu-container">
              <blockquote className="redu-tribute">
                <h2 className="redu-tribute-title">{t("tributeTitle")}</h2>
                <p className="redu-tribute-body"><ReduBrand linked={false}>{t("tribute")}</ReduBrand></p>
                <footer className="redu-tribute-sig">{t("tributeSignature")}</footer>
              </blockquote>
            </div>
          </section>
          {/* CTA: the single lead-attributed outbound link + on-site catalog. */}
          <section className="section redu-cta-section">
            <div className="container redu-container">
              <h2 className="redu-section-title">{t("ctaTitle")}</h2>
              <p className="redu-body"><ReduBrand linked={false}>{t("ctaBody")}</ReduBrand></p>
              <div className="redu-cta-buttons">
                <a
                  href={reduUrl}
                  className="btn btn-primary"
                  target="_blank"
                  rel={externalRel(reduUrl)}
                >
                  {t("ctaButton")} ↗
                </a>
                <Link href="/training" className="btn btn-secondary">
                  {t("linkTraining")}
                </Link>
              </div>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
