// ============================================================================
// src/content/vendors/profile-types.ts
// ----------------------------------------------------------------------------
// RICH VENDOR PROFILE - the shared shape behind the full-depth vendor pages:
// founding stories, founders, a converged corporate timeline, flagship
// products, key innovations, markets, and analyst standing. One profile may
// cover several companies that converged into one (e.g. HP + 3Com + Aruba +
// Juniper), so foundings and timeline events carry their own company labels.
//
// Every fact in a profile must be verified against primary sources before it
// ships (SEC filings, company releases, reputable press); discrepancies are
// preserved in sourceNote fields rather than silently resolved. This is the
// homage format: the pioneers of networking, telecom, and cybersecurity,
// recorded accurately.
// ============================================================================

export interface FoundingStory {
  /** The company being founded (one profile can hold several). */
  company: string;
  year: number;
  place: string;
  /** Founder names, rendered as a compact list. */
  founders: string[];
  /** The founding story paragraph. */
  story: string;
}

export interface TimelineEvent {
  year: number;
  /** Marks an event describing Rodolfo's own direct involvement with this
   *  vendor (employment, distribution, or teaching) - rendered with an accent
   *  and a localized "Rodolfo's chapter" chip (PRIME directive 2026-07-16:
   *  every vendor in the career history carries this marker in its timeline). */
  personal?: boolean;
  /** Short headline, e.g. "Juniper ships the M40 and Junos". */
  title: string;
  /** One- or two-sentence detail. */
  detail: string;
  /** Optional figure/date nuance kept honest. */
  sourceNote?: string;
}

export interface ProfileProduct {
  name: string;
  what: string;
}

export interface ProfileInnovation {
  title: string;
  detail: string;
}

export interface VendorProfile {
  /** Matches the PartnerVendor slug that hosts this profile. */
  slug: string;
  foundings: FoundingStory[];
  /** Converged corporate timeline (rendered newest-first). */
  timeline: TimelineEvent[];
  products: ProfileProduct[];
  innovations: ProfileInnovation[];
  /** Markets paragraph(s). */
  markets: string[];
  /** Verified analyst-standing statements (historical + current). */
  analyst: string[];
  /** Optional cross-link to a career page on this site. */
  careerLink?: { href: string; label: string };
}
