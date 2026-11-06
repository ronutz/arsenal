// ============================================================================
// src/lib/og.ts
// ----------------------------------------------------------------------------
// OG-IMAGE METADATA HELPER.
//
// Maps a (kind, slug, locale) to the Open Graph + Twitter image metadata for a
// page, pointing at the pre-generated card under /public/og/ (built by
// scripts/gen-og.mts). The naming scheme here MUST match the generator:
//   /og/<kind>/<locale>/<slug>.<ext>
// with kind in {tool, article, glossary, guide, vendor, page, game}; brand pages ship
// jpeg, everything else png; the home page's slug is "home"; the site-wide
// fallback is /og/default.png.
//
// Every page kind calls ogImages(...) and spreads the result into its
// generateMetadata openGraph/twitter. Because the generator and this helper
// derive filenames the same way, there is no per-page image list to maintain.
//
// The alt text is localized (cheap, per-locale); the image URL is locale-keyed
// so pt-BR shares unfurl with pt-BR cards, and the languages with no card of
// their own unfurl with the English one (OG_CARD_LOCALES). summary_large_image is the Twitter/X
// card type for 1200x630.
// ============================================================================

import type { Metadata } from "next";

// "game" (05/11/2026): the /dev/fun games and the shelf ("shelf"), drawn by scripts/og-games.mts.
type OgKind = "tool" | "article" | "glossary" | "guide" | "vendor" | "page" | "game";

// The locales the generator draws cards for (05/11/2026). The two authored languages have their own cards; the other
// fourteen fall back to English per key, so their pages share the English card. Before this list, a page in any other
// language pointed at /og/<kind>/<locale>/..., a file the generator never draws, and its shared link showed no image.
// scripts/gen-og.mts imports this same list, so the two cannot disagree.
export const OG_CARD_LOCALES: readonly string[] = ["en", "pt-BR"];

// The card language for a page language: its own where a card is drawn for it, English otherwise.
export function ogCardLocale(locale: string): string {
  // An authored language keeps its own card; every other language reads the English one.
  return OG_CARD_LOCALES.includes(locale) ? locale : "en";
}

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
  // The file's extension: jpeg for the brand portraits, png for every other card.
  const ext = extFor(kind, slug);
  // The card's path, in the page's language where a card is drawn for it and in English otherwise.
  const url = `/og/${kind}/${ogCardLocale(locale)}/${slug}.${ext}`;
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
