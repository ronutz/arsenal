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
import SiteFooter from "@/components/SiteFooter";
import {
  RED_EDUCATION_BASE,
  redEducationUrl,
  attributeRedEducationUrl,
  externalRel,
} from "@/config/redEducation";

import ReduBrand from "@/components/ReduBrand";
// Red Education's authorized-vendor list (proper nouns, rendered verbatim).
// This is THEIR list; Rodolfo's own vendors are named separately below. Each
// entry optionally links to that vendor's page on this site. Verified 2026-07-14
// against Red Education's own vendor pages and site vendor list. HPE/Aruba/
// Juniper are deliberately ABSENT - Red Education does not deliver those.
const RED_EDUCATION_VENDORS: { name: string; href?: string }[] = [
  // Every pill links to that vendor's page on this site (PRIME 20/07/2026):
  // the six authorized-through-Red-Education vendors go to their chapter
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
const CASE_STUDY_URL =
  "https://www.rededucation.com/case-studies/high-impact-fortinet-training-at-scale-for-global-it-leader/";

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
  const tNav = await getTranslations("nav");

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
      url: RED_EDUCATION_BASE,
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
      <a href="#main" className="skip-link">
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
            </div>
          </section>

          {/* CTA (top copy): PRIME 2026-07-17 - the booking block also opens the
              page so a visitor can act before reading. Same i18n keys and
              markup as the closing CTA section below; edit both together. */}
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

          {/* Who they are: the verified scale + reach + formats. */}
          <section className="section">
            <div className="container redu-container">
              <h2 className="redu-section-title">{t("whoTitle")}</h2>
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
          <section className="section">
            <div className="container redu-container">
              <h2 className="redu-section-title">{t("dnaTitle")}</h2>
              <p className="redu-body"><ReduBrand linked={false}>{t("dnaIntro")}</ReduBrand></p>
              <h3 className="redu-awards-title">{t("visionTitle")}</h3>
              <p className="redu-body">{t("visionBody1")}</p>
              <p className="redu-body">{t("visionBody2")}</p>
              <p className="redu-body">{t("visionBody3")}</p>
              <h3 className="redu-awards-title">{t("valuesTitle")}</h3>
              <ul className="redu-awards">
                {(["v1", "v2", "v3", "v4", "v5"] as const).map((k) => (
                  <li className="redu-award" key={k}>
                    {t(`values.${k}`)}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Red Education's vendor authorizations + named recognitions. */}
          <section className="section">
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
              <h2 className="redu-section-title">{t("casesTitle")}</h2>
              <p className="redu-body">{t("casesIntro")}</p>

              <h3 className="redu-awards-title">{t("case1Title")}</h3>
              <p className="redu-body">{t("case1Body")}</p>
              <blockquote className="redu-body">
                &ldquo;{t("case1Quote")}&rdquo;
                <br />
                <span className="vendor-note-body">&mdash; {t("case1QuoteAttr")}</span>
              </blockquote>

              <h3 className="redu-awards-title">{t("case2Title")}</h3>
              <p className="redu-body">{t("case2Body")}</p>

              <p className="vendor-note-body">{t("casesRights")}</p>
              <ul className="redu-links">
                <li>
                  <a href="https://www.rededucation.com/case-studies/high-impact-fortinet-training-at-scale-for-global-it-leader/" target="_blank" rel="noopener noreferrer">
                    {t("case1Link")} &#8599;
                  </a>
                </li>
                <li>
                  <a href="https://www.rededucation.com/case-studies/enhancing-f5-big-ip-platform-capabilities-with-irules-training/" target="_blank" rel="noopener noreferrer">
                    {t("case2Link")} &#8599;
                  </a>
                </li>
              </ul>

              {/* THE BENCH. Aggregate figures and externally conferred awards
                  only - no individual bios. Red Education took its instructors
                  page down in 2026, and republishing bios a company has removed
                  is not ours to do. One colleague is named because his award is
                  a matter of public record on Red Education's own site. */}
              <h2 className="redu-section-title">{t("benchTitle")}</h2>
              <p className="redu-body">{t("benchIntro")}</p>
              <ul className="redu-facts">
                <li>{t("benchStat1")}</li>
                <li>{t("benchStat2")}</li>
                <li>{t("benchStat3")}</li>
                <li>{t("benchStat4")}</li>
                <li>{t("benchStat5")}</li>
              </ul>
              <h3 className="redu-awards-title">{t("benchAwardsTitle")}</h3>
              <ul className="redu-facts">
                <li>{t("benchAward1")}</li>
                <li>{t("benchAward2")}</li>
                <li>{t("benchAward3")}</li>
                <li>{t("benchAward4")}</li>
                <li>{t("benchAward5")}</li>
              </ul>
              <p className="redu-body">{t("benchColleague")}</p>

              <h2 className="redu-section-title">{t("authTitle")}</h2>
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
              <h3 className="redu-awards-title">{t("awardsTitle")}</h3>
              <ul className="redu-awards">
                <li className="redu-award">{t("awardF5")}</li>
                <li className="redu-award">{t("awardFortinet")}</li>
              </ul>
            </div>
          </section>

          {/* Rodolfo at Red Education: HIS four vendors + verifiable proof. */}
          <section className="section">
            <div className="container redu-container">
              <h2 className="redu-section-title"><ReduBrand linked={false}>{t("rodolfoTitle")}</ReduBrand></h2>
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

          {/* The tribute (Rodolfo's voice; draft, PRIME rewrites in i18n). */}
          <section className="section">
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
