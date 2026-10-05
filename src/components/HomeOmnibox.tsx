"use client";

// ============================================================================
// src/components/HomeOmnibox.tsx
// ----------------------------------------------------------------------------
// THE FRONT DOOR'S SEARCH FIELD (2026-10-05, home page review item 7, PRIME's
// decision). The site is large enough that search is itself a product: 173
// tools, 710 articles, 338 companies, 1,700 terms, 105 guides. The header's
// search dialog (Search.tsx) already ranks all of it; this field puts it in
// the first screen. It does not search by itself: on submit, or as soon as the
// reader types, it hands the text to the one search dialog through the
// `ronutz:open-search` event (detail.query), so there is one search UI, one
// index, one set of result colours. The example chips do the same with a
// fixed query. The search index is client-side (Pagefind), so there is no
// server to submit to: without JavaScript the field is a labelled box and the
// header's plain links remain the way in.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/** The example queries, one per world the site holds (tool, platform, protocol, vendor, history, concept). */
const EXAMPLES = ["CIDR", "BIG-IP", "BGP", "Fortinet", "Cabletron", "SASE"];

export default function HomeOmnibox() {
  const t = useTranslations("home.front");
  // The field's text; handed over on submit or on the first keystroke.
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement | null>(null);

  /** Open the search dialog with a query. */
  const open = useCallback((query: string) => {
    window.dispatchEvent(new CustomEvent("ronutz:open-search", { detail: { query } }));
  }, []);

  return (
    <div
      className="omnibox"
      role="search"
      aria-label={t("omniboxLabel")}
      onKeyDown={(e) => {
        // Enter hands the text to the dialog; the dialog's own Escape closes it.
        if (e.key === "Enter") {
          e.preventDefault();
          open(value);
        }
      }}
    >
      <label className="sr-only" htmlFor="home-omnibox">{t("omniboxLabel")}</label>
      <div className="omnibox-field">
        <svg className="omnibox-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="home-omnibox"
          ref={input}
          type="search"
          className="omnibox-input"
          placeholder={t("omniboxPlaceholder")}
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
      {/* The examples: one tap each, the same dialog. */}
      <p className="omnibox-examples">
        <span className="omnibox-examples-label">{t("omniboxExamples")}</span>
        {EXAMPLES.map((q) => (
          <button key={q} type="button" className="omnibox-example" onClick={() => open(q)}>{q}</button>
        ))}
      </p>
    </div>
  );
}
