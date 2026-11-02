// ============================================================================
// src/i18n/corpus-routing.ts
// ----------------------------------------------------------------------------
// WHERE A LINK TO A LEARN ARTICLE OR A GLOSSARY ENTRY GOES IN A LANGUAGE THAT
// DOES NOT CARRY THEM.
//
// The Learn articles and the glossary entries are generated only in the
// authored-content locales (AUTHORED_CONTENT_LOCALES, en and pt-BR); in the
// other live locales the Worker answers their addresses with a temporary
// redirect to the English page (worker/index.ts, 2026-09-10). So a French page
// that linked to /fr/learn/tftp/ sent every reader, and every crawler, through
// a redirect: Search Console listed 2,540 "Page with redirect" URLs on
// 2026-11-02, most of them exactly these.
//
// Since 2026-11-02 (PRIME, 12:15: "fix the links passing through the temporary
// redirect to English") the links say where they go: in a locale without the
// authored content, a link to an article or an entry points at the English page
// directly. One predicate decides it for every producer of such links (the
// shared Link component, the rehype plugin that localises Markdown links, the
// glossary hints) and for the Worker's redirect, so the links and the redirect
// can never disagree.
//
// THE PREDICATE IS NARROWER THAN THE WORKER'S RULE USED TO BE. That rule
// redirected every path with two or more segments under /learn/ or /glossary/,
// which also caught three index pages that ARE generated in every live locale:
// /learn/series/, /glossary/domain/<domain>/ and /glossary/kind/<kind>/. Their
// localised navigation was unreachable outside en and pt-BR, against the
// Worker's own comment ("Only the DETAIL pages move"). Only an article or an
// entry (exactly /learn/<slug> or /glossary/<slug>, or its .md twin) counts now.
// ============================================================================

// The registry: the authored locales and the default.
import { AUTHORED_CONTENT_LOCALES, DEFAULT_LOCALE } from "./locales";

/** Second segments under /learn/ that are index pages generated in every live locale, not articles. A Learn article
 *  can never take one of these slugs: Next.js would route it to the index page. Exported for the layout's script. */
export const LEARN_INDEX_SEGMENTS: readonly string[] = ["series"];
/** Second segments under /glossary/ that are index pages generated in every live locale, not entries (same reason). */
export const GLOSSARY_INDEX_SEGMENTS: readonly string[] = ["domain", "kind"];
/** The same two lists as sets, for the predicate. */
const LEARN_INDEXES: ReadonlySet<string> = new Set(LEARN_INDEX_SEGMENTS);
const GLOSSARY_INDEXES: ReadonlySet<string> = new Set(GLOSSARY_INDEX_SEGMENTS);

/**
 * Is this path, written WITHOUT a locale, an article or entry route that exists only in the authored locales?
 *
 * @param path the path after the locale, e.g. "/learn/tftp", "/learn/tftp/", "/glossary/arp", "/learn/tftp.md";
 *             a query string or fragment is ignored
 * @returns true for /learn/<slug> and /glossary/<slug> (and their .md twins), false for everything else
 */
export function isAuthoredOnlyRoute(path: string): boolean {
  // The path alone, without query or fragment.
  const pathOnly = path.split(/[?#]/)[0];
  // Its non-empty segments.
  const segs = pathOnly.split("/").filter(Boolean);
  // Exactly two: the family and the slug. Deeper paths are not routes of either family.
  if (segs.length !== 2) return false;
  // The two parts.
  const [family, slug] = segs;
  // An article, unless it names a Learn index page.
  if (family === "learn") return !LEARN_INDEXES.has(slug);
  // An entry, unless it names a glossary index page.
  if (family === "glossary") return !GLOSSARY_INDEXES.has(slug);
  // Anything else is generated in every live locale.
  return false;
}

/**
 * Does this locale carry the authored content (the Learn articles and the glossary entries)?
 *
 * @param locale a locale code
 * @returns true for en and pt-BR
 */
export function carriesAuthoredContent(locale: string): boolean {
  // Membership in the registry's list.
  return (AUTHORED_CONTENT_LOCALES as readonly string[]).includes(locale);
}

/**
 * The locale a link from a page in `locale` to `path` should carry: the page's own, or the default locale when the
 * target is an article or entry the page's locale does not have.
 *
 * @param locale the locale of the page the link is on
 * @param path the target path WITHOUT a locale
 * @returns the locale segment to put in front of the path
 */
export function linkLocaleFor(locale: string, path: string): string {
  // The default locale for an authored-only route in a locale without the authored content; the page's own otherwise.
  return !carriesAuthoredContent(locale) && isAuthoredOnlyRoute(path) ? DEFAULT_LOCALE : locale;
}
