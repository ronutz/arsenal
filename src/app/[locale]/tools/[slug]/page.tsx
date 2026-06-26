// ============================================================================
// src/app/[locale]/tools/[slug]/page.tsx
// ----------------------------------------------------------------------------
// PER-TOOL PAGE - the detail view for a single tool, statically generated for
// every (locale, slug). The registry (src/config/tools.ts) supplies the name
// and blurb; the local tool module supplies the live component and its RFC
// sources (rendered as a References block). The CIDR tool intentionally stays
// on the home page (#cidr), so it is not in the slug map here - new tools live
// at /tools/<slug>.
//
// Adding a tool page = drop one entry in TOOL_PAGES below; generateStaticParams
// expands it across every locale automatically.
// ============================================================================

import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ToolLearnPanel from "@/components/ToolLearnPanel";
import { tools } from "@/config/tools";
import JwtTool from "@/components/JwtTool";
import { manifest as jwtManifest } from "@/lib/tools/jwt";
import Base64Tool from "@/components/Base64Tool";
import { manifest as base64Manifest } from "@/lib/tools/base64";
import HashTool from "@/components/HashTool";
import { manifest as hashManifest } from "@/lib/tools/hash";
import HmacTool from "@/components/HmacTool";
import { manifest as hmacManifest } from "@/lib/tools/hmac";
import PkceTool from "@/components/PkceTool";
import { manifest as pkceManifest } from "@/lib/tools/pkce";
import UuidTool from "@/components/UuidTool";
import { manifest as uuidManifest } from "@/lib/tools/uuid";
import X509Tool from "@/components/X509Tool";
import { manifest as x509Manifest } from "@/lib/tools/x509";
import Ipv6Tool from "@/components/Ipv6Tool";
import { manifest as ipv6Manifest } from "@/lib/tools/ipv6";

/** A reference link shown under a tool (from its manifest sources). */
interface ToolSource {
  id: string;
  label: string;
  url?: string;
}

/** The render unit for one tool page: its component + its source links. */
interface ToolPage {
  Component: ComponentType;
  sources: ToolSource[];
}

// The slug map. Each entry pairs a route segment with its live component and
// the references to surface. cidr is deliberately absent (it lives on /#cidr).
const TOOL_PAGES: Record<string, ToolPage> = {
  jwt: {
    Component: JwtTool,
    sources: jwtManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  base64: {
    Component: Base64Tool,
    sources: base64Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  hash: {
    Component: HashTool,
    sources: hashManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  hmac: {
    Component: HmacTool,
    sources: hmacManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  pkce: {
    Component: PkceTool,
    sources: pkceManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  uuid: {
    Component: UuidTool,
    sources: uuidManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  x509: {
    Component: X509Tool,
    sources: x509Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  ipv6: {
    Component: Ipv6Tool,
    sources: ipv6Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
};

/** Pre-generate every tool page for every locale at build time. */
export function generateStaticParams() {
  const slugs = Object.keys(TOOL_PAGES);
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = TOOL_PAGES[slug];
  if (!page) notFound();

  const entry = tools.find((tool) => tool.id === slug);
  const tNav = await getTranslations("nav");
  const tTools = await getTranslations("tools");
  const Component = page.Component;

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article className="section">
          <div className="container article-container">
            <Link href="/tools" className="article-back">
              ← {tTools("backToTools")}
            </Link>
            {entry && <h1 className="article-title">{tTools(`${slug}.name`)}</h1>}
            {entry && <p className="article-summary">{tTools(`${slug}.blurb`)}</p>}

            <Component />

            <ToolLearnPanel toolSlug={slug} locale={locale} heading={tTools("learnHeading")} />

            {page.sources.length > 0 && (
              <section className="tool-sources" aria-label={tTools("references")}>
                <h2 className="tool-sources-title">{tTools("references")}</h2>
                <ul className="tool-sources-list">
                  {page.sources.map((source) => (
                    <li key={source.id}>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tool-sources-link"
                        >
                          {source.label}
                        </a>
                      ) : (
                        source.label
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
