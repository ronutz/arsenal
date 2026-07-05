// ============================================================================
// src/lib/preferences.ts
// ----------------------------------------------------------------------------
// THE PREFERENCES ENGINE (client-side, localStorage-backed).
//
// One place that owns the user's persisted preferences that are NOT already
// handled elsewhere:
//   - custom keyboard-shortcut bindings (key -> action id)
//   - preferred language (a locale code, e.g. "pt-BR")
//
// (Theme already has its own long-standing localStorage key, `ronutz-theme`,
// applied before paint by an inline script in the layout; we deliberately do
// NOT move it, to avoid touching the no-flash theme path. This engine sits
// alongside it.)
//
// WHY localStorage: ARSENAL has no server and no accounts, exactly like the
// theme system. That means preferences live only in THIS browser: they do not
// sync across devices, and clearing site data resets them. That is the correct
// trade for a privacy-first site — the same one theme already makes — and it is
// documented for users on the privacy/site-behavior page.
//
// The sysadmin POLICY (src/config/shortcuts.ts) always wins over a user
// override: a forced key ignores any saved binding; a locked key cannot be
// rebound. resolveBindings() applies that precedence so callers never have to.
//
// Everything here is guarded for SSR / private mode: on the server (no window)
// and when localStorage throws, reads return defaults and writes no-op.
// ============================================================================

import {
  DEFAULT_BINDINGS,
  KEY_POLICY,
  ACTION_BY_ID,
  isKeyCustomizable,
  type ShortcutAction,
} from "@/config/shortcuts";

const BINDINGS_KEY = "ronutz-shortcuts"; // JSON: { "<key>": "<actionId>" }
const LANG_KEY = "ronutz-lang"; // string: a locale code

// ---- low-level storage helpers (SSR- and private-mode-safe) ----------------

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: silently skip persistence; session still works */
  }
}

// ---- shortcut bindings -----------------------------------------------------

/** Raw user overrides as saved (may include keys later locked by policy). */
export function getUserBindings(): Record<string, string> {
  const raw = readJSON<Record<string, string>>(BINDINGS_KEY, {});
  // Drop any entry whose action id no longer exists (registry changed).
  const clean: Record<string, string> = {};
  for (const [k, actionId] of Object.entries(raw)) {
    if (ACTION_BY_ID[actionId]) clean[k] = actionId;
  }
  return clean;
}

/**
 * The EFFECTIVE binding for every key, applying policy precedence:
 *   forced policy  >  user override (only if key customizable)  >  default.
 * Returns key -> action id.
 */
export function resolveBindings(): Record<string, string> {
  const user = getUserBindings();
  const out: Record<string, string> = {};
  for (const [key, defAction] of Object.entries(DEFAULT_BINDINGS)) {
    const policy = KEY_POLICY[key];
    if (policy?.forced && ACTION_BY_ID[policy.forced]) {
      out[key] = policy.forced; // forced wins outright
    } else if (isKeyCustomizable(key) && user[key]) {
      out[key] = user[key]; // user override (only when allowed)
    } else {
      out[key] = defAction; // default
    }
  }
  return out;
}

/** Resolve a key straight to its action object (or null). */
export function actionForKey(key: string): ShortcutAction | null {
  const id = resolveBindings()[key];
  return id ? ACTION_BY_ID[id] ?? null : null;
}

/**
 * Set (or clear) a user override for a key. No-ops if the key is not
 * customizable under policy. Passing null/"" clears the override (reverting to
 * default). Persists and notifies subscribers.
 */
export function setUserBinding(key: string, actionId: string | null): void {
  if (!isKeyCustomizable(key)) return;
  const current = getUserBindings();
  if (!actionId) {
    delete current[key];
  } else if (ACTION_BY_ID[actionId]) {
    current[key] = actionId;
  } else {
    return; // unknown action id — ignore
  }
  writeJSON(BINDINGS_KEY, current);
  notify();
}

/** Clear ALL user overrides (revert every customizable key to default). */
export function resetBindings(): void {
  writeJSON(BINDINGS_KEY, {});
  notify();
}

// ---- language preference ---------------------------------------------------

/** The saved preferred locale, or null if none saved. */
export function getPreferredLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

/** Save the preferred locale. Persists and notifies subscribers. */
export function setPreferredLanguage(locale: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANG_KEY, locale);
  } catch {
    /* private mode: skip */
  }
  notify();
}

// ---- change notification ---------------------------------------------------
// A tiny pub/sub so the settings UI and the live shortcut listener re-read the
// store when it changes (in the same tab). Cross-tab sync also arrives via the
// native `storage` event, which subscribers may listen to separately.

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* a broken subscriber must not break the others */
    }
  }
}
