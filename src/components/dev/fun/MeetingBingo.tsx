// ============================================================================
// src/components/dev/fun/MeetingBingo.tsx
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
import { useFullscreen } from "@/lib/hooks/useFullscreen";

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
  sizeLabel: string;
  bingo: string;
  bingoSub: string;
  shuffling: string;
  fullscreenEnterAria: string;
  fullscreenExitAria: string;
}

/** Selectable card sizes (PRIME 2026-09-05). 5x5 is the classic and stays the
 *  default; 4x4 and 3x3 make a shorter game for a shorter meeting. */
const SIZES = [5, 4, 3] as const;
type Size = (typeof SIZES)[number];

/**
 * Geometry for a given card size.
 *
 * The FREE square only exists on an ODD grid, because an even grid has no
 * centre square to give away. On 4x4 every square must be earned, which is the
 * honest consequence of the shape rather than an arbitrary rule - and it means
 * a 4x4 card consumes sixteen phrases where a 5x5 consumes twenty-four.
 */
function geometry(size: Size) {
  const cells = size * size;
  const freeIndex = size % 2 === 1 ? Math.floor(cells / 2) : -1;
  const lines: number[][] = [
    ...Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => r * size + c)
    ),
    ...Array.from({ length: size }, (_, c) =>
      Array.from({ length: size }, (_, r) => r * size + c)
    ),
    Array.from({ length: size }, (_, i) => i * size + i),
    Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)),
  ];
  return { cells, freeIndex, lines, phrases: freeIndex >= 0 ? cells - 1 : cells };
}

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
  const { ref: fsRef, isFullscreen, toggle: toggleFs } = useFullscreen<HTMLDivElement>();
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [size, setSize] = useState<Size>(5);
  const { cells: CELLS, freeIndex: FREE_INDEX, lines: LINES, phrases: PHRASES } =
    useMemo(() => geometry(size), [size]);
  // The 24 dealt phrases (null until the client deals — see header note).
  const [dealt, setDealt] = useState<string[] | null>(null);
  // Marked squares, FREE center pre-marked. Index-aligned with the 5x5 grid.
  const [marked, setMarked] = useState<boolean[]>(() => {
    const g = geometry(5);
    const m = new Array<boolean>(g.cells).fill(false);
    if (g.freeIndex >= 0) m[g.freeIndex] = true;
    return m;
  });

  const current = types.find((t) => t.id === typeId) ?? types[0];

  /** Deal a fresh card for the current type and reset the marks. */
  const deal = (pool: string[]) => {
    setDealt(drawRandom(pool, PHRASES));
    const m = new Array<boolean>(CELLS).fill(false);
    if (FREE_INDEX >= 0) m[FREE_INDEX] = true;
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
    if (FREE_INDEX < 0) return dealt[i] ?? "";
    return dealt[i < FREE_INDEX ? i : i - 1] ?? "";
  };

  return (
    <div ref={fsRef} className={`bingo fs-fill${isFullscreen ? " is-fullscreen" : ""}`} data-bingo={hasBingo ? "1" : "0"}>
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
        {/* CARD SIZE (PRIME 2026-09-05). Changing size deals a fresh card,
            because the old marks index a grid that no longer exists. */}
        <div className="bingo-sizes" role="group" aria-label={labels.sizeLabel}>
          {SIZES.map((n) => (
            <button
              key={n}
              type="button"
              className={`bingo-size${n === size ? " bingo-size-on" : ""}`}
              aria-pressed={n === size}
              onClick={() => {
                setSize(n);
                const g = geometry(n);
                const m = new Array<boolean>(g.cells).fill(false);
                if (g.freeIndex >= 0) m[g.freeIndex] = true;
                setMarked(m);
                if (current) setDealt(drawRandom(current.phrases, g.phrases));
              }}
            >
              {n}&times;{n}
            </button>
          ))}
        </div>
        <button type="button" className="bingo-new" onClick={() => current && deal(current.phrases)}>
          {labels.newCard} <span aria-hidden="true">&#8635;</span>
        </button>
        <button
          type="button"
          className="fs-toggle"
          onClick={toggleFs}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? labels.fullscreenExitAria : labels.fullscreenEnterAria}
          title={isFullscreen ? labels.fullscreenExitAria : labels.fullscreenEnterAria}
        >
          <span aria-hidden="true">{isFullscreen ? "\u2921" : "\u2922"}</span>
        </button>
      </div>

      {/* BINGO BALLS (PRIME 2026-09-05). Decorative only, aria-hidden, drawn
          from semantic tokens so every theme gets it for free. Three balls
          rather than a full illustration: enough to say "bingo" above the
          card without competing with the card for attention. */}
      <svg
        className="bingo-art"
        viewBox="0 0 220 64"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="34" cy="34" r="24" className="bingo-art-ball" />
        <circle cx="34" cy="34" r="15" className="bingo-art-face" />
        <text x="34" y="40" textAnchor="middle" className="bingo-art-num">B</text>
        <circle cx="110" cy="30" r="27" className="bingo-art-ball" />
        <circle cx="110" cy="30" r="17" className="bingo-art-face" />
        <text x="110" y="37" textAnchor="middle" className="bingo-art-num">I</text>
        <circle cx="186" cy="36" r="22" className="bingo-art-ball" />
        <circle cx="186" cy="36" r="14" className="bingo-art-face" />
        <text x="186" y="42" textAnchor="middle" className="bingo-art-num">N</text>
      </svg>

      {hasBingo && (
        <div className="bingo-banner" role="status">
          <p className="bingo-banner-word">{labels.bingo}</p>
          <p className="bingo-banner-sub">{labels.bingoSub}</p>
        </div>
      )}

      <div
        className="bingo-grid"
        role="group"
        aria-label={current?.name}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
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
