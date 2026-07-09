// ============================================================================
// src/app/[locale]/vendors/page.tsx
// ----------------------------------------------------------------------------
// VENDOR HOME - the front door to the vendor hubs (T-HUB). A static landing
// page, one card per training-pillar vendor (F5, Fortinet, Netskope, Extreme),
// each showing what the site holds for it and linking to the hub. This is the
// destination for the new "Vendors" nav item.
//
// ROUTING. This is a STATIC sibling of the dynamic [vendor] route under
// [locale]. Next.js resolves static segments before dynamic ones, so
// /<locale>/vendors resolves here and /<locale>/f5 resolves to the [vendor]
// hub. "vendors" is not a vendor key (the keys are f5/fortinet/netskope/
// extreme), so scripts/check-vendor-namespace.mjs is satisfied - the guard
// reserves vendor KEYS as slugs, and this route does not take one.
//
// POPULATED vs PILLAR. All four training pillars are shown as cards (they are
// the public-copy vendors, per the naming guardrail), but only POPULATED
// vendors - those with at least one available tool - link to a live hub. A
// pillar with no tools yet is shown with a "coming soon" state and no link, so
// the page never points at a route the static export did not emit. Today F5 is
// live with the bulk; Fortinet, Netskope, and Extreme each have their first
// tool, so all four currently link. The gating is computed, not hard-coded, so
// this stays correct as the toolbox grows.
//
// Statically generated per locale.
// ============================================================================

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { tools } from "@/config/tools";
import { VENDOR_FAMILIES, vendorColor, populatedVendors, subsOf } from "@/config/vendors";
import { getAllArticles, getArticleVendors, type Article } from "@/lib/learn";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vendorsHome" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function VendorsHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vendorsHome");
  const tVendors = await getTranslations("tools");
  const tNav = await getTranslations("nav");

  const populated = new Set(populatedVendors());
  const articles = getAllArticles(locale);

  // Per-vendor counts for the cards. Tools from the config, articles via the
  // shared vendor derivation (concepts UNION relatedTools -> vendors).
  const toolCount = (v: string) => tools.filter((tl) => tl.available && (tl.vendors ?? []).includes(v)).length;
  const articleCount = (v: string) => articles.filter((a: Article) => getArticleVendors(a).includes(v)).length;

  // Cards in the declared training-pillar order.
  const cards = VENDOR_FAMILIES.map((fam) => {
    const key = fam.key;
    return {
      key,
      color: vendorColor(key),
      isLive: populated.has(key),
      tools: toolCount(key),
      articles: articleCount(key),
      families: subsOf(key).length,
    };
  });

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <div className="container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("crumb") },
              ]}
            />
          </div>

          {/* Hero */}
          <section className="vendors-home-hero">
            <div className="container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* Vendor cards */}
          <section className="vendors-home-grid-section">
            <div className="container vendors-home-grid">
              {cards.map((c) => {
                const label = tVendors(`vendors.${c.key}`);
                const inner = (
                  <>
                    <div className="vendors-card-head">
                      <span
                        className="category-dot vendors-card-dot"
                        style={{ "--chip-color": c.color } as CSSProperties}
                        aria-hidden="true"
                      />
                      <h2 className="vendors-card-title">{label}</h2>
                    </div>
                    <p className="vendors-card-blurb">{t(`blurbs.${c.key}`)}</p>
                    {c.isLive ? (
                      <p className="vendors-card-counts">
                        <span className="vendors-card-count mono">{c.tools}</span> {t("toolsLabel")}
                        {c.articles > 0 && (
                          <>
                            {" "}
                            <span className="vendors-card-sep" aria-hidden="true">
                              ·
                            </span>{" "}
                            <span className="vendors-card-count mono">{c.articles}</span> {t("articlesLabel")}
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="vendors-card-counts vendors-card-soon">{t("comingSoon")}</p>
                    )}
                    {c.isLive && <span className="vendors-card-cta">{t("openHub")} &rarr;</span>}
                  </>
                );

                return c.isLive ? (
                  <Link
                    key={c.key}
                    href={`/${c.key}`}
                    className="vendors-card vendors-card--live"
                    style={{ "--chip-color": c.color } as CSSProperties}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={c.key}
                    className="vendors-card vendors-card--soon"
                    style={{ "--chip-color": c.color } as CSSProperties}
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>

          {/* A short note on what a hub is + the honesty line on scope. */}
          <section className="vendors-home-note-section">
            <div className="container vendors-home-note">
              <p>{t("note")}</p>
              <p className="vendors-home-scope">{t("scopeNote")}</p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
