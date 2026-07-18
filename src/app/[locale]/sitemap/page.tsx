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

  // Curated groups: label from nav where a nav label exists, path constant.
  // Section-level by design - the exhaustive list is sitemap.xml's job.
  const groups: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t("gTools"),
      links: [
        { href: "/tools", label: tNav("tools") },
        { href: "/category/networking", label: tNav("network") },
        { href: "/category/security", label: tNav("security") },
        { href: "/category/identity", label: tNav("identity") },
        { href: "/glossary", label: tNav("glossary") },
      ],
    },
    {
      title: t("gLearn"),
      links: [
        { href: "/learn", label: tNav("learn") },
        { href: "/study-guides", label: tNav("studyGuides") },
        { href: "/training", label: tNav("training") },
      ],
    },
    {
      title: t("gVendors"),
      links: [
        { href: "/vendor-hubs", label: tNav("vendors") },
        { href: "/industry", label: tNav("industry") },
        { href: "/red-education", label: "Red Education" },
      ],
    },
    {
      title: t("gAbout"),
      links: [
        { href: "/about", label: tNav("about") },
        { href: "/about/vendors", label: tNav("careerRecord") },
        { href: "/about/credentials", label: tNav("credentials") },
        { href: "/contact", label: tNav("contact") },
      ],
    },
    {
      title: t("gSite"),
      links: [
        { href: "/changelog", label: tNav("changelog") },
        { href: "/roadmap", label: tNav("roadmap") },
        { href: "/contribute/tools", label: tNav("contribute") },
        { href: "/colophon", label: tNav("colophon") },
        { href: "/api", label: "API" },
        { href: "/dev/fun", label: tNav("devFun") },
      ],
    },
  ];

  return (
    <>
      <a href="#main" className="skip-link">{tNav("skipToContent")}</a>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("lede")}</p>
            <p className="sitemap-tools-count mono">{t("toolsCount", { count: tools.length })}</p>
            <div className="sitemap-groups">
              {groups.map((g) => (
                <div className="sitemap-group" key={g.title}>
                  <h2 className="sitemap-group-title">{g.title}</h2>
                  <ul className="sitemap-links">
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="sitemap-link">{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
