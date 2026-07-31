"use client";

// ============================================================================
// src/components/SuppressLetterShortcuts.tsx
// ----------------------------------------------------------------------------
// Mount this on any page that listens for a typed sequence of its own.
//
// WHY IT EXISTS. The site binds single letters to navigation - "f" goes to
// /dev/fun - which does not merely compete with a typed code, it makes one
// containing that letter IMPOSSIBLE: the page navigates away before the next
// key can arrive. IDKFA could never be completed on any page.
//
// While mounted, the shortcut island ignores single-letter bindings. It leaves
// punctuation alone, so search, help and the context panel still work, and it
// restores the letters on unmount, so leaving the page returns the keyboard to
// normal.
// ============================================================================

import { useEffect } from "react";
import { setLetterShortcutsSuppressed } from "@/lib/pageCapabilities";

export default function SuppressLetterShortcuts() {
  useEffect(() => {
    setLetterShortcutsSuppressed(true);
    return () => setLetterShortcutsSuppressed(false);
  }, []);
  return null;
}
