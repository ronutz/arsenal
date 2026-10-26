// ============================================================================
// src/app/[locale]/training/[platform]/page.tsx
// ----------------------------------------------------------------------------
// PLATFORM PAGE — one per current pillar (F5, Extreme, Fortinet, Netskope),
// statically generated from the course catalog via generateStaticParams.
//
// Balanced emphasis: the platform (what it is and why it is taught), Rodolfo's
// authorization (instructor since a given year), and the course list. Each
// course links to its own datasheet page. The list is the personal catalogue,
// the exact set currently delivered (Model A, PRIME 2026-10-04).
//
// ROUND 1 (2026-10-25; audit CC06, CC08): tagline, intro and course summaries
// render from Localized fields (pt-BR native; other locales read the English,
// marked lang="en"); durations use the locale's plural rules. The single
// platform-level "checked on" date is gone: each course now records its own
// source, read date and last successful verification, shown on its page, so a
// re-check of one course never refreshes the others (CC08-E).
// ============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import RequestTraining from "@/components/RequestTraining";
import { PLATFORMS, getPlatform, localizedText, type Localized } from "@/content/training/courses";
import { routing } from "@/i18n/routing";

// Pre-generate a page for every (locale, platform) pair.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    PLATFORMS.map((p) => ({ locale, platform: p.slug }))
  );
}

/**
 * PAGE TITLE (2026-08-16). This route had no metadata, so every platform page
 * inherited the site default - see AUDIT-page-titles-20260816.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; platform: string }>;
}): Promise<Metadata> {
  // The route parameters.
  const { locale, platform } = await params;
  // The platform record; an unknown slug gets no metadata.
  const p = getPlatform(platform);
  if (!p) return {};
  // The title wording in the page's language (CC06).
  const t = await getTranslations({ locale, namespace: "training" });
  // "Platform training - tagline", localized.
  return { title: t("platformMetaTitle", { platform: p.name, tagline: localizedText(p.tagline, locale).text }) };
}

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ locale: string; platform: string }>;
}) {
  const { locale, platform } = await params;
  setRequestLocale(locale);

  const p = getPlatform(platform);
  if (!p) notFound();

  const t = await getTranslations("training");

  /** A Localized value for this page: its text, and the lang attribute to set when it differs from the page's language. */
  const tx = (value: Localized): { text: string; lang: string | undefined } => {
    // The authored text for this locale.
    const v = localizedText(value, locale);
    // Only English shown on a non-English page needs its own lang attribute.
    return { text: v.text, lang: v.lang === locale ? undefined : v.lang };
  };
  // The platform's tagline and introduction in this page's language.
  const tagline = tx(p.tagline);
  const intro = tx(p.intro);

  return (
    <>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="platform-hero">
            <div className="container platform-container">
              <Link href="/training" className="article-back">
                ← {t("allPlatforms")}
              </Link>
              <h1 className="platform-name">{p.name}</h1>
              <p className="platform-tagline" lang={tagline.lang}>{tagline.text}</p>
              {p.workingSince && (
                <p className="platform-authorization mono">
                  {t("workingSince", {
                    platform: p.workingTechKey ? t(`tech.${p.workingTechKey}`) : p.name,
                    year: p.workingSince,
                  })}
                </p>
              )}
              <p className="platform-authorization mono">
                {t("authorizedSince", { year: p.since })}
              </p>
            </div>
          </section>

          {/* Platform intro */}
          <section className="section">
            <div className="container platform-container">
              <p className="era-intro" lang={intro.lang}>{intro.text}</p>
            </div>
          </section>

          {/* Course list */}
          <section className="section">
            <div className="container platform-container">
              <h2 className="platform-courses-heading">
                {t("coursesHeading", { count: p.courses.length })}
              </h2>
              <ul className="course-list">
                {p.courses.map((c) => {
                  // The course's alternate name and summary in this page's language.
                  const alt = c.altName ? tx(c.altName) : null;
                  const summary = tx(c.summary);
                  return (
                  <li key={c.slug}>
                    <Link href={`/training/${p.slug}/${c.slug}`} className="course-row">
                      <span className="course-row-main">
                        <span className="course-row-name">{c.name}</span>
                        {alt && <span className="course-row-alt" lang={alt.lang}>{alt.text}</span>}
                        <span className="course-row-summary" lang={summary.lang}>{summary.text}</span>
                      </span>
                      <span className="course-row-meta">
                        <span className="course-row-duration mono">{t("daysValue", { count: c.days })}</span>
                        <span className="course-row-arrow" aria-hidden="true">
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                  );
                })}
              </ul>
              {/* Model A, the personal catalogue (PRIME, 2026-10-04): the exact
                  set currently delivered, kept current; the per-course source and
                  check dates live on each course page (Round 1, CC08). */}
              <p className="training-note">{t("personalCatalogueNote")}</p>
              <RequestTraining platform={p.slug} variant="block" />
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
