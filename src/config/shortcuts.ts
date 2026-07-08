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
  command?: "search-overlay" | "cheat-sheet" | "focus-search" | "boss-key";
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
  // Commands — handled inside the shortcut layer
  { id: "cmd-search", kind: "command", command: "search-overlay", labelKey: "actionSearch" },
  { id: "cmd-focus-search", kind: "command", command: "focus-search", labelKey: "actionFocusSearch" },
  { id: "cmd-cheat-sheet", kind: "command", command: "cheat-sheet", labelKey: "actionCheatSheet" },
  { id: "cmd-boss", kind: "command", command: "boss-key", labelKey: "actionBoss" },
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
//   s search overlay · / focus search · ? cheat-sheet · h home   (new "expected"
//     web conventions)
//   1-5 favorite tools (PRIME-ratified: CIDR, Base64, JWT, JSON⇄YAML, F5 hub)
export const DEFAULT_BINDINGS: Record<string, string> = {
  b: "cmd-boss",
  f: "nav-dev-fun",
  t: "nav-tools",
  l: "nav-learn",
  m: "nav-mega-brain",
  z: "nav-bingo",
  s: "cmd-search",
  "/": "cmd-focus-search",
  "?": "cmd-cheat-sheet",
  h: "nav-home",
  "1": "tool-cidr",
  "2": "tool-base64",
  "3": "tool-jwt",
  "4": "tool-json-yaml",
  "5": "vendor-f5",
};

// The keys the settings UI exposes, in display order (matches DEFAULT_BINDINGS).
export const SHORTCUT_KEYS: string[] = ["b", "f", "t", "l", "m", "z", "s", "/", "?", "h", "1", "2", "3", "4", "5"];

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
