// ============================================================================
// src/lib/rehypeLocaliseLinks.ts
// ----------------------------------------------------------------------------
// REHYPE PLUGIN: root-relative links in authored Markdown and MDX get the page's
// locale prefix at build time.
//
// WHY. The articles, blog posts, practice pages and tool docs are written once
// and rendered in every locale, so their authors write links without a locale:
// `[the explainer](/tools/expect-script-explainer)`. The site builds pages only
// under /<locale>/ (localePrefix "always"), so such a link has no file behind
// it; in production the Worker answers it with a redirect to the DEFAULT locale,
// which sends a Portuguese reader to the English page. Measured on 2026-10-05
// in the pt-BR build: 1,430 such links across 711 articles, 38 on the blog, 13
// in tool docs. They were also invisible to check-internal-links, which reads
// only `href="/<locale>/..."`, so three dead links in the Learn corpus had gone
// unnoticed (found and fixed the same night: an article slug that had been
// renamed, a slug that never existed, and an article never written).
//
// WHAT. For every <a> whose href starts with a single "/" and is not already
// under a locale, not a build or API path, and not a file (a path whose last
// segment has an extension, such as /openapi.json or /llms.txt), the plugin
// prefixes "/<locale>". Fragments and query strings are kept. Nothing else is
// touched: external links, mailto:, fragment-only links and files stay as they
// are, and the glossary-hint anchors already carry their locale.
//
// The plugin is a factory taking the locale, so each page's render applies its
// own prefix, and it has no dependency beyond hast's types: a small walk is all
// the tree needs.
// ============================================================================

import type { Root, Element, RootContent } from "hast";
import { LOCALE_CODES } from "@/i18n/locales";

/** Paths the site serves without a locale: build output, the API, and the few root files. */
const UNLOCALISED_PREFIXES = ["/_next/", "/api/", "/archive/", "/img/", "/flags/", "/og/", "/downloads/", "/certs/", "/locales/", "/pagefind/"];

/** Is this href one the plugin should prefix? */
export function shouldLocalise(href: string, locale: string): boolean {
  // Root-relative only: "/x", not "//host", not "http:", not "#frag", not "mailto:".
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  // The path alone, without fragment or query.
  const pathOnly = href.split(/[#?]/)[0];
  // Already under this or another locale.
  const first = pathOnly.split("/")[1] ?? "";
  if (first === locale || (LOCALE_CODES as readonly string[]).includes(first)) return false;
  // Build output, the API and the root-level asset folders.
  if (UNLOCALISED_PREFIXES.some((p) => pathOnly.startsWith(p))) return false;
  // A file: the last segment has an extension (openapi.json, llms.txt, feed.xml, a .md twin).
  const last = pathOnly.split("/").pop() ?? "";
  if (/\.[a-z0-9]{1,8}$/i.test(last)) return false;
  // A page route: prefix it.
  return true;
}

/** Prefix one href with the locale, keeping fragment and query. */
export function localiseHref(href: string, locale: string): string {
  // Only when the rule says so.
  return shouldLocalise(href, locale) ? `/${locale}${href}` : href;
}

/** Walk a hast subtree and rewrite every anchor's href. */
function walk(node: Root | RootContent, locale: string): void {
  // Only the root and elements carry children; everything else (text, comments, MDX nodes) is left alone.
  if (node.type !== "root" && node.type !== "element") return;
  // An anchor with an href: rewrite it.
  if (node.type === "element" && (node as Element).tagName === "a" && typeof (node as Element).properties?.href === "string") {
    // The localised href.
    (node as Element).properties.href = localiseHref((node as Element).properties.href as string, locale);
  }
  // Descend.
  for (const child of node.children) walk(child as RootContent, locale);
}

/** The plugin: `use(rehypeLocaliseLinks, locale)`. */
export default function rehypeLocaliseLinks(locale: string) {
  // The transformer unified calls with the tree.
  return (tree: Root) => {
    // Rewrite in place.
    walk(tree, locale);
  };
}
