"use client";

// ============================================================================
// src/components/ShortcutSettings.tsx
// ----------------------------------------------------------------------------
// THE SHORTCUT SETTINGS EDITOR (client island for the /settings page).
//
// Lets a visitor rebind each keyboard shortcut to a different action, within
// the limits the sysadmin POLICY allows (src/config/shortcuts.ts). Reads and
// writes the preferences engine (src/lib/preferences.ts); every change persists
// to localStorage immediately and notifies the live shortcut listener via the
// engine's pub/sub, so a rebind takes effect without a reload.
//
// Per key we show:
//   - the key cap (b, s, /, 1 …);
//   - a <select> of every available action (the dropdown picker; native select
//     is fully keyboard- and screen-reader-accessible and cannot get into a
//     broken state) — DISABLED and marked "Locked" when policy forbids editing;
//   - a "reset this key" affordance is covered by the global Reset button.
//
// POLICY is honored honestly: a forced/locked key is shown with its enforced
// action and a lock note, and cannot be changed here (the engine also refuses
// writes to non-customizable keys, so the UI and the data agree).
//
// No server: preferences live only in THIS browser (documented on the privacy
// page). This component reflects that — it never claims cross-device sync.
// ============================================================================

import { useEffect, useState } from "react";
import {
  SHORTCUT_KEYS,
  SHORTCUT_ACTIONS,
  KEY_POLICY,
  isKeyCustomizable,
} from "@/config/shortcuts";
import {
  resolveBindings,
  setUserBinding,
  resetBindings,
  subscribe,
} from "@/lib/preferences";

export interface ShortcutSettingsLabels {
  /** Column header for the key. */
  colKey: string;
  /** Column header for the action. */
  colAction: string;
  /** Badge shown on keys the administrator locked. */
  locked: string;
  /** Reset-all button. */
  reset: string;
  /** Small note under the table about device-only persistence. */
  note: string;
  /** Localized action label per action id. */
  actionLabels: Record<string, string>;
  /** Pretty key-cap label per raw key (e.g. "/" -> "/", "b" -> "B"). */
  keyLabels: Record<string, string>;
}

export default function ShortcutSettings({ labels }: { labels: ShortcutSettingsLabels }) {
  // Current effective bindings (policy + user overrides + defaults), kept live.
  const [bindings, setBindings] = useState<Record<string, string>>({});

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

  const onPick = (key: string, actionId: string) => {
    // Writing the current default is fine; the engine stores it as an override.
    setUserBinding(key, actionId);
  };

  return (
    <div className="shortcut-settings">
      <table className="shortcut-table">
        <thead>
          <tr>
            <th scope="col" className="shortcut-th-key">{labels.colKey}</th>
            <th scope="col">{labels.colAction}</th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUT_KEYS.map((key) => {
            const customizable = isKeyCustomizable(key);
            const current = bindings[key] ?? "";
            const policy = KEY_POLICY[key];
            const isForced = Boolean(policy?.forced);
            return (
              <tr key={key} className="shortcut-row">
                <td className="shortcut-td-key">
                  <kbd className="shortcut-key mono">{labels.keyLabels[key] ?? key}</kbd>
                </td>
                <td className="shortcut-td-action">
                  <span className="shortcut-action-inner">
                    <select
                      className="shortcut-select"
                      value={current}
                      disabled={!customizable}
                      aria-label={`${labels.keyLabels[key] ?? key} — ${labels.colAction}`}
                      onChange={(e) => onPick(key, e.target.value)}
                    >
                      {SHORTCUT_ACTIONS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {labels.actionLabels[a.id] ?? a.id}
                        </option>
                      ))}
                    </select>
                    {(isForced || !customizable) && (
                      <span className="shortcut-locked">{labels.locked}</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="shortcut-actions">
        <button type="button" className="btn btn-secondary shortcut-reset" onClick={() => resetBindings()}>
          {labels.reset}
        </button>
      </div>
      <p className="shortcut-note">{labels.note}</p>
    </div>
  );
}
