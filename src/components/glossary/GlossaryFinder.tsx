// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/glossary/GlossaryFinder.tsx
// ----------------------------------------------------------------------------
// "FIND A TERM" ON THE GLOSSARY HUB (client island; PRIME 16/11/2026 04:27, splitting the glossary page).
//
// The hub no longer carries the 2,061 entries, so it cannot filter them in the page. This field looks a term up by
// name instead: the first time the reader focuses it or types, it fetches public/glossary-index.json (every entry's
// name, expansion, other names, kind and domains, written at prebuild by scripts/gen-glossary-index.mts; about a
// quarter of a megabyte, a fraction of that compressed) and lists the best matches as the reader types, each a link to
// its entry.
//
// Ranking, best first: the name exactly; an expansion or other name exactly; the name's start; a word inside the name;
// an expansion's or other name's start; a word inside one; the name anywhere; an expansion or other name anywhere.
// Accents and case are ignored, and a second pass ignores punctuation too, so "8021x" finds 802.1X. Ties go to the
// shorter name, then A to Z.
//
// Keys: Enter opens the first match, the down arrow moves into the list and the arrows move through it (up from the
// first returns to the field), Escape clears. "Search the definitions too" opens the site's search dialog with the same
// words, narrowed to the glossary, for a word that is in an entry's text rather than its name.
// Labels arrive pre-localized as props, so the island needs no i18n context of its own.
// ============================================================================
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

/** One row of the index: slug, name, expansion, other names, kind index, domain indexes. */
type Row = [string, string, string, string[], number, number[]];
/** The index file. */
interface GlossaryIndex {
  v: number; // the shape's version
  kinds: string[]; // the kind keys, by index
  domains: string[]; // the domain keys, by index
  e: Row[]; // the entries
}
/** A match: the row, its score (lower is better) and the other name it matched through, if any. */
interface Hit {
  row: Row; // the entry
  score: number; // its rank
  via: string; // the other name that matched, or ""
}

/** How many matches the list shows at most. */
const MAX_HITS = 12;
/**
 * The score of each kind of match (lower is better), by where it was found. A name matched exactly comes first, then
 * an expansion or other name matched exactly; after those a name beats another name at each level, so "TLS" lists
 * EAP-TLS (TLS starts a word of its name) above "certificate" (whose other name "TLS certificate" starts with it).
 * Index: 0 exactly, 1 at the start, 2 at a word's start, 3 anywhere.
 */
const NAME_SCORE = [0, 2, 3, 6];
/** The same for an expansion or another name. */
const OTHER_SCORE = [1, 4, 5, 7];

/**
 * A string as the finder compares it: lower case, accents removed.
 *
 * @param s the text
 * @returns its comparable form
 */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}+/gu, ""); // case and accents dropped
}

/**
 * The same, with every character that is not a letter or a digit removed ("802.1X" becomes "8021x").
 *
 * @param s the text
 * @returns its squashed form
 */
function squash(s: string): string {
  return norm(s).replace(/[^\p{L}\p{N}]+/gu, ""); // punctuation and spaces dropped
}

/**
 * How well one text matches the query: 0 exactly, 1 at its start, 2 at the start of a word inside it, 3 anywhere,
 * or null for no match. The squashed forms are tried when the plain ones fail.
 *
 * @param text the text to test
 * @param q the query, normalized
 * @param qs the query, squashed
 * @returns the rank, or null
 */
function rank(text: string, q: string, qs: string): number | null {
  const n = norm(text); // the text, normalized
  if (n === q) return 0; // exactly
  if (n.startsWith(q)) return 1; // at its start
  if (n.includes(` ${q}`) || n.includes(`-${q}`) || n.includes(`(${q}`) || n.includes(`/${q}`)) return 2; // at a word's start
  if (n.includes(q)) return 3; // anywhere
  if (qs.length >= 2) { // punctuation-blind, for a query of two characters or more
    const s = squash(text); // the text, squashed
    if (s === qs) return 0; // exactly
    if (s.startsWith(qs)) return 1; // at its start
    if (s.includes(qs)) return 3; // anywhere
  }
  return null; // no match
}

export default function GlossaryFinder({
  indexUrl,
  kindLabels,
  label,
  placeholder,
  hint,
  loadingLabel,
  errorLabel,
  countTemplate,
  noneLabel,
  aliasLabel,
  fullTextLabel,
  sectionLabel,
}: {
  /** The index file's address. */
  indexUrl: string;
  /** Each kind's label, by key. */
  kindLabels: Record<string, string>;
  /** The field's label. */
  label: string;
  /** The field's placeholder. */
  placeholder: string;
  /** How the keys work, read with the field. */
  hint: string;
  /** Shown while the index loads. */
  loadingLabel: string;
  /** Shown when the index cannot be fetched. */
  errorLabel: string;
  /** "%SHOWN% of %TOTAL% matches". */
  countTemplate: string;
  /** Shown when nothing matches. */
  noneLabel: string;
  /** "Also known as", before the other name a match came through. */
  aliasLabel: string;
  /** The button that opens the site's search with the same words. */
  fullTextLabel: string;
  /** The glossary's name, for the search dialog's "only in" pill. */
  sectionLabel: string;
}) {
  const [query, setQuery] = useState(""); // the reader's words
  const [index, setIndex] = useState<GlossaryIndex | null>(null); // the index, once fetched
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle"); // the fetch's progress
  const inputRef = useRef<HTMLInputElement | null>(null); // the field, for focus moves
  const listRef = useRef<HTMLUListElement | null>(null); // the results, for focus moves

  /** Fetch the index once, the first time the reader shows interest. */
  const load = useCallback(() => {
    if (state !== "idle") return; // already fetched, fetching, or failed
    setState("loading"); // under way
    fetch(indexUrl, { cache: "no-cache" }) // revalidated, so a new build's index is seen at once (a 304 costs nothing)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))) // the body, or a failure
      .then((j: GlossaryIndex) => {
        setIndex(j); // kept
        setState("ready"); // usable
      })
      .catch(() => setState("error")); // say so, and leave the A to Z below as the way in
  }, [indexUrl, state]);

  // The matches for the current words: every row ranked, the best MAX_HITS shown, the total counted.
  const { hits, total } = useMemo(() => {
    const q = norm(query.trim()); // the query, normalized
    if (!index || q === "") return { hits: [] as Hit[], total: 0 }; // nothing to rank yet
    const qs = squash(query); // the query, squashed
    const all: Hit[] = []; // every match
    for (const row of index.e) { // each entry
      const name = rank(row[1], q, qs); // against its name
      let best = name === null ? null : NAME_SCORE[name]; // the name's score
      let via = ""; // the other name it came through
      for (const other of [row[2], ...row[3]]) { // its expansion and other names
        if (!other) continue; // no expansion
        const r = rank(other, q, qs); // against this one
        if (r !== null && (best === null || OTHER_SCORE[r] < best)) { // better than what it has
          best = OTHER_SCORE[r]; // this one's score
          via = other; // remembered for the result line
        }
      }
      if (best !== null) all.push({ row, score: best, via }); // a match
    }
    all.sort((a, b) => a.score - b.score || a.row[1].length - b.row[1].length || a.row[1].localeCompare(b.row[1])); // best first
    return { hits: all.slice(0, MAX_HITS), total: all.length }; // the shown few and the count
  }, [index, query]);

  /** Move the focus to the n-th result link, or back to the field. */
  const focusHit = (n: number) => {
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("a"); // the result links
    if (!links || n < 0) return inputRef.current?.focus(); // above the first: back to the field
    links[Math.min(n, links.length - 1)]?.focus(); // the link, or the last one
  };

  /** Open the site's search dialog with the same words, narrowed to the glossary. */
  const fullText = (opener: HTMLElement | null) => {
    window.dispatchEvent(new CustomEvent("ronutz:open-search", { detail: { query, scope: "understand", section: "glossary", sectionLabel, opener } })); // the one search UI
  };

  const q = query.trim(); // whether anything has been typed
  const status = // the line under the field
    state === "loading" ? loadingLabel :
    state === "error" ? errorLabel :
    q && state === "ready" ? (total === 0 ? noneLabel : countTemplate.replace("%SHOWN%", String(hits.length)).replace("%TOTAL%", String(total))) :
    "";

  return (
    <div className="gloss-finder" role="search" aria-label={label}>
      <label className="gloss-finder-label" htmlFor="glossary-finder-input">
        {label}
      </label>
      <div className="gloss-finder-row">
        {/* The field, in the wrapper that draws the glossary's search icon. */}
        <div className="gloss-search-row gloss-finder-field">
        <input
          ref={inputRef}
          id="glossary-finder-input"
          type="search"
          className="gloss-search-input gloss-finder-input"
          placeholder={placeholder}
          value={query}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="glossary-finder-hint"
          onFocus={load}
          onChange={(e) => {
            load(); // in case the field was filled without a focus (autofill)
            setQuery(e.target.value); // the words
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && hits.length > 0) { e.preventDefault(); focusHit(0); } // into the list
            else if (e.key === "Enter" && hits.length > 0) { e.preventDefault(); listRef.current?.querySelector<HTMLAnchorElement>("a")?.click(); } // the first match
            else if (e.key === "Escape" && query) { e.preventDefault(); setQuery(""); } // cleared
          }}
        />
        </div>
        <button type="button" className="gloss-finder-full" onClick={(e) => fullText(e.currentTarget)}>
          {fullTextLabel}
        </button>
      </div>
      <p className="gloss-finder-hint" id="glossary-finder-hint">
        {hint}
      </p>
      {/* The count, the "nothing matched" line, or the loading and error lines, read out as they change. */}
      <p className="gloss-finder-status" aria-live="polite">
        {status}
      </p>
      {hits.length > 0 && (
        <ul className="gloss-finder-results" ref={listRef}>
          {hits.map((h, i) => (
            // data-kind gives the badge its kind's colour (the --gloss-kind-hue rules in components.css).
            <li key={h.row[0]} data-kind={index?.kinds[h.row[4]] ?? "term"}>
              <Link
                href={`/glossary/${h.row[0]}`}
                className="gloss-finder-hit"
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); focusHit(i + 1); } // the next
                  else if (e.key === "ArrowUp") { e.preventDefault(); focusHit(i - 1); } // the previous, or the field
                }}
              >
                <span className="gloss-finder-name">{h.row[1]}</span>
                {/* What it stands for, or the other name the words matched. */}
                {h.via && h.via !== h.row[2] ? (
                  <span className="gloss-finder-sub">
                    {aliasLabel}: {h.via}
                  </span>
                ) : h.row[2] ? (
                  <span className="gloss-finder-sub">{h.row[2]}</span>
                ) : null}
                <span className={`gloss-kind-badge gloss-kind-${index?.kinds[h.row[4]] ?? "term"}`}>{kindLabels[index?.kinds[h.row[4]] ?? "term"]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
