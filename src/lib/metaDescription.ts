// ============================================================================
// src/lib/metaDescription.ts
// ----------------------------------------------------------------------------
// ONE SUMMARY, THREE DESCRIPTION FIELDS (Round 1, ARC-06, 2026-10-25).
//
// Detail pages (Industry records, glossary terms, tools) set a specific title
// and a specific social image but no description, so every one of them
// inherited the layout's site-wide tagline in <meta name="description">,
// og:description and twitter:description. A search result or a link preview
// for "BGP" and one for "3Com" said the same sentence about the whole site.
//
// This helper turns ONE existing, reviewed record field (a record's tagline, a
// glossary definition, a tool's blurb) into the three fields, identically:
//
//   - plain text: these record fields are plain text by contract (see
//     scripts/check-plaintext-fields.mjs), so normalising means collapsing
//     whitespace and unwrapping a stray Markdown link. Angle brackets, quotes,
//     asterisks and underscores are KEPT: in this corpus they are technical
//     notation (<vs_name>, a < b, *.example.com, __init__), not markup;
//   - bounded: whole sentences up to MAX_CHARS (240, chosen against the
//     corpus: the median tool blurb is 226 characters, the median glossary
//     definition 119), otherwise cut at a word boundary with an ellipsis. The
//     bound keeps a preview readable; it is not a ranking promise;
//   - escaped by the framework: Next.js writes metadata as escaped attribute
//     values, so quotes, ampersands, angle brackets and Portuguese characters
//     survive as text and nothing in a summary can become markup. This helper
//     deliberately does NOT pre-escape, which would double-escape (&amp;amp;).
//
// MERGING. Next.js replaces a parent's `openGraph`/`twitter` object wholesale
// when a page sets its own, so the description is merged INTO the page's base
// image metadata (ogImages()/ogDefault()) rather than set beside it; setting
// `openGraph: { description }` alone would silently drop the page's card.
//
// FALLBACK (ARC-06-F). When a record has no usable summary, no description is
// set and the layout's site tagline applies, which is the site's existing,
// reviewed default; the gap is logged at build time with the page's id so it
// can be found and written, instead of a random paragraph being copied in.
// ============================================================================

import type { Metadata } from "next";

/** Upper bound for a description, in characters (a readable preview, not an SEO rule). */
export const MAX_CHARS = 240;

/**
 * Normalise a record field into one plain-text line.
 *
 * @param input the record's summary (plain text by contract)
 * @returns the plain text, or "" when nothing usable remains
 */
export function plainText(input: string | null | undefined): string {
  // Nothing to normalise.
  if (!input) return "";
  return (
    input
      // A Markdown link (forbidden in these fields, but cheap to survive) keeps its visible text.
      .replace(/\[([^\]\n]*)\]\((?:\/|https?:)[^)\s]*\)/g, "$1")
      // Every run of whitespace (newlines included) becomes one space.
      .replace(/\s+/g, " ")
      // No leading or trailing space.
      .trim()
  );
}

/**
 * Bound a plain-text summary to MAX_CHARS.
 *
 * Whole sentences are kept while they fit; if even the first sentence is too
 * long, the text is cut at the last word boundary and ends with an ellipsis.
 *
 * @param text plain text (already normalised)
 * @param max the bound, MAX_CHARS by default
 */
export function boundSummary(text: string, max: number = MAX_CHARS): string {
  // Short enough already.
  if (text.length <= max) return text;
  // Sentences: split only at whitespace that FOLLOWS . ! or ?, so a dot inside
  // a number, a version or an address ("$7.90", "v1.2", "10.0.0.1") never splits.
  const sentences = text.split(/(?<=[.!?])\s+/);
  // Accumulate whole sentences while they fit.
  let out = "";
  for (const s of sentences) {
    // The candidate with this sentence appended.
    const next = (out + s).trim();
    // Stop before exceeding the bound.
    if (next.length > max) break;
    // Keep it, with a space before the next sentence.
    out = next + " ";
  }
  // At least one whole sentence fitted: use those.
  if (out.trim().length > 0) return out.trim();
  // Otherwise cut the first sentence at the last space before the bound.
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  // Trim trailing punctuation that would sit oddly before the ellipsis.
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, "") + "…";
}

/** The one value used for all three description fields, or "" when there is none. */
export function metaSummary(input: string | null | undefined, max: number = MAX_CHARS): string {
  // Normalise, then bound.
  return boundSummary(plainText(input), max);
}

/**
 * Description metadata for a page: <meta name="description">, og:description
 * and twitter:description, all from the same summary, merged into the page's
 * base image metadata.
 *
 * @param input the record's summary field
 * @param base the page's own openGraph/twitter (ogImages() or ogDefault()), kept intact
 * @param id a page identifier for the build log when the summary is missing
 */
export function withDescription(
  input: string | null | undefined,
  base: Pick<Metadata, "openGraph" | "twitter"> = {},
  id?: string,
): Pick<Metadata, "description" | "openGraph" | "twitter"> {
  // The single plain-text value.
  const description = metaSummary(input);
  // No usable summary: keep the base untouched so the layout's reviewed
  // site tagline applies, and say so in the build log (ARC-06-F).
  if (!description) {
    // Reportable content gap; a missing id still logs something findable.
    console.warn(`[metaDescription] no summary for ${id ?? "a page"}; the site tagline applies`);
    return { ...base };
  }
  return {
    // The search-result description.
    description,
    // The page's Open Graph card, with the same description added.
    openGraph: { ...(base.openGraph ?? {}), description },
    // The page's Twitter/X card, with the same description added.
    twitter: { ...(base.twitter ?? {}), description },
  };
}
