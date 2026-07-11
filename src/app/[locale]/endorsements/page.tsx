// ============================================================================
// src/app/[locale]/endorsements/page.tsx
// ----------------------------------------------------------------------------
// THE ENDORSEMENTS PAGE — verbatim testimonials, with full context.
//
// Wraps the Testimonials component (the filterable card grid) with an intro and
// summary. The reviews span 2004 to 2025 across LinkedIn, Google, and verified
// Red Education students. All verbatim, all metadata preserved.
//
// "Endorsements" is the canon nav name for this section. Statically generated.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import MessageSlice from "@/components/MessageSlice";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Testimonials from "@/components/Testimonials";
import {
  TESTIMONIAL_COUNT,
  MACHINE_TRANSLATED_COUNT,
  testimonialSourceCounts,
} from "@/content/testimonials/data";

// Dev-only reminder that machine translations need review. Renders nothing in
// production, so visitors never see it; the public-facing per-card disclaimer
// is the only translation caveat that ships.
function ReviewReminder({ count }: { count: number }) {
  if (process.env.NODE_ENV === "production" || count === 0) return null;
  return (
    <div
      style={{
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.5)",
        color: "#f59e0b",
        fontSize: "0.85rem",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        margin: "1rem 0",
        fontFamily: "var(--font-mono)",
      }}
    >
      REVIEW REMINDER: {count} testimonials have machine-generated English
      translations that have not been reviewed yet. Check them before publishing.
    </div>
  );
}

export default async function EndorsementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("endorsements");
  const tNav = await getTranslations("nav");
  const counts = testimonialSourceCounts();

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">
              {t("title")}
            </h1>
            <p className="page-hero-lede" style={{ marginBottom: "1rem" }}>
              {t("intro", { count: TESTIMONIAL_COUNT })}
            </p>
            <p className="section-body" style={{ fontSize: "0.9rem", color: "var(--text-tertiary)" }}>
              {t("provenance")}
            </p>

            <ReviewReminder count={MACHINE_TRANSLATED_COUNT} />

            <div className="tm-mount">
              <MessageSlice namespaces={["testimonials"]}><Testimonials /></MessageSlice>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
