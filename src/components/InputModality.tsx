"use client";

// ============================================================================
// src/components/InputModality.tsx
// ----------------------------------------------------------------------------
// LAST-INPUT-MODALITY TRACKER.
//
// WHY this exists: the skip-to-content link must appear only for KEYBOARD users
// (when they Tab to it), and stay hidden for mouse users. The browser's native
// :focus-visible heuristic gets this wrong on client-side navigation: Next.js
// moves focus to the top of the new page after a route change, and because that
// focus is programmatic (not tied to a pointerdown on the link), the browser
// classifies it as keyboard focus and shows the skip link, even though the user
// just clicked a nav link with the mouse.
//
// The fix: we track the REAL last input modality ourselves and write it to
// <html data-kbd="0|1">. CSS then reveals the skip link only when data-kbd="1"
// (the user pressed Tab). A mouse click sets it to "0", so the post-navigation
// focus does not reveal the link. With no JS (or before hydration) the attribute
// is absent and the plain :focus rule still works, so keyboard access degrades
// gracefully. Renders nothing.
// ============================================================================

import { useEffect } from "react";

export default function InputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const set = (keyboard: boolean) => {
      root.dataset.kbd = keyboard ? "1" : "0";
    };

    // Assume pointer until proven otherwise. Runs after hydration, before any
    // client navigation (which needs a user interaction), so there is no flash.
    set(false);

    // Only Tab (forward/back) arms the keyboard modality — arrow keys, shortcuts,
    // and typing in fields should not reveal the skip link.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") set(true);
    };
    const onPointerDown = () => set(false);

    // Capture phase so we record the modality before focus handlers run.
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
