// ============================================================================
// src/app/[locale]/industry/sources/[slug]/page.tsx
// ----------------------------------------------------------------------------
// A REFERENCE WORK (PRIME 2026-08-10).
//
// Renders SourceWork, the sibling schema to the vendor corpus. It is a smaller
// page than /industry/<slug> on purpose: a work has authors, a period, a body
// and citations, and does not have foundings, acquisitions or a corporate
// timeline. Nothing here pretends otherwise.
//
// THE CITATIONS ARE NOT OPTIONAL AND ARE NOT COLLAPSED. An entry whose whole
// purpose is to credit somebody's life work should show its own evidence in
// full, on the page, without the reader having to open anything.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import { routing } from "@/i18n/routing";
import { getSourceWork, sourceWorkSlugs } from "@/content/sources/pelkey";
import { externalRel } from "@/config/redEducation";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    sourceWorkSlugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const work = getSourceWork(slug);
  if (!work) return {};
  return { ...ogImages("page", `industry-sources-${slug}`, locale, work.title) };
}

export default async function SourceWorkPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const work = getSourceWork(slug);
  if (!work) notFound();

  const t = await getTranslations("sources");
  const tNav = await getTranslations("nav");
  const tIndustry = await getTranslations("industry");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="section">
            <div className="container section-narrow">
              <Breadcrumbs
                ariaLabel={tNav("breadcrumb")}
                items={[
                  { label: tNav("home"), href: "/" },
                  { label: tIndustry("navLabel"), href: "/industry" },
                  { label: t("navLabel"), href: "/industry/sources" },
                  { label: work.title },
                ]}
              />
              <p className="hero-eyebrow">{work.kind}</p>
              <h1 className="page-hero-title">{work.title}</h1>
              <p className="page-hero-lede">{work.summary}</p>
              <p className="vendor-note-body mono">{work.period}</p>
              {work.url ? (
                <p className="section-body">
                  <a href={work.url} rel={externalRel(work.url)} target="_blank">
                    {work.url}
                  </a>
                </p>
              ) : null}
            </div>
          </section>

          {/* The people, before the prose. An entry about a work exists to
              credit the people who made it, so they are not a footnote. */}
          <section className="section section-accent">
            <div className="container section-narrow">
              <h2 className="section-title">{t("authorsTitle")}</h2>
              <ul className="article-related-list">
                {work.authors.map((a) => (
                  <li key={a.name}>
                    <strong>{a.name}</strong> — {a.role}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {work.sections.map((s) => (
            <section className="section" key={s.heading}>
              <div className="container section-narrow">
                <h2 className="section-title">{s.heading}</h2>
                {s.body.map((p, n) => (
                  <p className="section-body" key={n}>
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="section section-accent">
            <div className="container section-narrow">
              <h2 className="section-title">{t("citationsTitle")}</h2>
              <ul className="article-related-list">
                {work.citations.map((c) => (
                  <li key={c.url}>
                    <a href={c.url} rel={externalRel(c.url)} target="_blank">
                      {c.label}
                    </a>
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
