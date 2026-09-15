// ============================================================================
// src/components/GlossarySchema.tsx
// ----------------------------------------------------------------------------
// schema.org/DefinedTerm for the glossary.
//
// WHY (PRIME, 2026-09-14). Before this, 34 of 3,404 English pages carried any
// structured data at all, and the 1,703 glossary entries carried none - the
// largest body of machine-readable meaning on the site, invisible to machines.
//
// DefinedTerm is an unusually exact fit rather than a stretch. Every field it
// wants already exists here: a headword, a definition, a set to belong to, a
// stable code, and - since the domain and kind pages of the same day - a real
// URL for the category a term sits in.
//
// ---------------------------------------------------------------------------
// TWO DELIBERATE OMISSIONS
//
// 1. The SET does not list its terms. `DefinedTermSet.hasDefinedTerm` would
//    mean serialising 1,703 entries into the index page, which is the
//    three-megabyte problem again for no gain: each term already points UP at
//    the set through `inDefinedTermSet`, and that is the direction schema.org
//    recommends for large sets precisely because it does not require the set to
//    enumerate itself.
//
// 2. No `disputed` or `apocryphal` flag is emitted, even though the glossary
//    tracks it. There is no vocabulary for "this is commonly mistold" in
//    DefinedTerm, and inventing one would be asserting something machines would
//    read as a claim about the term rather than about its reception. The page
//    says it in prose where a reader can see the nuance.
// ============================================================================

const ORIGIN = "https://ronutz.com";

/** The canonical @id for the glossary as a whole, referenced by every term. */
export const GLOSSARY_SET_ID = `${ORIGIN}/#glossary`;

/**
 * The set itself, emitted once on the glossary index.
 *
 * `hasDefinedTerm` is deliberately absent - see the header.
 */
export function DefinedTermSetSchema({
  locale,
  name,
  description,
}: {
  locale: string;
  name: string;
  description: string;
}) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTermSet",
          "@id": GLOSSARY_SET_ID,
          name,
          description,
          url: `${ORIGIN}/${locale}/glossary/`,
          inLanguage: locale,
        }),
      }}
    />
  );
}

/**
 * One term.
 *
 * `termCode` is the slug: a stable identifier that survives the headword being
 * re-worded or translated, which is what termCode is for.
 *
 * `alternateName` carries the expansion and any aliases - the acronym's long
 * form is genuinely another name for the same thing, and the aliases are the
 * spellings a reader might arrive with.
 */
export function DefinedTermSchema({
  locale,
  slug,
  headword,
  definition,
  expansion,
  aliases,
}: {
  locale: string;
  slug: string;
  headword: string;
  definition: string;
  expansion?: string;
  aliases?: readonly string[];
}) {
  const url = `${ORIGIN}/${locale}/glossary/${slug}/`;
  const alternates = [expansion, ...(aliases ?? [])].filter(
    (a): a is string => Boolean(a && a.trim())
  );

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          "@id": url,
          name: headword,
          termCode: slug,
          description: definition,
          url,
          inLanguage: locale,
          inDefinedTermSet: { "@id": GLOSSARY_SET_ID },
          ...(alternates.length > 0 ? { alternateName: alternates } : {}),
        }),
      }}
    />
  );
}
