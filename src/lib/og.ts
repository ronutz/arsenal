// ============================================================================
// src/lib/og.ts
// ----------------------------------------------------------------------------
// OG-IMAGE METADATA HELPER.
//
// Maps a (kind, slug, locale) to the Open Graph + Twitter image metadata for a
// page, pointing at the pre-generated card under /public/og/ (built by
// scripts/gen-og.mts). The naming scheme here MUST match the generator:
//   /og/<kind>/<locale>/<slug>.<ext>
// with kind in {tool, article, glossary, guide, vendor, page}; brand pages ship
// jpeg, everything else png; the home page's slug is "home"; the site-wide
// fallback is /og/default.png.
//
// Every page kind calls ogImages(...) and spreads the result into its
// generateMetadata openGraph/twitter. Because the generator and this helper
// derive filenames the same way, there is no per-page image list to maintain.
//
// The alt text is localized (cheap, per-locale); the image URL is locale-keyed
// so pt-BR shares unfurl with pt-BR cards. summary_large_image is the Twitter/X
// card type for 1200x630.
// ============================================================================

import type { Metadata } from "next";

type OgKind = "tool" | "article" | "glossary" | "guide" | "vendor" | "page";

// Brand pages that ship a jpeg portrait card (must match BRAND_PORTRAITS +
// the jpeg branch in the generator). Keyed by the "page" slug used on disk.
const JPEG_PAGE_SLUGS = new Set(["home", "about", "training", "red-education"]);

function extFor(kind: OgKind, slug: string): "png" | "jpeg" {
  return kind === "page" && JPEG_PAGE_SLUGS.has(slug) ? "jpeg" : "png";
}

/**
 * OG + Twitter image metadata for a page. Pass the same slug the generator
 * enumerated (home page -> "home"; a static page -> its route segment; a tool
 * -> its TOOL_PAGES key; an article/glossary/guide -> its slug; a vendor ->
 * its key). `alt` is the already-localized title/label of the page.
 */
export function ogImages(
  kind: OgKind,
  slug: string,
  locale: string,
  alt: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const ext = extFor(kind, slug);
  const url = `/og/${kind}/${locale}/${slug}.${ext}`;
  return {
    openGraph: {
      images: [{ url, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: "summary_large_image",
      images: [url],
    },
  };
}

/** The site-wide default card, for any route without a specific one. */
export function ogDefault(alt: string): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { images: [{ url: "/og/default.png", width: 1200, height: 630, alt }] },
    twitter: { card: "summary_large_image", images: ["/og/default.png"] },
  };
}
