// ============================================================================
// src/app/[locale]/glossary/[slug]/page.tsx
// ----------------------------------------------------------------------------
// THE GLOSSARY ENTRY PAGE — one term, statically generated for every entry x
// every locale (structural sibling of the Learn article page).
//
// Renders, per glossary-design-spec-v1: the headword (kept in its ORIGINAL
// language across all locales), the kind badge, domain tags, the expansion if
// any, def + context (authored en + native pt-BR, English fallback elsewhere),
// a disputed marker + note for apocryphal lore, the sources list, and three
// cross-link rails — relatedTools (the site thesis: the term links to the tool
// that computes it), relatedArticles, and relatedTerms.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
  getGlossaryEntry,
  getAllGlossarySlugs,
  getRelatedTerms,
} from "@/content/glossary/glossary";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import { getArticle } from "@/lib/learn";
import { ogImages } from "@/lib/og";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";

/** slug -> catalogue display name, for the relatedTools rail. */
const TOOL_NAME = new Map(CATALOGUE.map((t) => [t.slug, t.name]));

/** Pre-generate every entry page for every locale at build time. */
export function generateStaticParams() {
  const slugs = getAllGlossarySlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const entry = getGlossaryEntry(slug);
  if (!entry) return {};
  return {
    title: `${entry.headword} · ${(await getTranslations({ locale, namespace: "glossary" }))("title")}`,
    ...ogImages("glossary", slug, locale, entry.headword),
  };
}

export default async function GlossaryEntryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const entry = getGlossaryEntry(slug);
  if (!entry) notFound();

  const tNav = await getTranslations("nav");
  const t = await getTranslations("glossary");

  const relatedTerms = getRelatedTerms(slug);
  // Only surface related articles that actually resolve to a built article in
  // this locale (English fallback inside getArticle), so no rail link dangles.
  const relatedArticles = (entry.relatedArticles ?? [])
    .map((s) => getArticle(s, locale))
    .filter((a): a is NonNullable<typeof a> => a !== null);
  // relatedTools resolve against the live catalogue (verified at build; the
  // check-glossary gate also enforces this).
  const relatedTools = (entry.relatedTools ?? []).filter((s) =>
    TOOL_NAME.has(s),
  );

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article className="section gloss-detail" data-kind={entry.kind}>
          <div className="container article-container">
            <Breadcrumbs
              ariaLabel={tNav("breadcrumb")}
              items={[
                { label: tNav("home"), href: "/" },
                { label: t("title"), href: "/glossary" },
                { label: entry.headword },
              ]}
            />

            {/* Head: headword + kind + domain tags */}
            <div className="gloss-detail-head">
              <h1 className="gloss-detail-headword">{entry.headword}</h1>
              <span className={`gloss-kind-badge gloss-kind-${entry.kind}`}>
                {t(`kinds.${entry.kind}`)}
              </span>
            </div>

            <p className="gloss-detail-domains">
              {entry.domains.map((d) => (
                <span key={d} className="gloss-domain-tag">
                  {t(`domains.${d}`)}
                </span>
              ))}
            </p>

            {entry.expansion && (
              <p className="gloss-detail-expansion">
                <span className="gloss-detail-label">{t("expansionLabel")}:</span>{" "}
                {entry.expansion}
              </p>
            )}

            {/* def (lead) + context (body) */}
            <p className="gloss-detail-def">{t(`entries.${slug}.def`)}</p>
            <p className="gloss-detail-context">{t(`entries.${slug}.context`)}</p>

            {/* Optional original illustration (site policy: original art only). */}
            {entry.image && (
              <figure className="gloss-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="gloss-figure-img"
                  src={entry.image.src}
                  alt={entry.image.alt}
                  loading="lazy"
                  decoding="async"
                />
                {entry.image.caption && (
                  <figcaption className="gloss-figure-caption">
                    {entry.image.caption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Disputed / apocryphal marker (lore accuracy rule). */}
            {entry.disputed && (
              <p className="gloss-detail-disputed">
                <span className="gloss-disputed-badge">{t("disputedLabel")}</span>{" "}
                {t("disputedNote")}
              </p>
            )}

            {/* Aliases (also-known-as) */}
            {entry.aliases && entry.aliases.length > 0 && (
              <p className="gloss-detail-aliases">
                <span className="gloss-detail-label">{t("aliasesLabel")}:</span>{" "}
                {entry.aliases.join(", ")}
              </p>
            )}

            {/* Sources (required for lore) */}
            {entry.sources && entry.sources.length > 0 && (
              <div className="gloss-detail-sources">
                <h2 className="gloss-detail-sources-title">{t("sourcesLabel")}</h2>
                <ul className="gloss-sources-list">
                  {entry.sources.map((s, i) => (
                    <li key={i}>
                      {s.href ? (
                        <a href={s.href} target="_blank" rel="noopener noreferrer">
                          {s.label}
                        </a>
                      ) : (
                        s.label
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Three cross-link rails */}
            {relatedTools.length > 0 && (
              <nav className="gloss-rail" aria-label={t("relatedToolsLabel")}>
                <h2 className="gloss-rail-title">{t("relatedToolsLabel")}</h2>
                <ul className="gloss-rail-list">
                  {relatedTools.map((s) => (
                    <li key={s}>
                      <Link href={`/tools/${s}`} className="gloss-rail-link gloss-rail-tool">
                        {TOOL_NAME.get(s)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {relatedArticles.length > 0 && (
              <nav className="gloss-rail" aria-label={t("relatedArticlesLabel")}>
                <h2 className="gloss-rail-title">{t("relatedArticlesLabel")}</h2>
                <ul className="gloss-rail-list">
                  {relatedArticles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/learn/${a.slug}`} className="gloss-rail-link">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {relatedTerms.length > 0 && (
              <nav className="gloss-rail" aria-label={t("relatedTermsLabel")}>
                <h2 className="gloss-rail-title">{t("relatedTermsLabel")}</h2>
                <ul className="gloss-rail-list">
                  {relatedTerms.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/glossary/${r.slug}`} className="gloss-rail-link">
                        {r.headword}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <p className="gloss-detail-back">
              <Link href="/glossary">&larr; {t("backToIndex")}</Link>
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
