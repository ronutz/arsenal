// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/crashRecovery.ts
// ----------------------------------------------------------------------------
// WHAT A PAGE DOES WHEN SOMETHING IN IT FAILS IN THE BROWSER (PRIME 11/11/2026
// 23:53: Phish or Legit ended in Next's bare "Application error: a client-side
// exception has occurred" on Chrome for iPhone, after a few rounds).
//
// Two kinds of failure reach an error boundary:
//   - a piece of the page's code that cannot be loaded: the page was open when
//     a new version of the site was published, and the old version's files it
//     asks for are gone (webpack's ChunkLoadError, or the browser's own words
//     for a failed dynamic import). Reloading fetches the new version and
//     fixes it, so the boundary reloads once, by itself;
//   - anything else (a bug): the boundary shows what failed, in words, with a
//     way to try again and a way to reload, instead of a blank page.
// The one automatic reload is remembered for the session (per address), so a
// page that fails again right after it shows its message rather than looping.
// ============================================================================

/** The session key that remembers the last automatic reload: the address and when. */
const RELOAD_KEY = "ronutz:crash-reload";

/** How long after an automatic reload a second failure on the same address is shown instead of reloading again, in ms. */
const RELOAD_WINDOW_MS = 60_000;

/** The words browsers and webpack use for a piece of code that could not be loaded. */
const CHUNK_PATTERNS: readonly RegExp[] = [
  // webpack (Next's client): "Loading chunk 123 failed." and "Loading CSS chunk 123 failed."
  /Loading (CSS )?chunk [\w./-]+ failed/i,
  // Chromium: a dynamic import() that could not be fetched.
  /Failed to fetch dynamically imported module/i,
  // Safari and every iOS browser (WebKit): the same failure in its words.
  /Importing a module script failed/i,
  // Firefox: the same failure in its words.
  /error loading dynamically imported module/i,
];

/**
 * Whether an error is a piece of code that could not be loaded (a newer version of the site replaced the old files).
 *
 * @param error what the boundary caught
 * @returns true for a load failure that a reload fixes
 */
export function isChunkError(error: unknown): boolean {
  // Only errors (or error-like objects) carry a name and a message.
  if (!error || typeof error !== "object") return false;
  // Its name, when it has one.
  const name = (error as { name?: unknown }).name;
  // webpack names it outright.
  if (name === "ChunkLoadError") return true;
  // Its message, when it has one.
  const message = (error as { message?: unknown }).message;
  // Otherwise the browser's own words decide.
  return typeof message === "string" && CHUNK_PATTERNS.some((re) => re.test(message));
}

/**
 * Reload the page once for a load failure; a second failure on the same address soon after is left to the message.
 *
 * @returns true when a reload was started (the caller shows a short "reloading" line meanwhile)
 */
export function reloadOnce(): boolean {
  // Never on the server.
  if (typeof window === "undefined") return false;
  // The address being reloaded.
  const here = window.location.pathname + window.location.search;
  // Session storage can be missing or refuse (private modes, blocked site data): then no automatic reload, so no loop.
  try {
    // The last automatic reload, if any.
    const last = window.sessionStorage.getItem(RELOAD_KEY);
    // Its parts: "address|milliseconds".
    if (last) {
      // Split once at the last bar (an address can hold one).
      const cut = last.lastIndexOf("|");
      // The address and the time.
      const addr = last.slice(0, cut);
      const at = Number(last.slice(cut + 1));
      // The same address, reloaded a moment ago: this failure is not cured by reloading, so it is shown.
      if (addr === here && Number.isFinite(at) && Date.now() - at < RELOAD_WINDOW_MS) return false;
    }
    // Remembered before reloading.
    window.sessionStorage.setItem(RELOAD_KEY, `${here}|${Date.now()}`);
  } catch {
    // No session storage: show the message instead.
    return false;
  }
  // The new version of the page.
  window.location.reload();
  // Reloading.
  return true;
}

/**
 * The error in one line, as shown under "Error details": its name and message, or what it says of itself.
 *
 * @param error what the boundary caught
 * @returns a short plain-text description
 */
export function describeError(error: unknown): string {
  // A real error: "TypeError: Cannot read properties of undefined (reading 'name')".
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  // Anything else thrown: as text, at most a few hundred characters.
  try {
    // Its text.
    return String(error).slice(0, 500);
  } catch {
    // Not even that.
    return "Unknown error";
  }
}
