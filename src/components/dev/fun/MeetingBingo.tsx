// ============================================================================
// src/components/dev/fun/MeetingBingo.tsx
// ----------------------------------------------------------------------------
// MEETING BINGO — the /dev/fun buzzword-bingo card. The server page hands this
// component the fully-localized dataset (labels + the 13 meeting types, each
// with its phrase pool from the i18n catalogs), so the component itself is
// locale-agnostic: it only shuffles, renders, and keeps score.
//
// Game rules: a 5x5, 4x4 or 3x3 card (PRIME 2026-09-05; 5x5 is the classic and
// the default). An odd card has a FREE centre, pre-marked; the rest of the
// squares are phrases drawn at random from the selected meeting type's pool
// (each pool has ~30, so cards vary in content AND placement). Click a square
// when the phrase is uttered; any full row, column, or diagonal is a bingo.
// "New card", a change of meeting type or a change of size deals a fresh card.
//
// Randomness is deliberately client-side and per-visit (this is a static
// export): the card is dealt in a useEffect after mount, so the server HTML
// and the first client render agree (both show the "shuffling" skeleton) and
// every player gets a DIFFERENT card — which is exactly what bingo needs.
//
// THE CARD IS KEPT (review R4-07, 03/11/2026): a reload used to deal a new
// card and lose the marks, mid-meeting. The card (meeting type, size, the
// phrases in their places and the marked squares) is saved in this browser
// under the /dev/fun games' own key, "ronutz:fun:v1" (src/lib/fun/storage.ts),
// as the "card" of the "meeting-bingo" record's `extra`, and dealt back on the
// next visit when it still matches a pool of this page's language. Nothing is
// sent anywhere. A card with marks is never thrown away by one press: "New
// card", another meeting type or another size first arms the New card button
// (two steps, like the games' "Reset my stats"), and a second press deals.
//
// THE BINGO BANNER (review R4-06, 03/11/2026) no longer pushes the card down
// under the player's finger: on a wide screen it takes the place of the bingo
// balls above the card, in a slot of fixed height; on a phone, where the balls
// are left out so the card fits higher on the screen, it sits after the card
// and sticks to the bottom of the screen until the card is scrolled past.
//
// THE SHARE LINE (PRIME 03/11/2026, "Yes on all your suggested ideas"): the
// banner carries a Copy button. It copies "BINGO at <meeting type> · <n>
// squares · <size>×<size>", n being the squares the player marked (the FREE
// centre is not earned), and under it the toy's address in the page's
// language, with no query string (shareText, src/lib/fun/share.ts). On a wide
// screen the button sits beside the banner's words, so the slot keeps its
// height; on a phone it shares the banner's first row with the word BINGO.
// ============================================================================

"use client";

// React hooks: state, memoised geometry, and the effects that restore, save and disarm.
import { useEffect, useMemo, useState } from "react";
// The shared fullscreen switch.
import { useFullscreen } from "@/lib/hooks/useFullscreen";
// The games' one storage key, read and written through its helpers (review R4-07).
import { loadRecord, updateRecord } from "@/lib/fun/storage";
// The share card's text: the line, then the toy's address with no query string.
import { shareText } from "@/lib/fun/share";
// The share line's Copy button, and the filler for its template.
import ToyShare, { fillTemplate, type ToyShareLabels } from "@/components/dev/fun/ToyShare";

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
  /** The armed New card button after "New card" on a card with marks (review R4-07). */
  newCardConfirm: string;
  /** The armed New card button after another meeting type or size was chosen on a card with marks (review R4-07). */
  changeConfirm: string;
  free: string;
  sizeLabel: string;
  bingo: string;
  bingoSub: string;
  shuffling: string;
  fullscreenEnterAria: string;
  fullscreenExitAria: string;
  /** The share line's template, raw: "BINGO at {type} · {squares} · {size}". */
  shareLine: string;
  /** "0 squares", "1 square", "2 squares" ... one wording per count of marks (index = count), plural rules applied. */
  shareSquares: string[];
  /** The Copy button's words. */
  share: ToyShareLabels;
}

/** The toy's path below /dev/fun, for the address in the share line. */
const SLUG = "meeting-bingo";

/** Selectable card sizes (PRIME 2026-09-05). 5x5 is the classic and stays the
 *  default; 4x4 and 3x3 make a shorter game for a shorter meeting. */
const SIZES = [5, 4, 3] as const;
type Size = (typeof SIZES)[number];

/** The record id the card is saved under in the games' storage key (review R4-07). */
const STORE_ID = "meeting-bingo";

/** How long an armed New card button waits for its second press (ms). */
const ARM_MS = 5000;

/** The card as saved: meeting type, size, the phrases in grid order (FREE skipped) and the marked squares' indices. */
interface SavedCard {
  type: string;
  size: Size;
  phrases: string[];
  marked: number[];
}

/** What the armed New card button will do on its second press, or null when it is not armed. */
type Armed = null | { kind: "new" } | { kind: "type"; typeId: string } | { kind: "size"; size: Size };

/**
 * Geometry for a given card size.
 *
 * The FREE square only exists on an ODD grid, because an even grid has no
 * centre square to give away. On 4x4 every square must be earned, which is the
 * honest consequence of the shape rather than an arbitrary rule, and it means
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

/**
 * A blank set of marks for a card of this size, with the FREE square (odd sizes) already marked.
 *
 * @param size the card size
 * @returns one flag per square
 */
function freshMarks(size: Size): boolean[] {
  // The card's geometry.
  const g = geometry(size);
  // Nothing marked.
  const m = new Array<boolean>(g.cells).fill(false);
  // Except the FREE centre, when there is one.
  if (g.freeIndex >= 0) m[g.freeIndex] = true;
  // The marks.
  return m;
}

/**
 * The saved card, when there is one and it still fits this page: a known meeting type, a valid size, phrases that
 * are all in that type's pool in this language (a card saved on another language's page is not dealt here), and
 * marks that point at real squares.
 *
 * @param types the meeting types on this page
 * @returns the card, or null to deal a fresh one
 */
function readSavedCard(types: BingoType[]): SavedCard | null {
  // The stored record's own corner (storage.ts never throws; an empty record has an empty extra).
  const raw = loadRecord(STORE_ID).extra.card as Partial<SavedCard> | undefined;
  // Nothing saved, or not an object.
  if (!raw || typeof raw !== "object") return null;
  // The meeting type it was dealt for, on this page.
  const type = types.find((t) => t.id === raw.type);
  // The size, one of the three.
  const size = SIZES.find((n) => n === raw.size);
  // Both must be known.
  if (!type || !size) return null;
  // The size's geometry.
  const g = geometry(size);
  // The phrases: an array of the right length, every one in this type's pool here, none twice.
  const phrases = raw.phrases;
  // Shape first.
  if (!Array.isArray(phrases) || phrases.length !== g.phrases) return null;
  // Every phrase from this pool (a card from another language fails here).
  if (!phrases.every((p) => typeof p === "string" && type.phrases.includes(p))) return null;
  // No phrase twice.
  if (new Set(phrases).size !== phrases.length) return null;
  // The marks: whole numbers naming real squares, never the FREE one (it is marked anyway).
  const marked = Array.isArray(raw.marked) ? raw.marked : [];
  // Each mark checked.
  if (!marked.every((i) => Number.isInteger(i) && i >= 0 && i < g.cells && i !== g.freeIndex)) return null;
  // A card worth dealing back.
  return { type: type.id, size, phrases, marked };
}

/**
 * Save the card under the games' storage key (storage.ts swallows a full or disabled storage).
 *
 * @param card the card to keep
 */
function saveCard(card: SavedCard): void {
  // The record's other fields stay as they are; only the card in its extra changes.
  updateRecord(STORE_ID, (r) => ({ ...r, extra: { ...r.extra, card } }));
}

export default function MeetingBingo({ labels, types, locale }: { labels: BingoLabels; types: BingoType[]; locale: string }) {
  const { ref: fsRef, isFullscreen, toggle: toggleFs } = useFullscreen<HTMLDivElement>();
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [size, setSize] = useState<Size>(5);
  // The card's geometry (the phrase count is read where a card is dealt).
  const { cells: CELLS, freeIndex: FREE_INDEX, lines: LINES } =
    useMemo(() => geometry(size), [size]);
  // The dealt phrases (null until the client deals — see header note).
  const [dealt, setDealt] = useState<string[] | null>(null);
  // Marked squares, FREE center pre-marked. Index-aligned with the grid.
  const [marked, setMarked] = useState<boolean[]>(() => freshMarks(5));
  // The New card button's second step, when armed (review R4-07).
  const [armed, setArmed] = useState<Armed>(null);

  const current = types.find((t) => t.id === typeId) ?? types[0];

  /**
   * Deal a fresh card of a meeting type and size, with blank marks.
   *
   * @param id the meeting type
   * @param n the card size
   */
  const dealInto = (id: string, n: Size) => {
    // The type's pool (the first type when the id is unknown).
    const type = types.find((t) => t.id === id) ?? types[0];
    // No types at all: nothing to deal.
    if (!type) return;
    // The meeting type.
    setTypeId(type.id);
    // The size.
    setSize(n);
    // A random draw of the phrases this size needs.
    setDealt(drawRandom(type.phrases, geometry(n).phrases));
    // Blank marks, FREE marked.
    setMarked(freshMarks(n));
    // Nothing waits for a second press any more.
    setArmed(null);
  };

  // First deal happens client-side after mount (per-visit randomness with no hydration mismatch), unless this
  // browser kept a card from an earlier visit, which is dealt back with its marks (review R4-07).
  useEffect(() => {
    // The kept card, if it still fits this page.
    const saved = readSavedCard(types);
    // A card to resume.
    if (saved) {
      // Its meeting type.
      setTypeId(saved.type);
      // Its size.
      setSize(saved.size);
      // Its phrases, in their places.
      setDealt(saved.phrases);
      // Its marks, over a blank set (which carries the FREE square).
      const m = freshMarks(saved.size);
      // Each kept mark.
      saved.marked.forEach((i) => (m[i] = true));
      // The marks.
      setMarked(m);
      // Resumed.
      return;
    }
    // Otherwise a fresh 5x5 card of the first meeting type.
    if (types[0]) dealInto(types[0].id, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every change to the card is saved, so a reload deals it back (review R4-07).
  useEffect(() => {
    // Nothing dealt yet: nothing to keep.
    if (!dealt) return;
    // The marked squares by index (the FREE one is implied).
    const marks = marked.flatMap((on, i) => (on && i !== FREE_INDEX ? [i] : []));
    // Written under the games' key.
    saveCard({ type: typeId, size, phrases: dealt, marked: marks });
  }, [dealt, marked, typeId, size, FREE_INDEX]);

  // An armed button disarms itself if the second press does not come.
  useEffect(() => {
    // Not armed: no timer.
    if (!armed) return;
    // Disarm after a few seconds (a pending meeting type or size shows the card's own again).
    const id = window.setTimeout(() => setArmed(null), ARM_MS);
    // A new arming, or a deal, cancels the old timer.
    return () => window.clearTimeout(id);
  }, [armed]);

  /** Squares that belong to at least one completed line (for highlighting). */
  const winning = useMemo(() => {
    const s = new Set<number>();
    for (const line of LINES) {
      if (line.every((i) => marked[i])) line.forEach((i) => s.add(i));
    }
    return s;
    // Recomputed when the marks or the card's shape change.
  }, [marked, LINES]);
  const hasBingo = winning.size > 0;
  // Whether the card carries any mark the player made (the FREE square does not count).
  const hasMarks = marked.some((on, i) => on && i !== FREE_INDEX);
  // How many squares the player marked (the FREE centre is given, not earned), for the share line.
  const markCount = marked.filter((on, i) => on && i !== FREE_INDEX).length;
  // The share card once there is a bingo: the line, then the toy's address in this language (no query string).
  const shareCard = hasBingo
    ? shareText({
        // "BINGO at Daily standup · 5 squares · 5×5", with the plural chosen by the page for this count.
        title: fillTemplate(labels.shareLine, {
          // The meeting type of the card being played (not a pending choice in the selector).
          type: current?.name ?? "",
          // The count of marks, worded (the bare number if a wording is missing).
          squares: labels.shareSquares[markCount] ?? String(markCount),
          // The card's size, as the size buttons write it.
          size: `${size}×${size}`,
        }),
        // No further lines: the address follows.
        lines: [],
        // The page's language, so the address opens the same page.
        locale,
        // This toy.
        slug: SLUG,
      })
    : "";

  const toggle = (i: number) => {
    if (i === FREE_INDEX) return; // the FREE square stays marked
    // Playing on means the pending change is not wanted.
    setArmed(null);
    setMarked((m) => {
      const next = [...m];
      next[i] = !next[i];
      return next;
    });
  };

  /**
   * Another meeting type was chosen: a blank card changes at once, a card with marks arms the New card button.
   *
   * @param id the chosen meeting type
   */
  const chooseType = (id: string) => {
    // The card's own type again: nothing pending.
    if (id === typeId) return setArmed(null);
    // A card with marks waits for the second press.
    if (hasMarks) return setArmed({ kind: "type", typeId: id });
    // A blank card: deal the new type at the same size.
    dealInto(id, size);
  };

  /**
   * Another size was chosen: a blank card changes at once, a card with marks arms the New card button.
   *
   * @param n the chosen size
   */
  const chooseSize = (n: Size) => {
    // The card's own size again: nothing pending.
    if (n === size) return setArmed(null);
    // A card with marks waits for the second press.
    if (hasMarks) return setArmed({ kind: "size", size: n });
    // A blank card: deal the new size of the same type (old marks index a grid that no longer exists).
    dealInto(typeId, n);
  };

  /** The New card button: deals at once on a blank card; on a card with marks it arms first, then deals. */
  const onNewCard = () => {
    // A pending meeting type: deal it.
    if (armed?.kind === "type") return dealInto(armed.typeId, size);
    // A pending size: deal it.
    if (armed?.kind === "size") return dealInto(typeId, armed.size);
    // The second press of "New card", or a card with nothing to lose: deal the same type and size.
    if (armed?.kind === "new" || !hasMarks) return dealInto(typeId, size);
    // The first press on a card with marks: arm.
    setArmed({ kind: "new" });
  };

  // What the selector and the size buttons show: a pending choice, or the card's own.
  const shownType = armed?.kind === "type" ? armed.typeId : typeId;
  // The size shown as pressed.
  const shownSize = armed?.kind === "size" ? armed.size : size;
  // The New card button's words while armed.
  const armedLabel = armed ? (armed.kind === "new" ? labels.newCardConfirm : labels.changeConfirm) : "";

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
          // A pending meeting type shows here until it is dealt or dropped.
          value={shownType}
          // Another type: dealt at once on a blank card, armed on a card with marks.
          onChange={(e) => chooseType(e.target.value)}
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {/* CARD SIZE (PRIME 2026-09-05). Changing size deals a fresh card,
            because the old marks index a grid that no longer exists; on a card
            with marks it waits for the New card button's second press. */}
        <div className="bingo-sizes" role="group" aria-label={labels.sizeLabel}>
          {SIZES.map((n) => (
            <button
              key={n}
              type="button"
              // A pending size shows as pressed until it is dealt or dropped.
              className={`bingo-size${n === shownSize ? " bingo-size-on" : ""}`}
              // The same, for assistive technology.
              aria-pressed={n === shownSize}
              // Another size: dealt at once on a blank card, armed on a card with marks.
              onClick={() => chooseSize(n)}
            >
              {n}&times;{n}
            </button>
          ))}
        </div>
        {/* Armed, it names what its second press will do, and shows it (review R4-07). */}
        <button type="button" className={`bingo-new${armed ? " bingo-new-armed" : ""}`} onClick={onNewCard}>
          {armed ? armedLabel : labels.newCard} <span aria-hidden="true">&#8635;</span>
        </button>
        <button
          type="button"
          className="fs-toggle"
          onClick={toggleFs}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? labels.fullscreenExitAria : labels.fullscreenEnterAria}
          title={isFullscreen ? labels.fullscreenExitAria : labels.fullscreenEnterAria}
        >
          <span aria-hidden="true">{isFullscreen ? "⤡" : "⤢"}</span>
        </button>
        {/* The armed button's words, spoken: a change made in the selector arms a button the reader is not on. */}
        <span className="sr-only" role="status" aria-live="polite">
          {armedLabel}
        </span>
      </div>

      {/* The slot above the card (review R4-06): the bingo balls, and in their place the banner once there is a
          bingo, at a fixed height so the card never moves. On a phone the slot opens up (see components.css): the
          balls are left out and the banner follows the card. */}
      <div className="bingo-marquee">
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
          <div className="bingo-banner">
            {/* The announcement when the bingo lands: the word and the tradition line, said once. The visible words
                below are laid out around the Copy button, so they are not announced a second time. */}
            <p className="sr-only" role="status">
              {labels.bingo} {labels.bingoSub}
            </p>
            {/* BINGO! */}
            <p className="bingo-banner-word" aria-hidden="true">{labels.bingo}</p>
            {/* The share line's Copy button (its own polite line says "Copied"). */}
            <ToyShare className="bingo-share" text={shareCard} labels={labels.share} />
            {/* The tradition line. */}
            <p className="bingo-banner-sub" aria-hidden="true">{labels.bingoSub}</p>
          </div>
        )}
      </div>

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
