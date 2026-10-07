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
//
// THE NAVIGATOR (R1-b1 and b2, 2026-10-06; SCOUT's Round 1 adoption audit rows
// 8, 10 and 23; PLAN-round1-closeout-20261006): each guide's status is derived
// here on the build day (src/lib/certStatus.ts: current, in transition, in
// preparation, retired) and handed to the client component with a folded
// search text (vendor, certification name and code, the certification's earlier
// names, exam code and name, the versions a retirement notice names, the exam's
// official note), so the hub filters in place: retired exams hidden until the
// reader asks for them, and a find field that narrows every vendor at once.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
// Retirement dates as behaviour (2026-10-06): whether a notice's last sitting day has passed on the build day.
import { retirementState, type RetirementState } from "@/lib/retirement";
// The navigator (R1-b1/b2): status as data, and the folding both sides of the search use.
import { guideStatus, foldForSearch, type GuideStatus } from "@/lib/certStatus";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TrainingCta from "@/components/TrainingCta";
// The door to the open course material, in one sentence (milestone (m2), 2026-10-06).
import MaterialsDoor from "@/components/MaterialsDoor";
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
  // The badge text of a retirement notice on the build day (src/lib/retirement.ts; 2026-10-06): the scope and the
  // state pick the words, the date stays verbatim as the vendor published it.
  const retirementBadge = (scope: "this-exam" | "previous-version", state: RetirementState, until: string): string | null =>
    scope === "this-exam"
      ? `${t(state === "passed" ? "retiredLabel" : "retiringLabel")} ${until}`
      : state === "upcoming"
        ? `${t("previousUntilLabel")} ${until}`
        : null;

  // The four statuses in the reader's words (R1-b1).
  const statusLabel: Record<GuideStatus, string> = {
    current: t("statusCurrent"),
    transitioning: t("statusTransitioning"),
    preparing: t("statusPreparing"),
    retired: t("statusRetired"),
  };

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
      // The vendor's own page for THIS certification. Stored since the model
      // was written and never rendered until now, which meant a reader had no
      // one-click way to check the requirements against the source.
      sourceUrl: cert.sourceUrl ?? null,
      sourceLabel: t("officialPage"),
      renewalNote: cert.renewalNote,
      guides: getGuidesForCertification(cert.key).map((guide) => {
        const n = objectiveCount(guide);
        // The guide's status on the build day (R1-b1).
        const status: GuideStatus = guideStatus(guide);
        return {
          status,
          statusLabel: statusLabel[status],
          // Everything a candidate might type to find this exam, folded once here so the browser only compares.
          search: foldForSearch(
            [
              tVendors(`${g.vendor}.name`),
              cert.name,
              cert.code,
              ...(cert.aliases ?? []),
              guide.examCode,
              guide.examName,
              guide.retirement?.exam,
              guide.retirement?.replacedBy,
              guide.examFacts?.note,
              guide.targetVersion,
            ]
              .filter(Boolean)
              .join(" "),
          ),
          slug: guide.slug,
          examCode: guide.examCode,
          examName: guide.examName,
          preparing: guide.status === "preparing",
          // Surfaced on the card so a reader scanning a level sees which exams
          // are not yet sittable without opening each guide.
          availabilityNote: guide.availabilityNote ?? null,
          retirement: guide.retirement ?? null,
          // The retirement badge, computed on the build day (2026-10-06, SCOUT's adoption audit row 8): "Retiring
          // <date>" while this guide's own exam can still be sat, "Retired <date>" once that day has passed;
          // "Previous version until <date>" while an earlier version is being withdrawn and this guide maps the
          // successor, and nothing once that day has passed, because the guide itself is current.
          retirementBadge: guide.retirement
            ? retirementBadge(guide.retirement.scope, retirementState(guide.retirement.untilIso), guide.retirement.until)
            : null,
          badge: guide.status === "preparing" ? t("inPreparation") : t("objectivesCount", { count: n }),
          cta: t("openGuide"),
        };
      }),
    })),
  }));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
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
              {/* Before a vendor's exam, the fundamentals (m2): the open course, one sentence and the presenter. */}
              <MaterialsDoor locale={locale} context="certifications" variant="line" />
            </div>
          </section>

          {/* Vendors in hub order; certifications collapsible (PRIME 2026-07-21). */}
          <CertificationsHubSections
            groups={groups}
            expandAllLabel={t("expandAll")}
            collapseAllLabel={t("collapseAll")}
            vendorsHeading={t("vendorsHeading")}
            filter={{
              title: t("filterTitle"),
              label: t("filterLabel"),
              placeholder: t("filterPlaceholder"),
              clear: t("filterClear"),
              showRetired: t.raw("filterShowRetired") as string,
              shown: t.raw("filterShown") as string,
              noMatch: t.raw("filterNoMatch") as string,
              noMatchRetired: t.raw("filterNoMatchRetired") as string,
              legend: [
                { label: t("retiringLabel"), body: t("legendRetiring") },
                { label: t("previousUntilLabel"), body: t("legendPrevious") },
                { label: t("inPreparation"), body: t("legendPreparing") },
                { label: t("retiredLabel"), body: t("legendRetired") },
              ],
            }}
          />

          {/* Study philosophy + ethics stance. MOVED below the vendors on 2026-10-06 (R1-b2): three tall notes held the
              find field a screen down on a laptop; here they explain what the reader has just used. */}
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
