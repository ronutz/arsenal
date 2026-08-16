// ============================================================================
// src/app/[locale]/certifications/page.tsx
// ----------------------------------------------------------------------------
// CERTIFICATION STUDY-AID HUB (candidate-facing).
//
// The top-level Certifications section was repurposed on 2026-07-09: it no
// longer shows Rodolfo's own credentials (those moved to /about/credentials).
// It now serves certification CANDIDATES with blueprint-guided study maps.
//
// The hub lists each certification (a credential earned by passing one or more
// exams) and, under it, one card per exam study guide. Guides whose official
// blueprint has not yet been transcribed show an "in preparation" badge; the
// guide page itself renders an honest placeholder until the blueprint is mapped.
//
// See the ethics guardrail in src/content/certifications/study-guides.ts: these
// guides map PUBLISHED blueprint objectives to learning resources and never
// contain exam questions or dumps. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TrainingCta from "@/components/TrainingCta";
import CertificationsHubSections, {
  type HubVendorGroup,
} from "@/components/CertificationsHubSections";
import {
  getCertificationsGroupedByVendor,
  getGuidesForCertification,
  objectiveCount,
} from "@/content/certifications/study-guides";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "certGuides" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { title: t("title"), ...ogImages("page", "certifications", locale, alt) };
}

export default async function CertificationsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("certGuides");
  const tNav = await getTranslations("nav");
  const tVendors = await getTranslations("vendors");

  // -- Build the hub's vendor->certification->guide tree server-side, with
  //    every display string resolved here so the client component owns only
  //    the open/closed state (PRIME directive 2026-07-21, item 2).
  const groups: HubVendorGroup[] = getCertificationsGroupedByVendor().map((g) => ({
    vendor: g.vendor,
    vendorLabel: tVendors(`${g.vendor}.name`),
    // Vendor overview card copy (PRIME 2026-07-24). The blurb reuses the
    // EXISTING vendors namespace tagline - no new copy invented here - and the
    // count is derived, so both stay correct as guides are added.
    vendorBlurb: tVendors(`${g.vendor}.tagline`),
    vendorCount: t("vendorCount", {
      certs: g.certs.length,
      guides: g.certs.reduce((n, c) => n + getGuidesForCertification(c.key).length, 0),
    }),
    certs: g.certs.map((cert) => ({
      key: cert.key,
      name: cert.name,
      code: cert.code,
      // "all" (the default) means every listed exam is required; "one" means
      // any single one of them earns the level. Fortinet's NSE 5/6/7 are the
      // "one" case - a track lists several product exams and one suffices -
      // so rendering the F5 wording there would tell a candidate to sit eight
      // exams instead of one. (PRIME 2026-07-25)
      // "custom" suppresses the generated count line entirely: NSE 8 lists four
      // exams but requires two of them (Core + one elective), so any generated
      // count would be wrong. requirementNote carries the rule instead.
      requiresText:
        cert.requirementMode === "custom"
          ? null
          : cert.requirementMode === "one"
            ? t("requiresOne", { count: cert.examSlugs.length })
            : t("requiresAll", { count: cert.examSlugs.length }),
      // Official wording for anything the mode cannot express, e.g. NSE 8's
      // "Core practical exam AND one elective".
      requirementNote: cert.requirementNote ?? null,
      // Certifications that must be ACTIVE first, in the vendor's own wording.
      track: cert.track ?? null,
      standaloneLabel: t("standaloneTrackLabel"),
      prerequisites: cert.prerequisites ?? [],
      prerequisitesLabel: t("prerequisitesLabel"),
      retiringLabel: t("retiringLabel"),
      // The vendor's own page for THIS certification. Stored since the model
      // was written and never rendered until now, which meant a reader had no
      // one-click way to check the requirements against the source.
      sourceUrl: cert.sourceUrl ?? null,
      sourceLabel: t("officialPage"),
      renewalNote: cert.renewalNote,
      guides: getGuidesForCertification(cert.key).map((guide) => {
        const n = objectiveCount(guide);
        return {
          slug: guide.slug,
          examCode: guide.examCode,
          examName: guide.examName,
          preparing: guide.status === "preparing",
          // Surfaced on the card so a reader scanning a level sees which exams
          // are not yet sittable without opening each guide.
          availabilityNote: guide.availabilityNote ?? null,
          retirement: guide.retirement ?? null,
          badge: guide.status === "preparing" ? t("inPreparation") : t("objectivesCount", { count: n }),
          cta: t("openGuide"),
        };
      }),
    })),
  }));

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="certs-hero">
            <div className="container certs-container">
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* Study philosophy + ethics stance */}
          <section className="section">
            <div className="container certs-container certhub-notes">
              <div className="certhub-note">
                <h2 className="certhub-note-title">{t("philosophyTitle")}</h2>
                <p className="certhub-note-body">{t("philosophyBody")}</p>
              </div>
              <div className="certhub-note certhub-note--ethics">
                <h2 className="certhub-note-title">{t("ethicsTitle")}</h2>
                <p className="certhub-note-body">{t("ethicsBody")}</p>
              </div>
              {/* Good-faith / public-sources notice + takedown route (PRIME 2026-07-23). */}
              <div className="certhub-note">
                <h2 className="certhub-note-title">{t("goodFaithTitle")}</h2>
                <p className="certhub-note-body">
                  {t("goodFaithBody")}{" "}
                  <Link href="/disclaimer">{t("goodFaithLink")} →</Link>
                </p>
              </div>
            </div>
          </section>

          {/* Vendors in hub order; certifications collapsible (PRIME 2026-07-21). */}
          <CertificationsHubSections
            groups={groups}
            expandAllLabel={t("expandAll")}
            collapseAllLabel={t("collapseAll")}
            vendorsHeading={t("vendorsHeading")}
          />

          {/* Instructor-led training CTA (subtle): high-intent candidates can
              learn these live with an authorized instructor at Red Education. */}
          <section className="section">
            <div className="container certs-container">
              <TrainingCta />
            </div>
          </section>

          {/* Pointer to Rodolfo's own credentials (moved under About). */}
          <section className="section">
            <div className="container certs-container">
              <p className="certs-studyguides-pointer">
                <Link href="/about/credentials" className="certs-studyguides-link">
                  {t("credentialsPointer")} &#8594;
                </Link>
              </p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
