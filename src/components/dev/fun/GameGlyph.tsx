// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/GameGlyph.tsx
// ----------------------------------------------------------------------------
// ONE SMALL DRAWING PER GAME AND TOY (PRIME 08/11/2026: "add a nice and
// cool-looking graphic customization to each card, on theme with the puzzle or
// game linked by the card", and on the "Solve the other puzzles" pills "a
// graphical indication to each pill, related to the puzzle, for better visual
// distinguishment"). Each drawing is the game's subject in a few strokes: the
// Wi-Fi arcs over a floor plan for Access Points, a tree of bridges with one
// blocked link for Spanning Tree, a hook under an envelope for Phish or Legit,
// and so on. Exit the Editor's shows a terminal and a way out, never a key.
//
// Drawn in currentColor on a 48 by 48 grid, so a parent sets the colour: each
// game has its own accent (the fg-glyph--<id> classes in fun-games.css set
// --glyph-accent, and .fg-glyph takes its colour from it), and the same
// drawing serves the shelf's card (large, on a tinted tile) and the pill
// (small, inline). Decorative: aria-hidden, the card's or pill's text names
// the game. A server-safe component (no hooks), so the shelf page and the
// MorePuzzles call-out, both server components, can render it.
// ============================================================================

// React's element type, for the drawings' table.
import type { ReactElement } from "react";

/** The ids that have a drawing: the shelf's games, then its toys (by their page slug). */
export const GLYPH_IDS = [
  "prefix-of-the-day",
  "five-clues",
  "access-points",
  "bit-balance",
  "patch-path",
  "spanning-tree",
  "log-detective",
  "phish-or-legit",
  "whack-a-bug",
  "aggregate",
  "first-match",
  "exit-the-editor",
  "packet-stack",
  "ttl",
  "rule-inspector",
  "incident-commander",
  "mega-brain",
  "meeting-bingo",
  "boss-screens",
  "cat-distribution",
  "importance-meter",
] as const;

/** One drawing's id. */
export type GlyphId = (typeof GLYPH_IDS)[number];

/** Shared stroke settings: round ends and joins, so the small size stays soft. */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** A fainter stroke, for the backdrop of a drawing. */
const F = { ...S, strokeWidth: 1.6, opacity: 0.4 } as const;

/** The drawings, by id: the inner elements of a 48 by 48 SVG. */
const DRAWINGS: Record<GlyphId, ReactElement> = {
  // A /24 on a calendar page: the day's prefix.
  "prefix-of-the-day": (
    <>
      <rect x="6" y="9" width="36" height="32" rx="5" {...S} />
      <path d="M6 18h36M16 5v8M32 5v8" {...S} />
      <text x="24" y="35" textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace" fill="currentColor">/24</text>
    </>
  ),
  // A question card, and five clues under it, two of them used.
  "five-clues": (
    <>
      <rect x="11" y="3" width="26" height="27" rx="6" {...S} />
      <text x="24" y="24.5" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="ui-monospace, monospace" fill="currentColor">?</text>
      <circle cx="8" cy="40" r="3.2" fill="currentColor" />
      <circle cx="16" cy="40" r="3.2" fill="currentColor" />
      <circle cx="24" cy="40" r="3" {...S} strokeWidth={1.8} />
      <circle cx="32" cy="40" r="3" {...F} />
      <circle cx="40" cy="40" r="3" {...F} />
    </>
  ),
  // Wi-Fi arcs over a floor plan.
  "access-points": (
    <>
      <path d="M6 6h36v36H6zM18 6v36M30 6v36M6 18h36M6 30h36" {...F} />
      <path d="M12.7 26.7A16 16 0 0 1 35.3 26.7M16.2 30.2A11 11 0 0 1 31.8 30.2M19.8 33.8A6 6 0 0 1 28.2 33.8" {...S} />
      <circle cx="24" cy="38" r="2.4" fill="currentColor" />
    </>
  ),
  // A balanced register of bits.
  "bit-balance": (
    <>
      <rect x="5" y="7" width="38" height="34" rx="5" {...F} />
      <text x="24" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace" fill="currentColor" letterSpacing="2">0 1 1</text>
      <text x="24" y="36" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace" fill="currentColor" letterSpacing="2">1 0 0</text>
    </>
  ),
  // One cable snaking through every cell, from port 1.
  "patch-path": (
    <>
      <path d="M10 10h28v10H10v10h28v8" {...S} />
      <circle cx="10" cy="10" r="4.6" fill="currentColor" />
      <circle cx="38" cy="38" r="4.6" {...S} strokeWidth={2.2} />
      <text x="10" y="13.2" textAnchor="middle" fontSize="7.5" fontWeight="800" fontFamily="ui-monospace, monospace" style={{ fill: "var(--surface-base)" }}>1</text>
    </>
  ),
  // A root bridge, its tree, and one link blocked.
  "spanning-tree": (
    <>
      <path d="M24 12L12 28M24 12l12 16M12 28l12 12" {...S} />
      <path d="M36 28L24 40" {...S} strokeDasharray="2 4" opacity="0.7" />
      <path d="M27.5 31.5l5 5M32.5 31.5l-5 5" {...S} strokeWidth={2} />
      <circle cx="24" cy="10" r="5" fill="currentColor" />
      <circle cx="12" cy="28" r="4" {...S} />
      <circle cx="36" cy="28" r="4" {...S} />
      <circle cx="24" cy="40" r="4" {...S} />
    </>
  ),
  // Log lines under a magnifying glass.
  "log-detective": (
    <>
      <path d="M5 9h26M5 15h20M5 21h24M5 27h14M5 33h18" {...F} />
      <circle cx="29" cy="26" r="9" {...S} />
      <path d="M24 26h10" {...S} strokeWidth={2.2} />
      <path d="M35.5 32.5L43 40" {...S} strokeWidth={3.2} />
    </>
  ),
  // A hook under an envelope.
  "phish-or-legit": (
    <>
      <rect x="4" y="8" width="28" height="20" rx="3" {...S} />
      <path d="M4.5 9.5L18 20l13.5-10.5" {...S} />
      <path d="M38 4v26a7 7 0 1 1-12.5 4.3" {...S} />
      <path d="M25.5 34.3l-2.8-4.6 5.3.5" {...S} strokeWidth={2.2} />
    </>
  ),
  // A bug, and the mallet coming down.
  "whack-a-bug": (
    <>
      <ellipse cx="18" cy="31" rx="8" ry="10" {...S} />
      <path d="M18 21v20M10 26l-5-3M10 33H4M11 38l-4 4M26 26l5-3M26 33h6M25 38l4 4M14 21l-3-5M22 21l3-5" {...S} strokeWidth={2} />
      <rect x="27" y="4" width="16" height="9" rx="2.5" transform="rotate(30 35 8.5)" fill="currentColor" />
      <path d="M33 13l-5 9" {...S} strokeWidth={3} />
    </>
  ),
  // Two sibling blocks becoming their parent.
  aggregate: (
    <>
      <rect x="4" y="8" width="13" height="13" rx="2.5" {...S} />
      <rect x="4" y="27" width="13" height="13" rx="2.5" {...S} />
      <path d="M19 14.5h4l3 9.5-3 9.5h-4" {...F} />
      <rect x="29" y="11" width="15" height="26" rx="3" fill="currentColor" opacity="0.9" />
    </>
  ),
  // An access list read from the top: the first match decides.
  "first-match": (
    <>
      <rect x="15" y="7" width="29" height="9" rx="2.5" fill="currentColor" />
      <rect x="15" y="20" width="29" height="9" rx="2.5" {...F} />
      <rect x="15" y="33" width="29" height="9" rx="2.5" {...F} />
      <path d="M3 11.5h8M7.5 8l3.5 3.5L7.5 15" {...S} />
    </>
  ),
  // A terminal window, and a way out of it (no key is drawn).
  "exit-the-editor": (
    <>
      <rect x="3" y="7" width="32" height="30" rx="4" {...S} />
      <path d="M3 14h32M9 21l4 3-4 3M17 28h8" {...S} strokeWidth={2.2} />
      <path d="M33 30h11M40 26l4 4-4 4" {...S} />
    </>
  ),
  // A well with a full row of headers at the bottom, a row with one gap above it, and the missing block falling in.
  "packet-stack": (
    <>
      <path d="M5 7v35h38V7" {...S} />
      <rect x="8" y="34" width="6.5" height="5" rx="1.2" fill="currentColor" />
      <rect x="16.5" y="34" width="6.5" height="5" rx="1.2" fill="currentColor" />
      <rect x="25" y="34" width="6.5" height="5" rx="1.2" fill="currentColor" />
      <rect x="33.5" y="34" width="6.5" height="5" rx="1.2" fill="currentColor" />
      <rect x="8" y="27" width="6.5" height="5" rx="1.2" {...F} />
      <rect x="16.5" y="27" width="6.5" height="5" rx="1.2" {...F} />
      <rect x="33.5" y="27" width="6.5" height="5" rx="1.2" {...F} />
      <rect x="25" y="9" width="6.5" height="5" rx="1.2" fill="currentColor" />
      <path d="M28.25 17v6M25.5 20.5l2.75 2.75 2.75-2.75" {...S} strokeWidth={2} />
    </>
  ),
  // A packet's trail past two routers, the packet itself at the front carrying its last TTL.
  ttl: (
    <>
      <path d="M6 42V30h13V18h10" {...S} />
      <circle cx="6" cy="30" r="3.6" {...S} strokeWidth={2} style={{ fill: "var(--surface-base)" }} />
      <circle cx="19" cy="18" r="3.6" {...S} strokeWidth={2} style={{ fill: "var(--surface-base)" }} />
      <rect x="29" y="11" width="14" height="14" rx="3.5" fill="currentColor" />
      <text x="36" y="22.2" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="ui-monospace, monospace" style={{ fill: "var(--surface-base)" }}>1</text>
    </>
  ),
  // A connection card on the desk, and the two calls under it: permit (a tick) and deny (a cross).
  "rule-inspector": (
    <>
      <rect x="7" y="5" width="34" height="21" rx="4" {...S} />
      <path d="M12.5 12.5h17M12.5 18.5h11" {...F} />
      <rect x="5" y="31" width="17" height="12" rx="3.5" {...S} />
      <path d="M9.5 37.2l3 2.9 5-5.4" {...S} strokeWidth={2.2} />
      <rect x="26" y="31" width="17" height="12" rx="3.5" fill="currentColor" />
      <path d="M31.2 34.2l6.6 5.6M37.8 34.2l-6.6 5.6" fill="none" strokeWidth={2.2} strokeLinecap="round" style={{ stroke: "var(--surface-base)" }} />
    </>
  ),
  // A beacon on the console.
  "incident-commander": (
    <>
      <path d="M14 36V26a10 10 0 0 1 20 0v10" {...S} />
      <path d="M9 36h30v5H9z" fill="currentColor" />
      <path d="M24 6v5M10 11l3 3.5M38 11l-3 3.5M4 24h4M40 24h4" {...S} strokeWidth={2.2} />
      <path d="M24 22v8" {...S} strokeWidth={3} />
    </>
  ),
  // The console's lever pushed to the top, and full power.
  "mega-brain": (
    <>
      <rect x="8" y="5" width="9" height="38" rx="4.5" {...S} />
      <circle cx="12.5" cy="11" r="5" fill="currentColor" />
      <path d="M12.5 17v22" {...F} />
      <path d="M33 4L23 25h8l-5 19 16-24h-9l6-16z" fill="currentColor" />
    </>
  ),
  // A bingo card with one square marked.
  "meeting-bingo": (
    <>
      <rect x="6" y="6" width="36" height="36" rx="4" {...S} />
      <path d="M18 6v36M30 6v36M6 18h36M6 30h36" {...F} />
      <circle cx="24" cy="24" r="4.5" fill="currentColor" />
      <circle cx="12" cy="36" r="3.2" fill="currentColor" opacity="0.6" />
    </>
  ),
  // A monitor showing a spreadsheet.
  "boss-screens": (
    <>
      <rect x="4" y="6" width="40" height="28" rx="3" {...S} />
      <path d="M4 14h40M14 14v20M24 14v20M34 14v20M4 22h40" {...F} />
      <path d="M18 42h12M24 34v8" {...S} />
    </>
  ),
  // A cat's face.
  "cat-distribution": (
    <>
      <path d="M9 18l2-12 9 8h8l9-8 2 12c3 4 3 9 1 13-3 6-9 9-15 9s-12-3-15-9c-2-4-2-9 1-13z" {...S} />
      <circle cx="18" cy="25" r="2" fill="currentColor" />
      <circle cx="30" cy="25" r="2" fill="currentColor" />
      <path d="M22 31l2 2 2-2M24 33v2" {...S} strokeWidth={2} />
    </>
  ),
  // A gauge whose needle rests at zero.
  "importance-meter": (
    <>
      <path d="M6 34a18 18 0 0 1 36 0" {...S} />
      <path d="M24 34L8 34" {...S} strokeWidth={3} />
      <circle cx="24" cy="34" r="3.4" fill="currentColor" />
      <path d="M11.3 21.3l2.1 2.1M24 16v3M36.7 21.3l-2.1 2.1" {...F} />
    </>
  ),
};

/**
 * One game's or toy's drawing.
 *
 * @param props the id, the class to add (fg-glyph-card or fg-glyph-pill set the size), and an optional size in pixels
 * @returns the SVG, or nothing for an id without a drawing
 */
export default function GameGlyph({ id, className, size }: { id: string; className?: string; size?: number }) {
  // The drawing, if this id has one.
  const drawing = (DRAWINGS as Record<string, ReactElement | undefined>)[id];
  // None: nothing (a new game shows its card without a drawing until it gets one).
  if (!drawing) return null;
  // The SVG: decorative, coloured by its game's accent class.
  return (
    <svg
      className={`fg-glyph fg-glyph--${id}${className ? ` ${className}` : ""}`}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {drawing}
    </svg>
  );
}
