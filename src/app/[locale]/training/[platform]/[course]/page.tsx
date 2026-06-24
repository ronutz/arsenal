// ============================================================================
// src/app/[locale]/training/[platform]/[course]/page.tsx
// ----------------------------------------------------------------------------
// COURSE DATASHEET PAGE — one per course (28 total), statically generated for
// every (locale, platform, course) via generateStaticParams.
//
// Per the brief: each course has its own datasheet page with, at minimum, a
// description, a duration, and a table of contents. Agendas are intentionally
// deferred (to be added later from official datasheets). Descriptions are in
// original wording; the ToC is the factual module-level course structure.
// ============================================================================

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
} from "@/content/training/courses";
import { routing } from "@/i18n/routing";

// Pre-generate a page for every (locale, platform, course) triple.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    PLATFORMS.flatMap((p) =>
      p.courses.map((c) => ({ locale, platform: p.slug, course: c.slug }))
    )
  );
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; platform: string; course: string }>;
}) {
  const { locale, platform, course } = await params;
  setRequestLocale(locale);

  const p = getPlatform(platform);
  const c = getCourse(platform, course);
  if (!p || !c) notFound();

  const t = await getTranslations("training");
  const tNav = await getTranslations("nav");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
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
              {c.altName && <p className="course-alt">{c.altName}</p>}

              {/* Key facts strip */}
              <div className="course-facts">
                <span className="course-fact">
                  <span className="course-fact-label">{t("duration")}</span>
                  <span className="course-fact-value mono">{c.duration}</span>
                </span>
                <span className="course-fact">
                  <span className="course-fact-label">{t("delivery")}</span>
                  <span className="course-fact-value">{t("deliveryValue")}</span>
                </span>
                <span className="course-fact">
                  <span className="course-fact-label">{t("modules")}</span>
                  <span className="course-fact-value mono">{c.toc.length}</span>
                </span>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("aboutCourse")}</h2>
              <p className="course-description">{c.description}</p>
              {c.note && <p className="course-note">{c.note}</p>}
              <RequestTraining platform={p.slug} course={c.slug} variant="block" />
            </div>
          </section>

          {/* Table of contents */}
          <section className="section course-toc-section">
            <div className="container course-container">
              <h2 className="course-section-label">{t("tableOfContents")}</h2>
              <ol className="course-toc">
                {c.toc.map((item, i) => (
                  <li key={i} className="course-toc-item">
                    <span className="course-toc-num mono">{String(i + 1).padStart(2, "0")}</span>
                    <span className="course-toc-text">{item}</span>
                  </li>
                ))}
              </ol>
              {/* Honest placeholder: the agenda is coming from official datasheets */}
              <p className="course-agenda-pending">{t("agendaPending")}</p>
            </div>
          </section>

          {/* Other courses in this platform */}
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
                        <span className="course-more-duration mono">{other.duration}</span>
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
