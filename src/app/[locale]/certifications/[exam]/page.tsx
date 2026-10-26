// ============================================================================
// src/app/[locale]/certifications/[exam]/page.tsx
// ----------------------------------------------------------------------------
// STUDY-GUIDE PAGE (one exam's blueprint-guided study map).
//
// Renders one StudyGuide. Two states:
//   - status "preparing": the official blueprint has not been transcribed yet,
//     so we render an honest "in preparation" placeholder plus the exam's
//     official page. (All F5-CA guides start here until PRIME relays blueprints.)
//   - status "published": each blueprint section lists its objectives; every
//     objective shows its verbatim text and the mapped learning resources
//     (Learn/KB articles, tools, and official manual pages). Objectives with no
//     internal article yet render an honest "Article coming" marker.
//
// ETHICS: this page renders PUBLISHED blueprint objectives mapped to learning
// resources. It never contains exam questions, answers, or dumps (see the
// guardrail in src/content/certifications/study-guides.ts).
//
// Statically generated: one page per locale per study-guide slug.
//
// STATUS, EARLIER NAMES, LAST CHECK (R1-b1, 2026-10-06; SCOUT's Round 1
// adoption audit rows 8, 10 and 23): the metadata row now opens with the
// guide's status on the build day (src/lib/certStatus.ts), lists the names the
// record holds for the exam's earlier versions or the exams its certification
// replaced, and the header closes with the day the record was last checked
// against the vendor's official sources (src/content/certifications/
// verification.ts), turning amber with a warning once it is older than
// FRESHNESS_DAYS.
//
// COVERAGE (batch B3, 2026-10-26; audit CC11): every objective now says, in
// words, whether it is linked to local material (a real Learn article or live
// tool), has the official source only, or has local material planned, and the
// mapped guide opens with "N of M objectives linked to local material". The
// classes come from src/lib/certCoverage.ts and are counted apart from the
// status and the exam's availability, so a mapped blueprint never reads as a
// complete local course.
//
// TRANSLATED PROSE (PRIME 26/10/2026): the availability note, the exam-facts
// strings and, where they are the site's own study notes, the key points come
// from the guide's locale overlay (src/lib/certLocale.ts). Translated text drops
// lang="en" and the "English only" tag; whatever is still the English original
// on a non-English page keeps both. The English page renders exactly as before.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
// Retirement dates as behaviour (2026-10-06): whether a notice's last sitting day has passed on the build day.
import { retirementState, formatIsoDay } from "@/lib/retirement";
// The navigator's rules (R1-b1): status as data, and how fresh the record's last check is.
import { guideStatus, freshness, FRESHNESS_DAYS, STATUS_LABEL_KEY, GUIDE_STATUSES, type GuideStatus } from "@/lib/certStatus";
// The day each record was last checked against the vendor's official sources.
import { getGuideVerification } from "@/content/certifications/verification";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// The training box, and the vendors whose courses are taught (row 70: the box appears only on their guides).
import TrainingCta, { TAUGHT_VENDORS } from "@/components/TrainingCta";
import { ogImages } from "@/lib/og";
import { routing } from "@/i18n/routing";
import { getAllArticles } from "@/lib/learn";
// Per-objective coverage (B3): linked to local material, official source only, or planned.
import { objectiveCoverage, guideCoverage, coverageResolvers, type ObjectiveCoverage } from "@/lib/certCoverage";
// The guide's prose in the reader's language, with the English original flagged wherever it remains (26/10/2026).
import { localAvailabilityNote, localExamFacts, localKeyPoints, keyPointsPresentation } from "@/lib/certLocale";
// A note's segments, with any quotation of the vendor's words kept in English.
import CertNoteText from "@/components/CertNoteText";
import {
  getStudyGuide,
  getAllStudyGuideSlugs,
  getAllStudyGuides,
  getCertifications,
  type Objective,
  type StudyGuide,
} from "@/content/certifications/study-guides";

// One static page per locale per study-guide slug.
export function generateStaticParams() {
  const slugs = getAllStudyGuideSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((exam) => ({ locale, exam })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; exam: string }>;
}) {
  const { locale, exam } = await params;
  const guide = getStudyGuide(exam);
  if (!guide) return {};
  // The certGuides words for this locale (CC06, 2026-10-25: the title used to be English on every locale).
  const t = await getTranslations({ locale, namespace: "certGuides" });
  // The guide's status on the build day; a status that changes what to book also goes into the description, in the
  // same words the page and the hub use, so search snippets cannot present a superseded or beta record as current.
  const status = guideStatus(guide);
  // "announced" joined the list on 26/10/2026: an exam not yet open for booking must not read as current in a snippet.
  const flagged = status === "superseded" || status === "beta" || status === "unknown" || status === "retired" || status === "announced";
  return {
    title: t("metaTitle", { exam: guide.examName }),
    ...(flagged ? { description: `${t("statusLabel")}: ${t(STATUS_LABEL_KEY[status])}.` } : {}),
    ...ogImages("guide", exam, locale, guide.examName),
  };
}

export default async function StudyGuidePage({
  params,
}: {
  params: Promise<{ locale: string; exam: string }>;
}) {
  const { locale, exam } = await params;
  setRequestLocale(locale);

  const guide = getStudyGuide(exam);
  if (!guide) notFound();

  const t = await getTranslations("certGuides");

  // Article slug -> title, for rendering internal links by their real title.
  const articleTitle = new Map(getAllArticles(locale).map((a) => [a.slug, a.title]));

  // The certification this exam belongs to (for the "Part of ..." line).
  const cert = getCertifications().find((c) => c.key === guide.certification);

  // Vendor label for the disclaimer and the retirement notice: the vendor's display name from the same message map
  // the vendor hubs use ("Check Point", "Fortinet", "Ping Identity"). Until 2026-10-06 only F5 was mapped and every
  // other guide printed its raw key ("endorsed by checkpoint", "fortinet's own certification portal"), found while
  // checking SCOUT's adoption audit; the key stays the fallback for a vendor the map does not know.
  const tTools = await getTranslations("tools");
  const vendorLabel = tTools.has(`vendors.${guide.vendor}`) ? tTools(`vendors.${guide.vendor}`) : guide.vendor;
  // Where the retirement notice stands on the build day (src/lib/retirement.ts), when the guide carries one.
  const retirementNow = guide.retirement ? retirementState(guide.retirement.untilIso) : null;
  // The guide's status on the build day, in the reader's words (R1-b1).
  const status: GuideStatus = guideStatus(guide);
  // An exam that can no longer be sat and was never mapped is an archived record, not a guide in preparation
  // (row 70, SCOUT 2026-10-07: three retired Check Point guides said "Study guide in preparation").
  const unmapped = guide.status === "preparing" || guide.sections.length === 0;
  const archived = status === "retired" && unmapped;
  // Every status in the reader's words, from the one dictionary the hub and the vendor hubs also use (Round 1 added
  // beta, superseded and unknown, 2026-10-25).
  const statusWords = Object.fromEntries(GUIDE_STATUSES.map((s) => [s, t(STATUS_LABEL_KEY[s])])) as Record<GuideStatus, string>;
  // The names a candidate may know this exam by: the certification's recorded earlier names, and the earlier version a
  // retirement notice names when this guide maps its successor (never the successor of a retiring exam, which is
  // another exam). Deduplicated, in that order. An earlier version that has its OWN guide in a version family is a
  // different exam with its own page, not another name for this one (CC05, 2026-10-25).
  const alsoKnownAs = [
    ...new Set([
      ...(cert?.aliases ?? []),
      ...(guide.retirement?.scope === "previous-version" && !guide.versionFamily ? [guide.retirement.exam] : []),
    ]),
  ];
  // ---- Round 1 (2026-10-25): lifecycle, duration, versions and source checks ----
  // A day in the reader's language, date-only and pinned to UTC so no browser timezone can move it (CC05-C).
  const dayText = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  // The authored-locale half of a two-language text: pt-BR on pt-BR pages, English everywhere else.
  const pick = (text: { en: string; "pt-BR": string }) => (locale === "pt-BR" ? text["pt-BR"] : text.en);
  // The lifecycle record, when the guide carries one (S1).
  const lc = guide.lifecycle ?? null;
  // Exam availability as it stands on the build day: a "retiring" record whose own last sitting day has passed reads
  // "retired" without waiting for an edit, the same rule the status follows (CC05-D).
  const availabilityNow = lc
    ? lc.examAvailability === "retiring" && guide.retirement?.scope === "this-exam" && retirementNow === "passed"
      ? "retired"
      : lc.examAvailability
    : null;
  // The availability in words (Round 2, PRIME 2026-10-25): a retiring exam names its last day in the reader's language,
  // and booking behind a sign-in names the portal, so neither reads as a bare "unknown".
  const availabilityText =
    availabilityNow === "retiring" && guide.retirement?.scope === "this-exam"
      ? t("availability.retiringOn", { date: formatIsoDay(guide.retirement.untilIso, locale) })
      : availabilityNow === "sign_in_required"
        ? t("availability.sign_in_required", { portal: lc?.bookingPortal ?? vendorLabel })
        : t(`availability.${availabilityNow ?? "unknown"}`);
  // The successor's own guide, for the superseded notice's link (CC01).
  const successor = lc?.successorSlug ? getStudyGuide(lc.successorSlug) ?? null : null;
  // The time limit in words: a positive number of minutes, or the meaning of its absence; never "0 minutes" (CC02).
  const durationText = (facts: NonNullable<StudyGuide["examFacts"]>): string => {
    // What the value means; an omitted policy is a fixed time limit.
    const policy = facts.durationPolicy ?? "fixed";
    // A fixed, positive, finite number of minutes is the only case that prints a number.
    if (policy === "fixed" && typeof facts.minutes === "number" && Number.isFinite(facts.minutes) && facts.minutes > 0) {
      return t("factsMinutes", { minutes: facts.minutes });
    }
    // The vendor says so explicitly.
    if (policy === "explicitly_untimed") return t("durationUntimed");
    // The vendor publishes no single figure.
    if (policy === "variable") return t("durationVariable");
    // Everything else, a malformed value included, is unknown (the guard keeps those from shipping anyway).
    return t("durationUnknown");
  };
  // The other versions of this exam, oldest first, when the guide belongs to a version family (CC05).
  const family = guide.versionFamily
    ? getAllStudyGuides()
        .filter((g) => g.versionFamily?.key === guide.versionFamily!.key)
        .sort((a, b) => a.versionFamily!.order - b.versionFamily!.order)
    : [];
  // The version this guide's diff compares with (CC05).
  const diffFrom = guide.versionDiff ? getStudyGuide(guide.versionDiff.fromSlug) ?? null : null;
  // The diff's counts by kind, for its summary line.
  const diffCounts = { unchanged: 0, changed: 0, new: 0, removed: 0 };
  for (const item of guide.versionDiff?.items ?? []) diffCounts[item.kind] += 1;
  // On a non-English page, source titles and vendor wording stay in English and say so to assistive technology (CC06).
  const enLang = locale === "en" ? undefined : "en";
  // The guide's translatable prose in the reader's language (26/10/2026): each value says whether it is still English.
  const availabilityNote = localAvailabilityNote(guide, locale);
  // The exam-facts strings; minutes and the duration policy stay the record's own (durationText below).
  const facts = localExamFacts(guide, locale);
  // How the key points are presented in this locale, for the matching disclosure; null keeps the general one.
  const kpPresentation = keyPointsPresentation(guide, locale);
  // The disclosure's message key: a variant only on the pt-BR page, where the presentation is decided per guide.
  const disclosureKey =
    locale === "pt-BR" && kpPresentation === "vendor-verbatim"
      ? "mappingDisclosureVerbatim"
      : locale === "pt-BR" && kpPresentation === "site-notes"
        ? "mappingDisclosureNotes"
        : locale === "pt-BR" && kpPresentation === "mixed"
          ? "mappingDisclosureMixed"
          : "mappingDisclosure";
  // The record's last check against the vendor's sources, its date in the reader's language, and whether it is stale.
  const verification = getGuideVerification(guide.slug);
  const checkedDate = verification
    ? new Date(`${verification.on}T00:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;
  const checkedStale = verification ? freshness(verification.on) === "stale" : false;
  // B3 (2026-10-26): the resolvers that decide whether a link is real, and the guide's objectives counted by class.
  const resolvers = coverageResolvers();
  const coverage = guideCoverage(guide, resolvers);
  // Each coverage class in the reader's words, for the marker under every objective.
  const coverageWords: Record<ObjectiveCoverage, string> = {
    // A real Learn article or live tool is linked.
    linked: t("coverage.linked"),
    // Only the vendor's own source is cited.
    official: t("coverage.official"),
    // Local material is still to come.
    planned: t("coverage.planned"),
  };

  return (
    <>
      <Header />

      <main id="main">
        <article>
          <section className="section">
            <div className="container certs-container">
              {/* Breadcrumb back to the hub. */}
              <Link href="/certifications" className="article-back">
                ← {t("backToHub")}
              </Link>

              {/* Exam header: code, name, and which certification it belongs to. */}
              <p className="hero-eyebrow mono">{guide.examCode}</p>
              <h1 className="page-hero-title">{guide.examName}</h1>
              {cert && (
                <p className="certguide-partof">
                  {t("partOf", { cert: cert.name })}
                </p>
              )}

              {/* Metadata row: status, target version, exam facts, blueprint source. */}
              <ul className="certguide-meta">
                {/* The status first: it decides whether the rest is worth booking against (R1-b1). */}
                <li>
                  <span className="certguide-meta-label">{t("statusLabel")}:</span>{" "}
                  <span className={`certguide-status certguide-status--${status}`} data-status={status}>
                    {statusWords[status]}
                  </span>
                </li>
                {/* S1 (Round 1, 2026-10-25): exam availability and the blueprint's own context, each a separate fact
                    from the status above and from whether the objectives are mapped here. */}
                {lc && (
                  <li>
                    <span className="certguide-meta-label">{t("availabilityLabel")}:</span>{" "}
                    <span className="certguide-meta-value" data-availability={availabilityNow ?? undefined}>
                      {availabilityText}
                    </span>
                  </li>
                )}
                {lc && (
                  <li>
                    <span className="certguide-meta-label">{t("blueprintContextLabel")}:</span>{" "}
                    <span className="certguide-meta-value" data-blueprint={lc.blueprint}>
                      {t(`blueprintContext.${lc.blueprint}`)}
                      {/* The document's identifier and validity, verbatim as the vendor printed them. */}
                      {lc.blueprintId && <span lang={enLang}>{` · ${lc.blueprintId}`}</span>}
                      {lc.blueprintValidity && <span lang={enLang}>{` · ${lc.blueprintValidity}`}</span>}
                    </span>
                  </li>
                )}
                {/* Earlier names, when the record holds any. */}
                {alsoKnownAs.length > 0 && (
                  <li>
                    <span className="certguide-meta-label">{t("alsoKnownAs")}:</span>{" "}
                    <span className="certguide-meta-value">{alsoKnownAs.join(" · ")}</span>
                  </li>
                )}
                <li>
                  <span className="certguide-meta-label">{t("targetsLabel")}:</span>{" "}
                  <span className="certguide-meta-value">
                    {guide.targetVersion ?? t("versionUnspecified")}
                  </span>
                </li>
                {/* At-a-glance exam facts (from the official catalog), when known. */}
                {guide.examFacts && facts && (
                  <>
                    <li>
                      <span className="certguide-meta-label">{t("factsQuestions")}:</span>{" "}
                      {/* Each string in the reader's language, or the English original marked lang="en" (26/10/2026). */}
                      <span className="certguide-meta-value" lang={facts.questions.english ? "en" : undefined}>{facts.questions.text}</span>
                    </li>
                    <li>
                      <span className="certguide-meta-label">{t("factsDuration")}:</span>{" "}
                      {/* A positive number of minutes, or the meaning of its absence (CC02): never "0 minutes". */}
                      <span className="certguide-meta-value" data-duration-policy={guide.examFacts.durationPolicy ?? "fixed"}>
                        {durationText(guide.examFacts)}
                      </span>
                    </li>
                    <li>
                      <span className="certguide-meta-label">{t("factsPassMark")}:</span>{" "}
                      <span className="certguide-meta-value" lang={facts.passMark.english ? "en" : undefined}>{facts.passMark.text}</span>
                    </li>
                    <li>
                      <span className="certguide-meta-label">{t("factsCost")}:</span>{" "}
                      <span className="certguide-meta-value" lang={facts.cost.english ? "en" : undefined}>{facts.cost.text}</span>
                    </li>
                  </>
                )}
                {guide.blueprintSourceUrl && (
                  <li>
                    <span className="certguide-meta-label">{t("sourceLabel")}:</span>{" "}
                    {/* The source's own title, in its own language (CC04: identity only, no editorial history). */}
                    <a
                      href={guide.blueprintSourceUrl}
                      className="certguide-meta-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      lang={enLang}
                    >
                      {guide.blueprintSourceLabel ?? guide.blueprintSourceUrl} ↗
                    </a>
                  </li>
                )}
              </ul>

              {facts?.note && (
                /* The one-line note in the reader's language where translated (26/10/2026); the English original stays
                   marked lang="en" on other locales (CC06). */
                <p className="certguide-partof" lang={facts.note.english ? "en" : undefined}>{facts.note.text}</p>
              )}

              {/* The record's last check against the vendor's sources (R1-b1); amber, with the reason, once stale. */}
              {verification && checkedDate && (
                <p className={`certguide-checked${checkedStale ? " certguide-checked--stale" : ""}`}>
                  {t("checkedOn", { vendor: vendorLabel, date: checkedDate })}
                  {checkedStale ? ` ${t("checkedStale", { days: FRESHNESS_DAYS })}` : ""}
                </p>
              )}

              {/* Disclaimer (every guide). */}
              <p className="certguide-disclaimer">
                {t("disclaimer", { vendor: vendorLabel })}
              </p>
            </div>
          </section>

          {/* CC01 (Round 1, 2026-10-25): a superseded credential says so where a candidate arrives, links its successor
              and explains why the old page stays: its own objectives and incoming links remain meaningful. */}
          {status === "superseded" && (
            <section className="section section-accent">
              <div className="container certs-container">
                <p className="cidr-privacy">
                  <strong>
                    {successor
                      ? t("supersededNotice", { vendor: vendorLabel, exam: guide.examCode, successor: successor.examName })
                      : t("supersededNoticeNoGuide", { vendor: vendorLabel, exam: guide.examCode })}
                  </strong>{" "}
                  {t("supersededHistorical", { exam: guide.examCode })}
                </p>
                {successor && (
                  <p className="certs-studyguides-pointer">
                    <Link href={`/certifications/${successor.slug}`} className="certs-studyguides-link">
                      {t("supersededLink", { successor: successor.examName })} &#8594;
                    </Link>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* CC05 (Round 1, 2026-10-25): an exam offered in several versions. Each version is its own page with its own
              objectives, so a shared link always opens the version it names and a locale switch keeps it. */}
          {family.length > 1 && (
            <section className="section">
              <div className="container certs-container">
                <nav aria-labelledby="certguide-versions-title">
                  <h2 className="certguide-section-title" id="certguide-versions-title">{t("versionsTitle")}</h2>
                  <p className="certhub-note-body">{t("versionsIntro", { vendor: vendorLabel })}</p>
                  <ul className="hub-chip-row">
                    {family.map((v) => {
                      // The version's own status on the build day, so a reader sees which one is withdrawn when.
                      const vStatus = guideStatus(v);
                      // The page being read is marked rather than linked.
                      const here = v.slug === guide.slug;
                      return (
                        <li key={v.slug}>
                          {here ? (
                            <span className="hub-chip" aria-current="page">
                              {t("versionChip", { version: v.versionFamily!.label, status: statusWords[vStatus] })} ({t("versionHere")})
                            </span>
                          ) : (
                            <Link href={`/certifications/${v.slug}`} className="hub-chip">
                              {t("versionChip", { version: v.versionFamily!.label, status: statusWords[vStatus] })}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </section>
          )}

          {/* CC05: what changed from the earlier version, objective by objective; texts verbatim from each blueprint. */}
          {guide.versionDiff && diffFrom && (
            <section className="section">
              <div className="container certs-container">
                <h2 className="certguide-section-title">{t("diffTitle", { from: diffFrom.examName })}</h2>
                <p className="certhub-note-body">{t("diffSummary", diffCounts)}</p>
                <ul className="certguide-objectives">
                  {guide.versionDiff.items
                    .filter((item) => item.kind !== "unchanged")
                    .map((item) => (
                      <li className="certguide-objective" key={`${item.kind}-${item.id}`}>
                        <p className="certguide-objective-text">
                          <span className="certguide-objective-id mono">{item.id}</span> {t(`diffKind.${item.kind}`)}
                        </p>
                        {item.before && (
                          <div className="certguide-resource">
                            <span className="certguide-resource-label">{t("diffBefore")}:</span>{" "}
                            <span lang={enLang}>{item.before}</span>
                          </div>
                        )}
                        {item.after && (
                          <div className="certguide-resource">
                            <span className="certguide-resource-label">{t("diffAfter")}:</span>{" "}
                            <span lang={enLang}>{item.after}</span>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
                {guide.versionDiff.notes.map((note, i) => (
                  <p className="certhub-note-body" key={i}>{pick(note)}</p>
                ))}
              </div>
            </section>
          )}

          {/* S2 (Round 1, 2026-10-25): the dated first-party reads behind the lifecycle, availability and duration
              facts, each with what it actually showed. A page that answered with an application shell, a sign-in or
              a bot challenge is listed as exactly that, never as a verification. */}
          {guide.checks && guide.checks.length > 0 && (
            <section className="section">
              <div className="container certs-container">
                <h2 className="certguide-section-title">{t("checksTitle")}</h2>
                <ul className="certguide-keypoints">
                  {guide.checks.map((c) => (
                    <li key={`${c.url}-${c.on}`} data-outcome={c.outcome}>
                      {dayText(c.on)}:{" "}
                      <a href={c.url} className="certguide-resource-link" target="_blank" rel="noopener noreferrer" lang={enLang}>
                        {c.title} ↗
                      </a>
                      {". "}
                      <strong>{t(`checkOutcome.${c.outcome}`)}</strong>
                      {c.finding ? `. ${pick(c.finding)}` : "."}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

              {guide.retirement && (
            /* A retiring exam has a deadline and usually a successor, and
               both change what a candidate should book. Names and dates
               stay verbatim; only the surrounding words are localised.
               Since 2026-10-06 the words follow the build day and the
               notice's scope (src/lib/retirement.ts): a date that has
               passed is told in the past tense, and a notice about a
               PREVIOUS version says that this guide maps the successor,
               instead of reading as if this guide's exam were the one
               going away (SCOUT's adoption audit, row 8). */
            <section className="section section-accent">
              <div className="container certs-container">
                <p className="cidr-privacy">
                  <strong>
                    {guide.retirement.scope === "previous-version"
                      ? t(retirementNow === "passed" ? "retirementPreviousPastNotice" : "retirementPreviousNotice", {
                          exam: guide.retirement.exam,
                          // Round 2 (PRIME 2026-10-25): the day in the reader's language, from the ISO date.
                          until: formatIsoDay(guide.retirement.untilIso, locale),
                        })
                      : t(retirementNow === "passed" ? "retirementPastNotice" : "retirementNotice", {
                          exam: guide.retirement.exam,
                          until: formatIsoDay(guide.retirement.untilIso, locale),
                        })}
                  </strong>
                  {guide.retirement.replacedBy
                    ? ` ${
                        guide.retirement.scope === "previous-version"
                          ? t("retirementMapsSuccessor", { exam: guide.retirement.replacedBy })
                          : retirementNow === "passed"
                            ? t("retirementSuccessorIs", { exam: guide.retirement.replacedBy })
                            : t("retirementReplacedBy", { exam: guide.retirement.replacedBy })
                      }`
                    : ` ${t("retirementNoReplacement", { vendor: vendorLabel })}`}
                  {/* The vendor's own wording of the date, kept as a quotation in its language (Round 2). On English
                      pages the localised day already reads the same, so the quotation would only repeat it. */}
                  {locale !== "en" && (
                    <>
                      {" "}({t("vendorWording", { vendor: vendorLabel })}: <q lang="en">{guide.retirement.until}</q>)
                    </>
                  )}
                </p>
              </div>
            </section>
          )}
          {unmapped ? (
            /* -------- Preparing state: honest placeholder -------- */
            <section className="section">
              <div className="container certs-container">
                <div className="certguide-preparing">
                  {/* Retired and unmapped: an archived record; otherwise the mapping is still to come. */}
                  <h2 className="certguide-preparing-title">{t(archived ? "archivedTitle" : "preparingTitle")}</h2>
                  {/* Availability is a DIFFERENT fact from transcription status:
                      "we have not mapped it yet" vs "the vendor has not shipped
                      the exam yet". The second changes whether a candidate can
                      book anything, so it goes first. (2026-07-25) */}
                  {availabilityNote && (
                    <p className="certguide-preparing-body">
                      {/* Translated where an overlay has it (26/10/2026), quotations of the vendor kept in English;
                          otherwise the English original, marked lang="en" and tagged on other locales (CC06). */}
                      <strong lang={availabilityNote.english ? "en" : undefined}>
                        <CertNoteText parts={availabilityNote.parts} />
                      </strong>
                      {availabilityNote.english && <span className="cert-renewal-muted"> ({t("englishOnlyTag")})</span>}
                    </p>
                  )}
                  <p className="certguide-preparing-body">{t(archived ? "archivedBody" : "preparingBody")}</p>
                </div>
              </div>
            </section>
          ) : (
            /* -------- Published state: blueprint sections + objectives -------- */
            <>
              {/* CC04 (Round 1, 2026-10-25): which words are the vendor's and which are this site's, said in ordinary
                  language on every mapped guide instead of in an editorial note inside the source label. */}
              <section className="section">
                <div className="container certs-container">
                  {/* On pt-BR the sentence says how THIS guide's key points are presented (26/10/2026). */}
                  <p className="certhub-note-body">{t(disclosureKey, { vendor: vendorLabel })}</p>
                  {/* B3: how much of this mapped blueprint the site's own articles and tools reach, counted apart from
                      the status and availability above (a mapped guide is not a complete local course). */}
                  <p className="certhub-note-body" data-coverage-linked={coverage.linked} data-coverage-total={coverage.total}>
                    {t("coverageSummary", coverage)}
                  </p>
                </div>
              </section>
              {guide.sourceCaveat === "course-objectives" && (
                /* The vendor has not published an exam blueprint for this one, so
                   these come from the COURSE page. Same material, different
                   artifact: say which, rather than let a reader assume. The
                   vendor is the record's own (row 62, 2026-10-07: the Check Point
                   PenTesting guides used to say "Fortinet's course page"). */
                <section className="section section-accent">
                  <div className="container certs-container">
                    <p className="cidr-privacy">{t("sourceCaveatCourse", { vendor: vendorLabel })}</p>
                  </div>
                </section>
              )}
              {guide.sourceCaveat === "truncated-blueprint" && (
                /* The vendor's own blueprint is defective for this exam, so say
                   so where a candidate will see it. The honest alternative to
                   silently reconstructing text Fortinet never published. */
                <section className="section">
                  <div className="container certs-container">
                    <p className="cidr-privacy">{t("sourceCaveatTruncated", { vendor: vendorLabel })}</p>
                  </div>
                </section>
              )}
              {guide.sections.map((section) => (
              <section className="section certguide-section" key={section.id}>
                <div className="container certs-container">
                  <h2 className="certguide-section-title">{section.title}</h2>
                  <ul className="certguide-objectives">
                    {section.objectives.map((o) => (
                      <ObjectiveRow
                        key={o.id}
                        objective={o}
                        keyPoints={localKeyPoints(guide, o, locale)}
                        articleTitle={articleTitle}
                        coverage={objectiveCoverage(o, guide, resolvers)}
                        lang={enLang}
                        labels={{
                          onThisSite: t("onThisSite"),
                          tools: t("toolsLabel"),
                          manual: t("manualLabel"),
                          latest: t("latestTag"),
                          articleComing: t("articleComing"),
                          keyPoints: t("keyPointsLabel"),
                          coverage: t("coverageLabel"),
                          coverageWords,
                        }}
                      />
                    ))}
                  </ul>
                </div>
              </section>
            ))}
            </>
          )}

          {/* Good-faith / public-sources notice + takedown route (PRIME 2026-07-23).
              Appears on EVERY vendor-linked guide, not only the hub. */}
          <section className="section section-accent">
            <div className="container certs-container certhub-notes">
              <div className="certhub-note">
                <h2 className="certhub-note-title">{t("goodFaithTitle")}</h2>
                <p className="certhub-note-body">
                  {t("goodFaithBody")}{" "}
                  <Link href="/disclaimer">{t("goodFaithLink")} →</Link>
                </p>
              </div>
            </div>
          </section>

          {/* Instructor-led training CTA (subtle): a candidate on this exam is
              the ideal person to book live training at Red Education. Only on
              the guides of a vendor whose courses are taught (row 70, PRIME
              2026-10-07: "Hide it there"), naming that vendor. */}
          {TAUGHT_VENDORS.includes(guide.vendor) && (
            <section className="section">
              <div className="container certs-container">
                <TrainingCta vendors={[guide.vendor]} />
              </div>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

/** One blueprint objective and its mapped resources. Server component. */
function ObjectiveRow({
  objective: o,
  keyPoints,
  articleTitle,
  coverage,
  lang,
  labels,
}: {
  objective: Objective;
  /** The objective's key points in the reader's language, or the English list flagged for lang="en" (26/10/2026). */
  keyPoints: { items: readonly string[]; english: boolean };
  articleTitle: Map<string, string>;
  /** The objective's coverage class (B3), derived from links that resolve (src/lib/certCoverage.ts). */
  coverage: ObjectiveCoverage;
  /** "en" on a non-English page: the objective text stays in the blueprint's English (CC06). */
  lang?: string;
  labels: {
    onThisSite: string;
    tools: string;
    manual: string;
    latest: string;
    articleComing: string;
    keyPoints: string;
    /** "Coverage", the marker's label. */
    coverage: string;
    /** Each coverage class in the reader's words. */
    coverageWords: Record<ObjectiveCoverage, string>;
  };
}) {
  const hasArticles = o.relatedArticles.length > 0;
  const hasTools = o.relatedTools.length > 0;
  const hasManual = o.manualLinks.length > 0;

  return (
    <li className="certguide-objective">
      <p className="certguide-objective-text">
        <span className="certguide-objective-id mono">{o.id}</span> <span lang={lang}>{o.text}</span>
      </p>

      {/* B3: the coverage class in words (never colour alone), right under the objective it describes. */}
      <div className="certguide-resource" data-coverage={coverage}>
        <span className="certguide-resource-label">{labels.coverage}:</span> {labels.coverageWords[coverage]}
      </div>

      {/* Study notes: the facts to know cold for this objective. */}
      {keyPoints.items.length > 0 && (
        <div className="certguide-resource">
          <span className="certguide-resource-label">{labels.keyPoints}:</span>
          {/* lang="en" only while the list is the English original (verbatim vendor sub-points, or not yet translated). */}
          <ul className="certguide-keypoints" lang={keyPoints.english ? "en" : undefined}>
            {keyPoints.items.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      )}

      {hasArticles && (
        <div className="certguide-resource">
          <span className="certguide-resource-label">{labels.onThisSite}:</span>{" "}
          {o.relatedArticles.map((slug, i) => (
            <span key={slug}>
              {i > 0 && ", "}
              <Link href={`/learn/${slug}`} className="certguide-resource-link">
                {articleTitle.get(slug) ?? slug}
              </Link>
            </span>
          ))}
        </div>
      )}

      {hasTools && (
        <div className="certguide-resource">
          <span className="certguide-resource-label">{labels.tools}:</span>{" "}
          {o.relatedTools.map((slug, i) => (
            <span key={slug}>
              {i > 0 && ", "}
              <Link href={`/tools/${slug}`} className="certguide-resource-link mono">
                {slug}
              </Link>
            </span>
          ))}
        </div>
      )}

      {hasManual && (
        <div className="certguide-resource">
          <span className="certguide-resource-label">{labels.manual}:</span>{" "}
          {o.manualLinks.map((m, i) => (
            <span key={m.url}>
              {i > 0 && ", "}
              <a
                href={m.url}
                className="certguide-resource-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {m.label}
                {m.version === null ? ` (${labels.latest})` : ` (${m.version})`} ↗
              </a>
            </span>
          ))}
        </div>
      )}

      {/* Honest content-gap marker: no internal article yet. When the coverage marker already says local material is
          planned (B3), it would only repeat it, so it stays for a gap that a tool already partly covers. */}
      {o.gap && !hasArticles && coverage !== "planned" && (
        <div className="certguide-gap">{labels.articleComing}</div>
      )}
    </li>
  );
}
