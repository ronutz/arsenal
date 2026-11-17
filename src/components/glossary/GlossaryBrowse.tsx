// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/glossary/GlossaryBrowse.tsx
// ----------------------------------------------------------------------------
// THE GLOSSARY'S SHARED BROWSING PARTS (PRIME 16/11/2026 04:27: split the glossary page and make its parts easy to move
// between). Server components, used by the hub, the letter pages, the domain pages and the kind pages, so the four
// kinds of page draw an entry, a letter and a way in the same way:
//
//   GlossaryRows        the entry cards (name, kind, disputed mark, short definition), grouped by letter, carrying the
//                       data-* attributes the in-page filter (GlossaryFilter) reads;
//   GlossaryInPageAz    the sticky "jump to letter" bar of a page that holds several letters (domain and kind pages);
//   GlossaryLetterRail  the A to Z across pages, one link per letter page with its count: a compact rail, or the hub's
//                       tiles;
//   GlossaryWaysIn      the junction at the foot of every browsing page: every domain and every kind with its count,
//                       the people, and the A to Z, the current one marked, so no page is a cul-de-sac.
//
// The cards keep the classes and the markup the single A to Z page used (gloss-entry and its parts), so the look, the
// desk's saved and read marks (DeskListMarks reads .gloss-entry) and the filter carry over unchanged.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getAllGlossaryEntries,
  getGlossaryDomains,
  getGlossaryKinds,
  type GlossaryEntry,
} from "@/content/glossary/glossary";
import {
  entriesForDomain,
  getGlossaryLetters,
  OTHER_BUCKET,
  searchBlob,
} from "@/lib/glossaryBrowse";

/** The anchor id of a letter's section on a page that holds several ("#" cannot sit in an id, so it is "hash"). */
export function letterAnchor(bucket: string): string {
  return `gloss-${bucket === OTHER_BUCKET ? "hash" : bucket}`; // the same ids the single A to Z page used
}

/**
 * The entry cards, one section per letter. On a letter page the one section carries no heading (the page's title is
 * the letter); elsewhere each section opens with its letter and count. Every card carries its definition, on every
 * page (PRIME 16/11/2026 11:59: "Show full cards instead of compact ones").
 *
 * @param groups [letter, entries] pairs, in display order
 * @param headings whether each section shows its letter heading
 */
export async function GlossaryRows({ groups, headings }: { groups: [string, GlossaryEntry[]][]; headings: boolean }) {
  const t = await getTranslations("glossary"); // kinds, the disputed label and the definitions
  return (
    <div className="gloss-list">
      {groups.map(([bucket, entries]) => (
        // A section the filter can hide whole when none of its rows survive, named by its letter for the jump bar.
        <section className="gloss-group" key={bucket} id={letterAnchor(bucket)} data-glossary-group data-letter={bucket}>
          {headings && (
            <h2 className="gloss-group-letter">
              <span aria-hidden="true">{bucket}</span>
              <span className="gloss-group-count">{entries.length}</span>
            </h2>
          )}
          <ul className="gloss-entries">
            {entries.map((e) => (
              // The row and what the filter reads from it: its domains, its kind and its searchable text.
              <li key={e.slug} className="gloss-entry" data-glossary-row data-slug={e.slug} data-domains={e.domains.join(" ")} data-kind={e.kind} data-search={searchBlob(e)}>
                <Link href={`/glossary/${e.slug}`} className="gloss-entry-link">
                  <span className="gloss-entry-head">
                    <span className="gloss-entry-headword">{e.headword}</span>
                    <span className={`gloss-kind-badge gloss-kind-${e.kind}`}>{t(`kinds.${e.kind}`)}</span>
                    {e.disputed && (
                      <span className="gloss-disputed-badge" title={t("disputedLabel")}>
                        {t("disputedLabel")}
                      </span>
                    )}
                  </span>
                  <span className="gloss-entry-def">{t(`entries.${e.slug}.def`)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * The sticky "jump to letter" bar of a page holding several letters: every letter of the alphabet, a link where the
 * page has a section for it and a dimmed mark where it has none. The in-page filter dims the letters its result empties.
 *
 * @param groups the page's [letter, entries] pairs
 */
export async function GlossaryInPageAz({ groups }: { groups: [string, GlossaryEntry[]][] }) {
  const t = await getTranslations("glossary"); // the bar's name
  const present = new Set(groups.map(([b]) => b)); // the letters this page holds
  const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ...(present.has(OTHER_BUCKET) ? [OTHER_BUCKET] : [])]; // the bar
  return (
    <nav className="gloss-az" aria-label={t("azNavLabel")}>
      {letters.map((L) =>
        present.has(L) ? (
          <a key={L} href={`#${letterAnchor(L)}`} className="gloss-az-link" data-gloss-az={L}>
            {L}
          </a>
        ) : (
          <span key={L} className="gloss-az-link is-empty" data-gloss-az={L} aria-hidden="true">
            {L}
          </span>
        ),
      )}
    </nav>
  );
}

/**
 * The A to Z across pages: one link per letter page, with how many entries it holds. A rail on the browsing pages, a
 * grid of tiles on the hub. The current letter is marked and announced as the current page.
 *
 * @param current the letter of the page showing the rail, if it is a letter page
 * @param tiles true for the hub's grid of tiles
 */
export async function GlossaryLetterRail({ current, tiles }: { current?: string; tiles?: boolean }) {
  const t = await getTranslations("glossary"); // the rail's name and the "#" bucket's label
  return (
    <nav className={`gloss-letters${tiles ? " gloss-letters--tiles" : ""}`} aria-label={t("browse.letterRailLabel")}>
      <ul className="gloss-letters-list">
        {getGlossaryLetters().map((l) => (
          <li key={l.bucket}>
            {l.count === 0 ? (
              // A letter no entry starts with: shown, so the alphabet reads whole, but not a link.
              <span className="gloss-letter is-empty" aria-hidden="true">
                <span className="gloss-letter-mark">{l.bucket}</span>
              </span>
            ) : (
              <Link
                href={`/glossary/letter/${l.slug}`}
                className={`gloss-letter${l.bucket === current ? " is-current" : ""}`}
                aria-current={l.bucket === current ? "page" : undefined}
                aria-label={t("browse.letterLinkAria", { letter: l.bucket === OTHER_BUCKET ? t("browse.otherLetter") : l.bucket, count: l.count })}
              >
                <span className="gloss-letter-mark">{l.bucket}</span>
                <span className="gloss-letter-count">{l.count}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The junction at the foot of every browsing page: every domain and every kind with its count, the people, and the
 * A to Z. The page's own domain or kind is marked, so the reader sees where they are among the ways in.
 *
 * @param currentDomain the domain page showing it, if any
 * @param currentKind the kind page showing it, if any
 * @param currentLetter the letter page showing it, if any
 */
export async function GlossaryWaysIn({ currentDomain, currentKind, currentLetter }: { currentDomain?: string; currentKind?: string; currentLetter?: string }) {
  const t = await getTranslations("glossary"); // labels
  const tPeople = await getTranslations("people"); // the people page's name
  const all = getAllGlossaryEntries(); // every entry, for the counts
  const people = all.filter((e) => e.person).length; // the entries about individuals (the /people page)
  return (
    <section className="section gloss-ways">
      <div className="container">
        {/* Every domain, with its count. */}
        <nav className="glossary-domain-rail-wrap" aria-label={t("browseByDomain")}>
          <h2 className="glossary-domain-rail-title">{t("browseByDomain")}</h2>
          <ul className="glossary-domain-rail">
            {getGlossaryDomains().map((d) => (
              <li key={d}>
                <Link href={`/glossary/domain/${d}`} className={`glossary-domain-chip${d === currentDomain ? " is-current" : ""}`} aria-current={d === currentDomain ? "page" : undefined}>
                  {t(`domains.${d}`)} <span className="glossary-chip-count">{entriesForDomain(d).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Every kind, with its count, and the people. */}
        <nav className="glossary-domain-rail-wrap" aria-label={t("browseByKind")}>
          <h2 className="glossary-domain-rail-title">{t("browseByKind")}</h2>
          <ul className="glossary-domain-rail">
            {getGlossaryKinds().map((k) => (
              <li key={k}>
                <Link href={`/glossary/kind/${k}`} className={`glossary-domain-chip${k === currentKind ? " is-current" : ""}`} aria-current={k === currentKind ? "page" : undefined}>
                  {t(`kinds.${k}`)} <span className="glossary-chip-count">{all.filter((e) => e.kind === k).length}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/people" className="glossary-domain-chip">
                {tPeople("title")} <span className="glossary-chip-count">{people}</span>
              </Link>
            </li>
          </ul>
        </nav>
        {/* The A to Z, and the way back to the hub. */}
        <h2 className="glossary-domain-rail-title">{t("browse.azTitle")}</h2>
        <GlossaryLetterRail current={currentLetter} />
        <p className="gloss-ways-hub">
          <Link href="/glossary">{t("browse.backToHub")}</Link>
        </p>
      </div>
    </section>
  );
}
