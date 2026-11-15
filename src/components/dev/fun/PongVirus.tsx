// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

"use client";

// ============================================================================
// src/components/dev/fun/PongVirus.tsx
// ----------------------------------------------------------------------------
// THE PING-PONG VIRUS SIMULATOR (queue 5p; PRIME 15/11/2026 04:43, and 04:52:
// "Pong virus should bounce even with reduced motion. Make the "ball" similar
// to the actual one drawn by the original virus."). A harmless homage to the
// Ping-Pong boot sector virus, also called Bouncing Ball, Bouncing Dot or
// Italian, found on 1 March 1988 at the Politecnico di Torino, whose payload
// set a small ball bouncing around the screen; in text mode the ball was the
// bullet character "•" (Wikipedia, "Ping-Pong virus", read 15/11/2026; the
// F-Secure description, read 15/11/2026, calls it a small "ball" bouncing
// around the screen and gives no more detail of its path).
//
// What this draws: one bullet in a text-mode character cell (8 by 16 pixels
// on a VGA screen, drawn here at 10 by 20), moving one cell at a time on a
// diagonal and bouncing off the edges of the window. The sources say no more
// than "bouncing around the screen", so the diagonal path, the edge bounces and
// the step (one PC timer tick, about 55 ms: the 1,193,182 Hz clock divided by
// 65,536) are this homage's rendering, not a claim about the original's code.
//
// It moves even when the reader asked for reduced motion, as PRIME decided:
// the reader turned it on with two keys on purpose, and the same two keys turn
// it off (KeyboardShortcuts.tsx). The step is a jump from cell to cell, never
// a smooth glide. The layer ignores the pointer and is hidden from screen
// readers; nothing is fetched, nothing is sent.
// ============================================================================

import { useEffect, useRef } from "react";

/** One character cell, in CSS pixels (a VGA cell is 8 by 16; scaled by 1.25 to read on today's screens). */
const CELL_W = 10;
/** The cell's height. */
const CELL_H = 20;
/** One step every PC timer tick: 65,536 / 1,193,182 Hz, about 54.9 ms. */
const STEP_MS = 55;

/**
 * The bouncing ball, over the whole page, while it is mounted.
 *
 * @returns the layer
 */
export default function PongVirus() {
  // The ball's element, moved directly so a step costs no React render.
  const ball = useRef<HTMLSpanElement>(null);

  // The motion: started on mount, stopped on unmount.
  useEffect(() => {
    // The grid of cells the window holds.
    let cols = Math.max(2, Math.floor(window.innerWidth / CELL_W));
    // Its rows.
    let rows = Math.max(2, Math.floor(window.innerHeight / CELL_H));
    // The start: a cell a third of the way in, so the ball is seen at once.
    let x = Math.floor(cols / 3);
    // And a quarter of the way down.
    let y = Math.floor(rows / 4);
    // Moving down and to the right.
    let dx = 1;
    // One row per step.
    let dy = 1;
    // Draw the ball at its cell.
    const place = () => {
      // The element, when mounted.
      const el = ball.current;
      // Moved by a transform: no layout work.
      if (el) el.style.transform = `translate(${x * CELL_W}px, ${y * CELL_H}px)`;
    };
    // One step: bounce off an edge before leaving the grid, then move.
    const step = () => {
      // Off the left or right edge next: turn around.
      if (x + dx < 0 || x + dx > cols - 1) dx = -dx;
      // Off the top or bottom edge next: turn around.
      if (y + dy < 0 || y + dy > rows - 1) dy = -dy;
      // One cell along.
      x += dx;
      // One cell down or up.
      y += dy;
      // Drawn.
      place();
    };
    // A resized window: the grid follows, and the ball stays inside it.
    const onResize = () => {
      // New column count.
      cols = Math.max(2, Math.floor(window.innerWidth / CELL_W));
      // New row count.
      rows = Math.max(2, Math.floor(window.innerHeight / CELL_H));
      // Kept inside.
      x = Math.min(x, cols - 1);
      // Kept inside.
      y = Math.min(y, rows - 1);
      // Drawn.
      place();
    };
    // The first frame.
    place();
    // The clock: one cell per tick, reduced motion or not (PRIME 15/11/2026 04:52).
    const id = window.setInterval(step, STEP_MS);
    // The grid follows the window.
    window.addEventListener("resize", onResize);
    // Stopped when turned off or when the page goes.
    return () => {
      // The clock.
      window.clearInterval(id);
      // The listener.
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // The layer: fixed over the viewport, never in the pointer's way, invisible to screen readers.
  return (
    <div className="pong-virus" aria-hidden="true">
      <span ref={ball} className="pong-virus-ball">
        •
      </span>
    </div>
  );
}
