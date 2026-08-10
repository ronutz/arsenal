// ============================================================================
// src/content/sources/source-types.ts
// ----------------------------------------------------------------------------
// REFERENCE WORKS - a sibling schema to the vendor corpus, ratified by PRIME on
// 2026-08-10 for `/industry/sources/`.
//
// WHY A SEPARATE SHAPE AT ALL. The industry corpus is organisation-shaped:
// `PartnerVendor` carries `founded`, `ended` and `group`, because it describes
// companies. A scholarly work has none of those. It has authors, a period of
// research, a publisher and a holding institution - and forcing it through the
// vendor schema would mean writing a `founded` year for a book and a `group` for
// a person. The distortion would be small and it would be a lie in the data.
//
// So: a small sibling, deliberately smaller than the vendor type. It carries
// only what a work actually has, and it will stay small unless a second work
// arrives that genuinely needs more.
//
// WHY THIS EXISTS AT ALL (Wave 0, PRIME 2026-08-08):
//   "A site about to cite a scholar's life work across forty-odd entries should
//    first say what that work is and who made it."
//
// EVERY FACT IN A SOURCE ENTRY IS VERIFIED BEFORE IT SHIPS. For this first
// entry the verification is recorded as a table in
// concord/canon/current/PELKEY-enrichment-plan.md, checked 2026-08-10 against
// the Computer History Museum catalogue record and Open Library.
// ============================================================================

/** A person who made the work. Not a company: works have authors. */
export interface WorkAuthor {
  name: string;
  /** What they did on this work, in a few words. */
  role: string;
}

/** One titled section of the entry body. */
export interface WorkSection {
  heading: string;
  /** Paragraphs. Rendered in order; no markup, so translation stays simple. */
  body: string[];
}

/** A citation supporting the entry. Same shape the vendor corpus uses. */
export interface WorkCitation {
  label: string;
  url: string;
}

export interface SourceWork {
  /** URL segment under /industry/sources/. */
  slug: string;
  /** The work's own title. */
  title: string;
  /** One line under the title: what kind of thing this is. */
  kind: string;
  /** The people who made it. */
  authors: WorkAuthor[];
  /** The period the work covers or was made in, as prose ("1988-1994"). */
  period: string;
  /** The work itself, where it can be read. */
  url?: string;
  /** Two or three sentences: what it is and why it is here. */
  summary: string;
  /** The body. */
  sections: WorkSection[];
  /**
   * Where the facts above come from. REQUIRED and non-empty: an entry whose
   * whole purpose is attribution has no business being unsourced.
   */
  citations: WorkCitation[];
}
