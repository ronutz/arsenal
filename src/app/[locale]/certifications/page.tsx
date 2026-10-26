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
//
// COVERAGE (batch B3, 2026-10-26; audit CC11): each mapped card's badge says how
// many of its objectives are linked to local material beside how many it maps,
// and the hero adds one line with the totals by coverage class. That line is
// its own sentence, apart from the guide counts by status and from exam
// availability, so the number of mapped guides never reads as a local course.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
// Retirement dates as behaviour (2026-10-06): whether a notice's last sitting day has passed on the build day.
import { retirementState, formatIsoDay, type RetirementState } from "@/lib/retirement";
// The navigator (R1-b1/b2): status as data, and the folding both sides of the search use.
import { guideStatus, foldForSearch, STATUS_LABEL_KEY, GUIDE_STATUSES, type GuideStatus } from "@/lib/certStatus";
// Per-objective coverage (B3): linked to local material, official source only, or planned.
import { guideCoverage, coverageResolvers, type GuideCoverage } from "@/lib/certCoverage";
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
  const tVendors = await getTranslations("vendors");
  // The badge text of a retirement notice on the build day (src/lib/retirement.ts; 2026-10-06): the scope and the
  // state pick the words, the date stays verbatim as the vendor published it.
  const retirementBadge = (scope: "this-exam" | "previous-version", state: RetirementState, until: string): string | null =>
    scope === "this-exam"
      ? `${t(state === "passed" ? "retiredLabel" : "retiringLabel")} ${until}`
      : state === "upcoming"
        ? `${t("previousUntilLabel")} ${until}`
        : null;

  // Every status in the reader's words (R1-b1; Round 1 2026-10-25 added beta, superseded and unknown), from the one
  // dictionary the guide pages, vendor hubs and search index also use.
  const statusLabel = Object.fromEntries(GUIDE_STATUSES.map((s) => [s, t(STATUS_LABEL_KEY[s])])) as Record<GuideStatus, string>;
  // Statuses that change what a candidate should book, shown as a visible badge on the card (CC01, CC03): the hub's
  // caveat and each guide page's badge then say the same thing.
  const CARD_BADGE_STATUSES: readonly GuideStatus[] = ["beta", "superseded", "unknown"];
  // CC06 (2026-10-25): a certification note in the reader's language when one is authored, else the English with a flag
  // so the card can mark it lang="en" and tag it, instead of a silent fallback.
  const localNote = (en: string | null | undefined, pt: string | undefined): { text: string; english: boolean } | null =>
    en ? (locale === "pt-BR" && pt ? { text: pt, english: false } : { text: en, english: locale !== "en" }) : null;
  // B3 (2026-10-26): the resolvers that decide whether a link is real, and the running totals by coverage class over
  // every mapped guide the cards below render (`guides` counts the guides with at least one objective).
  const resolvers = coverageResolvers();
  const coverageTotals: GuideCoverage & { guides: number } = { linked: 0, official: 0, planned: 0, total: 0, guides: 0 };
  // Guides already added to the totals, so a guide listed under two certifications would still count once.
  const coveredSlugs = new Set<string>();

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
      // In the reader's language where authored (CC06), else the English flagged for lang="en".
      requirementNote: localNote(cert.requirementNote, cert.ptBr?.requirementNote),
      // Certifications that must be ACTIVE first, in the vendor's own wording.
      track: cert.track ?? null,
      standaloneLabel: t("standaloneTrackLabel"),
      // The Portuguese list when one is authored, else the English list, flagged the same way as the notes.
      prerequisites: (locale === "pt-BR" && cert.ptBr?.prerequisites ? cert.ptBr.prerequisites : cert.prerequisites) ?? [],
      prerequisitesEnglish: locale !== "en" && !(locale === "pt-BR" && cert.ptBr?.prerequisites) && (cert.prerequisites ?? []).length > 0,
      prerequisitesLabel: t("prerequisitesLabel"),
      // The visible tag beside an English-only note on a non-English page (CC06).
      englishOnlyLabel: t("englishOnlyTag"),
      // The vendor's own page for THIS certification. Stored since the model
      // was written and never rendered until now, which meant a reader had no
      // one-click way to check the requirements against the source.
      sourceUrl: cert.sourceUrl ?? null,
      sourceLabel: t("officialPage"),
      renewalNote: localNote(cert.renewalNote, cert.ptBr?.renewalNote),
      guides: getGuidesForCertification(cert.key).map((guide) => {
        const n = objectiveCount(guide);
        // The guide's objectives by coverage class (B3), added to the hub's totals when it has any.
        const cov = guideCoverage(guide, resolvers);
        if (cov.total > 0 && !coveredSlugs.has(guide.slug)) {
          coveredSlugs.add(guide.slug);
          coverageTotals.guides += 1;
          coverageTotals.linked += cov.linked;
          coverageTotals.official += cov.official;
          coverageTotals.planned += cov.planned;
          coverageTotals.total += cov.total;
        }
        // The guide's status on the build day (R1-b1).
        const status: GuideStatus = guideStatus(guide);
        return {
          status,
          statusLabel: statusLabel[status],
          // The visible badge for a status that changes what to book (CC01, CC03); null for the others.
          statusBadge: CARD_BADGE_STATUSES.includes(status) ? statusLabel[status] : null,
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
              // The status in the reader's words, so "superseded" or "beta" finds the records it labels (CC01-B).
              statusLabel[status],
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
          // The note is authored in English only so far; on other locales the card marks it lang="en" (CC06).
          availabilityEnglish: locale !== "en",
          retirement: guide.retirement ?? null,
          // The retirement badge, computed on the build day (2026-10-06, SCOUT's adoption audit row 8): "Retiring
          // <date>" while this guide's own exam can still be sat, "Retired <date>" once that day has passed;
          // "Previous version until <date>" while an earlier version is being withdrawn and this guide maps the
          // successor, and nothing once that day has passed, because the guide itself is current.
          retirementBadge: guide.retirement
            ? // Round 2 (PRIME 2026-10-25): the day in the reader's language, from the ISO date (the vendor's wording is
              // quoted on the guide page itself).
              retirementBadge(guide.retirement.scope, retirementState(guide.retirement.untilIso), formatIsoDay(guide.retirement.untilIso, locale))
            : null,
          // A mapped card names its objectives AND how many link to local material (B3); an empty or preparing one
          // keeps the words it had.
          badge:
            guide.status === "preparing"
              ? t("inPreparation")
              : n > 0
                ? t("objectivesCoverageBadge", { count: n, linked: cov.linked })
                : t("objectivesCount", { count: n }),
          cta: t("openGuide"),
        };
      }),
    })),
  }));

  // The readiness counts (production audit of 2026-10-15, F10): a reader took the total of guides for a count
  // of finished study products, while the collection mixes mapped guides, guides in preparation and retired
  // records. Counted from the same tree the page renders, status by status, so the line can never disagree with
  // the cards below it.
  // Round 1 (2026-10-25): beta, superseded and unknown are counted on their own, never inside "current" (S1 counts).
  const readiness = { current: 0, transitioning: 0, beta: 0, superseded: 0, unknown: 0, preparing: 0, retired: 0 };
  for (const g of groups) for (const c of g.certs) for (const guide of c.guides) readiness[guide.status] += 1;

  return (
    <>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="certs-hero">
            <div className="container certs-container">
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
              {/* The counts by status, so a placeholder cannot be mistaken for a mapped guide before it is opened. */}
              <p className="page-hero-lede certs-readiness">{t("readiness", readiness)}</p>
              {/* B3: local coverage by objective, in its own sentence so it cannot be read as a guide count or as
                  exam availability. */}
              <p className="page-hero-lede certs-readiness" data-coverage-linked={coverageTotals.linked} data-coverage-total={coverageTotals.total}>
                {t("coverageHub", coverageTotals)}
              </p>
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
                // Round 1 (2026-10-25): the three lifecycle badges a card can now carry.
                { label: t("statusBeta"), body: t("legendBeta") },
                { label: t("statusSuperseded"), body: t("legendSuperseded") },
                { label: t("statusUnknown"), body: t("legendUnknown") },
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
              {/* The four platforms taught, in the order the site names them (row 70: the box names what is
                  taught instead of "these courses", which on this hub meant every vendor's). */}
              <TrainingCta vendors={["f5", "fortinet", "extreme", "netskope"]} />
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
