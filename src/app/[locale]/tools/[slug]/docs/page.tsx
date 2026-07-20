// ============================================================================
// src/app/[locale]/tools/[slug]/docs/page.tsx
// ----------------------------------------------------------------------------
// TOOL DOCUMENTATION WEB PAGE (/tools/<slug>/docs).
//
// Per the 2026-07-10 directive: each tool's documentation is presented as a web
// page, from which the raw Markdown stays accessible. This route renders the
// hand-authored Markdown at src/content/tool-docs/<locale>/<slug>.md to HTML
// (via the plain unified pipeline in src/lib/toolDocs.ts - NOT MDX, see there)
// and offers a "View as Markdown" link to the generated .md twin, mirroring the
// Learn articles' affordance.
//
// One static page per built tool per locale. Reuses the .article-body prose
// styles and the .doc-md-link affordance the Learn pages use, so tool docs and
// Learn articles read consistently. The tool name (from the tools i18n) is the
// page <h1>; a breadcrumb and a "back to tool" link tie it to the live tool.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { routing } from "@/i18n/routing";
import { getAllToolDocSlugs, getToolDocHtml, hasToolDoc } from "@/lib/toolDocs";
import ToolDocGlossaryHints from "@/components/ToolDocGlossaryHints";
import { ogImages } from "@/lib/og";

// One docs page per (locale, tool) for every tool that has authored docs.
export function generateStaticParams() {
  const slugs = getAllToolDocSlugs();
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
  if (!hasToolDoc(slug)) return {};
  const t = await getTranslations({ locale, namespace: "tools" });
  const tDocs = await getTranslations({ locale, namespace: "toolDocs" });
  const name = t(`${slug}.name`);
  return {
    title: `${name} ${tDocs("titleSuffix")}`,
    description: tDocs("metaDescription", { tool: name }),
    // Reuse the tool's own OG card (the doc is about that tool).
    ...ogImages("tool", slug, locale, name),
  };
}

export default async function ToolDocsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const html = await getToolDocHtml(slug, locale);
  if (html === null) notFound();

  const tNav = await getTranslations("nav");
  const t = await getTranslations("tools");
  const tDocs = await getTranslations("toolDocs");
  const name = t(`${slug}.name`);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="section">
            <div className="container certs-container">
              <Breadcrumbs
                items={[
                  { label: tNav("home"), href: "/" },
                  { label: tNav("tools"), href: "/tools" },
                  { label: name, href: `/tools/${slug}` },
                  { label: tDocs("crumb") },
                ]}
              />

              <p className="hero-eyebrow">{tDocs("eyebrow")}</p>
              <h1 className="article-title">{name}</h1>
              <p className="article-summary">{tDocs("lede", { tool: name })}</p>

              {/* View-as-Markdown affordance (mirrors the Learn pattern). The
                  .md twin is emitted by gen-machine-legible at this path. */}
              {(locale === "en" || locale === "pt-BR") && (
                <p className="doc-md-link">
                  <a href={`/${locale}/tools/${slug}.md`}>
                    {locale === "pt-BR" ? "Ver em Markdown" : "View as Markdown"}
                  </a>
                </p>
              )}

              {/* Back to the live tool. */}
              <p className="tooldoc-back">
                <Link href={`/tools/${slug}`} className="tooldoc-back-link">
                  ← {tDocs("backToTool", { tool: name })}
                </Link>
              </p>

              {/* Rendered documentation. HTML is produced from trusted, authored
                  Markdown via remark/rehype with escaping (no raw HTML), so
                  dangerouslySetInnerHTML here carries only safe, escaped output. */}
              <div
                className="article-body tooldoc-body"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {/* Upgrades the first-occurrence glossary-hint anchors inside the
                  doc body into the shared hover/tap popover (no-op when hints
                  are turned off, leaving plain links to the glossary). */}
              <ToolDocGlossaryHints />

              {/* Foot: return to the tool. */}
              <p className="tooldoc-foot">
                <Link href={`/tools/${slug}`} className="btn btn-secondary">
                  {tDocs("openTool", { tool: name })}
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
