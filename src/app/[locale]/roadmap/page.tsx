// ============================================================================
// src/app/[locale]/roadmap/page.tsx
// ----------------------------------------------------------------------------
// THE PUBLIC ROADMAP — the tools we are planning and considering.
//
// ALWAYS CURRENT BY CONSTRUCTION: this page is GENERATED from the live build
// catalogue (src/content/catalogue/catalogue.ts). It reads CATALOGUE at build
// time and renders every "queued" tool grouped by family, plus a derived count
// of what has already shipped. Because it is derived, not hand-maintained, it
// cannot drift: the moment a tool is queued it appears here, and the moment it
// ships it moves from the planned list into the shipped count — automatically,
// on the next build. There is nothing to keep in sync by hand.
//
// PUBLIC COPY ONLY (brand guardrails): each tool shows its name, its posture
// (what it does), and the standards it will be grounded in. The catalogue's
// internal machinery — build-priority ranks, decision IDs, merge numbers, and
// working notes — is deliberately NOT rendered here. No dates or cadence are
// declared: this is intent and direction, not a delivery schedule.
//
// LOCALIZED chrome (eyebrow, title, lede, section labels) via getTranslations;
// tool names and postures come from the catalogue and are English-fallback, the
// same treatment as the changelog and Learn entries until the translation pass.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { CATALOGUE, FAMILIES } from "@/content/catalogue/catalogue";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "roadmap" });
  return {
    title: t("eyebrow"),
    description: t("metaDescription"),
  };
}

export default async function RoadmapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("roadmap");
  const tNav = await getTranslations("nav");

  // Derived from the catalogue at build time — the single source of truth.
  const queued = CATALOGUE.filter((tool) => tool.status === "queued");
  const liveCount = CATALOGUE.filter((tool) => tool.status === "live").length;

  // Group by family in the canonical FAMILIES order; sort within a family by
  // build-priority rank (rank drives the order but is never displayed).
  const groups = FAMILIES.map((family) => ({
    family,
    tools: queued
      .filter((tool) => tool.family === family)
      .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER)),
  })).filter((g) => g.tools.length > 0);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        {/* --- HERO --- */}
        <section className="section roadmap-hero">
          <div className="container section-narrow">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("lede")}</p>
            <div className="roadmap-stats">
              <Link href="/tools" className="roadmap-stat">
                <span className="roadmap-stat-num">{liveCount}</span>
                <span className="roadmap-stat-label">{t("shippedLabel")}</span>
              </Link>
              <span className="roadmap-stat">
                <span className="roadmap-stat-num">{queued.length}</span>
                <span className="roadmap-stat-label">{t("plannedLabel")}</span>
              </span>
            </div>
          </div>
        </section>

        {/* --- INTENTIONS (non-committed: API access + open engine) --- */}
        <section className="section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("intentTitle")}</h2>
            <p className="section-body">{t("intentIntro")}</p>
            {/* The two intentions as labeled cards (PRIME 04/07/2026: this
                copy read as one undifferentiated chunk of text). */}
            <div className="roadmap-intents">
              <div className="roadmap-intent-card">
                <p className="roadmap-intent-label mono">{t("intentApiLabel")}</p>
                <p className="roadmap-intent-body">{t("intentApi")}</p>
              </div>
              <div className="roadmap-intent-card">
                <p className="roadmap-intent-label mono">{t("intentOpenLabel")}</p>
                <p className="roadmap-intent-body">{t("intentOpen")}</p>
              </div>
            </div>
            <p className="section-body">{t("intentClose")}</p>
            {/* The measured hosting ceiling; full account on the colophon. */}
            <p className="section-body roadmap-ceiling">{t("ceiling")}</p>
          </div>
        </section>

        {/* --- PLANNED, BY FAMILY (generated) --- */}
        <section className="section">
          <div className="container">
            <div className="roadmap-groups">
              {groups.map((g) => (
                <section className="roadmap-group" key={g.family}>
                  <h2 className="roadmap-group-title">{g.family}</h2>
                  <ul className="roadmap-list">
                    {g.tools.map((tool) => (
                      <li className="roadmap-item" key={tool.slug}>
                        <span className="roadmap-item-name">{tool.name}</span>
                        <span className="roadmap-item-posture">{tool.posture}</span>
                        {tool.specs && tool.specs.length > 0 && (
                          <span className="roadmap-item-specs">
                            {tool.specs.map((s) => (
                              <span className="roadmap-spec" key={s}>
                                {s}
                              </span>
                            ))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>

        {/* --- SUGGEST A TOOL --- */}
        <section className="section section-accent">
          <div className="container section-narrow">
            <h2 className="section-title">{t("ideaTitle")}</h2>
            <p className="section-body">{t("ideaBody")}</p>
            <Link href="/contribute/tools" className="roadmap-idea-cta">
              {t("ideaCta")}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
