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
  TESTIMONIALS,
  TESTIMONIAL_COUNT,
  MACHINE_TRANSLATED_COUNT,
  testimonialSourceCounts,
} from "@/content/testimonials/data";
// G5 (SCOUT, adopted 2026-10-05): the record organised by the kind of work it describes. The kinds are
// editorial classification kept apart from the verbatim data (kinds.ts); the counts here are computed
// from them at build time, and each kind is an entrance that opens the list already filtered.
import { TESTIMONIAL_KINDS, kindsOf } from "@/content/testimonials/kinds";

import ReduBrand from "@/components/ReduBrand";
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

/**
 * PAGE TITLE (2026-09-26). This route shipped with NO generateMetadata export
 * at all, so it inherited the site-wide default <title> from [locale]/layout.tsx
 * and shared one identical string with thirteen other pages. That is the exact
 * fault check-page-titles was written for on 2026-08-16; the fix that day
 * reached the index routes and never came back for these.
 *
 * Title only, deliberately: ogImages() would point at public/og/page/endorsements-<locale>.png,
 * and this slug is not in gen-og's STATIC_PAGES list, so the card does not exist
 * and check-og would fail on a manifest entry with nothing behind it. The page
 * keeps the default social card until the slug is added to that list.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "endorsements" });
  return { title: t("title") };
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
  // How many entries describe each kind of work. One entry can carry several kinds, so the sum exceeds the total;
  // the hint under the row says so.
  const tKinds = await getTranslations("testimonials");
  const kindCounts = TESTIMONIAL_KINDS.map((k) => ({
    kind: k,
    count: TESTIMONIALS.filter((x) => kindsOf(x.id).includes(k)).length,
  }));
  const kindLabel = (k: string) => tKinds("kind" + k.charAt(0).toUpperCase() + k.slice(1));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
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
              <ReduBrand>{t("provenance")}</ReduBrand>
            </p>

            {/* By type (G5): the six kinds with their counts, each an entrance into the filtered list.
                Plain anchors with the query string, since the static page reloads and the component reads
                ?kind= on mount; verbatim text, no ratings, as the record's rule says. */}
            <div className="endorse-kinds">
              <h2 className="endorse-kinds-title">{t("byKindTitle")}</h2>
              <ul className="endorse-kinds-list">
                {kindCounts.map((k) => (
                  <li key={k.kind}>
                    <a className="endorse-kind" href={`/${locale}/endorsements?kind=${k.kind}`}>
                      <span className="endorse-kind-count mono">{k.count}</span>
                      <span className="endorse-kind-label">{kindLabel(k.kind)}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="endorse-kinds-hint">{t("byKindHint", { count: TESTIMONIAL_COUNT })}</p>
            </div>
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
