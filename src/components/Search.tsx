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
// MULTILINGUAL: Pagefind splits its index by language at build time (detected
// from each page's <html lang>). At runtime, loading /pagefind/pagefind.js on a
// page auto-selects the index matching that page's <html lang>, so a visitor on
// /pt-BR/ searches Portuguese content and one on /en/ searches English, with no
// extra wiring. We therefore do NOT pass a language "filter".
//
// THE KIND FACET (PRIME, 2026-10-05 12:44: "a search on Fortinet returns ZERO
// tools, only ONE article, and ZERO user guides"). Until this date the dialog
// loaded the top eight hits, classified them by URL and counted those eight, so
// the pills described eight results, not the site (eleven Fortinet tools exist;
// none ranked in the top eight against pages dense with the word). Now every
// page declares its kind to the indexer (SearchKind.tsx renders
// data-pagefind-filter="kind:tool|article|guide|page" from the locale layout),
// and the dialog asks Pagefind for the counts of that facet over the WHOLE
// result set (the response's totalFilters) and narrows with a real filter
// ({ kind: { any: [...] } }) when the reader switches a pill off, so "Tools"
// shows the ranked tools that match, however deep they sat in the mixed list.
// Results load twenty at a time, with a "show more" row for the rest.
//
// THE SCOPE (wave 0 of Round 1; SCOUT E2, E10, L17 "scoped search"): a second
// facet, "system", names each page's world among the five of the directory
// (SearchKind renders it from src/config/worlds.ts). A row of chips above the
// kind pills narrows the query to one world; a hub page's search field opens
// this dialog with its world preset (the ronutz:open-search event carries
// detail.scope). The counts on the chips are per world within the current kind
// selection; the counts on the pills are per kind within the current scope;
// each comes from the index over every hit, never from the loaded page.
//
// LOADING: the runtime lives in the build OUTPUT (/pagefind/pagefind.js), not
// in node_modules, so it is imported dynamically at runtime via a path the
// bundler must not try to resolve at build time (hence the webpackIgnore hint).
// In local `next dev` (no export yet) the index will not exist; the component
// degrades gracefully to a "search unavailable in dev" state.
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { tools } from "@/config/tools";
import { WORLD_KEYS, type WorldKey } from "@/config/worlds";

// Minimal shapes for the parts of the Pagefind API we use (it ships no types).
// What result.data() resolves to: the page URL, the highlighted excerpt, and the
// page metadata, where Pagefind puts the TITLE (meta.title, taken from the page's
// first h1 at index time). There is no top-level title field; this component
// read one for its first weeks and every result rendered without a title (found
// 2026-10-04 while colour-coding the result kinds).
interface PagefindRawResult {
  url: string;
  excerpt: string;
  meta?: { title?: string };
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindRawResult>;
}
// The shape this component renders: the raw result with its title lifted out
// of meta, so the rest of the file reads title as a plain string.
interface PagefindSubResult {
  url: string;
  title: string;
  excerpt: string;
}
/** Per-value counts of one facet, as Pagefind reports them ({ tool: 12, article: 30, ... }). */
type FacetCounts = Record<string, number>;
interface PagefindApi {
  options?: (opts: Record<string, unknown>) => Promise<void>;
  /** Loads the filter index (one small file) and returns every facet's counts over the whole index. */
  filters?: () => Promise<Record<string, FacetCounts>>;
  search: (
    query: string,
    opts?: { filters?: Record<string, unknown> }
  ) => Promise<{
    results: PagefindResult[];
    /** Counts if a value were applied IN ADDITION to the current filters. */
    filters?: Record<string, FacetCounts>;
    /** Counts if a value were applied INSTEAD of the current filters: the per-kind totals of the query. */
    totalFilters?: Record<string, FacetCounts>;
    /** The number of hits before any filter. */
    unfilteredResultCount?: number;
  }>;
}

/** How many hits load per page of results (each hit is one small fragment fetch). */
const PAGE_SIZE = 20;

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

/**
 * Result kind — classified purely from the result URL, so each hit can show a
 * type badge. Tool pages live under /tools/, Learn articles under /learn/;
 * everything else (home, about, training, ...) is a "page". This is URL
 * classification only — no Pagefind index or metadata changes — so it cannot
 * affect or break the existing relevance-ranked search; it only labels results.
 * (CIDR now has its own /tools/cidr page, so it badges as a tool; the home page
 * also embeds the CIDR widget, and that home-page hit simply reads as a page.)
 */
type ResultKind = "tool" | "article" | "guide" | "page";

/** The tools that run a third-party WebAssembly interpreter: their result rows wear the short
 *  fuchsia mark beside the kind badge, so a reader knows before opening that a 13 MB engine
 *  downloads on first use (PROPOSTA-wasm-tools, 2026-10-04). Derived from the registry's
 *  runtime flag, so a new WebAssembly tool is marked here without touching this file. */
const WASM_SLUGS: ReadonlySet<string> = new Set(tools.filter((t) => t.runtime === "wasm").map((t) => t.id));
/** Is this result URL a WebAssembly tool page? (/tools/<slug>/ with or without the trailing slash.) */
function isWasmTool(url: string): boolean {
  const m = /\/tools\/([a-z0-9-]+)\/?(?:[#?]|$)/.exec(url);
  return m ? WASM_SLUGS.has(m[1]) : false;
}
function classifyKind(url: string): ResultKind {
  // /learn/ and /tools/ are checked first so an article or tool whose slug
  // happens to contain "guide" is not misclassified as the User Guide.
  if (url.includes("/tools/")) return "tool";
  if (url.includes("/learn/")) return "article";
  if (/\/guide(\/|$|#|\?)/.test(url)) return "guide";
  return "page";
}
const KIND_LABEL_KEY: Record<ResultKind, "kindTool" | "kindArticle" | "kindGuide" | "kindPage"> = {
  tool: "kindTool",
  article: "kindArticle",
  guide: "kindGuide",
  page: "kindPage",
};

// The include/exclude filter pills, in display order. Each toggles whether hits
// of that kind appear. All are enabled by default, so search behaves exactly as
// before until the reader chooses to narrow it. The pill label keys are plural
// ("Tools", "Articles", "User Guide", "Pages") to read as category filters.
const FILTER_KINDS: readonly ResultKind[] = ["tool", "article", "guide", "page"];
const FILTER_LABEL_KEY: Record<
  ResultKind,
  "filterTools" | "filterArticles" | "filterGuide" | "filterPages"
> = {
  tool: "filterTools",
  article: "filterArticles",
  guide: "filterGuide",
  page: "filterPages",
};

/**
 * Locales whose pages are in the search index.
 *
 * Pagefind writes roughly one fragment file per indexed page. Indexing all
 * sixteen locales produced about 48,000 files - more than the site's pages -
 * and pushed the Cloudflare Workers asset manifest past its 100,000-file cap,
 * which stopped a deploy on 2026-08-31. The build now indexes only the two
 * day-one locales:
 *
 *     pagefind --site out --glob "{en,pt-BR}/**\/*.html"
 *
 * Every locale remains fully translated and browsable; search is what narrows.
 * Keep this list in step with the --glob in package.json.
 */
const SEARCH_LOCALES = ["en", "pt-BR"];

export default function Search() {
  const t = useTranslations("search");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindSubResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  // The facet counts per kind over the whole result set of the current query (null until the index answers; an
  // index built before the facet existed answers nothing, and the pills then count the loaded hits as before).
  const [facet, setFacet] = useState<Record<ResultKind, number> | null>(null);
  // The scope: one world, or null for everywhere; and the per-world counts of the current query.
  const [scope, setScope] = useState<WorldKey | null>(null);
  const [worldCounts, setWorldCounts] = useState<Record<WorldKey, number> | null>(null);
  // How many hits the current query and kind selection have in all, and the not-yet-loaded ones for "show more".
  const [total, setTotal] = useState(0);
  const pendingRef = useRef<PagefindResult[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  // Shortcut hint: Mac users expect ⌘, everyone else Ctrl. Default to Ctrl (the
  // larger audience and a safe SSR default); corrected on mount for Mac.
  const [isMac, setIsMac] = useState(false);

  const pagefindRef = useRef<PagefindApi | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Which result kinds are currently included. All enabled by default, so search
  // is unchanged until the reader narrows it. A Set keeps include/exclude O(1).
  const [enabled, setEnabled] = useState<Set<ResultKind>>(
    () => new Set<ResultKind>(FILTER_KINDS),
  );
  const toggleKind = useCallback((kind: ResultKind) => {
    setEnabled((prev) => {
      // From "everything", one click narrows to that kind alone (the common wish: "show me the tools");
      // from one kind alone, clicking it again widens back to everything. In between, a click toggles
      // membership, and the last remaining kind cannot be switched off (an empty panel with no way back).
      if (prev.size === FILTER_KINDS.length) return new Set<ResultKind>([kind]);
      if (prev.size === 1 && prev.has(kind)) return new Set<ResultKind>(FILTER_KINDS);
      const next = new Set(prev);
      if (next.has(kind)) {
        if (next.size > 1) next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  }, []);

  // Classify each hit by URL so we can badge its type. Order is left exactly as
  // Pagefind ranked it — most relevant first, regardless of type — because the
  // badge already conveys the type, and grouping would risk burying a more
  // relevant result beneath a less relevant one of a "preferred" type.
  const ordered = useMemo(
    () => results.map((r) => ({ ...r, kind: classifyKind(r.url) })),
    [results],
  );

  // Per-kind counts for the pills: the index's own facet counts over every hit of the query when the index
  // carries the kind facet; the loaded hits, classified by URL, on an index that does not (the pre-facet
  // behaviour, kept so an old index still shows something true about what is loaded).
  const counts = useMemo(() => {
    if (facet) return facet;
    const c: Record<ResultKind, number> = { tool: 0, article: 0, guide: 0, page: 0 };
    for (const r of ordered) c[r.kind] += 1;
    return c;
  }, [facet, ordered]);
  // What is shown: every loaded hit when the index narrowed the query itself; the URL-classified subset otherwise.
  const shown = useMemo(
    () => (facet ? ordered : ordered.filter((r) => enabled.has(r.kind))),
    [facet, ordered, enabled],
  );
  // The pills are shown once the query has any hit of any kind.
  const anyHit = facet ? Object.values(facet).some((n) => n > 0) || (worldCounts ? Object.values(worldCounts).some((n) => n > 0) : false) : ordered.length > 0;

  // Lazily load the Pagefind runtime the first time search opens.
  const loadPagefind = useCallback(async () => {
    if (pagefindRef.current) return pagefindRef.current;
    // Short-circuit on a locale the index does not cover: the runtime would
    // load and then answer nothing, which reads as a broken search box. Saying
    // so immediately is both faster and honest.
    const lang = document.documentElement.lang;
    if (lang && !SEARCH_LOCALES.includes(lang)) {
      setUnavailable(true);
      return null;
    }
    try {
      // The bundler must NOT resolve this at build time — it only exists in the
      // exported output. The /* webpackIgnore */ comment keeps it a runtime import.
      const pf = (await import(
        /* webpackIgnore: true */ "/pagefind/pagefind.js" as string
      )) as PagefindApi;
      // The facet index: without it a search response carries no counts. One file, loaded once.
      try { await pf.filters?.(); } catch { /* an index without filters: the pills count loaded hits instead */ }
      pagefindRef.current = pf;
      return pf;
    } catch {
      // No index (e.g. running `next dev` without an export). Degrade cleanly.
      setUnavailable(true);
      return null;
    }
  }, []);

  // Detect platform once on mount so the shortcut hint matches the OS. Both
  // Cmd+K and Ctrl+K already work (handler below checks metaKey OR ctrlKey);
  // only the displayed label needs to match.
  useEffect(() => {
    const p = navigator.platform || navigator.userAgent || "";
    setIsMac(/mac|iphone|ipad|ipod/i.test(p));
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

  // The site-wide shortcut layer (KeyboardShortcuts) opens this same search via
  // a custom event, so the `s` / `/` shortcuts reuse this one search UI rather
  // than a parallel overlay. Any component can dispatch ronutz:open-search.
  useEffect(() => {
    // The home page's omnibox (2026-10-05) dispatches the event with its text in detail.query, so the
    // reader's words arrive in this dialog already typed; any other dispatcher opens it empty as before.
    const onOpen = (e: Event) => {
      openSearch();
      const detail = (e as CustomEvent<{ query?: string; scope?: string }>).detail;
      const q = detail?.query;
      if (typeof q === "string" && q.trim()) setQuery(q);
      // A hub page's field presets its world; any other opener leaves the scope as the reader last set it.
      const sc = detail?.scope;
      if (typeof sc === "string" && (WORLD_KEYS as readonly string[]).includes(sc)) setScope(sc as WorldKey);
    };
    window.addEventListener("ronutz:open-search", onOpen);
    return () => window.removeEventListener("ronutz:open-search", onOpen);
  }, [openSearch]);

  /** Load the page data of the next PAGE_SIZE pending hits (title lifted out of meta; see PagefindRawResult). */
  const loadPage = useCallback(async (): Promise<PagefindSubResult[]> => {
    const batch = pendingRef.current.splice(0, PAGE_SIZE);
    const raw = await Promise.all(batch.map((r) => r.data()));
    return raw.map((d) => ({ url: d.url, excerpt: d.excerpt, title: d.meta?.title ?? "" }));
  }, []);

  // Run the search whenever the query or the kind selection changes (debounced lightly).
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setFacet(null);
      setTotal(0);
      pendingRef.current = [];
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
      // Pagefind is scoped to this page's language via <html lang> when the
      // runtime loaded, so a plain query returns correctly-localized results.
      //
      // The index covers the locales listed in SEARCH_LOCALES (see the note at
      // the top of this file). On any other locale the runtime loads but has no
      // fragments for that language, and the call below can reject rather than
      // return an empty set - which would leave the spinner running for ever.
      try {
        // Narrow by kind in the index itself when the reader switched a pill off; every kind on = no filter.
        const narrowed = enabled.size < FILTER_KINDS.length;
        const kindFilter = narrowed ? { kind: { any: [...enabled] } } : {};
        // 1. The query within the kind selection: its per-world counts feed the scope chips ("in addition to"
        //    the kind filter, or the plain counts when none is applied).
        const base = await pf.search(q, narrowed ? { filters: kindFilter } : undefined);
        const sysCounts = base.filters?.system;
        // 2. The query within the scope alone: its per-kind counts feed the pills (within the world, over every
        //    kind). Without a scope the pills count the whole query: totalFilters when a kind filter is on
        //    ("instead of" it), filters otherwise.
        const scoped = scope ? await pf.search(q, { filters: { system: scope } }) : null;
        const kindCounts = scoped ? scoped.filters?.kind : ((narrowed ? base.totalFilters?.kind : base.filters?.kind) ?? base.totalFilters?.kind);
        // 3. The list: both filters when both apply, else whichever response already has it.
        const search = scope && narrowed ? await pf.search(q, { filters: { ...kindFilter, system: scope } }) : (scoped ?? base);
        const f: Record<ResultKind, number> | null = kindCounts
          ? { tool: kindCounts.tool ?? 0, article: kindCounts.article ?? 0, guide: kindCounts.guide ?? 0, page: kindCounts.page ?? 0 }
          : null;
        const w: Record<WorldKey, number> | null = sysCounts
          ? { use: sysCounts.use ?? 0, understand: sysCounts.understand ?? 0, explore: sysCounts.explore ?? 0, work: sysCounts.work ?? 0, project: sysCounts.project ?? 0 }
          : null;
        pendingRef.current = [...search.results];
        const data = await loadPage();
        if (!cancelled) {
          setFacet(f);
          setWorldCounts(w);
          setTotal(search.results.length);
          setResults(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setFacet(null);
          setTotal(0);
          setUnavailable(true);
          setLoading(false);
        }
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, enabled, scope, loadPagefind, loadPage]);

  /** "Show more": append the next page of the same result set. */
  const showMore = useCallback(async () => {
    if (loadingMore || pendingRef.current.length === 0) return;
    setLoadingMore(true);
    try {
      const more = await loadPage();
      setResults((prev) => [...prev, ...more]);
    } finally {
      setLoadingMore(false);
    }
  }, [loadPage, loadingMore]);

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
        <kbd className="search-trigger-kbd mono">{isMac ? "⌘K" : "Ctrl K"}</kbd>
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

            {/* Type filters — include/exclude Tools, Articles, User Guide, and
                other Pages. Shown only once there are results to narrow, so an
                empty search stays uncluttered. */}
            {/* The scope: everywhere, or one of the five worlds, with the count of hits in each (wave 0). Shown
                only when the index carries the system facet. */}
            {!unavailable && anyHit && worldCounts && (
              <div className="search-scopes" role="group" aria-label={t("scopeLabel")}>
                <button type="button" className={`search-scope${scope === null ? " search-scope--active" : ""}`} aria-pressed={scope === null} onClick={() => setScope(null)}>
                  {t("scope.all")}
                </button>
                {WORLD_KEYS.map((k) => (
                  <button key={k} type="button" className={`search-scope search-scope--${k}${scope === k ? " search-scope--active" : ""}`} aria-pressed={scope === k} onClick={() => setScope(scope === k ? null : k)} disabled={worldCounts[k] === 0 && scope !== k}>
                    {t(`scope.${k}`)}
                    <span className="search-filter-count">{worldCounts[k]}</span>
                  </button>
                ))}
              </div>
            )}
            {!unavailable && anyHit && (
              <div className="search-filters" role="group" aria-label={t("filterLabel")}>
                {FILTER_KINDS.map((kind) => {
                  const active = enabled.has(kind);
                  // The pill carries its kind as a modifier class so it takes the
                  // SAME hue as the badge on every result of that kind (PRIME
                  // 2026-10-04: results must be told apart by colour, not only by
                  // the badge text). A small dot in that hue sits before the label
                  // so the colour reads even while the pill is switched off.
                  return (
                    <button
                      key={kind}
                      type="button"
                      className={`search-filter search-filter--${kind}${active ? " search-filter--active" : ""}`}
                      aria-pressed={active}
                      onClick={() => toggleKind(kind)}
                    >
                      <span className="search-kind-dot" aria-hidden="true" />
                      {t(FILTER_LABEL_KEY[kind])}
                      <span className="search-filter-count">{counts[kind]}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="search-results">
              {unavailable && <p className="search-message">{t("unavailable")}</p>}
              {!unavailable && loading && <p className="search-message">{t("searching")}</p>}
              {!unavailable && !loading && query.trim() && !anyHit && (
                <p className="search-message">{t("noResults", { query: query.trim() })}</p>
              )}
              {!unavailable && !loading && anyHit && shown.length === 0 && (
                <p className="search-message">{t("filterEmpty")}</p>
              )}
              {!unavailable && shown.length > 0 && (
                <ul className="search-result-list">
                  {shown.map((r, i) => (
                    <li key={`${r.url}-${i}`}>
                      {/* The result row carries its kind too (search-result--tool,
                          --article, --guide, --page) so the whole row, not only
                          the badge, can be coloured: the stylesheet paints a rail
                          down its left edge in the kind's hue, and the badge is a
                          filled pill in the same hue. Kind is still URL-derived
                          (classifyKind); nothing about ranking changes. */}
                      <a className={`search-result search-result--${r.kind}`} href={r.url}>
                        <span className="search-result-head">
                          <span
                            className={`search-result-kind search-result-kind--${r.kind}`}
                          >
                            {t(KIND_LABEL_KEY[r.kind])}
                          </span>
                          {r.kind === "tool" && isWasmTool(r.url) && (
                            <span className="search-result-wasm" title={t("wasmTitle")}>{t("wasm")}</span>
                          )}
                          <span className="search-result-title">{r.title}</span>
                        </span>
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
              {/* The rest of the ranked set, a page at a time; the count line says how far the list goes. */}
              {!unavailable && shown.length > 0 && total > results.length && (
                <div className="search-more">
                  <span className="search-more-count mono">{t("resultCount", { shown: results.length, count: total })}</span>
                  <button type="button" className="search-more-button" onClick={() => void showMore()} disabled={loadingMore}>
                    {t("showMore", { count: Math.min(PAGE_SIZE, total - results.length) })}
                  </button>
                </div>
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
