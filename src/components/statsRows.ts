// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/components/statsRows.ts  -  how many rows a /stats panel shows at first.
// ----------------------------------------------------------------------------
// PRIME, 01/11/2026: "display the first 13 entries of each stat, followed by an
// 'expand all'. Reason is that currently users need to scroll down *A LOT* to
// get past stats 'Pages served to people' and even see there are additional
// stats below." Shared by StatsPanels and StatsMissing (its own module, so the
// two components do not import each other).
// ============================================================================

/** Rows shown before "Expand all"; a panel with this many rows or fewer shows them all and no button. */
export const STATS_ROWS_SHOWN = 13;

/**
 * After a long list folds back to its first rows, bring its panel's heading back on screen.
 *
 * The reader pressed "Show the first 13" at the bottom of a long list; the rows above vanish and the page would leave
 * them far below the panel, among other panels. When the panel's top has gone above the visible area (or under the
 * sticky header, whose height the page keeps in html's scroll-padding-top), it is scrolled to the start of the view,
 * below the header; a panel already in view is left where it is. Measured on the built page (01/11/2026): with
 * block "nearest" a panel taller than a phone's screen stopped 75 px under the header, title hidden.
 * @param id the panel's element id
 */
export function bringBackIntoView(id: string): void {
  window.requestAnimationFrame(() => { // after the shorter list has rendered
    const el = document.getElementById(id); // the panel
    if (!el) return; // gone (the window changed meanwhile)
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0; // the sticky header's height
    if (el.getBoundingClientRect().top < pad) el.scrollIntoView({ block: "start" }); // its heading, just below the header
  });
}
