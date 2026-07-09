// ============================================================================
// src/lib/pageCapabilities.ts
// ----------------------------------------------------------------------------
// THE PAGE-CAPABILITY REGISTRY (T-DOT, phase 1).
//
// The site has ONE global keyboard island (src/components/KeyboardShortcuts.tsx)
// mounted once in the locale layout; it owns the bare-key shortcuts and the boss
// key. T-DOT adds a dedicated "." handler to that island which opens a CONTEXT
// PANEL listing the capabilities of the page the user is currently on.
//
// But capabilities are PER PAGE, and most pages here are React Server Components
// (the tool page, the vendor hub, the boss screen host) - they cannot talk to a
// client island through props or context across the RSC boundary. So we use the
// same idiom the shortcuts store already uses: a tiny MODULE-LEVEL store that a
// small client component writes into on mount and clears on unmount, and that the
// island reads (and subscribes to) on the client.
//
// FLOW.
//   1. A page renders <PageCapabilities caps={[...]} /> (a client component).
//   2. On mount that component calls setPageCapabilities(caps); on unmount, or on
//      a route change that unmounts it, it calls clearPageCapabilities().
//   3. The island subscribes; when the user presses ".", it reads the current set
//      and renders the panel. No capabilities registered -> "." is inert, so the
//      key is never hijacked on a page that declares nothing.
//
// This store is intentionally trivial (no React, no localStorage): it is transient
// per-page UI state, recreated on every navigation. It exists only in the browser
// at runtime; on the server getPageCapabilities() simply returns the empty array.
// ============================================================================

/**
 * A single capability a page exposes to the "." context panel.
 *
 * `kind` selects how the panel renders and what activating the item does:
 *   - "man-page": open the tool's D-77 documentation inline in the panel. The
 *     panel fetches the static Markdown twin emitted to /<locale>/tools/<slug>.md
 *     (by scripts/gen-machine-legible.mts) and renders it. Only en/pt-BR tool
 *     pages carry this, matching the locales for which a D-77 doc exists.
 *   - "hub-map": show a map of a vendor hub - its ordered family sections, each
 *     linking to the matching anchor on the hub page. Populated from the same
 *     config the hub itself uses, so it never drifts.
 *   - "legend": a non-actioning descriptive row - "here is what this screen's
 *     controls do". Used by the mega-brain boss screen to explain its dots.
 *   - "link": a plain in-app navigation to `href` (locale-aware path).
 */
export type PageCapabilityKind = "man-page" | "hub-map" | "legend" | "link";

/** One section of a vendor hub, for the "hub-map" capability. */
export interface HubMapSection {
  /** Stable sub-category id (matches config/vendors VENDOR_SUBS). */
  readonly id: string;
  /** Already-localized section label. */
  readonly label: string;
  /** Anchor id on the hub page to jump to (e.g. "sub-ltm"). */
  readonly anchor: string;
  /** How many tools sit in this section (0 sections are omitted by the builder). */
  readonly toolCount: number;
}

export interface PageCapability {
  /** Stable id, unique within a page's capability set (used as the React key). */
  readonly id: string;
  /** What activating this capability does / how the panel renders it. */
  readonly kind: PageCapabilityKind;
  /** Already-localized primary label shown in the panel. */
  readonly label: string;
  /** Already-localized secondary line (the description under the label). */
  readonly detail?: string;

  // --- kind-specific payload (only the field for this kind is set) ---

  /** man-page: the URL of the static Markdown doc to fetch and render inline. */
  readonly docUrl?: string;
  /** hub-map: the ordered, already-localized family sections of the hub. */
  readonly sections?: readonly HubMapSection[];
  /** link: a locale-aware in-app path to navigate to. */
  readonly href?: string;
}

/**
 * The capability set for the CURRENT page. A page type may want a short heading
 * over its capabilities (e.g. the tool's own name); `title` carries that. Both
 * fields are already localized by the caller - this store never touches i18n.
 */
export interface PageCapabilitySet {
  /** Already-localized panel heading (e.g. the tool name, or "This hub"). */
  readonly title: string;
  /** The capabilities, in the order the panel should list them. */
  readonly capabilities: readonly PageCapability[];
}

// ---- The store -------------------------------------------------------------
// A single current value plus a subscriber set. Mirrors the minimal pub/sub in
// src/lib/preferences.ts so the island can treat both the same way.

let current: PageCapabilitySet | null = null;
const listeners = new Set<() => void>();

/** Publish the current page's capability set. Called by <PageCapabilities>. */
export function setPageCapabilities(set: PageCapabilitySet): void {
  current = set;
  listeners.forEach((fn) => fn());
}

/** Clear the current set (page unmounted / navigated away). */
export function clearPageCapabilities(): void {
  if (current === null) return;
  current = null;
  listeners.forEach((fn) => fn());
}

/** Read the current set, or null when the page declares no capabilities. */
export function getPageCapabilities(): PageCapabilitySet | null {
  return current;
}

/** Subscribe to changes; returns an unsubscribe function. */
export function subscribePageCapabilities(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
