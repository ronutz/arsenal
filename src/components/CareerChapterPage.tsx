// ============================================================================
// src/components/CareerChapterPage.tsx
// ----------------------------------------------------------------------------
// A CAREER CHAPTER: what Rodolfo did inside one company.
//
// PRIME, 2026-07-29: "/about/vendors/<slug> should talk about MY experience
// with that vendor, and show cards to link to the vendor-hub and the vendor's
// /industry profile page."
//
// So this page is autobiography and nothing else. The company's own history -
// who founded it, what it bought, who bought it - lives at /industry/<slug>,
// and is reached from a card rather than repeated here. That split is the
// whole point of the restructure: a reader who wants the company gets the
// company, and a reader who wants the person gets the person, and neither has
// to scroll past the other.
//
// WHAT IT RENDERS, in order:
//   1. the years, as the eyebrow - on a career page the dates ARE the subject
//   2. tagline and opening
//   3. the numbered sections of the work itself
//   4. certifications earned in that chapter, which are evidence rather than
//      decoration and so get their own block
//   5. two cards out: the vendor hub (only where one exists) and the company
//      history (always - every career vendor has an /industry page)
//
// The content comes from the `vendors.<key>` message namespace, which is the
// same source the pages had before the split. Nothing was rewritten to make
// this page exist; the autobiographical material was already there and is now
// simply on its own page instead of buried inside a company profile.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CAREER_VENDORS, AUTHORIZED_INSTRUCTOR_VENDORS, REDU_CAREER_PARTNERS } from "@/content/vendors/career";
import VendorTags from "@/components/VendorTags";

export interface CareerChapterPageProps {
  /** Message key under `vendors`, e.g. "cisco". */
  vendorKey: string;
  /** Route slug, e.g. "cisco". */
  slug: string;
  /** Vendor-hub key when the vendor has a hub (tools), else undefined. */
  hubKey?: string;
  /** How many numbered sections this chapter has. */
  sections?: number;
}

export default async function CareerChapterPage({
  vendorKey,
  slug,
  hubKey,
  sections = 2,
}: CareerChapterPageProps) {
  const t = await getTranslations("vendors");
  const tp = await getTranslations("partnerVendors");
  const tNav = await getTranslations("nav");

  const entry = CAREER_VENDORS.find((v) => v.slug === slug);
  const years = t(`${vendorKey}.years`);

  // Only render a section when it actually has a body in the message pack.
  const bodies: { title: string; body: string }[] = [];
  for (let i = 1; i <= sections; i += 1) {
    const title = t(`${vendorKey}.s${i}Title`);
    const body = t(`${vendorKey}.s${i}Body`);
    if (title && body && !title.startsWith("vendors.")) bodies.push({ title, body });
  }

  let certs = "";
  try {
    certs = t(`${vendorKey}.certs`);
  } catch {
    certs = "";
  }

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="vendor-hero">
            <div className="container vendor-container">
              <Breadcrumbs
                items={[
                  { href: "/about", label: tNav("about") },
                  { href: "/about/vendors", label: t("indexTitle") },
                ]}
              />
              <Link href="/about/vendors" className="article-back">
                ← {t("backToVendors")}
              </Link>
              {/* On a career page the years ARE the subject, so they lead -
                  unlike the company pages, where the eyebrow says what the
                  page is because the dates belong to the company. */}
              <p className="vendor-years mono">{years}</p>
              <h1 className="vendor-name">{t(`${vendorKey}.name`)}</h1>
              <p className="vendor-tagline">{t(`${vendorKey}.tagline`)}</p>
              <VendorTags
                workedWith
                workedWithLabel={tp("workedWithYears", { years })}
                reduPartner={REDU_CAREER_PARTNERS.includes(
                  slug as (typeof REDU_CAREER_PARTNERS)[number],
                )}
                reduLabel={tp("reduPill")}
                authorizedInstructor={AUTHORIZED_INSTRUCTOR_VENDORS.includes(
                  slug as (typeof AUTHORIZED_INSTRUCTOR_VENDORS)[number],
                )}
                instructorLabel={tp("instructorPill")}
              />
            </div>
          </section>

          {/* Classes here mirror the company profile pages exactly. An
              earlier version invented `vendor-intro`, `vendor-body`,
              `vendor-section-title` and `vendor-section`, none of which exist
              in any stylesheet, so every career page shipped as unstyled
              browser defaults. */}
          <section className="section">
            <div className="container vendor-container">
              <p className="era-intro">{t(`${vendorKey}.intro`)}</p>
            </div>
          </section>

          {bodies.map((s, i) => (
            <section className="section" key={i}>
              <div className="container vendor-container">
                <h2 className="section-title">{s.title}</h2>
                <div className="partner-body">
                  {/* Split on blank lines so an author can paragraph a section
                      simply by leaving one, and a single-block string still
                      renders as one properly styled paragraph. */}
                  {s.body
                    .split(/\n\s*\n/)
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((para, j) => (
                      <p className="partner-body-p" key={j}>
                        {para}
                      </p>
                    ))}
                </div>
              </div>
            </section>
          ))}

          {certs && !certs.startsWith("vendors.") && (
            <section className="section">
              <div className="container vendor-container">
                <h2 className="section-title">{t("certsTitle")}</h2>
                {/* Certifications sit in their own block because on a career
                    page they are evidence for the claims above, not trivia. */}
                <div className="partner-body">
                  <p className="partner-body-p">{certs}</p>
                </div>
              </div>
            </section>
          )}

          <section className="section">
            <div className="container vendor-container">
              <div className="about-cred-grid">
                {hubKey && (
                  <Link href={`/${hubKey}`} className="about-cred-card">
                    <span className="about-cred-eyebrow">{t("hubCardEyebrow")}</span>
                    <span className="about-cred-title">{t("hubCardTitle")}</span>
                    <span className="about-cred-desc">{t("hubCardDesc")}</span>
                    <span className="about-cred-cta">{t("hubCardCta")} →</span>
                  </Link>
                )}
                <Link href={`/industry/${slug}`} className="about-cred-card">
                  <span className="about-cred-eyebrow">{t("historyCardEyebrow")}</span>
                  <span className="about-cred-title">
                    {t("historyCardTitle", { name: t(`${vendorKey}.name`) })}
                  </span>
                  <span className="about-cred-desc">{t("historyCardDesc")}</span>
                  <span className="about-cred-cta">{t("historyCardCta")} →</span>
                </Link>
              </div>
              {entry?.founded && (
                <p className="cidr-privacy">
                  {t("historyFoundedNote", { year: entry.founded })}
                </p>
              )}
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
