// ============================================================================
// src/config/shortcuts.ts
// ----------------------------------------------------------------------------
// KEYBOARD-SHORTCUT REGISTRY + SYSADMIN POLICY (the authoritative layer).
//
// This file is the single source of truth for the site-wide keyboard shortcuts.
// It defines, in order:
//
//   1. ACTIONS   — every thing a shortcut can DO (navigate somewhere, open the
//                  search overlay, open the shortcut cheat-sheet, etc.). This is
//                  also the list the user picks from when rebinding a key.
//   2. DEFAULTS  — which key is bound to which action out of the box.
//   3. POLICY    — the sysadmin layer: per-key rules that the OPERATOR (PRIME,
//                  at deploy time) controls. Because ARSENAL has no server, the
//                  "sysadmin" is whoever edits this file and redeploys; there is
//                  no live admin panel. Per key the operator can:
//                    - lock a key so users cannot rebind it (`locked: true`)
//                    - force a key to a specific action regardless of any user
//                      setting (`forced: "<actionId>"`) — implies locked
//                    - otherwise leave it user-customizable (the default)
//                  The operator can lock/force one key, many keys, or all keys
//                  (see POLICY_ALL_LOCKED as a ready example), and can allow or
//                  disallow customization per key or per set. This is the whole
//                  "flexible and open" system PRIME asked for, expressed as data.
//
// The runtime resolver (src/lib/preferences.ts) merges: forced policy > user
// override (only if the key is customizable) > default. Nothing here reaches
// into localStorage; this file is static config compiled into the build.
// ============================================================================

// ---- Action catalogue ------------------------------------------------------
// An action is either a navigation to an in-app path, or a special "command"
// the shortcut layer handles itself (search overlay, cheat-sheet, focus search).
// `kind` lets the resolver and the settings UI treat them differently.

export type ShortcutActionKind = "navigate" | "command";

export interface ShortcutAction {
  /** Stable id — referenced by bindings, policy, and saved user overrides. */
  id: string;
  kind: ShortcutActionKind;
  /** For kind==="navigate": the locale-relative path to push (e.g. "/tools"). */
  path?: string;
  /**
   * For kind==="command": which built-in behavior to run. The KeyboardShortcuts
   * component switches on this. Kept as a closed union so the component and the
   * registry cannot drift.
   */
  command?: "search-overlay" | "cheat-sheet" | "focus-search" | "boss-key" | "green-room" | "red-room" | "desk-save" | "desk-read";
  /** i18n key (under the `shortcuts` namespace) for the human label. */
  labelKey: string;
}

// The catalogue. Navigation actions cover the primary destinations plus the
// five "favorite tools"; commands cover search, the cheat-sheet, and the boss
// key. Adding a tool here makes it available as a rebind target automatically.
export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  // Navigation — primary destinations
  { id: "nav-home", kind: "navigate", path: "/", labelKey: "actionHome" },
  { id: "nav-tools", kind: "navigate", path: "/tools", labelKey: "actionTools" },
  { id: "nav-learn", kind: "navigate", path: "/learn", labelKey: "actionLearn" },
  { id: "nav-dev-fun", kind: "navigate", path: "/dev/fun", labelKey: "actionDevFun" },
  { id: "nav-mega-brain", kind: "navigate", path: "/dev/fun/mega-brain", labelKey: "actionMegaBrain" },
  { id: "nav-bingo", kind: "navigate", path: "/dev/fun/meeting-bingo", labelKey: "actionBingo" },
  // Navigation — the five favorite tools (PRIME-ratified defaults; rebindable)
  { id: "tool-cidr", kind: "navigate", path: "/tools/cidr", labelKey: "actionToolCidr" },
  { id: "tool-base64", kind: "navigate", path: "/tools/base64", labelKey: "actionToolBase64" },
  { id: "tool-jwt", kind: "navigate", path: "/tools/jwt", labelKey: "actionToolJwt" },
  { id: "tool-json-yaml", kind: "navigate", path: "/tools/json-yaml-convert", labelKey: "actionToolJsonYaml" },
  { id: "vendor-f5", kind: "navigate", path: "/f5", labelKey: "actionVendorF5" },
  // Navigation — five more quick-launch destinations (keys 6-0; rebindable)
  { id: "tool-hash", kind: "navigate", path: "/tools/hash", labelKey: "actionToolHash" },
  { id: "tool-uuid", kind: "navigate", path: "/tools/uuid", labelKey: "actionToolUuid" },
  { id: "tool-url-inspector", kind: "navigate", path: "/tools/url-inspector", labelKey: "actionToolUrlInspector" },
  { id: "tool-dhcp-option-43", kind: "navigate", path: "/tools/dhcp-option-43", labelKey: "actionToolDhcpOption43" },
  { id: "tool-panos-policy-order", kind: "navigate", path: "/tools/panos-policy-evaluation-order", labelKey: "actionToolPanosPolicyOrder" },
  { id: "tool-x509", kind: "navigate", path: "/tools/x509", labelKey: "actionToolX509" },
  { id: "nav-vendors", kind: "navigate", path: "/vendor-hubs", labelKey: "actionVendors" },
  // My desk (PRIME 12/11/2026 12:42): the reader's own page, and the two things to do on an item page from the keyboard.
  // The commands are answered by the page's own controls (src/components/desk/DeskItemControls.tsx); on a page with no
  // item they do nothing.
  { id: "nav-desk", kind: "navigate", path: "/my-desk", labelKey: "actionDesk" },
  // Commands — handled inside the shortcut layer
  { id: "cmd-search", kind: "command", command: "search-overlay", labelKey: "actionSearch" },
  { id: "cmd-focus-search", kind: "command", command: "focus-search", labelKey: "actionFocusSearch" },
  { id: "cmd-cheat-sheet", kind: "command", command: "cheat-sheet", labelKey: "actionCheatSheet" },
  { id: "cmd-boss", kind: "command", command: "boss-key", labelKey: "actionBoss" },
  // Ambient light rooms (PRIME 2026-07-16): full-screen solid-color screens.
  // Green = ambient work light / improvised chroma panel; red = the darkroom
  // and night-ops classic, a screen that preserves dark adaptation. Any key
  // or click leaves the room.
  { id: "cmd-green-room", kind: "command", command: "green-room", labelKey: "actionGreenRoom" },
  { id: "cmd-red-room", kind: "command", command: "red-room", labelKey: "actionRedRoom" },
  // My desk: save or unsave this page's item; mark it read (or done) or take the mark off.
  { id: "cmd-desk-save", kind: "command", command: "desk-save", labelKey: "actionDeskSave" },
  { id: "cmd-desk-read", kind: "command", command: "desk-read", labelKey: "actionDeskRead" },
];

// Fast lookup by id (used by the resolver and the component).
export const ACTION_BY_ID: Record<string, ShortcutAction> = Object.fromEntries(
  SHORTCUT_ACTIONS.map((a) => [a.id, a]),
);

// ---- Default bindings ------------------------------------------------------
// Bare single keys only (matched on e.key.toLowerCase()). These are the
// out-of-the-box bindings; users may rebind any key the policy marks
// customizable, and the sysadmin may override via POLICY below.
//
// Chosen keys:
//   b boss · t tools · l learn · m mega-brain · z bingo · f dev-fun index
//     (existing set + the dev-fun landing page)
//   s search overlay · / focus search · ? and h help (the cheat-sheet; h since
//     PRIME 16/11/2026 03:14: "Map the letter h to help") · i home (moved from h
//     that day: i for início, inicio, inizio, and the site's index)
//   1-5 favorite tools (PRIME-ratified: CIDR, Base64, JWT, JSON⇄YAML, F5 hub)
//   6-0 more quick launches: Hash, UUID, URL inspector, X.509, Vendors home
//   d My desk · k keep (save) this page's item · x tick it off as read (My desk, 12/11/2026)
export const DEFAULT_BINDINGS: Record<string, string> = {
  b: "cmd-boss",
  g: "cmd-green-room",
  r: "cmd-red-room",
  f: "nav-dev-fun",
  t: "nav-tools",
  l: "nav-learn",
  m: "nav-mega-brain",
  z: "nav-bingo",
  s: "cmd-search",
  "/": "cmd-focus-search",
  "?": "cmd-cheat-sheet",
  // h is help as well as ? (PRIME 16/11/2026 03:14); Home moved to i the same day.
  h: "cmd-cheat-sheet",
  i: "nav-home",
  "1": "tool-cidr",
  "2": "tool-base64",
  "3": "tool-jwt",
  "4": "tool-json-yaml",
  "5": "vendor-f5",
  "6": "tool-hash",
  "7": "tool-uuid",
  "8": "tool-url-inspector",
  "9": "tool-x509",
  "0": "nav-vendors",
  // My desk (12/11/2026): d opens it, k keeps (saves) this page's item, x ticks it off as read or done.
  d: "nav-desk",
  k: "cmd-desk-save",
  x: "cmd-desk-read",
};

// The keys the settings UI exposes, in display order (matches DEFAULT_BINDINGS).
export const SHORTCUT_KEYS: string[] = ["b", "g", "r", "f", "t", "l", "m", "z", "s", "/", "?", "h", "i", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "d", "k", "x"];

// ---- Sysadmin policy -------------------------------------------------------
// Per-key operator rules. Any key absent from this map is fully customizable
// with its DEFAULT_BINDINGS action. To lock a key, add `{ locked: true }`; to
// force a key to an action (implies locked), add `{ forced: "<actionId>" }`.

export interface KeyPolicy {
  /** Users cannot rebind this key. */
  locked?: boolean;
  /** Force this key to this action id, regardless of user setting (implies locked). */
  forced?: string;
}

// DEFAULT policy: everything customizable. PRIME edits this to lock/force keys.
// (Left empty on purpose — the site ships fully user-configurable. The examples
// below show how PRIME would lock or force keys when desired.)
export const KEY_POLICY: Record<string, KeyPolicy> = {
  // Example (commented): lock the boss key so it is always the boss key:
  //   b: { locked: true },
  // Example (commented): force key 1 to always open CIDR, no rebinding:
  //   "1": { forced: "tool-cidr" },
};

// Ready-made "lock everything" policy the operator can swap KEY_POLICY for if
// they ever want a fully fixed shortcut set (kept here as documentation of the
// "set all" capability; not used unless PRIME wires it in).
export const POLICY_ALL_LOCKED: Record<string, KeyPolicy> = Object.fromEntries(
  SHORTCUT_KEYS.map((k) => [k, { locked: true }]),
);

// Is a key customizable by users under the current policy? Forced or locked
// keys are not.
export function isKeyCustomizable(key: string): boolean {
  const p = KEY_POLICY[key];
  if (!p) return true;
  return !p.locked && !p.forced;
}

/**
 * The id of a key's row in the Settings table, so a "Customize" link can land on it (PRIME 16/11/2026 03:14: "In the
 * keyboard shortcuts lists, place a "Customize" link next to the keys that are customizable"): letters and digits as
 * they are, the two punctuation keys by name.
 *
 * @param key the bare key, as in SHORTCUT_KEYS
 * @returns the element id, "shortcut-key-h", "shortcut-key-slash" and so on
 */
export function shortcutAnchor(key: string): string {
  // Punctuation is not welcome in an id that a URL fragment carries; the two bound ones get names.
  const name = key === "/" ? "slash" : key === "?" ? "question" : key;
  // The id.
  return `shortcut-key-${name}`;
}

/** The Settings address of a key's row, locale-relative (the i18n Link adds the language). */
export function shortcutSettingsHref(key: string): string {
  // The settings page, at the key's row.
  return `/settings#${shortcutAnchor(key)}`;
}

// ---- Keys that are not bindings ----------------------------------------------
// Everything else the keyboard does across the site, listed beside the bindings in the help (the "?" and "h"
// overlay) and in the Site User Guide, so the two lists are one list (PRIME 16/11/2026 03:14: "Make sure you list all
// current key mappings"). None of these can be rebound: each is handled by its own code, named in `where`.

/** One key, or one sequence or chord, that the site answers outside the binding table. */
export interface OtherKey {
  /** Stable id; the label is shortcuts.other.<id>.label, the caps shortcuts.other.<id>.caps (localized: Esc is Échap
   *  in French, Ctrl is Strg in German). */
  id: "dot" | "esc" | "search-chord" | "pong" | "boss" | "typing";
  /** Where it is handled, for the next reader of this file. */
  where: string;
  /** Whether it is letters, so a page that owns the alphabet switches it off too. */
  letters: boolean;
}

/** The other keys, in the order the help lists them. */
export const OTHER_KEYS: readonly OtherKey[] = [
  // ".": the page-actions panel, on pages that register capabilities; inside it, 1-9, 0 and a-z jump to a section.
  { id: "dot", where: "src/components/KeyboardShortcuts.tsx (T-DOT)", letters: false },
  // Escape: every panel and dialog closes itself.
  { id: "esc", where: "each popup's own handler", letters: false },
  // Ctrl+K or Cmd+K: search, from anywhere, a text field included.
  { id: "search-chord", where: "src/components/Search.tsx", letters: false },
  // p then v: the Ping-Pong virus simulator, loose or caught (15/11/2026, queue 5p).
  { id: "pong", where: "src/components/KeyboardShortcuts.tsx", letters: true },
  // On a boss screen: the arrows change the disguise; any other key, or a click, returns.
  { id: "boss", where: "src/components/dev/fun/BossApp.tsx", letters: false },
  // In a text field: keys type. No shortcut takes a key from a field, nor one pressed with Ctrl, Alt or Cmd.
  { id: "typing", where: "src/components/KeyboardShortcuts.tsx (isEditable, the modifier check)", letters: false },
];
