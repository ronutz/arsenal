// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/playArea.ts
// ----------------------------------------------------------------------------
// BRING THE GAME INTO VIEW WHEN IT STARTS (PRIME 11/11/2026 23:39: "when it is
// started, scroll and align the screen ensuring the entire game board or
// field, and everything important to the gameplay (including things below the
// board such as clues) is visible on the screen").
//
// GameShell wraps every game's playing area (board, controls, clues, the
// progress line) in one element and offers revealPlayArea() for it through
// PlayAreaContext; the kit's StartCover calls it after Start, and the games
// that start another way (Whack-a-Bug's buttons, First Match's levels) call it
// through usePlayAreaReveal(), which, called above the shell, aims at the
// page's playing area itself. The scroll waits two frames, so the board that
// replaces the Start cover has been laid out before it is measured.
//
// What "in view" means: the playing area sits just below whatever is pinned to
// the top of the window (the site header is sticky on wide screens, static on
// phones), with a small margin. When it is taller than the window, its top is
// aligned there, so the board, which comes first, is whole and the rest
// follows by scrolling. When it already fits where it is, nothing moves. Under
// prefers-reduced-motion the jump is instant. Full screen needs nothing.
// ============================================================================

// React's context and the hook that reads it.
import { createContext, useContext } from "react";
// The interest counts: counts something done on "this page", only for a reader who said yes.
import { trackPage } from "@/lib/interest/client";

/** The margin left between the top bar (or the window's edge) and the playing area, in CSS pixels. */
const MARGIN_PX = 8;

/**
 * How much of the window's top is covered by elements pinned there (the site header, when it is sticky).
 *
 * @returns the covered height in CSS pixels
 */
function coveredTop(): number {
  // The site header.
  const header = document.querySelector<HTMLElement>(".site-header");
  // None: nothing covers the top.
  if (!header) return 0;
  // Pinned only when sticky or fixed (on phones it scrolls away with the page).
  const pos = getComputedStyle(header).position;
  // Its height while pinned, else nothing.
  return pos === "sticky" || pos === "fixed" ? header.getBoundingClientRect().height : 0;
}

/**
 * Scroll the window so the whole element is visible below the pinned header, or, when it is taller than the space,
 * so its top sits just below the header. Nothing moves when it already fits where it is.
 *
 * @param el the playing area
 */
export function revealElement(el: HTMLElement | null): void {
  // Nothing to show, or no window (a server render).
  if (!el || typeof window === "undefined") return;
  // In full screen the element is the whole screen already.
  if (document.fullscreenElement) return;
  // After the new board is laid out (two frames), and twice more after the first scroll has had time to land, for a
  // game whose playing area changes size while it starts (Whack-a-Bug's countdown gives way to its field).
  requestAnimationFrame(() => requestAnimationFrame(() => place(el)));
  // Again, a little later.
  window.setTimeout(() => place(el), REPASS_MS[0]);
  // And once more.
  window.setTimeout(() => place(el), REPASS_MS[1]);
}

/** When the reveal measures again after its first pass, in milliseconds (a smooth scroll lands in about 400 ms). */
const REPASS_MS = [600, 1300] as const;

/**
 * One pass: scroll so the area's top sits just below the pinned header, unless it is already wholly visible.
 *
 * @param el the playing area
 */
function place(el: HTMLElement): void {
  // Gone (the game left the page).
  if (!el.isConnected || document.fullscreenElement) return;
  // Where it is now.
  const box = el.getBoundingClientRect();
  // The top of the free space: below the pinned header, with the margin.
  const top = coveredTop() + MARGIN_PX;
  // Already wholly visible (or, when taller than the window, already aligned at the top): leave the page alone.
  if ((box.top >= top - 1 && box.bottom <= window.innerHeight - MARGIN_PX + 1) || Math.abs(box.top - top) <= 2) return;
  // Its top goes just below the header (a taller area then shows the board first, the rest below).
  const target = window.scrollY + box.top - top;
  // Instant for those who asked for less motion, smooth otherwise.
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Scrolled.
  window.scrollTo({ top: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
}

/** The current game's "bring the playing area into view", given by GameShell; null outside a game. */
export const PlayAreaContext = createContext<(() => void) | null>(null);

/**
 * The current game's reveal function, for a game whose round starts somewhere other than the kit's StartCover.
 *
 * A game that renders GameShell itself (Whack-a-Bug, First Match) calls this hook ABOVE the shell's provider, where
 * the context is empty; it then gets the same reveal aimed at the page's playing area found in the document (one game
 * per page), so its rounds come into view too (found 12/11/2026: Whack-a-Bug's start had not moved the page).
 *
 * @returns a function that brings the playing area into view (a no-op where there is none)
 */
export function usePlayAreaReveal(): () => void {
  // GameShell's function, when the caller sits inside the shell.
  const reveal = useContext(PlayAreaContext);
  // Inside: the shell's own; above it: the playing area found on the page.
  return reveal ?? revealPageArea;
}

/** The reveal for a caller above GameShell's provider: the page's one playing area (GameShell's wrapper), if any. */
function revealPageArea(): void {
  // No document on the server.
  if (typeof document === "undefined") return;
  // The wrapper (null when the page has no game, which revealElement ignores).
  revealElement(document.querySelector<HTMLElement>(".fg-board-wrap"));
  // A round has started (this is called exactly then): counted for the game the address names, as GameShell's own
  // reveal counts it for the games that sit inside the shell (the interest counts, PRIME 12/11/2026).
  trackPage("game_start");
}
