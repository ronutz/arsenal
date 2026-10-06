// ============================================================================
// /industry/method - HOW THE RESEARCH IS DONE (E18 of Round 1, SCOUT; adopted
// 2026-10-06).
//
// The industry record states facts about several hundred real companies and
// people: when they were founded, who bought whom and for how much, whether
// they still exist. Every rule that governs those statements already existed
// as a build guard (scripts/check-vendor-founded-sources.mjs,
// check-placeholder-sources.mjs, check-person-year-sources.mjs,
// check-source-hosts.mjs, check-sources.mjs) and as rulings in the private
// canon; none of it was stated to a reader. This page says the rules in prose,
// with the examples the record itself contains, and names the guards so a
// reader can see that each rule is enforced rather than promised.
//
// A new route, so it carries its own title (check-page-titles), lands in the
// sitemap from the build output (gen-machine-legible), and takes the default
// social card like its siblings /industry/learning and /industry/milestones.
// Copy lives in the `industryMethod` namespace, authored in en and pt-BR.
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";

/** Every locale builds this page: the record is read in all of them. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "industryMethod" });
  return { title: t("title"), description: t("metaDescription") };
}

/** The sections, in reading order; each has a title and two or three paragraphs in the messages. */
const SECTIONS: ReadonlyArray<{ key: string; paragraphs: number }> = [
  { key: "sources", paragraphs: 3 },
  { key: "founded", paragraphs: 3 },
  { key: "acquisitions", paragraphs: 2 },
  { key: "uncertain", paragraphs: 2 },
  { key: "status", paragraphs: 2 },
  { key: "corrections", paragraphs: 2 },
];

/** The guards named on the page, each with its one-line meaning in the messages. */
const GUARDS = [
  "check-sources",
  "check-source-hosts",
  "check-vendor-founded-sources",
  "check-placeholder-sources",
  "check-person-year-sources",
  "check-partner-duplicates",
  "check-citation-fields",
] as const;

export default async function IndustryMethodPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("industryMethod");
  const tNav = await getTranslations("nav");
  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>{tNav("skipToContent")}</a>
      <Header />
      <main id="main">
        <article>
          <section className="section">
            <div className="container section-narrow">
              <Breadcrumbs
                ariaLabel={tNav("breadcrumb")}
                items={[
                  { label: tNav("home"), href: "/" },
                  { label: tNav("industry"), href: "/industry" },
                  { label: t("navLabel") },
                ]}
              />
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* The rules, one section each, with the record's own examples in the prose. */}
          {SECTIONS.map((s) => (
            <section className="section" key={s.key} id={s.key}>
              <div className="container section-narrow">
                <h2 className="section-title">{t(`sections.${s.key}.title`)}</h2>
                {Array.from({ length: s.paragraphs }, (_, i) => (
                  <p className="section-body" key={i}>{t(`sections.${s.key}.p${i + 1}`)}</p>
                ))}
              </div>
            </section>
          ))}

          {/* The guards: the rules above, as the build enforces them. Named by their script, one line each. */}
          <section className="section section-accent" id="guards">
            <div className="container section-narrow">
              <h2 className="section-title">{t("guards.title")}</h2>
              <p className="section-body">{t("guards.lede")}</p>
              <ul className="method-guards">
                {GUARDS.map((g) => (
                  <li key={g} className="method-guard">
                    <code className="method-guard-name">{g}</code>
                    <span className="method-guard-what">{t(`guards.${g}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="section">
            <div className="container section-narrow">
              <p className="section-body">{t("closer")}</p>
              <p className="section-cta">
                <Link href="/industry" className="section-cta-link">{t("backToIndustry")} &rarr;</Link>
                {" "}
                <Link href="/contact#correction" className="section-cta-link">{t("correctionLink")} &rarr;</Link>
              </p>
            </div>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
