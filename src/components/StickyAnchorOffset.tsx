// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/StickyAnchorOffset.tsx
// ----------------------------------------------------------------------------
// EVERY IN-PAGE JUMP LANDS BELOW THE STICKY BARS (PRIME 2026-10-27 00:42: "the
// title of the item and the initial text lines end up under the top navigation
// bar", e.g. /study-guides/#http-evolution).
//
// The site header is sticky on wide screens (65 px tall on a desktop, measured
// on the live site on 27/10/2026) and static below 48rem, where it wraps to
// several rows (150 px at 390 px) and scrolls away with the page; and
// some pages add a sticky bar under it (the tools and learn filter docks, the
// glossary A-Z rail, the timeline and people filters). The old fix was a
// scroll-margin typed per component (5rem here, 9.5rem there), so any anchor
// without one landed under the header, and the typed values were wrong on a
// phone anyway.
//
// This island measures the real stack and publishes two custom properties on
// <html>:
//   --site-header-height   the header's height, which the sticky bars use as
//                          their `top`, so a bar sits under the header, not
//                          behind it, however many rows the header wraps to;
//   --sticky-stack         the header plus the tallest sticky bar on the page,
//                          which `html { scroll-padding-top }` uses, so EVERY
//                          fragment jump, link click and scrollIntoView stops
//                          with its target below the bars.
// It re-measures whenever the header or a bar changes size (a menu wraps, a
// filter opens) and on every client-side navigation. When the page was opened
// at a #fragment, the browser has already scrolled before this ran, with the
// stylesheet's fallback offset; the island scrolls that target once more with
// the measured one. Without JavaScript the stylesheet's fallbacks apply.
// ============================================================================
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** The sticky bars that sit directly under the header (their `top` is the header's height). */
const STICKY_BARS = ".vendor-filter-dock, .nav-utility-bar, .gloss-az, .timeline-filter, .people-filter";

export default function StickyAnchorOffset() {
  // The current path: a new page may carry other bars, so the measuring starts again on each navigation.
  const pathname = usePathname();

  useEffect(() => {
    // The document root, where the two properties live.
    const root = document.documentElement;
    // The site header; without one there is nothing to clear.
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    // The page's sticky bars, found once per page.
    const bars = Array.from(document.querySelectorAll<HTMLElement>(STICKY_BARS));

    // Measure the header and the tallest bar, and publish both values in whole pixels.
    const measure = () => {
      // The header as drawn, rows and all; 0 when it scrolls away (below 48rem it is static, components.css).
      const position = getComputedStyle(header).position;
      const headerHeight = position === "sticky" || position === "fixed" ? Math.ceil(header.getBoundingClientRect().height) : 0;
      // The tallest bar (bars share the same `top`, so they overlap rather than stack); 0 when there is none.
      const barHeight = bars.reduce((max, el) => Math.max(max, Math.ceil(el.getBoundingClientRect().height)), 0);
      // The bars sit under the header.
      root.style.setProperty("--site-header-height", `${headerHeight}px`);
      // Jumps clear the header and the bar.
      root.style.setProperty("--sticky-stack", `${headerHeight + barHeight}px`);
    };

    // First measurement, before anything else reads the values.
    measure();
    // Watch the header and every bar for a change of size.
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    bars.forEach((el) => observer.observe(el));

    // A page opened at a #fragment: scroll its target again, now that the offset is the measured one.
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    // Whether the reader has scrolled by themselves since; their position then wins over ours.
    let readerMoved = false;
    const onReaderMove = () => {
      readerMoved = true;
    };
    // Wheel, touch and keys are the reader's own scrolling (our scrollIntoView fires none of them).
    window.addEventListener("wheel", onReaderMove, { passive: true, once: true });
    window.addEventListener("touchmove", onReaderMove, { passive: true, once: true });
    window.addEventListener("keydown", onReaderMove, { once: true });
    // The re-scroll itself, skipped once the reader has moved.
    const rescroll = () => {
      if (target && !readerMoved) target.scrollIntoView({ block: "start" });
    };
    // One frame later, so the new properties have been applied to layout.
    const frame = target ? requestAnimationFrame(rescroll) : 0;
    // Once more when the page has finished loading (fonts and images can push the target down after the first jump).
    const lateLoad = target && document.readyState !== "complete";
    if (lateLoad) window.addEventListener("load", rescroll, { once: true });

    // Stop watching when the page goes away.
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (lateLoad) window.removeEventListener("load", rescroll);
      window.removeEventListener("wheel", onReaderMove);
      window.removeEventListener("touchmove", onReaderMove);
      window.removeEventListener("keydown", onReaderMove);
    };
  }, [pathname]);

  // Nothing to draw: the island only measures.
  return null;
}
