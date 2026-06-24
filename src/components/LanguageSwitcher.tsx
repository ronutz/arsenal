"use client";

// ============================================================================
// src/components/LanguageSwitcher.tsx
// ----------------------------------------------------------------------------
// THE COMMAND-PALETTE LANGUAGE SWITCHER.
//
// DESIGN RATIONALE (deliberate, not default):
//   - NO FLAGS. Flags represent countries, not languages — Spanish is 20+
//     countries, Arabic ~25, English has no single flag, and the three Chinese
//     variants would force political statements. Flags are the friendly-looking
//     wrong answer. We list languages by their ENDONYM (their own name) so a
//     Korean speaker scans for "한국어", not "Korean".
//   - COMMAND-PALETTE pattern: a trigger showing the current language + its
//     BCP-47 code (mono), opening a panel with type-to-filter. This reads as a
//     practitioner tool, not a consumer widget — matching the site's authority.
//   - Status dots mark untranslated (stub) languages honestly.
//   - Fully keyboard-navigable (arrow keys, Enter, Escape) and Obsidian-themed.
//
// SECURITY: renders only registry data (endonyms/codes are static, trusted
// constants in locales.ts). No user input is ever rendered as HTML; the filter
// box value is used only to match, never injected into markup. React escapes
// everything by default.
// ============================================================================

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, getLocale, type LocaleMeta } from "@/i18n/locales";

export default function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active: LocaleMeta = getLocale(activeLocale) ?? LOCALES[0];

  // Filter languages by query — matches against BOTH the native name and the
  // English name and the code, so a user can find their language however they
  // think of it (type "japan", "日本", or "ja" — all find Japanese).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOCALES;
    return LOCALES.filter(
      (l) =>
        l.nativeName.toLowerCase().includes(q) ||
        l.englishName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  // Switch language: navigate to the same page in the chosen locale.
  const selectLocale = useCallback(
    (code: string) => {
      setOpen(false);
      setQuery("");
      // next-intl's router keeps the current pathname, swaps the locale.
      router.replace(pathname, { locale: code });
    },
    [router, pathname]
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Focus the filter input when the panel opens; reset highlight.
  useEffect(() => {
    if (open) {
      setHighlightedIndex(0);
      // Defer focus to after the panel paints.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keep the highlight in range as the filtered list shrinks.
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Keyboard navigation within the panel.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = filtered[highlightedIndex];
      if (choice) selectLocale(choice.code);
    }
  }

  return (
    <div ref={containerRef} className="ls-root">
      {/* Trigger: current language endonym + BCP-47 code */}
      <button
        type="button"
        className="ls-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          className="ls-globe"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span className="ls-trigger-name">{active.nativeName}</span>
        <span className="ls-trigger-code mono">{active.code}</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="ls-panel" role="dialog" aria-label={t("label")}>
          <input
            ref={inputRef}
            className="ls-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("label")}
            aria-label={t("label")}
            autoComplete="off"
            spellCheck={false}
          />
          <ul className="ls-list" role="listbox" aria-label={t("label")}>
            {filtered.map((l, i) => {
              const isActive = l.code === activeLocale;
              const isHighlighted = i === highlightedIndex;
              return (
                <li key={l.code} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    className={
                      "ls-item" +
                      (isHighlighted ? " ls-item--highlighted" : "") +
                      (isActive ? " ls-item--active" : "")
                    }
                    onClick={() => selectLocale(l.code)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                  >
                    <span className="ls-item-native">{l.nativeName}</span>
                    <span className="ls-item-code mono">{l.code}</span>
                    {/* Honest status dot: stub languages fall back to English. */}
                    {l.status === "stub" && (
                      <span
                        className="ls-item-status"
                        title={t("stubNotice")}
                        aria-label={t("stubNotice")}
                      />
                    )}
                    {isActive && (
                      <svg
                        className="ls-item-check"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="ls-empty">—</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
