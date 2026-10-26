// ============================================================================
// src/app/[locale]/training/[platform]/[course]/page.tsx
// ----------------------------------------------------------------------------
// COURSE DATASHEET PAGE: one per course of the personal catalogue, statically
// generated for every (locale, platform, course) via generateStaticParams.
//
// ROUND 1 (2026-10-25; audit CC06, CC07, CC08). The page renders the structured
// course record of src/content/training/courses.ts, in en and pt-BR:
//   - the hero facts: duration (locale plural), delivery, and the courseware
//     version as the vendor publishes it, or "not stated publicly";
//   - the description, then the Red Education request with the booking context
//     a learner needs to carry (the destination is a vendor-level page, so the
//     course name travels in words, not in invented query parameters; CC07-D);
//   - prerequisites, certification relevance with the free study guides (their
//     own lifecycle state beside each link), and the named next course or an
//     explained "no fixed next course" (CC07-A/B/C);
//   - the outline, labelled as a summary in the site's own words, with the
//     official source, the read date, its content outcome and the day of the
//     last successful verification beside it. The old "agenda will be added"
//     placeholder is gone (CC07-E, CC08-A/B/E);
//   - sibling discovery stays, as optional browsing after the named next step.
// Site-authored text comes from Localized fields (pt-BR native; other locales
// read the English, marked lang="en"); official names and codes stay verbatim.
// ============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import RequestTraining from "@/components/RequestTraining";
import {
  PLATFORMS,
  getPlatform,
  getCourse,
  localizedText,
  resolveCourseRef,
  type Localized,
  type CertificationRelevance,
  type CourseSourceOutcome,
} from "@/content/training/courses";
// Read only: the study guides a course relates to, for their names and lifecycle state.
import { getStudyGuide } from "@/content/certifications/study-guides";
import { externalRel } from "@/config/redEducation";
import { routing } from "@/i18n/routing";

// Pre-generate a page for every (locale, platform, course) triple.
export function generateStaticParams() {
  // One entry per locale, platform and course.
  return routing.locales.flatMap((locale) =>
    // Every platform of the catalogue...
    PLATFORMS.flatMap((p) =>
      // ...and every course inside it.
      p.courses.map((c) => ({ locale, platform: p.slug, course: c.slug }))
    )
  );
}

/**
 * PAGE TITLE (2026-08-16; localized 2026-10-25 for CC06). The course pages are
 * the ones a buyer searches for BY NAME, so the title leads with the course.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; platform: string; course: string }>;
}): Promise<Metadata> {
  // The route parameters.
  const { locale, platform, course } = await params;
  // The platform and course records.
  const p = getPlatform(platform);
  const c = getCourse(platform, course);
  // An unknown pair gets no metadata (the page itself 404s).
  if (!p || !c) return {};
  // The title wording in the page's language.
  const t = await getTranslations({ locale, namespace: "training" });
  // "Course - Platform training", localized.
  return { title: t("courseMetaTitle", { course: c.name, platform: p.name }) };
}

/** The message key (under training.certKind) for each certification-relevance kind. */
const CERT_KIND_KEY: Record<CertificationRelevance["kind"], string> = {
  // The vendor's own page ties the course to the exam.
  "vendor-stated": "vendorStated",
  // The instructor's mapping of overlapping topics, labelled as such.
  "topic-overlap": "topicOverlap",
  // A deliberate "not exam-specific".
  "not-exam-specific": "notExamSpecific",
};

/** The message key (under training.outcome) for each content outcome of a source read. */
const OUTCOME_KEY: Record<CourseSourceOutcome, string> = {
  // Read and verified.
  verified: "verified",
  // Behind a sign-in.
  login_required: "loginRequired",
  // A challenge or denial answered instead.
  blocked: "blocked",
  // No vendor page or outline found.
  not_found: "notFound",
  // An empty application shell.
  application_shell: "applicationShell",
};

/** A calendar day (YYYY-MM-DD) as a long date in the page's language, read in UTC so it never shifts by a day. */
function formatDay(iso: string, locale: string): string {
  // British English for "en", as the house writes dates; every other locale its own format.
  const tag = locale === "en" ? "en-GB" : locale;
  // Day, month name and year.
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; platform: string; course: string }>;
}) {
  // The route parameters.
  const { locale, platform, course } = await params;
  // Static rendering for this locale.
  setRequestLocale(locale);

  // The platform and course records; an unknown pair is a 404.
  const p = getPlatform(platform);
  const c = getCourse(platform, course);
  if (!p || !c) notFound();

  // The training namespace holds every label of this page.
  const t = await getTranslations("training");

  /** A Localized value for this page: its text, and the lang attribute to set when it differs from the page's language. */
  const tx = (value: Localized): { text: string; lang: string | undefined } => {
    // The authored text for this locale.
    const v = localizedText(value, locale);
    // Only English shown on a non-English page needs its own lang attribute.
    return { text: v.text, lang: v.lang === locale ? undefined : v.lang };
  };

  // Official names and titles are English; they carry lang="en" on any page that is not English.
  const enLang = locale === "en" ? undefined : "en";
  // The pieces of the record rendered below.
  const alt = c.altName ? tx(c.altName) : null;
  const description = tx(c.description);
  const source = c.source;
  const cert = c.certification;
  const next = c.next;

  return (
    <>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="course-hero">
            <div className="container course-container">
              <Link href={`/training/${p.slug}`} className="article-back">
                ← {p.name}
              </Link>
              <p className="course-platform mono">{p.name}</p>
              <h1 className="course-name">{c.name}</h1>
              {alt && <p className="course-alt" lang={alt.lang}>{alt.text}</p>}

              {/* Key facts strip: duration, delivery, and the courseware version as the vendor publishes it */}
              <div className="course-facts">
                <span className="course-fact">
                  <span className="course-fact-label">{t("duration")}</span>
                  <span className="course-fact-value mono">{t("daysValue", { count: c.days })}</span>
                </span>
                <span className="course-fact">
                  <span className="course-fact-label">{t("delivery")}</span>
                  <span className="course-fact-value">{t("deliveryValue")}</span>
                </span>
                <span className="course-fact">
                  <span className="course-fact-label">{t("versionLabel")}</span>
                  <span className="course-fact-value mono">{source.version ?? t("versionNotStated")}</span>
                </span>
              </div>
            </div>
          </section>

          {/* Description, then the request with the context to carry into it */}
          <section className="section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("aboutCourse")}</h2>
              <p className="course-description" lang={description.lang}>{description.text}</p>
              <RequestTraining platform={p.slug} course={c.slug} courseName={c.name} variant="block" />
            </div>
          </section>

          {/* Prerequisites: courses of this catalogue, vendor-stated texts, or "not published" */}
          <section className="section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("prerequisitesHeading")}</h2>
              <ul className="course-more">
                {c.prerequisites.map((pre, i) => {
                  // A course of this catalogue: a link to it.
                  if ("course" in pre) {
                    // Resolve the reference (the catalogue guard keeps every reference valid).
                    const r = resolveCourseRef(pre.course);
                    if (!r) return null;
                    return (
                      <li key={i}>
                        <Link href={`/training/${r.platform.slug}/${r.course.slug}`} className="course-more-link">
                          <span className="course-more-name">{r.course.name}</span>
                          <span className="course-more-duration mono">{t("daysValue", { count: r.course.days })}</span>
                        </Link>
                      </li>
                    );
                  }
                  // No public outline: the prerequisites are unknown, said as such (an interim gap, not "none").
                  if ("unknown" in pre) {
                    return (
                      <li key={i}>
                        <span className="course-more-link">
                          <span className="course-more-name">{t("prerequisitesUnknown")}</span>
                        </span>
                      </li>
                    );
                  }
                  // A vendor-stated prerequisite, in the site's words.
                  const text = tx(pre.text);
                  return (
                    <li key={i}>
                      <span className="course-more-link">
                        <span className="course-more-name" lang={text.lang}>{text.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Certification relevance: the kind, the credential as the vendor names it, the basis, the free guides */}
          <section className="section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("certHeading")}</h2>
              <p className="course-description">
                {t(`certKind.${CERT_KIND_KEY[cert.kind]}`)}
                {cert.credential && (
                  <>
                    {": "}
                    <span lang={enLang}>{cert.credential}</span>
                  </>
                )}
              </p>
              <p className="course-note" lang={tx(cert.basis).lang}>{tx(cert.basis).text}</p>
              {cert.guides.length > 0 && (
                <ul className="course-more">
                  {cert.guides.map((slug) => {
                    // The guide record, read only; a slug that no longer resolves is skipped (the catalogue guard reports it).
                    const g = getStudyGuide(slug);
                    if (!g) return null;
                    // The guide's own state beside its link, so a superseded or unfinished guide is never presented as current.
                    const state =
                      g.status === "preparing"
                        ? t("guidePreparing")
                        : g.lifecycle?.credential === "superseded"
                          ? t("guideSuperseded")
                          : g.lifecycle?.credential === "retired"
                            ? t("guideRetired")
                            : t("guideFree");
                    // The exam named as the vendor names it, with its code when the name does not already carry it.
                    const label = g.examName.includes(g.examCode) ? g.examName : `${g.examCode}: ${g.examName}`;
                    return (
                      <li key={slug}>
                        <Link href={`/certifications/${slug}`} className="course-more-link">
                          <span className="course-more-name" lang={enLang}>{label}</span>
                          <span className="course-more-duration mono">{state}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="course-note">{t("certNoAward")}</p>
            </div>
          </section>

          {/* The recommended next step: named course(s), the vendor's follow-on, or no fixed next course */}
          <section className="section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("nextHeading")}</h2>
              {next.kind === "courses" && (
                <ul className="course-more">
                  {next.courses.map((ref) => {
                    // Resolve each named course (the catalogue guard keeps every reference valid).
                    const r = resolveCourseRef(ref);
                    if (!r) return null;
                    return (
                      <li key={`${ref.platform}/${ref.course}`}>
                        <Link href={`/training/${r.platform.slug}/${r.course.slug}`} className="course-more-link">
                          <span className="course-more-name">{r.course.name}</span>
                          <span className="course-more-duration mono">{t("daysValue", { count: r.course.days })}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {next.kind === "external" && (
                <ul className="course-more">
                  <li>
                    <a href={next.url} className="course-more-link" target="_blank" rel={externalRel(next.url)}>
                      <span className="course-more-name" lang={enLang}>{next.name}</span>
                      <span className="course-more-duration mono">{t("nextExternal")}</span>
                    </a>
                  </li>
                </ul>
              )}
              {next.kind === "none" && <p className="course-description">{t("nextNone")}</p>}
              <p className="course-note" lang={tx(next.basis).lang}>{tx(next.basis).text}</p>
            </div>
          </section>

          {/* The outline: a labelled summary, its official source and the dates of the read and of the last verification */}
          <section className="section course-toc-section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("outlineHeading")}</h2>
              <ol className="course-toc">
                {c.toc.map((item, i) => {
                  // The item in this page's language.
                  const v = tx(item);
                  return (
                    <li key={i} className="course-toc-item">
                      <span className="course-toc-num mono">{String(i + 1).padStart(2, "0")}</span>
                      <span className="course-toc-text" lang={v.lang}>{v.text}</span>
                    </li>
                  );
                })}
              </ol>
              {/* Version, edition or legacy context for the summary */}
              {c.outlineNote && <p className="course-note" lang={tx(c.outlineNote).lang}>{tx(c.outlineNote).text}</p>}
              {/* The source: linked as the official outline only when the read verified it */}
              {source.outcome === "verified" && source.url ? (
                <p className="training-note">
                  {t.rich("outlineSourceVerified", {
                    title: source.title ?? c.name,
                    link: (chunks) => (
                      <a href={source.url!} target="_blank" rel={externalRel(source.url!)} lang={enLang}>
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              ) : (
                <p className="training-note">{t("outlineSourceMissing")}</p>
              )}
              {source.finding && <p className="training-note" lang={tx(source.finding).lang}>{tx(source.finding).text}</p>}
              {source.vendorCourseId && (
                <p className="training-note training-note--checked">{t("vendorCourseId", { id: source.vendorCourseId })}</p>
              )}
              <p className="training-note training-note--checked">
                {t("sourceRead", { date: formatDay(source.checkedOn, locale), outcome: t(`outcome.${OUTCOME_KEY[source.outcome]}`) })}
              </p>
              <p className="training-note training-note--checked">
                {c.curriculumChecked
                  ? t("lastVerified", { date: formatDay(c.curriculumChecked, locale) })
                  : t("lastVerifiedNever")}
              </p>
            </div>
          </section>

          {/* Other courses in this platform: optional sibling discovery, after the named next step */}
          <section className="section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("moreFrom", { platform: p.name })}</h2>
              <ul className="course-more">
                {p.courses
                  .filter((other) => other.slug !== c.slug)
                  .slice(0, 4)
                  .map((other) => (
                    <li key={other.slug}>
                      <Link href={`/training/${p.slug}/${other.slug}`} className="course-more-link">
                        <span className="course-more-name">{other.name}</span>
                        <span className="course-more-duration mono">{t("daysValue", { count: other.days })}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
