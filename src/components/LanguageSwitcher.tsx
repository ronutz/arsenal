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
//   - ALL LANGUAGES, HONESTLY STATUSED: the panel lists every registered locale
//     and marks each with a colored status dot. Languages with no pack yet are
//     shown with a RED dot (they fall back to English) rather than hidden — the
//     full roadmap is visible, and the dot makes the "shown in English for now"
//     promise explicit instead of silently dropping the language.
//   - ORDER (modern-picker best practice, PRIME spec): English first, pt-BR
//     second (the source + reviewed languages, pinned), then the remaining
//     locales banded by translation status (reviewed -> machine -> stub) and,
//     inside each band, ordered alphabetically by the native name shown in the
//     row. See ORDERED_LOCALES below.
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
import { LOCALES, DEFAULT_LOCALE, getLocale, type LocaleMeta } from "@/i18n/locales";
import { LOCALE_COVERAGE } from "@/i18n/locale-coverage";

// A locale's display status for the switcher cue:
//   "reviewed" — written and reviewed by a person (English) -> green
//   "complete" — machine-translated and covering the whole site   -> amber
//   "partial"  — machine-translated, newer content still catching up -> yellow
//   "stub"     — no pack yet, so the page falls back to English     -> red
// Completeness (amber vs yellow) comes from the build-time coverage map. The
// 0.98 floor tolerates a tool or two briefly in flight (the D-56 "EN + pt-BR
// first" cadence) before a locale is flagged "in progress", rather than flipping
// on a single missing key.
const COMPLETE_THRESHOLD = 0.98;
type StatusTier = "reviewed" | "complete" | "partial" | "stub";
function statusTier(l: LocaleMeta): StatusTier {
  if (l.status === "stub") return "stub";
  if (l.status === "reviewed") return "reviewed";
  const cov = LOCALE_COVERAGE[l.code] ?? 0;
  return cov >= COMPLETE_THRESHOLD ? "complete" : "partial";
}

// -----------------------------------------------------------------------------
// SWITCHER ORDER (PRIME spec, computed once at module load since the registry is
// static). English is pinned first and pt-BR second; everything else is banded
// by translation status, then alphabetically by their native name (the endonym
// shown in the row). statusBand returns the band index; the two
// pinned languages get negative sentinels so they always lead.
// -----------------------------------------------------------------------------
function statusBand(l: LocaleMeta): number {
  if (l.code === "en") return -2;       // always first
  if (l.code === "pt-BR") return -1;    // always second
  if (l.status === "reviewed") return 0; // any other human-reviewed locale (green)
  if (l.status === "stub") return 2;     // no pack yet (red)
  return 1;                              // machine-draft: amber + yellow, one band
}

const ORDERED_LOCALES: readonly LocaleMeta[] = [...LOCALES].sort((a, b) => {
  const band = statusBand(a) - statusBand(b);
  if (band !== 0) return band;
  // Alphabetical by the ENDONYM (the native name actually shown in the row),
  // so each band reads in order on screen. Latin-script names sort A->Z; the
  // non-Latin scripts (Cyrillic, CJK) collate after them, which is simply the
  // natural result of ordering by the name as displayed. No western/other
  // split - that broke the single alphabetical run within each band.
  return a.nativeName.localeCompare(b.nativeName, "en");
});

// Sole caller of next-intl's navigation hooks. Rendered only after mount, so
// useRouter/usePathname never execute during static prerender. Keeps the parent's
// refs in sync and renders nothing.
function LangNavBridge({
  routerReplaceRef,
  pathnameRef,
}: {
  routerReplaceRef: React.MutableRefObject<(pathname: string, opts: { locale: string }) => void>;
  pathnameRef: React.MutableRefObject<string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    routerReplaceRef.current = (p, opts) => router.replace(p, opts);
    pathnameRef.current = pathname;
  }, [router, pathname, routerReplaceRef, pathnameRef]);
  return null;
}

export default function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const tStatus = useTranslations("languageStatus");
  const activeLocale = useLocale();
  // next-intl's navigation hooks (useRouter/usePathname) throw when this client
  // component is prerendered to HTML under Next 16 (no router context on the
  // server). They are only ever read inside selectLocale (a click handler), so
  // an inner mount-only bridge fills these refs client-side; the hooks never run
  // during static prerender. (useLocale/useTranslations are prerender-safe.)
  const routerReplaceRef = useRef<(pathname: string, opts: { locale: string }) => void>(
    () => {},
  );
  const pathnameRef = useRef<string>("/");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active: LocaleMeta = getLocale(activeLocale) ?? LOCALES[0];

  // Filter languages by query — matches against BOTH the native name and the
  // English name and the code, so a user can find their language however they
  // think of it (type "japan", "日本", or "ja" — all find Japanese). The base
  // list is ORDERED_LOCALES (every registered locale, in the banded order);
  // filtering only narrows it and preserves that order.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ORDERED_LOCALES;
    return ORDERED_LOCALES.filter(
      (l) =>
        l.nativeName.toLowerCase().includes(q) ||
        l.englishName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  // Switch language: navigate to the same page in the chosen locale. Stub
  // locales are not built (they consume no pages), so selecting one routes to
  // the English version of the current page in a single hop. (The worker also
  // 301s /[stub]/… -> /en/…, and routing only knows live locales, so we leave
  // next-intl's router and navigate plainly here.)
  const selectLocale = useCallback(
    (l: LocaleMeta) => {
      setOpen(false);
      setQuery("");
      // Remember the choice as a preference so a returning visitor who lands on
      // a locale-less entry point is sent here automatically (see the redirect
      // script in the layout). Persisted device-only, like the theme.
      try {
        window.localStorage.setItem("ronutz-lang", l.code);
      } catch {
        /* private mode: skip persistence; the navigation below still happens */
      }
      if (l.status === "stub") {
        const p = pathnameRef.current;
        const rest = p === "/" ? "/" : p.endsWith("/") ? p : `${p}/`;
        window.location.assign(`/${DEFAULT_LOCALE}${rest}`);
        return;
      }
      // next-intl's router keeps the current pathname, swaps the locale.
      routerReplaceRef.current(pathnameRef.current, { locale: l.code });
    },
    []
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
      if (choice) selectLocale(choice);
    }
  }

  return (
    <div ref={containerRef} className="ls-root">
      {mounted && (
        <LangNavBridge routerReplaceRef={routerReplaceRef} pathnameRef={pathnameRef} />
      )}
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
        <span className={`ls-status ls-status--${statusTier(active)}`} title={tStatus(statusTier(active))} />
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
                      (isActive ? " ls-item--active" : "") +
                      (statusTier(l) === "stub" ? " ls-item--stub" : "")
                    }
                    onClick={() => selectLocale(l)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                  >
                    <span className={`ls-status ls-status--${statusTier(l)}`} title={tStatus(statusTier(l))} />
                    <span className="ls-item-native">{l.nativeName}</span>
                    <span className="ls-item-code mono">{l.code}</span>
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
          {/* Legend: what the per-language status dots mean. Links to the fuller
              explanation on the colophon (where the i18n stack is described). */}
          <div className="ls-legend">
            <span className="ls-legend-title">{tStatus("title")}</span>
            <span className="ls-legend-row">
              <span className="ls-status ls-status--reviewed" />
              {tStatus("reviewed")}
            </span>
            <span className="ls-legend-row">
              <span className="ls-status ls-status--complete" />
              {tStatus("complete")}
            </span>
            <span className="ls-legend-row">
              <span className="ls-status ls-status--partial" />
              {tStatus("partial")}
            </span>
            <span className="ls-legend-row">
              <span className="ls-status ls-status--stub" />
              {tStatus("stub")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
