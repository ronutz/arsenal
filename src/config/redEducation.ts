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

// ----------------------------------------------------------------------------
// PLACEMENT-LEVEL ATTRIBUTION SCHEMA (standing rule, PRIME 2026-07-22).
// Every outbound Red Education link carries five analytics-standard UTM
// parameters answering, for every single click: which vendor value stream,
// which page, which CTA, and which language produced it.
//
//   utm_source   = ronutz.com                          (constant)
//   utm_medium   = referral                            (constant)
//   utm_campaign = vendor/program key                  (f5, netskope, ..., or "site")
//   utm_content  = pageType or pageType/pageSlug       (the exact page)
//   utm_term     = locale.cta                          (language + placement)
//
// The rule applies to the ENTIRE site - past, present, and future: no static,
// context-free Red Education URL may be baked at module scope; attribution is
// applied at render time, where the page/vendor/locale/CTA context lives.
// ----------------------------------------------------------------------------

/** The render-time context every Red Education link must carry. */
export interface RedEduAttribution {
  /** Vendor or program key (f5, extreme, fortinet, netskope, ping, zscaler); omit for site-level placements. */
  vendor?: string;
  /** Page type: "course", "platform", "learn", "tool", "vendor-partner", "red-education", "contact", ... */
  pageType: string;
  /** The page's own slug; omitted for singleton pages. */
  pageSlug?: string;
  /** The rendering locale (en, pt-BR, ...). */
  locale: string;
  /** The specific call-to-action on that page ("request-training", "main-cta", "source-link", ...). */
  cta: string;
}

/** UTM values must survive analytics pipelines: lowercase, dot/dash/slash-safe. */
function utmSafe(v: string): string {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._/-]/g, "");
}

/** Apply the five-parameter schema to a URL object. */
function applyAttribution(u: URL, a: RedEduAttribution): void {
  u.searchParams.set("utm_source", "ronutz.com");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", utmSafe(a.vendor ?? "site"));
  u.searchParams.set("utm_content", utmSafe(a.pageSlug ? `${a.pageType}/${a.pageSlug}` : a.pageType));
  u.searchParams.set("utm_term", utmSafe(`${a.locale}.${a.cta}`));
}

/**
 * VENDOR LANDING PAGES ON RED EDUCATION.
 *
 * *** WHY THIS EXISTS (PRIME + SCOUT, 2026-08-16) ***
 *
 * Every attributed link this site emitted landed on the Red Education HOME
 * page, however specific the page it left from. A reader on a BIG-IP course
 * page, having read a thousand words about that exact course, arrived at a
 * site root and had to find it again. The attribution was precise and the
 * DESTINATION was not: the analysis called it 5/10 external destination
 * targeting against 9.5/10 contextual link quality, and that gap is this map.
 *
 * EVERY URL HERE WAS VERIFIED AS A LIVE, TITLED PAGE BEFORE BEING WRITTEN
 * DOWN. Constructing a plausible-looking vendor path would be the fabricated
 * citation this canon refuses; a guessed deep link is worse than a root link,
 * because a root link always works.
 *
 * Extreme Networks is DELIBERATELY ABSENT: no landing page for it has been
 * verified, so its links continue to the root until one is. An entry here is a
 * claim that a page exists.
 */
export const RED_EDUCATION_VENDOR_PAGES: Readonly<Record<string, string>> = Object.freeze({
  // PRIME's authorized platforms, in the order the site lists them.
  f5: "https://www.rededucation.com/f5-networks/",
  fortinet: "https://www.rededucation.com/fortinet/",
  netskope: "https://www.rededucation.com/netskope-training/",
  extreme: "https://www.rededucation.com/extreme-networks/",
  ping: "https://www.rededucation.com/ping-identity/",
  zscaler: "https://www.rededucation.com/zscaler/",

  // The rest of the vendor navigation, so a link from any context lands on a
  // vendor page rather than on a homepage.
  "palo-alto": "https://www.rededucation.com/palo-alto-networks/",
  checkpoint: "https://www.rededucation.com/checkpoint/",
  cisco: "https://www.rededucation.com/cisco/",
  avaya: "https://www.rededucation.com/avaya/",
  cyberark: "https://www.rededucation.com/cyberark/",
  nutanix: "https://www.rededucation.com/nutanix/",
  paessler: "https://www.rededucation.com/paessler/",
  epi: "https://www.rededucation.com/epi/",
});

/**
 * Aliases, so a caller passes the vendor slug it already holds - from the tools
 * config, a vendor hub, a course record - without every call site having to
 * learn this map's spelling.
 */
const VENDOR_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  "extreme-networks": "extreme",
  "f5-networks": "f5",
  "ping-identity": "ping",
  forgerock: "ping",
  "palo-alto-networks": "palo-alto",
  paloalto: "palo-alto",
  "check-point": "checkpoint",
});

/**
 * THE ALL-VENDOR COURSE INDEX - Red Education's own "View All" target, and a
 * better landing place than the marketing homepage for any placement that names
 * no single vendor: a reader who arrived from a training page lands among
 * courses. PRIME's ruling, 2026-08-16.
 */
export const RED_EDUCATION_ALL_VENDORS = "https://www.rededucation.com/certifications/";

/**
 * The best verified destination for a placement: the vendor's own page where
 * one is known, the all-vendor course index otherwise. Never invents a path.
 */
export function redEducationDestination(vendor?: string): string {
  const raw = (vendor ?? "").toLowerCase().trim();
  const key = VENDOR_ALIASES[raw] ?? raw;
  return RED_EDUCATION_VENDOR_PAGES[key] ?? RED_EDUCATION_ALL_VENDORS;
}

/**
 * Build a Red Education URL (site root) carrying full placement-level
 * attribution. The parameters ride the query string and are safely ignored by
 * any server that does not expect them (never a 4xx).
 */
export function redEducationUrl(a: RedEduAttribution): string {
  // Deep-link to the vendor page when the placement names a vendor and that
  // page has been verified; otherwise the root, which always resolves.
  const u = new URL(redEducationDestination(a.vendor));
  applyAttribution(u, a);
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
 * @param url the link as authored in content/data (any host).
 * @param a   the render-time placement context (vendor, page, locale, CTA).
 */
export function attributeRedEducationUrl(url: string, a: RedEduAttribution): string {
  if (!isRedEducationUrl(url)) return url;
  try {
    const u = new URL(url);
    applyAttribution(u, a);
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
