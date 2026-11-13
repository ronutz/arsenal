// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/og-generic-allow.mjs - THE PAGES ALLOWED TO SHARE THE GENERIC CARD
// ----------------------------------------------------------------------------
// PRIME 12/11/2026: "The social sharing card (graphic) for the endorsements page
// is a generic one, instead of 'Endorsements' - Please fix that, and check that
// there are no other such cases." The check found 586 English pages with a title
// of their own that shipped /og/default.png; each now names a card of its own or
// of its section. From now on a page with its own title never ships the generic
// card unless it is listed here, with the reason it is deliberately generic.
//
// Read by two guards, so the list is written once:
//   - scripts/check-og.mjs (before the build): every src/app/[locale]/**/page.tsx
//     that sets its own metadata must name a card (ogImages or its own images),
//     never ogDefault, unless its route is listed here;
//   - scripts/check-og-references.mjs (after the build): every built page whose
//     og:image is /og/default.png must have its route listed here.
//
// Keys are routes without the language prefix and without a trailing slash
// ("/settings"); a "*" segment matches any one segment (a dynamic route's
// [param] in the source, any value in the build). MAY ONLY SHRINK: an entry
// that stops matching a page is reported as stale by both guards.
// ============================================================================

/** Route (no language, no trailing slash) -> why the page deliberately ships the generic card. */
export const GENERIC_CARD_ALLOW = new Map([
  // The private administration pages: unlisted, kept out of search, never shared as a link.
  ["/admin1029384756", "Private, unlisted administration page (not indexed); it is never shared as a link."],
  // Its intelligence view, the same.
  ["/admin1029384756/intelligence", "Private, unlisted administration page (not indexed); it is never shared as a link."],
  // The owner's private copy-editing page.
  ["/copy8825140637", "Private, unlisted copy-editing page for the site owner; it is never shared as a link."],
  // The visitor's own desk, kept in the browser.
  ["/desk", "The visitor's own desk, kept in this browser: a shared link opens the receiver's own desk, so no page-specific card applies."],
  // The visitor's own preferences, kept in the browser.
  ["/settings", "This browser's own preferences: nothing on the page is specific to share."],
]);

/**
 * Whether an allow-list key matches a route, segment by segment.
 *
 * @param {string} pattern an allow-list key, "*" matching any one segment
 * @param {string} route a route without language and trailing slash; a source
 *   route keeps its [param] segments, which only "*" matches
 * @returns {boolean} true when every segment matches
 */
export function routeMatches(pattern, route) {
  // Both as segment lists ("/a/b" -> ["a", "b"]).
  const p = pattern.split("/").filter(Boolean);
  // The route's segments.
  const r = route.split("/").filter(Boolean);
  // Different depths never match.
  if (p.length !== r.length) return false;
  // Each segment equal, or the pattern's "*".
  return p.every((seg, i) => seg === "*" || seg === r[i]);
}

/**
 * The allow-list key that covers a route, or null.
 *
 * @param {string} route a route without language and trailing slash
 * @returns {string | null} the matching key
 */
export function allowedGeneric(route) {
  // The first key that matches, or none.
  for (const key of GENERIC_CARD_ALLOW.keys()) if (routeMatches(key, route)) return key;
  // Not listed.
  return null;
}
