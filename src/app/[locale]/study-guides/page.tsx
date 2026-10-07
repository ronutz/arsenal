// ============================================================================
// src/app/[locale]/study-guides/page.tsx
// ----------------------------------------------------------------------------
// THE STUDY GUIDES PAGE - the Learn-side umbrella over the site's study
// systems, and the page the human sitemap's "Study guides" link lands on:
//
//   0. TRAINING SERIES (milestone NF-1, 2026-10-06; src/content/study-guides/
//      training-series.ts, rendered by components/study-guides/
//      TrainingSeriesSection): the fundamentals curriculum level by level,
//      NetFun I first, each series in modules with outcomes, parts and tools.
//      First on the page: a student arrives for this. Guarded by
//      scripts/check-training-series.mjs.
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
// The open materials registry, for the door card at the foot of the page (under the hero until 2026-10-07).
import { MATERIALS } from "@/content/materials/materials";
// The door card (milestone (m2), 2026-10-06), in place of the one-line signpost of (m1).
import MaterialsDoor from "@/components/MaterialsDoor";
// The training series (milestone NF-1, 2026-10-06), rendered before the reading paths.
import TrainingSeriesSection from "@/components/study-guides/TrainingSeriesSection";
import { readingPathVendor, READING_PATH_VENDOR_KEYS } from "@/lib/reading-path-vendors";
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
  // Vendor detection lives in src/lib/reading-path-vendors.ts so the vendor
  // hubs get the same answer (2026-07-27); two copies drift silently.
  //
  // GROUP_ORDER is DERIVED from that same list rather than written out again.
  // It used to be a hand-maintained array, and it was missing Check Point and
  // NGINX - both onboarded after it was written - so their reading paths fell
  // into "general" here while the hubs grouped them correctly. That is the
  // second place the same missing-vendor bug appeared in one turn, which is
  // the argument for deriving rather than listing.
  const GROUP_ORDER = ["general", ...READING_PATH_VENDOR_KEYS];
  // F7 (SCOUT Round 1, wave B, 2026-10-05): Short / Medium / Deep by article count, the thresholds taken from the
  // distribution itself (the lower and upper terciles of the resolved step counts), never typed, and always shown
  // beside the count so the label explains itself. With 13 paths of 5 to 63 articles the cuts fall at 7 and 14.
  const stepCounts = READING_PATHS.map((path) => path.articles.filter((slug) => getArticle(slug, locale) !== null).length).sort((a, b) => a - b);
  const cutShort = stepCounts[Math.floor(stepCounts.length / 3)] ?? 0;
  const cutMedium = stepCounts[Math.floor((2 * stepCounts.length) / 3)] ?? 0;
  const depthOf = (n: number): "short" | "medium" | "deep" => (n <= cutShort ? "short" : n <= cutMedium ? "medium" : "deep");
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
      group: readingPathVendor(path.id, GROUP_ORDER),
      color: categoryColor(path.category),
      title: t(`paths.${path.id}.title`),
      lede: t(`paths.${path.id}.lede`),
      // F5: the authored outcome sentence, "You will understand...", per path and locale.
      outcome: t(`paths.${path.id}.outcome`),
      // The badge reads "Short · 5 articles": the depth word from the distribution, the count from the path.
      countBadge: t("articlesCountDepth", { depth: t(`depth.${depthOf(steps.length)}`), count: steps.length }),
      steps,
      tools,
    };
  });

  // F5 (SCOUT, adopted 2026-10-05): the SELECTION LAYER by subject family, above the vendor grouping PRIME
  // specified on 2026-07-24, which stays as the exhaustive layer. The family is editorial, by what each path
  // teaches: foundations (TLS, HTTP, regular expressions), identity and security (the open standards and the
  // identity and zero-trust platforms), application delivery (BIG-IP, NGINX) and vendor platforms (the rest).
  // Each family card lists its paths as anchors to the cards below, so there is one card per path and no copy.
  const FAMILY_OF: Record<string, "foundations" | "identity" | "delivery" | "platforms"> = {
    "tls-from-zero": "foundations",
    "http-evolution": "foundations",
    "regex-mastery": "foundations",
    "modern-identity": "identity",
    "pingfederate-administration": "identity",
    "ping-identity-platform": "identity",
    "zscaler-zero-trust": "identity",
    "netskope-sase": "identity",
    "checkpoint-security-administration": "identity",
    "bigip-fundamentals": "delivery",
    "nginx-from-config-to-cache": "delivery",
    "extreme-fabric-and-voss": "platforms",
    "fortinet-fabric-and-operations": "platforms",
  };
  const FAMILIES = ["foundations", "identity", "delivery", "platforms"] as const;
  const families = FAMILIES.map((f) => ({
    key: f,
    paths: resolvedPaths.filter((p) => (FAMILY_OF[p.id] ?? "platforms") === f).sort((a, b) => a.title.localeCompare(b.title, locale)),
  })).filter((f) => f.paths.length > 0);

  const pathGroups: PathGroup[] = GROUP_ORDER.map((key) => ({
    key,
    label: key === "general" ? t("groupGeneral") : tVendors(`${key}.name`),
    paths: resolvedPaths
      .filter((p) => p.group === key)
      .sort((a, b) => a.title.localeCompare(b.title, locale)),
  })).filter((g) => g.paths.length > 0);

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
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

          {/* 0. The training series - the fundamentals curriculum, level by level (NF-1). */}
          <TrainingSeriesSection locale={locale} />

          {/* 1. Curated reading paths - the topic-first, exam-free syllabi. */}
          <section className="section" id="reading-paths">
            <div className="container certs-container">
              <div className="certs-group-head">
                <h2 className="certs-group-title">{t("pathsTitle")}</h2>
              </div>
              <p className="certs-group-intro">{t("pathsLede")}</p>

              {/* The selection layer (F5): four families, each naming its paths with a link to the path's card. */}
              <div className="reading-path-families" aria-labelledby="reading-path-families-title">
                <h3 className="reading-path-families-title" id="reading-path-families-title">{t("familiesTitle")}</h3>
                <p className="reading-path-families-lede">{t("familiesLede")}</p>
                <ul className="reading-path-family-grid">
                  {families.map((f) => (
                    <li key={f.key} className="reading-path-family">
                      <h4 className="reading-path-family-title">{t(`families.${f.key}.title`)}</h4>
                      <p className="reading-path-family-lede">{t(`families.${f.key}.lede`)}</p>
                      <ul className="reading-path-family-paths">
                        {f.paths.map((p) => (
                          <li key={p.id}>
                            <a href={`#${p.id}`} className="reading-path-family-link">
                              <span className="category-dot" style={{ background: p.color }} aria-hidden />{" "}
                              {p.title} <span className="certhub-guide-code mono">{p.countBadge}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>

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
                outcomeLabel={t("outcomeLabel")}
                startLabel={t("startPath")}
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

          {/* 3. The open course material (milestone (m1), 2026-10-06, as a one-line signpost; since (m2), PRIME 19:21:
              the doors to /materials "more easily findable ... in study guides as well", the door card): the course's
              cover, its name, and Present the slides beside the datasheet. Under the hero until 2026-10-07, when PRIME
              found it read as part of the study guides' own title (row 56, 06:41: "Move it to the very bottom of the
              page"); it closes the page now, in a section of its own. */}
          {MATERIALS[0] && (
            <section className="section" id="open-materials">
              <div className="container certs-container">
                <MaterialsDoor locale={locale} context="studyGuides" />
              </div>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
