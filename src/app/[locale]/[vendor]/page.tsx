// ============================================================================
// src/app/[locale]/[vendor]/page.tsx
// ----------------------------------------------------------------------------
// VENDOR HUB PAGE - ratified 2026-07-03. One landing page per TRAINING-PILLAR
// vendor that gathers everything the site holds for that vendor: every tool,
// grouped by catalogue FAMILY (families make awkward URLs but excellent
// section headings, so this page IS the family index), followed by every
// Learn article whose vendor set (concepts UNION relatedTools->vendors, via
// getArticleVendors) includes the vendor.
//
// ROUTING. This is a dynamic sibling of the static routes under [locale];
// Next.js resolves static segments (tools, learn, about, ...) first, so this
// route only ever sees unclaimed single-segment paths. generateStaticParams
// emits ONLY populated vendors (>= 1 available tool), mirroring the
// visibility rule in src/config/vendors.ts: today that is F5 alone, and the
// Fortinet / Netskope / Extreme hubs materialize automatically the moment
// their first tool ships. Unpopulated vendor URLs are meanwhile reserved as
// permanent redirects to /tools in public/_redirects, and bare /f5 (no
// locale) 301s to /en/f5/ there too. scripts/check-vendor-namespace.mjs
// guards the namespace: no tool, article, or top-level route may ever take a
// vendor key as its slug.
//
// ANCHORS. The two sections carry id="tools" and id="learn": /tools/<vendor>
// and /learn/<vendor> permanently redirect to these fragments, so those
// spellings work without maintaining duplicate list pages. Both sections
// reuse the category-section class for the sticky-header scroll offset.
// ============================================================================

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import FamilyChip from "@/components/FamilyChip";
import ScrollToTop from "@/components/ScrollToTop";
import { tools } from "@/config/tools";
import { subsOf } from "@/config/vendors";
import { getAllArticles, getArticleVendors, getArticleSub, type Article } from "@/lib/learn";
import { vendorColor, isVendor, populatedVendors } from "@/config/vendors";



export function generateStaticParams() {
  // Only populated vendors get pages (dynamicParams=false below makes this
  // exhaustive for the static export); the rest stay reserved redirects.
  return routing.locales.flatMap((locale) =>
    populatedVendors().map((vendor) => ({ locale, vendor })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; vendor: string }>;
}): Promise<Metadata> {
  const { locale, vendor } = await params;
  if (!isVendor(vendor) || !populatedVendors().includes(vendor)) return {};
  const t = await getTranslations({ locale, namespace: "tools" });
  const tHub = await getTranslations({ locale, namespace: "vendorHub" });
  const label = t(`vendors.${vendor}`);
  return {
    title: `${label} ${tHub("eyebrow")}`,
    description: tHub("metaDescription", { vendor: label }),
  };
}

export default async function VendorHubPage({
  params,
}: {
  params: Promise<{ locale: string; vendor: string }>;
}) {
  const { locale, vendor } = await params;
  setRequestLocale(locale);
  if (!isVendor(vendor) || !populatedVendors().includes(vendor)) notFound();

  const tNav = await getTranslations("nav");
  const t = await getTranslations("tools"); // vendor labels + tool names/blurbs
  const tHub = await getTranslations("vendorHub"); // page chrome
  const label = t(`vendors.${vendor}`);

  // ---- The vendor's tools and articles, grouped by SUB-CATEGORY -----------
  // Sections follow the vendor's ordered sub-category taxonomy (PRIME
  // directive 2026-07-03; VENDOR_SUBS in src/config/vendors.ts). A trailing
  // "other" bucket catches anything unmapped so nothing silently disappears.
  const vendorTools = tools.filter(
    (tool) => tool.available && (tool.vendors ?? []).includes(vendor),
  );

  // ---- The vendor's articles ----------------------------------------------
  // getArticleVendors is the shared derivation (concepts UNION the vendors of
  // relatedTools), so this list always agrees with the Learn page's vendor
  // filter. Sorted by title for a stable, scannable list.
  const vendorArticles = getAllArticles(locale)
    .filter((a: Article) => getArticleVendors(a).includes(vendor))
    .sort((a: Article, b: Article) => a.title.localeCompare(b.title, locale));

  const subIds = [...subsOf(vendor).map((s) => s.id), "other"];
  const subGroups = subIds
    .map((id) => ({
      id,
      tools: vendorTools
        .filter((tool) => (tool.sub ?? "other") === id)
        .sort((a, b) => t(`${a.id}.name`).localeCompare(t(`${b.id}.name`), locale)),
      articles: vendorArticles.filter((a) => (getArticleSub(a, vendor) ?? "other") === id),
    }))
    .filter((g) => g.tools.length > 0 || g.articles.length > 0);
  const subLabel = (id: string) => (id === "other" ? t("subs.other") : t(`subs.${vendor}.${id}`));

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            {/* Hero: vendor dot + eyebrow, vendor name, one-line mission. */}
            <p className="hero-eyebrow">
              <span
                className="category-dot"
                style={{ "--chip-color": vendorColor(vendor) } as CSSProperties}
                aria-hidden="true"
              />{" "}
              {tHub("eyebrow")}
            </p>
            <h1 className="page-hero-title">
              {label}
            </h1>
            <p className="page-hero-lede" style={{ marginBottom: "2.5rem" }}>
              {tHub("lede", { vendor: label })}
            </p>

            {/* ---- Tools, family by family. id="tools" is a redirect target
                 (/tools/<vendor> 301s here); category-section supplies the
                 sticky-header scroll offset. ---- */}
            <section id="tools" className="category-section" style={{ marginBottom: "2.5rem" }}>
              <h2 className="tools-category">
                {tHub("toolsHeading")} ({vendorTools.length})
              </h2>
              {subGroups.filter((g) => g.tools.length > 0).map((group) => (
                <div key={group.id} style={{ marginBottom: "2rem" }}>
                  <h3 className="tools-family-heading">{subLabel(group.id)}</h3>
                  <ul className="tools-grid">
                    {group.tools.map((tool) => (
                      <li
                        key={tool.id}
                        className="tools-grid-item"
                        data-vendors={(tool.vendors ?? []).join(" ")}
                      >
                        <Link href={tool.href} className="tools-card">
                          <h3 className="tools-card-name">{t(`${tool.id}.name`)}</h3>
                          <p className="tools-card-blurb">{t(`${tool.id}.blurb`)}</p>
                          <span className="family-chip-row">
                            <FamilyChip
                              category={tool.category}
                              label={t(`categories.${tool.category}`)}
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            {/* ---- Articles. id="learn" is a redirect target
                 (/learn/<vendor> 301s here). ---- */}
            <section id="learn" className="category-section">
              <h2 className="tools-category">
                {tHub("learnHeading")} ({vendorArticles.length})
              </h2>
              {subGroups.filter((g) => g.articles.length > 0).map((group) => (
                <div key={group.id} style={{ marginBottom: "2rem" }}>
                  <h3 className="tools-family-heading">{subLabel(group.id)}</h3>
              <ul className="learn-grid">
                {group.articles.map((a) => (
                  <li
                    key={a.slug}
                    className="learn-grid-item"
                    data-vendors={getArticleVendors(a).join(" ")}
                  >
                    <Link href={`/learn/${a.slug}`} className="learn-card">
                      <h3 className="learn-card-title">{a.title}</h3>
                      <p className="learn-card-summary">{a.summary}</p>
                      {a.category && (
                        <span className="family-chip-row">
                          <FamilyChip
                            category={a.category}
                            label={t(`categories.${a.category}`)}
                          />
                        </span>
                      )}
                      <span className="learn-card-cta">{tHub("read")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
                </div>
              ))}
            </section>
          </div>
        </section>
      </main>

      <SiteFooter />

      <ScrollToTop label={t("backToTop")} />
    </>
  );
}
