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

import { ogImages } from "@/lib/og";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import FamilyChip from "@/components/FamilyChip";
import PageCapabilities from "@/components/PageCapabilities";
import ScrollToTop from "@/components/ScrollToTop";
import CategoryFilter from "@/components/CategoryFilter";
import ViewToggle from "@/components/ViewToggle";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getCertificationsForVendor } from "@/content/certifications/study-guides";
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import { readingPathVendor, READING_PATH_VENDOR_KEYS } from "@/lib/reading-path-vendors";
import { lineageFor } from "@/content/lineages";
import { VENDOR_CAREER_SLUGS } from "@/content/vendors/career";
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
    ...ogImages("vendor", vendor, locale, label),
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
  const tPaths = await getTranslations("studyGuidesIndex"); // reading-path titles/ledes
  const tLin = await getTranslations("lineages"); // lineage card copy
  const tShortcuts = await getTranslations("shortcuts"); // "." context panel
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

      <main id="main" className="hub-main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                // The vendors hub is the parent of every vendor page
                // (breadcrumb fix, PRIME 2026-07-15).
                { label: tNav("vendors"), href: "/vendor-hubs" },
                { label: label },
              ]}
            />
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

            {/* ---- Hub doors, in three bands (PRIME 2026-07-27) ----
                 A single flat grid put eleven cards on the F5 hub and twenty
                 on Fortinet's, which pushed the tools - the reason the page
                 exists - below two screens of navigation. The doors are now
                 grouped by what they are, and sized by how many there are:

                   1. STORY: the vendor's chapter and its corporate lineage.
                      Two cards at most, so they stay full size.
                   2. CERTIFICATIONS: one per certification, and there can be
                      twenty. Rendered as a COMPACT CHIP ROW rather than cards,
                      because twenty cards is a wall and twenty chips is a
                      list. One class added for this (justified here): no
                      existing class produces a dense inline row of links.
                   3. PATHS: guided reading routes, few enough to stay cards.

                 Net effect on the F5 hub: eleven cards become three cards plus
                 a chip row, and the tools move up by roughly a screen. */}
            {(() => {
              const vendorCerts = getCertificationsForVendor(vendor);
              const careerSlug = VENDOR_CAREER_SLUGS[vendor];
              const hasLineage = Boolean(lineageFor(vendor));
              const vendorPaths = READING_PATHS.filter(
                (rp) => readingPathVendor(rp.id, READING_PATH_VENDOR_KEYS) === vendor,
              );
              if (!careerSlug && !hasLineage && vendorCerts.length === 0 && vendorPaths.length === 0) {
                return null;
              }
              return (
                <>
                  {/* -- Band 1: the story -- */}
                  {(careerSlug || hasLineage) && (
                    <div className="learn-portal-grid">
                      {careerSlug && (
                        <Link
                          href={`/industry/${careerSlug}`}
                          className="learn-portal-card"
                          style={{ "--note-accent": vendorColor(vendor) } as CSSProperties}
                        >
                          <span className="learn-portal-ornament" aria-hidden>
                            &#9670;
                          </span>
                          <p className="learn-portal-title">
                            {tHub("industryLink", { vendor: label })}{" "}
                            <span className="learn-portal-arrow">&#8594;</span>
                          </p>
                          <p className="learn-portal-lede">{tHub("industryLede", { vendor: label })}</p>
                        </Link>
                      )}
                      {hasLineage && (
                        <Link
                          href={`/${vendor}/vendor-lineage`}
                          className="learn-portal-card"
                          style={{ "--note-accent": vendorColor(vendor) } as CSSProperties}
                        >
                          <span className="learn-portal-ornament" aria-hidden>
                            &#8635;
                          </span>
                          <p className="learn-portal-title">
                            {tLin("titleFor", { vendor: label })}{" "}
                            <span className="learn-portal-arrow">&#8594;</span>
                          </p>
                          <p className="learn-portal-lede">{tLin("introFor", { vendor: label })}</p>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* -- Band 2: certifications, compact -- */}
                  {vendorCerts.length > 0 && (
                    <div className="hub-chip-band">
                      <p className="hub-chip-band-label">
                        {tHub("certsEyebrow")}
                      </p>
                      <ul className="hub-chip-row">
                        {vendorCerts.map((c) => (
                          <li key={c.key}>
                            <Link href={`/certifications#${c.key}`} className="hub-chip">
                              {c.code || c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* -- Band 3: guided reading -- */}
                  {vendorPaths.length > 0 && (
                    <div className="learn-portal-grid" style={{ marginBottom: "2.5rem" }}>
                      {vendorPaths.map((rp) => (
                        <Link
                          key={rp.id}
                          href={`/study-guides#paths-${vendor}`}
                          className="learn-portal-card"
                          style={{ "--note-accent": "var(--accent-primary)" } as CSSProperties}
                        >
                          <span className="learn-portal-ornament" aria-hidden>
                            1&#8594;2&#8594;3
                          </span>
                          <p className="learn-portal-title">
                            {tPaths(`paths.${rp.id}.title`)}{" "}
                            <span className="learn-portal-arrow">&#8594;</span>
                          </p>
                          <p className="learn-portal-lede">{tPaths(`paths.${rp.id}.lede`)}</p>
                          <p className="learn-portal-badges">
                            <span className="learn-portal-badge">
                              {tPaths("articlesCount", { count: rp.articles.length })}
                            </span>
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Sticky nav-utility bar (PRIME 2026-07-09): jump-to + show-only +
                view density in one strip that sticks below the site header on
                scroll. Contained (inside the hero container). The jump-nav and
                filter render only when there is more than one destination; the
                view toggle is always available. Both start collapsed. */}
            <div className="nav-utility-bar nav-utility-bar--contained">
              <div className="nav-utility-inner">
                {/* Jump-to nav: one anchor per populated sub-category plus Learn. */}
                {(() => {
                  const jumpTools = subGroups.filter((g) => g.tools.length > 0);
                  const jumpLearn = vendorArticles.length > 0;
                  const destinations = jumpTools.length + (jumpLearn ? 1 : 0);
                  if (destinations < 2) return null;
                  return (
                    <details className="jumpnav">
                      <summary className="jumpnav-summary" aria-label={t("jumpTo")}>
                        <span className="jumpnav-chevron" aria-hidden="true">
                          &#9656;
                        </span>
                        {t("jumpTo")}
                      </summary>
                      <ul className="category-nav-list">
                        {jumpTools.map((group) => (
                          <li key={group.id} data-jumpnav={group.id}>
                            <a href={`#tools-${group.id}`} className="category-nav-link">
                              {subLabel(group.id)}
                            </a>
                          </li>
                        ))}
                        {jumpLearn && (
                          <li data-jumpnav="learn">
                            <a href="#learn" className="category-nav-link">
                              {tHub("learnHeading")}
                            </a>
                          </li>
                        )}
                      </ul>
                    </details>
                  );
                })()}
                <div className="nav-utility-controls">
                  {/* Show-only: one chip per populated tool family, plus Learn. */}
                  {(() => {
                    const jumpTools = subGroups.filter((g) => g.tools.length > 0);
                    const jumpLearn = vendorArticles.length > 0;
                    const filterGroups = [
                      ...jumpTools.map((g) => ({
                        key: g.id,
                        sectionId: `tools-${g.id}`,
                        label: subLabel(g.id),
                        color: vendorColor(vendor),
                      })),
                      ...(jumpLearn
                        ? [{ key: "learn", sectionId: "learn", label: tHub("learnHeading") }]
                        : []),
                    ];
                    if (filterGroups.length < 2) return null;
                    return (
                      <CategoryFilter
                        legend={t("filterLegend")}
                        allLabel={t("filterAll")}
                        noneLabel={t("filterNone")}
                        emptyLabel={t("filterEmpty")}
                        moreLabel={t("filterMore")}
                        fewerLabel={t("filterFewer")}
                        groups={filterGroups}
                      />
                    );
                  })()}
                  <ViewToggle
                    targetId="main"
                    storageKey="ronutz:view:hub"
                    legend={t("viewLegend")}
                    cardsLabel={t("viewCards")}
                    listLabel={t("viewList")}
                  />
                </div>
              </div>
            </div>

            {/* ---- Tools, family by family. id="tools" is a redirect target
                 (/tools/<vendor> 301s here); category-section supplies the
                 sticky-header scroll offset. ---- */}
            <section id="tools" className="category-section" style={{ marginBottom: "2.5rem" }}>
              <h2 className="tools-category tools-category--hub">
                {tHub("toolsHeading")} ({vendorTools.length})
              </h2>
              {subGroups.filter((g) => g.tools.length > 0).map((group) => (
                <div key={group.id} id={`tools-${group.id}`} className="category-section" style={{ marginBottom: "2rem" }}>
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
              <h2 className="tools-category tools-category--hub">
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

      {/* T-DOT: register this hub's "." context capability - a hub map that jumps
          to each populated tool-family section. Built from the same subGroups the
          page renders, using the identical `tools-<id>` anchors, so the map never
          drifts from the page. Only offered when there are at least two
          tool-bearing sections (a single-family hub needs no map), matching the
          jump-nav's own threshold. */}
      {(() => {
        const mapSections = subGroups
          .filter((g) => g.tools.length > 0)
          .map((g) => ({
            id: g.id,
            label: subLabel(g.id),
            anchor: `tools-${g.id}`,
            toolCount: g.tools.length,
          }));
        if (mapSections.length < 2) return null;
        return (
          <PageCapabilities
            set={{
              title: label,
              capabilities: [
                {
                  id: "hub-map",
                  kind: "hub-map",
                  label: tShortcuts("hubMapLabel"),
                  detail: tShortcuts("hubMapDetail"),
                  sections: mapSections,
                },
              ],
            }}
          />
        );
      })()}

      <SiteFooter />

      <ScrollToTop label={t("backToTop")} />
    </>
  );
}
