// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/links.ts
// ----------------------------------------------------------------------------
// WHICH LINKS LEAVE THE SITE (PRIME 2026-10-27: every link to an external
// resource opens in a new tab). One test, shared by the rehype plugin that
// marks authored Markdown/MDX links (src/lib/rehypeExternalLinks.ts), the
// components that write their own <a> elements, and the postbuild guard that reads the exported HTML (scripts/check-external-links-new-tab.mjs
// keeps its own copy of the same rule, since it runs as plain Node).
// ============================================================================

/** This site's own hosts: a link to them is not external. */
export const SITE_HOSTS: readonly string[] = ["ronutz.com", "www.ronutz.com"];

/** Is this href an absolute http(s) or protocol-relative URL on another host? */
export function isExternalHref(href: string): boolean {
  // Absolute http(s) or protocol-relative; everything else (root-relative, #fragment, mailto:, tel:) stays on the page or the device.
  if (!/^(https?:)?\/\//i.test(href)) return false;
  // Parse with a base so "//host/path" works; an unparseable href is not treated as external.
  try {
    // The host, lower-cased by the URL parser.
    const host = new URL(href, "https://ronutz.com").hostname;
    // External unless it is one of this site's hosts.
    return !SITE_HOSTS.includes(host);
  } catch {
    // Not a URL at all.
    return false;
  }
}

/**
 * The rel an external link carries: the site's existing rule (src/config/redEducation.ts externalRel), "noopener
 * noreferrer" for every site except the partner's, whose links keep the referrer (they are attributed at render
 * time) and so carry "noopener" alone.
 */
export { externalRel } from "@/config/redEducation";
