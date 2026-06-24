"use client";

// ============================================================================
// src/components/Search.tsx
// ----------------------------------------------------------------------------
// THE SITE-WIDE SEARCH — Obsidian-themed, ranked, privacy-preserving.
//
// HOW IT WORKS (and why it fits the architecture):
//   Pagefind indexes the built static HTML at build time, producing a chunked
//   index under /pagefind/. This component loads the Pagefind runtime IN THE
//   BROWSER and queries that index locally. The search query never leaves the
//   device — same local-first guarantee as the tools. Results are RANKED by
//   Pagefind's relevance scoring and link to the matching pages.
//
//   We use Pagefind's JS API directly (not its prebuilt UI) so results render
//   in our own theme, fully integrated — no clashing light-mode widget.
//
// MULTILINGUAL: we filter results to the active language so a visitor reading
// in Portuguese gets Portuguese results. Pagefind tags each page with its
// language (from <html lang>), and we pass that as a filter.
//
// LOADING: the runtime lives in the build OUTPUT (/pagefind/pagefind.js), not
// in node_modules, so it is imported dynamically at runtime via a path the
// bundler must not try to resolve at build time (hence the webpackIgnore hint).
// In local `next dev` (no export yet) the index will not exist; the component
// degrades gracefully to a "search unavailable in dev" state.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";

// Minimal shapes for the parts of the Pagefind API we use (it ships no types).
interface PagefindSubResult {
  url: string;
  title: string;
  excerpt: string;
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindSubResult>;
}
interface PagefindApi {
  options?: (opts: Record<string, unknown>) => Promise<void>;
  search: (
    query: string,
    opts?: { filters?: Record<string, unknown> }
  ) => Promise<{ results: PagefindResult[] }>;
}

/**
 * sanitizeExcerpt — SAFE-BY-CONSTRUCTION rendering of a search excerpt.
 *
 * Pagefind returns an excerpt that highlights matched terms with <mark> tags.
 * Rather than TRUST that Pagefind escaped everything else (and depend on its
 * internals), we ENFORCE it: escape the entire string, then re-allow only the
 * <mark> and </mark> tags we expect. The result is that no markup from indexed
 * content can ever reach the DOM as live HTML — only highlight tags survive.
 * This upholds the canon Red/Blue stance (RB-01): don't trust input, enforce.
 */
function sanitizeExcerpt(raw: string): string {
  // 1) Escape ALL HTML special characters — neutralizes any tag/entity.
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // 2) Re-enable ONLY the highlight tags Pagefind legitimately uses.
  return escaped
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>");
}

export default function Search() {
  const t = useTranslations("search");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindSubResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const pagefindRef = useRef<PagefindApi | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lazily load the Pagefind runtime the first time search opens.
  const loadPagefind = useCallback(async () => {
    if (pagefindRef.current) return pagefindRef.current;
    try {
      // The bundler must NOT resolve this at build time — it only exists in the
      // exported output. The /* webpackIgnore */ comment keeps it a runtime import.
      const pf = (await import(
        /* webpackIgnore: true */ "/pagefind/pagefind.js" as string
      )) as PagefindApi;
      pagefindRef.current = pf;
      return pf;
    } catch {
      // No index (e.g. running `next dev` without an export). Degrade cleanly.
      setUnavailable(true);
      return null;
    }
  }, []);

  // Open search → load runtime + focus the input.
  const openSearch = useCallback(async () => {
    setOpen(true);
    await loadPagefind();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [loadPagefind]);

  // Keyboard shortcut: Cmd/Ctrl+K opens search (a familiar power-user pattern).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openSearch]);

  // Run the search whenever the query changes (debounced lightly).
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const pf = pagefindRef.current ?? (await loadPagefind());
      if (!pf || cancelled) {
        setLoading(false);
        return;
      }
      // Filter to the active language so results match what the visitor reads.
      const search = await pf.search(q, { filters: { language: locale } });
      const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      if (!cancelled) {
        setResults(data);
        setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, locale, loadPagefind]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      {/* Trigger button in the header */}
      <button
        type="button"
        className="search-trigger"
        onClick={openSearch}
        aria-label={t("label")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <span className="search-trigger-text">{t("label")}</span>
        <kbd className="search-trigger-kbd mono">⌘K</kbd>
      </button>

      {/* Search overlay */}
      {open && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label={t("label")}>
          <div ref={dialogRef} className="search-dialog">
            <div className="search-input-wrap">
              <svg
                className="search-input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("label")}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="search-close"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
              >
                Esc
              </button>
            </div>

            <div className="search-results">
              {unavailable && <p className="search-message">{t("unavailable")}</p>}
              {!unavailable && loading && <p className="search-message">{t("searching")}</p>}
              {!unavailable && !loading && query.trim() && results.length === 0 && (
                <p className="search-message">{t("noResults", { query: query.trim() })}</p>
              )}
              {!unavailable && results.length > 0 && (
                <ul className="search-result-list">
                  {results.map((r, i) => (
                    <li key={`${r.url}-${i}`}>
                      <a className="search-result" href={r.url}>
                        <span className="search-result-title">{r.title}</span>
                        {/* Excerpt with highlights. Sanitized to allow ONLY
                            <mark> tags — no content markup can reach the DOM. */}
                        <span
                          className="search-result-excerpt"
                          dangerouslySetInnerHTML={{ __html: sanitizeExcerpt(r.excerpt) }}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {!query.trim() && !unavailable && (
                <p className="search-hint">{t("hint")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
