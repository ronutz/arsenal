// ============================================================================
// src/app/[locale]/training/[platform]/page.tsx
// ----------------------------------------------------------------------------
// PLATFORM PAGE — one per current pillar (F5, Extreme, Fortinet, Netskope),
// statically generated from the course catalog via generateStaticParams.
//
// Balanced emphasis: the platform (what it is and why it is taught), Rodolfo's
// authorization (instructor since a given year), and the course list. Each
// course links to its own datasheet page. The list is explicitly marked
// "representative, not exhaustive".
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import RequestTraining from "@/components/RequestTraining";
import { PLATFORMS, getPlatform } from "@/content/training/courses";
import { routing } from "@/i18n/routing";

// Pre-generate a page for every (locale, platform) pair.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    PLATFORMS.map((p) => ({ locale, platform: p.slug }))
  );
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
          <section className="platform-hero">
            <div className="container platform-container">
              <Link href="/training" className="article-back">
                ← {t("allPlatforms")}
              </Link>
              <h1 className="platform-name">{p.name}</h1>
              <p className="platform-tagline">{p.tagline}</p>
              <p className="platform-authorization mono">
                {t("authorizedSince", { year: p.since })}
              </p>
            </div>
          </section>

          {/* Platform intro */}
          <section className="section">
            <div className="container platform-container">
              <p className="era-intro">{p.intro}</p>
            </div>
          </section>

          {/* Course list */}
          <section className="section">
            <div className="container platform-container">
              <h2 className="platform-courses-heading">
                {t("coursesHeading", { count: p.courses.length })}
              </h2>
              <ul className="course-list">
                {p.courses.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/training/${p.slug}/${c.slug}`} className="course-row">
                      <span className="course-row-main">
                        <span className="course-row-name">{c.name}</span>
                        {c.altName && <span className="course-row-alt">{c.altName}</span>}
                        <span className="course-row-summary">{c.summary}</span>
                      </span>
                      <span className="course-row-meta">
                        <span className="course-row-duration mono">{c.duration}</span>
                        <span className="course-row-arrow" aria-hidden="true">
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="training-note">{t("representativeNote")}</p>
              <RequestTraining platform={p.slug} variant="block" />
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
