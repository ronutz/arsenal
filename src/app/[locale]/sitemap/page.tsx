// ============================================================================
// src/app/[locale]/sitemap/page.tsx
// ----------------------------------------------------------------------------
// THE HUMAN SITEMAP (PRIME directive 2026-07-16) - a curated, readable map of
// every section of the site, linked from the footer's machine row. The
// machine-readable sitemap.xml (986 routes x 16 locales, generated at build
// time by gen-machine-legible) is linked from here; this page is the human
// counterpart: section-level, not route-exhaustive. The tools count is live
// from the registry so it can never go stale. Statically generated per locale.
// NOTE: the folder name "sitemap" is a plain route segment; Next's reserved
// sitemap convention applies to sitemap.(xml|ts) FILES, not folders.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { tools } from "@/config/tools";
import { WORLDS, PROJECT_GROUPS } from "@/config/worlds";
// The subject pages, one rule shared with /category/<key> (2026-10-06).
import { subjectKeys } from "@/lib/subjects";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sitemap" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SitemapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sitemap");
  const tNav = await getTranslations("nav");
  // The reconstructed earlier sites take their titles from the wrapper pages' copy (2026-10-05).
  const tClone = await getTranslations("earlierSites.clone");

  // THE FIVE SYSTEMS (wave 0, 2026-10-05; SCOUT G21): the same five worlds as the home directory and the footer,
  // from the shared registry, each with its primary entries and then the further pages only this map lists.
  // Section-level by design: the exhaustive list is sitemap.xml's job.
  const tHome = await getTranslations("home");
  const tFooter = await getTranslations("footer");
  /** A registry label key to its text (see src/config/worlds.ts for the key forms). */
  const label = (key: string) => key.startsWith("=") ? key.slice(1) : key.startsWith("nav.") ? tNav(key.slice(4)) : key.startsWith("footer.") ? tFooter(key.slice(7)) : tHome(key);
  const groups: { key: string; title: string; verb: string; links: { href: string; label: string }[] }[] = WORLDS.map((w) => ({
    key: w.key,
    title: tHome(`front.world.${w.key}`),
    verb: tHome(`front.worldVerb.${w.key}`),
    links: [
      ...w.items.map((it) => ({ href: it.href, label: label(it.label) })),
      ...w.more.map((it) => ({ href: it.href, label: label(it.label) })),
      // The reconstructed earlier sites, under The project after the earlier-sites inventory (2026-10-05).
      ...(w.key === "project"
        ? [
            { href: "/about/earlier-sites/nutzmann-net-2004", label: tClone("title.nutzmann-net-2004") },
            { href: "/about/earlier-sites/ntz-com-br-2013", label: tClone("title.ntz-com-br-2013") },
          ]
        : []),
    ],
  }));

  // The subject pages, labelled from the tools namespace's category names (the label set tools, Learn and the subject
  // pages share), sorted the locale's way.
  const tTools = await getTranslations("tools");
  const subjects = subjectKeys()
    .map((key) => ({ key, label: tTools(`categories.${key}`) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>{tNav("skipToContent")}</a>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("lede")}</p>
            <p className="sitemap-tools-count mono">{t("toolsCount", { count: tools.length })}</p>
            <div className="sitemap-groups">
              {groups.map((g) => (
                <div className={`sitemap-group sitemap-group--${g.key}`} key={g.key}>
                  <h2 className="sitemap-group-title">{g.title} <span className="sitemap-group-verb mono">{g.verb}</span></h2>
                  {g.key === "project" ? (
                    /* The project world in three groups (row 62): About and evidence, The site, Policies and controls. */
                    (["evidence", "site", "policies"] as const).map((sub) => (
                      <div key={sub} className="sitemap-subgroup">
                        <h3 className="sitemap-subgroup-title">{t(`sub${sub[0].toUpperCase()}${sub.slice(1)}`)}</h3>
                        <ul className="sitemap-links">
                          {g.links.filter((l) => (PROJECT_GROUPS[l.href] ?? "site") === sub).map((l) => (
                            <li key={l.href}>
                              <Link href={l.href} className="sitemap-link">{l.label}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <ul className="sitemap-links">
                      {g.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className="sitemap-link">{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {/* BY SUBJECT (2026-10-06, SCOUT's adoption audit row 20): every subject page, from the rule that generates
                them (src/lib/subjects.ts), sorted by the localised label. A subject page gathers one category's tools,
                articles and glossary terms; listing all eleven replaces the three the "Use" world used to carry. */}
            <div className="sitemap-group sitemap-group--subjects">
              <h2 className="sitemap-group-title">{t("subjectsTitle")}</h2>
              <p className="sitemap-subjects-lede">{t("subjectsLede")}</p>
              <ul className="sitemap-links sitemap-links--subjects">
                {subjects.map((s) => (
                  <li key={s.key}>
                    <Link href={`/category/${s.key}`} className="sitemap-link">{s.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* The machine door: the generated XML sitemap (plain anchor, static file). */}
            <p className="sitemap-xml-note mono">
              <a href="/sitemap.xml" className="footer-contribute-link">{t("xmlNote")}</a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
