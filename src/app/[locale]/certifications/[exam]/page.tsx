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
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import TrainingCta from "@/components/TrainingCta";
import { ogImages } from "@/lib/og";
import { routing } from "@/i18n/routing";
import { getAllArticles } from "@/lib/learn";
import {
  getStudyGuide,
  getAllStudyGuideSlugs,
  getCertifications,
  type Objective,
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
  return {
    title: `${guide.examName} study guide`,
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
  const tNav = await getTranslations("nav");

  // Article slug -> title, for rendering internal links by their real title.
  const articleTitle = new Map(getAllArticles(locale).map((a) => [a.slug, a.title]));

  // The certification this exam belongs to (for the "Part of ..." line).
  const cert = getCertifications().find((c) => c.key === guide.certification);

  // Vendor label for the disclaimer (proper display name; F5 kept uppercase).
  const vendorLabel = guide.vendor === "f5" ? "F5" : guide.vendor;

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
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

              {/* Metadata row: target version + blueprint source. */}
              <ul className="certguide-meta">
                <li>
                  <span className="certguide-meta-label">{t("targetsLabel")}:</span>{" "}
                  <span className="certguide-meta-value">
                    {guide.targetVersion ?? t("versionUnspecified")}
                  </span>
                </li>
                {/* At-a-glance exam facts (from the official catalog), when known. */}
                {guide.examFacts && (
                  <>
                    <li>
                      <span className="certguide-meta-label">{t("factsQuestions")}:</span>{" "}
                      <span className="certguide-meta-value">{guide.examFacts.questions}</span>
                    </li>
                    <li>
                      <span className="certguide-meta-label">{t("factsDuration")}:</span>{" "}
                      <span className="certguide-meta-value">
                        {t("factsMinutes", { minutes: guide.examFacts.minutes })}
                      </span>
                    </li>
                    <li>
                      <span className="certguide-meta-label">{t("factsPassMark")}:</span>{" "}
                      <span className="certguide-meta-value">{guide.examFacts.passMark}</span>
                    </li>
                    <li>
                      <span className="certguide-meta-label">{t("factsCost")}:</span>{" "}
                      <span className="certguide-meta-value">{guide.examFacts.cost}</span>
                    </li>
                  </>
                )}
                {guide.blueprintSourceUrl && (
                  <li>
                    <span className="certguide-meta-label">{t("sourceLabel")}:</span>{" "}
                    <a
                      href={guide.blueprintSourceUrl}
                      className="certguide-meta-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {guide.blueprintSourceLabel ?? guide.blueprintSourceUrl} ↗
                    </a>
                  </li>
                )}
              </ul>

              {guide.examFacts?.note && (
                <p className="certguide-partof">{guide.examFacts.note}</p>
              )}

              {/* Disclaimer (every guide). */}
              <p className="certguide-disclaimer">
                {t("disclaimer", { vendor: vendorLabel })}
              </p>
            </div>
          </section>

          {guide.status === "preparing" || guide.sections.length === 0 ? (
            /* -------- Preparing state: honest placeholder -------- */
            <section className="section">
              <div className="container certs-container">
                <div className="certguide-preparing">
                  <h2 className="certguide-preparing-title">{t("preparingTitle")}</h2>
                  <p className="certguide-preparing-body">{t("preparingBody")}</p>
                </div>
              </div>
            </section>
          ) : (
            /* -------- Published state: blueprint sections + objectives -------- */
            guide.sections.map((section) => (
              <section className="section certguide-section" key={section.id}>
                <div className="container certs-container">
                  <h2 className="certguide-section-title">{section.title}</h2>
                  <ul className="certguide-objectives">
                    {section.objectives.map((o) => (
                      <ObjectiveRow
                        key={o.id}
                        objective={o}
                        articleTitle={articleTitle}
                        labels={{
                          onThisSite: t("onThisSite"),
                          tools: t("toolsLabel"),
                          manual: t("manualLabel"),
                          latest: t("latestTag"),
                          articleComing: t("articleComing"),
                          keyPoints: t("keyPointsLabel"),
                        }}
                      />
                    ))}
                  </ul>
                </div>
              </section>
            ))
          )}

          {/* Good-faith / public-sources notice + takedown route (PRIME 2026-07-23).
              Appears on EVERY vendor-linked guide, not only the hub. */}
          <section className="section">
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
              the ideal person to book live training at Red Education. */}
          <section className="section">
            <div className="container certs-container">
              <TrainingCta />
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

/** One blueprint objective and its mapped resources. Server component. */
function ObjectiveRow({
  objective: o,
  articleTitle,
  labels,
}: {
  objective: Objective;
  articleTitle: Map<string, string>;
  labels: {
    onThisSite: string;
    tools: string;
    manual: string;
    latest: string;
    articleComing: string;
    keyPoints: string;
  };
}) {
  const hasArticles = o.relatedArticles.length > 0;
  const hasTools = o.relatedTools.length > 0;
  const hasManual = o.manualLinks.length > 0;

  return (
    <li className="certguide-objective">
      <p className="certguide-objective-text">
        <span className="certguide-objective-id mono">{o.id}</span> {o.text}
      </p>

      {/* Study notes: the facts to know cold for this objective. */}
      {o.keyPoints && o.keyPoints.length > 0 && (
        <div className="certguide-resource">
          <span className="certguide-resource-label">{labels.keyPoints}:</span>
          <ul className="certguide-keypoints">
            {o.keyPoints.map((k, i) => (
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

      {/* Honest content-gap marker: no internal article yet. */}
      {o.gap && !hasArticles && (
        <div className="certguide-gap">{labels.articleComing}</div>
      )}
    </li>
  );
}
