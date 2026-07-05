"use client";

// ============================================================================
// src/components/KeyboardShortcuts.tsx
// ----------------------------------------------------------------------------
// SITE-WIDE KEYBOARD SHORTCUTS (client island, mounted once in the layout).
//
// A single global keydown listener that turns bare letter keys into fast
// navigation, plus the boss key. The shortcuts are:
//
//   b - boss key (hide the page behind a 1980s work app; any key/click exits)
//   t - go to the Tools index
//   l - go to the Learn index
//   m - go to the Mega Brain console (/dev/fun)
//   z - go to Buzzword Bingo (/dev/fun)
//
// SAFETY: the listener is deliberately inert whenever the user is typing. If
// the event target (or the active element) is an <input>, <textarea>, <select>,
// or any contentEditable node, the keystroke belongs to that field and we do
// nothing — the tool paste-boxes, the search field, and every form keep their
// keys. We also ignore any keystroke carrying a modifier (Ctrl/Cmd/Alt/Meta),
// so browser and OS shortcuts (Ctrl+T for a new tab, Cmd+L for the address bar)
// are never shadowed; only unmodified single letters are ours. Keys are matched
// on e.key lowercased, so they work the same with Caps Lock or Shift.
//
// The boss key holds its overlay state here and renders the shared BossApp, so
// it works on every page rather than only inside the Mega Brain console.
// Renders nothing but the (conditional) boss overlay.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import BossApp from "@/components/dev-fun/BossApp";

interface KeyboardShortcutsProps {
  /** Localized "press any key" hint for the boss overlay (server-provided). */
  bossHint: string;
  /** Localized aria-label for the boss dismiss overlay (server-provided). */
  bossDismiss: string;
}

// Does this element own its keystrokes? (i.e. is the user typing into it)
function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export default function KeyboardShortcuts({ bossHint, bossDismiss }: KeyboardShortcutsProps) {
  const router = useRouter();
  const [bossApp, setBossApp] = useState<null | "lotus" | "wordstar">(null);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Never shadow browser/OS chords — only bare letters are ours.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // If the user is typing in a field (or the boss overlay is up, which has
      // its own dismiss listener), stay out of the way.
      if (bossApp) return;
      if (isEditable(e.target) || isEditable(document.activeElement)) return;

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          setBossApp(Math.random() < 0.5 ? "lotus" : "wordstar");
          break;
        case "t":
          e.preventDefault();
          router.push("/tools");
          break;
        case "l":
          e.preventDefault();
          router.push("/learn");
          break;
        case "m":
          e.preventDefault();
          router.push("/dev-fun/mega-brain");
          break;
        case "z":
          e.preventDefault();
          router.push("/dev-fun/meeting-bingo");
          break;
        default:
          break;
      }
    },
    [router, bossApp],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  if (!bossApp) return null;
  return (
    <BossApp
      kind={bossApp}
      onDismiss={() => setBossApp(null)}
      hint={bossHint}
      dismissLabel={bossDismiss}
    />
  );
}
