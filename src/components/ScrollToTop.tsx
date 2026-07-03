// ============================================================================
// src/components/ScrollToTop.tsx
// ----------------------------------------------------------------------------
// BACK-TO-TOP BUTTON (client island). A small round button fixed in the
// bottom-right corner that fades in once the reader has scrolled roughly one
// viewport down a long index (the /tools and /learn lists), and smooth-scrolls
// the window back to the top on click. Mounted only on those long list pages,
// and additionally self-gated on scroll position, so it never clutters short
// pages. Purely additive progressive enhancement: with no JavaScript it is
// never shown and nothing is lost. Honors prefers-reduced-motion by jumping
// instantly instead of animating the scroll.
// ============================================================================
"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop({ label }: { label: string }) {
  // Whether the button is currently shown (past the scroll threshold).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reveal after ~one screen of scrolling; hide again near the top.
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll(); // sync on mount (e.g. a reload while already scrolled down)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    // Respect reduced-motion: jump instantly rather than animate the scroll.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={`scroll-top-btn${visible ? " is-visible" : ""}`}
      aria-label={label}
      title={label}
      onClick={toTop}
    >
      {/* Chevron-up; decorative (the button carries the aria-label). */}
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
