// ============================================================================
// src/app/[locale]/study-guides/page.tsx
// ----------------------------------------------------------------------------
// THE STUDY GUIDES PAGE - the Learn-side umbrella over the site's two study
// systems, and the page the human sitemap's "Study guides" link lands on:
//
//   1. CURATED READING PATHS (src/content/study-guides/reading-paths.ts):
//      ordered walks through the Learn library, each pairing its articles
//      (titles resolved live from the article registry, so a rename can never
//      leave a stale label) with the tools a reader practices on. Guarded by
//      scripts/check-reading-paths.mjs.
//   2. CERTIFICATION SIGNPOST: a heading + one-line lede + button pointing at
//      the blueprint-mapped exam guides. Rendered here as the SAME cards the
//      /certifications hub uses (shared certhub-guide-* classes), linking into
//      the per-exam pages - one card language across both entrances.
//
// Copy lives in the "studyGuidesIndex" i18n namespace (en + native pt-BR,
// English fallback elsewhere); card labels reuse "certGuides" so the two
// surfaces can never drift apart. Statically generated for every locale. No
// new CSS classes: composed entirely from the existing page-hero, section,
// certhub-guide, and category-dot vocabulary.
// ============================================================================

import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { ogImages } from "@/lib/og";
import { READING_PATHS } from "@/content/study-guides/reading-paths";
import ReadingPathSections, {
  type PathGroup,
} from "@/components/ReadingPathSections";
import { getArticle } from "@/lib/learn";
import { tools as toolRegistry } from "@/config/tools";
import { categoryColor } from "@/config/categoryColors";

/** Statically generated for every locale (English fallback per next-intl). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "studyGuidesIndex" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { title: alt, description: t("lede"), ...ogImages("page", "study-guides", locale, alt) };
}

export default async function StudyGuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("studyGuidesIndex");
  const tTools = await getTranslations("tools");
  const tNav = await getTranslations("nav");
  const tVendors = await getTranslations("vendors");

  // -- Reading paths, grouped and sorted for the collapsible index
  //    (PRIME 2026-07-24). GROUP ORDER is fixed and deliberate: the
  //    vendor-agnostic group first, then vendors alphabetically as PRIME
  //    specified (F5, Extreme, Fortinet, Netskope, Ping, Zscaler). Within a
  //    group, paths sort ALPHABETICALLY by localized title via localeCompare,
  //    so pt-BR accents order correctly rather than by raw code point.
  const GROUP_ORDER = ["general", "f5", "extreme", "fortinet", "netskope", "ping", "zscaler"];
  // Vendor detection is DERIVED from the path id: no new data field to keep in
  // sync, and a path named for its vendor lands in that vendor's group.
  //    A path belongs to a vendor when its id starts with that vendor's token
  //    (with or without a separator, so both "ping-identity-platform" and
  //    "pingfederate-administration" land under Ping), plus the one alias the
  //    ids actually use: "bigip" is F5's product name, not a separate vendor.
  const VENDOR_ALIASES: Record<string, string[]> = {
    f5: ["f5", "bigip"],
    extreme: ["extreme", "exos", "voss"],
    fortinet: ["fortinet", "fortigate"],
    netskope: ["netskope"],
    ping: ["ping"],
    zscaler: ["zscaler"],
  };
  const vendorOf = (id: string) =>
    GROUP_ORDER.find(
      (v) => v !== "general" && (VENDOR_ALIASES[v] ?? []).some((tok) => id.startsWith(tok)),
    ) ?? "general";

  const resolvedPaths = READING_PATHS.map((path) => {
    const steps = path.articles
      .map((slug) => getArticle(slug, locale))
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map((a) => ({ slug: a.slug, title: a.title }));
    const tools = path.tools
      .map((id) => toolRegistry.find((tl) => tl.id === id))
      .filter((tl): tl is NonNullable<typeof tl> => Boolean(tl))
      .map((tl) => ({ id: tl.id, href: tl.href, name: tTools(`${tl.id}.name`) }));
    return {
      id: path.id,
      group: vendorOf(path.id),
      color: categoryColor(path.category),
      title: t(`paths.${path.id}.title`),
      lede: t(`paths.${path.id}.lede`),
      countBadge: t("articlesCount", { count: steps.length }),
      steps,
      tools,
    };
  });

  const pathGroups: PathGroup[] = GROUP_ORDER.map((key) => ({
    key,
    label: key === "general" ? t("groupGeneral") : tVendors(`${key}.name`),
    paths: resolvedPaths
      .filter((p) => p.group === key)
      .sort((a, b) => a.title.localeCompare(b.title, locale)),
  })).filter((g) => g.paths.length > 0);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero - the shared page-hero standard (D-84). */}
          <section className="certs-hero">
            <div className="container certs-container">
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* 1. Curated reading paths - the topic-first, exam-free syllabi. */}
          <section className="section" id="reading-paths">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("pathsTitle")}</h2>
              </div>
              <p className="certs-group-intro">{t("pathsLede")}</p>

              {/* Each path is a card; the wrapper owns the spacing between
                  cards (certhub-note has none - it was born a single note). */}
              {/* Reading paths are GROUPED and COLLAPSIBLE (PRIME 2026-07-24).
                  Grouping is DERIVED from the path id rather than from a new
                  data field: ids that begin with a vendor token belong to that
                  vendor, everything else is vendor-agnostic. Deriving beats
                  adding a field nobody remembers to set (D-74), and the guard
                  below fails the build if a group has no heading. */}
              <ReadingPathSections
                groups={pathGroups}
                expandAllLabel={t("expandAll")}
                collapseAllLabel={t("collapseAll")}
                seeContentsLabel={t("seeContents")}
                hideContentsLabel={t("hideContents")}
                stepsLabel={t("stepsLabel")}
                practiceLabel={t("practiceLabel")}
              />
            </div>
          </section>

          {/* 2. Certification study guides live at /certifications - one home,
              one registry, one page rendering the card grid. This section is a
              signpost, not a copy: the full grid rendered here too until
              2026-07-21, when the duplicate was retired in favor of a single
              canonical page (same data source, so nothing was lost). */}
          <section className="section" id="certification-guides">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("certTitle")}</h2>
              </div>
              <p className="certs-group-intro">{t("certLede")}</p>
              <p>
                <Link className="btn btn-secondary" href="/certifications">
                  {t("certAllCta")} &#8594;
                </Link>
              </p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
