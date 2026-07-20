// ============================================================================
// src/config/redEducation.ts
// ----------------------------------------------------------------------------
// RED EDUCATION LINKS + LEAD ATTRIBUTION (single source).
//
// Red Education is the authorized training center these courses route to, and
// every outbound link to them must do two things:
//
//   1) Carry a LEAD-ATTRIBUTION parameter that says where on ronutz.com the
//      click came from. We use UTM query parameters (utm_source / utm_medium /
//      utm_campaign / utm_content). Crucially, these live on the URL's QUERY
//      STRING: any web server that does not consume them simply ignores them.
//      An unrecognized query parameter never changes routing and never causes a
//      4xx — so this is safe to send even if Red Education's site has no idea
//      what it is. (This is also the convention every analytics suite reads.)
//
//   2) Transmit the HTTP REFERER header so Red Education sees ronutz.com as the
//      source. The site's global Referrer-Policy is
//      `strict-origin-when-cross-origin`, so a cross-origin navigation already
//      sends the ronutz.com ORIGIN as the Referer — UNLESS the link carries
//      rel="noreferrer", which suppresses it. Therefore Red Education links must
//      use rel="noopener" WITHOUT "noreferrer". Use `externalRel(url)` below so
//      any link whose URL points to Red Education keeps the referrer, while all
//      other external links keep the stricter "noopener noreferrer".
//
// Keeping this in one place means a future change to the attribution scheme (or
// to which host counts as Red Education) is a single edit.
// ============================================================================

/** The canonical Red Education base URL (no attribution). */
export const RED_EDUCATION_BASE = "https://www.rededucation.com/";

/** Host suffix treated as "Red Education" for attribution + referrer handling. */
const RED_EDUCATION_HOST = "rededucation.com";

/**
 * Build a Red Education URL carrying lead-source attribution.
 *
 * @param placement where on ronutz.com the link lives (becomes `utm_campaign`),
 *                  e.g. "footer", "training-cta", "contact".
 * @param detail    optional finer detail (becomes `utm_content`), e.g. a course
 *                  or platform slug.
 *
 * The parameters are appended to the query string and are safely ignored by any
 * server that does not expect them (never a 4xx).
 */
export function redEducationUrl(placement: string, detail?: string): string {
  const u = new URL(RED_EDUCATION_BASE);
  u.searchParams.set("utm_source", "ronutz.com");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", placement);
  if (detail) u.searchParams.set("utm_content", detail);
  return u.toString();
}

/** True if a URL points to Red Education (so its link should send the referrer). */
export function isRedEducationUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === RED_EDUCATION_HOST || h.endsWith("." + RED_EDUCATION_HOST);
  } catch {
    return false;
  }
}

/**
 * Attach lead-source attribution to an EXISTING URL when (and only when) it
 * points to Red Education. Unlike redEducationUrl(), which builds a link to the
 * site root, this preserves the URL's full path and query (deep links to a
 * vendor page, a case study, a course), and simply sets the UTM parameters on
 * top. Non-Red-Education URLs pass through untouched, so it is safe to apply
 * uniformly at any render site that mixes Red Education links with other
 * external links.
 *
 * Ratified direction (D-07, PRIME 20/07/2026): every link pointing to Red
 * Education carries referral attribution — the traffic and the leads must be
 * visible as ronutz.com's contribution in Red Education's own analytics.
 *
 * @param url       the link as authored in content/data (any host).
 * @param placement where on ronutz.com the link lives (becomes `utm_campaign`).
 * @param detail    optional finer detail (becomes `utm_content`), e.g. a slug.
 */
export function attributeRedEducationUrl(url: string, placement: string, detail?: string): string {
  if (!isRedEducationUrl(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "ronutz.com");
    u.searchParams.set("utm_medium", "referral");
    u.searchParams.set("utm_campaign", placement);
    if (detail) u.searchParams.set("utm_content", detail);
    return u.toString();
  } catch {
    // A malformed URL is left exactly as authored — attribution is best-effort
    // and must never break a link.
    return url;
  }
}

/**
 * The `rel` value for an external link. Red Education links keep the referrer
 * (rel="noopener" only); every other external link also blocks it
 * (rel="noopener noreferrer"). Pairs with target="_blank".
 */
export function externalRel(url: string): string {
  return isRedEducationUrl(url) ? "noopener" : "noopener noreferrer";
}
