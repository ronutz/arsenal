// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/glossary/GlossaryRailFocus.tsx
// ----------------------------------------------------------------------------
// THE CURRENT LETTER IN VIEW (client island on the letter pages; PRIME 16/11/2026 04:27, splitting the glossary page).
//
// At phone width the A to Z rail between pages is one line that scrolls sideways (components.css, .gloss-letters), so
// on the S page the S box would start offscreen, past A to H. This scrolls that line, and only that line (never the
// page), so the current letter sits in view with a little of the letters before it. Renders nothing.
// ============================================================================
"use client";

import { useEffect } from "react";

export default function GlossaryRailFocus() {
  useEffect(() => {
    const current = document.querySelector<HTMLElement>(".gloss-letters .gloss-letter.is-current"); // this page's letter
    const row = current?.closest<HTMLElement>(".gloss-letters-list"); // its scrolling line
    if (!current || !row || row.scrollWidth <= row.clientWidth) return; // nothing to scroll: the rail wraps or fits
    const c = current.getBoundingClientRect(); // the box's place
    const r = row.getBoundingClientRect(); // the line's place
    row.scrollLeft += c.left - r.left - (r.width - c.width) / 2; // centred in the line
  }, []);
  return null; // nothing to draw
}
