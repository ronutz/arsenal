"use client";

// ============================================================================
// src/components/SkipLink.tsx
// ----------------------------------------------------------------------------
// THE ONE SKIP-TO-CONTENT LINK (Round 1 RT04, 2026-10-20).
//
// WHY it lives in the shell: until this date every page rendered its own copy
// of the link before <Header />, and the pages that forgot it (the /dev rooms,
// /stats, /settings, the ASN and RDAP lookups) had none, which the production
// audit of 19 October 2026 found. The locale layout now renders this link once,
// as the first focusable element of <body>, ahead of the Portuguese notice and
// of the header, so every page that renders inside the layout has it and a new
// page cannot forget it. Every page already carries one <main id="main">; that
// id is the target, so nothing per page has to change for the link to work.
//
// WHAT a click does: the plain href="#main" still works with no JavaScript (the
// browser jumps to the fragment). With JavaScript, the handler moves FOCUS, not
// just the scroll position: it gives <main> tabindex="-1" when it has none (a
// programmatic-focus target that never joins the Tab order), focuses it without
// the browser's own scroll, and then scrolls only if the top of <main> would sit
// under the sticky site header, so the content is never hidden behind it. The
// scroll is instant, never animated, which also honours reduced motion.
//
// Visibility on focus is the existing .skip-link rule in globals.css, revealed
// for keyboard users by InputModality (data-kbd on <html>); no new CSS.
// ============================================================================

import { useCallback } from "react";
import type { MouseEvent } from "react";

/** The id every page gives its single <main> landmark (the skip target). */
const MAIN_ID = "main";

export default function SkipLink({ label }: {
  /** The localized link text ("Skip to content"), resolved by the server layout from the nav namespace. */
  label: string;
}) {
  /** Move focus (and, only if needed, the scroll position) to the page's main landmark. */
  const onClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // The page's main landmark: the agreed id first, any <main> as a second chance.
    const target: HTMLElement | null = document.getElementById(MAIN_ID) ?? document.querySelector("main");
    // No target at all: leave the browser's own fragment behaviour alone.
    if (!target) return;
    // From here the handler does the work instead of the fragment jump.
    e.preventDefault();
    // A landmark is not focusable by default: tabindex -1 makes it a focus target without adding a Tab stop.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    // Focus first, without the browser's scroll, so the scroll below is the only movement.
    target.focus({ preventScroll: true });
    // The bottom edge of the sticky header (0 when a page has none), the line content must clear.
    const header = document.querySelector<HTMLElement>(".site-header");
    // Clamp at zero: a header scrolled out of view does not cover anything.
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    // Where the top of main sits in the viewport right now.
    const top = target.getBoundingClientRect().top;
    // Hidden under the header, or below the fold: bring its top to just under the header.
    if (top < headerBottom || top > window.innerHeight) {
      // Instant, never smooth: a bypass should not animate, and reduced-motion readers get no motion at all.
      window.scrollBy({ top: top - headerBottom, behavior: "instant" });
    }
  }, []);

  return (
    // data-pagefind-ignore keeps "Skip to content" out of every search excerpt, as the per-page copies did.
    <a href={`#${MAIN_ID}`} className="skip-link" data-pagefind-ignore onClick={onClick}>
      {label}
    </a>
  );
}
