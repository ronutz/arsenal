// ============================================================================
// src/config/categoryColors.ts
// ----------------------------------------------------------------------------
// FAMILY COLOR-CODING (the visual "same family" bridge between tools and
// articles). The colorable dimension is the shared CATEGORY taxonomy: every
// tool has exactly one category (src/config/tools.ts) and every Learn article
// carries a category PLUS relatedTools, so an article can display several
// family tags when it spans families.
//
// Accessibility stance (works on all six themes without per-theme tuning):
// the color itself is SUPPLEMENTARY. A chip is a small colored dot + a text
// label; the label carries the meaning, the dot carries the association. Chip
// text uses the theme's own --color-muted/--color-text tokens, so contrast is
// the theme's (WCAG-AA) contrast; the pure hue appears only in the decorative
// dot and a soft color-mixed border. Mid-luminance hues below are visible as
// dots on both the darkest (#020617) and lightest canvases.
//
// The mapping is a PRIME-reviewable design choice; edit freely, one line per
// family. Keys MUST match the category keys used by tools.ts and article
// frontmatter (and the tools.categories.* i18n labels).
// ============================================================================

import { tools } from "@/config/tools";

/** category key -> display hue (mid-luminance; dot + soft border only). */
export const CATEGORY_COLORS: Record<string, string> = {
  networking: "#22D3EE", // cyan — the site's core identity
  security: "#F43F5E", // rose
  identity: "#8B5CF6", // violet
  pki: "#F59E0B", // amber
  transport: "#14B8A6", // teal
  encoding: "#3B82F6", // blue
  hashing: "#EC4899", // pink
  web: "#FB923C", // orange
  text: "#94A3B8", // slate
  identifiers: "#84CC16", // lime
};

/** Neutral fallback for any future category not yet mapped (never invisible). */
export const CATEGORY_COLOR_FALLBACK = "#94A3B8";

/** The hue for a category, with fallback. */
export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLOR_FALLBACK;
}

/** tool slug -> category, derived once from the single tool registry. */
const TOOL_CATEGORY: ReadonlyMap<string, string> = new Map(
  tools.map((t) => [t.id, t.category]),
);

/**
 * The family tags for an article: its own category first, then the categories
 * of its related tools (deduped, order-stable). An article touching tools from
 * several families gets several tags; `max` keeps card rows tidy.
 */
export function articleCategories(
  article: { category: string; relatedTools: string[] },
  max = 3,
): string[] {
  const seen = new Set<string>([article.category]);
  const out = [article.category];
  for (const slug of article.relatedTools) {
    const cat = TOOL_CATEGORY.get(slug);
    if (cat && !seen.has(cat)) {
      seen.add(cat);
      out.push(cat);
      if (out.length >= max) break;
    }
  }
  return out;
}
