// ============================================================================
// src/app/[locale]/page.tsx
// ----------------------------------------------------------------------------
// THE HOME PAGE — the Day-1 authority surface + the first live tool.
//
// STRUCTURE (the hero is a thesis, per the design brief): we open with the most
// characteristic thing in this subject's world — not a generic big-number
// template, but a clear statement of the product's reason to exist (privacy-
// first local compute) immediately backed by a tool the visitor can USE. The
// sections then establish credibility (since 1996), the four taught platforms,
// why local-first matters for security, and the live CIDR tool.
//
// All copy comes from the message pack (localized, English fallback). This is a
// server component; only the CIDR tool and the language switcher are client
// islands, so the page is fast and mostly static.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import CidrTool from "@/components/CidrTool";
import ToolLearnPanel from "@/components/ToolLearnPanel";
import ToolProvenance from "@/components/ToolProvenance";
import { isEnabled } from "@/config/features";
import { provenanceFor } from "@/config/toolProvenance";
import ToolFunding from "@/components/ToolFunding";
import { fundingFor, hasFunding, fundingLinksFor } from "@/config/toolFunding";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  // Next.js 15: route params are async. Await before use.
  const { locale } = await params;
  // Enable static rendering for this locale (App Router requirement).
  setRequestLocale(locale);

  // Async server component → use getTranslations (the async server function),
  // NOT the useTranslations hook (which is for client/sync components).
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");

  return (
    <>
      {/* Keyboard skip link — first focusable element. */}
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>

      <Header />

      <main id="main">
        {/* --- HERO: the thesis --- */}
        <section className="hero">
          <div className="container">
            <p className="hero-eyebrow">{t("hero.eyebrow")}</p>
            <h1 className="hero-title">{t("hero.title")}</h1>
            <p className="hero-subtitle">{t("hero.subtitle")}</p>
            <div className="hero-cta">
              <a href="#cidr" className="btn btn-primary">
                {t("hero.ctaPrimary")}
              </a>
              <a href="#who" className="btn btn-secondary">
                {t("hero.ctaSecondary")}
              </a>
            </div>
          </div>
        </section>

        {/* --- CREDIBILITY --- */}
        <section className="section" id="who">
          <div className="container section-narrow">
            <h2 className="section-title">{t("credibility.title")}</h2>
            <p className="section-body">{t("credibility.body")}</p>
            <p className="section-cta">
              <Link href="/about" className="section-cta-link">
                {t("credibility.aboutCta")} →
              </Link>
            </p>
          </div>
        </section>

        {/* --- FOUR PILLARS --- */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">{t("pillars.title")}</h2>
            <ul className="pillars">
              <li className="pillar">
                <Link href="/training/f5" className="pillar-link">{t("pillars.f5")}</Link>
              </li>
              <li className="pillar">
                <Link href="/training/fortinet" className="pillar-link">{t("pillars.fortinet")}</Link>
              </li>
              <li className="pillar">
                <Link href="/training/extreme" className="pillar-link">{t("pillars.extreme")}</Link>
              </li>
              <li className="pillar">
                <Link href="/training/netskope" className="pillar-link">{t("pillars.netskope")}</Link>
              </li>
            </ul>
          </div>
        </section>

        {/* --- PRIVACY EXPLAINER --- */}
        <section className="section section-accent">
          <div className="container section-narrow">
            <h2 className="section-title">{t("privacy.title")}</h2>
            <p className="section-body">{t("privacy.body")}</p>
          </div>
        </section>

        {/* --- LIVE TOOL --- */}
        <section className="section" id="cidr">
          <div className="container section-narrow">
            <h2 className="section-title">{t("toolPreview.title")}</h2>
            <p className="section-body">{t("toolPreview.body")}</p>
            <p className="tool-toolbox-cta">
              <Link href="/tools" className="tool-toolbox-link">
                {t("toolPreview.toolboxCta")} →
              </Link>
            </p>
            <div className="tool-mount">
              <CidrTool />
              {/* In-tool Learn panel (surface a): contextual articles for this
                  tool, resolved via the Tools->Learn bridge. Same content source
                  as the standalone Learn section. */}
              <ToolLearnPanel
                toolSlug="cidr"
                locale={locale}
                heading={t("toolPreview.learnHeading")}
                seeAll={{ href: "/learn", label: t("toolPreview.seeAllArticles") }}
              />
              {/* Credits & Sources (provenance): gated by the toolProvenance
                  flag; shows the standards the tool implements. */}
              <ToolProvenance
                enabled={isEnabled("toolProvenance") && provenanceFor("cidr") !== null}
                data={provenanceFor("cidr")}
                copy={{
                  title: t("provenance.title"),
                  show: t("provenance.show"),
                  hide: t("provenance.hide"),
                  basisLabel: t("provenance.basisLabel"),
                  sourcesLabel: t("provenance.sourcesLabel"),
                }}
              />
              {/* Per-tool funding (support this tool): gated by the toolFunding
                  flag and the tool having configured funding links. */}
              <ToolFunding
                enabled={isEnabled("toolFunding") && hasFunding("cidr")}
                purpose={fundingFor("cidr")?.purpose}
                links={fundingLinksFor("cidr")}
                copy={{
                  title: t("funding.title"),
                  pitch: t("funding.pitch"),
                  purposeLabel: t("funding.purposeLabel"),
                }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER (shared component; single source of truth) --- */}
      <SiteFooter />
    </>
  );
}
