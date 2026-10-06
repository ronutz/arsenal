"use client";

// ============================================================================
// src/components/Testimonials.tsx
// ----------------------------------------------------------------------------
// THE TESTIMONIALS DISPLAY — verbatim reviews, full metadata, filtering, and an
// optional build-time English translation with the original always reachable.
//
// VERBATIM INTEGRITY is the governing rule. The original text is the source of
// truth and is ALWAYS one tap away. When the visitor turns on "translate to
// English", non-English cards show the translation WITH a clear disclaimer that
// it is machine-generated and may not reflect the original, plus an inline
// "show original" expander that reveals the verbatim text beneath it.
//
// All text is rendered as plain text through React (auto-escaped), never HTML.
// Translation is purely a display toggle over pre-stored data; nothing is sent
// anywhere (no runtime translation calls), consistent with the local-first site.
// ============================================================================

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  TESTIMONIALS,
  HAS_TRANSLATABLE,
  type Testimonial,
} from "@/content/testimonials/data";
import { TESTIMONIAL_KINDS, kindsOf, type TestimonialKind } from "@/content/testimonials/kinds";

function langTag(lang: string | null): string {
  if (!lang) return "";
  if (lang.startsWith("EN")) return "EN";
  if (lang.startsWith("PT/")) return "PT/EN";
  if (lang.startsWith("PT")) return "PT";
  return lang;
}

function sourceLabel(source: string): string {
  if (source.startsWith("Google")) return "Google";
  if (source.startsWith("Verified")) return "Red Education";
  if (source.startsWith("LinkedIn")) return "LinkedIn";
  return source;
}

/** The message key for a kind's label: "training" -> "kindTraining". */
function kindKey(kind: TestimonialKind): string {
  return "kind" + kind.charAt(0).toUpperCase() + kind.slice(1);
}

/** The kind filter value in the URL, if any, so /endorsements?kind=advisory opens filtered. */
function kindFromLocation(): TestimonialKind | "all" {
  // Server render and the first client render both start at "all"; the effect
  // below reads the URL afterwards, so the markup never differs between them.
  if (typeof window === "undefined") return "all";
  const raw = new URLSearchParams(window.location.search).get("kind");
  return raw && (TESTIMONIAL_KINDS as readonly string[]).includes(raw) ? (raw as TestimonialKind) : "all";
}

export default function Testimonials() {
  const t = useTranslations("testimonials");

  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [langFilter, setLangFilter] = useState<string>("all");
  /* KIND OF WORK (PRIME 2026-10-03, from the advisory review). The record is
     mostly about teaching, and a reader weighing an advisory engagement needs
     the design, selection, procurement and leadership entries without reading
     all eighty-nine. The kinds come from kinds.ts, never from the verbatim data.
     A deep link (?kind=advisory) from the advisory page preselects a kind; it
     is read in an effect so that the static HTML and the first client render
     agree. */
  const [kindFilter, setKindFilter] = useState<TestimonialKind | "all">("all");
  useEffect(() => {
    setKindFilter(kindFromLocation());
  }, []);
  /* Global translate-to-English toggle (the primary translation control).
     ON BY DEFAULT (PRIME 2026-08-14).

     The endorsements are multilingual - Portuguese, Spanish and English - and
     an arriving reader gets whatever language each reviewer happened to write
     in. Defaulting to off made the page hardest to read for the people least
     able to fix it: somebody who cannot read Portuguese does not necessarily
     know that a control exists to render it, or that the untranslated block
     they just skipped was about them.

     THE ORIGINAL IS NEVER DISCARDED. Each card keeps its own show-original
     control, and entries whose source is already the language shown are
     untouched - so the verbatim rule is intact and the default simply decides
     which side of it a reader meets first. */
  const [translate, setTranslate] = useState<boolean>(true);

  const sources = useMemo(() => {
    const set = new Set(TESTIMONIALS.map((x) => sourceLabel(x.source)));
    return ["all", ...Array.from(set)];
  }, []);

  // The translated label of every kind, built once and handed to each card.
  const kindLabels = useMemo(() => {
    const out = {} as Record<TestimonialKind, string>;
    for (const k of TESTIMONIAL_KINDS) out[k] = t(kindKey(k));
    return out;
  }, [t]);

  const filtered = useMemo(() => {
    return TESTIMONIALS.filter((x) => {
      const okSource = sourceFilter === "all" || sourceLabel(x.source) === sourceFilter;
      const okLang = langFilter === "all" || langTag(x.lang) === langFilter;
      // One card can carry several kinds; it matches when any of them is selected.
      const okKind = kindFilter === "all" || kindsOf(x.id).includes(kindFilter);
      return okSource && okLang && okKind;
    });
  }, [sourceFilter, langFilter, kindFilter]);

  return (
    <div className="tm-root">
      {/* Filters + translate toggle */}
      <div className="tm-filters" role="group" aria-label={t("filterLabel")}>
        {/* Kind of work FIRST (G5, 2026-10-05): the type of work is the primary organisation of the
            record; source and language are the secondary filters below. Six chips plus "all"; the hint
            says a card can carry more than one kind, so the counts across chips exceed the total. */}
        <div className="tm-filter-group">
          <span className="tm-filter-label">{t("kindFilter")}</span>
          <div className="tm-filter-buttons">
            {(["all", ...TESTIMONIAL_KINDS] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={"tm-chip" + (kindFilter === k ? " tm-chip--active" : "")}
                onClick={() => setKindFilter(k)}
              >
                {k === "all" ? t("all") : t(kindKey(k))}
              </button>
            ))}
          </div>
          <p className="tm-kind-hint">{t("kindHint")}</p>
        </div>

        <div className="tm-filter-group">
          <span className="tm-filter-label">{t("sourceFilter")}</span>
          <div className="tm-filter-buttons">
            {sources.map((s) => (
              <button
                key={s}
                type="button"
                className={"tm-chip" + (sourceFilter === s ? " tm-chip--active" : "")}
                onClick={() => setSourceFilter(s)}
              >
                {s === "all" ? t("all") : s}
              </button>
            ))}
          </div>
        </div>

        <div className="tm-filter-group">
          <span className="tm-filter-label">{t("languageFilter")}</span>
          <div className="tm-filter-buttons">
            {["all", "EN", "PT"].map((l) => (
              <button
                key={l}
                type="button"
                className={"tm-chip" + (langFilter === l ? " tm-chip--active" : "")}
                onClick={() => setLangFilter(l)}
              >
                {l === "all" ? t("all") : l}
              </button>
            ))}
          </div>
        </div>


        {/* Translate-to-English toggle, shown only if there is anything to translate */}
        {HAS_TRANSLATABLE && (
          <div className="tm-filter-group">
            <span className="tm-filter-label">{t("translateLabel")}</span>
            <button
              type="button"
              className={"tm-toggle" + (translate ? " tm-toggle--on" : "")}
              role="switch"
              aria-checked={translate}
              onClick={() => setTranslate((v) => !v)}
            >
              <span className="tm-toggle-track">
                <span className="tm-toggle-thumb" />
              </span>
              <span className="tm-toggle-text">
                {translate ? t("translateOn") : t("translateOff")}
              </span>
            </button>
          </div>
        )}

        <p className="tm-count">{t("showing", { count: filtered.length, total: TESTIMONIALS.length })}</p>
      </div>

      <ul className="tm-list">
        {/* repliedLabel is NOT brand-wrapped: it is typed `string` and passed
            down to TestimonialCard, so an element cannot go there. Styling it
            would mean widening that prop to ReactNode and threading it through
            a shared component for one word of colour. Left plain on purpose. */}
        {filtered.map((x) => (
          <TestimonialCard
            key={x.id}
            t={x}
            translate={translate}
            repliedLabel={t("reply")}
            kindLabels={kindLabels}
            disclaimer={t("machineDisclaimer")}
            showOriginalLabel={t("showOriginal")}
            hideOriginalLabel={t("hideOriginal")}
          />
        ))}
      </ul>
    </div>
  );
}

function TestimonialCard({
  t,
  translate,
  repliedLabel,
  kindLabels,
  disclaimer,
  showOriginalLabel,
  hideOriginalLabel,
}: {
  t: Testimonial;
  translate: boolean;
  repliedLabel: string;
  /** Translated label per kind, for the badges in the footer. */
  kindLabels: Record<TestimonialKind, string>;
  disclaimer: string;
  showOriginalLabel: string;
  hideOriginalLabel: string;
}) {
  // Per-card state for revealing the verbatim original under a translation.
  const [showOriginal, setShowOriginal] = useState(false);

  const initials = t.author
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Decide what to render. We only swap to the translation when:
  //   - the toggle is ON, and
  //   - this entry actually HAS a machine translation (textEnglish present).
  // Source-translated / bilingual / original entries always show `text`
  // (their displayed text is already English or already contains it).
  const isTranslating = translate && t.translationStatus === "machine" && !!t.textEnglish;
  const displayedText = isTranslating ? (t.textEnglish as string) : t.text;

  return (
    <li className="tm-card">
      <div className="tm-card-head">
        <div className="tm-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="tm-card-id">
          <span className="tm-author">{t.author}</span>
          {t.title && <span className="tm-title">{t.title}</span>}
        </div>
      </div>

      {/* The testimonial body — translation or verbatim original */}
      <blockquote className="tm-text">{displayedText}</blockquote>

      {/* When showing a translation: disclaimer + reveal-original control */}
      {isTranslating && (
        <div className="tm-translation-note">
          <p className="tm-disclaimer">
            <span className="tm-disclaimer-icon" aria-hidden="true">
              &#9888;
            </span>
            {disclaimer}
          </p>
          <button
            type="button"
            className="tm-show-original"
            aria-expanded={showOriginal}
            onClick={() => setShowOriginal((v) => !v)}
          >
            {showOriginal ? hideOriginalLabel : showOriginalLabel}
            <span className={"tm-chevron" + (showOriginal ? " tm-chevron--up" : "")} aria-hidden="true">
              &#8964;
            </span>
          </button>
          {showOriginal && (
            <blockquote className="tm-original">
              {t.text}
              {t.lang && <span className="tm-original-lang mono"> &middot; {langTag(t.lang)}</span>}
            </blockquote>
          )}
        </div>
      )}

      {/* Owner response (supporting context, not the reviewer's words) */}
      {t.ownerResponse && (
        <div className="tm-reply">
          <span className="tm-reply-label">{repliedLabel}</span>
          <p className="tm-reply-text">{t.ownerResponse}</p>
        </div>
      )}

      {/* Metadata footer */}
      <div className="tm-meta">
        <span className={"tm-badge tm-badge--" + sourceLabel(t.source).toLowerCase().replace(/\s+/g, "")}>
          {sourceLabel(t.source)}
        </span>
        {/* The kinds of work this entry describes (kinds.ts), after the source. */}
        {kindsOf(t.id).map((k) => (
          <span key={k} className={"tm-kind tm-kind--" + k}>
            {kindLabels[k]}
          </span>
        ))}
        {t.rating && <span className="tm-rating">{t.rating}</span>}
        {t.lang && <span className="tm-lang mono">{langTag(t.lang)}</span>}
        {t.date && <span className="tm-date">{t.date}</span>}
        {t.relationship && <span className="tm-rel">{t.relationship}</span>}
      </div>
    </li>
  );
}
