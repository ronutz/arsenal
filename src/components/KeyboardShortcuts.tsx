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

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import BossApp from "@/components/dev/fun/BossApp";
import { drawBossScreen, type BossScreenKind } from "@/components/dev/fun/boss-screens";
import { resolveBindings, subscribe } from "@/lib/preferences";
import { ACTION_BY_ID, DEFAULT_BINDINGS } from "@/config/shortcuts";
import {
  getPageCapabilities,
  subscribePageCapabilities,
  type PageCapabilitySet,
  type PageCapability,
} from "@/lib/pageCapabilities";
import { manPageToHtml } from "@/lib/manPageMarkdown";

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

  // --- T-DOT: the "." page-context panel ---
  /** Panel title shown above the page's own heading (e.g. "Page actions"). */
  contextTitle: string;
  /** Panel close aria-label. */
  contextClose: string;
  /** Footer hint explaining the "." key. */
  contextHint: string;
  /** Back button label when the inline man page is open. */
  contextBack: string;
  /** Shown while the man page is being fetched. */
  contextLoading: string;
  /** Shown if the man page fails to load. */
  contextError: string;
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

// T-DOT hub-map jump keys: 1-9, then 0, then a-z, in that order. Assigned to the
// panel's family sections by index, so they are ordered and unique by
// construction (no two sections can collide on a key).
const JUMP_KEYS = "1234567890abcdefghijklmnopqrstuvwxyz";

// Sole caller of next-intl's useRouter. Rendered only after mount (client-side),
// so the hook never executes during static prerender. It fills the parent's
// navigate ref with a locale-aware push and renders nothing.
function ShortcutRouterBridge({
  navigateRef,
}: {
  navigateRef: React.MutableRefObject<(path: string) => void>;
}) {
  const router = useRouter();
  useEffect(() => {
    navigateRef.current = (path: string) => router.push(path);
  }, [router, navigateRef]);
  return null;
}

export default function KeyboardShortcuts({ labels }: KeyboardShortcutsProps) {
  // useRouter (next-intl's) must not be called during static prerender: under
  // Next 16 the client hook throws when this component is prerendered to HTML at
  // build time (it has no router context on the server). Navigation is only ever
  // triggered from a keydown handler — i.e. in the browser — so we obtain the
  // navigate function through a ref that an inner, mount-only child fills in.
  // The child <ShortcutRouterBridge> is the sole caller of useRouter, and it is
  // rendered only after mount, so the hook runs exclusively client-side.
  const navigateRef = useRef<(path: string) => void>(() => {});
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [bossScreen, setBossScreen] = useState<BossScreenKind | null>(null);
  const [cheatOpen, setCheatOpen] = useState(false);

  // T-DOT: the "." context panel. `contextOpen` toggles the overlay; `caps` is
  // the current page's capability set (null when the page declares none - then
  // "." is inert). `manPage` holds the inline man-page sub-view when a "man-page"
  // capability is opened: its rendered HTML, plus loading/error flags.
  const [contextOpen, setContextOpen] = useState(false);
  const [caps, setCaps] = useState<PageCapabilitySet | null>(null);
  const [manPage, setManPage] = useState<{
    title: string;
    html: string | null;
    loading: boolean;
    error: boolean;
  } | null>(null);
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

  // T-DOT: track the current page's capability set. <PageCapabilities> writes it
  // on mount and clears it on navigation; we mirror it into state so the panel
  // re-renders. If the page changes while the panel is open (rare - the panel
  // grabs focus), close it so it never shows a stale page's actions.
  useEffect(() => {
    const sync = () => {
      const next = getPageCapabilities();
      setCaps(next);
      if (next === null) {
        setContextOpen(false);
        setManPage(null);
      }
    };
    sync();
    return subscribePageCapabilities(sync);
  }, []);

  // Pick a boss screen using the shared shuffled bag (drawBossScreen) so none
  // is starved and none repeats until the whole set has shown once.
  const openRandomBoss = useCallback(() => {
    setBossScreen(drawBossScreen());
  }, []);

  // T-DOT: open a "man-page" capability inline. Fetches the static Markdown twin
  // (emitted to /<locale>/tools/<slug>.md by gen-machine-legible.mts) and renders
  // it in the panel. Shows loading immediately, then the doc or an error. The doc
  // is our own authored, in-repo content; manPageToHtml escapes every byte before
  // tokenizing, so injecting the result is safe.
  const openManPage = useCallback((cap: PageCapability) => {
    if (!cap.docUrl) return;
    setManPage({ title: cap.label, html: null, loading: true, error: false });
    fetch(cap.docUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((md) => {
        setManPage({ title: cap.label, html: manPageToHtml(md), loading: false, error: false });
      })
      .catch(() => {
        setManPage({ title: cap.label, html: null, loading: false, error: true });
      });
  }, []);

  const runAction = useCallback(
    (actionId: string) => {
      const action = ACTION_BY_ID[actionId];
      if (!action) return;
      if (action.kind === "navigate" && action.path) {
        navigateRef.current(action.path);
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
    [openRandomBoss],
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
      // T-DOT: while the context panel is open it owns the keyboard. Escape steps
      // back out of the inline man page first, then closes the panel.
      if (contextOpen) {
        if (e.key === "Escape") {
          if (manPage) setManPage(null);
          else setContextOpen(false);
          return;
        }
        // T-DOT: press a section's jump key (1-9, 0, a-z) to jump to that family
        // section of the hub-map and close the panel. Keys are index-assigned, so
        // they match the badges shown in the panel exactly. Disabled while a sub
        // man-page is open (that view has its own keys). Chords already returned.
        if (!manPage && e.key.length === 1) {
          const hub = caps?.capabilities.find((c) => c.kind === "hub-map");
          const secs = hub?.sections;
          if (secs && secs.length > 0) {
            const idx = JUMP_KEYS.indexOf(e.key.toLowerCase());
            if (idx >= 0 && idx < secs.length) {
              e.preventDefault();
              setContextOpen(false);
              navigateRef.current(`#${secs[idx].anchor}`);
            }
          }
        }
        return;
      }
      if (isEditable(e.target) || isEditable(document.activeElement)) return;

      // T-DOT: "." opens the page-context panel - but only when the current page
      // registered capabilities. On a page that declares none, "." stays inert so
      // the key is never hijacked. This is handled before the rebindable-shortcut
      // lookup; "." is a dedicated handler, not a rebindable action.
      if (e.key === ".") {
        if (caps && caps.capabilities.length > 0) {
          e.preventDefault();
          setManPage(null);
          setContextOpen(true);
        }
        return;
      }

      // Normalize: letters lowercased; punctuation/digits as-is.
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const actionId = bindings[key];
      if (!actionId) return;
      e.preventDefault();
      runAction(actionId);
    },
    [bindings, bossScreen, cheatOpen, contextOpen, manPage, caps, runAction],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <>
      {mounted && <ShortcutRouterBridge navigateRef={navigateRef} />}
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

      {/* T-DOT: the "." page-context panel. Two views share one card: the
          capability list, and (when a man-page capability is opened) the inline
          documentation with a back button. Clicking the backdrop or the close
          button dismisses the whole panel. */}
      {contextOpen && caps && (
        <div
          className="ctx-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={labels.contextTitle}
          onClick={() => setContextOpen(false)}
        >
          <div className="ctx-card" onClick={(e) => e.stopPropagation()}>
            <div className="ctx-head">
              <div className="ctx-head-titles">
                <p className="ctx-eyebrow mono">{labels.contextTitle}</p>
                <h2 className="ctx-title">{manPage ? manPage.title : caps.title}</h2>
              </div>
              <button
                type="button"
                className="ctx-close"
                onClick={() => setContextOpen(false)}
                aria-label={labels.contextClose}
              >
                ✕
              </button>
            </div>

            {manPage ? (
              // --- inline man-page sub-view ---
              <div className="ctx-manpage">
                <button
                  type="button"
                  className="ctx-back"
                  onClick={() => setManPage(null)}
                >
                  ← {labels.contextBack}
                </button>
                {manPage.loading && (
                  <p className="ctx-manpage-status mono">{labels.contextLoading}</p>
                )}
                {manPage.error && (
                  <p className="ctx-manpage-status ctx-manpage-error mono">
                    {labels.contextError}
                  </p>
                )}
                {manPage.html !== null && (
                  <div
                    className="ctx-manpage-body"
                    // Safe: our own in-repo docs, fully HTML-escaped before tokenizing.
                    dangerouslySetInnerHTML={{ __html: manPage.html }}
                  />
                )}
              </div>
            ) : (
              // --- capability list ---
              <ul className="ctx-list">
                {caps.capabilities.map((cap) => (
                  <li key={cap.id} className="ctx-item">
                    {cap.kind === "man-page" ? (
                      <button
                        type="button"
                        className="ctx-action"
                        onClick={() => openManPage(cap)}
                      >
                        <span className="ctx-action-label">{cap.label}</span>
                        {cap.detail && <span className="ctx-action-detail">{cap.detail}</span>}
                      </button>
                    ) : cap.kind === "hub-map" ? (
                      <div className="ctx-hubmap">
                        <p className="ctx-action-label">{cap.label}</p>
                        {cap.detail && <p className="ctx-action-detail">{cap.detail}</p>}
                        <ul className="ctx-hubmap-list">
                          {(cap.sections ?? []).map((s, i) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                className="ctx-hubmap-link"
                                onClick={() => {
                                  setContextOpen(false);
                                  navigateRef.current(`#${s.anchor}`);
                                }}
                              >
                                <span className="ctx-hubmap-main">
                                  {JUMP_KEYS[i] && (
                                    <kbd className="ctx-hubmap-key">{JUMP_KEYS[i]}</kbd>
                                  )}
                                  <span className="ctx-hubmap-label">{s.label}</span>
                                </span>
                                <span className="ctx-hubmap-count mono">{s.toolCount}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : cap.kind === "link" && cap.href ? (
                      <button
                        type="button"
                        className="ctx-action"
                        onClick={() => {
                          setContextOpen(false);
                          navigateRef.current(cap.href as string);
                        }}
                      >
                        <span className="ctx-action-label">{cap.label}</span>
                        {cap.detail && <span className="ctx-action-detail">{cap.detail}</span>}
                      </button>
                    ) : (
                      // legend: descriptive, non-actioning row
                      <div className="ctx-legend">
                        <span className="ctx-action-label">{cap.label}</span>
                        {cap.detail && <span className="ctx-action-detail">{cap.detail}</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="ctx-hint mono">{labels.contextHint}</p>
          </div>
        </div>
      )}
    </>
  );
}
