"use client";

// ============================================================================
// src/components/GlossaryHintToggle.tsx
// ----------------------------------------------------------------------------
// The reader-facing on/off switch for inline glossary hints.
//
// Mirrors the theme preference exactly: a device-only localStorage key
// (`ronutz-glossary-hints`, values "on" | "off", default on) plus a matching
// data attribute on <html> so the CSS can suppress the affordance instantly.
// The layout's pre-paint script applies "off" before first paint; this control
// flips it live thereafter, and the GlossaryHint island observes the attribute
// so open popups go inert immediately.
//
// SSR- and private-mode-safe: reads return the default on the server and when
// storage throws; writes no-op rather than error.
// ============================================================================

import { useEffect, useState } from "react";

const KEY = "ronutz-glossary-hints";

interface GlossaryHintToggleProps {
  /** "Inline glossary hints" — the control's label. */
  label: string;
  /** Short description shown under the label. */
  description: string;
  /** Accessible on/off state words, e.g. ["On", "Off"]. */
  onLabel: string;
  offLabel: string;
}

export default function GlossaryHintToggle({
  label,
  description,
  onLabel,
  offLabel,
}: GlossaryHintToggleProps) {
  // Default on. `null` = not yet read (avoids a wrong first render flash).
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let on = true;
    try {
      on = window.localStorage.getItem(KEY) !== "off";
    } catch {
      /* private mode: default on */
    }
    setEnabled(on);
  }, []);

  const apply = (on: boolean) => {
    setEnabled(on);
    try {
      window.localStorage.setItem(KEY, on ? "on" : "off");
    } catch {
      /* private mode: session-only, still updates the attribute */
    }
    if (on) {
      document.documentElement.removeAttribute("data-glossary-hints");
    } else {
      document.documentElement.setAttribute("data-glossary-hints", "off");
    }
  };

  // Before the effect resolves, assume on (the default) so the switch is stable.
  const isOn = enabled ?? true;

  return (
    <div className="gloss-hint-toggle">
      <div className="gloss-hint-toggle-copy">
        <span className="gloss-hint-toggle-label">{label}</span>
        <span className="gloss-hint-toggle-desc">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={label}
        className="gloss-hint-toggle-switch"
        data-on={isOn}
        onClick={() => apply(!isOn)}
      >
        <span className="gloss-hint-toggle-knob" aria-hidden="true" />
        <span className="gloss-hint-toggle-state">{isOn ? onLabel : offLabel}</span>
      </button>
    </div>
  );
}
