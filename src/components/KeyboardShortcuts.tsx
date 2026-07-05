"use client";

// ============================================================================
// src/components/KeyboardShortcuts.tsx
// ----------------------------------------------------------------------------
// SITE-WIDE KEYBOARD SHORTCUTS (client island, mounted once in the layout).
//
// A single global keydown listener that maps bare single keys to actions. The
// bindings are NOT hard-coded here: they come from the preferences engine
// (src/lib/preferences.ts), which merges the sysadmin policy + the user's saved
// overrides + the registry defaults (src/config/shortcuts.ts). This component
// just resolves "what action is this key" and runs it. Rebinding a key in the
// settings UI, or the operator locking/forcing a key, is reflected here live
// because we subscribe to the store.
//
// Action kinds:
//   - navigate: push a locale-relative path via the i18n router.
//   - command:  a built-in behavior handled here —
//       search-overlay / focus-search  -> open the ONE existing Pagefind search
//         (src/components/Search.tsx) by dispatching ronutz:open-search, so we
//         reuse that search UI instead of building a parallel one.
//       cheat-sheet -> open the shortcuts help overlay (makes the whole system
//         discoverable; a near-universal "?" convention).
//       boss-key -> hide the page behind a 1980s work app (the shared BossApp),
//         working on every page rather than only inside the Mega Brain console.
//
// SAFETY (unchanged and central): the listener is inert while the user is
// typing — if the event target or the active element is an <input>, <textarea>,
// <select>, or contentEditable node, the keystroke belongs to that field. It is
// also inert when any modifier (Ctrl/Cmd/Alt/Meta) is held, so browser/OS chords
// (Ctrl+T, Cmd+L, Cmd/Ctrl+K for search) are never shadowed. Only unmodified
// single keys are ours; matched on e.key (lowercased for letters).
//
// ESC: dismissal is centralized in spirit — each popup owns its own Esc/click
// handler (BossApp installs its own; Search handles Escape; the cheat-sheet
// overlay below handles Escape). This component makes sure `?`/boss/search all
// route through those popups so Esc closes whatever is up.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import BossApp from "@/components/dev-fun/BossApp";
import { drawBossScreen, type BossScreenKind } from "@/components/dev-fun/boss-screens";
import { resolveBindings, subscribe } from "@/lib/preferences";
import { ACTION_BY_ID, DEFAULT_BINDINGS } from "@/config/shortcuts";

export interface ShortcutsLabels {
  /** Boss overlay "press any key" hint. */
  bossHint: string;
  /** Boss overlay dismiss aria-label. */
  bossDismiss: string;
  /** Cheat-sheet overlay title. */
  cheatTitle: string;
  /** Cheat-sheet close aria-label. */
  cheatClose: string;
  /** Cheat-sheet footer hint (how to customize / dismiss). */
  cheatHint: string;
  /** Localized action label per action id (for the cheat-sheet rows). */
  actionLabels: Record<string, string>;
}

interface KeyboardShortcutsProps {
  labels: ShortcutsLabels;
}

// Is the user typing into this element? (then the key is not ours)
function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

// Pretty label for a key on the cheat-sheet (e.g. "/" stays "/", letters upper).
function keyLabel(key: string): string {
  if (key.length === 1 && /[a-z]/.test(key)) return key.toUpperCase();
  return key;
}

export default function KeyboardShortcuts({ labels }: KeyboardShortcutsProps) {
  const router = useRouter();
  const [bossScreen, setBossScreen] = useState<BossScreenKind | null>(null);
  const [cheatOpen, setCheatOpen] = useState(false);
  // Effective bindings, kept in sync with the store (settings UI edits, policy).
  const [bindings, setBindings] = useState<Record<string, string>>(DEFAULT_BINDINGS);

  // Read the resolved bindings on mount and whenever the store changes (same
  // tab via subscribe, other tabs via the native storage event).
  useEffect(() => {
    const refresh = () => setBindings(resolveBindings());
    refresh();
    const unsub = subscribe(refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ronutz-shortcuts" || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Pick a boss screen using the shared shuffled bag (drawBossScreen) so none
  // is starved and none repeats until the whole set has shown once.
  const openRandomBoss = useCallback(() => {
    setBossScreen(drawBossScreen());
  }, []);

  const runAction = useCallback(
    (actionId: string) => {
      const action = ACTION_BY_ID[actionId];
      if (!action) return;
      if (action.kind === "navigate" && action.path) {
        router.push(action.path);
        return;
      }
      if (action.kind === "command") {
        switch (action.command) {
          case "search-overlay":
          case "focus-search":
            window.dispatchEvent(new Event("ronutz:open-search"));
            break;
          case "cheat-sheet":
            setCheatOpen((v) => !v);
            break;
          case "boss-key":
            openRandomBoss();
            break;
        }
      }
    },
    [router, openRandomBoss],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; // never shadow chords
      // Popups own their own Esc; if one is up, don't also fire shortcuts.
      if (bossScreen) return;
      if (cheatOpen) {
        if (e.key === "Escape") setCheatOpen(false);
        return;
      }
      if (isEditable(e.target) || isEditable(document.activeElement)) return;

      // Normalize: letters lowercased; punctuation/digits as-is.
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const actionId = bindings[key];
      if (!actionId) return;
      e.preventDefault();
      runAction(actionId);
    },
    [bindings, bossScreen, cheatOpen, runAction],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <>
      {bossScreen && (
        <BossApp
          kind={bossScreen}
          onDismiss={() => setBossScreen(null)}
          onNavigate={(k) => setBossScreen(k)}
          hint={labels.bossHint}
          dismissLabel={labels.bossDismiss}
        />
      )}
      {cheatOpen && (
        <div
          className="kbd-cheat-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={labels.cheatTitle}
          onClick={() => setCheatOpen(false)}
        >
          <div className="kbd-cheat-card" onClick={(e) => e.stopPropagation()}>
            <div className="kbd-cheat-head">
              <h2 className="kbd-cheat-title">{labels.cheatTitle}</h2>
              <button
                type="button"
                className="kbd-cheat-close"
                onClick={() => setCheatOpen(false)}
                aria-label={labels.cheatClose}
              >
                ✕
              </button>
            </div>
            <ul className="kbd-cheat-list">
              {Object.entries(bindings).map(([key, actionId]) => (
                <li key={key} className="kbd-cheat-row">
                  <kbd className="kbd-cheat-key mono">{keyLabel(key)}</kbd>
                  <span className="kbd-cheat-action">
                    {labels.actionLabels[actionId] ?? actionId}
                  </span>
                </li>
              ))}
            </ul>
            <p className="kbd-cheat-hint mono">{labels.cheatHint}</p>
          </div>
        </div>
      )}
    </>
  );
}
