"use client";

// ============================================================================
// src/components/GlossaryHintToggle.tsx
// ----------------------------------------------------------------------------
// The reader-facing TRI-STATE control for inline glossary hints:
//   first — underline only the first mention of each term per page (default);
//   all   — underline every mention (bounded by the marking pass's caps);
//   off   — plain prose everywhere.
//
// Mirrors the theme preference exactly: a device-only localStorage key
// (`ronutz-glossary-hints`, values "first" | "all" | "off"; the legacy value
// "on" from the old two-state switch reads as "first") plus a matching data
// attribute on <html> so CSS reacts instantly: absent = first, "all", "off".
// The layout's pre-paint script applies the stored mode before first paint;
// this control changes it live thereafter, and the hint islands observe the
// attribute so open popups retune immediately.
//
// SSR- and private-mode-safe: reads return the default on the server and when
// storage throws; writes no-op rather than error.
// ============================================================================

import { useEffect, useState } from "react";

const KEY = "ronutz-glossary-hints";

type HintMode = "first" | "all" | "off";

/** Map any stored value (including the legacy "on"/"off") to a mode. */
function toMode(raw: string | null): HintMode {
  if (raw === "off") return "off";
  if (raw === "all") return "all";
  return "first"; // null, "first", legacy "on", anything else
}

interface GlossaryHintToggleProps {
  /** "Inline glossary hints" — the control's label. */
  label: string;
  /** Short description shown under the label. */
  description: string;
  /** Localized option labels. */
  firstLabel: string;
  allLabel: string;
  offLabel: string;
}

export default function GlossaryHintToggle({
  label,
  description,
  firstLabel,
  allLabel,
  offLabel,
}: GlossaryHintToggleProps) {
  // Default "first". `null` = not yet read (avoids a wrong first render flash).
  const [mode, setMode] = useState<HintMode | null>(null);

  useEffect(() => {
    let m: HintMode = "first";
    try {
      m = toMode(window.localStorage.getItem(KEY));
    } catch {
      /* private mode: default */
    }
    setMode(m);
  }, []);

  const apply = (m: HintMode) => {
    setMode(m);
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      /* private mode: session-only, still updates the attribute */
    }
    if (m === "first") {
      document.documentElement.removeAttribute("data-glossary-hints");
    } else {
      document.documentElement.setAttribute("data-glossary-hints", m);
    }
  };

  // Before the effect resolves, assume the default so the control is stable.
  const current = mode ?? "first";

  const options: { value: HintMode; text: string }[] = [
    { value: "first", text: firstLabel },
    { value: "all", text: allLabel },
    { value: "off", text: offLabel },
  ];

  return (
    <div className="gloss-hint-toggle">
      <div className="gloss-hint-toggle-copy">
        <span className="gloss-hint-toggle-label">{label}</span>
        <span className="gloss-hint-toggle-desc">{description}</span>
      </div>
      <div className="gloss-hint-toggle-seg" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={current === o.value}
            className="gloss-hint-toggle-opt"
            data-active={current === o.value}
            onClick={() => apply(o.value)}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}
