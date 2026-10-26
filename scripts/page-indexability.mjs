// ============================================================================
// scripts/page-indexability.mjs
// ----------------------------------------------------------------------------
// WHETHER A BUILT PAGE ASKS NOT TO BE INDEXED, read from the page itself.
//
// Added 2026-10-25 (Round 1, ARC-04). The XML sitemap is generated from the
// built HTML tree, so it listed every route that EXISTS, including routes that
// deliberately carry <meta name="robots" content="noindex">: the author
// Console (/en/admin1029384756/), the Copy editor (/en/copy8825140637/) and
// /support ("noindex-until-threshold"). Submitting a URL to a search engine and
// telling it not to index that URL are contradictory instructions.
//
// The page's own robots metadata is the single source of the intent: each
// route sets it in its generateMetadata/metadata export, Next.js renders it
// into <head>, and this helper reads it back. No second route registry exists
// to drift from it, and noindex is never inferred from a slug or a path.
//
// Shared by scripts/gen-machine-legible.mts (which filters the sitemap) and
// scripts/check-sitemap.mjs (which asserts the filter held), so the two read
// the directive the same way.
// ============================================================================

import fs from "node:fs";

/** How many bytes are read per step while looking for the end of <head>. */
const CHUNK = 64 * 1024;

/**
 * Read a built HTML file only as far as its closing </head>.
 *
 * Next.js renders route metadata into <head>, and a page can run to hundreds
 * of kilobytes after it, so reading whole files for 20,000+ routes would cost
 * gigabytes of I/O for a few hundred bytes of answer. If no </head> is found,
 * the whole file has been read, so nothing is missed.
 *
 * @param {string} file absolute or cwd-relative path to an index.html
 * @returns {string} the document up to and including </head> (or all of it)
 */
export function readHead(file) {
  // Open once and read forward in chunks.
  const fd = fs.openSync(file, "r");
  // The text read so far.
  let text = "";
  // Reusable buffer for each chunk.
  const buf = Buffer.alloc(CHUNK);
  try {
    // Keep reading until </head> appears or the file ends.
    for (;;) {
      // Read the next chunk from the current file position.
      const n = fs.readSync(fd, buf, 0, CHUNK, null);
      // End of file: what has been read is the whole document.
      if (n === 0) break;
      // Append the chunk (UTF-8; a split multibyte character only affects
      // text far from the ASCII tag being searched for).
      text += buf.toString("utf8", 0, n);
      // Stop as soon as the head is complete.
      const end = text.indexOf("</head>");
      if (end !== -1) return text.slice(0, end + "</head>".length);
    }
  } finally {
    // Always release the descriptor.
    fs.closeSync(fd);
  }
  // No </head>: return everything that was read.
  return text;
}

/**
 * True when the HTML carries a robots meta directive that forbids indexing.
 *
 * Accepts either attribute order (name before content or after it), any
 * quoting, any case, and the directives "noindex" and "none" (which means
 * noindex, nofollow). Only <meta name="robots"> counts: a crawler-specific tag
 * such as googlebot is not a site-wide intent and is not read here.
 *
 * @param {string} html the page source (a head excerpt is enough)
 * @returns {boolean}
 */
export function htmlIsNoindex(html) {
  // Every <meta ...> tag in the excerpt.
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  // Look for one that is a robots tag with a noindex-equivalent directive.
  return metas.some((tag) => {
    // The name attribute, double, single or unquoted.
    const name = /\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    // The first non-empty capture is the value.
    const nameValue = (name?.[1] ?? name?.[2] ?? name?.[3] ?? "").trim().toLowerCase();
    // Only the generic robots tag carries the page's own intent.
    if (nameValue !== "robots") return false;
    // The content attribute, same quoting rules.
    const content = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    // The directive list, normalised.
    const value = (content?.[1] ?? content?.[2] ?? content?.[3] ?? "").toLowerCase();
    // Split on commas and spaces into single directives.
    const directives = value.split(/[\s,]+/).filter(Boolean);
    // noindex, or none (= noindex + nofollow), forbids indexing.
    return directives.includes("noindex") || directives.includes("none");
  });
}

/**
 * True when the built page at this path asks not to be indexed.
 *
 * @param {string} file path to the page's index.html
 * @returns {boolean} false when the file does not exist (nothing to index)
 */
export function pageIsNoindex(file) {
  // A missing page is simply not a page; callers check existence separately.
  if (!fs.existsSync(file)) return false;
  // Read the head and test its robots directive.
  return htmlIsNoindex(readHead(file));
}
