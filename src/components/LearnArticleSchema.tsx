// ============================================================================
// src/components/LearnArticleSchema.tsx
// ----------------------------------------------------------------------------
// schema.org/TechArticle for the 670 Learn articles.
//
// WHY (PRIME, 2026-09-15). The blog's eleven posts already declared authorship
// pointing at the Person @id carried by /about. The 670 Learn articles - a
// corpus sixty times larger, and the one that actually demonstrates the
// expertise - declared nothing at all.
//
// That is the asymmetry this fixes. Google's quality framework rewards
// demonstrable author expertise, and the evidence here is unusually good: a
// thirty-year practitioner, verifiable credentials, named employers. Attaching
// `author` to the largest body of technical writing on the site is how that
// evidence reaches the machine reading it.
//
// TechArticle rather than Article: these are technical explanations, and
// TechArticle is the vocabulary's own word for that. It is a fit, not a stretch
// - which is the test that kept the tools corpus OUT of this work, since
// SoftwareApplication implies something installable and HowTo implies steps.
//
// ---------------------------------------------------------------------------
// WHAT IS DELIBERATELY NOT CLAIMED
//
//   * No `datePublished`. The frontmatter carries `updated` and nothing else.
//     Emitting the update date as a publication date would be inventing a fact
//     about when something first appeared - and this repository has spent a
//     session learning what a confidently wrong date costs.
//
//   * No `proficiencyLevel`. TechArticle offers it, the articles do not record
//     it, and guessing "Beginner" across 670 pieces would be a judgement
//     asserted as metadata.
//
//   * No `wordCount`, no `articleBody`. Both are re-derivable from the page
//     itself and neither tells a crawler anything the page does not.
// ============================================================================

import { PERSON_ID } from "@/components/PersonSchema";

const ORIGIN = "https://ronutz.com";

export default function LearnArticleSchema({
  locale,
  slug,
  title,
  summary,
  updated,
}: {
  locale: string;
  slug: string;
  title: string;
  summary: string;
  /** ISO date from frontmatter. Every one of the 670 articles carries one. */
  updated?: string;
}) {
  const url = `${ORIGIN}/${locale}/learn/${slug}/`;
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": url,
          headline: title,
          description: summary,
          url,
          mainEntityOfPage: url,
          inLanguage: locale,
          ...(updated ? { dateModified: updated } : {}),
          // A REFERENCE, not a second copy of the Person. One entity, one place
          // to correct, and a crawler reconciles them.
          author: { "@id": PERSON_ID },
          publisher: { "@id": PERSON_ID },
        }),
      }}
    />
  );
}
