// ============================================================================
// src/components/GlossaryTerm.tsx
// ----------------------------------------------------------------------------
// GLOSSARY TERM — the server wrapper injected into Learn MDX.
//
// The rehype plugin (rehypeGlossaryHints) wraps the first prose occurrence of an
// eligible glossary surface in <GlossaryTerm slug="...">matched words</...>.
// This component resolves that slug's short prose (headword + def + context) and
// the localized glossary href SERVER-side, then hands only those few strings to
// the <GlossaryHint> client island.
//
// WHY server-side resolution: the glossary def/context for all ~814 entries is a
// large i18n namespace. Reading each term's own three strings here means a
// marked word ships only its own definition to the client, never the whole
// glossary — preserving the site's small-RSC-payload discipline.
//
// GRACEFUL FALLBACK: if a slug somehow has no authored prose, we render the
// matched text plainly. The affordance is an enhancement; it must never break
// the sentence.
// ============================================================================

import { getLocale, getTranslations } from "next-intl/server";
import { getGlossaryEntry } from "@/content/glossary/glossary";
import GlossaryHint from "@/components/GlossaryHint";

export default async function GlossaryTerm({
  slug,
  children,
}: {
  slug: string;
  children: string;
}) {
  const entry = getGlossaryEntry(slug);
  // No such entry (should not happen — surfaces derive from the registry), or
  // the matched text is empty: render plainly.
  if (!entry || !children) return <>{children}</>;

  const locale = await getLocale();
  const t = await getTranslations("glossary");

  // def/context are authored en + native pt-BR, English fallback elsewhere. If a
  // key is missing for any reason, next-intl returns the key string; guard by
  // checking it does not look like the raw path.
  const def = t(`entries.${slug}.def`);
  const context = t(`entries.${slug}.context`);
  const looksMissing = def.startsWith(`entries.${slug}`) || context.startsWith(`entries.${slug}`);
  if (looksMissing) return <>{children}</>;

  return (
    <GlossaryHint
      headword={entry.headword}
      def={def}
      context={context}
      href={`/${locale}/glossary/${slug}`}
      expandLabel={t("hintExpand")}
    >
      {children}
    </GlossaryHint>
  );
}
