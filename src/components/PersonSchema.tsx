// ============================================================================
// src/components/PersonSchema.tsx
// ----------------------------------------------------------------------------
// schema.org/Person as JSON-LD, plus BlogPosting authorship.
//
// WHY (PRIME, 2026-09-11). Before this, 2 of 3,383 English pages carried any
// structured data at all. The site's strongest asset for search is that its
// author is a thirty-year practitioner whose credentials are verifiable by
// third parties - and none of that was machine-readable. Google's quality
// framework rewards demonstrable author expertise; this is how a machine is
// told who wrote the thing and why that matters.
//
// It is NOT a ranking trick. Every claim here is one the site already makes in
// prose and can back: the name, the role, the employer, and profile pages that
// third parties control.
//
// WHERE IT GOES: /about and its descendants (the entity's own pages), and each
// blog post (which needs an author). Deliberately NOT on every page - scattering
// the same Person across 3,383 pages dilutes rather than strengthens, and gives
// a crawler no hint about which page IS the entity.
//
// sameAs READS THE CONTACT CONFIG. One list, two consumers: the contact page
// renders those links for humans and this emits them for machines. A profile
// added in one place appears in both, and they cannot drift apart.
// ============================================================================

import { contactChannels } from "@/config/contact";

/** The canonical @id for the Person, referenced by BlogPosting.author. */
export const PERSON_ID = "https://ronutz.com/#rodolfo";

/**
 * External IDENTITY pages, for sameAs.
 *
 * Only channels that are a profile OF the person. `training` points at a course
 * catalogue - a useful link for a reader, not an identity - so it is excluded
 * by this list rather than by guesswork about URL shape.
 */
const IDENTITY_CHANNELS = new Set([
  "linkedin",
  "youtube",
  "instagram",
  "credly",
  "redEducationProfile",
]);

function sameAs(): string[] {
  return contactChannels()
    .filter((c) => IDENTITY_CHANNELS.has(c.id))
    .map((c) => c.url);
}

function person() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Rodolfo Nützmann",
    url: "https://ronutz.com/en/about/",
    jobTitle: "Technical Instructor",
    worksFor: { "@type": "Organization", name: "Red Education" },
    knowsAbout: [
      "Computer networking",
      "Network security",
      "Application delivery",
      "Identity and access management",
    ],
    sameAs: sameAs(),
  };
}

/** JSON-LD for the entity's own pages: /about and everything beneath it. */
export function PersonSchema() {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", ...person() }),
      }}
    />
  );
}

/**
 * JSON-LD for one blog post. The author is a REFERENCE to the Person by @id
 * rather than a second copy of it: a crawler reconciles them into one entity,
 * and there is exactly one place to correct if a detail changes.
 */
export function BlogPostingSchema({
  title,
  description,
  slug,
  locale,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  slug: string;
  locale: string;
  datePublished: string;
  dateModified?: string;
}) {
  const url = `https://ronutz.com/${locale}/blog/${slug}/`;
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          url,
          mainEntityOfPage: url,
          inLanguage: locale,
          datePublished,
          dateModified: dateModified ?? datePublished,
          author: { "@id": PERSON_ID },
          publisher: { "@id": PERSON_ID },
        }),
      }}
    />
  );
}
