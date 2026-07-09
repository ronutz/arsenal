// ============================================================================
// src/app/[locale]/about/page.tsx
// ----------------------------------------------------------------------------
// THE ABOUT / INSTRUCTOR PAGE — the authority centerpiece.
//
// SOURCING & EVIDENCE-GATING (per canon guardrails):
//   Every factual claim here traces to a verified project-knowledge source
//   (the CVs, the LinkedIn Profile.pdf, the Professional Experience timeline,
//   the F5/Extreme/Fortinet/Netskope certificates). Where the canon IA wants
//   content the files do NOT substantiate, it is marked with a GAP flag that
//   renders ONLY in development (a visible banner), never in production — so
//   Rodolfo can see exactly what needs his input without shipping a TODO.
//
//   Guardrails actively applied (NOT copied from the older CVs, which violate
//   them): "Rodolfo Nützmann" never "Rod"; "since 1996" not "30+ years"; FOUR
//   pillars only (F5, Fortinet, Extreme Networks, Netskope) — Palo Alto / Ping
//   excluded; only Red Education named as a company; em-dash-free; no cadence
//   claims; credential-forward, no overclaiming. Testimonials are NOT included
//   here (they are verbatim-only and belong in their own reviewed component).
//
// All visible copy is localized via getTranslations (English base + fallback).
// This is a server component (static). The GAP banner is dev-only.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

// Dev-only gap flag. In production (NODE_ENV === "production") it renders
// nothing, so no TODO ever ships. In dev it shows a visible amber note.
function Gap({ note }: { note: string }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <span
      style={{
        display: "inline-block",
        background: "rgba(245,158,11,0.15)",
        border: "1px solid rgba(245,158,11,0.5)",
        color: "#f59e0b",
        fontSize: "0.75rem",
        padding: "0.15rem 0.5rem",
        borderRadius: "6px",
        margin: "0.25rem 0",
        fontFamily: "var(--font-mono)",
      }}
    >
      GAP: {note}
    </span>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        {/* --- HERO --- */}
        <section className="about-hero">
          <div className="container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">Rodolfo Nützmann</h1>
            <p className="about-role">{t("role")}</p>
            <p className="page-hero-lede">{t("lede")}</p>
          </div>
        </section>

        {/* --- CREDENTIALS & ENDORSEMENTS (featured; the credibility signals
            that used to sit in the primary nav now lead the About page, where
            they read as a professional showcase rather than utility nav). --- */}
        <section className="section about-credibility">
          <div className="container">
            <div className="about-cred-grid">
              <Link href="/about/credentials" className="about-cred-card">
                <span className="about-cred-eyebrow">{t("credibility.certsEyebrow")}</span>
                <span className="about-cred-title">{t("credibility.certsTitle")}</span>
                <span className="about-cred-desc">{t("credibility.certsDesc")}</span>
                <span className="about-cred-cta">
                  {t("credibility.certsCta")}
                  <span aria-hidden="true"> →</span>
                </span>
              </Link>
              <Link href="/endorsements" className="about-cred-card">
                <span className="about-cred-eyebrow">{t("credibility.endorsementsEyebrow")}</span>
                <span className="about-cred-title">{t("credibility.endorsementsTitle")}</span>
                <span className="about-cred-desc">{t("credibility.endorsementsDesc")}</span>
                <span className="about-cred-cta">
                  {t("credibility.endorsementsCta")}
                  <span aria-hidden="true"> →</span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* --- WHAT I DO NOW --- */}
        <section className="section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("now.title")}</h2>
            <p className="section-body">{t("now.body")}</p>
            <ul className="about-facts">
              <li className="about-fact">
                <span className="about-fact-label">{t("now.basedLabel")}</span>
                <span className="about-fact-value">{t("now.basedValue")}</span>
              </li>
              <li className="about-fact">
                <span className="about-fact-label">{t("now.teachesLabel")}</span>
                <span className="about-fact-value">{t("now.teachesValue")}</span>
              </li>
              <li className="about-fact">
                <span className="about-fact-label">{t("now.languagesLabel")}</span>
                <span className="about-fact-value">{t("now.languagesValue")}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* --- THE FOUR PLATFORMS (current authorized teaching) --- */}
        <section className="section section-accent">
          <div className="container">
            <h2 className="section-title">{t("platforms.title")}</h2>
            <p className="section-body" style={{ marginBottom: "2rem" }}>
              {t("platforms.body")}
            </p>
            <ul className="about-platforms">
              <li className="about-platform">
                <span className="about-platform-name">F5</span>
                <span className="about-platform-detail">{t("platforms.f5")}</span>
              </li>
              <li className="about-platform">
                <span className="about-platform-name">Fortinet</span>
                <span className="about-platform-detail">{t("platforms.fortinet")}</span>
              </li>
              <li className="about-platform">
                <span className="about-platform-name">Extreme Networks</span>
                <span className="about-platform-detail">{t("platforms.extreme")}</span>
              </li>
              <li className="about-platform">
                <span className="about-platform-name">Netskope</span>
                <span className="about-platform-detail">{t("platforms.netskope")}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* --- RECOGNITION (F5 MVP, past achievement) --- */}
        <section className="section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("recognition.title")}</h2>
            <p className="section-body">{t("recognition.body")}</p>
          </div>
        </section>

        {/* --- THE PATH (career history, from the verified timeline) --- */}
        <section className="section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("path.title")}</h2>
            <p className="section-body" style={{ marginBottom: "2rem" }}>
              {t("path.intro")}
            </p>

            <ol className="about-timeline">
              <li className="about-era">
                <span className="about-era-years mono">1996 – 2000</span>
                <span className="about-era-where">Cabletron Systems · São Paulo</span>
                <span className="about-era-what">{t("path.cabletron")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2000 – 2002</span>
                <span className="about-era-where">Riverstone Networks · Santa Clara, California</span>
                <span className="about-era-what">{t("path.riverstone")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2003 – 2004</span>
                <span className="about-era-where">Cisco Systems · Brasília</span>
                <span className="about-era-what">{t("path.cisco")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2005 – 2007</span>
                <span className="about-era-where">Enterasys Networks · São Paulo</span>
                <span className="about-era-what">{t("path.enterasys")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2009 – 2010</span>
                <span className="about-era-where">Juniper Networks · São Paulo</span>
                <span className="about-era-what">{t("path.juniper")}</span>
              </li>
              <li className="about-era">
                <span className="about-era-years mono">2015 – 2019</span>
                <span className="about-era-where">F5 Networks · channel (Westcon, ScanSource)</span>
                <span className="about-era-what">{t("path.f5channel")}</span>
              </li>
              <li className="about-era about-era--current">
                <span className="about-era-years mono">2020 – {t("path.present")}</span>
                <span className="about-era-where">Red Education</span>
                <span className="about-era-what">{t("path.rededucation")}</span>
              </li>
            </ol>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem" }}>
              <Link href="/about/history" className="btn btn-secondary">
                {t("path.fullHistory")}
              </Link>
              <Link href="/about/vendors" className="btn btn-secondary">
                {t("path.vendorsLink")}
              </Link>
            </div>
          </div>
        </section>

        {/* --- ORIGINS (the early years, verified to 1991/1995) --- */}
        <section className="section section-accent">
          <div className="container section-narrow">
            <h2 className="section-title">{t("origins.title")}</h2>
            <p className="section-body">{t("origins.body")}</p>
          </div>
        </section>

        {/* --- APPROACH / TEACHING PHILOSOPHY --- */}
        <section className="section">
          <div className="container section-narrow">
            <h2 className="section-title">{t("approach.title")}</h2>
            <p className="section-body">{t("approach.body")}</p>
            {/* This narrative is drawn from the verified bio's own framing of
                why he specialized in training. Any expansion beyond the bio is
                flagged for review rather than invented. */}
            <Gap note="Expand teaching-philosophy copy with Rodolfo's own words if desired (current text is from the verified bio only)." />
          </div>
        </section>

        {/* --- CTA --- */}
        <section className="section">
          <div className="container section-narrow about-cta">
            <h2 className="section-title">{t("cta.title")}</h2>
            <p className="section-body" style={{ marginBottom: "1.5rem" }}>
              {t("cta.body")}
            </p>
            <div className="hero-cta">
              <Link href="/learn" className="btn btn-primary">
                {t("cta.learnButton")}
              </Link>
              <Link href="/tools" className="btn btn-secondary">
                {t("cta.toolsButton")}
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                {t("cta.contactButton")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
