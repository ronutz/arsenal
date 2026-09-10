// ============================================================================
// src/content/learn/stories.ts
// ----------------------------------------------------------------------------
// THE STITCHERS: which Learn articles exist to connect other articles.
//
// WHAT THIS IS: a registry of the articles whose job is not to explain one
// thing but to put many things in an order that argues something. They are
// ordinary Learn articles - same route, same template - and this file is the
// only place that knows they belong to a set, so that /stories can present them
// as one and neither the page nor this list has to restate their titles.
//
// WHY IT IS A LIST AND NOT A QUERY: a frontmatter tag would be the obvious
// mechanism and it is the wrong one. "index" already appears as a CONCEPT on
// an article about database index locality, which has nothing to do with this,
// so a query would have to special-case its way out of a false positive on day
// one. More importantly, membership here is an editorial judgement - an article
// with fifteen outbound links is not automatically a stitcher, and an article
// with five may be - and editorial judgements belong in a file somebody signed
// rather than in a pattern match.
//
// The TITLES AND SUMMARIES ARE NOT HERE ON PURPOSE. The page reads them from
// each article's own frontmatter at build time, so this registry cannot drift
// out of agreement with the articles it points at. Only the slug, the grouping
// and the one line of context that is genuinely about the SET rather than about
// the article live here.
//
// The guard scripts/check-stories.mjs enforces that every slug resolves in both
// locales and that nothing is listed twice.
// ============================================================================

/** A themed group of stitchers, presented together on /stories. */
export interface StoryGroup {
  /** Stable key; the i18n namespace `stories` carries its heading and lede. */
  key: string;
  /** Learn slugs, in reading order. */
  slugs: string[];
}

export const STORY_GROUPS: StoryGroup[] = [
  {
    // The failure canon and the practices it argues for. These two are a pair:
    // one collects the cases, the other is what a reader should do about them,
    // and reading either without the other gets half the argument.
    key: "failure",
    slugs: ["how-systems-fail", "decided-in-advance", "the-disclosure-record"],
  },
  {
    // Vendor sequences: a single request, service or answer followed end to end
    // through articles that were each written to stand alone.
    key: "endToEnd",
    slugs: [
      "f5-distributed-cloud-one-request-end-to-end",
      "extreme-fabric-connect-one-service-edge-to-edge",
      "reading-a-dns-answer",
      "the-formats-in-between",
    ],
  },
  {
    // Where the industry and the country are the subject rather than the
    // technology.
    key: "people",
    slugs: ["the-industry-from-inside", "the-brazil-thread"],
  },
];

/** Every stitcher slug, flattened, in group order. */
export const STORY_SLUGS: string[] = STORY_GROUPS.flatMap((g) => g.slugs);
