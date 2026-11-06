// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/GameOrigins.tsx
// ----------------------------------------------------------------------------
// WHERE A GAME COMES FROM (PRIME 06/11/2026 13:01: "For the games and puzzles,
// cite inspirations, roots and origins, folklore if any, other famous
// implementations, etc."). A section at the foot of each game's page: a few
// paragraphs (devFun.games.<game>.origins, en and pt-BR), the sources they
// rest on, each with the day it was read, and the glossary entries on this
// site that tell more. The shell's "Where it comes from" link, beside "How to
// play", jumps here, so the board stays at the top of the page on a phone.
//
// A server component: the text and the links are in the static page and add
// nothing to the game's script. The sources live in src/content/fun/origins.ts
// (titles, publishers and addresses are not translated); a game without an
// entry there renders nothing.
// ============================================================================

// Server-side strings.
import { getTranslations } from "next-intl/server";
// The sources and the glossary entries of each game.
import { GAME_ORIGINS } from "@/content/fun/origins";
// A glossary entry's headword.
import { getGlossaryEntry } from "@/content/glossary/glossary";
// The language a glossary link goes to from a language without entries.
import { linkLocaleFor } from "@/i18n/corpus-routing";

/**
 * The day a source was read, in the page's language ("6 November 2026", "6 de novembro de 2026").
 *
 * @param iso the day, YYYY-MM-DD
 * @param locale the page's language
 * @returns the day in words
 */
function readOn(iso: string, locale: string): string {
  // Noon UTC, so no time zone moves the day.
  const d = new Date(`${iso}T12:00:00Z`);
  // In words, in the page's language (British English for "en", as the rest of the site writes it).
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

/**
 * The section.
 *
 * @param props the game's id and the page's language
 * @returns the section, or nothing for a game with no entry
 */
export default async function GameOrigins({ gameId, locale }: { gameId: string; locale: string }) {
  // The game's sources and glossary entries.
  const entry = GAME_ORIGINS[gameId];
  // None: nothing to show.
  if (!entry) return null;
  // The games' strings, for this game's paragraphs.
  const t = await getTranslations({ locale, namespace: "devFun.games" });
  // The shell's strings, for the headings.
  const tc = await getTranslations({ locale, namespace: "devFun.games.common" });
  // The paragraphs, in the order written (an object of p1, p2 and so on).
  const raw = t.raw(`${gameId}.origins`) as Record<string, string> | string | undefined;
  // Only strings count; a missing key gives nothing.
  const paragraphs = raw && typeof raw === "object" ? Object.values(raw).filter((p): p is string => typeof p === "string") : [];
  // The glossary entries that exist.
  const entries = entry.glossary.map((slug) => ({ slug, headword: getGlossaryEntry(slug)?.headword })).filter((e): e is { slug: string; headword: string } => typeof e.headword === "string");
  // The section.
  return (
    <section id="fg-origins" className="fg-origins" aria-labelledby="fg-origins-title">
      <h2 id="fg-origins-title" className="fg-origins-title">
        {tc("originsTitle")}
      </h2>
      {/* The story. */}
      {paragraphs.map((p, i) => (
        <p key={i} className="fg-origins-text">
          {p}
        </p>
      ))}
      {/* More on this site. */}
      {entries.length > 0 && (
        <>
          <h3 className="fg-origins-sub">{tc("originsOnSite")}</h3>
          <ul className="fg-origins-entries">
            {entries.map((e) => (
              <li key={e.slug}>
                <a href={`/${linkLocaleFor(locale, `/glossary/${e.slug}`)}/glossary/${e.slug}`}>{e.headword}</a>
              </li>
            ))}
          </ul>
        </>
      )}
      {/* The sources, each with the day it was read. */}
      <h3 className="fg-origins-sub">{tc("originsSources")}</h3>
      <ol className="fg-origins-sources">
        {entry.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
            {`, ${s.publisher} `}
            <span className="fg-muted">({tc("originsRead", { date: readOn(s.accessed, locale) })})</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
