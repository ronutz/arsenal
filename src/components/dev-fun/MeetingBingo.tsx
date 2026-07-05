// ============================================================================
// src/components/dev-fun/MeetingBingo.tsx
// ----------------------------------------------------------------------------
// MEETING BINGO — the /dev/fun buzzword-bingo card. The server page hands this
// component the fully-localized dataset (labels + 9 meeting types, each with
// its phrase pool from the i18n catalogs), so the component itself is
// locale-agnostic: it only shuffles, renders, and keeps score.
//
// Game rules (the classic ones): a 5x5 card, center square FREE and
// pre-marked, 24 phrases drawn at random from the selected meeting type's
// pool (each pool has ~30, so cards vary in content AND placement). Click a
// square when the phrase is uttered; any full row, column, or diagonal is a
// bingo. Changing the meeting type, or "New card", deals a fresh card.
//
// Randomness is deliberately client-side and per-visit (this is a static
// export): the card is dealt in a useEffect after mount, so the server HTML
// and the first client render agree (both show the "shuffling" skeleton) and
// every player gets a DIFFERENT card — which is exactly what bingo needs.
// ============================================================================

"use client";

import { useEffect, useMemo, useState } from "react";

/** One meeting type: id (stable key), display name, and its phrase pool. */
export interface BingoType {
  id: string;
  name: string;
  phrases: string[];
}

/** UI labels, resolved by the server page from the i18n catalogs. */
export interface BingoLabels {
  typeLabel: string;
  newCard: string;
  free: string;
  bingo: string;
  bingoSub: string;
  shuffling: string;
}

/** Grid geometry: 5x5 = 25 squares, index 12 is the FREE center. */
const SIZE = 5;
const CELLS = SIZE * SIZE;
const FREE_INDEX = 12;

/** All 12 winning lines (5 rows, 5 columns, 2 diagonals) as index arrays. */
const LINES: number[][] = [
  ...Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => r * SIZE + c)),
  ...Array.from({ length: SIZE }, (_, c) => Array.from({ length: SIZE }, (_, r) => r * SIZE + c)),
  Array.from({ length: SIZE }, (_, i) => i * SIZE + i),
  Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)),
];

/** Fisher-Yates shuffle on a copy; returns the first `n` items. */
function drawRandom(pool: string[], n: number): string[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function MeetingBingo({ labels, types }: { labels: BingoLabels; types: BingoType[] }) {
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  // The 24 dealt phrases (null until the client deals — see header note).
  const [dealt, setDealt] = useState<string[] | null>(null);
  // Marked squares, FREE center pre-marked. Index-aligned with the 5x5 grid.
  const [marked, setMarked] = useState<boolean[]>(() => {
    const m = new Array<boolean>(CELLS).fill(false);
    m[FREE_INDEX] = true;
    return m;
  });

  const current = types.find((t) => t.id === typeId) ?? types[0];

  /** Deal a fresh card for the current type and reset the marks. */
  const deal = (pool: string[]) => {
    setDealt(drawRandom(pool, CELLS - 1));
    const m = new Array<boolean>(CELLS).fill(false);
    m[FREE_INDEX] = true;
    setMarked(m);
  };

  // First deal happens client-side after mount (per-visit randomness with no
  // hydration mismatch); re-deals happen whenever the meeting type changes.
  useEffect(() => {
    if (current) deal(current.phrases);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  /** Squares that belong to at least one completed line (for highlighting). */
  const winning = useMemo(() => {
    const s = new Set<number>();
    for (const line of LINES) {
      if (line.every((i) => marked[i])) line.forEach((i) => s.add(i));
    }
    return s;
  }, [marked]);
  const hasBingo = winning.size > 0;

  const toggle = (i: number) => {
    if (i === FREE_INDEX) return; // the FREE square stays marked
    setMarked((m) => {
      const next = [...m];
      next[i] = !next[i];
      return next;
    });
  };

  /** Grid index -> phrase (the FREE center consumes no phrase). */
  const phraseAt = (i: number): string => {
    if (!dealt) return "";
    return dealt[i < FREE_INDEX ? i : i - 1] ?? "";
  };

  return (
    <div className="bingo" data-bingo={hasBingo ? "1" : "0"}>
      <div className="bingo-controls">
        <label className="bingo-type-label" htmlFor="bingo-type">
          {labels.typeLabel}
        </label>
        <select
          id="bingo-type"
          className="bingo-type-select"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button type="button" className="bingo-new" onClick={() => current && deal(current.phrases)}>
          {labels.newCard} <span aria-hidden="true">&#8635;</span>
        </button>
      </div>

      {hasBingo && (
        <div className="bingo-banner" role="status">
          <p className="bingo-banner-word">{labels.bingo}</p>
          <p className="bingo-banner-sub">{labels.bingoSub}</p>
        </div>
      )}

      <div className="bingo-grid" role="group" aria-label={current?.name}>
        {Array.from({ length: CELLS }, (_, i) =>
          i === FREE_INDEX ? (
            <div key={i} className="bingo-cell bingo-cell-free mono" aria-hidden="true">
              {labels.free}
            </div>
          ) : (
            <button
              key={dealt ? `${typeId}-${i}-${phraseAt(i)}` : `skeleton-${i}`}
              type="button"
              className={`bingo-cell${marked[i] ? " bingo-cell-marked" : ""}${winning.has(i) ? " bingo-cell-win" : ""}`}
              aria-pressed={marked[i]}
              disabled={!dealt}
              onClick={() => toggle(i)}
            >
              {phraseAt(i)}
            </button>
          ),
        )}
      </div>

      {!dealt && <p className="bingo-shuffling mono">{labels.shuffling}</p>}
    </div>
  );
}
