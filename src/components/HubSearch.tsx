"use client";

// ============================================================================
// src/components/HubSearch.tsx
// ----------------------------------------------------------------------------
// THE HUB SEARCH FIELD (wave 0 of Round 1, 2026-10-05; SCOUT E2 "scoped tool
// search as the primary control", E10 "scoped Industry search", L17 "scoped
// search within Learn"). One field at the top of a hub page (/tools, /learn,
// /industry) that opens the one search dialog with the reader's words AND the
// hub's world preset as the scope (the "system" facet SearchKind declares on
// every page), so the dialog lists ranked hits inside that world first and the
// reader can widen to everywhere with one click. The same ronutz:open-search
// event the home omnibox dispatches, with detail.scope added; one search UI,
// one index, no second mechanism. The copy comes in as props from the hub's
// own namespace, so this client component needs no namespace of its own.
// Nothing is sent anywhere: the dialog searches the index in the browser.
// ============================================================================

import { useCallback, useState } from "react";
import type { WorldKey } from "@/config/worlds";

export default function HubSearch({ scope, label, placeholder, examples, examplesLabel }: {
  /** The world the dialog opens scoped to. */
  scope: WorldKey;
  /** The field's accessible label ("Search the tools"). */
  label: string;
  /** The placeholder ("A protocol, a vendor, a problem..."). */
  placeholder: string;
  /** Example queries, one tap each (optional). */
  examples?: readonly string[];
  /** The label before the examples ("Try"). */
  examplesLabel?: string;
}) {
  // The field's text; handed over on Enter, on the button, or on the first keystroke.
  const [value, setValue] = useState("");
  // A fixed id per world (one hub field per page): useId's position-derived ids differed between the server
  // render and hydration on the industry page (React error 418, found 2026-10-05 in the pt-BR check).
  const id = `hub-search-${scope}`;

  /** Open the dialog with a query inside this hub's world. */
  const open = useCallback((query: string) => {
    window.dispatchEvent(new CustomEvent("ronutz:open-search", { detail: { query, scope } }));
  }, [scope]);

  return (
    <div
      className={`omnibox omnibox--hub omnibox--${scope}`}
      role="search"
      aria-label={label}
      onKeyDown={(e) => {
        // Enter hands the text to the dialog; the dialog's own Escape closes it.
        if (e.key === "Enter") {
          e.preventDefault();
          open(value);
        }
      }}
    >
      <label className="sr-only" htmlFor={id}>{label}</label>
      <div className="omnibox-field">
        <svg className="omnibox-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={id}
          type="search"
          className="omnibox-input"
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={(e) => {
            // The first character opens the dialog with that character already in it; the field stays usable if the dialog is dismissed.
            setValue(e.target.value);
            if (e.target.value.length === 1 && value.length === 0) open(e.target.value);
          }}
        />
        <kbd className="omnibox-kbd" aria-hidden="true">Ctrl K</kbd>
      </div>
      {/* The examples: one tap each, the same dialog, the same scope. */}
      {examples && examples.length > 0 && (
        <p className="omnibox-examples">
          {examplesLabel && <span className="omnibox-examples-label">{examplesLabel}</span>}
          {examples.map((q) => (
            <button key={q} type="button" className="omnibox-example" onClick={() => open(q)}>{q}</button>
          ))}
        </p>
      )}
    </div>
  );
}
