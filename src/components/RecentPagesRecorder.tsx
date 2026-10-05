"use client";

// ============================================================================
// src/components/RecentPagesRecorder.tsx
// ----------------------------------------------------------------------------
// THE LOCAL TRAIL BEHIND "CONTINUE WHERE YOU LEFT OFF" (2026-10-05, home page
// review item 19, PRIME's decision). A privacy-first site can still offer the
// one piece of personalisation that costs nothing: remembering, in the
// reader's own browser and nowhere else, the last few pages they opened, so
// the front door can offer them again. This component runs on every page,
// after hydration, and writes {path, title, at} for the current page into
// localStorage under one key, newest first, six at most, skipping the home
// page itself, the private surfaces and anything without a title. Nothing is
// read by any server; the Worker never sees it; clearing site data clears it.
// A browser that refuses storage (private mode, blocked) is left alone.
// ============================================================================

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/** The storage key, versioned so a future shape change can start clean. */
export const RECENT_KEY = "ronutz:recent:v1";
/** How many pages are kept. */
const KEEP = 6;

/** One remembered page. */
export interface RecentPage { path: string; title: string; at: number }

/** Paths never recorded: the front door (it is where the list is shown), the private surfaces, search-engine fragments. */
function skip(path: string): boolean {
  return path === "/" || path === "" || /^\/(admin1029384756|copy8825140637)(\/|$)/.test(path);
}

export default function RecentPagesRecorder() {
  // The locale-free path next-intl's navigation reports for this page.
  const pathname = usePathname();
  useEffect(() => {
    if (skip(pathname)) return;
    // One macrotask later, so a client-side navigation has committed its new <title> before it is read.
    const timer = window.setTimeout(() => {
      try {
        // The page title without the site suffix, so the list reads as the page did.
        const title = document.title.replace(/\s*[·|]\s*ronutz.*$/i, "").trim();
        if (!title) return;
        const raw = window.localStorage.getItem(RECENT_KEY);
        const prev: RecentPage[] = raw ? (JSON.parse(raw) as RecentPage[]) : [];
        // Newest first; a revisit moves the page to the top rather than duplicating it.
        const next = [{ path: pathname, title, at: Date.now() }, ...prev.filter((p) => p && p.path !== pathname)].slice(0, KEEP);
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable or refused: the feature simply does not exist in this browser */
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  // Nothing to render: a side effect only.
  return null;
}
