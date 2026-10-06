// ============================================================================
// /industry/learning - the learning institutions and companies (2026-09-07)
// ----------------------------------------------------------------------------
// PRIME asked for a dedicated index of the training centres, certification
// bodies, learning platforms and schools that sit in the industry catalogue.
// They were already in the chronological timeline on /industry, tagged
// "training", where they disappear among three hundred vendors. This page
// pulls them out and groups them by WHAT KIND of institution they are, which
// is the distinction the entries themselves keep drawing: a centre that sells
// a manufacturer's curriculum, a body that certifies a person, a platform that
// sells a library, a school that grants a degree.
//
// The grouping is a curated map below. Anything tagged "training" that is not
// in the map lands in a final "also tagged" section, so a future entry appears
// here automatically and nothing tagged is ever silently dropped. Copy lives in
// the `learning_page` namespace in every locale.
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { partnerVendors, storyStart } from "@/content/vendors/partners";
// The flag and the footprint on every card (PRIME 2026-10-05 22:20): the founding country from
// origins.ts, as on the industry timeline; the headquarters and the activity geography from
// geography.ts, with the source of each published under the cards.
import { VENDOR_ORIGINS, countryLabel } from "@/content/vendors/origins";
import { LEARNING_GEOGRAPHY } from "@/content/vendors/geography";
import CountryFlag from "@/components/CountryFlag";

/** Section membership by slug. Order within a section is by founding year. */
const SECTIONS: ReadonlyArray<{ key: string; slugs: readonly string[] }> = [
  {
    key: "centres", // authorised training centres and delivery partners
    slugs: ["red-education", "global-knowledge", "fast-lane", "inlearn", "ka-solution", "versim", "ntsec", "ihc-group", "lanpro", "qos-training", "binario", "flipside", "epi", "qd7", "readytech", "microcamp"],
  },
  {
    key: "bodies", // certification bodies and exam delivery
    slugs: ["comptia", "ec-council", "offsec", "sans-institute", "pearson-vue", "prometric", "kryterion", "credly"],
  },
  {
    key: "platforms", // learning platforms and lab environments
    slugs: ["coursera", "udemy", "pluralsight", "edx", "alura", "startse", "cloudshare", "skytap"],
  },
  {
    key: "schools", // schools, universities and research institutes
    slugs: ["fatec", "cpqd", "raspberry-pi"],
  },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learning_page" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function LearningIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("learning_page");
  const tNav = await getTranslations("nav");

  const bySlug = new Map(partnerVendors.map((v) => [v.slug, v]));
  const placed = new Set<string>();
  const sections = SECTIONS.map((s) => ({
    key: s.key,
    items: s.slugs
      .map((slug) => bySlug.get(slug))
      .filter((v): v is NonNullable<typeof v> => !!v)
      .sort((a, b) => storyStart(a) - storyStart(b)),
  }));
  for (const s of sections) for (const v of s.items) placed.add(v.slug);
  // Everything tagged "training" that the map does not name.
  const rest = partnerVendors
    .filter((v) => (v.tags as readonly string[]).includes("training") && !placed.has(v.slug))
    .sort((a, b) => storyStart(a) - storyStart(b));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>{tNav("skipToContent")}</a>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <Link href="/industry" className="article-back">← {t("backToIndustry")}</Link>
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede" style={{ marginBottom: "2.5rem" }}>{t("lede")}</p>

            {[...sections, { key: "rest", items: rest }].map((s) =>
              s.items.length === 0 ? null : (
                <div key={s.key}>
                  <div className="vendor-divider">
                    <h2 className="vendor-divider-title">{t(`${s.key}Title`)}</h2>
                    <p className="vendor-divider-note">{t(`${s.key}Note`)}</p>
                  </div>
                  <ul className="vendor-grid">
                    {s.items.map((v) => (
                      <li key={v.slug}>
                        <Link href={`/industry/${v.slug}`} className="vendor-card">
                          {v.founded ? <span className="vendor-card-years mono">{v.founded}</span> : null}
                          <span className="vendor-card-name">{v.name.split(/\s[-\u2013\u2014]\s/)[0]}</span>
                          <span className="vendor-card-tagline">{v.tagline}</span>
                          {/* Where it is and where it works (PRIME 2026-10-05 22:20). The flag is the
                              founding country (origins.ts, the timeline's convention); the text is the
                              headquarters today and the footprint: Global, the named countries and
                              regions, or the headquarters country alone. A pending footprint, the
                              headquarters by default, is marked and says so on hover. */}
                          {(() => {
                            const g = LEARNING_GEOGRAPHY[v.slug];
                            const origin = VENDOR_ORIGINS[v.slug];
                            if (!g) return null;
                            const hqText = g.hq.city ? `${g.hq.city} · ${g.hq.country}` : countryLabel(g.hq.country);
                            const scopeText =
                              g.scope === "global"
                                ? t("geo.global")
                                : g.scope === "international"
                                  ? [
                                      ...(g.where?.countries ?? []).map((c) => countryLabel(c)),
                                      ...(g.where?.regions ?? []).map((r) => t(`geo.regions.${r}`)),
                                    ].join(" · ")
                                  : countryLabel(g.hq.country);
                            return (
                              <span
                                className={`vendor-card-geo${g.pending ? " vendor-card-geo--pending" : ""}`}
                                data-scope={g.scope}
                                title={g.pending ? t("geo.pendingNote") : undefined}
                              >
                                {origin ? <CountryFlag code={origin} /> : null}
                                <span className="vendor-card-geo-hq">
                                  <span className="vendor-card-geo-label">{t("geo.hqLabel")}</span> {hqText}
                                </span>
                                <span className="vendor-card-geo-scope">
                                  <span className="vendor-card-geo-label">{t("geo.activeLabel")}</span> {scopeText}
                                  {g.pending ? <span className="vendor-card-geo-pending-mark" aria-hidden="true"> ?</span> : null}
                                </span>
                              </span>
                            );
                          })()}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}

            {/* The sources of every headquarters and footprint above, published rather than kept
                (PRIME's golden content standard: sources at the foot of every page). One line per
                company, in the order of the sections; the pending rows say so. */}
            <details className="learning-geo-sources">
              <summary>{t("geo.sourcesTitle")}</summary>
              <p className="learning-geo-sources-note">{t("geo.sourcesNote")}</p>
              <ul>
                {[...sections, { key: "rest", items: rest }].flatMap((s) => s.items).map((v) => {
                  const g = LEARNING_GEOGRAPHY[v.slug];
                  if (!g) return null;
                  return (
                    <li key={`geo-${v.slug}`}>
                      <strong>{v.name.split(/\s[-\u2013\u2014]\s/)[0]}</strong>
                      {g.pending ? <span className="learning-geo-pending"> ({t("geo.pendingShort")})</span> : null}
                      {": "}
                      <a href={g.source.url} target="_blank" rel="noopener noreferrer">{g.source.label}</a>
                    </li>
                  );
                })}
              </ul>
            </details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
